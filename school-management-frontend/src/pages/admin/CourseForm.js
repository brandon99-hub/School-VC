import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const CourseForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { get, post, put } = useApi();
    const { showToast } = useAppState();
    const isEditMode = Boolean(id);

    const [teachers, setTeachers] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        credits: '3', // Default value since field is hidden
        semester: '1',
        teacher: '',
        start_date: new Date().toISOString().split('T')[0], // Default to today
        end_date: new Date(new Date().setMonth(new Date().getMonth() + 4)).toISOString().split('T')[0], // Default to 4 months later
        is_active: true,
    });

    const fetchTeachers = React.useCallback(async () => {
        try {
            const data = await get('/api/admin/teachers/');
            setTeachers(data);
        } catch (error) {
            console.error('Error fetching teachers:', error);
        }
    }, [get]);

    const fetchCourse = React.useCallback(async () => {
        try {
            const data = await get(`/api/admin/courses/${id}/`);
            setFormData({
                name: data.name,
                code: data.code,
                description: data.description,
                credits: data.credits || '3',
                semester: data.semester,
                teacher: data.teacher,
                start_date: data.start_date,
                end_date: data.end_date,
                is_active: data.is_active,
            });
        } catch (error) {
            console.error('Error fetching course:', error);
            alert('Failed to load course');
            navigate('/admin/courses');
        }
    }, [get, id, navigate]);

    useEffect(() => {
        fetchTeachers();
        if (isEditMode) {
            fetchCourse();
        }
    }, [isEditMode, fetchTeachers, fetchCourse]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Course name is required';
        if (!formData.code.trim()) newErrors.code = 'Course code is required';
        if (!formData.description.trim()) newErrors.description = 'Description is required';
        if (!formData.teacher) newErrors.teacher = 'Teacher is required';
        if (!formData.start_date) newErrors.start_date = 'Start date is required';
        if (!formData.end_date) newErrors.end_date = 'End date is required';
        if (formData.start_date && formData.end_date && formData.start_date >= formData.end_date) {
            newErrors.end_date = 'End date must be after start date';
        }
        return newErrors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const newErrors = validate();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        setSubmitting(true);
        try {
            if (isEditMode) {
                await put(`/api/admin/courses/${id}/`, formData);
                showToast(`Course "${formData.name}" updated successfully!`);
            } else {
                await post('/api/admin/courses/', formData);
                showToast(`Course "${formData.name}" published successfully!`);
            }
            navigate('/admin/courses');
        } catch (error) {
            console.error('Error saving course:', error);
            if (error.response?.data) {
                setErrors(error.response.data);
            } else {
                alert('Failed to save course');
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {isEditMode ? 'Edit Course' : 'Create New Course'}
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {isEditMode ? 'Update course information and settings' : 'Add a new course to the catalog'}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/courses')}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <div>
                                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Course Details</h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Course Name *
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            className={`w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm ${errors.name ? 'ring-2 ring-red-500' : ''}`}
                                            placeholder="e.g., Data Structures & Algorithms"
                                        />
                                        {errors.name && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.name}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                                Course Code *
                                            </label>
                                            <input
                                                type="text"
                                                name="code"
                                                value={formData.code}
                                                onChange={handleChange}
                                                className={`w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm ${errors.code ? 'ring-2 ring-red-500' : ''}`}
                                                placeholder="CS101"
                                            />
                                            {errors.code && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.code}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                            Description *
                                        </label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleChange}
                                            rows="5"
                                            className={`w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm resize-none ${errors.description ? 'ring-2 ring-red-500' : ''}`}
                                            placeholder="Provide a comprehensive course overview..."
                                        />
                                        {errors.description && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.description}</p>}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Schedule & Status</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Start Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="start_date"
                                        value={formData.start_date}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm ${errors.start_date ? 'ring-2 ring-red-500' : ''}`}
                                    />
                                    {errors.start_date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.start_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        End Date *
                                    </label>
                                    <input
                                        type="date"
                                        name="end_date"
                                        value={formData.end_date}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm ${errors.end_date ? 'ring-2 ring-red-500' : ''}`}
                                    />
                                    {errors.end_date && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.end_date}</p>}
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Sidebar Settings */}
                    <div className="space-y-6">
                        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Assigned Teacher *
                                </label>
                                <select
                                    name="teacher"
                                    value={formData.teacher}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm ${errors.teacher ? 'ring-2 ring-red-500' : ''}`}
                                >
                                    <option value="">Select a teacher</option>
                                    {teachers.map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.teacher && <p className="text-red-500 text-[10px] font-bold mt-1 uppercase tracking-tight">{errors.teacher}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                    Semester *
                                </label>
                                <select
                                    name="semester"
                                    value={formData.semester}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-sm"
                                >
                                    <option value="1">First</option>
                                    <option value="2">Second</option>
                                    <option value="3">Third</option>
                                    <option value="4">Fourth</option>
                                </select>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <div className="relative">
                                        <input
                                            type="checkbox"
                                            name="is_active"
                                            checked={formData.is_active}
                                            onChange={handleChange}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none ring-0 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-700 uppercase tracking-tight group-hover:text-gray-900 transition-colors">
                                        Active Status
                                    </span>
                                </label>
                                <p className="text-[10px] text-gray-400 mt-2 ml-14">Visible to students when active</p>
                            </div>
                        </section>

                        <div className="flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all font-bold text-sm uppercase tracking-widest flex items-center justify-center space-x-2 disabled:opacity-50"
                            >
                                {submitting ? (
                                    <i className="fas fa-circle-notch fa-spin"></i>
                                ) : (
                                    <i className="fas fa-save"></i>
                                )}
                                <span>{submitting ? 'Saving...' : (isEditMode ? 'Update Course' : 'Publish Course')}</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/admin/courses')}
                                className="w-full py-3 bg-white text-gray-600 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-bold text-sm uppercase tracking-widest"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CourseForm;
