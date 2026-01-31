import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import ClubModal from '../../components/admin/ClubModal';

const ClubList = () => {
    const { get, del } = useApi();
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingClub, setEditingClub] = useState(null);

    const fetchData = useCallback(async () => {
        try {
            const clubData = await get('/api/events/clubs/');
            setClubs(clubData);
        } catch (error) {
            console.error('Error fetching club data:', error);
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this club?')) {
            try {
                await del(`/api/events/clubs/${id}/`);
                fetchData();
            } catch (error) {
                console.error('Error deleting club:', error);
            }
        }
    };

    const openEditModal = (club) => {
        setEditingClub(club);
        setShowModal(true);
    };

    if (loading) return <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Compiling Club Registry...</div>;

    return (
        <div className="space-y-10">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#18216D] italic tracking-tighter uppercase">Club Directory</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Extra-curricular management & oversight</p>
                </div>
                <button
                    onClick={() => { setEditingClub(null); setShowModal(true); }}
                    className="px-8 py-4 bg-[#18216D] text-white rounded-[1.5rem] shadow-xl shadow-indigo-900/10 font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all active:scale-95"
                >
                    Establish New Club
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {clubs.map(club => (
                    <div key={club.id} className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform"></div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black text-[#18216D] uppercase tracking-tight">{club.name}</h3>
                            <p className="text-slate-400 text-xs font-bold mt-2 h-12 overflow-hidden line-clamp-2">{club.description || 'No description provided.'}</p>

                            <div className="mt-8 flex items-center justify-between border-t border-slate-50 pt-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Patron / Lead</p>
                                    <p className="text-xs font-black text-[#18216D] mt-1">{club.teacher_name || 'Unassigned'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Enrolled</p>
                                    <p className="text-xs font-black text-indigo-600 mt-1">{club.member_count} Scholars</p>
                                </div>
                            </div>

                            <div className="mt-8 flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditModal(club)} className="flex-1 py-3 bg-slate-50 text-[#18216D] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white border border-transparent hover:border-slate-100 transition-all shadow-sm">Edit</button>
                                <button onClick={() => handleDelete(club.id)} className="px-4 py-3 bg-rose-50 text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 border border-transparent hover:border-rose-200 transition-all">
                                    <i className="fas fa-trash-can"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <ClubModal
                    club={editingClub}
                    onClose={() => setShowModal(false)}
                    onSuccess={fetchData}
                />
            )}
        </div>
    );
};

export default ClubList;
