import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from pdv.models import Mesa, Comanda, ItemComanda, Pagamento
from estoque.models import Produto

print("Criando vendas de teste para hoje...")

# Criar uma comanda fechada
mesa1 = Mesa.objects.get(numero=1)
comanda1 = Comanda.objects.create(mesa=mesa1, status='Fechada', taxa_servico=5.00)

prod_burguer = Produto.objects.get(nome='X-Burguer Tradicional')
prod_coca = Produto.objects.get(nome='Coca-Cola Lata')

ItemComanda.objects.create(comanda=comanda1, produto=prod_burguer, quantidade=2, preco_unitario=prod_burguer.preco_venda, status='Entregue')
ItemComanda.objects.create(comanda=comanda1, produto=prod_coca, quantidade=2, preco_unitario=prod_coca.preco_venda, status='Entregue')

# Pagamento
Pagamento.objects.create(comanda=comanda1, valor=86.00, valor_gorjeta=8.60, forma_pagamento='PIX')

# Outra comanda com item cancelado
mesa2 = Mesa.objects.get(numero=2)
comanda2 = Comanda.objects.create(mesa=mesa2, status='Fechada', taxa_servico=2.00)

ItemComanda.objects.create(comanda=comanda2, produto=prod_burguer, quantidade=1, preco_unitario=prod_burguer.preco_venda, status='Entregue')
ItemComanda.objects.create(comanda=comanda2, produto=prod_coca, quantidade=1, preco_unitario=prod_coca.preco_venda, status='Entregue')
# Cancelado
ItemComanda.objects.create(comanda=comanda2, produto=prod_coca, quantidade=1, preco_unitario=prod_coca.preco_venda, status='Cancelada')

Pagamento.objects.create(comanda=comanda2, valor=43.00, valor_gorjeta=4.30, forma_pagamento='CREDITO')

print("Vendas geradas com sucesso!")
