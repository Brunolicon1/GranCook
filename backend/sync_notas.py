import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from pdv.models import Comanda, NotaFiscal

fechadas = Comanda.objects.filter(status='Fechada')
count = 0
for comanda in fechadas:
    nota, created = NotaFiscal.objects.get_or_create(comanda=comanda)
    if created:
        count += 1

print(f"Sincronizadas {count} comandas fechadas para Notas Fiscais pendentes.")
