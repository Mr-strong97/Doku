"""Tests du cycle de vie de la session : refresh (rotation) et logout (séquence 4)."""

import pytest
from rest_framework_simplejwt.authentication import JWTAuthentication

from accounts import messages
from accounts.tests.factories import TEST_PASSWORD, ShopFactory, UserFactory

LOGIN_URL = "/api/v1/auth/login/"
REFRESH_URL = "/api/v1/auth/refresh/"
LOGOUT_URL = "/api/v1/auth/logout/"
PHONE = "+243810000001"


@pytest.fixture
def logged_in(db, api_client):
    """Un client connecté : son cookie refresh est déjà dans le « navigateur » (api_client)."""
    ShopFactory(owner=UserFactory(phone=PHONE))
    response = api_client.post(
        LOGIN_URL, {"phone": PHONE, "password": TEST_PASSWORD}, format="json"
    )
    assert response.status_code == 200
    return api_client


def refresh_cookie(client, settings) -> str:
    return client.cookies[settings.REFRESH_COOKIE_NAME].value


@pytest.mark.django_db
def test_access_token_authenticates_the_user(logged_in):
    """Vérifie de bout en bout que la configuration du claim « sub » fonctionne."""
    response = logged_in.post(LOGIN_URL, {"phone": PHONE, "password": TEST_PASSWORD}, format="json")

    authentication = JWTAuthentication()
    token = authentication.get_validated_token(response.json()["access"].encode())

    assert authentication.get_user(token).phone == PHONE


@pytest.mark.django_db
def test_refresh_rotates_the_refresh_token(logged_in, browser_headers, settings):
    old_refresh = refresh_cookie(logged_in, settings)

    response = logged_in.post(REFRESH_URL, **browser_headers)

    assert response.status_code == 200
    assert response.json()["access"]
    assert set(response.json()) == {"access"}  # le nouveau refresh voyage dans le cookie
    assert response.cookies[settings.REFRESH_COOKIE_NAME].value != old_refresh


@pytest.mark.django_db
def test_a_used_refresh_token_cannot_be_used_twice(logged_in, browser_headers, settings):
    """Réutiliser un refresh déjà consommé signale un vol possible : refus et cookie effacé."""
    stolen_refresh = refresh_cookie(logged_in, settings)
    logged_in.post(REFRESH_URL, **browser_headers)  # usage légitime : l'ancien est révoqué

    logged_in.cookies[settings.REFRESH_COOKIE_NAME] = stolen_refresh
    response = logged_in.post(REFRESH_URL, **browser_headers)

    assert response.status_code == 401
    assert response.json()["error"]["code"] == "SESSION_EXPIRED"
    assert response.cookies[settings.REFRESH_COOKIE_NAME]["max-age"] == 0


@pytest.mark.django_db
def test_refresh_without_cookie_is_refused(api_client, browser_headers):
    response = api_client.post(REFRESH_URL, **browser_headers)

    assert response.status_code == 401
    assert response.json()["error"]["message"] == messages.SESSION_EXPIRED


@pytest.mark.django_db
def test_refresh_requires_the_custom_header_and_keeps_the_token_valid(logged_in, browser_headers):
    """Protection CSRF : sans l'en-tête de confiance, rien n'est consommé."""
    blocked = logged_in.post(REFRESH_URL, HTTP_ORIGIN=browser_headers["HTTP_ORIGIN"])
    assert blocked.status_code == 403
    assert blocked.json()["error"]["code"] == "FORBIDDEN"

    assert logged_in.post(REFRESH_URL, **browser_headers).status_code == 200


@pytest.mark.django_db
def test_refresh_refuses_requests_from_unknown_origins(logged_in):
    response = logged_in.post(
        REFRESH_URL, HTTP_ORIGIN="https://site-malveillant.example", HTTP_X_DOKU_CLIENT="web"
    )

    assert response.status_code == 403


@pytest.mark.django_db
def test_refresh_refuses_a_tampered_token_and_clears_the_cookie(
    api_client, browser_headers, settings
):
    api_client.cookies[settings.REFRESH_COOKIE_NAME] = "pas.un.vrai.jeton"

    response = api_client.post(REFRESH_URL, **browser_headers)

    assert response.status_code == 401
    assert response.cookies[settings.REFRESH_COOKIE_NAME]["max-age"] == 0


@pytest.mark.django_db
def test_refresh_is_refused_once_the_account_is_deactivated(logged_in, browser_headers):
    user = ShopFactory._meta.model.objects.get(owner__phone=PHONE).owner
    user.is_active = False
    user.save()

    assert logged_in.post(REFRESH_URL, **browser_headers).status_code == 401


@pytest.mark.django_db
def test_refresh_is_refused_once_the_account_is_deleted(logged_in, browser_headers):
    shop = ShopFactory._meta.model.objects.get(owner__phone=PHONE)
    user = shop.owner
    shop.delete()
    user.delete()

    response = logged_in.post(REFRESH_URL, **browser_headers)

    assert response.status_code == 401  # une erreur propre, pas un 500


@pytest.mark.django_db
def test_logout_revokes_the_refresh_token_and_clears_the_cookie(
    logged_in, browser_headers, settings
):
    refresh = refresh_cookie(logged_in, settings)

    response = logged_in.post(LOGOUT_URL, **browser_headers)

    assert response.status_code == 204
    assert response.cookies[settings.REFRESH_COOKIE_NAME]["max-age"] == 0
    logged_in.cookies[settings.REFRESH_COOKIE_NAME] = refresh  # même un cookie conservé...
    assert logged_in.post(REFRESH_URL, **browser_headers).status_code == 401  # ...est révoqué


@pytest.mark.django_db
def test_logout_is_idempotent_without_cookie(api_client, browser_headers):
    assert api_client.post(LOGOUT_URL, **browser_headers).status_code == 204


@pytest.mark.django_db
def test_logout_requires_the_custom_header(logged_in):
    assert logged_in.post(LOGOUT_URL).status_code == 403
