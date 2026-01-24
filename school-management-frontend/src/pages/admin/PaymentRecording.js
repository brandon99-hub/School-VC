import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PaymentRecording = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentFees();
        }
    }, [selectedStudent]);

    const fetchStudents = async () => {
        try {
            const response = await axios.get('/api/students/');
            setStudents(response.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const fetchStudentFees = async () => {
        try {
            const response = await axios.get(`/api/finance/student-fees/?student=${selectedStudent}`);
            setStudentFees(response.data.filter(fee => fee.balance > 0));
        } catch (error) {
            console.error('Error fetching student fees:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            await axios.post('/api/finance/payment/record/', {
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
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                        <select
                            value={selectedStudent}
                            onChange={(e) => {
                                setSelectedStudent(e.target.value);
                                setSelectedFee('');
                            }}
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Choose a student...</option>
                            {students.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.first_name} {student.last_name} - {student.student_id}
                                </option>
                            ))}
                        </select>
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
