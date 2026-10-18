from django.urls import path

from sales.stats_views import StatsSummaryView, StatsTopProductsView
from sales.views import SaleCancelView, SaleDetailView, SaleListCreateView

urlpatterns = [
    path("sales/", SaleListCreateView.as_view(), name="sales"),
    path("sales/<uuid:sale_id>/", SaleDetailView.as_view(), name="sale-detail"),
    path("sales/<uuid:sale_id>/cancel/", SaleCancelView.as_view(), name="sale-cancel"),
    path("stats/summary/", StatsSummaryView.as_view()),
    path("stats/top-products/", StatsTopProductsView.as_view()),
]
