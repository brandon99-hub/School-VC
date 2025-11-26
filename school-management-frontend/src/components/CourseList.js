import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';
import { useAppState } from '../context/AppStateContext';
import { useNavigate } from 'react-router-dom';
import { enrollStudent } from '../api/courses';
import CourseModal from './CourseModal';

const CourseList = () => {
    const { user } = useAuth();
    const { get } = useApi();
    const { courses, loading, error, dispatch, refresh } = useAppState();
    const navigate = useNavigate();
    const [availableCourses, setAvailableCourses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [hasFetchedAvailable, setHasFetchedAvailable] = useState(false);
    const [availableLoading, setAvailableLoading] = useState(false);
    const [availableError, setAvailableError] = useState('');
    const [enrollmentError, setEnrollmentError] = useState('');
    const [enrollmentSuccess, setEnrollmentSuccess] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [currentAvailablePage, setCurrentAvailablePage] = useState(1);
    const coursesPerPage = 3;
    const availableCoursesPerPage = 5;

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
                const allCourses = await get('/api/courses/');
                setAvailableCourses(allCourses);
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

    const handleEnrollCourse = async (courseId) => {
        if (!user?.id) {
            setEnrollmentError('User ID not found. Please log in again.');
            return;
        }
        setEnrollmentError('');
        setEnrollmentSuccess('');
        try {
            await enrollStudent(courseId);
            setIsModalOpen(false);
            const updatedCourses = await get(`/students/${user.id}/courses/`);
            dispatch({ type: 'SET_COURSES', payload: updatedCourses });
            setEnrollmentSuccess('Course added to your schedule.');
            refresh();
        } catch (err) {
            console.error('Enrollment error:', err);
            setEnrollmentError('Enrollment failed. Please try again.');
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
        if (progress >= 90) return 'bg-green-600';
        if (progress >= 75) return 'bg-blue-600';
        if (progress >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
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
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-gray-800">Enrolled Courses</h2>
                    <p className="text-gray-500 text-sm mt-1">Your current semester courses</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search courses by name, code, or teacher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <i className="fas fa-search absolute right-3 top-3 text-gray-400"></i>
                    </div>
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <i className="fas fa-plus mr-2"></i>
                        Add Course
                    </button>
                </div>
            </div>

            {enrollmentError && (
                <div className="text-red-500 mb-4">{enrollmentError}</div>
            )}
            {enrollmentSuccess && (
                <div className="text-green-600 mb-4 flex items-center justify-between">
                    <span>{enrollmentSuccess}</span>
                    <button
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => setEnrollmentSuccess('')}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {currentCourses.length === 0 ? (
                <div className="text-gray-500 p-4">
                    No enrolled courses found.
                    <button onClick={handleRefresh} className="ml-4 text-blue-600 hover:underline">
                        Refresh
                    </button>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        {currentCourses.map((course) => (
                            <div
                                key={course.id}
                                className="border rounded-xl p-4 hover:border-blue-500 transition-all duration-200 transform hover:-translate-y-1 hover:shadow-md"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{course.name}</h3>
                                        <p className="text-gray-600 flex items-center">
                                            <i className="fas fa-chalkboard-teacher mr-2"></i>
                                            {course.teacher_name}
                                        </p>
                                        <p className="text-sm text-gray-500 flex items-center mt-1">
                                            <i className="fas fa-clock mr-2"></i>
                                            {course.schedule}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                            <i className="fas fa-bookmark"></i>
                                        </button>
                                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                                            <i className="fas fa-ellipsis-v"></i>
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-600">Course Progress</span>
                                        <span
                                            className={`font-medium ${
                                                course.progress >= 75 ? 'text-blue-600' : 'text-gray-600'
                                            }`}
                                        >
                                            {course.progress}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className={`${getProgressColor(
                                                course.progress
                                            )} h-2 rounded-full transition-all duration-500 ease-out`}
                                            style={{ width: `${course.progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors flex items-center"
                                        onClick={() => handleViewDetails(course.id)}
                                    >
                                        View Details
                                        <i className="fas fa-chevron-right ml-2"></i>
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