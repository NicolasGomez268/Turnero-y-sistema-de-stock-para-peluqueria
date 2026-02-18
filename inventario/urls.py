from django.urls import path
from .views import (
    productos_list,
    producto_detail,
    ajustar_stock,
    categorias_list,
    ventas_list,
)

urlpatterns = [
    path('productos/', productos_list, name='inventario-productos-list'),
    path('productos/<int:producto_id>/', producto_detail, name='inventario-producto-detail'),
    path('productos/<int:producto_id>/stock/', ajustar_stock, name='inventario-ajustar-stock'),
    path('categorias/', categorias_list, name='inventario-categorias'),
    path('ventas/', ventas_list, name='inventario-ventas-list'),
]
