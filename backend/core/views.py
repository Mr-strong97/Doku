"""Endpoints de configuration : la vue valide, le modèle garde les invariants."""

from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import ExchangeRate
from core.serializers import ExchangeRateSerializer, ShopSettingsSerializer


class ShopMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(ShopSettingsSerializer(request.user.shop).data)

    def patch(self, request):
        serializer = ShopSettingsSerializer(request.user.shop, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ExchangeRateListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        rates = ExchangeRate.objects.filter(shop=request.user.shop).order_by("-effective_at")
        return Response(ExchangeRateSerializer(rates, many=True).data)

    def post(self, request):
        serializer = ExchangeRateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        rate = serializer.save(
            shop=request.user.shop,
            base_currency_id="USD",
            quote_currency_id="CDF",
            effective_at=serializer.validated_data.get("effective_at", timezone.now()),
            created_at=timezone.now(),
        )
        return Response(ExchangeRateSerializer(rate).data, status=status.HTTP_201_CREATED)
