from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class LearnerPremiumSubscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="premium_subscription")
    is_active = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - Premium Active: {self.is_active}"

