import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const AssignmentCreator = ({ courseId, assignment, onClose, onSave }) => {
    const { post, put } = useApi();
    const { showToast } = useAppState();
    const isEditMode = Boolean(assignment);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        title: assignment?.title || '',
        description: assignment?.description || '',
        due_date: assignment?.due_date ? assignment.due_date.split('T')[0] : '',
        due_time: assignment?.due_date ? assignment.due_date.split('T')[1]?.substring(0, 5) : '23:59',
        total_marks: assignment?.total_marks || 100,
        submission_types: assignment?.submission_types || ['file'],
        allow_late: assignment?.allow_late || false,
        late_penalty: assignment?.late_penalty || 0,
    });

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

    const handleSubmissionTypeToggle = (type) => {
        setFormData(prev => {
            const types = prev.submission_types.includes(type)
                ? prev.submission_types.filter(t => t !== type)
                : [...prev.submission_types, type];
            return { ...prev, submission_types: types };
        });
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) newErrors.title = 'Assignment title is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.due_date) newErrors.due_date = 'Due date is required';
        if (formData.total_marks < 1) newErrors.total_marks = 'Total marks must be at least 1';
        if (formData.submission_types.length === 0) {
            newErrors.submission_types = 'Select at least one submission type';
        }
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
                course: courseId,
                title: formData.title,
                description: formData.description,
                due_date: `${formData.due_date}T${formData.due_time}:00`,
                total_marks: parseInt(formData.total_marks),
                status: 'Pending',
            };

            if (isEditMode) {
                await put(`/api/assignments/${assignment.id}/`, payload);
                showToast('Assignment updated successfully!');
            } else {
                await post(`/api/assignments/`, payload);
                showToast('Assignment created successfully!');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving assignment:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                showToast('Failed to save assignment', 'error');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {isEditMode ? 'Edit Assignment' : 'Create New Assignment'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Assignment Title *
                        </label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.title ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="e.g., Week 1 Programming Assignment"
                        />
                        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description *
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows="5"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.description ? 'border-red-500' : 'border-gray-300'
                                }`}
                            placeholder="Describe the assignment requirements, objectives, and any special instructions..."
                        />
                        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Date *
                            </label>
                            <input
                                type="date"
                                name="due_date"
                                value={formData.due_date}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.due_date ? 'border-red-500' : 'border-gray-300'
                                    }`}
                            />
                            {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Due Time
                            </label>
                            <input
                                type="time"
                                name="due_time"
                                value={formData.due_time}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Total Marks *
                        </label>
                        <input
                            type="number"
                            name="total_marks"
                            value={formData.total_marks}
                            onChange={handleChange}
                            min="1"
                            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.total_marks ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.total_marks && <p className="text-red-500 text-sm mt-1">{errors.total_marks}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Submission Types *
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.submission_types.includes('file')}
                                    onChange={() => handleSubmissionTypeToggle('file')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">File Upload</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.submission_types.includes('text')}
                                    onChange={() => handleSubmissionTypeToggle('text')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">Text Response</span>
                            </label>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.submission_types.includes('url')}
                                    onChange={() => handleSubmissionTypeToggle('url')}
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <span className="ml-2 text-sm text-gray-700">URL/Link</span>
                            </label>
                        </div>
                        {errors.submission_types && <p className="text-red-500 text-sm mt-1">{errors.submission_types}</p>}
                    </div>

                    <div className="border-t border-gray-200 pt-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="allow_late"
                                checked={formData.allow_late}
                                onChange={handleChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <span className="ml-2 text-sm font-medium text-gray-700">
                                Allow late submissions
                            </span>
                        </label>

                        {formData.allow_late && (
                            <div className="mt-3 ml-6">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Late Penalty (% per day)
                                </label>
                                <input
                                    type="number"
                                    name="late_penalty"
                                    value={formData.late_penalty}
                                    onChange={handleChange}
                                    min="0"
                                    max="100"
                                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-4 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting ? 'Saving...' : (isEditMode ? 'Update Assignment' : 'Create Assignment')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentCreator;
