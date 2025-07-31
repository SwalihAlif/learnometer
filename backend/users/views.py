import logging
from django.conf import settings
from google.oauth2 import id_token
from google.auth.transport import requests
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers
from .models import User, Role, OTP
from .serializers import UserRegisterSerializer, MyTokenObtainPairSerializer, OTPVerifySerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .utils import send_otp_email
from django.core.exceptions import ObjectDoesNotExist
from django.db import transaction
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from django.contrib.auth import get_user_model
from .serializers import OTPVerifySerializer
from rest_framework.generics import RetrieveAPIView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.utils import timezone
from notification.utils import notify_admins_and_staff

import logging
from rest_framework_simplejwt.views import TokenObtainPairView
from django.utils import timezone
from datetime import timedelta
from django.conf import settings    
from rest_framework.response import Response
from django.contrib.auth import login 

logger = logging.getLogger("users") 

class CookieTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        # Call the parent's post method to handle token generation and validation
        # The serializer will have the authenticated user available after validation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Get the authenticated user from the serializer's validated data
        user = serializer.user # SimpleJWT's serializer makes the user available here

  
        # This will set the 'sessionid' cookie which AuthMiddlewareStack expects
        login(request, user)
        logger.info(f"User {user.email} successfully logged in and session established.")

        response = super().post(request, *args, **kwargs) # This generates the tokens and data

        if response.status_code == 200:
            access_token = response.data.get("access")
            refresh_token = response.data.get("refresh")
            # access_expiry = timezone.now() + timedelta(minutes=30) # No longer needed, max_age handles it
            # refresh_expiry = timezone.now() + timedelta(days=1) # No longer needed, max_age handles it

            # Remove tokens from response body (as you already do)
            response.data.pop("access", None)
            response.data.pop("refresh", None)

            # Set HttpOnly cookies 
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                path="/",
                max_age=settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds(), # Use SimpleJWT's lifetime
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                path="/",
                max_age=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds(), # Use SimpleJWT's lifetime
            )

        return response

# Your CookieTokenRefreshView remains the same, as it doesn't typically create sessions
class CookieTokenRefreshView(APIView):
    def post(self, request):
        refresh_token = request.COOKIES.get("refresh_token")
        if not refresh_token:
            return Response({"detail": "No refresh token."}, status=401)

        try:
            refresh = RefreshToken(refresh_token)
            new_access = refresh.access_token

            if settings.SIMPLE_JWT.get("ROTATE_REFRESH_TOKENS", False):
                new_refresh = str(refresh)
                refresh.set_jti()
                refresh.set_exp()

                response = Response({"message": "Tokens rotated"})
                response.set_cookie(
                    key="refresh_token",
                    value=new_refresh,
                    httponly=True,
                    secure=not settings.DEBUG,
                    samesite="Lax",
                    path="/",
                    expires=timezone.now() + refresh.lifetime,
                )
            else:
                response = Response({"message": "Access token refreshed"})

            response.set_cookie(
                key="access_token",
                value=str(new_access),
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                path="/",
                expires=timezone.now() + new_access.lifetime,
            )
            return response

        except (TokenError, InvalidToken):
            return Response({"detail": "Invalid refresh token."}, status=401)


from rest_framework.views import APIView
from django.contrib.auth import logout

class LogoutView(APIView):
    def post(self, request):
        response = Response({"message": "Logged out successfully"})

        logout(request)
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")

        return response
    

# users/views.py
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import UserProfile
from .serializers import UserProfileSerializer

class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = request.user.user_profile
        except UserProfile.DoesNotExist:
            return Response({'detail': 'User profile not found.'}, status=404)

        serializer = UserProfileSerializer(profile)
        return Response(serializer.data)



import requests
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from rest_framework_simplejwt.tokens import RefreshToken
import logging

logger = logging.getLogger(__name__)


from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

class GoogleLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info(f"Incoming SSO request data: {request.data}")

        role_input = request.data.get('role')

        if not role_input:
            return Response({'error': 'Role is required'}, status=400)

        try:
            role_obj = Role.objects.get(name=role_input)
        except Role.DoesNotExist:
            logger.error("Role not found")
            return Response({'error': 'Invalid role'}, status=400)

        # ✅ 1. If id_token is present (original flow)
        id_token_str = request.data.get('id_token')
        if id_token_str:
            try:
                idinfo = id_token.verify_oauth2_token(
                    id_token_str,
                    google_requests.Request(),
                    settings.GOOGLE_CLIENT_ID
                )

                email = idinfo.get('email')
                full_name = idinfo.get('name', '')

                if not email:
                    return Response({'error': 'Email not found in Google token'}, status=400)

            except ValueError as ve:
                logger.error(f"Token verification error: {ve}")
                return Response({'error': 'Invalid token'}, status=400)

        else:
            # ✅ 2. Fallback: use email + full_name directly (access_token flow)
            email = request.data.get('email')
            full_name = request.data.get('full_name', '')

            if not email:
                return Response({'error': 'Email is required'}, status=400)

        # ✅ Common part: register or login user
        try:
            user, created = User.objects.get_or_create(
                email=email,
                defaults={'role': role_obj}
            )

            if created:
                UserProfile.objects.create(user=user, full_name=full_name)

            refresh = RefreshToken.for_user(user)

            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'email': user.email,
                'role': user.role.name
            })

        except Exception as e:
            logger.exception("SSO error")
            return Response({'error': 'SSO login failed'}, status=500)


        
class RegisterMentorView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["role"] = get_object_or_404(Role, name="Mentor")
        return context
    
    def perform_create(self, serializer):
        with transaction.atomic():
            email = serializer.validated_data.get("email")
            
            existing_user = User.objects.filter(email=email).first()
            
            if existing_user:
                if existing_user.is_active:
                    raise serializers.ValidationError("Email is already registered and verified.")
                else:
                    # User exists but is not verified → resend OTP
                    otp = OTP.objects.create(user=existing_user)
                    send_otp_email(existing_user.email, otp.code)
                    raise serializers.ValidationError("OTP already sent to this email. Please verify.")

            # If user does not exist, create one
            user = serializer.save(is_active=False)
            otp = OTP.objects.create(user=user)
            send_otp_email(user.email, otp.code)
            notify_admins_and_staff(f" The {user} is registered as mentor and sent OTP to verify")



class RegisterLearnerView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegisterSerializer
    permission_classes = [AllowAny]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context["role"] = get_object_or_404(Role, name="Learner")
        return context

    def perform_create(self, serializer):
        with transaction.atomic():
            email = serializer.validated_data.get("email")

            existing_user = User.objects.filter(email=email).first()

            if existing_user:
                if existing_user.is_active:
                    raise serializers.ValidationError("Email is already registered and verified.")
                else:
                    # User exists but is not verified → resend OTP
                    otp = OTP.objects.create(user=existing_user)
                    send_otp_email(existing_user.email, otp.code)
                    raise serializers.ValidationError("OTP already sent to this email. Please verify.")

            # If user does not exist, create one
            user = serializer.save(is_active=False)  # Deactivate until OTP is verified
            otp = OTP.objects.create(user=user)
            send_otp_email(user.email, otp.code)
            notify_admins_and_staff(f" The {user} is registered as learner and sent OTP to verify")



User = get_user_model()

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, OTP
from rest_framework import status
from django.conf import settings

class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from .serializers import OTPVerifySerializer

        serializer = OTPVerifySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        email = serializer.validated_data['email']
        code = serializer.validated_data['code']

        try:
            user = User.objects.get(email=email)
            otp = OTP.objects.filter(user=user, code=code, is_verified=False).latest('created_at')

            if otp.is_expired():
                return Response({"error": "OTP has expired. Please request a new one."}, status=400)

            # Mark OTP + user as verified
            otp.is_verified = True
            otp.save()
            user.is_active = True
            user.save()
            notify_admins_and_staff(f" The {user} is Active now")

            # It creates the 'sessionid' cookie
            # that AuthMiddlewareStack relies on for WebSocket authentication.
            login(request, user)
            logger.info(f"User {user.email} successfully verified OTP and logged into session.")

            # Issue tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

            # Response with role for frontend redirect
            response = Response({
                "message": "OTP verified successfully.",
                "role": user.role.name if user.role else None,
            })

            # ✅ Set secure HttpOnly cookies
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                path="/",
                max_age=1800,
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=not settings.DEBUG,
                samesite="Lax",
                path="/",
                max_age=86400,
            )

            # ✅ (Optional) Remove from body if you had raw tokens there
            response.data.pop("access", None)
            response.data.pop("refresh", None)

            return response

        except OTP.DoesNotExist:
            return Response({"error": "Invalid or expired OTP."}, status=400)
        except User.DoesNotExist:
            return Response({"error": "User with this email does not exist."}, status=400)



class ResendOTPView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        try:
            user = User.objects.get(email=email)
            OTP.objects.create(user=user)
            send_otp_email(user.email, user.otp_set.latest("created_at").code)
            return Response({"detail": "New OTP sent."})
        except User.DoesNotExist:
            return Response({"error": "User not found."}, status=400)

from rest_framework import generics, permissions
from .models import UserProfile
from .serializers import UserProfileSerializer

logger = logging.getLogger(__name__)

class UserProfileDetailUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        user = self.request.user
        try:
            profile, created = UserProfile.objects.get_or_create(user=user)
            if created:
                logger.info(f"UserProfile auto-created for user: {user.email}")
            else:
                logger.debug(f"UserProfile fetched for user: {user.email}")
            return profile
        except Exception as e:
            logger.error(f"Error fetching or creating profile for {user.email}: {str(e)}")
            raise

    def update(self, request, *args, **kwargs):
        logger.debug(f"User {request.user.email} initiated profile update with data: {request.data}")
        response = super().update(request, *args, **kwargs)
        logger.info(f"UserProfile updated successfully for user: {request.user.email}")
        return response
    

class MentorPublicProfileView(RetrieveAPIView):
    queryset = UserProfile.objects.select_related('user')
    serializer_class = UserProfileSerializer
    permission_classes = [AllowAny]  # or IsAuthenticated, if required

    def get_object(self):
        user_id = self.kwargs.get('user_id')
        return get_object_or_404(self.get_queryset(), user__id=user_id)
    

from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class CategoryListView(generics.GenericAPIView):
    permission_classes = [IsAuthenticated]

    CATEGORIES = [
        "Programming & Technology",
        "Academics & School Subjects",
        "Languages",
        "Career & Soft Skills",
        "Arts & Creativity",
        "Music & Performing Arts",
        "Lifestyle & Hobbies",
        "Self-Development",
        "Science & Research",
        "Professional Certifications",
        "Competitive Exam Preparation"
    ]

    def get(self, request, *args, **kwargs):
        return Response(self.CATEGORIES)







from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.contrib.auth import get_user_model
from .utils import send_otp_email  # your utility function

User = get_user_model()

class ForgotPasswordView(APIView):
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()

        if user:
            token = PasswordResetTokenGenerator().make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            reset_link = f"http://localhost:5173/reset-password/{uid}/{token}/"

            # Use your utility function
            send_otp_email(
                user_email=email,
                otp_code=f"Reset your password using this link: {reset_link}"
            )

        # Always return success to prevent user enumeration
        return Response({"message": "If the email exists, a reset link has been sent."}, status=200)


# views.py
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework import status

User = get_user_model()

class PasswordResetConfirmView(APIView):
    def post(self, request, uidb64, token):
        password = request.data.get("password")
        try:
            uid = urlsafe_base64_decode(uidb64).decode()
            user = User.objects.get(pk=uid)
            if PasswordResetTokenGenerator().check_token(user, token):
                user.set_password(password)
                user.save()
                return Response({"message": "Password reset successfully."}, status=200)
            else:
                return Response({"error": "Invalid or expired token."}, status=400)
        except Exception:
            return Response({"error": "Something went wrong."}, status=400)






# ---------------------------------------------------- Admin Learner Management -------------------------------------------------------

from rest_framework import generics, permissions
from users.models import User, Role
from .serializers import AdminLearnerCRUDSerializer


class AdminLearnerListCreateView(generics.ListCreateAPIView):
    """
    Admin can list all learners or create a new learner
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminLearnerCRUDSerializer

    def get_queryset(self):
        return User.objects.filter(role__name='Learner').select_related('user_profile')


class AdminLearnerRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin can retrieve, update or delete a specific learner
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminLearnerCRUDSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        return User.objects.filter(role__name='Learner').select_related('user_profile')



# ------------------------------------------------- Manage Mentors -------------------------------------------------------------
from rest_framework import generics, permissions
from django.contrib.auth import get_user_model
from users.models import Role
from .serializers import AdminMentorCRUDSerializer

User = get_user_model()


class AdminMentorListCreateView(generics.ListCreateAPIView):
    """
    Admin can list all mentors or create a new mentor.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminMentorCRUDSerializer

    def get_queryset(self):
        return User.objects.filter(role__name="Mentor").select_related("user_profile")


class AdminMentorRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin can view, update, delete or approve a mentor.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminMentorCRUDSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        return User.objects.filter(role__name="Mentor").select_related("user_profile")
    
#--------------------------------- Check authentication centralized view (users.views.py)----------------------------------------------------------
class CheckAuthView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({'detail': 'authenticated'}, status=200)

