from rest_framework import serializers
from .models import Mesa, Comanda, ItemComanda, Pagamento
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
