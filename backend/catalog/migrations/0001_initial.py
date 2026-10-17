import django.db.models.deletion
import uuid
from decimal import Decimal
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts", "0002_initial")]
    operations = [
        migrations.CreateModel(name="Category", fields=[("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)), ("server_updated_at", models.DateTimeField(auto_now=True)), ("created_at", models.DateTimeField()), ("updated_at", models.DateTimeField()), ("version", models.PositiveIntegerField(default=1)), ("deleted_at", models.DateTimeField(blank=True, null=True)), ("name", models.CharField(max_length=80)), ("shop", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="accounts.shop"))], options={"db_table": "category"}),
        migrations.CreateModel(name="Product", fields=[("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)), ("server_updated_at", models.DateTimeField(auto_now=True)), ("created_at", models.DateTimeField()), ("updated_at", models.DateTimeField()), ("version", models.PositiveIntegerField(default=1)), ("deleted_at", models.DateTimeField(blank=True, null=True)), ("name", models.CharField(max_length=150)), ("price_usd", models.DecimalField(decimal_places=2, default=Decimal("0"), max_digits=14)), ("is_active", models.BooleanField(default=True)), ("category", models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.PROTECT, related_name="products", to="catalog.category")), ("shop", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="accounts.shop"))], options={"db_table": "product"}),
        migrations.AddConstraint(model_name="category", constraint=models.UniqueConstraint(fields=("shop", "name"), name="category_shop_name_uniq")),
        migrations.AddIndex(model_name="product", index=models.Index(fields=["shop", "name"], name="product_shop_name_idx")),
    ]
