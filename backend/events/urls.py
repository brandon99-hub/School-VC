from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClubViewSet, EventNoticeViewSet, ClubAttendanceViewSet, EventAttendanceViewSet

router = DefaultRouter()
router.register(r'clubs', ClubViewSet)
router.register(r'notices', EventNoticeViewSet)
router.register(r'club-attendance', ClubAttendanceViewSet)
router.register(r'event-attendance', EventAttendanceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
