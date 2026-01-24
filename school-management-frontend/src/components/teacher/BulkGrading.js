import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BulkGrading = () => {
    const { assignmentId } = useParams();
    const navigate = useNavigate();
    const [assignment, setAssignment] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gradedCount, setGradedCount] = useState(0);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        competency_level: '',
        teacher_comment: '',
        evidence: ''
    });

    useEffect(() => {
        fetchAssignmentData();
    }, [assignmentId]);

    useEffect(() => {
        // Keyboard shortcuts
        const handleKeyPress = (e) => {
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;

            switch (e.key) {
                case '1':
                    setFormData(prev => ({ ...prev, competency_level: 'EE' }));
                    break;
                case '2':
                    setFormData(prev => ({ ...prev, competency_level: 'ME' }));
                    break;
                case '3':
                    setFormData(prev => ({ ...prev, competency_level: 'AE' }));
                    break;
                case '4':
                    setFormData(prev => ({ ...prev, competency_level: 'BE' }));
                    break;
                case 'Enter':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleSaveAndNext();
                    }
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [formData, currentIndex]);

    const fetchAssignmentData = async () => {
        try {
            setLoading(true);
            const [assignmentRes, submissionsRes] = await Promise.all([
                axios.get(`/api/courses/assignments/${assignmentId}/`),
                axios.get(`/api/courses/assignments/${assignmentId}/submissions/`)
            ]);

            setAssignment(assignmentRes.data);
            setSubmissions(submissionsRes.data);

            // Check for existing grading session
            const sessionsRes = await axios.get(`/api/cbc/bulk-grading/?assignment=${assignmentId}`);
            if (sessionsRes.data.length > 0) {
                setSession(sessionsRes.data[0]);
                setGradedCount(sessionsRes.data[0].graded_count);
            } else {
                // Create new session
                const newSession = await axios.post('/api/cbc/bulk-grading/', {
                    assignment: assignmentId,
                    total_submissions: submissionsRes.data.length
                });
                setSession(newSession.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAndNext = async () => {
        if (!formData.competency_level) {
            alert('Please select a competency level');
            return;
        }

        if (!formData.evidence.trim()) {
            alert('Please provide evidence description');
            return;
        }

        try {
            const currentSubmission = submissions[currentIndex];

            // Save competency assessment
            await axios.post('/api/cbc/competency-assessments/', {
                student: currentSubmission.student.id,
                learning_outcome: assignment.learning_outcome,
                competency_level: formData.competency_level,
                teacher_comment: formData.teacher_comment,
                evidence: formData.evidence,
                assignment_submission: currentSubmission.id
            });

            // Update session progress
            await axios.post(`/api/cbc/bulk-grading/${session.id}/update-progress/`);

            setGradedCount(prev => prev + 1);

            // Move to next or finish
            if (currentIndex < submissions.length - 1) {
                setCurrentIndex(prev => prev + 1);
                resetForm();
            } else {
                alert('All submissions graded! 🎉');
                navigate(-1);
            }
        } catch (error) {
            console.error('Error saving grade:', error);
            alert('Failed to save grade');
        }
    };

    const handleSkip = () => {
        if (currentIndex < submissions.length - 1) {
            setCurrentIndex(prev => prev + 1);
            resetForm();
        }
    };

    const resetForm = () => {
        setFormData({
            competency_level: '',
            teacher_comment: '',
            evidence: ''
        });
    };

    const currentSubmission = submissions[currentIndex];
    const progressPercentage = submissions.length > 0
        ? Math.round((gradedCount / submissions.length) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!assignment || submissions.length === 0) {
        return (
            <div className="max-w-4xl mx-auto p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                    <p className="text-yellow-800">No submissions to grade</p>
                    <button
                        onClick={() => navigate(-1)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Bulk Grading</h1>
                            <p className="text-sm text-gray-600 mt-1">{assignment.title}</p>
                        </div>
                        <button
                            onClick={() => navigate(-1)}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                        >
                            Exit
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Progress: {gradedCount}/{submissions.length} graded
                            </span>
                            <span className="text-sm font-medium text-gray-700">{progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-8">
                <div className="grid grid-cols-2 gap-6">
                    {/* Left: Submission View */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Student: {currentSubmission.student.first_name} {currentSubmission.student.last_name}
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-600">Submitted:</p>
                                <p className="font-medium">{new Date(currentSubmission.submitted_at).toLocaleString()}</p>
                            </div>

                            {currentSubmission.submission_text && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Submission Text:</p>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-gray-800 whitespace-pre-wrap">{currentSubmission.submission_text}</p>
                                    </div>
                                </div>
                            )}

                            {currentSubmission.file_url && (
                                <div>
                                    <p className="text-sm text-gray-600 mb-2">Attached File:</p>
                                    <a
                                        href={currentSubmission.file_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-700 underline"
                                    >
                                        View Submission File
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right: Grading Form */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Grade Submission</h2>

                        {/* Competency Level Selector */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Competency Level <span className="text-red-500">*</span>
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { value: 'EE', label: 'Exceeding', color: 'green', key: '1' },
                                    { value: 'ME', label: 'Meeting', color: 'blue', key: '2' },
                                    { value: 'AE', label: 'Approaching', color: 'yellow', key: '3' },
                                    { value: 'BE', label: 'Below', color: 'red', key: '4' }
                                ].map(level => (
                                    <button
                                        key={level.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, competency_level: level.value })}
                                        className={`p-4 rounded-lg border-2 transition-all ${formData.competency_level === level.value
                                                ? `border-${level.color}-500 bg-${level.color}-50`
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <div className="font-semibold">{level.value}</div>
                                        <div className="text-sm text-gray-600">{level.label}</div>
                                        <div className="text-xs text-gray-500 mt-1">Press {level.key}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Evidence */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Evidence <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={formData.evidence}
                                onChange={(e) => setFormData({ ...formData, evidence: e.target.value })}
                                rows="3"
                                placeholder="What did the student do to demonstrate this competency?"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>

                        {/* Teacher Comment */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Teacher Comment (Optional)
                            </label>
                            <textarea
                                value={formData.teacher_comment}
                                onChange={(e) => setFormData({ ...formData, teacher_comment: e.target.value })}
                                rows="3"
                                placeholder="Additional feedback for the student..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            ></textarea>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={handleSaveAndNext}
                                disabled={!formData.competency_level || !formData.evidence}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                Save & Next
                            </button>
                            <button
                                onClick={handleSkip}
                                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Skip
                            </button>
                        </div>

                        {/* Keyboard Shortcuts Help */}
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm font-medium text-gray-700 mb-2">⌨️ Keyboard Shortcuts:</p>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p>• Press <kbd className="px-2 py-1 bg-white border rounded">1</kbd> for EE</p>
                                <p>• Press <kbd className="px-2 py-1 bg-white border rounded">2</kbd> for ME</p>
                                <p>• Press <kbd className="px-2 py-1 bg-white border rounded">3</kbd> for AE</p>
                                <p>• Press <kbd className="px-2 py-1 bg-white border rounded">4</kbd> for BE</p>
                                <p>• Press <kbd className="px-2 py-1 bg-white border rounded">Ctrl+Enter</kbd> to Save & Next</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkGrading;
