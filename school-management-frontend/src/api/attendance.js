// src/api/attendance.js
import api from './Client';

export const updateBulkAttendance = async (attendanceData) => {
  const response = await api.post('/api/students/bulk_attendance/', { attendance: attendanceData });
  return response.data;
};


