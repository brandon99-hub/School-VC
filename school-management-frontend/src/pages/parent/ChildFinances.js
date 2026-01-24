import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ChildFinances = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const [child, setChild] = useState(null);
    const [finances, setFinances] = useState({
        fees: [],
        payments: [],
        balance: { balance: 0, currency: 'KES' },
        invoices: []
    });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchChildData();
        fetchFinances();
    }, [childId]);

    const fetchChildData = async () => {
        try {
            const token = localStorage.getItem('parentAccessToken');
            const parentResponse = await axios.get('/api/parents/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const childData = parentResponse.data.children.find(c => c.id === parseInt(childId));
            setChild(childData);
        } catch (error) {
            console.error('Error fetching child data:', error);
        }
    };

    const fetchFinances = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('parentAccessToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [feesRes, paymentsRes, balanceRes, invoicesRes] = await Promise.all([
                axios.get(`/api/finance/student/${childId}/fees/`, { headers }),
                axios.get(`/api/finance/student/${childId}/payments/`, { headers }),
                axios.get(`/api/finance/student/${childId}/balance/`, { headers }),
                axios.get(`/api/finance/student/${childId}/invoices/`, { headers })
            ]);

            setFinances({
                fees: feesRes.data.fees || [],
                payments: paymentsRes.data.payments || [],
                balance: balanceRes.data || { balance: 0, currency: 'KES' },
                invoices: invoicesRes.data.invoices || []
            });
        } catch (error) {
            console.error('Error fetching finances:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const token = localStorage.getItem('parentAccessToken');
            await axios.post(`/api/finance/cache/refresh/${childId}/`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchFinances();
        } catch (error) {
            console.error('Error refreshing cache:', error);
        } finally {
            setRefreshing(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-KE', {
            style: 'currency',
            currency: 'KES'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-KE', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!child) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <button
                        onClick={() => navigate('/parent/dashboard')}
                        className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Dashboard
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {child.first_name}'s Fees & Payments
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">Grade {child.grade}</p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            {refreshing ? 'Refreshing...' : 'Refresh Data'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : (
                    <>
                        {/* Outstanding Balance Card */}
                        <div className={`rounded-lg p-6 mb-6 ${finances.balance.balance > 0
                                ? 'bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200'
                                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                            }`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Outstanding Balance</p>
                                    <p className={`text-4xl font-bold mt-2 ${finances.balance.balance > 0 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                        {formatCurrency(finances.balance.balance)}
                                    </p>
                                </div>
                                {finances.balance.balance === 0 && (
                                    <div className="text-green-600">
                                        <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Fee Structure */}
                        {finances.fees.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Structure</h2>
                                <div className="space-y-3">
                                    {finances.fees.map((fee, index) => (
                                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-900">
                                                    Term {fee.term} - {fee.year}
                                                </span>
                                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${fee.status === 'paid' ? 'bg-green-100 text-green-800' :
                                                        fee.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-red-100 text-red-800'
                                                    }`}>
                                                    {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                                                </span>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <p className="text-gray-600">Total Amount</p>
                                                    <p className="font-semibold">{formatCurrency(fee.amount)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Paid</p>
                                                    <p className="font-semibold text-green-600">{formatCurrency(fee.paid)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-gray-600">Balance</p>
                                                    <p className="font-semibold text-red-600">{formatCurrency(fee.balance)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Payment History */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment History</h2>
                            {finances.payments.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">No payments recorded yet</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {finances.payments.map((payment, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm">{formatDate(payment.date)}</td>
                                                    <td className="px-4 py-3 text-sm font-semibold text-green-600">
                                                        {formatCurrency(payment.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">{payment.method}</td>
                                                    <td className="px-4 py-3 text-sm font-mono text-xs">{payment.reference}</td>
                                                    <td className="px-4 py-3 text-sm font-mono text-xs">{payment.receipt}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>

                        {/* Invoices */}
                        {finances.invoices.length > 0 && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">Invoices</h2>
                                <div className="space-y-3">
                                    {finances.invoices.map((invoice, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                                            <div>
                                                <p className="font-medium text-gray-900">Invoice #{invoice.number}</p>
                                                <p className="text-sm text-gray-600">
                                                    Issued: {formatDate(invoice.date)} | Due: {formatDate(invoice.due_date)}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                                                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
                                                    Download
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default ChildFinances;
