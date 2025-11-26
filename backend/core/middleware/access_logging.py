# core/middleware/access_logging.py
from core.models import AccessLog

class AccessLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        AccessLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            path=request.path,
            method=request.method,
            status_code=response.status_code
        )
        return response