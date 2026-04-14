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
            const response = await axiosInstance.post('/api/auth/login', { email, password });
            const { token, id, email: userEmail, fullName } = response.data;
            const userData = { id, email: userEmail, fullName, role: 'tutor' };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Ошибка входа' };
        }
    };

    const register = async (email, password, fullName, phone) => {
        try {
            const response = await axiosInstance.post('/api/auth/register', { email, password, fullName, phone });
            const { token, id, email: userEmail, fullName: userName } = response.data;
            const userData = { id, email: userEmail, fullName: userName, role: 'tutor' };
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
            const response = await axiosInstance.post('/api/student-auth/login', { email, password });
            const { token, id, fullName, role, allIds, birthday } = response.data;
            const userData = { id, fullName, role: role || 'student', allIds: allIds || [id], email, birthday: birthday || null };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Ошибка входа. Проверьте email и пароль.' };
        }
    };

    const parentLogin = async (email, password) => {
        try {
            const response = await axiosInstance.post('/api/parent-auth/login', { email, password });
            const { token, id, fullName, role, children } = response.data;
            const userData = { id, fullName, role: role || 'parent', children: children || [] };
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));
            setToken(token);
            setUser(userData);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.response?.data?.error || 'Ошибка входа. Проверьте email и пароль.' };
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