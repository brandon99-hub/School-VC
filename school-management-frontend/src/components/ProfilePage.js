import React, { useEffect, useMemo, useState } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const cardBase = 'rounded-2xl border border-gray-100 bg-white shadow-sm';
const labelBase = 'text-xs font-semibold uppercase tracking-wide text-gray-500';
const inputBase =
    'mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#18216D] focus:ring-4 focus:ring-[#18216D]/10 transition font-bold';

const sections = [
    { id: 'account', title: 'Account', description: 'Identity and authentication' },
    { id: 'contact', title: 'Contact', description: 'Address, phone, communication' },
    { id: 'academic', title: 'Academic', description: 'Grade and teaching details' },
];

const ProfilePage = () => {
    const { get, put } = useApi();
    const { loadUser } = useAuth();
    const [profile, setProfile] = useState(null);
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        address: '',
        grade: '',
    });
    const [baselineForm, setBaselineForm] = useState(null);
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeSection, setActiveSection] = useState('account');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoading(true);
                const data = await get('/api/auth/profile/');
                setProfile(data);
                const normalized = {
                    first_name: data.first_name || '',
                    last_name: data.last_name || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    address: data.address || '',
                    grade: data.grade || '',
                };
                setFormData(normalized);
                setBaselineForm(normalized);
            } catch (err) {
                setStatus({ type: 'error', message: 'Unable to load your profile right now.' });
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [get]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const hasChanges = useMemo(() => {
        if (!baselineForm) return false;
        return JSON.stringify(baselineForm) !== JSON.stringify(formData);
    }, [baselineForm, formData]);

    const handleReset = () => {
        if (baselineForm) {
            setFormData(baselineForm);
            setStatus({ type: '', message: '' });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!hasChanges) return;
        setSaving(true);
        setStatus({ type: '', message: '' });
        try {
            const updated = await put('/api/auth/profile/', formData);
            setProfile(updated);
            const normalized = {
                first_name: updated.first_name || '',
                last_name: updated.last_name || '',
                email: updated.email || '',
                phone: updated.phone || '',
                address: updated.address || '',
                grade: updated.grade || '',
            };
            setFormData(normalized);
            setBaselineForm(normalized);
            setStatus({ type: 'success', message: 'Settings saved successfully.' });
            await loadUser();
        } catch (err) {
            setStatus({
                type: 'error',
                message: err.response?.data?.detail || 'Unable to save changes.',
            });
        } finally {
            setSaving(false);
        }
    };

    const fullName = useMemo(
        () => (profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : ''),
        [profile]
    );

    if (loading) {
        return (
            <div className="max-w-5xl mx-auto p-6 animate-pulse space-y-4">
                <div className="h-32 rounded-2xl bg-gray-200" />
                <div className="h-64 rounded-2xl bg-gray-200" />
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="max-w-3xl mx-auto p-6 text-center text-gray-600">
                <p>We couldn't load your settings. Please refresh the page.</p>
            </div>
        );
    }

    const stats = [
        {
            label: profile.role === 'teacher' ? 'Active Courses' : 'Enrolled Courses',
            value: profile.course_count ?? '--',
            icon: 'fas fa-book',
        },
        {
            label: profile.role === 'teacher' ? 'Experience' : 'Grade Level',
            value: profile.role === 'teacher' ? profile.years_experience ?? '--' : profile.grade || '--',
            icon: profile.role === 'teacher' ? 'fas fa-briefcase' : 'fas fa-graduation-cap',
        },
        {
            label: 'Attendance',
            value: `${profile.attendance_rate ?? 0}%`,
            icon: 'fas fa-check-circle',
        },
    ];

    const teacherProfile = profile.teacher_profile;

    const sectionNav = sections.map((section) => ({
        ...section,
        active: activeSection === section.id,
    }));

    return (
        <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-8">
            <header className={`${cardBase} p-6 flex flex-col gap-6`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-2xl bg-[#18216D] text-white flex items-center justify-center text-3xl font-black shadow-lg shadow-indigo-900/20">
                            {(fullName || '??').slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-[0.3em] text-[#FFC425] font-black leading-none mb-2">Portal Settings</p>
                            <h1 className="text-3xl font-black text-[#18216D] tracking-tight leading-none">{fullName || 'Unnamed user'}</h1>
                            <p className="text-sm text-slate-400 capitalize font-medium mt-2">{profile.role}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 w-full lg:w-auto">
                        {stats.map((stat) => (
                            <div key={stat.label} className="rounded-2xl bg-slate-50 p-5 text-center border border-slate-100 min-w-[120px]">
                                <p className="text-[9px] uppercase text-slate-400 font-black tracking-widest">{stat.label}</p>
                                <p className="text-xl font-black text-[#18216D] mt-2 flex items-center justify-center gap-2">
                                    <i className={`${stat.icon} text-[#FFC425]`} />
                                    {stat.value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="flex flex-wrap gap-2">
                    {sectionNav.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`px-5 py-2.5 rounded-xl text-[10px] uppercase font-black tracking-widest transition-all ${section.active ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                }`}
                        >
                            {section.title}
                        </button>
                    ))}
                </div>
            </header>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <aside className={`${cardBase} p-6 space-y-4`}>
                    <p className="text-xs uppercase text-gray-400 font-semibold">Sections</p>
                    <nav className="space-y-2">
                        {sectionNav.map((section) => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id)}
                                className={`w-full text-left px-4 py-4 rounded-xl transition-all border-2 ${section.active
                                    ? 'bg-[#18216D]/5 border-[#18216D] text-[#18216D]'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                    }`}
                            >
                                <p className="text-sm font-black uppercase tracking-tight">{section.title}</p>
                                <p className="text-xs text-gray-500">{section.description}</p>
                            </button>
                        ))}
                    </nav>
                    <div className="pt-4 border-t border-gray-100 text-sm text-gray-500 space-y-2">
                        <p>Need help updating your information?</p>
                        <a href="mailto:support@kiandaschool.com" className="text-[#18216D] font-black underline decoration-[#FFC425] decoration-2 underline-offset-4">
                            Contact support
                        </a>
                    </div>
                </aside>

                <form onSubmit={handleSubmit} className={`${cardBase} p-6 space-y-6`}>
                    {status.message && (
                        <div
                            className={`rounded-xl px-4 py-3 text-sm ${status.type === 'success'
                                ? 'bg-green-50 text-green-700 border border-green-200'
                                : 'bg-red-50 text-red-700 border border-red-200'
                                }`}
                        >
                            {status.message}
                        </div>
                    )}

                    {activeSection === 'account' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Account</h2>
                                <p className="text-sm text-gray-500">Update your identity and authentication details.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelBase} htmlFor="first_name">
                                        First name
                                    </label>
                                    <input
                                        id="first_name"
                                        name="first_name"
                                        type="text"
                                        value={formData.first_name}
                                        onChange={handleChange}
                                        className={inputBase}
                                    />
                                </div>
                                <div>
                                    <label className={labelBase} htmlFor="last_name">
                                        Last name
                                    </label>
                                    <input
                                        id="last_name"
                                        name="last_name"
                                        type="text"
                                        value={formData.last_name}
                                        onChange={handleChange}
                                        className={inputBase}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelBase} htmlFor="email">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={inputBase}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'contact' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Contact</h2>
                                <p className="text-sm text-gray-500">Stay reachable for announcements and alerts.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelBase} htmlFor="phone">
                                        Phone
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={inputBase}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelBase} htmlFor="address">
                                        Address
                                    </label>
                                    <textarea
                                        id="address"
                                        name="address"
                                        rows={4}
                                        value={formData.address}
                                        onChange={handleChange}
                                        className={`${inputBase} resize-none`}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSection === 'academic' && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Academic</h2>
                                <p className="text-sm text-gray-500">Grade levels and teaching assignments.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelBase} htmlFor="grade">
                                        Grade / Level
                                    </label>
                                    <input
                                        id="grade"
                                        name="grade"
                                        type="text"
                                        value={formData.grade}
                                        onChange={handleChange}
                                        className={inputBase}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <p className={labelBase}>Identifier</p>
                                    <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 bg-gray-50">
                                        {profile.student_id || teacherProfile?.teacher_id || 'N/A'}
                                    </div>
                                </div>
                            </div>
                            {teacherProfile && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <p className={labelBase}>Specialization</p>
                                        <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 bg-gray-50">
                                            {teacherProfile.specialization || 'Not set'}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className={labelBase}>Experience (years)</p>
                                        <div className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700 bg-gray-50">
                                            {teacherProfile.experience_years ?? 'Not set'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={!hasChanges || saving}
                            className={`rounded-xl border px-4 py-2 text-sm font-semibold ${hasChanges && !saving
                                ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                                : 'border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            Reset
                        </button>
                        <button
                            type="submit"
                            disabled={!hasChanges || saving}
                            className={`rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all ${hasChanges && !saving
                                ? 'bg-[#18216D] shadow-indigo-100 hover:bg-[#0D164F] hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-slate-200 cursor-not-allowed'
                                }`}
                        >
                            {saving ? 'Synchronizing…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;

