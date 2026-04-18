import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import axios from 'axios';

function StepikCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const errorParam = params.get('error');

        if (errorParam) {
            setError('Авторизация отклонена');
            setLoading(false);
            return;
        }

        if (!code) {
            setError('Код авторизации не получен');
            setLoading(false);
            return;
        }

        exchangeCode(code);
    }, [location]);

    const exchangeCode = async (code) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                '/stepik/token',
                { code },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setTimeout(() => {
                navigate('/stepik');
            }, 2000);
        } catch (err) {
            console.error('Ошибка обмена кода:', err);
            setError(err.response?.data?.error || 'Ошибка подключения Stepik');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <CircularProgress size={48} sx={{ color: '#6366F1', mb: 2 }} />
                <Typography variant="body1" color="textSecondary">Подключаем Stepik...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 8 }}>
                <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                <Typography variant="body2" color="textSecondary">
                    Попробуйте подключить Stepik снова.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <Typography variant="h4" sx={{ color: 'white' }}>✓</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>Stepik успешно подключен!</Typography>
        </Box>
    );
}

export default StepikCallback;