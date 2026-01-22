import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAppState } from '../context/AppStateContext';

const GradeForm = ({ assignmentId, onClose }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [students, setStudents] = useState([]);
    const [grades, setGrades] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const assignment = await get(`/api/assignments/${assignmentId}/`);
                const data = await get(`/api/courses/${assignment.course}/students/`);
                setStudents(data);
                const initialGrades = {};
                data.forEach((student) => {
                    initialGrades[student.id] = '';
                });
                setGrades(initialGrades);
            } catch (err) {
                console.error('Error fetching students:', err);
                setError('Failed to load students. Please try again.');
                showToast('Failed to load students', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [get, assignmentId, showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            for (const [studentId, score] of Object.entries(grades)) {
                if (score) {
                    await post('/api/courses/grades/', {
                        student: studentId,
                        assignment: assignmentId,
                        score
                    });
                }
            }
            showToast('Grades submitted successfully!');
            onClose();
        } catch (err) {
            console.error('Error submitting grades:', err);
            setError('Failed to submit grades. Please try again.');
            showToast('Failed to submit grades', 'error');
        }
    };

    if (loading) return <div className="text-center py-8">Loading students...</div>;
    if (error) return <div className="text-red-500 p-4">{error}</div>;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Grade Students</h3>
            <form onSubmit={handleSubmit}>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Student
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {students.map((student) => (
                                <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {student.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={grades[student.id]}
                                            onChange={(e) =>
                                                setGrades({ ...grades, [student.id]: e.target.value })
                                            }
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                        Submit Grades
                    </button>
                </div>
            </form>
        </div>
    );
};

export default GradeForm;