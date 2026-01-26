import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import UserEditModal from '../../components/admin/UserEditModal';

const UserList = () => {
    const { get } = useApi();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    // Edit Modal State
    const [selectedUser, setSelectedUser] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const fetchUsers = React.useCallback(async () => {
        try {
            const data = await get('/api/admin/users/');
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEdit = (user) => {
        setSelectedUser(user);
        setIsEditModalOpen(true);
    };

    // Rest of the filtering logic ...
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.system_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = roleFilter === 'all' || user.role === roleFilter;

        const statusValue = user.is_active ? 'active' : 'inactive';
        const matchesStatus = statusFilter === 'all' || statusValue === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 flex flex-col items-center">
                    <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-[#18216D]"></i>
                    <p className="font-bold uppercase tracking-widest text-xs">Loading Directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-[#18216D]">Institutional Directory</h1>
                    <p className="text-slate-400 font-bold text-sm mt-1">Manage all system users, instructors, and student accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-6 py-3 bg-[#18216D] text-white rounded-xl hover:bg-[#0D164F] shadow-lg shadow-indigo-900/10 transition-all font-black text-xs uppercase tracking-widest flex items-center space-x-2">
                        <i className="fas fa-user-plus"></i>
                        <span>Register User</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 relative">
                        <i className="fas fa-search absolute left-6 top-1/2 -translate-y-1/2 text-slate-300"></i>
                        <input
                            type="text"
                            placeholder="Identify by name, official email, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#18216D]/5 focus:bg-white transition-all text-sm font-medium text-[#18216D] placeholder-slate-300"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#18216D]/5 focus:bg-white transition-all text-sm font-black uppercase tracking-widest text-[#18216D]/60"
                        >
                            <option value="all">Every Role</option>
                            <option value="teacher">Teachers</option>
                            <option value="student">Scholars</option>
                            <option value="parent">Parents</option>
                            <option value="admin">Administrators</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#18216D]/5 focus:bg-white transition-all text-sm font-black uppercase tracking-widest text-[#18216D]/60"
                        >
                            <option value="all">Any Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Suspended</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-24 text-slate-300">
                        <div className="text-7xl mb-6 opacity-20">
                            <i className="fas fa-users-viewfinder"></i>
                        </div>
                        <p className="text-xl font-black text-[#18216D]">No records found</p>
                        <p className="text-sm font-medium mt-1">Adjust your parameters and search again.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Institutional Identity</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">System Identifier</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Assignment</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Level / Linkage</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Account State</th>
                                    <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm transition-transform group-hover:scale-110 ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                                                    user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                                                        user.role === 'parent' ? 'bg-emerald-100 text-emerald-700' :
                                                            'bg-indigo-100 text-[#18216D]'
                                                    }`}>
                                                    {user.name?.charAt(0) || user.username?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-black text-[#18216D] group-hover:text-[#18216D] transition-colors text-sm">{user.name}</div>
                                                    <div className="text-xs font-bold text-slate-400 mt-0.5">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="text-[10px] font-mono font-black text-[#18216D] bg-indigo-50 px-2.5 py-1.5 rounded-lg border border-indigo-100/50 shadow-sm">
                                                {user.system_id || 'PROVISIONING'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-2">
                                                <span className={`p-2 rounded-xl text-xs shadow-sm ${user.role === 'admin' ? 'bg-amber-50 text-amber-600' :
                                                    user.role === 'teacher' ? 'bg-purple-50 text-purple-600' :
                                                        user.role === 'parent' ? 'bg-emerald-50 text-emerald-600' :
                                                            'bg-sky-50 text-sky-600'
                                                    }`}>
                                                    <i className={`fas ${user.role === 'admin' ? 'fa-user-shield' :
                                                        user.role === 'teacher' ? 'fa-chalkboard-user' :
                                                            user.role === 'parent' ? 'fa-user-group' :
                                                                'fa-user-graduate'
                                                        } w-4 text-center`}></i>
                                                </span>
                                                <span className="text-[10px] font-black text-[#18216D]/60 uppercase tracking-widest">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            {user.role === 'student' ? (
                                                <span className="px-2.5 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest border border-slate-100">
                                                    {user.grade_level || 'UNASSIGNED'}
                                                </span>
                                            ) : user.role === 'parent' ? (
                                                <span className="px-2.5 py-1.5 bg-emerald-50/50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-100/50">
                                                    {user.children_count || 0} Linked Scholars
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Permanent Faculty</span>
                                            )}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-flex px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm border ${user.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                                : 'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                {user.is_active ? 'Active Status' : 'Session Suspended'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right space-x-2">
                                            <button
                                                onClick={() => handleEdit(user)}
                                                className="h-10 w-10 text-slate-400 hover:text-[#18216D] rounded-xl hover:bg-white transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100"
                                            >
                                                <i className="fas fa-pen-to-square text-xs"></i>
                                            </button>
                                            <button className="h-10 w-10 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white transition-all shadow-sm hover:shadow-md border border-transparent hover:border-slate-100">
                                                <i className="fas fa-trash-can text-xs"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {selectedUser && (
                <UserEditModal
                    user={selectedUser}
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onRefresh={fetchUsers}
                />
            )}
        </div>
    );
};

export default UserList;
