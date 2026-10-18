from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, Product
from catalog.serializers import CategorySerializer, ProductSerializer


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        products = Product.objects.filter(shop=request.user.shop, is_active=True).select_related("category").prefetch_related("stock_movements")
        return Response(ProductSerializer(products, many=True, context={"request": request}).data)
    def post(self, request):
        serializer = ProductSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        product = serializer.save(shop=request.user.shop)
        return Response(ProductSerializer(product, context={"request": request}).data, status=201)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, product_id):
        product = get_object_or_404(Product.objects.select_related("category").prefetch_related("stock_movements"), id=product_id, shop=request.user.shop)
        return Response(ProductSerializer(product, context={"request": request}).data)
    def patch(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, shop=request.user.shop)
        serializer = ProductSerializer(product, data=request.data, partial=True); serializer.is_valid(raise_exception=True); serializer.save()
        return Response(ProductSerializer(product, context={"request": request}).data)


class ProductArchiveView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, shop=request.user.shop); product.is_active = False; product.save(update_fields=["is_active", "server_updated_at"])
        return Response(ProductSerializer(product, context={"request": request}).data)


class CategoryListCreateView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        categories = Category.objects.filter(shop=request.user.shop, deleted_at__isnull=True).annotate(product_count=Count("products"))
        return Response(CategorySerializer(categories, many=True).data)
    def post(self, request):
        serializer = CategorySerializer(data=request.data); serializer.is_valid(raise_exception=True); now = timezone.now()
        category = serializer.save(shop=request.user.shop, created_at=now, updated_at=now)
        return Response(CategorySerializer(category).data, status=201)


class CategoryDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def patch(self, request, category_id):
        category = get_object_or_404(Category, id=category_id, shop=request.user.shop, deleted_at__isnull=True); serializer = CategorySerializer(category, data=request.data, partial=True); serializer.is_valid(raise_exception=True); serializer.save(); return Response(serializer.data)
    def delete(self, request, category_id):
        category = get_object_or_404(Category, id=category_id, shop=request.user.shop, deleted_at__isnull=True); category.products.update(category=None); category.deleted_at = timezone.now(); category.save(update_fields=["deleted_at", "server_updated_at"]); return Response(status=204)
