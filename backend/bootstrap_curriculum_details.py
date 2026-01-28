
import os
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_management.settings')
django.setup()

from cbc.models import GradeLevel, LearningArea, Strand, SubStrand, LearningOutcome

def bootstrap_strands():
    # Define common strands for major learning areas
    baseline_curriculum = {
        'Mathematics': [
            {
                'name': 'Numbers',
                'order': 1,
                'sub_strands': [
                    {'name': 'Whole Numbers', 'order': 1, 'outcome': 'Demonstrate understanding of numbers in real life context.'},
                    {'name': 'Fractions', 'order': 2, 'outcome': 'Apply the concept of fractions in daily activities.'}
                ]
            },
            {
                'name': 'Measurement',
                'order': 2,
                'sub_strands': [
                    {'name': 'Length & Mass', 'order': 1, 'outcome': 'Use standard units to measure and compare objects.'}
                ]
            }
        ],
        'English': [
            {
                'name': 'Listening and Speaking',
                'order': 1,
                'sub_strands': [
                    {'name': 'Dialogue & Presentation', 'order': 1, 'outcome': 'Communicate effectively and with confidence in various settings.'}
                ]
            },
            {
                'name': 'Reading',
                'order': 2,
                'sub_strands': [
                    {'name': 'Comprehension', 'order': 1, 'outcome': 'Read and interpret various texts for information and pleasure.'}
                ]
            }
        ],
        'Kiswahili': [
            {
                'name': 'Kusikiliza na Kuzungumza',
                'order': 1,
                'sub_strands': [
                    {'name': 'Mazungumzo', 'order': 1, 'outcome': 'Kuasiliana vyema katika miktadha mbalimbali.'}
                ]
            }
        ],
        'Mathematics Language': [ # For G1-3 names
            {
                'name': 'Numbers',
                'order': 1,
                'sub_strands': [
                    {'name': 'Whole Numbers', 'order': 1, 'outcome': 'Demonstrate understanding of numbers.'}
                ]
            }
        ]
    }

    # Normalize names to match our database names
    name_map = {
        'Mathematics': 'Mathematics',
        'English Language': 'English Language',
        'English': 'English',
        'Kiswahili Language': 'Kiswahili Language',
        'Kiswahili': 'Kiswahili'
    }

    learning_areas = LearningArea.objects.all()
    print(f"Bootstrapping {learning_areas.count()} areas...")

    for area in learning_areas:
        # Determine which baseline to use
        baseline_key = None
        for key in baseline_curriculum:
            if key in area.name:
                baseline_key = key
                break
        
        if not baseline_key:
            # Generic fallback for other subjects
            strands_to_add = [{
                'name': 'General Principles',
                'order': 1,
                'sub_strands': [{'name': 'Foundation Concepts', 'order': 1, 'outcome': f'Understand fundamental principles in {area.name}.'}]
            }]
        else:
            strands_to_add = baseline_curriculum[baseline_key]

        print(f"Processing {area.name} ({area.grade_level.name})...")
        for s_data in strands_to_add:
            # Check if a strand with this order already exists for this area
            existing_strand = Strand.objects.filter(learning_area=area, order=s_data['order']).first()
            if existing_strand:
                strand = existing_strand
                s_created = False
            else:
                s_code = f"{area.code}-{s_data['name'].upper().replace(' ', '-')[:10]}"
                strand, s_created = Strand.objects.get_or_create(
                    learning_area=area,
                    name=s_data['name'],
                    defaults={'order': s_data['order'], 'code': s_code}
                )
            
            for sub_data in s_data['sub_strands']:
                # Check if a sub-strand with this order already exists for this strand
                existing_sub = SubStrand.objects.filter(strand=strand, order=sub_data['order']).first()
                if existing_sub:
                    sub = existing_sub
                    sub_created = False
                else:
                    sub_code = f"{strand.code}-{sub_data['name'].upper().replace(' ', '-')[:10]}"
                    sub, sub_created = SubStrand.objects.get_or_create(
                        strand=strand,
                        name=sub_data['name'],
                        defaults={'order': sub_data['order'], 'code': sub_code}
                    )
                
                # Check if a learning outcome already exists for this sub-strand
                existing_outcome = LearningOutcome.objects.filter(sub_strand=sub).first()
                if not existing_outcome:
                    o_code = f"{sub.code}-01"
                    LearningOutcome.objects.get_or_create(
                        sub_strand=sub,
                        code=o_code,
                        defaults={'description': sub_data['outcome'], 'order': 1}
                    )
    
    print("Bootstrap complete!")

if __name__ == "__main__":
    bootstrap_strands()
