import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const LessonEditor = ({ moduleId, lesson, onClose, onSave }) => {
    const { post, put } = useApi();
    const { showToast } = useAppState();
    const isEditMode = Boolean(lesson);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        title: '',
        summary: '',
        order: 1,
        duration_minutes: 0,
        is_published: false,
        release_date: '',
    });

    useEffect(() => {
        if (lesson) {
            setFormData({
                title: lesson.title || '',
                summary: lesson.summary || '',
                order: lesson.order || 1,
                duration_minutes: lesson.duration_minutes || 0,
                is_published: lesson.is_published || false,
                release_date: lesson.release_date || '',
            });
        }
    }, [lesson]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Lesson title is required';
        if (formData.order < 1) newErrors.order = 'Order must be at least 1';
        if (formData.duration_minutes < 0) newErrors.duration_minutes = 'Duration cannot be negative';
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            const payload = {
                ...formData,
                release_date: formData.release_date || null,
                module: moduleId,
            };

            if (isEditMode) {
                await put(`/api/teacher/lessons/${lesson.id}/`, payload);
                showToast('Lesson updated successfully!');
            } else {
                await post(`/api/teacher/modules/${moduleId}/lessons/`, payload);
                showToast('Lesson created successfully!');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving lesson:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                showToast('Failed to save lesson', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 tracking-tight">
                        {isEditMode ? 'Edit Sub-strand' : 'Create New Sub-strand'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            Sub-strand Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold ${errors.title ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                                }`}
                            placeholder="e.g., Identifying Proper Fractions"
                        />
                        {errors.title && <p className="text-red-500 text-xs mt-2 font-bold">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            Learning Goals & Summary
                        </label>
                        <textarea
                            name="summary"
                            value={formData.summary}
                            onChange={handleChange}
                            rows="4"
                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium leading-relaxed"
                            placeholder="What competencies will students develop in this sub-strand?"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                Order (In Strand)
                            </label>
                            <input
                                type="number"
                                name="order"
                                value={formData.order}
                                onChange={handleChange}
                                min="1"
                                className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold ${errors.order ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                                    }`}
                            />
                            {errors.order && <p className="text-red-500 text-xs mt-2 font-bold">{errors.order}</p>}
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                                Estimated Duration (Mins)
                            </label>
                            <input
                                type="number"
                                name="duration_minutes"
                                value={formData.duration_minutes}
                                onChange={handleChange}
                                min="0"
                                className={`w-full px-5 py-3 border rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold ${errors.duration_minutes ? 'border-red-500' : 'border-gray-200 focus:border-blue-500'
                                    }`}
                            />
                            {errors.duration_minutes && <p className="text-red-500 text-xs mt-2 font-bold">{errors.duration_minutes}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">
                            Planned Release Date
                        </label>
                        <input
                            type="date"
                            name="release_date"
                            value={formData.release_date}
                            onChange={handleChange}
                            className="w-full px-5 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-bold"
                        />
                    </div>

                    <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <label className="flex items-center space-x-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                name="is_published"
                                checked={formData.is_published}
                                onChange={handleChange}
                                className="w-5 h-5 text-blue-600 rounded-lg border-gray-300 focus:ring-blue-500 transition-all"
                            />
                            <span className="text-sm font-bold text-gray-700 group-hover:text-blue-700 transition-colors">
                                Publish immediately (Visible to Students)
                            </span>
                        </label>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all font-bold"
                        >
                            Discard
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-extrabold shadow-lg shadow-blue-500/20 disabled:opacity-50"
                        >
                            {submitting ? 'Saving...' : (isEditMode ? 'Update Sub-strand' : 'Create Sub-strand')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LessonEditor;
