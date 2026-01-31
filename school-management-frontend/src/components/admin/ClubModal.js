import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const ClubModal = ({ club = null, onClose, onSuccess }) => {
    const { get, post, put } = useApi();
    const [teachers, setTeachers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        teacher: ''
    });

    useEffect(() => {
        const fetchTeachers = async () => {
            try {
                const data = await get('/api/teachers/');
                setTeachers(data);
                if (club) {
                    setFormData({
                        name: club.name,
                        description: club.description || '',
                        teacher: club.teacher || ''
                    });
                }
            } catch (error) {
                console.error('Error fetching teachers:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchTeachers();
    }, [get, club]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (club) {
                await put(`/api/events/clubs/${club.id}/`, formData);
            } else {
                await post('/api/events/clubs/', formData);
            }
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error saving club:', error);
            alert('Could not save club. Please check inputs.');
        }
    };

    if (loading && !club) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#18216D]/80 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300 flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-slate-50 flex-shrink-0">
                    <h2 className="text-2xl font-black text-[#18216D] italic uppercase tracking-tighter">
                        {club ? 'Edit Club Protocol' : 'Establish New Club'}
                    </h2>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">Institutional Extra-curricular Settings</p>
                </div>
                <form onSubmit={handleSubmit} className="p-10 space-y-6 overflow-y-auto custom-scrollbar">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Club Designation</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#18216D] focus:ring-4 focus:ring-indigo-50 transition-all"
                            placeholder="e.g., Coding & Robotics"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Mission Statement / Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-[#18216D] focus:ring-4 focus:ring-indigo-50 transition-all h-32"
                            placeholder="Brief outline of club objectives..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Assigned Patron</label>
                        <select
                            value={formData.teacher}
                            onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-[#18216D] uppercase tracking-widest focus:ring-4 focus:ring-indigo-50 transition-all"
                        >
                            <option value="">Select Instructor</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.full_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="pt-6 flex gap-4 flex-shrink-0">
                        <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-50 text-slate-400 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cancel</button>
                        <button type="submit" className="flex-1 py-4 bg-[#18216D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-900/10">Synchronize Protocol</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClubModal;
