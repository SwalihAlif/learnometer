from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MentorAvailabilityViewSet,
    SessionBookingViewSet,
    MySessionsAPIView,
    MentorListAPIView,
    ReviewCreateAPIView, ReviewDetailAPIView,
    FeedbackUploadAPIView, 
    FeedbackBySessionAPIView, FeedbackRetrieveAPIView,
    CheckingUploadView,
    MentorWalletView, MentorPayoutRequestView,
    StripeWebhookView,
    CreateMentorPaymentAccountView, 
    CheckMentorStripeOnboardingStatus,
)
from .views import handle_mentor_session_booking, capture_mentor_session_payment


router = DefaultRouter()
router.register(r'availability', MentorAvailabilityViewSet, basename='availability')
router.register(r'session-bookings', SessionBookingViewSet, basename='session-bookings')


urlpatterns = [
    path('', include(router.urls)),

    # Custom API views
    path('mentors/', MentorListAPIView.as_view(), name='mentor-list'),
    path('my-sessions/', MySessionsAPIView.as_view(), name='my-sessions'),

    path('book-session/', handle_mentor_session_booking, name='book-mentor-session'),
    path('capture-session-payment/<int:booking_id>/', capture_mentor_session_payment, name='capture-mentor-session-payment'),

    path('stripe/webhook/', StripeWebhookView.as_view(), name='stripe_webhook'),
    path('mentor/stripe/create/', CreateMentorPaymentAccountView.as_view(), name='mentor-stripe-create'),
    path('mentor/stripe/status/', CheckMentorStripeOnboardingStatus.as_view(), name='mentor-stripe-status'),


    path("reviews/", ReviewCreateAPIView.as_view(), name="review-create"),
    path("sessions/<int:session_id>/review/", ReviewDetailAPIView.as_view(), name="review-detail"),

    path("feedbacks/", FeedbackUploadAPIView.as_view(), name="feedback-create"),
    path('feedbacks/session/<int:session_id>/', FeedbackBySessionAPIView.as_view(), name='feedback-by-session'),
    path('feedbacks/<int:feedback_id>/', FeedbackRetrieveAPIView.as_view(), name='feedback-detail'),

    path('mentor/wallet-balance/', MentorWalletView.as_view(), name='mentor-wallet-balance'),
    path('mentor/request-payout/', MentorPayoutRequestView.as_view(), name='mentor-request-payout'),





    path('checking-upload/', CheckingUploadView.as_view()),
]
