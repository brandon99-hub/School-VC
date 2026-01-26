from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.conf import settings
from students.models import Parent
from django.contrib.auth.models import AnonymousUser

class ParentWrapper:
    """
    A wrapper class to make a Parent object look like a Django User object
    for standard DRF compatibility.
    """
    def __init__(self, parent):
        self.parent = parent
        self.id = parent.id
        self.email = parent.email
        self.first_name = parent.first_name
        self.last_name = parent.last_name
        self.is_active = parent.is_active
        self.pk = parent.id
        self._is_parent = True

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    @property
    def is_staff(self):
        return False

    @property
    def is_superuser(self):
        return False

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"

    def __str__(self):
        return f"Parent: {self.email}"

    def __getattr__(self, name):
        return getattr(self.parent, name)

class MultiUserJWTAuthentication(JWTAuthentication):
    """
    Custom authentication class that supports both the standard User (Student)
    and the separate Parent model.
    """
    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            return None

        raw_token = self.get_raw_token(header)
        if raw_token is None:
            return None

        validated_token = self.get_validated_token(raw_token)
        user = self.get_user(validated_token)
        
        if hasattr(user, '_is_parent'):
            request.parent_id = user.id
            
        return user, validated_token

    def get_user(self, validated_token):
        user_id_claim = settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id')
        user_id = validated_token.get(user_id_claim)
        user_type = validated_token.get('user_type')

        if user_type == 'parent':
            parent_id = validated_token.get('parent_id')
            try:
                parent = Parent.objects.get(id=parent_id, is_active=True)
                return ParentWrapper(parent)
            except Parent.DoesNotExist:
                raise AuthenticationFailed('Parent account not found or inactive', code='user_not_found')
        
        # Default behavior for standard users
        try:
            return super().get_user(validated_token)
        except AuthenticationFailed:
            raise
