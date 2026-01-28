import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Calendar = ({ events = [] }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth(); // 0-indexed

        // Helper to formatting date as YYYY-MM-DD using local time
        const formatLocal = (y, m, d) => {
            const mm = String(m + 1).padStart(2, '0');
            const dd = String(d).padStart(2, '0');
            return `${y}-${mm}-${dd}`;
        };

        const firstDay = new Date(year, month, 1).getDay(); // Day of week (0-6)
        const days = new Date(year, month + 1, 0).getDate(); // Last day of month

        const calendarDays = [];
        // Pad with previous month's days
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
        events.forEach(ev => {
            if (ev.due_date) {
                // Parse due date strings robustly
                const datePart = ev.due_date.split('T')[0];
                if (!dates[datePart]) dates[datePart] = [];
                dates[datePart].push(ev);
            }
        });
        return dates;
    }, [events]);

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-xl shadow-indigo-900/5">
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h3 className="text-2xl font-black text-[#18216D] tracking-tight">Academic Timeline</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Assignment Deadlines & Events</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm text-slate-400 hover:text-[#18216D]">
                        <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="text-sm font-black text-[#18216D] uppercase tracking-widest min-w-[120px] text-center">
                        {currentDate.toLocaleDateString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white rounded-xl transition-all shadow-sm text-slate-400 hover:text-[#18216D]">
                        <ChevronRightIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest pb-4">
                        {day}
                    </div>
                ))}
                {daysInMonth.map((dateObj, idx) => {
                    const hasEvents = dateObj.fullDate && eventDates[dateObj.fullDate];
                    const isToday = dateObj.fullDate === new Date().toISOString().split('T')[0]; // Works if local time aligns, but safer to use local formatter

                    // Robust check for today in local time
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                    const isCurrentDay = dateObj.fullDate === todayStr;

                    return (
                        <div key={idx} className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all ${dateObj.day ? 'hover:bg-slate-50 cursor-pointer group' : ''} ${isCurrentDay ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20' : 'text-[#18216D]'}`}>
                            {dateObj.day && (
                                <>
                                    <span className={`text-sm font-black ${isCurrentDay ? 'text-white' : 'text-[#18216D]'}`}>{dateObj.day}</span>
                                    {hasEvents && (
                                        <div className="flex gap-0.5 mt-1">
                                            {eventDates[dateObj.fullDate].slice(0, 3).map((ev, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full ${ev.is_completed ? 'bg-emerald-500' : 'bg-[#FFC425]'}`} />
                                            ))}
                                        </div>
                                    )}
                                    {hasEvents && (
                                        <div className="absolute top-0 left-full ml-2 z-50 invisible group-hover:visible bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[200px]">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadlines</p>
                                            {eventDates[dateObj.fullDate].map((ev, i) => (
                                                <div key={i} className="mb-2 last:mb-0">
                                                    <div className="text-xs font-bold text-[#18216D] leading-tight flex items-start gap-1">
                                                        <span>•</span>
                                                        <span>{ev.title}</span>
                                                    </div>
                                                    {ev.learning_area_name && (
                                                        <div className="ml-2 mt-0.5 text-[8px] font-black text-slate-400 uppercase tracking-wider">
                                                            {ev.learning_area_name}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
