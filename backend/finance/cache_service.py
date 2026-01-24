"""
Finance Cache Service
Manages caching of external API data with staleness checking
"""

from datetime import timedelta
from django.utils import timezone
from typing import Dict, Optional, Any
import logging

from .models import FinanceCache
from .external_api import get_finance_api
from students.models import Student

logger = logging.getLogger(__name__)


class FinanceCacheService:
    """
    Service for managing finance data cache
    """
    
    # Cache duration in seconds (1 hour default)
    CACHE_DURATION = 3600
    
    @classmethod
    def get_or_fetch(cls, student_id: int, data_type: str) -> Optional[Dict]:
        """
        Get data from cache or fetch from API if stale/missing
        
        Args:
            student_id: Student ID
            data_type: Type of data (fees/payments/invoices/balance)
            
        Returns:
            Data dictionary or None if unavailable
        """
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found")
            return None
        
        # Try to get from cache
        try:
            cache_entry = FinanceCache.objects.get(student=student, data_type=data_type)
            
            # Check if stale
            if not cache_entry.check_if_stale():
                logger.info(f"Cache hit for student {student_id}, type {data_type}")
                return cache_entry.cached_data
            
            logger.info(f"Cache stale for student {student_id}, type {data_type}")
            
        except FinanceCache.DoesNotExist:
            logger.info(f"Cache miss for student {student_id}, type {data_type}")
            cache_entry = None
        
        # Fetch from API
        api_data = cls._fetch_from_api(student, data_type)
        
        if api_data is None:
            # API failed, return stale cache if available
            if cache_entry:
                logger.warning(f"API failed, returning stale cache for student {student_id}")
                return cache_entry.cached_data
            
            # No cache and API failed, try internal database
            return cls._fetch_from_internal(student, data_type)
        
        # Update cache
        cls._update_cache(student, data_type, api_data)
        
        return api_data
    
    @classmethod
    def _fetch_from_api(cls, student: Student, data_type: str) -> Optional[Dict]:
        """
        Fetch data from external API
        
        Args:
            student: Student instance
            data_type: Type of data to fetch
            
        Returns:
            API response data or None
        """
        api = get_finance_api()
        
        if data_type == 'fees':
            return api.get_student_fees(student.student_id)
        elif data_type == 'payments':
            return api.get_payment_history(student.student_id)
        elif data_type == 'balance':
            return api.get_outstanding_balance(student.student_id)
        elif data_type == 'invoices':
            return api.get_invoices(student.student_id)
        else:
            logger.error(f"Unknown data type: {data_type}")
            return None
    
    @classmethod
    def _fetch_from_internal(cls, student: Student, data_type: str) -> Optional[Dict]:
        """
        Fetch data from internal database (fallback)
        
        Args:
            student: Student instance
            data_type: Type of data to fetch
            
        Returns:
            Internal database data or None
        """
        from .models import StudentFee, Payment, Invoice
        
        try:
            if data_type == 'fees':
                fees = StudentFee.objects.filter(student=student).select_related('fee_structure')
                return {
                    'fees': [
                        {
                            'term': fee.fee_structure.term,
                            'year': fee.fee_structure.academic_year,
                            'amount': float(fee.final_amount),
                            'paid': float(fee.amount_paid),
                            'balance': float(fee.balance),
                            'status': fee.status
                        }
                        for fee in fees
                    ]
                }
            
            elif data_type == 'payments':
                payments = Payment.objects.filter(
                    student_fee__student=student
                ).order_by('-payment_date')
                return {
                    'payments': [
                        {
                            'date': payment.payment_date.isoformat(),
                            'amount': float(payment.amount),
                            'method': payment.payment_method,
                            'reference': payment.transaction_reference,
                            'receipt': payment.receipt_number
                        }
                        for payment in payments
                    ]
                }
            
            elif data_type == 'balance':
                total_balance = sum(
                    fee.balance for fee in StudentFee.objects.filter(student=student)
                )
                return {
                    'balance': float(total_balance),
                    'currency': 'KES'
                }
            
            elif data_type == 'invoices':
                invoices = Invoice.objects.filter(
                    student_fee__student=student
                ).order_by('-issue_date')
                return {
                    'invoices': [
                        {
                            'number': invoice.invoice_number,
                            'date': invoice.issue_date.isoformat(),
                            'due_date': invoice.due_date.isoformat(),
                            'amount': float(invoice.amount),
                            'status': invoice.status
                        }
                        for invoice in invoices
                    ]
                }
            
        except Exception as e:
            logger.error(f"Error fetching internal data: {str(e)}")
            return None
    
    @classmethod
    def _update_cache(cls, student: Student, data_type: str, data: Dict):
        """
        Update cache entry
        
        Args:
            student: Student instance
            data_type: Type of data
            data: Data to cache
        """
        stale_after = timezone.now() + timedelta(seconds=cls.CACHE_DURATION)
        
        FinanceCache.objects.update_or_create(
            student=student,
            data_type=data_type,
            defaults={
                'cached_data': data,
                'stale_after': stale_after,
                'is_stale': False
            }
        )
        
        logger.info(f"Cache updated for student {student.id}, type {data_type}")
    
    @classmethod
    def invalidate_cache(cls, student_id: int, data_type: str = None):
        """
        Mark cache as stale
        
        Args:
            student_id: Student ID
            data_type: Specific data type to invalidate, or None for all
        """
        try:
            student = Student.objects.get(id=student_id)
            
            if data_type:
                FinanceCache.objects.filter(
                    student=student,
                    data_type=data_type
                ).update(is_stale=True)
            else:
                FinanceCache.objects.filter(student=student).update(is_stale=True)
            
            logger.info(f"Cache invalidated for student {student_id}")
            
        except Student.DoesNotExist:
            logger.error(f"Student {student_id} not found")
    
    @classmethod
    def refresh_cache(cls, student_id: int):
        """
        Force refresh all cache entries for a student
        
        Args:
            student_id: Student ID
        """
        data_types = ['fees', 'payments', 'balance', 'invoices']
        
        for data_type in data_types:
            cls.invalidate_cache(student_id, data_type)
            cls.get_or_fetch(student_id, data_type)
        
        logger.info(f"Cache refreshed for student {student_id}")
