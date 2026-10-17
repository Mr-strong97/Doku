"""Catalogue appartenant à une boutique, sans prix flottants."""

from decimal import Decimal

from django.db import models

from core.models import Mutable


class Category(Mutable):
    name = models.CharField(max_length=80)

    class Meta:
        db_table = "category"
        constraints = [models.UniqueConstraint(fields=["shop", "name"], name="category_shop_name_uniq")]


class Product(Mutable):
    category = models.ForeignKey(Category, null=True, blank=True, on_delete=models.PROTECT, related_name="products")
    name = models.CharField(max_length=150)
    price_usd = models.DecimalField(max_digits=14, decimal_places=2, default=Decimal("0"))
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "product"
        indexes = [models.Index(fields=["shop", "name"], name="product_shop_name_idx")]
