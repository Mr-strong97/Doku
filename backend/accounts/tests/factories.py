"""Fabriques de données de test (factory-boy)."""

import factory
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password

from accounts.models import Shop

TEST_PASSWORD = "Sucre-et-Cafe-2026"


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = get_user_model()

    phone = factory.Sequence(lambda number: f"+24381{number:07d}")
    full_name = "Rose Mbuyi"
    password = factory.LazyFunction(lambda: make_password(TEST_PASSWORD))


class ShopFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Shop

    owner = factory.SubFactory(UserFactory)
    name = "Boutique Maman Rose"
