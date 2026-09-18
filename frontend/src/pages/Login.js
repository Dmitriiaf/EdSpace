import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Stack, TextField, Button, Typography, Alert, CircularProgress,
    InputAdornment, IconButton, Card
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward, School
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== ЦВЕТА (светлая тема) ==========
const PRIMARY = '#4F46E5';
const PRIMARY_DARK = '#3730A3';
const PRIMARY_LIGHT = '#818CF8';
const BG = '#F8FAFC';
const TEXT = '#1E293B';
const TEXT_DIM = '#64748B';
const BORDER = '#E2E8F0';

// ========== STYLED COMPONENTS ==========
const PageWrapper = styled(Box)({
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    background: `linear-gradient(135deg, #F8FAFC 0%, #EEF2FF 100%)`,
    position: 'relative',
});

const StyledCard = styled(Card)({
    width: '100%',
    maxWidth: 420,
    padding: '48px 40px',
    borderRadius: 24,
    background: '#FFFFFF',
    boxShadow: '0 10px 40px rgba(0,0,0,0.08), 0 0 80px rgba(79,70,229,0.06)',
    border: `1px solid ${BORDER}`,
});

const StyledInput = styled(TextField)({
    marginBottom: 18,
    '& .MuiOutlinedInput-root': {
        borderRadius: 14,
        background: '#F8FAFC',
        transition: 'all 0.3s ease',
        fontSize: '0.95rem',
        '& fieldset': {
            borderColor: BORDER,
        },
        '&:hover fieldset': {
            borderColor: PRIMARY_LIGHT,
        },
        '&.Mui-focused': {
            background: '#FFFFFF',
            '& fieldset': {
                borderColor: PRIMARY,
                borderWidth: 1.5,
                boxShadow: '0 0 0 4px rgba(79,70,229,0.08)',
            },
        },
        '&.Mui-error fieldset': {
            borderColor: '#EF4444',
        },
    },
    '& .MuiInputBase-input': {
        padding: '14px 16px',
        color: TEXT,
        '&::placeholder': { color: '#94A3B8' },
    },
    '& .MuiInputAdornment-root': { color: '#94A3B8' },
});

const SubmitButton = styled(Button)({
    height: 52,
    borderRadius: 14,
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    background: `linear-gradient(135deg, ${PRIMARY}, #7C3AED)`,
    boxShadow: '0 8px 25px rgba(79,70,229,0.3)',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 14px 35px rgba(79,70,229,0.4)',
    },
    '&:active': { transform: 'scale(0.97)' },
    '&.Mui-disabled': {
        background: '#CBD5E1',
        color: '#64748B',
        boxShadow: 'none',
    },
});

const TextLink = styled(Button)({
    color: PRIMARY,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: 0,
    minWidth: 'auto',
    '&:hover': {
        color: PRIMARY_DARK,
        background: 'transparent',
    },
});

// ========== КОМПОНЕНТ ==========
const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const emailRef = useRef(null);

    useEffect(() => {
        setTimeout(() => emailRef.current?.focus(), 400);
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email.includes('@') || !email.includes('.')) {
            setError('Проверьте email — кажется, там опечатка');
            return;
        }
        if (!password || password.length < 3) {
            setError('Введите пароль');
            return;
        }

        setError('');
        setLoading(true);

        try {
            const result = await login(email.trim().toLowerCase(), password);
            if (result?.error) {
                setError(result.error);
            } else {
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData?.role === 'school_admin') {
                    navigate('/admin', { replace: true });
                } else if (userData?.role === 'student') {
                    navigate('/student', { replace: true });
                } else if (userData?.role === 'parent') {
                    navigate('/parent/dashboard', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            }
        } catch {
            setError('Не удалось войти. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageWrapper>
            <StyledCard>
                {/* Логотип */}
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Box sx={{
                        width: 56, height: 56, borderRadius: '18px',
                        background: `linear-gradient(135deg, ${PRIMARY}, #7C3AED)`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mx: 'auto', mb: 2,
                        boxShadow: '0 8px 25px rgba(79,70,229,0.3)',
                    }}>
                        <School sx={{ color: '#fff', fontSize: 26 }} />
                    </Box>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: TEXT, letterSpacing: '-0.03em' }}>
                        EdSpace
                    </Typography>
                    <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem', mt: 0.5 }}>
                        Вход в личный кабинет
                    </Typography>
                </Box>

                {/* Ошибка */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError('')}
                        sx={{
                            mb: 3, borderRadius: 3,
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            '& .MuiAlert-icon': { color: '#DC2626' },
                        }}
                    >
                        {error}
                    </Alert>
                )}

                {/* Форма */}
                <form onSubmit={handleSubmit} noValidate>
                    <StyledInput
                        fullWidth
                        placeholder="Email"
                        name="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        inputRef={emailRef}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Email sx={{ fontSize: 20 }} />
                                </InputAdornment>
                            ),
                        }}
                    />

                    <StyledInput
                        fullWidth
                        placeholder="Пароль"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Lock sx={{ fontSize: 20 }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        sx={{ color: '#94A3B8', '&:hover': { color: TEXT } }}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ textAlign: 'right', mb: 3, mt: -0.5 }}>
                        <TextLink onClick={() => navigate('/forgot-password')}>
                            Забыли пароль?
                        </TextLink>
                    </Box>

                    <SubmitButton type="submit" fullWidth disabled={loading}>
                        {loading ? (
                            <CircularProgress size={22} sx={{ color: '#fff' }} />
                        ) : (
                            <>
                                Войти
                                <ArrowForward sx={{ ml: 1.5, fontSize: 20 }} />
                            </>
                        )}
                    </SubmitButton>
                </form>

                {/* Назад на главную */}
                <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <TextLink onClick={() => navigate('/')}>
                        ← На главную
                    </TextLink>
                </Box>
            </StyledCard>
        </PageWrapper>
    );
};

export default Login;