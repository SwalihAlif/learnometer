from django.contrib import admin
from .models import LearnerPremiumSubscription, ReferralCode, ReferralEarning, LearnerPayout

# Register your models here.
admin.site.register(LearnerPremiumSubscription)
admin.site.register(ReferralCode)
admin.site.register(ReferralEarning)
admin.site.register(LearnerPayout)
