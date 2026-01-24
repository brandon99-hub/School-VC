import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';

const Navbar = () => {
    const { user, logout } = useAuth();
    const { get } = useApi();
    const navigate = useNavigate();
    const location = useLocation();
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [notifications, setNotifications] = useState([]);
    const [isFetchingNotifications, setIsFetchingNotifications] = useState(false);

    const displayName = user ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Guest' : 'Guest';
    const initials = displayName
        .split(' ')
        .map((token) => token.charAt(0))
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const primaryLinks = useMemo(
        () => [
            { to: '/dashboard', label: 'Dashboard' },
            { to: '/contact', label: 'Contact' },
        ],
        []
    );

    const quickLinks = useMemo(() => {
        const role = user?.role || 'student';
        const shared = [
            { to: '/settings', label: 'Settings', icon: 'fa-sliders', roles: ['student', 'teacher'] },
            { to: '/profile', label: 'Profile', icon: 'fa-id-badge', roles: ['student', 'teacher'] },
        ];
        const studentLinks = [
            { to: '/courses', label: 'Learning Areas', icon: 'fa-layer-group', roles: ['student'] },
            { to: '/attendance', label: 'Attendance', icon: 'fa-calendar-check', roles: ['student'] },
        ];
        const teacherLinks = [
            { to: '/dashboard?view=teaching', label: 'Teaching Overview', icon: 'fa-chalkboard', roles: ['teacher'] },
            { to: '/teacher-attendance', label: 'Class Attendance', icon: 'fa-user-check', roles: ['teacher'] },
        ];
        return [...shared, ...(role === 'teacher' ? teacherLinks : studentLinks)].filter((link) =>
            link.roles.includes(role)
        );
    }, [user]);

    const unreadCount = useMemo(() => notifications.filter((notification) => !notification.is_read).length, [notifications]);

    useEffect(() => {
        setIsNotificationOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
        setSearchQuery('');
    }, [location.pathname]);

    useEffect(() => {
        if (!user) return;
        let cancelled = false;

        const fetchNotifications = async () => {
            setIsFetchingNotifications(true);
            try {
                const data = await get('/api/notifications/');
                if (!cancelled && Array.isArray(data)) {
                    setNotifications(data.slice(0, 6));
                }
            } catch (err) {
                if (!cancelled) {
                    setNotifications([]);
                }
            } finally {
                if (!cancelled) {
                    setIsFetchingNotifications(false);
                }
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [user, get]);

    if (['/login', '/signup'].includes(location.pathname) || location.pathname.startsWith('/admin')) {
        return null;
    }

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleNavigate = (path) => {
        setIsMobileMenuOpen(false);
        setIsUserMenuOpen(false);
        setSearchQuery('');
        navigate(path);
    };

    const toggleUserMenu = () => {
        setIsUserMenuOpen((prev) => {
            const next = !prev;
            if (!next) {
                setSearchQuery('');
            }
            return next;
        });
    };

    return (
        <nav className="bg-white/90 backdrop-blur border-b border-gray-200 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-6">
                        <Link to="/dashboard" className="flex items-center gap-5 group">
                            <img src="/kianda-school-logo.png" alt="Kianda School" className="h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-110" />
                            <div className="flex flex-col">
                                <span className="text-xl font-black text-[#18216D] uppercase tracking-tighter leading-none">Kianda School</span>
                                <span className="text-[11px] font-bold text-[#FFC425] uppercase tracking-[0.3em] leading-none mt-2">Management Portal</span>
                            </div>
                        </Link>
                        <div className="hidden md:flex items-center space-x-2">
                            {primaryLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${location.pathname === link.to
                                        ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20'
                                        : 'text-slate-500 hover:text-[#18216D] hover:bg-slate-50'
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="hidden md:flex items-center space-x-3">
                        <div className="relative">
                            <button
                                className="relative p-2 rounded-full hover:bg-gray-100 text-gray-600 focus:outline-none"
                                onClick={() => setIsNotificationOpen((prev) => !prev)}
                                aria-label="Notifications"
                            >
                                <i className="fas fa-bell" aria-hidden="true"></i>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-semibold rounded-full px-1">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {isNotificationOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900">Notifications</p>
                                        {isFetchingNotifications && (
                                            <span className="text-xs text-gray-500">Refreshing…</span>
                                        )}
                                    </div>
                                    <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                                        {notifications.length === 0 && (
                                            <li className="px-4 py-6 text-center text-sm text-gray-500">No notifications yet.</li>
                                        )}
                                        {notifications.map((notification) => (
                                            <li key={notification.id} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                                                <p className="text-sm font-medium text-gray-900">{notification.title || 'Notification'}</p>
                                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                        <div className="relative">
                            <button
                                onClick={toggleUserMenu}
                                className="flex items-center gap-2 px-2 py-1 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
                                aria-expanded={isUserMenuOpen}
                                aria-label="User menu"
                            >
                                <span className="h-9 w-9 rounded-full bg-[#18216D] text-white flex items-center justify-center text-sm font-black shadow-lg shadow-indigo-900/10">
                                    {initials || 'U'}
                                </span>
                                <div className="text-left">
                                    <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                    <p className="text-xs text-gray-500 capitalize">{user?.role || 'student'}</p>
                                </div>
                                <i className={`fas fa-chevron-${isUserMenuOpen ? 'up' : 'down'} text-xs text-gray-500`} aria-hidden="true"></i>
                            </button>
                            {isUserMenuOpen && (
                                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-20">
                                    <div className="px-5 py-4 border-b border-gray-100 bg-slate-50/50">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Authenticated as</p>
                                        <p className="text-sm font-black text-[#18216D] capitalize">{user?.role || 'User'}</p>
                                    </div>
                                    <ul className="divide-y divide-gray-50" data-testid="quick-link-list">
                                        {quickLinks.map((link) => (
                                            <li key={link.to}>
                                                <button
                                                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-slate-50 transition-all border-l-4 border-transparent hover:border-[#FFC425] group"
                                                    onClick={() => handleNavigate(link.to)}
                                                >
                                                    <span className="h-10 w-10 rounded-xl bg-[#18216D]/5 text-[#18216D] flex items-center justify-center group-hover:bg-[#18216D] group-hover:text-white transition-all shadow-sm">
                                                        <i className={`fas ${link.icon}`} aria-hidden="true"></i>
                                                    </span>
                                                    <div>
                                                        <p className="text-sm font-black text-gray-900 group-hover:text-[#18216D] transition-colors">{link.label}</p>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Quick Access</p>
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                        <li>
                                            <button
                                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 transition-colors text-red-600"
                                                onClick={handleLogout}
                                            >
                                                <span className="h-8 w-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                                                    <i className="fas fa-arrow-right-from-bracket" aria-hidden="true"></i>
                                                </span>
                                                <div>
                                                    <p className="text-sm font-semibold">Logout</p>
                                                    <p className="text-xs text-red-400">Sign out securely</p>
                                                </div>
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="md:hidden">
                        <button
                            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-600"
                            aria-label="Toggle menu"
                        >
                            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} aria-hidden="true"></i>
                        </button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white shadow-lg">
                    <div className="px-4 py-3 space-y-4">
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs uppercase text-gray-500 mb-1">Signed in as</p>
                            <p className="text-base font-semibold text-gray-900">{displayName}</p>
                            <p className="text-sm text-gray-500 capitalize">{user?.role || 'student'}</p>
                        </div>
                        <div className="space-y-2">
                            {primaryLinks.map((link) => (
                                <button
                                    key={link.to}
                                    onClick={() => handleNavigate(link.to)}
                                    className={`w-full text-left px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest ${location.pathname === link.to ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/10' : 'text-slate-500 hover:bg-slate-50'
                                        }`}
                                >
                                    {link.label}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-1 border-t border-gray-100 pt-3">
                            <p className="text-xs uppercase text-gray-500 mb-2">Quick links</p>
                            {quickLinks.map((link) => (
                                <button
                                    key={link.to}
                                    onClick={() => handleNavigate(link.to)}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100"
                                >
                                    <i className={`fas ${link.icon} text-gray-500`} aria-hidden="true"></i>
                                    {link.label}
                                </button>
                            ))}
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"
                            >
                                <i className="fas fa-arrow-right-from-bracket text-red-500" aria-hidden="true"></i>
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
