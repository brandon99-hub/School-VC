"""
Finance URL patterns
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Create router for viewsets
router = DefaultRouter()
router.register(r'fee-structures', views.FeeStructureViewSet, basename='fee-structure')
router.register(r'student-fees', views.StudentFeeViewSet, basename='student-fee')
router.register(r'payments', views.PaymentViewSet, basename='payment')
router.register(r'invoices', views.InvoiceViewSet, basename='invoice')

app_name = 'finance'

urlpatterns = [
    # Parent/Student endpoints
    path('student/<int:student_id>/fees/', views.student_fees, name='student-fees'),
    path('student/<int:student_id>/payments/', views.student_payments, name='student-payments'),
    path('student/<int:student_id>/balance/', views.student_balance, name='student-balance'),
    path('student/<int:student_id>/invoices/', views.student_invoices, name='student-invoices'),
    path('invoice/<int:invoice_id>/download/', views.download_invoice, name='download-invoice'),
    
    # Admin endpoints
    path('overview/', views.finance_overview, name='overview'),
    path('defaulters/', views.defaulters_list, name='defaulters'),
    path('payment/record/', views.record_payment, name='record-payment'),
    path('invoice/generate/', views.generate_invoice, name='generate-invoice'),
    path('cache/refresh/<int:student_id>/', views.refresh_cache, name='refresh-cache'),
    path('reports/revenue/', views.revenue_report, name='revenue-report'),
    
    # ViewSet routes
    path('', include(router.urls)),
]
