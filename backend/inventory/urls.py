from django.urls import path

from inventory.views import ProductMovementsView, StockOverviewView

urlpatterns = [path("stock/", StockOverviewView.as_view()), path("products/<uuid:product_id>/stock-movements/", ProductMovementsView.as_view())]
