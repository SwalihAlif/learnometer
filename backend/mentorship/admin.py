from django.contrib import admin
from .models import MentorAvailability, SessionBooking, Review, Feedback, Checking, PaymentTransaction, StripeAccount, MentorPayout
# Register your models here.
admin.site.register(MentorAvailability)
admin.site.register(SessionBooking)
admin.site.register(Review)
admin.site.register(Feedback)
admin.site.register(Checking)
admin.site.register(PaymentTransaction)
admin.site.register(StripeAccount)
admin.site.register(MentorPayout)

