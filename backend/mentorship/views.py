from django.shortcuts import render

# Create your views here.
from rest_framework import viewsets, permissions, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from users.models import UserProfile
from .models import MentorAvailability, SessionBooking, Review, Feedback
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
class FeedbackDetailAPIView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, session_id):
        logger.debug(f"Feedback GET request received for session ID: {session_id} by user ID: {request.user.id}")

        try:
            session = SessionBooking.objects.get(id=session_id)
            feedback = session.feedback  # May raise RelatedObjectDoesNotExist
        except (SessionBooking.DoesNotExist, ObjectDoesNotExist):
            logger.warning(f"Feedback not found or session does not exist for session ID: {session_id}")
            return Response({"detail": "Feedback not found."}, status=404)

        if session.learner != request.user:
            logger.warning(f"Unauthorized access attempt: User ID {request.user.id} is not the learner of session {session_id}")
            return Response({"detail": "Not authorized."}, status=403)

        logger.info(f"Feedback retrieved for session ID: {session_id} by learner ID: {request.user.id}")
        serializer = FeedbackSerializer(feedback)
        return Response(serializer.data)

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

