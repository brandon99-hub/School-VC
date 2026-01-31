import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { generateAssignmentPDF, generateLessonContentPDF } from '../utils/pdfGenerator';
import AssignmentSubmission from './student/AssignmentSubmission';
import QuizTaker from './student/QuizTaker';
import {
    ChartBarIcon,
    BookOpenIcon,
    ClipboardDocumentCheckIcon,
    QuestionMarkCircleIcon,
    ArrowLeftCircleIcon,
    Bars3CenterLeftIcon,
    ArrowDownTrayIcon,
    ClipboardDocumentListIcon,
    AcademicCapIcon
} from '@heroicons/react/24/outline';
import {
    ResponsiveContainer,
    RadialBarChart,
    RadialBar,
    Tooltip,
    AreaChart,
    Area,
    CartesianGrid,
    XAxis,
    YAxis,
} from 'recharts';

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

const Sidebar = ({ activeTab, onChange, collapsed, onBack }) => {
    const items = [
        { id: 'journey', label: 'Learning Journey', icon: BookOpenIcon },
        { id: 'assignments', label: 'Assignments', icon: ClipboardDocumentCheckIcon },
        { id: 'quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon },
        { id: 'submissions', label: 'My Performance', icon: ChartBarIcon },
    ];

    return (
        <div className={`flex flex-col h-full bg-white border-r border-gray-100 transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'}`}>
            <div className="p-4 flex-1 overflow-y-auto">
                <div className="mb-8 px-2">
                    {!collapsed ? (
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-[#18216D]/5 rounded-lg flex items-center justify-center">
                                <i className="fas fa-graduation-cap text-[#18216D] text-xs"></i>
                            </div>
                            <span className="text-[10px] font-black text-[#18216D] uppercase tracking-widest">Portal Navigation</span>
                        </div>
                    ) : (
                        <div className="w-full flex justify-center">
                            <i className="fas fa-graduation-cap text-[#18216D] text-sm opacity-20"></i>
                        </div>
                    )}
                </div>
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
                <button
                    onClick={onBack}
                    className="w-full flex items-center p-3 text-gray-400 hover:text-red-500 transition-colors group"
                    title={collapsed ? "Back to Dashboard" : ""}
                >
                    <div className={`flex items-center justify-center ${collapsed ? 'w-full' : ''}`}>
                        <ArrowLeftCircleIcon className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" />
                    </div>
                    {!collapsed && <span className="ml-3 font-bold text-sm">Exit Area</span>}
                </button>
            </div>
        </div>
    );
};

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { get } = useApi();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('journey');

    useEffect(() => {
        const handleTabChange = (e) => {
            if (e.detail) {
                setActiveTab(e.detail);
            }
        };
        window.addEventListener('change-course-tab', handleTabChange);
        return () => window.removeEventListener('change-course-tab', handleTabChange);
    }, []);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [expandedModule, setExpandedModule] = useState(null);
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [submissionView, setSubmissionView] = useState('chart');
    const [submittingAssignment, setSubmittingAssignment] = useState(null);
    const [takingQuiz, setTakingQuiz] = useState(null);
    const [lessonActiveTab, setLessonActiveTab] = useState({}); // { [lessonId]: 'materials' | 'requirements' }
    const [expandedBlocks, setExpandedBlocks] = useState({}); // { [blockId]: boolean }

    const learningSummary = useMemo(() => course?.learning_summary || {}, [course]);
    const studentProgress = useMemo(() => course?.student_progress || {}, [course]);
    const submissionData = useMemo(() => {
        const data = course?.student_submissions;
        return {
            assignments: data?.assignments || [],
            quizzes: data?.quizzes || [],
        };
    }, [course]);

    const submissionTimeline = useMemo(() => {
        const map = {};

        // Helper to map CBC levels to numeric scores
        const cbcMap = { 'EE': 95, 'ME': 75, 'AE': 50, 'BE': 25 };

        // Process Quizzes
        submissionData.quizzes.forEach((submission) => {
            if (!submission.submitted_at) return;
            const date = new Date(submission.submitted_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            if (!map[date]) map[date] = { date, Score: 0, count: 0 };
            map[date].Score += parseFloat(submission.score || 0);
            map[date].count += 1;
        });

        // Process Assignments (CBC)
        submissionData.assignments.forEach((submission) => {
            if (!submission.submitted_at) return;
            const date = new Date(submission.submitted_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            if (!map[date]) map[date] = { date, Score: 0, count: 0 };
            const score = cbcMap[submission.competency_level] || 0;
            map[date].Score += score;
            map[date].count += 1;
        });

        return Object.values(map).map(item => ({
            ...item,
            Performance: Math.round(item.Score / item.count)
        }));
    }, [submissionData]);

    const completionStats = useMemo(() => {
        const totalTasks = (course?.assignments?.length || 0) + (course?.quizzes?.length || 0);
        const completedTasks = (submissionData.assignments?.length || 0) + (submissionData.quizzes?.length || 0);
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return [
            { name: 'Completed', value: completedTasks, fill: '#18216D' },
            { name: 'Remaining', value: Math.max(0, totalTasks - completedTasks), fill: '#f1f5f9' },
            { percentage }
        ];
    }, [course, submissionData]);


    useEffect(() => {
        const fetchCourseDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await get(`/courses/api/${id}/`);
                setCourse(data);
            } catch (err) {
                console.error('Error fetching course details:', err);
                if (err.status === 403) {
                    setError('You do not have permission to access this Learning Area.');
                } else if (err.status === 404) {
                    setError('Learning Area not found.');
                } else {
                    setError('Failed to load learning data. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [id, get]);

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto py-10 px-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-3xl w-full mb-8"></div>
                <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                    <div className="h-24 bg-gray-200 rounded-2xl"></div>
                </div>
                <div className="h-96 bg-gray-200 rounded-3xl"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-24 px-4 h-screen flex flex-col items-center justify-center">
                <div className="text-6xl mb-6">⚠️</div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">{error}</h3>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="mt-6 px-8 py-3 bg-gray-900 text-white rounded-xl font-bold shadow-xl shadow-black/20 hover:bg-black transition-all"
                >
                    Return to Dashboard
                </button>
            </div>
        );
    }

    const renderContentIcon = (type) => {
        switch (type) {
            case 'video':
                return <i className="fas fa-video text-blue-500 mr-2" />;
            case 'document':
                return <i className="fas fa-file-alt text-purple-500 mr-2" />;
            case 'quiz':
                return <i className="fas fa-question-circle text-amber-500 mr-2" />;
            default:
                return <i className="fas fa-align-left text-gray-500 mr-2" />;
        }
    };

    if (!course) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                onChange={setActiveTab}
                collapsed={isSidebarCollapsed}
                onBack={() => navigate('/dashboard')}
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
                                <Bars3CenterLeftIcon className={`w-6 h-6 transition-transform ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
                            </button>
                            <div className="flex items-center gap-4">
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
                                <div className="text-lg font-black text-[#18216D] leading-none">
                                    {learningSummary.published_lessons || 0}
                                </div>
                                <div className="text-[8px] font-black text-slate-400 uppercase mt-1 tracking-[0.2em]">Sub-strands</div>
                            </div>
                            <div className="text-center bg-[#18216D] px-4 py-2 rounded-2xl shadow-lg shadow-indigo-900/10">
                                <div className="text-lg font-black text-white leading-none">
                                    {learningSummary.quiz_count || 0}
                                </div>
                                <div className="text-[8px] font-black text-indigo-200 uppercase mt-1 tracking-[0.2em]">Quizzes</div>
                            </div>
                            <div className="text-center bg-[#FFC425] px-4 py-2 rounded-2xl shadow-lg shadow-yellow-500/10">
                                <div className="text-lg font-black text-[#18216D] leading-none">
                                    {studentProgress.completed_quizzes || 0}
                                </div>
                                <div className="text-[8px] font-black text-[#18216D]/60 uppercase mt-1 tracking-[0.2em]">Completed</div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto p-8 relative">
                    <div className="max-w-6xl mx-auto space-y-8">
                        {activeTab === 'journey' && (
                            <div className="space-y-8">

                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Learning Journey</h2>
                                    <p className="text-gray-500 font-medium mt-1">
                                        {learningSummary.published_lessons || 0} of {learningSummary.total_lessons || 0} sub-strands published
                                    </p>
                                </div>

                                {course.modules?.length ? (
                                    <div className="space-y-6">
                                        {course.modules.map((module) => (
                                            <div key={module.id} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                                <button
                                                    className="w-full flex justify-between items-center px-8 py-6 text-left hover:bg-gray-50 transition-colors"
                                                    onClick={() => setExpandedModule((prev) => (prev === module.id ? null : module.id))}
                                                >
                                                    <div className="flex-1">
                                                        <div className="flex items-center space-x-3 mb-2">
                                                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-[0.2em]">Strand {module.order}</span>
                                                        </div>
                                                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{module.title}</h3>
                                                        <p className="text-sm font-medium text-gray-500 mt-1">{module.description}</p>
                                                    </div>
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 shadow-inner transform transition-transform duration-300 ${expandedModule === module.id ? 'rotate-180' : ''}`}>
                                                        <i className="fas fa-chevron-down text-gray-400" />
                                                    </div>
                                                </button>

                                                {expandedModule === module.id && (
                                                    <div className="px-8 pb-8 space-y-4 animate-in slide-in-from-top-4 duration-300">
                                                        {module.lessons?.map((lesson) => (
                                                            <div key={lesson.id} className="group">
                                                                <button
                                                                    className="w-full flex justify-between items-center text-left bg-gray-50/50 hover:bg-white p-6 rounded-2xl border border-transparent hover:border-blue-100 hover:shadow-lg hover:shadow-blue-500/5 transition-all"
                                                                    onClick={() => setExpandedLesson((prev) => (prev === lesson.id ? null : lesson.id))}
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center space-x-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                                            <span>Sub-strand {lesson.order}</span>
                                                                            <span className="flex items-center gap-1 bg-indigo-50 text-indigo-500 px-2 py-1 rounded-md">
                                                                                <i className="fas fa-bullseye" /> {lesson.outcomes_count || 0} Outcomes
                                                                            </span>
                                                                            {lesson.content_count > 0 && (
                                                                                <span className="flex items-center gap-1 bg-amber-50 text-amber-500 px-2 py-1 rounded-md">
                                                                                    <i className="fas fa-book-open" /> {lesson.content_count} Materials
                                                                                </span>
                                                                            )}
                                                                            {lesson.quizzes?.length > 0 && (
                                                                                <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md">
                                                                                    <i className="fas fa-poll" /> {(lesson.quizzes || []).length} Quiz
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
                                                                        <p className="text-sm font-medium text-gray-500 mt-1 line-clamp-1">{lesson.summary}</p>
                                                                    </div>
                                                                    <i className={`fas fa-chevron-${expandedLesson === lesson.id ? 'up' : 'down'} text-gray-300 group-hover:text-blue-400`} />
                                                                </button>

                                                                {expandedLesson === lesson.id && (
                                                                    <div className="mt-4 ml-6 pl-6 border-l-2 border-dashed border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                                        {/* Mini Tabs */}
                                                                        <div className="flex gap-4 border-b border-gray-100 mb-6">
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setLessonActiveTab(prev => ({ ...prev, [lesson.id]: 'materials' })); }}
                                                                                className={`pb-2 px-1 text-[10px] font-black uppercase tracking-widest transition-all relative ${(!lessonActiveTab[lesson.id] || lessonActiveTab[lesson.id] === 'materials') ? 'text-[#18216D]' : 'text-gray-400 hover:text-gray-600'}`}
                                                                            >
                                                                                <span className="flex items-center gap-2">
                                                                                    <i className="fas fa-book-open" />
                                                                                    Learning Materials
                                                                                </span>
                                                                                {(!lessonActiveTab[lesson.id] || lessonActiveTab[lesson.id] === 'materials') && (
                                                                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#18216D] rounded-full"></div>
                                                                                )}
                                                                            </button>
                                                                            <button
                                                                                onClick={(e) => { e.stopPropagation(); setLessonActiveTab(prev => ({ ...prev, [lesson.id]: 'requirements' })); }}
                                                                                className={`pb-2 px-1 text-[10px] font-black uppercase tracking-widest transition-all relative ${lessonActiveTab[lesson.id] === 'requirements' ? 'text-[#18216D]' : 'text-gray-400 hover:text-gray-600'}`}
                                                                            >
                                                                                <span className="flex items-center gap-2">
                                                                                    <i className="fas fa-list-check" />
                                                                                    Curriculum Requirements
                                                                                </span>
                                                                                {lessonActiveTab[lesson.id] === 'requirements' && (
                                                                                    <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[#18216D] rounded-full"></div>
                                                                                )}
                                                                            </button>
                                                                        </div>

                                                                        {/* Tab Content: Materials */}
                                                                        {(!lessonActiveTab[lesson.id] || lessonActiveTab[lesson.id] === 'materials') && (
                                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                                {(lesson.teacher_contents || []).length > 0 ? (
                                                                                    lesson.teacher_contents.map((content) => (
                                                                                        <div
                                                                                            key={content.id}
                                                                                            className="flex items-start bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all relative overflow-hidden group/content"
                                                                                        >
                                                                                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover/content:opacity-100 transition-opacity"></div>
                                                                                            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mr-4 flex-shrink-0 group-hover/content:bg-blue-50 transition-colors">
                                                                                                {renderContentIcon(content.content_type)}
                                                                                            </div>
                                                                                            <div className="flex-1 min-w-0">
                                                                                                <div className="flex items-center justify-between">
                                                                                                    <p className="font-bold text-gray-900 group-hover/content:text-blue-600 transition-colors">{content.title}</p>
                                                                                                    {content.content_type === 'text' && (
                                                                                                        <button
                                                                                                            onClick={(e) => { e.stopPropagation(); generateLessonContentPDF(content, lesson.title); }}
                                                                                                            className="p-2 hover:bg-blue-100 rounded-lg text-blue-500 transition-colors"
                                                                                                            title="Download as PDF"
                                                                                                        >
                                                                                                            <ArrowDownTrayIcon className="w-4 h-4" />
                                                                                                        </button>
                                                                                                    )}
                                                                                                </div>
                                                                                                {content.body && (
                                                                                                    <div className="relative">
                                                                                                        <div
                                                                                                            className={`text-sm font-medium text-gray-500 mt-2 leading-relaxed prose prose-slate prose-sm max-w-none overflow-hidden transition-all duration-300 ${(!expandedBlocks[content.id] && content.body.length > 500) ? 'max-h-[200px]' : 'max-h-full'}`}
                                                                                                            dangerouslySetInnerHTML={{ __html: content.body }}
                                                                                                            style={{
                                                                                                                maskImage: (!expandedBlocks[content.id] && content.body.length > 500) ? 'linear-gradient(to bottom, black 70%, transparent 100%)' : 'none',
                                                                                                                WebkitMaskImage: (!expandedBlocks[content.id] && content.body.length > 500) ? 'linear-gradient(to bottom, black 70%, transparent 100%)' : 'none'
                                                                                                            }}
                                                                                                        />
                                                                                                        {content.body.length > 500 && (
                                                                                                            <button
                                                                                                                onClick={(e) => { e.stopPropagation(); setExpandedBlocks(prev => ({ ...prev, [content.id]: !prev[content.id] })); }}
                                                                                                                className="mt-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 block"
                                                                                                            >
                                                                                                                {expandedBlocks[content.id] ? 'Show Less' : 'Read More content...'}
                                                                                                            </button>
                                                                                                        )}
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    ))
                                                                                ) : (
                                                                                    <div className="py-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-100">
                                                                                        <i className="fas fa-folder-open text-gray-300 mb-2 block"></i>
                                                                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No extra study materials added by teacher yet</p>
                                                                                    </div>
                                                                                )}

                                                                                {/* Quizzes fall under Learning Materials */}
                                                                                {lesson.quizzes?.length > 0 && (
                                                                                    <div className="bg-amber-50/30 rounded-2xl border border-amber-100 p-6 space-y-4">
                                                                                        <div className="flex items-center space-x-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                                                            <i className="fas fa-poll" />
                                                                                            <span>Lesson Quizzes</span>
                                                                                        </div>
                                                                                        {lesson.quizzes.map((quiz) => (
                                                                                            <div key={quiz.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                                                                                                <div>
                                                                                                    <p className="font-bold text-gray-900">{quiz.title}</p>
                                                                                                    <p className="text-[10px] font-black text-gray-400 uppercase mt-1">
                                                                                                        {quiz.questions.length} Items · {quiz.time_limit_minutes} Mins · Attempts: {(course.quiz_submissions || []).filter(s => s.quiz === quiz.id).length}/{quiz.max_attempts || 1}
                                                                                                    </p>
                                                                                                </div>
                                                                                                <button
                                                                                                    onClick={() => setTakingQuiz(quiz)}
                                                                                                    className="px-6 py-2.5 bg-amber-500 text-white text-xs font-black rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all uppercase tracking-widest"
                                                                                                >
                                                                                                    Start
                                                                                                </button>
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        )}

                                                                        {/* Tab Content: Requirements (Learning Outcomes) */}
                                                                        {lessonActiveTab[lesson.id] === 'requirements' && (
                                                                            <div className="space-y-4 animate-in fade-in duration-300">
                                                                                {lesson.learning_outcomes?.map((outcome) => (
                                                                                    <div
                                                                                        key={outcome.id}
                                                                                        className="flex items-start bg-slate-50/50 border border-slate-100 rounded-2xl p-5 hover:border-slate-200 transition-all"
                                                                                    >
                                                                                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center mr-4 flex-shrink-0 border border-slate-100 shadow-sm text-[10px] font-black text-[#18216D]">
                                                                                            <i className="fas fa-bullseye opacity-40"></i>
                                                                                        </div>
                                                                                        <div className="flex-1 min-w-0">
                                                                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">{outcome.title}</p>
                                                                                            <p className="text-sm font-medium text-slate-600 leading-relaxed">{outcome.body}</p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
                                        <i className="fas fa-book-open text-gray-300 text-4xl mb-4" />
                                        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No curriculum content published yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'assignments' && (
                            <div>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Assignments</h2>
                                    <p className="text-gray-500 font-medium mt-1">All coursework and tasks for this learning area</p>
                                </div>
                                {course.assignments?.length ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {course.assignments.map((assignment) => {
                                            const submission = (course.assignment_submissions || []).find(s => s.assignment === assignment.id);
                                            const isSubmitted = !!submission;
                                            const isGraded = submission?.status === 'graded';

                                            return (
                                                <div key={assignment.id} className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <div className="flex items-center space-x-2 mb-2">
                                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded">Task</span>
                                                                    {isSubmitted && (
                                                                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                                                            <i className="fas fa-check-circle" /> Submitted
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <h3 className="text-xl font-black text-[#18216D] leading-tight">{assignment.title}</h3>
                                                            </div>
                                                            {isGraded && (
                                                                <div className="bg-[#FFC425] px-3 py-1.5 rounded-xl shadow-lg shadow-yellow-500/10 border border-[#FFC425]/20 text-center animate-in zoom-in duration-300">
                                                                    <div className="text-[8px] font-black text-[#18216D]/60 uppercase tracking-widest leading-none mb-1">Grade</div>
                                                                    <div className="text-sm font-black text-[#18216D] leading-none">
                                                                        {submission.competency_level || submission.grade || (submission.score != null ? `${submission.score} pts` : 'Grades Pending')}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">{assignment.description}</p>

                                                        <div className="flex items-center gap-6 pt-2">
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                                                                <i className="far fa-calendar-alt text-[#FFC425]" />
                                                                {new Date(assignment.due_date).toLocaleDateString()}
                                                            </div>
                                                            <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-wider">
                                                                <i className="far fa-star text-[#18216D]" />
                                                                {assignment.total_marks} Pts
                                                            </div>
                                                        </div>

                                                        <div className="pt-4 flex items-center gap-3">
                                                            <button
                                                                onClick={() => setSubmittingAssignment({ ...assignment, existing_submission: (course.assignment_submissions || []).find(s => s.assignment === assignment.id) })}
                                                                disabled={isGraded}
                                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isGraded
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                                    : 'bg-[#18216D] text-white hover:bg-[#0D164F] shadow-indigo-900/10'}`}
                                                            >
                                                                {isGraded ? 'Work Handed In' : isSubmitted ? 'Update Your Work' : 'Submit Work'}
                                                            </button>
                                                            <button
                                                                onClick={() => generateAssignmentPDF(assignment)}
                                                                className="p-3 bg-slate-50 text-slate-400 hover:text-[#18216D] rounded-xl transition-all"
                                                                title="Download PDF"
                                                            >
                                                                <i className="fas fa-download" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No assignments available yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'quizzes' && (
                            <div>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Interactive Quizzes</h2>
                                    <p className="text-gray-500 font-medium mt-1">Manage assessments and automated competency checks</p>
                                </div>
                                {course.quizzes?.length ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {course.quizzes.map((quiz) => {
                                            const submissions = (course.quiz_submissions || []).filter(s => s.quiz === quiz.id);
                                            const attemptsUsed = submissions.length;
                                            const isLimitReached = attemptsUsed >= (quiz.max_attempts || 1);
                                            const highestScore = submissions.length > 0 ? Math.max(...submissions.map(s => s.score)) : null;

                                            return (
                                                <div key={quiz.id} className="bg-white rounded-3xl border border-gray-100 p-6 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group relative overflow-hidden">
                                                    <div className="flex-1 space-y-4">
                                                        <div className="flex justify-between items-start">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded">Quiz</span>
                                                                {isLimitReached ? (
                                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                                                        Completed
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded flex items-center gap-1">
                                                                        Live
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {highestScore !== null && (
                                                                <div className="bg-[#18216D] px-3 py-1.5 rounded-xl shadow-lg shadow-indigo-900/10 border border-white/10 text-center animate-in zoom-in duration-300">
                                                                    <div className="text-[7px] font-black text-indigo-200 uppercase tracking-widest leading-none mb-1">Score</div>
                                                                    <div className="text-sm font-black text-white leading-none">
                                                                        {highestScore}/{quiz.total_points || 0}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <h3 className="text-xl font-black text-[#18216D] leading-tight line-clamp-2 min-h-[3.5rem]">{quiz.title}</h3>

                                                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            <div className="flex items-center gap-1.5">
                                                                <i className="far fa-clock text-[#FFC425]" />
                                                                {quiz.time_limit_minutes} Mins
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-indigo-400">
                                                                <i className="fas fa-layer-group" />
                                                                {attemptsUsed} / {quiz.max_attempts || 1} Attempts
                                                            </div>
                                                        </div>

                                                        <button
                                                            onClick={() => !isLimitReached && setTakingQuiz(quiz)}
                                                            className={`w-full py-4 font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-sm ${isLimitReached
                                                                ? 'bg-[#FFC425] text-[#18216D] hover:bg-[#E5B022]'
                                                                : 'bg-slate-50 text-[#18216D] group-hover:bg-[#18216D] group-hover:text-white'}`}
                                                        >
                                                            {isLimitReached ? 'Review Result' : 'Start Assessment'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No assessments assigned yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'submissions' && (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Performance</h2>
                                    <p className="text-gray-500 font-medium mt-1">Review your scores and assessment feedback</p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                                    <button
                                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${submissionView === 'chart' ? 'bg-[#18216D] text-white' : 'bg-white text-slate-400'}`}
                                        onClick={() => setSubmissionView('chart')}
                                    >
                                        Visual Analytics
                                    </button>
                                    <button
                                        className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${submissionView === 'table' ? 'bg-[#18216D] text-white' : 'bg-white text-slate-400'}`}
                                        onClick={() => setSubmissionView('table')}
                                    >
                                        Detailed Records
                                    </button>
                                </div>

                                {submissionView === 'chart' ? (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-80 flex flex-col items-center justify-center relative">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 w-full">Task Completion</p>
                                            <div className="absolute inset-x-0 bottom-1/2 translate-y-6 flex flex-col items-center justify-center pointer-events-none">
                                                <span className="text-4xl font-black text-[#18216D] leading-none">{completionStats[2].percentage}%</span>
                                                <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-widest">Mastery</span>
                                            </div>
                                            <ResponsiveContainer width="100%" height="80%">
                                                <RadialBarChart
                                                    innerRadius="70%"
                                                    outerRadius="100%"
                                                    data={completionStats.slice(0, 2)}
                                                    startAngle={90}
                                                    endAngle={450}
                                                >
                                                    <RadialBar
                                                        minAngle={15}
                                                        cornerRadius={20}
                                                        clockWise
                                                        dataKey="value"
                                                    />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-80">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Performance Timeline</p>
                                            <ResponsiveContainer width="100%" height="80%">
                                                <AreaChart data={submissionTimeline}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} fontWeights="black" />
                                                    <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                                                    <Tooltip
                                                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 30px -5px rgba(24,33,109,0.1)' }}
                                                        labelStyle={{ fontWeight: 'black', textTransform: 'uppercase', fontSize: '10px', color: '#18216D' }}
                                                    />
                                                    <Area type="monotone" dataKey="Performance" stroke="#18216D" fill="#18216D11" strokeWidth={4} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="bg-slate-50">
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Activity Name</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Submission Date</th>
                                                    <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade / Result</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {[...submissionData.assignments.map(a => ({ ...a, type: 'Assignment' })), ...submissionData.quizzes.map(q => ({ ...q, type: 'Quiz' }))].sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)).map((record, idx) => {
                                                    const statusLabel = (record.status || 'SUBMITTED').toUpperCase().replace('_', ' ');
                                                    const isGraded = ['GRADED', 'AUTO GRADED'].includes(statusLabel);

                                                    return (
                                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                                                            <td className="px-8 py-5">
                                                                <p className="text-sm font-black text-[#18216D] transition-colors">{record.assignment_title || record.quiz_title || record.title}</p>
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${record.type === 'Assignment' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                    {record.type}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 text-xs font-bold text-slate-400">
                                                                {new Date(record.submitted_at).toLocaleDateString()}
                                                            </td>
                                                            <td className="px-8 py-5">
                                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${isGraded ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                                                                    {statusLabel}
                                                                </span>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="font-black text-[#18216D]">
                                                                    {record.competency_level || record.grade || (record.score != null ? `${record.score} pts` : '--')}
                                                                </div>
                                                                {(record.competency_comment || record.feedback) && (
                                                                    <p className="text-[8px] text-slate-400 italic mt-1 max-w-[200px] ml-auto truncate" title={record.competency_comment || record.feedback}>
                                                                        "{record.competency_comment || record.feedback}"
                                                                    </p>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                                {(!submissionData.assignments.length && !submissionData.quizzes.length) && (
                                                    <tr>
                                                        <td colSpan="5" className="px-8 py-20 text-center">
                                                            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No submission records found yet.</p>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'discussions' && (
                            <div>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Class Forum</h2>
                                    <p className="text-gray-500 font-medium mt-1">Discuss topics with your teacher and classmates</p>
                                </div>
                                {course.discussion_threads?.length ? (
                                    <div className="grid grid-cols-1 gap-4">
                                        {course.discussion_threads.map((thread) => (
                                            <div key={thread.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 hover:shadow-xl hover:shadow-indigo-900/5 transition-all group">
                                                <div className="flex justify-between items-start">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-8 h-8 rounded-full bg-[#18216D]/5 flex items-center justify-center text-[#18216D] text-[10px] font-black uppercase">
                                                                {thread.created_by_name?.substring(0, 2)}
                                                            </div>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                                {thread.created_by_name} • {new Date(thread.created_at).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <h3 className="text-xl font-black text-[#18216D] group-hover:text-[#FFC425] transition-colors">{thread.title}</h3>
                                                        <p className="text-sm text-gray-500 mt-2 font-medium">{thread.body}</p>
                                                    </div>
                                                    {thread.is_pinned && (
                                                        <span className="px-3 py-1 text-[9px] font-black text-amber-600 bg-amber-50 rounded-full border border-amber-100 uppercase tracking-widest">Featured</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active discussions for this subject.</p>
                                    </div>
                                )}
                            </div>
                        )}

                    </div>
                </main>
            </div>

            {/* Modals */}
            {submittingAssignment && (
                <AssignmentSubmission
                    assignment={submittingAssignment}
                    hasSubmitted={(course.assignment_submissions || []).some(s => s.assignment === submittingAssignment.id)}
                    onClose={() => setSubmittingAssignment(null)}
                    onSubmit={() => window.location.reload()}
                />
            )}

            {takingQuiz && (
                <QuizTaker
                    quiz={takingQuiz}
                    onClose={() => setTakingQuiz(null)}
                    onComplete={() => window.location.reload()}
                />
            )}
        </div>
    );
};

export default CourseDetail;