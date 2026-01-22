# core/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views, admin_views
from .views import (
    CustomTokenObtainPairView,
    AnnouncementViewSet,
    NotificationListView,
    TeacherViewSet,
    RegisterView,
    UserView,
    ProfileView,
    CSRFTokenView,
    LogoutView
)
from courses.views import CourseViewSet, GradeViewSet, AssignmentViewSet
from students.views import enroll_course

router = DefaultRouter()
router.register(r'students', views.StudentViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'assignments', AssignmentViewSet)
router.register(r'grades', GradeViewSet)
router.register(r'teachers', views.TeacherViewSet)
router.register(r'announcements', views.AnnouncementViewSet)

app_name = 'core'

urlpatterns = [
    # HTML Views
    path('', views.home, name='home'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.LogoutView, name='logout'),
    path('announcements/', views.announcement_list, name='announcement_list'),
    path('announcements/<int:pk>/', views.announcement_detail, name='announcement_detail'),
    path('notifications/', views.notification_list, name='notification_list'),
    path('notifications/mark-read/<int:pk>/', views.mark_notification_read, name='mark_notification_read'),
    path('profile/', views.profile, name='profile'),
    path('profile/edit/', views.edit_profile, name='edit_profile'),

    # API Endpoints
    path('api/', include([
        # Authentication
        path('auth/', include([
            path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
            path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
            path('register/', RegisterView.as_view(), name='register'),
            path('user/', UserView.as_view(), name='current_user'),
            path('profile/', ProfileView.as_view(), name='profile_api'),
            path('csrf/', CSRFTokenView.as_view(), name='csrf_token'),
            path('logout/', LogoutView, name='logout'),
            path('enroll/', enroll_course, name='enroll_course'),# Added
        ])),

        # Router-based endpoints
        path('', include(router.urls)),

        # Sub-app API sub-routes
        path('teacher/', include('teachers.api_urls')),

        # Additional API endpoints
        path('notifications/', NotificationListView.as_view(), name='api_notifications'),
        
        # Admin endpoints
        path('admin/stats/', views.admin_stats, name='admin_stats'),
        path('admin/users/', views.admin_users, name='admin_users'),
        path('admin/teachers/', admin_views.admin_teachers, name='admin_teachers'),
        path('admin/courses/', include('core.admin_urls')),
    ])),
]

