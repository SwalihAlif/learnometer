from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import stripe
import uuid
from django.conf import settings
from .models import LearnerPremiumSubscription, ReferralCode, ReferralEarning, LearnerPayout
from mentorship.models import StripeAccount
import logging
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from decimal import Decimal
from .models import Wallet
from .serializers import WalletSerializer


stripe.api_key = settings.STRIPE_SECRET_KEY

logger = logging.getLogger(__name__)

# ----------------------------
# Learner create Stripe account
# ----------------------------
class CreateLearnerPaymentAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        try:
            # Ensure StripeAccount exists with learner account_type
            stripe_account, _ = StripeAccount.objects.get_or_create(
                user=user,
                account_type="learner",
                defaults={
                    "stripe_account_id": "",
                    "setup_complete": False,
                    "onboarding_complete": False,
                    "is_active": True,
                }
            )

            if not stripe_account.stripe_account_id:
                account = stripe.Account.create(
                    type="express",
                    country="US",  
                    email=user.email,
                    capabilities={"transfers": {"requested": True}},
                )
                stripe_account.stripe_account_id = account.id
                stripe_account.save()
                logger.info(f"Stripe Connect account created for learner {user.email}")

                # Sync onboarding status again just to be safe
            account = stripe.Account.retrieve(stripe_account.stripe_account_id)
            stripe_account.onboarding_complete = (account.capabilities.get("transfers") == "active")
            stripe_account.save()

            if not stripe_account.onboarding_complete:
                onboarding_link = stripe.AccountLink.create(
                    account=stripe_account.stripe_account_id,
                    refresh_url=f"{settings.FRONTEND_URL}/stripe/onboarding/refresh/",
                    return_url=f"{settings.FRONTEND_URL}/learner/premium/",
                    type="account_onboarding",
                )
                return Response({
                    "onboarding_required": True,
                    "onboarding_url": onboarding_link.url
                })

            return Response({
                "onboarding_required": False,
                "message": "Stripe onboarding already completed"
            })



        except Exception as e:
            logger.exception("Error during admin stripe creation")
            return Response({"error": str(e)}, status=500)
        

# ----------------------------
# Learner Premium Checkout view
# ----------------------------
class CreatePremiumCheckoutSessionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        referral_code_used = request.data.get('referral_code')

        try:
            # Ensure learner premium subscription exists
            subscription, _ = LearnerPremiumSubscription.objects.get_or_create(user=user)

            # Ensure StripeAccount exists with learner account_type
            stripe_account, _ = StripeAccount.objects.get_or_create(
                user=user,
                account_type="learner",
                defaults={
                    "stripe_account_id": "",
                    "setup_complete": False,
                    "onboarding_complete": False,
                    "is_active": True,
                }
            )

            if not stripe_account.stripe_account_id:
                account = stripe.Account.create(
                    type="express",
                    country="US",  
                    email=user.email,
                    capabilities={"transfers": {"requested": True}},
                )
                stripe_account.stripe_account_id = account.id
                stripe_account.save()
                logger.info(f"Stripe Connect account created for learner {user.email}")

            # Sync onboarding status again just to be safe
            account = stripe.Account.retrieve(stripe_account.stripe_account_id)
            stripe_account.onboarding_complete = (account.capabilities.get("transfers") == "active")
            stripe_account.save()

            if not stripe_account.onboarding_complete:
                onboarding_link = stripe.AccountLink.create(
                    account=stripe_account.stripe_account_id,
                    refresh_url=f"{settings.FRONTEND_URL}/stripe/onboarding/refresh/",
                    return_url=f"{settings.FRONTEND_URL}/learner/premium/",
                    type="account_onboarding",
                )
                return Response({
                    "onboarding_required": True,
                    "onboarding_url": onboarding_link.url
                })

            # Ensure Referral Code exists for learner
            ReferralCode.objects.get_or_create(user=user, defaults={"code": uuid.uuid4().hex[:8].upper()})

            # Validate Referral Code and Get Transfer Destination
            transfer_destination = None
            if referral_code_used:
                try:
                    referrer_entry = ReferralCode.objects.get(code=referral_code_used)
                    referrer = referrer_entry.user

                    if referrer == user:
                        return Response({"error": "You cannot use your own referral code."}, status=400)

                    if not getattr(referrer, 'premium_subscription', None) or not referrer.premium_subscription.is_active:
                        return Response({"error": "Referral code is invalid or inactive."}, status=400)

                    referrer_account = StripeAccount.objects.get(user=referrer, account_type="learner")

                    if referrer_account.onboarding_complete:
                        transfer_destination = referrer_account.stripe_account_id
                    else:
                        logger.warning(f"Referrer {referrer.email} has no transfer capability.")
                except ReferralCode.DoesNotExist:
                    return Response({"error": "Referral code not found."}, status=400)

            # Build Session Data
            session_data = {
                "payment_method_types": ['card'],
                "mode": 'payment',
                "line_items": [{
                    'price_data': {
                        'currency': 'inr',
                        'unit_amount': int(settings.PREMIUM_PRICE * 100),  # Always cast to int for Stripe
                        'product_data': {
                            'name': "Learner Premium Subscription"
                        },
                    },
                    'quantity': 1,
                }],
                "success_url": f"{settings.FRONTEND_URL}/learner/premium-success/",
                "cancel_url": f"{settings.FRONTEND_URL}/learner/premium-cancel/",
                "customer_email": user.email,
                "metadata": {
                    "user_id": user.id,
                    "purpose": "learner_premium_subscription",
                    "referral_code_used": referral_code_used or ""
                }
            }

            # Attach transfer_data only if referral is valid
            if transfer_destination:
                session_data["payment_intent_data"] = {
                    "transfer_data": {
                        "destination": transfer_destination
                    }
                }

            # Create Checkout Session
            session = stripe.checkout.Session.create(**session_data)

            subscription.stripe_checkout_session_id = session.id
            subscription.is_active = False
            subscription.save()

            return Response({
                "checkout_url": session.url,
                "session_id": session.id
            })

        except Exception as e:
            logger.exception("Error during premium checkout session creation")
            return Response({"error": str(e)}, status=500)

# ----------------------------
# Mentor Stripe account status
# ----------------------------
class CheckLearnerStripeOnboardingStatus(APIView):
    def get(self, request):
        user = request.user
        try:
            stripe_account = StripeAccount.objects.filter(user=user).first()
            if not stripe_account:
                return Response({'onboarding_complete': False, 'message': 'Stripe account not found'}, status=200)

            account = stripe.Account.retrieve(stripe_account.stripe_account_id)
            onboarding_complete = account.capabilities.get("transfers") == "active"
            return Response({'onboarding_complete': onboarding_complete})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
# ----------------------------
# Learner Premium Status view
# ----------------------------
class LearnerPremiumStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        try:
            subscription = LearnerPremiumSubscription.objects.get(user=user)
            referral_code = ReferralCode.objects.filter(user=user).first()
            if referral_code:
                logger.info(f"The user trying to get premium status: {subscription.user.email} - {subscription.is_active} & Referral code: {referral_code.code}")
            else:
                logger.info(f"The user trying to get premium status: {subscription.user.email} - {subscription.is_active} & No referral code found.")

            return Response({
                "is_active": subscription.is_active,
                "referral_code": referral_code.code if referral_code else None
            })
        except LearnerPremiumSubscription.DoesNotExist:
            logger.warning("Learner premium is_active=False and referral code is None")
            return Response({
                "is_active": False,
                "referral_code": None
            })

# ----------------------------
# Learner Referral amount payout view
# ----------------------------

from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import stripe
import logging

logger = logging.getLogger(__name__)

class LearnerReferralPayoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"Learner {user} requested payout...")

        try:
            # Fetch user's StripeAccount
            stripe_account = StripeAccount.objects.get(user=user, account_type='learner')
        except StripeAccount.DoesNotExist:
            logger.error("Stripe account does not exist..")
            return Response({"error": "Stripe account not found."}, status=404)

        # Check wallet balance from your database
        if stripe_account.wallet_balance <= 0:
            logger.warning("Insufficient learner wallet balance..")
            return Response({"error": "Insufficient wallet balance."}, status=400)

        try:
            # Transfer from platform to learner's connected account
            transfer = stripe.Transfer.create(
                amount=int(stripe_account.wallet_balance * 100),  # Convert dollars to cents
                currency="inr",
                destination=stripe_account.stripe_account_id,
                description="Learner referral wallet withdrawal payout"
            )

            # Log payout
            LearnerPayout.objects.create(
                learner=user,
                amount=stripe_account.wallet_balance,
                stripe_transfer_id=transfer.id,
                status='completed'
            )

            # Set wallet balance to 0 after payout
            stripe_account.wallet_balance = 0
            stripe_account.save()

            logger.info(f"Learner payout successful. Transfer ID: {transfer.id}")

            return Response({"message": "Payout successful.", "transfer_id": transfer.id})

        except Exception as e:
            logger.exception("Error during learner payout.")
            return Response({"error": str(e)}, status=500)

# ----------------------------
# Learner Referral earnings view
# ----------------------------

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum
from premium.models import ReferralEarning
import logging

logger = logging.getLogger(__name__)

class LearnerReferralEarningsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        try:
            stripe_account = StripeAccount.objects.get(user=user, account_type='learner')
        except StripeAccount.DoesNotExist:
            logger.error(f"Stripe account not found for learner {user}")
            return Response({"error": "Stripe account not found."}, status=404)

        # Sum unpaid referral earnings
        total_earnings = ReferralEarning.objects.filter(referrer=user, paid_out=False).aggregate(
            total=Sum('amount')
        )['total'] or 0

        logger.info(f"Learner {user}: wallet_balance={stripe_account.wallet_balance}, unpaid referral earnings={total_earnings}")

        return Response({
            "wallet_balance": float(stripe_account.wallet_balance),
            "unpaid_referral_earnings": round(total_earnings, 2)
        })

# ----------------------------
# User's wallet display
# ----------------------------
class WalletAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wallet, created = Wallet.objects.get_or_create(user=request.user, wallet_type='earnings')
        serializer = WalletSerializer(wallet)
        return Response(serializer.data)