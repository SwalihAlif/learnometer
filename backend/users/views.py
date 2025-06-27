import logging
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
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


logger = logging.getLogger("users")

class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

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
            user = serializer.save(is_active=False)  # Deactivate until OTP verified
            otp = OTP.objects.create(user=user)
            send_otp_email(user.email, otp.code)

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
            user = serializer.save(is_active=False)  # Deactivate until OTP verified
            otp = OTP.objects.create(user=user)
            send_otp_email(user.email, otp.code)


User = get_user_model()

class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            code = serializer.validated_data['code']

            try:
                user = User.objects.get(email=email)
                otp = OTP.objects.filter(user=user, code=code, is_verified=False).latest('created_at')

                if otp.is_expired():
                    return Response({"error": "OTP has expired. Please request a new one."}, status=400)

                # Mark OTP and user as verified/active
                otp.is_verified = True
                otp.save()
                user.is_active = True
                user.save()

                # ✅ Generate JWT tokens
                refresh = RefreshToken.for_user(user)

                return Response({
                    "message": "OTP verified successfully.",
                    "access": str(refresh.access_token),
                    "refresh": str(refresh),
                    "email": user.email,
                    "role": user.role.name if user.role else None,
                })

            except OTP.DoesNotExist:
                return Response({"error": "Invalid or expired OTP."}, status=400)
            except User.DoesNotExist:
                return Response({"error": "User with this email does not exist."}, status=400)

        return Response(serializer.errors, status=400)


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

class UserProfileDetailUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return UserProfile.objects.get(user=self.request.user)
    

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        logger.debug(f"Logout request received with refresh token: {refresh_token}")

        if not refresh_token:
            logger.warning("No refresh token received during logout.")
            return Response({"error": "Refresh token is missing"}, status=400)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            logger.info(f"User {request.user.email} logged out successfully.")
            return Response({"detail": "Logout successful"}, status=205)

        except TokenError as e:
            # Token already blacklisted or malformed
            logger.warning(f"Token already blacklisted or invalid: {str(e)}")
            return Response({"detail": "Token already blacklisted"}, status=205)

        except Exception as e:
            logger.error(f"Unexpected error during logout: {str(e)}")
            return Response({"error": "Something went wrong"}, status=400)





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
        return User.objects.filter(role__name='Learner').select_related('userprofile')


class AdminLearnerRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin can retrieve, update or delete a specific learner
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminLearnerCRUDSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        return User.objects.filter(role__name='Learner').select_related('userprofile')



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
        return User.objects.filter(role__name="Mentor").select_related("userprofile")


class AdminMentorRetrieveUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    """
    Admin can view, update, delete or approve a mentor.
    """
    permission_classes = [permissions.IsAdminUser]
    serializer_class = AdminMentorCRUDSerializer
    lookup_field = 'pk'

    def get_queryset(self):
        return User.objects.filter(role__name="Mentor").select_related("userprofile")

