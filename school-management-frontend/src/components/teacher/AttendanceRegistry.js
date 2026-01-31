import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    CalendarIcon,
    UserGroupIcon
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const AttendanceRegistry = ({ courseId, students = [] }) => {
    const { post, get } = useApi();
    const { showToast } = useAppState();
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceData, setAttendanceData] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchAttendance();
    }, [date, courseId]);

    const fetchAttendance = async () => {
        try {
            setLoading(true);
            const response = await get(`/teachers/api/students/attendance/?date=${date}&learning_area_id=${courseId}`);
            const mapped = {};
            response.forEach(rec => {
                mapped[rec.student] = rec.status;
            });
            setAttendanceData(mapped);
        } catch (error) {
            console.error('Error fetching attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const markAttendance = async (studentId, status) => {
        try {
            setSaving(studentId);
            const formData = new FormData();
            formData.append('student_id', studentId);
            formData.append('date', date);
            formData.append('status', status);
            formData.append('learning_area_id', courseId);

            await post('/teachers/api/students/attendance/', formData);
            setAttendanceData(prev => ({ ...prev, [studentId]: status }));
            showToast('Attendance recorded', 'success');
        } catch (error) {
            console.error('Error marking attendance:', error);
            showToast('Failed to record attendance', 'error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-[#18216D] tracking-tight">Daily Attendance</h2>
                    <p className="text-slate-400 text-sm font-medium">Record and track student presence in this learning area</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <CalendarIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl font-black text-xs text-[#18216D] focus:ring-2 focus:ring-[#18216D]/20 transition-all uppercase tracking-widest"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-indigo-900/5 overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-left">
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Name</th>
                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Admission No</th>
                            <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Status Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {students.map((student) => (
                            <tr key={student.id} className="hover:bg-indigo-50/20 transition-all group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-[#18216D]/5 flex items-center justify-center text-[#18216D] font-black border border-[#18216D]/10 text-xs">
                                            {student.name?.split(' ').map(n => n[0]).join('')}
                                        </div>
                                        <div>
                                            <p className="font-black text-[#18216D] tracking-tight">{student.name}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrolled Student</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <span className="text-sm font-black text-slate-500">{student.student_id}</span>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center justify-center gap-2">
                                        {[
                                            { id: 'Present', icon: CheckCircleIcon, color: 'emerald', label: 'Present' },
                                            { id: 'Absent', icon: XCircleIcon, color: 'rose', label: 'Absent' },
                                            { id: 'Late', icon: ClockIcon, color: 'amber', label: 'Late' }
                                        ].map((status) => {
                                            const isActive = attendanceData[student.id] === status.id;
                                            return (
                                                <button
                                                    key={status.id}
                                                    disabled={saving === student.id}
                                                    onClick={() => markAttendance(student.id, status.id)}
                                                    className={`
                                                        px-4 py-2 rounded-xl flex items-center gap-2 transition-all border-2
                                                        ${isActive
                                                            ? `bg-${status.color}-50 border-${status.color}-200 text-${status.color}-600 shadow-sm`
                                                            : 'bg-white border-transparent text-slate-300 hover:bg-slate-50 hover:text-slate-500'}
                                                        ${saving === student.id ? 'opacity-50 cursor-not-allowed' : ''}
                                                    `}
                                                    title={status.label}
                                                >
                                                    <status.icon className={`w-5 h-5 ${saving === student.id ? 'animate-pulse' : ''}`} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">{status.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {students.length === 0 && (
                    <div className="p-20 text-center">
                        <UserGroupIcon className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-bold italic tracking-tight">No students enrolled in this learning area.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AttendanceRegistry;
