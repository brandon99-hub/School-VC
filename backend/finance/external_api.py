"""
External Finance API Service
Handles communication with external finance system
"""

import requests
from typing import Dict, List, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class ExternalFinanceAPI:
    """
    Service class for interacting with external finance API
    """
    
    def __init__(self, api_url: str = None, api_key: str = None):
        """
        Initialize API connection
        
        Args:
            api_url: Base URL for external API
            api_key: API authentication key
        """
        from django.conf import settings
        
        self.api_url = api_url or getattr(settings, 'FINANCE_API_URL', None)
        self.api_key = api_key or getattr(settings, 'FINANCE_API_KEY', None)
        self.timeout = 10  # seconds
        
        if not self.api_url:
            logger.warning("Finance API URL not configured. Using internal data only.")
    
    def _make_request(self, endpoint: str, method: str = 'GET', data: Dict = None) -> Optional[Dict]:
        """
        Make HTTP request to external API
        
        Args:
            endpoint: API endpoint path
            method: HTTP method (GET, POST, etc.)
            data: Request payload for POST/PUT
            
        Returns:
            Response data or None if failed
        """
        if not self.api_url:
            return None
        
        url = f"{self.api_url}/{endpoint}"
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=self.timeout)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=data, timeout=self.timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.Timeout:
            logger.error(f"API request timeout: {url}")
            return None
        except requests.exceptions.RequestException as e:
            logger.error(f"API request failed: {url} - {str(e)}")
            return None
    
    def get_student_fees(self, student_id: str) -> Optional[Dict]:
        """
        Fetch fee structure for a student
        
        Args:
            student_id: Student identifier
            
        Returns:
            Fee data dictionary or None
        """
        return self._make_request(f'students/{student_id}/fees')
    
    def get_payment_history(self, student_id: str) -> Optional[List[Dict]]:
        """
        Fetch payment history for a student
        
        Args:
            student_id: Student identifier
            
        Returns:
            List of payment records or None
        """
        return self._make_request(f'students/{student_id}/payments')
    
    def get_outstanding_balance(self, student_id: str) -> Optional[Dict]:
        """
        Get current outstanding balance for a student
        
        Args:
            student_id: Student identifier
            
        Returns:
            Balance data or None
        """
        return self._make_request(f'students/{student_id}/balance')
    
    def get_invoices(self, student_id: str) -> Optional[List[Dict]]:
        """
        Fetch invoices for a student
        
        Args:
            student_id: Student identifier
            
        Returns:
            List of invoices or None
        """
        return self._make_request(f'students/{student_id}/invoices')
    
    def verify_payment(self, transaction_ref: str) -> Optional[Dict]:
        """
        Verify payment status
        
        Args:
            transaction_ref: Transaction reference number
            
        Returns:
            Payment verification data or None
        """
        return self._make_request(f'payments/verify/{transaction_ref}')
    
    def get_fee_structure(self, grade_level: str, term: str, year: str) -> Optional[Dict]:
        """
        Get fee structure for a grade level and term
        
        Args:
            grade_level: Grade level identifier
            term: Term number (1, 2, or 3)
            year: Academic year (e.g., "2024/2025")
            
        Returns:
            Fee structure data or None
        """
        return self._make_request(f'fee-structures/{grade_level}/{term}/{year}')


# Singleton instance
_api_instance = None

def get_finance_api() -> ExternalFinanceAPI:
    """
    Get singleton instance of Finance API
    
    Returns:
        ExternalFinanceAPI instance
    """
    global _api_instance
    if _api_instance is None:
        _api_instance = ExternalFinanceAPI()
    return _api_instance
