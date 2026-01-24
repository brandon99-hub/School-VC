import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const RubricGrading = ({ submission, assignment, onGraded, onNext, hasNext }) => {
    const { post, put } = useApi();
    const { showToast } = useAppState();
    const [competencyLevel, setCompetencyLevel] = useState(submission?.competency_level || '');
    const [comment, setComment] = useState(submission?.competency_comment || '');
    const [submitting, setSubmitting] = useState(false);

    const competencyLevels = [
        {
            code: 'EE',
            label: 'Exceeding Expectations',
            color: 'gold',
            bgColor: 'bg-[#FFC425]/10',
            borderColor: 'border-[#FFC425]',
            textColor: 'text-[#18216D]',
            hoverBorder: 'hover:border-[#FFC425]/50',
            description: 'Demonstrates mastery and application of competency in novel contexts.'
        },
        {
            code: 'ME',
            label: 'Meeting Expectations',
            color: 'navy',
            bgColor: 'bg-[#18216D]/5',
            borderColor: 'border-[#18216D]',
            textColor: 'text-[#18216D]',
            hoverBorder: 'hover:border-[#18216D]/50',
            description: 'Achieves competency independently and consistently as expected.'
        },
        {
            code: 'AE',
            label: 'Approaching Expectations',
            color: 'slate',
            bgColor: 'bg-slate-50',
            borderColor: 'border-slate-300',
            textColor: 'text-slate-700',
            hoverBorder: 'hover:border-slate-400',
            description: 'Demonstrates progression but requires occasional support or practice.'
        },
        {
            code: 'BE',
            label: 'Below Expectations',
            color: 'rose',
            bgColor: 'bg-rose-50',
            borderColor: 'border-rose-200',
            textColor: 'text-rose-700',
            hoverBorder: 'hover:border-rose-300',
            description: 'Requires significant intervention to achieve the required competency.'
        }
    ];

    // Keyboard shortcuts: 1=EE, 2=ME, 3=AE, 4=BE
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case '1': setCompetencyLevel('EE'); break;
                case '2': setCompetencyLevel('ME'); break;
                case '3': setCompetencyLevel('AE'); break;
                case '4': setCompetencyLevel('BE'); break;
                case 'Enter':
                    if (competencyLevel && e.ctrlKey) {
                        handleSave();
                    }
                    break;
                default: break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [competencyLevel]);

    const handleSave = async (saveAndNext = false) => {
        if (!competencyLevel) {
            showToast('Please select a competency level', 'error');
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                competency_level: competencyLevel,
                competency_comment: comment,
                status: 'graded'
            };

            await put(`/api/assignment-submissions/${submission.id}/`, payload);

            if (assignment.learning_outcome) {
                await post('/api/cbc/competency-assessments/', {
                    student: submission.student,
                    learning_outcome: assignment.learning_outcome,
                    competency_level: competencyLevel,
                    teacher: assignment.teacher || submission.teacher,
                    teacher_comment: comment,
                    evidence: `Assignment: ${assignment.title}`,
                    assignment_submission: submission.id
                });
            }

            showToast('Assessment Recorded');
            onGraded();

            if (saveAndNext && hasNext) {
                onNext();
            }
        } catch (error) {
            console.error('Error saving grade:', error);
            showToast('Failed to record assessment', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-10">
            {/* Student Bio Header */}
            <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-[#18216D] text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-900/20">
                        {submission.student_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-[#18216D] tracking-tight">{submission.student_name}</h4>
                        <div className="flex items-center gap-4 mt-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID: {submission.student_id || '24/00863'}</p>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <i className="far fa-clock text-[#FFC425]" />
                                Submitted {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>
                {submission.status === 'Graded' && (
                    <div className="bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Status: Graded</span>
                    </div>
                )}
            </div>

            {/* Competency Level Selector */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Competency Framework</h4>
                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded">Keys: 1-4</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {competencyLevels.map((level) => (
                        <button
                            key={level.code}
                            type="button"
                            onClick={() => setCompetencyLevel(level.code)}
                            className={`p-6 rounded-3xl border-2 transition-all text-left relative overflow-hidden group ${competencyLevel === level.code
                                ? `${level.borderColor} ${level.bgColor} shadow-xl shadow-indigo-900/5`
                                : 'border-slate-100 bg-white hover:border-[#18216D]/20'
                                }`}
                        >
                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`text-xl font-black ${level.textColor}`}>{level.code}</span>
                                    {competencyLevel === level.code && (
                                        <div className={`w-6 h-6 rounded-full ${level.bgColor} border-2 ${level.borderColor} flex items-center justify-center`}>
                                            <div className={`w-2 h-2 rounded-full ${level.borderColor} bg-current`}></div>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs font-black text-[#18216D] uppercase tracking-widest mb-1">{level.label}</div>
                                <div className="text-[10px] font-medium text-slate-400 leading-relaxed italic">{level.description}</div>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Teacher Comment */}
            <div>
                <label className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 block mb-4">
                    Reflective Feedback
                </label>
                <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="6"
                    className="w-full px-6 py-4 bg-slate-50 border-none rounded-[2rem] focus:ring-4 focus:ring-[#18216D]/5 transition-all font-medium text-[#18216D] placeholder-slate-300"
                    placeholder="Describe the student's mastery or areas for growth..."
                />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-50">
                <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                    {hasNext && "Ctrl + Enter for rapid grading"}
                </div>
                <div className="flex gap-4">
                    <button
                        type="button"
                        onClick={() => handleSave(false)}
                        disabled={!competencyLevel || submitting}
                        className="px-10 py-5 bg-slate-100 text-[#18216D] rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#18216D] hover:text-white transition-all disabled:opacity-50"
                    >
                        {submitting ? 'Recording...' : 'Record Outcome'}
                    </button>
                    {hasNext && (
                        <button
                            type="button"
                            onClick={() => handleSave(true)}
                            disabled={!competencyLevel || submitting}
                            className="px-10 py-5 bg-[#18216D] text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#0D164F] transition-all shadow-xl shadow-indigo-900/20"
                        >
                            Next Scholar →
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RubricGrading;
