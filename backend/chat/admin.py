# backend/chat/admin.py

from django.contrib import admin
from .models import ChatMessage

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'recipient', 'room_name', 'content', 'timestamp', 'is_read')
    list_filter = ('sender', 'recipient', 'room_name', 'is_read')
    search_fields = ('content', 'sender__email', 'recipient__email', 'room_name')
    date_hierarchy = 'timestamp'