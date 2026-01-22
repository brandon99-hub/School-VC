from django.urls import path
from . import views
from . import module_views
from . import lesson_views
from . import quiz_views

urlpatterns = [
    path('courses/', views.assigned_courses_api, name='assigned_courses_api'),
    path('class-attendance/', views.teacher_class_attendance, name='teacher_class_attendance'),
    path('courses/<int:course_id>/modules/', module_views.course_modules_list, name='course_modules_list'),
    path('modules/<int:module_id>/', module_views.module_detail, name='module_detail'),
    path('courses/<int:course_id>/modules/reorder/', module_views.reorder_modules, name='reorder_modules'),
    
    # Lessons
    path('modules/<int:module_id>/lessons/', lesson_views.module_lessons_list, name='module_lessons_list'),
    path('lessons/<int:lesson_id>/', lesson_views.lesson_detail, name='lesson_detail'),
    
    # Quizzes
    path('lessons/<int:lesson_id>/quizzes/', quiz_views.lesson_quizzes_api, name='lesson_quizzes_api'),
    path('quizzes/<int:quiz_id>/', quiz_views.quiz_detail_api, name='quiz_detail_api'),
    path('quizzes/<int:quiz_id>/questions/', quiz_views.quiz_question_api, name='quiz_question_api'),
    path('quizzes/<int:quiz_id>/questions/<int:question_id>/', quiz_views.quiz_question_api, name='quiz_question_detail'),
    
    path('students/attendance/', views.mark_student_attendance, name='mark_student_attendance'),
    path('assignments/status/', views.update_assignment_status, name='update_assignment_status'),
]
