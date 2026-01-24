"""
CBC Report Generation Service
Generates comprehensive student progress reports
"""

from django.db.models import Count, Q
from datetime import datetime
from students.models import Student, Parent
from cbc.models import CompetencyAssessment, LearningArea, LearningOutcome


class CBCReportGenerator:
    """
    Service class for generating CBC progress reports
    """
    
    def __init__(self, student_id, learning_area_id=None):
        self.student = Student.objects.get(id=student_id)
        self.learning_area_id = learning_area_id
    
    def generate_report_data(self):
        """
        Generate comprehensive report data for a student
        """
        # Get all assessments for the student
        assessments = CompetencyAssessment.objects.filter(student=self.student)
        
        if self.learning_area_id:
            assessments = assessments.filter(
                learning_outcome__sub_strand__strand__learning_area_id=self.learning_area_id
            )
        
        # Calculate overall statistics
        total_assessments = assessments.count()
        competency_breakdown = assessments.values('competency_level').annotate(
            count=Count('id')
        )
        
        breakdown_dict = {item['competency_level']: item['count'] for item in competency_breakdown}
        
        # Get learning areas
        if self.learning_area_id:
            learning_areas = LearningArea.objects.filter(id=self.learning_area_id)
        else:
            learning_areas = LearningArea.objects.filter(
                students=self.student
            ).distinct()
        
        # Build detailed progress by learning area
        areas_progress = []
        for area in learning_areas:
            area_assessments = assessments.filter(
                learning_outcome__sub_strand__strand__learning_area=area
            )
            
            area_breakdown = area_assessments.values('competency_level').annotate(
                count=Count('id')
            )
            
            strands_data = []
            for strand in area.strands.all():
                strand_assessments = area_assessments.filter(
                    learning_outcome__sub_strand__strand=strand
                )
                
                sub_strands_data = []
                for sub_strand in strand.sub_strands.all():
                    outcomes_data = []
                    for outcome in sub_strand.learning_outcomes.all():
                        assessment = strand_assessments.filter(
                            learning_outcome=outcome
                        ).order_by('-assessment_date').first()
                        
                        outcomes_data.append({
                            'outcome': outcome.description,
                            'code': outcome.code,
                            'competency_level': assessment.competency_level if assessment else None,
                            'assessment_date': assessment.assessment_date if assessment else None,
                            'teacher_comment': assessment.teacher_comment if assessment else None
                        })
                    
                    sub_strands_data.append({
                        'name': sub_strand.name,
                        'outcomes': outcomes_data
                    })
                
                strands_data.append({
                    'name': strand.name,
                    'sub_strands': sub_strands_data
                })
            
            areas_progress.append({
                'name': area.name,
                'code': area.code,
                'strands': strands_data,
                'total_assessments': area_assessments.count(),
                'breakdown': {item['competency_level']: item['count'] for item in area_breakdown}
            })
        
        return {
            'student': {
                'name': self.student.get_full_name(),
                'student_id': self.student.student_id,
                'grade': self.student.grade,
                'email': self.student.email
            },
            'report_date': datetime.now().strftime('%Y-%m-%d'),
            'overall_stats': {
                'total_assessments': total_assessments,
                'breakdown': breakdown_dict
            },
            'learning_areas': areas_progress
        }
    
    def generate_summary_text(self):
        """
        Generate a text summary of student progress
        """
        data = self.generate_report_data()
        stats = data['overall_stats']
        
        summary = f"CBC Progress Report for {data['student']['name']}\n"
        summary += f"Student ID: {data['student']['student_id']}\n"
        summary += f"Grade: {data['student']['grade']}\n"
        summary += f"Report Date: {data['report_date']}\n\n"
        
        summary += f"Overall Progress:\n"
        summary += f"Total Assessments: {stats['total_assessments']}\n"
        summary += f"Exceeding Expectations (EE): {stats['breakdown'].get('EE', 0)}\n"
        summary += f"Meeting Expectations (ME): {stats['breakdown'].get('ME', 0)}\n"
        summary += f"Approaching Expectations (AE): {stats['breakdown'].get('AE', 0)}\n"
        summary += f"Below Expectations (BE): {stats['breakdown'].get('BE', 0)}\n\n"
        
        for area in data['learning_areas']:
            summary += f"\n{area['name']}:\n"
            summary += f"  Assessments: {area['total_assessments']}\n"
            for strand in area['strands']:
                summary += f"  - {strand['name']}\n"
        
        return summary


def generate_student_report(student_id, learning_area_id=None):
    """
    Helper function to generate a student report
    """
    generator = CBCReportGenerator(student_id, learning_area_id)
    return generator.generate_report_data()


def generate_class_summary(learning_area_id):
    """
    Generate summary statistics for an entire class/learning area
    """
    learning_area = LearningArea.objects.get(id=learning_area_id)
    students = learning_area.students.all()
    
    class_data = {
        'learning_area': {
            'name': learning_area.name,
            'code': learning_area.code,
            'grade_level': learning_area.grade_level.name
        },
        'total_students': students.count(),
        'students_progress': []
    }
    
    for student in students:
        assessments = CompetencyAssessment.objects.filter(
            student=student,
            learning_outcome__sub_strand__strand__learning_area=learning_area
        )
        
        breakdown = assessments.values('competency_level').annotate(count=Count('id'))
        breakdown_dict = {item['competency_level']: item['count'] for item in breakdown}
        
        class_data['students_progress'].append({
            'student_name': student.get_full_name(),
            'student_id': student.student_id,
            'total_assessments': assessments.count(),
            'breakdown': breakdown_dict
        })
    
    return class_data
