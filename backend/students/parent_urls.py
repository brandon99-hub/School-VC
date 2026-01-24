"""
URL patterns for Parent API endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import parent_views

router = DefaultRouter()
router.register(r'', parent_views.ParentViewSet, basename='parent')

urlpatterns = [
    # Authentication endpoints
    path('register/', parent_views.parent_register, name='parent-register'),
    path('login/', parent_views.parent_login, name='parent-login'),
    
    # Parent management endpoints
    path('', include(router.urls)),
]
