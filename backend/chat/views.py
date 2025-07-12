# backend/chat/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.db.models import Q, Max # Import Max for ordering
from django.utils import timezone # For handling potential None timestamps
from .models import ChatMessage
from .serializers import ChatUserSerializer, MessageSerializer

User = get_user_model()

class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        current_user = request.user

        # Get IDs of all users current_user has exchanged messages with
        # This covers both messages sent by current_user and messages received by current_user

        # Get IDs of recipients of messages sent by current_user
        recipients_of_my_messages = ChatMessage.objects.filter(
            sender=current_user
        ).values_list('recipient_id', flat=True)

        # Get IDs of senders of messages received by current_user
        senders_to_me = ChatMessage.objects.filter(
            recipient=current_user
        ).values_list('sender_id', flat=True)

        # Combine all unique partner IDs using a Python set
        all_partner_ids = set(list(recipients_of_my_messages) + list(senders_to_me))

        # Filter out the current user's own ID from the set of partners
        partner_ids_final = [uid for uid in all_partner_ids if uid != current_user.id]

        # Fetch the actual User objects for these partners
        conversation_partners = User.objects.filter(id__in=partner_ids_final)

        # Annotate each partner with the timestamp of the latest message in their conversation
        annotated_partners = []
        for partner in conversation_partners:
            # Find the latest message between current_user and this partner
            latest_message = ChatMessage.objects.filter(
                (Q(sender=current_user, recipient=partner) | Q(sender=partner, recipient=current_user))
            ).order_by('-timestamp').first()

            if latest_message:
                partner.latest_message_time = latest_message.timestamp
                annotated_partners.append(partner)

        # Sort the partners by their latest message time, most recent first
        # Handle cases where latest_message_time might be None (though it shouldn't be if latest_message exists)
        sorted_partners = sorted(
            annotated_partners,
            key=lambda p: p.latest_message_time if hasattr(p, 'latest_message_time') and p.latest_message_time else timezone.datetime.min.replace(tzinfo=timezone.utc),
            reverse=True
        )

        serializer = ChatUserSerializer(sorted_partners, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class MessageHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, room_name, *args, **kwargs):
        current_user = request.user

        # Basic validation: Ensure the current user is part of this room
        parts = room_name.split('_')
        if len(parts) != 4 or parts[0] != 'private' or parts[1] != 'chat':
            return Response({"detail": "Invalid room name format."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user1_id = int(parts[2])
            user2_id = int(parts[3])
        except ValueError:
            return Response({"detail": "Invalid user IDs in room name."}, status=status.HTTP_400_BAD_REQUEST)

        # Check if the current user is one of the participants in this room
        if current_user.id not in [user1_id, user2_id]:
            return Response({"detail": "You are not authorized to view this chat history."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch messages for this room, ordered by timestamp
        messages = ChatMessage.objects.filter(
            room_name=room_name
        ).order_by('timestamp') # Order by timestamp ascending for history display

        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

# NEW API VIEW: MarkMessagesAsReadView
class MarkMessagesAsReadView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, room_name, *args, **kwargs):
        current_user = request.user

        # Validate room_name (similar to history view)
        parts = room_name.split('_')
        if len(parts) != 4 or parts[0] != 'private' or parts[1] != 'chat':
            return Response({"detail": "Invalid room name format."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user1_id = int(parts[2])
            user2_id = int(parts[3])
        except ValueError:
            return Response({"detail": "Invalid user IDs in room name."}, status=status.HTTP_400_BAD_REQUEST)

        # Ensure current user is one of the participants in this room
        if current_user.id not in [user1_id, user2_id]:
            return Response({"detail": "You are not authorized to mark messages in this chat."}, status=status.HTTP_403_FORBIDDEN)

        # Get messages in this room that were sent TO the current user AND are not yet read
        # This ensures a user can only mark messages as read that they received.
        unread_messages_to_current_user = ChatMessage.objects.filter(
            room_name=room_name,
            recipient=current_user,
            is_read=False
        )

        # Update these messages
        updated_count = unread_messages_to_current_user.update(
            is_read=True,
            read_at=timezone.now() # Set the read timestamp
        )

        # Optional: Broadcast a message read event via Channels
        # To do this, you'd need to send a message to the channel layer
        # which would then be picked up by the sender's consumer.
        # We will implement this in the ChatConsumer update step.

        return Response({"message": f"Marked {updated_count} messages as read."}, status=status.HTTP_200_OK)

