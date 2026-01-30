from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate, get_user_model
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Announcement, Notification, AcademicYear, AcademicTerm
from students.models import Student, Parent
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
    StudentSerializer, UserRegistrationSerializer, DynamicUserRegistrationSerializer, \
    AcademicYearSerializer, AcademicTermSerializer
from .utils import get_user_role
from rest_framework import generics
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.middleware.csrf import get_token
import logging
from .email_utils import send_welcome_email
from rest_framework.decorators import api_view, permission_classes

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
    
    def create(self, request, *args, **kwargs):
        logger.info(f"Registration attempt with data: {request.data}")
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            logger.error(f"Registration validation failed: {serializer.errors}")
        return super().create(request, *args, **kwargs)


class UserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if hasattr(request.user, '_is_parent') and request.user._is_parent:
            return Response({
                'id': request.user.id,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
                'role': 'parent',
                'system_id': f"PAR-{request.user.id:03d}"
            })
        user_data = UserSerializer(request.user).data
        user_data['role'] = get_user_role(request.user)
        if hasattr(request.user, 'teacher'):
            user_data['teacher_profile'] = TeacherSerializer(request.user.teacher).data
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
        data['role'] = get_user_role(request.user)
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
        response_data['role'] = get_user_role(request.user)
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
            # Try Parent authentication
            try:
                parent = Parent.objects.get(email=email, is_active=True)
                if parent.check_password(password):
                    logger.debug(f"Authenticated parent: {parent.email}")
                    # Manually generate tokens for parent
                    refresh = RefreshToken()
                    refresh['parent_id'] = parent.id
                    refresh['email'] = parent.email
                    refresh['user_type'] = 'parent'
                    refresh['first_name'] = parent.first_name
                    refresh['last_name'] = parent.last_name
                    
                    return {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                        'user': {
                            'id': parent.id,
                            'first_name': parent.first_name,
                            'last_name': parent.last_name,
                            'name': parent.get_full_name(),
                            'email': parent.email,
                            'role': 'parent',
                            'system_id': f"PAR-{parent.id:03d}"
                        }
                    }
            except Parent.DoesNotExist:
                pass

            logger.debug(f"Authentication failed for email: {email}")
            raise AuthenticationFailed('Invalid credentials')

        logger.debug(f"Authenticated user: {user}")
        data = super().validate(attrs)
        # Serialize using the UserSerializer
        serialized_user = UserSerializer(user).data
        
        # Proper RBAC: Check role using utility function
        serialized_user['role'] = get_user_role(user)
            
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
        # Parents don't have notifications yet in this schema
        if hasattr(self.request.user, '_is_parent'):
            return Notification.objects.none()
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


from rest_framework.decorators import api_view, permission_classes

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats(request):
    """Get dashboard statistics for admin"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    from cbc.models import LearningArea, Strand
    stats = {
        'totalLearningAreas': LearningArea.objects.count(),
        'activeLearningAreas': LearningArea.objects.filter(is_active=True).count(),
        'totalStrands': Strand.objects.count(),
        'totalTeachers': Teacher.objects.count(),
        'totalStudents': Student.objects.count(),
    }
    
    return Response(stats)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users(request):
    """List all users (teachers and students) for admin management"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    # AUTH_USER_MODEL is students.Student, so Student objects ARE the base users.
    # Teacher has a OneToOneField named 'user' pointing to AUTH_USER_MODEL (Student).
    teachers = Teacher.objects.all().select_related('user')
    
    # We query all students, but we'll categorize them.
    # We don't use select_related('user') because Student IS the user model.
    all_base_users = Student.objects.all()
    
    data = []
    processed_user_ids = set()
    
    # Process Teachers first to ensure they get the correct role
    for teacher in teachers:
        processed_user_ids.add(teacher.user.id)
        data.append({
            'id': f"teacher_{teacher.id}",
            'db_id': teacher.id,
            'name': f"{teacher.user.first_name} {teacher.user.last_name}".strip() or teacher.user.email,
            'email': teacher.user.email,
            'role': 'teacher',
            'username': teacher.user.username,
            'date_joined': teacher.date_joined,
            'is_active': teacher.user.is_active,
            'system_id': teacher.teacher_id,
        })
        
    # Process remaining users
    for user in all_base_users:
        if user.id in processed_user_ids:
            continue
            
        role = 'student'
        if user.is_superuser:
            role = 'admin'
        
        data.append({
            'id': f"{role}_{user.id}",
            'db_id': user.id,
            'name': f"{user.first_name} {user.last_name}".strip() or user.email,
            'email': user.email,
            'role': role,
            'username': user.username,
            'date_joined': user.date_joined,
            'is_active': user.is_active,
            'system_id': user.student_id if hasattr(user, 'student_id') else None,
            'grade_level': user.grade_level.name if hasattr(user, 'grade_level') and user.grade_level else None,
        })

    # Process Parents
    from students.models import Parent
    parents = Parent.objects.all()
    for parent in parents:
        data.append({
            'id': f"parent_{parent.id}",
            'db_id': parent.id,
            'name': parent.get_full_name() or parent.email,
            'email': parent.email,
            'role': 'parent',
            'username': parent.email, # Parents use email as username
            'date_joined': parent.created_at,
            'is_active': parent.is_active,
            'system_id': 'PAR-' + str(parent.id).zfill(3),
            'children_count': parent.children.count(),
            'child_ids': list(parent.children.values_list('id', flat=True))
        })
            
    return Response(data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_add_user(request):
    """Admin-only endpoint to create Teachers or Students and send welcome emails"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    role = request.data.get('role')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    
    if not all([role, email, first_name, last_name, password]):
        return Response({'error': 'All fields are required'}, status=400)
        
    if role == 'parent':
        from students.models import Parent
        if Parent.objects.filter(email=email).exists():
            return Response({'error': 'Parent with this email already exists'}, status=400)
        
        parent = Parent.objects.create(
            email=email,
            first_name=first_name,
            last_name=last_name,
            phone=request.data.get('phone', ''),
            address=request.data.get('address', '')
        )
        parent.set_password(password)
        
        student_ids = request.data.get('student_ids', [])
        if student_ids:
            if isinstance(student_ids, str):
                ids = [int(i.strip()) for i in student_ids.split(',') if i.strip().isdigit()]
            else:
                ids = [int(i) for i in student_ids if str(i).isdigit()]
            students = Student.objects.filter(id__in=ids)
            parent.children.set(students)
        
        parent.save()
        
        # Send welcome email
        send_welcome_email(
            user_email=email,
            first_name=first_name,
            password=password,
            role=role
        )
        
        return Response({
            'message': 'Parent registered successfully',
            'user': {
                'id': parent.id,
                'email': parent.email,
                'role': 'parent'
            }
        }, status=201)

    serializer = DynamicUserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        # Send welcome email using the plain password from request
        send_welcome_email(
            user_email=email,
            first_name=first_name,
            password=password,
            role=role
        )
        
        return Response({
            'message': f'{role.capitalize()} created successfully and welcome email sent.',
            'user': UserSerializer(user).data
        }, status=201)
    
    return Response(serializer.errors, status=400)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def admin_update_user(request, user_id):
    """Admin-only endpoint to update user details across all roles"""
    if not request.user.is_superuser:
        return Response({'error': 'Permission denied'}, status=403)
    
    role_parts = user_id.split('_')
    if len(role_parts) < 2:
        return Response({'error': 'Invalid user ID format'}, status=400)
    
    role, pk = role_parts[0], role_parts[1]
    
    try:
        if role == 'teacher':
            teacher = Teacher.objects.get(id=pk)
            user = teacher.user
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.email = request.data.get('email', user.email)
            user.save()
            teacher.phone = request.data.get('phone', teacher.phone)
            teacher.address = request.data.get('address', teacher.address)
            teacher.specialization = request.data.get('specialization', teacher.specialization)
            teacher.save()
            return Response({'message': 'Teacher updated successfully'})
            
        elif role == 'student' or role == 'admin':
            student = Student.objects.get(id=pk)
            student.first_name = request.data.get('first_name', student.first_name)
            student.last_name = request.data.get('last_name', student.last_name)
            student.email = request.data.get('email', student.email)
            student.phone = request.data.get('phone', student.phone)
            student.address = request.data.get('address', student.address)
            if role == 'student':
                grade_str = request.data.get('grade')
                if grade_str is not None:
                    student.grade = grade_str
                    # Update grade_level ForeignKey robustly
                    import re
                    from cbc.models import GradeLevel
                    match = re.search(r'(\d+)', str(grade_str))
                    grade_level = None
                    if match:
                        grade_level = GradeLevel.objects.filter(name=f"Grade {match.group(1)}").first()
                    if not grade_level:
                        grade_level = GradeLevel.objects.filter(name__icontains=grade_str).first()
                    student.grade_level = grade_level
            student.save()
            return Response({'message': f'{role.capitalize()} updated successfully'})
            
        elif role == 'parent':
            from students.models import Parent
            parent = Parent.objects.get(id=pk)
            parent.first_name = request.data.get('first_name', parent.first_name)
            parent.last_name = request.data.get('last_name', parent.last_name)
            parent.email = request.data.get('email', parent.email)
            parent.phone = request.data.get('phone', parent.phone)
            parent.address = request.data.get('address', parent.address)
            
            student_ids = request.data.get('student_ids')
            if student_ids is not None:
                if isinstance(student_ids, str):
                    ids = [int(i.strip()) for i in student_ids.split(',') if i.strip().isdigit()]
                else:
                    ids = [int(i) for i in student_ids if str(i).isdigit()]
                students = Student.objects.filter(id__in=ids)
                parent.children.set(students)
                
            parent.save()
            return Response({'message': 'Parent updated successfully'})
            
    except Exception as e:
        return Response({'error': str(e)}, status=400)
    
    return Response({'error': 'Invalid role'}, status=400)

@api_view(['GET'])
@permission_classes([AllowAny])
def active_term(request):
    """Detect current active term based on date"""
    current_year = AcademicYear.objects.filter(is_current=True).first()
    if not current_year:
        return Response({'detail': 'No current academic year defined'}, status=404)
    
    term = current_year.get_active_term()
    if not term:
        return Response({
            'year': AcademicYearSerializer(current_year).data,
            'term': None,
            'detail': 'Between terms'
        })
    
    return Response({
        'year': AcademicYearSerializer(current_year).data,
        'term': AcademicTermSerializer(term).data
    })

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all()
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAuthenticated]

class AcademicTermViewSet(viewsets.ModelViewSet):
    queryset = AcademicTerm.objects.all()
    serializer_class = AcademicTermSerializer
    permission_classes = [IsAuthenticated]
