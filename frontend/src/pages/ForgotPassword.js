import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Paper, Alert, CircularProgress, InputAdornment } from '@mui/material';
import { Email as EmailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
// ✅ Правильный импорт
import axiosInstance from '../api/axiosConfig';

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault(); 
        setLoading(true); 
        setError(''); 
        setSuccess(false);
        try {
            await axiosInstance.post('/auth/forgot-password', { email });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при отправке запроса');
        } finally { 
            setLoading(false); 
        }
    };

    if (success) return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 5, mt: 8, textAlign: 'center', borderRadius: 4 }}>
                <Box sx={{ fontSize: 60, mb: 2 }}>📧</Box>
                <Typography variant="h4" sx={{ fontWeight: 600, color: '#10B981', mb: 2 }}>
                    Письмо отправлено!
                </Typography>
                <Typography sx={{ mb: 3 }}>
                    Инструкция отправлена на <strong>{email}</strong>.
                </Typography>
                <Button component={Link} to="/login" variant="outlined" startIcon={<ArrowBackIcon />}>
                    Вернуться ко входу
                </Button>
            </Paper>
        </Container>
    );

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                        Восстановление пароля
                    </Typography>
                </Box>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                <form onSubmit={handleSubmit}>
                    <TextField 
                        fullWidth 
                        label="Email" 
                        type="email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)} 
                        margin="normal" 
                        required
                        InputProps={{ 
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ) 
                        }} 
                    />
                    <Button 
                        type="submit" 
                        fullWidth 
                        variant="contained" 
                        disabled={loading}
                        sx={{ 
                            mt: 3, 
                            py: 1.5, 
                            bgcolor: '#F59E0B', 
                            borderRadius: 2, 
                            textTransform: 'none', 
                            fontWeight: 600, 
                            '&:hover': { bgcolor: '#D97706' } 
                        }}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Отправить инструкцию'}
                    </Button>
                    <Box sx={{ textAlign: 'center', mt: 3 }}>
                        <Button component={Link} to="/login" startIcon={<ArrowBackIcon />} sx={{ textTransform: 'none' }}>
                            Вернуться ко входу
                        </Button>
                    </Box>
                </form>
            </Paper>
        </Container>
    );
}

export default ForgotPassword;