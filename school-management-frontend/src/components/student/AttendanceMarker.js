import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { useAppState } from '../../context/AppStateContext';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleIconSolid } from '@heroicons/react/24/solid';

const AttendanceMarker = ({ courseId, courseName }) => {
    const { get, post } = useApi();
    const { showToast } = useAppState();
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [marking, setMarking] = useState(false);

    useEffect(() => {
        checkAttendanceStatus();
    }, [courseId]);

    const checkAttendanceStatus = async () => {
        try {
            setLoading(true);
            const data = await get(`/students/api/attendance-status/${courseId}/`);
            setAttendanceStatus(data);
        } catch (error) {
            console.error('Error checking attendance:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAttendance = async () => {
        try {
            setMarking(true);
            const response = await post('/students/api/mark-attendance/', {
                course_id: courseId
            });

            showToast(response.message || 'Attendance marked successfully!');
            checkAttendanceStatus(); // Refresh status
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Failed to mark attendance';
            showToast(errorMsg, 'error');
        } finally {
            setMarking(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center ${attendanceStatus?.marked
                            ? 'bg-green-100'
                            : 'bg-blue-100'
                        }`}>
                        {attendanceStatus?.marked ? (
                            <CheckCircleIconSolid className="h-7 w-7 text-green-600" />
                        ) : (
                            <ClockIcon className="h-7 w-7 text-blue-600" />
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {attendanceStatus?.marked ? 'Attendance Marked' : 'Mark Your Attendance'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                            {attendanceStatus?.marked
                                ? `You marked yourself as ${attendanceStatus.attendance.status} today`
                                : 'Mark your attendance for today\'s class'
                            }
                        </p>
                    </div>
                </div>

                {!attendanceStatus?.marked && (
                    <button
                        onClick={handleMarkAttendance}
                        disabled={marking}
                        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                    >
                        {marking ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Marking...</span>
                            </>
                        ) : (
                            <>
                                <CheckCircleIcon className="h-5 w-5" />
                                <span>Mark Present</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            {attendanceStatus?.marked && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                        <CheckCircleIconSolid className="h-4 w-4 text-green-600 mr-2" />
                        <span>Marked at {new Date(attendanceStatus.attendance.date).toLocaleDateString()}</span>
                    </div>
                </div>
            )}

            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800">
                    <strong>Note:</strong> You can only mark attendance once per day. Make sure you're in class before marking.
                </p>
            </div>
        </div>
    );
};

export default AttendanceMarker;
