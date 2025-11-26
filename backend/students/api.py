from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Student, Attendance
from .serializers import StudentSerializer, AttendanceSerializer

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['post'])
    def bulk_attendance(self, request):
        serializer = AttendanceSerializer(data=request.data['attendance'], many=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'status': 'Attendance updated'})