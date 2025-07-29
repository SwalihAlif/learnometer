from django.urls import path
from .views import CreatePremiumCheckoutSessionView, LearnerPremiumStatusView
from .views import (
    CreatePremiumCheckoutSessionView,
    LearnerPremiumStatusView,
    LearnerReferralEarningsView,
    LearnerReferralPayoutView,
    WalletAPIView,
    CreateLearnerPaymentAccountView,
    CheckLearnerStripeOnboardingStatus,
)

urlpatterns = [
    path("learner/create-premium-checkout/", CreatePremiumCheckoutSessionView.as_view()),
    path("learner/premium/status/", LearnerPremiumStatusView.as_view(), name="learner-premium-status" ),
    path("learner/earnings/", LearnerReferralEarningsView.as_view(), name="learner-earnings"),
    path("learner/payout/", LearnerReferralPayoutView.as_view(), name="learner-payout"),
    path("wallet/", WalletAPIView.as_view(), name="user-wallet"),
    path("learner/stripe/create/", CreateLearnerPaymentAccountView.as_view(), name="create-learner-stripe"),
    path("learner/stripe/status/", CheckLearnerStripeOnboardingStatus.as_view(), name="learner-stripe-status"),

]
