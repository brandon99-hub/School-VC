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

const SidebarItem = ({ id, label, icon: Icon, active, collapsed, onClick }) => (
    <button
        onClick={() => onClick(id)}
        className={`w-full flex items-center p-3 mb-2 rounded-xl transition-all group ${active
            ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/30'
            : 'text-slate-400 hover:bg-slate-50 hover:text-[#18216D]'
            }`}
        title={collapsed ? label : ''}
    >
        <div className={`flex items-center justify-center ${collapsed ? 'w-full' : ''}`}>
            <Icon className={`w-6 h-6 transition-transform group-hover:scale-110 ${active ? 'text-white' : 'text-slate-300 group-hover:text-[#18216D]'}`} />
        </div>
        {!collapsed && (
            <span className="ml-3 font-bold text-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-300">
                {label}
            </span>
        )}
        {active && !collapsed && (
            <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
        )}
    </button>
);

const Sidebar = ({ activeTab, onChange, collapsed }) => {
    const items = [
        { id: 'content', label: 'Curriculum Strands', icon: BookOpenIcon },
        { id: 'assignments', label: 'Assignments', icon: ClipboardDocumentCheckIcon },
        { id: 'quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon },
        { id: 'gradebook', label: 'Competency Grades', icon: ChartBarIcon },
        { id: 'students', label: 'Students', icon: UsersIcon },
        { id: 'discussions', label: 'Discussions', icon: ChatBubbleLeftRightIcon },
        { id: 'schedule', label: 'Schedule', icon: CalendarIcon },
    ];

    return (
        <div className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
            <div className="p-4 flex-1 overflow-y-auto">
                {items.map((item) => (
                    <SidebarItem
                        key={item.id}
                        {...item}
                        active={activeTab === item.id}
                        collapsed={collapsed}
                        onClick={onChange}
                    />
                ))}
            </div>

            <div className="p-4 border-t border-gray-100">
                <Link
                    to="/teacher/courses"
                    className="flex items-center p-3 text-gray-400 hover:text-red-500 transition-colors group"
                    title={collapsed ? "Exit to Registry" : ""}
                >
                    <div className={`flex items-center justify-center ${collapsed ? 'w-full' : ''}`}>
                        <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 15l-3-3m0 0l3-3m-3 3h8M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                        </svg>
                    </div>
                    {!collapsed && <span className="ml-3 font-bold text-sm">Exit Area</span>}
                </Link>
            </div>
        </div>
    );
};

const TeacherCourseView = () => {
    const { id } = useParams();
    const { get } = useApi();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('content');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [lessons, setLessons] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [showQuizBuilder, setShowQuizBuilder] = useState(false);
    const [editingQuiz, setEditingQuiz] = useState(null);
    const [showDiscussionManager, setShowDiscussionManager] = useState(false);
    const [showScheduleManager, setShowScheduleManager] = useState(false);
    const [selectedLessonForQuiz, setSelectedLessonForQuiz] = useState(null);

    const fetchCourseData = useCallback(async () => {
        try {
            setLoading(true);
            // Fetch Course details (linked to Registry)
            const courseResponse = await get(`/teachers/api/courses/${id}/`);
            setCourse(courseResponse);

            // Map modules to strands and flatten to sub-strands (lessons)
            const allModules = courseResponse.modules || [];
            const allLessons = allModules.flatMap(m => m.sub_strands || []);
            setLessons(allLessons);

        } catch (error) {
            console.error('Error fetching course data:', error);
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


    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-14 w-14 border-4 border-[#18216D]/10 border-t-[#18216D] mb-6 shadow-sm"></div>
                <div className="text-[#18216D] font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Academy Data...</div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center bg-white p-16 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 max-w-md w-full border border-slate-50">
                    <div className="text-6xl mb-8">🔍</div>
                    <h3 className="text-2xl font-black text-[#18216D] mb-2 tracking-tight">Learning Area Not Found</h3>
                    <p className="text-slate-400 mb-10 font-medium">The subject you're looking for might have been moved or unassigned.</p>
                    <Link to="/teacher/courses" className="inline-block px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:bg-[#0D164F] transition-all">
                        ← Back to My Learning Areas
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onChange={(tab) => {
                    setActiveTab(tab);
                    if (tab === 'discussions') setShowDiscussionManager(true);
                    else if (tab === 'schedule') setShowScheduleManager(true);
                }}
                collapsed={isSidebarCollapsed}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Premium Header */}
                <header className="bg-white border-b border-gray-100 z-10">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                            >
                                <svg className={`w-6 h-6 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                                </svg>
                            </button>
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center p-1.5 shadow-sm border border-slate-100">
                                    <img src="/kianda-school-logo.png" alt="Kianda School" className="h-full object-contain" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-[#18216D] tracking-tighter flex items-center leading-none">
                                        {course.name}
                                        <span className="ml-3 px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] bg-[#FFC425]/10 text-[#18216D] rounded-full border border-[#FFC425]/20">
                                            GRADE {course.grade_level_name?.replace('Grade ', '') || '4'}
                                        </span>
                                    </h1>
                                    <p className="text-[10px] font-black text-slate-400 flex items-center mt-1 uppercase tracking-widest">
                                        <span className="text-[#18216D] bg-[#18216D]/5 px-1.5 py-0.5 rounded mr-2">{course.code}</span>
                                        • National Standards Portal
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-4">
                            <div className="text-center bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                                <div className="text-lg font-black text-[#18216D] leading-none">{course.enrolled_students_count || 0}</div>
                                <div className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-[0.2em]">Scholars</div>
                            </div>
                            <div className="text-center bg-[#18216D] px-4 py-2 rounded-2xl shadow-lg shadow-indigo-900/10">
                                <div className="text-lg font-black text-white leading-none">{course.modules?.length || 0}</div>
                                <div className="text-[8px] font-black text-indigo-200 uppercase mt-1 tracking-[0.2em]">Strands</div>
                            </div>
                            <div className="text-center bg-[#FFC425] px-4 py-2 rounded-2xl shadow-lg shadow-yellow-500/10">
                                <div className="text-lg font-black text-[#18216D] leading-none">{course.assignments?.length || 0}</div>
                                <div className="text-[8px] font-black text-[#18216D]/60 uppercase mt-1 tracking-[0.2em]">Tasks</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-6xl mx-auto">
                        {activeTab === 'content' && (
                            <ModuleList courseId={id} />
                        )}

                        {activeTab === 'assignments' && (
                            <AssignmentList courseId={id} />
                        )}

                        {activeTab === 'quizzes' && (
                            <div>
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Interactive Quizzes</h2>
                                        <p className="text-gray-500 font-medium mt-1">Manage assessments and automated competency checks</p>
                                    </div>
                                    <button
                                        onClick={handleCreateQuiz}
                                        className="px-6 py-3 bg-[#18216D] text-white rounded-xl hover:bg-[#0D164F] transition-all font-black shadow-xl shadow-indigo-900/20 flex items-center space-x-3 text-xs uppercase tracking-widest"
                                    >
                                        <PlusIcon className="w-5 h-5 stroke-[4]" />
                                        <span>Create New Quiz</span>
                                    </button>
                                </div>

                                {quizzes.length === 0 ? (
                                    <div className="text-center py-24 bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-900/5">
                                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                            <QuestionMarkCircleIcon className="h-10 w-10 text-slate-300" />
                                        </div>
                                        <h3 className="text-2xl font-black text-[#18216D] mb-2 tracking-tight">Build Your Assessment</h3>
                                        <p className="text-slate-400 max-w-md mx-auto mb-10 font-medium italic">Create interactive quizzes to evaluate student competencies and automate your grading workflow.</p>
                                        <button
                                            onClick={handleCreateQuiz}
                                            className="px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#0D164F] transition-all shadow-xl shadow-indigo-900/20"
                                        >
                                            Configure First Quiz
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {quizzes.map((quiz) => (
                                            <div key={quiz.id} className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden">
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/50 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
                                                <div className="relative z-10 flex flex-col h-full">
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div>
                                                            <div className="flex items-center space-x-3 mb-2">
                                                                <h3 className="text-xl font-bold text-gray-900">{quiz.title}</h3>
                                                                {quiz.is_published ? (
                                                                    <span className="px-2.5 py-1 text-[10px] font-black bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 uppercase tracking-widest">Live</span>
                                                                ) : (
                                                                    <span className="px-2.5 py-1 text-[10px] font-black bg-gray-50 text-gray-500 rounded-full border border-gray-100 uppercase tracking-widest">Draft</span>
                                                                )}
                                                            </div>
                                                            <p className="text-xs font-black text-[#18216D] uppercase tracking-widest mt-1">
                                                                Sub-strand: {lessons.find(l => l.id === quiz.lesson)?.title || 'Unassigned'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-6 text-xs font-black text-gray-400 mt-auto uppercase tracking-wider">
                                                        <span className="flex items-center"><ClockIcon className="w-4 h-4 mr-2" /> {quiz.time_limit_minutes > 0 ? `${quiz.time_limit_minutes} Mins` : 'Unlimited'}</span>
                                                        <span className="flex items-center"><ClipboardDocumentCheckIcon className="w-4 h-4 mr-2" /> {quiz.questions?.length || 0} Questions</span>
                                                    </div>

                                                    <div className="mt-6 flex items-center space-x-3">
                                                        <button
                                                            onClick={() => handleEditQuiz(quiz)}
                                                            className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-xl font-black hover:bg-gray-100 transition-all text-center"
                                                        >
                                                            Edit Design
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuiz(quiz.id)}
                                                            className="p-3 text-red-100 hover:text-red-600 bg-red-50/10 hover:bg-red-50 rounded-xl transition-all"
                                                        >
                                                            <TrashIcon className="w-5 h-5 stroke-[2.5]" />
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
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Enrolled Students</h2>
                                    <p className="text-gray-500 font-medium">Manage all learners registered in this learning area</p>
                                </div>

                                {course.enrolled_students && course.enrolled_students.length > 0 ? (
                                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-gray-50 text-left">
                                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Admission No</th>
                                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Parent Email</th>
                                                    <th className="px-8 py-5 text-right"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {course.enrolled_students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-blue-50/30 transition-colors group">
                                                        <td className="px-8 py-5">
                                                            <div className="flex items-center">
                                                                <div className="w-10 h-10 bg-[#18216D]/5 text-[#18216D] rounded-xl flex items-center justify-center font-black mr-3 uppercase border border-[#18216D]/10">
                                                                    {student.name?.substring(0, 2)}
                                                                </div>
                                                                <span className="text-sm font-black text-[#18216D]">{student.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm font-black text-gray-500">{student.student_id}</td>
                                                        <td className="px-8 py-5 text-sm font-bold text-gray-400 tracking-tight">{student.email}</td>
                                                        <td className="px-8 py-5 text-right">
                                                            <button className="p-2 text-gray-300 hover:text-blue-600 transition-colors">
                                                                <PencilSquareIcon className="w-5 h-5" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed border-gray-100 shadow-sm">
                                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <UsersIcon className="h-10 w-10 text-gray-300" />
                                        </div>
                                        <p className="text-gray-400 font-bold">No students are currently enrolled.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'gradebook' && (
                            <GradeBook courseId={id} />
                        )}
                    </div>
                </main>
            </div>

            {/* Modals */}
            {showQuizBuilder && (
                <QuizBuilder
                    lessonId={selectedLessonForQuiz}
                    courseId={id}
                    quiz={editingQuiz}
                    onClose={() => {
                        setShowQuizBuilder(false);
                        setEditingQuiz(null);
                    }}
                    onSave={fetchCourseData}
                />
            )}

            {showDiscussionManager && (
                <DiscussionManager
                    courseId={id}
                    onClose={() => {
                        setShowDiscussionManager(false);
                        setActiveTab('content');
                    }}
                />
            )}

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
