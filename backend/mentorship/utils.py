import stripe
from django.conf import settings
from .models import StripeAccount

stripe.api_key = settings.STRIPE_SECRET_KEY

# creating stripe connect account ----------------------------------------------
def create_stripe_connect_account(user, account_type):
    if StripeAccount.objects.filter(user=user).exists():
        return StripeAccount.objects.get(user=user)

    # account_type: "mentor" or "learner"
    account = stripe.Account.create(
        type="express",
        email=user.email,
        capabilities={
            "transfers": {"requested": True},
        },
        business_type="individual",  # or "company"
    )

    return StripeAccount.objects.create(
        user=user,
        stripe_account_id=account.id,
        onboarding_complete=False,
        account_type=account_type,
    )


# creating stripe customer ----------------------------------------------
def create_stripe_customer(user):
    if user.stripe_customer_id:
        return user.stripe_customer_id

    customer = stripe.Customer.create(email=user.email)
    user.stripe_customer_id = customer.id
    user.save()
    return customer.id