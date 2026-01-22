import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const QuizTaker = ({ quiz, onClose, onComplete }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState({});
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);

    useEffect(() => {
        fetchQuizQuestions();
    }, [quiz.id]);

    useEffect(() => {
        if (timeRemaining === null || timeRemaining <= 0) return;

        const timer = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    handleSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [timeRemaining]);

    const fetchQuizQuestions = async () => {
        try {
            setLoading(true);
            const data = await get(`/courses/quizzes/${quiz.id}/`);
            setQuestions(data.questions || []);
            setTimeRemaining(quiz.time_limit_minutes * 60);
        } catch (error) {
            console.error('Error fetching quiz questions:', error);
            showToast('Failed to load quiz', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (questionId, answer) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));
    };

    const handleSubmit = async () => {
        try {
            setSubmitting(true);

            const responses = Object.entries(answers).map(([questionId, answer]) => ({
                question: parseInt(questionId),
                selected_answer: answer
            }));

            const submission = await post('/courses/quiz-submissions/', {
                quiz: quiz.id,
                responses
            });

            setResult(submission);
            showToast('Quiz submitted successfully!');

            if (onComplete) {
                onComplete(submission);
            }
        } catch (error) {
            console.error('Error submitting quiz:', error);
            showToast('Failed to submit quiz', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const currentQuestion = questions[currentQuestionIndex];
    const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                    <p className="mt-4 text-gray-600">Loading quiz...</p>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <i className="fas fa-check text-4xl text-green-600"></i>
                        </div>
                        <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
                        <p className="text-gray-600 mb-6">Your submission has been recorded</p>

                        <div className="bg-gray-50 rounded-lg p-6 mb-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Score</p>
                                    <p className="text-2xl font-bold text-indigo-600">
                                        {result.score || 0} / {questions.length}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Percentage</p>
                                    <p className="text-2xl font-bold text-indigo-600">
                                        {Math.round(((result.score || 0) / questions.length) * 100)}%
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h2 className="text-2xl font-bold">{quiz.title}</h2>
                            <p className="text-sm text-gray-600">
                                Question {currentQuestionIndex + 1} of {questions.length}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            {timeRemaining !== null && (
                                <div className={`px-4 py-2 rounded-lg font-bold ${timeRemaining < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                    }`}>
                                    <i className="fas fa-clock mr-2"></i>
                                    {formatTime(timeRemaining)}
                                </div>
                            )}
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <i className="fas fa-times text-xl"></i>
                            </button>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Question */}
                {currentQuestion && (
                    <div className="p-6">
                        <div className="mb-6">
                            <h3 className="text-xl font-semibold mb-4">{currentQuestion.prompt}</h3>

                            <div className="space-y-3">
                                {currentQuestion.choices && currentQuestion.choices.map((choice, index) => {
                                    const optionLetter = String.fromCharCode(65 + index);
                                    const isSelected = answers[currentQuestion.id] === choice;

                                    return (
                                        <button
                                            key={index}
                                            onClick={() => handleAnswerChange(currentQuestion.id, choice)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition ${isSelected
                                                ? 'border-indigo-600 bg-indigo-50'
                                                : 'border-gray-200 hover:border-indigo-300'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isSelected
                                                    ? 'border-indigo-600 bg-indigo-600'
                                                    : 'border-gray-300'
                                                    }`}>
                                                    {isSelected && <i className="fas fa-check text-white text-xs"></i>}
                                                </div>
                                                <span className="font-semibold text-gray-700">{optionLetter}.</span>
                                                <span>{choice}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* Navigation */}
                <div className="sticky bottom-0 bg-white border-t px-6 py-4">
                    <div className="flex justify-between items-center">
                        <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                            disabled={currentQuestionIndex === 0}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <i className="fas fa-chevron-left mr-2"></i>
                            Previous
                        </button>

                        <div className="flex gap-2">
                            {questions.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentQuestionIndex(index)}
                                    className={`w-10 h-10 rounded-lg font-semibold ${index === currentQuestionIndex
                                        ? 'bg-indigo-600 text-white'
                                        : answers[questions[index]?.id]
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-600'
                                        }`}
                                >
                                    {index + 1}
                                </button>
                            ))}
                        </div>

                        {currentQuestionIndex === questions.length - 1 ? (
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                            >
                                {submitting ? (
                                    <>
                                        <i className="fas fa-spinner fa-spin mr-2"></i>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        Submit Quiz
                                        <i className="fas fa-check ml-2"></i>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                            >
                                Next
                                <i className="fas fa-chevron-right ml-2"></i>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizTaker;
