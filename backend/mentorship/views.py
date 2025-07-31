from django.shortcuts import render
from rest_framework import viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
import stripe.error
from users.models import UserProfile
from .models import MentorAvailability, SessionBooking, Review, Feedback, StripeAccount
from premium.models import Wallet
from .serializers import (
    MentorPublicProfileSerializer,
    MentorAvailabilitySerializer,
    SessionBookingSerializer,
    ReviewSerializer,
    FeedbackSerializer

)
from rest_framework.exceptions import ValidationError
from django.utils.timezone import now
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from django.conf import settings
from .models import SessionBooking, StripeAccount
from .utils import create_stripe_customer, create_stripe_connect_account
from django.utils import timezone 
import stripe
from django.contrib.auth import get_user_model
from . serializers import StripeAccountSerializer
from . models import MentorPayout
from rest_framework import viewsets, status
from rest_framework.decorators import action
from django.db.models import Q
from datetime import datetime, timedelta
from .models import SessionBooking
from .serializers import SessionBookingSerializer
from rest_framework import status, permissions
from cloudinary.uploader import upload as cloudinary_upload
from cloudinary.exceptions import Error as CloudinaryError
from .models import Feedback, SessionBooking
from .serializers import FeedbackSerializer
import logging
from .models import Feedback, SessionBooking
from .serializers import FeedbackSerializer
from django.shortcuts import get_object_or_404

from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import json
from .models import StripeAccount
from premium.models import LearnerPayout, LearnerPremiumSubscription, ReferralCode, ReferralEarning
from notification.utils import notify_admins_and_staff

logger = logging.getLogger(__name__)

# ----------------------------
# Mentor Publicly Listing API View 
# ----------------------------
class MentorListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        category = request.query_params.get('category')  # e.g. "Data Science"
        mentors = UserProfile.objects.filter(user__role__name="Mentor", is_approved=True)

        if category:
            mentors = mentors.filter(preferred_categories__icontains=category)

        serializer = MentorPublicProfileSerializer(mentors, many=True, context={'request': request})
        return Response(serializer.data)
    

# ----------------------------
# Mentor create Stripe account
# ----------------------------
class CreateMentorPaymentAccountView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        try:
            # Ensure StripeAccount exists with learner account_type
            stripe_account, _ = StripeAccount.objects.get_or_create(
                user=user,
                account_type="mentor",
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
                    return_url=f"{settings.FRONTEND_URL}/mentor/earnings/",
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
# Mentor Stripe account status
# ----------------------------
class CheckMentorStripeOnboardingStatus(APIView):
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
# Mentor Availability (ViewSet)
# ----------------------------
class MentorAvailabilityViewSet(viewsets.ModelViewSet):
    serializer_class = MentorAvailabilitySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = MentorAvailability.objects.all()

        # Filters
        mentor_id = self.request.query_params.get('mentor')
        date = self.request.query_params.get('date')
        available_only = self.request.query_params.get('available')

        if user.role.name == 'Mentor':
            qs = qs.filter(mentor=user)
        elif mentor_id:
            qs = qs.filter(mentor_id=mentor_id)

        if date:
            qs = qs.filter(date=date)

        if available_only == "true":
            qs = qs.filter(is_booked=False)

        # Sort upcoming first
        return qs.order_by('date', 'start_time')


    def perform_create(self, serializer):
        user = self.request.user

        # Ensure only mentors can create availability slots
        if user.role.name != 'Mentor':
            raise ValidationError("Only mentors can create availability slots.")

        # Check if Stripe account exists and is fully set up
        try:
            stripe_account = user.stripe_account  # via related_name
            if not (stripe_account.stripe_account_id and stripe_account.setup_complete and stripe_account.is_active):
                raise ValidationError("You don't have a valid Stripe payment account. Please set it up before creating slots.")
        except StripeAccount.DoesNotExist:
            raise ValidationError("You don't have a Stripe payment account. Please set it up before creating slots.")

        # Save if all checks passed
        serializer.save(mentor=user)
        notify_admins_and_staff(f"Mentor {user.email} has created a new availability slot.")



# ----------------------------
# create a stripe customer for payment
# ----------------------------
User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def handle_mentor_session_booking(request):
    user = request.user
    data = request.data
    logger.info(f"Booking attempt by {user.email} with data: {data}")

    if data.get('type') != 'session':
        return Response({'error': 'Invalid booking type.'}, status=400)

    required_fields = ['mentor_id', 'date', 'start_time', 'end_time', 'amount']
    if not all(field in data for field in required_fields):
        return Response({'error': 'Missing required fields.'}, status=400)

    mentor_id = data['mentor_id']
    date = data['date']
    start_time = data['start_time']
    end_time = data['end_time']
    amount = float(data['amount'])

    try:
        mentor = User.objects.get(id=mentor_id)
        logger.info(f"Mentor found: {mentor.email}")
    except User.DoesNotExist:
        return Response({'error': 'Mentor not found.'}, status=404)

    try:
        mentor_account = StripeAccount.objects.get(user=mentor, account_type="mentor")
    except StripeAccount.DoesNotExist:
        return Response({'error': 'Mentor is not eligible to receive bookings yet.'}, status=400)

    if not mentor_account.onboarding_complete:
        return Response({'error': 'This mentor is currently unavailable for booking. Please try another mentor.'}, status=400)

    stripe_customer_id = create_stripe_customer(user)

    platform_fee = round(amount * 0.2, 2)

    try:
        intent = stripe.PaymentIntent.create(
            amount=int(amount * 100),
            currency='inr',
            customer=stripe_customer_id,
            capture_method='manual',
            payment_method_types=['card'],
            transfer_data={
                'destination': mentor_account.stripe_account_id,
            },
            application_fee_amount=int(platform_fee * 100),
            metadata={
                'learner_id': user.id,
                'mentor_id': mentor.id,
                'purpose': 'mentor_session',
                'booking_id': None
            }
        )
        logger.info(f"Stripe PaymentIntent created: {intent.id}")
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error during PaymentIntent creation: {str(e)}")
        return Response({'error': str(e)}, status=400)

    booking = SessionBooking.objects.create(
        learner=user,
        mentor=mentor,
        date=date,
        start_time=start_time,
        end_time=end_time,
        amount=amount,
        stripe_payment_intent_id=intent.id,
        payment_status=SessionBooking.PaymentStatus.HOLDING,
        status=SessionBooking.Status.PENDING,
    )
    logger.info(f"Session booking created successfully: ID {booking.id}")
    try:
        stripe.PaymentIntent.modify(
            intent.id,
            metadata={'booking_id': booking.id}
        )
    except stripe.error.StripeError as e:
        logger.warning(f"Failed to update PaymentIntent {intent.id} metadata with booking_id {booking.id}: {str(e)}")

    return Response({
        'clientSecret': intent.client_secret,
        'paymentIntentId': intent.id,
        'bookingId': booking.id,
    })


# ----------------------------
# After completion of the session, capturing mentor session payment
# ----------------------------


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def capture_mentor_session_payment(request, booking_id):
    user = request.user
    logger.info(f"Mentor session payment capture requested by user: {user.email}, booking ID: {booking_id}")

    try:
        booking = SessionBooking.objects.select_related("mentor").get(id=booking_id)

        if booking.mentor != user:
            logger.warning(f"Unauthorized capture attempt by {user.email} for booking {booking_id}. Mentor: {booking.mentor.email}")
            return Response({'error': 'You are not authorized to capture payment for this session.'}, status=403)

        if not booking.stripe_payment_intent_id:
            logger.info(f"Booking {booking_id}: No Stripe payment intent ID found.")
            return Response({'error': 'No associated payment intent.'}, status=400)

        if booking.is_payment_captured:
            logger.info(f"Booking {booking_id}: Payment already captured.")
            return Response({'message': 'Payment for this session has already been captured.'}, status=200)

        if booking.payment_status != SessionBooking.PaymentStatus.HOLDING:
            logger.info(f"Booking {booking_id}: Payment status is not in HOLDING state ({booking.payment_status}).")
            return Response({'error': f'Payment is not in a capturable state: {booking.get_payment_status_display()}.'}, status=400)

        try:
            captured_intent = stripe.PaymentIntent.capture(booking.stripe_payment_intent_id)
            logger.info(f"Stripe PaymentIntent {booking.stripe_payment_intent_id} captured successfully by API call.")

            booking.status = SessionBooking.Status.COMPLETED # Session is completed
            booking.save() 

            return Response({
                'message': 'Payment capture initiated successfully. Final status and wallet updates will follow shortly.'
            })

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error capturing PaymentIntent {booking.stripe_payment_intent_id}: {str(e)}")
            return Response({'error': f"Payment capture failed at Stripe: {str(e)}"}, status=400)

    except SessionBooking.DoesNotExist:
        logger.error(f"Booking {booking_id} not found.")
        return Response({'error': 'Booking not found.'}, status=404)
    except Exception as e:
        logger.exception(f"Unexpected error in capture_mentor_session_payment for booking {booking_id}: {str(e)}")
        return Response({'error': 'An unexpected error occurred during payment capture.'}, status=500)
        
# ----------------------------
# Mentor wallet balance
# ----------------------------

class MentorWalletView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        try:
            stripe_account = StripeAccount.objects.get(user=user, account_type='mentor')
        except StripeAccount.DoesNotExist:
            logger.error("Stripe account does not exist")
            return Response({"error": "Mentor stripe account not found."}, status=404)
        
        serializer = StripeAccountSerializer(stripe_account)
        return Response(serializer.data)

# ----------------------------
# Mentor withdrawal 
# ----------------------------

stripe.api_key = settings.STRIPE_SECRET_KEY

class MentorPayoutRequestView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        logger.info(f"Mentor {user} requested to payout..")

        try:
            stripe_account = StripeAccount.objects.get(user=user, account_type='mentor')
        except StripeAccount.DoesNotExist:
            logger.error("Stripe account does not exist..")
            return Response({"error": "Stripe account not found."}, status=404)

        if stripe_account.wallet_balance <= 0:
            logger.warning("Insufficient mentor wallet balance..")
            return Response({"error": "Insufficient wallet balance."}, status=400)

        try:
            payout = stripe.Transfer.create(
                amount=int(stripe_account.wallet_balance * 100),  # Convert to cents
                currency="usd",  # Change as needed
                destination=stripe_account.stripe_account_id,
                description="Mentor withdrawal payout"
            )

            # Log payout in your DB
            MentorPayout.objects.create(
                mentor=user,
                amount=stripe_account.wallet_balance,
                stripe_payout_id=payout.id,
                status='completed'
            )

            # Set wallet balance to 0 after payout
            stripe_account.wallet_balance = 0
            stripe_account.save()

            return Response({"message": "Payout successful."})

        except Exception as e:
            return Response({"error": str(e)}, status=500)

# ----------------------------
# Session Booking (Create API)
# ----------------------------
class SessionBookingViewSet(viewsets.ModelViewSet):
    queryset = SessionBooking.objects.all()
    serializer_class = SessionBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_obj = getattr(user, 'role', None)
        role = role_obj.name if role_obj else None

        if role == 'Mentor':
            return SessionBooking.objects.filter(mentor=user)
        elif role == 'Learner':
            return SessionBooking.objects.filter(learner=user)

        return SessionBooking.objects.none()

    def create(self, request, *args, **kwargs):
        return Response({'error': 'Use /api/book-session/ for Stripe bookings.'}, status=405)

    def perform_create(self, serializer):
        serializer.save(learner=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def accept(self, request, pk=None):
        session = self.get_object()
        if request.user != session.mentor:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        session.status = SessionBooking.Status.CONFIRMED
        session.save()
        return Response({"message": "Session confirmed."})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject(self, request, pk=None):
        session = self.get_object()
        if request.user != session.mentor:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)
        session.status = SessionBooking.Status.REJECTED
        session.save()
        return Response({"message": "Session rejected."})

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def cancel(self, request, pk=None):
        session = self.get_object()
        if request.user != session.learner:
            return Response({"error": "Unauthorized."}, status=status.HTTP_403_FORBIDDEN)

        session_datetime = datetime.combine(session.date, session.start_time)
        if timezone.now() + timedelta(hours=12) > timezone.make_aware(session_datetime):
            return Response({"error": "Cannot cancel less than 12 hours before session."},
                            status=status.HTTP_400_BAD_REQUEST)

        session.status = SessionBooking.Status.CANCELLED
        session.save()
        return Response({"message": "Session cancelled successfully."})

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def upcoming(self, request):
        user = request.user
        now = timezone.now()
        sessions = SessionBooking.objects.filter(
            (Q(mentor=user) | Q(learner=user)),
            Q(status=SessionBooking.Status.CONFIRMED),
            Q(date__gt=now.date()) |
            (Q(date=now.date()) & Q(start_time__gte=now.time()))
        ).order_by('date', 'start_time')
        serializer = self.get_serializer(sessions, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'], permission_classes=[IsAuthenticated])
    def can_join(self, request, pk=None):
        session = self.get_object()
        now = timezone.now()
        session_datetime = datetime.combine(session.date, session.start_time)
        session_start = timezone.make_aware(session_datetime)
        session_end = session_start + timedelta(minutes=30)

        if session.status != SessionBooking.Status.CONFIRMED:
            return Response({"can_join": False, "reason": "Session is not confirmed."})

        if session_start <= now <= session_end:
            return Response({"can_join": True, "join_link": session.meeting_link})

        return Response({"can_join": False, "reason": "Not within joinable time."})


    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])  # session complete and capture the mentor fee
    def complete_and_capture(self, request, pk=None):
        session = self.get_object()

        if request.user.role.name.lower() != 'admin':
            return Response({"error": "Only admin can complete and capture sessions."}, status=403)

        if session.status != SessionBooking.Status.CONFIRMED:
            return Response({"error": "Session must be in CONFIRMED state to complete."}, status=400)

        if session.payment_status != SessionBooking.PaymentStatus.HOLDING:
            return Response({"error": "Payment is not in holding state."}, status=400)

        try:
            # Convert to paisa
            amount_in_paisa = int(session.amount * 100)
            mentor_share = int(session.mentor_payout * 100)

            # Capture payment
            stripe.PaymentIntent.capture(
                session.stripe_payment_intent_id,
                amount_to_capture=mentor_share
            )

            session.status = SessionBooking.Status.COMPLETED
            session.payment_status = SessionBooking.PaymentStatus.RELEASED
            session.captured_at = timezone.now()
            session.save()

            return Response({"message": "✅ Session marked as completed and payment captured."})
        except stripe.error.StripeError as e:
            logger.error(f"Stripe capture error: {str(e)}")
            return Response({"error": str(e)}, status=400)


# ----------------------------
# Session List for Learner/Mentor
# ----------------------------
class MySessionsAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        role = user.role.name.lower()
        if role == 'learner':
            sessions = SessionBooking.objects.filter(learner=user)
        elif role == 'mentor':
            sessions = SessionBooking.objects.filter(mentor=user)
        else:
            return Response({"error": "Unauthorized"}, status=403)
        serializer = SessionBookingSerializer(sessions, many=True)
        return Response(serializer.data)

# ----------------------------
# Create a Stripe Connect account for payout
# ----------------------------

class BeginPayoutOnboarding(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user
        account_type = request.data.get("account_type", "mentor")  # or "learner"

        # Only create if not exists
        stripe_account, created = StripeAccount.objects.get_or_create(
            user=user,
            defaults={'account_type': account_type}
        )
        if not stripe_account.stripe_account_id:
            acct = create_stripe_connect_account(user, account_type)
            stripe_account.stripe_account_id = acct.stripe_account_id
            stripe_account.save()

        # Generate onboarding link
        account_link = stripe.AccountLink.create(
            account=stripe_account.stripe_account_id,
            refresh_url="http://localhost:8000/stripe/onboarding/refresh/",
            return_url="http://localhost:8000/dashboard/",
            type="account_onboarding",
        )

        return Response({"url": account_link.url})


# ----------------------------
# Stripe webhook endpoint (all logics includes)
# ----------------------------

import stripe
import logging
from decimal import Decimal
from django.core.exceptions import MultipleObjectsReturned
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import HttpResponse


from .models import SessionBooking 

logger = logging.getLogger(__name__)
from django.db import transaction 

def handle_payment_intent_succeeded(intent_data):
 
    pi_id = intent_data['id']
    amount_received = Decimal(str(intent_data.get('amount_received', 0))) / Decimal("100") 

    logger.info(f"Webhook: Received payment_intent.succeeded for PI: {pi_id}, Amount: {amount_received}")

    booking_id = intent_data['metadata'].get('booking_id')
    if not booking_id:
        logger.warning(f"PaymentIntent {pi_id} missing 'booking_id' in metadata. Cannot link to SessionBooking.")
        return

    try:

        with transaction.atomic():
            booking = SessionBooking.objects.select_for_update().get(id=booking_id, stripe_payment_intent_id=pi_id)

            if booking.is_payment_captured and booking.payment_status == SessionBooking.PaymentStatus.RELEASED:
                logger.info(f"Booking {booking.id} (PI: {pi_id}) already marked as captured and released. Skipping.")
                return

            if booking.payment_status not in [SessionBooking.PaymentStatus.HOLDING]:
                logger.warning(f"Booking {booking.id} (PI: {pi_id}) is in unexpected payment status: {booking.payment_status}. Expected HOLDING. Still processing.")

            booking.status = SessionBooking.Status.COMPLETED 
            booking.is_payment_captured = True
            booking.captured_at = timezone.now()

            booking.platform_fee = round(amount_received * Decimal("0.20"), 2)
            booking.mentor_payout = round(amount_received * Decimal("0.80"), 2)
            booking.payment_status = SessionBooking.PaymentStatus.RELEASED 

            booking.save()
            logger.info(f"Booking {booking.id} updated: status={booking.status}, payment_status={booking.payment_status}, captured={booking.is_payment_captured}")


            try:
                platform_user = User.objects.get(email=settings.PLATFORM_OWNER_EMAIL)
                platform_wallet, _ = Wallet.objects.get_or_create(user=platform_user)
                platform_wallet.add_funds(
                    amount=booking.platform_fee,
                    transaction_type='credit_platform_fee',
                    source_id=pi_id,
                    description=f"Mentor session's platform fee for the session: {booking_id}"
                    )
                logger.info(f"Platform wallet credited with {booking.platform_fee}. New balance: {platform_wallet.balance}")
            except User.DoesNotExist:
                logger.error("Platform owner user not found. Check settings.PLATFORM_OWNER_EMAIL.")

            mentor = booking.mentor
            mentor_wallet, _ = Wallet.objects.get_or_create(user=mentor)
            mentor_wallet.add_funds(
                amount=booking.mentor_payout,
                transaction_type='credit_session_fee',
                source_id=pi_id,
                description=f"Mentor session fee for the session: {booking_id}"
                )
            logger.info(f"Mentor {mentor.email}'s wallet credited with {booking.mentor_payout}. New balance: {mentor_wallet.balance}")

            logger.info(
                f"Booking {booking.id} (PI: {pi_id}) successfully processed. "
                f"Mentor ({mentor.email}) credited: {booking.mentor_payout}, "
                f"Platform credited: {booking.platform_fee}"
            )

    except SessionBooking.DoesNotExist:
        logger.warning(f"Webhook: No SessionBooking found for PaymentIntent ID: {pi_id} (Booking ID: {booking_id}).")
    except Exception as e:
        logger.exception(f"Webhook: Error handling payment_intent.succeeded for PI {pi_id}: {str(e)}")


def handle_checkout_session_completed(session_data): 
    user_id_str = session_data['metadata'].get("user_id")
    referral_code_used = session_data['metadata'].get("referral_code_used", "")
    stripe_subscription_id = session_data.get("subscription", "")
    payment_intent_id = session_data.get("payment_intent", "")

    logger.info(f"Webhook - handle_checkout_session_completed: Starting for user_id_str={user_id_str}, referral_code_used={referral_code_used}")
    logger.debug(f"Webhook - Full session_data: {session_data}")

    if not user_id_str:
        logger.error(f"Webhook - Missing 'user_id' in metadata for checkout.session.completed event. Session ID: {session_data.get('id')}")
        return

    try:
        user_id = int(user_id_str)
    except ValueError:
        logger.error(f"Webhook - Invalid user_id format: {user_id_str}")
        return

    # Handle subscription activation
    try:
        subscription = LearnerPremiumSubscription.objects.get(user__id=user_id)
        subscription.is_active = True
        subscription.stripe_subscription_id = stripe_subscription_id
        subscription.save()
        notify_admins_and_staff(
            f"User #{user_id} has subscribed to premium. Revenue recorded."
        )
        logger.info(f"Webhook - Learner subscription ACTIVATED for user ID: {user_id}")
    except LearnerPremiumSubscription.DoesNotExist:
        logger.warning(f"Webhook - No subscription found for user ID: {user_id}")
    except MultipleObjectsReturned:
        logger.error(f"Webhook - Multiple subscriptions found for user ID: {user_id}")
        return
    except Exception as e:
        logger.exception(f"Webhook - Error activating subscription for user ID: {user_id}: {e}")
        return

    referral_used = False
    earning_amount = Decimal("0.00")

    # Process referral earnings
    if referral_code_used:
        try:
            referrer_entry = ReferralCode.objects.get(code=referral_code_used)
            referrer = referrer_entry.user

            if referrer.id != user_id and getattr(referrer, 'premium_subscription', None) and referrer.premium_subscription.is_active:
                referral_used = True
                earning_amount = settings.PREMIUM_PRICE * Decimal("0.30")

                referral_earning = ReferralEarning.objects.create(
                    referrer=referrer,
                    referred_user_id=user_id,
                    amount=earning_amount,
                    stripe_transfer_id=payment_intent_id
                )

                referrer_wallet, _ = Wallet.objects.get_or_create(user=referrer, wallet_type="earnings")
                referrer_wallet.add_funds(
                    amount=earning_amount,
                    transaction_type='credit_referral',
                    source_id=referral_earning.id,
                    description=f"Referral bonus for subscription purchase by user {user_id}"
                )
                logger.info(f"Webhook - Referrer wallet updated: {referrer_wallet.balance}")
        except ReferralCode.DoesNotExist:
            logger.warning(f"Webhook - Referral code not found: {referral_code_used}")
        except Exception as e:
            logger.exception(f"Webhook - Error processing referral for user {user_id}: {e}")

    # Platform subscription revenue (referral or not)
    try:
        platform_user = User.objects.get(email=settings.PLATFORM_OWNER_EMAIL)
        platform_wallet, _ = Wallet.objects.get_or_create(user=platform_user, wallet_type='platform_fees')

        platform_earning = (
            settings.PREMIUM_PRICE * Decimal("0.70") if referral_used else Decimal(str(settings.PREMIUM_PRICE))
        )

        platform_wallet.add_funds(
            amount=platform_earning,
            transaction_type='credit_platform_fee',
            source_id=stripe_subscription_id or payment_intent_id,
            description=f"Platform fee for subscription purchased by user {user_id}"
        )
        logger.info(f"Webhook - Platform wallet credited: {platform_wallet.balance}")
    except User.DoesNotExist:
        logger.error("Webhook - Platform owner not found. Check PLATFORM_OWNER_EMAIL setting.")
    except Exception as e:
        logger.exception(f"Webhook - Error crediting platform owner's wallet: {e}")


def handle_account_updated(account_data):

    stripe_account_id = account_data.get("id")
    capabilities = account_data.get("capabilities", {})
    details_submitted = account_data.get("details_submitted", False)
    payouts_enabled = account_data.get("payouts_enabled", False)

    logger.info(f"Stripe account updated webhook received for ID: {stripe_account_id}")
    logger.info(f"Details submitted: {details_submitted}, Payouts enabled: {payouts_enabled}")
    logger.info(f"Capabilities: {capabilities}")


    try:
        account = StripeAccount.objects.get(stripe_account_id=stripe_account_id, platform='stripe')

        transfers_active = capabilities.get("transfers") == "active"
        card_payments_active = capabilities.get("card_payments", {}).get("status") == "active"
        account.setup_complete = details_submitted and payouts_enabled
        account.onboarding_complete = transfers_active and details_submitted # Often details_submitted is key

        account.save()
        logger.info(f"Updated PaymentAccount for user {account.user.email}. Setup complete: {account.setup_complete}, Onboarding complete: {account.onboarding_complete}")

    except StripeAccount.DoesNotExist:
        logger.warning(f"No PaymentAccount found for Stripe account ID: {stripe_account_id}. Cannot update local record.")
    except Exception as e:
        logger.exception(f"Error handling 'account.updated' webhook for ID {stripe_account_id}: {e}")

@method_decorator(csrf_exempt, name='dispatch')
class StripeWebhookView(APIView):
    authentication_classes = [] # No authentication for webhooks
    permission_classes = [] # No permissions for webhooks

    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
        webhook_secret = settings.STRIPE_WEBHOOK_SECRET

        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            logger.info(f"Stripe webhook event received: {event['type']} (ID: {event.id})")
        except (ValueError, stripe.error.SignatureVerificationError) as e:
            logger.error(f"Stripe webhook signature verification failed: {e}")
            return Response(status=400)
        except Exception as e:
            logger.exception(f"Error constructing Stripe webhook event: {e}")
            return Response(status=400)

        try:
            event_type = event['type']
            event_data_object = event['data']['object']

            if event_type == 'payment_intent.succeeded':
                handle_payment_intent_succeeded(event_data_object)
            elif event_type == 'checkout.session.completed':
                handle_checkout_session_completed(event_data_object)
            elif event_type == 'account.updated':
                handle_account_updated(event_data_object)
            elif event_type == 'account.application.authorized':
                # This is likely for OAuth integrations, if you have any
                logger.info(f"Unhandled event type 'account.application.authorized' received: {event['id']}")
            else:
                logger.info(f"Unhandled Stripe event type received: {event_type} (ID: {event.id})")

        except Exception as e:
            logger.exception(f"Error processing Stripe webhook event {event['type']} (ID: {event.id}): {e}")
            return Response(status=200)

        # Always return a 200 OK to Stripe
        return Response(status=200)
# ----------------------------
# Learner creating review after session
# ----------------------------
class ReviewCreateAPIView(APIView):
    def post(self, request):
        session_id = request.data.get("session")
        session = SessionBooking.objects.get(id=session_id)

        if request.user != session.learner:
            return Response({"detail": "Only learners can give reviews."}, status=403)

        if hasattr(session, 'review'):
            return Response({"detail": "Review already exists."}, status=400)

        review = Review.objects.create(
            session=session,
            reviewer=request.user,
            reviewee=session.mentor,
            rating=request.data.get("rating"),
            comment=request.data.get("comment")
        )
        notify_admins_and_staff(f"New review submitted by {request.user.email} for {session.mentor.email} after the session {session_id}.")

        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=201)


# ----------------------------
# Learner Review details
# ----------------------------
class ReviewDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = SessionBooking.objects.get(id=session_id)
            review = session.review
        except (SessionBooking.DoesNotExist, Review.DoesNotExist):
            return Response({"detail": "Review not found."}, status=404)

        # Only mentor (reviewee) can view
        if session.mentor != request.user:
            return Response({"detail": "Not authorized."}, status=403)

        serializer = ReviewSerializer(review)
        return Response(serializer.data)
# ----------------------------
# Mentor Creating Feedback after session
# ----------------------------

class FeedbackUploadAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        data = request.data.dict()

        session_id = data.get("session")
        try:
            session = SessionBooking.objects.get(id=session_id)
        except SessionBooking.DoesNotExist:
            return Response({"detail": "Invalid session ID"}, status=400)

        # Handle video upload manually
        if 'video' in request.FILES:
            video_file = request.FILES['video']
            video_result = cloudinary.uploader.upload(video_file, resource_type='video')
            data['video'] = video_result['public_id']

        # Handle audio upload manually (also resource_type='video')
        if 'audio' in request.FILES:
            audio_file = request.FILES['audio']
            audio_result = cloudinary.uploader.upload(audio_file, resource_type='video')
            data['audio'] = audio_result['public_id']

        # Let serializer handle the rest (image, message)
        serializer = FeedbackSerializer(data=data)
        if serializer.is_valid():
            serializer.save(giver=request.user, receiver=session.learner)
            notify_admins_and_staff(f"{request.user.email} uploaded feedback for session {session.id}.")
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# Mentor Feedback details
# ----------------------------


class FeedbackBySessionAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        session = get_object_or_404(SessionBooking, id=session_id)
        feedback = getattr(session, 'feedback', None)
        if not feedback:
            return Response({"detail": "No feedback for this session."}, status=status.HTTP_404_NOT_FOUND)
        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class FeedbackRetrieveAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, feedback_id):
        feedback = get_object_or_404(Feedback, id=feedback_id)
        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data, status=status.HTTP_200_OK)

#cheking vie............................
import cloudinary.uploader
from .models import Checking
from .serializers import CheckingSerializer

class CheckingUploadView(APIView):
    def post(self, request):
        data = request.data.copy()  # mutable copy

        # Handle video upload manually
        if 'video' in request.FILES:
            video_file = request.FILES['video']
            video_result = cloudinary.uploader.upload(video_file, resource_type='video')
            data['video'] = video_result['public_id']

        # Handle audio upload manually (also resource_type='video')
        if 'audio' in request.FILES:
            audio_file = request.FILES['audio']
            audio_result = cloudinary.uploader.upload(audio_file, resource_type='video')
            data['audio'] = audio_result['public_id']

        # Let serializer handle the rest (image, message)
        serializer = CheckingSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

