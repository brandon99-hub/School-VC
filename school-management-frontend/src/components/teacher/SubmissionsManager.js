import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const SubmissionsManager = ({ assignment, onClose }) => {
    const { get } = useApi();
    const { showToast } = useAppState();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState(null);

    useEffect(() => {
        fetchSubmissions();
    }, [assignment.id]);

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const data = await get(`/api/assignment-submissions/?assignment=${assignment.id}`);
            setSubmissions(data || []);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            showToast('Failed to load submissions', 'error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                    <p className="mt-4 text-gray-600">Loading submissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold">Submissions</h2>
                        <h3 className="text-lg text-gray-700 mt-1">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {submissions.length} student{submissions.length !== 1 ? 's' : ''} submitted
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <i className="fas fa-times text-xl"></i>
                    </button>
                </div>

                {/* Submissions List */}
                <div className="p-6">
                    {submissions.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600 text-lg">No submissions yet</p>
                            <p className="text-gray-500 text-sm mt-2">Students haven't submitted their work for this assignment</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {submissions.map(submission => (
                                <div key={submission.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                    <i className="fas fa-user text-indigo-600"></i>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{submission.student_name || `Student #${submission.student}`}</p>
                                                    <p className="text-sm text-gray-600">
                                                        Submitted: {new Date(submission.submitted_at).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>

                                            {submission.text_submission && (
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-xs uppercase text-gray-500 font-semibold mb-1">Text Submission:</p>
                                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{submission.text_submission}</p>
                                                </div>
                                            )}

                                            {submission.file && (
                                                <div className="mt-3">
                                                    <a
                                                        href={submission.file}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                                                    >
                                                        <i className="fas fa-download"></i>
                                                        Download Submitted File
                                                    </a>
                                                </div>
                                            )}

                                            {submission.grade && (
                                                <div className="mt-3 flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                                        Grade: {submission.grade.score}/{assignment.total_marks}
                                                    </span>
                                                    {submission.grade.letter_grade && (
                                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-semibold">
                                                            {submission.grade.letter_grade}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setSelectedSubmission(submission)}
                                            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 whitespace-nowrap"
                                        >
                                            {submission.grade ? 'Update Grade' : 'Grade'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubmissionsManager;
