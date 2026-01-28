
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management.settings')
django.setup()

from cbc.models import GradeLevel, LearningArea

def populate_learning_areas():
    curriculum_map = {
        'Grades 1-3': [
            ('Mathematics', 'MATH'),
            ('English Language', 'ENG'),
            ('Kiswahili Language', 'KIS'),
            ('Environmental Activities', 'ENV'),
            ('Creative Activities', 'CREA'),
            ('Religious Education', 'RE'),
        ],
        'Grades 4-6': [
            ('English', 'ENG'),
            ('Mathematics', 'MATH'),
            ('Kiswahili', 'KIS'),
            ('Religious Education', 'RE'),
            ('Agriculture and Nutrition', 'AGRI-NUTR'),
            ('Social Studies', 'SOC'),
            ('Creative Arts', 'CREA-ARTS'),
            ('Science and Technology', 'SCI-TECH'),
        ],
        'Grades 7-9': [
            ('Social Studies', 'SOC'),
            ('Agriculture and Nutrition', 'AGRI-NUTR'),
            ('Integrated Science', 'INT-SCI'),
            ('Pre-Technical Studies', 'PRE-TECH'),
            ('Creative Arts and Sports', 'ARTS-SPORTS'),
            ('Mathematics', 'MATH'),
            ('English', 'ENG'),
            ('Kiswahili', 'KIS'),
            ('Religious Education', 'RE'),
        ],
        'Grades 10-12': [
            ('Pure Sciences', 'PURE-SCI'),
            ('Applied Sciences', 'APP-SCI'),
            ('Arts and Sports', 'ARTS-SPORTS'),
        ]
    }

    grade_groups = {
        'Grades 1-3': [1, 2, 3],
        'Grades 4-6': [4, 5, 6],
        'Grades 7-9': [7, 8, 9],
        'Grades 10-12': [10, 11, 12]
    }

    for group_name, area_list in curriculum_map.items():
        grades = grade_groups[group_name]
        for grade_num in grades:
            grade_name = f'Grade {grade_num}'
            try:
                grade_level = GradeLevel.objects.get(name=grade_name)
                print(f"Processing {grade_name}...")
                for name, base_code in area_list:
                    code = f"{base_code}-G{grade_num}"
                    area, created = LearningArea.objects.get_or_create(
                        name=name,
                        grade_level=grade_level,
                        defaults={'code': code, 'is_active': True}
                    )
                    if created:
                        print(f"  Created Learning Area: {name} ({code})")
                    else:
                        print(f"  Skipped (already exists): {name}")
            except GradeLevel.DoesNotExist:
                print(f"Error: {grade_name} not found.")

if __name__ == "__main__":
    populate_learning_areas()
