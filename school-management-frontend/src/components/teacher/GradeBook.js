import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import { PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { calculateLevel, getLevelData } from '../../utils/cbcUtils';

const GradeBook = ({ courseId }) => {
    const { get, put, post } = useApi();
    const { showToast } = useAppState();
    const [gradebook, setGradebook] = useState({ students: [], assignments: [] });
    const [loading, setLoading] = useState(true);
    const [editingCell, setEditingCell] = useState(null); // {studentId, assignmentId}
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        fetchGradebook();
    }, [courseId]);

    const fetchGradebook = async () => {
        try {
            setLoading(true);
            const data = await get(`/courses/api/${courseId}/gradebook/`);
            setGradebook(data);
        } catch (error) {
            console.error('Error fetching gradebook:', error);
            showToast('Failed to load gradebook', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (studentId, assignmentId, currentScore) => {
        setEditingCell({ studentId, assignmentId });
        setEditValue(currentScore !== null && currentScore !== undefined ? currentScore.toString() : '');
    };

    const handleSaveGrade = async (studentId, assignmentId) => {
        const student = gradebook.students.find(s => s.student_id === studentId);
        const gradeData = student?.grades[assignmentId];

        const score = parseFloat(editValue);
        if (isNaN(score) || score < 0) {
            showToast('Please enter a valid score', 'error');
            return;
        }

        try {
            if (gradeData && gradeData.grade_id) {
                // Update existing grade
                await put(`/courses/api/grades/${gradeData.grade_id}/`, {
                    score: score,
                    letter_grade: calculateLetterGrade(score)
                });
            } else {
                // Create new grade
                await post('/courses/api/grades/', {
                    student: studentId,
                    assignment: assignmentId,
                    score: score,
                    letter_grade: calculateLetterGrade(score)
                });
            }

            showToast('Grade saved successfully');
            setEditingCell(null);
            fetchGradebook();
        } catch (error) {
            console.error('Error saving grade:', error);
            showToast('Failed to save grade', 'error');
        }
    };

    const handleCancelEdit = () => {
        setEditingCell(null);
        setEditValue('');
    };

    const calculateLetterGrade = (score) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (gradebook.students.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No students enrolled in this course yet.</p>
            </div>
        );
    }

    if (gradebook.assignments.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No assignments created yet. Create assignments to start grading.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Grade Book</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {gradebook.students.length} students • {gradebook.assignments.length} assignments
                    </p>
                </div>
                <button
                    onClick={fetchGradebook}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    Refresh
                </button>
            </div>

            <div className="overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                                Student
                            </th>
                            {gradebook.assignments.map((assignment) => (
                                <th key={`asgn-${assignment.id}`} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[120px] bg-slate-50/50">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-gray-900">{assignment.title}</span>
                                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest">
                                            {assignment.total_marks} Marks
                                        </span>
                                    </div>
                                </th>
                            ))}
                            {gradebook.quizzes && gradebook.quizzes.map((quiz) => (
                                <th key={`quiz-${quiz.id}`} className="px-6 py-3 text-center text-xs font-medium text-[#18216D]/60 uppercase tracking-wider min-w-[120px] bg-amber-50/30">
                                    <div className="flex flex-col">
                                        <span className="font-black text-[#18216D]">{quiz.title}</span>
                                        <span className="text-[10px] text-amber-600/60 mt-1 font-black uppercase tracking-widest">
                                            Auto-Quiz ({quiz.total_points} pts)
                                        </span>
                                    </div>
                                </th>
                            ))}
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Average
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {gradebook.students.map((student) => {
                            const scores = gradebook.assignments.map(a => {
                                const grade = student.grades[a.id];
                                return grade ? parseFloat(grade.score) : null;
                            }).filter(s => s !== null);
                            const average = scores.length > 0
                                ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
                                : '-';

                            return (
                                <tr key={student.student_id} className="hover:bg-gray-50">
                                    <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap border-r border-gray-200">
                                        <div className="flex flex-col">
                                            <div className="text-sm font-medium text-gray-900">
                                                {student.student_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {student.student_number}
                                            </div>
                                        </div>
                                    </td>
                                    {gradebook.assignments.map((assignment) => {
                                        const gradeData = student.grades[assignment.id];
                                        const isEditing = editingCell?.studentId === student.student_id &&
                                            editingCell?.assignmentId === assignment.id;

                                        return (
                                            <td key={`asgn-${assignment.id}`} className="px-6 py-4 whitespace-nowrap text-center border-r border-gray-50">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <input
                                                            type="number"
                                                            value={editValue}
                                                            onChange={(e) => setEditValue(e.target.value)}
                                                            className="w-20 px-2 py-1 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                            autoFocus
                                                            min="0"
                                                            max={assignment.total_marks}
                                                        />
                                                        <button
                                                            onClick={() => handleSaveGrade(student.student_id, assignment.id)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                        >
                                                            <CheckIcon className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                        >
                                                            <XMarkIcon className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div
                                                        className="group cursor-pointer inline-flex items-center space-x-2 px-3 py-1 rounded hover:bg-slate-50 transition-colors"
                                                        onClick={() => handleEditClick(student.student_id, assignment.id, gradeData?.score)}
                                                    >
                                                        {gradeData ? (
                                                            <>
                                                                <span className="text-sm font-black text-[#18216D]">
                                                                    {gradeData.score}
                                                                </span>
                                                                <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">
                                                                    {gradeData.letter_grade}
                                                                </span>
                                                            </>
                                                        ) : (
                                                            <span className="text-sm text-slate-300 font-bold">-</span>
                                                        )}
                                                        <PencilSquareIcon className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}

                                    {gradebook.quizzes && gradebook.quizzes.map((quiz) => {
                                        const quizGrade = student.quiz_grades ? student.quiz_grades[quiz.id] : null;
                                        // Prioritize backend-calculated levels for academic consistency
                                        const levelCode = quizGrade?.competency_level || (quizGrade ? calculateLevel(quizGrade.score, quizGrade.total) : null);
                                        const levelData = levelCode ? getLevelData(levelCode) : null;

                                        return (
                                            <td key={`quiz-${quiz.id}`} className="px-6 py-4 whitespace-nowrap text-center bg-amber-50/5 border-r border-amber-100/20">
                                                {quizGrade ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-xs font-black px-2 py-0.5 rounded uppercase tracking-widest border ${levelData?.bg} ${levelData?.color}`}>
                                                            {levelCode}
                                                        </span>
                                                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1.5 opacity-60">
                                                            {quizGrade.score} / {quizGrade.total}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">Unattempted</span>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className="text-sm font-bold text-gray-900">
                                            {average}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                    <strong>Tip:</strong> Click on any grade cell to edit. Quizzes use CBC competency levels (EE, ME, AE, BE) based on a unified 80/60/40 threshold.
                </p>
            </div>
        </div>
    );
};

export default GradeBook;
