"""Protection CSRF des endpoints qui lisent le cookie (dossier §17.5).

Un navigateur joint automatiquement le cookie à toute requête vers l'API, même lancée par
un site malveillant. Deux barrières l'empêchent d'agir :
  1. un en-tête personnalisé : une page tierce ne peut pas l'ajouter sans que le serveur
     l'autorise explicitement par CORS (et il n'autorise que nos origines) ;
  2. si le navigateur envoie l'en-tête Origin, il doit faire partie des origines autorisées.
"""

import re

from django.conf import settings
from rest_framework.request import Request

from accounts.exceptions import UntrustedClientError


def ensure_trusted_client(request: Request) -> None:
    """Lève UntrustedClientError (403) si la requête ne vient pas de notre application."""
    if request.headers.get(settings.CLIENT_HEADER_NAME) != settings.CLIENT_HEADER_VALUE:
        raise UntrustedClientError()
    origin = request.headers.get("Origin")
    if origin is not None and not is_trusted_origin(origin):
        raise UntrustedClientError()


def is_trusted_origin(origin: str) -> bool:
    """Accepte les origines explicites et le port local dynamique de Next en DEBUG."""
    if origin in settings.CORS_ALLOWED_ORIGINS:
        return True
    return any(re.fullmatch(pattern, origin) for pattern in settings.CORS_ALLOWED_ORIGIN_REGEXES)
