import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    BanknotesIcon,
    DocumentCheckIcon,
    UserGroupIcon,
    ArrowPathIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';

const PaymentRecording = () => {
    const navigate = useNavigate();
    const { get, post } = useApi();
    const { showToast } = useAppState();

    const [mode, setMode] = useState('payment'); // 'billing', 'payment'
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Data for dropdowns
    const [gradeLevels, setGradeLevels] = useState([]);
    const [academicTerms, setAcademicTerms] = useState([]);
    const [feeStructures, setFeeStructures] = useState([]);
    const [students, setStudents] = useState([]);

    // Billing Mode State
    const [billingGrade, setBillingGrade] = useState('');
    const [billingTerm, setBillingTerm] = useState('');

    // Payment Mode State
    const [searchTerm, setSearchTerm] = useState('');
    const [showStudentList, setShowStudentList] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [studentFees, setStudentFees] = useState([]);
    const [selectedFee, setSelectedFee] = useState('');

    const [formData, setFormData] = useState({
        amount: '',
        payment_method: 'mpesa',
        transaction_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        received_by: '',
        receipt_number: '',
        notes: ''
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [gradesData, termsData, feesData, studentsData] = await Promise.all([
                get('/api/cbc/grade-levels/'),
                get('/api/academic-terms/'),
                get('/api/finance/fee-structures/'),
                get('/api/students/')
            ]);
            setGradeLevels(gradesData || []);
            setAcademicTerms(termsData || []);
            setFeeStructures(feesData || []);
            setStudents(studentsData || []);
        } catch (error) {
            console.error('Error fetching terminal data:', error);
            showToast('Failed to load system data', 'error');
        } finally {
            setLoading(false);
        }
    }, [get, showToast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const fetchStudentFees = useCallback(async (studentId) => {
        try {
            const response = await get(`/api/finance/student-fees/?student=${studentId}`);
            setStudentFees((response || []).filter(fee => fee.balance > 0));
        } catch (error) {
            console.error('Error fetching student fees:', error);
        }
    }, [get]);

    // Detect if a billing framework exists for the current student's grade
    const suggestedFramework = useMemo(() => {
        if (!selectedStudent || studentFees.length > 0) return null;

        // Find the active term (usually the most recent one)
        const currentTerm = academicTerms.find(t => t.is_current) || academicTerms[0];
        if (!currentTerm) return null;

        return feeStructures.find(f =>
            f.grade_level === selectedStudent.grade_level &&
            f.academic_term === currentTerm.id &&
            f.is_active
        );
    }, [selectedStudent, studentFees, feeStructures, academicTerms]);

    const handleBulkBill = async () => {
        if (!billingGrade || !billingTerm) {
            showToast('Please select Grade and Term', 'warning');
            return;
        }

        setSubmitting(true);
        try {
            const response = await post('/api/finance/student-fees/bulk_bill/', {
                grade_ids: [billingGrade],
                term_id: billingTerm
            });
            showToast(`Billing Complete: ${response.created} records created.`, 'success');
            setMode('payment');
            fetchData();
        } catch (error) {
            showToast('Failed to process bulk billing', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSingleBill = async () => {
        const currentTerm = academicTerms.find(t => t.is_current) || academicTerms[0];
        setSubmitting(true);
        try {
            await post('/api/finance/student-fees/bulk_bill/', {
                student_ids: [selectedStudent.id],
                term_id: currentTerm.id
            });
            showToast('Student successfully billed', 'success');
            fetchStudentFees(selectedStudent.id);
        } catch (error) {
            showToast('Failed to bill student', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handlePaymentSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFee) return;

        setSubmitting(true);
        try {
            await post('/api/finance/payment/record/', {
                student_fee: selectedFee,
                ...formData
            });
            showToast('Payment recorded successfully!', 'success');
            navigate('/admin');
        } catch (error) {
            showToast('Failed to record payment', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredStudents = (students || []).filter(s =>
        `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency', currency: 'KES', minimumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl mb-4"></div>
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Waking Finance Terminal...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-10">
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#18216D] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-900/20">
                        <BanknotesIcon className="h-8 w-8 text-[#FFC425]" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#18216D] uppercase tracking-tighter italic">Finance Terminal</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                            Unitary Revenue Control <span className="w-1 h-1 bg-[#FFC425] rounded-full"></span> Dispatch Center
                        </p>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                    <button
                        onClick={() => setMode('payment')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'payment' ? 'bg-white text-[#18216D] shadow-sm' : 'text-slate-400 hover:text-[#18216D]'}`}
                    >
                        Receive Payment
                    </button>
                    <button
                        onClick={() => setMode('billing')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'billing' ? 'bg-white text-[#18216D] shadow-sm' : 'text-slate-400 hover:text-[#18216D]'}`}
                    >
                        Post Grade Bills
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left Panel: Primary Operation */}
                <div className="lg:col-span-8 space-y-8">
                    {mode === 'billing' ? (
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-900/5 border border-indigo-50/50 p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                            <h2 className="text-xl font-black text-[#18216D] uppercase tracking-tight mb-8">Bulk Billing Dispatch</h2>

                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Grade Level</label>
                                        <select
                                            value={billingGrade}
                                            onChange={(e) => setBillingGrade(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm"
                                        >
                                            <option value="">Select Grade</option>
                                            {gradeLevels.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Academic Session (Term)</label>
                                        <select
                                            value={billingTerm}
                                            onChange={(e) => setBillingTerm(e.target.value)}
                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm"
                                        >
                                            <option value="">Select Term</option>
                                            {academicTerms.map(t => <option key={t.id} value={t.id}>{t.name} — {t.year_name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {billingGrade && billingTerm && (
                                    <div className="bg-[#18216D]/5 rounded-[2rem] p-8 border border-[#18216D]/10 animate-in fade-in slide-in-from-top-4">
                                        {feeStructures.find(f => f.grade_level === parseInt(billingGrade) && f.academic_term === parseInt(billingTerm)) ? (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detected Framework Amount</p>
                                                    <p className="text-3xl font-black text-[#18216D] italic">
                                                        {formatCurrency(feeStructures.find(f => f.grade_level === parseInt(billingGrade) && f.academic_term === parseInt(billingTerm)).total_amount)}
                                                    </p>
                                                </div>
                                                <button
                                                    onClick={handleBulkBill}
                                                    disabled={submitting}
                                                    className="px-10 py-5 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-[1.03] transition-all disabled:opacity-50"
                                                >
                                                    {submitting ? 'Processing Dispatch...' : 'Commit Billing'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="text-center py-4">
                                                <p className="text-rose-500 font-extrabold text-[10px] uppercase tracking-widest">Warning: No framework defined for this selection</p>
                                                <button
                                                    onClick={() => navigate('/admin/finance')}
                                                    className="text-[10px] font-black text-[#18216D] underline mt-2 uppercase tracking-widest"
                                                >
                                                    Create Framework Now
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-900/5 border border-indigo-50/50 p-10">
                            <h2 className="text-xl font-black text-[#18216D] uppercase tracking-tight mb-8">Revenue Reception</h2>

                            <form onSubmit={handlePaymentSubmit} className="space-y-8">
                                {/* Scholar Search */}
                                <div className="relative">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-2 block">Search Scholar (Name or ID)</label>
                                    <div className="group relative">
                                        <MagnifyingGlassIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-[#18216D] transition-colors" />
                                        <input
                                            type="text"
                                            placeholder="Type Brandon, STU-..."
                                            value={searchTerm || (selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : '')}
                                            onChange={(e) => {
                                                setSearchTerm(e.target.value);
                                                setShowStudentList(true);
                                            }}
                                            onFocus={() => setShowStudentList(true)}
                                            className="w-full pl-14 pr-12 py-5 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm shadow-inner"
                                        />
                                        {selectedStudent && (
                                            <button
                                                type="button"
                                                onClick={() => { setSelectedStudent(null); setSearchTerm(''); }}
                                                className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500 transition-colors"
                                            >
                                                <XMarkIcon className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>

                                    {showStudentList && searchTerm && !selectedStudent && (
                                        <div className="absolute z-50 w-full mt-3 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar animate-in slide-in-from-top-2">
                                            {filteredStudents.map(s => (
                                                <button
                                                    key={s.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedStudent(s);
                                                        setSearchTerm('');
                                                        setShowStudentList(false);
                                                        fetchStudentFees(s.id);
                                                    }}
                                                    className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group"
                                                >
                                                    <div>
                                                        <p className="font-black text-[#18216D] text-sm group-hover:translate-x-1 transition-transform">{s.first_name} {s.last_name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.student_id} • Grade {s.grade}</p>
                                                    </div>
                                                    <CheckCircleIcon className="w-5 h-5 text-slate-200 group-hover:text-emerald-500" />
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {selectedStudent && (
                                    <div className="animate-in fade-in slide-in-from-top-4 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Active Outstanding Bill</label>
                                                {studentFees.length > 0 ? (
                                                    <select
                                                        value={selectedFee}
                                                        onChange={(e) => setSelectedFee(e.target.value)}
                                                        required
                                                        className="w-full px-5 py-4 bg-[#18216D]/5 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-extrabold text-[#18216D]"
                                                    >
                                                        <option value="">Choose a fee...</option>
                                                        {studentFees.map(f => (
                                                            <option key={f.id} value={f.id}>
                                                                {f.fee_structure_details?.academic_term_name} — {formatCurrency(f.balance)}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : suggestedFramework ? (
                                                    <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 flex items-center justify-between">
                                                        <div>
                                                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest">No active bill found</p>
                                                            <p className="text-xs font-bold text-amber-900 mt-1">Found {suggestedFramework.academic_term_name} Framework</p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={handleSingleBill}
                                                            disabled={submitting}
                                                            className="text-[10px] font-black text-amber-800 bg-amber-200 px-3 py-1.5 rounded-lg uppercase tracking-widest hover:bg-amber-300"
                                                        >
                                                            Bill Now
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <p className="text-xs font-bold text-slate-400 p-4 bg-slate-50 rounded-2xl text-center italic">Account is fully reconciled</p>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Amount Allocated</label>
                                                <div className="relative">
                                                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KES</span>
                                                    <input
                                                        type="number"
                                                        value={formData.amount}
                                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                        required
                                                        placeholder="Enter payment amount"
                                                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#FFC425] font-black text-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {selectedFee && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Provider</label>
                                                        <select
                                                            value={formData.payment_method}
                                                            onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm"
                                                        >
                                                            <option value="mpesa">M-Pesa</option>
                                                            <option value="bank">Bank Transfer</option>
                                                            <option value="cash">Internal Cash</option>
                                                            <option value="card">Card / POS</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Reference</label>
                                                        <input
                                                            type="text"
                                                            value={formData.transaction_reference}
                                                            onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                                                            required
                                                            placeholder="M-Pesa Code / Slip No."
                                                            className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-4 pt-4">
                                                    <button
                                                        type="submit"
                                                        disabled={submitting}
                                                        className="px-12 py-5 bg-[#18216D] text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-900/20 hover:scale-[1.05] transition-all disabled:opacity-50"
                                                    >
                                                        {submitting ? 'Authenticating Ledger...' : 'Commit Transaction'}
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                )}
                            </form>
                        </div>
                    )}
                </div>

                {/* Right Panel: Contextual Insights */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#18216D] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-900/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFC425]/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform"></div>
                        <h3 className="text-lg font-black uppercase tracking-widest mb-6 italic">Ledger Status</h3>

                        <div className="space-y-6 relative z-10">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <DocumentCheckIcon className="h-6 w-6 text-[#FFC425]" />
                                <div>
                                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest leading-none">External Sync</p>
                                    <p className="text-xs font-bold mt-1">M-Pesa Gateway Active</p>
                                    <div className="mt-2 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                                        <span className="text-[8px] font-black uppercase text-emerald-500">Watching statements...</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                <UserGroupIcon className="h-6 w-6 text-indigo-300" />
                                <div>
                                    <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest leading-none">Scholar Visibility</p>
                                    <p className="text-xs font-bold mt-1">Framework Transparency</p>
                                    <p className="text-[8px] font-medium text-indigo-200/50 mt-1 leading-relaxed">Parents can now view Grade Frameworks even before billing is finalized.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100 flex flex-col justify-between group">
                        <div>
                            <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                                <ArrowPathIcon className="h-6 w-6 text-slate-400" />
                            </div>
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 leading-none italic">Need Guidance?</h4>
                            <p className="text-xs font-bold text-[#18216D] leading-relaxed">
                                Use **Post Grade Bills** at the start of the term to generate ledger entries for entire classes instantly.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentRecording;
