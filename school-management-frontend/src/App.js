// App.js (Corrected Version)
import React, { useEffect, useState, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useAppState } from './context/AppStateContext';
import { useApi } from './hooks/useApi';
import StudentDashboard from './components/StudentDashboard';
import TeacherDashboard from './components/TeacherDashboard';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Contact from './components/contact/Contact';
import Navbar from './components/common/Navbar';
import LoadingSpinner from './components/common/LoadingSpinner';
import CourseDetail from './components/CourseDetail';
import ProfilePage from './components/ProfilePage';
import CourseList from './components/CourseList';
import AttendanceRecord from './components/AttendanceRecord';
import TeacherAttendanceRecord from './components/TeacherAttendanceRecord';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherCourseList from './pages/teacher/TeacherCourseList';
import TeacherCourseView from './pages/teacher/TeacherCourseView';
import ToastContainer from './components/common/ToastContainer';
import BulkGrading from './components/teacher/BulkGrading';
import ParentDashboard from './pages/parent/ParentDashboard';
import ChildFinances from './pages/parent/ChildFinances';
import SubmissionListPage from './pages/teacher/SubmissionListPage';

function App() {
    const { isAuthenticated, loading: authLoading, user } = useAuth();
    const { dispatch, needsRefresh, setNeedsRefresh } = useAppState();
    const { get } = useApi();
    const [isFetching, setIsFetching] = useState(false);

    const fetchData = useCallback(async () => {
        if (!isAuthenticated || authLoading || !user?.id || isFetching) return;

        setIsFetching(true);
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            if (user.role === 'teacher') {
                const [attendanceData, coursesResponse] = await Promise.all([
                    get(`/teachers/api/class-attendance/`),
                    get(`/teachers/api/courses/`),
                ]);
                dispatch({ type: 'SET_TEACHER_ATTENDANCE', payload: attendanceData || [] });
                dispatch({ type: 'SET_COURSES', payload: coursesResponse?.courses || [] });
                dispatch({ type: 'SET_UNIQUE_STUDENT_COUNT', payload: coursesResponse?.unique_student_count || 0 });
            } else if (user.role === 'student') {
                const [attendanceData, enrolledCourses] = await Promise.all([
                    get(`/students/${user.id}/attendance/`),
                    get(`/students/${user.id}/courses/`),
                ]);
                dispatch({ type: 'SET_STUDENT_ATTENDANCE', payload: attendanceData || [] });
                dispatch({ type: 'SET_COURSES', payload: enrolledCourses || [] });
            }
            setNeedsRefresh(false);
        } catch (err) {
            console.error('Initial data fetch error:', err);
            if (err.response?.status === 404) {
                dispatch({ type: 'SET_STUDENT_ATTENDANCE', payload: [] });
                dispatch({ type: 'SET_COURSES', payload: [] });
            } else {
                dispatch({
                    type: 'SET_ERROR',
                    payload: 'Failed to load data. Please try again later.',
                });
            }
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
            setIsFetching(false);
        }
    }, [get, user, isAuthenticated, authLoading, dispatch, isFetching, setNeedsRefresh]);

    useEffect(() => {
        if (needsRefresh && !isFetching) {
            fetchData();
        }
    }, [fetchData, needsRefresh, isFetching]);

    if (authLoading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <Router>
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <Routes>
                    <Route
                        path="/login"
                        element={!isAuthenticated ? <Login /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />}
                    />
                    <Route
                        path="/signup"
                        element={!isAuthenticated ? <Signup /> : <Navigate to={user?.role === 'admin' ? '/admin' : '/dashboard'} replace />}
                    />
                    <Route path="/contact" element={<Contact />} />
                    <Route
                        path="/dashboard"
                        element={
                            isAuthenticated ? (
                                user?.role === 'admin' ? (
                                    <Navigate to="/admin" replace />
                                ) : user?.role === 'teacher' ? (
                                    <TeacherDashboard />
                                ) : (
                                    <StudentDashboard />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/courses/api/:id/"
                        element={
                            isAuthenticated ? (
                                <CourseDetail />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            isAuthenticated ? (
                                <ProfilePage />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            isAuthenticated ? (
                                <ProfilePage />
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/courses"
                        element={
                            isAuthenticated ? (
                                user?.role === 'student' ? (
                                    <CourseList />
                                ) : (
                                    <Navigate to="/dashboard" replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/attendance"
                        element={
                            isAuthenticated ? (
                                user?.role === 'student' ? (
                                    <AttendanceRecord />
                                ) : (
                                    <Navigate to="/dashboard" replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/admin/*"
                        element={
                            isAuthenticated && user?.is_superuser ? (
                                <AdminDashboard />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        }
                    />
                    <Route
                        path="/teacher/courses"
                        element={
                            isAuthenticated && user?.role === 'teacher' ? (
                                <TeacherCourseList />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        }
                    />
                    <Route
                        path="/teacher/courses/:id"
                        element={
                            isAuthenticated && user?.role === 'teacher' ? (
                                <TeacherCourseView />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        }
                    />
                    <Route
                        path="/teacher-attendance"
                        element={
                            isAuthenticated ? (
                                user?.role === 'teacher' ? (
                                    <TeacherAttendanceRecord />
                                ) : (
                                    <Navigate to="/dashboard" replace />
                                )
                            ) : (
                                <Navigate to="/login" replace />
                            )
                        }
                    />
                    <Route
                        path="/teacher/bulk-grading/:assignmentId"
                        element={
                            isAuthenticated && user?.role === 'teacher' ? (
                                <BulkGrading />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        }
                    />
                    <Route
                        path="/teacher/assignments/:assignmentId/submissions"
                        element={
                            isAuthenticated && user?.role === 'teacher' ? (
                                <SubmissionListPage />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        }
                    />
                    <Route
                        path="/parent/*"
                        element={
                            isAuthenticated && user?.role === 'parent' ? (
                                <ParentDashboard />
                            ) : (
                                <Navigate to="/dashboard" replace />
                            )
                        }
                    />
                    <Route
                        path="/"
                        element={<Navigate to={isAuthenticated ? (user?.role === 'admin' ? '/admin/dashboard' : '/dashboard') : '/login'} replace />}
                    />
                </Routes>
                <ToastContainer />
            </div>
        </Router>
    );
}

export default App;