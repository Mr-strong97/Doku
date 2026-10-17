"""Vues de l'authentification : POST /auth/register|login|refresh|logout/ (dossier §19.3).

Les vues restent minces : elles valident l'entrée, appellent un service (services.py),
puis posent le cookie. C'est la « View » de l'architecture, côté serveur.
"""

from django.conf import settings
from django.utils.cache import add_never_cache_headers
from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.cookies import clear_refresh_cookie, set_refresh_cookie
from accounts.exceptions import SessionExpiredError
from accounts.guards import ensure_trusted_client
from accounts.serializers import (
    AccessTokenSerializer,
    ErrorResponseSerializer,
    LoginSerializer,
    RegisterSerializer,
    SessionSerializer,
)
from accounts.services import (
    Session,
    authenticate_merchant,
    register_merchant,
    renew_session_tokens,
    revoke_refresh_token,
)
from accounts.throttling import LoginIpThrottle, LoginPhoneThrottle, RegisterIpThrottle

AUTH_TAG = ["Authentification"]
ERROR_RESPONSE = OpenApiResponse(response=ErrorResponseSerializer, description="Erreur")


def no_store(response: Response) -> Response:
    """Interdit tout cache (navigateur, proxy) : la réponse contient des jetons."""
    add_never_cache_headers(response)
    return response


def build_session_response(session: Session, status_code: int) -> Response:
    """Réponse commune à l'inscription et à la connexion (DRY) : JSON + cookie refresh."""
    response = Response(SessionSerializer(session).data, status=status_code)
    set_refresh_cookie(response, session.tokens.refresh)
    return response


def read_refresh_cookie(request: Request) -> str | None:
    """Lit le refresh token dans le cookie ; une valeur vide équivaut à « absent »."""
    return request.COOKIES.get(settings.REFRESH_COOKIE_NAME) or None


class PublicAuthView(APIView):
    """Base : ouverte à tous, et qui ignore un éventuel en-tête Authorization périmé
    (sinon un vieux jeton ferait échouer la connexion avec une erreur 401)."""

    authentication_classes = []
    permission_classes = [AllowAny]

    def finalize_response(self, request, response, *args, **kwargs):
        """Aucune réponse d'authentification (réussie ou en erreur) n'est mise en cache."""
        return no_store(super().finalize_response(request, response, *args, **kwargs))


@extend_schema(
    tags=AUTH_TAG,
    auth=[],
    summary="Créer le compte du commerçant et sa boutique (UC01)",
    request=RegisterSerializer,
    responses={201: SessionSerializer, 400: ERROR_RESPONSE, 429: ERROR_RESPONSE},
)
class RegisterView(PublicAuthView):
    throttle_classes = [RegisterIpThrottle]

    def post(self, request: Request) -> Response:
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = register_merchant(**serializer.validated_data)
        return build_session_response(session, status.HTTP_201_CREATED)


@extend_schema(
    tags=AUTH_TAG,
    auth=[],
    summary="Ouvrir une session avec le téléphone et le mot de passe (UC02)",
    request=LoginSerializer,
    responses={
        200: SessionSerializer,
        400: ERROR_RESPONSE,
        401: ERROR_RESPONSE,
        429: ERROR_RESPONSE,
    },
)
class LoginView(PublicAuthView):
    throttle_classes = [LoginPhoneThrottle, LoginIpThrottle]

    def post(self, request: Request) -> Response:
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = authenticate_merchant(request, **serializer.validated_data)
        return build_session_response(session, status.HTTP_200_OK)


@extend_schema(
    tags=AUTH_TAG,
    auth=[],
    summary="Renouveler le jeton d'accès avec le cookie refresh (rotation)",
    request=None,
    responses={200: AccessTokenSerializer, 401: ERROR_RESPONSE, 403: ERROR_RESPONSE},
)
class RefreshView(PublicAuthView):
    def post(self, request: Request) -> Response:
        ensure_trusted_client(request)
        refresh_token = read_refresh_cookie(request)
        if refresh_token is None:
            raise SessionExpiredError()
        tokens = renew_session_tokens(refresh_token)
        response = Response({"access": tokens.access})
        set_refresh_cookie(response, tokens.refresh)
        return response

    def handle_exception(self, exc: Exception) -> Response:
        """Une session expirée efface aussi le cookie devenu inutilisable."""
        response = super().handle_exception(exc)
        if isinstance(exc, SessionExpiredError):
            clear_refresh_cookie(response)
        return response


@extend_schema(
    tags=AUTH_TAG,
    auth=[],
    summary="Se déconnecter : révoque le refresh token et efface le cookie (UC03)",
    request=None,
    responses={204: None, 403: ERROR_RESPONSE},
)
class LogoutView(PublicAuthView):
    def post(self, request: Request) -> Response:
        ensure_trusted_client(request)
        refresh_token = read_refresh_cookie(request)
        if refresh_token is not None:
            revoke_refresh_token(refresh_token)
        response = Response(status=status.HTTP_204_NO_CONTENT)
        clear_refresh_cookie(response)  # la déconnexion réussit toujours : idempotente
        return response
