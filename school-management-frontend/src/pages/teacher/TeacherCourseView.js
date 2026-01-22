import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import ModuleList from './ModuleList';
import AssignmentList from './AssignmentList';
import {
    ChartBarIcon,
    PlusIcon,
    PencilSquareIcon,
    TrashIcon,
    ClockIcon,
    BookOpenIcon,
    ClipboardDocumentCheckIcon,
    QuestionMarkCircleIcon,
    UsersIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon
} from '@heroicons/react/24/outline';
import QuizBuilder from '../../components/teacher/QuizBuilder';
import GradeBook from '../../components/teacher/GradeBook';
import DiscussionManager from '../../components/teacher/DiscussionManager';
import ScheduleManager from '../../components/teacher/ScheduleManager';

const Tabs = ({ tabs, activeTab, onChange }) => (
    <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
                <button
                    key={tab.id}
                    onClick={() => onChange(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </nav>
    </div>
);

const TeacherCourseView = () => {
    const { id } = useParams();
    const { get } = useApi();
    const [course, setCourse] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content');
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [showQuizBuilder, setShowQuizBuilder] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [showDiscussionManager, setShowDiscussionManager] = useState(false);
    const [showScheduleManager, setShowScheduleManager] = useState(false);
    const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState(null);
    const [error, setError] = useState(null); // Added error state

    const fetchCourseData = useCallback(async () => {
        try {
            setLoading(true);
            const [coursesResponse, modulesData] = await Promise.all([
                get(`/teachers/api/courses/`),
                get(`/api/teacher/courses/${id}/modules/`)
            ]);

            // Handle new API structure: {courses: [...], unique_student_count: N}
            const coursesArray = coursesResponse?.courses || [];
            const foundCourse = coursesArray.find(c => c.id === parseInt(id));

            if (!foundCourse) {
                setError('Course not found');
                setLoading(false);
                return;
            }

            setCourse(foundCourse);
            setModules(modulesData || []);

            // Extract all lessons from modules
            const allLessons = (modulesData || []).flatMap(m => m.lessons || []);
            setLessons(allLessons);

            // Fetch quizzes for all lessons
            const allQuizzes = [];
            for (const lesson of allLessons) {
                try {
                    const lessonQuizzes = await get(`/api/teacher/lessons/${lesson.id}/quizzes/`);
                    allQuizzes.push(...(lessonQuizzes || []));
                } catch (err) {
                    console.error(`Error fetching quizzes for lesson ${lesson.id}:`, err);
                }
            }
            setQuizzes(allQuizzes);
        } catch (error) {
            console.error('Error fetching course data:', error);
            setError('Failed to load course data');
        } finally {
            setLoading(false);
        }
    }, [id, get]);

    useEffect(() => {
        fetchCourseData();
    }, [fetchCourseData]);

    const handleCreateQuiz = () => {
        if (lessons.length === 0) {
            alert('Please create at least one lesson first to attach a quiz to.');
            return;
        }
        setEditingQuiz(null);
        setSelectedLessonForQuiz(lessons[0].id);
        setShowQuizBuilder(true);
    };

    const handleSaveQuiz = async (savedQuiz) => {
        setShowQuizBuilder(false);
        setEditingQuiz(null);
        setSelectedLessonForQuiz(null);
        // Refresh course data to get updated quizzes
        await fetchCourseData();
    };

    const handleEditQuiz = (quiz) => {
        setEditingQuiz(quiz);
        setSelectedLessonForQuiz(quiz.lesson);
        setShowQuizBuilder(true);
    };

    const handleDeleteQuiz = async (quizId) => {
        if (!window.confirm('Are you sure you want to delete this quiz?')) return;
        try {
            await get(`/api/teacher/quizzes/${quizId}/`, { method: 'DELETE' }); // useApi might need a del helper or use request
            fetchCourseData();
        } catch (error) {
            console.error('Error deleting quiz:', error);
        }
    };

    const tabs = [
        { id: 'content', label: 'Content', icon: <BookOpenIcon className="h-5 w-5 mr-2" /> },
        { id: 'assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon className="h-5 w-5 mr-2" /> },
        { id: 'quizzes', label: 'Quizzes', icon: <QuestionMarkCircleIcon className="h-5 w-5 mr-2" /> },
        { id: 'students', label: 'Students', icon: <UsersIcon className="h-5 w-5 mr-2" /> },
        { id: 'grades', label: 'Grades', icon: <ChartBarIcon className="h-5 w-5 mr-2" /> },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading course...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Course not found</p>
                    <Link to="/teacher/courses" className="text-blue-600 hover:text-blue-800">
                        ← Back to courses
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-6">
                    <Link to="/teacher/courses" className="text-blue-600 hover:text-blue-800 text-sm font-medium mb-2 inline-block">
                        ← Back to courses
                    </Link>
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">{course.name}</h1>
                            <p className="text-gray-600 mt-1">{course.code} • {course.credits} Credits</p>
                        </div>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${course.is_active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                            }`}>
                            {course.is_active ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-sm text-gray-600">Students</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                            {course.enrolled_students_count || 0}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-sm text-gray-600">Modules</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                            {course.modules?.length || 0}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-sm text-gray-600">Assignments</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">
                            {course.assignments?.length || 0}
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="text-sm text-gray-600">Pending Submissions</div>
                        <div className="text-2xl font-bold text-gray-900 mt-1">0</div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="px-6">
                        <Tabs
                            tabs={[
                                { id: 'content', label: 'Content', icon: <BookOpenIcon className="w-5 h-5 mr-2" /> },
                                { id: 'assignments', label: 'Assignments', icon: <ClipboardDocumentCheckIcon className="w-5 h-5 mr-2" /> },
                                { id: 'quizzes', label: 'Quizzes', icon: <QuestionMarkCircleIcon className="w-5 h-5 mr-2" /> },
                                { id: 'gradebook', label: 'Gradebook', icon: <ChartBarIcon className="w-5 h-5 mr-2" /> },
                                { id: 'discussions', label: 'Discussions', icon: <ChatBubbleLeftRightIcon className="w-5 h-5 mr-2" /> },
                                { id: 'schedule', label: 'Schedule', icon: <CalendarIcon className="w-5 h-5 mr-2" /> },
                            ]}
                            activeTab={activeTab}
                            onChange={(tab) => {
                                setActiveTab(tab);
                                if (tab === 'discussions') {
                                    setShowDiscussionManager(true);
                                } else if (tab === 'schedule') {
                                    setShowScheduleManager(true);
                                }
                            }}
                        />
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'content' && (
                            <ModuleList courseId={id} />
                        )}

                        {activeTab === 'assignments' && (
                            <AssignmentList courseId={id} />
                        )}

                        {activeTab === 'quizzes' && (
                            <div>
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900">Quizzes</h2>
                                        <p className="text-sm text-gray-500">Manage assessments and automated tests</p>
                                    </div>
                                    <button
                                        onClick={handleCreateQuiz}
                                        className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-500/20 flex items-center space-x-2"
                                    >
                                        <PlusIcon className="w-5 h-5" />
                                        <span>Create Quiz</span>
                                    </button>
                                </div>

                                {quizzes.length === 0 ? (
                                    <div className="text-center py-16 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                        <QuestionMarkCircleIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">No quizzes yet</h3>
                                        <p className="text-gray-500 max-w-sm mx-auto mb-6">Create interactive quizzes to test student knowledge and automate grading.</p>
                                        <button
                                            onClick={handleCreateQuiz}
                                            className="px-6 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-sm"
                                        >
                                            Build Your First Quiz
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {quizzes.map((quiz) => (
                                            <div key={quiz.id} className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow group">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <h3 className="text-lg font-bold text-gray-900">{quiz.title}</h3>
                                                            {quiz.is_published ? (
                                                                <span className="px-2 py-0.5 text-xs font-bold bg-green-50 text-green-700 rounded-full border border-green-100">Live</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 text-xs font-bold bg-gray-50 text-gray-600 rounded-full border border-gray-100">Draft</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center space-x-4 text-xs text-gray-500 font-medium">
                                                            <span className="flex items-center"><ClockIcon className="w-3.5 h-3.5 mr-1" /> {quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes}m` : 'Unlimited'}</span>
                                                            <span>{quiz.questions?.length || 0} Questions</span>
                                                            <span className="text-blue-600">Lesson: {lessons.find(l => l.id === quiz.lesson)?.title || 'Unknown'}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button
                                                            onClick={() => handleEditQuiz(quiz)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Edit Quiz"
                                                        >
                                                            <PencilSquareIcon className="w-6 h-6" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuiz(quiz.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete Quiz"
                                                        >
                                                            <TrashIcon className="w-6 h-6" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'students' && (
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">Enrolled Students</h2>
                                {course.enrolled_students && course.enrolled_students.length > 0 ? (
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead className="bg-gray-50 border-b border-gray-200">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200">
                                                {course.enrolled_students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-900">{student.name}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{student.student_id}</td>
                                                        <td className="px-6 py-4 text-sm text-gray-600">{student.email}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <p>No students enrolled yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'grades' && (
                            <GradeBook courseId={id} />
                        )}
                    </div>
                </div>
            </div>

            {/* Quiz Builder Modal */}
            {showQuizBuilder && (
                <QuizBuilder
                    lessonId={selectedLessonForQuiz}
                    quiz={editingQuiz}
                    onClose={() => {
                        setShowQuizBuilder(false);
                        setEditingQuiz(null);
                    }}
                    onSave={fetchCourseData}
                />
            )}

            {/* Discussion Manager Modal */}
            {showDiscussionManager && (
                <DiscussionManager
                    courseId={id}
                    onClose={() => {
                        setShowDiscussionManager(false);
                        setActiveTab('content');
                    }}
                />
            )}

            {/* Schedule Manager Modal */}
            {showScheduleManager && (
                <ScheduleManager
                    courseId={id}
                    onClose={() => {
                        setShowScheduleManager(false);
                        setActiveTab('content');
                    }}
                />
            )}
        </div>
    );
};

export default TeacherCourseView;
