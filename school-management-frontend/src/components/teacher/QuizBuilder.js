import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    PlusIcon,
    TrashIcon,
    CheckCircleIcon,
    XMarkIcon,
    Bars3Icon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const QuizBuilder = ({ lessonId, quiz, onClose, onSave }) => {
    const { post, put, del } = useApi();
    const { showToast } = useAppState();
    const isEditMode = Boolean(quiz);
    const [submitting, setSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' or 'questions'

    const [formData, setFormData] = useState({
        title: quiz?.title || '',
        instructions: quiz?.instructions || '',
        time_limit_minutes: quiz?.time_limit_minutes || 0,
        max_attempts: quiz?.max_attempts || 1,
        is_published: quiz?.is_published || false,
    });

    const [questions, setQuestions] = useState(quiz?.questions || []);
    const [editingQuestion, setEditingQuestion] = useState(null);

    useEffect(() => {
        if (quiz?.questions) {
            setQuestions(quiz.questions);
        }
    }, [quiz]);

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
            const payload = { ...formData, lesson: lessonId };
            if (isEditMode) {
                await put(`/api/teacher/quizzes/${quiz.id}/`, payload);
                showToast('Quiz settings updated!');
            } else {
                const response = await post(`/api/teacher/lessons/${lessonId}/quizzes/`, payload);
                showToast('Quiz created! Now add some questions.');
                onSave(response); // Assuming onSave can handle the new quiz
                // Instead of closing, we might want to stay and add questions
                onClose();
            }
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
            choices: ['', '', '', ''],
            correct_answer: 0,
            points: 1,
            order: questions.length + 1
        });
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingQuestion.id) {
                await put(`/api/teacher/quizzes/${quiz.id}/questions/${editingQuestion.id}/`, editingQuestion);
                showToast('Question updated!');
            } else {
                await post(`/api/teacher/quizzes/${quiz.id}/questions/`, editingQuestion);
                showToast('Question added!');
            }
            // Refresh quiz data (this is simplified, ideally the parent re-fetches)
            onSave();
            setEditingQuestion(null);
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
            await del(`/api/teacher/quizzes/${quiz.id}/questions/${qId}/`);
            showToast('Question deleted');
            onSave();
        } catch (error) {
            showToast('Failed to delete question', 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {isEditMode ? `Editing: ${quiz.title}` : 'Build New Quiz'}
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">Create an interactive assessment for your students</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                        <XMarkIcon className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {/* Tabs */}
                {isEditMode && (
                    <div className="flex px-8 border-b border-gray-100 space-x-8 bg-white">
                        <button
                            onClick={() => setActiveTab('settings')}
                            className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Quiz Settings
                        </button>
                        <button
                            onClick={() => setActiveTab('questions')}
                            className={`py-4 text-sm font-bold border-b-2 transition-colors ${activeTab === 'questions' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Questions ({questions.length})
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-8">
                    {activeTab === 'settings' ? (
                        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-transform uppercase">Quiz Title</label>
                                <input
                                    type="text" name="title" value={formData.title} onChange={handleSettingsChange}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                    placeholder="e.g., Python Basics Mastery Test" required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 text-transform uppercase">Instructions</label>
                                <textarea
                                    name="instructions" value={formData.instructions} onChange={handleSettingsChange}
                                    className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none h-32"
                                    placeholder="Tell students what to expect..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 text-transform uppercase">Time Limit (mins)</label>
                                    <input
                                        type="number" name="time_limit_minutes" value={formData.time_limit_minutes} onChange={handleSettingsChange}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        min="0"
                                    />
                                    <p className="text-xs text-gray-400 mt-2 italic">Set to 0 for unlimited time</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2 text-transform uppercase">Max Attempts</label>
                                    <input
                                        type="number" name="max_attempts" value={formData.max_attempts} onChange={handleSettingsChange}
                                        className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                                        min="1"
                                    />
                                </div>
                            </div>
                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <label className="flex items-center space-x-3 cursor-pointer group">
                                    <input
                                        type="checkbox" name="is_published" checked={formData.is_published} onChange={handleSettingsChange}
                                        className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-shadow"
                                    />
                                    <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors">Publish this quiz immediately</span>
                                </label>
                            </div>
                            <div className="pt-6">
                                <button
                                    type="submit" disabled={submitting}
                                    className="w-full sm:w-auto px-10 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg hover:shadow-black/20 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : (isEditMode ? 'Update Quiz' : 'Create & Continue')}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6">
                            {editingQuestion ? (
                                <form onSubmit={handleSaveQuestion} className="bg-gray-50 p-8 rounded-2xl border border-gray-200 shadow-inner">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="text-lg font-bold text-gray-900">
                                            {editingQuestion.id ? 'Edit Question' : 'New Multiple Choice Question'}
                                        </h4>
                                        <button type="button" onClick={() => setEditingQuestion(null)} className="text-gray-400 hover:text-gray-600">
                                            Cancel
                                        </button>
                                    </div>
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-tight">Question Prompt</label>
                                            <textarea
                                                value={editingQuestion.prompt}
                                                onChange={e => setEditingQuestion({ ...editingQuestion, prompt: e.target.value })}
                                                className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none h-24 shadow-sm"
                                                placeholder="Ask your question here..." required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-tight">Options & Correct Answer</label>
                                            <div className="space-y-3">
                                                {editingQuestion.choices.map((choice, index) => (
                                                    <div key={index} className="flex items-center space-x-3 group">
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditingQuestion({ ...editingQuestion, correct_answer: index })}
                                                            className={`flex-shrink-0 p-1.5 rounded-full transition-all ${editingQuestion.correct_answer === index ? 'text-green-600 bg-green-50' : 'text-gray-300 hover:text-gray-400'}`}
                                                        >
                                                            {editingQuestion.correct_answer === index ? <CheckCircleIconSolid className="w-8 h-8" /> : <CheckCircleIcon className="w-8 h-8" />}
                                                        </button>
                                                        <input
                                                            type="text" value={choice}
                                                            onChange={e => {
                                                                const newChoices = [...editingQuestion.choices];
                                                                newChoices[index] = e.target.value;
                                                                setEditingQuestion({ ...editingQuestion, choices: newChoices });
                                                            }}
                                                            className={`flex-1 px-5 py-3 border rounded-xl outline-none transition-all ${editingQuestion.correct_answer === index ? 'border-green-200 bg-white ring-2 ring-green-100' : 'border-gray-200 bg-white'}`}
                                                            placeholder={`Option ${index + 1}`} required
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="flex space-x-4 pt-4">
                                            <button
                                                type="submit" disabled={submitting}
                                                className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-md"
                                            >
                                                {submitting ? 'Saving...' : 'Save Question'}
                                            </button>
                                            <button
                                                type="button" onClick={() => setEditingQuestion(null)}
                                                className="px-8 py-3 bg-white text-gray-700 border border-gray-200 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm"
                                            >
                                                Discard
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    <button
                                        onClick={handleAddQuestion}
                                        className="w-full flex items-center justify-center space-x-2 p-6 border-2 border-dashed border-gray-200 rounded-2xl text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-all group"
                                    >
                                        <PlusIcon className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                        <span className="font-bold">Add Question</span>
                                    </button>

                                    <div className="space-y-3">
                                        {questions.map((q, idx) => (
                                            <div key={q.id} className="flex items-center space-x-4 p-5 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
                                                <div className="flex-shrink-0 text-xs font-black text-gray-300 uppercase tracking-widest bg-gray-50 w-10 h-10 flex items-center justify-center rounded-lg">
                                                    Q{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-gray-900 font-bold truncate">{q.prompt}</p>
                                                    <p className="text-xs text-gray-400 mt-1 uppercase font-semibold">{q.points} Point{q.points !== 1 ? 's' : ''} • Multiple Choice</p>
                                                </div>
                                                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => setEditingQuestion(q)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shadow-sm bg-white">
                                                        <Bars3Icon className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleDeleteQuestion(q.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors shadow-sm bg-white">
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
