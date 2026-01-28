"""
Finance serializers
"""

from rest_framework import serializers
from .models import FeeStructure, StudentFee, Payment, Invoice


class FeeStructureSerializer(serializers.ModelSerializer):
    """Serializer for FeeStructure model"""
    grade_level_name = serializers.CharField(source='grade_level.name', read_only=True)
    academic_term_name = serializers.CharField(source='academic_term.name', read_only=True)
    academic_year_name = serializers.CharField(source='academic_term.year.name', read_only=True)
    
    class Meta:
        model = FeeStructure
        fields = '__all__'
        read_only_fields = ['total_amount', 'created_at', 'updated_at']


class StudentFeeSerializer(serializers.ModelSerializer):
    """Serializer for StudentFee model"""
    student_name = serializers.CharField(source='student.get_full_name', read_only=True)
    student_id = serializers.CharField(source='student.student_id', read_only=True)
    fee_structure_details = FeeStructureSerializer(source='fee_structure', read_only=True)
    
    class Meta:
        model = StudentFee
        fields = '__all__'
        read_only_fields = ['final_amount', 'amount_paid', 'balance', 'status', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment model"""
    student_name = serializers.CharField(source='student_fee.student.get_full_name', read_only=True)
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['created_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice model"""
    student_name = serializers.CharField(source='student_fee.student.get_full_name', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']


class FinanceSummarySerializer(serializers.Serializer):
    """Serializer for finance summary data"""
    total_fees = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_balance = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_count = serializers.IntegerField()
    status = serializers.CharField()
