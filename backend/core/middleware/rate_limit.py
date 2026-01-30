# core/middleware/rate_limit.py
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin
from django.core.cache import cache
import time


class RateLimitMiddleware(MiddlewareMixin):
    """
    Simple rate limiting middleware using Django cache.
    Different limits for authenticated vs unauthenticated users.
    """
    
    def process_request(self, request):
        # Skip rate limiting for admin users
        if hasattr(request, 'user') and request.user.is_authenticated:
            if request.user.is_staff or request.user.is_superuser:
                return None
        
        # Get client IP
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        
        # Set rate limits - INCREASED for development
        if hasattr(request, 'user') and request.user.is_authenticated:
            limit = 1000  # 1000 requests per hour for authenticated (was 200)
        else:
            limit = 500  # 500 requests per hour for anonymous (was 100)
        
        # Cache key
        cache_key = f'rate_limit_{ip}'
        
        # Get current request count
        request_data = cache.get(cache_key, {'count': 0, 'start_time': time.time()})
        
        # Reset if hour has passed
        if time.time() - request_data['start_time'] > 3600:
            request_data = {'count': 0, 'start_time': time.time()}
        
        # Increment count
        request_data['count'] += 1
        
        # Check if limit exceeded
        if request_data['count'] > limit:
            return JsonResponse({
                'error': 'Rate limit exceeded. Please try again later.',
                'detail': f'Maximum {limit} requests per hour allowed.'
            }, status=429)
        
        # Save to cache
        cache.set(cache_key, request_data, 3600)  # 1 hour timeout
        
        return None