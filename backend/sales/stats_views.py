from datetime import timedelta
from decimal import Decimal

from django.db.models import F, Sum
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from sales.models import Sale, SaleItem


def sales_for_period(shop, days):
    start = timezone.now() - timedelta(days=days)
    return Sale.objects.filter(shop=shop, created_at__gte=start, cancelled_at__isnull=True)


class StatsSummaryView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        days = max(1, int(request.query_params.get("days", 1))); sales = sales_for_period(request.user.shop, days)
        total = sales.aggregate(value=Sum("total"))["value"] or Decimal("0")
        cost = SaleItem.objects.filter(sale__in=sales).aggregate(value=Sum(F("product__purchase_price_usd") * F("quantity")))["value"] or Decimal("0")
        return Response({"revenue": total, "cost": cost, "profit": total - cost, "margin": round(float((total - cost) / total * 100), 1) if total else 0, "sales_count": sales.count()})


class StatsTopProductsView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        sales = sales_for_period(request.user.shop, int(request.query_params.get("days", 7)))
        rows = SaleItem.objects.filter(sale__in=sales).values("product_id", "name").annotate(quantity=Sum("quantity"), revenue=Sum("line_total")).order_by("-revenue")[:5]
        return Response(list(rows))
