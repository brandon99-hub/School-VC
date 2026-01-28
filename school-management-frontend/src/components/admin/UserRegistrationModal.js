import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const UserRegistrationModal = ({ onClose }) => {
    const { post, get } = useApi();
    const { showToast } = useAppState();
    const [submitting, setSubmitting] = useState(false);
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [fetchingStudents, setFetchingStudents] = useState(false);

    const [formData, setFormData] = useState({
        role: 'student',
        first_name: '',
        last_name: '',
        email: '',
        password: Math.random().toString(36).slice(-8),
        student_id: '',
        teacher_id: '',
        grade: '',
        phone: '',
        address: '',
        student_ids: []
    });

    useEffect(() => {
        if (formData.role === 'parent' && students.length === 0) {
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
    }, [formData.role, get, students.length]);

    const toggleStudent = (dbId) => {
        setFormData(prev => ({
            ...prev,
            student_ids: prev.student_ids.includes(dbId)
                ? prev.student_ids.filter(id => id !== dbId)
                : [...prev.student_ids, dbId]
        }));
    };

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.system_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await post('/api/admin/add-user/', formData);
            showToast(`${formData.role.toUpperCase()} registered. Welcome email sent!`, 'success');
            onClose();
        } catch (error) {
            console.error('Registration error:', error);
            showToast(error.response?.data?.error || 'Failed to register user', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const roles = [
        { id: 'student', label: 'Scholar', icon: 'fa-user-graduate' },
        { id: 'teacher', label: 'Faculty', icon: 'fa-chalkboard-user' },
        { id: 'parent', label: 'Guardian', icon: 'fa-user-group' }
    ];

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl w-full ${formData.role === 'parent' ? 'max-w-5xl' : 'max-w-2xl'} overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col`}>
                {/* Compact Header Section */}
                <div className="p-8 pb-6 border-b border-slate-50 flex items-center justify-between flex-shrink-0 bg-slate-50/30">
                    <div className="flex items-center gap-10">
                        <div>
                            <h2 className="text-2xl font-black text-[#18216D] tracking-tighter uppercase italic leading-none">System Enrollment</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5">Expanding the Kianda Ecosystem Hub</p>
                        </div>

                        {/* Inline Role Switcher */}
                        <div className="flex flex-wrap p-1 bg-white border border-slate-100 rounded-2xl shadow-sm">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role.id })}
                                    className={`px-4 sm:px-6 py-2 rounded-xl flex items-center gap-2 transition-all duration-300 ${formData.role === role.id
                                        ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/10'
                                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <i className={`fas ${role.icon} text-[10px] ${formData.role === role.id ? 'text-[#FFC425]' : 'text-slate-300'}`}></i>
                                    <span className="text-[9px] font-black uppercase tracking-widest leading-none">{role.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all border border-transparent hover:border-rose-100 bg-white shadow-sm">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Form Area */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-4 space-y-8">
                    <div className={`flex flex-col ${formData.role === 'parent' ? 'lg:flex-row' : ''} gap-10`}>
                        {/* Fields Column */}
                        <div className="flex-1 space-y-6">
                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm transition-all"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm transition-all"
                                        placeholder="Doe"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway Email Address</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm transition-all"
                                    placeholder="john.doe@kiandaschool.ac.ke"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {formData.role !== 'parent' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            {formData.role === 'student' ? 'Admission Token' : 'Staff Serial'}
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.role === 'student' ? formData.student_id : formData.teacher_id}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                [formData.role === 'student' ? 'student_id' : 'teacher_id']: e.target.value
                                            })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-mono font-black text-sm"
                                            placeholder={formData.role === 'student' ? 'K-2024-001' : 'FAC-101'}
                                            required={formData.role !== 'parent'}
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Credentials</label>
                                    <div className="relative group">
                                        <input
                                            type="text"
                                            value={formData.password}
                                            readOnly
                                            className="w-full px-5 py-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl text-sm font-mono font-black text-[#18216D]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, password: Math.random().toString(36).slice(-8) })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-white text-indigo-600 shadow-sm border border-indigo-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                        >
                                            <i className="fas fa-rotate text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {formData.role !== 'student' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            placeholder="+254..."
                                            required={formData.role !== 'student'}
                                        />
                                    </div>
                                )}
                                {formData.role === 'student' && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Designation</label>
                                        <select
                                            value={formData.grade}
                                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm appearance-none cursor-pointer"
                                            required
                                        >
                                            <option value="">Select Grade</option>
                                            {[...Array(12)].map((_, i) => (
                                                <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                {formData.role !== 'student' && (
                                    <div className="space-y-2 col-span-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            placeholder="Physical address..."
                                            required={formData.role !== 'student'}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Scholar Selector (Guardian Role Only) */}
                        {formData.role === 'parent' && (
                            <div className="lg:w-80 flex flex-col bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <i className="fas fa-link text-emerald-500 text-xs"></i>
                                    Link Scholars ({formData.student_ids.length})
                                </h4>

                                <div className="relative mb-4">
                                    <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-xs"></i>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border-none rounded-xl text-[11px] font-black focus:ring-2 focus:ring-[#18216D]/5 shadow-sm"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1">
                                    {fetchingStudents ? (
                                        <div className="text-center py-10 text-[9px] font-black text-slate-400 uppercase animate-pulse">Querying Database...</div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="text-center py-10 text-[9px] font-black text-slate-300">No Records Found</div>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <button
                                                key={student.id}
                                                type="button"
                                                onClick={() => toggleStudent(student.db_id)}
                                                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border-2 ${formData.student_ids.includes(student.db_id)
                                                    ? 'bg-white border-[#18216D] shadow-md'
                                                    : 'bg-white/50 border-transparent hover:border-slate-200'}`}
                                            >
                                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-[10px] ${formData.student_ids.includes(student.db_id) ? 'bg-[#18216D] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="text-left flex-1 min-w-0">
                                                    <p className="text-[11px] font-black text-slate-900 truncate leading-tight">{student.name}</p>
                                                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{student.system_id}</p>
                                                </div>
                                                {formData.student_ids.includes(student.db_id) && (
                                                    <i className="fas fa-check-circle text-[#18216D] text-xs"></i>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="p-8 bg-slate-50/50 flex-shrink-0 flex items-center justify-between gap-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        All access credentials are automatically generated <br />and dispatched via the system gateway.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-all active:scale-95"
                        >
                            Dismiss
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 flex items-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-circle-notch animate-spin"></i>
                                    Processing
                                </>
                            ) : 'Authorize Access'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserRegistrationModal;
