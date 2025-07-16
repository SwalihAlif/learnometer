from rest_framework import serializers
from users.models import UserProfile
from .models import (
    MentorAvailability,
    SessionBooking
)
from django.contrib.auth import get_user_model
from datetime import datetime, time
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

# ------------------------------
# Mentor Availability Serializer
# ------------------------------

from django.utils.timezone import make_aware, localtime
from datetime import date, datetime, time
from django.utils.timezone import localtime, now


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
    
    def validate_date(self, value):
        if value < date.today():
            raise serializers.ValidationError("You cannot create a slot for a past date.")
        return value
    def validate(self, attrs):
        selected_date = attrs.get("date")
        start_time = attrs.get("start_time")

        if selected_date == date.today():
            # Get current local time (timezone-aware)
            current_time = localtime(now()).time()

            if start_time <= current_time:
                raise serializers.ValidationError({
                    "start_time": "Start time must be in the future for today's date."
                })

        return attrs
    

# ------------------------------
# Mentor Public Profile Serializer
# ------------------------------
from rest_framework import serializers
from mentorship.models import MentorAvailability
from mentorship.serializers import MentorAvailabilitySerializer 
from django.utils.timezone import now

class MentorPublicProfileSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    email = serializers.EmailField(source='user.email')
    slots = serializers.SerializerMethodField()
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
            'slots',
        ]

    def get_slots(self, obj):
        upcoming = MentorAvailability.objects.filter(
            mentor=obj.user,
            date__gte=now().date()
        ).order_by('date', 'start_time')
        return MentorAvailabilitySerializer(upcoming, many=True).data



# ------------------------------
# Session Booking Serializer
# ------------------------------
# mentorship/serializers.py

from rest_framework import serializers
from datetime import date as date_cls
from datetime import datetime
from .models import SessionBooking
import logging

logger = logging.getLogger(__name__)

class SessionBookingSerializer(serializers.ModelSerializer):
    # Computed / related fields
    learner_name = serializers.CharField(source='learner.user_profile.full_name', read_only=True)
    mentor_name = serializers.CharField(source='mentor.user_profile.full_name', read_only=True)
    learner_email = serializers.EmailField(source='learner.email', read_only=True)
    mentor_email = serializers.EmailField(source='mentor.email', read_only=True)

    # Stripe/payment-related fields (readonly, set in view)
    amount = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    platform_fee = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    mentor_payout = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)
    stripe_payment_intent_id = serializers.CharField(read_only=True)
    is_completed_and_paid = serializers.SerializerMethodField()

    # for time count down
    meeting_datetime = serializers.SerializerMethodField()

    class Meta:
        model = SessionBooking
        fields = [
            'id',
            'learner', 'learner_name', 'learner_email',
            'mentor', 'mentor_name', 'mentor_email',
            'date', 'start_time', 'end_time',
            'status', 'payment_status',
            'meeting_link', 'topic_focus', 'created_at',
            'amount', 'platform_fee', 'mentor_payout', 'stripe_payment_intent_id',
            'captured_at', 'is_payment_captured', 
            'is_completed_and_paid', 
            'meeting_datetime',
        ]
        read_only_fields = [
            'id', 'learner', 'learner_name', 'learner_email',
            'mentor_name', 'mentor_email',
            'status', 'payment_status',
            'created_at', 'amount', 'platform_fee',
            'mentor_payout', 'stripe_payment_intent_id',
            'captured_at', 'is_payment_captured',
        ]

    def validate_date(self, value):
        """Prevent booking in the past."""
        if value < date_cls.today():
            raise serializers.ValidationError("Cannot book sessions in the past.")
        return value

    def validate(self, data):
        mentor = data.get('mentor')
        date = data.get('date')
        start_time = data.get('start_time')

        if not all([mentor, date, start_time]):
            raise serializers.ValidationError("Missing required booking fields.")

        # Prevent duplicate slot
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
            f"SessionBooking -> Creating: learner={request.user.email}, mentor={validated_data.get('mentor')}, "
            f"date={validated_data.get('date')}, start={validated_data.get('start_time')}"
        )

        return super().create(validated_data)

    def get_is_completed_and_paid(self, obj):
        return obj.status == "completed" and obj.payment_status == "released"
    
    def get_meeting_datetime(self, obj):
        dt = datetime.combine(obj.date, obj.start_time)
        return dt.isoformat()

# ------------------------------
# Session Review Serializer
# ------------------------------

from .models import StripeAccount

class StripeAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = StripeAccount
        fields = [
            'stripe_account_id',
            'onboarding_complete',
            'account_type',
            'wallet_balance',
        ]
        read_only_fields = [
            'stripe_account_id',
            'onboarding_complete',
            'account_type',
            'wallet_balance',
        ]




# ------------------------------
# Session Review Serializer
# ------------------------------
from rest_framework import serializers
from .models import Review

class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ['id', 'session', 'reviewer', 'reviewee', 'rating', 'comment', 'created_at']
        read_only_fields = ['reviewer', 'reviewee', 'created_at']



# ------------------------------
# Session Feedback Serializer
# ------------------------------

from rest_framework import serializers
from .models import Feedback
from cloudinary.utils import cloudinary_url

class FeedbackSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()
    video_url = serializers.SerializerMethodField()
    audio_url = serializers.SerializerMethodField()
    pdf_url = serializers.SerializerMethodField()

    def get_image_url(self, obj):
        if obj.image:
            url, _ = cloudinary_url(str(obj.image.public_id))
            return url
        return None

    def get_video_url(self, obj):
        if obj.video:
            url, _ = cloudinary_url(str(obj.video), resource_type="video")
            return url
        return None

    def get_audio_url(self, obj):
        if obj.audio:
            url, _ = cloudinary_url(str(obj.audio), resource_type="video")
            return url
        return None

    def get_pdf_url(self, obj):
        if obj.pdf:
            url, _ = cloudinary_url(str(obj.pdf), resource_type="raw")
            return url
        return None

    class Meta:
        model = Feedback
        fields = [
            'id', 'session', 'giver', 'receiver', 'message',
            'video', 'audio', 'image', 'pdf',
            'video_url', 'audio_url', 'image_url', 'pdf_url',
            'external_links', 'created_at'
        ]
        read_only_fields = ['giver', 'receiver', 'created_at']
        extra_kwargs = {
            'message': {'required': False, 'allow_blank': True, 'allow_null': True},
            'video': {'required': False, 'allow_null': True},
            'audio': {'required': False, 'allow_null': True},
            'image': {'required': False, 'allow_null': True},
            'pdf': {'required': False, 'allow_null': True},
            'external_links': {'required': False, 'allow_blank': True, 'allow_null': True},
        }








# ------------------------------
# Payment Transaction Serializer
# ------------------------------


from rest_framework import serializers
from .models import Checking

class CheckingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Checking
        fields = '__all__'
        extra_kwargs = {
            'message': {'required': False, 'allow_null': True, 'allow_blank': True},
            'video': {'required': False, 'allow_null': True},
            'audio': {'required': False, 'allow_null': True},
            'image': {'required': False, 'allow_null': True},
        }

