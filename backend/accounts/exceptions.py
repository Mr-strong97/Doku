"""Erreurs métier de l'authentification, converties en réponses JSON par core.api."""

from rest_framework import status
from rest_framework.exceptions import APIException, PermissionDenied, ValidationError

from accounts import messages


class InvalidCredentialsError(APIException):
    """Téléphone ou mot de passe incorrect : message volontairement identique dans tous les
    cas (compte inconnu, mauvais mot de passe, compte désactivé) pour ne rien révéler."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = messages.INVALID_CREDENTIALS
    default_code = "INVALID_CREDENTIALS"


class SessionExpiredError(APIException):
    """Le refresh token est absent, expiré, révoqué ou falsifié : il faut se reconnecter."""

    status_code = status.HTTP_401_UNAUTHORIZED
    default_detail = messages.SESSION_EXPIRED
    default_code = "SESSION_EXPIRED"


class UntrustedClientError(PermissionDenied):
    """Requête vers un endpoint à cookie sans l'en-tête de confiance ou depuis une origine
    inconnue (protection CSRF)."""

    default_detail = messages.REQUEST_REFUSED
    default_code = "FORBIDDEN"


class PhoneAlreadyUsedError(ValidationError):
    """Le téléphone est déjà associé à un compte (affiché sous le champ téléphone)."""

    def __init__(self) -> None:
        super().__init__({"phone": [messages.PHONE_TAKEN]})
