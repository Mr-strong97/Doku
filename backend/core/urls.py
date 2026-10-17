from django.urls import path

from core.views import ExchangeRateListCreateView, ShopMeView

urlpatterns = [
    path("shops/me/", ShopMeView.as_view(), name="shop-me"),
    path("exchange-rates/", ExchangeRateListCreateView.as_view(), name="exchange-rates"),
]
