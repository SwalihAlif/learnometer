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
from mentorship.models import StripeAccount
from notification.utils import notify_admins_and_staff
from django.http import HttpResponse


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

# ----------------------------
# Admin Stripe account creation
# ----------------------------
class CreateAdminPaymentAccountView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        user = request.user

        try:
                try:
                    platform_owner_user = User.objects.get(email=settings.PLATFORM_OWNER_EMAIL)
                    if platform_owner_user != user:
                        logger.error(f"The user is not a platform owner!")
                        return Response({"error": "user is not authorized."}, status=403)
                except User.DoesNotExist:
                    logger.error(f"PLATFORM_OWNER_EMAIL '{settings.PLATFORM_OWNER_EMAIL}' not found in database. Cannot create admin Stripe account.")
                    return Response({"error": "Platform owner user not configured correctly."}, status=500)


                # Ensure StripeAccount exists with learner account_type
                stripe_account, _ = StripeAccount.objects.get_or_create(
                    user=user,
                    account_type="admin",
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
                        return_url=f"{settings.FRONTEND_URL}/admin/wallet/",
                        type="account_onboarding",
                    )
                    return Response({
                        "onboarding_required": True,
                        "onboarding_url": onboarding_link.url
                    })


        except Exception as e:
            logger.exception("Error during admin stripe creation")
            return Response({"error": str(e)}, status=500)
        
# ----------------------------
# Admin Stripe account status
# ----------------------------
class CheckStripeOnboardingStatus(APIView):
    def get(self, request):
        user = request.user
        try:
            stripe_account = StripeAccount.objects.get(user=user)
            account = stripe.Account.retrieve(stripe_account.stripe_account_id)
            onboarding_complete = account.capabilities.get("transfers") == "active"
            return Response({'onboarding_complete': onboarding_complete})
        except Exception as e:
            return Response({'error': str(e)}, status=400)
        

# ----------------------------
# USER Review CRUD on the app
# ----------------------------
from rest_framework import viewsets, permissions
from rest_framework.exceptions import PermissionDenied
from .models import AdminReview
from .serializers import AdminReviewSerializer

class AdminReviewViewSet(viewsets.ModelViewSet):
    serializer_class = AdminReviewSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AdminReview.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        review = serializer.save(user=self.request.user)
        notify_admins_and_staff(
            f"New review submitted by {self.request.user.email}: {review.rating}"
        )

    def perform_update(self, serializer):
        if self.get_object().user != self.request.user:
            raise PermissionDenied("You cannot edit someone else's review.")
        review = serializer.save()
        notify_admins_and_staff(
            f"Review updated by {self.request.user.email}: {review.rating}"
        )

    def perform_destroy(self, instance):
        if instance.user != self.request.user:
            raise PermissionDenied("You cannot delete someone else's review.")
        instance.delete()

# ----------------------------
# Admin view the reviews
# ----------------------------
from rest_framework.permissions import IsAdminUser
from rest_framework.viewsets import ReadOnlyModelViewSet
from .models import AdminReview
from .serializers import AdminReviewSerializer

class AdminAllReviewsViewSet(ReadOnlyModelViewSet):
    queryset = AdminReview.objects.select_related('user').all().order_by('-created_at')
    serializer_class = AdminReviewSerializer
    permission_classes = [IsAdminUser]



# your_app_name/views.py
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.filters import SearchFilter, OrderingFilter
from django_filters.rest_framework import DjangoFilterBackend
from django.contrib.auth import get_user_model
from django.db.models import F, ExpressionWrapper, DecimalField, Sum
from django.utils import timezone
import io
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.units import inch
from drf_excel.mixins import XLSXFileMixin
from drf_excel.renderers import XLSXRenderer


from .models import (
    AdminReview,
    MotivationalQuote, MotivationalVideo, MotivationalBook
)
from courses.models import Category, Course
from users.models import Role, UserProfile
from topics.models import Answer, MainTopic, SubTopic, Question, Schedule
from mentorship.models import MentorAvailability, StripeAccount, Review, Feedback, SessionBooking
from habits.models import Habit, HabitProgress
from notification.models import Notification
from premium.models import LearnerPremiumSubscription, ReferralCode, ReferralEarning, Wallet, WalletTransaction
from .serializers import (
    UserSerializer, UserProfileSerializer, RoleSerializer, CategorySerializer,
    CourseSerializer, MainTopicSerializer, SubTopicSerializer, QuestionSerializer,
    AnswerSerializer, ScheduleSerializer, MentorAvailabilitySerializer,
    SessionBookingSerializer, StripeAccountSerializer, ReviewSerializer,
    FeedbackSerializer, LearnerPremiumSubscriptionSerializer, ReferralCodeSerializer,
    ReferralEarningSerializer, WalletSerializer, WalletTransactionSerializer,
    HabitSerializer, HabitProgressSerializer, NotificationSerializer,
    AdminReviewSerializer, MotivationalQuoteSerializer, MotivationalVideoSerializer,
    MotivationalBookSerializer,
    ConsolidatedUserReportSerializer, SessionBookingReportSerializer
)

User = get_user_model()

# --- Custom Pagination Class (Optional, if you want specific page size controls) ---
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

# --- General Report List Views (with pagination and filtering) ---

class BaseReportListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    search_fields = [] # To be defined by subclasses
    ordering_fields = [] # To be defined by subclasses

class UserReportListView(BaseReportListView):
    queryset = User.objects.all().select_related('role', 'user_profile').prefetch_related('wallets')
    serializer_class = ConsolidatedUserReportSerializer
    search_fields = ['email', 'user_profile__full_name', 'role__name']
    ordering_fields = ['email', 'created_at', 'role__name', 'is_active', 'total_wallet_balance'] # total_wallet_balance needs annotation for ordering


class UserProfileReportListView(BaseReportListView):
    queryset = UserProfile.objects.all().select_related('user')
    serializer_class = UserProfileSerializer
    search_fields = ['user__email', 'full_name', 'bio', 'phone']
    ordering_fields = ['user__email', 'created_at']

class CourseReportListView(BaseReportListView):
    queryset = Course.objects.all().select_related('learner', 'category')
    serializer_class = CourseSerializer
    search_fields = ['title', 'description', 'learner__email', 'category__name']
    ordering_fields = ['title', 'created_at']

class MainTopicReportListView(BaseReportListView):
    queryset = MainTopic.objects.all().select_related('course', 'created_by')
    serializer_class = MainTopicSerializer
    search_fields = ['title', 'description', 'course__title', 'created_by__email']
    ordering_fields = ['title', 'created_at']

class SubTopicReportListView(BaseReportListView):
    queryset = SubTopic.objects.all().select_related('main_topic', 'created_by')
    serializer_class = SubTopicSerializer
    search_fields = ['title', 'description', 'main_topic__title', 'created_by__email']
    ordering_fields = ['title', 'created_at', 'completed']

class QuestionReportListView(BaseReportListView):
    queryset = Question.objects.all().select_related('created_by', 'main_topic')
    serializer_class = QuestionSerializer
    search_fields = ['question_text', 'created_by__email', 'main_topic__title']
    ordering_fields = ['created_at']

class AnswerReportListView(BaseReportListView):
    queryset = Answer.objects.all().select_related('created_by', 'question')
    serializer_class = AnswerSerializer
    search_fields = ['answer_text', 'created_by__email', 'question__question_text']
    ordering_fields = ['created_at', 'is_ai_generated']

class SessionBookingReportListView(BaseReportListView):
    queryset = SessionBooking.objects.all().select_related('learner', 'mentor').prefetch_related('review', 'feedback')
    serializer_class = SessionBookingReportSerializer
    search_fields = ['learner__email', 'mentor__email', 'topic_focus', 'status', 'payment_status']
    filterset_fields = ['status', 'payment_status', 'date']
    ordering_fields = ['created_at', 'date', 'amount', 'status', 'payment_status']

class ReviewReportListView(BaseReportListView):
    queryset = Review.objects.all().select_related('reviewer', 'reviewee', 'session')
    serializer_class = ReviewSerializer
    search_fields = ['reviewer__email', 'reviewee__email', 'comment']
    filterset_fields = ['rating']
    ordering_fields = ['created_at', 'rating']

class FeedbackReportListView(BaseReportListView):
    queryset = Feedback.objects.all().select_related('giver', 'receiver', 'session')
    serializer_class = FeedbackSerializer
    search_fields = ['giver__email', 'receiver__email', 'message']
    ordering_fields = ['created_at']

class WalletTransactionReportListView(BaseReportListView):
    queryset = WalletTransaction.objects.all().select_related('wallet__user')
    serializer_class = WalletTransactionSerializer
    search_fields = ['wallet__user__email', 'transaction_type', 'description']
    filterset_fields = ['transaction_type']
    ordering_fields = ['timestamp', 'amount'] 

# Add more list views for other models as needed following the pattern above.
# Example for MotivationalBook:
class MotivationalBookReportListView(BaseReportListView):
    queryset = MotivationalBook.objects.all()
    serializer_class = MotivationalBookSerializer
    search_fields = ['title']
    ordering_fields = ['created_at']

# --- Export Views (PDF and Excel) ---

class BaseExportView(APIView):
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        # Override in subclasses to provide the base queryset
        raise NotImplementedError

    def get_serializer_class(self):
        # Override in subclasses to provide the serializer class
        raise NotImplementedError

    def get_filtered_queryset(self):
        queryset = self.get_queryset()
        # Apply DjangoFilterBackend filters
        filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
        for backend in filter_backends:
            queryset = backend().filter_queryset(self.request, queryset, self)
        return queryset

class UserExportXLSX(XLSXFileMixin, BaseExportView):
    serializer_class = ConsolidatedUserReportSerializer
    filename = 'users_report.xlsx'
    renderer_classes = (XLSXRenderer,)

    def get_queryset(self):
        view = UserReportListView()
        return view.get_queryset()

    def get_filtered_queryset(self):
        # If BaseExportView has filtering logic, keep it
        return super().get_filtered_queryset()

    def get_serializer(self, *args, **kwargs):
        """Required for XLSXRenderer"""
        return self.serializer_class(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        queryset = self.get_filtered_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    




class SessionBookingExportXLSX(XLSXFileMixin, BaseExportView):
    serializer_class = SessionBookingReportSerializer
    filename = 'session_bookings_report.xlsx'
    renderer_classes = (XLSXRenderer,)

    def get_queryset(self):
        view = SessionBookingReportListView()
        return view.get_queryset()

    def get_filtered_queryset(self):
        # If BaseExportView has filtering logic, keep it
        return super().get_filtered_queryset()

    def get_serializer(self, *args, **kwargs):
        """Required for XLSXRenderer"""
        return self.serializer_class(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        queryset = self.get_filtered_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    

    
class SessionBookingExportXLSX(XLSXFileMixin, BaseExportView):
    serializer_class = SessionBookingReportSerializer
    filename = 'session_bookings_report.xlsx'
    renderer_classes = (XLSXRenderer,)

    def get_queryset(self):
        view = SessionBookingReportListView()
        return view.get_queryset()

    def get_filtered_queryset(self):
        # If BaseExportView has filtering logic, keep it
        return super().get_filtered_queryset()

    def get_serializer(self, *args, **kwargs):
        """Required for XLSXRenderer"""
        return self.serializer_class(*args, **kwargs)

    def get(self, request, *args, **kwargs):
        queryset = self.get_filtered_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

# Add more XLSX export views for other models similarly.

class UserExportPDF(BaseExportView):
    serializer_class = ConsolidatedUserReportSerializer

    def get_queryset(self):
        view = UserReportListView()
        return view.get_queryset()

    def get(self, request, *args, **kwargs):
        queryset = self.get_filtered_queryset()
        serializer = self.serializer_class(queryset, many=True)
        data = serializer.data

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()

        elements = []
        elements.append(Paragraph("User Report", styles['h1']))
        elements.append(Spacer(1, 0.2 * inch))

        # Define table data
        table_data = [['ID', 'Email', 'Role', 'Full Name', 'Active', 'Staff', 'Created At', 'Wallet Balance']]
        for user_data in data:
            table_data.append([
                user_data.get('id', ''),
                user_data.get('email', ''),
                user_data.get('role', {}).get('name', '') if user_data.get('role') else '',
                user_data.get('full_name', ''),
                'Yes' if user_data.get('is_active') else 'No',
                'Yes' if user_data.get('is_staff') else 'No',
                user_data.get('created_at', '')[:10], # Just date
                f"INR {user_data.get('total_wallet_balance', 0.00)}"
            ])

        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ])

        table = Table(table_data)
        table.setStyle(table_style)
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="users_report.pdf"'
        return response


class SessionBookingExportPDF(BaseExportView):
    serializer_class = SessionBookingReportSerializer

    def get_queryset(self):
        view = SessionBookingReportListView()
        return view.get_queryset()

    def get(self, request, *args, **kwargs):
        queryset = self.get_filtered_queryset()
        serializer = self.serializer_class(queryset, many=True)
        data = serializer.data

        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        inch = 72

        elements = []
        elements.append(Paragraph("Session Booking Report", styles['h1']))
        elements.append(Spacer(1, 0.2 * inch))

        table_data = [['ID', 'Learner', 'Mentor', 'Date', 'Time', 'Amount', 'Status', 'Payment Status']]
        for session_data in data:
            table_data.append([
                session_data.get('id', ''),
                session_data.get('learner_full_name', session_data.get('learner_email', '')),
                session_data.get('mentor_full_name', session_data.get('mentor_email', '')),
                session_data.get('date', ''),
                f"{session_data.get('start_time', '')} - {session_data.get('end_time', '')}",
                f"INR {session_data.get('amount', 0.00)}",
                session_data.get('status_display', ''),
                session_data.get('payment_status_display', '')
            ])

        table_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.darkgreen),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgreen),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ])

        table = Table(table_data)
        table.setStyle(table_style)
        elements.append(table)

        doc.build(elements)
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="session_bookings_report.pdf"'
        return response


# Add more PDF export views for other models similarly.

# --------------------------------- Admin - User's Habit Tracker ----------------------------------------------------
from django.core.paginator import Paginator
from django.http import JsonResponse
from habits.models import Habit
import logging

logger = logging.getLogger(__name__)

def admin_habit_report(request):
    page_number = request.GET.get('page', 1)
    page_size = 10  # 🔧 You can adjust this based on UI needs

    habits = Habit.objects.prefetch_related('progress').select_related('learner')
    paginator = Paginator(habits, page_size)
    page = paginator.get_page(page_number)

    data = []

    for habit in page.object_list:
        completed_days = habit.progress.filter(is_completed=True).count()
        logger.info(f"[Habit Report] {habit.title} - Completed days: {completed_days}")

        status = "Completed" if completed_days >= habit.total_days else "Not Completed"

        data.append({
            'learner': habit.learner.get_full_name(),    # Safely returns full_name or email
            'habit': habit.title,
            'days': habit.total_days,
            'completed_days': completed_days,
            'status': status
        })

    return JsonResponse({
        'results': data,
        'total_pages': paginator.num_pages,
        'current_page': page.number,
        'has_next': page.has_next(),
        'has_previous': page.has_previous(),
    })


