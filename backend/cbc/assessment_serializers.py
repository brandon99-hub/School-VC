"""
Serializers for assessment templates
"""

from rest_framework import serializers
from .assessment_models import AssessmentTemplate, BulkGradingSession, AssessmentEvidence
from .models import LearningArea, GradeLevel


class AssessmentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for AssessmentTemplate"""
    learning_area_name = serializers.CharField(source='learning_area.name', read_only=True)
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.user.get_full_name', read_only=True)
    
    class Meta:
        model = AssessmentTemplate
        fields = [
            'id', 'name', 'learning_area', 'learning_area_name',
            'grade_level', 'grade_level_name', 'description',
            'criteria_ee', 'criteria_me', 'criteria_ae', 'criteria_be',
            'created_by', 'created_by_name', 'is_shared', 'usage_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'usage_count', 'created_at', 'updated_at']


class AssessmentTemplateCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating assessment templates"""
    
    class Meta:
        model = AssessmentTemplate
        fields = [
            'name', 'learning_area', 'grade_level', 'description',
            'criteria_ee', 'criteria_me', 'criteria_ae', 'criteria_be',
            'is_shared'
        ]


class BulkGradingSessionSerializer(serializers.ModelSerializer):
    """Serializer for BulkGradingSession"""
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = BulkGradingSession
        fields = [
            'id', 'assignment', 'assignment_title', 'teacher',
            'total_submissions', 'graded_count', 'progress_percentage',
            'status', 'started_at', 'completed_at'
        ]
        read_only_fields = ['id', 'graded_count', 'status', 'started_at', 'completed_at']
    
    def get_progress_percentage(self, obj):
        if obj.total_submissions == 0:
            return 0
        return round((obj.graded_count / obj.total_submissions) * 100, 1)


class AssessmentEvidenceSerializer(serializers.ModelSerializer):
    """Serializer for AssessmentEvidence"""
    
    class Meta:
        model = AssessmentEvidence
        fields = [
            'id', 'competency_assessment', 'evidence_type',
            'file_url', 'description', 'uploaded_at'
        ]
        read_only_fields = ['id', 'uploaded_at']
