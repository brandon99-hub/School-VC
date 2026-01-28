import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const AcademicCycleModal = ({ onClose }) => {
    const { get, post, put, del } = useApi();
    const { showToast } = useAppState();
    const [activeTab, setActiveTab] = useState('add'); // 'add' or 'list'
    const [years, setYears] = useState([]);
    const [terms, setTerms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [mode, setMode] = useState('term'); // 'year' or 'term'
    const [editingItem, setEditingItem] = useState(null);

    const [yearData, setYearData] = useState({
        name: '',
        start_date: '',
        end_date: '',
        is_current: false
    });

    const [termData, setTermData] = useState({
        year: '',
        name: '',
        start_date: '',
        end_date: '',
        is_final_term: false
    });

    const fetchData = React.useCallback(async () => {
        setLoading(true);
        try {
            const [yearsData, termsData] = await Promise.all([
                get('/api/academic-years/'),
                get('/api/academic-terms/')
            ]);
            setYears(yearsData || []);
            setTerms(termsData || []);
        } catch (error) {
            console.error('Error fetching cycle data:', error);
            showToast('Failed to load academic cycles', 'error');
        } finally {
            setLoading(false);
        }
    }, [get, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmitYear = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await put(`/api/academic-years/${editingItem.id}/`, yearData);
                showToast('Academic year updated');
            } else {
                await post('/api/academic-years/', yearData);
                showToast('Academic year created');
            }
            fetchData();
            resetForm();
        } catch (error) {
            showToast('Failed to save academic year', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitTerm = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingItem) {
                await put(`/api/academic-terms/${editingItem.id}/`, termData);
                showToast('Academic term updated');
            } else {
                await post('/api/academic-terms/', termData);
                showToast('Academic term created');
            }
            fetchData();
            resetForm();
        } catch (error) {
            showToast('Failed to save academic term', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEditYear = (year) => {
        setMode('year');
        setEditingItem(year);
        setYearData({
            name: year.name,
            start_date: year.start_date,
            end_date: year.end_date,
            is_current: year.is_current
        });
        setActiveTab('add');
    };

    const handleEditTerm = (term) => {
        setMode('term');
        setEditingItem(term);
        setTermData({
            year: term.year,
            name: term.name,
            start_date: term.start_date,
            end_date: term.end_date,
            is_final_term: term.is_final_term
        });
        setActiveTab('add');
    };

    const handleDeleteYear = async (id) => {
        if (!window.confirm('Delete this year? This may affect linked terms.')) return;
        try {
            await del(`/api/academic-years/${id}/`);
            showToast('Academic year deleted');
            fetchData();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const handleDeleteTerm = async (id) => {
        if (!window.confirm('Delete this term?')) return;
        try {
            await del(`/api/academic-terms/${id}/`);
            showToast('Academic term deleted');
            fetchData();
        } catch (error) {
            showToast('Failed to delete', 'error');
        }
    };

    const resetForm = () => {
        setEditingItem(null);
        setYearData({ name: '', start_date: '', end_date: '', is_current: false });
        setTermData({ year: '', name: '', start_date: '', end_date: '', is_final_term: false });
    };

    return (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-500 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="p-8 pb-4 border-b border-slate-50 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-[#18216D] tracking-tighter uppercase italic">Academic Cycle Hub</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Manage school years and termly sessions</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Tab Switcher */}
                <div className="px-8 pt-6 flex gap-8 flex-shrink-0 border-b border-slate-50/50 bg-slate-50/20">
                    <button
                        onClick={() => setActiveTab('add')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'add' ? 'text-[#18216D]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        {editingItem ? 'Refine Configuration' : 'Establish Config'}
                        {activeTab === 'add' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#FFC425] rounded-full"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`pb-4 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === 'list' ? 'text-[#18216D]' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Active Cycles
                        {activeTab === 'list' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#18216D] rounded-full"></div>}
                    </button>
                </div>

                {activeTab === 'add' ? (
                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                        {/* Mode Switcher (Year vs Term) */}
                        <div className="flex p-1 bg-slate-100 rounded-2xl w-fit">
                            <button
                                onClick={() => { setMode('term'); resetForm(); }}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'term' ? 'bg-white text-[#18216D] shadow-sm' : 'text-slate-400'}`}
                            >
                                Termly Session
                            </button>
                            <button
                                onClick={() => { setMode('year'); resetForm(); }}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${mode === 'year' ? 'bg-white text-[#18216D] shadow-sm' : 'text-slate-400'}`}
                            >
                                Academic Year
                            </button>
                        </div>

                        {mode === 'year' ? (
                            <form onSubmit={handleSubmitYear} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Year Label</label>
                                    <input
                                        type="text"
                                        value={yearData.name}
                                        onChange={(e) => setYearData({ ...yearData, name: e.target.value })}
                                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                        placeholder="e.g. 2026"
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Commencement</label>
                                        <input
                                            type="date"
                                            value={yearData.start_date}
                                            onChange={(e) => setYearData({ ...yearData, start_date: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conclusion</label>
                                        <input
                                            type="date"
                                            value={yearData.end_date}
                                            onChange={(e) => setYearData({ ...yearData, end_date: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl w-fit cursor-pointer border border-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={yearData.is_current}
                                        onChange={(e) => setYearData({ ...yearData, is_current: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-[#18216D] focus:ring-[#18216D]"
                                    />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Academic Year</span>
                                </label>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-900/10"
                                    >
                                        {submitting ? 'Processing...' : editingItem ? 'Update Year' : 'Publish Year'}
                                    </button>
                                    {editingItem && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </form>
                        ) : (
                            <form onSubmit={handleSubmitTerm} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Academic Year</label>
                                        <select
                                            value={termData.year}
                                            onChange={(e) => setTermData({ ...termData, year: e.target.value })}
                                            required
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                        >
                                            <option value="">Select Year</option>
                                            {years.map(y => (
                                                <option key={y.id} value={y.id}>{y.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Term Name</label>
                                        <input
                                            type="text"
                                            value={termData.name}
                                            onChange={(e) => setTermData({ ...termData, name: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            placeholder="e.g. Lent Term"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Term Start</label>
                                        <input
                                            type="date"
                                            value={termData.start_date}
                                            onChange={(e) => setTermData({ ...termData, start_date: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Term End</label>
                                        <input
                                            type="date"
                                            value={termData.end_date}
                                            onChange={(e) => setTermData({ ...termData, end_date: e.target.value })}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D]/10 font-bold text-sm"
                                            required
                                        />
                                    </div>
                                </div>
                                <label className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl w-fit cursor-pointer border border-slate-100">
                                    <input
                                        type="checkbox"
                                        checked={termData.is_final_term}
                                        onChange={(e) => setTermData({ ...termData, is_final_term: e.target.checked })}
                                        className="w-4 h-4 rounded border-slate-300 text-[#18216D] focus:ring-[#18216D]"
                                    />
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final Term of Year (Graduation Trigger)</span>
                                </label>
                                <div className="pt-4 flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 px-10 py-4 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-900/10"
                                    >
                                        {submitting ? 'Processing...' : editingItem ? 'Update Term' : 'Declare Term'}
                                    </button>
                                    {editingItem && (
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="px-8 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                        >
                                            Dismiss
                                        </button>
                                    )}
                                </div>
                            </form>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto p-8 bg-slate-50/30">
                        {loading ? (
                            <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Querying Registries...</div>
                        ) : (
                            <div className="space-y-8">
                                {/* Academic Years Section */}
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fas fa-calendar-check text-[#18216D]"></i>
                                        Academic Years ({years.length})
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {years.map(year => (
                                            <div key={year.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-black text-[#18216D] uppercase">{year.name}</p>
                                                        {year.is_current && <span className="bg-emerald-50 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase border border-emerald-100 italic">Live</span>}
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-tighter">{year.start_date} → {year.end_date}</p>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleEditYear(year)}
                                                        className="w-8 h-8 rounded-lg bg-indigo-50 text-[#18216D] flex items-center justify-center hover:bg-[#18216D] hover:text-white transition-all"
                                                    >
                                                        <i className="fas fa-edit text-[10px]"></i>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteYear(year.id)}
                                                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all"
                                                    >
                                                        <i className="fas fa-trash text-[10px]"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Academic Terms Section */}
                                <section>
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <i className="fas fa-clock text-[#FFC425]"></i>
                                        Termly Registry ({terms.length})
                                    </h3>
                                    <div className="space-y-3">
                                        {terms.map(term => (
                                            <div key={term.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-[10px] text-slate-400">
                                                        {term.year_name.slice(-2)}
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-[#18216D] uppercase tracking-tighter">{term.name}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                            Parent Year: {term.year_name} <span className="mx-1">|</span> {term.start_date} - {term.end_date}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditTerm(term)}
                                                        className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase bg-indigo-50 text-[#18216D] hover:bg-indigo-100 transition-all"
                                                    >
                                                        Refine
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTerm(term.id)}
                                                        className="px-3 py-1.5 rounded-lg text-[8px] font-black uppercase bg-rose-50 text-rose-500 hover:bg-rose-100 transition-all"
                                                    >
                                                        Evict
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AcademicCycleModal;
