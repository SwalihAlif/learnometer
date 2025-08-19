import logging
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, Role

logger = logging.getLogger(__name__)
User = get_user_model()

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role.name if user.role else None
        logger.debug(f"Token created for user: {user.email} with role: {token['role']}")
        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        if not self.user.is_active:
            logger.warning(f"Inactive user attempted login: {self.user.email}")
            raise serializers.ValidationError("Your account is not verified. Please verify the OTP sent to your email.")

        logger.info(f"User login validated: {self.user.email}")
        data['email'] = self.user.email
        data['role'] = self.user.role.name if self.user.role else None
        return data


class UserRegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    phone = serializers.CharField(required=False)

    class Meta:
        model = User
        fields = ["email", "password", "confirm_password", "full_name", "phone"]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            logger.warning("Password mismatch during registration attempt")
            raise serializers.ValidationError("Passwords do not match.")
        logger.debug(f"Registration data validated for email: {attrs.get('email')}")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)
        full_name = validated_data.pop('full_name', None)
        profile_fields = {
            'full_name': full_name,
            'phone': validated_data.pop('phone', None),
        }

        role = self.context.get("role")
        user = User.objects.create_user(role=role, **validated_data)
        UserProfile.objects.create(user=user, **profile_fields)
        logger.info(f"New user created: {user.email} with role: {role}")
        return user


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()

    def validate(self, attrs):
        logger.debug(f"OTP verification requested for: {attrs.get('email')}")
        return attrs



from rest_framework import serializers
from .models import UserProfile
from django.contrib.auth import get_user_model

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):

    user_id = serializers.IntegerField(source='user.id', read_only=True)
    # Read-only user details
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role.name', read_only=True)
    created_at = serializers.DateTimeField(source='user.created_at', read_only=True)

    # Editable profile fields
    full_name = serializers.CharField(required=False)
    profile_picture = serializers.ImageField(required=False)
    phone = serializers.CharField(required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    
    preferred_categories = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    languages_known = serializers.ListField(
        child=serializers.CharField(), required=False
    )
    learning_goals = serializers.CharField(required=False, allow_blank=True)

    experience_years = serializers.IntegerField(required=False)
    linkedin_profile = serializers.URLField(required=False, allow_blank=True)
    portfolio_website = serializers.URLField(required=False, allow_blank=True)
    availability_schedule = serializers.JSONField(required=False)
    is_approved = serializers.BooleanField(required=False)

    class Meta:
        model = UserProfile
        fields = [
            'user_id',
            'email', 'role', 'created_at',
            'full_name', 'profile_picture', 'phone', 'bio',
            'preferred_categories', 'languages_known', 'learning_goals',
            'experience_years', 'linkedin_profile', 'portfolio_website',
            'availability_schedule', 'is_approved'
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})  # in case nested write allowed later

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance





from rest_framework import serializers
from users.models import User, UserProfile, Role

class AdminLearnerCRUDSerializer(serializers.ModelSerializer):
    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False)

    # UserProfile fields via source
    full_name = serializers.CharField(source='user_profile.full_name', required=False)
    phone = serializers.CharField(source='user_profile.phone', required=False, allow_blank=True)
    profile_picture = serializers.ImageField(source='user_profile.profile_picture', required=False)
    bio = serializers.CharField(source='user_profile.bio', required=False, allow_blank=True)
    experience_years = serializers.IntegerField(source='user_profile.experience_years', required=False)
    preferred_categories = serializers.ListField(source='user_profile.preferred_categories', child=serializers.CharField(), required=False)
    languages_known = serializers.ListField(source='user_profile.languages_known', child=serializers.CharField(), required=False)
    learning_goals = serializers.CharField(source='user_profile.learning_goals', required=False, allow_blank=True)
    linkedin_profile = serializers.URLField(source='user_profile.linkedin_profile', required=False, allow_blank=True)
    portfolio_website = serializers.URLField(source='user_profile.portfolio_website', required=False, allow_blank=True)
    availability_schedule = serializers.JSONField(source='user_profile.availability_schedule', required=False)
    is_approved = serializers.BooleanField(source='user_profile.is_approved', required=False)
    created_at = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'full_name', 'phone', 'profile_picture', 'bio',
            'experience_years', 'preferred_categories', 'languages_known', 'learning_goals',
            'linkedin_profile', 'portfolio_website', 'availability_schedule', 'is_approved', 'created_at', 'is_active'
        ]

    def create(self, validated_data):
        userprofile_data = validated_data.pop('user_profile', {})
        password = validated_data.pop('password', None)
        
        role = Role.objects.get(name='Learner')
        user = User.objects.create(role=role, is_active=True, **validated_data)

        if password:
            user.set_password(password)
        user.save()

        UserProfile.objects.create(user=user, **userprofile_data)
        return user

    def update(self, instance, validated_data):
        userprofile_data = validated_data.pop('user_profile', {})

        instance.email = validated_data.get('email', instance.email)
        if 'password' in validated_data and validated_data['password']:
            instance.set_password(validated_data['password'])
        instance.save()

        # Avoid RelatedObjectDoesNotExist
        profile, created = UserProfile.objects.get_or_create(user=instance)
        for key, value in userprofile_data.items():
            setattr(profile, key, value)
        profile.save()

        return instance




from rest_framework import serializers
from users.models import User, UserProfile, Role

class AdminMentorCRUDSerializer(serializers.ModelSerializer):
    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False)

    # UserProfile fields via source
    full_name = serializers.CharField(source='user_profile.full_name', required=False)
    phone = serializers.CharField(source='user_profile.phone', required=False, allow_blank=True)
    profile_picture = serializers.ImageField(source='user_profile.profile_picture', required=False)
    bio = serializers.CharField(source='user_profile.bio', required=False, allow_blank=True)
    experience_years = serializers.IntegerField(source='user_profile.experience_years', required=False)
    preferred_categories = serializers.ListField(source='user_profile.preferred_categories', child=serializers.CharField(), required=False)
    languages_known = serializers.ListField(source='user_profile.languages_known', child=serializers.CharField(), required=False)
    learning_goals = serializers.CharField(source='user_profile.learning_goals', required=False, allow_blank=True)
    linkedin_profile = serializers.URLField(source='user_profile.linkedin_profile', required=False, allow_blank=True)
    portfolio_website = serializers.URLField(source='user_profile.portfolio_website', required=False, allow_blank=True)
    availability_schedule = serializers.JSONField(source='user_profile.availability_schedule', required=False)
    is_approved = serializers.BooleanField(source='user_profile.is_approved', required=False)
    created_at = serializers.DateTimeField(read_only=True)
    is_active = serializers.BooleanField(required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'full_name', 'phone', 'profile_picture', 'bio',
            'experience_years', 'preferred_categories', 'languages_known', 'learning_goals',
            'linkedin_profile', 'portfolio_website', 'availability_schedule', 'is_approved', 'created_at', 'is_active'
        ]

    def create(self, validated_data):
        userprofile_data = validated_data.pop('user_profile', {})
        password = validated_data.pop('password', None)

        # Set Mentor role
        role = Role.objects.get(name='Mentor')
        user = User.objects.create(role=role, is_active=True, **validated_data)
        if password:
            user.set_password(password)
        user.save()

        # Create profile
        UserProfile.objects.create(user=user, **userprofile_data)
        return user

    def update(self, instance, validated_data):
        userprofile_data = validated_data.pop('user_profile', {})

        # Update user fields
        instance.email = validated_data.get('email', instance.email)
        if 'password' in validated_data and validated_data['password']:
            instance.set_password(validated_data['password'])
        instance.save()

        # Get or create user profile
        profile, created = UserProfile.objects.get_or_create(user=instance)
        for key, value in userprofile_data.items():
            setattr(profile, key, value)
        profile.save()

        return instance


class LearnerDashboardMetricsSerializer(serializers.Serializer):
    courses_created = serializers.IntegerField()
    topics = serializers.IntegerField()
    subtopics = serializers.IntegerField()
    progress = serializers.IntegerField()
    total_spent = serializers.FloatField(required=False)
    referral_earnings = serializers.FloatField(required=False)

