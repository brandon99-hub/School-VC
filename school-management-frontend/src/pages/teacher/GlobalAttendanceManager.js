import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import AttendanceRegistry from '../../components/teacher/AttendanceRegistry';
import { Squares2X2Icon, BookOpenIcon } from '@heroicons/react/24/outline';

const GlobalAttendanceManager = () => {
    const { courses } = useAppState();
    const [selectedCourseId, setSelectedCourseId] = useState(null);

    useEffect(() => {
        if (courses.length > 0 && !selectedCourseId) {
            setSelectedCourseId(courses[0].id);
        }
    }, [courses, selectedCourseId]);

    const activeCourse = courses.find(c => c.id === selectedCourseId);

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8 space-y-10">
                <header className="relative overflow-hidden bg-[#18216D] rounded-[2.5rem] p-12 text-white shadow-2xl shadow-indigo-900/20">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-2">Registry Control</p>
                        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter italic">Global Attendance</h1>
                        <p className="text-indigo-100/70 max-w-2xl font-medium text-lg mt-6">
                            Manage attendance across all your learning areas from one centralized portal.
                        </p>
                    </div>
                </header>

                <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="h-10 w-10 bg-indigo-50 text-[#18216D] rounded-xl flex items-center justify-center">
                            <BookOpenIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-[#18216D] uppercase tracking-tight">Select Learning Area</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Toggle current class view</p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        {courses.map(course => (
                            <button
                                key={course.id}
                                onClick={() => setSelectedCourseId(course.id)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${selectedCourseId === course.id
                                    ? 'bg-[#18216D] text-white border-[#18216D] shadow-lg shadow-indigo-900/20 scale-105'
                                    : 'bg-white text-slate-400 border-slate-100 hover:border-slate-200'}`}
                            >
                                {course.name} ({course.code})
                            </button>
                        ))}
                    </div>
                </section>

                {activeCourse ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <AttendanceRegistry courseId={activeCourse.id} students={activeCourse.enrolled_students || []} />
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs italic">No learning areas assigned.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default GlobalAttendanceManager;
