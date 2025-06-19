from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth.models import User

class UserIDAuthentication(BaseAuthentication):
    def authenticate(self, request):
        user_id = request.headers.get('X-User-ID')  # Extract user ID from headers
        if not user_id:
            raise AuthenticationFailed('User ID header is missing')

        try:
            user = User.objects.get(id=user_id)  # Get the user from the database
        except User.DoesNotExist:
            raise AuthenticationFailed('No such user')

        return (user, None)  # Return the user object
