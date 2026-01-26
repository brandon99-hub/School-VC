import React, { useState, useMemo } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Calendar = ({ assignments }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    const daysInMonth = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const days = new Date(year, month + 1, 0).getDate();

        const calendarDays = [];
        // Pad with previous month's days
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push({ day: null, fullDate: null });
        }
        for (let i = 1; i <= days; i++) {
            calendarDays.push({
                day: i,
                fullDate: new Date(year, month, i).toISOString().split('T')[0]
            });
        }
        return calendarDays;
    }, [currentDate]);

    const assignmentDates = useMemo(() => {
        const dates = {};
        assignments.forEach(a => {
            if (a.due_date) {
                const date = new Date(a.due_date).toISOString().split('T')[0];
                if (!dates[date]) dates[date] = [];
                dates[date].push(a);
            }
        });
        return dates;
    }, [assignments]);

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
                    const hasAssignments = dateObj.fullDate && assignmentDates[dateObj.fullDate];
                    const isToday = dateObj.fullDate === new Date().toISOString().split('T')[0];

                    return (
                        <div key={idx} className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl transition-all ${dateObj.day ? 'hover:bg-slate-50 cursor-pointer group' : ''} ${isToday ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20' : 'text-[#18216D]'}`}>
                            {dateObj.day && (
                                <>
                                    <span className={`text-sm font-black ${isToday ? 'text-white' : 'text-[#18216D]'}`}>{dateObj.day}</span>
                                    {hasAssignments && (
                                        <div className="flex gap-0.5 mt-1">
                                            {assignmentDates[dateObj.fullDate].slice(0, 3).map((_, i) => (
                                                <div key={i} className={`w-1 h-1 rounded-full ${isToday ? 'bg-[#FFC425]' : 'bg-[#FFC425]'}`} />
                                            ))}
                                        </div>
                                    )}
                                    {hasAssignments && (
                                        <div className="absolute top-0 left-full ml-2 z-50 invisible group-hover:visible bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 min-w-[200px]">
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Deadlines</p>
                                            {assignmentDates[dateObj.fullDate].map((a, i) => (
                                                <div key={i} className="text-xs font-bold text-[#18216D] mb-1 leading-tight">• {a.title}</div>
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
