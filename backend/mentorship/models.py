from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from cloudinary.models import CloudinaryField

User = get_user_model()

# ----------------------
# Mentor Availability
# ----------------------
class MentorAvailability(models.Model):
    mentor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        limit_choices_to={'role__name': 'Mentor'},
        related_name='available_slots'
    )
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    is_booked = models.BooleanField(default=False)
    session_price = models.DecimalField(max_digits=6, decimal_places=2, help_text="Price in INR")

    class Meta:
        unique_together = ('mentor', 'date', 'start_time')
        ordering = ['date', 'start_time']

    def __str__(self):
        return f"{self.mentor.email} - {self.date} {self.start_time}-{self.end_time}"

# ----------------------
# Session Booking
# ----------------------
class SessionBooking(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        CONFIRMED = 'confirmed', 'Confirmed'
        COMPLETED = 'completed', 'Completed'
        CANCELLED = 'cancelled', 'Cancelled'
        REJECTED = 'rejected', 'Rejected'
        NO_SHOW = 'no_show', 'No Show'

    class PaymentStatus(models.TextChoices):
        HOLDING = 'holding', 'Holding'
        RELEASED = 'released', 'Released to Mentor'
        REFUNDED = 'refunded', 'Refunded'

    learner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='learner_sessions')
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_sessions')
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.HOLDING)
    meeting_link = models.URLField(blank=True, null=True)
    topic_focus = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True) # stripe
    amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    mentor_payout = models.DecimalField(max_digits=8, decimal_places=2, default=0)

    captured_at = models.DateTimeField(blank=True, null=True)
    is_payment_captured = models.BooleanField(default=False)

    class Meta:
        unique_together = ('mentor', 'date', 'start_time')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.learner.email} booked {self.mentor.email} on {self.date} at {self.start_time}"

# ----------------------
# Payment Transaction
# ----------------------
class PaymentTransaction(models.Model):
    session_booking = models.OneToOneField(SessionBooking, on_delete=models.CASCADE, related_name='payment_transaction')
    stripe_payment_intent_id = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    platform_fee = models.DecimalField(max_digits=8, decimal_places=2)
    mentor_payout = models.DecimalField(max_digits=8, decimal_places=2)
    status = models.CharField(max_length=30, choices=[
        ('holding', 'Holding'),
        ('released', 'Released'),
        ('refunded', 'Refunded'),
        ('failed', 'Failed')
    ], default='holding')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class StripeAccount(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='stripe_account')
    stripe_account_id = models.CharField(max_length=255)
    onboarding_complete = models.BooleanField(default=False)
    account_type = models.CharField(max_length=20, choices=(
        ("mentor", "Mentor"),
        ("learner", "Learner"),
        ("admin", "Admin"),
    ))
    wallet_balance = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Total available balance in the user's wallet after payouts."
    )

    def __str__(self):
        return f"{self.user.email} - {self.account_type} - {self.stripe_account_id}"

class Subscription(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='subscription')
    stripe_subscription_id = models.CharField(max_length=255)
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    active = models.BooleanField(default=True)

class ReferralEarning(models.Model):
    referrer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='referral_earnings')
    referred_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='earned_by_referral')
    amount = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    paid_out = models.BooleanField(default=False)

class MentorPayout(models.Model):
    mentor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='mentor_payouts')
    amount = models.DecimalField(max_digits=8, decimal_places=2)
    stripe_payout_id = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=30, choices=[
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ], default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    processed_at = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"Payout {self.id} - {self.mentor.email} - ₹{self.amount} - {self.status}"


# ----------------------
# Review
# ----------------------
class Review(models.Model):
    session = models.OneToOneField(SessionBooking, on_delete=models.CASCADE, related_name='review')
    
    reviewer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_reviews')  # learner
    reviewee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_reviews')  # mentor

    rating = models.PositiveIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Review by {self.reviewer.email} for {self.reviewee.email} – {self.rating} stars"

# ----------------------
# Feedback
# ----------------------
class Feedback(models.Model):
    session = models.OneToOneField(SessionBooking, on_delete=models.CASCADE, related_name='feedback')

    giver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='given_feedbacks')  # mentor
    receiver = models.ForeignKey(User, on_delete=models.CASCADE, related_name='received_feedbacks')  # learner

    message = models.TextField(blank=True, null=True)

    video = CloudinaryField('video', blank=True, null=True)
    audio = CloudinaryField('video', blank=True, null=True)  # Cloudinary doesn't have 'audio' type, so use 'video'
    image = CloudinaryField('image', blank=True, null=True)
    pdf = CloudinaryField('pdf', blank=True, null=True, resource_type='raw')

    external_links = models.TextField(blank=True, null=True, help_text="Comma-separated URLs")
    created_at = models.DateTimeField(auto_now_add=True)

    def get_links_list(self):
        return [link.strip() for link in self.external_links.split(',')] if self.external_links else []

    def __str__(self):
        return f"Feedback by {self.giver.email} for {self.receiver.email}"



from cloudinary.models import CloudinaryField

class Checking(models.Model):
    message = models.TextField(blank=True, null=True)
    video = CloudinaryField('video', blank=True, null=True)
    audio = CloudinaryField('video', blank=True, null=True)  # use 'video' for audio too
    image = CloudinaryField('image', blank=True, null=True)
