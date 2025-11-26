from django.core.management.base import BaseCommand
from students.models import Student
from courses.models import Course, Attendance, Grade, Assignment, Schedule

class Command(BaseCommand):
    help = 'Cleans up all users except student ID 6 and their related data'

    def handle(self, *args, **options):
        try:
            # Keep track of what we're deleting
            deleted_students = 0
            deleted_courses = 0
            deleted_attendance = 0
            deleted_grades = 0
            deleted_assignments = 0
            deleted_schedules = 0

            # Get all students except ID 6
            students_to_delete = Student.objects.exclude(id=6)
            
            # Delete related data first
            for student in students_to_delete:
                # Delete attendance records
                attendance_count = Attendance.objects.filter(student=student).delete()[0]
                deleted_attendance += attendance_count

                # Delete grades
                grades_count = Grade.objects.filter(student=student).delete()[0]
                deleted_grades += grades_count

                # Remove student from courses
                for course in student.courses.all():
                    student.courses.remove(course)

            # Delete the students (this will also delete the associated User data since Student is a subclass)
            deleted_students = students_to_delete.delete()[0]

            # Delete any courses that have no students
            courses_to_delete = Course.objects.filter(enrolled_students__isnull=True)
            for course in courses_to_delete:
                # Delete related data
                assignments_count = Assignment.objects.filter(course=course).delete()[0]
                deleted_assignments += assignments_count

                schedules_count = Schedule.objects.filter(course=course).delete()[0]
                deleted_schedules += schedules_count

                course.delete()
                deleted_courses += 1

            self.stdout.write(self.style.SUCCESS(f'''
Successfully cleaned up the database:
- Deleted {deleted_students} students (including their user data)
- Deleted {deleted_courses} courses
- Deleted {deleted_attendance} attendance records
- Deleted {deleted_grades} grades
- Deleted {deleted_assignments} assignments
- Deleted {deleted_schedules} schedules
'''))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error occurred: {str(e)}')) 