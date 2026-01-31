from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Club, EventNotice, ClubAttendance, EventAttendance
from .serializers import (
    ClubSerializer, EventNoticeSerializer, 
    ClubAttendanceSerializer, EventAttendanceSerializer
)
from students.models import Student
from finance.models import StudentFee

class ClubViewSet(viewsets.ModelViewSet):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='enroll-students')
    def enroll_students(self, request, pk=None):
        """Teacher/Admin can bulk enroll students to a club"""
        club = self.get_object_or_404()
        student_ids = request.data.get('student_ids', [])
        
        # Verify if user is the assigned teacher or admin
        if not (request.user.is_superuser or (hasattr(request.user, 'teacher') and club.teacher == request.user.teacher)):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        students = Student.objects.filter(id__in=student_ids)
        for student in students:
            student.club = club
            student.save()
            
        return Response({'message': f'Enrolled {students.count()} students to {club.name}'})

class EventNoticeViewSet(viewsets.ModelViewSet):
    queryset = EventNotice.objects.all()
    serializer_class = EventNoticeSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Filtering for parents based on children
        if hasattr(self.request.user, 'parent_profile'):
            student_ids = self.request.user.parent_profile.children.values_list('id', flat=True)
            grades = self.request.user.parent_profile.children.values_list('grade_level', flat=True)
            clubs = self.request.user.parent_profile.children.values_list('club', flat=True)
            
            return EventNotice.objects.filter(
                models.Q(is_school_wide=True) |
                models.Q(target_grades__in=grades) |
                models.Q(target_clubs__in=clubs)
            ).distinct()
        return super().get_queryset()

    @action(detail=True, methods=['post'], url_path='pay-fee')
    def pay_fee(self, request, pk=None):
        """Parent clicks Pay Fee for a specific child's event"""
        event = self.get_object_or_404()
        student_id = request.data.get('student_id')
        student = get_object_or_404(Student, id=student_id)
        
        if not event.has_fee:
            return Response({'error': 'This event has no fee'}, status=status.HTTP_400_BAD_REQUEST)

        # Create StudentFee if it doesn't exist
        fee, created = StudentFee.objects.get_or_create(
            student=student,
            event_notice=event,
            defaults={
                'final_amount': event.cost,
                'balance': event.cost,
                'status': 'pending'
            }
        )
        
        return Response({
            'message': 'Fee record created',
            'fee_id': fee.id,
            'amount': fee.final_amount
        })

class ClubAttendanceViewSet(viewsets.ModelViewSet):
    queryset = ClubAttendance.objects.all()
    serializer_class = ClubAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]

class EventAttendanceViewSet(viewsets.ModelViewSet):
    queryset = EventAttendance.objects.all()
    serializer_class = EventAttendanceSerializer
    permission_classes = [permissions.IsAuthenticated]
