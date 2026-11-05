"""Diagnostic sans écriture de Supabase Storage, à lancer depuis Render Shell."""

from botocore.exceptions import BotoCoreError, ClientError
from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.core.files.storage import default_storage


class Command(BaseCommand):
    help = "Vérifie l'accès S3 au bucket Supabase sans créer ni supprimer de fichier."

    def handle(self, *args, **options):
        if not settings.USE_SUPABASE_STORAGE:
            raise CommandError("Supabase Storage est désactivé : vérifiez les variables SUPABASE_STORAGE_* sur Render.")

        self.stdout.write(f"Bucket : {settings.SUPABASE_STORAGE_BUCKET}")
        self.stdout.write(f"Endpoint : {settings.SUPABASE_STORAGE_S3_ENDPOINT}")
        try:
            default_storage.connection.meta.client.head_bucket(Bucket=settings.SUPABASE_STORAGE_BUCKET)
        except (BotoCoreError, ClientError) as exc:
            raise CommandError(f"Accès S3 refusé : {exc}") from exc
        self.stdout.write(self.style.SUCCESS("Connexion Supabase Storage validée."))
