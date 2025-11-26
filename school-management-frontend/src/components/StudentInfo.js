import React from 'react';

const StudentInfo = ({ student }) => {
  // Build a full name from first_name and last_name if 'name' isn't provided.
  const fullName = student?.name
    ? student.name
    : `${student?.first_name || ''} ${student?.last_name || ''}`.trim() || 'No Name';

  // Use student.student_id (underscore) instead of student.studentId.
  const studentId = student?.student_id || 'N/A';

  // For initials, use the first character of the fullName if available.
  const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';

  // Fallback in case student is undefined.
  const fallbackStudent = {
    name: 'No Name',
    student_id: 'N/A',
    grade: 'N/A',
    attendancePercentage: 0,
  };
  const displayStudent = student || fallbackStudent;

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
        <div className="flex items-center space-x-4">
          <div className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center transform transition-transform hover:scale-105">
            <span className="text-3xl text-white font-semibold">{initial}</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">{fullName}</h2>
            <p className="text-gray-500 flex items-center">
              <i className="fas fa-id-card mr-2" aria-hidden="true"></i>
              ID: {studentId}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <i className="fas fa-graduation-cap mr-2" aria-hidden="true"></i>
            Grade Level
          </h3>
          <p className="text-lg font-semibold text-gray-800">{displayStudent.grade}</p>
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
            <i className="fas fa-chart-line mr-2" aria-hidden="true"></i>
            Attendance Rate
          </h3>
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <span className="text-lg font-semibold inline-block text-blue-600">
                {displayStudent.attendancePercentage}%
              </span>
            </div>
            <div className="overflow-hidden h-2 text-xs flex rounded bg-blue-100">
              <div
                style={{ width: `${displayStudent.attendancePercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500 ease-in-out"
              ></div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Access</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              className="flex items-center justify-center px-4 py-2 border border-blue-100 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              aria-label="View Courses"
            >
              <i className="fas fa-book mr-2" aria-hidden="true"></i>
              Courses
            </button>
            <button
              className="flex items-center justify-center px-4 py-2 border border-blue-100 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors"
              aria-label="View Schedule"
            >
              <i className="fas fa-calendar-alt mr-2" aria-hidden="true"></i>
              Schedule
            </button>
            <button
              className="flex items-center justify-center px-4 py-2 border border-blue-100 rounded-lg shadow-sm text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors col-span-2"
              aria-label="View Full Profile"
            >
              <i className="fas fa-file-alt mr-2" aria-hidden="true"></i>
              View Full Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfo;
