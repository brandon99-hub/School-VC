
import os
import django

# Setup Django BEFORE other imports
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management.settings')
django.setup()

import json
from rest_framework.test import APIRequestFactory, force_authenticate
from courses.models import Lesson, LessonContent, Course
from cbc.models import LearningArea
from django.contrib.auth import get_user_model
from courses.views import course_detail_api

User = get_user_model()

def check_student_view_structure():
    # Find a CBC Learning Area
    area = LearningArea.objects.first()
    if not area:
        print("No Learning Area found.")
        return

    # Find a student with access or use a superuser
    user = User.objects.filter(is_superuser=True).first()
    
    factory = APIRequestFactory()
    request = factory.get(f'/courses/api/{area.id}/')
    force_authenticate(request, user=user)
    
    response = course_detail_api(request, pk=area.id)
    if response.status_code != 200:
        print(f"API Error: {response.status_code}")
        print(response.data)
        return

    data = response.data
    modules = data.get('modules', [])
    if not modules:
        print("No modules found in response.")
        return

    lesson = modules[0].get('lessons', [{}])[0]
    print(f"Checking Structure for Sub-strand: {lesson.get('title')}")
    
    print(f"Teacher Contents count: {len(lesson.get('teacher_contents', []))}")
    print(f"Learning Outcomes count: {len(lesson.get('learning_outcomes', []))}")
    print(f"Quizzes count: {len(lesson.get('quizzes', []))}")

    # Verify keys exist
    keys_to_check = ['teacher_contents', 'learning_outcomes', 'quizzes']
    for key in keys_to_check:
        if key in lesson:
            print(f"[OK] Key '{key}' present.")
        else:
            print(f"[ERROR] Key '{key}' MISSING!")

if __name__ == "__main__":
    check_student_view_structure()
