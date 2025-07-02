from django.urls import path
from .views import (
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

)

urlpatterns = [
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




]
