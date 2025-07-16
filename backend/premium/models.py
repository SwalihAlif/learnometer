from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()

class LearnerPremiumSubscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="premium_subscription")
    is_active = models.BooleanField(default=False)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_checkout_session_id = models.CharField(max_length=255, blank=True, null=True) 
    stripe_account_id = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - Premium Active: {self.is_active}"
    

class ReferralCode(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="referral_code")
    code = models.CharField(max_length=20, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - Code: {self.code}"
    
class ReferralEarning(models.Model):
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referral_earnings")
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="referrals_made")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    stripe_transfer_id = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_out = models.BooleanField(default=False)

class LearnerPayout(models.Model):
    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="learner_payouts")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    stripe_transfer_id = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ], default='completed')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Learner {self.learner.email} - Payout {self.amount} USD - {self.status}"


