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
    SessionBookingListAPIView,
    FeedbackDetailView,
    ReviewDetailView,
    AdminDashboardStatsAPIView,
    AdminAddTestBalanceView, 
    random_daily_quote,
    admin_habit_report,
    CreateAdminPaymentAccountView,
    CheckStripeOnboardingStatus,
    AdminReviewViewSet,
    AdminAllReviewsViewSet,

)
# for report and cms
from .views import (
    UserReportListView, UserProfileReportListView, 
    AdminCoursesAndContentMetrixView,
    CourseReportListView,
    MainTopicReportListView, SubTopicReportListView, QuestionReportListView,
    AnswerReportListView, SessionBookingReportListView, ReviewReportListView,
    FeedbackReportListView, WalletTransactionReportListView, MotivationalBookReportListView,
    UserExportXLSX, SessionBookingExportXLSX, UserExportPDF, SessionBookingExportPDF
)
router = DefaultRouter()
router.register(r'motivational-quotes', MotivationalQuoteViewSet, basename='motivational-quotes-admin')
router.register(r'motivational-videos', MotivationalVideoViewSet, basename='motivational-videos-admin')
router.register(r'public-videos', MotivationalVideoPublicViewSet, basename='motivational-videos-public')

router.register(r'motivational-books', MotivationalBookViewSet, basename='motivational-books-admin')
router.register(r'public-books', MotivationalBookPublicViewSet, basename='motivational-books-public')
router.register(r'user-reviews', AdminReviewViewSet, basename='user-reviews') 
router.register('admin-reviews', AdminAllReviewsViewSet, basename='admin-reviews')


urlpatterns = [
    path('', include(router.urls)),

    path('learners/', LearnerListView.as_view(), name='admin-learners'),
    path('learner/<int:learner_id>/courses/', CourseListByLearner.as_view(), name='admin-courses-by-learner'),
    path('adminpanel/course-content-metrics/<int:user_id>/', AdminCoursesAndContentMetrixView.as_view(), name='course-content-metrics'),   


#
    path('sessions/', SessionBookingListAPIView.as_view(), name='admin-sessions'),
    path('feedback/<int:session_id>/', FeedbackDetailView.as_view(), name='admin-feedback-detail'),
    path('review/<int:session_id>/', ReviewDetailView.as_view(), name='admin-review-detail'),
    path('dashboard-metrics/', AdminDashboardStatsAPIView.as_view(), name='admin-dashboard-metrics'),
    path("add-test-balance/", AdminAddTestBalanceView.as_view(), name="admin-add-test-balance"),
    path('learner/motivation/daily-quote/', random_daily_quote),
    path("stripe/create/", CreateAdminPaymentAccountView.as_view(), name="admin-stripe-account-create"),
    path("stripe/onboarding-status/", CheckStripeOnboardingStatus.as_view(), name="admin-stripe-status"),
    path('admin/habit-report/', admin_habit_report, name='admin-habit-report'),



# for report and cms

    path('reports/users/', UserReportListView.as_view(), name='user-report-list'),
    path('reports/user-profiles/', UserProfileReportListView.as_view(), name='user-profile-report-list'),
    path('reports/courses/', CourseReportListView.as_view(), name='course-report-list'),
    path('reports/main-topics/', MainTopicReportListView.as_view(), name='main-topic-report-list'),
    path('reports/sub-topics/', SubTopicReportListView.as_view(), name='sub-topic-report-list'),
    path('reports/questions/', QuestionReportListView.as_view(), name='question-report-list'),
    path('reports/answers/', AnswerReportListView.as_view(), name='answer-report-list'),
    path('reports/session-bookings/', SessionBookingReportListView.as_view(), name='session-booking-report-list'),
    path('reports/reviews/', ReviewReportListView.as_view(), name='review-report-list'),
    path('reports/feedbacks/', FeedbackReportListView.as_view(), name='feedback-report-list'),
    path('reports/wallet-transactions/', WalletTransactionReportListView.as_view(), name='wallet-transaction-report-list'),
    path('reports/motivational-books/', MotivationalBookReportListView.as_view(), name='motivational-book-report-list'),
    path('reports/users/export/xlsx/', UserExportXLSX.as_view(), name='user-report-export-xlsx'),
    path('reports/users/export/pdf/', UserExportPDF.as_view(), name='user-report-export-pdf'),
    path('reports/session-bookings/export/xlsx/', SessionBookingExportXLSX.as_view(), name='session-booking-report-export-xlsx'),
    path('reports/session-bookings/export/pdf/', SessionBookingExportPDF.as_view(), name='session-booking-report-export-pdf'),

]
