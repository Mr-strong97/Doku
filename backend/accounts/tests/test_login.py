"""Tests de POST /api/v1/auth/login/ (UC02, page P01)."""

import pytest
from django.utils import timezone

from accounts import messages
from accounts.tests.factories import TEST_PASSWORD, ShopFactory, UserFactory
from core.models import ExchangeRate

URL = "/api/v1/auth/login/"
PHONE = "+243810000001"
INVALID_CREDENTIALS_BODY = {
    "error": {
        "code": "INVALID_CREDENTIALS",
        "message": messages.INVALID_CREDENTIALS,
        "details": None,
    }
}


def post_login(client, phone=PHONE, password=TEST_PASSWORD, **headers):
    return client.post(URL, {"phone": phone, "password": password}, format="json", **headers)


@pytest.fixture
def merchant(db):
    """Un commerçant et sa boutique, prêts à se connecter."""
    return ShopFactory(owner=UserFactory(phone=PHONE))


@pytest.mark.django_db
def test_login_returns_session_profile_and_cookie(api_client, merchant, settings):
    response = post_login(api_client, phone="+243 81 000 0001")

    assert response.status_code == 200
    body = response.json()
    assert body["user"]["id"] == str(merchant.owner.id)
    assert body["shop"]["id"] == str(merchant.id)
    assert body["access"]
    assert response.cookies[settings.REFRESH_COOKIE_NAME]["httponly"] is True


@pytest.mark.django_db
def test_login_records_the_last_login_date(api_client, merchant):
    assert merchant.owner.last_login is None

    post_login(api_client)

    merchant.owner.refresh_from_db()
    assert merchant.owner.last_login is not None


@pytest.mark.django_db
def test_login_tells_whether_the_initial_setup_is_done(api_client, merchant):
    assert post_login(api_client).json()["onboarding_completed"] is False

    now = timezone.now()
    ExchangeRate.objects.create(
        shop=merchant,
        base_currency_id="USD",
        quote_currency_id="CDF",
        rate=2800,
        effective_at=now,
        created_at=now,
    )

    assert post_login(api_client).json()["onboarding_completed"] is True


@pytest.fixture(params=["unknown_phone", "wrong_password", "inactive_user", "user_without_shop"])
def failing_attempt(request, merchant, db):
    """Quatre façons d'échouer : la réponse doit être strictement la même."""
    if request.param == "unknown_phone":
        return {"phone": "+243899999999", "password": TEST_PASSWORD}
    if request.param == "wrong_password":
        return {"phone": PHONE, "password": "Mauvais-mot-de-passe-1"}
    if request.param == "inactive_user":
        merchant.owner.is_active = False
        merchant.owner.save()
        return {"phone": PHONE, "password": TEST_PASSWORD}
    UserFactory(phone="+243822222222")  # compte sans boutique (ex. super-utilisateur)
    return {"phone": "+243822222222", "password": TEST_PASSWORD}


@pytest.mark.django_db
def test_every_login_failure_gives_the_same_generic_answer(api_client, failing_attempt, settings):
    response = post_login(api_client, **failing_attempt)

    assert response.status_code == 401
    assert (
        response.json() == INVALID_CREDENTIALS_BODY
    )  # ne révèle ni l'existence du compte ni la cause
    assert settings.REFRESH_COOKIE_NAME not in response.cookies


@pytest.mark.django_db
def test_login_rejects_a_malformed_phone_with_a_field_error(api_client):
    response = post_login(api_client, phone="81 000 0001")

    assert response.status_code == 400
    assert response.json()["error"]["details"]["phone"] == [messages.PHONE_INVALID]


@pytest.mark.django_db
def test_login_ignores_a_stale_authorization_header(api_client, merchant):
    """Un vieux jeton oublié par le navigateur ne doit pas empêcher de se reconnecter."""
    response = post_login(api_client, HTTP_AUTHORIZATION="Bearer jeton.perime.invalide")

    assert response.status_code == 200


@pytest.mark.django_db
def test_login_rejects_oversized_password_without_hashing_it(api_client, merchant):
    response = post_login(api_client, password="x" * 5000)

    assert response.status_code == 400
    assert "password" in response.json()["error"]["details"]


@pytest.mark.django_db
@pytest.mark.parametrize("body", [[], "texte", 12, None])
def test_login_survives_bodies_that_are_not_objects(api_client, body):
    response = api_client.post(URL, body, format="json")

    assert response.status_code == 400  # une erreur propre, jamais un 500
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
