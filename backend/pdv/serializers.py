from rest_framework import serializers
from .models import Mesa, Comanda, ItemComanda, Pagamento, NotaFiscal
from estoque.models import Produto
from estoque.models import Produto

class MesaSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    hora_abertura = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    tem_pedido_pronto = serializers.SerializerMethodField()
    
    class Meta:
        model = Mesa
        fields = '__all__'

    def get_tem_pedido_pronto(self, obj):
        # Verifica se alguma comanda aberta dessa mesa possui itens com status 'Pronto'
        comanda = Comanda.objects.filter(mesa=obj, status='Aberta').first()
        if comanda:
            return comanda.itens.filter(status='Pronto').exists()
        return False

class ProdutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Produto
        fields = '__all__'

class ItemComandaSerializer(serializers.ModelSerializer):
    produto_nome = serializers.CharField(source='produto.nome', read_only=True)
    produto_setor = serializers.CharField(source='produto.setor', read_only=True)
    hora_pedido = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    mesa_id = serializers.IntegerField(source='comanda.mesa.id', read_only=True)
    
    class Meta:
        model = ItemComanda
        fields = '__all__'
        
class PagamentoSerializer(serializers.ModelSerializer):
    mesa_id = serializers.IntegerField(source='comanda.mesa.id', read_only=True)
    data_hora = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = Pagamento
        fields = '__all__'

class ComandaSerializer(serializers.ModelSerializer):
    itens = ItemComandaSerializer(many=True, read_only=True)
    pagamentos = PagamentoSerializer(many=True, read_only=True)
    data_abertura = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    data_fechamento = serializers.DateTimeField(format='%d/%m/%Y %H:%M', read_only=True)
    
    class Meta:
        model = Comanda
        fields = '__all__'

class NotaFiscalSerializer(serializers.ModelSerializer):
    mesa_id = serializers.IntegerField(source='comanda.mesa.id', read_only=True, allow_null=True)
    mesa_numero = serializers.IntegerField(source='comanda.mesa.numero', read_only=True, allow_null=True)
    valor_total = serializers.SerializerMethodField()
    data = serializers.DateTimeField(source='criado_em', read_only=True)
    
    class Meta:
        model = NotaFiscal
        fields = ['id', 'comanda', 'status', 'chave_acesso', 'caminho_xml', 'caminho_pdf', 'mensagem_sefaz', 'mesa_id', 'mesa_numero', 'valor_total', 'data']

    def get_valor_total(self, obj):
        total = sum((item.quantidade * item.preco_unitario) for item in obj.comanda.itens.all())
        return float(total - obj.comanda.desconto + obj.comanda.taxa_servico)
