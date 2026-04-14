import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography, Paper, Button } from '@mui/material';
import { CheckCircle, Error as ErrorIcon } from '@mui/icons-material';

function PaymentCallback() {
    const navigate = useNavigate();
    const location = useLocation();
    const [status, setStatus] = useState('processing');
    
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const paymentId = params.get('paymentId');
        
        if (paymentId) {
            // Показываем успешную оплату
            setStatus('success');
            
            // Через 3 секунды возвращаемся в кабинет родителя
            setTimeout(() => {
                navigate('/parent/dashboard');
            }, 3000);
        } else {
            setStatus('error');
        }
    }, [location, navigate]);
    
    if (status === 'processing') {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress />
            </Box>
        );
    }
    
    if (status === 'error') {
        return (
            <Box sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 8 }}>
                <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                    <ErrorIcon sx={{ fontSize: 60, color: '#EF4444', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#EF4444' }}>
                        Ошибка оплаты
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                        Не удалось подтвердить платёж. Пожалуйста, свяжитесь с репетитором.
                    </Typography>
                    <Button variant="contained" onClick={() => navigate('/parent/dashboard')}>
                        Вернуться в кабинет
                    </Button>
                </Paper>
            </Box>
        );
    }
    
    return (
        <Box sx={{ p: 3, maxWidth: 500, mx: 'auto', mt: 8 }}>
            <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 4 }}>
                <CheckCircle sx={{ fontSize: 60, color: '#10B981', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, color: '#10B981' }}>
                    Оплата прошла успешно!
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                    Сейчас вы будете перенаправлены в кабинет родителя.
                </Typography>
                <CircularProgress size={24} />
            </Paper>
        </Box>
    );
}

export default PaymentCallback;