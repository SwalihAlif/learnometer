# backend/chat/models.py

from django.db import models
from django.conf import settings # Import settings to get AUTH_USER_MODEL
from django.contrib.auth import get_user_model # Also good practice for direct User access if needed

# If you have a User model in another app (e.g., 'accounts'),
# you typically use settings.AUTH_USER_MODEL for ForeignKeys.
# If you need to access the User model directly, use get_user_model().
# For this ChatMessage model, settings.AUTH_USER_MODEL is appropriate.

class ChatMessage(models.Model):
    """
    Represents a single chat message exchanged between two users in a private chat room.
    """
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Links to your custom User model
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text="The user who sent this message."
    )
    recipient = models.ForeignKey(
        settings.AUTH_USER_MODEL, # Links to your custom User model
        on_delete=models.CASCADE,
        related_name='received_messages',
        null=True, blank=True, # Allowing null for now, but consumer will ensure it's set for private chats
        help_text="The user who is the direct recipient of this message (for private chats)."
    )
    room_name = models.CharField(
        max_length=255,
        db_index=True, # Index this field for faster lookups based on room name
        help_text="A unique identifier for the chat room (e.g., private_chat_ID1_ID2)."
    )
    content = models.TextField(
        help_text="The actual text content of the message."
    )
    timestamp = models.DateTimeField(
        auto_now_add=True, # Automatically sets the timestamp when the message is created
        help_text="The date and time the message was sent."
    )
    is_read = models.BooleanField(
        default=False, # Flag to indicate if the recipient has read the message
        help_text="True if the recipient has read this message, False otherwise."
    )
    read_at = models.DateTimeField( # Timestamp when the message was read
        null=True,
        blank=True,
        help_text="The timestamp when the message was marked as read by the recipient."
    )

    class Meta:
        ordering = ['timestamp'] # Default ordering for messages in a chat
        verbose_name = "Chat Message"
        verbose_name_plural = "Chat Messages"

    def __str__(self):
        if self.recipient:
            return f"From {self.sender.email} to {self.recipient.email} in {self.room_name} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"
        return f"From {self.sender.email} in {self.room_name} at {self.timestamp.strftime('%Y-%m-%d %H:%M')}"