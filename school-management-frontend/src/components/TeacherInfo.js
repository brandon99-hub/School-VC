import { Link } from 'react-router-dom';

const TeacherInfo = ({ teacher }) => {
    const profile = teacher?.teacher_profile || {};
    const fullName = teacher
        ? `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim() || 'No Name'
        : 'No Name';
    const teacherId = profile.teacher_id || 'N/A';
    const department = profile.department || 'N/A';
    const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';

    return (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md h-fit">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
                <div className="flex items-center space-x-4">
                    <div
                        className="h-20 w-20 rounded-full bg-gradient-to-r from-blue-600 to-blue-800 flex items-center justify-center transform transition-transform hover:scale-105">
                        <span className="text-3xl text-white font-semibold">{initial}</span>
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-800">{fullName}</h2>
                        <p className="text-gray-500 flex items-center">
                            <i className="fas fa-id-card mr-2" aria-hidden="true"></i>
                            ID: {teacherId}
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-6 space-y-6">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2 flex items-center">
                        <i className="fas fa-building mr-2" aria-hidden="true"></i>
                        Department
                    </h3>
                    <p className="text-lg font-semibold text-gray-800">{department}</p>
                </div>
                <div className="border-t pt-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Quick Access</h3>
                    <div className="grid grid-cols-1 gap-2">
                        <Link
                            to="/teacher/courses"
                            className="flex items-center justify-center px-4 py-2.5 border border-indigo-100 rounded-lg shadow-sm text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all no-underline"
                        >
                            <i className="fas fa-book mr-2" aria-hidden="true"></i>
                            My Assigned Courses
                        </Link>
                        <Link
                            to="/teacher/courses"
                            className="flex items-center justify-center px-4 py-2.5 border border-indigo-100 rounded-lg shadow-sm text-sm font-bold text-indigo-600 bg-white hover:bg-gray-50 transition-all no-underline"
                        >
                            <i className="fas fa-pen mr-2" aria-hidden="true"></i>
                            Grade Assignments
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherInfo;