import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import RubricGrading from '../../components/teacher/RubricGrading';
import {
    ChevronLeftIcon,
    ArrowDownTrayIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckBadgeIcon,
    DocumentTextIcon,
    AcademicCapIcon,
    Squares2X2Icon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';

const SubmissionListPage = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const { get } = useApi();
    const { showToast } = useAppState();

    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [searchQuery, setSearchQuery] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [assignmentData, submissionsData] = await Promise.all([
                get(`/api/assignments/${assignmentId}/`),
                get(`/api/assignments/${assignmentId}/submissions/`)
            ]);
            setAssignment(assignmentData);
            setSubmissions(submissionsData || []);
        } catch (error) {
            console.error('Error fetching submission data:', error);
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoading(false);
        }
    }, [assignmentId, get, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#18216D]/10 border-t-[#18216D] mb-4"></div>
                <div className="text-[#18216D] font-black uppercase tracking-widest text-[10px]">Retrieving Submissions...</div>
            </div>
        );
    }

    if (!assignment) return null;

    const filteredSubmissions = submissions.filter(s =>
        s.student_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.student_id?.toString().includes(searchQuery)
    );

    const gradedCount = submissions.filter(s =>
        s.status?.toLowerCase() === 'graded' ||
        (s.grade !== null && s.grade !== undefined) ||
        !!s.competency_level
    ).length;
    const pendingCount = submissions.length - gradedCount;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* High-Density Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-[#18216D] transition-all"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-xl font-black text-[#18216D] tracking-tight">{assignment.title}</h1>
                                    <span className="px-2 py-0.5 bg-[#FFC425]/10 text-[#18216D] text-[9px] font-black uppercase tracking-widest rounded-lg border border-[#FFC425]/20">
                                        {assignment.learning_area_name || 'Mathematics'}
                                    </span>
                                </div>
                                <p className="text-slate-400 font-bold text-[9px] uppercase tracking-[0.1em] mt-0.5 flex items-center">
                                    <DocumentTextIcon className="w-3 h-3 mr-1.5" />
                                    {assignment.strand_name} • {assignment.sub_strand_name}
                                </p>
                            </div>
                        </div>

                        {/* Search & View Switcher */}
                        <div className="flex-1 max-w-md mx-8 hidden lg:block">
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                <input
                                    type="text"
                                    placeholder="Quick search scholars..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-xs font-bold text-[#18216D] focus:ring-4 focus:ring-[#18216D]/5 transition-all"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-[#18216D] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <Squares2X2Icon className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white text-[#18216D] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <ListBulletIcon className="w-4 h-4" />
                                </button>
                            </div>

                            {/* Summary Stats */}
                            <div className="hidden sm:flex items-center gap-2">
                                <div className="bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100/50">
                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{gradedCount} Graded</span>
                                </div>
                                <div className="bg-[#FFC425]/10 px-3 py-1.5 rounded-xl border border-[#FFC425]/20">
                                    <span className="text-[10px] font-black text-[#18216D] uppercase tracking-widest">{pendingCount} Waiting</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Task Description (Restored) */}
                    {assignment.description && (
                        <div className="mt-4 pt-4 border-t border-slate-50">
                            <p className="text-xs font-medium text-slate-500 line-clamp-2 italic">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 mr-2 not-italic">Task Brief:</span>
                                {assignment.description}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Submissions View */}
            <main className="max-w-7xl mx-auto px-6 mt-12">
                {submissions.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-xl shadow-indigo-900/5">
                        <div className="w-20 h-20 bg-slate-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6">
                            <ChatBubbleBottomCenterTextIcon className="w-10 h-10 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No submissions received yet</p>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredSubmissions.map((submission) => (
                            <div
                                key={submission.id}
                                className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>

                                <div className="relative z-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-14 h-14 bg-[#18216D] text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-indigo-900/20">
                                            {submission.student_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-black text-[#18216D] tracking-tight">{submission.student_name}</h4>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                                                ID: {submission.student_id || '24/00863'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-4 mb-8">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-400 uppercase tracking-widest">Status</span>
                                            {submission.grade || submission.competency_level || submission.status?.toLowerCase() === 'graded' ? (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-widest text-[9px] font-black">Graded</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full border border-amber-100 uppercase tracking-widest text-[9px] font-black">Waiting</span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between text-xs font-bold">
                                            <span className="text-slate-400 uppercase tracking-widest">Submitted</span>
                                            <span className="text-[#18216D]">{new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {submission.file && (
                                            <a
                                                href={submission.file}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 py-4 bg-slate-50 text-[#18216D] rounded-2xl flex items-center justify-center gap-2 hover:bg-[#18216D] hover:text-white transition-all font-black text-[10px] uppercase tracking-widest"
                                            >
                                                <ArrowDownTrayIcon className="w-4 h-4" />
                                                Artifact
                                            </a>
                                        )}
                                        <button
                                            onClick={() => setSelectedSubmission(submission)}
                                            className="flex-[2] py-4 bg-[#18216D] text-white rounded-2xl flex items-center justify-center gap-2 hover:bg-[#0D164F] transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-900/20"
                                        >
                                            {submission.grade || submission.competency_level || submission.status?.toLowerCase() === 'graded' ? 'Review Outcome' : 'Evaluate Work'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-[2rem] border border-slate-100 overflow-hidden shadow-xl shadow-indigo-900/5">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Scholar</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Student ID</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Submitted At</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                    <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredSubmissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-[#18216D] text-white rounded-xl flex items-center justify-center font-black text-xs">
                                                    {submission.student_name?.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-bold text-[#18216D] text-sm">{submission.student_name}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-bold text-slate-500">{submission.student_id || '24/00863'}</td>
                                        <td className="px-8 py-6 text-xs font-bold text-[#18216D]">
                                            {new Date(submission.submitted_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </td>
                                        <td className="px-8 py-6">
                                            {submission.grade || submission.competency_level || submission.status?.toLowerCase() === 'graded' ? (
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Graded</span>
                                            ) : (
                                                <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-100">Waiting</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {submission.file && (
                                                    <a
                                                        href={submission.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 bg-slate-100 text-[#18216D] rounded-lg hover:bg-[#18216D] hover:text-white transition-all"
                                                    >
                                                        <ArrowDownTrayIcon className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => setSelectedSubmission(submission)}
                                                    className="px-5 py-2.5 bg-[#18216D] text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-[#0D164F] transition-all"
                                                >
                                                    {submission.grade || submission.competency_level || submission.status?.toLowerCase() === 'graded' ? 'Review' : 'Evaluate'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Grading Hub (Redesigned) */}
            {selectedSubmission && (
                <div className="fixed inset-0 bg-[#18216D]/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-white/20">
                        {/* Hub Header */}
                        <div className="px-10 py-8 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <AcademicCapIcon className="w-5 h-5 text-[#18216D]" />
                                    <h3 className="text-2xl font-black text-[#18216D] tracking-tight">Grading Hub</h3>
                                </div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[9px]">High-Velocity Scholar Assessment Matrix</p>
                            </div>

                            {/* Internal Search */}
                            <div className="flex-1 max-w-sm">
                                <div className="relative">
                                    <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                    <input
                                        type="text"
                                        placeholder="Find scholar..."
                                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-[#18216D] focus:ring-4 focus:ring-[#18216D]/5 transition-all uppercase tracking-widest"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedSubmission(null)}
                                className="p-3 bg-white border border-slate-100 hover:bg-red-50 hover:text-red-500 rounded-2xl text-slate-300 transition-all shadow-sm flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                            >
                                <XMarkIcon className="w-5 h-5" />
                                Exit Hub
                            </button>
                        </div>

                        {/* Scholar Cards Scroll Area */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar bg-[#18216D]/[0.02]">
                            <div className="bg-white rounded-[2.5rem] p-1 shadow-xl shadow-indigo-900/10 border border-slate-100 relative group animate-in slide-in-from-bottom-6 duration-500">
                                <div className="bg-white rounded-[2.2rem] p-8">
                                    <RubricGrading
                                        submission={selectedSubmission}
                                        assignment={assignment}
                                        onGraded={() => {
                                            fetchData();
                                            setSelectedSubmission(null);
                                        }}
                                        hasNext={false} // Managed by Hub
                                    />
                                </div>
                            </div>

                            {submissions.filter(s => s.status?.toLowerCase() !== 'graded' && !s.grade && !s.competency_level).length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <CheckBadgeIcon className="w-10 h-10 text-emerald-500" />
                                    </div>
                                    <h4 className="text-xl font-black text-[#18216D]">All scholars graded!</h4>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">The assessment cycle for this task is complete. Great job!</p>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="mt-8 px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0D164F] transition-all"
                                    >
                                        Return to List
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubmissionListPage;
