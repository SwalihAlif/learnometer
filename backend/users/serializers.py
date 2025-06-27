import logging
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, Role

User = get_user_model()
logger = logging.getLogger(__name__)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        logger.info(f"Login attempt with data: {email}")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            logger.warning(f"Login failed — user not found: {email}")
            raise serializers.ValidationError("User with this email does not exist.")

        if not user.check_password(password):
            logger.warning(f"Login failed — incorrect password for: {email}")
            raise serializers.ValidationError("Incorrect password.")

        if not user.is_active:
            logger.warning(f"Login failed — inactive user: {email}")
            raise serializers.ValidationError("Your account is not verified.")

        # If all good, get token via super
        data = super().validate(attrs)
        data['email'] = user.email
        data['role'] = user.role.name if user.role else None

        logger.info(f"Login successful for user: {user.email}")
        return data





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
            "email", "password", "confirm_password",
            "full_name", "phone", "profile_picture", "bio", "experience_years",
            "preferred_categories", "languages_known", "learning_goals",
            "linkedin_profile", "portfolio_website", "availability_schedule"
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def validate(self, attrs):
        if attrs['password'] != attrs['confirm_password']:
            logger.warning(f"Password mismatch for email: {attrs.get('email')}")
            raise serializers.ValidationError("Passwords do not match.")
        return attrs

    def create(self, validated_data):
        logger.debug(f"Validated data: {validated_data}")  # ✅ Added logging line

        validated_data.pop('confirm_password', None)
        full_name = validated_data.pop('full_name', None)

        profile_fields = {
            'full_name': full_name,
            'phone': validated_data.pop('phone', None),
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

        try:
            role = self.context.get("role")
            user = User.objects.create_user(role=role, **validated_data)
            UserProfile.objects.create(user=user, **profile_fields)
            logger.info(f"User created successfully: {user.email} | Role: {role}")
            return user
        except Exception as e:
            logger.error(f"User creation failed for {validated_data.get('email')}: {str(e)}")
            raise e


class OTPVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField()

    def validate(self, attrs):
        logger.debug(f"OTP verification attempt for email: {attrs.get('email')}, code: {attrs.get('code')}")
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role.name', read_only=True)

    profile_picture = serializers.ImageField(required=False)
    full_name = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    bio = serializers.CharField(required=False, allow_blank=True)
    experience_years = serializers.IntegerField(required=False)
    preferred_categories = serializers.ListField(child=serializers.CharField(), required=False)
    languages_known = serializers.ListField(child=serializers.CharField(), required=False)
    learning_goals = serializers.CharField(required=False, allow_blank=True)
    linkedin_profile = serializers.URLField(required=False, allow_blank=True)
    portfolio_website = serializers.URLField(required=False, allow_blank=True)
    availability_schedule = serializers.JSONField(required=False)
    created_at = serializers.DateTimeField(source='user.created_at', read_only=True)

    class Meta:
        model = UserProfile
        fields = [
            'email', 'role', 'full_name', 'profile_picture', 'phone', 'bio',
            'experience_years', 'preferred_categories', 'languages_known',
            'learning_goals', 'linkedin_profile', 'portfolio_website',
            'availability_schedule', 'created_at'
        ]

    def update(self, instance, validated_data):
        logger.debug(f"UserProfile update started for user: {instance.user.email}")
        logger.debug(f"Validated profile update data: {validated_data}")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        logger.info(f"UserProfile updated successfully for user: {instance.user.email}")
        return instance




from rest_framework import serializers
from users.models import User, UserProfile, Role

class AdminLearnerCRUDSerializer(serializers.ModelSerializer):
    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False)

    # Nested UserProfile fields using `source`
    full_name = serializers.CharField(source='userprofile.full_name', required=False)
    phone = serializers.CharField(source='userprofile.phone', required=False, allow_blank=True)
    profile_picture = serializers.ImageField(source='userprofile.profile_picture', required=False)
    bio = serializers.CharField(source='userprofile.bio', required=False, allow_blank=True)
    experience_years = serializers.IntegerField(source='userprofile.experience_years', required=False)
    preferred_categories = serializers.ListField(source='userprofile.preferred_categories', child=serializers.CharField(), required=False)
    languages_known = serializers.ListField(source='userprofile.languages_known', child=serializers.CharField(), required=False)
    learning_goals = serializers.CharField(source='userprofile.learning_goals', required=False, allow_blank=True)
    linkedin_profile = serializers.URLField(source='userprofile.linkedin_profile', required=False, allow_blank=True)
    portfolio_website = serializers.URLField(source='userprofile.portfolio_website', required=False, allow_blank=True)
    availability_schedule = serializers.JSONField(source='userprofile.availability_schedule', required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'full_name', 'phone', 'profile_picture', 'bio',
            'experience_years', 'preferred_categories', 'languages_known', 'learning_goals',
            'linkedin_profile', 'portfolio_website', 'availability_schedule'
        ]

    def create(self, validated_data):
        userprofile_data = validated_data.pop('userprofile', {})
        password = validated_data.pop('password', None)

        logger.debug(f"Admin creating learner with data: {validated_data}")
        logger.debug(f"Associated profile data: {userprofile_data}")

        try:
            role = Role.objects.get(name='Learner')
            user = User.objects.create(role=role, is_active=True, **validated_data)

            if password:
                user.set_password(password)
            user.save()

            UserProfile.objects.create(user=user, **userprofile_data)

            logger.info(f"Admin created learner: {user.email}")
            return user
        except Exception as e:
            logger.error(f"Failed to create learner: {validated_data.get('email')} | Error: {str(e)}")
            raise e

    def update(self, instance, validated_data):
        userprofile_data = validated_data.pop('userprofile', {})

        logger.debug(f"Admin updating learner: {instance.email}")
        logger.debug(f"Validated update data: {validated_data}")
        logger.debug(f"Profile update data: {userprofile_data}")

        try:
            instance.email = validated_data.get('email', instance.email)
            if 'password' in validated_data and validated_data['password']:
                instance.set_password(validated_data['password'])
            instance.save()

            # Avoid RelatedObjectDoesNotExist
            profile, created = UserProfile.objects.get_or_create(user=instance)
            for key, value in userprofile_data.items():
                setattr(profile, key, value)
            profile.save()

            logger.info(f"Admin updated learner: {instance.email}")
            return instance
        except Exception as e:
            logger.error(f"Failed to update learner: {instance.email} | Error: {str(e)}")
            raise e




from rest_framework import serializers
from users.models import User, UserProfile, Role

class AdminMentorCRUDSerializer(serializers.ModelSerializer):
    # User fields
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, required=False)

    # UserProfile fields via source
    full_name = serializers.CharField(source='userprofile.full_name', required=False)
    phone = serializers.CharField(source='userprofile.phone', required=False, allow_blank=True)
    profile_picture = serializers.ImageField(source='userprofile.profile_picture', required=False)
    bio = serializers.CharField(source='userprofile.bio', required=False, allow_blank=True)
    experience_years = serializers.IntegerField(source='userprofile.experience_years', required=False)
    preferred_categories = serializers.ListField(source='userprofile.preferred_categories', child=serializers.CharField(), required=False)
    languages_known = serializers.ListField(source='userprofile.languages_known', child=serializers.CharField(), required=False)
    learning_goals = serializers.CharField(source='userprofile.learning_goals', required=False, allow_blank=True)
    linkedin_profile = serializers.URLField(source='userprofile.linkedin_profile', required=False, allow_blank=True)
    portfolio_website = serializers.URLField(source='userprofile.portfolio_website', required=False, allow_blank=True)
    availability_schedule = serializers.JSONField(source='userprofile.availability_schedule', required=False)
    is_approved = serializers.BooleanField(source='userprofile.is_approved', required=False)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'password', 'full_name', 'phone', 'profile_picture', 'bio',
            'experience_years', 'preferred_categories', 'languages_known', 'learning_goals',
            'linkedin_profile', 'portfolio_website', 'availability_schedule', 'is_approved'
        ]

    def create(self, validated_data):
        userprofile_data = validated_data.pop('userprofile', {})
        password = validated_data.pop('password', None)

        logger.debug(f"Admin creating mentor with data: {validated_data}")
        logger.debug(f"Associated mentor profile data: {userprofile_data}")

        try:
            role = Role.objects.get(name='Mentor')
            user = User.objects.create(role=role, is_active=True, **validated_data)

            if password:
                user.set_password(password)
            user.save()

            UserProfile.objects.create(user=user, **userprofile_data)

            logger.info(f"Admin created mentor: {user.email}")
            return user
        except Exception as e:
            logger.error(f"Failed to create mentor: {validated_data.get('email')} | Error: {str(e)}")
            raise e

    def update(self, instance, validated_data):
        userprofile_data = validated_data.pop('userprofile', {})

        logger.debug(f"Admin updating mentor: {instance.email}")
        logger.debug(f"Validated update data: {validated_data}")
        logger.debug(f"Mentor profile update data: {userprofile_data}")

        try:
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

            logger.info(f"Admin updated mentor: {instance.email}")
            return instance
        except Exception as e:
            logger.error(f"Failed to update mentor: {instance.email} | Error: {str(e)}")
            raise e




