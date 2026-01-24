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
            const data = await get('/api/cbc/learning-areas/');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching learning areas:', error);
        }
    }, [get]);

    useEffect(() => {
        fetchCourses();
    }, [fetchCourses]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this learning area?')) {
            try {
                await del(`/api/cbc/learning-areas/${id}/`);
                fetchCourses();
            } catch (error) {
                console.error('Error deleting learning area:', error);
                alert('Failed to delete learning area');
            }
        }
    };

    const filteredCourses = courses.filter(course => {
        const matchesSearch =
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.teacher_name?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && course.is_active) ||
            (filterStatus === 'inactive' && !course.is_active);

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Learning Areas</h1>
                    <p className="text-gray-500 font-medium">Manage all subjects and teacher assignments in the system</p>
                </div>
                <Link
                    to="/admin/curriculum"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-bold flex items-center space-x-2"
                >
                    <i className="fas fa-plus"></i>
                    <span>Add via Registry</span>
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 relative">
                        <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search learning areas, code, or teacher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-medium"
                        />
                    </div>
                    <div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-bold"
                        >
                            <option value="all">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Learning Area Table */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredCourses.length === 0 ? (
                    <div className="text-center py-24 text-gray-400">
                        <div className="text-5xl mb-4 text-gray-200">
                            <i className="fas fa-book-open"></i>
                        </div>
                        <p className="text-lg font-bold">No learning areas found</p>
                        <Link to="/admin/curriculum" className="text-indigo-600 hover:text-indigo-800 mt-2 inline-block font-black uppercase text-xs tracking-widest">
                            Go to Curriculum Registry →
                        </Link>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Learning Area</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Grade</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-left">Teacher</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Students</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight text-sm">{course.name}</div>
                                                <div className="text-xs font-mono text-gray-400 mt-0.5">{course.code}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-black text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block">{course.grade_level_name}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-600">{course.teacher_name || <span className="text-gray-300 italic">Not assigned</span>}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="text-sm font-black text-gray-900">{course.enrolled_students_count || 0}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full ${course.is_active
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {course.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-3">
                                            <button
                                                onClick={() => navigate(`/admin/curriculum`)}
                                                className="text-indigo-600 hover:text-indigo-900 font-black text-[10px] uppercase tracking-widest"
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => handleDelete(course.id)}
                                                className="text-red-500 hover:text-red-700 font-black text-[10px] uppercase tracking-widest"
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
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                Displaying {filteredCourses.length} Learning Areas
            </div>
        </div>
    );
};

export default CourseList;
