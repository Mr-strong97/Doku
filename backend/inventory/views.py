"""Journal de stock append-only : chaque correction reste traçable."""

from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from inventory.models import StockMovement


class MovementInputSerializer(serializers.Serializer):
    quantity_delta = serializers.IntegerField()
    reason = serializers.ChoiceField(choices=["restock", "adjustment"])

    def validate_quantity_delta(self, value):
        if value == 0:
            raise serializers.ValidationError("La quantité ne peut pas être nulle.")
        return value


class ProductMovementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, shop=request.user.shop)
        movements = list(product.stock_movements.order_by("created_at"))
        running = 0; response = []
        for movement in movements:
            running += movement.quantity_delta
            response.append({"id": str(movement.id), "quantity_delta": movement.quantity_delta, "reason": movement.reason, "created_at": movement.created_at, "stock_after": running})
        return Response(list(reversed(response)))

    def post(self, request, product_id):
        product = get_object_or_404(Product, id=product_id, shop=request.user.shop, is_active=True)
        serializer = MovementInputSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        movement = StockMovement.objects.create(shop=request.user.shop, product=product, created_at=timezone.now(), **serializer.validated_data)
        stock_after = StockMovement.objects.filter(product=product).aggregate(total=Sum("quantity_delta"))["total"] or 0
        return Response({"id": str(movement.id), "quantity_delta": movement.quantity_delta, "reason": movement.reason, "created_at": movement.created_at, "stock_after": stock_after}, status=201)


class StockOverviewView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        products = Product.objects.filter(shop=request.user.shop, is_active=True).prefetch_related("stock_movements")
        payload = []
        for product in products:
            stock = sum(item.quantity_delta for item in product.stock_movements.all())
            payload.append({"id": str(product.id), "name": product.name, "stock": stock, "threshold": product.low_stock_threshold, "category": product.category.name if product.category else None})
        return Response(payload)
