import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import UserList from './UserList';
import FinanceOverview from '../../components/admin/FinanceOverview';
import FeeManagement from './FeeManagement';
import PaymentRecording from './PaymentRecording';
import CurriculumRegistry from './CurriculumRegistry';
import { useApi } from '../../hooks/useApi';
import ParentRegistrationModal from '../../components/admin/ParentRegistrationModal';
import UserRegistrationModal from '../../components/admin/UserRegistrationModal';

const StatCard = ({ title, value, icon, color, link }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-all group">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
                <p className="text-4xl font-black text-[#18216D] mt-2 group-hover:scale-105 transition-transform origin-left">{value}</p>
                {link && (
                    <Link to={link} className="text-[10px] font-black text-[#FFC425] uppercase tracking-widest mt-4 inline-block hover:text-[#18216D] transition-colors">
                        Explore Data →
                    </Link>
                )}
            </div>
            <div className={`w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-3xl ${color} shadow-inner`}>
                {icon}
            </div>
        </div>
    </div>
);


const Dashboard = () => {
    const { get } = useApi();
    const [stats, setStats] = useState({
        totalLearningAreas: 0,
        activeLearningAreas: 0,
        totalTeachers: 0,
        totalStudents: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showParentModal, setShowParentModal] = useState(false);
    const [showUserModal, setShowUserModal] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await get('/api/admin/stats/');
                // Map legacy backend stats to new terminology
                setStats({
                    totalLearningAreas: data.totalLearningAreas,
                    totalStrands: data.totalStrands,
                    totalTeachers: data.totalTeachers,
                    totalStudents: data.totalStudents
                });
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
            <header className="relative bg-[#18216D] rounded-[2rem] p-10 text-white shadow-xl shadow-indigo-900/10 overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFC425]/10 rounded-full -mr-24 -mt-24 blur-2xl"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter uppercase">Administrative Hub</h1>
                    <p className="text-indigo-100/70 mt-2 font-medium">Kianda School Excellence: Global system oversight and curriculum governance.</p>
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="National Learning Areas"
                    value={stats.totalLearningAreas}
                    icon={<i className="fas fa-book-open"></i>}
                    color="text-[#18216D]"
                    link="/admin/curriculum"
                />
                <StatCard
                    title="Curriculum Strands"
                    value={stats.totalStrands}
                    icon={<i className="fas fa-layer-group"></i>}
                    color="text-[#FFC425]"
                    link="/admin/curriculum"
                />
                <StatCard
                    title="Faculty Experts"
                    value={stats.totalTeachers}
                    icon={<i className="fas fa-chalkboard-user"></i>}
                    color="text-indigo-400"
                    link="/admin/users"
                />
                <StatCard
                    title="Enrolled Scholars"
                    value={stats.totalStudents}
                    icon={<i className="fas fa-user-graduate"></i>}
                    color="text-slate-400"
                    link="/admin/users"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => setShowParentModal(true)}
                        className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl hover:border-amber-500 hover:bg-amber-50 transition-all group shadow-sm bg-slate-50/50 text-left"
                    >
                        <span className="h-12 w-12 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                            <i className="fas fa-user-group"></i>
                        </span>
                        <div>
                            <p className="font-bold text-gray-900 group-hover:text-amber-700">Link Parent</p>
                            <p className="text-xs text-gray-500">Register and link parents</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowUserModal(true)}
                        className="flex items-center space-x-4 p-4 border border-gray-100 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group shadow-sm bg-slate-50/50 text-left"
                    >
                        <span className="h-12 w-12 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                            <i className="fas fa-user-gear"></i>
                        </span>
                        <div>
                            <p className="font-bold text-gray-900 group-hover:text-purple-700">Manage Users</p>
                            <p className="text-xs text-gray-500">Add or edit users</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Parent Modal */}
            {showParentModal && (
                <ParentRegistrationModal onClose={() => setShowParentModal(false)} />
            )}

            {/* User Modal */}
            {showUserModal && (
                <UserRegistrationModal onClose={() => setShowUserModal(false)} />
            )}

            {/* Finance Overview */}
            <FinanceOverview />

            {/* Recent Activity (Placeholder) */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-6">
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
                <Route path="/finance" element={<FeeManagement />} />
                <Route path="/finance/record-payment" element={<PaymentRecording />} />
                <Route path="/curriculum" element={<CurriculumRegistry />} />
            </Routes>
        </AdminLayout>
    );
};

export default AdminDashboard;
