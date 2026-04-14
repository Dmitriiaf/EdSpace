import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Box, TextField, Button, Typography,
    Paper, Alert, CircularProgress, InputAdornment,
    IconButton, Avatar
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
import axios from 'axios';

function CompleteRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [invitationData, setInvitationData] = useState(null);
    
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
            const response = await axios.get(`http://localhost:8080/api/invitations/validate?token=${token}`);
            setInvitationData(response.data);
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
            await axios.post('http://localhost:8080/api/invitations/complete-student', {
                token,
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
                <Paper elevation={3} sx={{ p: 5, mt: 8, textAlign: 'center', borderRadius: 4 }}>
                    <Avatar sx={{ bgcolor: '#10B981', width: 80, height: 80, mx: 'auto', mb: 2 }}>
                        <SchoolIcon sx={{ fontSize: 48 }} />
                    </Avatar>
                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#10B981', mb: 2 }}>
                        🎉 Готово!
                    </Typography>
                    <Typography variant="body1" sx={{ mb: 3 }}>
                        Регистрация успешно завершена! Сейчас вы будете перенаправлены на страницу входа.
                    </Typography>
                    <CircularProgress size={24} />
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="sm">
            <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 4 }}>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Avatar sx={{ bgcolor: '#6366F1', width: 70, height: 70, mx: 'auto', mb: 2 }}>
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
                    <Alert severity="error" sx={{ mb: 3 }}>
                        {error}
                    </Alert>
                )}

                <Box sx={{ bgcolor: '#F3F4F6', p: 2, borderRadius: 2, mb: 3 }}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon sx={{ fontSize: 18, color: '#6366F1' }} />
                        <strong>{invitationData?.email}</strong>
                    </Typography>
                    {invitationData?.studentName && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                            <PersonIcon sx={{ fontSize: 18, color: '#6366F1' }} />
                            {invitationData.studentName}
                        </Typography>
                    )}
                </Box>

                <form onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Телефон (необязательно)"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        margin="normal"
                        placeholder="+7 (999) 123-45-67"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <PhoneIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Дата рождения (необязательно)"
                        name="birthday"
                        type="date"
                        value={formData.birthday}
                        onChange={handleChange}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <CakeIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Придумайте пароль"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
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
                    />

                    <TextField
                        fullWidth
                        label="Подтвердите пароль"
                        name="confirmPassword"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        margin="normal"
                        required
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={submitting}
                        sx={{
                            mt: 3,
                            py: 1.5,
                            bgcolor: '#6366F1',
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#4F46E5' }
                        }}
                    >
                        {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Завершить регистрацию'}
                    </Button>
                </form>
            </Paper>
        </Container>
    );
}

export default CompleteRegistration;