from django.urls import path

from catalog.views import CategoryListView, ProductListCreateView

urlpatterns = [
    path("products/", ProductListCreateView.as_view(), name="products"),
    path("categories/", CategoryListView.as_view(), name="categories"),
]
