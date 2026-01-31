import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import EventNoticeModal from '../../components/admin/EventNoticeModal';

const EventList = () => {
    const { get, del } = useApi();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const eventData = await get('/api/events/notices/');
            setEvents(eventData);
        } catch (error) {
            console.error('Error fetching event data:', error);
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this event notice?')) {
            try {
                await del(`/api/events/notices/${id}/`);
                fetchData();
            } catch (error) {
                console.error('Error deleting event:', error);
            }
        }
    };

    const openEditModal = (event) => {
        setEditingEvent(event);
        setShowModal(true);
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Scanning School Calendar...</div>;

    return (
        <div className="space-y-10">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#18216D] italic tracking-tighter uppercase">Notice Board</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Broadcast school events & administrative alerts</p>
                </div>
                <button
                    onClick={() => { setEditingEvent(null); setShowModal(true); }}
                    className="px-8 py-4 bg-[#FFC425] text-[#18216D] rounded-[1.5rem] shadow-xl shadow-amber-900/10 font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95"
                >
                    Create New Notice
                </button>
            </header>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Event Protocol</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Schedule</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Targeting</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Financials</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {events.map(event => (
                            <tr key={event.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-lg shadow-sm border border-white transition-transform group-hover:scale-110 ${event.has_fee ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            <i className={`fas ${event.has_fee ? 'fa-ticket' : 'fa-bullhorn'}`}></i>
                                        </div>
                                        <div>
                                            <p className="font-black text-[#18216D] text-sm uppercase tracking-tight">{event.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 mt-1">{event.location || 'Premises / Remote'}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-[#18216D] uppercase tracking-widest">{new Date(event.start_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                        <span className="text-[9px] font-bold text-slate-300 mt-1 uppercase tracking-tighter">Until {new Date(event.end_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${event.target_type === 'all' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            event.target_type === 'grades' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                'bg-purple-50 text-purple-700 border-purple-100'
                                        }`}>
                                        {event.target_type === 'all' ? 'School-Wide' : event.target_type === 'grades' ? 'Specific Grades' : 'Club Specific'}
                                    </span>
                                </td>
                                <td className="px-8 py-6">
                                    {event.has_fee ? (
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-amber-600 tracking-tight">KES {event.cost}</span>
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-0.5">Mandatory Entry</span>
                                        </div>
                                    ) : (
                                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest font-italic">No Charge</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button onClick={() => openEditModal(event)} className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-[#18216D] hover:bg-white rounded-xl transition-all hover:shadow-md border border-transparent hover:border-slate-100">
                                            <i className="fas fa-pen-to-square text-xs"></i>
                                        </button>
                                        <button onClick={() => handleDelete(event.id)} className="h-10 w-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-white rounded-xl transition-all hover:shadow-md border border-transparent hover:border-slate-100">
                                            <i className="fas fa-trash-can text-xs"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {events.length === 0 && (
                    <div className="py-20 text-center">
                        <p className="text-slate-300 font-black uppercase tracking-[0.2em] text-[10px] italic">No active notices found in registry</p>
                    </div>
                )}
            </div>

            {showModal && (
                <EventNoticeModal
                    event={editingEvent}
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default EventList;
