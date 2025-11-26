# core/middleware/rate_limit.py
from django_ratelimit.decorators import ratelimit
from django.http import HttpResponseForbidden


def rate_limit_middleware(get_response):
    def middleware(request):
        # Apply rate limiting logic
        response = get_response(request)
        # Check if the request was rate-limited by the decorator
        if hasattr(request, 'limited') and request.limited:
            return HttpResponseForbidden("Rate limit exceeded")
        return response

    # Apply the ratelimit decorator to the middleware function
    return ratelimit(key='ip', rate='100/h', method='ALL')(middleware)