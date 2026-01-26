// src/components/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import client from '../../api/Client';

const Login = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();
    const { post } = useApi();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const csrfResponse = await client.get('/api/auth/csrf/');
            const response = await post(
                '/api/auth/login/',
                {
                    email: formData.email,
                    password: formData.password,
                },
                {
                    headers: {
                        'X-CSRFToken': csrfResponse.data.csrfToken,
                        'Content-Type': 'application/json',
                    },
                    withCredentials: true,
                }
            );

            if (!response.user || !response.user.id) {
                throw new Error('User ID not found in login response');
            }

            localStorage.setItem('access_token', response.access);
            localStorage.setItem('refresh_token', response.refresh);
            login(response.user, response.access, response.refresh);

            // RBAC Redirect
            const { role } = response.user;
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else if (role === 'teacher') {
                navigate('/teacher/dashboard');
            } else if (role === 'parent') {
                navigate('/parent/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            const message = err.response?.data?.detail || 'Invalid credentials. Please try again.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row">
            {/* Branding Side */}
            <div className="lg:w-1/2 bg-[#18216D] p-12 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="z-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center">
                            <i className="fas fa-graduation-cap text-[#18216D] text-2xl"></i>
                        </div>
                        <span className="text-2xl font-black tracking-tight uppercase">Kianda<span className="text-[#FFC425]">OS</span></span>
                    </div>

                    <h1 className="text-5xl font-black mb-6 leading-tight max-w-lg">
                        Kianda School <br />
                        <span className="text-[#FFC425]">Internal Portal</span>
                    </h1>
                    <p className="text-xl text-blue-100/80 max-w-md leading-relaxed">
                        Welcome to the official Kianda School management portal. Access your academic records,
                        schedules, and learning resources in one unified platform.
                    </p>
                </div>

                <div className="z-10 mt-12 grid grid-cols-2 gap-8 border-t border-white/10 pt-12">
                    <div>
                        <p className="text-[#FFC425] font-black uppercase text-xs tracking-widest mb-2">Academic Hub</p>
                        <p className="text-sm text-blue-100/60">Real-time progress tracking and resource management.</p>
                    </div>
                    <div>
                        <p className="text-[#FFC425] font-black uppercase text-xs tracking-widest mb-2">Secure Access</p>
                        <p className="text-sm text-blue-100/60">State-of-the-art encryption for your personal data.</p>
                    </div>
                </div>

                {/* Decorative Elements */}
                <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-40 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            </div>

            {/* Login Side */}
            <div className="lg:w-1/2 flex items-center justify-center p-8 bg-slate-50">
                <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 border border-slate-100 p-10 lg:p-12">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-black text-[#18216D]">Sign In</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2">Enter your school email and password.</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                            <i className="fas fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Email Address</label>
                            <div className="relative">
                                <i className="far fa-envelope absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D] placeholder-slate-300"
                                    placeholder="yourname@kianda.ac.ke"
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Password</label>
                                <button type="button" className="text-[10px] font-black uppercase tracking-widest text-[#18216D]/60 hover:text-[#18216D]">Forgot Key?</button>
                            </div>
                            <div className="relative">
                                <i className="fas fa-lock absolute left-5 top-1/2 -translate-y-1/2 text-slate-300"></i>
                                <input
                                    type="password"
                                    name="password"
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                    className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D] placeholder-slate-300"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-5 bg-[#18216D] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-indigo-900/20 hover:bg-[#0D164F] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <>
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    <span>Sign In</span>
                                    <i className="fas fa-arrow-right"></i>
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                        <p className="text-slate-400 text-sm font-medium">
                            New user? <Link to="/signup" className="text-[#18216D] font-black hover:underline underline-offset-4">Create Institution Account</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
