import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';

const AttendanceForm = ({ courseId }) => {
    const { get, post } = useApi();
    const [students, setStudents] = useState([]);
    const [attendanceData, setAttendanceData] = useState({});

    useEffect(() => {
        const fetchStudents = async () => {
            const data = await get(`/courses/${courseId}/students/`);
            setStudents(data);
            const initialData = {};
            data.forEach(student => { initialData[student.id] = 'present'; });
            setAttendanceData(initialData);
        };
        fetchStudents();
    }, [get, courseId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const date = new Date().toISOString().split('T')[0];
        for (const [studentId, status] of Object.entries(attendanceData)) {
            await post('/attendance/', { student: studentId, course: courseId, date, status });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <table>
                <thead>
                    <tr><th>Student</th><th>Status</th></tr>
                </thead>
                <tbody>
                    {students.map(student => (
                        <tr key={student.id}>
                            <td>{student.name}</td>
                            <td>
                                <select
                                    value={attendanceData[student.id]}
                                    onChange={(e) => setAttendanceData({ ...attendanceData, [student.id]: e.target.value })}
                                >
                                    <option value="present">Present</option>
                                    <option value="absent">Absent</option>
                                    <option value="late">Late</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button type="submit">Submit Attendance</button>
        </form>
    );
};

export default AttendanceForm;