# serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from courses.models import Course
from topics.models import MainTopic, Schedule, SubTopic, Question
from mentorship.models import SessionBooking, Feedback, Review
from cloudinary.utils import cloudinary_url

User = get_user_model()

# ------------------------------
# Learner User Serializer
# ------------------------------
class LearnerUserSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(source='user_profile.full_name')

    class Meta:
        model = User
        fields = ['id', 'email', 'full_name', 'created_at']

# ------------------------------
# Course Serializer
# ------------------------------
class CourseSerializer(serializers.ModelSerializer):
    category = serializers.StringRelatedField()

    class Meta:
        model = Course
        fields = ['id', 'title', 'description', 'category', 'created_at']

# ------------------------------
# Main Topics Serializer
# ------------------------------
class MainTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = MainTopic
        fields = ['id', 'title', 'description', 'created_at']

# ------------------------------
# Sub Topics Serializer
# ------------------------------
class SubTopicSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubTopic
        fields = ['id', 'title', 'description', 'completed', 'created_at']


class ScheduleSerializer(serializers.ModelSerializer):
    topic = serializers.CharField(source='topic.title', read_only=True)
    class Meta:
        model = Schedule
        fields = ['id', 'topic', 'date', 'start_time', 'end_time']


class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'created_at']


# ------------------------- Admin Session Serializers


class UserShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email']

class SessionBookingAdminSerializer(serializers.ModelSerializer):
    mentor = UserShortSerializer()
    learner = UserShortSerializer()
    duration = serializers.SerializerMethodField()

    class Meta:
        model = SessionBooking
        fields = [
            'id', 'mentor', 'learner', 'date', 'start_time', 'end_time',
            'status', 'duration'
        ]

    def get_duration(self, obj):
        from datetime import datetime, timedelta
        start = datetime.combine(obj.date, obj.start_time)
        end = datetime.combine(obj.date, obj.end_time)
        return str(end - start)



class FeedbackSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    audio = serializers.SerializerMethodField()
    video = serializers.SerializerMethodField()

    def get_image(self, obj):
        if obj.image:
            url, _ = cloudinary_url(obj.image.public_id)
            return url
        return None

    def get_video(self, obj):
        if obj.video:
            url, _ = cloudinary_url(obj.video.public_id, resource_type="video")
            return url
        return None

    def get_audio(self, obj):
        if obj.audio:
            url, _ = cloudinary_url(obj.audio.public_id, resource_type="video")  
            return url
        return None

    class Meta:
        model = Feedback
        fields = [
            'id', 'session', 'giver', 'receiver', 'message',
            'video', 'audio', 'image', 'external_links', 'created_at'
        ]
        read_only_fields = ['giver', 'receiver', 'created_at']
        extra_kwargs = {
            'message': {'required': False, 'allow_blank': True, 'allow_null': True},
            'video': {'required': False, 'allow_null': True},
            'audio': {'required': False, 'allow_null': True},
            'image': {'required': False, 'allow_null': True},
            'external_links': {'required': False, 'allow_blank': True, 'allow_null': True},
        }


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'



# -------------------------- test balance for payouts -----------------------------------------

class AddTestBalanceSerializer(serializers.Serializer):
    amount = serializers.IntegerField(min_value=1, help_text="Amount in INR")


# -------------------------- Admin Motivation quotes -----------------------------------------

from .models import MotivationalQuote

class MotivationalQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivationalQuote
        fields = '__all__'

# -------------------------- Admin Motivation video -----------------------------------------
from .models import MotivationalVideo

class MotivationalVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivationalVideo
        fields = '__all__'

# -------------------------- Admin Motivational books -----------------------------------------
from rest_framework import serializers
from .models import MotivationalBook
import cloudinary.utils

class MotivationalBookSerializer(serializers.ModelSerializer):
    pdf_file_url = serializers.SerializerMethodField()
    pdf_image_url = serializers.SerializerMethodField()

    class Meta:
        model = MotivationalBook
        fields = ['id', 'title', 'pdf_file', 'pdf_image', 'pdf_file_url', 'pdf_image_url', 'created_at']
        read_only_fields = ['id', 'created_at', 'pdf_file_url', 'pdf_image_url']

    def get_pdf_file_url(self, obj):
        return f"{obj.pdf_file.url}?fl_attachment" if obj.pdf_file else ""

    def get_pdf_image_url(self, obj):
        return obj.pdf_image.url if obj.pdf_image else ""

# -------------------------- Admin Review -----------------------------------------
from .models import AdminReview

class AdminReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source="user.email", read_only=True)

    class Meta:
        model = AdminReview
        fields = ['id', 'user', 'user_email', 'review', 'rating', 'created_at']
        read_only_fields = ['user', 'user_email', 'created_at']

# -------------------------------------------------------------------
# For Report and CMS
# -------------------------------------------------------------------
# your_app_name/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
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
from decimal import Decimal
import logging
from django.db.models import Sum

logger = logging.getLogger(__name__)

User = get_user_model()

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name']

class UserProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            return obj.profile_picture.url
        return None

class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    user_profile = UserProfileSerializer(read_only=True)
    total_wallet_balance = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'role', 'is_active', 'is_staff', 'created_at',
            'stripe_customer_id', 'is_premium', 'full_name', 'user_profile',
            'total_wallet_balance'
        ]
        read_only_fields = ['created_at']

    def get_total_wallet_balance(self, obj):
        total_balance = obj.wallets.aggregate(Sum('balance'))['balance__sum']
        return total_balance if total_balance is not None else Decimal('0.00')

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class CourseSerializer(serializers.ModelSerializer):
    learner_email = serializers.ReadOnlyField(source='learner.email')
    category_name = serializers.ReadOnlyField(source='category.name')

    class Meta:
        model = Course
        fields = '__all__'
        read_only_fields = ['created_at']

class MainTopicSerializer(serializers.ModelSerializer):
    course_title = serializers.ReadOnlyField(source='course.title')
    created_by_email = serializers.ReadOnlyField(source='created_by.email')

    class Meta:
        model = MainTopic
        fields = '__all__'
        read_only_fields = ['created_at']

class SubTopicSerializer(serializers.ModelSerializer):
    main_topic_title = serializers.ReadOnlyField(source='main_topic.title')
    created_by_email = serializers.ReadOnlyField(source='created_by.email')

    class Meta:
        model = SubTopic
        fields = '__all__'
        read_only_fields = ['created_at']

class QuestionSerializer(serializers.ModelSerializer):
    created_by_email = serializers.ReadOnlyField(source='created_by.email')
    main_topic_title = serializers.ReadOnlyField(source='main_topic.title')
    answer = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_answer(self, obj):
        # Use try-except to handle cases where there's no answer for a question (OneToOneField)
        try:
            return AnswerSerializer(obj.answer).data
        except Answer.DoesNotExist:
            return None

class AnswerSerializer(serializers.ModelSerializer):
    created_by_email = serializers.ReadOnlyField(source='created_by.email')
    question_text_preview = serializers.ReadOnlyField(source='question.question_text')

    class Meta:
        model = Answer
        fields = '__all__'
        read_only_fields = ['created_at']

class ScheduleSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    topic_title = serializers.ReadOnlyField(source='topic.title')

    class Meta:
        model = Schedule
        fields = '__all__'

class MentorAvailabilitySerializer(serializers.ModelSerializer):
    mentor_email = serializers.ReadOnlyField(source='mentor.email')

    class Meta:
        model = MentorAvailability
        fields = '__all__'

class SessionBookingSerializer(serializers.ModelSerializer):
    learner_email = serializers.ReadOnlyField(source='learner.email')
    mentor_email = serializers.ReadOnlyField(source='mentor.email')
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_status_display = serializers.CharField(source='get_payment_status_display', read_only=True)

    class Meta:
        model = SessionBooking
        fields = '__all__'
        read_only_fields = ['created_at', 'captured_at']

class StripeAccountSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)

    class Meta:
        model = StripeAccount
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class ReviewSerializer(serializers.ModelSerializer):
    reviewer_email = serializers.ReadOnlyField(source='reviewer.email')
    reviewee_email = serializers.ReadOnlyField(source='reviewee.email')
    session_id = serializers.ReadOnlyField(source='session.id')

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ['created_at']

class FeedbackSerializer(serializers.ModelSerializer):
    giver_email = serializers.ReadOnlyField(source='giver.email')
    receiver_email = serializers.ReadOnlyField(source='receiver.email')
    session_id = serializers.ReadOnlyField(source='session.id')
    video_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()
    external_links_list = serializers.SerializerMethodField()

    class Meta:
        model = Feedback
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_video_url(self, obj):
        return obj.video.url if obj.video else None

    def get_audio_url(self, obj):
        return obj.audio.url if obj.audio else None

    def get_image_url(self, obj):
        return obj.image.url if obj.image else None

    def get_pdf_url(self, obj):
        return obj.pdf.url if obj.pdf else None

    def get_external_links_list(self, obj):
        return obj.get_links_list()

class LearnerPremiumSubscriptionSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = LearnerPremiumSubscription
        fields = '__all__'
        read_only_fields = ['created_at']

class ReferralCodeSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')

    class Meta:
        model = ReferralCode
        fields = '__all__'
        read_only_fields = ['created_at']

class ReferralEarningSerializer(serializers.ModelSerializer):
    referrer_email = serializers.ReadOnlyField(source='referrer.email')
    referred_user_email = serializers.ReadOnlyField(source='referred_user.email')

    class Meta:
        model = ReferralEarning
        fields = '__all__'
        read_only_fields = ['created_at']

class WalletSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    wallet_type_display = serializers.CharField(source='get_wallet_type_display', read_only=True)

    class Meta:
        model = Wallet
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class WalletTransactionSerializer(serializers.ModelSerializer):
    wallet_user_email = serializers.ReadOnlyField(source='wallet.user.email')
    wallet_type = serializers.ReadOnlyField(source='wallet.wallet_type')
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)

    class Meta:
        model = WalletTransaction
        fields = '__all__'
        read_only_fields = ['timestamp']

class HabitSerializer(serializers.ModelSerializer):
    learner_email = serializers.ReadOnlyField(source='learner.email')

    class Meta:
        model = Habit
        fields = '__all__'
        read_only_fields = ['created_at']

class HabitProgressSerializer(serializers.ModelSerializer):
    habit_title = serializers.ReadOnlyField(source='habit.title')
    learner_email = serializers.ReadOnlyField(source='habit.learner.email')

    class Meta:
        model = HabitProgress
        fields = '__all__'
        read_only_fields = ['completed_at']

class NotificationSerializer(serializers.ModelSerializer):
    recipient_email = serializers.ReadOnlyField(source='recipient.email')

    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ['timestamp']

class AdminReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.ReadOnlyField(source='user.email')
    rating_display = serializers.CharField(source='get_rating_display', read_only=True)

    class Meta:
        model = AdminReview
        fields = '__all__'
        read_only_fields = ['created_at']

class MotivationalQuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivationalQuote
        fields = '__all__'
        read_only_fields = ['created_at']

class MotivationalVideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = MotivationalVideo
        fields = '__all__'
        read_only_fields = ['created_at']

class MotivationalBookSerializer(serializers.ModelSerializer):
    pdf_image_url = serializers.SerializerMethodField()
    pdf_file_url = serializers.SerializerMethodField()

    class Meta:
        model = MotivationalBook
        fields = '__all__'
        read_only_fields = ['created_at']

    def get_pdf_image_url(self, obj):
        return obj.pdf_image.url if obj.pdf_image else None

    def get_pdf_file_url(self, obj):
        return obj.pdf_file.url if obj.pdf_file else None

# --- Integrated Report Specific Serializers ---

class ConsolidatedUserReportSerializer(UserSerializer):
    # This serializer aggregates data from related models for a single user
    total_courses = serializers.SerializerMethodField()
    total_sessions_as_learner = serializers.SerializerMethodField()
    total_sessions_as_mentor = serializers.SerializerMethodField()
    total_questions_asked = serializers.SerializerMethodField()
    total_answers_given = serializers.SerializerMethodField()
    total_habits_created = serializers.SerializerMethodField()

    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'total_courses', 'total_sessions_as_learner', 'total_sessions_as_mentor',
            'total_questions_asked', 'total_answers_given', 'total_habits_created'
        ]

    def get_total_courses(self, obj):
        return obj.courses.count()

    def get_total_sessions_as_learner(self, obj):
        return obj.learner_sessions.count()

    def get_total_sessions_as_mentor(self, obj):
        return obj.mentor_sessions.count()

    def get_total_questions_asked(self, obj):
        return obj.revision_questions.count()

    def get_total_answers_given(self, obj):
        return obj.revision_answers.count()

    def get_total_habits_created(self, obj):
        return obj.habit_set.count() # Use habit_set as the default related_name if not specified

class SessionBookingReportSerializer(serializers.ModelSerializer):
    learner_full_name = serializers.SerializerMethodField()
    mentor_full_name = serializers.SerializerMethodField()
    review = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()
    session_date = serializers.DateField(source='date')
    session_time = serializers.TimeField(source='start_time')

    class Meta:
        model = SessionBooking
        fields = [
            'id', 'learner', 'mentor', 'session_date', 'session_time',
            'status', 'created_at', 'start_time', 'end_time', 'amount', 'payment_status',
            'learner_full_name', 'mentor_full_name', 'review', 'feedback',
        ]

    def get_learner_full_name(self, obj):
        return getattr(obj.learner.user_profile, 'full_name', obj.learner.email)

    def get_mentor_full_name(self, obj):
        return getattr(obj.mentor.user_profile, 'full_name', obj.mentor.email)

    def get_review(self, obj):
        return getattr(obj, 'review', '')

    def get_feedback(self, obj):
        return getattr(obj, 'feedback', '')


