"""Validation et normalisation des numéros de téléphone (format E.164, dossier H-01).

Le téléphone est l'identifiant de connexion : il doit avoir UNE seule écriture possible,
sinon « +243 81 000 0001 » et « +243810000001 » créeraient deux comptes différents.
"""

import re

from django.core.exceptions import ValidationError

from accounts import messages

# [0-9] et non \d : \d accepterait aussi des chiffres d'autres alphabets (arabe, indien...)
E164_PATTERN = re.compile(r"\+[1-9][0-9]{7,14}")
SEPARATORS_PATTERN = re.compile(r"[\s.\-()]")

DRC_DIAL_CODE = "+243"
# Un numéro congolais compte 9 chiffres après +243, et ne commence jamais par 0 : le « 0 »
# national (081…) se retire quand on écrit le numéro au format international.
DRC_NUMBER_PATTERN = re.compile(r"\+243[1-9][0-9]{8}")


def normalize_phone_number(raw_number: str | None) -> str | None:
    """Retourne le numéro au format E.164 (« +243810000001 »), ou None s'il est invalide."""
    cleaned = SEPARATORS_PATTERN.sub("", raw_number or "")
    if not E164_PATTERN.fullmatch(cleaned):
        return None
    if cleaned.startswith(DRC_DIAL_CODE) and not DRC_NUMBER_PATTERN.fullmatch(cleaned):
        return None
    return cleaned


def validate_phone_number(value: str) -> None:
    """Validateur de champ Django : n'accepte que le format E.164 déjà normalisé."""
    if normalize_phone_number(value) != value:
        raise ValidationError(messages.PHONE_INVALID, code=messages.PHONE_INVALID_CODE)
