import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAuth } from '../../context/AuthContext';
import { useAppState } from '../../context/AppStateContext';
import {
    AcademicCapIcon,
    ArrowDownTrayIcon,
    ChartBarIcon,
    CheckBadgeIcon,
    DocumentTextIcon,
    InformationCircleIcon,
    StarIcon,
    ChevronDownIcon,
    TrophyIcon
} from '@heroicons/react/24/outline';

const SuccessHub = () => {
    const { user } = useAuth();
    const { get } = useApi();
    const { showToast } = useAppState();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState(null);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview' or 'detailed'

    const fetchReport = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const data = await get(`/api/cbc/reports/student/${user.id}/`);
            setReportData(data);
        } catch (error) {
            console.error('Error fetching report:', error);
            showToast('Failed to load progress report', 'error');
        } finally {
            setLoading(false);
        }
    }, [user, get, showToast]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handleDownloadReport = async () => {
        try {
            // Using the text based report for now as per backend implementation
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/cbc/reports/student/${user.id}/pdf/`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `CBC_Report_${user.first_name || 'Student'}.txt`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            showToast('Report download started!');
        } catch (error) {
            showToast('Failed to download report', 'error');
        }
    };

    const getGradeColor = (level) => {
        switch (level) {
            case 'EE': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'ME': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'AE': return 'bg-blue-50 text-blue-600 border-blue-100';
            case 'BE': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const getFullLabel = (level) => {
        switch (level) {
            case 'EE': return 'Exceeding Expectations';
            case 'ME': return 'Meeting Expectations';
            case 'AE': return 'Approaching Expectations';
            case 'BE': return 'Below Expectations';
            default: return 'Not Assessed';
        }
    };

    const SubStrandCard = ({ subStrand }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const totalOutcomes = subStrand.outcomes?.length || 0;
        const masteredOutcomes = subStrand.outcomes?.filter(o => ['EE', 'ME'].includes(o.competency_level)).length || 0;
        const masteryPercentage = totalOutcomes > 0 ? Math.round((masteredOutcomes / totalOutcomes) * 100) : 0;

        return (
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-900/5 transition-all overflow-hidden group">
                <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                        <div className="flex-1">
                            <h4 className="text-lg font-black text-[#18216D] tracking-tight group-hover:text-blue-600 transition-colors uppercase">
                                {subStrand.name}
                            </h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                {totalOutcomes} Core Competencies
                            </p>
                        </div>
                        <div className="relative h-16 w-16 flex-shrink-0">
                            <svg className="h-full w-full rotate-[-90deg]">
                                <circle cx="32" cy="32" r="28" fill="transparent" stroke="#f1f5f9" strokeWidth="6" />
                                <circle
                                    cx="32" cy="32" r="28" fill="transparent"
                                    stroke={masteryPercentage >= 80 ? '#10b981' : masteryPercentage >= 50 ? '#18216D' : '#f59e0b'}
                                    strokeWidth="6"
                                    strokeDasharray={`${2 * Math.PI * 28}`}
                                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - masteryPercentage / 100)}`}
                                    strokeLinecap="round"
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#18216D]">
                                {masteryPercentage}%
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                            {subStrand.outcomes?.slice(0, 3).map((o, i) => (
                                <div key={i} className={`h-6 w-6 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold ${getGradeColor(o.competency_level)}`}>
                                    {o.competency_level || '?'}
                                </div>
                            ))}
                            {totalOutcomes > 3 && (
                                <div className="h-6 w-6 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                    +{totalOutcomes - 3}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="text-[#18216D] hover:bg-slate-50 p-2 rounded-xl transition-all"
                        >
                            <ChevronDownIcon className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="px-8 pb-8 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="pt-4 border-t border-slate-50">
                            {subStrand.outcomes?.map((outcome) => (
                                <div key={outcome.code} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl mb-2 hover:bg-slate-50 transition-colors">
                                    <div className="flex-1 min-w-0 mr-4">
                                        <p className="text-[11px] font-bold text-slate-600 leading-tight">{outcome.outcome}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{outcome.code}</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${getGradeColor(outcome.competency_level)}`}>
                                        {outcome.competency_level || 'N/A'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#18216D]/10 border-t-[#18216D] mb-4"></div>
                <p className="text-[#18216D] font-black uppercase tracking-widest text-[10px]">Assembling Your Success Journey...</p>
            </div>
        );
    }

    if (!reportData) return null;

    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            {/* High-Density White Header */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-8 py-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-[#18216D] text-[10px] font-black uppercase tracking-[0.2em]">Scholar Success Hub</span>
                                <div className="w-1 h-1 bg-slate-200 rounded-full" />
                                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-widest">
                                    ID: {reportData.student?.student_id}
                                </span>
                            </div>
                            <h1 className="text-3xl font-black text-[#18216D] tracking-tight">Academic Mastery</h1>
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="hidden md:block text-right mr-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Scholar</p>
                                <p className="text-sm font-black text-[#18216D]">{reportData.student?.name}</p>
                            </div>
                            <button
                                onClick={handleDownloadReport}
                                className="flex items-center justify-center gap-2 bg-[#FFC425] text-[#18216D] px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-[#18216D] hover:text-white transition-all shadow-lg shadow-amber-900/10 group"
                            >
                                <ArrowDownTrayIcon className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                                Export Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8 pt-12">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                                <CheckBadgeIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Exceeding</p>
                                <p className="text-3xl font-black text-[#18216D]">{reportData.overall_stats?.breakdown?.EE || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                                <StarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meeting</p>
                                <p className="text-3xl font-black text-[#18216D]">{reportData.overall_stats?.breakdown?.ME || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                <ChartBarIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                                <p className="text-3xl font-black text-[#18216D]">{reportData.overall_stats?.total_assessments || 0}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center">
                                <DocumentTextIcon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Subjects</p>
                                <p className="text-3xl font-black text-[#18216D]">{reportData.learning_areas?.length || 0}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Grid */}
                <div className="space-y-12">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-black text-[#18216D] tracking-tight flex items-center gap-3">
                                Competency Mastery Matrix
                            </h2>
                            <p className="text-slate-400 font-bold text-sm mt-1">Your academic progression across all sub-strands</p>
                        </div>
                        <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-[2rem] shadow-sm border border-slate-100">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                <span className="text-[10px] font-black text-[#18216D] uppercase tracking-widest">Mastered</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-[#18216D]"></div>
                                <span className="text-[10px] font-black text-[#18216D] uppercase tracking-widest">Developing</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-16">
                        {reportData.learning_areas?.map((area) => {
                            const totalOutcomesArea = area.strands?.reduce((acc, strand) =>
                                acc + (strand.sub_strands?.reduce((s_acc, sub) => s_acc + (sub.outcomes?.length || 0), 0) || 0), 0) || 0;
                            const masteredOutcomesArea = area.strands?.reduce((acc, strand) =>
                                acc + (strand.sub_strands?.reduce((s_acc, sub) => s_acc + (sub.outcomes?.filter(o => ['EE', 'ME'].includes(o.competency_level)).length || 0), 0) || 0), 0) || 0;
                            const progressionRating = totalOutcomesArea > 0 ? (masteredOutcomesArea / totalOutcomesArea) * 100 : 0;
                            const isPassing = progressionRating >= 80;

                            return (
                                <div key={area.code} className="space-y-8">
                                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="text-[10px] font-black text-[#FFC425] uppercase tracking-widest px-2 py-0.5 bg-[#FFC425]/10 rounded">{area.code}</span>
                                                <div className="h-px bg-slate-100 flex-1"></div>
                                            </div>
                                            <h3 className="text-4xl font-black text-[#18216D] tracking-tighter">{area.name}</h3>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Academic Status</p>
                                                <div className={`flex items-center gap-2 font-black text-sm uppercase tracking-widest ${isPassing ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                    {isPassing ? (
                                                        <>
                                                            <TrophyIcon className="w-5 h-5" />
                                                            On Track for Promotion
                                                        </>
                                                    ) : (
                                                        <>
                                                            <InformationCircleIcon className="w-5 h-5" />
                                                            Developing Competence
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="bg-[#18216D] text-white px-6 py-4 rounded-[2rem] text-center shadow-xl shadow-indigo-900/20">
                                                <p className="text-[8px] font-black text-indigo-300 uppercase tracking-[0.2em] mb-1">Area Mastery</p>
                                                <p className="text-xl font-black">{Math.round(progressionRating)}%</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        {area.strands?.flatMap(strand => strand.sub_strands || []).map((sub, idx) => (
                                            <SubStrandCard key={idx} subStrand={sub} />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default SuccessHub;
