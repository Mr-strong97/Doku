"""Serializers de l'authentification : validation des entrées et forme des sorties.

Règle de sécurité (dossier §17.4) : le serveur revalide TOUT, la validation du client
React n'est qu'un confort. Les champs inconnus (is_staff, shop_id...) sont ignorés :
un client ne peut jamais s'attribuer de droits en les ajoutant à la requête.
"""

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import serializers

from accounts import messages
from accounts.models import Shop
from accounts.phone import normalize_phone_number
from accounts.validators import validate_plain_text

User = get_user_model()

NAME_MIN_LENGTH = 2
NAME_MAX_LENGTH = 150
PHONE_INPUT_MAX_LENGTH = 40  # avant normalisation : espaces et tirets compris
PASSWORD_MAX_LENGTH = 128  # évite de faire hacher un texte géant (déni de service)


class PhoneField(serializers.CharField):
    """Champ téléphone : tolère les séparateurs et retourne toujours le format E.164."""

    def __init__(self, **kwargs):
        kwargs.setdefault("max_length", PHONE_INPUT_MAX_LENGTH)
        super().__init__(**kwargs)

    def to_internal_value(self, data):
        phone = normalize_phone_number(super().to_internal_value(data))
        if phone is None:
            raise serializers.ValidationError(messages.PHONE_INVALID)
        return phone


class PasswordField(serializers.CharField):
    """Mot de passe : jamais renvoyé, jamais « nettoyé » (les espaces comptent)."""

    def __init__(self, **kwargs):
        kwargs.update(write_only=True, trim_whitespace=False, max_length=PASSWORD_MAX_LENGTH)
        super().__init__(**kwargs)


def build_name_field(**kwargs) -> serializers.CharField:
    """Champ « nom » (commerçant ou boutique) : longueur bornée, texte sans contrôle."""
    return serializers.CharField(
        min_length=NAME_MIN_LENGTH, max_length=NAME_MAX_LENGTH, validators=[validate_plain_text], **kwargs
    )


class RegisterSerializer(serializers.Serializer):
    """Entrée de POST /auth/register/ (UC01)."""

    full_name = build_name_field()
    phone = PhoneField()
    password = PasswordField()
    shop_name = build_name_field()

    def validate_phone(self, value: str) -> str:
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError(messages.PHONE_TAKEN)
        return value

    def validate(self, attrs: dict) -> dict:
        """Applique la politique de mot de passe de Django (longueur, mots courants...)."""
        candidate = User(phone=attrs["phone"], full_name=attrs["full_name"])
        try:
            validate_password(attrs["password"], user=candidate)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"password": list(error.messages)}) from error
        return attrs


class LoginSerializer(serializers.Serializer):
    """Entrée de POST /auth/login/ (UC02)."""

    phone = PhoneField()
    password = PasswordField()


class UserSerializer(serializers.ModelSerializer):
    """Profil du commerçant, copié dans la base locale du téléphone (lecture seule)."""

    class Meta:
        model = User
        fields = ["id", "phone", "full_name", "email"]
        read_only_fields = fields


class UserProfileSerializer(serializers.ModelSerializer):
    """Profil modifiable du commerçant, isolé de la réponse de session."""

    phone = PhoneField(required=False)
    full_name = build_name_field(required=False)

    class Meta:
        model = User
        fields = ["id", "phone", "full_name", "email"]
        read_only_fields = ["id"]

    def validate_email(self, value: str | None) -> str | None:
        if value and User.objects.exclude(pk=self.instance.pk).filter(email=value).exists():
            raise serializers.ValidationError("Cette adresse e-mail est déjà utilisée.")
        return value

    def validate_phone(self, value: str) -> str:
        if User.objects.exclude(pk=self.instance.pk).filter(phone=value).exists():
            raise serializers.ValidationError(messages.PHONE_TAKEN)
        return value


class ChangePasswordSerializer(serializers.Serializer):
    """Entrée de changement de mot de passe : aucune valeur sensible ne ressort."""

    current_password = PasswordField()
    new_password = PasswordField()

    def validate_current_password(self, value: str) -> str:
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Le mot de passe actuel est incorrect.")
        return value

    def validate(self, attrs: dict) -> dict:
        try:
            validate_password(attrs["new_password"], user=self.context["request"].user)
        except DjangoValidationError as error:
            raise serializers.ValidationError({"new_password": list(error.messages)}) from error
        return attrs


class ShopSerializer(serializers.ModelSerializer):
    """Boutique du commerçant, copiée dans la base locale du téléphone (lecture seule)."""

    reference_currency_code = serializers.CharField(source="reference_currency_id", read_only=True)

    class Meta:
        model = Shop
        fields = ["id", "name", "address", "phone", "reference_currency_code"]
        read_only_fields = fields


class SessionSerializer(serializers.Serializer):
    """Sortie de login et register : jeton d'accès + profil + état de la configuration."""

    access = serializers.CharField(source="tokens.access")
    user = UserSerializer()
    shop = ShopSerializer()
    onboarding_completed = serializers.BooleanField()


class AccessTokenSerializer(serializers.Serializer):
    """Sortie de POST /auth/refresh/ : seulement le nouveau jeton d'accès."""

    access = serializers.CharField()


class ErrorBodySerializer(serializers.Serializer):
    code = serializers.CharField()
    message = serializers.CharField()
    details = serializers.JSONField(allow_null=True)


class ErrorResponseSerializer(serializers.Serializer):
    """Documentation du format d'erreur unique (dossier §19.4)."""

    error = ErrorBodySerializer()
