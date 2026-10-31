import uuid

from django.db import migrations, models


def assign_existing_client_ids(apps, schema_editor):
    """Chaque vente historique reçoit son propre identifiant de synchronisation."""
    sale_model = apps.get_model("sales", "Sale")
    for sale in sale_model.objects.filter(client_id__isnull=True).iterator():
        sale_model.objects.filter(pk=sale.pk).update(client_id=uuid.uuid4())


class Migration(migrations.Migration):
    dependencies = [("sales", "0002_sale_cancellation_reason_sale_cancelled_at_and_more")]

    operations = [
        migrations.AddField(
            model_name="sale",
            name="client_id",
            field=models.UUIDField(editable=False, null=True),
        ),
        migrations.RunPython(assign_existing_client_ids, migrations.RunPython.noop),
        migrations.AlterField(
            model_name="sale",
            name="client_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
