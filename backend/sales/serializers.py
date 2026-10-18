from rest_framework import serializers

from sales.models import Sale, SaleItem


class SaleItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class SaleCreateSerializer(serializers.Serializer):
    currency = serializers.ChoiceField(choices=["CDF", "USD"])
    items = SaleItemInputSerializer(many=True, allow_empty=False)


class SaleItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = SaleItem
        fields = ["id", "name", "quantity", "unit_price", "line_total"]


class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    status = serializers.SerializerMethodField()

    class Meta:
        model = Sale
        fields = ["id", "receipt_number", "currency", "exchange_rate", "total", "created_at", "cancelled_at", "cancellation_reason", "status", "items"]

    def get_status(self, sale):
        return "cancelled" if sale.cancelled_at else "validated"


class CancelSaleSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
