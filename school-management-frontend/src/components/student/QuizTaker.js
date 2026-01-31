import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    XMarkIcon,
    ClockIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    CheckCircleIcon,
    ArrowPathIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const QuizTaker = ({ quiz, onClose, onComplete }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuizQuestions();
    }, [quiz.id]);

    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const fetchQuizQuestions = async () => {
        try {
            setLoading(true);
            const data = await get(`/courses/quizzes/${quiz.id}/`);
            setQuestions(data.questions || []);
            setTimeRemaining(quiz.time_limit_minutes * 60);
        } catch (error) {
            console.error('Error fetching quiz questions:', error);
            showToast('Failed to load quiz', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            const responses = Object.entries(answers).map(([questionId, answer]) => ({
                question: parseInt(questionId),
                response: answer
            }));

            const submission = await post('/courses/quiz-submissions/', {
                quiz: quiz.id,
                responses
            });

            setResult(submission);
            showToast('Assessment completed successfully!', 'success');

            if (onComplete) {
                onComplete(submission);
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            showToast('Failed to submit quiz', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#18216D]/20 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-[2rem] p-10 shadow-2xl flex flex-col items-center">
                    <ArrowPathIcon className="w-10 h-10 text-[#18216D] animate-spin mb-4" />
                    <p className="text-sm font-black text-[#18216D] uppercase tracking-widest">Preparing Assessment...</p>
                </div>
            </div>
        );
    }

    if (result) {
        const totalPoints = quiz.total_points || questions.length;
        const percentage = Math.round(((result.score || 0) / totalPoints) * 100);
        return (
            <div className="fixed inset-0 bg-[#18216D]/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-[3rem] shadow-2xl max-w-2xl w-full p-10 overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-100 animate-in slide-in-from-bottom-4 duration-700">
                            <CheckBadgeIcon className="w-14 h-14 text-emerald-500" />
                        </div>
                        <h2 className="text-4xl font-black text-[#18216D] mb-2 tracking-tight">Well Done!</h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-8">Assessment Comprehensive Review</p>

                        <div className="bg-slate-50 rounded-[2.5rem] p-8 mb-8 border border-slate-100 flex justify-around">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Final Score</p>
                                <p className="text-3xl font-black text-[#18216D]">
                                    {result.score || 0} <span className="text-slate-300">/</span> {quiz.total_points || questions.length}
                                </p>
                            </div>
                            <div className="w-[1px] bg-slate-200" />
                            <div className="text-center">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Mastery Level</p>
                                <p className="text-3xl font-black text-[#FFC425]">{percentage}%</p>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="w-full py-5 bg-[#18216D] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-[#0D164F] transition-all shadow-xl shadow-indigo-900/20"
                        >
                            Return to Learning Journey
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="fixed inset-0 bg-[#18216D]/40 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto select-none"
            onContextMenu={(e) => e.preventDefault()}
            onCopy={(e) => e.preventDefault()}
        >
            <div className="bg-white rounded-[3rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-white/20 animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="bg-white border-b border-slate-50 px-10 py-6">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="bg-[#18216D]/5 text-[#18216D] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest flex items-center gap-1">
                                    <AcademicCapIcon className="w-3 h-3" /> Knowledge Check
                                </span>
                            </div>
                            <h2 className="text-2xl font-black text-[#18216D] tracking-tight">{quiz.title}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            {timeRemaining !== null && (
                                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs tracking-widest uppercase transition-colors ${timeRemaining < 60 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    <ClockIcon className="w-4 h-4" />
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-50 rounded-xl transition-all text-slate-400 hover:text-rose-500"
                            >
                                <XMarkIcon className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Progress Segmented Bar */}
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden flex">
                        <div
                            className="bg-[#FFC425] h-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(255,196,37,0.5)]"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question Area */}
                <div className="flex-1 overflow-y-auto p-10">
                    {currentQuestion && (
                        <div className="max-w-2xl mx-auto animate-in slide-in-from-right-8 fade-in duration-500">
                            <div className="mb-10 text-center">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-4">Question {currentQuestionIndex + 1} of {questions.length}</p>
                                <h3 className="text-2xl font-black text-[#18216D] leading-tight">{currentQuestion.prompt}</h3>
                            </div>

                            <div className="space-y-4">
                                {currentQuestion.choices && currentQuestion.choices.map((choice, index) => {
                                    const optionLetter = String.fromCharCode(65 + index);
                                    const isSelected = answers[currentQuestion.id] === choice;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerChange(currentQuestion.id, choice)}
                                            className={`w-full group text-left p-6 rounded-[1.5rem] border-2 transition-all duration-300 relative overflow-hidden ${isSelected
                                                ? 'border-[#FFC425] bg-yellow-50/20 shadow-lg shadow-yellow-500/5'
                                                : 'border-slate-100 hover:border-slate-200 hover:bg-slate-50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-5 relative z-10">
                                                <div className={`w-10 h-10 rounded-xl border-2 flex items-center justify-center font-black text-sm transition-all ${isSelected
                                                    ? 'border-[#FFC425] bg-[#FFC425] text-[#18216D]'
                                                    : 'border-slate-200 text-slate-400 group-hover:border-slate-300'
                                                    }`}>
                                                    {isSelected ? <CheckCircleIcon className="w-6 h-6" /> : optionLetter}
                                                </div>
                                                <span className={`font-bold transition-colors ${isSelected ? 'text-[#18216D]' : 'text-slate-600'}`}>{choice}</span>
                                            </div>
                                            {isSelected && <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFC425]/5 rounded-full -mr-8 -mt-8 animate-pulse" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                <div className="bg-white border-t border-slate-50 px-10 py-6">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="group flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-[#18216D] hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeftIcon className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {questions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${index === currentQuestionIndex
                                        ? 'bg-[#FFC425] w-6'
                                        : answers[questions[index]?.id]
                                            ? 'bg-emerald-400'
                                            : 'bg-slate-200'
                                        }`}
                                ></button>
                            ))}
                        </div>

                        {currentQuestionIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-8 py-3 bg-emerald-500 text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 disabled:opacity-50 transition-all shadow-xl shadow-emerald-500/20 flex items-center gap-2"
                            >
                                {submitting ? (
                                    <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Complete Assessment
                                        <CheckCircleIcon className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="group flex items-center gap-2 px-8 py-3 bg-[#18216D] text-white rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest hover:bg-[#0D164F] transition-all shadow-xl shadow-indigo-900/20"
                            >
                                Next
                                <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizTaker;
