from decimal import Decimal

from django.db import transaction
from django.db.models import Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from catalog.models import Product
from core.models import ExchangeRate
from inventory.models import StockMovement
from sales.models import Sale, SaleItem
from sales.serializers import CancelSaleSerializer, SaleCreateSerializer, SaleSerializer


def build_receipt_number(now) -> str:
    """Numéro lisible, tout en gardant l'UUID comme identifiant technique privé."""
    return f"{now:%y%m%d}-{Sale.objects.filter(created_at__date=now.date()).count() + 1:04d}"


def create_sale(shop, validated_data):
    """Crée une vente ou retourne la même vente si le téléphone la renvoie."""
    client_id = validated_data.get("client_id")
    if client_id:
        existing = Sale.objects.filter(shop=shop, client_id=client_id).prefetch_related("items").first()
        if existing:
            return existing, False
    rate = ExchangeRate.objects.filter(shop=shop).order_by("-effective_at").first()
    if rate is None:
        raise ValidationError({"exchange_rate": "Un taux du jour est requis."})
    requested = validated_data["items"]
    product_ids = [item["product_id"] for item in requested]
    with transaction.atomic():
        products = {product.id: product for product in Product.objects.select_for_update().filter(shop=shop, id__in=product_ids, is_active=True)}
        if len(products) != len(set(product_ids)):
            raise ValidationError({"items": "Un produit est introuvable."})
        requested_quantity = {}
        for item in requested:
            requested_quantity[item["product_id"]] = requested_quantity.get(item["product_id"], 0) + item["quantity"]
        for product_id, quantity in requested_quantity.items():
            available = StockMovement.objects.filter(product_id=product_id).aggregate(total=Sum("quantity_delta"))["total"] or 0
            if quantity > available:
                raise ValidationError({"items": "Stock insuffisant."})
        now = timezone.now(); currency = validated_data["currency"]; multiplier = rate.rate if currency == "CDF" else Decimal("1")
        total = sum((products[item["product_id"]].price_usd * multiplier * item["quantity"] for item in requested), Decimal("0"))
        sale_data = {"shop": shop, "receipt_number": build_receipt_number(now), "currency": currency, "exchange_rate": rate.rate, "total": total, "created_at": now}
        if client_id:
            sale_data["client_id"] = client_id
        sale = Sale.objects.create(**sale_data)
        for item in requested:
            product = products[item["product_id"]]; unit_price = product.price_usd * multiplier
            SaleItem.objects.create(sale=sale, product=product, name=product.name, quantity=item["quantity"], unit_price=unit_price, line_total=unit_price * item["quantity"])
            StockMovement.objects.create(shop=shop, product=product, quantity_delta=-item["quantity"], reason="sale", created_at=now)
    return sale, True


class SaleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sales = Sale.objects.filter(shop=request.user.shop).prefetch_related("items").order_by("-created_at")
        query = request.query_params.get("q")
        if query:
            sales = sales.filter(receipt_number__icontains=query)
        return Response(SaleSerializer(sales, many=True).data)

    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        sale, created = create_sale(request.user.shop, serializer.validated_data)
        return Response(SaleSerializer(sale).data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class SaleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, sale_id):
        sale = get_object_or_404(Sale.objects.prefetch_related("items"), id=sale_id, shop=request.user.shop)
        return Response(SaleSerializer(sale).data)


class SaleCancelView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, sale_id):
        serializer = CancelSaleSerializer(data=request.data); serializer.is_valid(raise_exception=True)
        with transaction.atomic():
            sale = get_object_or_404(Sale.objects.select_for_update().prefetch_related("items"), id=sale_id, shop=request.user.shop)
            if sale.cancelled_at:
                raise ValidationError({"sale": "Cette vente est déjà annulée."})
            now = timezone.now()
            for item in sale.items.all():
                StockMovement.objects.create(shop=sale.shop, product=item.product, quantity_delta=item.quantity, reason="sale_cancel", created_at=now)
            sale.cancelled_at = now; sale.cancellation_reason = serializer.validated_data.get("reason", ""); sale.save(update_fields=["cancelled_at", "cancellation_reason", "server_updated_at"])
        return Response(SaleSerializer(sale).data)
