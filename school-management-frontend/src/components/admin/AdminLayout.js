import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', label: 'Dashboard', icon: 'fa-gauge-high' },
        { path: '/admin/courses', label: 'Learning Areas', icon: 'fa-book' },
        { path: '/admin/curriculum', label: 'Curriculum', icon: 'fa-sitemap' },
        { path: '/admin/events', label: 'Events', icon: 'fa-calendar-check' },
        { path: '/admin/finance', label: 'Finance', icon: 'fa-wallet' },
        { path: '/admin/clubs', label: 'Clubs', icon: 'fa-users' },
        { path: '/admin/users', label: 'Users', icon: 'fa-users-gear' },
    ];

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest' : 'Guest';
    const initials = displayName
        .split(' ')
        .map((token) => token.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Main Header */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                <div className="px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-2 hover:bg-slate-50 rounded-lg text-gray-400 transition-colors hidden lg:block"
                            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            <i className={`fas fa-bars-staggered transition-transform duration-300 ${isSidebarCollapsed ? 'rotate-180' : ''}`}></i>
                        </button>
                        <Link to="/admin" className="flex items-center space-x-2">
                            <span className="text-xl font-bold bg-[#18216D] text-white p-1.5 rounded-xl shadow-lg shadow-indigo-900/20">
                                <i className="fas fa-graduation-cap"></i>
                            </span>
                            <div className={`${isSidebarCollapsed ? 'lg:hidden' : 'block'} transition-all duration-300 overflow-hidden whitespace-nowrap`}>
                                <h1 className="text-lg font-black text-gray-900 leading-none">KiandaOS</h1>
                                <p className="text-[10px] font-black uppercase tracking-wider text-[#FFC425]">Admin Terminal</p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors relative group">
                            <i className="far fa-bell text-xl"></i>
                            <span className="absolute top-0 right-0 h-2 w-2 bg-[#FFC425] rounded-full border-2 border-white"></span>
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                                className="flex items-center gap-3 px-2 py-1.5 rounded-full border border-gray-200 hover:border-[#FFC425]/30 hover:bg-slate-50 transition-all"
                            >
                                <span className="h-8 w-8 rounded-full bg-[#18216D] text-white flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-900/10">
                                    {initials}
                                </span>
                                <div className="text-left hidden sm:block">
                                    <p className="text-sm font-black text-gray-900 leading-tight">{displayName}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">System Authority</p>
                                </div>
                                <i className={`fas fa-chevron-${isUserMenuOpen ? 'up' : 'down'} text-[10px] text-gray-400`}></i>
                            </button>

                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-3 w-56 bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden py-2 transform transition-all animate-in fade-in slide-in-from-top-2 z-[60]">
                                    <div className="px-6 py-4 border-b border-gray-50 bg-slate-50/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Operator</p>
                                        <p className="text-xs font-bold text-gray-900 truncate mt-1">{user?.email}</p>
                                    </div>
                                    <Link to="/profile" className="flex items-center space-x-3 px-6 py-3 text-sm font-bold text-gray-700 hover:bg-slate-50 transition-colors">
                                        <i className="fas fa-user-circle text-slate-300"></i>
                                        <span>Portal Settings</span>
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center space-x-3 px-6 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                    >
                                        <i className="fas fa-sign-out-alt"></i>
                                        <span>Terminate Session</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex flex-1 relative">
                {/* Collapsible Sidebar */}
                <aside
                    className={`bg-white border-r border-gray-200 fixed top-16 bottom-0 overflow-hidden transition-all duration-300 z-40 hidden lg:block ${isSidebarCollapsed ? 'w-20' : 'w-64'
                        }`}
                >
                    <nav className="p-4 space-y-3">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center rounded-[1.25rem] transition-all duration-200 group relative px-4 py-4 ${isActive(item.path)
                                    ? 'bg-[#18216D] text-white shadow-xl shadow-indigo-900/20 font-black'
                                    : 'text-slate-400 hover:bg-slate-50 hover:text-[#18216D]'
                                    }`}
                                title={isSidebarCollapsed ? item.label : ''}
                            >
                                <div className="flex items-center justify-center min-w-[24px]">
                                    <i className={`fas ${item.icon} text-lg w-6 text-center ${isActive(item.path) ? 'text-white' : 'text-slate-300 group-hover:text-[#18216D]'}`}></i>
                                </div>
                                <span className={`ml-3 text-[10px] uppercase font-black tracking-widest transition-opacity duration-300 whitespace-nowrap ${isSidebarCollapsed ? 'opacity-0 lg:hidden' : 'opacity-100'}`}>
                                    {item.label}
                                </span>
                                {isSidebarCollapsed && isActive(item.path) && (
                                    <div className="absolute left-0 w-1 h-8 bg-[#FFC425] rounded-r-full"></div>
                                )}
                            </Link>
                        ))}
                    </nav>
                </aside>

                {/* Main Content Area */}
                <main
                    className={`flex-1 p-8 min-h-screen transition-all duration-300 ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'
                        }`}
                >
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
