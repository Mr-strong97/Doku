"""Copie les anciennes photos locales vers le stockage configuré par Django."""

from django.conf import settings
from django.core.files import File
from django.core.files.storage import FileSystemStorage
from django.core.management.base import BaseCommand, CommandError

from catalog.models import Product


class Command(BaseCommand):
    help = "Copie les images de MEDIA_ROOT vers Supabase Storage sans modifier les ventes."

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Affiche les images à copier sans les envoyer.")

    def handle(self, *args, **options):
        target_storage = Product._meta.get_field("image").storage
        if target_storage.__class__.__module__.startswith("django.core.files.storage"):
            raise CommandError(
                "Le stockage Supabase n'est pas activé. Configurez les variables "
                "SUPABASE_STORAGE_* avant d'exécuter cette commande."
            )

        source_storage = FileSystemStorage(location=settings.MEDIA_ROOT, base_url=settings.MEDIA_URL)
        copied = skipped = missing = 0
        for product in Product.objects.exclude(image="").iterator():
            name = product.image.name
            if not source_storage.exists(name):
                self.stdout.write(self.style.WARNING(f"Introuvable localement : {name}"))
                missing += 1
                continue
            if target_storage.exists(name):
                self.stdout.write(f"Déjà présent : {name}")
                skipped += 1
                continue
            if options["dry_run"]:
                self.stdout.write(f"À copier : {name}")
                copied += 1
                continue
            with source_storage.open(name, "rb") as local_file:
                product.image.save(name, File(local_file), save=True)
            self.stdout.write(self.style.SUCCESS(f"Copié : {name}"))
            copied += 1

        self.stdout.write(
            self.style.SUCCESS(f"Terminé — {copied} copié(s), {skipped} déjà présent(s), {missing} introuvable(s).")
        )
