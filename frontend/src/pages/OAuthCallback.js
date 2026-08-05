import React, { useEffect } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

const OAuthCallback = () => {
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const token = params.get('token');
        const target = params.get('target') || null;

        if (token) {
            localStorage.setItem('token', token);
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                const userId = payload.id;
                const role = (payload.role || 'ROLE_TUTOR').replace('ROLE_', '').toLowerCase();

                // Запрашиваем профиль с бэкенда чтобы получить правильное имя
                fetch(`/api/tutors/${userId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                .then(res => res.json())
                .then(profile => {
                    const userData = {
                        id: userId,
                        email: payload.sub,
                        fullName: profile.fullName || payload.sub.split('@')[0],
                        role: role,
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    const finalTarget = target || (!profile.onboardingCompleted ? '/onboarding' : '/dashboard');
                    window.location.href = finalTarget;
                })
                .catch(() => {
                    const userData = {
                        id: userId,
                        email: payload.sub,
                        fullName: payload.sub.split('@')[0],
                        role: role,
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    window.location.href = target || '/dashboard';
                });
            } catch (e) {
                window.location.href = target || '/dashboard';
            }
        } else {
            window.location.href = '/login?error=oauth_failed';
        }
    }, []);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
            <CircularProgress size={48} />
            <Typography sx={{ color: '#6B7280' }}>Входим...</Typography>
        </Box>
    );
};

export default OAuthCallback;