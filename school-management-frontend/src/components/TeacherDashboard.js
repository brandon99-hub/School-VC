import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 flex items-center gap-5 hover:shadow-md transition-shadow">
        <div className="h-14 w-14 rounded-2xl bg-[#18216D]/5 text-[#18216D] flex items-center justify-center">
            <Icon className="h-7 w-7" />
        </div>
        <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black">{label}</p>
            <p className="text-3xl font-black text-[#18216D] leading-none mt-1">{value}</p>
            {badge && <p className="text-[10px] font-bold text-[#FFC425] bg-[#FFC425]/10 px-2 py-0.5 rounded-lg mt-2 inline-block uppercase tracking-tighter">{badge}</p>}
        </div>
    </div>
);

const TeacherDashboard = () => {
    const { user } = useAuth();
    const { courses, teacherAttendance, uniqueStudentCount, loading, error, refresh } = useAppState();
    const [selectedAssignment, setSelectedAssignment] = useState(null);

    const fullName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest' : 'Guest';

    const overview = useMemo(() => {
        const totalStudents = uniqueStudentCount || 0;
        const totalAssignments = courses.reduce((acc, course) => acc + (course.assignments?.length || 0), 0);
        const avgAttendance = teacherAttendance.length
            ? Math.round(
                teacherAttendance.reduce((sum, record) => sum + (Number(record.attendanceRate) || 0), 0) /
                teacherAttendance.length
            )
            : 0;
        return {
            learningAreas: courses.length,
            students: totalStudents,
            assignments: totalAssignments,
            attendance: avgAttendance,
        };
    }, [courses, teacherAttendance, uniqueStudentCount]);

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
                <header className="relative overflow-hidden bg-[#18216D] rounded-[2.5rem] p-12 text-white shadow-2xl shadow-indigo-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter">Welcome back, {user?.first_name || 'Teacher'}</h1>
                        <div className="h-2 w-24 bg-[#FFC425] rounded-full mt-6"></div>
                    </div>
                </header>

                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard label="Assigned Standards" value={overview.learningAreas} icon={AcademicCapIcon} />
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
                                <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">National Standards</p>
                                <h2 className="text-xl font-semibold text-gray-900">Assigned Learning Areas</h2>
                            </div>
                            <button
                                onClick={handleRefresh}
                                className="text-[10px] font-black uppercase tracking-widest text-[#18216D] hover:text-[#FFC425] transition-colors"
                            >
                                Sync Data
                            </button>
                        </div>
                        {courses.length === 0 ? (
                            <div className="p-6 text-gray-500 text-sm italic">
                                No national standards assigned yet. Please contact administration to link your profile to your Learning Areas.
                            </div>
                        ) : (
                            <div className="p-6 space-y-4">
                                {courses.map((course) => (
                                    <Link
                                        key={course.id}
                                        to={`/teacher/courses/${course.id}`}
                                        className="block border border-slate-100 rounded-[2rem] p-6 hover:border-[#FFC425] hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5 transition-all no-underline group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FFC425]">
                                                    {course.code}
                                                </p>
                                                <h3 className="text-xl font-black text-[#18216D] group-hover:translate-x-1 transition-transform">{course.name}</h3>
                                            </div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                                                {course.enrolled_students_count || 0} Scholars
                                            </span>
                                        </div>
                                        <div className="mt-4 grid gap-3">
                                            {(course.assignments || []).slice(0, 2).map((assignment) => (
                                                <div
                                                    key={assignment.id}
                                                    className="flex items-center justify-between bg-white bg-opacity-50 rounded-lg px-3 py-2 border border-gray-50"
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
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setSelectedAssignment(assignment.id);
                                                        }}
                                                        className="text-[10px] font-black uppercase tracking-widest text-[#18216D] hover:text-[#FFC425] transition-all"
                                                    >
                                                        Grade Task
                                                    </button>
                                                </div>
                                            ))}
                                            {(!course.assignments || !course.assignments.length) && (
                                                <p className="text-sm text-gray-400">
                                                    No assignments configured for this learning area.
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TeacherAttendanceRecord />
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-black text-[#18216D] flex items-center uppercase tracking-tight">
                                <i className="fas fa-tasks mr-3 text-[#FFC425]"></i>
                                Pending Action
                            </h3>
                            <Link to="/teacher/courses" className="text-[10px] font-black text-[#18216D] uppercase tracking-[0.2em] hover:text-[#FFC425] transition-colors">
                                View Registry
                            </Link>
                        </div>
                        <div className="space-y-4">
                            {courses.some(c => c.assignments?.some(a => (a.submission_count || 0) > 0)) ? (
                                courses.flatMap(c => c.assignments || [])
                                    .filter(assignment => (assignment.submission_count || 0) > 0)
                                    .slice(0, 5)
                                    .map(assignment => (
                                        <div key={assignment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors group">
                                            <div>
                                                <p className="font-bold text-sm text-gray-800">{assignment.title}</p>
                                                <p className="text-xs text-gray-500">
                                                    {assignment.submission_count || 0} submission{(assignment.submission_count || 0) !== 1 ? 's' : ''} • Due {new Date(assignment.due_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedAssignment(assignment.id)}
                                                className="px-4 py-2 bg-white text-[#18216D] text-[10px] font-black rounded-xl border border-slate-100 shadow-sm group-hover:bg-[#18216D] group-hover:text-white transition-all uppercase tracking-widest"
                                            >
                                                Grade ({assignment.submission_count || 0})
                                            </button>
                                        </div>
                                    ))
                            ) : (
                                <div className="text-center py-8">
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <i className="fas fa-check text-gray-300"></i>
                                    </div>
                                    <p className="text-sm text-gray-400">No pending submissions to grade</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
                {selectedAssignment && (
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <GradeForm assignmentId={selectedAssignment} onClose={() => setSelectedAssignment(null)} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TeacherDashboard;