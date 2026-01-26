import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import SchoolFinancialLedger from '../../components/admin/SchoolFinancialLedger';

const FeeManagement = () => {
    const navigate = useNavigate();
    const { get, post, put, del } = useApi();
    const [feeStructures, setFeeStructures] = useState([]);
    const [gradeLevels, setGradeLevels] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingFee, setEditingFee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        grade_level: '',
        term: '1',
        academic_year: '2024/2025',
        tuition_amount: '',
        books_amount: '',
        activities_amount: '',
        transport_amount: '',
        boarding_amount: '',
        other_amount: '',
        is_active: true
    });

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const [feesData, gradesData] = await Promise.all([
                get('/api/finance/fee-structures/'),
                get('/api/cbc/grade-levels/')
            ]);
            setFeeStructures(feesData || []);
            setGradeLevels(gradesData || []);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    }, [get]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFee) {
                await put(`/api/finance/fee-structures/${editingFee.id}/`, formData);
            } else {
                await post('/api/finance/fee-structures/', formData);
            }
            fetchData();
            resetForm();
        } catch (error) {
            console.error('Error saving fee structure:', error);
            alert('Failed to save fee structure');
        }
    };

    const handleEdit = (fee) => {
        setEditingFee(fee);
        setFormData({
            grade_level: fee.grade_level,
            term: fee.term,
            academic_year: fee.academic_year,
            tuition_amount: fee.tuition_amount,
            books_amount: fee.books_amount,
            activities_amount: fee.activities_amount,
            transport_amount: fee.transport_amount,
            boarding_amount: fee.boarding_amount,
            other_amount: fee.other_amount,
            is_active: fee.is_active
        });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this fee structure?')) return;
        try {
            await del(`/api/finance/fee-structures/${id}/`);
            fetchData();
        } catch (error) {
            console.error('Error deleting fee structure:', error);
            alert('Failed to delete fee structure');
        }
    };

    const resetForm = () => {
        setFormData({
            grade_level: '',
            term: '1',
            academic_year: '2024/2025',
            tuition_amount: '',
            books_amount: '',
            activities_amount: '',
            transport_amount: '',
            boarding_amount: '',
            other_amount: '',
            is_active: true
        });
        setEditingFee(null);
        setShowForm(false);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#18216D] rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-900/20">
                        <i className="fas fa-file-invoice-dollar text-white text-2xl"></i>
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-[#18216D] uppercase tracking-tighter">Fee Structures</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-1.5 flex items-center gap-2">
                            Institutional Revenue Control <span className="w-1 h-1 bg-[#FFC425] rounded-full"></span> Admin Terminal
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={() => navigate('/admin')}
                        className="px-6 py-3 bg-white text-slate-400 hover:text-[#18216D] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-slate-100 shadow-sm"
                    >
                        Dashboard
                    </button>
                    {!showForm && (
                        <button
                            onClick={() => setShowForm(true)}
                            className="px-8 py-4 bg-[#FFC425] text-[#18216D] rounded-2xl shadow-xl shadow-yellow-500/20 font-black text-[10px] uppercase tracking-[0.2em] transform hover:scale-[1.02] active:scale-[0.98] transition-all"
                        >
                            + New Fee Framework
                        </button>
                    )}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-900/5 border border-indigo-50/50 p-10 relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-50/30 rounded-full -mr-32 -mt-32 blur-3xl"></div>

                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h2 className="text-xl font-black text-[#18216D] uppercase tracking-tight">
                            {editingFee ? 'Refine Fee Structure' : 'New Revenue Framework'}
                        </h2>
                        <button onClick={resetForm} className="text-slate-400 hover:text-rose-600 transition-colors">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Grade Level</label>
                                <select
                                    value={formData.grade_level}
                                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm transition-all"
                                >
                                    <option value="">Select Target Grade</option>
                                    {gradeLevels.map(grade => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Billing Term</label>
                                <select
                                    value={formData.term}
                                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm transition-all"
                                >
                                    <option value="1">Term 1 (Lent)</option>
                                    <option value="2">Term 2 (Trinity)</option>
                                    <option value="3">Term 3 (Advent)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Academic Year</label>
                                <input
                                    type="text"
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    placeholder="2024/2025"
                                    required
                                    className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#18216D] font-bold text-sm transition-all"
                                />
                            </div>
                        </div>

                        <div className="h-px bg-slate-100"></div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { id: 'tuition_amount', label: 'Tuition Fee' },
                                { id: 'books_amount', label: 'Learning Material' },
                                { id: 'activities_amount', label: 'Co-Curricular' },
                                { id: 'transport_amount', label: 'Transport / Bus' },
                                { id: 'boarding_amount', label: 'Accommodation' },
                                { id: 'other_amount', label: 'Miscellaneous' }
                            ].map((field) => (
                                <div key={field.id} className="space-y-2 group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block group-focus-within:text-[#18216D] transition-colors">{field.label}</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">KES</span>
                                        <input
                                            type="number"
                                            value={formData[field.id]}
                                            onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                                            required={field.id === 'tuition_amount'}
                                            min="0"
                                            step="0.01"
                                            className="w-full pl-14 pr-5 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-[#FFC425] font-black text-sm transition-all"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl w-fit">
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.is_active}
                                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#18216D]"></div>
                                <span className="ml-3 text-[10px] font-black text-gray-700 uppercase tracking-widest">Active Framework</span>
                            </label>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                type="submit"
                                className="px-12 py-4 bg-[#18216D] text-white rounded-2xl shadow-xl shadow-indigo-900/20 font-black text-[10px] uppercase tracking-[0.2em] hover:scale-[1.02] transition-all"
                            >
                                {editingFee ? 'Save Framework' : 'Publish Framework'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-12 py-4 bg-slate-100 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-200 transition-all"
                            >
                                Discard
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fee Structures List */}
            <div className="bg-white rounded-[3rem] shadow-xl shadow-indigo-900/5 border border-indigo-50/50 overflow-hidden">
                <div className="p-10">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-black text-[#18216D] uppercase tracking-tight">Active Frameworks</h2>
                        <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <span className="flex items-center gap-2"><i className="fas fa-circle text-emerald-500 text-[6px]"></i> Operational</span>
                            <span className="flex items-center gap-2"><i className="fas fa-circle text-slate-200 text-[6px]"></i> Draft</span>
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Querying Ledger...</div>
                    ) : feeStructures.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">No fee framework defined</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto -mx-10 px-10">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Framework Context</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tuition</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Extras</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Liability</th>
                                        <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {feeStructures.map(fee => (
                                        <tr key={fee.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-6 py-6">
                                                <div className="font-black text-[#18216D] text-sm">{fee.grade_level_name}</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase mt-1">Term {fee.term} — {fee.academic_year}</div>
                                            </td>
                                            <td className="px-6 py-6 text-sm font-bold text-gray-700">{formatCurrency(fee.tuition_amount)}</td>
                                            <td className="px-6 py-6 font-medium text-slate-400">
                                                <div className="flex flex-wrap gap-2">
                                                    {fee.books_amount > 0 && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Books</span>}
                                                    {fee.activities_amount > 0 && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Activity</span>}
                                                    {fee.transport_amount > 0 && <span className="text-[8px] bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">Bus</span>}
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="text-sm font-black text-[#18216D]">{formatCurrency(fee.total_amount)}</div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${fee.is_active ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-400 border border-slate-100'}`}>
                                                    {fee.is_active ? 'Operational' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleEdit(fee)} className="w-9 h-9 flex items-center justify-center bg-white border border-indigo-50 text-[#18216D] rounded-xl hover:bg-[#18216D] hover:text-white transition-all shadow-sm">
                                                        <i className="fas fa-edit text-xs"></i>
                                                    </button>
                                                    <button onClick={() => handleDelete(fee.id)} className="w-9 h-9 flex items-center justify-center bg-white border border-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                        <i className="fas fa-trash text-xs"></i>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
                {/* Master Financial Ledger */}
                <div className="pt-10 border-t border-slate-100">
                    <SchoolFinancialLedger />
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;
