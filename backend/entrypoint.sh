#!/bin/bash
echo "Aguardando o banco de dados iniciar..."
# Aguarda até 10 segundos
sleep 3

echo "Aplicando migrações do banco de dados..."
python manage.py migrate

echo "Criando usuários padrão (Garçom, Cozinha, Gerente)..."
python seed_users.py

echo "Iniciando o servidor..."
exec python manage.py runserver 0.0.0.0:8000
