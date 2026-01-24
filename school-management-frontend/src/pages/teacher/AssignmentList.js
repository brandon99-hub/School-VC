import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import AssignmentCreator from '../../components/teacher/AssignmentCreator';
import RubricGrading from '../../components/teacher/RubricGrading';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';

const AssignmentList = ({ courseId }) => {
    const { get, del } = useApi();
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreator, setShowCreator] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState(null);
    const [gradingAssignment, setGradingAssignment] = useState(null);
    const [gradingSubmissions, setGradingSubmissions] = useState([]);
    const [currentSubmissionIndex, setCurrentSubmissionIndex] = useState(0);

    useEffect(() => {
        fetchAssignments();
    }, [courseId]);

    const fetchAssignments = async () => {
        try {
            setLoading(true);
            const response = await get(`/api/cbc/learning-areas/${courseId}/assignments/`);
            setAssignments(response || []);
        } catch (error) {
            console.error('Error fetching assignments:', error);
            setAssignments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAssignment = () => {
        setEditingAssignment(null);
        setShowCreator(true);
    };

    const handleEditAssignment = (assignment) => {
        setEditingAssignment(assignment);
        setShowCreator(true);
    };

    const handleDeleteAssignment = async (assignment) => {
        if (!window.confirm(`Are you sure you want to delete "${assignment.title}"?`)) {
            return;
        }

        try {
            await del(`/api/assignments/${assignment.id}/`);
            fetchAssignments();
        } catch (error) {
            console.error('Error deleting assignment:', error);
            alert('Failed to delete assignment');
        }
    };

    const handleGradeWithRubric = async (assignment) => {
        try {
            // Fetch submissions for this assignment
            const response = await get(`/api/assignments/${assignment.id}/submissions/`);
            setGradingSubmissions(response || []);
            setGradingAssignment(assignment);
            setCurrentSubmissionIndex(0);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            alert('Failed to load submissions');
        }
    };

    const handleNextSubmission = () => {
        if (currentSubmissionIndex < gradingSubmissions.length - 1) {
            setCurrentSubmissionIndex(currentSubmissionIndex + 1);
        }
    };

    const handleGradingComplete = () => {
        // Refresh assignments to update submission counts
        fetchAssignments();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending': return 'bg-yellow-100 text-yellow-800';
            case 'Submitted': return 'bg-blue-100 text-blue-800';
            case 'Graded': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isOverdue = (dueDate) => {
        return new Date(dueDate) < new Date();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18216D]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Assignments</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Manage course assignments and track submissions
                    </p>
                </div>
                <button
                    onClick={handleCreateAssignment}
                    className="px-6 py-3 bg-[#18216D] text-white rounded-xl hover:bg-[#0D164F] transition-all font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-900/10 flex items-center space-x-2"
                >
                    <PlusIcon className="w-5 h-5" />
                    <span>Create Assignment</span>
                </button>
            </div>

            {/* Empty State */}
            {assignments.length === 0 ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                    <div className="flex justify-center mb-4">
                        <DocumentTextIcon className="h-16 w-16 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No assignments yet</h3>
                    <p className="text-slate-400 mb-8 font-medium italic">
                        The course workspace is ready. Launch your first assignment to begin assessing student competencies.
                    </p>
                    <button
                        onClick={handleCreateAssignment}
                        className="px-10 py-4 bg-[#18216D] text-white rounded-2xl hover:bg-[#0D164F] transition-all font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20"
                    >
                        Create Your First Assignment
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {assignments.map((assignment) => (
                        <div key={assignment.id} className="bg-white rounded-xl border border-gray-200 hover:shadow-xl hover:shadow-indigo-900/5 transition-all p-6 group">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                                            {assignment.status}
                                        </span>
                                        {isOverdue(assignment.due_date) && assignment.status === 'Pending' && (
                                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                                Overdue
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{assignment.description}</p>
                                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <span>Due: {new Date(assignment.due_date).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span>{assignment.total_marks} marks</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                                            </svg>
                                            <span>0 submissions</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center space-x-2 ml-4">
                                    {/* Grade with Rubric button (only for CBC assignments) */}
                                    {assignment.is_cbc_assignment && (
                                        <button
                                            onClick={() => handleGradeWithRubric(assignment)}
                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                            title="Grade with CBC Rubric"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                            </svg>
                                        </button>
                                    )}
                                    <Link
                                        to={`/teacher/assignments/${assignment.id}/submissions`}
                                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                        title="View submissions"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                    </Link>
                                    <button
                                        onClick={() => handleEditAssignment(assignment)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Edit assignment"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteAssignment(assignment)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Delete assignment"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Rubric Grading Modal */}
            {gradingAssignment && gradingSubmissions.length > 0 && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">Grade with CBC Rubric</h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Student {currentSubmissionIndex + 1} of {gradingSubmissions.length}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setGradingAssignment(null);
                                    setGradingSubmissions([]);
                                    setCurrentSubmissionIndex(0);
                                }}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Rubric Grading Component */}
                        <div className="p-6">
                            <RubricGrading
                                submission={gradingSubmissions[currentSubmissionIndex]}
                                assignment={gradingAssignment}
                                onGraded={handleGradingComplete}
                                onNext={handleNextSubmission}
                                hasNext={currentSubmissionIndex < gradingSubmissions.length - 1}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Creator Modal */}
            {showCreator && (
                <AssignmentCreator
                    courseId={courseId}
                    assignment={editingAssignment}
                    onClose={() => {
                        setShowCreator(false);
                        setEditingAssignment(null);
                    }}
                    onSave={fetchAssignments}
                />
            )}
        </div>
    );
};

export default AssignmentList;
