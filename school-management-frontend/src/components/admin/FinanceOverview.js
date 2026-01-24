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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Financial Overview</h2>
                <Link
                    to="/admin/finance"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    View Details →
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-xs text-blue-600 font-medium mb-1">Total Fees</p>
                    <p className="text-lg font-bold text-blue-900">{formatCurrency(overview.total_fees)}</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-xs text-green-600 font-medium mb-1">Collected</p>
                    <p className="text-lg font-bold text-green-900">{formatCurrency(overview.total_paid)}</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                    <p className="text-xs text-orange-600 font-medium mb-1">Outstanding</p>
                    <p className="text-lg font-bold text-orange-900">{formatCurrency(overview.total_balance)}</p>
                </div>
                <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-xs text-red-600 font-medium mb-1">Defaulters</p>
                    <p className="text-lg font-bold text-red-900">{overview.defaulters_count}</p>
                </div>
            </div>

            {/* Recent Payments */}
            <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Recent Payments</h3>
                {overview.recent_payments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">No recent payments</p>
                ) : (
                    <div className="space-y-2">
                        {overview.recent_payments.slice(0, 5).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">{payment.student_name}</p>
                                    <p className="text-xs text-gray-500">{formatDate(payment.payment_date)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-semibold text-green-600">{formatCurrency(payment.amount)}</p>
                                    <p className="text-xs text-gray-500">{payment.payment_method}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-6 border-t border-gray-200 flex gap-3">
                <Link
                    to="/admin/finance/record-payment"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                >
                    Record Payment
                </Link>
                <Link
                    to="/admin/finance/defaulters"
                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-center text-sm font-medium"
                >
                    View Defaulters
                </Link>
            </div>
        </div>
    );
};

export default FinanceOverview;
