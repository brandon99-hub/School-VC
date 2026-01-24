"""
URL patterns for CBC API endpoints
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from . import report_views

# Create router and register viewsets
router = DefaultRouter()
router.register(r'grade-levels', views.GradeLevelViewSet, basename='gradelevel')
router.register(r'learning-areas', views.LearningAreaViewSet, basename='learningarea')
router.register(r'strands', views.StrandViewSet, basename='strand')
router.register(r'sub-strands', views.SubStrandViewSet, basename='substrand')
router.register(r'learning-outcomes', views.LearningOutcomeViewSet, basename='learningoutcome')
router.register(r'competency-assessments', views.CompetencyAssessmentViewSet, basename='competencyassessment')

# Assessment tools
from . import assessment_views
router.register(r'templates', assessment_views.AssessmentTemplateViewSet, basename='template')
router.register(r'bulk-grading', assessment_views.BulkGradingSessionViewSet, basename='bulk-grading')
router.register(r'evidence', assessment_views.AssessmentEvidenceViewSet, basename='evidence')

app_name = 'cbc'

urlpatterns = [
    path('', include(router.urls)),
    # Report generation endpoints
    path('reports/student/<int:student_id>/', report_views.student_report, name='student-report'),
    path('reports/student/<int:student_id>/pdf/', report_views.student_report_pdf, name='student-report-pdf'),
    path('reports/class/<int:learning_area_id>/', report_views.class_summary, name='class-summary'),
]
