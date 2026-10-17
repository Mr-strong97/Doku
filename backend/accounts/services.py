"""Services métier de l'authentification (AuthService, dossier §7.3).

Les vues ne contiennent aucune règle : elles appellent ces fonctions, qui se testent aussi
sans serveur HTTP. C'est le « Presenter » de l'architecture : il orchestre les modèles.
"""

import logging
from dataclasses import dataclass

from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.models import update_last_login
from django.db import IntegrityError, transaction
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from accounts.exceptions import InvalidCredentialsError, PhoneAlreadyUsedError, SessionExpiredError
from accounts.models import Shop
from core.models import ExchangeRate

logger = logging.getLogger(__name__)
User = get_user_model()


@dataclass(frozen=True)
class TokenPair:
    """Couple de jetons : access (15 min, gardé en mémoire) et refresh (30 jours, cookie)."""

    access: str
    refresh: str


@dataclass(frozen=True)
class Session:
    """Ce qu'une connexion ou une inscription réussie renvoie au client."""

    # pyrefly: ignore [invalid-annotation]
    user: User
    shop: Shop
    tokens: TokenPair
    onboarding_completed: bool


def has_completed_onboarding(shop: Shop) -> bool:
    """La configuration initiale est terminée dès qu'un taux de change existe (§13.3)."""
    return ExchangeRate.objects.filter(shop=shop).exists()


# pyrefly: ignore [invalid-annotation]
def open_session(user: User, shop: Shop) -> Session:
    """Émet les jetons et note la connexion (SimpleJWT ne le fait que dans ses propres vues)."""
    update_last_login(None, user)
    refresh = RefreshToken.for_user(user)
    tokens = TokenPair(access=str(refresh.access_token), refresh=str(refresh))
    return Session(user, shop, tokens, has_completed_onboarding(shop))


def register_merchant(*, full_name: str, phone: str, password: str, shop_name: str) -> Session:
    """Crée le compte ET la boutique dans une seule transaction (UC01, séquence 4).

    Si la boutique échoue, le compte n'est pas créé non plus : jamais de commerçant sans
    boutique.
    """
    try:
        with transaction.atomic():
            user = User.objects.create_user(phone=phone, password=password, full_name=full_name)
            shop = Shop.objects.create(owner=user, name=shop_name)
    except IntegrityError:
        if User.objects.filter(phone=phone).exists():  # deux inscriptions simultanées
            raise PhoneAlreadyUsedError() from None
        raise
    return open_session(user, shop)


def authenticate_merchant(request, *, phone: str, password: str) -> Session:
    """Vérifie téléphone + mot de passe (UC02).

    Compte inconnu, mauvais mot de passe, compte désactivé ou compte sans boutique donnent
    la même erreur : on ne révèle jamais lequel des cas s'est produit.
    """
    user = authenticate(request, username=phone, password=password)
    shop = Shop.objects.filter(owner=user).first() if user else None
    if user is None or shop is None:
        logger.warning("login_failed")  # volontairement sans identifiant dans le journal
        raise InvalidCredentialsError()
    logger.info("login_success user_id=%s", user.id)
    return open_session(user, shop)


def renew_session_tokens(refresh_token: str) -> TokenPair:
    """Échange un refresh token contre un nouveau couple de jetons (rotation, §17.2).

    L'ancien refresh est mis en liste noire : le présenter une seconde fois (vol possible)
    est refusé et journalisé.
    """
    serializer = TokenRefreshSerializer(data={"refresh": refresh_token})
    try:
        serializer.is_valid(raise_exception=True)
    except (TokenError, AuthenticationFailed, ValidationError, User.DoesNotExist) as error:
        logger.warning("refresh_rejected reason=%s: %s", type(error).__name__, error)
        raise SessionExpiredError() from error
    data = serializer.validated_data
    return TokenPair(access=data["access"], refresh=data["refresh"])


def revoke_refresh_token(refresh_token: str) -> None:
    """Met le refresh token en liste noire (déconnexion). Un jeton déjà inutilisable est ignoré."""
    try:
        RefreshToken(refresh_token).blacklist()
    except TokenError:
        logger.info("logout_with_unusable_token")
