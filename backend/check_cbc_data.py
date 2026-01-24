from cbc.models import GradeLevel, LearningArea, Strand, SubStrand, LearningOutcome

def check_data():
    math = LearningArea.objects.filter(name__icontains='Mathematics', grade_level__name='Grade 4').first()
    if not math:
        # Try without the Grade 4 filter just in case
        math = LearningArea.objects.filter(name__icontains='Mathematics').first()
        if not math:
            print("No Mathematics Learning Area found at all.")
            return
        else:
            print(f"Mathematics found but for Grade: {math.grade_level.name}")
            return

    print(f"Found Learning Area: {math.name} (ID: {math.id})")
    strands = math.strands.all()
    print(f"Strands Count: {strands.count()}")
    
    for strand in strands:
        print(f"  - Strand: {strand.name} (ID: {strand.id})")
        substrands = strand.sub_strands.all()
        print(f"    Sub-strands Count: {substrands.count()}")
        for sub in substrands:
            print(f"      - Sub-strand: {sub.name} (ID: {sub.id})")
            outcomes = sub.learning_outcomes.all()
            print(f"        Learning Outcomes Count: {outcomes.count()}")

if __name__ == "__main__":
    check_data()
