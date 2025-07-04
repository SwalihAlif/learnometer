import logging
from rest_framework_simplejwt.authentication import JWTAuthentication


logger = logging.getLogger(__name__)

class CookieJWTAuthentication(JWTAuthentication):
    def authenticate(self, request):
        raw_token = request.COOKIES.get('access_token')
        if raw_token is None:
            logger.debug("No access_token cookie found")
            return None
        try:
            validated_token = self.get_validated_token(raw_token)
            return self.get_user(validated_token), validated_token
        except Exception as e:
            logger.warning(f"Token validation failed: {e}")
            return None
