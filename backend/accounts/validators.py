"""Validateurs de texte partagés par les serializers."""

import unicodedata

from rest_framework import serializers

from accounts import messages


def validate_plain_text(value: str) -> str:
    """Refuse les caractères de contrôle (retours arrière, séquences d'échappement...)."""
    if any(unicodedata.category(character).startswith("C") for character in value):
        raise serializers.ValidationError(messages.TEXT_INVALID)
    return value
