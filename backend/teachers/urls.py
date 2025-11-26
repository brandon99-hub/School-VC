# teachers/urls.py
from django.urls import path
from . import views

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
    # New endpoint for class attendance
    path('<int:pk>/class-attendance/', views.teacher_class_attendance, name='teacher_class_attendance'),
]