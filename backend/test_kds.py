import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from pdv.models import Mesa, Comanda, ItemComanda
from estoque.models import Produto

# Pega mesa 1
mesa = Mesa.objects.get(numero=1)
mesa.status = 'Ocupada'
mesa.save()

# Cria comanda
comanda, _ = Comanda.objects.get_or_create(mesa=mesa, status='Aberta')

# Pega um produto da cozinha
produto = Produto.objects.filter(setor='Cozinha').first()

observacoes = [
    "Sem cebola", "Ao ponto", "Sem alface", "Maionese extra", 
    "Sem picles", "Bem passado", "Pão brioche", "Bacon extra", 
    "Sem tomate", "Ketchup separado"
]

for obs in observacoes:
    ItemComanda.objects.create(
        comanda=comanda,
        produto=produto,
        quantidade=1,
        preco_unitario=produto.preco_venda,
        observacoes=obs,
        status='Em Preparo'
    )

print("10 itens adicionados na Comanda da Mesa 1 com sucesso!")
