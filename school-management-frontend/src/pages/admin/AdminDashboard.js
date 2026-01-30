import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import CourseList from './CourseList';
import CourseForm from './CourseForm';
import UserList from './UserList';
import SchoolFinancialLedger from '../../components/admin/SchoolFinancialLedger';
import FinanceOverview from '../../components/admin/FinanceOverview';
import FeeManagement from './FeeManagement';
import PaymentRecording from './PaymentRecording';
import CurriculumRegistry from './CurriculumRegistry';
import { useApi } from '../../hooks/useApi';
import UserRegistrationModal from '../../components/admin/UserRegistrationModal';
import FeeFrameworkModal from '../../components/admin/FeeFrameworkModal';
import AcademicCycleModal from '../../components/admin/AcademicCycleModal';

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
        totalStrands: 0,
        totalTeachers: 0,
        totalStudents: 0,
    });
    const [loading, setLoading] = useState(true);
    const [showUserModal, setShowUserModal] = useState(false);
    const [showFeeModal, setShowFeeModal] = useState(false);
    const [showCycleModal, setShowCycleModal] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await get('/api/admin/stats/');
                setStats({
                    totalLearningAreas: data.totalLearningAreas || 0,
                    totalStrands: data.totalStrands || 0,
                    totalTeachers: data.totalTeachers || 0,
                    totalStudents: data.totalStudents || 0
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
                <div className="py-20 text-center animate-pulse text-[10px] font-black text-slate-300 uppercase tracking-widest">Querying System Status...</div>
            </div>
        );
    }

    return (
        <div className="space-y-10">
            {/* Header */}
            <header className="relative bg-[#18216D] rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-900/10 overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFC425]/10 rounded-full -mr-32 -mt-32 blur-3xl opacity-50"></div>
                <div className="relative z-10">
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic">Administrative Hub</h1>
                    <p className="text-indigo-100/50 mt-1.5 font-bold text-[11px] uppercase tracking-widest">Kianda School Excellence <span className="mx-2 text-indigo-100/20">|</span> Unified Oversight Gateway</p>
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
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-50 p-8">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-[#FFC425] rounded-full"></span> Dispatch Controls
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button
                        onClick={() => setShowUserModal(true)}
                        className="flex items-center space-x-6 p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:border-[#18216D]/20 hover:bg-white hover:shadow-xl hover:shadow-indigo-900/5 transition-all group text-left"
                    >
                        <span className="h-14 w-14 rounded-2xl bg-indigo-50 text-[#18216D] flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm border border-white">
                            <i className="fas fa-user-plus"></i>
                        </span>
                        <div>
                            <p className="font-extrabold text-[#18216D] uppercase text-xs tracking-widest">Manage Users</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Enroll Scholars, Faculty & Guardians</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowFeeModal(true)}
                        className="flex items-center space-x-6 p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:border-[#FFC425]/20 hover:bg-white hover:shadow-xl hover:shadow-amber-900/5 transition-all group text-left"
                    >
                        <span className="h-14 w-14 rounded-2xl bg-amber-50 text-[#FFC425] flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm border border-white">
                            <i className="fas fa-file-invoice-dollar"></i>
                        </span>
                        <div>
                            <p className="font-extrabold text-[#18216D] uppercase text-xs tracking-widest">Manage Frameworks</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Establish New Fee Structures</p>
                        </div>
                    </button>

                    <button
                        onClick={() => setShowCycleModal(true)}
                        className="flex items-center space-x-6 p-6 bg-slate-50/50 border border-slate-100 rounded-[2rem] hover:border-emerald-500/20 hover:bg-white hover:shadow-xl hover:shadow-emerald-900/5 transition-all group text-left"
                    >
                        <span className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl transition-transform group-hover:scale-110 shadow-sm border border-white">
                            <i className="fas fa-calendar-days"></i>
                        </span>
                        <div>
                            <p className="font-extrabold text-[#18216D] uppercase text-xs tracking-widest">Academic Cycle</p>
                            <p className="text-[10px] font-bold text-slate-400 mt-1">Manage Years & Termly Sessions</p>
                        </div>
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showUserModal && <UserRegistrationModal onClose={() => setShowUserModal(false)} />}
            {showFeeModal && <FeeFrameworkModal onClose={() => setShowFeeModal(false)} />}
            {showCycleModal && <AcademicCycleModal onClose={() => setShowCycleModal(false)} />}

            {/* Finance Overview */}
            <FinanceOverview />

            {/* School-Wide Financial Ledger (Student Accounts) */}
            <SchoolFinancialLedger />
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
