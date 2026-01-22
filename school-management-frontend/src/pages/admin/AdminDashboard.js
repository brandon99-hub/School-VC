import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import UserList from './UserList';
import { useApi } from '../../hooks/useApi';

const StatCard = ({ title, value, icon, color, link }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-600">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
                {link && (
                    <Link to={link} className="text-sm text-blue-600 hover:text-blue-800 mt-2 inline-block">
                        View all →
                    </Link>
                )}
            </div>
            <div className={`text-4xl ${color}`}>
                {icon}
            </div>
        </div>
    </div>
);


const Dashboard = () => {
    const { get } = useApi();
    const [stats, setStats] = useState({
        totalCourses: 0,
        activeCourses: 0,
        totalTeachers: 0,
        totalStudents: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await get('/api/admin/stats/');
                setStats(data);
            } catch (error) {
                console.error('Error fetching stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [get]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-2">Welcome back! Here's an overview of your system.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Courses"
                    value={stats.totalCourses}
                    icon={<i className="fas fa-book-open"></i>}
                    color="text-blue-500"
                    link="/admin/courses"
                />
                <StatCard
                    title="Active Courses"
                    value={stats.activeCourses}
                    icon={<i className="fas fa-circle-check"></i>}
                    color="text-green-500"
                    link="/admin/courses"
                />
                <StatCard
                    title="Teachers"
                    value={stats.totalTeachers}
                    icon={<i className="fas fa-chalkboard-user"></i>}
                    color="text-purple-500"
                    link="/admin/users"
                />
                <StatCard
                    title="Students"
                    value={stats.totalStudents}
                    icon={<i className="fas fa-user-graduate"></i>}
                    color="text-orange-500"
                    link="/admin/users"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        to="/admin/courses/new"
                        className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group shadow-sm bg-slate-50/50"
                    >
                        <span className="h-12 w-12 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                            <i className="fas fa-plus"></i>
                        </span>
                        <div>
                            <p className="font-bold text-gray-900 group-hover:text-blue-700">Add Course</p>
                            <p className="text-xs text-gray-500">Create a new course</p>
                        </div>
                    </Link>
                    <Link
                        to="/admin/users"
                        className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group shadow-sm bg-slate-50/50"
                    >
                        <span className="h-12 w-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                            <i className="fas fa-user-gear"></i>
                        </span>
                        <div>
                            <p className="font-bold text-gray-900 group-hover:text-purple-700">Manage Users</p>
                            <p className="text-xs text-gray-500">Add or edit users</p>
                        </div>
                    </Link>
                    <Link
                        to="/admin/courses"
                        className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group shadow-sm bg-slate-50/50"
                    >
                        <span className="h-12 w-12 rounded-lg bg-green-100 text-green-600 flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                            <i className="fas fa-list-check"></i>
                        </span>
                        <div>
                            <p className="font-bold text-gray-900 group-hover:text-green-700">View Courses</p>
                            <p className="text-xs text-gray-500">Browse all courses</p>
                        </div>
                    </Link>
                </div>
            </div>

            {/* Recent Activity (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="text-center py-8 text-gray-500">
                    <p>No recent activity to display</p>
                </div>
            </div>
        </div>
    );
};

const AdminDashboard = () => {
    return (
        <AdminLayout>
            <Routes>
                <Route path="/" element={<Dashboard />} />
                {/* Redirect legacy dashboard route if needed */}
                <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                <Route path="/courses" element={<CourseList />} />
                <Route path="/courses/new" element={<CourseForm />} />
                <Route path="/courses/:id/edit" element={<CourseForm />} />
                <Route path="/users" element={<UserList />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminDashboard;
