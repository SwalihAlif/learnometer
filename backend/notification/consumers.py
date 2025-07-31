import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer

# Set up logger
logger = logging.getLogger(__name__)

class NotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.user = self.scope["user"]
        if self.user.is_authenticated:
            self.group_name = f"user_{self.user.id}"
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            logger.info(f"[WebSocket] Connected: user={self.user.email}, group={self.group_name}")
        else:
            logger.warning("[WebSocket] Connection rejected: anonymous user")
            await self.close()

    async def disconnect(self, close_code):
        if self.user.is_authenticated:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            logger.info(f"[WebSocket] Disconnected: user={self.user.email}, group={self.group_name}, code={close_code}")
        else:
            logger.warning("[WebSocket] Disconnected: anonymous user")

    async def receive(self, text_data):
        logger.debug(f"[WebSocket] Received message from user={self.user.email}: {text_data}")
        # You can handle received messages here (optional)

    async def send_notification(self, event):
        logger.info(f"[WebSocket] Sending notification to user={self.user.email}: {event}")
        await self.send(text_data=json.dumps({
            "type": event["type"],
            "message": event["message"],
            "data": event.get("data", {})
        }))


