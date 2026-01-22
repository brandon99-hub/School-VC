from django.urls import path
from . import admin_views

urlpatterns = [
    path('', admin_views.admin_courses, name='admin_courses'),
    path('<int:pk>/', admin_views.admin_course_detail, name='admin_course_detail'),
]
