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
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload };
        case 'CLEAR_STATE':
            return { courses: [], teacherAttendance: [], studentAttendance: [], loading: false, error: null };
        default:
            return state;
    }
};

export const AppStateProvider = ({ children }) => {
    const [state, dispatch] = useReducer(appReducer, {
        courses: [],
        teacherAttendance: [],
        studentAttendance: [],
        loading: false,
        error: null,
    });

    const [needsRefresh, setNeedsRefresh] = useState(true);

    const refresh = () => {
        setNeedsRefresh(true);
    };

    const value = useMemo(
        () => ({ ...state, dispatch, refresh, needsRefresh, setNeedsRefresh }),
        [state, needsRefresh]
    );

    return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
};

export const useAppState = () => useContext(AppStateContext);