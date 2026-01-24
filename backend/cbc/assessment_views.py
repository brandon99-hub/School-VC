"""
Views for assessment templates and bulk grading
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .assessment_models import AssessmentTemplate, BulkGradingSession, AssessmentEvidence
from .assessment_serializers import (
    AssessmentTemplateSerializer,
    AssessmentTemplateCreateSerializer,
    BulkGradingSessionSerializer,
    AssessmentEvidenceSerializer
)
from .models import LearningOutcome


class AssessmentTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assessment Templates
    """
    queryset = AssessmentTemplate.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return AssessmentTemplateCreateSerializer
        return AssessmentTemplateSerializer
    
    def get_queryset(self):
        """Filter templates - show own templates + shared templates"""
        user = self.request.user
        if hasattr(user, 'teacher'):
            return self.queryset.filter(
                models.Q(created_by=user.teacher) | models.Q(is_shared=True)
            )
        return self.queryset.filter(is_shared=True)
    
    def perform_create(self, serializer):
        """Set created_by to current teacher"""
        if hasattr(self.request.user, 'teacher'):
            serializer.save(created_by=self.request.user.teacher)
    
    @action(detail=False, methods=['get'])
    def by_learning_area(self, request):
        """
        Get templates filtered by learning area
        GET /api/cbc/templates/by-learning-area/?learning_area_id=1
        """
        learning_area_id = request.query_params.get('learning_area_id')
        if not learning_area_id:
            return Response({'error': 'learning_area_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        templates = self.get_queryset().filter(learning_area_id=learning_area_id)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """
        Increment usage count when template is used
        POST /api/cbc/templates/{id}/use-template/
        """
        template = self.get_object()
        template.increment_usage()
        return Response({'message': 'Template usage recorded'})


class BulkGradingSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Bulk Grading Sessions
    """
    queryset = BulkGradingSession.objects.all()
    serializer_class = BulkGradingSessionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter to current teacher's sessions"""
        if hasattr(self.request.user, 'teacher'):
            return self.queryset.filter(teacher=self.request.user.teacher)
        return self.queryset.none()
    
    def perform_create(self, serializer):
        """Set teacher to current user"""
        if hasattr(self.request.user, 'teacher'):
            serializer.save(teacher=self.request.user.teacher)
    
    @action(detail=True, methods=['post'])
    def update_progress(self, request, pk=None):
        """
        Update grading progress
        POST /api/cbc/bulk-grading/{id}/update-progress/
        """
        session = self.get_object()
        session.update_progress()
        serializer = self.get_serializer(session)
        return Response(serializer.data)


class AssessmentEvidenceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Assessment Evidence
    """
    queryset = AssessmentEvidence.objects.all()
    serializer_class = AssessmentEvidenceSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def by_assessment(self, request):
        """
        Get evidence for a specific assessment
        GET /api/cbc/evidence/by-assessment/?assessment_id=1
        """
        assessment_id = request.query_params.get('assessment_id')
        if not assessment_id:
            return Response({'error': 'assessment_id required'}, status=status.HTTP_400_BAD_REQUEST)
        
        evidence = self.queryset.filter(competency_assessment_id=assessment_id)
        serializer = self.get_serializer(evidence, many=True)
        return Response(serializer.data)
