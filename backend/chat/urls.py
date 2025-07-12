# backend/chat/urls.py

from django.urls import path
from .views import ConversationListView, MessageHistoryView, MarkMessagesAsReadView

urlpatterns = [
    path('conversations/', ConversationListView.as_view(), name='conversation-list'),
    path('history/<str:room_name>/', MessageHistoryView.as_view(), name='message-history'),     
    path('read/<str:room_name>/', MarkMessagesAsReadView.as_view(), name='mark-messages-as-read'), # <--- NEW URL

]