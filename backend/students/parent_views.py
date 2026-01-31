"""
Views for Parent authentication and management
"""

from django.db import models
from django.db.models import Exists, OuterRef
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.shortcuts import get_object_or_404
from core.email_utils import send_welcome_email

from .models import Parent, Student
from .parent_serializers import (
    ParentRegistrationSerializer,
    ParentLoginSerializer,
    ParentSerializer,
    ParentProfileUpdateSerializer,
    AddChildSerializer
)
from cbc.report_generator import generate_student_report
from finance.models import StudentFee, Payment, Invoice, FeeStructure
from finance.serializers import StudentFeeSerializer, PaymentSerializer, InvoiceSerializer, FeeStructureSerializer
from courses.models import Assignment, Quiz, AssignmentSubmission, QuizSubmission
from courses.serializers import AssignmentSerializer, QuizSerializer
from events.models import EventNotice
from events.serializers import EventNoticeSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_register(request):
    """
    Register a new parent account
    POST /api/parents/register/
    """
    serializer = ParentRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        password = request.data.get('password') # Get the raw password to send via email
        student_ids_raw = request.data.get('student_ids', [])
        parent = serializer.save()
        
        # Link students if provided
        if student_ids_raw:
            # Handle list of strings or comma-separated string
            if isinstance(student_ids_raw, str):
                student_ids = [int(id.strip()) for id in student_ids_raw.split(',') if id.strip().isdigit()]
            else:
                student_ids = [int(id) for id in student_ids_raw if str(id).isdigit()]
                
            students = Student.objects.filter(id__in=student_ids)
            parent.children.set(students)
            parent.save()
        
        # Send welcome email
        send_welcome_email(
            user_email=parent.email,
            first_name=parent.first_name,
            password=password,
            role='parent'
        )
        
        # Generate JWT tokens
        refresh = RefreshToken()
        refresh['parent_id'] = parent.id
        refresh['email'] = parent.email
        refresh['user_type'] = 'parent'
        
        return Response({
            'message': 'Parent account created successfully',
            'parent': ParentSerializer(parent).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_login(request):
    """
    Login for parents
    POST /api/parents/login/
    """
    serializer = ParentLoginSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    email = serializer.validated_data['email']
    password = serializer.validated_data['password']
    
    try:
        parent = Parent.objects.get(email=email)
    except Parent.DoesNotExist:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not parent.is_active:
        return Response({
            'error': 'Account is inactive'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    if not parent.check_password(password):
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
    
    # Update last login
    parent.last_login = timezone.now()
    parent.save(update_fields=['last_login'])
    
    # Generate JWT tokens
    refresh = RefreshToken()
    refresh['parent_id'] = parent.id
    refresh['email'] = parent.email
    refresh['user_type'] = 'parent'
    
    return Response({
        'message': 'Login successful',
        'parent': ParentSerializer(parent).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_200_OK)


class ParentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Parent CRUD operations
    """
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    
    def get_queryset(self):
        # Parents can only see their own profile
        if hasattr(self.request, 'parent_id'):
            return self.queryset.filter(id=self.request.parent_id)
        return self.queryset.none()
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Get current parent's profile
        GET /api/parents/me/
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        serializer = self.get_serializer(parent)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'])
    def update_profile(self, request):
        """
        Update current parent's profile
        PUT/PATCH /api/parents/update-profile/
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_41_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        serializer = ParentProfileUpdateSerializer(parent, data=request.data, partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(ParentSerializer(parent).data)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def learning_areas(self, request):
        """
        Get all learning areas for parent's children
        GET /api/parents/learning-areas/
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        learning_areas = parent.get_all_learning_areas()
        
        from teachers.serializers import LearningAreaSerializer
        serializer = LearningAreaSerializer(learning_areas, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_child(self, request):
        """
        Add a child to parent's account
        POST /api/parents/add-child/
        Body: { "student_id": "STU123" }
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        serializer = AddChildSerializer(data=request.data)
        
        if serializer.is_valid():
            student_id = serializer.validated_data['student_id']
            student = get_object_or_404(Student, student_id=student_id)
            
            if student in parent.children.all():
                return Response({
                    'error': 'This student is already linked to your account'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            parent.children.add(student)
            return Response({
                'message': f'Successfully added {student.get_full_name()} to your account',
                'parent': ParentSerializer(parent).data
            })
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'])
    def remove_child(self, request):
        """
        Remove a child from parent's account
        POST /api/parents/remove-child/
        Body: { "student_id": "STU123" }
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        student_id = request.data.get('student_id')
        
        if not student_id:
            return Response({'error': 'student_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        student = get_object_or_404(Student, student_id=student_id)
        
        if student not in parent.children.all():
            return Response({
                'error': 'This student is not linked to your account'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        parent.children.remove(student)
        return Response({
            'message': f'Successfully removed {student.get_full_name()} from your account',
            'parent': ParentSerializer(parent).data
        })

    @action(detail=False, methods=['get'], url_path='child-report/(?P<child_id>[^/.]+)')
    def child_report(self, request, child_id=None):
        """
        Get CBC report for a specific child
        GET /api/parents/child-report/{child_id}/
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        child = get_object_or_404(Student, id=child_id)
        
        if child not in parent.children.all():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            report_data = generate_student_report(child.id)
            return Response(report_data)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='child-finances/(?P<child_id>[^/.]+)')
    def child_finances(self, request, child_id=None):
        """
        Get financial records for a specific child with detailed breakdown
        GET /api/parents/child-finances/{child_id}/
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        child = get_object_or_404(Student, id=child_id)
        
        if child not in parent.children.all():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Fetch fees, payments, and invoices
        fees = StudentFee.objects.filter(student=child)
        payments = Payment.objects.filter(student_fee__student=child)
        invoices = Invoice.objects.filter(student_fee__student=child)
        from core.models import AcademicYear
        current_year = AcademicYear.objects.filter(is_current=True).first()
        current_term = current_year.get_active_term() if current_year else None

        # Get the active fee structure/framework details
        structures = FeeStructure.objects.filter(grade_level=child.grade_level, is_active=True)
        
        # Order them such that the current term is first, then by date descending
        if current_term:
            structures = sorted(
                structures,
                key=lambda x: (x.academic_term == current_term, x.academic_term.start_date if x.academic_term else None),
                reverse=True
            )
        else:
            structures = structures.order_by('-academic_term__start_date')
            
        fee_structure_data = FeeStructureSerializer(structures, many=True).data

        return Response({
            'fees': StudentFeeSerializer(fees, many=True).data,
            'payments': PaymentSerializer(payments, many=True).data,
            'invoices': InvoiceSerializer(invoices, many=True).data,
            'fee_frameworks': fee_structure_data,
            'summary': {
                'total_fees': sum(f.final_amount for f in fees),
                'total_paid': sum(f.amount_paid for f in fees),
                'balance': sum(f.balance for f in fees),
                'credit_balance': child.credit_balance
            }
        })

    @action(detail=False, methods=['get'], url_path='child-activities/(?P<child_id>[^/.]+)')
    def child_activities(self, request, child_id=None):
        """
        Get most recent activities (assignments and quizzes) for a child with completion status
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        child = get_object_or_404(Student, id=child_id)
        
        if child not in parent.children.all():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Assignment completion check
        assignment_submissions = AssignmentSubmission.objects.filter(
            assignment=OuterRef('pk'),
            student=child
        )
        
        # Get recent assignments with optimized queries
        assignments = Assignment.objects.filter(
            models.Q(learning_area__grade_level=child.grade_level) | 
            models.Q(learning_area__students=child) |
            models.Q(course__students=child)
        ).select_related(
            'learning_area',
            'learning_area__grade_level',
            'learning_outcome',
            'learning_outcome__sub_strand',
            'learning_outcome__sub_strand__strand'
        ).prefetch_related(
            'tested_outcomes',
            'tested_outcomes__sub_strand'
        ).distinct().annotate(
            is_completed=Exists(assignment_submissions)
        ).order_by('-created_at')[:10]

        # Quiz completion check
        quiz_submissions = QuizSubmission.objects.filter(
            quiz=OuterRef('pk'),
            student=child
        )

        # Get recent quizzes with optimized queries
        quizzes = Quiz.objects.filter(
            models.Q(learning_area__grade_level=child.grade_level) |
            models.Q(learning_area__students=child) |
            models.Q(lesson__module__learning_area__grade_level=child.grade_level) |
            models.Q(lesson__module__learning_area__students=child)
        ).select_related(
            'learning_area',
            'lesson',
            'lesson__module',
            'lesson__module__learning_area'
        ).prefetch_related(
            'questions'
        ).distinct().annotate(
            is_completed=Exists(quiz_submissions)
        ).order_by('-created_at')[:10]

        # Serialize with prefetched data
        asgn_data = AssignmentSerializer(assignments, many=True).data
        for i, a in enumerate(assignments):
            asgn_data[i]['is_completed'] = a.is_completed

        quiz_data = QuizSerializer(quizzes, many=True).data
        for i, q in enumerate(quizzes):
            quiz_data[i]['is_completed'] = q.is_completed

        # Get relevant events (Targeting school-wide, grade, or club)
        events = EventNotice.objects.filter(
            models.Q(target_type='all') |
            models.Q(target_type='grades', target_grades=child.grade_level) |
            models.Q(target_type='clubs', target_clubs=child.club)
        ).distinct().order_by('-start_date')[:5]

        return Response({
            'assignments': asgn_data,
            'quizzes': quiz_data,
            'events': EventNoticeSerializer(events, many=True).data
        })

    @action(detail=False, methods=['get'], url_path='child-calendar/(?P<child_id>[^/.]+)')
    def child_calendar(self, request, child_id=None):
        """
        Get all upcoming events for the calendar (assignments and quizzes with due dates)
        """
        if not hasattr(request, 'parent_id'):
            return Response({'error': 'Not authenticated'}, status=status.HTTP_401_UNAUTHORIZED)
        
        parent = get_object_or_404(Parent, id=request.parent_id)
        child = get_object_or_404(Student, id=child_id)
        
        if child not in parent.children.all():
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Assignment completion check
        asgn_submissions = AssignmentSubmission.objects.filter(
            assignment=OuterRef('pk'),
            student=child
        )

        # Filter for next 30 days only
        from datetime import datetime, timedelta
        from django.utils import timezone
        today = timezone.now().date()
        next_30_days = today + timedelta(days=30)

        # Fetch assignments with due dates in next 30 days with optimized queries
        assignments = Assignment.objects.filter(
            due_date__isnull=False,
            due_date__gte=today,
            due_date__lte=next_30_days
        ).filter(
            models.Q(learning_area__grade_level=child.grade_level) | 
            models.Q(learning_area__students=child) |
            models.Q(course__students=child)
        ).select_related(
            'learning_area',
            'learning_area__grade_level',
            'learning_outcome'
        ).prefetch_related(
            'tested_outcomes'
        ).distinct().annotate(
            is_completed=Exists(asgn_submissions)
        )

        # Quiz completion check
        qz_submissions = QuizSubmission.objects.filter(
            quiz=OuterRef('pk'),
            student=child
        )

        # Fetch quizzes with due dates in next 30 days with optimized queries
        quizzes = Quiz.objects.filter(
            due_date__isnull=False,
            due_date__gte=today,
            due_date__lte=next_30_days
        ).filter(
            models.Q(learning_area__grade_level=child.grade_level) |
            models.Q(learning_area__students=child) |
            models.Q(lesson__module__learning_area__grade_level=child.grade_level) |
            models.Q(lesson__module__learning_area__students=child)
        ).select_related(
            'learning_area',
            'lesson',
            'lesson__module'
        ).prefetch_related(
            'questions'
        ).distinct().annotate(
            is_completed=Exists(qz_submissions)
        )

        asgn_data = AssignmentSerializer(assignments, many=True).data
        for i, a in enumerate(assignments):
            asgn_data[i]['is_completed'] = a.is_completed

        quiz_data = QuizSerializer(quizzes, many=True).data
        for i, q in enumerate(quizzes):
            quiz_data[i]['is_completed'] = q.is_completed

        # Fetch events for calendar
        events = EventNotice.objects.filter(
            start_date__lte=next_30_days,
            end_date__gte=today
        ).filter(
            models.Q(target_type='all') |
            models.Q(target_type='grades', target_grades=child.grade_level) |
            models.Q(target_type='clubs', target_clubs=child.club)
        ).distinct()

        return Response({
            'assignments': asgn_data,
            'quizzes': quiz_data,
            'events': EventNoticeSerializer(events, many=True).data
        })
