# backend/chat/consumers.py

import json
import logging
from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
from channels.db import database_sync_to_async # For wrapping synchronous DB ops
from django.contrib.auth import get_user_model
from mentorship.models import SessionBooking
from .models import ChatMessage
from django.utils import timezone
from django.db import transaction

logger = logging.getLogger(__name__)
User = get_user_model()

class SignalingConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f"webrtc_{self.room_name}"
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )
        self.accept()

    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    def receive(self, text_data):
        try:
            data = json.loads(text_data)

            if data.get("type") == "end-session":
                self.mark_session_completed(self.room_name)
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'session_completed'
                    }
                )
            else:
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'signal_message',
                        'message': data
                    }
                )
        except Exception as e:
            logger.error(f"Error processing message: {e}")
            self.send(text_data=json.dumps({'error': 'Invalid signal data'}))

    def signal_message(self, event):
        self.send(text_data=json.dumps(event['message']))

    def session_completed(self, event): 
        self.send(text_data=json.dumps({'type': 'session-completed'})) # send session-completed event to frontend.

    def mark_session_completed(self, session_id):
        try:
            session = SessionBooking.objects.get(id=session_id)
            session.status = 'completed'
            session.save()
            logger.info(f"Session {session_id} marked as completed.")
        except SessionBooking.DoesNotExist:
            logger.warning(f"Session {session_id} does not exist.")





class ChatConsumer(WebsocketConsumer):
    # Helper to get recipient user (now a method)
    @database_sync_to_async
    def get_recipient_user_sync(self, rec_id): # Renamed to avoid clash, explicitly sync
        try:
            return User.objects.get(id=rec_id)
        except User.DoesNotExist:
            return None

    # Helper to create chat message (now a method)
    @database_sync_to_async
    @transaction.atomic
    def create_chat_message_sync(self, sender, recipient, room_name, content): # Renamed to avoid clash, explicitly sync
        return ChatMessage.objects.create(
            sender=sender,
            recipient=recipient,
            room_name=room_name,
            content=content,
        )

    # Helper to mark messages as read (now a method)
    @database_sync_to_async
    @transaction.atomic
    def mark_messages_as_read_sync(self, user_id, room_name): # Renamed to avoid clash, explicitly sync
        unread_messages = ChatMessage.objects.filter(
            room_name=room_name,
            recipient_id=user_id,
            is_read=False
        )
        
        senders_of_unread_messages = list(unread_messages.values_list('sender_id', flat=True).distinct())

        if unread_messages.exists():
            updated_count = unread_messages.update(
                is_read=True,
                read_at=timezone.now()
            )
            logger.info(f"Marked {updated_count} messages as read for user {user_id} in room {room_name}.")
        
        return senders_of_unread_messages


    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        current_user = self.scope["user"]

        if not current_user.is_authenticated:
            logger.warning(f"Anonymous user attempted to connect to room {self.room_name}. Disconnecting.")
            self.close(code=4001)
            return

        if self.room_name.startswith('private_chat_'):
            parts = self.room_name.split('_')
            if len(parts) == 4:
                try:
                    user1_id = int(parts[2])
                    user2_id = int(parts[3])
                except ValueError:
                    logger.warning(f"Invalid user ID format in room name: {self.room_name}. Disconnecting.")
                    self.close(code=4004)
                    return

                if current_user.id not in [user1_id, user2_id]:
                    logger.warning(f"User {current_user.email} (ID: {current_user.id}) attempted to join unauthorized room {self.room_name}. Disconnecting.")
                    self.close(code=4003)
                    return
            else:
                logger.warning(f"Invalid private chat room format: {self.room_name}. Disconnecting.")
                self.close(code=4004)
                return

        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()
        logger.info(f"WebSocket connected for authenticated user: {current_user.email} to room {self.room_name} ({self.channel_name})")

        # LOGIC ON CONNECT: Mark messages as read and broadcast status
        # Call the synchronous method using async_to_sync wrapper
        senders_affected = async_to_sync(self.mark_messages_as_read_sync)(current_user.id, self.room_name)

        for sender_id in senders_affected:
            async_to_sync(self.channel_layer.group_send)(
                self.room_group_name,
                {
                    'type': 'message_read_status',
                    'reader_id': current_user.id,
                    'reader_full_name': current_user.full_name,
                    'room_name': self.room_name,
                    'timestamp': timezone.now().isoformat(),
                }
            )


    def disconnect(self, close_code):
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        user_info = self.scope["user"].email if self.scope["user"].is_authenticated else "Anonymous"
        logger.info(f"WebSocket disconnected for user: {user_info} from room {self.room_name}, Code: {close_code}")

    def receive(self, text_data):
        try:
            text_data_json = json.loads(text_data)
            message_type = text_data_json.get('type')
            
            current_user = self.scope["user"]
            if not current_user.is_authenticated:
                logger.warning(f"Received message from unauthenticated user: {text_data}. Rejecting.")
                self.send(text_data=json.dumps({"error": "Authentication required to send messages."}))
                return

            if message_type == 'chat_message':
                message_content = text_data_json.get('message', 'No message content')
                recipient_id = text_data_json.get('recipient_id')

                if not recipient_id:
                    logger.error(f"Message from {current_user.email} missing recipient_id. Rejecting.")
                    self.send(text_data=json.dumps({"error": "Recipient ID is required."}))
                    return

                room_participants_ids_str = sorted([str(current_user.id), str(recipient_id)])
                expected_room_name = f"private_chat_{room_participants_ids_str[0]}_{room_participants_ids_str[1]}"

                if self.room_name != expected_room_name:
                    logger.warning(f"User {current_user.email} (ID: {current_user.id}) attempted to send message to incorrect room {self.room_name} for recipient {recipient_id}. Expected {expected_room_name}. Rejecting.")
                    self.send(text_data=json.dumps({"error": "Mismatched room and recipient. Message not sent."}))
                    return

                # Fetch recipient user using helper method
                recipient_user = async_to_sync(self.get_recipient_user_sync)(recipient_id) # <--- MODIFIED CALL

                if not recipient_user:
                    logger.error(f"Recipient user with ID {recipient_id} not found. Message from {current_user.email} rejected.")
                    self.send(text_data=json.dumps({"error": "Recipient not found. Message not sent."}))
                    return

                # Create chat message using helper method
                new_message = async_to_sync(self.create_chat_message_sync)( # <--- MODIFIED CALL
                    current_user,
                    recipient_user,
                    self.room_name,
                    message_content
                )

                logger.info(f"Saved message from {current_user.email} to {recipient_user.email} in room {self.room_name}")

                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'chat_message',
                        'message': message_content,
                        'sender_id': current_user.id,
                        'sender_full_name': current_user.full_name,
                        'recipient_id': recipient_user.id,
                        'recipient_email': recipient_user.full_name,
                        'timestamp': new_message.timestamp.isoformat(),
                        'is_read': new_message.is_read,
                        'read_at': new_message.read_at.isoformat() if new_message.read_at else None,
                    }
                )
            elif message_type in ['typing_start', 'typing_stop']:
                logger.info(f"Received typing event '{message_type}' from {current_user.email} in room {self.room_name}")
                async_to_sync(self.channel_layer.group_send)(
                    self.room_group_name,
                    {
                        'type': 'typing_status',
                        'sender_id': current_user.id,
                        'sender_full_name': current_user.full_name,
                        'is_typing': (message_type == 'typing_start'),
                    }
                )
            else:
                logger.warning(f"Received unknown message type: {message_type} from {current_user.email}")


        except json.JSONDecodeError:
            logger.error(f"Received invalid JSON: {text_data}")
            self.send(text_data=json.dumps({"error": "Invalid JSON format"}))
        except KeyError:
            logger.error(f"Received JSON without 'message' key or invalid structure: {text_data}")
            self.send(text_data=json.dumps({"error": "Message key missing or invalid structure in JSON"}))
        except Exception as e:
            logger.exception(f"An unexpected error occurred in receive: {e}")
            self.send(text_data=json.dumps({"error": "An internal server error occurred"}))

    def chat_message(self, event):
        self.send(text_data=json.dumps({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_full_name': event['sender_full_name'],
            'recipient_id': event['recipient_id'],
            'recipient_email': event['recipient_email'],
            'timestamp': event['timestamp'],
            'is_read': event['is_read'],
            'read_at': event['read_at'],
        }))

    def message_read_status(self, event):
        self.send(text_data=json.dumps({
            'type': 'message_read_status',
            'reader_id': event['reader_id'],
            'reader_full_name': event['reader_full_name'],
            'room_name': event['room_name'],
            'timestamp': event['timestamp'],
        }))

    def typing_status(self, event):
        if self.scope["user"].id != event['sender_id']:
            self.send(text_data=json.dumps({
                'type': 'typing_status',
                'sender_id': event['sender_id'],
                'sender_full_name': event['sender_full_name'],
                'is_typing': event['is_typing'],
            }))

