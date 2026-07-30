import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User, Group

def run():
    print("Criando grupos de acesso...")
    grupo_garcom, _ = Group.objects.get_or_create(name='Garçom')
    grupo_cozinha, _ = Group.objects.get_or_create(name='Cozinha')
    grupo_gerente, _ = Group.objects.get_or_create(name='Gerente')

    print("Criando usuários de teste...")
    
    # Usuário Garçom
    if not User.objects.filter(username='garcom').exists():
        u1 = User.objects.create_user(username='garcom', password='123')
        u1.groups.add(grupo_garcom)
        print("Usuário 'garcom' criado com sucesso.")
    else:
        print("Usuário 'garcom' já existe.")

    # Usuário Cozinha
    if not User.objects.filter(username='cozinha').exists():
        u2 = User.objects.create_user(username='cozinha', password='123')
        u2.groups.add(grupo_cozinha)
        print("Usuário 'cozinha' criado com sucesso.")
    else:
        print("Usuário 'cozinha' já existe.")

    # Usuário Gerente
    if not User.objects.filter(username='gerente').exists():
        u3 = User.objects.create_user(username='gerente', password='123', is_staff=True, is_superuser=True)
        u3.groups.add(grupo_gerente)
        print("Usuário 'gerente' criado com sucesso.")
    else:
        print("Usuário 'gerente' já existe.")

    print("Finalizado!")

if __name__ == '__main__':
    run()
