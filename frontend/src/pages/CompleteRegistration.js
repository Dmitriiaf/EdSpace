import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container, Box, TextField, Button, Typography,
    Paper, Alert, CircularProgress, InputAdornment,
    IconButton, Avatar, Stack
} from '@mui/material';
import {
    Person as PersonIcon, Email as EmailIcon,
    Phone as PhoneIcon, Cake as CakeIcon,
    Lock as LockIcon, Visibility as VisibilityIcon,
    VisibilityOff as VisibilityOffIcon, School as SchoolIcon,
    ArrowBack, CheckCircle, Refresh
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

function CompleteRegistration() {
    const navigate = useNavigate();
    const location = useLocation();
    const token = new URLSearchParams(location.search).get('token');

    const [step, setStep] = useState(1); // 1 = форма, 2 = код
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [invitationData, setInvitationData] = useState(null);
    
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [formData, setFormData] = useState({
        phone: '', birthday: '', password: '', confirmPassword: ''
    });

    // Шаг 2
    const [verificationCode, setVerificationCode] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Токен приглашения не найден');
            setLoading(false);
            return;
        }
        validateToken();
    }, [token]);

    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        if (timer === 0) setCanResend(true);
        return () => clearInterval(interval);
    }, [step, timer]);

    const validateToken = async () => {
        try {
            const response = await axiosInstance.get(`/invitations/validate?token=${token}`);
            setInvitationData(response.data);
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

    const handleCodeChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
        setVerificationCode(val);
        if (codeError && val.length === 6) setCodeError(false);
    };

    // Шаг 1: Отправить данные и получить код
    const handleSendCode = async (e) => {
        e.preventDefault();
        
        if (!fullName.trim()) { setError('Введите ваше имя'); return; }
        if (!email.trim()) { setError('Введите email'); return; }
        if (formData.password !== formData.confirmPassword) { setError('Пароли не совпадают'); return; }
        if (formData.password.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }

        setSubmitting(true);
        setError('');

        try {
            await axiosInstance.post('/invitations/send-verification-code', {
                token, email, fullName: fullName
            });
            setStep(2);
            setTimer(60);
            setCanResend(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка отправки кода');
        } finally {
            setSubmitting(false);
        }
    };

    // Шаг 2: Подтвердить код
    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            setCodeError(true);
            setError('Введите 6-значный код');
            return;
        }
        setSubmitting(true);
        setError('');
        setCodeError(false);

        try {
            await axiosInstance.post('/invitations/verify-and-complete', {
                token, code: verificationCode,
                phone: formData.phone,
                birthday: formData.birthday,
                password: formData.password
            });
            setSuccess(true);
            setTimeout(() => navigate('/student-login'), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Неверный код');
            setCodeError(true);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResendCode = async () => {
        setSubmitting(true);
        setError('');
        try {
            await axiosInstance.post('/invitations/send-verification-code', {
                token, email, fullName: fullName
            });
            setTimer(60);
            setCanResend(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка отправки кода');
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
                {step === 1 ? (
                    <>
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

                        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '8px' }}>{error}</Alert>}

                        <form onSubmit={handleSendCode}>
                            <Stack spacing={2}>
                                <TextField fullWidth label="Ваше имя *" value={fullName}
                                    onChange={(e) => setFullName(e.target.value)} required
                                    InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

                                <TextField fullWidth label="Email *" type="email" value={email}
                                    onChange={(e) => setEmail(e.target.value)} required
                                    disabled={!!invitationData?.email && invitationData.email !== 'pending'}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

                                <TextField fullWidth label="Телефон (необязательно)" name="phone"
                                    value={formData.phone} onChange={handleChange}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

                                <TextField fullWidth label="Дата рождения (необязательно)" name="birthday"
                                    type="date" value={formData.birthday} onChange={handleChange} InputLabelProps={{ shrink: true }}
                                    InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

                                <TextField fullWidth label="Придумайте пароль *" name="password"
                                    type={showPassword ? 'text' : 'password'} value={formData.password}
                                    onChange={handleChange} required helperText="Минимум 6 символов"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                                        endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}</IconButton></InputAdornment>
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

                                <TextField fullWidth label="Подтвердите пароль *" name="confirmPassword"
                                    type="password" value={formData.confirmPassword} onChange={handleChange} required
                                    InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />

                                <Button type="submit" fullWidth variant="contained" disabled={submitting}
                                    sx={{ mt: 2, py: 1.8, bgcolor: '#4F46E5', borderRadius: '12px', textTransform: 'none', fontSize: '1rem', fontWeight: 600, '&:hover': { bgcolor: '#4338CA' } }}>
                                    {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Получить код подтверждения'}
                                </Button>
                            </Stack>
                        </form>
                    </>
                ) : (
                    <>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <IconButton onClick={() => setStep(1)} sx={{ mr: 1 }}><ArrowBack /></IconButton>
                            <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, color: '#1F2937' }}>
                                Подтверждение email
                            </Typography>
                        </Box>

                        <Typography sx={{ color: '#6B7280', mb: 3, fontSize: '0.9rem' }}>
                            Введите 6-значный код, отправленный на <strong>{email}</strong>
                        </Typography>

                        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 3 }}>{error}</Alert>}

                        <TextField
                            fullWidth value={verificationCode} onChange={handleCodeChange}
                            placeholder="000000" error={codeError} autoFocus
                            inputProps={{ maxLength: 6, inputMode: 'numeric', autoComplete: 'one-time-code' }}
                            sx={{
                                mb: 3,
                                '& .MuiOutlinedInput-root': { borderRadius: '14px', backgroundColor: '#F3F4F6' },
                                '& input': { fontSize: '28px', fontWeight: 700, letterSpacing: '12px', textAlign: 'center', padding: '16px', fontFamily: 'monospace' },
                            }}
                        />

                        <Button fullWidth variant="contained"
                            disabled={submitting || verificationCode.length !== 6}
                            onClick={handleVerifyCode}
                            endIcon={!submitting && <CheckCircle />}
                            sx={{ bgcolor: '#4F46E5', borderRadius: '14px', py: 1.8, textTransform: 'none', fontWeight: 600, fontSize: '1rem', mb: 2 }}>
                            {submitting ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Подтвердить'}
                        </Button>

                        <Typography sx={{ textAlign: 'center', fontSize: '13px', color: '#6B7280' }}>
                            {canResend ? (
                                <Button onClick={handleResendCode} disabled={submitting} startIcon={<Refresh />}
                                    sx={{ color: '#4F46E5', textTransform: 'none', fontWeight: 600 }}>
                                    Отправить код повторно
                                </Button>
                            ) : (
                                `Повторная отправка через ${timer} сек.`
                            )}
                        </Typography>
                    </>
                )}
            </Paper>
        </Container>
    );
}

export default CompleteRegistration;