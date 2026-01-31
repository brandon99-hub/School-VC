"""
Finance app models for fee management and payment tracking
"""

from django.db import models
from django.core.validators import MinValueValidator
from students.models import Student
from cbc.models import GradeLevel


class FeeStructure(models.Model):
    """
    Fee structure template for a grade level and term
    """
    grade_level = models.ForeignKey(GradeLevel, on_delete=models.CASCADE, related_name='fee_structures')
    academic_term = models.ForeignKey('core.AcademicTerm', on_delete=models.CASCADE, related_name='fee_structures', null=True)
    
    # Fee components
    tuition_amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    books_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    activities_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    transport_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    boarding_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    other_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['grade_level', 'academic_term']
        ordering = ['-academic_term__start_date']
    
    def save(self, *args, **kwargs):
        # Auto-calculate total
        self.total_amount = (
            self.tuition_amount + self.books_amount + self.activities_amount +
            self.transport_amount + self.boarding_amount + self.other_amount
        )
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.grade_level.name} - {self.academic_term}"


class StudentFee(models.Model):
    """
    Fee assignment to a specific student
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partial', 'Partially Paid'),
        ('paid', 'Fully Paid'),
        ('overdue', 'Overdue'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='fees')
    fee_structure = models.ForeignKey(FeeStructure, on_delete=models.CASCADE, related_name='student_fees', null=True, blank=True)
    event_notice = models.ForeignKey('events.EventNotice', on_delete=models.CASCADE, related_name='student_fees', null=True, blank=True)
    
    # Allow custom amounts (scholarships, special cases)
    custom_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    discount_reason = models.CharField(max_length=200, blank=True)
    
    final_amount = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    amount_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    balance = models.DecimalField(max_digits=10, decimal_places=2, editable=False)
    
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        # Calculate final amount
        if self.custom_amount:
            base_amount = self.custom_amount
        elif self.event_notice:
            base_amount = self.event_notice.cost
        elif self.fee_structure:
            base_amount = self.fee_structure.total_amount
        else:
            base_amount = 0
            
        self.final_amount = base_amount - self.discount_amount
        
        # Calculate balance
        self.balance = self.final_amount - self.amount_paid
        
        # Update status
        if self.balance <= 0:
            self.status = 'paid'
        elif self.amount_paid > 0:
            self.status = 'partial'
        else:
            self.status = 'pending'
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.fee_structure}"


class Payment(models.Model):
    """
    Payment record
    """
    PAYMENT_METHODS = [
        ('mpesa', 'M-Pesa'),
        ('bank', 'Bank Transfer'),
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('cheque', 'Cheque'),
    ]
    
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    payment_method = models.CharField(max_length=10, choices=PAYMENT_METHODS)
    transaction_reference = models.CharField(max_length=100, unique=True)
    payment_date = models.DateTimeField()
    
    received_by = models.CharField(max_length=100, help_text="Staff member who received payment")
    receipt_number = models.CharField(max_length=50, unique=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-payment_date']
    
    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Update student fee amount_paid
        self.student_fee.amount_paid = self.student_fee.payments.aggregate(
            total=models.Sum('amount')
        )['total'] or 0
        self.student_fee.save()
    
    def __str__(self):
        return f"Payment {self.receipt_number} - {self.amount}"


class Invoice(models.Model):
    """
    Invoice for student fees
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('cancelled', 'Cancelled'),
    ]
    
    student_fee = models.ForeignKey(StudentFee, on_delete=models.CASCADE, related_name='invoices')
    invoice_number = models.CharField(max_length=50, unique=True)
    issue_date = models.DateField()
    due_date = models.DateField()
    
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='draft')
    
    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-issue_date']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"


class FinanceCache(models.Model):
    """
    Cache for external API data
    """
    DATA_TYPES = [
        ('fees', 'Fee Structure'),
        ('payments', 'Payment History'),
        ('invoices', 'Invoices'),
        ('balance', 'Balance'),
    ]
    
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='finance_cache')
    data_type = models.CharField(max_length=20, choices=DATA_TYPES)
    cached_data = models.JSONField()
    
    last_updated = models.DateTimeField(auto_now=True)
    stale_after = models.DateTimeField()
    is_stale = models.BooleanField(default=False)
    
    class Meta:
        unique_together = ['student', 'data_type']
        indexes = [
            models.Index(fields=['student', 'data_type', 'is_stale']),
        ]
    
    def check_if_stale(self):
        """Check if cache is stale"""
        from django.utils import timezone
        if timezone.now() > self.stale_after:
            self.is_stale = True
            self.save(update_fields=['is_stale'])
        return self.is_stale
    
    def __str__(self):
        return f"{self.student.get_full_name()} - {self.data_type}"
