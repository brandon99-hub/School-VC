import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import LearningOutcomeSelector from './LearningOutcomeSelector';
import {
    PlusIcon,
    TrashIcon,
    XMarkIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const QuizBuilder = ({ lessonId, courseId, quiz, onClose, onSave }) => {
    const { get, post, put, del } = useApi();
    const { showToast } = useAppState();
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'questions'
    const [savedQuiz, setSavedQuiz] = useState(quiz);

    const [strands, setStrands] = useState([]);
    const [selectedStrand, setSelectedStrand] = useState(quiz?.strand_id || null);
    const [selectedOutcomes, setSelectedOutcomes] = useState(
        quiz?.tested_outcomes_detail?.length > 0
            ? quiz.tested_outcomes_detail.map(o => ({
                id: o.id,
                description: o.description,
                code: o.code,
                sub_strand_id: o.sub_strand_id
            }))
            : (quiz?.learning_outcome ? [{
                id: quiz.learning_outcome,
                description: quiz.learning_outcome_description || 'Selected Outcome',
                sub_strand_id: quiz.sub_strand_id
            }] : [])
    );

    const [formData, setFormData] = useState({
        title: quiz?.title || '',
        instructions: quiz?.instructions || '',
        time_limit_minutes: quiz?.time_limit_minutes || 0,
        max_attempts: quiz?.max_attempts || 1,
        is_published: quiz?.is_published || false,
        due_date: quiz?.due_date ? new Date(quiz.due_date).toISOString().slice(0, 16) : '',
    });

    const [questions, setQuestions] = useState(quiz?.questions || []);
    const [editingQuestion, setEditingQuestion] = useState(null);

    useEffect(() => {
        if (quiz?.questions) {
            setQuestions(quiz.questions);
        }

        // Sync outcomes when quiz prop changes or is loaded
        if (quiz) {
            if (quiz.tested_outcomes_detail?.length > 0) {
                setSelectedOutcomes(quiz.tested_outcomes_detail.map(o => ({
                    id: o.id,
                    description: o.description,
                    code: o.code,
                    sub_strand_id: o.sub_strand_id
                })));
            } else if (quiz.learning_outcome) {
                setSelectedOutcomes([{
                    id: quiz.learning_outcome,
                    description: quiz.learning_outcome_description || 'Selected Outcome',
                    sub_strand_id: quiz.sub_strand_id
                }]);
            }

            if (quiz.strand_id) {
                setSelectedStrand(quiz.strand_id);
            }
        }

        // Fetch strands for selector
        const fetchStrands = async () => {
            try {
                const response = await get(`/api/cbc/learning-areas/${courseId}/strands/`);
                setStrands(Array.isArray(response) ? response : []);
            } catch (error) {
                console.error('Error fetching strands:', error);
            }
        };
        fetchStrands();
    }, [quiz, courseId, get]);

    const handleSettingsChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                lesson: lessonId,
                learning_area: courseId,
                learning_outcome: selectedOutcomes[0]?.id, // Fallback
                tested_outcomes: selectedOutcomes.map(o => o.id)
            };

            if (savedQuiz) {
                const response = await put(`/teachers/api/quizzes/${savedQuiz.id}/`, payload);
                setSavedQuiz(response);
                showToast('Quiz configuration updated successfully!');
                onClose(); // Auto-close as requested
            } else {
                const response = await post(`/teachers/api/lessons/${lessonId}/quizzes/`, payload);
                setSavedQuiz(response);
                showToast('Quiz created! Now add some questions.');
                setActiveTab('questions');
            }
            onSave(); // Refresh course data
        } catch (error) {
            console.error('Error saving quiz:', error);
            showToast('Failed to save quiz', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddQuestion = () => {
        setEditingQuestion({
            prompt: '',
            question_type: 'multiple_choice',
            choices: ['', ''], // Start with minimum 2 choices
            correct_answer: 0,
            points: 1,
            order: questions.length + 1
        });
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const quizId = savedQuiz.id;
            const isNew = !editingQuestion.id;

            if (!isNew) {
                await put(`/teachers/api/quizzes/${quizId}/questions/${editingQuestion.id}/`, editingQuestion);
                showToast('Question updated!');
            } else {
                await post(`/teachers/api/quizzes/${quizId}/questions/`, editingQuestion);
                showToast('Question added! You can now add another.');
            }

            // Refresh local questions
            const updatedQuiz = await get(`/teachers/api/quizzes/${quizId}/`);
            setQuestions(updatedQuiz.questions || []);

            if (isNew) {
                // Immediately prepare a fresh form for the next question
                setEditingQuestion({
                    prompt: '',
                    question_type: 'multiple_choice',
                    choices: ['', ''],
                    correct_answer: 0,
                    points: 1,
                    order: (updatedQuiz.questions?.length || 0) + 1
                });
            } else {
                // If it was an edit, return to the list
                setEditingQuestion(null);
            }
            onSave();
        } catch (error) {
            console.error('Error saving question:', error);
            showToast('Failed to save question', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await del(`/teachers/api/quizzes/${savedQuiz.id}/questions/${qId}/`);
            showToast('Question deleted');
            const updatedQuiz = await get(`/teachers/api/quizzes/${savedQuiz.id}/`);
            setQuestions(updatedQuiz.questions || []);
            onSave();
        } catch (error) {
            showToast('Failed to delete question', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[200] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2.5rem] shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-10 py-8 border-b border-gray-100 flex items-center justify-between bg-slate-50">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#18216D] mb-1">Competency Assessment Builder</p>
                        <h2 className="text-3xl font-black text-[#18216D] tracking-tight">
                            {savedQuiz ? `Editing: ${savedQuiz.title}` : 'New Assessment'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-red-500 hover:border-red-100 transition-all shadow-sm">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex px-10 border-b border-gray-100 space-x-10 bg-white">
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`py-5 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'settings' ? 'border-[#18216D] text-[#18216D]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                    >
                        Assessment Configuration
                    </button>
                    {savedQuiz && (
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`py-5 text-xs font-black uppercase tracking-widest border-b-4 transition-all ${activeTab === 'questions' ? 'border-[#18216D] text-[#18216D]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                        >
                            Question Bank ({questions.length})
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                    {activeTab === 'settings' ? (
                        <form onSubmit={handleSaveSettings} className="space-y-10 max-w-3xl">
                            {/* CBC Integration */}
                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center text-sm">1</span>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">Curriculum Mapping</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Curriculum Strand</label>
                                        <select
                                            value={selectedStrand || ''}
                                            onChange={(e) => {
                                                setSelectedStrand(e.target.value);
                                                setSelectedOutcomes([]);
                                            }}
                                            className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                                        >
                                            <option value="">Select a strand...</option>
                                            {strands.map(s => (
                                                <option key={s.id} value={s.id}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedStrand && (
                                        <div className="md:col-span-2">
                                            <LearningOutcomeSelector
                                                learningAreaId={courseId}
                                                strandId={selectedStrand}
                                                selectedOutcomes={selectedOutcomes}
                                                multiple={true}
                                                onChange={setSelectedOutcomes}
                                            />
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className="flex items-center gap-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-sm">2</span>
                                    <h3 className="font-black text-gray-900 uppercase tracking-widest text-xs">General Details</h3>
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text" name="title" value={formData.title} onChange={handleSettingsChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                                        placeholder="Assessment Title (e.g., Mathematics End of Term Quiz)" required
                                    />
                                    <textarea
                                        name="instructions" value={formData.instructions} onChange={handleSettingsChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none h-32 resize-none"
                                        placeholder="Clear instructions for the scholar..."
                                    />
                                </div>
                            </section>

                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Time Limit (Min)</label>
                                    <input
                                        type="number" name="time_limit_minutes" value={formData.time_limit_minutes} onChange={handleSettingsChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                                        min="0"
                                    />
                                    <p className="text-[10px] text-slate-400 mt-2 italic ml-1">Set to 0 for unlimited time</p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Allowed Attempts</label>
                                    <input
                                        type="number" name="max_attempts" value={formData.max_attempts} onChange={handleSettingsChange}
                                        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-gray-900 outline-none"
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div className="bg-[#18216D]/5 p-6 rounded-2xl border border-[#18216D]/10 space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Assessment Deadline (Due Date)</label>
                                    <input
                                        type="datetime-local" name="due_date" value={formData.due_date} onChange={handleSettingsChange}
                                        className="w-full px-5 py-4 bg-white border-2 border-transparent focus:border-[#18216D] rounded-2xl transition-all font-bold text-gray-900 outline-none"
                                    />
                                </div>
                                <label className="flex items-center space-x-4 cursor-pointer group">
                                    <input
                                        type="checkbox" name="is_published" checked={formData.is_published} onChange={handleSettingsChange}
                                        className="w-6 h-6 text-[#18216D] rounded-lg border-gray-300 focus:ring-[#18216D] transition-shadow"
                                    />
                                    <span className="text-sm font-black text-[#18216D] group-hover:text-[#0D164F] transition-colors uppercase tracking-widest">Publish assessment immediately</span>
                                </label>
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit" disabled={submitting}
                                    className="px-10 py-5 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-[#0D164F] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                                >
                                    {submitting ? 'Authenticating...' : (savedQuiz ? 'Update Configuration' : 'Create & Add Questions')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {editingQuestion ? (
                                <form onSubmit={handleSaveQuestion} className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 animate-in slide-in-from-top-4 duration-300">
                                    <div className="flex items-center justify-between mb-8">
                                        <h4 className="text-xl font-black text-[#18216D] tracking-tight">
                                            {editingQuestion.id ? 'Edit Question' : 'New Multiple Choice Question'}
                                        </h4>
                                        <button type="button" onClick={() => setEditingQuestion(null)} className="text-slate-400 hover:text-red-500 font-black uppercase text-[10px] tracking-widest">
                                            Discard Change
                                        </button>
                                    </div>
                                    <div className="space-y-8">
                                        <div>
                                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Question Prompt</label>
                                            <textarea
                                                value={editingQuestion.prompt}
                                                onChange={e => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                                                className="w-full px-5 py-4 bg-white border-2 border-transparent focus:border-[#18216D] rounded-2xl transition-all font-bold text-gray-900 outline-none h-28 shadow-sm"
                                                placeholder="Define the problem..." required
                                            />
                                        </div>
                                        <div>
                                            <div className="flex items-center justify-between mb-4 ml-1">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Assessment Options & Key</label>
                                                {editingQuestion.choices.length < 6 && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newChoices = [...editingQuestion.choices, ''];
                                                            setEditingQuestion({ ...editingQuestion, choices: newChoices });
                                                        }}
                                                        className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700"
                                                    >
                                                        + Add Option
                                                    </button>
                                                )}
                                            </div>
                                            <div className="space-y-3">
                                                {editingQuestion.choices.map((choice, index) => (
                                                    <div key={index} className="flex items-center space-x-4 group/choice">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: index })}
                                                            className={`flex-shrink-0 w-10 h-10 rounded-xl transition-all flex items-center justify-center ${editingQuestion.correct_answer === index ? 'text-white bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-white text-slate-200 border-2 border-slate-50 hover:border-slate-200'}`}
                                                        >
                                                            {editingQuestion.correct_answer === index ? <CheckCircleIconSolid className="w-6 h-6" /> : <div className="w-4 h-4 bg-transparent border-2 border-current rounded-full" />}
                                                        </button>
                                                        <div className="flex-1 relative">
                                                            <input
                                                                type="text" value={choice}
                                                                onChange={e => {
                                                                    const newChoices = [...editingQuestion.choices];
                                                                    newChoices[index] = e.target.value;
                                                                    setEditingQuestion({ ...editingQuestion, choices: newChoices });
                                                                }}
                                                                className={`w-full px-5 py-4 border-2 rounded-2xl outline-none transition-all font-bold text-sm ${editingQuestion.correct_answer === index ? 'border-emerald-100 bg-emerald-50/30' : 'border-transparent bg-white shadow-sm'}`}
                                                                placeholder={`Option ${index + 1}`} required
                                                            />
                                                            {editingQuestion.choices.length > 2 && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const newChoices = editingQuestion.choices.filter((_, i) => i !== index);
                                                                        let newCorrect = editingQuestion.correct_answer;
                                                                        if (newCorrect === index) newCorrect = 0;
                                                                        else if (newCorrect > index) newCorrect -= 1;
                                                                        setEditingQuestion({ ...editingQuestion, choices: newChoices, correct_answer: newCorrect });
                                                                    }}
                                                                    className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover/choice:opacity-100 transition-all"
                                                                >
                                                                    <TrashIcon className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex gap-4 pt-6">
                                            <button
                                                type="submit" disabled={submitting}
                                                className="px-8 py-4 bg-[#18216D] text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#0D164F] transition-all shadow-lg"
                                            >
                                                {submitting ? 'Saving...' : 'Save Question'}
                                            </button>
                                            <button
                                                type="button" onClick={() => setEditingQuestion(null)}
                                                className="px-8 py-4 bg-white text-slate-400 border border-slate-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-100 transition-all"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <button
                                        onClick={handleAddQuestion}
                                        className="w-full flex items-center justify-center space-x-3 p-8 border-2 border-dashed border-slate-100 rounded-[2.5rem] text-slate-300 hover:border-[#18216D] hover:text-[#18216D] hover:bg-slate-50 transition-all group"
                                    >
                                        <PlusIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <span className="font-black uppercase tracking-[0.2em] text-xs">Append New Question</span>
                                    </button>

                                    <div className="space-y-4">
                                        {questions.map((q, idx) => (
                                            <div key={q.id} className="flex items-center space-x-6 p-6 bg-white border border-slate-100 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all group">
                                                <div className="flex-shrink-0 text-[10px] font-black text-slate-300 uppercase tracking-widest bg-slate-50 w-12 h-12 flex items-center justify-center rounded-2xl">
                                                    #{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[#18216D] font-black truncate text-sm">{q.prompt}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase font-black tracking-widest">{q.points} Point Assessment • Multiple Choice</p>
                                                </div>
                                                <div className="flex items-center space-x-3 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button onClick={() => setEditingQuestion(q)} className="p-3 text-blue-600 hover:bg-blue-50 bg-slate-50 rounded-xl transition-all">
                                                        <Bars3Icon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-3 text-red-600 hover:bg-red-50 bg-slate-50 rounded-xl transition-all">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QuizBuilder;
