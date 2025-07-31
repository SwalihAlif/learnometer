from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .serializers import NotificationSerializer

@receiver(post_save, sender=Notification)
def send_notification_ws(sender, instance, created, **kwargs):
    if created and instance.recipient:  # Ensure recipient exists
        channel_layer = get_channel_layer()
        data = NotificationSerializer(instance).data
        group_name = f"user_{instance.recipient.id}"  # Match consumer group

        async_to_sync(channel_layer.group_send)(
            group_name,
            {
                "type": "send_notification",
                "message": "New notification",
                "data": data
            }
        )

