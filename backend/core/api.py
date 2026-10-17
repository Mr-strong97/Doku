"""Format d'erreur unique de l'API (dossier §19.4 et §17.8).

Toutes les erreurs ont la même forme, quel que soit leur type :

    {"error": {"code": "VALIDATION_ERROR", "message": "...", "details": {...}}}

Le client (Axios) n'a ainsi qu'un seul format à décoder, et aucun détail interne (trace
d'exécution, requête SQL) ne fuit jamais dans une réponse.
"""

import logging
import math

from django.core.exceptions import PermissionDenied as DjangoPermissionDenied
from django.http import Http404
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.views import set_rollback

logger = logging.getLogger(__name__)

SERVER_ERROR_MESSAGE = "Une erreur est survenue. Réessayez dans un instant."
VALIDATION_MESSAGE = "Données invalides."
THROTTLED_MESSAGE = "Trop de tentatives. Réessayez dans quelques instants."

# Codes stables exposés au client ; DRF les écrit en minuscules par défaut.
CODE_ALIASES = {"permission_denied": "FORBIDDEN", "not_authenticated": "UNAUTHENTICATED"}


def build_error_body(code: str, message: str, details=None) -> dict:
    """Construit le corps JSON d'une erreur."""
    return {"error": {"code": code, "message": message, "details": details}}


def to_plain_details(detail):
    """Convertit les ErrorDetail de DRF en texte simple (dict, liste ou chaîne)."""
    if isinstance(detail, dict):
        return {key: to_plain_details(value) for key, value in detail.items()}
    if isinstance(detail, list):
        return [to_plain_details(item) for item in detail]
    return str(detail)


def describe_exception(exc: exceptions.APIException) -> tuple[str, str, object]:
    """Retourne (code, message, détails) d'une exception DRF."""
    if isinstance(exc, exceptions.ValidationError):
        return "VALIDATION_ERROR", VALIDATION_MESSAGE, to_plain_details(exc.detail)
    if isinstance(exc, exceptions.Throttled):
        retry_after = math.ceil(exc.wait) if exc.wait else None
        return "THROTTLED", THROTTLED_MESSAGE, {"retry_after": retry_after}
    code = str(exc.get_codes())
    return CODE_ALIASES.get(code, code.upper()), str(exc.detail), None


def normalize_exception(exc: Exception) -> Exception:
    """Remplace les exceptions Django par leurs équivalents DRF (comme le fait DRF)."""
    if isinstance(exc, Http404):
        return exceptions.NotFound()
    if isinstance(exc, DjangoPermissionDenied):
        return exceptions.PermissionDenied()
    return exc


def build_server_error_response(exc: Exception) -> Response:
    """Erreur inattendue : détail dans les journaux du serveur, message neutre au client."""
    logger.error("Erreur serveur non gérée", exc_info=exc)
    set_rollback()
    body = build_error_body("SERVER_ERROR", SERVER_ERROR_MESSAGE)
    return Response(body, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def exception_handler(exc: Exception, context: dict) -> Response:
    """Gestionnaire d'exceptions DRF branché dans REST_FRAMEWORK['EXCEPTION_HANDLER']."""
    exc = normalize_exception(exc)
    response = drf_exception_handler(exc, context)  # conserve Retry-After, WWW-Authenticate...
    if response is None:
        return build_server_error_response(exc)
    code, message, details = describe_exception(exc)
    response.data = build_error_body(code, message, details)
    return response
