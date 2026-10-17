from decimal import Decimal

from django.db import transaction
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
from sales.serializers import SaleCreateSerializer


class SaleCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SaleCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        shop = request.user.shop
        rate = ExchangeRate.objects.filter(shop=shop).order_by("-effective_at").first()
        if rate is None:
            raise ValidationError({"exchange_rate": "Un taux du jour est requis."})
        requested = serializer.validated_data["items"]
        product_ids = [item["product_id"] for item in requested]
        with transaction.atomic():
            products = {product.id: product for product in Product.objects.select_for_update().filter(shop=shop, id__in=product_ids, is_active=True)}
            if len(products) != len(set(product_ids)):
                raise ValidationError({"items": "Un produit est introuvable."})
            stock_by_product = {product_id: sum(m.quantity_delta for m in StockMovement.objects.filter(product_id=product_id)) for product_id in products}
            quantities = {}
            for item in requested:
                quantities[item["product_id"]] = quantities.get(item["product_id"], 0) + item["quantity"]
            for product_id, quantity in quantities.items():
                if quantity > stock_by_product[product_id]:
                    raise ValidationError({"items": "Stock insuffisant."})
            currency = serializer.validated_data["currency"]
            multiplier = rate.rate if currency == "CDF" else Decimal("1")
            total = sum((products[item["product_id"]].price_usd * multiplier * item["quantity"] for item in requested), Decimal("0"))
            sale = Sale.objects.create(shop=shop, currency=currency, exchange_rate=rate.rate, total=total, created_at=timezone.now())
            for item in requested:
                product = products[item["product_id"]]
                unit_price = product.price_usd * multiplier
                SaleItem.objects.create(sale=sale, product=product, name=product.name, quantity=item["quantity"], unit_price=unit_price, line_total=unit_price * item["quantity"])
                StockMovement.objects.create(shop=shop, product=product, quantity_delta=-item["quantity"], reason="sale", created_at=timezone.now())
        return Response({"id": str(sale.id), "total": str(sale.total), "currency": sale.currency}, status=status.HTTP_201_CREATED)
