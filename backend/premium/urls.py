from django.urls import path
from .views import CreatePremiumCheckoutSessionView, LearnerPremiumWebhookView, LearnerPremiumStatusView
from .views import (
    CreatePremiumCheckoutSessionView,
    LearnerPremiumWebhookView,
    LearnerPremiumStatusView,
    LearnerReferralEarningsView,
    LearnerReferralPayoutView,
)

urlpatterns = [
    path("learner/create-premium-checkout/", CreatePremiumCheckoutSessionView.as_view()),
    path("stripe/learner/webhook/", LearnerPremiumWebhookView.as_view(), name="learner-premium-webhook"),
    path("learner/premium/status/", LearnerPremiumStatusView.as_view(), name="learner-premium-status" ),
    path("learner/earnings/", LearnerReferralEarningsView.as_view(), name="learner-earnings"),
    path("learner/payout/", LearnerReferralPayoutView.as_view(), name="learner-payout"),

]
