from django.urls import path
from catalog.views import CategoryDetailView, CategoryListCreateView, ProductArchiveView, ProductDetailView, ProductListCreateView

urlpatterns = [
    path("products/", ProductListCreateView.as_view()),
    path("products/<uuid:product_id>/", ProductDetailView.as_view()),
    path("products/<uuid:product_id>/archive/", ProductArchiveView.as_view()),
    path("categories/", CategoryListCreateView.as_view()),
    path("categories/<uuid:category_id>/", CategoryDetailView.as_view()),
]
