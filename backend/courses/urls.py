from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views
from .views import (
    AssignmentSubmissionViewSet,
    CourseViewSet,
    DiscussionCommentViewSet,
    DiscussionThreadViewSet,
    GradeViewSet,
    AttendanceViewSet,
    LessonContentViewSet,
    LessonViewSet,
    ModuleViewSet,
    QuizSubmissionViewSet,
    QuizViewSet,
)

router = DefaultRouter()
router.register(r'grades', GradeViewSet)
router.register(r'attendance', AttendanceViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'modules', ModuleViewSet)
router.register(r'lessons', LessonViewSet)
router.register(r'lesson-contents', LessonContentViewSet)
router.register(r'quizzes', QuizViewSet)
router.register(r'quiz-submissions', QuizSubmissionViewSet)
router.register(r'assignment-submissions', AssignmentSubmissionViewSet)
router.register(r'discussion-threads', DiscussionThreadViewSet)
router.register(r'discussion-comments', DiscussionCommentViewSet)

app_name = 'courses'

urlpatterns = [
    path('', views.course_list, name='course_list'),
    path('<int:pk>/', views.course_detail, name='course_detail'),
    path('api/<int:pk>/', views.course_detail_api, name='course_detail_api'),
    path('add/', views.course_add, name='course_add'),
    path('edit/<int:pk>/', views.course_edit, name='course_edit'),
    path('delete/<int:pk>/', views.course_delete, name='course_delete'),

    # Assignment Management
    path('<int:course_id>/assignments/', views.assignment_list, name='assignment_list'),
    path('<int:course_id>/assignments/<int:assignment_id>/', views.assignment_detail, name='assignment_detail'),

    # Schedule Management
    path('<int:course_id>/schedule/', views.course_schedule, name='course_schedule'),
    path('<int:course_id>/schedule/add/', views.schedule_add, name='schedule_add'),

    # Student Management
    path('<int:course_id>/students/', views.enrolled_students, name='enrolled_students'),

    # API endpoints for AJAX requests
    path('api/schedule/check-conflict/', views.check_schedule_conflict, name='check_schedule_conflict'),
    path('api/enrollment/status/', views.check_enrollment_status, name='check_enrollment_status'),
] + router.urls
