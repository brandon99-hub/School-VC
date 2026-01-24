import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const FeeManagement = () => {
    const navigate = useNavigate();
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

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [feesRes, gradesRes] = await Promise.all([
                axios.get('/api/finance/fee-structures/'),
                axios.get('/api/cbc/grade-levels/')
            ]);
            setFeeStructures(feesRes.data);
            setGradeLevels(gradesRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingFee) {
                await axios.put(`/api/finance/fee-structures/${editingFee.id}/`, formData);
            } else {
                await axios.post('/api/finance/fee-structures/', formData);
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
            await axios.delete(`/api/finance/fee-structures/${id}/`);
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
        <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Fee Management</h1>
                    <p className="text-sm text-gray-600 mt-1">Manage fee structures for different grades and terms</p>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                    Back to Dashboard
                </button>
            </div>

            {/* Create Button */}
            {!showForm && (
                <button
                    onClick={() => setShowForm(true)}
                    className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                    + Create Fee Structure
                </button>
            )}

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">
                        {editingFee ? 'Edit Fee Structure' : 'Create Fee Structure'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                                <select
                                    value={formData.grade_level}
                                    onChange={(e) => setFormData({ ...formData, grade_level: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select Grade</option>
                                    {gradeLevels.map(grade => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Term</label>
                                <select
                                    value={formData.term}
                                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="1">Term 1</option>
                                    <option value="2">Term 2</option>
                                    <option value="3">Term 3</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year</label>
                                <input
                                    type="text"
                                    value={formData.academic_year}
                                    onChange={(e) => setFormData({ ...formData, academic_year: e.target.value })}
                                    placeholder="2024/2025"
                                    required
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Amount</label>
                                <input
                                    type="number"
                                    value={formData.tuition_amount}
                                    onChange={(e) => setFormData({ ...formData, tuition_amount: e.target.value })}
                                    required
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Books Amount</label>
                                <input
                                    type="number"
                                    value={formData.books_amount}
                                    onChange={(e) => setFormData({ ...formData, books_amount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Activities Amount</label>
                                <input
                                    type="number"
                                    value={formData.activities_amount}
                                    onChange={(e) => setFormData({ ...formData, activities_amount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Transport Amount</label>
                                <input
                                    type="number"
                                    value={formData.transport_amount}
                                    onChange={(e) => setFormData({ ...formData, transport_amount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Boarding Amount</label>
                                <input
                                    type="number"
                                    value={formData.boarding_amount}
                                    onChange={(e) => setFormData({ ...formData, boarding_amount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Other Amount</label>
                                <input
                                    type="number"
                                    value={formData.other_amount}
                                    onChange={(e) => setFormData({ ...formData, other_amount: e.target.value })}
                                    min="0"
                                    step="0.01"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                checked={formData.is_active}
                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <label className="text-sm font-medium text-gray-700">Active</label>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                {editingFee ? 'Update' : 'Create'}
                            </button>
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Fee Structures List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Fee Structures</h2>
                    {loading ? (
                        <p className="text-center py-8 text-gray-500">Loading...</p>
                    ) : feeStructures.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">No fee structures created yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade/Term/Year</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuition</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Books</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activities</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {feeStructures.map(fee => (
                                        <tr key={fee.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm">
                                                <div className="font-medium">{fee.grade_level_name}</div>
                                                <div className="text-gray-500">Term {fee.term} - {fee.academic_year}</div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{formatCurrency(fee.tuition_amount)}</td>
                                            <td className="px-4 py-3 text-sm">{formatCurrency(fee.books_amount)}</td>
                                            <td className="px-4 py-3 text-sm">{formatCurrency(fee.activities_amount)}</td>
                                            <td className="px-4 py-3 text-sm font-semibold">{formatCurrency(fee.total_amount)}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${fee.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {fee.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <button
                                                    onClick={() => handleEdit(fee)}
                                                    className="text-blue-600 hover:text-blue-800 mr-3"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(fee.id)}
                                                    className="text-red-600 hover:text-red-800"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;
