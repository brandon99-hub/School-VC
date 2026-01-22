import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const CourseList = () => {
    const { get, del } = useApi();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const fetchCourses = React.useCallback(async () => {
        try {
            const data = await get('/api/admin/courses/');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    }, [get]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await del(`/api/admin/courses/${id}/`);
                fetchCourses();
            } catch (error) {
                console.error('Error deleting course:', error);
                alert('Failed to delete course');
            }
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSemester = filterSemester === 'all' || course.semester === filterSemester;
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && course.is_active) ||
            (filterStatus === 'inactive' && !course.is_active);

        return matchesSearch && matchesSemester && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Courses</h1>
                    <p className="text-gray-600 mt-1">Manage all courses in the system</p>
                </div>
                <Link
                    to="/admin/courses/new"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium flex items-center space-x-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>Add Course</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search courses, code, or teacher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        />
                    </div>
                    <div>
                        <select
                            value={filterSemester}
                            onChange={(e) => setFilterSemester(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        >
                            <option value="all">All Semesters</option>
                            <option value="1">First</option>
                            <option value="2">Second</option>
                            <option value="3">Third</option>
                            <option value="4">Fourth</option>
                        </select>
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Course Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <div className="text-5xl mb-4 text-gray-200">
                            <i className="fas fa-book-open"></i>
                        </div>
                        <p className="text-lg font-medium text-gray-900">No courses found</p>
                        <Link to="/admin/courses/new" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block font-medium">
                            Create your first course →
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left">Course</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left">Teacher</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left">Semester</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left text-center">Students</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-left text-center">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{course.name}</div>
                                                <div className="text-xs font-mono text-gray-400 mt-0.5">{course.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-600">{course.teacher_name || 'Not assigned'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-600">
                                                {course.semester === '1' && 'First'}
                                                {course.semester === '2' && 'Second'}
                                                {course.semester === '3' && 'Third'}
                                                {course.semester === '4' && 'Fourth'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm font-bold text-gray-900">{course.student_count || 0}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full ${course.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button
                                                onClick={() => navigate(`/admin/courses/${course.id}/edit`)}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold text-xs uppercase tracking-widest"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(course.id)}
                                                className="text-red-500 hover:text-red-700 font-bold text-xs uppercase tracking-widest"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Summary */}
            <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Showing {filteredCourses.length} of {courses.length} courses
            </div>
        </div>
    );
};

export default CourseList;
