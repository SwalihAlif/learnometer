# backend/chat/serializers.py

from rest_framework import serializers
from django.contrib.auth import get_user_model
from users.models import UserProfile 
from . models import ChatMessage

User = get_user_model()

class ChatUserSerializer(serializers.ModelSerializer):
    # This will get the UserProfile related to the User
    # You might need to adjust 'user_profile' based on your related_name
    profile_picture = serializers.SerializerMethodField()
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'email', 'profile_picture', 'full_name']

    def get_profile_picture(self, obj):
        # Access the related UserProfile and its profile_picture
        # Ensure your UserProfile model has 'profile_picture' field
        if hasattr(obj, 'user_profile') and obj.user_profile.profile_picture:
            return obj.user_profile.profile_picture.url
        return None # Or a default placeholder URL

    def get_full_name(self, obj):
        # Access the related UserProfile and its full_name
        if hasattr(obj, 'user_profile') and obj.user_profile.full_name:
            return obj.user_profile.full_name
        return obj.email # Fallback to email if full_name is not set
    

class MessageSerializer(serializers.ModelSerializer):
    # Serialize sender and recipient using the ChatUserSerializer
    sender = ChatUserSerializer(read_only=True)
    recipient = ChatUserSerializer(read_only=True)
    # Reformat timestamp for consistent display on frontend
    timestamp = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S.%fZ", read_only=True)
    # NEW: Include the read_at field
    read_at = serializers.DateTimeField(format="%Y-%m-%dT%H:%M:%S.%fZ", read_only=True)


    class Meta:
        model = ChatMessage
        fields = ['id', 'sender', 'recipient', 'room_name', 'content', 'timestamp', 'is_read', 'read_at']
        read_only_fields = ['sender', 'recipient', 'room_name', 'timestamp', 'is_read', 'read_at'] # These are set by backend