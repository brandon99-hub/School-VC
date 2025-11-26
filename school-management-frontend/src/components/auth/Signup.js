import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';

const inputBase =
    'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition disabled:bg-gray-50 disabled:text-gray-400';

const labelBase = 'text-xs font-semibold uppercase tracking-wide text-gray-500';

const Section = ({ title, description, children }) => (
    <div className="space-y-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div>
            <p className="text-sm font-semibold text-gray-900">{title}</p>
            {description && <p className="text-sm text-gray-500">{description}</p>}
        </div>
        {children}
    </div>
);

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

            await post('/api/auth/register/', payload, {
                headers: {
                    'Content-Type': 'application/json',
                },
                withCredentials: true,
            });
            navigate('/login');
        } catch (err) {
            const errorMsg = err.response?.data?.detail || 'Signup failed. Please try again.';
            setError(errorMsg);
            console.error('Signup error:', err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const roleFields = useMemo(() => formData.role === 'student', [formData.role]);

    return (
        <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-2">
            <section className="hidden lg:flex flex-col justify-between bg-slate-900 p-12 text-white">
                <div>
                    <p className="text-sm uppercase tracking-wider text-white/70 font-semibold">Join the platform</p>
                    <h1 className="text-4xl font-bold mt-4 max-w-md leading-snug">Create an account tailored to your role.</h1>
                    <p className="mt-4 text-white/80 max-w-lg">
                        Students get guided learning paths, teachers unlock instruction dashboards, and admins oversee the entire
                        operation from one pane of glass.
                    </p>
                </div>
                <div className="space-y-6 text-sm text-white/80">
                    <div>
                        <p className="font-semibold text-white">Built for impact</p>
                        <p>Secure onboarding, automated permissions, and workflow automations aligned to the School OS pillars.</p>
                    </div>
                    <div>
                        <p className="font-semibold text-white">Need assistance?</p>
                        <p>Reach out at onboarding@schoolos.com and we will guide you through provisioning.</p>
                    </div>
                </div>
            </section>

            <main className="flex items-center justify-center py-12 px-6 lg:px-12">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="space-y-2 text-center">
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600">Create account</p>
                        <h2 className="text-3xl font-bold text-gray-900">Tell us who you are</h2>
                        <p className="text-sm text-gray-500">We’ll personalize your experience and unlock the right tools.</p>
                    </div>
                    {error && (
                        <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <Section
                            title="Select your role"
                            description="Role determines default permissions. You can always request changes later."
                        >
                            <div className="flex flex-wrap gap-3">
                                {['student', 'teacher'].map((role) => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setFormData((prev) => ({ ...prev, role }))}
                                        className={`flex-1 min-w-[140px] rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                            formData.role === role
                                                ? 'border-indigo-500 bg-indigo-50 text-indigo-600 shadow-sm'
                                                : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                        }`}
                                        disabled={loading}
                                    >
                                        <span className="capitalize">{role}</span>
                                    </button>
                                ))}
                            </div>
                        </Section>

                        <Section title="Personal details" description="We’ll use this to complete your profile.">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="firstName" className={labelBase}>
                                        First name
                                    </label>
                                    <input
                                        id="firstName"
                                        name="firstName"
                                        type="text"
                                        required
                                        disabled={loading}
                                        value={formData.firstName}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="Jane"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="lastName" className={labelBase}>
                                        Last name
                                    </label>
                                    <input
                                        id="lastName"
                                        name="lastName"
                                        type="text"
                                        required
                                        disabled={loading}
                                        value={formData.lastName}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="Doe"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="email" className={labelBase}>
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        disabled={loading}
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="you@yourschool.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="phone" className={labelBase}>
                                        Phone
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required={roleFields}
                                        disabled={loading}
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="+254 700 000 000"
                                    />
                                </div>
                            </div>
                        </Section>

                        <Section title="Role details" description="Provide the identifiers your school issued to you.">
                            {formData.role === 'student' ? (
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <label htmlFor="studentId" className={labelBase}>
                                            Student ID
                                        </label>
                                        <input
                                            id="studentId"
                                            name="studentId"
                                            type="text"
                                            required
                                            disabled={loading}
                                            value={formData.studentId}
                                            onChange={handleChange}
                                            className={inputBase}
                                            placeholder="STU-2025-01"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="grade" className={labelBase}>
                                            Grade
                                        </label>
                                        <input
                                            id="grade"
                                            name="grade"
                                            type="text"
                                            required
                                            disabled={loading}
                                            value={formData.grade}
                                            onChange={handleChange}
                                            className={inputBase}
                                            placeholder="Form 3"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="dateOfBirth" className={labelBase}>
                                            Date of birth
                                        </label>
                                        <input
                                            id="dateOfBirth"
                                            name="dateOfBirth"
                                            type="date"
                                            required
                                            disabled={loading}
                                            value={formData.dateOfBirth}
                                            onChange={handleChange}
                                            className={inputBase}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="gender" className={labelBase}>
                                            Gender
                                        </label>
                                        <select
                                            id="gender"
                                            name="gender"
                                            required
                                            disabled={loading}
                                            value={formData.gender}
                                            onChange={handleChange}
                                            className={inputBase}
                                        >
                                            <option value="">Select</option>
                                            <option value="M">Male</option>
                                            <option value="F">Female</option>
                                            <option value="O">Other</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label htmlFor="address" className={labelBase}>
                                            Address
                                        </label>
                                        <textarea
                                            id="address"
                                            name="address"
                                            rows={3}
                                            required
                                            disabled={loading}
                                            value={formData.address}
                                            onChange={handleChange}
                                            className={`${inputBase} resize-none`}
                                            placeholder="School residence or home address"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label htmlFor="teacherId" className={labelBase}>
                                        Teacher ID
                                    </label>
                                    <input
                                        id="teacherId"
                                        name="teacherId"
                                        type="text"
                                        required
                                        disabled={loading}
                                        value={formData.teacherId}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="TCH-2025-04"
                                    />
                                </div>
                            )}
                        </Section>

                        <Section title="Security" description="Choose a strong password to protect your account.">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <label htmlFor="password" className={labelBase}>
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        name="password"
                                        type="password"
                                        required
                                        disabled={loading}
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="At least 8 characters"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="confirmPassword" className={labelBase}>
                                        Confirm password
                                    </label>
                                    <input
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        type="password"
                                        required
                                        disabled={loading}
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className={inputBase}
                                        placeholder="Repeat password"
                                    />
                                </div>
                            </div>
                        </Section>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                loading ? 'cursor-not-allowed opacity-70' : ''
                            }`}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                </div>
            </main>
        </div>
    );
};

export default Signup;
