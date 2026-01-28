import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const ChildFinances = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { get, post } = useApi();
    const [child, setChild] = useState(null);
    const [finances, setFinances] = useState({
        fees: [],
        payments: [],
        invoices: [],
        summary: { balance: 0, total_fees: 0, total_paid: 0, credit_balance: 0 }
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [parentData, financesData] = await Promise.all([
                get('/api/parents/me/'),
                get(`/api/parents/child-finances/${childId}/`)
            ]);

            const childData = parentData.children.find(c => c.id === parseInt(childId));
            setChild(childData);
            setFinances(financesData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [get, childId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            // If the cache refresh endpoint exists and is needed
            // await post(`/api/finance/cache/refresh/${childId}/`);
            await fetchData();
        } catch (error) {
            console.error('Error refreshing data:', error);
        } finally {
            setRefreshing(false);
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
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (loading && !child) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#18216D]"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Redesigned Header */}
            <header className="bg-[#18216D] text-white shadow-2xl shadow-indigo-900/20">
                <div className="max-w-7xl mx-auto px-6 py-10 md:py-16">
                    <button
                        onClick={() => navigate('/parent/dashboard')}
                        className="group mb-8 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-[#FFC425] hover:text-white transition-colors"
                    >
                        <i className="fas fa-arrow-left transition-transform group-hover:-translate-x-1"></i>
                        Return to Hub
                    </button>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-[#FFC425]">Financial Ledger</span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-black tracking-tighter">
                                {child?.first_name}'s Financials
                            </h1>
                            <p className="text-indigo-200/60 font-bold uppercase tracking-widest text-xs">Grade {child?.grade} Scholar • {child?.student_id}</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="px-8 py-4 bg-[#FFC425] text-[#18216D] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-yellow-500/20 flex items-center gap-3 disabled:opacity-50"
                        >
                            <i className={`fas fa-sync-alt ${refreshing ? 'animate-spin' : ''}`}></i>
                            Update Records
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto w-full px-6 py-10 flex-1 space-y-10 -mt-8">
                {/* Balance Summary Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-slate-100 p-10 flex flex-col md:flex-row md:items-center justify-between gap-10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 -mr-24 -mt-24 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Liability Balance</p>
                            <h2 className={`text-6xl font-black tracking-tighter ${finances.summary.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {formatCurrency(finances.summary.balance)}
                            </h2>
                        </div>
                        {finances.summary.credit_balance > 0 && (
                            <div className="relative z-10 bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center gap-4">
                                <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
                                    <i className="fas fa-wallet text-xl"></i>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Credit Wallet</p>
                                    <p className="text-xl font-black text-emerald-600">{formatCurrency(finances.summary.credit_balance)}</p>
                                </div>
                            </div>
                        )}
                        {finances.summary.balance === 0 && finances.summary.credit_balance === 0 && (
                            <div className="relative z-10 h-16 w-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600">
                                <i className="fas fa-check text-2xl"></i>
                            </div>
                        )}
                    </div>

                    <div className="bg-[#18216D] rounded-[2.5rem] shadow-xl shadow-indigo-900/20 p-10 text-white flex flex-col justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Total Paid to Date</p>
                            <h3 className="text-4xl font-black tracking-tighter text-[#FFC425]">{formatCurrency(finances.summary.total_paid)}</h3>
                        </div>
                        <button className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all mt-6">
                            Download Full Statement
                        </button>
                    </div>
                </div>

                {/* Term-wise Breakdown */}
                <section className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden">
                    <div className="p-10 border-b border-slate-50">
                        <h2 className="text-xl font-black text-[#18216D] italic tracking-tight">Financial Obligations breakdown</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Component-level Fee Frameworks</p>
                    </div>
                    <div className="p-10 space-y-8">
                        {finances.fees.length === 0 ? (
                            <div className="py-20 text-center text-indigo-200 uppercase font-black text-sm tracking-widest italic bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">No active frameworks detected</div>
                        ) : (
                            finances.fees.map((fee, idx) => (
                                <div key={idx} className="bg-slate-50/50 rounded-[2rem] border border-slate-100 p-8 hover:bg-white hover:border-[#18216D]/20 transition-all group">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 bg-[#18216D] text-[#FFC425] rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-900/10">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-[#18216D] text-lg">{fee.academic_term_name} — {fee.academic_year_name}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">Institutional Framework Reference</p>
                                            </div>
                                        </div>
                                        <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border ${fee.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                fee.status === 'partial' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                    'bg-rose-50 text-rose-600 border-rose-100'
                                            }`}>
                                            Status: {fee.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                                        {[
                                            { label: 'Assessment Amount', val: fee.final_amount, color: 'text-[#18216D]' },
                                            { label: 'Total Receipts', val: fee.amount_paid, color: 'text-emerald-600' },
                                            { label: 'Outstanding Dues', val: fee.balance, color: 'text-rose-600' },
                                            { label: 'Discounts Applied', val: fee.discount_amount || 0, color: 'text-slate-400' }
                                        ].map((stat, i) => (
                                            <div key={i} className="space-y-1">
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                                <p className={`text-xl font-black ${stat.color} tracking-tight`}>{formatCurrency(stat.val)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-10">
                    {/* Payment History Table */}
                    <section className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-slate-100 overflow-hidden">
                        <div className="p-10 border-b border-slate-50">
                            <h2 className="text-xl font-black text-[#18216D] italic tracking-tight">Receipt History</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-10 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Date / ID</th>
                                        <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Amount</th>
                                        <th className="px-6 py-5 text-left text-[9px] font-black text-slate-400 uppercase tracking-widest">Method / Ref</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {finances.payments.map((payment, index) => (
                                        <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-10 py-6">
                                                <p className="text-xs font-black text-[#18216D]">{formatDate(payment.payment_date)}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">#{payment.receipt_number}</p>
                                            </td>
                                            <td className="px-6 py-6 font-black text-emerald-600 text-sm">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="px-6 py-6">
                                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{payment.payment_method}</p>
                                                <p className="text-[9px] font-mono text-slate-300 truncate max-w-[120px]">{payment.transaction_reference}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Invoices Sidebar */}
                    <section className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 border border-slate-100 p-10 flex flex-col">
                        <h2 className="text-xl font-black text-[#18216D] italic tracking-tight mb-8">Official Invoices</h2>
                        <div className="space-y-4 flex-1">
                            {finances.invoices.map((invoice, index) => (
                                <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#18216D]/20 transition-all flex flex-col gap-4">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Invoice Number</p>
                                            <p className="text-sm font-black text-[#18216D]">#{invoice.invoice_number}</p>
                                        </div>
                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded ${invoice.status === 'paid' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'
                                            }`}>
                                            {invoice.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <p className="text-lg font-black text-[#18216D]">{formatCurrency(invoice.amount)}</p>
                                        <button className="h-10 w-10 bg-white shadow-sm border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 hover:text-[#18216D] transition-colors">
                                            <i className="fas fa-download text-xs"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-50">
                            <div className="p-6 bg-[#FFC425]/10 rounded-2xl border border-[#FFC425]/20 flex items-center gap-4 text-[#B48A1B]">
                                <i className="fas fa-info-circle text-lg"></i>
                                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Receipts are generated instantly after payment verification.</p>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default ChildFinances;
