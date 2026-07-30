import requests

API = 'http://localhost:8000/api/pdv'

# Create active comanda
r = requests.post(f"{API}/comandas/", json={"mesa": 1, "status": "A"})
print("Comanda:", r.json())
comanda_id = r.json()['id']

# Post payment
r = requests.post(f"{API}/pagamentos/", json={"comanda": comanda_id, "valor": 50, "forma_pagamento": "DINHEIRO"})
print("Pagamento:", r.json())

# Get active comandas
r = requests.get(f"{API}/comandas/ativas/")
print("Ativas:", r.json())
