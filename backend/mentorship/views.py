from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import UserProfile
from .models import MentorAvailability, SessionBooking, Review, Feedback, Subscription, StripeAccount
from .serializers import (
    MentorPublicProfileSerializer,
    MentorAvailabilitySerializer,
    SessionBookingSerializer,
    ReviewSerializer,
    FeedbackSerializer

)
from django.core.exceptions import ObjectDoesNotExist
from users.serializers import UserProfileSerializer
from django.utils import timezone

import logging
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
        serializer.save(mentor=self.request.user)


# ----------------------------
# create a stripe customer for payment
# ----------------------------
# mentorship/views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.conf import settings
from .models import SessionBooking, StripeAccount
from .utils import create_stripe_customer, create_stripe_connect_account
import stripe
from django.contrib.auth import get_user_model
import logging

User = get_user_model()
stripe.api_key = settings.STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def handle_mentor_session_booking(request):
    user = request.user
    data = request.data
    logger.info(f"Booking attempt by {user.email} with data: {data}")

    # Validate booking type
    if data.get('type') != 'session':
        return Response({'error': 'Invalid booking type.'}, status=400)

    # Validate required fields
    required_fields = ['mentor_id', 'date', 'start_time', 'end_time', 'amount']
    if not all(field in data for field in required_fields):
        return Response({'error': 'Missing required fields.'}, status=400)

    mentor_id = data['mentor_id']
    date = data['date']
    start_time = data['start_time']
    end_time = data['end_time']
    amount = float(data['amount'])

    # Fetch mentor user
    try:
        mentor = User.objects.get(id=mentor_id)
        logger.info(f"Mentor found: {mentor.email}")
    except User.DoesNotExist:
        return Response({'error': 'Mentor not found.'}, status=404)

    # Check for StripeAccount or create one
    mentor_account = StripeAccount.objects.filter(user=mentor, account_type="mentor").first()
    if not mentor_account:
        logger.info(f"No StripeAccount found for mentor {mentor.email}. Creating now.")
        mentor_account = create_stripe_connect_account(mentor, account_type="mentor")

    # Check transfer capability
    try:
        account = stripe.Account.retrieve(mentor_account.stripe_account_id)
    except stripe.error.StripeError as e:
        logger.error(f"Failed to retrieve Stripe account: {str(e)}")
        return Response({'error': 'Unable to verify mentor Stripe account.'}, status=400)

    if account.capabilities.get("transfers") != "active":
        logger.warning(f"Mentor {mentor.email} does not have active transfer capability.")
        onboarding_link = stripe.AccountLink.create(
            account=mentor_account.stripe_account_id,
            refresh_url="http://localhost:8000/stripe/onboarding/refresh/",
            return_url="http://localhost:8000/dashboard/",
            type="account_onboarding"
        )
        return Response({
            'error': 'Mentor account is not ready to receive payouts.',
            'onboarding_url': onboarding_link.url
        }, status=400)

    # Create Stripe customer if not exists
    stripe_customer_id = create_stripe_customer(user)

    # Calculate fees
    platform_fee = round(amount * 0.2, 2)
    mentor_payout = round(amount - platform_fee, 2)

    # Create Stripe PaymentIntent
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
            }
        )
        logger.info(f"Stripe PaymentIntent created: {intent.id}")
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error during PaymentIntent creation: {str(e)}")
        return Response({'error': str(e)}, status=400)

    # Create session booking in DB
    booking = SessionBooking.objects.create(
        learner=user,
        mentor=mentor,
        date=date,
        start_time=start_time,
        end_time=end_time,
        amount=amount,
        platform_fee=platform_fee,
        mentor_payout=mentor_payout,
        status=SessionBooking.Status.PENDING,
        payment_status=SessionBooking.PaymentStatus.HOLDING,
        stripe_payment_intent_id=intent.id,
    )
    logger.info(f"Session booking created successfully: ID {booking.id}")

    return Response({
        'clientSecret': intent.client_secret,
        'paymentIntentId': intent.id,
        'bookingId': booking.id,
    })

# ----------------------------
# Session Booking (Create API)
# ----------------------------
# mentorship/viewsets.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q
from datetime import datetime, timedelta
from .models import SessionBooking
from .serializers import SessionBookingSerializer
import logging

logger = logging.getLogger(__name__)

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
from rest_framework.views import APIView

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
# Stripe webhook endpoint
# ----------------------------
from django.views.decorators.csrf import csrf_exempt
from django.http import HttpResponse
import json

@csrf_exempt
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE', '')
    event = None
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        return HttpResponse(status=400)

    # PaymentIntent succeeded (session booking payment completed)
    if event['type'] == 'payment_intent.succeeded':
        intent = event['data']['object']
        pi_id = intent['id']
        try:
            booking = SessionBooking.objects.get(stripe_payment_intent_id=pi_id)
            booking.status = 'confirmed'
            booking.save()
        except SessionBooking.DoesNotExist:
            pass

    # Checkout session completed (subscription purchased)
    elif event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        checkout_id = session['id']
        subscription_id = session.get('subscription')
        try:
            sub = Subscription.objects.get(stripe_checkout_session_id=checkout_id)
            sub.stripe_subscription_id = subscription_id
            sub.active = True
            sub.start_date = timezone.now()
            sub.save()
        except Subscription.DoesNotExist:
            pass

    # Add more event handlers as needed

    return HttpResponse(status=200)
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
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from cloudinary.uploader import upload as cloudinary_upload
from cloudinary.exceptions import Error as CloudinaryError
from .models import Feedback, SessionBooking
from .serializers import FeedbackSerializer
import logging

logger = logging.getLogger(__name__)

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
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------
# Mentor Feedback details
# ----------------------------

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions
from .models import Feedback, SessionBooking
from .serializers import FeedbackSerializer
from django.shortcuts import get_object_or_404

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

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
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

