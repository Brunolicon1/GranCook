from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MesaViewSet, ComandaViewSet, ItemComandaViewSet, PagamentoViewSet, ProdutoViewSet, KDSViewSet, DashboardViewSet, NotaFiscalViewSet

router = DefaultRouter()
router.register(r'mesas', MesaViewSet)
router.register(r'comandas', ComandaViewSet)
router.register(r'itens', ItemComandaViewSet)
router.register(r'pagamentos', PagamentoViewSet)
router.register(r'produtos', ProdutoViewSet)
router.register(r'kds', KDSViewSet, basename='kds')
router.register(r'dashboard', DashboardViewSet, basename='dashboard')
router.register(r'notas-fiscais', NotaFiscalViewSet, basename='notas-fiscais')

urlpatterns = [
    path('', include(router.urls)),
]
