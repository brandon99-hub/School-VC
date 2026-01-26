import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '../hooks/useApi';
import { useAppState } from '../context/AppStateContext';
import {
    XMarkIcon,
    CheckCircleIcon,
    MagnifyingGlassIcon,
    ArrowDownTrayIcon,
    AcademicCapIcon,
    ClockIcon,
    UserIcon
} from '@heroicons/react/24/outline';

const GradeForm = ({ assignmentId, onClose }) => {
    const { get, post, put, patch } = useApi();
    const { showToast } = useAppState();
    const [assignment, setAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [submissions, setSubmissions] = useState([]);
    const [grades, setGrades] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [gradedSessionIds, setGradedSessionIds] = useState(new Set());

    const competencyLevels = [
        { code: 'EE', label: 'Exceeding Expectations', color: 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100' },
        { code: 'ME', label: 'Meeting Expectations', color: 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' },
        { code: 'AE', label: 'Approaching Expectations', color: 'bg-slate-50 text-slate-700 border-slate-100 hover:bg-slate-100' },
        { code: 'BE', label: 'Below Expectations', color: 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [assignData, submissionsData] = await Promise.all([
                    get(`/api/assignments/${assignmentId}/`),
                    get(`/api/assignments/${assignmentId}/submissions/`)
                ]);

                setAssignment(assignData);
                setSubmissions(submissionsData || []);

                const endpoint = assignData.course
                    ? `/api/courses/${assignData.course}/students/`
                    : `/api/cbc/learning-areas/${assignData.learning_area}/students/?exclude_assessed_assignment=${assignmentId}`;

                const studentData = await get(endpoint);
                setStudents(studentData);

                // Initial grades (empty)
                const initialGrades = {};
                studentData.forEach(s => initialGrades[s.id] = '');
                setGrades(initialGrades);
            } catch (err) {
                console.error('Error fetching data:', err);
                showToast('Failed to load assessment data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [get, assignmentId, showToast]);

    const handleLevelSelect = (studentId, level) => {
        setGrades(prev => ({ ...prev, [studentId]: level }));

        // Optimistic replacement: mark as graded in this session
        // This will trigger the filtered list to update and show the next scholar
        setTimeout(() => {
            setGradedSessionIds(prev => new Set([...prev, studentId]));
        }, 500); // Small delay for visual feedback
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const studentsToGrade = Object.entries(grades).filter(([studentId, level]) => level !== '');

        if (studentsToGrade.length === 0) {
            showToast('No assessments selected', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await Promise.all(studentsToGrade.map(async ([studentId, level]) => {
                const submission = submissions.find(s => s.student === parseInt(studentId));

                // 1. Create CBC Competency Assessments for all tested outcomes
                const outcomesToAssess = assignment.tested_outcomes || [];
                // Include legacy learning_outcome if it's not already in tested_outcomes
                if (assignment.learning_outcome && !outcomesToAssess.includes(assignment.learning_outcome)) {
                    outcomesToAssess.push(assignment.learning_outcome);
                }

                if (outcomesToAssess.length > 0) {
                    await Promise.all(outcomesToAssess.map(async (outcomeId) => {
                        return post('/api/cbc/competency-assessments/', {
                            student: studentId,
                            learning_outcome: outcomeId,
                            competency_level: level,
                            teacher: assignment.teacher,
                            teacher_comment: "Finalized via Success Hub.",
                            evidence: `Assessment: ${assignment.title}`,
                            assignment_submission: submission?.id
                        });
                    }));
                }

                // 2. Update Assignment Submission status using patch to avoid required field errors
                if (submission) {
                    await patch(`/api/assignment-submissions/${submission.id}/`, {
                        status: 'graded',
                        competency_level: level,
                        competency_comment: "Finalized via Success Hub."
                    });
                }
            }));

            showToast(`Finalized ${studentsToGrade.length} assessments`);
            onClose();
        } catch (err) {
            console.error('Error submitting assessments:', err);
            showToast('Failed to record some assessments', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const hasSubmission = submissions.some(s => s.student === student.id);
            if (!hasSubmission) return false;

            const nameMatch = student.name?.toLowerCase() || '';
            const matchesSearch = nameMatch.includes(searchQuery.toLowerCase()) ||
                student.student_id?.toString().includes(searchQuery);
            const isNotGradedYet = !gradedSessionIds.has(student.id);
            return matchesSearch && isNotGradedYet;
        });
    }, [students, submissions, searchQuery, gradedSessionIds]);

    const visibleScholars = filteredStudents.slice(0, 2);

    if (loading) return (
        <div className="p-20 text-center bg-white rounded-[2.5rem]">
            <div className="w-12 h-12 border-4 border-[#18216D]/10 border-t-[#18216D] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Initializing High-Velocity Hub...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-[3rem] overflow-hidden flex flex-col max-h-[95vh] shadow-[0_35px_60px_-15px_rgba(24,33,109,0.3)] border border-slate-100 animate-in fade-in zoom-in-95 duration-500">
            {/* Unified Hub Header (Light Style) - Simplified */}
            <div className="bg-slate-50/50 px-10 py-8 border-b border-slate-100 relative overflow-hidden flex-shrink-0">
                <div className="relative z-10 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Compact Task Briefing */}
                        <div className="flex-1 flex items-center gap-6">
                            <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center flex-shrink-0">
                                <AcademicCapIcon className="w-7 h-7 text-[#18216D]" />
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-xl font-black text-[#18216D] tracking-tight truncate">{assignment?.title}</h3>
                                    <span className="bg-[#18216D]/5 text-[#18216D] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#18216D]/10 whitespace-nowrap">Dashboard Hub</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{assignment?.strand_name}</span>
                                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{assignment?.sub_strand_name}</span>
                                </div>
                            </div>
                        </div>

                        {/* Search & Actions */}
                        <div className="flex items-center gap-4">
                            <div className="relative group min-w-[300px]">
                                <MagnifyingGlassIcon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#18216D] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Find scholar..."
                                    className="w-full pl-10 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-[10px] font-black text-[#18216D] focus:ring-4 focus:ring-[#18216D]/5 transition-all uppercase tracking-widest outline-none shadow-sm"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3.5 bg-white hover:bg-red-50 hover:text-red-500 border border-slate-100 rounded-2xl transition-all shadow-sm group"
                                title="Exit Hub"
                            >
                                <XMarkIcon className="w-6 h-6 text-slate-300 group-hover:text-red-500 transition-colors" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Hub Content: 2-Scholar Stack */}
            <div className="flex-1 overflow-y-auto p-10 bg-[#18216D]/[0.02] custom-scrollbar space-y-12">
                {visibleScholars.length > 0 ? (
                    visibleScholars.map((student) => {
                        const submission = submissions.find(s => s.student === student.id);
                        const displayName = student.name || student.full_name || (student.first_name && student.last_name ? `${student.first_name} ${student.last_name}` : student.userName) || 'Scholar';
                        return (
                            <div key={student.id} className="bg-white rounded-[2.5rem] p-1 shadow-xl shadow-indigo-900/10 border border-slate-100 relative group animate-in slide-in-from-bottom-8 duration-500">
                                <div className="bg-white rounded-[2.2rem] p-8 space-y-8">
                                    {/* Scholar Bio Card */}
                                    <div className="flex items-center justify-between bg-slate-50/50 p-6 rounded-3xl border border-slate-100/50">
                                        <div className="flex items-center gap-5">
                                            <div className="w-16 h-16 bg-white border border-slate-100 rounded-3xl flex items-center justify-center font-black text-[#18216D] text-2xl shadow-sm">
                                                {displayName.substring(0, 1).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-[#18216D] tracking-tight">{displayName}</h4>
                                                <div className="flex items-center gap-4 mt-1.5">
                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                                                        <UserIcon className="w-3.5 h-3.5 text-[#18216D]/40" />
                                                        ID: {student.student_id || 'KIANDA/24/008'}
                                                    </span>
                                                    <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest bg-white px-2.5 py-1 rounded-lg border border-slate-100">
                                                        <ClockIcon className="w-3.5 h-3.5 text-amber-500/60" />
                                                        {submission ? `SUBMITTED: ${new Date(submission.submitted_at).toLocaleDateString()}` : 'PENDING'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        {grades[student.id] && (
                                            <div className="bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100/50 flex items-center gap-2 animate-in zoom-in-95">
                                                <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Marked: {grades[student.id]}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Submission Evidence Card */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-black text-[#18216D] uppercase tracking-widest">Evidence of Work</p>
                                            {(submission?.file || submission?.file_url) && (
                                                <a
                                                    href={submission.file || submission.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="inline-flex items-center gap-2 bg-white text-[#18216D] border border-slate-200 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:border-[#18216D] transition-all shadow-sm group/btn"
                                                >
                                                    <ArrowDownTrayIcon className="w-3.5 h-3.5 group-hover/btn:translate-y-0.5 transition-transform" />
                                                    Handed-In Document
                                                </a>
                                            )}
                                        </div>

                                        <div className="bg-slate-50/30 rounded-3xl p-6 border border-slate-100/50 min-h-[100px] flex flex-col justify-center">
                                            {submission?.text_response ? (
                                                <div className="max-h-32 overflow-y-auto custom-scrollbar pr-4">
                                                    <p className="text-sm font-medium text-slate-600 leading-relaxed italic">
                                                        "{submission.text_response}"
                                                    </p>
                                                </div>
                                            ) : !(submission?.file || submission?.file_url) ? (
                                                <div className="text-center py-4">
                                                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest italic flex items-center justify-center gap-2">
                                                        No digital artifact provided for this outcome.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 text-emerald-500 bg-emerald-50/50 w-fit px-4 py-2 rounded-xl border border-emerald-100/50 mx-auto">
                                                    <CheckCircleIcon className="w-5 h-5" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest">
                                                        Evidence Document Provided
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assessment Matrix Keys */}
                                    <div className="space-y-4 pt-2">
                                        <div className="grid grid-cols-4 gap-4">
                                            {competencyLevels.map((level) => (
                                                <button
                                                    key={level.code}
                                                    type="button"
                                                    onClick={() => handleLevelSelect(student.id, level.code)}
                                                    className={`py-8 rounded-[2rem] border-2 transition-all flex flex-col items-center justify-center gap-3 ${grades[student.id] === level.code
                                                        ? `${level.color} shadow-xl shadow-indigo-900/5 border-transparent ring-4 ring-indigo-500/5 scale-[1.02]`
                                                        : 'bg-white text-slate-300 border-slate-50 hover:border-slate-100 hover:text-slate-500'
                                                        }`}
                                                >
                                                    <span className="text-2xl font-black tracking-tighter">{level.code}</span>
                                                    <span className="text-[9px] font-black uppercase tracking-widest opacity-60 text-center px-4 leading-tight">{level.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="py-20 text-center">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 flex items-center justify-center mx-auto mb-8 border border-slate-50">
                            <AcademicCapIcon className="w-10 h-10 text-[#18216D]/20" />
                        </div>
                        <h4 className="text-2xl font-black text-[#18216D] tracking-tight">
                            {searchQuery ? "No scholars match your search" : "The Matrix is Clear"}
                        </h4>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-3">
                            {searchQuery ? "Try a different name or student ID" : "All scholars for this area have been successfully assessed. The Matrix is Clear."}
                        </p>
                    </div>
                )}
            </div>

            {/* Hub Footer: Batch Finalization */}
            <div className="px-10 py-10 bg-white border-t border-slate-50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 flex items-center gap-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="text-[#18216D]">{Object.values(grades).filter(g => g).length}</span> Students Graded
                        </p>
                        <div className="w-px h-3 bg-slate-200" />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="text-amber-500">{filteredStudents.length}</span> Remaining
                        </p>
                    </div>
                </div>

                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 rounded-2xl"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={submitting || Object.values(grades).filter(g => g).length === 0}
                        className="px-14 py-5 bg-[#18216D] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#0D164F] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_-5px_rgba(24,33,109,0.3)] disabled:opacity-30 disabled:hover:scale-100 flex items-center gap-3"
                    >
                        {submitting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>AUTHENTICATING...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>FINALIZE ALL ASSESSMENTS</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeForm;
