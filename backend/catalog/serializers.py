from rest_framework import serializers
from django.utils import timezone

from catalog.models import Category, Product
from inventory.models import StockMovement


class ProductSerializer(serializers.ModelSerializer):
    initial_stock = serializers.IntegerField(write_only=True, min_value=0, required=False, default=0)
    stock = serializers.IntegerField(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True, allow_null=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = ["id", "name", "price_usd", "purchase_price_usd", "low_stock_threshold", "category", "category_name", "image", "image_url", "initial_stock", "stock", "is_active"]
        # Un multipart FormData absent interprète les booléens HTML comme False. L'état actif
        # n'est donc jamais contrôlé par le formulaire produit : seul l'endpoint d'archivage
        # peut l'inactiver, ce qui évite de masquer un produit créé normalement.
        read_only_fields = ["id", "stock", "is_active"]

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

    def validate_image(self, image):
        allowed_types = {"image/jpeg", "image/png", "image/webp"}
        maximum_size = 5 * 1024 * 1024
        if image.content_type not in allowed_types:
            raise serializers.ValidationError("Utilisez une image JPG, PNG ou WebP.")
        if image.size > maximum_size:
            raise serializers.ValidationError("L'image ne doit pas dépasser 5 Mo.")
        signatures = (b"\xff\xd8\xff", b"\x89PNG\r\n\x1a\n", b"RIFF")
        header = image.read(12)
        image.seek(0)
        if not header.startswith(signatures):
            raise serializers.ValidationError("Le fichier image est invalide.")
        return image

    def get_image_url(self, product):
        if not product.image:
            return None
        request = self.context.get("request")
        return request.build_absolute_uri(product.image.url) if request else product.image.url

    def to_representation(self, instance):
        representation = super().to_representation(instance)
        representation["stock"] = sum(item.quantity_delta for item in instance.stock_movements.all())
        return representation


class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Category
        fields = ["id", "name", "product_count"]
