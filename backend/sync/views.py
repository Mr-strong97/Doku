"""Contrats de synchronisation sans fuite de données entre boutiques."""

from django.utils import timezone
from rest_framework import serializers
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sales.serializers import SaleCreateSerializer
from sales.views import create_sale


class PushSerializer(serializers.Serializer):
    # Conserve la compatibilité avec les clients déjà déployés qui demandent
    # seulement une passe de synchronisation vide.
    sales = SaleCreateSerializer(many=True, allow_empty=False, required=False, default=list)


class HealthView(APIView):
    """Sonde publique ne révélant aucune donnée métier."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok", "server_time": timezone.now()})


class PushView(APIView):
    """Acquitte la file locale de ventes de façon idempotente."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PushSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sent, accepted, errors = 0, [], []
        for sale in serializer.validated_data["sales"]:
            try:
                _, created = create_sale(request.user.shop, sale)
                sent += int(created)
                accepted.append(str(sale["client_id"]))
            except ValidationError as error:
                errors.append({"id": str(sale.get("client_id", "")), "type": "sale", "label": "Vente à vérifier", "code": str(error.detail)})
        return Response({"sent": sent, "accepted": accepted, "errors": errors, "synced_at": timezone.now()})


class PullView(APIView):
    """Point d'extension pour le curseur de synchronisation par boutique."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"changes": [], "synced_at": timezone.now()})
