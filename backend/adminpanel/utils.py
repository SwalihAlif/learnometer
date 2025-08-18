from django.conf import settings
from .models import SiteSettings

def get_premium_price():
    try:
        site_settings = SiteSettings.objects.first()
        if site_settings and site_settings.premium_price:
            return site_settings.premium_price
    except SiteSettings.DoesNotExist:
        pass

    return settings.PREMIUM_PRICE