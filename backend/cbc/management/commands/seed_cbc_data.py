"""
Django management command to seed CBC data for Grade 4 Mathematics
Based on official KICD learning outcomes
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from cbc.models import GradeLevel, LearningArea, Strand, SubStrand, LearningOutcome
from teachers.models import Teacher


class Command(BaseCommand):
    help = 'Seeds CBC data for Grade 4 Mathematics with official KICD learning outcomes'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🌱 Starting CBC data seeding...'))
        
        with transaction.atomic():
            # Create Grade 4 (CBC)
            grade_4, created = GradeLevel.objects.get_or_create(
                name='Grade 4',
                defaults={
                    'curriculum_type': 'CBC',
                    'order': 4,
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Created {grade_4}'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  {grade_4} already exists'))

            # Get or create a default teacher (you can modify this later)
            teacher = Teacher.objects.first()
            if not teacher:
                self.stdout.write(self.style.ERROR('❌ No teachers found. Please create a teacher first.'))
                return

            # Create Mathematics Learning Area
            math_area, created = LearningArea.objects.get_or_create(
                code='MATH-G4',
                defaults={
                    'name': 'Mathematics',
                    'grade_level': grade_4,
                    'teacher': teacher,
                    'description': 'Grade 4 Mathematics - Competency-Based Curriculum',
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'✅ Created Learning Area: {math_area}'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  Learning Area already exists: {math_area}'))

            # Strand 1: Numbers
            numbers_strand, _ = Strand.objects.get_or_create(
                code='MATH-G4-NUM',
                defaults={
                    'learning_area': math_area,
                    'name': 'Numbers',
                    'description': 'Number concepts and operations',
                    'order': 1
                }
            )
            self.stdout.write(self.style.SUCCESS(f'  📚 Strand: {numbers_strand.name}'))

            # Sub-Strand 1.1: Whole Numbers
            whole_numbers, _ = SubStrand.objects.get_or_create(
                code='MATH-G4-NUM-WHOLE',
                defaults={
                    'strand': numbers_strand,
                    'name': 'Whole Numbers',
                    'description': 'Understanding and working with whole numbers up to 10,000',
                    'order': 1
                }
            )
            
            # Learning Outcomes for Whole Numbers
            whole_number_outcomes = [
                ('MATH-G4-NUM-WHOLE-01', 'Identify place value of digits up to ten thousands (10,000)', 1),
                ('MATH-G4-NUM-WHOLE-02', 'Read and write numbers in symbols up to 10,000', 2),
                ('MATH-G4-NUM-WHOLE-03', 'Read and write numbers in words up to 10,000', 3),
                ('MATH-G4-NUM-WHOLE-04', 'Round off numbers to the nearest ten and hundred', 4),
                ('MATH-G4-NUM-WHOLE-05', 'Identify and use Roman numerals up to X', 5),
                ('MATH-G4-NUM-WHOLE-06', 'Appreciate the importance of whole numbers in daily life', 6),
            ]
            
            for code, description, order in whole_number_outcomes:
                LearningOutcome.objects.get_or_create(
                    code=code,
                    defaults={
                        'sub_strand': whole_numbers,
                        'description': description,
                        'order': order
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'    ✓ Sub-Strand: {whole_numbers.name} ({len(whole_number_outcomes)} outcomes)'))

            # Sub-Strand 1.2: Addition
            addition, _ = SubStrand.objects.get_or_create(
                code='MATH-G4-NUM-ADD',
                defaults={
                    'strand': numbers_strand,
                    'name': 'Addition',
                    'description': 'Addition of numbers up to 4 digits',
                    'order': 2
                }
            )
            
            addition_outcomes = [
                ('MATH-G4-NUM-ADD-01', 'Work out addition of up to 4-digit numbers with regrouping', 1),
                ('MATH-G4-NUM-ADD-02', 'Estimate sums of numbers by rounding off to the nearest ten and hundred', 2),
                ('MATH-G4-NUM-ADD-03', 'Solve real-life problems involving addition of quantities up to 10,000', 3),
                ('MATH-G4-NUM-ADD-04', 'Appreciate the importance of addition in daily activities', 4),
            ]
            
            for code, description, order in addition_outcomes:
                LearningOutcome.objects.get_or_create(
                    code=code,
                    defaults={
                        'sub_strand': addition,
                        'description': description,
                        'order': order
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'    ✓ Sub-Strand: {addition.name} ({len(addition_outcomes)} outcomes)'))

            # Sub-Strand 1.3: Subtraction
            subtraction, _ = SubStrand.objects.get_or_create(
                code='MATH-G4-NUM-SUB',
                defaults={
                    'strand': numbers_strand,
                    'name': 'Subtraction',
                    'description': 'Subtraction of numbers up to 4 digits',
                    'order': 3
                }
            )
            
            subtraction_outcomes = [
                ('MATH-G4-NUM-SUB-01', 'Subtract numbers up to 4-digits with borrowing/regrouping', 1),
                ('MATH-G4-NUM-SUB-02', 'Estimate differences of numbers by rounding off', 2),
                ('MATH-G4-NUM-SUB-03', 'Solve real-life word problems involving subtraction', 3),
                ('MATH-G4-NUM-SUB-04', 'Appreciate the role of subtraction in daily life', 4),
            ]
            
            for code, description, order in subtraction_outcomes:
                LearningOutcome.objects.get_or_create(
                    code=code,
                    defaults={
                        'sub_strand': subtraction,
                        'description': description,
                        'order': order
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'    ✓ Sub-Strand: {subtraction.name} ({len(subtraction_outcomes)} outcomes)'))

            # Sub-Strand 1.4: Fractions
            fractions, _ = SubStrand.objects.get_or_create(
                code='MATH-G4-NUM-FRAC',
                defaults={
                    'strand': numbers_strand,
                    'name': 'Fractions',
                    'description': 'Understanding and working with fractions',
                    'order': 4
                }
            )
            
            fraction_outcomes = [
                ('MATH-G4-NUM-FRAC-01', 'Identify equivalent fractions', 1),
                ('MATH-G4-NUM-FRAC-02', 'Compare and order fractions', 2),
                ('MATH-G4-NUM-FRAC-03', 'Add fractions with like denominators', 3),
                ('MATH-G4-NUM-FRAC-04', 'Subtract fractions with like denominators', 4),
                ('MATH-G4-NUM-FRAC-05', 'Solve real-life problems involving fractions', 5),
                ('MATH-G4-NUM-FRAC-06', 'Appreciate the use of fractions in daily activities', 6),
            ]
            
            for code, description, order in fraction_outcomes:
                LearningOutcome.objects.get_or_create(
                    code=code,
                    defaults={
                        'sub_strand': fractions,
                        'description': description,
                        'order': order
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'    ✓ Sub-Strand: {fractions.name} ({len(fraction_outcomes)} outcomes)'))

            # Strand 2: Measurement
            measurement_strand, _ = Strand.objects.get_or_create(
                code='MATH-G4-MEAS',
                defaults={
                    'learning_area': math_area,
                    'name': 'Measurement',
                    'description': 'Measuring length, mass, capacity, and time',
                    'order': 2
                }
            )
            self.stdout.write(self.style.SUCCESS(f'  📚 Strand: {measurement_strand.name}'))

            # Sub-Strand 2.1: Length
            length, _ = SubStrand.objects.get_or_create(
                code='MATH-G4-MEAS-LENGTH',
                defaults={
                    'strand': measurement_strand,
                    'name': 'Length',
                    'description': 'Measuring and converting units of length',
                    'order': 1
                }
            )
            
            length_outcomes = [
                ('MATH-G4-MEAS-LENGTH-01', 'Estimate and measure length using standard units (mm, cm, m, km)', 1),
                ('MATH-G4-MEAS-LENGTH-02', 'Convert units of length', 2),
                ('MATH-G4-MEAS-LENGTH-03', 'Calculate perimeter of regular shapes', 3),
                ('MATH-G4-MEAS-LENGTH-04', 'Solve problems involving length and perimeter', 4),
                ('MATH-G4-MEAS-LENGTH-05', 'Appreciate the importance of measuring length', 5),
            ]
            
            for code, description, order in length_outcomes:
                LearningOutcome.objects.get_or_create(
                    code=code,
                    defaults={
                        'sub_strand': length,
                        'description': description,
                        'order': order
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'    ✓ Sub-Strand: {length.name} ({len(length_outcomes)} outcomes)'))

            # Sub-Strand 2.2: Time
            time, _ = SubStrand.objects.get_or_create(
                code='MATH-G4-MEAS-TIME',
                defaults={
                    'strand': measurement_strand,
                    'name': 'Time',
                    'description': 'Telling time and calculating duration',
                    'order': 2
                }
            )
            
            time_outcomes = [
                ('MATH-G4-MEAS-TIME-01', 'Tell time using 12-hour and 24-hour clocks', 1),
                ('MATH-G4-MEAS-TIME-02', 'Calculate duration of time', 2),
                ('MATH-G4-MEAS-TIME-03', 'Read and interpret calendars', 3),
                ('MATH-G4-MEAS-TIME-04', 'Solve problems involving time', 4),
                ('MATH-G4-MEAS-TIME-05', 'Appreciate the importance of time management', 5),
            ]
            
            for code, description, order in time_outcomes:
                LearningOutcome.objects.get_or_create(
                    code=code,
                    defaults={
                        'sub_strand': time,
                        'description': description,
                        'order': order
                    }
                )
            self.stdout.write(self.style.SUCCESS(f'    ✓ Sub-Strand: {time.name} ({len(time_outcomes)} outcomes)'))

            # Summary
            total_outcomes = LearningOutcome.objects.filter(
                sub_strand__strand__learning_area=math_area
            ).count()
            
            self.stdout.write(self.style.SUCCESS('\n' + '='*60))
            self.stdout.write(self.style.SUCCESS('✅ CBC Data Seeding Complete!'))
            self.stdout.write(self.style.SUCCESS('='*60))
            self.stdout.write(self.style.SUCCESS(f'📊 Summary:'))
            self.stdout.write(self.style.SUCCESS(f'  • Grade Level: {grade_4}'))
            self.stdout.write(self.style.SUCCESS(f'  • Learning Area: {math_area.name}'))
            self.stdout.write(self.style.SUCCESS(f'  • Strands: 2'))
            self.stdout.write(self.style.SUCCESS(f'  • Sub-Strands: 6'))
            self.stdout.write(self.style.SUCCESS(f'  • Learning Outcomes: {total_outcomes}'))
            self.stdout.write(self.style.SUCCESS('='*60))
