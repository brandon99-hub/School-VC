import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ParentDashboard = () => {
    const navigate = useNavigate();
    const [parent, setParent] = useState(null);
    const [selectedChild, setSelectedChild] = useState(null);
    const [childProgress, setChildProgress] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchParentData();
    }, []);

    useEffect(() => {
        if (selectedChild) {
            fetchChildProgress();
        }
    }, [selectedChild]);

    const fetchParentData = async () => {
        try {
            const token = localStorage.getItem('parentAccessToken');
            const response = await axios.get('/api/parents/me/', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setParent(response.data);
            if (response.data.children && response.data.children.length > 0) {
                setSelectedChild(response.data.children[0]);
            }
        } catch (error) {
            console.error('Error fetching parent data:', error);
            if (error.response?.status === 401) {
                navigate('/parent/login');
            }
        } finally {
            setLoading(false);
        }
    };

    const fetchChildProgress = async () => {
        try {
            const token = localStorage.getItem('parentAccessToken');
            const response = await axios.get(`/api/cbc/competency-assessments/summary/${selectedChild.id}/`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChildProgress(response.data);
        } catch (error) {
            console.error('Error fetching child progress:', error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('parentAccessToken');
        localStorage.removeItem('parentRefreshToken');
        localStorage.removeItem('parentData');
        navigate('/parent/login');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!parent || !parent.children || parent.children.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 p-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">No Children Linked</h2>
                        <p className="text-gray-600 mb-6">
                            You haven't linked any children to your account yet.
                        </p>
                        <button
                            onClick={() => navigate('/parent/add-child')}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Add Child
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Parent Dashboard</h1>
                            <p className="text-sm text-gray-600 mt-1">Welcome, {parent.first_name}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Child Selector */}
                <div className="mb-8">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Child
                    </label>
                    <select
                        value={selectedChild?.id || ''}
                        onChange={(e) => {
                            const child = parent.children.find(c => c.id === parseInt(e.target.value));
                            setSelectedChild(child);
                        }}
                        className="w-full md:w-auto px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                        {parent.children.map(child => (
                            <option key={child.id} value={child.id}>
                                {child.first_name} {child.last_name} - Grade {child.grade}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Child Overview Cards */}
                {selectedChild && (
                    <>
                        {/* Student Info Card */}
                        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Student Information</h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-medium">{selectedChild.first_name} {selectedChild.last_name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Student ID</p>
                                    <p className="font-medium">{selectedChild.student_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Grade</p>
                                    <p className="font-medium">{selectedChild.grade}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-medium text-sm">{selectedChild.email}</p>
                                </div>
                            </div>
                        </div>

                        {/* Progress Summary */}
                        {childProgress && (
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 mb-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-4">CBC Progress Summary</h2>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold text-gray-900">{childProgress.total_assessments}</div>
                                        <div className="text-sm text-gray-600 mt-1">Total Assessments</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold text-green-600">{childProgress.by_level?.EE || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Exceeding</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold text-blue-600">{childProgress.by_level?.ME || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Meeting</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold text-yellow-600">{childProgress.by_level?.AE || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Approaching</div>
                                    </div>
                                    <div className="bg-white rounded-lg p-4 text-center">
                                        <div className="text-3xl font-bold text-red-600">{childProgress.by_level?.BE || 0}</div>
                                        <div className="text-sm text-gray-600 mt-1">Below</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Quick Actions */}
                        <div className="grid md:grid-cols-3 gap-6">
                            <button
                                onClick={() => navigate(`/parent/child/${selectedChild.id}/progress`)}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                            >
                                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">View Detailed Progress</h3>
                                <p className="text-sm text-gray-600">See competency development across all learning areas</p>
                            </button>

                            <button
                                onClick={() => navigate(`/parent/child/${selectedChild.id}/finances`)}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                            >
                                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Fees & Payments</h3>
                                <p className="text-sm text-gray-600">View fees, payment history, and balances</p>
                            </button>

                            <button
                                onClick={() => navigate(`/parent/messages`)}
                                className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow text-left"
                            >
                                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">Messages</h3>
                                <p className="text-sm text-gray-600">Communicate with teachers</p>
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ParentDashboard;
