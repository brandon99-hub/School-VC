from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from courses.models import Lesson, Quiz, QuizQuestion
from .quiz_serializers import QuizSerializer, QuizQuestionSerializer

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def lesson_quizzes_api(request, lesson_id):
    """List all quizzes for a lesson or create a new quiz (supports CBC SubStrands as fallbacks)"""
    from cbc.models import SubStrand, LearningArea
    
    lesson = None
    sub_strand = None
    learning_area = None
    
    try:
        lesson = Lesson.objects.get(id=lesson_id)
        learning_area_entity = lesson.module.course.teacher if hasattr(lesson.module.course, 'teacher') else None
        course_teacher = learning_area_entity
    except Lesson.DoesNotExist:
        # Fallback to CBC SubStrand
        try:
            sub_strand = SubStrand.objects.get(id=lesson_id)
            learning_area = sub_strand.strand.learning_area
            course_teacher = learning_area.teacher
        except SubStrand.DoesNotExist:
            return Response({'error': 'Lesson or Sub-Strand not found'}, status=status.HTTP_404_NOT_FOUND)
    
    # Check if user is the teacher for this course/learning area
    is_teacher = False
    if hasattr(request.user, 'teacher'):
        if lesson and lesson.module.course.teacher == request.user.teacher:
            is_teacher = True
        elif learning_area and learning_area.teacher == request.user.teacher:
            is_teacher = True
            
    if not is_teacher and not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to manage this quiz area'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        if lesson:
            quizzes = Quiz.objects.filter(lesson=lesson)
        else:
            quizzes = Quiz.objects.filter(learning_area=learning_area)
        serializer = QuizSerializer(quizzes, many=True)
        return Response(serializer.data)
    
    elif request.method == 'POST':
        data = request.data.copy()
        if lesson:
            data['lesson'] = lesson_id
        else:
            data['lesson'] = None
            data['learning_area'] = learning_area.id
            
        serializer = QuizSerializer(data=data)
        if serializer.is_valid():
            quiz = serializer.save()
            return Response(QuizSerializer(quiz).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def quiz_detail_api(request, quiz_id):
    """Retrieve, update or delete a quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    # Check if user is the teacher for this area (supports both Course and Learning Area)
    is_teacher = False
    if hasattr(request.user, 'teacher'):
        if quiz.lesson and quiz.lesson.module.course.teacher == request.user.teacher:
            is_teacher = True
        elif quiz.learning_area and quiz.learning_area.teacher == request.user.teacher:
            is_teacher = True
            
    if not is_teacher and not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to manage this quiz'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    if request.method == 'GET':
        serializer = QuizSerializer(quiz)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = QuizSerializer(quiz, data=request.data, partial=True)
        if serializer.is_valid():
            quiz = serializer.save()
            return Response(QuizSerializer(quiz).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    elif request.method == 'DELETE':
        quiz.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

@api_view(['POST', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def quiz_question_api(request, quiz_id, question_id=None):
    """Manage questions for a quiz"""
    quiz = get_object_or_404(Quiz, id=quiz_id)
    
    # Check if user is the teacher for this area (supports both Course and Learning Area)
    is_teacher = False
    if hasattr(request.user, 'teacher'):
        if quiz.lesson and quiz.lesson.module.course.teacher == request.user.teacher:
            is_teacher = True
        elif quiz.learning_area and quiz.learning_area.teacher == request.user.teacher:
            is_teacher = True
            
    if not is_teacher and not request.user.is_superuser:
        return Response(
            {'error': 'You do not have permission to manage this quiz'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'POST':
        data = request.data.copy()
        data['quiz'] = quiz_id
        serializer = QuizQuestionSerializer(data=data)
        if serializer.is_valid():
            question = serializer.save()
            return Response(QuizQuestionSerializer(question).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'PUT':
        question = get_object_or_404(QuizQuestion, id=question_id, quiz=quiz)
        serializer = QuizQuestionSerializer(question, data=request.data, partial=True)
        if serializer.is_valid():
            question = serializer.save()
            return Response(QuizQuestionSerializer(question).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        question = get_object_or_404(QuizQuestion, id=question_id, quiz=quiz)
        question.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
