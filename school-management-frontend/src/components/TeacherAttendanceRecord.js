import React, { useMemo, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export const summarizeTeacherAttendance = (records = []) => {
    const summary = records.reduce((acc, record) => {
        const courseKey = record.course || 'Unknown';
        if (!acc[courseKey]) {
            acc[courseKey] = { course: courseKey, Attendance: 0, sessions: 0 };
        }
        acc[courseKey].Attendance += Number(record.attendanceRate || 0);
        acc[courseKey].sessions += 1;
        return acc;
    }, {});
    return Object.values(summary).map((item) => ({
        course: item.course,
        Attendance: Math.round(item.Attendance / item.sessions),
    }));
};

const TeacherAttendanceRecord = () => {
    const { teacherAttendance, loading, error, refresh } = useAppState();
    const [view, setView] = useState('table');

    const records = teacherAttendance ?? [];
    const hasRecords = records.length > 0;

    const chartData = useMemo(() => summarizeTeacherAttendance(records), [records]);

    const handleRefresh = () => {
        refresh();
    };

    if (loading) return <div className="text-center py-8">Loading class attendance records...</div>;
    if (error)
        return (
            <div className="text-red-500 p-4">
                {error}
                <button onClick={handleRefresh} className="ml-4 text-blue-600 hover:underline">
                    Retry
                </button>
            </div>
        );

    if (!hasRecords)
        return (
            <div className="text-gray-500 p-4">
                No attendance records found for your classes.
                <button onClick={handleRefresh} className="ml-4 text-blue-600 hover:underline">
                    Refresh
                </button>
            </div>
        );

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Attendance</p>
                    <h2 className="text-xl font-semibold text-gray-900">Class performance overview</h2>
                    <p className="text-sm text-gray-500">Monitor course-level attendance trends or drill into sessions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                        {['chart', 'table'].map((option) => (
                            <button
                                key={option}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                                    view === option
                                        ? 'bg-white shadow text-blue-600'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                                onClick={() => setView(option)}
                            >
                                {option === 'chart' ? 'Chart' : 'Table'}
                            </button>
                        ))}
                    </div>
                    <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                        <i className="fas fa-filter mr-2 text-gray-500"></i>
                        Filter
                    </button>
                    <button className="px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center">
                        <i className="fas fa-download mr-2 text-gray-500"></i>
                        Export
                    </button>
                </div>
            </div>

            {view === 'chart' ? (
                <div className="px-6 py-8">
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="course" stroke="#94a3b8" />
                                <YAxis stroke="#94a3b8" unit="%" domain={[0, 100]} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Attendance" fill="#2563eb" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto px-6 py-4">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tl-xl">
                                    Course
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Date
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Attendance Rate
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tr-xl">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {records.map((record) => (
                                <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        {record.course}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(record.date).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                        {record.attendanceRate}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-blue-600 hover:text-blue-900">
                                            <i className="fas fa-info-circle"></i>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TeacherAttendanceRecord;