"""
Serializers for CBC models
"""

from rest_framework import serializers
from .models import (
    GradeLevel, LearningArea, Strand, SubStrand, 
    LearningOutcome, CompetencyAssessment
)
from teachers.models import Teacher
from students.models import Student


class GradeLevelSerializer(serializers.ModelSerializer):
    """Serializer for GradeLevel model"""
    
    class Meta:
        model = GradeLevel
        fields = ['id', 'name', 'curriculum_type', 'order', 'is_active', 'is_cbc']
        read_only_fields = ['id']


class LearningAreaListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing Learning Areas"""
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    student_count = serializers.IntegerField(source='get_enrolled_students_count', read_only=True)
    
    class Meta:
        model = LearningArea
        fields = [
            'id', 'name', 'code', 'grade_level', 'grade_level_name',
            'teacher', 'teacher_name', 'student_count', 'is_active'
        ]
        read_only_fields = ['id', 'grade_level_name', 'teacher_name', 'student_count']


class LearningAreaDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Learning Area with nested data"""
    grade_level = GradeLevelSerializer(read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    student_count = serializers.IntegerField(source='get_enrolled_students_count', read_only=True)
    strands = serializers.SerializerMethodField()
    
    class Meta:
        model = LearningArea
        fields = [
            'id', 'name', 'code', 'description', 'grade_level', 'teacher',
            'teacher_name', 'students', 'student_count', 'is_active',
            'strands', 'created_at', 'updated_at', 'is_cbc'
        ]
    
    def get_strands(self, obj):
        return StrandDetailSerializer(obj.strands.all(), many=True).data
        read_only_fields = ['id', 'created_at', 'updated_at', 'teacher_name', 'student_count', 'is_cbc']


class StrandListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing Strands"""
    learning_area_name = serializers.CharField(source='learning_area.name', read_only=True)
    
    class Meta:
        model = Strand
        fields = ['id', 'name', 'code', 'learning_area', 'learning_area_name', 'order']
        read_only_fields = ['id', 'learning_area_name']


class SubStrandListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing Sub-Strands"""
    strand_name = serializers.CharField(source='strand.name', read_only=True)
    
    class Meta:
        model = SubStrand
        fields = ['id', 'name', 'code', 'strand', 'strand_name', 'order']
        read_only_fields = ['id', 'strand_name']


class LearningOutcomeListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing Learning Outcomes"""
    sub_strand_name = serializers.CharField(source='sub_strand.name', read_only=True)
    
    class Meta:
        model = LearningOutcome
        fields = ['id', 'code', 'description', 'sub_strand', 'sub_strand_name', 'order']
        read_only_fields = ['id', 'sub_strand_name']


class LearningOutcomeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Learning Outcome with full hierarchy"""
    sub_strand = SubStrandListSerializer(read_only=True)
    full_path = serializers.CharField(read_only=True)
    
    class Meta:
        model = LearningOutcome
        fields = [
            'id', 'code', 'description', 'order', 'suggested_activities',
            'sub_strand', 'full_path'
        ]
        read_only_fields = ['id', 'full_path']


class SubStrandDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Sub-Strand with learning outcomes"""
    learning_outcomes = LearningOutcomeListSerializer(many=True, read_only=True)
    strand_name = serializers.CharField(source='strand.name', read_only=True)
    
    class Meta:
        model = SubStrand
        fields = [
            'id', 'name', 'code', 'description', 'order',
            'strand', 'strand_name', 'learning_outcomes'
        ]
        read_only_fields = ['id', 'strand_name']


class StrandDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for Strand with sub-strands"""
    sub_strands = SubStrandDetailSerializer(many=True, read_only=True)
    learning_area_name = serializers.CharField(source='learning_area.name', read_only=True)
    
    class Meta:
        model = Strand
        fields = [
            'id', 'name', 'code', 'description', 'order',
            'learning_area', 'learning_area_name', 'sub_strands'
        ]
        read_only_fields = ['id', 'learning_area_name']


class CompetencyAssessmentSerializer(serializers.ModelSerializer):
    """Serializer for Competency Assessment"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    teacher_name = serializers.CharField(source='teacher.user.get_full_name', read_only=True)
    learning_outcome_description = serializers.CharField(source='learning_outcome.description', read_only=True)
    competency_level_display = serializers.CharField(source='get_competency_display_full', read_only=True)
    
    class Meta:
        model = CompetencyAssessment
        fields = [
            'id', 'student', 'student_name', 'learning_outcome',
            'learning_outcome_description', 'competency_level',
            'competency_level_display', 'assessment_date', 'teacher',
            'teacher_name', 'teacher_comment', 'evidence',
            'assignment_submission'
        ]
        read_only_fields = [
            'id', 'assessment_date', 'student_name', 'teacher_name',
            'learning_outcome_description', 'competency_level_display'
        ]


class CompetencyAssessmentCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating Competency Assessments"""
    
    class Meta:
        model = CompetencyAssessment
        fields = [
            'student', 'learning_outcome', 'competency_level',
            'teacher', 'teacher_comment', 'evidence', 'assignment_submission'
        ]
    
    def validate_competency_level(self, value):
        """Validate competency level is one of the allowed values"""
        valid_levels = ['EE', 'ME', 'AE', 'BE']
        if value not in valid_levels:
            raise serializers.ValidationError(
                f"Invalid competency level. Must be one of: {', '.join(valid_levels)}"
            )
        return value
