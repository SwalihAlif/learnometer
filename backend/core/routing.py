# backend/core/routing.py

from django.urls import re_path
from notification.consumers import NotificationConsumer


websocket_urlpatterns = [
    # Fix: The lambda function must accept all three ASGI arguments (scope, receive, send)
    # even if we only use 'scope' to call the consumer.
    re_path(
        r'ws/chat/(?P<room_name>\w+)/$',
        lambda scope, receive, send: __import__('chat.consumers', fromlist=['']).ChatConsumer.as_asgi()(scope, receive, send)
    ),
    re_path(
        r'ws/signaling/(?P<room_name>\w+)/$',
        lambda scope, receive, send: __import__('chat.consumers', fromlist=['']).SignalingConsumer.as_asgi()(scope, receive, send)
    ),
    re_path(r'ws/notifications/$', NotificationConsumer.as_asgi()),
]