from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Announcement, Notification, AcademicYear  # No TeacherProfile or StudentProfile here
from students.models import Student
from teachers.models import Teacher
from courses.models import Course
from django.db.models import Count
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import permissions, viewsets
from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import IsAdmin
from .serializers import UserSerializer, TeacherSerializer, AnnouncementSerializer, NotificationSerializer, \
    StudentSerializer, UserRegistrationSerializer, DynamicUserRegistrationSerializer  # Updated serializer names
from rest_framework import generics
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.middleware.csrf import get_token
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

class CSRFTokenView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        return Response({'csrfToken': get_token(request)})

# Update RegisterView
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = DynamicUserRegistrationSerializer


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_data = UserSerializer(request.user).data
        if hasattr(request.user, 'teacher'):
            user_data['role'] = 'teacher'
        else:
            user_data['role'] = 'student'
        return Response(user_data)


class ProfileView(APIView):
    """
    Lightweight profile API for the React client. Returns the authenticated
    user's core details plus any attached teacher profile. Supports partial
    updates for contact information.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = UserSerializer(request.user).data
        data['role'] = 'teacher' if hasattr(request.user, 'teacher') else 'student'
        if hasattr(request.user, 'teacher'):
            data['teacher_profile'] = TeacherSerializer(request.user.teacher).data
        return Response(data)

    def put(self, request):
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        teacher = getattr(request.user, 'teacher', None)
        teacher_payload = request.data.get('teacher_profile')
        if teacher and teacher_payload:
            teacher_serializer = TeacherSerializer(teacher, data=teacher_payload, partial=True)
            teacher_serializer.is_valid(raise_exception=True)
            teacher_serializer.save()

        response_data = serializer.data
        response_data['role'] = 'teacher' if teacher else 'student'
        if teacher:
            response_data['teacher_profile'] = TeacherSerializer(teacher).data
        return Response(response_data)

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        logger.debug(f"Attempting to authenticate email: {email}")
        user = authenticate(
            self.context['request'],
            username=email,
            password=password
        )

        if not user:
            logger.debug(f"Authentication failed for email: {email}")
            raise AuthenticationFailed('Invalid credentials')

        logger.debug(f"Authenticated user: {user}")
        data = super().validate(attrs)
        # Serialize using the StudentSerializer (or a custom one)
        serialized_user = StudentSerializer(user).data
        # Inject the role explicitly based on whether the user has a teacher relation
        if hasattr(user, 'teacher'):
            serialized_user['role'] = 'teacher'
        else:
            serialized_user['role'] = 'student'
        data['user'] = serialized_user
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = (permissions.AllowAny,)


class AnnouncementViewSet(viewsets.ModelViewSet):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsAdmin]

class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)



def home(request):
    if request.user.is_authenticated:
        return redirect('core:dashboard')
    announcements = Announcement.objects.filter(is_active=True)[:5]
    return render(request, 'core/home.html', {
        'announcements': announcements
    })


@login_required
def dashboard(request):
    context = {
        'total_students': Student.objects.count(),
        'total_teachers': Teacher.objects.count(),
        'total_courses': Course.objects.count(),
        'recent_announcements': Announcement.objects.filter(is_active=True)[:5],
        'unread_notifications': request.user.notification_set.filter(is_read=False).count()
    }

    student_user = request.user if isinstance(request.user, Student) else getattr(request.user, 'student', None)

    if student_user:
        context.update({
            'enrolled_courses': student_user.get_enrolled_courses(),
            'attendance_percentage': student_user.get_attendance_percentage(),
            'upcoming_assignments': []  # Add logic to get upcoming assignments
        })
        return render(request, 'core/student_dashboard.html', context)

    elif hasattr(request.user, 'teacher'):
        teacher = request.user.teacher
        context.update({
            'assigned_courses': teacher.course_set.all(),
            'total_students': sum(course.students.count() for course in teacher.course_set.all()),  # Updated to 'students'
            'upcoming_classes': []  # Add logic to get upcoming classes
        })
        return render(request, 'core/teacher_dashboard.html', context)

    return render(request, 'core/admin_dashboard.html', context)


def login_view(request):
    if request.method == 'POST':
        student_id = request.POST.get('student_id')  # Changed from username
        password = request.POST.get('password')
        user = authenticate(request, student_id=student_id, password=password)

        if user is not None:
            login(request, user)
            return redirect('core:dashboard')
        else:
            messages.error(request, 'Invalid student ID or password')

    return render(request, 'core/login.html')


@login_required
class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({"detail": "Successfully logged out."}, status=200)
        except Exception as e:
            return Response({"detail": str(e)}, status=400)

@login_required
def announcement_list(request):
    announcements = Announcement.objects.filter(is_active=True)
    return render(request, 'core/announcement_list.html', {
        'announcements': announcements
    })

@login_required
def announcement_detail(request, pk):
    announcement = get_object_or_404(Announcement, pk=pk, is_active=True)
    return render(request, 'core/announcement_detail.html', {
        'announcement': announcement
    })

@login_required
def notification_list(request):
    notifications = request.user.notification_set.all()
    return render(request, 'core/notification_list.html', {
        'notifications': notifications
    })

@login_required
def mark_notification_read(request, pk):
    if request.method == 'POST':
        notification = get_object_or_404(Notification, pk=pk, user=request.user)
        notification.is_read = True
        notification.save()
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)

@login_required
def profile(request):
    student_user = request.user if isinstance(request.user, Student) else getattr(request.user, 'student', None)
    if student_user:
        return render(request, 'core/student_profile.html', {
            'student': student_user
        })
    elif hasattr(request.user, 'teacher'):
        return render(request, 'core/teacher_profile.html', {
            'teacher': request.user.teacher
        })
    return render(request, 'core/admin_profile.html')

@login_required
def edit_profile(request):
    student_user = request.user if isinstance(request.user, Student) else getattr(request.user, 'student', None)
    if request.method == 'POST':
        if student_user:
            student = student_user
            student.phone = request.POST.get('phone', student.phone)
            student.address = request.POST.get('address', student.address)
            student.save()
        elif hasattr(request.user, 'teacher'):
            teacher = request.user.teacher
            teacher.phone = request.POST.get('phone', teacher.phone)
            teacher.address = request.POST.get('address', teacher.address)
            teacher.save()

        user = request.user
        user.first_name = request.POST.get('first_name', user.first_name)
        user.last_name = request.POST.get('last_name', user.last_name)
        user.email = request.POST.get('email', user.email)

        if request.POST.get('new_password'):
            user.set_password(request.POST.get('new_password'))

        user.save()
        messages.success(request, 'Profile updated successfully.')
        return redirect('core:profile')

    return render(request, 'core/edit_profile.html')

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()  # Updated to Teacher
    serializer_class = TeacherSerializer  # Updated to TeacherSerializer
    permission_classes = [IsAdmin]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()  # Updated to Student
    serializer_class = StudentSerializer  # Updated to StudentSerializer
    permission_classes = [IsAdmin]