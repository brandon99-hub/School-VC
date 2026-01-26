from rest_framework import serializers
from django.contrib.auth import get_user_model
from teachers.models import Teacher
from students.models import Student
from .models import Announcement, Notification

User = get_user_model()


class DynamicUserRegistrationSerializer(serializers.Serializer):
    # Common fields
    role = serializers.ChoiceField(choices=[('student', 'Student'), ('teacher', 'Teacher')], write_only=True)
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    # Student-specific fields
    student_id = serializers.CharField(required=False)
    date_of_birth = serializers.DateField(required=False)
    gender = serializers.ChoiceField(choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')], required=False)
    address = serializers.CharField(required=False)
    phone = serializers.CharField(required=False)
    grade = serializers.CharField(required=False)
    # Teacher-specific field
    teacher_id = serializers.CharField(required=False, write_only=True)

    def validate(self, attrs):
        role = attrs.get('role')
        if role == 'student' and not attrs.get('student_id'):
            raise serializers.ValidationError("Student ID is required for student registration.")
        if role == 'teacher' and not attrs.get('teacher_id'):
            raise serializers.ValidationError("Teacher ID is required for teacher registration.")
        return attrs

    def validate_student_id(self, value):
        if self.initial_data.get('role') == 'student':
            if Student.objects.filter(student_id=value).exists():
                raise serializers.ValidationError("A student with this Student ID already exists.")
        return value

    def create(self, validated_data):
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        if role == 'student':
            student_id = validated_data.pop('student_id')
            date_of_birth = validated_data.pop('date_of_birth', None)
            gender = validated_data.pop('gender', None)
            address = validated_data.pop('address', '')
            phone = validated_data.pop('phone', '')
            grade_str = validated_data.pop('grade', '')
            
            # Map grade string to GradeLevel object
            grade_level = None
            if grade_str:
                from cbc.models import GradeLevel
                # Try exact match or clean match (e.g. "Grade 4" -> "Grade 4")
                grade_level = GradeLevel.objects.filter(name__icontains=grade_str).first()

            student = Student.objects.create_user(
                student_id=student_id,
                password=password,
                email=validated_data.get('email'),
                first_name=validated_data.get('first_name'),
                last_name=validated_data.get('last_name'),
                date_of_birth=date_of_birth,
                gender=gender,
                address=address,
                phone=phone,
                grade=grade_str,
                grade_level=grade_level
            )
            return student
        elif role == 'teacher':
            teacher_id = validated_data.pop('teacher_id')
            # To set a unique username for teachers, append a suffix.
            unique_student_id = teacher_id + "_teacher"
            user = User.objects.create_user(
                student_id=unique_student_id,
                password=password,
                email=validated_data.get('email'),
                first_name=validated_data.get('first_name'),
                last_name=validated_data.get('last_name')
            )
            # Create the Teacher instance linked to this user.
            Teacher.objects.create(
                user=user,
                teacher_id=teacher_id,
                date_of_birth="2000-01-01",       # Default value; adjust as needed.
                qualification="Other",            # Default qualification.
                specialization="Not Provided",    # Default specialization.
                experience_years=0,               # Default experience.
                address="",
                phone=""
            )
            return user
        else:
            raise serializers.ValidationError("Invalid role provided.")


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id',
            'student_id',
            'email',
            'first_name',
            'last_name',
            'date_of_birth',
            'gender',
            'address',
            'phone',
            'grade',
            'grade_level',
            'is_superuser',
            'is_staff'
        ]


class UserRegistrationSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['student_id', 'password', 'email', 'first_name', 'last_name']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            student_id=validated_data['student_id'],
            password=validated_data['password'],
            email=validated_data.get('email'),
            first_name=validated_data.get('first_name'),
            last_name=validated_data.get('last_name')
        )
        return user


class TeacherSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = '__all__'

    def get_full_name(self, obj):
        # Return the full name from the linked user
        return f"{obj.user.first_name} {obj.user.last_name}"


class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = '__all__'


class AnnouncementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Announcement
        fields = '__all__'


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
