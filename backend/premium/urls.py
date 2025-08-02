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
    WalletTransactionListAPIView,
    WithdrawFundsAPIView,

    # adminpanel ---------------------------------------------------------------------------------
    AdminWalletAPIView,
    AdminWalletTransactionListAPIView,
    AdminWithdrawFundsAPIView,
    PremiumReferralSummaryAPIView,
    PremiumSubscriptionListAPIView,
    ReferralEarningListAPIView,
    AdminPaymentMetricsView, 
    AdminPaymentTransactionListView
)

urlpatterns = [
    path("learner/create-premium-checkout/", CreatePremiumCheckoutSessionView.as_view()),
    path("learner/premium/status/", LearnerPremiumStatusView.as_view(), name="learner-premium-status" ),
    path("learner/earnings/", LearnerReferralEarningsView.as_view(), name="learner-earnings"),
    path("learner/payout/", LearnerReferralPayoutView.as_view(), name="learner-payout"),
    path("wallet/", WalletAPIView.as_view(), name="user-wallet"),
    path('wallet/withdraw/', WithdrawFundsAPIView.as_view(), name='wallet-withdraw'),
    path('wallet/transactions/', WalletTransactionListAPIView.as_view(), name='wallet-transactions'),
    path("learner/stripe/create/", CreateLearnerPaymentAccountView.as_view(), name="create-learner-stripe"),
    path("learner/stripe/status/", CheckLearnerStripeOnboardingStatus.as_view(), name="learner-stripe-status"),

    # for adminpanel ------------------------------------------------------------------------------

    path("admin/wallet/", AdminWalletAPIView.as_view(), name="admin-wallet"),
    path('admin/wallet/transactions/', AdminWalletTransactionListAPIView.as_view(), name='admin-wallet-transactions'),
    path('admin/wallet/withdraw/', AdminWithdrawFundsAPIView.as_view(), name='admin-wallet-withdraw'),

    path('admin/premium-summary/', PremiumReferralSummaryAPIView.as_view(), name='premium-summary'),
    path('admin/premium-subscriptions/', PremiumSubscriptionListAPIView.as_view(), name='premium-subscriptions'),
    path('admin/referral-earnings/', ReferralEarningListAPIView.as_view(), name='referral-earnings'),
    path('admin/payment/metrics/', AdminPaymentMetricsView.as_view(), name='payment-metrics'),
    path('admin/payment/transactions/', AdminPaymentTransactionListView.as_view(), name='payment-transactions'), 
]
