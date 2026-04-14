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
        // Перенаправление на соответствующую страницу в зависимости от роли
        if (user?.role === 'tutor') {
            return <Navigate to="/dashboard" />;
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