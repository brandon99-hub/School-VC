"""
Views for CBC Report Generation
"""

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import HttpResponse
from .report_generator import generate_student_report, generate_class_summary, CBCReportGenerator
import json


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report(request, student_id):
    """
    Generate CBC progress report for a student
    GET /api/cbc/reports/student/{student_id}/
    Query params: learning_area_id (optional)
    """
    learning_area_id = request.query_params.get('learning_area_id')
    
    try:
        report_data = generate_student_report(student_id, learning_area_id)
        return Response(report_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_report_pdf(request, student_id):
    """
    Generate PDF report for a student
    GET /api/cbc/reports/student/{student_id}/pdf/
    """
    learning_area_id = request.query_params.get('learning_area_id')
    
    try:
        generator = CBCReportGenerator(student_id, learning_area_id)
        summary_text = generator.generate_summary_text()
        
        # Return as text file (PDF generation would require additional library)
        response = HttpResponse(summary_text, content_type='text/plain')
        response['Content-Disposition'] = f'attachment; filename="cbc_report_{student_id}.txt"'
        return response
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def class_summary(request, learning_area_id):
    """
    Generate class summary report
    GET /api/cbc/reports/class/{learning_area_id}/
    """
    try:
        summary_data = generate_class_summary(learning_area_id)
        return Response(summary_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
