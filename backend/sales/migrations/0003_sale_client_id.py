import uuid

from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("sales", "0002_sale_cancellation_reason_sale_cancelled_at_and_more")]

    operations = [
        migrations.AddField(
            model_name="sale",
            name="client_id",
            field=models.UUIDField(default=uuid.uuid4, editable=False, unique=True),
        ),
    ]
