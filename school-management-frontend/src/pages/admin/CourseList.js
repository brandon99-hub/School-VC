import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const CourseList = () => {
    const { get, del, patch } = useApi();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSemester, setFilterSemester] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [editingArea, setEditingArea] = useState(null);
    const [deletingArea, setDeletingArea] = useState(null);
    const [teachers, setTeachers] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchCourses = React.useCallback(async () => {
        try {
            const data = await get('/api/cbc/learning-areas/');
            setCourses(data);
        } catch (error) {
            console.error('Error fetching learning areas:', error);
        }
    }, [get]);

    const fetchTeachers = React.useCallback(async () => {
        try {
            const data = await get('/api/admin/teachers/');
            setTeachers(data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    }, [get]);

    useEffect(() => {
        fetchCourses();
        fetchTeachers();
    }, [fetchCourses, fetchTeachers]);

    const handleUpdateArea = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await patch(`/api/cbc/learning-areas/${editingArea.id}/`, {
                name: editingArea.name,
                code: editingArea.code,
                is_active: editingArea.is_active,
                teacher: editingArea.teacher
            });
            fetchCourses();
            setEditingArea(null);
        } catch (error) {
            console.error('Error updating learning area:', error);
            alert('Failed to update learning area');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!deletingArea) return;
        try {
            await del(`/api/cbc/learning-areas/${deletingArea.id}/`);
            fetchCourses();
            setDeletingArea(null);
        } catch (error) {
            console.error('Error deleting learning area:', error);
            alert('Failed to delete learning area');
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
                                            <div className="text-sm font-black text-gray-900">{course.student_count || 0}</div>
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
                                                onClick={() => setEditingArea(course)}
                                                className="text-indigo-600 hover:text-indigo-900 font-black text-[10px] uppercase tracking-widest"
                                            >
                                                Manage
                                            </button>
                                            <button
                                                onClick={() => setDeletingArea(course)}
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

            {/* Edit Modal */}
            {editingArea && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500">
                        <div className="bg-[#18216D] px-10 py-12 text-white relative">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/20">
                                    <i className="fas fa-pen-nib text-[#FFC425] text-xl"></i>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black uppercase tracking-tight">Manage Learning Area</h3>
                                    <p className="text-indigo-100/60 text-sm font-medium">Configure subject details and faculty assignment</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingArea(null)} className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
                                <i className="fas fa-times text-2xl"></i>
                            </button>
                        </div>

                        <form onSubmit={handleUpdateArea} className="p-10 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject Title</label>
                                    <input
                                        type="text"
                                        value={editingArea.name}
                                        onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-2xl transition-all outline-none text-sm font-black"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Curriculum Code</label>
                                    <input
                                        type="text"
                                        value={editingArea.code}
                                        onChange={(e) => setEditingArea({ ...editingArea, code: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-2xl transition-all outline-none text-sm font-mono font-black"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Faculty Member</label>
                                <div className="relative">
                                    <select
                                        value={editingArea.teacher || ''}
                                        onChange={(e) => setEditingArea({ ...editingArea, teacher: e.target.value || null })}
                                        className="w-full px-5 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-2xl transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                                    >
                                        <option value="">Vacant (Unassigned)</option>
                                        {teachers.map(teacher => (
                                            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                                        ))}
                                    </select>
                                    <i className="fas fa-chevron-down absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-xs"></i>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-6 bg-slate-50/50 rounded-[2rem] border border-slate-100">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${editingArea.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
                                        <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Visibility Status</p>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">Define if this learning area is currently active for students.</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setEditingArea({ ...editingArea, is_active: !editingArea.is_active })}
                                    className={`w-14 h-7 rounded-full transition-all relative ${editingArea.is_active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-slate-300'}`}
                                >
                                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all shadow-sm ${editingArea.is_active ? 'left-8' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="pt-6 flex gap-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingArea(null)}
                                    className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-[#18216D] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#1e2985] hover:shadow-2xl hover:shadow-indigo-900/20 active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            <span>Saving Changes...</span>
                                        </>
                                    ) : (
                                        'Commit Settings'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {deletingArea && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md p-8 border border-white animate-in zoom-in duration-200">
                        <div className="h-16 w-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center text-2xl mb-6">
                            <i className="fas fa-trash-can"></i>
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Delete Area?</h3>
                        <p className="text-slate-500 mt-2 font-medium">
                            Are you sure you want to delete <span className="font-bold text-slate-900">{deletingArea.name}</span>? This action cannot be undone and will affect student enrollments.
                        </p>
                        <div className="mt-8 flex gap-3">
                            <button
                                onClick={() => setDeletingArea(null)}
                                className="flex-1 px-6 py-4 border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all"
                            >
                                Back
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-6 py-4 bg-rose-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-rose-600 shadow-lg shadow-rose-900/20 transition-all"
                            >
                                Confirm Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CourseList;
