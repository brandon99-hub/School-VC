import { createContext, useContext, useReducer, useMemo, useState } from 'react';

const AppStateContext = createContext();

const appReducer = (state, action) => {
    switch (action.type) {
        case 'SET_COURSES':
            return { ...state, courses: action.payload };
        case 'SET_TEACHER_ATTENDANCE':
            return { ...state, teacherAttendance: action.payload };
        case 'SET_STUDENT_ATTENDANCE':
            return { ...state, studentAttendance: action.payload };
        case 'SET_UNIQUE_STUDENT_COUNT':
            return { ...state, uniqueStudentCount: action.payload };
        case 'SET_PENDING_ACTIONS':
            return { ...state, pendingActions: action.payload };
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_TOAST':
            return { ...state, toast: action.payload };
        case 'CLEAR_TOAST':
            return { ...state, toast: null };
        case 'CLEAR_STATE':
            return { courses: [], teacherAttendance: [], studentAttendance: [], uniqueStudentCount: 0, pendingActions: [], loading: false, error: null, toast: null };
        default:
            return state;
    }
};

export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, {
        courses: [],
        teacherAttendance: [],
        studentAttendance: [],
        uniqueStudentCount: 0,
        pendingActions: [],
        loading: false,
        error: null,
        toast: null,
    });

    const [needsRefresh, setNeedsRefresh] = useState(true);

    const refresh = () => {
        setNeedsRefresh(true);
    };

    const showToast = (message, type = 'success') => {
        dispatch({ type: 'SET_TOAST', payload: { message, type } });
        setTimeout(() => {
            dispatch({ type: 'CLEAR_TOAST' });
        }, 3000);
    };

    const value = useMemo(
        () => ({ ...state, dispatch, refresh, needsRefresh, setNeedsRefresh, showToast }),
        [state, needsRefresh]
    );

    return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => useContext(AppStateContext);