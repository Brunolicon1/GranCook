from django.db import models
import uuid
from estoque.models import Produto

class Mesa(models.Model):
    STATUS_CHOICES = [
        ('Livre', 'Livre'),
        ('Ocupada', 'Ocupada'),
        ('Aguardando Pagamento', 'Aguardando Pagamento'),
    ]
    numero = models.IntegerField(unique=True)
    capacidade = models.IntegerField(default=4)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Livre')
    ordem = models.IntegerField(default=0, help_text="Ordem de exibição no mapa")
    
    # Campos baseados no frontend State
    grupo_id = models.CharField(max_length=50, blank=True, null=True, help_text="ID para identificar mesas agrupadas")
    hora_abertura = models.DateTimeField(blank=True, null=True)
    
    def __str__(self):
        return f"Mesa {self.numero} ({self.get_status_display()})"

class Comanda(models.Model):
    STATUS_CHOICES = [
        ('Aberta', 'Aberta'),
        ('Fechada', 'Fechada'),
        ('Cancelada', 'Cancelada'),
    ]
    mesa = models.ForeignKey(Mesa, on_delete=models.SET_NULL, null=True, blank=True)
    nome_cliente = models.CharField(max_length=100, blank=True, null=True)
    data_abertura = models.DateTimeField(auto_now_add=True)
    data_fechamento = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Aberta')
    
    # Valores financeiros consolidados (gravados no fechamento)
    taxa_servico = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    desconto = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    def __str__(self):
        return f"Comanda #{self.id} - {self.mesa if self.mesa else 'Avulsa'}"

class ItemComanda(models.Model):
    STATUS_CHOICES = [
        ('Pendente', 'Pendente (Novo)'),
        ('Em Preparo', 'Em Preparo'),
        ('Pronto', 'Pronto (Aguardando Retirada)'),
        ('Entregue', 'Entregue'),
        ('Cancelada', 'Cancelada'),
    ]
    comanda = models.ForeignKey(Comanda, on_delete=models.CASCADE, related_name='itens')
    produto = models.ForeignKey(Produto, on_delete=models.PROTECT)
    quantidade = models.IntegerField(default=1)
    observacoes = models.TextField(blank=True, null=True, help_text="Ex: Sem cebola, ponto da carne")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='Pendente')
    preco_unitario = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hora_pedido = models.DateTimeField(auto_now_add=True)
    entregar_junto_com_prato = models.BooleanField(default=False)
    
    def __str__(self):
        return f"{self.quantidade}x {self.produto.nome} (Comanda {self.comanda.id})"

class Pagamento(models.Model):
    FORMAS_PAGAMENTO = [
        ('DINHEIRO', 'Dinheiro'),
        ('PIX', 'PIX'),
        ('CREDITO', 'Cartão de Crédito'),
        ('DEBITO', 'Cartão de Débito'),
        ('OUTRO', 'Outro'),
    ]
    comanda = models.ForeignKey(Comanda, on_delete=models.CASCADE, related_name='pagamentos')
    valor = models.DecimalField(max_digits=10, decimal_places=2)
    valor_gorjeta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    forma_pagamento = models.CharField(max_length=20, choices=FORMAS_PAGAMENTO)
    data_hora = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Pagamento R${self.valor} ({self.get_forma_pagamento_display()}) - Comanda {self.comanda.id}"

class NotaFiscal(models.Model):
    STATUS_CHOICES = [
        ('pendente', 'Pendente de Emissão'),
        ('processando', 'Processando na Sefaz'),
        ('emitida', 'Autorizada (Emitida)'),
        ('erro', 'Rejeitada/Erro Sefaz'),
        ('cancelada', 'Cancelada'),
    ]
    comanda = models.OneToOneField(Comanda, on_delete=models.CASCADE, related_name='nota_fiscal')
    referencia = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, help_text="Referência única para a API da Focus")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendente')
    chave_acesso = models.CharField(max_length=44, blank=True, null=True, help_text="Chave de 44 dígitos da Sefaz")
    numero = models.CharField(max_length=20, blank=True, null=True)
    serie = models.CharField(max_length=5, blank=True, null=True)
    caminho_xml = models.URLField(max_length=500, blank=True, null=True)
    caminho_pdf = models.URLField(max_length=500, blank=True, null=True)
    mensagem_sefaz = models.TextField(blank=True, null=True)
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"NFC-e da Comanda #{self.comanda.id} - {self.get_status_display()}"
