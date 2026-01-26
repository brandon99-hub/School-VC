import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const ParentRegistrationModal = ({ onClose }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [students, setStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        student_ids: []
    });

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const data = await get('/api/admin/users/');
                // Filter only students from the consolidated users list
                setStudents(data.filter(u => u.role === 'student'));
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [get]);

    const filteredStudents = students.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.system_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleStudent = (studentId) => {
        setFormData(prev => ({
            ...prev,
            student_ids: prev.student_ids.includes(studentId)
                ? prev.student_ids.filter(id => id !== studentId)
                : [...prev.student_ids, studentId]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.student_ids.length === 0) {
            showToast('Please link at least one scholar', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            await post('/api/parents/register/', formData);
            showToast('Parent registered and linked successfully!');
            onClose();
        } catch (error) {
            console.error('Registration error:', error);
            showToast(error.response?.data?.error || 'Failed to register parent', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden border border-white animate-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="bg-[#18216D] px-10 py-12 text-white relative flex-shrink-0">
                    <h3 className="text-3xl font-black uppercase tracking-tight">Register & Link Parent</h3>
                    <p className="text-indigo-100/70 text-sm font-medium mt-1">Connect guardians to their scholar success journeys.</p>
                    <button onClick={onClose} className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors">
                        <i className="fas fa-times text-2xl"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 flex flex-col lg:flex-row gap-10">
                    {/* Parent Details */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <i className="fas fa-user-shield text-indigo-500"></i>
                                Guardian Profile
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">First Name</label>
                                    <input
                                        type="text"
                                        value={formData.first_name}
                                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                                        className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-bold shadow-sm"
                                        placeholder="Enter first name"
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
                                        placeholder="Enter last name"
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
                                    placeholder="parent@example.com"
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
                                    placeholder="+254..."
                                    required
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Password</label>
                                <input
                                    type="text"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full px-5 py-3.5 bg-white border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 text-sm font-mono font-bold shadow-sm"
                                    placeholder="Temporary password"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* Student Selection */}
                    <div className="flex-1 flex flex-col min-h-[400px]">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <i className="fas fa-user-graduate text-amber-500"></i>
                            Select Scholars ({formData.student_ids.length})
                        </h4>

                        <div className="relative mb-4">
                            <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search students by name or ID..."
                                className="w-full pl-12 pr-4 py-3 bg-slate-100 border-none rounded-2xl text-xs font-bold focus:ring-2 focus:ring-indigo-500"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2 space-y-2 border-t border-slate-50 pt-4">
                            {loading ? (
                                <div className="text-center py-10 text-slate-400 text-xs font-bold uppercase tracking-widest animate-pulse">Loading Scholars...</div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="text-center py-10 text-slate-400 text-xs font-bold">No students found</div>
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
                </form>

                <div className="bg-slate-50 px-10 py-8 flex items-center justify-between flex-shrink-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {formData.student_ids.length > 0
                            ? `${formData.student_ids.length} scholars selected for linking`
                            : 'No scholars selected'}
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
                            disabled={submitting}
                            className="bg-[#FFC425] text-[#18216D] px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-900/10 disabled:opacity-50"
                        >
                            {submitting ? 'Registering...' : 'Complete Registration'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParentRegistrationModal;
