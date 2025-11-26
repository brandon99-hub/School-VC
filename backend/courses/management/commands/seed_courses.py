from django.core.management.base import BaseCommand
from courses.models import Course
from teachers.models import Teacher
from students.models import Student
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Seeds the database with sample courses'

    def handle(self, *args, **options):
        # Create or get teacher user
        teacher_user, created = Student.objects.get_or_create(
            username='teacher1',
            defaults={
                'email': 'teacher1@school.com',
                'first_name': 'John',
                'last_name': 'Doe',
                'is_staff': True,
                'is_active': True
            }
        )
        if created:
            teacher_user.set_password('teacher123')
            teacher_user.save()

        # Get or create teacher
        teacher, created = Teacher.objects.get_or_create(
            user=teacher_user,
            defaults={
                'teacher_id': 'T001',
                'date_of_birth': date(1980, 1, 1),
                'qualification': 'Masters',
                'specialization': 'Computer Science',
                'experience_years': 5,
                'address': '123 Teacher Street',
                'phone': '1234567890'
            }
        )

        # Sample courses data
        courses_data = [
            {
                'name': 'Introduction to Computer Science',
                'code': 'CS101',
                'description': 'An introductory course covering basic programming concepts and problem-solving techniques.',
                'credits': 3,
                'semester': '1',
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=90),
                'is_active': True,
                'teacher': teacher
            },
            {
                'name': 'Data Structures and Algorithms',
                'code': 'CS201',
                'description': 'Study of fundamental data structures and algorithms used in computer science.',
                'credits': 4,
                'semester': '2',
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=90),
                'is_active': True,
                'teacher': teacher
            },
            {
                'name': 'Database Management Systems',
                'code': 'CS301',
                'description': 'Introduction to database design, implementation, and management.',
                'credits': 3,
                'semester': '3',
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=90),
                'is_active': True,
                'teacher': teacher
            },
            {
                'name': 'Web Development',
                'code': 'CS401',
                'description': 'Learn modern web development technologies and frameworks.',
                'credits': 4,
                'semester': '4',
                'start_date': date.today(),
                'end_date': date.today() + timedelta(days=90),
                'is_active': True,
                'teacher': teacher
            }
        ]

        # Create courses
        for course_data in courses_data:
            course, created = Course.objects.get_or_create(
                code=course_data['code'],
                defaults=course_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Successfully created course: {course.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Course already exists: {course.name}'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded courses')) 