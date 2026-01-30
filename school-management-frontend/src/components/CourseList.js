import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import { useNavigate } from 'react-router-dom';
import { enrollStudent } from '../api/courses';
import CourseModal from './CourseModal';

const CourseList = () => {
    const { user } = useAuth();
    const { get, post } = useApi();
    const { courses, loading, error, dispatch, refresh, showToast } = useAppState();
    const navigate = useNavigate();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasFetchedAvailable, setHasFetchedAvailable] = useState(false);
    const [availableLoading, setAvailableLoading] = useState(false);
    const [availableError, setAvailableError] = useState('');
    const [enrollmentError, setEnrollmentError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentAvailablePage, setCurrentAvailablePage] = useState(1);
    const coursesPerPage = 6;
    const availableCoursesPerPage = 10;

    useEffect(() => {
        const fetchAvailableCourses = async () => {
            if (hasFetchedAvailable) return;

            if (!user?.id) {
                setAvailableError('User ID not found. Please log in again.');
                setHasFetchedAvailable(true);
                return;
            }
            setAvailableLoading(true);
            try {
                const queryParams = new URLSearchParams();
                if (user?.grade_level) {
                    queryParams.append('grade_level', user.grade_level);
                }
                // Fetch from CBC Learning Areas instead of Course objects
                const data = await get(`/api/cbc/learning-areas/?${queryParams.toString()}`);
                // Handle paginated response if applicable, otherwise default to direct array
                const learningAreas = data.results || data;
                setAvailableCourses(learningAreas);
            } catch (err) {
                console.error('Available courses fetch error:', err);
                setAvailableError('Failed to load available courses. Please try again later.');
            } finally {
                setAvailableLoading(false);
                setHasFetchedAvailable(true);
            }
        };

        fetchAvailableCourses();
    }, [get, user, hasFetchedAvailable]);

    const handleEnrollCourse = async (learningAreaId) => {
        if (!user?.id) {
            setEnrollmentError('User ID not found. Please log in again.');
            return;
        }
        setEnrollmentError('');
        try {
            // Use the new CBC enrollment endpoint with correct POST method
            await post(`/api/cbc/learning-areas/${learningAreaId}/enroll/`);
            setIsModalOpen(false);

            // Refresh local state
            setHasFetchedAvailable(false);
            refresh();
            showToast('Learning Area added to your profile.', 'success');
        } catch (err) {
            console.error('Enrollment error:', err);
            setEnrollmentError(err.response?.data?.error || 'Enrollment failed. Please try again.');
        }
    };

    const handleViewDetails = (courseId) => {
        navigate(`/courses/api/${courseId}/`);
    };

    const handleRefresh = () => {
        setAvailableError('');
        setEnrollmentError('');
        refresh();
    };

    const handleRetryAvailable = () => {
        setAvailableError('');
        setHasFetchedAvailable(false);
    };

    const getProgressColor = (progress) => {
        if (progress >= 90) return 'bg-emerald-500';
        if (progress >= 75) return 'bg-[#18216D]';
        if (progress >= 50) return 'bg-[#FFC425]';
        return 'bg-rose-500';
    };

    // Filter courses based on search term
    const filteredCourses = courses.filter(course => {
        const searchLower = searchTerm.toLowerCase();
        return (
            course.name.toLowerCase().includes(searchLower) ||
            course.code.toLowerCase().includes(searchLower) ||
            (course.teacher_name && course.teacher_name.toLowerCase().includes(searchLower))
        );
    });

    const filteredAvailableCourses = availableCourses.filter(course => {
        const searchLower = searchTerm.toLowerCase();
        return (
            course.name.toLowerCase().includes(searchLower) ||
            course.code.toLowerCase().includes(searchLower) ||
            (course.teacher_name && course.teacher_name.toLowerCase().includes(searchLower))
        );
    });

    // Pagination
    const indexOfLastCourse = currentPage * coursesPerPage;
    const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
    const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
    const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

    const indexOfLastAvailableCourse = currentAvailablePage * availableCoursesPerPage;
    const indexOfFirstAvailableCourse = indexOfLastAvailableCourse - availableCoursesPerPage;
    const currentAvailableCourses = filteredAvailableCourses.slice(indexOfFirstAvailableCourse, indexOfLastAvailableCourse);
    const totalAvailablePages = Math.ceil(filteredAvailableCourses.length / availableCoursesPerPage);

    if (loading) return <div className="text-center py-8">Loading courses...</div>;
    if (error)
        return (
            <div className="text-red-500 p-4">
                {error}
                <button onClick={handleRefresh} className="ml-4 text-blue-600 hover:underline">
                    Retry
                </button>
            </div>
        );

    if (availableLoading) return <div className="text-center py-8">Loading available courses...</div>;
    if (availableError)
        return (
            <div className="text-red-500 p-4">
                {availableError}
                <button onClick={handleRetryAvailable} className="ml-4 text-blue-600 hover:underline">
                    Retry
                </button>
            </div>
        );

    const enrolledCourseIds = courses.map((course) => course.id);

    return (
        <div className="bg-white rounded-3xl shadow-sm p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">My Learning Areas</h2>
                    <p className="text-gray-500 font-medium mt-1">Academic subjects and competency pathways</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                    <div className="relative flex-1 sm:min-w-[300px]">
                        <input
                            type="text"
                            placeholder="Search subjects, codes, or teachers..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#18216D]/10 transition-all font-bold text-gray-900 placeholder-gray-400"
                        />
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-300"></i>
                    </div>
                    <button
                        className="px-6 py-3 bg-[#18216D] text-white rounded-2xl hover:bg-[#0D164F] transition-all font-black shadow-xl shadow-indigo-900/20 flex items-center justify-center space-x-2 text-xs uppercase tracking-widest"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="fas fa-plus"></i>
                        <span>Register Subject</span>
                    </button>
                </div>
            </div>

            {enrollmentError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl font-bold mb-6 flex items-center">
                    <i className="fas fa-exclamation-circle mr-3" />
                    {enrollmentError}
                </div>
            )}

            {currentCourses.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                        <i className="fas fa-book text-gray-300 text-2xl" />
                    </div>
                    <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">No learning areas registered yet.</p>
                    <button onClick={handleRefresh} className="mt-4 text-blue-600 font-black text-sm uppercase tracking-wider hover:underline">
                        Refresh Schedule
                    </button>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {currentCourses.map((course) => (
                            <div
                                key={course.id}
                                className="group bg-white border border-gray-100 rounded-3xl p-6 hover:shadow-2xl hover:shadow-gray-200/50 transition-all duration-500 flex flex-col relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full -mr-16 -mt-16 group-hover:scale-110 transition-transform"></div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 text-[10px] font-black bg-[#18216D] text-white rounded-lg uppercase tracking-wider">{course.code}</span>
                                        <button className="text-gray-200 hover:text-[#FFC425] transition-colors">
                                            <i className="fas fa-bookmark stroke-[2]"></i>
                                        </button>
                                    </div>

                                    <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight group-hover:text-[#18216D] transition-colors">{course.name}</h3>

                                    <div className="space-y-3 mt-4">
                                        <div className="flex items-center text-sm font-bold text-gray-400">
                                            <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center mr-3">
                                                <i className="fas fa-user-tie text-[10px]" />
                                            </div>
                                            {course.teacher_name}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm font-bold">
                                            <div className="flex items-center text-indigo-600">
                                                <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center mr-2">
                                                    <i className="fas fa-tasks text-[10px]" />
                                                </div>
                                                {course.assignments?.length || 0} Assignments
                                            </div>
                                            <div className="flex items-center text-amber-600">
                                                <div className="w-6 h-6 rounded-full bg-amber-50 flex items-center justify-center mr-2">
                                                    <i className="fas fa-question-circle text-[10px]" />
                                                </div>
                                                {course.quizzes?.length || 0} Quizzes
                                            </div>
                                        </div>
                                    </div>



                                    <button
                                        className="w-full mt-8 py-4 bg-slate-50 text-[#18216D] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#18216D] hover:text-white transition-all shadow-sm group-hover:shadow-xl group-hover:shadow-indigo-900/10 flex items-center justify-center space-x-2"
                                        onClick={() => handleViewDetails(course.id)}
                                    >
                                        <span>Continue Learning</span>
                                        <i className="fas fa-arrow-right text-[10px]" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination for enrolled courses */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex justify-center gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-3 py-1 rounded border disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-3 py-1">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-3 py-1 rounded border disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}

            {isModalOpen && (
                <CourseModal
                    availableCourses={currentAvailableCourses}
                    enrolledCourseIds={enrolledCourseIds}
                    onEnroll={handleEnrollCourse}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEnrollmentError('');
                    }}
                    currentPage={currentAvailablePage}
                    totalPages={totalAvailablePages}
                    onPageChange={setCurrentAvailablePage}
                />
            )}
        </div>
    );
};

export default CourseList;