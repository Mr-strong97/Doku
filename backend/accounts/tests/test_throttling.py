"""Tests de la limitation du nombre d'essais (force brute, création de comptes en masse)."""

import pytest

from accounts.tests.factories import ShopFactory, UserFactory

LOGIN_URL = "/api/v1/auth/login/"
REGISTER_URL = "/api/v1/auth/register/"
PHONE = "+243810000001"
LOGIN_PHONE_LIMIT = 5  # essais par minute et par téléphone (settings : auth_login_phone)
LOGIN_IP_LIMIT = 20
REGISTER_IP_LIMIT = 10


def attempt_login(client, phone=PHONE, **headers):
    payload = {"phone": phone, "password": "Mauvais-mot-de-passe-1"}
    return client.post(LOGIN_URL, payload, format="json", **headers)


@pytest.mark.django_db
def test_login_is_limited_per_phone_whatever_the_address(api_client):
    ShopFactory(owner=UserFactory(phone=PHONE))
    formats = [
        "+243810000001",
        "+243 81 000 0001",
        "+243-81-000-0001",
        "+243810000001",
        "+243 810000001",
    ]

    for index, written_phone in enumerate(formats):  # 5 essais, depuis 5 adresses différentes
        assert (
            attempt_login(api_client, written_phone, REMOTE_ADDR=f"10.0.0.{index}").status_code
            == 401
        )

    blocked = attempt_login(api_client, PHONE, REMOTE_ADDR="10.0.0.99")  # sixième, autre adresse

    assert blocked.status_code == 429
    assert blocked.json()["error"]["code"] == "THROTTLED"
    assert blocked.json()["error"]["details"]["retry_after"] > 0
    assert int(blocked["Retry-After"]) > 0


@pytest.mark.django_db
def test_a_blocked_phone_does_not_block_other_accounts(api_client):
    for _ in range(LOGIN_PHONE_LIMIT + 1):
        attempt_login(api_client, PHONE)

    assert attempt_login(api_client, "+243822222222").status_code == 401  # pas 429


@pytest.mark.django_db
def test_login_is_limited_per_address_even_with_many_phones(api_client):
    for index in range(LOGIN_IP_LIMIT):
        phone = f"+24382{index:07d}"
        assert attempt_login(api_client, phone, REMOTE_ADDR="10.1.1.1").status_code == 401

    assert attempt_login(api_client, "+243899999999", REMOTE_ADDR="10.1.1.1").status_code == 429


@pytest.mark.django_db
def test_forged_forwarded_for_header_cannot_bypass_the_address_limit(api_client):
    """NUM_PROXIES = 0 : seule l'adresse réelle compte, pas l'en-tête X-Forwarded-For."""
    for index in range(LOGIN_IP_LIMIT):
        attempt_login(
            api_client,
            f"+24382{index:07d}",
            REMOTE_ADDR="10.2.2.2",
            HTTP_X_FORWARDED_FOR=f"8.8.8.{index}",
        )

    blocked = attempt_login(
        api_client, "+243899999999", REMOTE_ADDR="10.2.2.2", HTTP_X_FORWARDED_FOR="8.8.9.9"
    )

    assert blocked.status_code == 429


@pytest.mark.django_db
def test_registration_is_limited_per_address(api_client):
    for _ in range(REGISTER_IP_LIMIT):
        assert (
            api_client.post(REGISTER_URL, {}, format="json", REMOTE_ADDR="10.3.3.3").status_code
            == 400
        )

    blocked = api_client.post(REGISTER_URL, {}, format="json", REMOTE_ADDR="10.3.3.3")

    assert blocked.status_code == 429
