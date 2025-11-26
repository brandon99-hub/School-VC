import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ component: Component, allowedRoles, ...rest }) => {
    const { isAuthenticated, role } = useAuth();
    return (
        <Route
            {...rest}
            render={props =>
                isAuthenticated && (!allowedRoles || allowedRoles.includes(role))
                    ? <Component {...props} />
                    : <Redirect to="/login" />
            }
        />
    );
};

export default ProtectedRoute;