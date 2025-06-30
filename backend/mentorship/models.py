from django.db import models
from django.contrib.auth import get_user_model

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

    class Meta:
        unique_together = ('mentor', 'date', 'start_time')
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.learner.email} booked {self.mentor.email} on {self.date} at {self.start_time}"

# ----------------------
# Payment Transaction
# ----------------------
class PaymentTransaction(models.Model):
    class PaymentGatewayChoices(models.TextChoices):
        STRIPE = 'Stripe', 'Stripe'
        RAZORPAY = 'Razorpay', 'Razorpay'

    class TransactionStatus(models.TextChoices):
        INITIATED = 'initiated', 'Initiated'
        SUCCESS = 'success', 'Success'
        FAILED = 'failed', 'Failed'
        REFUNDED = 'refunded', 'Refunded'

    booking = models.OneToOneField(SessionBooking, on_delete=models.CASCADE, related_name='payment')
    amount = models.DecimalField(max_digits=6, decimal_places=2)
    payment_gateway = models.CharField(max_length=20, choices=PaymentGatewayChoices.choices)
    transaction_id = models.CharField(max_length=100)
    status = models.CharField(max_length=20, choices=TransactionStatus.choices)
    refund_reason = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.booking} - {self.status}"

# ----------------------
# Feedback and Review
# ----------------------
class SessionFeedbackReview(models.Model):
    session = models.OneToOneField(SessionBooking, on_delete=models.CASCADE, related_name='feedback')
    feedback_from_mentor = models.TextField(blank=True)
    rating_by_learner = models.PositiveSmallIntegerField(null=True, blank=True)  # 1 to 5
    review_by_learner = models.TextField(blank=True)
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Review for {self.session}"


