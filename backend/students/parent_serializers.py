"""
Serializers for Parent model and authentication
"""

from rest_framework import serializers
from .models import Parent, Student


class ParentRegistrationSerializer(serializers.Serializer):
    """Serializer for parent registration"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=50)
    last_name = serializers.CharField(max_length=50)
    phone = serializers.CharField(max_length=15)
    address = serializers.CharField(required=False, allow_blank=True)
    
    def validate_email(self, value):
        if Parent.objects.filter(email=value).exists():
            raise serializers.ValidationError("A parent with this email already exists.")
        return value
    
    def create(self, validated_data):
        password = validated_data.pop('password')
        parent = Parent.objects.create(**validated_data)
        parent.set_password(password)
        parent.save()
        return parent


class ParentLoginSerializer(serializers.Serializer):
    """Serializer for parent login"""
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)


class ChildSerializer(serializers.ModelSerializer):
    """Lightweight serializer for student (child) info"""
    class Meta:
        model = Student
        fields = ['id', 'student_id', 'first_name', 'last_name', 'email', 'grade', 'date_of_birth']
        read_only_fields = fields


class ParentSerializer(serializers.ModelSerializer):
    """Serializer for Parent model"""
    children = ChildSerializer(many=True, read_only=True)
    children_count = serializers.IntegerField(source='get_children_count', read_only=True)
    
    class Meta:
        model = Parent
        fields = [
            'id', 'email', 'first_name', 'last_name', 'phone', 'address',
            'children', 'children_count', 'is_active', 'email_verified',
            'created_at', 'last_login'
        ]
        read_only_fields = ['id', 'created_at', 'last_login', 'is_active', 'email_verified']


class ParentProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating parent profile"""
    class Meta:
        model = Parent
        fields = ['first_name', 'last_name', 'phone', 'address']


class AddChildSerializer(serializers.Serializer):
    """Serializer for adding a child to parent account"""
    student_id = serializers.CharField()
    
    def validate_student_id(self, value):
        try:
            Student.objects.get(student_id=value)
        except Student.DoesNotExist:
            raise serializers.ValidationError("Student with this ID does not exist.")
        return value
