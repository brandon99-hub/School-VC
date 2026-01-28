import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const FeeFrameworkModal = ({ onClose }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [gradeLevels, setGradeLevels] = useState([]);
    const [academicTerms, setAcademicTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        grade_level: '',
        academic_term: '',
        tuition_amount: '',
        books_amount: '',
        activities_amount: '',
        transport_amount: '',
        boarding_amount: '',
        other_amount: '',
        is_active: true
    });

    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const [gradesData, termsData] = await Promise.all([
                    get('/api/cbc/grade-levels/'),
                    get('/api/academic-terms/')
                ]);
                setGradeLevels(gradesData || []);
                setAcademicTerms(termsData || []);
            } catch (error) {
                console.error('Error fetching config:', error);
                showToast('Failed to load configuration data', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchConfig();
    }, [get, showToast]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await post('/api/finance/fee-structures/', formData);
            showToast('Fee framework published successfully', 'success');
            onClose();
        } catch (error) {
            console.error('Error saving framework:', error);
            showToast('Failed to publish framework', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e, nextFieldId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const nextInput = document.getElementById(nextFieldId);
            if (nextInput) nextInput.focus();
        }
    };

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-[#18216D] tracking-tighter uppercase italic">New Revenue Framework</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Define termly liability for scholars</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Querying System Configs...</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                                    <select
                                        value={formData.grade_level}
                                        onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                    >
                                        <option value="">Select Grade</option>
                                        {gradeLevels.map(grade => (
                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Term</label>
                                    <select
                                        value={formData.academic_term}
                                        onChange={(e) => setFormData({ ...formData, academic_term: e.target.value })}
                                        required
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                    >
                                        <option value="">Select Term</option>
                                        {academicTerms.map(term => (
                                            <option key={term.id} value={term.id}>{term.name} — {term.year_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100"></div>

                            <div className="grid grid-cols-2 gap-6">
                                {[
                                    { id: 'tuition_amount', label: 'Tuition Fee', next: 'books_amount' },
                                    { id: 'books_amount', label: 'Learning Material', next: 'activities_amount' },
                                    { id: 'activities_amount', label: 'Co-Curricular', next: 'transport_amount' },
                                    { id: 'transport_amount', label: 'Transport / Bus', next: 'boarding_amount' },
                                    { id: 'boarding_amount', label: 'Accommodation', next: 'other_amount' },
                                    { id: 'other_amount', label: 'Miscellaneous', next: 'submit_btn' }
                                ].map((field) => (
                                    <div key={field.id} className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{field.label}</label>
                                        <div className="relative">
                                            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KES</span>
                                            <input
                                                id={field.id}
                                                type="number"
                                                value={formData[field.id]}
                                                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                                onKeyDown={(e) => handleKeyDown(e, field.next)}
                                                required={field.id === 'tuition_amount'}
                                                min="0"
                                                step="0.01"
                                                className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#FFC425]/20 font-black text-sm transition-all"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl w-fit border border-slate-100">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_active}
                                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                        className="sr-only peer"
                                    />
                                    <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#18216D]"></div>
                                    <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Status</span>
                                </label>
                            </div>
                        </>
                    )}
                </form>

                <div className="p-8 bg-slate-50/50 flex-shrink-0 flex items-center justify-between gap-6 border-t border-slate-50">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                        Changes will be applied to all <br />enrolled scholars in the target grade.
                    </p>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-slate-600 transition-all active:scale-95"
                        >
                            Discard
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            id="submit_btn"
                            disabled={submitting || loading}
                            className="px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-900/10 disabled:opacity-50 flex items-center gap-3"
                        >
                            {submitting ? (
                                <>
                                    <i className="fas fa-circle-notch animate-spin"></i>
                                    Publishing
                                </>
                            ) : 'Publish Framework'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeeFrameworkModal;
