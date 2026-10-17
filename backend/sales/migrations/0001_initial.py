import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = [("accounts", "0002_initial"), ("catalog", "0001_initial")]
    operations = [
        migrations.CreateModel(name="Sale", fields=[("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)), ("server_updated_at", models.DateTimeField(auto_now=True)), ("created_at", models.DateTimeField()), ("currency", models.CharField(choices=[("CDF", "CDF"), ("USD", "USD")], max_length=3)), ("exchange_rate", models.DecimalField(decimal_places=6, max_digits=18)), ("total", models.DecimalField(decimal_places=2, max_digits=18)), ("shop", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="accounts.shop"))], options={"db_table": "sale"}),
        migrations.CreateModel(name="SaleItem", fields=[("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")), ("name", models.CharField(max_length=150)), ("quantity", models.PositiveIntegerField()), ("unit_price", models.DecimalField(decimal_places=2, max_digits=18)), ("line_total", models.DecimalField(decimal_places=2, max_digits=18)), ("product", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, to="catalog.product")), ("sale", models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name="items", to="sales.sale"))], options={"db_table": "sale_item"}),
        migrations.AddConstraint(model_name="sale", constraint=models.CheckConstraint(condition=models.Q(("total__gte", 0)), name="sale_total_positive_ck")),
        migrations.AddConstraint(model_name="saleitem", constraint=models.CheckConstraint(condition=models.Q(("quantity__gt", 0)), name="sale_item_quantity_ck")),
    ]
