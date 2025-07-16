from django.urls import path
from .views import CreatePremiumCheckoutSessionView

urlpatterns = [
    path("learner/create-premium-checkout/", CreatePremiumCheckoutSessionView.as_view()),
]
