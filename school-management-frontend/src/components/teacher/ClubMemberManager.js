import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    UserPlusIcon,
    UserMinusIcon,
    MagnifyingGlassIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';

const ClubMemberManager = ({ clubId, clubName }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [members, setMembers] = useState([]);
    const [availableStudents, setAvailableStudents] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [gradeFilter, setGradeFilter] = useState('');
    const [grades, setGrades] = useState([]);

    useEffect(() => {
        fetchClubData();
        fetchGrades();
    }, [clubId]);

    const fetchClubData = async () => {
        try {
            setLoading(true);
            const club = await get(`/api/events/clubs/${clubId}/`);
            // Assuming the serializer provides members or we need a separate call
            const membersResponse = await get(`/api/events/clubs/${clubId}/members/`);
            setMembers(membersResponse || []);
        } catch (error) {
            console.error('Error fetching club data:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchGrades = async () => {
        try {
            const response = await get('/api/cbc/grade-levels/');
            setGrades(response || []);
        } catch (error) {
            console.error('Error fetching grades:', error);
        }
    };

    const searchStudents = async () => {
        if (!searchTerm && !gradeFilter) return;
        try {
            const query = `name=${searchTerm}&grade_level=${gradeFilter}`;
            const response = await get(`/teachers/api/students/search/?${query}`);
            // Filter out those already in this club
            const filtered = response.filter(s => !members.find(m => m.id === s.id));
            setAvailableStudents(filtered);
        } catch (error) {
            console.error('Error searching students:', error);
        }
    };

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            searchStudents();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, gradeFilter]);

    const enrollStudents = async (studentIds) => {
        try {
            await post(`/api/events/clubs/${clubId}/enroll-students/`, { student_ids: studentIds });
            showToast('Students enrolled successfully', 'success');
            fetchClubData();
            setAvailableStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
        } catch (error) {
            console.error('Error enrolling students:', error);
            showToast('Failed to enroll students', 'error');
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="bg-[#18216D] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-2">Club Patron Panel</p>
                        <h2 className="text-4xl font-black tracking-tighter">{clubName}</h2>
                        <div className="h-1.5 w-20 bg-[#FFC425] rounded-full mt-4"></div>
                    </div>
                    <div className="text-right">
                        <p className="text-5xl font-black leading-none">{members.length}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mt-2">Active Members</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Available Students Search */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-900/5 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="text-xl font-black text-[#18216D] uppercase tracking-tight mb-6">Find New Members</h3>
                        <div className="space-y-4">
                            <div className="relative group">
                                <MagnifyingGlassIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#18216D] transition-colors" />
                                <input
                                    type="text"
                                    placeholder="Search by Name or Admission No..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm text-[#18216D] focus:ring-2 focus:ring-[#18216D]/10 transition-all"
                                />
                            </div>
                            <select
                                value={gradeFilter}
                                onChange={(e) => setGradeFilter(e.target.value)}
                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-sm text-[#18216D] focus:ring-2 focus:ring-[#18216D]/10 transition-all appearance-none"
                            >
                                <option value="">All Grade Levels</option>
                                {grades.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[400px]">
                        {availableStudents.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#18216D]/5 flex items-center justify-center text-[#18216D] font-black border border-[#18216D]/10 text-xs">
                                        {student.name?.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#18216D] text-sm">{student.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{student.grade_level_name} • {student.student_id}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => enrollStudents([student.id])}
                                    className="h-10 w-10 rounded-xl bg-[#18216D] text-white flex items-center justify-center shadow-lg shadow-indigo-900/10 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <UserPlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {availableStudents.length === 0 && (
                            <div className="py-12 text-center">
                                <p className="text-slate-300 font-bold italic tracking-tight text-xs">Search for students to add them to your club.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Current Members List */}
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-900/5 flex flex-col overflow-hidden">
                    <div className="p-8 border-b border-slate-50">
                        <h3 className="text-xl font-black text-[#18216D] uppercase tracking-tight">Active Members</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Official Club Roster</p>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar max-h-[500px]">
                        {members.map(member => (
                            <div key={member.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-rose-50/30 transition-all border border-transparent hover:border-rose-100 group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#FFC425]/10 flex items-center justify-center text-[#18216D] font-black border border-[#FFC425]/20 text-xs">
                                        {member.name?.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                        <p className="font-black text-[#18216D] text-sm">{member.name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{member.grade_level_name} • {member.student_id}</p>
                                    </div>
                                </div>
                                <button
                                    className="h-10 w-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                                    title="Remove from Club"
                                >
                                    <UserMinusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                        {members.length === 0 && (
                            <div className="py-20 text-center">
                                <UserGroupIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                                <p className="text-slate-400 font-bold italic tracking-tight">Your club has no members yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClubMemberManager;
