from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Count, F
from .models import Mesa, Comanda, ItemComanda, Pagamento, NotaFiscal
from .serializers import MesaSerializer, ComandaSerializer, ItemComandaSerializer, PagamentoSerializer, ProdutoSerializer, NotaFiscalSerializer
from .services.focus_nfe import emitir_nota_fiscal
from estoque.models import Produto

class MesaViewSet(viewsets.ModelViewSet):
    queryset = Mesa.objects.all().order_by('ordem', 'numero')
    serializer_class = MesaSerializer

    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'Livre':
            instance.hora_abertura = None
            instance.grupo_id = None
            instance.save(update_fields=['hora_abertura', 'grupo_id'])

    @action(detail=False, methods=['post'])
    def transferir(self, request):
        origem_id = request.data.get('origem_id')
        destino_id = request.data.get('destino_id')
        
        try:
            mesa_origem = Mesa.objects.get(id=origem_id)
            mesa_destino = Mesa.objects.get(id=destino_id)
            
            # Buscar comandas ativas
            comanda_origem = Comanda.objects.filter(mesa=mesa_origem, status='Aberta').first()
            comanda_destino = Comanda.objects.filter(mesa=mesa_destino, status='Aberta').first()
            
            if not comanda_origem:
                return Response({'error': 'Mesa de origem não possui comanda ativa'}, status=status.HTTP_400_BAD_REQUEST)
                
            if not comanda_destino:
                # Transfere a comanda para a mesa vazia
                comanda_origem.mesa = mesa_destino
                comanda_origem.save()
                
                # Atualiza status das mesas
                mesa_destino.status = mesa_origem.status
                mesa_destino.hora_abertura = mesa_origem.hora_abertura
                mesa_destino.grupo_id = mesa_origem.grupo_id
                mesa_destino.save()
                
                mesa_origem.status = 'Livre'
                mesa_origem.hora_abertura = None
                mesa_origem.grupo_id = None
                mesa_origem.save()
                
            else:
                # Unir comandas: Transferir todos os itens e pagamentos da origem para o destino
                ItemComanda.objects.filter(comanda=comanda_origem).update(comanda=comanda_destino)
                Pagamento.objects.filter(comanda=comanda_origem).update(comanda=comanda_destino)
                
                # Somar taxas e descontos (caso existam)
                comanda_destino.taxa_servico += comanda_origem.taxa_servico
                comanda_destino.desconto += comanda_origem.desconto
                comanda_destino.save()
                
                # Fechar a comanda original (pois foi migrada)
                comanda_origem.status = 'Cancelada'
                comanda_origem.data_fechamento = timezone.now()
                comanda_origem.save()
                
                # Libera a mesa origem
                mesa_origem.status = 'Livre'
                mesa_origem.hora_abertura = None
                mesa_origem.grupo_id = None
                mesa_origem.save()

            return Response({'status': 'Transferência realizada com sucesso'})
        except Mesa.DoesNotExist:
            return Response({'error': 'Mesa não encontrada'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['post'])
    def reordenar(self, request):
        mesas_ids = request.data.get('mesas_ids', [])
        
        if not mesas_ids:
            return Response({'error': 'Lista de IDs não fornecida'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            for index, mesa_id in enumerate(mesas_ids):
                # Usar update é mais rápido que carregar a instancia e salvar
                Mesa.objects.filter(id=mesa_id).update(ordem=index)
            return Response({'status': 'Mesas reordenadas com sucesso'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def agrupar(self, request):
        mesas_ids = request.data.get('mesas_ids', [])
        novo_grupo_id = request.data.get('grupo_id')
        
        if not novo_grupo_id:
            return Response({'error': 'ID do grupo não fornecido'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Desvincular mesas que saíram do grupo (têm o grupo_id mas não estão no array)
        mesas_removidas = Mesa.objects.filter(grupo_id=novo_grupo_id).exclude(id__in=mesas_ids)
        for mesa in mesas_removidas:
            mesa.grupo_id = None
            # Verificar se a mesa que saiu possui comanda própria ativa
            tem_comanda = Comanda.objects.filter(mesa=mesa, status='Aberta').exists()
            if not tem_comanda:
                mesa.status = 'Livre'
                mesa.hora_abertura = None
            mesa.save()

        # Agrupar e vincular as mesas do array
        if mesas_ids:
            mesas = Mesa.objects.filter(id__in=mesas_ids)
            grupo_ocupado = Comanda.objects.filter(mesa__in=mesas, status='Aberta').exists()
            hora_abertura = timezone.now() if grupo_ocupado else None
            
            if grupo_ocupado:
                comanda_antiga = Comanda.objects.filter(mesa__in=mesas, status='Aberta').order_by('data_abertura').first()
                if comanda_antiga:
                    hora_abertura = comanda_antiga.data_abertura

            for mesa in mesas:
                mesa.grupo_id = novo_grupo_id
                if grupo_ocupado:
                    mesa.status = 'Ocupada'
                    mesa.hora_abertura = mesa.hora_abertura or hora_abertura
                else:
                    mesa.status = 'Livre'
                    mesa.hora_abertura = None
                mesa.save()
            
        return Response({'status': 'Agrupamento atualizado com sucesso'})


from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class ComandaViewSet(viewsets.ModelViewSet):
    queryset = Comanda.objects.all()
    serializer_class = ComandaSerializer
    pagination_class = StandardResultsSetPagination
    
    def perform_update(self, serializer):
        instance = serializer.save()
        if instance.status == 'Fechada' and not instance.data_fechamento:
            instance.data_fechamento = timezone.now()
            instance.save()
    
    @action(detail=False, methods=['get'])
    def historico(self, request):
        comandas = Comanda.objects.filter(status__in=['Fechada', 'Cancelada']).order_by('-data_fechamento', '-id')
        page = self.paginate_queryset(comandas)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
            
        serializer = self.get_serializer(comandas, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def ativas(self, request):
        comandas = Comanda.objects.filter(status='Aberta')
        serializer = self.get_serializer(comandas, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def adicionar_itens(self, request, pk=None):
        comanda = self.get_object()
        itens_data = request.data.get('itens', [])
        
        novos_itens = []
        for item in itens_data:
            try:
                produto = Produto.objects.get(id=item.get('produto_id'))
                quantidade_solicitada = int(item.get('quantidade', 1))
                
                # Criar registros unitários (1 por 1) para facilitar cancelamento e auditoria
                for _ in range(quantidade_solicitada):
                    novo_item = ItemComanda.objects.create(
                        comanda=comanda,
                        produto=produto,
                        quantidade=1,
                        preco_unitario=produto.preco_venda,
                        observacoes=item.get('observacoes', ''),
                        entregar_junto_com_prato=item.get('entregar_junto_com_prato', False),
                        status='Em Preparo'
                    )
                    novos_itens.append(novo_item)
            except Produto.DoesNotExist:
                continue
                
        # Atualizar status da mesa (e do grupo se aplicável) se estiver livre
        if comanda.mesa and comanda.mesa.status == 'Livre':
            now = timezone.now()
            if comanda.mesa.grupo_id:
                Mesa.objects.filter(grupo_id=comanda.mesa.grupo_id).update(
                    status='Ocupada',
                    hora_abertura=now
                )
            else:
                comanda.mesa.status = 'Ocupada'
                comanda.mesa.hora_abertura = now
                comanda.mesa.save()
        serializer = ItemComandaSerializer(novos_itens, many=True)
        return Response(serializer.data)

class ItemComandaViewSet(viewsets.ModelViewSet):
    queryset = ItemComanda.objects.all()
    serializer_class = ItemComandaSerializer

    @action(detail=False, methods=['post'])
    def cancelar_massa(self, request):
        ids = request.data.get('ids', [])
        if not ids:
            return Response({'error': 'Nenhum ID fornecido.'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Pegar as comandas afetadas antes de atualizar
            comandas_afetadas = set(ItemComanda.objects.filter(id__in=ids).values_list('comanda_id', flat=True))
            
            ItemComanda.objects.filter(id__in=ids).update(status='Cancelada')
            
            # Verificar cada comanda afetada
            for comanda_id in comandas_afetadas:
                comanda = Comanda.objects.get(id=comanda_id)
                # Se não sobrar nenhum item que não seja 'Cancelada'
                if not comanda.itens.exclude(status='Cancelada').exists() and comanda.status == 'Aberta':
                    comanda.status = 'Cancelada'
                    comanda.data_fechamento = timezone.now()
                    comanda.save()
                    
                    if comanda.mesa:
                        comanda.mesa.status = 'Livre'
                        comanda.mesa.hora_abertura = None
                        comanda.mesa.save()
                        
            return Response({'status': 'Itens cancelados com sucesso.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PagamentoViewSet(viewsets.ModelViewSet):
    queryset = Pagamento.objects.all()
    serializer_class = PagamentoSerializer

class ProdutoViewSet(viewsets.ModelViewSet):
    queryset = Produto.objects.all()
    serializer_class = ProdutoSerializer

    def get_queryset(self):
        queryset = Produto.objects.all().order_by('setor', 'nome')
        ativo = self.request.query_params.get('ativo')
        if ativo is not None:
            is_ativo = ativo.lower() in ['true', '1', 't', 'y', 'yes']
            queryset = queryset.filter(ativo=is_ativo)
        return queryset

from django.db.models import Q

class KDSViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def tickets(self, request):
        setor = request.query_params.get('setor', 'Cozinha')
        # Buscar itens pendentes ou em preparo do setor solicitado
        if setor.lower() == 'cozinha':
            itens = ItemComanda.objects.filter(
                Q(produto__setor__iexact=setor) | Q(entregar_junto_com_prato=True),
                status__in=['Pendente', 'Em Preparo']
            ).select_related('comanda', 'comanda__mesa', 'produto').order_by('hora_pedido')
        else:
            itens = ItemComanda.objects.filter(
                produto__setor__iexact=setor,
                entregar_junto_com_prato=False,
                status__in=['Pendente', 'Em Preparo']
            ).select_related('comanda', 'comanda__mesa', 'produto').order_by('hora_pedido')
        
        serializer = ItemComandaSerializer(itens, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def atualizar_ticket(self, request):
        ids = request.data.get('ids', [])
        novo_status = request.data.get('status')
        
        if not ids or not novo_status:
            return Response({'error': 'Parâmetros inválidos'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            ItemComanda.objects.filter(id__in=ids).update(status=novo_status)
            return Response({'status': 'Atualizado com sucesso'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DashboardViewSet(viewsets.ViewSet):
    @action(detail=False, methods=['get'])
    def resumo(self, request):
        agora = timezone.now()
        data_inicio_str = request.query_params.get('data_inicio')
        data_fim_str = request.query_params.get('data_fim')
        
        data_inicio = None
        data_fim = None
        
        if data_inicio_str and data_fim_str:
            try:
                di = timezone.datetime.strptime(data_inicio_str, '%Y-%m-%d').date()
                df = timezone.datetime.strptime(data_fim_str, '%Y-%m-%d').date()
                
                data_inicio = timezone.make_aware(timezone.datetime.combine(di, timezone.datetime.min.time())).replace(hour=7)
                data_fim = timezone.make_aware(timezone.datetime.combine(df, timezone.datetime.min.time())).replace(hour=7) + timezone.timedelta(days=1)
            except ValueError:
                pass
                
        if not data_inicio or not data_fim:
            if agora.hour < 7:
                data_inicio = (agora - timezone.timedelta(days=1)).replace(hour=7, minute=0, second=0, microsecond=0)
            else:
                data_inicio = agora.replace(hour=7, minute=0, second=0, microsecond=0)
            data_fim = data_inicio + timezone.timedelta(days=1)
            
        # Pagamentos
        pagamentos_base = Pagamento.objects.all()
        if data_inicio and data_fim:
            pagamentos_base = pagamentos_base.filter(data_hora__gte=data_inicio, data_hora__lt=data_fim)
            
        faturamento_total = pagamentos_base.aggregate(total=Sum('valor'))['total'] or 0
        total_gorjetas = pagamentos_base.aggregate(total=Sum('valor_gorjeta'))['total'] or 0
        
        # Pagamentos por método
        pagamentos_por_metodo = pagamentos_base.values('forma_pagamento').annotate(
            total=Sum('valor') + Sum('valor_gorjeta')
        ).order_by('-total')
        
        # Top 5 produtos (itens de comandas fechadas)
        produtos_base = ItemComanda.objects.filter(status__in=['Pronto', 'Entregue'])
        if data_inicio and data_fim:
            produtos_base = produtos_base.filter(comanda__pagamentos__data_hora__gte=data_inicio, comanda__pagamentos__data_hora__lt=data_fim)
            
        top_produtos = produtos_base.values('produto__nome').annotate(
            quantidade_total=Sum('quantidade')
        ).order_by('-quantidade_total')[:5]
        
        # Itens Cancelados
        cancelados_base = ItemComanda.objects.filter(status='Cancelada')
        if data_inicio and data_fim:
            cancelados_base = cancelados_base.filter(hora_pedido__gte=data_inicio, hora_pedido__lt=data_fim)
            
        itens_cancelados = cancelados_base.values('produto__nome', 'quantidade', 'hora_pedido', 'comanda__mesa__numero').order_by('-hora_pedido')[:10]
        
        return Response({
            'faturamento_total': faturamento_total,
            'total_gorjetas': total_gorjetas,
            'pagamentos_por_metodo': pagamentos_por_metodo,
            'top_produtos': top_produtos,
            'itens_cancelados': itens_cancelados
        })

class NotaFiscalViewSet(viewsets.ModelViewSet):
    queryset = NotaFiscal.objects.all().order_by('-criado_em')
    serializer_class = NotaFiscalSerializer

    @action(detail=False, methods=['post'])
    def emitir(self, request):
        comanda_id = request.data.get('comanda_id')
        if not comanda_id:
            return Response({'error': 'ID da comanda não fornecido'}, status=status.HTTP_400_BAD_REQUEST)
            
        resultado = emitir_nota_fiscal(comanda_id)
        if resultado.get('sucesso'):
            return Response(resultado, status=status.HTTP_200_OK)
        else:
            return Response(resultado, status=status.HTTP_400_BAD_REQUEST)
