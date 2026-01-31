import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';

const EventNoticeModal = ({ event = null, onClose, onSuccess }) => {
    const { get, post, put } = useApi();
    const [grades, setGrades] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        target_type: 'all',
        target_grades: [],
        target_clubs: [],
        start_date: '',
        end_date: '',
        location: '',
        has_fee: false,
        cost: 0
    });

    const fetchData = useCallback(async () => {
        try {
            const [gradeData, clubData] = await Promise.all([
                get('/api/cbc/grade-levels/'),
                get('/api/events/clubs/')
            ]);
            setGrades(gradeData);
            setClubs(clubData);
            if (event) {
                setFormData({
                    title: event.title,
                    description: event.description || '',
                    target_type: event.target_type || 'all',
                    target_grades: event.target_grades || [],
                    target_clubs: event.target_clubs || [],
                    start_date: event.start_date || '',
                    end_date: event.end_date || '',
                    location: event.location || '',
                    has_fee: event.has_fee || false,
                    cost: event.cost || 0
                });
            }
        } catch (error) {
            console.error('Error fetching event modal data:', error);
        } finally {
            setLoading(false);
        }
    }, [get, event]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (event) {
                await put(`/api/events/notices/${event.id}/`, formData);
            } else {
                await post('/api/events/notices/', formData);
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving event notice:', error);
            alert('Could not save event notice. Please check all fields.');
        }
    };

    const handleMultiSelect = (field, value) => {
        const currentSelection = formData[field];
        if (currentSelection.includes(value)) {
            setFormData({ ...formData, [field]: currentSelection.filter(id => id !== value) });
        } else {
            setFormData({ ...formData, [field]: [...currentSelection, value] });
        }
    };

    if (loading && !event) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#18216D]/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-50 flex-shrink-0">
                    <h2 className="text-2xl font-black text-[#18216D] italic uppercase tracking-tighter">
                        {event ? 'Modify Notice Protocol' : 'Deploy New Notice'}
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Communication Hub</p>
                </div>
                <form onSubmit={handleSubmit} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Notice Headline</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#18216D] focus:ring-4 focus:ring-indigo-50 transition-all"
                                placeholder="e.g., Annual Sports Day 2026"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Detailed Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#18216D] focus:ring-4 focus:ring-indigo-50 transition-all h-24"
                                placeholder="Outline event specifics, requirements, and logistics..."
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Start Cycle</label>
                            <input
                                type="date"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                required
                                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-[#18216D] focus:ring-4 focus:ring-indigo-50 transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Conclusion Cycle</label>
                            <input
                                type="date"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                required
                                className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-[#18216D] focus:ring-4 focus:ring-indigo-50 transition-all"
                            />
                        </div>
                        <div className="col-span-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Targeting Paradigm</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['all', 'grades', 'clubs'].map(type => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, target_type: type })}
                                        className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.target_type === type ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/10' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                            }`}
                                    >
                                        {type === 'all' ? 'Universal' : type === 'grades' ? 'Academic Levels' : 'Club Groups'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {formData.target_type === 'grades' && (
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Select Grade Levels</label>
                                <div className="flex flex-wrap gap-2">
                                    {grades.map(g => (
                                        <button
                                            key={g.id}
                                            type="button"
                                            onClick={() => handleMultiSelect('target_grades', g.id)}
                                            className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${formData.target_grades.includes(g.id) ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-transparent'
                                                } border`}
                                        >
                                            {g.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {formData.target_type === 'clubs' && (
                            <div className="col-span-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Select Registered Clubs</label>
                                <div className="flex flex-wrap gap-2">
                                    {clubs.map(c => (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => handleMultiSelect('target_clubs', c.id)}
                                            className={`px-4 py-2 rounded-lg text-[9px] font-black transition-all ${formData.target_clubs.includes(c.id) ? 'bg-purple-100 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-400 border-transparent'
                                                } border`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="col-span-2 flex items-center gap-6 p-6 bg-amber-50 rounded-[2rem] border border-amber-100/50 shadow-sm">
                            <div className="flex items-center gap-4">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.has_fee}
                                        onChange={(e) => setFormData({ ...formData, has_fee: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-amber-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18216D]"></div>
                                </label>
                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Mandatory Fee Protocol</span>
                            </div>
                            {formData.has_fee && (
                                <div className="flex-1 flex items-center gap-3">
                                    <span className="text-sm font-black text-[#18216D]">KES</span>
                                    <input
                                        type="number"
                                        value={formData.cost}
                                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                                        className="flex-1 bg-white border-none rounded-xl px-4 py-2 text-sm font-black text-[#18216D] focus:ring-2 focus:ring-[#18216D]/10"
                                        placeholder="Amount"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="pt-6 flex gap-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Revoke deployment</button>
                        <button type="submit" className="flex-1 py-4 bg-[#18216D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/10">Synchronize Calendar</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventNoticeModal;
