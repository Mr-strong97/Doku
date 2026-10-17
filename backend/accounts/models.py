"""Compte du commerçant (app_user) et sa boutique (shop), dossier §9.3 et §18.4."""

import uuid

from django.conf import settings
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models

from accounts.phone import normalize_phone_number, validate_phone_number

DEFAULT_REFERENCE_CURRENCY = "CDF"


class UserManager(BaseUserManager):
    """Crée les comptes en normalisant le téléphone (identifiant de connexion)."""

    use_in_migrations = True

    def create_user(self, phone, password=None, **extra_fields):
        normalized_phone = normalize_phone_number(phone)
        if normalized_phone is None:
            raise ValueError("Numéro de téléphone invalide (format international attendu).")
        email = self.normalize_email(extra_fields.pop("email", None)) or None  # NULL, jamais ""
        user = self.model(phone=normalized_phone, email=email, **extra_fields)
        user.set_password(password)  # haché (Argon2), jamais stocké en clair
        user.save(using=self._db)
        return user

    def create_superuser(self, phone, password=None, **extra_fields):
        extra_fields.setdefault("is_staff", True)
        extra_fields.setdefault("is_superuser", True)
        return self.create_user(phone, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """Utilisateur de Doku. En MVP, c'est toujours le commerçant propriétaire (H-02)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    phone = models.CharField(max_length=20, unique=True, validators=[validate_phone_number])
    email = models.EmailField(max_length=254, unique=True, null=True, blank=True)  # noqa: DJ001
    full_name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # accès /admin/ (équipe technique)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["full_name"]

    objects = UserManager()

    class Meta:
        db_table = "app_user"  # « user » est un mot réservé de PostgreSQL

    def __str__(self) -> str:
        return self.phone


class Shop(models.Model):
    """Boutique du commerçant : racine d'isolation de toutes les données métier (RG-02)."""

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    owner = models.OneToOneField(  # MVP : une seule boutique par commerçant (H-03)
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="shop"
    )
    name = models.CharField(max_length=150)
    address = models.CharField(max_length=255, null=True, blank=True)  # noqa: DJ001
    phone = models.CharField(max_length=20, null=True, blank=True)  # noqa: DJ001
    reference_currency = models.ForeignKey(
        "core.Currency",
        on_delete=models.PROTECT,
        db_column="reference_currency_code",
        related_name="+",
        default=DEFAULT_REFERENCE_CURRENCY,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "shop"

    def __str__(self) -> str:
        return self.name
