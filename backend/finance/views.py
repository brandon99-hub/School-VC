"""
Finance API views
"""

from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.db.models import Sum

from .models import FeeStructure, StudentFee, Payment, Invoice
from .serializers import (
    FeeStructureSerializer, StudentFeeSerializer,
    PaymentSerializer, InvoiceSerializer, FinanceSummarySerializer
)
from .cache_service import FinanceCacheService
from students.models import Student
from core.models import AcademicTerm
from cbc.models import GradeLevel


# Parent/Student Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_fees(request, student_id):
    """
    Get fee information for a student (with caching)
    GET /api/finance/student/{id}/fees/
    """
    # Try cache first
    cached_data = FinanceCacheService.get_or_fetch(student_id, 'fees')
    
    if cached_data:
        return Response(cached_data)
    
    # Fallback to empty response
    return Response({'fees': []})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_payments(request, student_id):
    """
    Get payment history for a student (with caching)
    GET /api/finance/student/{id}/payments/
    """
    cached_data = FinanceCacheService.get_or_fetch(student_id, 'payments')
    
    if cached_data:
        return Response(cached_data)
    
    return Response({'payments': []})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_balance(request, student_id):
    """
    Get outstanding balance for a student (with caching)
    GET /api/finance/student/{id}/balance/
    """
    cached_data = FinanceCacheService.get_or_fetch(student_id, 'balance')
    
    if cached_data:
        return Response(cached_data)
    
    return Response({'balance': 0, 'currency': 'KES'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def student_invoices(request, student_id):
    """
    Get invoices for a student (with caching)
    GET /api/finance/student/{id}/invoices/
    """
    cached_data = FinanceCacheService.get_or_fetch(student_id, 'invoices')
    
    if cached_data:
        return Response(cached_data)
    
    return Response({'invoices': []})


@api_view(['GET'])
def download_invoice(request, invoice_id):
    """
    Download invoice PDF
    GET /api/finance/invoice/{id}/download/
    """
    invoice = get_object_or_404(Invoice, id=invoice_id)
    
    if invoice.pdf_file:
        from django.http import FileResponse
        return FileResponse(invoice.pdf_file.open('rb'), content_type='application/pdf')
    
    return Response({'error': 'PDF not available'}, status=status.HTTP_404_NOT_FOUND)


# Admin Endpoints

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def finance_overview(request):
    """
    Get financial overview for admin dashboard
    GET /api/finance/overview/
    """
    # Get current term fees
    total_fees = StudentFee.objects.aggregate(total=Sum('final_amount'))['total'] or 0
    total_paid = StudentFee.objects.aggregate(total=Sum('amount_paid'))['total'] or 0
    total_balance = StudentFee.objects.aggregate(total=Sum('balance'))['total'] or 0
    
    # Count defaulters (students with balance > 0)
    defaulters_count = StudentFee.objects.filter(balance__gt=0).count()
    
    # Recent payments
    recent_payments = Payment.objects.order_by('-payment_date')[:10]
    
    return Response({
        'total_fees': total_fees,
        'total_paid': total_paid,
        'total_balance': total_balance,
        'defaulters_count': defaulters_count,
        'recent_payments': PaymentSerializer(recent_payments, many=True).data
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def defaulters_list(request):
    """
    Get list of students with outstanding balances
    GET /api/finance/defaulters/
    """
    defaulters = StudentFee.objects.filter(balance__gt=0).select_related('student', 'fee_structure')
    serializer = StudentFeeSerializer(defaulters, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def record_payment(request):
    """
    Record a new payment
    POST /api/finance/payment/record/
    """
    serializer = PaymentSerializer(data=request.data)
    if serializer.is_valid():
        payment = serializer.save()
        
        # Invalidate cache for this student
        FinanceCacheService.invalidate_cache(payment.student_fee.student.id)
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_invoice(request):
    """
    Generate invoice for a student fee
    POST /api/finance/invoice/generate/
    """
    serializer = InvoiceSerializer(data=request.data)
    if serializer.is_valid():
        invoice = serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def refresh_cache(request, student_id):
    """
    Force refresh cache for a student
    POST /api/finance/cache/refresh/{student_id}/
    """
    try:
        FinanceCacheService.refresh_cache(student_id)
        return Response({'message': 'Cache refreshed successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def revenue_report(request):
    """
    Get revenue report
    GET /api/finance/reports/revenue/
    Query params: start_date, end_date
    """
    from datetime import datetime
    
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    payments = Payment.objects.all()
    
    if start_date:
        payments = payments.filter(payment_date__gte=datetime.fromisoformat(start_date))
    if end_date:
        payments = payments.filter(payment_date__lte=datetime.fromisoformat(end_date))
    
    total_revenue = payments.aggregate(total=Sum('amount'))['total'] or 0
    payment_count = payments.count()
    
    # Group by payment method
    by_method = {}
    for method, label in Payment.PAYMENT_METHODS:
        method_total = payments.filter(payment_method=method).aggregate(total=Sum('amount'))['total'] or 0
        by_method[label] = float(method_total)
    
    return Response({
        'total_revenue': float(total_revenue),
        'payment_count': payment_count,
        'by_method': by_method,
        'start_date': start_date,
        'end_date': end_date
    })


# ViewSets for CRUD operations

class FeeStructureViewSet(viewsets.ModelViewSet):
    """ViewSet for FeeStructure CRUD"""
    queryset = FeeStructure.objects.all()
    serializer_class = FeeStructureSerializer
    permission_classes = [IsAuthenticated]


class StudentFeeViewSet(viewsets.ModelViewSet):
    """ViewSet for StudentFee CRUD"""
    queryset = StudentFee.objects.all()
    serializer_class = StudentFeeSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def bulk_bill(self, request):
        """
        Bill multiple students or grades based on fee structures
        POST /api/finance/student-fees/bulk_bill/
        Body: { "grade_ids": [1, 2], "term_id": 5, "student_ids": [] }
        """
        grade_ids = request.data.get('grade_ids', [])
        term_id = request.data.get('term_id')
        student_ids = request.data.get('student_ids', [])

        if not term_id:
            return Response({'error': 'term_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        term = get_object_or_404(AcademicTerm, id=term_id)
        students_to_bill = Student.objects.none()

        if grade_ids:
            students_to_bill = students_to_bill | Student.objects.filter(grade_level_id__in=grade_ids, is_superuser=False)
        
        if student_ids:
            students_to_bill = students_to_bill | Student.objects.filter(id__in=student_ids, is_superuser=False)

        students_to_bill = students_to_bill.distinct()
        
        created_count = 0
        skipped_count = 0
        no_structure_count = 0

        for student in students_to_bill:
            if not student.grade_level:
                skipped_count += 1
                continue

            # Find matching fee structure
            structure = FeeStructure.objects.filter(
                grade_level=student.grade_level,
                academic_term=term,
                is_active=True
            ).first()

            if not structure:
                no_structure_count += 1
                continue

            # Check if already billed
            if StudentFee.objects.filter(student=student, fee_structure=structure).exists():
                skipped_count += 1
                continue

            # Create the fee
            StudentFee.objects.create(
                student=student,
                fee_structure=structure
            )
            created_count += 1
            
            # Invalidate cache
            FinanceCacheService.invalidate_cache(student.id)

        return Response({
            'message': f'Billing complete.',
            'created': created_count,
            'skipped_already_exists': skipped_count,
            'no_structure_found': no_structure_count
        })


class PaymentViewSet(viewsets.ModelViewSet):
    """ViewSet for Payment CRUD"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]


class InvoiceViewSet(viewsets.ModelViewSet):
    """ViewSet for Invoice CRUD"""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
