import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts", "0002_initial"), ("catalog", "0001_initial")]
    operations = [migrations.CreateModel(name="StockMovement", fields=[("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)), ("server_updated_at", models.DateTimeField(auto_now=True)), ("created_at", models.DateTimeField()), ("quantity_delta", models.IntegerField()), ("reason", models.CharField(max_length=32)), ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="stock_movements", to="catalog.product")), ("shop", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="accounts.shop"))], options={"db_table": "stock_movement"}), migrations.AddConstraint(model_name="stockmovement", constraint=models.CheckConstraint(condition=~models.Q(("quantity_delta", 0)), name="stock_movement_nonzero_ck"))]
