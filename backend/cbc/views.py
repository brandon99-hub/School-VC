"""
Views for CBC API endpoints
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import (
    GradeLevel, LearningArea, Strand, SubStrand,
    LearningOutcome, CompetencyAssessment
)
from .serializers import (
    GradeLevelSerializer,
    LearningAreaListSerializer, LearningAreaDetailSerializer,
    StrandListSerializer, StrandDetailSerializer,
    SubStrandListSerializer, SubStrandDetailSerializer,
    LearningOutcomeListSerializer, LearningOutcomeDetailSerializer,
    CompetencyAssessmentSerializer, CompetencyAssessmentCreateSerializer
)


class GradeLevelViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Grade Levels
    Read-only: Grade levels are pre-configured
    """
    queryset = GradeLevel.objects.filter(is_active=True)
    serializer_class = GradeLevelSerializer
    permission_classes = [IsAuthenticated]


class LearningAreaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Learning Areas
    Supports CRUD operations and nested endpoints
    """
    queryset = LearningArea.objects.filter(is_active=True).select_related('grade_level', 'teacher')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LearningAreaListSerializer
        return LearningAreaDetailSerializer

    def get_queryset(self):
        queryset = self.queryset
        grade_level = self.request.query_params.get('grade_level')
        if grade_level:
            queryset = queryset.filter(grade_level_id=grade_level)
        return queryset
    
    @action(detail=True, methods=['post'])
    def enroll(self, request, pk=None):
        """
        Manually enroll the current student in this learning area
        POST /api/cbc/learning-areas/{id}/enroll/
        """
        learning_area = self.get_object()
        # In this system, the user IS the student model (Student inherits AbstractUser)
        student = request.user
        if not hasattr(student, 'student_id'): # Check if it's actually a student
            return Response({'error': 'Only students can enroll'}, status=400)
        
        if learning_area.students.filter(id=student.id).exists():
            return Response({'error': 'Already enrolled in this learning area'}, status=400)
            
        learning_area.students.add(student)
        return Response({'status': 'enrolled', 'learning_area': learning_area.name})
    
    @action(detail=True, methods=['get'])
    def strands(self, request, pk=None):
        """
        Get all strands for a learning area
        GET /api/cbc/learning-areas/{id}/strands/
        """
        learning_area = self.get_object()
        strands = learning_area.strands.all()
        serializer = StrandListSerializer(strands, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def assignments(self, request, pk=None):
        """
        Get all assignments for a learning area
        GET /api/cbc/learning-areas/{id}/assignments/
        """
        learning_area = self.get_object()
        assignments = learning_area.assignments.all()
        from teachers.serializers import AssignmentSerializer
        serializer = AssignmentSerializer(assignments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        """
        Get all enrolled students for a learning area
        GET /api/cbc/learning-areas/{id}/students/
        """
        learning_area = self.get_object()
        students = learning_area.students.all()
        from students.serializers import StudentSerializer
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data)


class StrandViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Strands
    Supports CRUD operations and nested endpoints
    """
    queryset = Strand.objects.all().select_related('learning_area')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return StrandListSerializer
        return StrandDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        learning_area_id = self.request.query_params.get('learning_area')
        if learning_area_id:
            queryset = queryset.filter(learning_area_id=learning_area_id)
        return queryset
    
    @action(detail=True, methods=['get'], url_path='sub-strands')
    def sub_strands(self, request, pk=None):
        """
        Get all sub-strands for a strand
        GET /api/cbc/strands/{id}/sub-strands/
        """
        strand = self.get_object()
        sub_strands = strand.sub_strands.all()
        serializer = SubStrandListSerializer(sub_strands, many=True)
        return Response(serializer.data)


class SubStrandViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Sub-Strands
    Supports CRUD operations and nested endpoints
    """
    queryset = SubStrand.objects.all().select_related('strand')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return SubStrandListSerializer
        return SubStrandDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        strand_id = self.request.query_params.get('strand')
        if strand_id:
            queryset = queryset.filter(strand_id=strand_id)
        return queryset
    
    @action(detail=True, methods=['get'], url_path='learning-outcomes')
    def learning_outcomes(self, request, pk=None):
        """
        Get all learning outcomes for a sub-strand
        GET /api/cbc/sub-strands/{id}/learning-outcomes/
        """
        sub_strand = self.get_object()
        outcomes = sub_strand.learning_outcomes.all()
        serializer = LearningOutcomeListSerializer(outcomes, many=True)
        return Response(serializer.data)


class LearningOutcomeViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Learning Outcomes
    Supports CRUD operations
    """
    queryset = LearningOutcome.objects.all().select_related('sub_strand__strand__learning_area')
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'list':
            return LearningOutcomeListSerializer
        return LearningOutcomeDetailSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        sub_strand_id = self.request.query_params.get('sub_strand')
        learning_area_id = self.request.query_params.get('learning_area')
        
        if sub_strand_id:
            queryset = queryset.filter(sub_strand_id=sub_strand_id)
        elif learning_area_id:
            queryset = queryset.filter(sub_strand__strand__learning_area_id=learning_area_id)
        
        return queryset


class CompetencyAssessmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Competency Assessments
    Supports creating and viewing competency assessments
    """
    queryset = CompetencyAssessment.objects.all().select_related(
        'student', 'teacher', 'learning_outcome', 'assignment_submission'
    )
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return CompetencyAssessmentCreateSerializer
        return CompetencyAssessmentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        student_id = self.request.query_params.get('student')
        learning_area_id = self.request.query_params.get('learning_area')
        learning_outcome_id = self.request.query_params.get('learning_outcome')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if learning_area_id:
            queryset = queryset.filter(
                learning_outcome__sub_strand__strand__learning_area_id=learning_area_id
            )
        if learning_outcome_id:
            queryset = queryset.filter(learning_outcome_id=learning_outcome_id)
        
        return queryset
    
    @action(detail=False, methods=['get'], url_path='by-student/(?P<student_id>[^/.]+)')
    def by_student(self, request, student_id=None):
        """
        Get all competency assessments for a specific student
        GET /api/cbc/competency-assessments/by-student/{student_id}/
        """
        assessments = self.queryset.filter(student_id=student_id)
        serializer = self.get_serializer(assessments, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], url_path='summary/(?P<student_id>[^/.]+)')
    def summary(self, request, student_id=None):
        """
        Get competency summary for a student
        GET /api/cbc/competency-assessments/summary/{student_id}/
        
        Returns count of each competency level
        """
        from django.db.models import Count
        
        assessments = self.queryset.filter(student_id=student_id)
        summary = assessments.values('competency_level').annotate(
            count=Count('id')
        ).order_by('competency_level')
        
        # Format response
        result = {
            'student_id': student_id,
            'total_assessments': assessments.count(),
            'by_level': {item['competency_level']: item['count'] for item in summary}
        }
        
        return Response(result)
