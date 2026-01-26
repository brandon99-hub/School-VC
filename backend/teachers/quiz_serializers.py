from rest_framework import serializers
from courses.models import Quiz, QuizQuestion

class QuizQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuizQuestion
        fields = ['id', 'quiz', 'prompt', 'question_type', 'choices', 'correct_answer', 'points', 'order']
        read_only_fields = ['id']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuizQuestionSerializer(many=True, read_only=True)
    strand_id = serializers.SerializerMethodField()
    sub_strand_id = serializers.SerializerMethodField()
    tested_outcomes_detail = serializers.SerializerMethodField()
    learning_outcome_description = serializers.CharField(source='learning_outcome.description', read_only=True)

    class Meta:
        model = Quiz
        fields = [
            'id', 'lesson', 'title', 'instructions', 'time_limit_minutes', 
            'max_attempts', 'is_published', 'questions', 'learning_area', 
            'learning_outcome', 'strand_id', 'sub_strand_id', 
            'learning_outcome_description', 'tested_outcomes_detail', 'tested_outcomes',
            'due_date'
        ]
        read_only_fields = ['id']

    def get_tested_outcomes_detail(self, obj):
        from cbc.serializers import LearningOutcomeListSerializer
        outcomes = obj.tested_outcomes.all()
        return LearningOutcomeListSerializer(outcomes, many=True).data

    def get_strand_id(self, obj):
        if obj.learning_outcome:
            return obj.learning_outcome.sub_strand.strand_id
        return None

    def get_sub_strand_id(self, obj):
        if obj.learning_outcome:
            return obj.learning_outcome.sub_strand_id
        return None
