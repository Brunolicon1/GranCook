import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from pdv.models import Mesa
from estoque.models import Produto

print("Populando o banco de dados...")

mesas = [
    (1, 2), (2, 4), (3, 4), (4, 6),
    (5, 2), (6, 4), (7, 4), (8, 8)
]

for numero, cap in mesas:
    Mesa.objects.get_or_create(numero=numero, defaults={'capacidade': cap, 'status': 'Livre'})

produtos = [
    ('X-Burguer Tradicional', 35.00, 'Cozinha'),
    ('X-Bacon Duplo', 42.00, 'Cozinha'),
    ('X-Salada Especial', 32.00, 'Cozinha'),
    ('Batata Frita Rústica', 25.00, 'Cozinha'),
    ('Coca-Cola Lata', 8.00, 'Copa'),
    ('Cerveja Artesanal IPA', 18.00, 'Copa'),
    ('Pudim de Leite', 15.00, 'Copa'),
]

for nome, preco, setor in produtos:
    Produto.objects.get_or_create(nome=nome, defaults={'preco_venda': preco, 'setor': setor})

import seed_users
seed_users.run()

print("Banco de dados populado com sucesso!")
