"""Le stock courant et son journal immuable."""

from django.db import models
from django.db.models import Q

from core.models import Timestamped


class StockMovement(Timestamped):
    product = models.ForeignKey("catalog.Product", on_delete=models.PROTECT, related_name="stock_movements")
    quantity_delta = models.IntegerField()
    reason = models.CharField(max_length=32)

    class Meta:
        db_table = "stock_movement"
        constraints = [models.CheckConstraint(condition=~Q(quantity_delta=0), name="stock_movement_nonzero_ck")]
