from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import UserProfile
from .models import MentorAvailability, SessionBooking, PaymentTransaction, SessionFeedbackReview
from .serializers import (
    MentorPublicProfileSerializer,
    MentorAvailabilitySerializer,
    SessionBookingSerializer,
    PaymentTransactionSerializer,
    SessionFeedbackReviewSerializer,
)
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
# Session Booking (Create API)
# ----------------------------
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import datetime, timedelta
from .models import SessionBooking
from .serializers import SessionBookingSerializer
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

class SessionBookingViewSet(viewsets.ModelViewSet):
    queryset = SessionBooking.objects.all()
    serializer_class = SessionBookingSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        role_obj = getattr(user, 'role', None)
        role = role_obj.name if role_obj else None

        logger.info(f"get_queryset called by user={user.email}, role={role}")

        if role == 'Mentor':
            logger.info(f"Returning mentor sessions for user={user.email}")
            return SessionBooking.objects.filter(mentor=user)

        elif role == 'Learner':
            logger.info(f"Returning learner sessions for user={user.email}")
            return SessionBooking.objects.filter(learner=user)

        logger.warning(f"Unknown or missing role for user={user.email}. Returning empty queryset.")
        return SessionBooking.objects.none()

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

        # Check if more than 12 hours remain
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
        session_end = session_start + timedelta(minutes=30)  # assuming 30 min session

        if session.status != SessionBooking.Status.CONFIRMED:
            return Response({"can_join": False, "reason": "Session is not confirmed."})

        if session_start <= now <= session_end:
            return Response({"can_join": True, "join_link": session.meeting_link})

        return Response({"can_join": False, "reason": "Not within joinable time."})




# ----------------------------
# Payment Transaction ViewSet
# ----------------------------
class PaymentTransactionViewSet(viewsets.ModelViewSet):
    queryset = PaymentTransaction.objects.all()
    serializer_class = PaymentTransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return self.queryset.filter(booking__learner=self.request.user)


# ----------------------------
# Feedback & Review ViewSet
# ----------------------------

class IsFeedbackOwner(permissions.BasePermission):
    """
    Allows access only to the learner or mentor involved in the session.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user
        return (
            obj.session.learner == user or
            obj.session.mentor == user or
            user.is_staff
        )

class SessionFeedbackReviewViewSet(viewsets.ModelViewSet):
    queryset = SessionFeedbackReview.objects.all()
    serializer_class = SessionFeedbackReviewSerializer
    permission_classes = [permissions.IsAuthenticated, IsFeedbackOwner]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return self.queryset
        return self.queryset.filter(
            session__learner=user
        ) | self.queryset.filter(
            session__mentor=user
        )

    def perform_create(self, serializer):
        # You could do validation like: check if user is learner of the session
        serializer.save()



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
