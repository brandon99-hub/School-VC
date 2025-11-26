import React, { useMemo, useState } from 'react';
import { useAppState } from '../context/AppStateContext';
import {
    Area,
    AreaChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

export const summarizeStudentAttendance = (records = []) => {
    const summary = records.reduce((acc, record) => {
        const date = new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (!acc[date]) {
            acc[date] = { date, Present: 0, Absent: 0, Late: 0 };
        }
        acc[date][record.status] = (acc[date][record.status] || 0) + 1;
        return acc;
    }, {});
    return Object.values(summary);
};

const AttendanceRecord = () => {
    const { studentAttendance, loading, error, refresh } = useAppState();
    const [view, setView] = useState('table');

    const attendanceRecords = studentAttendance ?? [];
    const hasRecords = attendanceRecords.length > 0;

    const chartData = useMemo(() => summarizeStudentAttendance(attendanceRecords), [attendanceRecords]);

    const handleRefresh = () => {
        refresh();
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'Present':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Late':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'Absent':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    if (loading) return <div className="text-center py-8">Loading attendance records...</div>;
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
                No attendance records found for your account.
                <button onClick={handleRefresh} className="ml-4 text-blue-600 hover:underline">
                    Refresh
                </button>
            </div>
        );

    return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-sm uppercase tracking-wide text-gray-400">Attendance</p>
                        <h2 className="text-2xl font-semibold text-gray-900">Your semester record</h2>
                        <p className="text-gray-500 text-sm mt-1">
                            Toggle between insights and detailed history.
                        </p>
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
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLate" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="date" stroke="#94a3b8" />
                                    <YAxis allowDecimals={false} stroke="#94a3b8" />
                                    <Tooltip />
                                    <Legend />
                                    <Area
                                        type="monotone"
                                        dataKey="Present"
                                        stroke="#16a34a"
                                        fillOpacity={1}
                                        fill="url(#colorPresent)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Absent"
                                        stroke="#dc2626"
                                        fillOpacity={1}
                                        fill="url(#colorAbsent)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="Late"
                                        stroke="#ea580c"
                                        fillOpacity={1}
                                        fill="url(#colorLate)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ) : (
                    <div className="overflow-x-auto px-6 py-4">
                        <table className="min-w-full divide-y divide-gray-100">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tl-xl">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Course
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider rounded-tr-xl">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {attendanceRecords.map((record) => (
                                    <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(record.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-gray-900">{record.course}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full border ${getStatusStyles(
                                                    record.status
                                                )}`}
                                            >
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button className="text-blue-600 hover:text-blue-900">
                                                <i className="fas fa-info-circle"></i>
                                            </button>
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                <div className="text-sm text-gray-500">
                    Showing {attendanceRecords.length} of {attendanceRecords.length} records
                </div>
                <div className="flex space-x-2">
                    <button
                        className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                    >
                        Previous
                    </button>
                    <button className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 text-sm text-gray-500">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceRecord;