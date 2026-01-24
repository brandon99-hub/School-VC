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
                <div className="mb-8 text-center sm:text-left">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">My Learning Areas</h1>
                    <p className="text-gray-500 mt-2 font-medium">Manage your curriculum subjects, strands, and students</p>
                </div>

                {/* Course Grid */}
                {courses.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-slate-50 p-20 text-center">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                            <span className="text-4xl">📚</span>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Learning Areas Assigned</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">Contact your administrator to get learning areas (Grade subjects) assigned to your profile.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map((course) => (
                            <Link
                                key={course.id}
                                to={`/teacher/courses/${course.id}`}
                                className="bg-white rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all overflow-hidden group"
                            >
                                {/* Course Header */}
                                <div className="bg-[#18216D] p-8 text-white relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
                                    <h3 className="text-2xl font-black mb-1 italic tracking-tight">{course.name}</h3>
                                    <div className="flex items-center justify-between mt-2">
                                        <p className="text-[#FFC425] text-[10px] font-black uppercase tracking-[0.2em]">{course.code}</p>
                                        <span className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest">{course.grade_level_name}</span>
                                    </div>
                                </div>

                                {/* Course Stats */}
                                <div className="p-6">
                                    <div className="grid grid-cols-3 gap-1 mb-6">
                                        <div className="text-center">
                                            <div className="text-xl font-black text-gray-900">
                                                {course.enrolled_students_count || 0}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Students</div>
                                        </div>
                                        <div className="text-center border-x border-gray-100">
                                            <div className="text-xl font-black text-gray-900">
                                                {course.assignments?.length || 0}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Assignments</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="text-xl font-black text-gray-900">
                                                {course.modules?.length || 0}
                                            </div>
                                            <div className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Strands</div>
                                        </div>
                                    </div>

                                    {/* Course Info */}
                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center justify-between">
                                            <span>Target Grade:</span>
                                            <span className="font-black text-[#18216D] bg-[#18216D]/5 px-2 py-0.5 rounded text-[10px] uppercase tracking-widest">{course.grade_level_name}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span>Status:</span>
                                            <span className={`px-2 py-1 text-xs font-black uppercase tracking-tight rounded-full ${course.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Action Button */}
                                    <div className="mt-6">
                                        <div className="w-full px-6 py-4 bg-[#18216D] text-white rounded-2xl text-center text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-900/20 group-hover:bg-[#0D164F] transition-all transform group-hover:scale-[1.02]">
                                            Open Learning Area
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
