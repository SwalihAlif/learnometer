from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import stripe
from django.conf import settings
from .models import LearnerPremiumSubscription
import logging

stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

class CreatePremiumCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"{user} - trying to create primium checkout..")

        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                mode='payment',
                line_items=[{
                    'price': 'price_1RlFVuDImcjUFRaizJbsxcBx', 
                    'quantity': 1,
                }],
                success_url=f"{settings.FRONTEND_URL}/learner/premium-success/",
                cancel_url=f"{settings.FRONTEND_URL}/learner/premium-cancel/",
                customer_email=user.email,
                metadata={
                    "user_id": user.id,
                    "purpose": "learner_premium_subscription",
                }
            )

            # Save or update LearnerPremiumSubscription
            subscription, created = LearnerPremiumSubscription.objects.get_or_create(user=user)
            subscription.stripe_checkout_session_id = session.id
            subscription.is_active = False  # Until payment is confirmed via webhook
            subscription.save()

            return Response({"checkout_url": session.url})

        except Exception as e:
            return Response({"error": str(e)}, status=500)
