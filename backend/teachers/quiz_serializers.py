from rest_framework import serializers
from courses.models import Quiz, QuizQuestion

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'prompt', 'question_type', 'choices', 'correct_answer', 'points', 'order']
        read_only_fields = ['id']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Quiz
        fields = ['id', 'lesson', 'title', 'instructions', 'time_limit_minutes', 'max_attempts', 'is_published', 'questions', 'learning_area', 'learning_outcome']
        read_only_fields = ['id']
