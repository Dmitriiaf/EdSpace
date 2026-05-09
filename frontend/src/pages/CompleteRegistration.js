import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Box, TextField, Button, Typography,
    Paper, Alert, CircularProgress, InputAdornment,
    IconButton, Avatar, Stack
} from '@mui/material';
import {
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Cake as CakeIcon,
    Lock as LockIcon,
    Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

function CompleteRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [invitationData, setInvitationData] = useState(null);
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({
        phone: '',
        birthday: '',
        password: '',
        confirmPassword: ''
    });

    const token = new URLSearchParams(location.search).get('token');

    useEffect(() => {
        if (!token) {
            setError('Токен приглашения не найден');
            setLoading(false);
            return;
        }
        validateToken();
    }, [token]);

    const validateToken = async () => {
        try {
            const response = await axiosInstance.get(`/invitations/validate?token=${token}`);
            setInvitationData(response.data);
            // Если email уже есть в приглашении — заполняем
            if (response.data.email && response.data.email !== 'pending') {
                setEmail(response.data.email);
            }
            if (response.data.studentName) {
                setFullName(response.data.studentName);
            }
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Недействительное приглашение');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!fullName.trim()) {
            setError('Введите ваше имя');
            return;
        }
        if (!email.trim()) {
            setError('Введите email');
            return;
        }
        if (formData.password !== formData.confirmPassword) {
            setError('Пароли не совпадают');
            return;
        }
        if (formData.password.length < 6) {
            setError('Пароль должен быть не менее 6 символов');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await axiosInstance.post('/invitations/complete-student', {
                token,
                fullName: fullName,
                email: email,
                phone: formData.phone,
                birthday: formData.birthday,
                password: formData.password
            });
            
            setSuccess(true);
            setTimeout(() => {
                navigate('/student-login');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при завершении регистрации');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Container maxWidth="sm">
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                    <CircularProgress />
                </Box>
            </Container>
        );
    }

    if (success) {
        return (
            <Container maxWidth="sm">
                <Paper elevation={0} sx={{ p: 5, mt: 8, textAlign: 'center', borderRadius: 4, border: '1px solid #E5E7EB' }}>
                    <Avatar sx={{ bgcolor: '#10B981', width: 80, height: 80, mx: 'auto', mb: 2 }}>
                        <SchoolIcon sx={{ fontSize: 48 }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#10B981', mb: 2 }}>
                        🎉 Готово!
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3, color: '#6B7280' }}>
                        Регистрация успешно завершена! Сейчас вы будете перенаправлены на страницу входа.
                    </Typography>
                    <CircularProgress size={24} />
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={0} sx={{ p: 4, mt: 4, borderRadius: 4, border: '1px solid #E5E7EB' }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar sx={{ bgcolor: '#4F46E5', width: 70, height: 70, mx: 'auto', mb: 2 }}>
                        <SchoolIcon sx={{ fontSize: 40 }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: '#1F2937' }}>
                        Завершение регистрации
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#6B7280', mt: 1 }}>
                        {invitationData?.tutorName && (
                            <>Репетитор: <strong>{invitationData.tutorName}</strong></>
                        )}
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            label="Ваше имя *"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonIcon sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />

                        <TextField
                            fullWidth
                            label="Email *"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={!!invitationData?.email && invitationData.email !== 'pending'}
                            helperText={invitationData?.email && invitationData.email !== 'pending' ? 'Email из приглашения' : 'Введите ваш email'}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <EmailIcon sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />

                        <TextField
                            fullWidth
                            label="Телефон (необязательно)"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+7 (999) 123-45-67"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PhoneIcon sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />

                        <TextField
                            fullWidth
                            label="Дата рождения (необязательно)"
                            name="birthday"
                            type="date"
                            value={formData.birthday}
                            onChange={handleChange}
                            InputLabelProps={{ shrink: true }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CakeIcon sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />

                        <TextField
                            fullWidth
                            label="Придумайте пароль *"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            helperText="Минимум 6 символов"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                                        </IconButton>
                                    </InputAdornment>
                                )
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />

                        <TextField
                            fullWidth
                            label="Подтвердите пароль *"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockIcon sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                        />

                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={submitting}
                            sx={{
                                mt: 2,
                                py: 1.8,
                                bgcolor: '#4F46E5',
                                borderRadius: '12px',
                                textTransform: 'none',
                                fontSize: '1rem',
                                fontWeight: 600,
                                '&:hover': { bgcolor: '#4338CA' }
                            }}
                        >
                            {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Завершить регистрацию'}
                        </Button>
                    </Stack>
                </form>
            </Paper>
        </Container>
    );
}

export default CompleteRegistration;