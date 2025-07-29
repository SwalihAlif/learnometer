from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MotivationalQuoteViewSet,
    MotivationalVideoViewSet,
    MotivationalBookViewSet,
    MotivationalVideoPublicViewSet,
    MotivationalBookPublicViewSet,
    LearnerListView,
    CourseListByLearner,
    MainTopicListByCourse,
    SubTopicListByMainTopic,
    ScheduleListByMainTopic,
    QuestionListByMainTopic,
    SessionBookingListAPIView,
    FeedbackDetailView,
    ReviewDetailView,
    AdminDashboardStatsAPIView,
    AdminAddTestBalanceView, 
    AdminNotificationsListView, 
    AdminNotificationMarkReadView,
    random_daily_quote,
    CreateAdminPaymentAccountView,
    CheckStripeOnboardingStatus,

)

router = DefaultRouter()
router.register(r'motivational-quotes', MotivationalQuoteViewSet, basename='motivational-quotes-admin')
router.register(r'motivational-videos', MotivationalVideoViewSet, basename='motivational-videos-admin')
router.register(r'public-videos', MotivationalVideoPublicViewSet, basename='motivational-videos-public')

router.register(r'motivational-books', MotivationalBookViewSet, basename='motivational-books-admin')
router.register(r'public-books', MotivationalBookPublicViewSet, basename='motivational-books-public')

urlpatterns = [
    path('', include(router.urls)),

    path('learners/', LearnerListView.as_view(), name='admin-learners'),
    path('learner/<int:learner_id>/courses/', CourseListByLearner.as_view(), name='admin-courses-by-learner'),
    path('course/<int:course_id>/main-topics/', MainTopicListByCourse.as_view(), name='admin-main-topics-by-course'),
    path('main-topic/<int:main_topic_id>/subtopics/', SubTopicListByMainTopic.as_view(), name='admin-subtopics'),
    path('main-topic/<int:main_topic_id>/schedules/', ScheduleListByMainTopic.as_view(), name='admin-schedules'),
    path('main-topic/<int:main_topic_id>/questions/', QuestionListByMainTopic.as_view(), name='admin-questions'),

#
    path('sessions/', SessionBookingListAPIView.as_view(), name='admin-sessions'),
    path('feedback/<int:session_id>/', FeedbackDetailView.as_view(), name='admin-feedback-detail'),
    path('review/<int:session_id>/', ReviewDetailView.as_view(), name='admin-review-detail'),
    path('dashboard-metrics/', AdminDashboardStatsAPIView.as_view(), name='admin-dashboard-metrics'),

    path("add-test-balance/", AdminAddTestBalanceView.as_view(), name="admin-add-test-balance"),

    path("notifications/", AdminNotificationsListView.as_view()),
    path("notifications/mark-read/", AdminNotificationMarkReadView.as_view()),

    path('learner/motivation/daily-quote/', random_daily_quote),

    path("stripe/create/", CreateAdminPaymentAccountView.as_view(), name="admin-stripe-account-create"),
    path("stripe/onboarding-status/", CheckStripeOnboardingStatus.as_view(), name="admin-stripe-status"),


]
