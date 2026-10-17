"""Tests des protections transverses : CORS, cache, format d'erreur, hachage."""

import pytest

from accounts.tests.factories import TEST_PASSWORD, ShopFactory, UserFactory

REGISTER_URL = "/api/v1/auth/register/"
LOGIN_URL = "/api/v1/auth/login/"


@pytest.mark.django_db
def test_cors_preflight_allows_our_origin_with_credentials(api_client, browser_headers):
    origin = browser_headers["HTTP_ORIGIN"]
    response = api_client.options(
        LOGIN_URL,
        HTTP_ORIGIN=origin,
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
        HTTP_ACCESS_CONTROL_REQUEST_HEADERS="content-type,x-doku-client",
    )

    assert response["Access-Control-Allow-Origin"] == origin  # jamais « * » avec cookies
    assert response["Access-Control-Allow-Credentials"] == "true"
    assert "x-doku-client" in response["Access-Control-Allow-Headers"]


@pytest.mark.django_db
def test_cors_preflight_ignores_unknown_origins(api_client):
    response = api_client.options(
        LOGIN_URL,
        HTTP_ORIGIN="https://site-malveillant.example",
        HTTP_ACCESS_CONTROL_REQUEST_METHOD="POST",
    )

    assert "Access-Control-Allow-Origin" not in response


@pytest.mark.django_db
def test_retry_after_is_readable_by_the_browser(api_client, browser_headers):
    response = api_client.post(
        LOGIN_URL, {}, format="json", HTTP_ORIGIN=browser_headers["HTTP_ORIGIN"]
    )

    assert "Retry-After" in response["Access-Control-Expose-Headers"]


@pytest.mark.django_db
def test_authentication_responses_are_never_cached(api_client):
    ShopFactory(owner=UserFactory(phone="+243810000001"))
    credentials = {"phone": "+243810000001", "password": TEST_PASSWORD}

    success = api_client.post(LOGIN_URL, credentials, format="json")
    failure = api_client.post(
        LOGIN_URL, {**credentials, "password": "Mauvais-mot-de-passe-1"}, format="json"
    )

    assert (success.status_code, failure.status_code) == (200, 401)
    assert "no-store" in success["Cache-Control"]  # contient des jetons
    assert "no-store" in failure["Cache-Control"]


@pytest.mark.django_db
def test_every_error_uses_the_single_format(api_client):
    response = api_client.get(LOGIN_URL)  # méthode non autorisée

    assert response.status_code == 405
    assert set(response.json()["error"]) == {"code", "message", "details"}
    assert response.json()["error"]["code"] == "METHOD_NOT_ALLOWED"


@pytest.mark.django_db
def test_malformed_json_is_a_clean_client_error(api_client):
    response = api_client.post(LOGIN_URL, "{pas du json", content_type="application/json")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "PARSE_ERROR"


@pytest.mark.real_hasher
def test_argon2_is_the_first_password_hasher(settings):
    assert settings.PASSWORD_HASHERS[0].endswith("Argon2PasswordHasher")
