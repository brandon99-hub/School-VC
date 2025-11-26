// TeacherDashboard.js
import React, { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import GradeForm from './GradeForm';
import TeacherInfo from './TeacherInfo';
import TeacherAttendanceRecord from './TeacherAttendanceRecord';
import {
    AcademicCapIcon,
    ClipboardDocumentCheckIcon,
    UserGroupIcon,
} from '@heroicons/react/24/outline';

const StatCard = ({ label, value, icon: Icon, badge }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
        <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Icon className="h-6 w-6" />
        </div>
        <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{label}</p>
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {badge && <p className="text-sm text-gray-500">{badge}</p>}
        </div>
    </div>
);

const TeacherDashboard = () => {
    const { user } = useAuth();
    const { courses, teacherAttendance, loading, error, refresh } = useAppState();
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest' : 'Guest';

    const overview = useMemo(() => {
        const totalStudents = courses.reduce(
            (acc, course) => acc + (course.enrolled_students_count || course.students?.length || 0),
            0
        );
        const totalAssignments = courses.reduce((acc, course) => acc + (course.assignments?.length || 0), 0);
        const avgAttendance = teacherAttendance.length
            ? Math.round(
                  teacherAttendance.reduce((sum, record) => sum + (Number(record.attendanceRate) || 0), 0) /
                      teacherAttendance.length
              )
            : 0;
        return {
            courses: courses.length,
            students: totalStudents,
            assignments: totalAssignments,
            attendance: avgAttendance,
        };
    }, [courses, teacherAttendance]);

    const handleRefresh = () => {
        refresh();
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error)
        return (
            <div className="text-red-500 p-4">
                {error}
                <button onClick={handleRefresh} className="ml-4 text-blue-600 hover:underline">
                    Retry
                </button>
            </div>
        );

    return (
        <div className="min-h-screen bg-slate-50">
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
                <header className="space-y-2">
                    <p className="text-sm uppercase tracking-wide text-indigo-500 font-semibold">Teacher dashboard</p>
                    <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Good to see you, {fullName}</h1>
                    <p className="text-slate-500 max-w-2xl">
                        Keep track of class performance, assignments, and attendance in one place.
                    </p>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Courses" value={overview.courses} icon={AcademicCapIcon} />
                    <StatCard label="Students" value={overview.students} icon={UserGroupIcon} />
                    <StatCard
                        label="Assignments"
                        value={overview.assignments}
                        icon={ClipboardDocumentCheckIcon}
                        badge={`Avg attendance ${overview.attendance}%`}
                    />
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <TeacherInfo teacher={user} />
                    <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Courses</p>
                                <h2 className="text-xl font-semibold text-gray-900">Active classes</h2>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold"
                            >
                                Refresh
                            </button>
                        </div>
                        {courses.length === 0 ? (
                            <div className="p-6 text-gray-500 text-sm">
                                No courses found. Use the admin panel to assign classes.
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {courses.map((course) => (
                                    <div
                                        key={course.id}
                                        className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm uppercase tracking-wide text-gray-400">
                                                    {course.code}
                                                </p>
                                                <h3 className="text-lg font-semibold text-gray-900">{course.name}</h3>
                                            </div>
                                            <span className="text-sm text-gray-500">
                                                {course.enrolled_students?.length || 0} students
                                            </span>
                                        </div>
                                        <div className="mt-4 grid gap-3">
                                            {(course.assignments || []).map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                                                >
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-800">
                                                            {assignment.title}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            Due {new Date(assignment.due_date).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                    <button
                                                        onClick={() => setSelectedAssignment(assignment.id)}
                                                        className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                                                    >
                                                        Grade
                                                    </button>
                                                </div>
                                            ))}
                                            {(!course.assignments || !course.assignments.length) && (
                                                <p className="text-sm text-gray-400">
                                                    No assignments configured for this course.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid grid-cols-1 gap-6">
                    <TeacherAttendanceRecord />
                    {selectedAssignment && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <GradeForm assignmentId={selectedAssignment} onClose={() => setSelectedAssignment(null)} />
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default TeacherDashboard;