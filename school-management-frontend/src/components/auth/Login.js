// src/components/auth/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApi } from '../../hooks/useApi';
import client from '../../api/Client';

const highlights = [
    'Secure role-based access for students, teachers, and admins.',
    'Real-time attendance, grading, and scheduling tools.',
    'Modern LMS experience with lessons, quizzes, and discussions.',
];

const inputBase =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition disabled:bg-gray-50 disabled:text-gray-400';

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
            navigate('/dashboard');
        } catch (err) {
            const message = err.response?.data?.detail || 'Invalid credentials. Please try again.';
            setError(message);
            console.error('Login error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = (e) => {
        e.preventDefault();
        // Placeholder for future password reset flow.
    };

    return (
        <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-2">
            <section className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 to-blue-500 p-12 text-white">
                <div>
                    <p className="text-sm uppercase tracking-wider text-white/70 font-semibold">School OS</p>
                    <h1 className="text-4xl font-bold mt-4 max-w-md leading-snug">
                        A connected learning platform for modern schools.
                    </h1>
                    <p className="mt-4 text-white/80 max-w-lg">
                        One login unlocks LMS insights, SIS records, communication tools, and AI copilots tailored for
                        every role.
                    </p>
                </div>
                <ul className="space-y-4 text-sm text-white/80">
                    {highlights.map((item) => (
                        <li key={item} className="flex items-start gap-3">
                            <span className="mt-1 h-6 w-6 flex items-center justify-center rounded-full bg-white/20 text-white">
                                <i className="fas fa-check" />
                            </span>
                            {item}
                        </li>
                    ))}
                </ul>
                <div className="text-sm text-white/70">
                    Need help? <span className="font-semibold text-white">support@schoolos.com</span>
                </div>
            </section>

            <main className="flex items-center justify-center py-12 px-6 lg:px-12">
                <div className="w-full max-w-md space-y-8">
                    <div className="space-y-2 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Welcome back</p>
                        <h2 className="text-3xl font-bold text-gray-900">Sign in to continue</h2>
                        <p className="text-sm text-gray-500">Enter your credentials to pick up where you left off.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6">
                        {error && (
                            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {error}
                            </div>
                        )}
                        <form className="space-y-5" onSubmit={handleSubmit}>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-semibold text-gray-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    disabled={loading}
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={inputBase}
                                    placeholder="you@yourschool.com"
                                />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="password" className="text-sm font-semibold text-gray-700">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    disabled={loading}
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={inputBase}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex items-center gap-2 text-gray-600">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                        disabled={loading}
                                    />
                                    Remember me
                                </label>
                                <button
                                    type="button"
                                    onClick={handleForgotPassword}
                                    disabled={loading}
                                    className="font-semibold text-indigo-600 hover:text-indigo-500"
                                >
                                    Forgot password?
                                </button>
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                    loading ? 'cursor-not-allowed opacity-70' : ''
                                }`}
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>
                        </form>
                        <div className="text-center text-sm text-gray-500">
                            New to School OS?{' '}
                            <Link to="/signup" className="font-semibold text-indigo-600 hover:text-indigo-500">
                                Create an account
                            </Link>
                        </div>
                    </div>
                    <p className="text-xs text-center text-gray-400">
                        By continuing you agree to the Acceptable Use Policy and Privacy Statement.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Login;
