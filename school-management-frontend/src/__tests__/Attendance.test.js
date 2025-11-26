// src/__tests__/Attendance.test.js
import { render, waitFor } from '@testing-library/react';
import { updateBulkAttendance } from '../api/attendance';
import AttendanceComponent from '../components/Attendance'; // Assume this exists

jest.mock('../api/attendance');

test('updates attendance successfully', async () => {
  updateBulkAttendance.mockResolvedValue({ status: 'Attendance updated' });
  const { getByText } = render(<AttendanceComponent />);
  await waitFor(() => expect(getByText('Attendance updated')).toBeInTheDocument());
});