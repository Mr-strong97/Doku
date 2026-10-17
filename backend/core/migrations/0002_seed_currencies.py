"""Données de référence : les deux devises gérées par Doku (dossier §13.2, tableau 13.1).

Cette migration de DONNÉES est indispensable : la boutique référence une devise (CDF par
défaut) et le serveur refuse de créer une boutique si la devise n'existe pas.
"""

from django.db import migrations

CURRENCIES = [
    # (code ISO 4217, libellé, symbole, nombre de décimales)
    ("CDF", "Franc congolais", "FC", 0),  # les centimes ne s'utilisent pas en pratique (H-10)
    ("USD", "Dollar américain", "$", 2),
]


def seed_currencies(apps, schema_editor):
    Currency = apps.get_model("core", "Currency")
    for code, name, symbol, decimal_places in CURRENCIES:
        Currency.objects.update_or_create(
            code=code,
            defaults={"name": name, "symbol": symbol, "decimal_places": decimal_places},
        )


class Migration(migrations.Migration):
    dependencies = [("core", "0001_initial")]

    # Retour arrière : on ne supprime rien, des boutiques peuvent déjà référencer ces devises.
    operations = [migrations.RunPython(seed_currencies, migrations.RunPython.noop)]
