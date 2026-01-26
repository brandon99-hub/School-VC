import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const PaymentRecording = () => {
    const navigate = useNavigate();
    const { get, post } = useApi();
    const [students, setStudents] = useState([]);
    const [studentFees, setStudentFees] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState('');
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
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showStudentList, setShowStudentList] = useState(false);

    const fetchStudents = useCallback(async () => {
        try {
            const response = await get('/api/students/');
            setStudents(response || []);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    }, [get]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const fetchStudentFees = useCallback(async () => {
        try {
            const response = await get(`/api/finance/student-fees/?student=${selectedStudent}`);
            setStudentFees((response || []).filter(fee => fee.balance > 0));
        } catch (error) {
            console.error('Error fetching student fees:', error);
        }
    }, [selectedStudent, get]);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentFees();
        }
    }, [selectedStudent, fetchStudentFees]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await post('/api/finance/payment/record/', {
                student_fee: selectedFee,
                ...formData
            });

            alert('Payment recorded successfully!');
            resetForm();
            navigate('/admin');
        } catch (error) {
            console.error('Error recording payment:', error);
            alert('Failed to record payment: ' + (error.response?.data?.error || 'Unknown error'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedStudent('');
        setSelectedFee('');
        setFormData({
            amount: '',
            payment_method: 'mpesa',
            transaction_reference: '',
            payment_date: new Date().toISOString().split('T')[0],
            received_by: '',
            receipt_number: '',
            notes: ''
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredStudents = (students || []).filter(s =>
        `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedStudentData = students.find(s => s.id === parseInt(selectedStudent));
    const selectedFeeDetails = studentFees.find(f => f.id === parseInt(selectedFee));

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Record Payment</h1>
                    <p className="text-sm text-gray-600 mt-1">Record a new student payment</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    Back to Dashboard
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Student Selection */}
                    {/* Student Selection (Searchable) */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search Scholar (Name or ID)</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#18216D] transition-colors">
                                <i className="fas fa-search"></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Type Brandon, 00863, etc..."
                                value={searchTerm || (selectedStudentData ? `${selectedStudentData.first_name} ${selectedStudentData.last_name}` : '')}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setShowStudentList(true);
                                }}
                                onFocus={() => setShowStudentList(true)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-transparent focus:border-[#18216D] focus:bg-white rounded-2xl transition-all font-black text-sm outline-none"
                            />
                            {selectedStudent && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSelectedStudent('');
                                        setSearchTerm('');
                                        setSelectedFee('');
                                    }}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-rose-500"
                                >
                                    <i className="fas fa-times-circle"></i>
                                </button>
                            )}
                        </div>

                        {showStudentList && searchTerm && !selectedStudent && (
                            <div className="absolute z-[100] w-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-2 duration-200">
                                {filteredStudents.length > 0 ? (
                                    filteredStudents.map(student => (
                                        <button
                                            key={student.id}
                                            type="button"
                                            onClick={() => {
                                                setSelectedStudent(student.id);
                                                setSearchTerm('');
                                                setShowStudentList(false);
                                                setSelectedFee('');
                                            }}
                                            className="w-full px-6 py-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 group"
                                        >
                                            <div>
                                                <p className="font-black text-[#18216D] text-sm group-hover:translate-x-1 transition-transform">{student.first_name} {student.last_name}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{student.student_id} • Grade {student.grade}</p>
                                            </div>
                                            <i className="fas fa-chevron-right text-[10px] text-slate-200 group-hover:text-[#18216D] group-hover:translate-x-1 transition-all"></i>
                                        </button>
                                    ))
                                ) : (
                                    <div className="p-6 text-center text-slate-400 italic text-sm">No scholars found matching "{searchTerm}"</div>
                                )}
                            </div>
                        )}

                        {selectedStudent && !searchTerm && (
                            <div className="mt-3 p-4 bg-[#18216D]/5 rounded-2xl border border-[#18216D]/10 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-[#18216D] text-white rounded-xl flex items-center justify-center font-black">
                                        {selectedStudentData?.first_name?.[0]}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-[#18216D]">{selectedStudentData?.first_name} {selectedStudentData?.last_name}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{selectedStudentData?.student_id}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">Selected</span>
                            </div>
                        )}
                    </div>

                    {/* Fee Selection */}
                    {selectedStudent && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Select Fee</label>
                            {studentFees.length === 0 ? (
                                <p className="text-sm text-gray-500 py-2">No outstanding fees for this student</p>
                            ) : (
                                <select
                                    value={selectedFee}
                                    onChange={(e) => setSelectedFee(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Choose a fee...</option>
                                    {studentFees.map(fee => (
                                        <option key={fee.id} value={fee.id}>
                                            {fee.fee_structure_details?.grade_level_name} - Term {fee.fee_structure_details?.term} -
                                            Balance: {formatCurrency(fee.balance)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {/* Fee Details */}
                    {selectedFeeDetails && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">Fee Details</h3>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                    <p className="text-blue-600">Total Amount</p>
                                    <p className="font-semibold text-blue-900">{formatCurrency(selectedFeeDetails.final_amount)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-600">Paid</p>
                                    <p className="font-semibold text-green-600">{formatCurrency(selectedFeeDetails.amount_paid)}</p>
                                </div>
                                <div>
                                    <p className="text-blue-600">Balance</p>
                                    <p className="font-semibold text-red-600">{formatCurrency(selectedFeeDetails.balance)}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Payment Details */}
                    {selectedFee && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid</label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        required
                                        min="0"
                                        step="0.01"
                                        max={selectedFeeDetails?.balance}
                                        placeholder="Enter amount"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="mpesa">M-Pesa</option>
                                        <option value="bank">Bank Transfer</option>
                                        <option value="cash">Cash</option>
                                        <option value="card">Card</option>
                                        <option value="cheque">Cheque</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Reference</label>
                                    <input
                                        type="text"
                                        value={formData.transaction_reference}
                                        onChange={(e) => setFormData({ ...formData, transaction_reference: e.target.value })}
                                        required
                                        placeholder="e.g., MPESA123456"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                    <input
                                        type="date"
                                        value={formData.payment_date}
                                        onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Received By</label>
                                    <input
                                        type="text"
                                        value={formData.received_by}
                                        onChange={(e) => setFormData({ ...formData, received_by: e.target.value })}
                                        required
                                        placeholder="Staff member name"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Receipt Number</label>
                                    <input
                                        type="text"
                                        value={formData.receipt_number}
                                        onChange={(e) => setFormData({ ...formData, receipt_number: e.target.value })}
                                        required
                                        placeholder="e.g., RCP-2024-001"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows="3"
                                    placeholder="Any additional notes..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                ></textarea>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                                >
                                    {loading ? 'Recording...' : 'Record Payment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin')}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                                >
                                    Cancel
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};

export default PaymentRecording;
