import { summarizeStudentAttendance } from '../components/AttendanceRecord';
import { summarizeTeacherAttendance } from '../components/TeacherAttendanceRecord';

describe('attendance summarizers', () => {
    it('builds student attendance buckets per day', () => {
        const records = [
            { id: 1, date: '2024-09-01', status: 'Present' },
            { id: 2, date: '2024-09-01', status: 'Absent' },
            { id: 3, date: '2024-09-02', status: 'Late' },
        ];

        const result = summarizeStudentAttendance(records);

        expect(result).toEqual([
            { date: 'Sep 1', Present: 1, Absent: 1, Late: 0 },
            { date: 'Sep 2', Present: 0, Absent: 0, Late: 1 },
        ]);
    });

    it('averages teacher attendance per course', () => {
        const records = [
            { id: 1, course: 'Math', attendanceRate: 80 },
            { id: 2, course: 'Math', attendanceRate: 100 },
            { id: 3, course: 'Science', attendanceRate: 90 },
        ];

        const result = summarizeTeacherAttendance(records);

        expect(result).toEqual([
            { course: 'Math', Attendance: 90 },
            { course: 'Science', Attendance: 90 },
        ]);
    });
});

