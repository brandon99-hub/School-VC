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
        
        # Get Quiz Submissions that are auto-graded or graded
        from courses.models import QuizSubmission
        from django.db.models import Max
        
        # Get all attempts
        all_quiz_subs = QuizSubmission.objects.filter(student=self.student, status__in=['auto_graded', 'graded'])
        
        # Get only the highest score per quiz
        best_attempts_ids = []
        quiz_ids = all_quiz_subs.values_list('quiz_id', flat=True).distinct()
        for q_id in quiz_ids:
            best = all_quiz_subs.filter(quiz_id=q_id).order_by('-score', '-submitted_at').first()
            if best:
                best_attempts_ids.append(best.id)
                
        quiz_submissions = all_quiz_subs.filter(id__in=best_attempts_ids)
        
        if self.learning_area_id:
            assessments = assessments.filter(
                learning_outcome__sub_strand__strand__learning_area_id=self.learning_area_id
            )
            quiz_submissions = quiz_submissions.filter(
                quiz__learning_outcome__sub_strand__strand__learning_area_id=self.learning_area_id
            )
        
        # Helper to map percentage to competency level
        def map_percentage(score, total):
            if not total: return None
            p = (float(score) / float(total)) * 100
            if p >= 80: return 'EE'
            if p >= 60: return 'ME'
            if p >= 40: return 'AE'
            return 'BE'

        # 1. Map outcomes to their latest achievement level (Outcome-Centric Logic)
        outcome_achievements = {}
        
        # Process Direct Assessments
        for asmt in assessments.select_related('learning_outcome'):
            outcome_id = asmt.learning_outcome_id
            if not outcome_id: continue
            
            if outcome_id not in outcome_achievements or asmt.assessment_date >= outcome_achievements[outcome_id]['date']:
                outcome_achievements[outcome_id] = {
                    'level': asmt.competency_level,
                    'date': asmt.assessment_date
                }
        
        # Process Quiz Submissions
        for qs in quiz_submissions.select_related('quiz'):
            # Fetch outcomes linked to this quiz
            outcome_ids = list(qs.quiz.tested_outcomes.values_list('id', flat=True))
            if qs.quiz.learning_outcome_id:
                outcome_ids.append(qs.quiz.learning_outcome_id)
                
            lvl = map_percentage(qs.score, qs.quiz.total_points)
            if lvl:
                for o_id in set(outcome_ids):
                    if o_id not in outcome_achievements or qs.submitted_at.date() >= outcome_achievements[o_id]['date']:
                        outcome_achievements[o_id] = {
                            'level': lvl,
                            'date': qs.submitted_at.date()
                        }

        # Derive counts from unique achieved outcomes
        final_levels = [v['level'] for v in outcome_achievements.values()]
        total_assessments = len(final_levels)
        breakdown_dict = {}
        for lvl in final_levels:
            breakdown_dict[lvl] = breakdown_dict.get(lvl, 0) + 1
        
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
            area_quiz_subs = quiz_submissions.filter(
                quiz__learning_outcome__sub_strand__strand__learning_area=area
            )
            
            # Outcome-centric area breakdown
            area_outcome_achievements = {}
            for asmt in area_assessments:
                o_id = asmt.learning_outcome_id
                if not o_id: continue
                if o_id not in area_outcome_achievements or asmt.assessment_date >= area_outcome_achievements[o_id]['date']:
                    area_outcome_achievements[o_id] = {'level': asmt.competency_level, 'date': asmt.assessment_date}
            
            for qs in area_quiz_subs:
                outcome_ids = list(qs.quiz.tested_outcomes.values_list('id', flat=True))
                if qs.quiz.learning_outcome_id: outcome_ids.append(qs.quiz.learning_outcome_id)
                lvl = map_percentage(qs.score, qs.quiz.total_points)
                if lvl:
                    for o_id in set(outcome_ids):
                        if o_id not in area_outcome_achievements or qs.submitted_at.date() >= area_outcome_achievements[o_id]['date']:
                            area_outcome_achievements[o_id] = {'level': lvl, 'date': qs.submitted_at.date()}
            
            area_final_levels = [v['level'] for v in area_outcome_achievements.values()]
            area_breakdown = {}
            for lvl in area_final_levels:
                area_breakdown[lvl] = area_breakdown.get(lvl, 0) + 1
            
            strands_data = []
            for strand in area.strands.all():
                # strand processing...
                strand_assessments = area_assessments.filter(
                    learning_outcome__sub_strand__strand=strand
                )
                strand_quiz_subs = area_quiz_subs.filter(
                    quiz__learning_outcome__sub_strand__strand=strand
                )
                
                sub_strands_data = []
                for sub_strand in strand.sub_strands.all():
                    outcomes_data = []
                    for outcome in sub_strand.learning_outcomes.all():
                        # Find latest assessment for this outcome (either direct or quiz)
                        latest_asmt = strand_assessments.filter(
                            learning_outcome=outcome
                        ).order_by('-assessment_date').first()
                        
                        # Check tested_outcomes M2M relation for quizzes
                        latest_quiz = strand_quiz_subs.filter(
                            Q(quiz__learning_outcome=outcome) | 
                            Q(quiz__tested_outcomes=outcome)
                        ).order_by('-submitted_at').first()
                        
                        # Also check assignments (linked via competency assessments or direct)
                        # The report generator currently only looks at quiz_submissions directly.
                        # Direct assessments are already in strand_assessments.
                        
                        comp_lvl = None
                        asmt_date = None
                        comment = None
                        
                        # Compare dates to find the absolute latest
                        if latest_asmt and latest_quiz:
                            if latest_asmt.assessment_date >= latest_quiz.submitted_at.date():
                                comp_lvl = latest_asmt.competency_level
                                asmt_date = latest_asmt.assessment_date
                                comment = latest_asmt.teacher_comment
                            else:
                                comp_lvl = map_percentage(latest_quiz.score, latest_quiz.quiz.total_points)
                                asmt_date = latest_quiz.submitted_at.date()
                                comment = latest_quiz.feedback
                        elif latest_asmt:
                            comp_lvl = latest_asmt.competency_level
                            asmt_date = latest_asmt.assessment_date
                            comment = latest_asmt.teacher_comment
                        elif latest_quiz:
                            comp_lvl = map_percentage(latest_quiz.score, latest_quiz.quiz.total_points)
                            asmt_date = latest_quiz.submitted_at.date()
                            comment = latest_quiz.feedback
                        
                        outcomes_data.append({
                            'outcome': outcome.description,
                            'code': outcome.code,
                            'competency_level': comp_lvl,
                            'assessment_date': asmt_date,
                            'teacher_comment': comment
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
                'total_assessments': len(area_lvls),
                'breakdown': area_breakdown
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
