import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { useAuth } from '../context/AuthContext';

const TeacherInfo = () => {
    const { user } = useAuth();
    const { get } = useApi();
    const [teacherData, setTeacherData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeacherData = async () => {
            if (!user?.id) return;

            try {
                setLoading(true);
                const response = await get(`/api/auth/profile/`);
                setTeacherData(response);
            } catch (error) {
                console.error('Error fetching teacher profile:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTeacherData();
    }, [user?.id, get]);

    const profile = teacherData?.teacher_profile || {};
    const fullName = user
        ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'No Name'
        : 'No Name';
    const teacherId = profile.teacher_id || (loading ? 'Loading...' : 'N/A');
    const initial = fullName ? fullName.charAt(0).toUpperCase() : '?';

    return (
        <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-900/5 h-fit border border-slate-100">
            <div className="bg-[#18216D]/5 p-8 border-b border-slate-100">
                <div className="flex items-center space-x-5">
                    <div
                        className="h-20 w-20 rounded-2xl bg-[#18216D] flex items-center justify-center transform transition-all hover:scale-105 shadow-lg shadow-indigo-900/20">
                        <span className="text-3xl text-white font-black">{initial}</span>
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-[#18216D] tracking-tight">{fullName}</h2>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                            <i className="fas fa-id-card mr-2 text-[#FFC425]" aria-hidden="true"></i>
                            Staff ID: {teacherId}
                        </p>
                    </div>
                </div>
            </div>
            <div className="p-8 space-y-6">
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center">
                        <i className="fas fa-envelope mr-2 text-[#18216D]" aria-hidden="true"></i>
                        Email
                    </h3>
                    <p className="text-sm font-bold text-[#18216D]">{user?.email || 'N/A'}</p>
                </div>
                <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 flex items-center">
                        <i className="fas fa-phone mr-2 text-[#18216D]" aria-hidden="true"></i>
                        Phone
                    </h3>
                    <p className="text-sm font-bold text-[#18216D]">{profile.phone || (loading ? 'Loading...' : 'N/A')}</p>
                </div>
                <div className="border-t border-slate-50 pt-8">
                    <div className="grid grid-cols-1 gap-3">
                        <Link
                            to="/profile"
                            className="flex items-center justify-center px-6 py-3 bg-[#18216D] rounded-xl shadow-lg shadow-indigo-900/20 text-[10px] font-black uppercase tracking-widest text-white hover:bg-[#0D164F] transition-all no-underline"
                        >
                            <i className="fas fa-user-edit mr-2" aria-hidden="true"></i>
                            Edit Profile
                        </Link>
                        <Link
                            to="/teacher/courses"
                            className="flex items-center justify-center px-6 py-3 border-2 border-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#18216D] bg-white hover:bg-slate-50 transition-all no-underline"
                        >
                            <i className="fas fa-book mr-2" aria-hidden="true"></i>
                            Teaching Areas
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TeacherInfo;