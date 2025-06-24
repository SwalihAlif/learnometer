from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role.name if user.role else None
        return token

    def validate(self, attrs):

        data = super().validate(attrs)
        # Check if user is active (OTP verified)
        if not self.user.is_active:
            raise serializers.ValidationError("Your account is not verified. Please verify the OTP sent to your email.")
        

        # Add extra fields to the response data
        data['email'] = self.user.email
        data['role'] = self.user.role.name if self.user.role else None

        return data




# users/serializers.py
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, Role

User = get_user_model()

class UserRegisterSerializer(serializers.ModelSerializer):
    full_name = serializers.CharField(write_only=True)
    confirm_password = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField(required=False)
    phone = serializers.CharField(required=False)
    bio = serializers.CharField(required=False)
    experience_years = serializers.IntegerField(required=False)
    preferred_categories = serializers.ListField(child=serializers.CharField(), required=False)
    languages_known = serializers.ListField(child=serializers.CharField(), required=False)
    learning_goals = serializers.CharField(required=False)

    # Mentor-specific fields
    linkedin_profile = serializers.URLField(required=False)
    portfolio_website = serializers.URLField(required=False)
    availability_schedule = serializers.JSONField(required=False)

    class Meta:
        model = User
        fields = [
            "email", "password", "confirm_password", # Only fields from User model
            # the rest will be handled in profile
            "full_name", "phone", "profile_picture", "bio", "experience_years",
            "preferred_categories", "languages_known", "learning_goals",
            "linkedin_profile", "portfolio_website", "availability_schedule"
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            raise serializers.ValidationError("Passwords do not match.")
        return attrs

    def create(self, validated_data):
        validated_data.pop('confirm_password', None)

        full_name = validated_data.pop('full_name', None)
        profile_fields = {
            'full_name': full_name,
            'contact_number': validated_data.pop('phone', None),
            'profile_picture': validated_data.pop('profile_picture', None),
            'bio': validated_data.pop('bio', None),
            'experience_years': validated_data.pop('experience_years', None),
            'preferred_categories': validated_data.pop('preferred_categories', []),
            'languages_known': validated_data.pop('languages_known', []),
            'learning_goals': validated_data.pop('learning_goals', ''),
            'linkedin_profile': validated_data.pop('linkedin_profile', ''),
            'portfolio_website': validated_data.pop('portfolio_website', ''),
            'availability_schedule': validated_data.pop('availability_schedule', {}),
        }

        role = self.context.get("role")
        user = User.objects.create_user(role=role, **validated_data)
        UserProfile.objects.create(user=user, **profile_fields)
        return user


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()