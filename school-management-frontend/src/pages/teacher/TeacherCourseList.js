import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import {
    Squares2X2Icon,
    ListBulletIcon,
    MagnifyingGlassIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    UserGroupIcon,
    ClipboardDocumentCheckIcon,
    BookOpenIcon,
    AcademicCapIcon,
    ArrowRightIcon,
    ChevronUpIcon,
    ChevronDownIcon,
    DocumentTextIcon
} from '@heroicons/react/24/outline';

const CourseCard = ({ course, navigate }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div
            className="group relative bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-900/10 transition-all duration-500 overflow-hidden flex flex-col"
        >
            {/* Card Header */}
            <div className="p-6 pb-4 relative">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 bg-[#18216D]/5 rounded-xl group-hover:bg-[#FFC425]/10 transition-colors">
                        <AcademicCapIcon className="w-5 h-5 text-[#18216D]" />
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#18216D] text-white text-[9px] font-black uppercase tracking-widest rounded-lg">
                            {course.grade_level_name}
                        </span>
                        <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-lg border ${course.is_active ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'
                            }`}>
                            {course.is_active ? 'Active' : 'Archived'}
                        </span>
                    </div>
                </div>
                <h3 className="text-xl font-black text-[#18216D] leading-tight mb-0.5 group-hover:translate-x-1 transition-transform">
                    {course.name}
                </h3>
                <p className="text-[10px] font-black text-[#FFC425] uppercase tracking-[0.2em]">
                    {course.code}
                </p>
            </div>

            {/* Compact Stats Row */}
            <div className="px-6 py-4 flex items-center justify-between border-y border-slate-50 bg-slate-50/30">
                <div className="flex items-center gap-2">
                    <UserGroupIcon className="w-4 h-4 text-slate-400" />
                    <span className="text-[10px] font-black text-[#18216D] uppercase tracking-wider">
                        {course.enrolled_students_count || 0} Scholars
                    </span>
                </div>
                <div className="w-px h-3 bg-slate-200" />
                <div className="flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-[#FFC425]" />
                    <span className="text-[10px] font-black text-[#18216D] uppercase tracking-wider">
                        {course.ungraded_submissions_count || 0} Ungraded
                    </span>
                </div>
            </div>

            {/* Assignment Accordion */}
            <div className="px-6 py-4">
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                >
                    <div className="flex items-center gap-3">
                        <BookOpenIcon className="w-4 h-4 text-[#18216D]" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#18216D]">
                            Assignments ({course.assignments?.length || 0})
                        </span>
                    </div>
                    {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5 text-[#18216D]" /> : <ChevronDownIcon className="w-3.5 h-3.5 text-[#18216D]" />}
                </button>

                <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-60 mt-3 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="space-y-1.5 pb-2 scrollbar-thin scrollbar-thumb-slate-200 overflow-y-auto max-h-56">
                        {course.assignments?.length > 0 ? (
                            course.assignments.map((assignment) => (
                                <div key={assignment.id} className="flex items-center justify-between p-2.5 bg-white border border-slate-100 rounded-lg hover:border-[#FFC425] transition-all group/item">
                                    <span className="text-[11px] font-bold text-[#18216D] truncate flex-1 mr-3">
                                        {assignment.title}
                                    </span>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            navigate(`/teacher/assignments/${assignment.id}/submissions`);
                                        }}
                                        className="p-1.5 bg-[#18216D]/5 text-slate-300 rounded-md hover:bg-[#18216D] hover:text-white transition-all"
                                        title="View Submissions"
                                    >
                                        <DocumentTextIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        ) : (
                            <p className="text-[9px] text-slate-400 font-bold italic text-center py-3">No assignments created yet.</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Card Footer Action */}
            <div className="mt-auto px-6 pb-6 pt-2">
                <Link
                    to={`/teacher/courses/${course.id}`}
                    className="flex items-center justify-between text-[#18216D] hover:text-[#FFC425] transition-colors border-t border-slate-50 pt-4"
                >
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Open Full Studio</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 transform group-hover:translate-x-1.5 transition-transform" />
                </Link>
            </div>
        </div>
    );
};

const TeacherCourseList = () => {
    const { get } = useApi();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [searchTerm, setSearchTerm] = useState('');
    const itemsPerPage = 9;

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const response = await get('/teachers/api/courses/');
                setCourses(response?.courses || []);
            } catch (error) {
                console.error('Error fetching courses:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, [get]);

    // Filter and Pagination Logic
    const filteredCourses = useMemo(() => {
        return courses.filter(course =>
            course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            course.code.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [courses, searchTerm]);

    const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentCourses = filteredCourses.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="w-16 h-16 border-4 border-[#18216D]/10 border-t-[#18216D] rounded-full animate-spin"></div>
                <p className="mt-4 text-slate-400 font-bold uppercase tracking-widest text-xs">Curating your learning areas...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header Section */}
                <div className="mb-10 lg:flex lg:items-end lg:justify-between space-y-6 lg:space-y-0">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="w-8 h-1 bg-[#FFC425] rounded-full"></span>
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#18216D]/40">Educator Studio</p>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-[#18216D] tracking-tight">My Learning Areas</h1>
                        <p className="text-slate-500 font-medium max-w-lg">
                            Manage your national standards, strands, and students with precision.
                        </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        {/* Search Bar */}
                        <div className="relative group w-full sm:w-80">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#18216D] transition-colors">
                                <MagnifyingGlassIcon className="w-5 h-5" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by name or code..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-[#18216D]/10 focus:border-[#18216D] transition-all text-sm font-bold text-[#18216D]"
                            />
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-[#18216D]'}`}
                                title="Grid View"
                            >
                                <Squares2X2Icon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setViewMode('table')}
                                className={`p-2 rounded-xl transition-all ${viewMode === 'table' ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20' : 'text-slate-400 hover:text-[#18216D]'}`}
                                title="Table View"
                            >
                                <ListBulletIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                {filteredCourses.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-xl shadow-indigo-900/5">
                        <div className="w-24 h-24 bg-slate-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6">
                            <BookOpenIcon className="w-10 h-10 text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-black text-[#18216D] mb-2">No Results Found</h2>
                        <p className="text-slate-500 max-w-sm mx-auto font-medium">
                            We couldn't find any learning areas matching "{searchTerm}". Try adjusting your search query.
                        </p>
                        <button
                            onClick={() => setSearchTerm('')}
                            className="mt-8 px-8 py-3 bg-[#18216D] text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#0D164F] transition-all"
                        >
                            Reset Search
                        </button>
                    </div>
                ) : viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {currentCourses.map((course) => (
                            <CourseCard key={course.id} course={course} navigate={navigate} />
                        ))}
                    </div>
                ) : (
                    /* Table View Implementation */
                    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-100">
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Learning Area</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Grade Level</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Scholars</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Ungraded</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Status</th>
                                    <th className="px-8 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {currentCourses.map((course) => (
                                    <tr key={course.id} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div>
                                                <p className="text-base font-black text-[#18216D]">{course.name}</p>
                                                <p className="text-[10px] font-bold text-[#FFC425] uppercase tracking-widest">{course.code}</p>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="px-3 py-1 bg-[#18216D]/5 text-[#18216D] text-[10px] font-black uppercase tracking-widest rounded-lg">
                                                {course.grade_level_name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex items-center justify-center gap-2 text-slate-600 font-bold">
                                                <UserGroupIcon className="w-4 h-4" />
                                                {course.enrolled_students_count || 0}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-black text-xs ${course.ungraded_submissions_count > 0 ? 'bg-[#FFC425] text-[#18216D]' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                {course.ungraded_submissions_count || 0}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${course.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                {course.is_active ? 'Active' : 'Archived'}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => navigate(`/teacher/courses/${course.id}`)}
                                                className="inline-flex items-center justify-center p-2 rounded-xl border border-slate-100 text-[#18216D] hover:bg-[#18216D] hover:text-white transition-all shadow-sm"
                                            >
                                                <ArrowRightIcon className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6 px-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">
                            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredCourses.length)} of {filteredCourses.length} Learning Areas
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-3 rounded-2xl bg-white border border-slate-200 text-[#18216D] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                title="Previous Page"
                            >
                                <ChevronLeftIcon className="w-5 h-5" />
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => handlePageChange(i + 1)}
                                        className={`w-10 h-10 rounded-2xl text-xs font-black transition-all ${currentPage === i + 1
                                            ? 'bg-[#18216D] text-white shadow-lg shadow-indigo-900/20'
                                            : 'bg-white text-slate-400 hover:text-[#18216D] border border-slate-100'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-3 rounded-2xl bg-white border border-slate-200 text-[#18216D] hover:bg-[#F8FAFC] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
                                title="Next Page"
                            >
                                <ChevronRightIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherCourseList;
