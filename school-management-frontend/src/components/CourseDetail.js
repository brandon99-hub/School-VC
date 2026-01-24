import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { generateAssignmentPDF } from '../utils/pdfGenerator';
import AssignmentSubmission from './student/AssignmentSubmission';
import AttendanceMarker from './student/AttendanceMarker';
import QuizTaker from './student/QuizTaker';
import CollapsibleSection from './CollapsibleSection';
import {
    ChartBarIcon,
    BookOpenIcon,
    ClipboardDocumentCheckIcon,
    QuestionMarkCircleIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon,
    ArrowLeftCircleIcon,
    Bars3CenterLeftIcon
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
        { id: 'discussions', label: 'Class Forum', icon: ChatBubbleLeftRightIcon },
        { id: 'schedule', label: 'Live Sessions', icon: CalendarIcon },
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
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [expandedModule, setExpandedModule] = useState(null);
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [submissionView, setSubmissionView] = useState('chart');
    const [submittingAssignment, setSubmittingAssignment] = useState(null);
    const [takingQuiz, setTakingQuiz] = useState(null);

    const learningSummary = useMemo(() => course?.learning_summary || {}, [course]);
    const studentProgress = useMemo(() => course?.student_progress || {}, [course]);
    const submissionData = useMemo(() => {
        const data = course?.student_submissions;
        return {
            assignments: data?.assignments || [],
            quizzes: data?.quizzes || [],
        };
    }, [course]);

    const submissionChartData = useMemo(() => {
        const assignmentCount = submissionData.assignments.length;
        const quizCount = submissionData.quizzes.length;
        return [
            { name: 'Assignments', value: assignmentCount },
            { name: 'Quizzes', value: quizCount },
        ];
    }, [submissionData]);

    const submissionTimeline = useMemo(() => {
        const map = {};
        submissionData.quizzes.forEach((submission) => {
            if (!submission.submitted_at) {
                return;
            }
            const date = new Date(submission.submitted_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
            });
            if (!map[date]) {
                map[date] = { date, Attempts: 0 };
            }
            map[date].Attempts += 1;
        });
        return Object.values(map);
    }, [submissionData]);


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
                                <AttendanceMarker courseId={id} courseName={course.name} />

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
                                                                        <div className="flex items-center space-x-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                                                            <span>Sub-strand {lesson.order}</span>
                                                                            <span>•</span>
                                                                            <span className="flex items-center"><i className="far fa-clock mr-1" /> {lesson.duration_minutes} Mins</span>
                                                                        </div>
                                                                        <h4 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{lesson.title}</h4>
                                                                        <p className="text-sm font-medium text-gray-500 mt-1 line-clamp-1">{lesson.summary}</p>
                                                                    </div>
                                                                    <i className={`fas fa-chevron-${expandedLesson === lesson.id ? 'up' : 'down'} text-gray-300 group-hover:text-blue-400`} />
                                                                </button>

                                                                {expandedLesson === lesson.id && (
                                                                    <div className="mt-4 ml-6 pl-6 border-l-2 border-dashed border-gray-100 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                                                                        {lesson.contents?.map((content) => (
                                                                            <div
                                                                                key={content.id}
                                                                                className="flex items-start bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-sm transition-all relative overflow-hidden group/content"
                                                                            >
                                                                                <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 opacity-0 group-hover/content:opacity-100 transition-opacity"></div>
                                                                                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mr-4 flex-shrink-0 group-hover/content:bg-blue-50 transition-colors">
                                                                                    {renderContentIcon(content.content_type)}
                                                                                </div>
                                                                                <div className="flex-1 min-w-0">
                                                                                    <p className="font-bold text-gray-900 group-hover/content:text-blue-600 transition-colors">{content.title}</p>
                                                                                    {content.body && <p className="text-sm font-medium text-gray-500 mt-1 leading-relaxed">{content.body}</p>}
                                                                                </div>
                                                                            </div>
                                                                        ))}

                                                                        {lesson.quizzes?.length > 0 && (
                                                                            <div className="bg-amber-50/30 rounded-2xl border border-amber-100 p-6 space-y-4">
                                                                                <div className="flex items-center space-x-2 text-[10px] font-black text-amber-600 uppercase tracking-widest">
                                                                                    <i className="fas fa-poll" />
                                                                                    <span>Available Assessments</span>
                                                                                </div>
                                                                                {lesson.quizzes.map((quiz) => (
                                                                                    <div key={quiz.id} className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm">
                                                                                        <div>
                                                                                            <p className="font-bold text-gray-900">{quiz.title}</p>
                                                                                            <p className="text-[10px] font-black text-gray-400 uppercase mt-1">
                                                                                                {quiz.questions.length} Items · {quiz.time_limit_minutes} Mins
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
                                                                        {submission.competency_level || submission.grade || submission.score || 'A+'}
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
                                                                onClick={() => setSubmittingAssignment(assignment)}
                                                                disabled={isSubmitted}
                                                                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg ${isSubmitted
                                                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                                                    : 'bg-[#18216D] text-white hover:bg-[#0D164F] shadow-indigo-900/10'}`}
                                                            >
                                                                {isSubmitted ? 'Work Handed In' : 'Submit Work'}
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
                                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-80">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Engagement Split</p>
                                            <ResponsiveContainer width="100%" height="80%">
                                                <RadialBarChart innerRadius="40%" outerRadius="90%" data={submissionChartData}>
                                                    <RadialBar minAngle={15} cornerRadius={10} clockWise dataKey="value" fill="#18216D" />
                                                    <Tooltip />
                                                </RadialBarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm h-80">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Submission Timeline</p>
                                            <ResponsiveContainer width="100%" height="80%">
                                                <AreaChart data={submissionTimeline}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                                                    <Tooltip />
                                                    <Area type="monotone" dataKey="Attempts" stroke="#FFC425" fill="#FFC42533" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Knowledge Checks (Quizzes)</h3>
                                            {submissionData.quizzes?.length ? (
                                                <div className="space-y-3">
                                                    {submissionData.quizzes.map((sub) => (
                                                        <div key={sub.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-[#18216D] truncate">{sub.quiz_title || `Quiz #${sub.quiz}`}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">{sub.status}</p>
                                                            </div>
                                                            <div className="text-right ml-4">
                                                                <span className="text-lg font-black text-[#18216D]">{sub.score ?? '--'}</span>
                                                                <span className="text-[9px] font-black text-slate-400 uppercase block">PTS</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 text-xs italic px-2">No quiz attempts yet.</p>
                                            )}
                                        </div>
                                        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 px-2">Classroom Tasks (Assignments)</h3>
                                            {submissionData.assignments?.length ? (
                                                <div className="space-y-3">
                                                    {submissionData.assignments.map((sub) => (
                                                        <div key={sub.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-[#18216D] truncate">{sub.assignment_title || `Assignment #${sub.assignment}`}</p>
                                                                <p className="text-[9px] font-black text-slate-400 uppercase mt-1">
                                                                    {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString() : '--'}
                                                                </p>
                                                            </div>
                                                            <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-100">
                                                                <span className="text-[9px] font-black text-[#18216D] uppercase">{sub.graded ? 'Graded' : 'Pending'}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-gray-400 text-xs italic px-2">No work submitted yet.</p>
                                            )}
                                        </div>
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

                        {activeTab === 'schedule' && (
                            <div>
                                <div className="mb-8">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Live Sessions</h2>
                                    <p className="text-gray-500 font-medium mt-1">Upcoming virtual classes and session recordings</p>
                                </div>
                                {course.schedules?.length ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {course.schedules.map((schedule) => (
                                            <div key={schedule.id} className="bg-white border border-gray-100 rounded-3xl p-6 flex flex-col justify-between group">
                                                <div className="mb-6">
                                                    <div className="flex items-center space-x-2 text-[10px] font-black text-[#FFC425] uppercase tracking-[0.2em] mb-2">
                                                        <i className="fas fa-calendar-day" />
                                                        <span>{schedule.day}</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black text-[#18216D]">{schedule.start_time} – {schedule.end_time}</h3>
                                                </div>
                                                <div className="flex gap-3">
                                                    {schedule.meeting_link && (
                                                        <a
                                                            href={schedule.meeting_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex-1 px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-[#18216D] text-white hover:bg-[#0D164F] flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/10"
                                                        >
                                                            <i className="fas fa-video text-xs" />
                                                            Enter Classroom
                                                        </a>
                                                    )}
                                                    {schedule.recording_link && (
                                                        <a
                                                            href={schedule.recording_link}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest bg-slate-50 text-slate-400 hover:text-[#18216D] flex items-center justify-center gap-2"
                                                        >
                                                            <i className="fas fa-play-circle text-xs" />
                                                            Record
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-100">
                                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No scheduled live sessions for this week.</p>
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