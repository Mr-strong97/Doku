"""Contrats de synchronisation sans fuite de données entre boutiques."""

from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Sonde publique ne révélant aucune donnée métier."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        return Response({"status": "ok", "server_time": timezone.now()})


class PushView(APIView):
    """Acquitte une passe vide : la file en attente appartient au téléphone."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"sent": 0, "errors": [], "synced_at": timezone.now()})


class PullView(APIView):
    """Point d'extension pour le curseur de synchronisation par boutique."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"changes": [], "synced_at": timezone.now()})
