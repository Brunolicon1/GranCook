import os
from celery import Celery

# Define as configurações padrão do Django para o Celery
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

app = Celery('core')

# Lê as configurações do Celery a partir do settings.py usando o prefixo 'CELERY_'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Procura automaticamente por arquivos tasks.py dentro de todas as pastas de apps
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
