from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import User, Role, OTP
from .serializers import UserRegisterSerializer, MyTokenObtainPairSerializer, OTPVerifySerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from .utils import send_otp_email

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
        user = serializer.save(is_active=False)  # Deactivate until OTP verified
        otp = OTP.objects.create(user=user)
        send_otp_email(user.email, otp.code)

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

                otp.is_verified = True
                otp.save()
                user.is_active = True
                user.save()
                return Response({"detail": "OTP verified successfully."})
            except Exception:
                return Response({"error": "Invalid OTP or user."}, status=400)
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

