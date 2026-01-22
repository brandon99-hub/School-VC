import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const TeacherCourseList = () => {
    const { user } = useAuth();
    const { get } = useApi();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            setLoading(true);
            const response = await get('/teachers/api/courses/');
            // Handle new API structure: {courses: [...], unique_student_count: N}
            setCourses(response?.courses || []);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setError('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading courses...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">My Courses</h1>
                    <p className="text-gray-600 mt-2">Manage your course content and students</p>
                </div>

                {/* Course Grid */}
                {courses.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                        <div className="text-gray-400 text-6xl mb-4">📚</div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No courses assigned</h3>
                        <p className="text-gray-600">Contact your administrator to get courses assigned to you.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                to={`/teacher/courses/${course.id}`}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden group"
                            >
                                {/* Course Header */}
                                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
                                    <h3 className="text-xl font-bold mb-1">{course.name}</h3>
                                    <p className="text-blue-100 text-sm">{course.code}</p>
                                </div>

                                {/* Course Stats */}
                                <div className="p-6">
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {course.enrolled_students_count || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Students</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {course.assignments?.length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Assignments</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-2xl font-bold text-gray-900">
                                                {course.modules?.length || 0}
                                            </div>
                                            <div className="text-xs text-gray-600">Modules</div>
                                        </div>
                                    </div>

                                    {/* Course Info */}
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span>Semester:</span>
                                            <span className="font-medium text-gray-900">
                                                {course.semester === '1' && 'First'}
                                                {course.semester === '2' && 'Second'}
                                                {course.semester === '3' && 'Third'}
                                                {course.semester === '4' && 'Fourth'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Credits:</span>
                                            <span className="font-medium text-gray-900">{course.credits}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Status:</span>
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${course.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-6">
                                        <div className="w-full px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-center font-medium group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            Manage Course →
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourseList;
