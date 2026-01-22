import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const AssignmentSubmission = ({ assignment, onClose, onSubmit }) => {
    const { post } = useApi();
    const { showToast } = useAppState();
    const [file, setFile] = useState(null);
    const [textSubmission, setTextSubmission] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file && !textSubmission.trim()) {
            showToast('Please provide a file or text submission', 'error');
            return;
        }

        try {
            setSubmitting(true);
            const formData = new FormData();
            formData.append('assignment', assignment.id);
            formData.append('text_submission', textSubmission);
            if (file) {
                formData.append('file', file);
            }

            await post('/courses/assignment-submissions/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            showToast('Assignment submitted successfully!');
            onSubmit();
            onClose();
        } catch (error) {
            console.error('Error submitting assignment:', error);
            showToast('Failed to submit assignment', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold">Submit Assignment</h2>
                        <h3 className="text-lg text-gray-700 mt-1">{assignment.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload File (Optional)
                        </label>
                        <input
                            type="file"
                            onChange={(e) => setFile(e.target.files[0])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {file && (
                            <p className="mt-2 text-sm text-gray-600">
                                <i className="fas fa-file mr-1"></i>
                                {file.name}
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Text Submission (Optional)
                        </label>
                        <textarea
                            value={textSubmission}
                            onChange={(e) => setTextSubmission(e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Type your submission here..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-spinner fa-spin mr-2"></i>
                                    Submitting...
                                </>
                            ) : (
                                'Submit Assignment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignmentSubmission;
