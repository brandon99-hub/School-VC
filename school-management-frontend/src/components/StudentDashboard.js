// StudentDashboard.js (updated)
import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import StudentInfo from './StudentInfo';
import CourseList from './CourseList';
import AttendanceRecord from './AttendanceRecord';
import { ArrowDownIcon, ArrowUpIcon, ClockIcon } from '@heroicons/react/24/outline';

const StatCard = ({ label, value, delta, icon: Icon, trend }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Icon className="h-6 w-6" />
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
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                <header className="space-y-2">
                    <p className="text-sm uppercase tracking-wider text-blue-500 font-semibold">Student dashboard</p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Welcome back, {fullName}</h1>
                    <p className="text-slate-500 max-w-2xl">
                        Track your progress, stay on top of assignments, and review attendance insights at a glance.
                    </p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        label="Current Courses"
                        value={overview.totalCourses}
                        delta="+1 course"
                        trend="up"
                        icon={ClockIcon}
                    />
                    <StatCard
                        label="Attendance Rate"
                        value={`${overview.attendanceRate}%`}
                        delta="-2%"
                        trend="down"
                        icon={ClockIcon}
                    />
                    <StatCard
                        label="Assignments"
                        value={overview.upcomingAssignments}
                        delta="+3 due"
                        trend="up"
                        icon={ClockIcon}
                    />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <StudentInfo student={user} />
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
                                    Learning
                                </p>
                                <h2 className="text-xl font-semibold text-gray-900">Active Courses</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <CourseList />
                        </div>
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6">
                    <AttendanceRecord />
                </section>
            </main>
        </div>
    );
};

export default StudentDashboard;
