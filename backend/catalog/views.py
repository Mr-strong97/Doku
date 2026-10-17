from django.db.models import Prefetch
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Category, Product
from catalog.serializers import CategorySerializer, ProductSerializer
from inventory.models import StockMovement


class ProductListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        products = Product.objects.filter(shop=request.user.shop, is_active=True).select_related("category").prefetch_related("stock_movements")
        return Response(ProductSerializer(products, many=True).data)

    def post(self, request):
        serializer = ProductSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        category = serializer.validated_data.get("category")
        if category and category.shop_id != request.user.shop.id:
            return Response({"error": {"code": "FORBIDDEN", "message": "Catégorie invalide.", "details": None}}, status=403)
        product = serializer.save(shop=request.user.shop)
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class CategoryListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(CategorySerializer(Category.objects.filter(shop=request.user.shop), many=True).data)
