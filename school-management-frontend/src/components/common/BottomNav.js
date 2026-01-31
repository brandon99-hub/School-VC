import React, { useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HomeIcon,
    BookOpenIcon,
    ChartBarIcon,
    UserIcon,
    ClipboardDocumentCheckIcon,
    DocumentCheckIcon,
    AcademicCapIcon,
    ClipboardDocumentListIcon,
    QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const BottomNav = () => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { id: courseId } = useParams();

    const isCourseContext = location.pathname.includes('/courses/api/') || location.pathname.includes('/teacher/courses/');

    const navItems = useMemo(() => {
        if (!isAuthenticated || !user) return [];

        if (isCourseContext) {
            if (user.role === 'student') {
                return [
                    { id: 'journey', label: 'Journey', icon: BookOpenIcon, action: () => { } }, // Usually handled by internal tabs in CourseDetail
                    { id: 'assignments', label: 'Assignments', icon: ClipboardDocumentListIcon, action: () => { } },
                    { id: 'quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon, action: () => { } },
                    { id: 'submissions', label: 'Performance', icon: AcademicCapIcon, action: () => { } },
                ];
            } else if (user.role === 'teacher') {
                return [
                    { id: 'content', label: 'Strands', icon: BookOpenIcon, action: () => { } },
                    { id: 'assignments', label: 'Assignments', icon: ClipboardDocumentListIcon, action: () => { } },
                    { id: 'quizzes', label: 'Quizzes', icon: QuestionMarkCircleIcon, action: () => { } },
                    { id: 'attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon, action: () => { } },
                    { id: 'gradebook', label: 'Grades', icon: AcademicCapIcon, action: () => { } },
                ];
            }
        }

        // Global Context
        if (user.role === 'student') {
            return [
                { path: '/dashboard', label: 'Home', icon: HomeIcon },
                { path: '/courses', label: 'Learning', icon: BookOpenIcon },
                { path: '/success-hub', label: 'Success', icon: ChartBarIcon },
                { path: '/profile', label: 'Profile', icon: UserIcon },
            ];
        } else if (user.role === 'teacher') {
            return [
                { path: '/dashboard', label: 'Home', icon: HomeIcon },
                { path: '/teacher/courses', label: 'My Areas', icon: BookOpenIcon },
                { path: '/teacher-attendance', label: 'Attendance', icon: ClipboardDocumentCheckIcon },
                { path: '/teacher/submissions', label: 'Submissions', icon: DocumentCheckIcon }, // Assuming this route exists or we create it
                { path: '/profile', label: 'Profile', icon: UserIcon },
            ];
        }

        return [];
    }, [user, isAuthenticated, isCourseContext]);

    // Internal tab handling for CourseDetail and TeacherCourseView
    const handleNavItemClick = (item) => {
        if (item.path) {
            navigate(item.path);
        } else {
            // This is messy because we are in a parent component and need to communicate with the child (CourseDetail)
            // However, the user asked for the BottomNav to change.
            // A better way is to use state in AppStateContext or similar.
            // For now, let's assume we use query params or just navigation to the same page with a hash/state.
            // Actually, CourseDetail uses internal state 'activeTab'. We should probably lift this.
            // But let's see if we can use events or a shared context.
            window.dispatchEvent(new CustomEvent('change-course-tab', { detail: item.id }));
        }
    };

    const isActive = (item) => {
        if (item.path) {
            return location.pathname === item.path;
        }
        // For course context, we'd need to check the active tab state from the child
        // This will be handled by listening to the same event or using a context
        return false;
    };

    if (navItems.length === 0) return null;

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
                {navItems.map((item) => (
                    <button
                        key={item.id || item.path}
                        onClick={() => handleNavItemClick(item)}
                        className="flex flex-col items-center justify-center flex-1 h-full space-y-1 relative group"
                    >
                        <div className={`p-1 rounded-xl transition-all ${isActive(item) ? 'text-[#18216D]' : 'text-slate-400'}`}>
                            <item.icon className="w-6 h-6" />
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-tighter transition-all ${isActive(item) ? 'text-[#18216D]' : 'text-slate-400'}`}>
                            {item.label}
                        </span>
                        {isActive(item) && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#18216D] rounded-b-full"></div>
                        )}
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default BottomNav;
