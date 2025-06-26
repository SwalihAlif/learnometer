from django.conf import settings
from django.core.mail import send_mail

def send_otp_email(user_email, otp_code):
    send_mail(
        subject="Your OTP Code",
        message=f"Your verification code is: {otp_code}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        # recipient_list=[user_email], # To send otp to the real user's email
        recipient_list=[settings.EMAIL_HOST_USER], # for the developing time only, after that I will change to user
        fail_silently=False,  # Let it raise error if delivery fails
    )
