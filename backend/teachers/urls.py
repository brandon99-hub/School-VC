# teachers/urls.py
from django.urls import path
from . import views
from . import module_views
from . import lesson_views

app_name = 'teachers'

urlpatterns = [
    path('', views.teacher_list, name='teacher_list'),
    path('<int:pk>/', views.teacher_detail, name='teacher_detail'),
    path('add/', views.teacher_add, name='teacher_add'),
    path('edit/<int:pk>/', views.teacher_edit, name='teacher_edit'),
    path('delete/<int:pk>/', views.teacher_delete, name='teacher_delete'),
    path('api/courses/', views.assigned_courses_api, name='assigned_courses_api'),
    path('courses/', views.assigned_courses, name='assigned_courses'),
    path('courses/<int:course_id>/', views.course_detail, name='course_detail'),
    path('courses/<int:course_id>/students/', views.course_students, name='course_students'),
    path('assignments/', views.assignment_list, name='assignment_list'),
    path('assignments/create/', views.create_assignment, name='create_assignment'),
    path('schedule/', views.teacher_schedule, name='schedule'),
    path('api/students/attendance/', views.mark_student_attendance, name='mark_student_attendance'),
    path('api/assignments/status/', views.update_assignment_status, name='update_assignment_status'),
    # API endpoint for class attendance (uses authenticated user)
    path('api/class-attendance/', views.teacher_class_attendance, name='teacher_class_attendance'),
    
    # Module Management API
    path('api/courses/<int:course_id>/modules/', module_views.course_modules_list, name='course_modules_list'),
    path('api/modules/<int:module_id>/', module_views.module_detail, name='module_detail'),
    path('api/courses/<int:course_id>/modules/reorder/', module_views.reorder_modules, name='reorder_modules'),
    
    # Lesson Management API
    path('api/modules/<int:module_id>/lessons/', lesson_views.module_lessons_list, name='module_lessons_list'),
    path('api/lessons/<int:lesson_id>/', lesson_views.lesson_detail, name='lesson_detail'),
]