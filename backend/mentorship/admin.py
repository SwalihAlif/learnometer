from django.contrib import admin
from .models import MentorAvailability, SessionBooking, Review, Feedback, Checking

# Register your models here.
admin.site.register(MentorAvailability)
admin.site.register(SessionBooking)
admin.site.register(Review)
admin.site.register(Feedback)
admin.site.register(Checking)
