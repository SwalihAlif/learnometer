from django.urls import path
from .views import UserNotificationListView, AdminNotificationListAPIView, AdminNotificationMarkReadAPIView

urlpatterns = [
    path('admin-notification-bell/', UserNotificationListView.as_view(), name='admin-notification-bell'),
    path('admin-notification-page/', AdminNotificationListAPIView.as_view(), name='admin-notification-page'),
    path('admin-notification-read/<int:pk>/mark-read/', AdminNotificationMarkReadAPIView.as_view(), name='admin-notification-read'),

]
