import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Stack, TextField, Button, Typography, Alert, CircularProgress,
    InputAdornment, IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== ПАЛИТРА (как на лендинге) ==========
const BG = '#FAFAFA';
const BG_ALT = '#F5F5F7';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';

const LIME = '#C4F542';
const LIME_SOFT = '#EBFFB0';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const PINK = '#FF5FA2';
const PINK_SOFT = '#FFE0EE';

// ========== ТИПОГРАФИКА ==========
const T = {
    h2: { fontSize: '1.9rem', lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 800, color: INK },
    body: { fontSize: '0.95rem', lineHeight: 1.6, color: INK_SOFT },
    bodySmall: { fontSize: '0.85rem', lineHeight: 1.55, color: INK_SOFT },
};

// ========== СТИЛИ ==========
const PageWrapper = styled(Box)({
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    background: BG,
    position: 'relative',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    overflow: 'hidden',
});

const StyledCard = styled(Box)({
    width: '100%',
    maxWidth: 440,
    padding: '40px 36px',
    borderRadius: 28,
    background: CARD,
    border: `1px solid ${LINE}`,
    boxShadow: '0 20px 60px -20px rgba(0,0,0,0.12)',
    position: 'relative',
    zIndex: 1,
});

const StyledInput = styled(TextField)({
    marginBottom: 14,
    '& .MuiOutlinedInput-root': {
        borderRadius: 14,
        background: BG_ALT,
        transition: 'all 0.2s ease',
        fontSize: '0.95rem',
        '& fieldset': {
            borderColor: 'transparent',
        },
        '&:hover fieldset': {
            borderColor: LINE,
        },
        '&.Mui-focused': {
            background: CARD,
            '& fieldset': {
                borderColor: INK,
                borderWidth: 1.5,
            },
        },
        '&.Mui-error fieldset': {
            borderColor: '#EF4444',
        },
    },
    '& .MuiInputBase-input': {
        padding: '14px 16px',
        color: INK,
        '&::placeholder': { color: INK_MUTED, opacity: 1 },
    },
    '& .MuiInputAdornment-root': { color: INK_MUTED },
});

const SubmitButton = styled(Button)({
    height: 54,
    borderRadius: 100,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    background: INK,
    color: '#FFF',
    boxShadow: 'none',
    transition: 'all 0.2s ease',
    '&:hover': {
        background: '#000',
        transform: 'translateY(-1px)',
        boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
    },
    '&:active': { transform: 'scale(0.98)' },
    '&.Mui-disabled': {
        background: '#E5E5E5',
        color: INK_MUTED,
        boxShadow: 'none',
    },
});

const TextLink = styled(Button)({
    color: INK_SOFT,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.85rem',
    padding: 0,
    minWidth: 'auto',
    '&:hover': {
        color: INK,
        background: 'transparent',
    },
});

// ========== SPARKLE ==========
const Sparkle = ({ size = 20, color = LIME, style = {} }) => (
    <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, ...style }}>
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill={color} />
    </Box>
);

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
            {/* Декоративные пятна на фоне */}
            <Box sx={{
                position: 'absolute', top: '15%', left: '10%',
                width: 260, height: 260, borderRadius: '50%',
                background: PURPLE_SOFT, filter: 'blur(90px)', opacity: 0.7,
                pointerEvents: 'none',
            }} />
            <Box sx={{
                position: 'absolute', bottom: '12%', right: '8%',
                width: 240, height: 240, borderRadius: '50%',
                background: PINK_SOFT, filter: 'blur(90px)', opacity: 0.7,
                pointerEvents: 'none',
            }} />

            <StyledCard>
                {/* Логотип */}
                <Box sx={{ textAlign: 'center', mb: 3.5, position: 'relative' }}>
                    <Box sx={{ position: 'absolute', top: -6, right: -4 }}>
                        <Sparkle size={20} color={LIME} />
                    </Box>
                    <Typography sx={{
                        fontWeight: 900,
                        fontSize: '1.6rem',
                        color: INK,
                        letterSpacing: '-0.04em',
                        lineHeight: 1,
                        mb: 1,
                    }}>
                        EdSpace
                    </Typography>
                    <Typography sx={{ ...T.body, fontSize: '0.92rem' }}>
                        Вход в личный кабинет
                    </Typography>
                </Box>

                {/* Ошибка */}
                {error && (
                    <Alert
                        severity="error"
                        onClose={() => setError('')}
                        sx={{
                            mb: 2.5, borderRadius: 3,
                            background: '#FEF2F2',
                            color: '#DC2626',
                            border: '1px solid #FECACA',
                            fontSize: '0.88rem',
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
                                    <Email sx={{ fontSize: 19 }} />
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
                                    <Lock sx={{ fontSize: 19 }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        onClick={() => setShowPassword(!showPassword)}
                                        edge="end"
                                        sx={{ color: INK_MUTED, '&:hover': { color: INK } }}
                                    >
                                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{ textAlign: 'right', mb: 2.5, mt: -0.5 }}>
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
                                <ArrowForward sx={{ ml: 1.5, fontSize: 18 }} />
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