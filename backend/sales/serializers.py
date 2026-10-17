from rest_framework import serializers


class SaleItemInputSerializer(serializers.Serializer):
    product_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class SaleCreateSerializer(serializers.Serializer):
    currency = serializers.ChoiceField(choices=["CDF", "USD"])
    items = SaleItemInputSerializer(many=True, allow_empty=False)
