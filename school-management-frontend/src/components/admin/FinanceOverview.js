import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const FinanceOverview = () => {
    const [overview, setOverview] = useState({
        total_fees: 0,
        total_paid: 0,
        total_balance: 0,
        defaulters_count: 0,
        recent_payments: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOverview();
    }, []);

    const fetchOverview = async () => {
        try {
            const response = await axios.get('/api/finance/overview/');
            setOverview(response.data);
        } catch (error) {
            console.error('Error fetching finance overview:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-KE', {
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8">
                <div className="animate-pulse">
                    <div className="h-8 bg-slate-100 rounded-xl w-1/3 mb-6"></div>
                    <div className="grid grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-slate-100 rounded-2xl"></div>)}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-indigo-50/50 p-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>

            <div className="flex items-center justify-between mb-8 relative z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#18216D]/5 rounded-2xl flex items-center justify-center">
                        <i className="fas fa-wallet text-[#18216D] text-xl"></i>
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-[#18216D] uppercase tracking-tight">Financial Overview</h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Institutional Revenue & Collections</p>
                    </div>
                </div>
                <Link
                    to="/admin/finance"
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-[#18216D] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#18216D] hover:text-white transition-all group"
                >
                    View Details <i className="fas fa-arrow-right text-[8px] group-hover:translate-x-1 transition-transform"></i>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10 relative z-10">
                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:border-indigo-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:bg-[#18216D] group-hover:text-white transition-all">
                        <i className="fas fa-coins text-xs"></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Fees</p>
                    <p className="text-xl font-black text-[#18216D] tracking-tight">{formatCurrency(overview.total_fees)}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:border-emerald-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <i className="fas fa-check-circle text-xs"></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Collected</p>
                    <p className="text-xl font-black text-emerald-600 tracking-tight">{formatCurrency(overview.total_paid)}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:border-amber-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-4 group-hover:bg-[#FFC425] group-hover:text-[#18216D] transition-all">
                        <i className="fas fa-clock text-xs"></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Outstanding</p>
                    <p className="text-xl font-black text-amber-600 tracking-tight">{formatCurrency(overview.total_balance)}</p>
                </div>

                <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:border-rose-100 transition-colors group">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center mb-4 group-hover:bg-rose-600 group-hover:text-white transition-all">
                        <i className="fas fa-exclamation-triangle text-xs"></i>
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Defaulters</p>
                    <p className="text-xl font-black text-rose-600 tracking-tight">{overview.defaulters_count}</p>
                </div>
            </div>

            {/* Recent Payments Section */}
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Recent Transactions</h3>
                    <div className="h-px bg-slate-100 flex-1 mx-6"></div>
                </div>

                {overview.recent_payments.length === 0 ? (
                    <div className="bg-slate-50/50 rounded-2xl py-8 text-center border border-dashed border-slate-200">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No recent settlement entries</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {overview.recent_payments.slice(0, 5).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all group">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-[#18216D] group-hover:bg-white transition-colors">
                                        <i className="fas fa-user text-xs"></i>
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900 leading-none">{payment.student_name}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-1.5 tracking-wider">{payment.payment_method} • {formatDate(payment.payment_date)}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-emerald-600 leading-none">{formatCurrency(payment.amount)}</p>
                                    <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Settled</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-8 flex gap-4 relative z-10">
                <Link
                    to="/admin/finance/record-payment"
                    className="flex-1 py-4 bg-[#18216D] text-white rounded-2xl hover:bg-black transition-all shadow-xl shadow-indigo-900/10 text-center text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    Record Payment
                </Link>
                <Link
                    to="/admin/finance/defaulters"
                    className="flex-1 py-4 bg-white text-[#18216D] border border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-all text-center text-[10px] font-black uppercase tracking-[0.2em]"
                >
                    View Defaulters
                </Link>
            </div>
        </div>
    );
};

export default FinanceOverview;
