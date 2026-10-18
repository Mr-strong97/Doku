"""Vente et lignes figées au moment de l'encaissement."""

from django.db import models
from django.db.models import Q

from core.models import Timestamped


class Sale(Timestamped):
    # Les éventuelles ventes créées avant P06 n'avaient pas de numéro de reçu.
    receipt_number = models.CharField(max_length=32, unique=True, null=True, blank=True)
    currency = models.CharField(max_length=3, choices=[("CDF", "CDF"), ("USD", "USD")])
    exchange_rate = models.DecimalField(max_digits=18, decimal_places=6)
    total = models.DecimalField(max_digits=18, decimal_places=2)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=255, blank=True)

    class Meta:
        db_table = "sale"
        constraints = [models.CheckConstraint(condition=Q(total__gte=0), name="sale_total_positive_ck")]


class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.PROTECT, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT)
    name = models.CharField(max_length=150)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=18, decimal_places=2)
    line_total = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        db_table = "sale_item"
        constraints = [models.CheckConstraint(condition=Q(quantity__gt=0), name="sale_item_quantity_ck")]
