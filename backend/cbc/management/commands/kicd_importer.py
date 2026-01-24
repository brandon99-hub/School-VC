import json
import os
from django.core.management.base import BaseCommand
from cbc.models import GradeLevel, LearningArea, Strand, SubStrand, LearningOutcome

class Command(BaseCommand):
    help = 'Imports KICD curriculum data from a JSON file'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default='kicd_curriculum.json', help='Path to the JSON data file')

    def handle(self, *args, **options):
        file_path = options['file']
        
        if not os.path.exists(file_path):
            self.stdout.write(self.style.ERROR(f'File "{file_path}" does not exist.'))
            return

        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for grade_data in data:
            # Update or create GradeLevel
            grade_level, _ = GradeLevel.objects.update_or_create(
                name=grade_data['grade_level'],
                defaults={
                    'curriculum_type': grade_data['curriculum_type'],
                    'order': grade_data['order'],
                    'is_active': True
                }
            )
            self.stdout.write(self.style.SUCCESS(f'Processed Grade Level: {grade_level.name}'))

            for area_data in grade_data.get('learning_areas', []):
                # Update or create LearningArea
                learning_area, _ = LearningArea.objects.update_or_create(
                    code=area_data['code'],
                    defaults={
                        'name': area_data['name'],
                        'grade_level': grade_level,
                        'is_active': True
                    }
                )
                self.stdout.write(self.style.SUCCESS(f'  Processed Learning Area: {learning_area.name} ({learning_area.code})'))

                for strand_data in area_data.get('strands', []):
                    # Update or create Strand based on area and order to avoid unique constraint errors
                    strand, _ = Strand.objects.update_or_create(
                        learning_area=learning_area,
                        order=strand_data.get('order', 1),
                        defaults={
                            'name': strand_data['name'],
                            'code': strand_data['code']
                        }
                    )
                    self.stdout.write(self.style.SUCCESS(f'    Processed Strand: {strand.name}'))

                    for sub_strand_data in strand_data.get('sub_strands', []):
                        # Update or create SubStrand
                        sub_strand, _ = SubStrand.objects.update_or_create(
                            strand=strand,
                            order=sub_strand_data.get('order', 1),
                            defaults={
                                'name': sub_strand_data['name'],
                                'code': sub_strand_data['code']
                            }
                        )
                        self.stdout.write(self.style.SUCCESS(f'      Processed Sub-Strand: {sub_strand.name}'))

                        for outcome_data in sub_strand_data.get('outcomes', []):
                            # Update or create LearningOutcome
                            outcome, _ = LearningOutcome.objects.update_or_create(
                                sub_strand=sub_strand,
                                order=outcome_data.get('order', 1),
                                defaults={
                                    'description': outcome_data['description'],
                                    'code': outcome_data['code']
                                }
                            )
                            self.stdout.write(self.style.SUCCESS(f'        Processed Outcome: {outcome.code}'))

        self.stdout.write(self.style.SUCCESS('KICD Ingestion Complete!'))
