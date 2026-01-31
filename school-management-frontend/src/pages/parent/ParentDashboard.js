import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

import {
    ClockIcon,
    CalendarIcon,
    AcademicCapIcon,
    BanknotesIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    ChartBarIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const { get, post } = useApi();
    const [parent, setParent] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childActivities, setChildActivities] = useState(null);
    const [childFinances, setChildFinances] = useState(null);
    const [childCalendarData, setChildCalendarData] = useState(null);
    const [childMetrics, setChildMetrics] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [loading, setLoading] = useState(true);

    const handlePayEventFee = async (event) => {
        try {
            await post('/api/events/pay-fee/', {
                student_id: selectedChild.id,
                event_id: event.id
            });
            alert(`Fee for ${event.title} has been processed. A fee record for KES ${event.cost} has been created.`);
            fetchChildData(); // Refresh finances
        } catch (error) {
            console.error('Error paying event fee:', error);
            alert('Could not process payment. Please try again or contact administration.');
        }
    };

    const fetchParentData = useCallback(async () => {
        try {
            const data = await get('/api/parents/me/');
            setParent(data);
            if (data.children && data.children.length > 0) {
                setSelectedChild(data.children[0]);
            }
        } catch (error) {
            console.error('Error fetching parent data:', error);
        } finally {
            setLoading(false);
        }
    }, [get]);

    const fetchChildData = useCallback(async () => {
        try {
            const [activities, finances, calendar, metrics] = await Promise.all([
                get(`/api/parents/child-activities/${selectedChild.id}/`),
                get(`/api/parents/child-finances/${selectedChild.id}/`),
                get(`/api/parents/child-calendar/${selectedChild.id}/`),
                get(`/api/cbc/competency-assessments/summary/${selectedChild.id}/`)
            ]);
            setChildActivities(activities);
            setChildFinances(finances);
            setChildCalendarData(calendar);
            setChildMetrics(metrics);
        } catch (error) {
            console.error('Error fetching child data:', error);
        }
    }, [get, selectedChild?.id]);

    useEffect(() => {
        fetchParentData();
    }, [fetchParentData]);

    useEffect(() => {
        if (selectedChild) {
            fetchChildData();
        }
    }, [selectedChild, fetchChildData]);

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        // Helper to formatting date as YYYY-MM-DD using local time
        const formatLocal = (y, m, d) => {
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            return `${y}-${mm}-${dd}`;
        };

        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();

        const calendarDays = [];
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push({ day: null, fullDate: null });
        }
        for (let i = 1; i <= days; i++) {
            calendarDays.push({
                day: i,
                fullDate: formatLocal(year, month, i)
            });
        }
        return calendarDays;
    }, [currentDate]);

    const eventDates = useMemo(() => {
        const dates = {};
        if (!childCalendarData) return dates;

        const allEvents = [
            ...(childCalendarData.assignments || []).map(a => ({ ...a, type: 'Assignment' })),
            ...(childCalendarData.quizzes || []).map(q => ({ ...q, type: 'Quiz' })),
            ...(childCalendarData.events || []).map(e => ({
                ...e,
                type: 'School Event',
                due_date: e.start_date,
                is_event: true
            }))
        ];

        allEvents.forEach(ev => {
            if (ev.due_date) {
                // Parse due date strings robustly matching YYYY-MM-DD
                const datePart = ev.due_date.split('T')[0];
                if (!dates[datePart]) dates[datePart] = [];
                dates[datePart].push(ev);
            }
        });
        return dates;
    }, [childCalendarData]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        navigate('/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18216D]"></div>
            </div>
        );
    }

    if (!parent || !parent.children || parent.children.length === 0) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 p-12 text-center border border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16"></div>
                        <div className="h-24 w-24 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-8 relative z-10">
                            <i className="fas fa-users-viewfinder text-4xl text-[#18216D]"></i>
                        </div>
                        <h2 className="text-3xl font-black text-[#18216D] mb-4">Awaiting Connection</h2>
                        <p className="text-slate-500 font-medium text-lg leading-relaxed mb-10">
                            Welcome to the Kianda Parent Portal. Your account is active, but no scholar profiles have been linked to your profile yet by the administration.
                        </p>
                        <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 flex items-start gap-4 text-left">
                            <i className="fas fa-circle-info text-amber-600 mt-1"></i>
                            <div>
                                <p className="text-sm font-black text-amber-900 uppercase tracking-wider mb-1">What's Next?</p>
                                <p className="text-sm text-amber-800/80 font-medium">
                                    Please contact the school administration office to have your children's profiles securely connected to your account.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">

            <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1 space-y-10">
                {/* Redesigned Header */}
                <header className="relative overflow-hidden bg-[#18216D] rounded-[2.5rem] p-12 text-white shadow-2xl shadow-indigo-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-2">Parent Portal</p>
                            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter">Welcome back, {parent?.first_name || 'Guardian'}</h1>
                            <div className="h-2 w-24 bg-[#FFC425] rounded-full mt-6"></div>
                        </div>
                    </div>
                </header>

                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Active Scholar Repository</label>
                        <div className="flex flex-wrap gap-2">
                            {parent.children.map(child => (
                                <button
                                    key={child.id}
                                    onClick={() => setSelectedChild(child)}
                                    className={`px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 ${selectedChild?.id === child.id
                                        ? 'bg-[#18216D] text-white border-[#18216D] shadow-xl shadow-indigo-900/20 scale-105'
                                        : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                                >
                                    {child.first_name} {child.last_name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {selectedChild && (
                        <div className="bg-[#FFC425]/10 border border-[#FFC425]/20 px-6 py-3 rounded-2xl">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[#B48A1B]">Official Designation</p>
                            <p className="text-xs font-bold text-[#18216D]">Grade {selectedChild.grade} Scholar • {selectedChild.student_id}</p>
                        </div>
                    )}
                </div>

                {selectedChild && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Competency Summary Top Row */}
                        <div className="mb-8 bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/5 border border-slate-100 p-8 sm:p-10">
                            <h3 className="text-xl font-black text-[#18216D] mb-8 flex items-center gap-3 italic">
                                <ChartBarIcon className="h-6 w-6 text-[#FFC425]" />
                                Competency Matrix Summary
                            </h3>
                            {childMetrics ? (
                                <div className="flex md:grid md:grid-cols-4 gap-6 overflow-x-auto pb-4 md:pb-0 scrollbar-hide snap-x">
                                    {[
                                        { label: 'Exceeding Expectation', val: childMetrics.by_level?.EE || 0, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: 'fa-crown' },
                                        { label: 'Meeting Expectation', val: childMetrics.by_level?.ME || 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: 'fa-check-double' },
                                        { label: 'Approaching Expectation', val: childMetrics.by_level?.AE || 0, color: 'text-amber-600', bg: 'bg-amber-50', icon: 'fa-shoe-prints' },
                                        { label: 'Below Expectation', val: childMetrics.by_level?.BE || 0, color: 'text-rose-600', bg: 'bg-rose-50', icon: 'fa-triangle-exclamation' },
                                    ].map((stat, i) => (
                                        <div key={i} className={`${stat.bg} p-6 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all text-center group min-w-[160px] md:min-w-0 snap-center`}>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="h-8 w-8 bg-white/80 rounded-xl flex items-center justify-center shadow-sm">
                                                    <i className={`fas ${stat.icon} ${stat.color} text-xs`}></i>
                                                </div>
                                            </div>
                                            <div className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.val}</div>
                                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-2 leading-tight">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-slate-300 font-bold uppercase tracking-widest text-xs">Aggregating success metrics...</div>
                            )}
                        </div>
                        {/* Row 2: Finance & Mastery Hub */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Finance Card (2/3) */}
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-slate-100 p-8 flex flex-col justify-between group overflow-hidden relative">
                                <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 group-hover:scale-110 transition-transform"></div>
                                <div className="relative z-10 flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shadow-sm">
                                            <BanknotesIcon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-[#18216D] tracking-tight italic">Financial Framework</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Tuition & Dues Breakdown</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm">Financial Status</span>
                                </div>
                                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Outstanding Balance</p>
                                        <h4 className="text-5xl font-black text-[#18216D] tracking-tighter">
                                            KES {childFinances?.summary?.balance?.toLocaleString() || '0'}
                                        </h4>
                                        {childFinances?.summary?.credit_balance > 0 && (
                                            <div className="mt-4 flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl w-fit border border-emerald-100">
                                                <i className="fas fa-wallet text-[10px]"></i>
                                                <span className="text-[10px] font-black uppercase tracking-widest">Credit Wallet: KES {childFinances.summary.credit_balance.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="mt-6 flex items-center gap-4">
                                            <button
                                                onClick={() => navigate(`/parent/child/${selectedChild.id}/finances`)}
                                                className="bg-[#18216D] text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-900/20"
                                            >
                                                Make Payment
                                            </button>
                                            <button
                                                onClick={() => navigate(`/parent/child/${selectedChild.id}/finances`)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#18216D] hover:underline"
                                            >
                                                View Statement
                                            </button>
                                        </div>
                                    </div>

                                    {childFinances?.fee_frameworks?.length > 0 && (
                                        <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100/50">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                                {childFinances.fee_frameworks[0].academic_term_name} — {childFinances.fee_frameworks[0].academic_year_name}
                                            </p>
                                            <div className="space-y-3">
                                                {[
                                                    { label: 'Tuition', val: childFinances.fee_frameworks[0].tuition_amount },
                                                    { label: 'Material & Books', val: childFinances.fee_frameworks[0].books_amount },
                                                    { label: 'Transport', val: childFinances.fee_frameworks[0].transport_amount },
                                                    { label: 'Extracurricular', val: childFinances.fee_frameworks[0].activities_amount }
                                                ].map((fee, i) => (
                                                    <div key={i} className="flex justify-between items-center text-xs font-bold">
                                                        <span className="text-slate-500">{fee.label}</span>
                                                        <span className="text-[#18216D]">KES {fee.val?.toLocaleString()}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-4 pt-4 border-t border-slate-200/50 flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase text-emerald-600">Total Paid</span>
                                                <span className="text-lg font-black text-emerald-600">KES {childFinances?.summary?.total_paid?.toLocaleString() || '0'}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Mastery Hub (1/3) */}
                            <div className="bg-[#18216D] rounded-[2.5rem] shadow-2xl shadow-indigo-900/20 p-10 text-white flex flex-col justify-between relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-125 transition-transform duration-700"></div>
                                <div className="relative z-10">
                                    <div className="h-16 w-16 bg-white/10 text-white rounded-3xl flex items-center justify-center backdrop-blur-md mb-8 ring-1 ring-white/20 shadow-xl group-hover:rotate-6 transition-transform">
                                        <AcademicCapIcon className="h-8 w-8 text-[#FFC425] transition-colors" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFC425] mb-2">Academic Mastery Hub</p>
                                    <h4 className="text-3xl font-black italic tracking-tighter mb-4 leading-tight">Insight Into Your <br />Scholar's Journey</h4>
                                    <p className="text-indigo-200/60 text-xs font-medium leading-relaxed mb-8">
                                        Access complete competency matrices and teacher assessments.
                                    </p>
                                </div>
                                <div className="relative z-10 flex flex-col gap-4">
                                    <button
                                        onClick={() => navigate(`/parent/child/${selectedChild.id}/progress`)}
                                        className="w-full bg-[#FFC425] text-[#18216D] py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] active:scale-95 transition-all shadow-xl shadow-amber-900/20"
                                    >
                                        Full Report View
                                    </button>
                                    <div className="flex items-center justify-center p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-[#FFC425]/80 italic">Status: On Track</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Calendar (2/3) and Recent Activities (1/3) */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            {/* Calendar (2/3) */}
                            <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-indigo-900/5">
                                <div className="flex items-center justify-between mb-10">
                                    <div>
                                        <h3 className="text-2xl font-black text-[#18216D] tracking-tight flex items-center gap-3 italic">
                                            <CalendarIcon className="h-6 w-6 text-[#FFC425]" />
                                            Scholar Timeline
                                        </h3>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Deadlines & Upcoming Assessments</p>
                                    </div>
                                    <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-100 shadow-inner">
                                        <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-white rounded-xl transition-all shadow-sm text-slate-400 hover:text-[#18216D]">
                                            <ChevronLeftIcon className="w-5 h-5" />
                                        </button>
                                        <span className="text-sm font-black text-[#18216D] uppercase tracking-widest min-w-[140px] text-center italic">
                                            {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                                        </span>
                                        <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-white rounded-xl transition-all shadow-sm text-slate-400 hover:text-[#18216D]">
                                            <ChevronRightIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-6">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                        <div key={day} className="text-center text-[10px] font-black text-slate-300 uppercase tracking-widest pb-4">
                                            {day}
                                        </div>
                                    ))}
                                    {daysInMonth.map((dateObj, idx) => {
                                        const hasEvents = dateObj.fullDate && eventDates[dateObj.fullDate];

                                        // Robust check for today in local time
                                        const today = new Date();
                                        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                        const isToday = dateObj.fullDate === todayStr;

                                        return (
                                            <div key={idx} className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all ${dateObj.day ? 'hover:bg-slate-50 cursor-pointer group' : ''} ${isToday ? 'bg-[#18216D] text-white shadow-xl shadow-indigo-900/20 scale-105 z-10' : 'text-[#18216D]'}`}>
                                                {dateObj.day && (
                                                    <>
                                                        <span className={`text-base font-black ${isToday ? 'text-white' : 'text-[#18216D]'}`}>{dateObj.day}</span>
                                                        {hasEvents && (
                                                            <div className="flex gap-1 mt-1.5">
                                                                {eventDates[dateObj.fullDate].slice(0, 3).map((ev, i) => (
                                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${ev.is_completed ? 'bg-emerald-500' : 'bg-[#FFC425]'}`} />
                                                                ))}
                                                            </div>
                                                        )}
                                                        {hasEvents && (
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-4 z-[100] invisible group-hover:visible bg-[#18216D] text-white p-5 rounded-[1.5rem] shadow-2xl border border-white/10 min-w-[240px] animate-in zoom-in-95 duration-200">
                                                                <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-4 border-b border-white/10 pb-2 italic">Tasks for {dateObj.day}</p>
                                                                <div className="space-y-3">
                                                                    {eventDates[dateObj.fullDate].map((ev, i) => (
                                                                        <div key={i} className="flex items-start gap-3 group/item">
                                                                            <div className={`mt-1 shrink-0 h-4 w-4 bg-white/10 rounded-md flex items-center justify-center`}>
                                                                                {ev.is_completed ? <CheckCircleIconSolid className="text-emerald-400 w-3 h-3" /> : <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className="text-[11px] font-black leading-tight italic truncate">{ev.title}</p>
                                                                                <p className="text-[8px] font-bold text-indigo-300 uppercase tracking-widest mt-0.5">{ev.type}</p>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                                <div className="absolute top-full left-1/2 -ml-2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-[#18216D]"></div>
                                                            </div>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Recent Activities (1/3) */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-slate-100 p-10 flex flex-col group h-full">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 bg-[#FFC425]/10 rounded-2xl flex items-center justify-center border border-[#FFC425]/20 group-hover:rotate-6 transition-transform">
                                            <ClockIcon className="h-6 w-6 text-[#B48A1B]" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-[#18216D] italic tracking-tight">Recent Activity</h3>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live status updates</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
                                    {childActivities ? (
                                        [
                                            ...(childActivities.assignments || []).map(a => ({ ...a, type: 'Assignment' })),
                                            ...(childActivities.quizzes || []).map(q => ({ ...q, type: 'Quiz' })),
                                            ...(childActivities.events || []).map(e => ({ ...e, type: 'School Event', is_event: true }))
                                        ].sort((a, b) => new Date(b.created_at || b.start_date) - new Date(a.created_at || a.start_date)).slice(0, 10).map((item, idx) => (
                                            <div key={idx} className="flex gap-4 items-start p-4 hover:bg-slate-50 transition-all rounded-2xl group/act">
                                                <div className={`mt-1 h-12 w-12 flex-shrink-0 rounded-xl flex items-center justify-center transition-all group-hover/act:scale-110 shadow-sm ${item.type === 'Quiz' ? 'bg-amber-50 text-amber-600' : (item.is_event ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600')}`}>
                                                    {item.type === 'Quiz' ? <AcademicCapIcon className="w-6 h-6" /> : (item.is_event ? <CalendarIcon className="w-6 h-6" /> : <ChartBarIcon className="w-6 h-6" />)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                                            {item.type}
                                                            {item.is_completed && <CheckCircleIconSolid className="w-3 h-3 text-emerald-500" />}
                                                        </span>
                                                        <span className="text-[9px] font-black text-slate-300 uppercase">{new Date(item.created_at || item.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                                    </div>
                                                    <h4 className="font-bold text-[#18216D] text-sm truncate leading-tight">
                                                        {item.title}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {item.learning_area_name && (
                                                            <span className="text-[8px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                                                                {item.learning_area_name}
                                                            </span>
                                                        )}
                                                        {item.is_completed && <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest">Status: Completed</span>}
                                                        {item.is_event && item.cost > 0 && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handlePayEventFee(item);
                                                                }}
                                                                className="text-[8px] font-black uppercase tracking-widest bg-emerald-600 text-white px-2 py-1 rounded shadow-sm hover:scale-105 active:scale-95 transition-all"
                                                            >
                                                                Pay Fee (KES {item.cost})
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-[0.2em] text-[10px] italic">Fetching live scholar updates...</div>
                                    )}

                                    {childActivities && ([...childActivities.assignments, ...childActivities.quizzes].length === 0) && (
                                        <div className="text-center py-20 text-slate-300 font-bold uppercase tracking-widest text-[10px]">No activities recorded</div>
                                    )}
                                </div>

                                <div className="mt-8 pt-8 border-t border-slate-50">
                                    <button
                                        className="w-full h-20 flex items-center justify-center gap-4 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl text-slate-400 hover:border-[#18216D] hover:text-[#18216D] hover:bg-white transition-all group/comm"
                                        onClick={() => navigate('/parent/messages')}
                                    >
                                        <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover/comm:bg-[#18216D] group-hover/comm:text-[#FFC425] transition-all">
                                            <i className="fas fa-envelopes-bulk text-xs"></i>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Communications Hub</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Contact Faculty Desk</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default ParentDashboard;
