"""Stockage durable des images catalogue dans Supabase Storage.

Les fichiers sont envoyés par Django avec une paire de clés S3 uniquement
présente sur Render. Le bucket est public : les photos du catalogue peuvent
donc être affichées directement par la PWA, sans transmettre de secret au
navigateur.
"""

from urllib.parse import quote

from django.conf import settings
from storages.backends.s3 import S3Storage


class SupabasePublicStorage(S3Storage):
    """Adaptateur S3 de Supabase avec des URL publiques stables.

    L'endpoint S3 est utilisé pour les écritures serveur. Les lectures dans
    l'application utilisent l'endpoint public de Supabase, prévu pour servir
    les objets d'un bucket public via son CDN.
    """

    def url(self, name, parameters=None, expire=None, http_method=None):
        del parameters, expire, http_method
        base_url = settings.SUPABASE_STORAGE_PUBLIC_URL.rstrip("/")
        encoded_name = quote(name, safe="/")
        return f"{base_url}/storage/v1/object/public/{self.bucket_name}/{encoded_name}"
