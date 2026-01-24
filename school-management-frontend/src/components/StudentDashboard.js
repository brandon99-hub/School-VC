// StudentDashboard.js (updated)
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import StudentInfo from './StudentInfo';
import CourseList from './CourseList';
import AttendanceRecord from './AttendanceRecord';
import { ArrowDownIcon, ArrowUpIcon, ClockIcon } from '@heroicons/react/24/outline';

const StatCard = ({ label, value, delta, icon: Icon, trend }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:shadow-md transition-all group">
        <div className="h-14 w-14 rounded-2xl bg-[#18216D]/5 text-[#18216D] flex items-center justify-center group-hover:bg-[#18216D] group-hover:text-white transition-all shadow-sm">
            <Icon className="h-7 w-7" />
        </div>
        <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {delta && (
                <div className="flex items-center text-sm mt-1">
                    {trend === 'up' ? (
                        <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                        <ArrowDownIcon className="h-4 w-4 text-rose-500 mr-1" />
                    )}
                    <span className={trend === 'up' ? 'text-green-600' : 'text-rose-600'}>{delta}</span>
                    <span className="text-gray-400 ml-2">vs last week</span>
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
        const presentCount = studentAttendance.filter((entry) => entry.status === 'Present').length;
        const attendanceRate = studentAttendance.length
            ? Math.round((presentCount / studentAttendance.length) * 100)
            : 0;
        const upcomingAssignments = courses.reduce((acc, course) => acc + (course.assignments?.length || 0), 0);
        return {
            totalCourses,
            attendanceRate,
            upcomingAssignments,
        };
    }, [courses, studentAttendance]);

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-12">
                <header className="space-y-3 relative overflow-hidden bg-[#18216D] p-12 rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 text-white">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-2">Student Portal</p>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter italic">Kumbaya, {fullName}</h1>
                        <p className="text-indigo-100/70 max-w-2xl font-medium text-lg mt-6">
                            Your competency-based learning path is ready. Track your strands, review assessments, and monitor your academic growth.
                        </p>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        label="Learning Areas"
                        value={overview.totalCourses}
                        delta="Standard"
                        trend="up"
                        icon={ClockIcon}
                    />
                    <StatCard
                        label="Attendance"
                        value={`${overview.attendanceRate}%`}
                        delta="Real-time"
                        trend="up"
                        icon={ClockIcon}
                    />
                    <StatCard
                        label="Competency Tasks"
                        value={overview.upcomingAssignments}
                        delta="Pending"
                        trend="up"
                        icon={ClockIcon}
                    />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-1">
                        <StudentInfo student={user} />
                    </div>
                    <div className="lg:col-span-3">
                        <CourseList />
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-8">
                    <AttendanceRecord />
                </section>
            </main>
        </div>
    );
};

export default StudentDashboard;
