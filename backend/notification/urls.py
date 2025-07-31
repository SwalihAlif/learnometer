from django.urls import path
from .views import UserNotificationListView

urlpatterns = [
    path('admin-notification/', UserNotificationListView.as_view(), name='user-notifications'),
]
