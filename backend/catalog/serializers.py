from rest_framework import serializers
from django.utils import timezone

from catalog.models import Category, Product
from inventory.models import StockMovement


class ProductSerializer(serializers.ModelSerializer):
    initial_stock = serializers.IntegerField(write_only=True, min_value=0, required=False, default=0)
    stock = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)

    class Meta:
        model = Product
        fields = ["id", "name", "price_usd", "category", "category_name", "initial_stock", "stock", "is_active"]
        read_only_fields = ["id", "stock"]

    def create(self, validated_data):
        initial_stock = validated_data.pop("initial_stock", 0)
        now = timezone.now()
        product = Product.objects.create(**validated_data, created_at=now, updated_at=now)
        if initial_stock:
            StockMovement.objects.create(
                shop=product.shop, product=product, quantity_delta=initial_stock,
                reason="initial", created_at=product.created_at,
            )
        return product

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["stock"] = sum(item.quantity_delta for item in instance.stock_movements.all())
        return representation


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name"]
