"""Routes d'authentification, montées sous /api/v1/auth/ (dossier §19.3)."""

from django.urls import path

from accounts.views import LoginView, LogoutView, RefreshView, RegisterView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("refresh/", RefreshView.as_view(), name="auth-refresh"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
]
