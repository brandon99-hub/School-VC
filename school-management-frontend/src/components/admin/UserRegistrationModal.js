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

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className={`bg-white rounded-[2.5rem] shadow-2xl w-full ${formData.role === 'parent' ? 'max-w-6xl' : 'max-w-4xl'} overflow-hidden border border-white/20 flex flex-col md:flex-row animate-in zoom-in-95 duration-500 max-h-[90vh]`}>
                {/* Visual Side Panel */}
                <div className="md:w-1/3 bg-[#18216D] p-12 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
                            <i className="fas fa-user-plus text-xl text-[#FFC425]"></i>
                        </div>
                        <h3 className="text-4xl font-black italic tracking-tighter leading-none mb-4">System<br />Enrollment</h3>
                        <p className="text-indigo-100/60 text-sm font-medium leading-relaxed">
                            {formData.role === 'parent'
                                ? 'Onboard parents and link them securely to their scholars.'
                                : 'Expanding the Kianda ecosystem. Onboard new faculty or scholars with automated credential delivery.'}
                        </p>
                    </div>
                </div>

                {/* Form Panel */}
                <div className="flex-1 p-10 md:p-14 bg-white overflow-y-auto">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex p-1 bg-slate-100 rounded-2xl w-full max-w-[320px]">
                            {['student', 'teacher', 'parent'].map(role => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: role })}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 ${formData.role === role ? 'bg-white text-[#18216D] shadow-lg shadow-indigo-900/5' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {role === 'student' ? 'Scholar' : role === 'teacher' ? 'Faculty' : 'Parent'}
                                </button>
                            ))}
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-300 hover:text-[#18216D] transition-colors rounded-full hover:bg-slate-50">
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-10">
                        <div className="flex-1 space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-bold placeholder:text-slate-300"
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
                                        className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-bold placeholder:text-slate-300"
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
                                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-bold placeholder:text-slate-300"
                                    placeholder="john.doe@kiandaschool.ac.ke"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
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
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-mono font-black placeholder:text-slate-300"
                                            placeholder={formData.role === 'student' ? 'K-2024-001' : 'FAC-101'}
                                            required={formData.role !== 'parent'}
                                        />
                                    </div>
                                )}
                                {formData.role !== 'student' && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-bold placeholder:text-slate-300"
                                            placeholder="+254 712 345 678"
                                            required={formData.role !== 'student'}
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
                                            className="w-full px-6 py-4 bg-indigo-50/50 border border-indigo-100 rounded-[1.25rem] text-sm font-mono font-black text-[#18216D] selection:bg-indigo-100"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, password: Math.random().toString(36).slice(-8) })}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white text-indigo-600 shadow-sm border border-indigo-100 flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
                                            title="Regenerate Credentials"
                                        >
                                            <i className="fas fa-rotate text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {formData.role === 'student' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Designation</label>
                                    <select
                                        value={formData.grade}
                                        onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-bold appearance-none cursor-pointer"
                                        required
                                    >
                                        <option value="">Select Grade</option>
                                        {[...Array(10)].map((_, i) => (
                                            <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {formData.role !== 'student' && (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        rows={2}
                                        className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#18216D]/20 focus:bg-white rounded-[1.25rem] transition-all outline-none text-sm font-bold placeholder:text-slate-300 resize-none"
                                        placeholder="Physical address..."
                                        required={formData.role !== 'student'}
                                    />
                                </div>
                            )}

                            <div className="pt-8 flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:text-slate-600"
                                >
                                    Dismiss
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-[#18216D] text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-[#1e2985] shadow-xl shadow-indigo-900/10 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
                                >
                                    {submitting ? 'Processing...' : 'Authorize Access'}
                                </button>
                            </div>
                        </div>

                        {formData.role === 'parent' && (
                            <div className="md:w-1/3 flex flex-col min-h-[400px] border-l border-slate-50 pl-10">
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
                                        className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-[#18216D]/20 transition-all"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 space-y-2 border-t border-slate-50 pt-4 max-h-[400px]">
                                    {fetchingStudents ? (
                                        <div className="text-center py-10 text-slate-400 text-xs font-black uppercase animate-pulse">Loading scholars...</div>
                                    ) : filteredStudents.length === 0 ? (
                                        <div className="text-center py-10 text-slate-400 text-xs font-bold font-black">No scholars found</div>
                                    ) : (
                                        filteredStudents.map(student => (
                                            <button
                                                key={student.id}
                                                type="button"
                                                onClick={() => toggleStudent(student.db_id)}
                                                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border-2 ${formData.student_ids.includes(student.db_id)
                                                    ? 'bg-indigo-50 border-[#18216D] ring-2 ring-[#18216D]/10'
                                                    : 'bg-white border-slate-100 hover:border-slate-200'
                                                    }`}
                                            >
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${formData.student_ids.includes(student.db_id) ? 'bg-[#18216D] text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {student.name.charAt(0)}
                                                </div>
                                                <div className="text-left flex-1">
                                                    <p className="text-sm font-black text-slate-900 leading-tight">{student.name}</p>
                                                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">{student.system_id}</p>
                                                </div>
                                                {formData.student_ids.includes(student.db_id) && (
                                                    <i className="fas fa-check-circle text-[#18216D]"></i>
                                                )}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserRegistrationModal;
