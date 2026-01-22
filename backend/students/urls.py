# students/urls.py
from django.urls import path
from . import views

app_name = 'students'

urlpatterns = [
    path('', views.student_list, name='student_list'),
    path('<int:pk>/', views.student_detail, name='student_detail'),
    path('add/', views.student_add, name='student_add'),
    path('edit/<int:pk>/', views.student_edit, name='student_edit'),
    path('delete/<int:pk>/', views.student_delete, name='student_delete'),

    # Attendance URLs
    path('attendance/', views.attendance_list, name='attendance_list'),
    path('attendance/add/', views.attendance_add, name='attendance_add'),
    path('<int:student_id>/attendance/', views.student_attendance, name='student_attendance'),  # Added

    # Course Registration
    path('courses/', views.student_courses, name='student_courses'),
    path('courses/register/', views.course_registration, name='course_registration'),
    path('courses/drop/<int:course_id>/', views.course_drop, name='course_drop'),
    path('<int:student_id>/courses/', views.student_courses_api, name='student_courses_api'),  # Added

    # API endpoints for AJAX requests
    path('api/attendance/mark/', views.mark_attendance, name='mark_attendance'),
    path('api/attendance/status/', views.get_attendance_status, name='attendance_status'),
    path('api/attendance/', views.submit_attendance_api, name='submit_attendance_api'),
    path('api/mark-attendance/', views.mark_my_attendance, name='mark_my_attendance'),
    path('api/attendance-status/<int:course_id>/', views.check_attendance_status, name='check_attendance_status'),
    path('enroll/', views.enroll_course, name='enroll_course'),
]
