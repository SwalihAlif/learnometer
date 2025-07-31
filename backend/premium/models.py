from django.contrib.auth import get_user_model
from django.db import models
import logging
from django.db import transaction
from decimal import Decimal
from rest_framework.exceptions import ValidationError

User = get_user_model()
logger = logging.getLogger(__name__)

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
    

class Wallet(models.Model):
    WALLET_TYPES = (
    ('earnings', 'Earnings'),
    ('bonus', 'Bonus'),
    ('platform_fees', 'Platform Fees'),
    ('refunds', 'Refunds'),
    ('rewards', 'Rewards'),
    
)

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="wallets")
    balance = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    wallet_type = models.CharField(
    max_length=50,
    choices=WALLET_TYPES,
    default='earnings'
)
    currency = models.CharField(max_length=3, default='INR') # Or whatever your primary currency is

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Ensures a user has only one wallet of a specific type
        unique_together = ('user', 'wallet_type')

    def __str__(self):
        return f"{self.user.email}'s Wallet: {self.currency} {self.balance}"

    # We might add methods here for safe balance updates
    def add_funds(self, amount, transaction_type, source_id=None, description=""):

        with transaction.atomic(): 
            self.balance += amount
            self.save()
            WalletTransaction.objects.create(
                wallet=self,
                amount=amount,
                transaction_type=transaction_type,
                current_balance=self.balance,
                source_id=source_id, # e.g., Stripe Transfer ID, Payment Intent ID, Referral Earning ID
                description=description
            )
        logger.info(f"Added {amount} to {self.user.email}'s {self.wallet_type} wallet. New balance: {self.balance}")

    def withdraw_funds(self, amount, source_id=None, description=""):
        if amount <= 0:
            raise ValidationError("Withdrawal amount must be positive.")

        if self.balance < amount:
            raise ValidationError("Insufficient balance for withdrawal.")

        with transaction.atomic():
            self.balance -= amount
            self.save()

            WalletTransaction.objects.create(
                wallet=self,
                amount=-Decimal(amount),  # Store as negative
                transaction_type='debit_payout',
                current_balance=self.balance,
                source_id=source_id,
                description=description
            )

        logger.info(f"{self.user.email} withdrew {amount} from {self.wallet_type} wallet. New balance: {self.balance}")


class WalletTransaction(models.Model):
    """
    Records every transaction that affects a wallet's balance.
    """
    TRANSACTION_TYPES = (
        ('credit_referral', 'Referral Credit'),
        ('credit_session_fee', 'Session Fee Credit'),
        ('debit_payout', 'Payout'),
        ('credit_platform_fee', 'Platform Fee Credit'), 
        ('credit_premium_subscription', 'Subcription Fee Credit'),
     
    )

    wallet = models.ForeignKey(Wallet, on_delete=models.CASCADE, related_name="transactions")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_type = models.CharField(max_length=50, choices=TRANSACTION_TYPES)
    current_balance = models.DecimalField(max_digits=10, decimal_places=2) 
    source_id = models.CharField(max_length=255, blank=True, null=True, help_text="e.g., Stripe ID, ReferralEarning ID")
    description = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp'] # Order by most recent first

    def __str__(self):
        return f"{self.wallet.user.email}'s {self.wallet.wallet_type} Wallet - {self.transaction_type}: {self.amount} at {self.timestamp}"



