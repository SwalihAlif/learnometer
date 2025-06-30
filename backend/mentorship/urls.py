from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MentorAvailabilityViewSet,
    PaymentTransactionViewSet,
    SessionBookingViewSet,
    MySessionsAPIView,
    SessionFeedbackReviewViewSet,
    MentorListAPIView,
)

router = DefaultRouter()
router.register(r'availability', MentorAvailabilityViewSet, basename='availability')
router.register(r'session-bookings', SessionBookingViewSet, basename='session-bookings')

router.register(r'payments', PaymentTransactionViewSet, basename='payments')
router.register(r'feedbacks', SessionFeedbackReviewViewSet, basename='feedbacks')  # ← register viewset

urlpatterns = [
    path('', include(router.urls)),

    # Custom API views
    path('mentors/', MentorListAPIView.as_view(), name='mentor-list'),
    path('my-sessions/', MySessionsAPIView.as_view(), name='my-sessions'),
]
