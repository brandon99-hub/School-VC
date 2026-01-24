"""
Views for Parent authentication and management
"""

from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.shortcuts import get_object_or_404

from .models import Parent, Student
from .parent_serializers import (
    ParentRegistrationSerializer,
    ParentLoginSerializer,
    ParentSerializer,
    ParentProfileUpdateSerializer,
    AddChildSerializer
)


@api_view(['POST'])
@permission_classes([AllowAny])
def parent_register(request):
    """
    Register a new parent account
    POST /api/parents/register/
    """
    serializer = ParentRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        parent = serializer.save()
        
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
