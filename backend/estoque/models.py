from django.db import models

class Insumo(models.Model):
    UNIDADES = [
        ('UN', 'Unidade'), 
        ('KG', 'Quilo'), 
        ('L', 'Litro'), 
        ('G', 'Grama'), 
        ('ML', 'Mililitro')
    ]
    nome = models.CharField(max_length=100)
    unidade_medida = models.CharField(max_length=2, choices=UNIDADES, default='UN')
    estoque_atual = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    estoque_minimo = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    
    def __str__(self):
        return f"{self.nome} ({self.unidade_medida})"

class Produto(models.Model):
    SETOR_CHOICES = [
        ('Cozinha', 'Cozinha'),
        ('Copa', 'Copa'),
        ('Bar', 'Bar'),
    ]
    nome = models.CharField(max_length=100)
    descricao = models.TextField(blank=True, null=True)
    preco_venda = models.DecimalField(max_digits=10, decimal_places=2)
    ativo = models.BooleanField(default=True)
    setor = models.CharField(max_length=20, choices=SETOR_CHOICES, default='Cozinha')
    
    def __str__(self):
        return self.nome

class FichaTecnica(models.Model):
    produto = models.ForeignKey(Produto, on_delete=models.CASCADE, related_name='ficha_tecnica')
    insumo = models.ForeignKey(Insumo, on_delete=models.CASCADE)
    quantidade_usada = models.DecimalField(max_digits=10, decimal_places=3)
    
    def __str__(self):
        return f"{self.produto.nome} usa {self.quantidade_usada} {self.insumo.unidade_medida} de {self.insumo.nome}"
