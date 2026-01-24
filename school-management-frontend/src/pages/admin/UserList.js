import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

const UserList = () => {
    const { get } = useApi();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

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
                    <i className="fas fa-circle-notch fa-spin text-3xl mb-4 text-indigo-600"></i>
                    <p className="font-bold uppercase tracking-widest text-xs">Loading Directory...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                    <p className="text-gray-500 mt-1">Manage all system users, instructors, and student accounts</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-all font-medium flex items-center space-x-2">
                        <i className="fas fa-user-plus"></i>
                        <span>Add User</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 relative">
                        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                        <input
                            type="text"
                            placeholder="Search by name, email, or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700"
                        >
                            <option value="all">All Roles</option>
                            <option value="teacher">Teachers</option>
                            <option value="student">Students</option>
                            <option value="admin">Admins</option>
                        </select>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm font-semibold text-gray-700"
                        >
                            <option value="all">Any Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {filteredUsers.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <div className="text-6xl mb-6 text-gray-100">
                            <i className="fas fa-users-slash"></i>
                        </div>
                        <p className="text-xl font-bold text-gray-900">No matching users</p>
                        <p className="text-sm mt-1">Try adjusting your filters or search terms</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">User Profile</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">System ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">System Role</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Grade / Dept</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-left">Account Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-indigo-50/30 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${user.role === 'admin' ? 'bg-amber-100 text-amber-700' :
                                                    user.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-indigo-100 text-indigo-700'
                                                    }`}>
                                                    {user.name?.charAt(0) || user.username?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors text-sm">{user.name}</div>
                                                    <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-mono font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                {user.system_id || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`p-1.5 rounded-lg text-xs ${user.role === 'admin' ? 'bg-amber-50 text-amber-600' :
                                                    user.role === 'teacher' ? 'bg-purple-50 text-purple-600' :
                                                        'bg-sky-50 text-sky-600'
                                                    }`}>
                                                    <i className={`fas ${user.role === 'admin' ? 'fa-shield-halved' :
                                                        user.role === 'teacher' ? 'fa-chalkboard-user' :
                                                            'fa-user-graduate'
                                                        } w-4 text-center`}></i>
                                                </span>
                                                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{user.role}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.role === 'student' ? (
                                                <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-black uppercase tracking-widest">
                                                    {user.grade_level || 'No Grade'}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Faculty</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-3 py-1 text-[10px] font-bold uppercase tracking-widest rounded-full ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                                }`}>
                                                {user.is_active ? 'Active' : 'Deactivated'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button className="p-2 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-white transition-all shadow-sm">
                                                <i className="fas fa-pen-to-square text-xs"></i>
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-white transition-all shadow-sm">
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
        </div>
    );
};

export default UserList;
