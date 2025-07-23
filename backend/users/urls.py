from django.urls import path
from users.views import CookieTokenObtainPairView, CookieTokenRefreshView, MeView
from users.views import ( 
    RegisterMentorView, 
    RegisterLearnerView, 
    OTPVerifyView, ResendOTPView, 
    UserProfileDetailUpdateView, 
    MentorPublicProfileView,
    LogoutView, 
    GoogleLoginView, 
    PasswordResetConfirmView,
    ForgotPasswordView, 
    CategoryListView,
)
from .views import (
    AdminLearnerListCreateView,
    AdminLearnerRetrieveUpdateDeleteView,
)
from .views import (
    AdminMentorListCreateView,
    AdminMentorRetrieveUpdateDeleteView
)

urlpatterns = [
    path('token/', CookieTokenObtainPairView.as_view(), name='token_cookie_login'), # login
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token_refresh'), # refresh token
    path('logout/', LogoutView.as_view(), name='logout'),
    path('me/', MeView.as_view(), name='me'),


    path('profile/', UserProfileDetailUpdateView.as_view(), name='user-profile'),

    path('login/google/', GoogleLoginView.as_view(), name='google-login'),
    path('register/mentor/', RegisterMentorView.as_view(), name='register_mentor'),
    path('register/learner/', RegisterLearnerView.as_view(), name='register_learner'),
    path('verify-otp/', OTPVerifyView.as_view(), name='verify-otp'),
    path('resend-otp/', ResendOTPView.as_view(), name='resend-otp'),
    path('profile/<int:user_id>/', MentorPublicProfileView.as_view(), name='mentor-public-profile'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/<uidb64>/<token>/', PasswordResetConfirmView.as_view(), name='reset-password-confirm'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    
    
    # admin
    path("admin/learners/", AdminLearnerListCreateView.as_view(), name="admin-learner-list-create"),
    path("admin/learners/<int:pk>/", AdminLearnerRetrieveUpdateDeleteView.as_view(), name="admin-learner-detail"),

    path('admin/mentors/', AdminMentorListCreateView.as_view(), name='admin-mentor-list-create'),
    path('admin/mentors/<int:pk>/', AdminMentorRetrieveUpdateDeleteView.as_view(), name='admin-mentor-detail'),
]
 