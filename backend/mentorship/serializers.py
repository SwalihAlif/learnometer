from rest_framework import serializers
from users.models import UserProfile
from .models import (
    MentorAvailability,
    SessionBooking,
    PaymentTransaction,
    SessionFeedbackReview
)
from django.contrib.auth import get_user_model
from datetime import datetime, time
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

# ------------------------------
# Mentor Public Profile Serializer
# ------------------------------
class MentorPublicProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email')  # nested from User model
    profile_picture = serializers.ImageField(required=False)

    class Meta:
        model = UserProfile
        fields = [
            'user_id',
            'email',
            'full_name',
            'bio',
            'experience_years',
            'profile_picture',
            'preferred_categories',
            'languages_known',
        ]
# ------------------------------
# Mentor Availability Serializer
# ------------------------------

from django.utils.timezone import make_aware, localtime


class MentorAvailabilitySerializer(serializers.ModelSerializer):
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)
    mentor_name = serializers.CharField(source='mentor.user_profile.full_name', read_only=True)
    mentor_profile_picture = serializers.SerializerMethodField()

    time_slot_duration = serializers.SerializerMethodField()
    start_time_iso = serializers.SerializerMethodField()
    end_time_iso = serializers.SerializerMethodField()
    start_time_ampm = serializers.SerializerMethodField()
    end_time_ampm = serializers.SerializerMethodField()

    class Meta:
        model = MentorAvailability
        fields = [
            'id',
            'mentor',
            'mentor_email',
            'mentor_name',
            'mentor_profile_picture',
            'date',
            'start_time',
            'end_time',
            'start_time_iso',
            'end_time_iso',
            'start_time_ampm',
            'end_time_ampm',
            'time_slot_duration',
            'is_booked',
            'session_price',
        ]
        read_only_fields = [
            'id', 'mentor', 'mentor_email', 'mentor_name', 'mentor_profile_picture',
            'is_booked', 'time_slot_duration',
            'start_time_iso', 'end_time_iso',
            'start_time_ampm', 'end_time_ampm'
        ]

    def get_mentor_profile_picture(self, obj):
        if hasattr(obj.mentor, 'user_profile') and obj.mentor.user_profile.profile_picture:
            return obj.mentor.user_profile.profile_picture.url
        return None

    def get_time_slot_duration(self, obj):
        start = datetime.combine(obj.date, obj.start_time)
        end = datetime.combine(obj.date, obj.end_time)
        return int((end - start).total_seconds() / 60)

    def _get_local_datetime(self, date_obj, time_obj):
        """Helper to return timezone-aware datetime in local time."""
        aware_dt = make_aware(datetime.combine(date_obj, time_obj))
        return localtime(aware_dt)

    def get_start_time_iso(self, obj):
        return self._get_local_datetime(obj.date, obj.start_time).isoformat()

    def get_end_time_iso(self, obj):
        return self._get_local_datetime(obj.date, obj.end_time).isoformat()

    def get_start_time_ampm(self, obj):
        return self._get_local_datetime(obj.date, obj.start_time).strftime("%I:%M %p")

    def get_end_time_ampm(self, obj):
        return self._get_local_datetime(obj.date, obj.end_time).strftime("%I:%M %p")

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['mentor'] = request.user
        return super().create(validated_data)




# ------------------------------
# Session Booking Serializer
# ------------------------------
from rest_framework import serializers
from .models import SessionBooking
from datetime import date as date_cls
import logging

logger = logging.getLogger(__name__)

class SessionBookingSerializer(serializers.ModelSerializer):
    learner_name = serializers.CharField(source='learner.user_profile.full_name', read_only=True)
    mentor_name = serializers.CharField(source='mentor.user_profile.full_name', read_only=True)
    learner_email = serializers.EmailField(source='learner.email', read_only=True)
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)

    class Meta:
        model = SessionBooking
        fields = [
            'id', 'learner', 'learner_name', 'learner_email',
            'mentor', 'mentor_name', 'mentor_email',
            'date', 'start_time', 'end_time',
            'status', 'payment_status', 'meeting_link',
            'topic_focus', 'created_at'
        ]
        read_only_fields = [
            'id', 'learner', 'status', 'payment_status',
            'created_at', 'learner_name', 'mentor_name', 'learner_email', 'mentor_email'
        ]

    def validate_date(self, value):
        if value < date_cls.today():
            raise serializers.ValidationError("Cannot book sessions in the past.")
        return value

    def validate(self, data):
        mentor = data['mentor']
        date = data['date']
        start_time = data['start_time']

        if SessionBooking.objects.filter(
            mentor=mentor,
            date=date,
            start_time=start_time,
            status__in=[
                SessionBooking.Status.PENDING,
                SessionBooking.Status.CONFIRMED
            ]
        ).exists():
            raise serializers.ValidationError("This time slot is already booked.")
        return data

    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['learner'] = request.user

        logger.info(
            f"Booking session: learner={request.user.email}, mentor={validated_data.get('mentor')}, "
            f"date={validated_data.get('date')}, start={validated_data.get('start_time')}, "
            f"end={validated_data.get('end_time')}"
        )

        return super().create(validated_data)



# ------------------------------
# Payment Transaction Serializer
# ------------------------------
class PaymentTransactionSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(source='booking.id', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = [
            'id',
            'booking',
            'session_id',
            'amount',
            'payment_gateway',
            'transaction_id',
            'status',
            'refund_reason',
            'timestamp',
        ]
        read_only_fields = ['timestamp', 'status']


# ------------------------------
# Session Feedback & Review Serializer
# ------------------------------
class SessionFeedbackReviewSerializer(serializers.ModelSerializer):
    session_id = serializers.IntegerField(source='session.id', read_only=True)
    mentor_email = serializers.EmailField(source='session.mentor.email', read_only=True)
    learner_email = serializers.EmailField(source='session.learner.email', read_only=True)

    class Meta:
        model = SessionFeedbackReview
        fields = [
            'id',
            'session',
            'session_id',
            'mentor_email',
            'learner_email',
            'feedback_from_mentor',
            'rating_by_learner',
            'review_by_learner',
            'is_public',
            'created_at',
        ]
        read_only_fields = ['created_at']
