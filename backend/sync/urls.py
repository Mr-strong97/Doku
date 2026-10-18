"""Routes de contrôle de la synchronisation, montées sous /api/v1/."""

from django.urls import path

from sync.views import HealthView, PullView, PushView

urlpatterns = [
    path("health/", HealthView.as_view(), name="sync-health"),
    path("sync/push/", PushView.as_view(), name="sync-push"),
    path("sync/pull/", PullView.as_view(), name="sync-pull"),
]
