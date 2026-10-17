"""Limitation du nombre d'essais sur les endpoints publics (dossier §17.1 et §17.2).

Pourquoi deux limites sur la connexion ?
  - par TÉLÉPHONE : empêche de deviner le mot de passe d'un compte, même depuis mille
    adresses différentes ;
  - par ADRESSE : empêche de balayer beaucoup de comptes depuis une même machine, sans
    bloquer toute une boutique voisine qui partage la même adresse mobile (CGNAT).
"""

import hashlib
from collections.abc import Mapping

from django.conf import settings
from rest_framework.throttling import SimpleRateThrottle

from accounts.phone import normalize_phone_number


def hash_identifier(value: str) -> str:
    """Évite de garder un numéro de téléphone en clair dans les clés du cache."""
    return hashlib.sha256(f"{settings.SECRET_KEY}:{value}".encode()).hexdigest()


class IpThrottle(SimpleRateThrottle):
    """Base : une limite par adresse du client (get_ident respecte NUM_PROXIES)."""

    def get_cache_key(self, request, view):
        return self.cache_format % {"scope": self.scope, "ident": self.get_ident(request)}


class LoginIpThrottle(IpThrottle):
    scope = "auth_login_ip"


class RegisterIpThrottle(IpThrottle):
    scope = "auth_register_ip"


class LoginPhoneThrottle(SimpleRateThrottle):
    """Une limite par numéro de téléphone, quelle que soit l'adresse d'où vient la requête."""

    scope = "auth_login_phone"

    def get_cache_key(self, request, view):
        phone = self.read_phone(request)
        if phone is None:
            return None  # corps illisible : la limite par adresse s'applique quand même
        return self.cache_format % {"scope": self.scope, "ident": hash_identifier(phone)}

    @staticmethod
    def read_phone(request) -> str | None:
        data = request.data
        raw_phone = data.get("phone") if isinstance(data, Mapping) else None
        return normalize_phone_number(raw_phone) if isinstance(raw_phone, str) else None
