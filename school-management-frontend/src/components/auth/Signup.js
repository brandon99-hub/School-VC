// src/components/auth/Signup.js
import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const Signup = () => {
    const [formData, setFormData] = useState({
        role: 'student',
        firstName: '',
        lastName: '',
        email: '',
        studentId: '',
        teacherId: '',
        dateOfBirth: '',
        gender: '',
        grade: '',
        address: '',
        phone: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { post } = useApi();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                role: formData.role,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                password: formData.password,
            };

            if (formData.role === 'student') {
                Object.assign(payload, {
                    student_id: formData.studentId,
                    date_of_birth: formData.dateOfBirth,
                    gender: formData.gender,
                    grade: formData.grade,
                    address: formData.address,
                    phone: formData.phone,
                });
            } else {
                payload.teacher_id = formData.teacherId;
            }
            await post('/api/auth/register/', payload);
            navigate('/login');
        } catch (err) {
            const errorMsg = err.response?.data?.detail || err.response?.data?.error || 'Signup failed. Please try again.';
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white flex flex-col lg:flex-row">
            {/* Branding Side */}
            <div className="lg:w-1/3 bg-[#18216D] p-12 flex flex-col justify-between text-white relative overflow-hidden">
                <div className="z-10">
                    <Link to="/login" className="flex items-center gap-3 mb-12 group">
                        <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fas fa-arrow-left text-[#18216D] text-sm"></i>
                        </div>
                        <span className="text-xl font-black tracking-tight uppercase">Kianda<span className="text-[#FFC425]">OS</span></span>
                    </Link>

                    <h1 className="text-4xl font-black mb-6 leading-tight">
                        Create <br />
                        <span className="text-[#FFC425]">Account</span>
                    </h1>
                    <p className="text-blue-100/70 leading-relaxed">
                        Join the Kianda School portal. Fill in your details to get started.
                    </p>
                </div>

                <div className="z-10 bg-white/5 backdrop-blur-sm rounded-3xl p-6 border border-white/10">
                    <p className="text-[#FFC425] font-black uppercase text-[10px] tracking-[0.2em] mb-4">Support</p>
                    <p className="text-sm text-blue-100/60 leading-relaxed mb-4">
                        Need help? Contact our support team.
                    </p>
                    <p className="text-sm font-bold">helpdesk@kianda.ac.ke</p>
                </div>

                {/* Decorative */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
            </div>

            {/* Form Side */}
            <div className="lg:w-2/3 flex items-center justify-center p-8 bg-slate-50 overflow-y-auto">
                <div className="w-full max-w-3xl bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 border border-slate-100 p-10 lg:p-12">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-[#18216D]">Register</h2>
                        <p className="text-slate-400 font-bold text-sm mt-2 font-mono uppercase tracking-[0.1em]">Step 1: Role Selection</p>
                    </div>

                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-2xl text-sm font-bold flex items-center gap-3">
                            <i className="fas fa-circle-exclamation"></i>
                            {error}
                        </div>
                    )}

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        {/* Role Picker */}
                        <div className="grid grid-cols-2 gap-4">
                            {['student', 'teacher'].map((role) => (
                                <button
                                    key={role}
                                    type="button"
                                    onClick={() => setFormData(prev => ({ ...prev, role }))}
                                    className={`py-4 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${formData.role === role
                                        ? 'border-[#18216D] bg-indigo-50/50 text-[#18216D]'
                                        : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                                        }`}
                                >
                                    <i className={`fas ${role === 'student' ? 'fa-user-graduate' : 'fa-chalkboard-user'
                                        } text-lg`}></i>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{role}</span>
                                </button>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-slate-400 font-bold text-sm mb-6 font-mono uppercase tracking-[0.1em]">Step 2: Personal Info</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">First Name</label>
                                    <input
                                        type="text"
                                        name="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                        placeholder="First Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Last Name</label>
                                    <input
                                        type="text"
                                        name="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                        placeholder="Last Name"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        required
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                        placeholder="Email"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                        placeholder="Phone"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-slate-400 font-bold text-sm mb-6 font-mono uppercase tracking-[0.1em]">Step 3: School Info</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {formData.role === 'student' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Student ID</label>
                                            <input
                                                type="text"
                                                name="studentId"
                                                required
                                                value={formData.studentId}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                                placeholder="Student ID"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Grade</label>
                                            <select
                                                name="grade"
                                                required
                                                value={formData.grade}
                                                onChange={handleChange}
                                                className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-bold text-[#18216D] appearance-none cursor-pointer"
                                            >
                                                <option value="">Select Grade</option>
                                                {[...Array(12)].map((_, i) => (
                                                    <option key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                {formData.role === 'teacher' && (
                                    <div className="md:col-span-2">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Teacher ID</label>
                                        <input
                                            type="text"
                                            name="teacherId"
                                            required
                                            value={formData.teacherId}
                                            onChange={handleChange}
                                            className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                            placeholder="Teacher ID"
                                        />
                                    </div>
                                )}

                                <div className="md:col-span-2">
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Address</label>
                                    <textarea
                                        name="address"
                                        rows={2}
                                        required
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D] resize-none"
                                        placeholder="Physical Address"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-50">
                            <p className="text-slate-400 font-bold text-sm mb-6 font-mono uppercase tracking-[0.1em]">Step 4: Password</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                        placeholder="••••••••"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-2 ml-1">Confirm Password</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl focus:ring-4 focus:ring-indigo-500/5 transition-all text-sm font-medium text-[#18216D]"
                                        placeholder="••••••••"
                                    />
                                </div>
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
                                    Registering...
                                </>
                            ) : (
                                <>
                                    <span>Register</span>
                                    <i className="fas fa-check-circle"></i>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Signup;
