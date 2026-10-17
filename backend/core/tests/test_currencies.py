"""Tests des devises de référence et des garde-fous de la table des taux de change."""

from decimal import Decimal

import pytest
from django.db import IntegrityError, transaction
from django.utils import timezone

from accounts.tests.factories import ShopFactory
from core.models import Currency, ExchangeRate


@pytest.mark.django_db
def test_cdf_and_usd_are_seeded_with_their_precision():
    assert Currency.objects.get(code="CDF").decimal_places == 0  # pas de centimes
    assert Currency.objects.get(code="USD").decimal_places == 2


@pytest.mark.django_db
def test_a_new_shop_uses_cdf_as_reference_currency():
    assert ShopFactory().reference_currency_id == "CDF"


@pytest.mark.django_db
@pytest.mark.parametrize(
    ("base", "quote", "rate"),
    [("USD", "USD", "2800"), ("USD", "CDF", "0"), ("USD", "CDF", "-5")],
    ids=["même devise", "taux nul", "taux négatif"],
)
def test_database_refuses_inconsistent_exchange_rates(base, quote, rate):
    """Dernier filet de sécurité : la base elle-même refuse les taux incohérents."""
    shop, now = ShopFactory(), timezone.now()

    with pytest.raises(IntegrityError), transaction.atomic():
        ExchangeRate.objects.create(
            shop=shop,
            base_currency_id=base,
            quote_currency_id=quote,
            rate=Decimal(rate),
            effective_at=now,
            created_at=now,
        )
