import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const UserEditModal = ({ user, isOpen, onClose, onRefresh }) => {
    const { get, put } = useApi();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        grade: '',
        student_ids: [],
    });
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingStudents, setFetchingStudents] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && isOpen) {
            setFormData({
                first_name: user.name?.split(' ')[0] || '',
                last_name: user.name?.split(' ').slice(1).join(' ') || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || '',
                grade: user.grade_level || '',
                student_ids: user.child_ids || [],
            });

            if (user.role === 'parent') {
                const fetchStudents = async () => {
                    setFetchingStudents(true);
                    try {
                        const data = await get('/api/admin/users/');
                        setStudents(data.filter(u => u.role === 'student'));
                    } catch (err) {
                        console.error('Error fetching students:', err);
                    } finally {
                        setFetchingStudents(false);
                    }
                };
                fetchStudents();
            }
        }
    }, [user, isOpen, get]);

    if (!isOpen) return null;

    const toggleStudent = (studentId) => {
        setFormData(prev => ({
            ...prev,
            student_ids: prev.student_ids.includes(studentId)
                ? prev.student_ids.filter(id => id !== studentId)
                : [...prev.student_ids, studentId]
        }));
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.system_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await put(`/api/admin/users/${user.id}/`, formData);
            onRefresh();
            onClose();
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update user records');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl ${user.role === 'parent' ? 'max-w-4xl' : 'max-w-2xl'} w-full overflow-hidden animate-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-white`}>
                <div className="bg-[#18216D] px-10 py-10 text-white relative flex-shrink-0">
                    <h3 className="text-3xl font-black italic">Edit Account</h3>
                    <p className="text-indigo-100/60 text-[10px] font-black uppercase tracking-[0.2em] mt-1 italic">
                        System Identifier: {user.system_id}
                    </p>
                    <button onClick={onClose} className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-10">
                    {/* Left Pane: Core Details */}
                    <div className="flex-1 space-y-6">
                        {error && (
                            <div className="p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                                <i className="fas fa-circle-exclamation"></i>
                                {error}
                            </div>
                        )}

                        <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-user-shield text-indigo-500"></i>
                                Core Profile
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm"
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm"
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm"
                                    required
                                />
                            </div>

                            {user.role === 'student' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                                    <select
                                        value={formData.grade}
                                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm appearance-none cursor-pointer"
                                    >
                                        <option value="">Select Grade</option>
                                        {[...Array(12)].map((_, i) => (
                                            <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Address</label>
                                <textarea
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    rows={2}
                                    className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm resize-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Right Pane: Student Linking (Only for Parents) */}
                    {user.role === 'parent' && (
                        <div className="flex-1 flex flex-col min-h-[400px]">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                <i className="fas fa-user-graduate text-amber-500"></i>
                                Linked Scholars ({formData.student_ids.length})
                            </h4>

                            <div className="relative mb-4">
                                <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by name or ID..."
                                    className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto pr-2 space-y-2 border-t border-slate-50 pt-4">
                                {fetchingStudents ? (
                                    <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading scholars...</div>
                                ) : filteredStudents.length === 0 ? (
                                    <div className="text-center py-10 text-slate-400 text-xs font-bold">No scholars found</div>
                                ) : (
                                    filteredStudents.map(student => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => toggleStudent(student.db_id)}
                                            className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${formData.student_ids.includes(student.db_id)
                                                ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/20'
                                                : 'bg-white border-slate-50 hover:border-slate-100'
                                                }`}
                                        >
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${formData.student_ids.includes(student.db_id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
                                                }`}>
                                                {student.name.charAt(0)}
                                            </div>
                                            <div className="text-left flex-1">
                                                <p className="text-sm font-black text-slate-900 leading-tight">{student.name}</p>
                                                <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{student.system_id}</p>
                                            </div>
                                            {formData.student_ids.includes(student.db_id) && (
                                                <i className="fas fa-check-circle text-indigo-600"></i>
                                            )}
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </form>

                <div className="bg-slate-50 px-10 py-8 flex items-center justify-between flex-shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">
                        All changes are logged in the security audit trail.
                    </p>
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-[#18216D] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50"
                        >
                            {loading ? 'Syncing...' : 'Save Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserEditModal;
