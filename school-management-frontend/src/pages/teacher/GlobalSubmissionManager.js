import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppState } from '../../context/AppStateContext';
import {
    DocumentCheckIcon,
    MagnifyingGlassIcon,
    AcademicCapIcon,
    ClockIcon,
    FunnelIcon
} from '@heroicons/react/24/outline';
import GradeForm from '../../components/GradeForm';

const GlobalSubmissionManager = () => {
    const { courses } = useAppState();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedAssignmentId, setSelectedAssignmentId] = useState(null);

    // Flatten assignments from all courses
    const allAssignments = useMemo(() => {
        return courses.flatMap(course =>
            (course.assignments || []).map(asgn => ({
                ...asgn,
                courseName: course.name,
                courseCode: course.code,
                ungradedCount: (asgn.submission_count || 0) - (asgn.graded_submissions_count || 0)
            }))
        ).sort((a, b) => {
            if (b.ungradedCount !== a.ungradedCount) {
                return b.ungradedCount - a.ungradedCount;
            }
            return new Date(b.due_date) - new Date(a.due_date);
        });
    }, [courses]);

    const filteredAssignments = useMemo(() => {
        if (!searchTerm) return allAssignments;
        const lowerTerm = searchTerm.toLowerCase();
        return allAssignments.filter(a =>
            a.title.toLowerCase().includes(lowerTerm) ||
            a.courseName.toLowerCase().includes(lowerTerm) ||
            a.courseCode.toLowerCase().includes(lowerTerm)
        );
    }, [allAssignments, searchTerm]);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
                <header className="relative overflow-hidden bg-[#18216D] rounded-[2.5rem] p-12 text-white shadow-2xl shadow-indigo-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-2">Grading Queue</p>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter italic">Unified Submissions</h1>
                        <p className="text-indigo-100/70 max-w-2xl font-medium text-lg mt-6">
                            Review and grade work across all your assigned learning areas from a single view.
                        </p>
                    </div>
                </header>

                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex-1 relative group max-w-xl">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#18216D] transition-colors">
                            <MagnifyingGlassIcon className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Filter by assignment or learning area..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/20 focus:bg-white transition-all text-sm font-bold text-[#18216D]"
                        />
                    </div>
                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                        <div className="px-4 py-2 bg-white rounded-xl shadow-sm text-xs font-black text-[#18216D] uppercase tracking-widest border border-slate-100">
                            {filteredAssignments.length} Assignments
                        </div>
                        <div className="px-4 py-2 bg-[#FFC425]/10 rounded-xl text-xs font-black text-[#B48A1B] uppercase tracking-widest border border-[#FFC425]/20">
                            {filteredAssignments.reduce((acc, a) => acc + a.ungradedCount, 0)} Pending
                        </div>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6">
                    {filteredAssignments.map(assignment => {
                        const total = assignment.submission_count || 0;
                        const graded = assignment.graded_submissions_count || 0;
                        const percentage = total > 0 ? Math.round((graded / total) * 100) : 0;
                        const pending = total - graded;

                        return (
                            <div key={assignment.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-900/5 transition-all group animate-in fade-in duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                                    <div className="flex items-start gap-4">
                                        <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shadow-sm border border-white transition-transform group-hover:scale-110 ${pending > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                            {pending > 0 ? <ClockIcon className="w-7 h-7" /> : <AcademicCapIcon className="w-7 h-7" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className="px-2.5 py-1 rounded-lg bg-[#18216D]/5 text-[#18216D] text-[10px] font-black uppercase tracking-widest border border-[#18216D]/10">
                                                    {assignment.courseCode}
                                                </span>
                                                {pending > 0 && (
                                                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest border border-amber-100 animate-pulse">
                                                        {pending} Pending
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="text-xl font-black text-[#18216D] tracking-tight">{assignment.title}</h3>
                                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">Due {new Date(assignment.due_date).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedAssignmentId(assignment.id)}
                                            className="px-8 py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0D164F] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/20"
                                        >
                                            Grade Tasks
                                        </button>
                                        <button
                                            onClick={() => navigate(`/teacher/courses/${assignment.course || ''}`)}
                                            className="px-6 py-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 hover:text-[#18216D] transition-all"
                                        >
                                            View Course
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-slate-400">Completion Status</span>
                                        <span className="text-[#18216D]">{graded} / {total} Submissions Processed</span>
                                    </div>
                                    <div className="h-4 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${percentage === 100 ? 'bg-emerald-500' : 'bg-[#FFC425] shadow-[0_0_20px_rgba(255,196,37,0.3)]'}`}
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {filteredAssignments.length === 0 && (
                        <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                            <DocumentCheckIcon className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No assignments match your search.</p>
                        </div>
                    )}
                </div>
            </main>

            {selectedAssignmentId && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto overflow-x-hidden animate-in zoom-in duration-300">
                        <GradeForm assignmentId={selectedAssignmentId} onClose={() => setSelectedAssignmentId(null)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default GlobalSubmissionManager;
