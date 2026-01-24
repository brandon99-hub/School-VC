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
    <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 h-fit border border-slate-100">
      <div className="bg-[#18216D]/5 p-8 border-b border-slate-100">
        <div className="flex items-center space-x-5">
          <div className="h-20 w-20 rounded-2xl bg-[#18216D] flex items-center justify-center transform transition-all hover:scale-105 shadow-lg shadow-indigo-900/20">
            <span className="text-3xl text-white font-black">{initial}</span>
          </div>
          <div>
            <h2 className="text-2xl font-black text-[#18216D] tracking-tight">{fullName}</h2>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
              <i className="fas fa-id-card mr-2 text-[#FFC425]" aria-hidden="true"></i>
              Scholar ID: {studentId}
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
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center">
            <i className="fas fa-chart-line mr-2 text-[#18216D]" aria-hidden="true"></i>
            Attendance Performance
          </h3>
          <div className="relative pt-1">
            <div className="flex mb-3 items-center justify-between">
              <span className="text-xl font-black inline-block text-[#18216D]">
                {displayStudent.attendancePercentage}%
              </span>
            </div>
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-slate-100">
              <div
                style={{ width: `${displayStudent.attendancePercentage}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#18216D] transition-all duration-1000 ease-out"
              ></div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-50 pt-8">
          <div className="grid grid-cols-1 gap-3">
            <button
              className="flex items-center justify-center px-6 py-3 bg-[#18216D] rounded-xl shadow-lg shadow-indigo-900/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0D164F] transition-all"
              aria-label="View Full Profile"
            >
              <i className="fas fa-id-badge mr-2" aria-hidden="true"></i>
              View Full Profile
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex items-center justify-center px-4 py-3 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#18216D] bg-white hover:bg-slate-50 transition-all"
                aria-label="View Courses"
              >
                <i className="fas fa-book mr-2" aria-hidden="true"></i>
                Courses
              </button>
              <button
                className="flex items-center justify-center px-4 py-3 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#18216D] bg-white hover:bg-slate-50 transition-all"
                aria-label="View Schedule"
              >
                <i className="fas fa-calendar-alt mr-2" aria-hidden="true"></i>
                Schedule
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentInfo;
