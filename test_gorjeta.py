import requests

API = 'http://localhost:8000/api/pdv'

# Create active comanda
r = requests.post(f"{API}/comandas/", json={"mesa": 1, "status": "A"})
comanda_id = r.json()['id']

# Post payment with gorjeta
r = requests.post(f"{API}/pagamentos/", json={"comanda": comanda_id, "valor": 17.60, "valor_gorjeta": 1.60, "forma_pagamento": "PIX"})
print("Pagamento:", r.json())

# Get active comandas
r = requests.get(f"{API}/comandas/ativas/")
print("Ativas:", r.json())
