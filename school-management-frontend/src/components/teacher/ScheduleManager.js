import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';

const ScheduleManager = ({ courseId, onClose }) => {
    const { get, post, put, del } = useApi();
    const { showToast } = useAppState();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showNewSchedule, setShowNewSchedule] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState(null);
    const [formData, setFormData] = useState({
        day: '',
        start_time: '',
        end_time: '',
        meeting_link: '',
        recording_link: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    useEffect(() => {
        fetchSchedules();
    }, [courseId]);

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const data = await get(`/courses/schedules/?course=${courseId}`);
            setSchedules(data || []);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            showToast('Failed to load schedules', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.day || !formData.start_time || !formData.end_time) {
            showToast('Please fill in required fields', 'error');
            return;
        }

        try {
            setSubmitting(true);
            if (editingSchedule) {
                await put(`/courses/schedules/${editingSchedule.id}/`, {
                    ...formData,
                    course: courseId
                });
                showToast('Schedule updated successfully!');
            } else {
                await post('/courses/schedules/', {
                    ...formData,
                    course: courseId
                });
                showToast('Schedule created successfully!');
            }
            resetForm();
            fetchSchedules();
        } catch (error) {
            console.error('Error saving schedule:', error);
            showToast('Failed to save schedule', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (schedule) => {
        setEditingSchedule(schedule);
        setFormData({
            day: schedule.day,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            meeting_link: schedule.meeting_link || '',
            recording_link: schedule.recording_link || ''
        });
        setShowNewSchedule(true);
    };

    const handleDelete = async (scheduleId) => {
        if (!window.confirm('Are you sure you want to delete this schedule?')) {
            return;
        }

        try {
            await del(`/courses/schedules/${scheduleId}/`);
            showToast('Schedule deleted successfully');
            fetchSchedules();
        } catch (error) {
            console.error('Error deleting schedule:', error);
            showToast('Failed to delete schedule', 'error');
        }
    };

    const resetForm = () => {
        setFormData({
            day: '',
            start_time: '',
            end_time: '',
            meeting_link: '',
            recording_link: ''
        });
        setEditingSchedule(null);
        setShowNewSchedule(false);
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-8">
                    <i className="fas fa-spinner fa-spin text-3xl text-blue-600"></i>
                    <p className="mt-4 text-gray-600">Loading schedules...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold">Class Schedule</h2>
                        <p className="text-sm text-gray-600">{schedules.length} session{schedules.length !== 1 ? 's' : ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowNewSchedule(!showNewSchedule)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                        >
                            <i className="fas fa-plus mr-2"></i>
                            Add Schedule
                        </button>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times text-xl"></i>
                        </button>
                    </div>
                </div>

                {/* Schedule Form */}
                {showNewSchedule && (
                    <div className="p-6 border-b bg-gray-50">
                        <h3 className="text-lg font-semibold mb-4">
                            {editingSchedule ? 'Edit Schedule' : 'New Schedule'}
                        </h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Day <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={formData.day}
                                        onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        required
                                    >
                                        <option value="">Select day...</option>
                                        {daysOfWeek.map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Start Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        End Time <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="time"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Meeting Link (Optional)
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.meeting_link}
                                        onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                        placeholder="https://zoom.us/..."
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Recording Link (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={formData.recording_link}
                                    onChange={(e) => setFormData({ ...formData, recording_link: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="https://..."
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Schedules List */}
                <div className="p-6">
                    {schedules.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-calendar-alt text-6xl text-gray-300 mb-4"></i>
                            <p className="text-gray-600 text-lg">No schedules yet</p>
                            <p className="text-gray-500 text-sm mt-2">Add class schedules to organize your sessions</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {schedules.map(schedule => (
                                <div key={schedule.id} className="border border-gray-200 rounded-lg p-4 hover:border-indigo-300 transition">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{schedule.day}</h3>
                                            <p className="text-sm text-gray-600 mb-3">
                                                <i className="fas fa-clock mr-2"></i>
                                                {schedule.start_time} – {schedule.end_time}
                                            </p>
                                            <div className="flex gap-3">
                                                {schedule.meeting_link && (
                                                    <a
                                                        href={schedule.meeting_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100"
                                                    >
                                                        <i className="fas fa-video"></i>
                                                        Join Meeting
                                                    </a>
                                                )}
                                                {schedule.recording_link && (
                                                    <a
                                                        href={schedule.recording_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
                                                    >
                                                        <i className="fas fa-play-circle"></i>
                                                        Recording
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEdit(schedule)}
                                                className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                                                title="Edit"
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(schedule.id)}
                                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                title="Delete"
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScheduleManager;
