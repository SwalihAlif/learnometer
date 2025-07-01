from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MentorAvailabilityViewSet,
    SessionBookingViewSet,
    MySessionsAPIView,
    MentorListAPIView,
    ReviewCreateAPIView, ReviewDetailAPIView,
    FeedbackUploadAPIView, FeedbackDetailAPIView,
    CheckingUploadView
)

router = DefaultRouter()
router.register(r'availability', MentorAvailabilityViewSet, basename='availability')
router.register(r'session-bookings', SessionBookingViewSet, basename='session-bookings')


urlpatterns = [
    path('', include(router.urls)),

    # Custom API views
    path('mentors/', MentorListAPIView.as_view(), name='mentor-list'),
    path('my-sessions/', MySessionsAPIView.as_view(), name='my-sessions'),


    path("reviews/", ReviewCreateAPIView.as_view(), name="review-create"),
    path("sessions/<int:session_id>/review/", ReviewDetailAPIView.as_view(), name="review-detail"),

    path("feedbacks/", FeedbackUploadAPIView.as_view(), name="feedback-create"),
    path("sessions/<int:session_id>/feedback/", FeedbackDetailAPIView.as_view(), name="feedback-detail"),


    path('checking-upload/', CheckingUploadView.as_view()),
]
