import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { generateAssignmentPDF } from '../utils/pdfGenerator';
import AssignmentSubmission from './student/AssignmentSubmission';
import AttendanceMarker from './student/AttendanceMarker';
import QuizTaker from './student/QuizTaker';
import CollapsibleSection from './CollapsibleSection';
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

const sections = [
    { id: 'overview', label: 'Overview' },
    { id: 'learning-path', label: 'Learning Path' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'submissions', label: 'Submissions' },
    { id: 'discussions', label: 'Discussions' },
    { id: 'schedule', label: 'Schedule' },
];

const SectionShell = ({ id, title, description, children }) => (
    <section id={id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">{title}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {children}
    </section>
);

const CourseDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { get } = useApi();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedModule, setExpandedModule] = useState(null);
    const [expandedLesson, setExpandedLesson] = useState(null);
    const [submissionView, setSubmissionView] = useState('chart');
    const [activeSection, setActiveSection] = useState('overview');
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

    const handleSectionClick = useCallback((sectionId) => {
        setActiveSection(sectionId);
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

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
                    setError('You do not have permission to view this course.');
                } else if (err.status === 404) {
                    setError('Course not found.');
                } else {
                    setError('Failed to load course details. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCourseDetails();
    }, [id, get]);

    if (loading) {
        return (
            <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-64 bg-gray-200 rounded mb-4"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-8">
                <div className="text-red-500 mb-4">{error}</div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="bg-slate-50 min-h-screen">
            <main className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
                <header className="bg-gradient-to-br from-indigo-600 to-blue-500 rounded-3xl text-white p-8 shadow-lg">
                    <div className="space-y-3">
                        <p className="text-sm uppercase tracking-wide font-semibold opacity-80">Course</p>
                        <h1 className="text-3xl sm:text-4xl font-bold">{course.name}</h1>
                        <p className="text-white/80 max-w-2xl">{course.description}</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                        <div className="flex items-center gap-2">
                            <i className="fas fa-chalkboard-teacher" />
                            <span>Instructor: {course.teacher_name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-graduation-cap" />
                            <span>Credits: {course.credits}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <i className="fas fa-calendar" />
                            <span>Semester {course.semester}</span>
                        </div>
                    </div>
                </header>

                <nav className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex flex-wrap gap-2 sticky top-4 z-10">
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => handleSectionClick(section.id)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition ${activeSection === section.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {section.label}
                        </button>
                    ))}
                </nav>

                <section id="overview" className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-xs uppercase text-gray-400 font-semibold">Published Lessons</p>
                        <p className="text-3xl font-semibold text-gray-900 mt-2">
                            {learningSummary.published_lessons || 0}
                            <span className="text-sm text-gray-500 ml-2">/ {learningSummary.total_lessons || 0}</span>
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-xs uppercase text-gray-400 font-semibold">Quizzes</p>
                        <p className="text-3xl font-semibold text-gray-900 mt-2">{learningSummary.quiz_count || 0}</p>
                    </div>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                        <p className="text-xs uppercase text-gray-400 font-semibold">Completed Quizzes</p>
                        <p className="text-3xl font-semibold text-gray-900 mt-2">{studentProgress.completed_quizzes || 0}</p>
                    </div>
                </section>

                {/* Attendance Marker */}
                <AttendanceMarker courseId={id} courseName={course.name} />

                <CollapsibleSection
                    id="learning-path"
                    title="Learning Path"
                    description={`${learningSummary.published_lessons || 0} of ${learningSummary.total_lessons || 0} lessons published`}
                    defaultExpanded={true}
                >
                    {course.modules?.length ? (
                        <div className="space-y-4">
                            {course.modules.map((module) => (
                                <div key={module.id} className="border border-gray-100 rounded-xl overflow-hidden">
                                    <button
                                        className="w-full flex justify-between items-center px-4 py-3 text-left bg-gray-50 hover:bg-gray-100"
                                        onClick={() => setExpandedModule((prev) => (prev === module.id ? null : module.id))}
                                    >
                                        <div>
                                            <p className="text-xs uppercase text-gray-400">Module {module.order}</p>
                                            <h3 className="text-lg font-semibold text-gray-900">{module.title}</h3>
                                            <p className="text-sm text-gray-500">{module.description}</p>
                                        </div>
                                        <i className={`fas fa-chevron-${expandedModule === module.id ? 'up' : 'down'} text-gray-500`} />
                                    </button>
                                    {expandedModule === module.id && (
                                        <div className="p-4 space-y-3">
                                            {module.lessons?.map((lesson) => (
                                                <div key={lesson.id} className="bg-white rounded-lg border p-3">
                                                    <button
                                                        className="w-full flex justify-between items-center text-left"
                                                        onClick={() => setExpandedLesson((prev) => (prev === lesson.id ? null : lesson.id))}
                                                    >
                                                        <div>
                                                            <p className="text-xs uppercase text-gray-400">
                                                                Lesson {lesson.order} · {lesson.duration_minutes} mins
                                                            </p>
                                                            <h4 className="text-md font-semibold text-gray-900">{lesson.title}</h4>
                                                            <p className="text-sm text-gray-500">{lesson.summary}</p>
                                                        </div>
                                                        <i className={`fas fa-chevron-${expandedLesson === lesson.id ? 'up' : 'down'} text-gray-500`} />
                                                    </button>
                                                    {expandedLesson === lesson.id && (
                                                        <div className="mt-3 space-y-3">
                                                            {lesson.contents?.map((content) => (
                                                                <div
                                                                    key={content.id}
                                                                    className="flex items-start bg-blue-50/40 border border-blue-100 rounded-lg p-3"
                                                                >
                                                                    {renderContentIcon(content.content_type)}
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{content.title}</p>
                                                                        {content.body && <p className="text-sm text-gray-600">{content.body}</p>}
                                                                        {content.resource_url && (
                                                                            <a
                                                                                href={content.resource_url}
                                                                                target="_blank"
                                                                                rel="noopener noreferrer"
                                                                                className="text-sm text-indigo-600"
                                                                            >
                                                                                Open resource
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            {lesson.quizzes?.length > 0 && (
                                                                <div className="bg-white rounded-lg border border-amber-100 p-3 space-y-2">
                                                                    {lesson.quizzes.map((quiz) => (
                                                                        <div key={quiz.id} className="flex items-center justify-between">
                                                                            <div>
                                                                                <p className="font-semibold text-gray-900">{quiz.title}</p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {quiz.questions.length} questions · {quiz.time_limit_minutes} mins
                                                                                </p>
                                                                            </div>
                                                                            <button
                                                                                onClick={() => setTakingQuiz(quiz)}
                                                                                className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
                                                                            >
                                                                                Take Quiz
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
                        <p className="text-gray-500">No modules published yet.</p>
                    )}
                </CollapsibleSection>

                <CollapsibleSection id="assignments" title="Assignments" description="All coursework with deadlines and marks." defaultExpanded={true}>
                    {course.assignments?.length ? (
                        <div className="space-y-4">
                            {course.assignments.map((assignment) => (
                                <div key={assignment.id} className="border border-gray-100 rounded-xl p-4 hover:border-indigo-200 transition">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <p className="text-xs uppercase text-gray-400">Assignment</p>
                                            <h3 className="text-lg font-semibold text-gray-900">{assignment.title}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span>
                                                    <i className="fas fa-clock mr-1" />
                                                    Due {new Date(assignment.due_date).toLocaleDateString()}
                                                </span>
                                                <span>
                                                    <i className="fas fa-star mr-1" />
                                                    {assignment.total_marks} marks
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => generateAssignmentPDF(assignment)}
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 whitespace-nowrap"
                                            >
                                                <i className="fas fa-download" />
                                                Download PDF
                                            </button>
                                            <button
                                                onClick={() => setSubmittingAssignment(assignment)}
                                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 whitespace-nowrap"
                                            >
                                                Submit Work
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No assignments available.</p>
                    )}
                </CollapsibleSection>

                {course.student_submissions && (
                    <CollapsibleSection id="submissions" title="Your Submissions" description="Toggle between charts and tables.">
                        <div className="flex flex-wrap items-center gap-3 mb-4">
                            <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                                {['chart', 'table'].map((option) => (
                                    <button
                                        key={option}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${submissionView === option ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'
                                            }`}
                                        onClick={() => setSubmissionView(option)}
                                    >
                                        {option === 'chart' ? 'Chart' : 'Table'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        {submissionView === 'chart' ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="h-64 bg-gray-50 rounded-xl p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadialBarChart innerRadius="40%" outerRadius="90%" data={submissionChartData}>
                                            <RadialBar minAngle={15} cornerRadius={10} clockWise dataKey="value" fill="#4f46e5" />
                                            <Tooltip />
                                        </RadialBarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="h-64 bg-gray-50 rounded-xl p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={submissionTimeline}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                            <XAxis dataKey="date" stroke="#94a3b8" />
                                            <YAxis allowDecimals={false} stroke="#94a3b8" />
                                            <Tooltip />
                                            <Area type="monotone" dataKey="Attempts" stroke="#f97316" fill="#fed7aa" strokeWidth={2} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Assignments</h3>
                                    {submissionData.assignments?.length ? (
                                        <ul className="space-y-2">
                                            {submissionData.assignments.map((submission) => (
                                                <li key={submission.id} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                                                    <span>{submission.assignment_title || `Assignment #${submission.assignment}`}</span>
                                                    <span>
                                                        {submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : '--'}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No submissions yet.</p>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800 mb-2">Quizzes</h3>
                                    {submissionData.quizzes?.length ? (
                                        <ul className="space-y-2">
                                            {submissionData.quizzes.map((submission) => (
                                                <li key={submission.id} className="flex justify-between bg-gray-50 rounded-lg px-3 py-2">
                                                    <span>{submission.quiz_title || `Quiz #${submission.quiz}`}</span>
                                                    <span>{submission.score ?? '--'} pts</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-gray-500 text-sm">No quiz attempts yet.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CollapsibleSection>
                )}

                <SectionShell id="discussions" title="Discussion Board" description="Highlights from the class forum.">
                    {course.discussion_threads?.length ? (
                        <div className="space-y-4">
                            {course.discussion_threads.map((thread) => (
                                <div key={thread.id} className="border border-gray-100 rounded-xl p-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-xs text-gray-400">
                                                {thread.created_by_name} • {new Date(thread.created_at).toLocaleDateString()}
                                            </p>
                                            <h3 className="text-lg font-semibold text-gray-900">{thread.title}</h3>
                                            <p className="text-sm text-gray-600">{thread.body}</p>
                                        </div>
                                        {thread.is_pinned && (
                                            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Pinned</span>
                                        )}
                                    </div>
                                    {thread.comments?.length > 0 && (
                                        <div className="mt-3 border-t border-gray-100 pt-3 space-y-2">
                                            {thread.comments.slice(0, 3).map((comment) => (
                                                <div key={comment.id} className="text-sm text-gray-600">
                                                    <span className="font-semibold">{comment.author_name}</span>: {comment.body}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No discussions yet.</p>
                    )}
                </SectionShell>

                <SectionShell id="schedule" title="Virtual Class Schedule" description="Upcoming live sessions and recordings.">
                    {course.schedules?.length ? (
                        <div className="space-y-3">
                            {course.schedules.map((schedule) => (
                                <div
                                    key={schedule.id}
                                    className="border border-gray-100 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4"
                                >
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">{schedule.day}</h3>
                                        <p className="text-sm text-gray-500">
                                            {schedule.start_time} – {schedule.end_time}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {schedule.meeting_link && (
                                            <a
                                                href={schedule.meeting_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 rounded-lg text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                                            >
                                                <i className="fas fa-video mr-2" />
                                                Join
                                            </a>
                                        )}
                                        {schedule.recording_link && (
                                            <a
                                                href={schedule.recording_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-2 rounded-lg text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200"
                                            >
                                                <i className="fas fa-play-circle mr-2" />
                                                Recording
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500">No schedule available.</p>
                    )}
                </SectionShell>
            </main>

            {/* Assignment Submission Modal */}
            {submittingAssignment && (
                <AssignmentSubmission
                    assignment={submittingAssignment}
                    onClose={() => setSubmittingAssignment(null)}
                    onSubmit={() => {
                        // Refresh course data after submission
                        window.location.reload();
                    }}
                />
            )}

            {/* Quiz Taker Modal */}
            {takingQuiz && (
                <QuizTaker
                    quiz={takingQuiz}
                    onClose={() => setTakingQuiz(null)}
                    onComplete={() => {
                        // Refresh course data after quiz completion
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
};

export default CourseDetail;