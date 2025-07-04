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
