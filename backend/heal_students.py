
import os
import django
import re

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management.settings')
django.setup()

from students.models import Student
from cbc.models import GradeLevel

def heal_student_data():
    students = Student.objects.filter(is_superuser=False)
    print(f"Checking {students.count()} students for synchronization...")

    for student in students:
        if not student.grade:
            print(f"  Skipping {student.get_full_name()} (No grade data)")
            continue

        # Extract digit
        match = re.search(r'(\d+)', str(student.grade))
        if match:
            target_name = f"Grade {match.group(1)}"
            grade_level = GradeLevel.objects.filter(name=target_name).first()
            
            if grade_level:
                # Standardize the grade string as well
                old_grade = student.grade
                student.grade = target_name
                student.grade_level = grade_level
                student.save()
                print(f"  Synced {student.get_full_name()}: '{old_grade}' -> '{target_name}' (Level Linked)")
            else:
                print(f"  Warning: No GradeLevel found for '{target_name}' (Student: {student.get_full_name()})")
        else:
            print(f"  Could not parse grade '{student.grade}' for student {student.get_full_name()}")

if __name__ == "__main__":
    heal_student_data()
