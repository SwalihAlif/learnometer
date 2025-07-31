
from django.contrib.auth import get_user_model
from .models import Notification 
User = get_user_model()

def notify_admins_and_staff(message):
    # Get all staff and superusers
    admin_and_staff_users = User.objects.filter(is_active=True).filter(
        is_staff=True) | User.objects.filter(is_superuser=True)

    # Create a notification for each
    for user in admin_and_staff_users.distinct():
        Notification.objects.create(
            recipient=user,
            message=message
        )
