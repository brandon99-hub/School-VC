import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowsUpDownIcon,
    ArrowDownTrayIcon,
    PrinterIcon
} from '@heroicons/react/24/outline';

const SchoolFinancialLedger = () => {
    const { get } = useApi();
    const [ledgers, setLedgers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [gradeFilter, setGradeFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'cleared', 'outstanding', 'partial'
    const [sortConfig, setSortConfig] = useState({ key: 'student_name', direction: 'asc' });
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchLedgerData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await get('/api/finance/student-fees/');
            setLedgers(response || []);
        } catch (error) {
            console.error('Error fetching ledger data:', error);
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchLedgerData();
    }, [fetchLedgerData]);

    const sortedAndFilteredLedgers = useMemo(() => {
        let result = ledgers.filter(item => {
            const matchesSearch =
                item.student_details?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.student_details?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.student_details?.student_id?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesGrade = !gradeFilter || item.student_details?.grade === gradeFilter;

            const matchesStatus = !statusFilter ||
                (statusFilter === 'cleared' && item.balance <= 0) ||
                (statusFilter === 'outstanding' && item.amount_paid === 0) ||
                (statusFilter === 'partial' && item.amount_paid > 0 && item.balance > 0);

            return matchesSearch && matchesGrade && matchesStatus;
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aVal, bVal;

                if (sortConfig.key === 'student_name') {
                    aVal = `${a.student_details?.first_name} ${a.student_details?.last_name}`;
                    bVal = `${b.student_details?.first_name} ${b.student_details?.last_name}`;
                } else {
                    aVal = a[sortConfig.key];
                    bVal = b[sortConfig.key];
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
        setCurrentPage(1); // Reset to first page on filter change
        return result;
    }, [ledgers, searchTerm, gradeFilter, statusFilter, sortConfig]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, gradeFilter, statusFilter, sortConfig]);

    // Pagination Logic
    const totalPages = Math.ceil(sortedAndFilteredLedgers.length / itemsPerPage);
    const paginatedLedgers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return sortedAndFilteredLedgers.slice(startIndex, startIndex + itemsPerPage);
    }, [sortedAndFilteredLedgers, currentPage]);

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (item) => {
        if (item.balance <= 0) {
            return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-emerald-100">Cleared</span>;
        }
        if (item.amount_paid === 0) {
            return <span className="px-3 py-1 bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-rose-100">Outstanding</span>;
        }
        return <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full border border-amber-100">Partial</span>;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#18216D]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-6">
                    <div>
                        <h2 className="text-xl font-black text-[#18216D] tracking-tight italic">Student Accounts</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Institutional Revenue Control</p>
                    </div>
                    <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-emerald-50 rounded-2xl border border-emerald-100">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none">M-Pesa Gateway Live Sync</span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="text-right mr-4 hidden md:block">
                        <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Last Statement Pull</p>
                        <p className="text-[10px] font-bold text-slate-500">Just now</p>
                    </div>
                    <button className="p-2.5 text-slate-400 hover:text-[#18216D] transition-colors"><PrinterIcon className="w-5 h-5" /></button>
                    <button className="p-2.5 text-slate-400 hover:text-[#18216D] transition-colors"><ArrowDownTrayIcon className="w-5 h-5" /></button>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative group md:col-span-2">
                    <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#18216D]" />
                    <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-sm outline-none"
                    />
                </div>
                <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-sm outline-none"
                >
                    <option value="">All Grade Levels</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(g => (
                        <option key={g} value={g.toString()}>Grade {g}</option>
                    ))}
                </select>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-bold text-sm outline-none"
                >
                    <option value="">All Statuses</option>
                    <option value="cleared">Cleared</option>
                    <option value="outstanding">Outstanding</option>
                    <option value="partial">Partial Payment</option>
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 border-b border-slate-100">
                            <tr>
                                <th onClick={() => requestSort('student_name')} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-[#18216D]">
                                    <div className="flex items-center gap-2">Scholar Identity <ArrowsUpDownIcon className="w-3 h-3" /></div>
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Grade</th>
                                <th onClick={() => requestSort('final_amount')} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-[#18216D]">
                                    <div className="flex items-center justify-end gap-2">Invoiced <ArrowsUpDownIcon className="w-3 h-3" /></div>
                                </th>
                                <th onClick={() => requestSort('amount_paid')} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-[#18216D]">
                                    <div className="flex items-center justify-end gap-2">Paid <ArrowsUpDownIcon className="w-3 h-3" /></div>
                                </th>
                                <th onClick={() => requestSort('balance')} className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right cursor-pointer hover:text-[#18216D]">
                                    <div className="flex items-center justify-end gap-2">Balance <ArrowsUpDownIcon className="w-3 h-3" /></div>
                                </th>
                                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {paginatedLedgers.map((item) => (
                                <tr key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                                    <td className="px-8 py-5">
                                        <div>
                                            <p className="font-black text-[#18216D] text-sm italic">{item.student_details?.first_name} {item.student_details?.last_name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.student_details?.student_id}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="text-[10px] font-black text-[#18216D] uppercase bg-slate-100 px-2 py-1 rounded-md">Grade {item.student_details?.grade}</span>
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-sm text-[#18216D]">
                                        {formatCurrency(item.final_amount)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-bold text-sm text-emerald-600">
                                        {formatCurrency(item.amount_paid)}
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-sm text-rose-600 italic">
                                        {formatCurrency(item.balance)}
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        {getStatusBadge(item)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {paginatedLedgers.length > 0 && (
                    <div className="flex items-center justify-between border-t border-slate-100 pt-6 px-6 pb-6 bg-slate-50/50">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, sortedAndFilteredLedgers.length)} of {sortedAndFilteredLedgers.length} records
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-[#18216D] disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-[#18216D] disabled:opacity-50 hover:bg-slate-50 transition-colors"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}

                {sortedAndFilteredLedgers.length === 0 && (
                    <div className="py-20 text-center">
                        <FunnelIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No records match your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SchoolFinancialLedger;
