# core/middleware/access_logging.py
from core.models import AccessLog

class AccessLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        user = request.user if request.user.is_authenticated else None
        # AccessLog.user is a FK to Student (AUTH_USER_MODEL)
        # ParentWrapper is not a standard Django model instance
        if hasattr(user, '_is_parent'):
            user = None
            
        AccessLog.objects.create(
            user=user,
            path=request.path,
            method=request.method,
            status_code=response.status_code
        )
        return response