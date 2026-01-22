from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import models
from courses.models import Module, Lesson
from .lesson_serializers import LessonSerializer, LessonCreateUpdateSerializer


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def module_lessons_list(request, module_id):
    """List all lessons for a module or create a new lesson"""
    module = get_object_or_404(Module, id=module_id)
    
    # Check if user is the teacher for this course
    if not hasattr(request.user, 'teacher') or module.course.teacher != request.user.teacher:
        return Response(
            {'error': 'You do not have permission to manage this module'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        lessons = Lesson.objects.filter(module=module)
        serializer = LessonSerializer(lessons, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        serializer = LessonCreateUpdateSerializer(data=request.data)
        if serializer.is_valid():
            # Handle order conflicts
            order = serializer.validated_data.get('order', 1)
            existing_lesson = Lesson.objects.filter(module=module, order=order).first()
            if existing_lesson:
                # Shift other lessons down
                Lesson.objects.filter(module=module, order__gte=order).update(order=models.F('order') + 1)
            
            lesson = serializer.save()
            return Response(LessonSerializer(lesson).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def lesson_detail(request, lesson_id):
    """Retrieve, update or delete a lesson"""
    lesson = get_object_or_404(Lesson, id=lesson_id)
    
    # Check if user is the teacher for this course
    if not hasattr(request.user, 'teacher') or lesson.module.course.teacher != request.user.teacher:
        return Response(
            {'error': 'You do not have permission to manage this lesson'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = LessonSerializer(lesson)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = LessonCreateUpdateSerializer(lesson, data=request.data, partial=True)
        if serializer.is_valid():
            lesson = serializer.save()
            return Response(LessonSerializer(lesson).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        # Reorder remaining lessons
        module = lesson.module
        order = lesson.order
        lesson.delete()
        Lesson.objects.filter(module=module, order__gt=order).update(order=models.F('order') - 1)
        return Response(status=status.HTTP_204_NO_CONTENT)
