"""Tests de POST /api/v1/auth/register/ (UC01, page P02)."""

import pytest
from django.contrib.auth import get_user_model
from django.db import IntegrityError
from rest_framework_simplejwt.tokens import AccessToken

from accounts import messages
from accounts.models import Shop
from accounts.serializers import RegisterSerializer
from accounts.tests.factories import TEST_PASSWORD, UserFactory

URL = "/api/v1/auth/register/"
User = get_user_model()

VALID_PAYLOAD = {
    "full_name": "Rose Mbuyi",
    "phone": "+243 81 000 0001",  # écrit avec des espaces : le serveur normalise
    "password": TEST_PASSWORD,
    "shop_name": "Boutique Maman Rose",
}


def post_register(client, **overrides):
    return client.post(URL, {**VALID_PAYLOAD, **overrides}, format="json")


@pytest.mark.django_db
def test_register_creates_user_shop_and_session(api_client):
    response = post_register(api_client)

    assert response.status_code == 201
    body = response.json()
    assert body["user"]["phone"] == "+243810000001"
    assert body["user"]["full_name"] == "Rose Mbuyi"
    assert body["shop"]["name"] == "Boutique Maman Rose"
    assert body["shop"]["reference_currency_code"] == "CDF"
    assert body["onboarding_completed"] is False  # P03 doit d'abord enregistrer un taux
    assert Shop.objects.get(owner__phone="+243810000001").name == "Boutique Maman Rose"


@pytest.mark.django_db
def test_register_never_returns_the_password_or_its_hash(api_client):
    response = post_register(api_client)

    assert "password" not in response.json()["user"]
    assert TEST_PASSWORD not in response.content.decode()
    assert "pbkdf2" not in response.content.decode().lower()


@pytest.mark.django_db
def test_register_sets_a_protected_refresh_cookie(api_client, settings):
    response = post_register(api_client)

    cookie = response.cookies[settings.REFRESH_COOKIE_NAME]
    assert cookie["httponly"] is True  # illisible par JavaScript : protège du XSS
    assert cookie["samesite"] == "Lax"
    assert cookie["path"] == "/api/v1/auth/"  # envoyé uniquement aux routes d'authentification
    assert cookie["secure"] is True
    assert int(cookie["max-age"]) == settings.REFRESH_COOKIE_MAX_AGE
    assert cookie.value not in response.content.decode()  # le refresh n'est pas dans le JSON


@pytest.mark.django_db
def test_access_token_holds_only_the_user_id(api_client):
    response = post_register(api_client)

    payload = AccessToken(response.json()["access"]).payload
    assert payload["sub"] == response.json()["user"]["id"]
    assert "phone" not in payload and "full_name" not in payload  # aucune donnée personnelle


@pytest.mark.django_db
def test_register_stores_a_hash_not_the_password(api_client):
    post_register(api_client)

    user = User.objects.get(phone="+243810000001")
    assert user.password != TEST_PASSWORD
    assert user.check_password(TEST_PASSWORD)


@pytest.mark.django_db
@pytest.mark.real_hasher
def test_register_hashes_the_password_with_argon2(api_client):
    post_register(api_client)

    assert User.objects.get(phone="+243810000001").password.startswith("argon2$")


@pytest.mark.django_db
def test_register_rejects_a_phone_already_used_in_any_format(api_client):
    UserFactory(phone="+243810000001")

    response = post_register(api_client, phone="+243-81-000-0001")

    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "VALIDATION_ERROR"
    assert error["details"]["phone"] == [messages.PHONE_TAKEN]
    assert User.objects.count() == 1


@pytest.mark.django_db
def test_register_handles_two_simultaneous_signups_for_the_same_phone(api_client, monkeypatch):
    """Course : la vérification d'unicité passe, mais l'autre inscription vient d'aboutir."""
    UserFactory(phone="+243810000001")
    monkeypatch.setattr(RegisterSerializer, "validate_phone", lambda self, value: value)

    response = post_register(api_client)

    assert response.status_code == 400  # une erreur de champ propre, pas un 500
    assert response.json()["error"]["details"]["phone"] == [messages.PHONE_TAKEN]


@pytest.mark.django_db
@pytest.mark.parametrize(
    "weak_password",
    ["abc1", "12345678", "password", "Rose Mbuyi", "+243810000001"],
    ids=["trop court", "tout numérique", "trop courant", "proche du nom", "proche du téléphone"],
)
def test_register_rejects_weak_passwords(api_client, weak_password):
    response = post_register(api_client, password=weak_password)

    assert response.status_code == 400
    assert response.json()["error"]["details"]["password"]  # au moins un message
    assert not User.objects.exists()


@pytest.mark.django_db
@pytest.mark.parametrize(
    "bad_phone", ["810000001", "0810000001", "+24381", "abc", "+243810000001x"]
)
def test_register_rejects_invalid_phones(api_client, bad_phone):
    response = post_register(api_client, phone=bad_phone)

    assert response.status_code == 400
    assert response.json()["error"]["details"]["phone"] == [messages.PHONE_INVALID]


@pytest.mark.django_db
def test_register_reports_every_missing_field(api_client):
    response = api_client.post(URL, {}, format="json")

    assert response.status_code == 400
    details = response.json()["error"]["details"]
    assert set(details) == {"full_name", "phone", "password", "shop_name"}


@pytest.mark.django_db
def test_register_ignores_privilege_fields_sent_by_the_client(api_client):
    response = post_register(
        api_client, is_staff=True, is_superuser=True, is_active=False, id="x", shop_id="y"
    )

    assert response.status_code == 201
    user = User.objects.get(phone="+243810000001")
    assert not user.is_staff and not user.is_superuser and user.is_active


@pytest.mark.django_db
def test_register_trims_names_and_rejects_control_characters(api_client):
    response = post_register(api_client, full_name="  Rose Mbuyi  ")
    assert response.json()["user"]["full_name"] == "Rose Mbuyi"

    response = post_register(api_client, phone="+243810000002", shop_name="Bou\u0007tique")
    assert response.status_code == 400
    assert response.json()["error"]["details"]["shop_name"] == [messages.TEXT_INVALID]


@pytest.mark.django_db
def test_register_is_atomic_when_the_shop_cannot_be_created(api_client, monkeypatch):
    """Jamais de commerçant sans boutique : si la boutique échoue, le compte aussi."""

    def fail(*args, **kwargs):
        raise IntegrityError("échec simulé")

    monkeypatch.setattr(Shop, "save", fail)

    response = post_register(api_client)

    assert response.status_code == 500
    assert not User.objects.exists()
    body = response.content.decode()
    assert "IntegrityError" not in body and "simulé" not in body  # aucun détail interne
    assert response.json()["error"]["code"] == "SERVER_ERROR"


@pytest.mark.django_db
def test_register_accepts_json_only(api_client):
    response = api_client.post(
        URL, "full_name=Rose", content_type="application/x-www-form-urlencoded"
    )

    assert response.status_code == 415
    assert response.json()["error"]["code"] == "UNSUPPORTED_MEDIA_TYPE"
