"""Modèles partagés : devises, taux de change et classes abstraites (dossier §18.4).

Les classes abstraites donnent à chaque table synchronisée les mêmes colonnes techniques
(identifiant UUID, boutique, horloge du serveur...), écrites une seule fois (DRY).
"""

import uuid

from django.db import models
from django.db.models import F, Q


class Currency(models.Model):
    """Devise gérée par Doku (CDF, USD) : donnée de référence figée, clé naturelle ISO 4217."""

    code = models.CharField(max_length=3, primary_key=True)
    name = models.CharField(max_length=50)
    symbol = models.CharField(max_length=5)
    decimal_places = models.PositiveSmallIntegerField()

    class Meta:
        db_table = "currency"
        constraints = [
            models.CheckConstraint(condition=Q(decimal_places__lte=3), name="currency_decimals_ck")
        ]

    def __str__(self) -> str:
        return self.code


class ShopOwned(models.Model):
    """Base : UUID généré par le client, boutique propriétaire (tenant), horloge du serveur."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    shop = models.ForeignKey("accounts.Shop", on_delete=models.PROTECT)
    server_updated_at = models.DateTimeField(auto_now=True)  # curseur de la synchronisation

    class Meta:
        abstract = True


class Timestamped(ShopOwned):
    """Ajoute l'horloge de l'appareil, utile à l'affichage mais jamais pour ordonner."""

    created_at = models.DateTimeField()

    class Meta:
        abstract = True


class Mutable(Timestamped):
    """Données modifiables : version (détection de conflit) et suppression logique."""

    updated_at = models.DateTimeField()
    version = models.PositiveIntegerField(default=1)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class ExchangeRate(Timestamped):
    """Taux de change saisi par le commerçant. Table en ajout seul : jamais modifiée (RG-20)."""

    base_currency = models.ForeignKey(
        Currency, on_delete=models.PROTECT, db_column="base_currency_code", related_name="+"
    )
    quote_currency = models.ForeignKey(
        Currency, on_delete=models.PROTECT, db_column="quote_currency_code", related_name="+"
    )
    rate = models.DecimalField(max_digits=18, decimal_places=6)
    effective_at = models.DateTimeField()

    class Meta:
        db_table = "exchange_rate"
        constraints = [
            models.CheckConstraint(condition=Q(rate__gt=0), name="exrate_positive_ck"),
            models.CheckConstraint(
                condition=~Q(base_currency=F("quote_currency")), name="exrate_pair_ck"
            ),
        ]
        indexes = [
            models.Index(
                fields=["shop", "base_currency", "quote_currency", "-effective_at"],
                name="exrate_lookup_idx",
            ),
            models.Index(fields=["shop", "server_updated_at"], name="exrate_pull_idx"),
        ]
