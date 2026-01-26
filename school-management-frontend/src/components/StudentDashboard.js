// StudentDashboard.js (updated)
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import StudentInfo from './StudentInfo';
import CourseList from './CourseList';
import Calendar from './student/Calendar';
import RecentActivities from './student/RecentActivities';
import { ArrowDownIcon, ArrowUpIcon, AcademicCapIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';

const StatCard = ({ label, value, delta, icon: Icon, trend }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:shadow-md transition-all group">
        <div className="h-14 w-14 rounded-2xl bg-[#18216D]/5 text-[#18216D] flex items-center justify-center group-hover:bg-[#18216D] group-hover:text-white transition-all shadow-sm">
            <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-2xl font-black text-[#18216D]">{value}</p>
            {delta && (
                <div className="flex items-center text-sm mt-1">
                    {trend === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                        <ArrowDownIcon className="h-4 w-4 text-rose-500 mr-1" />
                    )}
                    <span className={trend === 'up' ? 'text-green-600' : 'text-rose-600'}>{delta}</span>
                </div>
            )}
        </div>
    </div>
);

const StudentDashboard = () => {
    const { user } = useAuth();
    const { studentAttendance, courses } = useAppState();

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest' : 'Guest';

    const overview = useMemo(() => {
        const totalCourses = courses.length;

        let totalAssignments = 0;
        let completedAssignments = 0;
        let totalQuizzes = 0;
        let completedQuizzes = 0;

        courses.forEach(course => {
            // Assignments
            const courseAssignments = course.assignments || [];
            totalAssignments += courseAssignments.length;

            const subs = course.student_submissions?.assignments || [];
            // Count unique assignments completed
            const uniqueAssignmentIds = new Set(subs.map(s => s.assignment));
            completedAssignments += uniqueAssignmentIds.size;

            // Quizzes
            const courseQuizzes = course.quizzes || [];
            totalQuizzes += courseQuizzes.length;

            const quizSubs = course.student_submissions?.quizzes || [];
            // Count unique quizzes completed
            const uniqueQuizIds = new Set(quizSubs.filter(s => s.status === 'graded' || s.status === 'auto_graded').map(s => s.quiz));
            completedQuizzes += uniqueQuizIds.size;
        });

        const allAssignments = courses.flatMap(c => (c.assignments || []).map(a => ({ ...a, courseName: c.name })));

        return {
            totalCourses,
            totalAssignments,
            completedAssignments,
            totalQuizzes,
            completedQuizzes,
            allAssignments
        };
    }, [courses]);

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-12">
                <header className="space-y-3 relative overflow-hidden bg-[#18216D] p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-2">Scholar Portal</p>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter italic">Welcome, {fullName}</h1>
                        <p className="text-indigo-100/70 max-w-2xl font-medium text-lg mt-6">
                            View your subjects, track assignments, and monitor your progress.
                        </p>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Subjects"
                        value={overview.totalCourses}
                        delta="Academic Subjects"
                        trend="up"
                        icon={BookOpenIcon}
                    />
                    <StatCard
                        label="Assignments"
                        value={overview.totalAssignments}
                        delta={`${overview.completedAssignments} Done`}
                        trend="up"
                        icon={AcademicCapIcon}
                    />
                    <StatCard
                        label="Tests"
                        value={overview.totalQuizzes}
                        delta={`${overview.completedQuizzes} Done`}
                        trend="up"
                        icon={ClockIcon}
                    />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    <div className="lg:col-span-3">
                        <StudentInfo student={user} />
                    </div>
                    <div className="lg:col-span-7">
                        <CourseList />
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-10 gap-8">
                    <div className="lg:col-span-6">
                        <Calendar assignments={overview.allAssignments} />
                    </div>
                    <div className="lg:col-span-4">
                        <RecentActivities />
                    </div>
                </section>

            </main>
        </div>
    );
};

export default StudentDashboard;
