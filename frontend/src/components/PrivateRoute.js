import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function PrivateRoute({ children, requiredRole }) {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" />;
    }

    // Проверка роли, если требуется
    if (requiredRole && user?.role !== requiredRole) {
        // Для админа проверяем оба варианта роли
        const isAdmin = user?.role === 'school_admin' || user?.role === 'ROLE_SCHOOL_ADMIN';
        const isRequiredAdmin = requiredRole === 'school_admin' || requiredRole === 'ROLE_SCHOOL_ADMIN';
        
        if (isRequiredAdmin && isAdmin) {
            return children;
        }
        
        if (user?.role === 'tutor' || isAdmin) {
            return <Navigate to={isAdmin ? "/admin" : "/dashboard"} />;
        } else if (user?.role === 'student') {
            return <Navigate to="/student" />;
        } else if (user?.role === 'parent') {
            return <Navigate to="/parent/dashboard" />;
        }
        return <Navigate to="/login" />;
    }

    return children;
}

export default PrivateRoute;