// ========== frontend/src/pages/Login.js ==========
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, Stack, TextField, Button, Typography, Tabs, Tab,
    InputAdornment, IconButton, Alert, CircularProgress,
    Divider, Fade
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward,
    School, Person, Badge, Stars, AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== АНИМАЦИИ ==========
const fadeIn = keyframes`
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to { opacity: 1; transform: translateY(0) scale(1); }
`;

const glow = keyframes`
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.15); }
`;

const orbit = keyframes`
    from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
`;

const shimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-6px); }
`;

const subtlePulse = keyframes`
    0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.15); }
    50% { box-shadow: 0 0 40px rgba(99,102,241,0.3), 0 0 80px rgba(139,92,246,0.15); }
`;

const particleFloat = keyframes`
    0%, 100% { transform: translateY(0px) translateX(0px); opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { transform: translateY(-120px) translateX(40px); opacity: 0; }
`;

// ========== ЦВЕТА ==========
const INDIGO = '#6366F1';
const VIOLET = '#8B5CF6';
const CYAN = '#22D3EE';
const BG = '#030712';
const SURFACE = 'rgba(255,255,255,0.03)';
const SURFACE_HOVER = 'rgba(255,255,255,0.06)';
const BORDER = 'rgba(255,255,255,0.06)';
const BORDER_HOVER = 'rgba(255,255,255,0.12)';
const BORDER_FOCUS = 'rgba(99,102,241,0.5)';
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
        background: 'linear-gradient(135deg, rgba(99,102,241,0.2), transparent 40%, transparent 60%, rgba(139,92,246,0.15))',
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
    background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #6366F1)',
    backgroundSize: '200% 200%',
    animation: `${shimmer} 3s ease infinite, ${subtlePulse} 2s ease-in-out infinite`,
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
        background: 'linear-gradient(135deg, rgba(99,102,241,0.4), rgba(139,92,246,0.2))',
        filter: 'blur(12px)',
        zIndex: -1,
        animation: `${glow} 2s ease-in-out infinite`,
    },
});

const StyledTabs = styled(Tabs)({
    minHeight: 48,
    marginBottom: 32,
    '& .MuiTabs-flexContainer': {
        padding: 4,
        borderRadius: 15,
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.04)',
        gap: 2,
    },
    '& .MuiTabs-indicator': { display: 'none' },
});

const RoleTab = styled(Tab)({
    minHeight: 40,
    borderRadius: 12,
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.84rem',
    color: TEXT_SECONDARY,
    flex: 1,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'hidden',
    '&.Mui-selected': {
        color: TEXT_PRIMARY,
        background: 'rgba(99,102,241,0.12)',
        '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 20,
            height: 3,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
        },
    },
    '&:hover:not(.Mui-selected)': {
        color: TEXT_PRIMARY,
        background: 'rgba(255,255,255,0.04)',
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
            background: 'rgba(99,102,241,0.04)',
            '& fieldset': {
                borderColor: INDIGO,
                borderWidth: 1.5,
                boxShadow: '0 0 0 4px rgba(99,102,241,0.08), 0 0 20px rgba(99,102,241,0.06)',
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
    background: 'linear-gradient(135deg, #6366F1, #7C3AED, #6366F1)',
    backgroundSize: '200% 200%',
    animation: `${shimmer} 4s ease infinite`,
    boxShadow: '0 8px 32px rgba(99,102,241,0.25), 0 0 60px rgba(99,102,241,0.1)',
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
        boxShadow: '0 16px 40px rgba(99,102,241,0.35), 0 0 80px rgba(99,102,241,0.15)',
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
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08), transparent)',
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
    color: INDIGO,
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
        background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
        transform: 'scaleX(0)',
        transformOrigin: 'right',
        transition: 'transform 0.3s ease',
    },
    '&:hover': {
        color: '#A5B4FC',
        background: 'transparent',
        '&::after': {
            transform: 'scaleX(1)',
            transformOrigin: 'left',
        },
    },
});

// ========== РОЛИ ==========
const roles = [
    { value: 'tutor', label: 'Репетитор', icon: <School sx={{ fontSize: 17 }} /> },
    { value: 'student', label: 'Ученик', icon: <Person sx={{ fontSize: 17 }} /> },
    { value: 'parent', label: 'Родитель', icon: <Badge sx={{ fontSize: 17 }} /> },
];

// ========== КОМПОНЕНТ ==========
const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, studentLogin, parentLogin } = useAuth();

    const urlParams = new URLSearchParams(location.search);
    const initialRole = urlParams.get('role') || 'tutor';
    const initialTab = roles.findIndex(r => r.value === initialRole);

    const [tab, setTab] = useState(initialTab >= 0 ? initialTab : 0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFocused, setIsFocused] = useState({ email: false, password: false });

    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    useEffect(() => {
        setTimeout(() => emailRef.current?.focus(), 500);
    }, []);

    useEffect(() => {
        setError('');
        emailRef.current?.focus();
    }, [tab]);

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
            let result;
            const roleValue = roles[tab].value;
            if (roleValue === 'tutor') result = await login(email.trim().toLowerCase(), password);
            else if (roleValue === 'student') result = await studentLogin(email.trim().toLowerCase(), password);
            else result = await parentLogin(email.trim().toLowerCase(), password);

            if (result?.error) {
                setError(result.error);
            } else {
                const redirectPath = roleValue === 'tutor' ? '/dashboard' : roleValue === 'student' ? '/student' : '/parent/dashboard';
                navigate(redirectPath, { replace: true });
            }
        } catch {
            setError('Не удалось войти. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && e.target.name === 'email') {
            e.preventDefault();
            passwordRef.current?.focus();
        }
    };

    return (
        <PageWrapper>
            <Particles />

            {/* Орбитальное кольцо */}
            <Box sx={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                border: '1px solid rgba(99,102,241,0.08)',
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
                    background: INDIGO,
                    boxShadow: '0 0 12px rgba(99,102,241,0.8)',
                    animation: `${orbit} 8s linear infinite`,
                }} />
            </Box>

            <GlassCard>
                {/* Логотип */}
                <LogoBox>
                    <AutoAwesome sx={{ fontSize: 30, color: '#fff', animation: `${float} 3s ease-in-out infinite` }} />
                </LogoBox>

                {/* Заголовок */}
                <Typography sx={{
                    fontSize: '1.6rem', fontWeight: 800, color: TEXT_PRIMARY,
                    textAlign: 'center', mb: 0.5, letterSpacing: '-0.03em',
                }}>
                    С возвращением
                </Typography>
                <Typography sx={{
                    color: TEXT_SECONDARY, fontSize: '0.9rem',
                    textAlign: 'center', mb: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                }}>
                    <Stars sx={{ fontSize: 16, color: VIOLET }} />
                    Войдите в свой аккаунт
                    <Stars sx={{ fontSize: 16, color: CYAN }} />
                </Typography>

                {/* Табы ролей */}
                <StyledTabs value={tab} onChange={(e, v) => setTab(v)} variant="fullWidth">
                    {roles.map((role, i) => (
                        <RoleTab
                            key={role.value}
                            label={role.label}
                            icon={role.icon}
                            iconPosition="start"
                        />
                    ))}
                </StyledTabs>

                {/* Ошибка */}
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

                {/* Email-форма */}
                <form onSubmit={handleSubmit} noValidate>
                    <Box sx={{ position: 'relative' }}>
                        <StyledInput
                            fullWidth
                            placeholder="Email"
                            name="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsFocused(f => ({ ...f, email: true }))}
                            onBlur={() => setIsFocused(f => ({ ...f, email: false }))}
                            autoComplete="email"
                            inputRef={emailRef}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ 
                                            fontSize: 20,
                                            color: isFocused.email ? INDIGO : TEXT_TERTIARY,
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
                            placeholder="Пароль"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setIsFocused(f => ({ ...f, password: true }))}
                            onBlur={() => setIsFocused(f => ({ ...f, password: false }))}
                            autoComplete="current-password"
                            inputRef={passwordRef}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ 
                                            fontSize: 20,
                                            color: isFocused.password ? INDIGO : TEXT_TERTIARY,
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

                    {/* Забыли пароль? */}
                    <Box sx={{ textAlign: 'right', mb: 3, mt: -0.5 }}>
                        <TextLink onClick={() => navigate('/forgot-password')}>
                            Забыли пароль?
                        </TextLink>
                    </Box>

                    {/* Кнопка Войти */}
                    <SubmitButton type="submit" fullWidth disabled={loading}>
                        {loading ? (
                            <CircularProgress size={22} sx={{ color: '#fff' }} />
                        ) : (
                            <>
                                Войти
                                <ArrowForward sx={{ ml: 1.5, fontSize: 20, animation: `${float} 2s ease-in-out infinite` }} />
                            </>
                        )}
                    </SubmitButton>
                </form>

                {/* Разделитель + OAuth */}
                <Box sx={{ position: 'relative', my: 3.5 }}>
                    <Divider sx={{ '&::before, &::after': { borderColor: 'rgba(255,255,255,0.06)' } }}>
                        <Typography sx={{ color: TEXT_TERTIARY, fontSize: '0.75rem', px: 2.5, letterSpacing: '0.03em' }}>
                            или быстрее
                        </Typography>
                    </Divider>
                </Box>

                <Stack spacing={1.5}>
                    <OAuthButton
                        fullWidth
                        onClick={() => window.location.href = 'https://ed-space.ru/api/auth/vk/login'}
                        startIcon={
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

                {/* Регистрация */}
                <Box sx={{ textAlign: 'center', mt: 3.5 }}>
                    <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.86rem', display: 'inline' }}>
                        Впервые здесь?{' '}
                    </Typography>
                    <TextLink onClick={() => navigate('/register')}>
                        Создать аккаунт
                    </TextLink>
                </Box>
            </GlassCard>
        </PageWrapper>
    );
};

export default Login;