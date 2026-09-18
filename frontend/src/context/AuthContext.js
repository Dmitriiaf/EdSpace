// ========== frontend/src/context/AuthContext.js ==========
import React, { createContext, useState, useContext, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            const userData = localStorage.getItem('user');
            if (userData) {
                try {
                    const parsedUser = JSON.parse(userData);
                    setUser(parsedUser);
                    console.log('User loaded from localStorage:', parsedUser);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                    localStorage.removeItem('user');
                    localStorage.removeItem('token');
                    setToken(null);
                }
            }
        }
        setLoading(false);
    }, [token]);

    const login = async (email, password) => {
    try {
        const response = await axiosInstance.post('auth/login', { email, password });
        const { token, id, email: userEmail, fullName, referralCode, role } = response.data;
        // Нормализуем роль: ROLE_TUTOR -> tutor, ROLE_SCHOOL_ADMIN -> school_admin
        let normalizedRole = 'tutor';
        if (role === 'ROLE_SCHOOL_ADMIN' || role === 'school_admin') {
            normalizedRole = 'school_admin';
        } else if (role === 'student' || role === 'ROLE_STUDENT') {
            normalizedRole = 'student';
        } else if (role === 'parent' || role === 'ROLE_PARENT') {
            normalizedRole = 'parent';
        }
        const userData = { id, email: userEmail, fullName, role: normalizedRole, referralCode };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            const data = error.response?.data;
            return { success: false, error: data?.error || 'Ошибка входа', lockedUntil: data?.lockedUntil || null };
        }
    };

    const register = async (fullName, email, password, timezone, refCode) => {
        try {
            const response = await axiosInstance.post('/auth/register', { email, password, fullName, phone: timezone, timezone, ref: refCode });
            const { token, id, email: userEmail, fullName: userName, referralCode } = response.data;
            const userData = { id, email: userEmail, fullName: userName, role: 'tutor', referralCode };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Ошибка регистрации' };
        }
    };

    const studentLogin = async (email, password) => {
        try {
            const response = await axiosInstance.post('/student-auth/login', { email, password });
            const { token, id, fullName, role, allIds, birthday } = response.data;
            const userData = { id, fullName, role: role || 'student', allIds: allIds || [id], email, birthday: birthday || null };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            const data = error.response?.data;
            return { success: false, error: data?.error || 'Ошибка входа. Проверьте email и пароль.', lockedUntil: data?.lockedUntil || null };
        }
    };

    const parentLogin = async (email, password) => {
        try {
            const response = await axiosInstance.post('/parent-auth/login', { email, password });
            const { token, id, fullName, role, children } = response.data;
            const userData = { id, fullName, role: role || 'parent', children: children || [] };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            const data = error.response?.data;
            return { success: false, error: data?.error || 'Ошибка входа. Проверьте email и пароль.', lockedUntil: data?.lockedUntil || null };
        }
    };

    const logout = () => {
        console.log('Logging out user:', user);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const value = { user, token, login, register, studentLogin, parentLogin, logout, isAuthenticated: !!user };

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};