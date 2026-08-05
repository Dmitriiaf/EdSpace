// ========== frontend/src/pages/Register.js ==========
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Stack, TextField, Button, Typography,
    InputAdornment, IconButton, Alert, CircularProgress,
    Divider, Fade, Checkbox, FormControlLabel
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward,
    Person, AutoAwesome, CheckCircle, Refresh, ArrowBack, Stars
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== АНИМАЦИИ ==========
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const shimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

const glow = keyframes`
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.15); }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
`;

const pulse = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.15); }
    50% { box-shadow: 0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(139,92,246,0.15); }
`;

const shake = keyframes`
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
`;

const particleFloat = keyframes`
    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-120px) translateX(40px); opacity: 0; }
`;

const orbit = keyframes`
    from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
`;

// ========== ЦВЕТА ==========
const INDIGO = '#6366F1';
const VIOLET = '#8B5CF6';
const CYAN = '#22D3EE';
const EMERALD = '#10B981';
const EMERALD_DARK = '#059669';
const BG = '#030712';
const SURFACE = 'rgba(255,255,255,0.03)';
const SURFACE_HOVER = 'rgba(255,255,255,0.06)';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER_HOVER = 'rgba(255,255,255,0.12)';
const TEXT_PRIMARY = '#FFFFFF';
const TEXT_SECONDARY = 'rgba(255,255,255,0.5)';
const TEXT_TERTIARY = 'rgba(255,255,255,0.3)';

// ========== ДЕКОРАТИВНЫЕ ЧАСТИЦЫ ==========
const Particle = styled(Box)(({ delay, left, size, color }) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '50%',
    background: color,
    left: `${left}%`,
    bottom: '-10px',
    animation: `${particleFloat} 4s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
    filter: 'blur(1px)',
}));

const Particles = () => (
    <Box sx={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
        {[...Array(20)].map((_, i) => (
            <Particle
                key={i}
                delay={Math.random() * 4}
                left={Math.random() * 100}
                size={2 + Math.random() * 4}
                color={i % 3 === 0 ? INDIGO : i % 3 === 1 ? VIOLET : CYAN}
            />
        ))}
    </Box>
);

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========
const PageWrapper = styled(Box)({
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    background: `
        radial-gradient(ellipse 80% 60% at 50% -20%, rgba(99,102,241,0.15), transparent),
        radial-gradient(ellipse 60% 50% at 80% 80%, rgba(139,92,246,0.1), transparent),
        radial-gradient(ellipse 40% 40% at 20% 70%, rgba(34,211,238,0.06), transparent),
        #030712
    `,
    position: 'relative',
    overflow: 'hidden',
});

const GlassCard = styled(Box)({
    width: '100%',
    maxWidth: 450,
    padding: '48px 44px',
    borderRadius: 36,
    backdropFilter: 'blur(40px)',
    background: 'rgba(15,15,25,0.6)',
    border: '1px solid rgba(255,255,255,0.06)',
    boxShadow: `
        0 32px 80px rgba(0,0,0,0.5),
        0 0 120px rgba(99,102,241,0.05),
        inset 0 1px 0 rgba(255,255,255,0.03)
    `,
    animation: `${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
    position: 'relative',
    zIndex: 1,
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: -1,
        borderRadius: 36,
        padding: 1,
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), transparent 40%, transparent 60%, rgba(16,185,129,0.15))',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        pointerEvents: 'none',
    },
});

const LogoBox = styled(Box)({
    width: 64,
    height: 64,
    borderRadius: 22,
    background: 'linear-gradient(135deg, #10B981, #059669, #10B981)',
    backgroundSize: '200% 200%',
    animation: `${shimmer} 3s ease infinite, ${pulse} 2s ease-in-out infinite`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 28px',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: -4,
        borderRadius: 26,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.4), rgba(5,150,105,0.2))',
        filter: 'blur(12px)',
        zIndex: -1,
        animation: `${glow} 2s ease-in-out infinite`,
    },
});

const StyledInput = styled(TextField)({
    marginBottom: 18,
    '& .MuiOutlinedInput-root': {
        borderRadius: 18,
        background: 'rgba(255,255,255,0.02)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        fontSize: '0.95rem',
        '& fieldset': {
            borderColor: 'rgba(255,255,255,0.06)',
            borderWidth: 1,
        },
        '&:hover fieldset': {
            borderColor: 'rgba(255,255,255,0.12)',
        },
        '&.Mui-focused': {
            background: 'rgba(16,185,129,0.04)',
            '& fieldset': {
                borderColor: EMERALD,
                borderWidth: 1.5,
                boxShadow: '0 0 0 4px rgba(16,185,129,0.08), 0 0 20px rgba(16,185,129,0.06)',
            },
        },
        '&.Mui-error fieldset': {
            borderColor: '#EF4444',
            boxShadow: '0 0 0 4px rgba(239,68,68,0.08)',
        },
    },
    '& .MuiInputBase-input': {
        padding: '15px 18px',
        color: TEXT_PRIMARY,
        '&::placeholder': { color: TEXT_TERTIARY, opacity: 1 },
    },
    '& .MuiInputAdornment-root': { color: TEXT_TERTIARY },
});

const SubmitButton = styled(Button)({
    height: 54,
    borderRadius: 18,
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    letterSpacing: '-0.01em',
    background: 'linear-gradient(135deg, #10B981, #059669, #10B981)',
    backgroundSize: '200% 200%',
    animation: `${shimmer} 4s ease infinite`,
    boxShadow: '0 8px 32px rgba(16,185,129,0.25), 0 0 60px rgba(16,185,129,0.1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        transition: 'left 0.7s ease',
    },
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 16px 40px rgba(16,185,129,0.35), 0 0 80px rgba(16,185,129,0.15)',
        '&::before': { left: '100%' },
    },
    '&:active': { transform: 'scale(0.97)' },
    '&.Mui-disabled': {
        background: 'rgba(255,255,255,0.05)',
        color: TEXT_TERTIARY,
        boxShadow: 'none',
        animation: 'none',
    },
});

const OAuthButton = styled(Button)({
    height: 50,
    borderRadius: 16,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.9rem',
    background: 'rgba(255,255,255,0.02)',
    color: TEXT_PRIMARY,
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), transparent)',
        opacity: 0,
        transition: 'opacity 0.3s ease',
    },
    '&:hover': {
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(255,255,255,0.14)',
        transform: 'translateY(-1px)',
        '&::after': { opacity: 1 },
    },
});

const TextLink = styled(Button)({
    color: EMERALD,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.85rem',
    padding: 0,
    minWidth: 'auto',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -1,
        left: 0,
        width: '100%',
        height: 1,
        background: 'linear-gradient(90deg, #10B981, #059669)',
        transform: 'scaleX(0)',
        transformOrigin: 'right',
        transition: 'transform 0.3s ease',
    },
    '&:hover': {
        color: '#34D399',
        background: 'transparent',
        '&::after': {
            transform: 'scaleX(1)',
            transformOrigin: 'left',
        },
    },
});

const CodeInput = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: 18,
        background: 'rgba(255,255,255,0.02)',
        '& fieldset': { borderColor: 'rgba(255,255,255,0.06)', borderWidth: 1 },
        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.12)' },
        '&.Mui-focused fieldset': {
            borderColor: EMERALD,
            borderWidth: 1.5,
            boxShadow: '0 0 0 4px rgba(16,185,129,0.08)',
        },
        '&.Mui-error fieldset': {
            borderColor: '#EF4444',
            animation: `${shake} 0.4s ease`,
        },
    },
    '& input': {
        fontSize: '28px',
        fontWeight: 700,
        letterSpacing: '12px',
        textAlign: 'center',
        padding: '16px 12px',
        fontFamily: '"SF Mono", "Fira Code", monospace',
        color: TEXT_PRIMARY,
        caretColor: EMERALD,
    },
});

const EmailBadge = styled(Box)({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    background: 'rgba(16,185,129,0.1)',
    color: '#34D399',
    padding: '8px 16px',
    borderRadius: 12,
    fontSize: '0.85rem',
    fontWeight: 500,
    border: '1px solid rgba(16,185,129,0.2)',
});

// ========== КОМПОНЕНТ ==========
const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [shakeForm, setShakeForm] = useState(false);
    const [isFocused, setIsFocused] = useState({ fullName: false, email: false, password: false });

    // Шаг 2
    const [verificationCode, setVerificationCode] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');

    const codeInputRef = useRef(null);

    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) interval = setInterval(() => setTimer(t => t - 1), 1000);
        if (timer === 0) setCanResend(true);
        return () => clearInterval(interval);
    }, [step, timer]);

    useEffect(() => {
        if (step === 2 && codeInputRef.current) {
            setTimeout(() => codeInputRef.current?.focus(), 300);
        }
    }, [step]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) { setError('Укажите имя и фамилию'); return false; }
        if (!formData.email.includes('@') || !formData.email.includes('.')) { setError('Проверьте email — кажется, там опечатка'); return false; }
        if (formData.password.length < 6) { setError('Пароль должен быть минимум 6 символов'); return false; }
        if (!agree) { setError('Нужно принять условия использования'); return false; }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setShakeForm(true);
            setTimeout(() => setShakeForm(false), 400);
            return;
        }

        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const params = new URLSearchParams(window.location.search);
            const refCode = params.get('ref') || '';

            const response = await axiosInstance.post('/auth/register', {
                fullName: formData.fullName.trim(),
                email: formData.email.trim().toLowerCase(),
                password: formData.password,
                timezone,
                ref: refCode,
            });

            if (response.data.requiresVerification) {
                setRegisteredEmail(formData.email.trim().toLowerCase());
                setStep(2);
                setTimer(120);
                setCanResend(false);
                setVerificationCode('');
            } else {
                const result = await register(formData.fullName.trim(), formData.email.trim().toLowerCase(), formData.password, timezone, refCode);
                if (result?.error) setError(result.error);
                else navigate('/onboarding', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Что-то пошло не так. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyCode = async () => {
        if (verificationCode.length !== 6) {
            setCodeError(true);
            setError('Введите все 6 цифр');
            return;
        }

        setLoading(true);
        setError('');
        setCodeError(false);

        try {
            const response = await axiosInstance.post('/auth/verify-email', {
                email: registeredEmail,
                code: verificationCode,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.data.id,
                email: response.data.email,
                fullName: response.data.fullName,
                role: 'tutor',
            }));

            navigate('/onboarding', { replace: true });
        } catch (err) {
            setError(err.response?.data?.error || 'Неверный код. Проверьте и попробуйте снова.');
            setCodeError(true);
            setVerificationCode('');
            codeInputRef.current?.focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        setError('');
        try {
            await axiosInstance.post('/auth/resend-code', { email: registeredEmail });
            setTimer(120);
            setCanResend(false);
            setSuccess('Новый код отправлен! Проверьте почту.');
            setVerificationCode('');
            codeInputRef.current?.focus();
        } catch {
            setError('Не получилось отправить код. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const handleCodeChange = (e) => {
        const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 6);
        setVerificationCode(val);
        if (codeError && val.length === 6) setCodeError(false);
        if (error) setError('');
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const digits = pasted.replace(/[^0-9]/g, '').substring(0, 6);
        setVerificationCode(digits);
        if (digits.length === 6) setCodeError(false);
    };

    const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

    return (
        <PageWrapper>
            <Particles />

            {/* Орбитальное кольцо */}
            <Box sx={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                border: '1px solid rgba(16,185,129,0.08)',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                zIndex: 0,
            }}>
                <Box sx={{
                    position: 'absolute',
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: EMERALD,
                    boxShadow: '0 0 12px rgba(16,185,129,0.8)',
                    animation: `${orbit} 8s linear infinite`,
                }} />
            </Box>

            <GlassCard sx={{ 
                animation: shakeForm 
                    ? `${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1), ${shake} 0.4s ease` 
                    : `${fadeIn} 0.6s cubic-bezier(0.16, 1, 0.3, 1)`,
            }}>
                {step === 1 ? (
                    <>
                        {/* Логотип */}
                        <LogoBox>
                            <AutoAwesome sx={{ fontSize: 30, color: '#fff', animation: `${float} 3s ease-in-out infinite` }} />
                        </LogoBox>

                        {/* Заголовок */}
                        <Typography sx={{
                            fontSize: '1.6rem', fontWeight: 800, color: TEXT_PRIMARY,
                            textAlign: 'center', mb: 0.5, letterSpacing: '-0.03em',
                        }}>
                            Создать аккаунт
                        </Typography>
                        <Typography sx={{
                            color: TEXT_SECONDARY, fontSize: '0.9rem',
                            textAlign: 'center', mb: 4,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                        }}>
                            <Stars sx={{ fontSize: 16, color: EMERALD }} />
                            Бесплатно 14 дней, потом 499 ₽/мес
                            <Stars sx={{ fontSize: 16, color: CYAN }} />
                        </Typography>

                        {/* OAuth */}
                        <Stack spacing={1.5} sx={{ mb: 2.5 }}>
                            <OAuthButton
                                fullWidth
                                onClick={() => window.location.href = 'https://ed-space.ru/api/auth/vk/login'}                                startIcon={
                                    <Box component="img" src="/vk.svg" sx={{ width: 20, height: 20, filter: 'brightness(1.2)' }} />
                                }
                            >
                                Продолжить через VK
                            </OAuthButton>
                            <OAuthButton
                                fullWidth
                                onClick={() => window.location.href = 'https://ed-space.ru/api/auth/yandex/login'}
                                startIcon={
                                    <Box component="img" src="/yandex.svg" sx={{ width: 20, height: 20, filter: 'brightness(1.2)' }} />
                                }
                            >
                                Продолжить через Яндекс
                            </OAuthButton>
                        </Stack>

                        <Typography sx={{ textAlign: 'center', color: TEXT_TERTIARY, fontSize: '0.75rem', mb: 2.5 }}>
                            Без пароля, в один клик
                        </Typography>

                        <Divider sx={{ mb: 2.5, '&::before, &::after': { borderColor: 'rgba(255,255,255,0.06)' } }}>
                            <Typography sx={{ color: TEXT_TERTIARY, fontSize: '0.75rem', px: 2.5, letterSpacing: '0.03em' }}>
                                или по email
                            </Typography>
                        </Divider>

                        {error && (
                            <Fade in>
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3, borderRadius: 3,
                                        background: 'rgba(239,68,68,0.06)',
                                        color: '#FCA5A5',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                        backdropFilter: 'blur(20px)',
                                        '& .MuiAlert-icon': { color: '#EF4444' },
                                        animation: `${fadeIn} 0.3s ease`,
                                    }}
                                    onClose={() => setError('')}
                                >
                                    {error}
                                </Alert>
                            </Fade>
                        )}

                        <form onSubmit={handleSubmit} noValidate>
                            <Box sx={{ position: 'relative' }}>
                                <StyledInput
                                    fullWidth
                                    placeholder="Имя и фамилия"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused(f => ({ ...f, fullName: true }))}
                                    onBlur={() => setIsFocused(f => ({ ...f, fullName: false }))}
                                    autoComplete="name"
                                    autoFocus
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person sx={{ 
                                                    fontSize: 20,
                                                    color: isFocused.fullName ? EMERALD : TEXT_TERTIARY,
                                                    transition: 'color 0.3s ease',
                                                }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Box sx={{ position: 'relative' }}>
                                <StyledInput
                                    fullWidth
                                    placeholder="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused(f => ({ ...f, email: true }))}
                                    onBlur={() => setIsFocused(f => ({ ...f, email: false }))}
                                    autoComplete="email"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Email sx={{ 
                                                    fontSize: 20,
                                                    color: isFocused.email ? EMERALD : TEXT_TERTIARY,
                                                    transition: 'color 0.3s ease',
                                                }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <Box sx={{ position: 'relative' }}>
                                <StyledInput
                                    fullWidth
                                    placeholder="Пароль (от 6 символов)"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    onFocus={() => setIsFocused(f => ({ ...f, password: true }))}
                                    onBlur={() => setIsFocused(f => ({ ...f, password: false }))}
                                    autoComplete="new-password"
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Lock sx={{ 
                                                    fontSize: 20,
                                                    color: isFocused.password ? EMERALD : TEXT_TERTIARY,
                                                    transition: 'color 0.3s ease',
                                                }} />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    sx={{ color: TEXT_TERTIARY, '&:hover': { color: TEXT_PRIMARY } }}
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Box>

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={agree}
                                        onChange={(e) => setAgree(e.target.checked)}
                                        sx={{
                                            color: 'rgba(255,255,255,0.12)',
                                            '&.Mui-checked': { color: EMERALD },
                                        }}
                                    />
                                }
                                label={
                                    <Typography sx={{ fontSize: '0.8rem', color: TEXT_SECONDARY }}>
                                        Принимаю{' '}
                                        <Box
                                            component="a"
                                            href="/privacy"
                                            target="_blank"
                                            sx={{
                                                color: EMERALD,
                                                textDecoration: 'underline',
                                                textUnderlineOffset: 2,
                                                '&:hover': { color: '#34D399' },
                                            }}
                                        >
                                            условия использования
                                        </Box>
                                    </Typography>
                                }
                                sx={{ mb: 3, ml: -1 }}
                            />

                            <SubmitButton type="submit" fullWidth disabled={loading}>
                                {loading ? (
                                    <CircularProgress size={22} sx={{ color: '#fff' }} />
                                ) : (
                                    <>
                                        Создать аккаунт
                                        <ArrowForward sx={{ ml: 1.5, fontSize: 20, animation: `${float} 2s ease-in-out infinite` }} />
                                    </>
                                )}
                            </SubmitButton>
                        </form>

                        <Box sx={{ textAlign: 'center', mt: 3.5 }}>
                            <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.86rem', display: 'inline' }}>
                                Уже есть аккаунт?{' '}
                            </Typography>
                            <TextLink onClick={() => navigate('/login')}>
                                Войти
                            </TextLink>
                        </Box>
                    </>
                ) : (
                    <>
                        <IconButton
                            onClick={() => { setStep(1); setError(''); setSuccess(''); }}
                            sx={{ color: TEXT_SECONDARY, mb: 3, '&:hover': { color: TEXT_PRIMARY } }}
                        >
                            <ArrowBack />
                        </IconButton>

                        <Typography sx={{
                            fontSize: '1.5rem', fontWeight: 800, color: TEXT_PRIMARY,
                            mb: 1, letterSpacing: '-0.02em',
                        }}>
                            Код из письма
                        </Typography>

                        <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.9rem', mb: 3 }}>
                            Мы отправили 6 цифр на
                        </Typography>

                        <EmailBadge sx={{ mb: 4 }}>
                            <Email sx={{ fontSize: 14 }} />
                            {registeredEmail}
                        </EmailBadge>

                        {error && (
                            <Fade in>
                                <Alert
                                    severity="error"
                                    sx={{
                                        mb: 3, borderRadius: 3,
                                        background: 'rgba(239,68,68,0.06)',
                                        color: '#FCA5A5',
                                        border: '1px solid rgba(239,68,68,0.15)',
                                        '& .MuiAlert-icon': { color: '#EF4444' },
                                    }}
                                >
                                    {error}
                                </Alert>
                            </Fade>
                        )}

                        {success && (
                            <Fade in>
                                <Alert
                                    severity="success"
                                    sx={{
                                        mb: 3, borderRadius: 3,
                                        background: 'rgba(16,185,129,0.06)',
                                        color: '#6EE7B7',
                                        border: '1px solid rgba(16,185,129,0.15)',
                                        '& .MuiAlert-icon': { color: EMERALD },
                                    }}
                                >
                                    {success}
                                </Alert>
                            </Fade>
                        )}

                        <CodeInput
                            fullWidth
                            value={verificationCode}
                            onChange={handleCodeChange}
                            onPaste={handlePaste}
                            placeholder="000000"
                            inputProps={{
                                maxLength: 6,
                                inputMode: 'numeric',
                                autoComplete: 'one-time-code',
                                ref: codeInputRef,
                            }}
                            error={codeError}
                            sx={{ mb: 2 }}
                        />

                        <Typography sx={{ textAlign: 'center', color: TEXT_TERTIARY, fontSize: '0.8rem', mb: 3 }}>
                            {verificationCode.length}/6 цифр
                        </Typography>

                        <SubmitButton
                            fullWidth
                            disabled={loading || verificationCode.length !== 6}
                            onClick={handleVerifyCode}
                            sx={{ mb: 2 }}
                        >
                            {loading ? (
                                <CircularProgress size={22} sx={{ color: '#fff' }} />
                            ) : (
                                <>
                                    Подтвердить
                                    <CheckCircle sx={{ ml: 1.5, fontSize: 20 }} />
                                </>
                            )}
                        </SubmitButton>

                        <Box sx={{ textAlign: 'center' }}>
                            {canResend ? (
                                <TextLink onClick={handleResendCode} disabled={loading} startIcon={<Refresh />}>
                                    Отправить новый код
                                </TextLink>
                            ) : (
                                <Typography sx={{ color: TEXT_TERTIARY, fontSize: '0.8rem' }}>
                                    Повторно через {formatTime(timer)}
                                </Typography>
                            )}
                        </Box>
                    </>
                )}
            </GlassCard>
        </PageWrapper>
    );
};

export default Register;