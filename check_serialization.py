
import os
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'PythonProject4.settings')
django.setup()

from courses.models import Lesson, LessonContent
from teachers.lesson_serializers import LessonSerializer

def check_lesson_contents():
    # Find a lesson that has content
    lesson_with_content = Lesson.objects.filter(contents__isnull=False).distinct().first()
    
    if not lesson_with_content:
        print("No lesson with content found in database.")
        return

    print(f"Checking Lesson ID: {lesson_with_content.id} - {lesson_with_content.title}")
    
    # Serialize the lesson
    serializer = LessonSerializer(lesson_with_content)
    data = serializer.data
    
    print(f"Serialized contents length: {len(data.get('contents', []))}")
    if data.get('contents'):
        print("Content titles:")
        for content in data['contents']:
            print(f"- {content.get('title')}")
    else:
        print("WARNING: contents list is empty!")

if __name__ == "__main__":
    check_lesson_contents()
