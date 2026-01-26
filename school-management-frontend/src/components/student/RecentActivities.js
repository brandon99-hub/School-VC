import React, { useMemo } from 'react';
import { useAppState } from '../../context/AppStateContext';
import {
    ClockIcon,
    CheckCircleIcon,
    AcademicCapIcon,
    ClipboardDocumentIcon
} from '@heroicons/react/24/outline';

const RecentActivities = () => {
    const { courses } = useAppState();

    const activities = useMemo(() => {
        const all = [];

        courses.forEach(course => {
            // Add Assignments
            (course.assignments || []).forEach(asgn => {
                const submission = (course.student_submissions?.assignments || []).find(s => s.assignment === asgn.id);
                all.push({
                    id: `asgn-${asgn.id}`,
                    title: asgn.title,
                    courseName: course.name,
                    type: 'Assignment',
                    date: new Date(asgn.created_at || asgn.due_date),
                    isCompleted: !!submission,
                    icon: ClipboardDocumentIcon,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50'
                });
            });

            // Add Quizzes
            (course.quizzes || []).forEach(quiz => {
                const submission = (course.student_submissions?.quizzes || []).find(s => s.quiz === quiz.id);
                all.push({
                    id: `quiz-${quiz.id}`,
                    title: quiz.title,
                    courseName: course.name,
                    type: 'Quiz',
                    date: new Date(quiz.created_at || new Date()),
                    isCompleted: !!submission,
                    icon: AcademicCapIcon,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50'
                });
            });
        });

        // Sort by date descending
        return all.sort((a, b) => b.date - a.date).slice(0, 5);
    }, [courses]);

    if (activities.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100 h-full flex flex-col">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-[#18216D] tracking-tight">Recent Activity</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Your latest scholastic updates</p>
                </div>
                <div className="p-2 bg-slate-50 rounded-xl text-slate-300">
                    <ClockIcon className="w-5 h-5" />
                </div>
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                {activities.map((activity) => (
                    <div key={activity.id} className="group relative flex gap-4 items-start">
                        <div className={`mt-1 h-10 w-10 flex-shrink-0 rounded-xl ${activity.bg} ${activity.color} flex items-center justify-center transition-all group-hover:scale-110 shadow-sm`}>
                            <activity.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{activity.courseName}</p>
                                {activity.isCompleted && (
                                    <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                                )}
                            </div>
                            <h4 className="font-bold text-[#18216D] text-sm truncate group-hover:text-blue-600 transition-colors">
                                {activity.title}
                            </h4>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                {activity.type} • {activity.date.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <button className="mt-8 w-full py-3 bg-slate-50 text-slate-400 rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-[#18216D] hover:text-white transition-all">
                View All Records
            </button>
        </div>
    );
};

export default RecentActivities;
