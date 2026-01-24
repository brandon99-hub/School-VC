import React, { useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon, AcademicCapIcon, PlusCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const CourseModal = ({ availableCourses, enrolledCourseIds, onEnroll, onClose, currentPage, totalPages, onPageChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [enrollingId, setEnrollingId] = useState(null);

    const handleEnroll = async (id) => {
        setEnrollingId(id);
        try {
            await onEnroll(id);
        } finally {
            setEnrollingId(null);
        }
    };

    const filteredCourses = availableCourses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.teacher_name && course.teacher_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300"
            role="dialog"
            aria-modal="true"
        >
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/20">
                {/* Discovery Header - Compressed High Density */}
                <div className="px-10 py-6 bg-white border-b border-slate-50">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-[#FFC425] mb-1">Subject Discovery</p>
                            <h3 className="text-3xl font-black text-[#18216D] tracking-tighter">Register Learning Areas</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-50 rounded-xl text-slate-300 hover:text-[#18216D] transition-all"
                        >
                            <XMarkIcon className="w-7 h-7" />
                        </button>
                    </div>

                    {/* Search Bar - Compact */}
                    <div className="relative group mt-6"> {/* Added mt-6 for spacing */}
                        <MagnifyingGlassIcon className="w-5 h-5 absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#18216D] transition-colors" />
                        <input
                            type="text"
                            placeholder="Find subjects by name, code, or teacher..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-16 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-[#18216D]/5 transition-all font-bold text-[#18216D] placeholder-slate-300 text-sm"
                        />
                    </div>
                </div>

                {/* Subject Cards Grid */}
                <div className="flex-1 overflow-y-auto p-10 bg-slate-50/30">
                    {filteredCourses.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 bg-white rounded-[1.5rem] shadow-sm flex items-center justify-center mx-auto mb-6">
                                <AcademicCapIcon className="w-10 h-10 text-slate-100" />
                            </div>
                            <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No matching subjects found</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredCourses.map(course => {
                                const isEnrolled = enrolledCourseIds.includes(course.id);
                                return (
                                    <div
                                        key={course.id}
                                        className="bg-white rounded-[2rem] border border-slate-100 p-8 hover:shadow-2xl hover:shadow-indigo-900/10 transition-all group relative overflow-hidden flex flex-col"
                                    >
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-12 -mt-12 transition-transform group-hover:scale-110"></div>

                                        <div className="relative z-10 flex-1">
                                            <div className="flex justify-between items-start mb-4">
                                                <span className="px-3 py-1 bg-[#18216D] text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                                                    {course.code}
                                                </span>
                                                {isEnrolled && (
                                                    <span className="flex items-center text-emerald-500 font-black text-[9px] uppercase tracking-widest gap-1">
                                                        <CheckCircleIcon className="w-4 h-4" />
                                                        Active
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="text-xl font-black text-[#18216D] mb-2 leading-tight group-hover:text-[#FFC425] transition-colors">
                                                {course.name}
                                            </h4>

                                            <p className="text-xs text-slate-400 font-medium mb-6 line-clamp-2">
                                                {course.description || "In-depth study of conceptual foundations and practical applications in this learning area."}
                                            </p>

                                            <div className="flex items-center gap-3 mt-auto">
                                                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400 font-black text-[10px]">
                                                    {course.teacher_name?.substring(0, 2).toUpperCase() || 'TR'}
                                                </div>
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                    {course.teacher_name || 'Departmental Teacher'}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleEnroll(course.id)}
                                            disabled={isEnrolled || enrollingId === course.id}
                                            className={`mt-8 w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${isEnrolled
                                                ? 'bg-emerald-50 text-emerald-500 cursor-not-allowed border border-emerald-100'
                                                : 'bg-[#18216D] text-white hover:bg-[#0D164F] shadow-lg shadow-indigo-900/10 active:scale-95'
                                                }`}
                                        >
                                            {isEnrolled ? (
                                                <><span>Enrolled</span></>
                                            ) : enrollingId === course.id ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Registering...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <PlusCircleIcon className="w-5 h-5" />
                                                    <span>Register Now</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer / Pagination */}
                <div className="px-10 py-8 bg-white border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <AcademicCapIcon className="w-5 h-5 text-slate-200" />
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">
                            Showing {filteredCourses.length} Learning Areas
                        </span>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => onPageChange(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="p-2.5 bg-slate-50 text-[#18216D] rounded-xl hover:bg-[#18216D] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                                title="Previous Page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /> {/* Changed strokeWidth to 2 */}
                                </svg>
                            </button>
                            <span className="text-[10px] font-black text-[#18216D] uppercase tracking-widest whitespace-nowrap">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                onClick={() => onPageChange(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="p-2.5 bg-slate-50 text-[#18216D] rounded-xl hover:bg-[#18216D] hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed group"
                                title="Next Page"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /> {/* Changed strokeWidth to 2 */}
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CourseModal;
