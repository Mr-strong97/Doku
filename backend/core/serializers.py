"""Validation et représentation des réglages partagés de la boutique."""

from decimal import Decimal

from rest_framework import serializers

from accounts.models import Shop
from core.models import ExchangeRate


class ShopSettingsSerializer(serializers.ModelSerializer):
    reference_currency = serializers.ChoiceField(choices=["CDF", "USD"], source="reference_currency_id")

    class Meta:
        model = Shop
        fields = ["id", "name", "address", "phone", "reference_currency"]
        read_only_fields = ["id"]


class ExchangeRateSerializer(serializers.ModelSerializer):
    # DRF attend un Decimal, pas un float, pour éviter une imprécision de validation.
    rate = serializers.DecimalField(max_digits=18, decimal_places=6, min_value=Decimal("0.000001"))

    class Meta:
        model = ExchangeRate
        fields = ["id", "rate", "effective_at", "created_at"]
        read_only_fields = ["id", "created_at"]
        extra_kwargs = {"effective_at": {"required": False}}
