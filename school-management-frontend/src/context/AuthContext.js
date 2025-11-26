import { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import client from '../api/Client';
import { useAppState } from './AppStateContext'; // Import useAppState

const AuthContext = createContext();

const authReducer = (state, action) => {
    switch (action.type) {
        case 'LOGIN':
            return { ...state, user: action.payload.user, isAuthenticated: true, loading: false };
        case 'LOGOUT':
            return { ...state, user: null, isAuthenticated: false, loading: false };
        case 'LOAD_USER':
            return { ...state, user: action.payload, isAuthenticated: true, loading: false };
        case 'REFRESH_TOKEN':
            return { ...state, user: action.payload.user, isAuthenticated: true };
        case 'LOADING':
            return { ...state, loading: action.payload };
        default:
            return state;
    }
};

export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, {
        user: null,
        isAuthenticated: false,
        loading: true,
    });

    const { dispatch: appDispatch, setNeedsRefresh } = useAppState(); // Access AppState dispatch

    const login = useCallback(
        async (userData, accessToken, refreshToken) => {
            if (!userData.id) {
                console.error('User data missing id:', userData);
                throw new Error('User ID not found in login response');
            }
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
            dispatch({ type: 'LOGIN', payload: { user: userData } });
            setNeedsRefresh(true);
        },
        [dispatch, setNeedsRefresh]
    );

    const logout = useCallback(async () => {
        try {
            await client.post('/api/auth/logout/');
        } catch (error) {
            console.error('Logout error:', error);
        }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        dispatch({ type: 'LOGOUT' });
        appDispatch({ type: 'CLEAR_STATE' }); // Clear AppState on logout
    }, [appDispatch]);

    const loadUser = useCallback(async () => {
        dispatch({ type: 'LOADING', payload: true });
        try {
            const response = await client.get('/api/auth/user/');
            if (!response.data.id) {
                console.error('User object missing id:', response.data);
                throw new Error('User ID not found');
            }
            dispatch({ type: 'LOAD_USER', payload: response.data });
            setNeedsRefresh(true);
        } catch (error) {
            console.error('Session check failed:', error);
            logout();
        } finally {
            dispatch({ type: 'LOADING', payload: false });
        }
    }, [logout]);

    useEffect(() => {
        const initializeAuth = async () => {
            const refreshToken = localStorage.getItem('refresh_token');
            if (!refreshToken) {
                dispatch({ type: 'LOADING', payload: false });
                return;
            }
            try {
                await loadUser();
            } catch (error) {
                console.error('Auth initialization failed:', error);
                logout();
            }
        };
        initializeAuth();
    }, [loadUser, logout]);

    const value = useMemo(
        () => ({ ...state, login, logout, loadUser }),
        [state, login, logout, loadUser]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);