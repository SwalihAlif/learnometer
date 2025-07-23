from django.shortcuts import render
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.pagination import PageNumberPagination
from django.contrib.auth import get_user_model
from .serializers import LearnerUserSerializer
from rest_framework.generics import ListAPIView
from courses.models import Course
from .serializers import CourseSerializer
from topics.models import MainTopic, SubTopic, Schedule, Question
from .serializers import MainTopicSerializer
from .serializers import SubTopicSerializer
from .serializers import ScheduleSerializer
from .serializers import QuestionSerializer
from mentorship.models import SessionBooking, Review, Feedback
from .serializers import SessionBookingAdminSerializer
from .serializers import FeedbackSerializer
from .serializers import ReviewSerializer



# Create your views here.

User = get_user_model()

class LearnerListView(ListAPIView):
    serializer_class = LearnerUserSerializer
    pagination_class = PageNumberPagination

    def get_queryset(self):
        return User.objects.filter(role__name="Learner")
    


class CourseListByLearner(ListAPIView):
    serializer_class = CourseSerializer

    def get_queryset(self):
        learner_id = self.kwargs['learner_id']
        return Course.objects.filter(learner_id=learner_id)
    

class MainTopicListByCourse(ListAPIView):
    serializer_class = MainTopicSerializer

    def get_queryset(self):
        course_id = self.kwargs['course_id']
        return MainTopic.objects.filter(course_id=course_id)




class SubTopicListByMainTopic(ListAPIView):
    serializer_class = SubTopicSerializer

    def get_queryset(self):
        main_topic_id = self.kwargs['main_topic_id']
        return SubTopic.objects.filter(main_topic_id=main_topic_id)
    



class ScheduleListByMainTopic(ListAPIView):
    serializer_class = ScheduleSerializer

    def get_queryset(self):
        main_topic_id = self.kwargs['main_topic_id']
        return Schedule.objects.filter(topic_id=main_topic_id)
    



class QuestionListByMainTopic(ListAPIView):
    serializer_class = QuestionSerializer

    def get_queryset(self):
        main_topic_id = self.kwargs['main_topic_id']
        return Question.objects.filter(main_topic_id=main_topic_id)
    
# ------------------------- Admin Session views
class SessionBookingListAPIView(ListAPIView):
    queryset = SessionBooking.objects.select_related('mentor', 'learner').order_by('-created_at')
    serializer_class = SessionBookingAdminSerializer
    pagination_class = PageNumberPagination





class FeedbackDetailView(RetrieveAPIView):
    queryset = Feedback.objects.select_related('session', 'giver', 'receiver')
    serializer_class = FeedbackSerializer
    lookup_field = 'session_id'  # Use session ID to get feedback
    lookup_url_kwarg = 'session_id'




class ReviewDetailView(RetrieveAPIView):
    queryset = Review.objects.select_related('session', 'reviewer', 'reviewee')
    serializer_class = ReviewSerializer
    lookup_field = 'session_id'
    lookup_url_kwarg = 'session_id'


# ------------------------------------ Basic metrics

from rest_framework.views import APIView
from rest_framework.response import Response
from django.db.models import Count, Avg, Sum, Q
from users.models import User, Role
from courses.models import Course
from topics.models import MainTopic, SubTopic 
from mentorship.models import SessionBooking, Review, Feedback, MentorAvailability 

class AdminDashboardStatsAPIView(APIView):
    def get(self, request):
        total_users = User.objects.count()
        total_learners = User.objects.filter(role__name="Learner").count()
        total_mentors = User.objects.filter(role__name="Mentor").count()

        total_courses = Course.objects.count()
        total_main_topics = MainTopic.objects.count()
        total_subtopics = SubTopic.objects.count()

        total_sessions = SessionBooking.objects.count()
        pending_sessions = SessionBooking.objects.filter(status='pending').count()
        completed_sessions = SessionBooking.objects.filter(status='completed').count()
        cancelled_sessions = SessionBooking.objects.filter(status__in=['cancelled', 'no_show', 'rejected']).count()

        total_reviews = Review.objects.count()
        average_rating = Review.objects.aggregate(avg_rating=Avg('rating'))['avg_rating'] or 0

        total_feedbacks = Feedback.objects.count()
        feedback_with_links = Feedback.objects.exclude(external_links__isnull=True).exclude(external_links__exact='').count()

        total_revenue = MentorAvailability.objects.filter(is_booked=True).aggregate(
            revenue=Sum('session_price')
        )['revenue'] or 0

        return Response({
            "total_users": total_users,
            "total_learners": total_learners,
            "total_mentors": total_mentors,
            "total_courses": total_courses,
            "total_main_topics": total_main_topics,
            "total_subtopics": total_subtopics,
            "total_sessions": total_sessions,
            "pending_sessions": pending_sessions,
            "completed_sessions": completed_sessions,
            "cancelled_sessions": cancelled_sessions,
            "total_reviews": total_reviews,
            "average_rating": round(average_rating, 2),
            "total_feedbacks": total_feedbacks,
            "feedback_with_links": feedback_with_links,
            "total_revenue": round(total_revenue, 2)
        })


#------------------------------ Addding test balance for payoutssss -----------------------------------
from rest_framework.permissions import IsAdminUser
from . serializers import AddTestBalanceSerializer
from django.conf import settings
import stripe
import logging

logger = logging.getLogger(__name__)

stripe.api_key = settings.STRIPE_SECRET_KEY


class AdminAddTestBalanceView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = AddTestBalanceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        amount_in_inr = serializer.validated_data["amount"]
        amount_in_paise = amount_in_inr * 100

        try:
            charge = stripe.Charge.create(
                amount=amount_in_paise,
                currency="inr",
                source="tok_bypassPending",
                description=f"Admin test balance top-up ₹{amount_in_inr}",
            )

            logger.info(f"Admin added ₹{amount_in_inr} to platform balance. Charge ID: {charge.id}")

            return Response({
                "message": f"Test balance of ₹{amount_in_inr} added successfully.",
                "charge_id": charge.id
            })

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error while adding test balance: {str(e)}")
            return Response({"error": str(e)}, status=500)

        except Exception as e:
            logger.exception("Unexpected error while adding test balance.")
            return Response({"error": "Internal server error."}, status=500)


# --------------------------------- Admin notifications


from .models import AdminNotification
from .serializers import AdminNotificationSerializer

class AdminNotificationsListView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        notifications = AdminNotification.objects.order_by('-created_at')[:10]  
        serializer = AdminNotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class AdminNotificationMarkReadView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        ids = request.data.get("notification_ids", [])

        if not isinstance(ids, list):
            return Response({"error": "notification_ids should be a list."}, status=400)

        updated_count = AdminNotification.objects.filter(id__in=ids).update(is_read=True)

        return Response({"message": f"{updated_count} notifications marked as read."})


# -------------------------------- Admin Quotes CRUD ---------------------------------------------------------
from rest_framework import viewsets
from .models import MotivationalQuote
from .serializers import MotivationalQuoteSerializer
from .models import MotivationalQuote
from .serializers import MotivationalQuoteSerializer

class MotivationalQuoteViewSet(viewsets.ModelViewSet):
    queryset = MotivationalQuote.objects.all().order_by('-created_at')
    serializer_class = MotivationalQuoteSerializer
    permission_classes = [IsAdminUser]

# -------------------------------- Admin Quotes CRUD ---------------------------------------------------------
from .models import MotivationalVideo
from .serializers import MotivationalVideoSerializer

class MotivationalVideoViewSet(viewsets.ModelViewSet):
    queryset = MotivationalVideo.objects.all().order_by('-created_at')
    serializer_class = MotivationalVideoSerializer
    permission_classes = [IsAdminUser]

# -------------------------------- Admin Quotes CRUD ---------------------------------------------------------
from rest_framework.parsers import MultiPartParser, FormParser
from .models import MotivationalBook
from .serializers import MotivationalBookSerializer

class MotivationalBookViewSet(viewsets.ModelViewSet):
    queryset = MotivationalBook.objects.all().order_by('-created_at')
    serializer_class = MotivationalBookSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

# -------------------------------- Daily Quote in the user side ---------------------------------------------------------
import random
from rest_framework.decorators import api_view

@api_view(['GET'])
def random_daily_quote(request):
    quotes = MotivationalQuote.objects.all()
    if quotes.exists():
        quote = random.choice(quotes)
        return Response({'id': quote.id, 'quote': quote.quote, 'author': quote.author})
    return Response({'message': 'No quotes available.'}, status=404)

# -------------------------------- Video in the user side ---------------------------------------------------------
from rest_framework import viewsets, filters
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 6

class MotivationalVideoPublicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MotivationalVideo.objects.all().order_by('-created_at')
    serializer_class = MotivationalVideoSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']
# -------------------------------- Books in the user side ---------------------------------------------------------

class MotivationalBookPublicViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = MotivationalBook.objects.all().order_by('-created_at')
    serializer_class = MotivationalBookSerializer
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['title']