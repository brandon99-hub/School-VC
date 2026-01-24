import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAppState } from '../context/AppStateContext';
import { XMarkIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const GradeForm = ({ assignmentId, onClose }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [assignment, setAssignment] = useState(null);
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const competencyLevels = [
        { code: 'EE', label: 'Exceeding', color: 'bg-[#FFC425]', textColor: 'text-[#18216D]' },
        { code: 'ME', label: 'Meeting', color: 'bg-[#18216D]', textColor: 'text-white' },
        { code: 'AE', label: 'Approaching', color: 'bg-slate-200', textColor: 'text-slate-700' },
        { code: 'BE', label: 'Below', color: 'bg-rose-100', textColor: 'text-rose-700' }
    ];

    useEffect(() => {
        const fetchData = async () => {
            try {
                const assignData = await get(`/api/assignments/${assignmentId}/`);
                setAssignment(assignData);

                const endpoint = assignData.course
                    ? `/api/courses/${assignData.course}/students/`
                    : `/api/cbc/learning-areas/${assignData.learning_area}/students/`;

                const studentData = await get(endpoint);
                setStudents(studentData);

                // Initialize grades with existing values if any (placeholder for now)
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
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const studentsToGrade = Object.entries(grades).filter(([_, level]) => level !== '');

        if (studentsToGrade.length === 0) {
            showToast('No assessments selected', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await Promise.all(studentsToGrade.map(async ([studentId, level]) => {
                // 1. Create Competency Assessment
                await post('/api/cbc/competency-assessments/', {
                    student: studentId,
                    learning_outcome: assignment.learning_outcome,
                    competency_level: level,
                    teacher: assignment.teacher,
                    teacher_comment: "Batch graded from dashboard.",
                    evidence: `Dashboard Quick Grade: ${assignment.title}`
                });
            }));

            showToast(`Recorded assessments for ${studentsToGrade.length} scholars`);
            onClose();
        } catch (err) {
            console.error('Error submitting assessments:', err);
            showToast('Failed to record some assessments', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="p-20 text-center">
            <div className="w-12 h-12 border-4 border-[#18216D]/10 border-t-[#18216D] rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Retrieving Scholars...</p>
        </div>
    );

    return (
        <div className="bg-white rounded-[2.5rem] overflow-hidden flex flex-col max-h-[85vh]">
            {/* Branded Header */}
            <div className="bg-[#18216D] px-10 py-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative z-10 flex justify-between items-center">
                    <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-1">Competency Evaluation</p>
                        <h3 className="text-2xl font-black tracking-tight">{assignment?.title}</h3>
                        <p className="text-[10px] font-medium opacity-60 mt-1 uppercase tracking-widest">
                            {assignment?.strand_name} • {assignment?.sub_strand_name}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Student List */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-4">
                {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-[#18216D] border border-slate-100 shadow-sm">
                                {student.name?.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <p className="text-sm font-black text-[#18216D]">{student.name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">ID: {student.student_id}</p>
                            </div>
                        </div>

                        <div className="flex gap-1.5">
                            {competencyLevels.map((level) => (
                                <button
                                    key={level.code}
                                    type="button"
                                    onClick={() => handleLevelSelect(student.id, level.code)}
                                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${grades[student.id] === level.code
                                            ? `${level.color} ${level.textColor} shadow-lg shadow-indigo-900/10 scale-110`
                                            : 'bg-white text-slate-300 border border-slate-100 hover:border-[#18216D]/20 hover:text-slate-500'
                                        }`}
                                >
                                    {level.code}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </form>

            {/* Footer Actions */}
            <div className="px-10 py-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest italic">
                    Quick-marking {Object.values(grades).filter(g => g).length} scholars
                </p>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#18216D] transition-colors"
                    >
                        Dismiss
                    </button>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0D164F] transition-all shadow-xl shadow-indigo-900/20 flex items-center gap-2"
                    >
                        {submitting ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Recording...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="w-5 h-5" />
                                <span>Finalize Assessments</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradeForm;
