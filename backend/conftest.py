"""Réglages et fixtures communs à tous les tests du backend."""

import pytest
from django.core.cache import cache
from rest_framework.test import APIClient

TRUSTED_ORIGIN = "http://localhost:3000"
FAST_HASHER = "django.contrib.auth.hashers.MD5PasswordHasher"


@pytest.fixture(autouse=True)
def isolated_settings(settings):
    """Les tests ne dépendent pas du fichier .env de la machine."""
    settings.CORS_ALLOWED_ORIGINS = [TRUSTED_ORIGIN]
    settings.SECURE_SSL_REDIRECT = False
    settings.REFRESH_COOKIE_SECURE = True


@pytest.fixture(autouse=True)
def clear_throttle_cache():
    """Chaque test repart avec des compteurs de limitation à zéro."""
    cache.clear()
    yield
    cache.clear()


@pytest.fixture(autouse=True)
def fast_password_hasher(settings, request):
    """Argon2 est volontairement lent : on utilise un hachage rapide, sauf demande contraire."""
    if request.node.get_closest_marker("real_hasher") is None:
        settings.PASSWORD_HASHERS = [FAST_HASHER]


@pytest.fixture
def api_client() -> APIClient:
    return APIClient()


@pytest.fixture
def browser_headers() -> dict:
    """En-têtes que l'application Next.js envoie vers les endpoints à cookie."""
    return {"HTTP_ORIGIN": TRUSTED_ORIGIN, "HTTP_X_DOKU_CLIENT": "web"}
