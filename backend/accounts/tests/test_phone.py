"""Tests unitaires de la normalisation des numéros de téléphone (format E.164)."""

import pytest
from django.core.exceptions import ValidationError

from accounts.phone import normalize_phone_number, validate_phone_number


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("+243810000001", "+243810000001"),
        ("+243 81 000 0001", "+243810000001"),
        ("+243-81-000-0001", "+243810000001"),
        (" +243 (81) 000 0001 ", "+243810000001"),
        ("+33612345678", "+33612345678"),  # un autre pays reste accepté par le serveur
    ],
)
def test_normalize_accepts_valid_numbers(raw, expected):
    assert normalize_phone_number(raw) == expected


@pytest.mark.parametrize(
    "raw",
    [
        None,
        "",
        "810000001",  # sans préfixe international
        "0810000001",
        "00243810000001",
        "+2438100000",  # trop court pour la RDC
        "+24381000000012",  # trop long pour la RDC
        "+243081000001",  # le 0 national ne se garde pas après +243
        "+0243810000001",
        "+243abc000001",
        "++243810000001",
        "+٢٤٣٨١٠٠٠٠٠٠١",  # chiffres arabes : refusés pour éviter les doublons trompeurs
        "+243810000001; DROP TABLE app_user",
    ],
)
def test_normalize_rejects_invalid_numbers(raw):
    assert normalize_phone_number(raw) is None


def test_validate_phone_number_requires_normalized_value():
    validate_phone_number("+243810000001")
    with pytest.raises(ValidationError):
        validate_phone_number("+243 81 000 0001")  # il faut normaliser avant d'enregistrer
