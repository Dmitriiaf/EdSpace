// ========== frontend/src/pages/Login.js (v2 — Premium Human Edition) ==========
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import {
    Box, Stack, TextField, Button, Typography, Container, Tabs, Tab,
    InputAdornment, IconButton, Alert, CircularProgress,
    Divider, Fade, Slide, Zoom
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward,
    Person, School, Badge, WavingHand, Star, Shield,
    Coffee, Rocket, AutoAwesome
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== АНИМАЦИИ (живые, неидеальные) ==========
const gentleFloat = keyframes`
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    35% { transform: translateY(-10px) rotate(2deg); }
    70% { transform: translateY(-5px) rotate(-1deg); }
`;

const organicPulse = keyframes`
    0%, 100% { opacity: 0.25; transform: scale(1); }
    40% { opacity: 0.5; transform: scale(1.1); }
    75% { opacity: 0.35; transform: scale(0.96); }
`;

const subtleWobble = keyframes`
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(1deg); }
    75% { transform: rotate(-1deg); }
`;

const fadeSlideUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
`;

const countdownPulse = keyframes`
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
`;

// ========== ЦВЕТОВАЯ ПАЛИТРА ==========
const INDIGO = '#4F46E5';
const INDIGO_DARK = '#3730A3';
const INDIGO_LIGHT = '#818CF8';
const BG_DARK = '#0B0E17';
const BG_CARD = '#FFFFFF';
const TEXT_PRIMARY = '#111827';
const TEXT_SECONDARY = '#6B7280';
const BORDER_LIGHT = '#E5E7EB';
const EMERALD = '#059669';
const EMERALD_LIGHT = '#D1FAE5';
const AMBER = '#F59E0B';
const ROSE = '#E11D48';
const SKY = '#0EA5E9';
const VIOLET = '#7C3AED';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========
const PageWrapper = styled(Box)({
    display: 'flex',
    minHeight: '100vh',
    '@media (max-width: 768px)': { flexDirection: 'column' },
});

const FloatingOrb = styled(Box)(({ size, color, top, left, delay, duration }) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '55% 45% 60% 40%',
    background: `radial-gradient(circle at 30% 30%, ${color}44, ${color}08)`,
    top: `${top}%`,
    left: `${left}%`,
    filter: 'blur(50px)',
    animation: `${organicPulse} ${duration}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
}));

const GridTexture = styled(Box)({
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(rgba(79,70,229,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.04) 1px, transparent 1px)`,
    backgroundSize: '36px 36px',
    backgroundPosition: '3px 5px',
    maskImage: 'radial-gradient(ellipse at 50% 50%, black 25%, transparent 75%)',
    pointerEvents: 'none',
});

const LeftPanel = styled(Box)({
    flex: 1,
    background: `linear-gradient(170deg, ${BG_DARK} 0%, #14102A 35%, #0F0C1F 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 40,
});

const RightPanel = styled(Box)({
    flex: 1,
    backgroundColor: '#F8FAFC',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    position: 'relative',
});

const FormCard = styled(Box)({
    backgroundColor: BG_CARD,
    borderRadius: 28,
    padding: '48px 44px',
    width: '100%',
    maxWidth: 440,
    boxShadow: '0 1px 3px rgba(0,0,0,0.03), 0 8px 40px rgba(0,0,0,0.04)',
    animation: `${fadeSlideUp} 0.5s ease`,
    position: 'relative',
});

const StyledInput = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        transition: 'all 0.25s ease',
        fontSize: '0.95rem',
        '& fieldset': { 
            borderColor: BORDER_LIGHT,
            borderWidth: 1.5,
        },
        '&:hover fieldset': { borderColor: '#D1D5DB' },
        '&.Mui-focused fieldset': { 
            borderColor: INDIGO, 
            borderWidth: 2,
            boxShadow: `0 0 0 4px ${INDIGO}11`,
        },
        '&.Mui-error fieldset': {
            borderColor: ROSE,
        },
    },
    '& .MuiInputBase-input': { 
        padding: '16px 18px',
        '&::placeholder': {
            color: '#9CA3AF',
            opacity: 1,
        },
    },
    '& .MuiInputAdornment-root': {
        marginLeft: 4,
    },
});

const PrimaryButton = styled(Button)({
    borderRadius: 16,
    textTransform: 'none',
    fontWeight: 600,
    padding: '15px 28px',
    fontSize: '1rem',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '-0.01em',
    transition: 'all 0.3s cubic-bezier(0.4, 1.2, 0.7, 1)',
    '&:hover': {
        transform: 'translateY(-1px)',
    },
    '&:active': {
        transform: 'scale(0.98)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
        transition: 'left 0.6s ease',
    },
    '&:hover::after': {
        left: '100%',
    },
});

const RoleTab = styled(Tab)({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    minHeight: 44,
    borderRadius: 14,
    margin: '0 4px',
    transition: 'all 0.3s ease',
    '&.Mui-selected': { 
        color: '#FFFFFF',
        backgroundColor: INDIGO,
        boxShadow: `0 4px 16px ${INDIGO}44`,
    },
    '&:not(.Mui-selected)': {
        color: TEXT_SECONDARY,
        '&:hover': {
            color: TEXT_PRIMARY,
            backgroundColor: '#F1F5F9',
        },
    },
});

const StyledTabs = styled(Tabs)({
    '& .MuiTabs-indicator': { display: 'none' },
    '& .MuiTabs-flexContainer': {
        gap: 4,
        backgroundColor: '#F1F5F9',
        borderRadius: 18,
        padding: 4,
    },
});

const FeatureRow = styled(Box)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 24,
    animation: `${fadeSlideUp} 0.6s ease both`,
    '&:nth-of-type(1)': { animationDelay: '0.1s' },
    '&:nth-of-type(2)': { animationDelay: '0.25s' },
});

const CountdownBadge = styled(Box)({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    color: '#92400E',
    padding: '8px 16px',
    borderRadius: 20,
    fontSize: '0.9rem',
    fontWeight: 700,
    fontFamily: '"SF Mono", "Fira Code", monospace',
    animation: `${countdownPulse} 1s ease-in-out infinite`,
    marginTop: 8,
});

// ========== РОЛИ С ОПИСАНИЯМИ ==========
const roleInfo = [
    {
        icon: <School />,
        label: 'Репетитор',
        description: 'Доступ к расписанию, ученикам, платежам и статистике',
        color: INDIGO,
        bgLight: '#EEF2FF',
    },
    {
        icon: <Person />,
        label: 'Ученик',
        description: 'Расписание, домашние задания и материалы',
        color: EMERALD,
        bgLight: '#ECFDF5',
    },
    {
        icon: <Badge />,
        label: 'Родитель',
        description: 'Контроль успеваемости и оплат ребёнка',
        color: AMBER,
        bgLight: '#FFF7ED',
    },
];

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
const Login = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login, studentLogin, parentLogin } = useAuth();
    
    // Определяем роль из URL (?role=student или ?role=parent)
    const urlParams = new URLSearchParams(location.search);
    const initialRole = urlParams.get('role');
    const initialTab = initialRole === 'student' ? 1 : initialRole === 'parent' ? 2 : 0;
    
    const [tab, setTab] = useState(initialTab);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lockedUntil, setLockedUntil] = useState(null);
    const [countdown, setCountdown] = useState('');
    const [shakeForm, setShakeForm] = useState(false);
    
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    // Таймер блокировки
    useEffect(() => {
        if (!lockedUntil) return;
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const lockTime = new Date(lockedUntil).getTime();
            const diff = Math.max(0, lockTime - now);
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            setCountdown(`${minutes}:${seconds.toString().padStart(2, '0')}`);
            if (diff <= 0) {
                setLockedUntil(null);
                setCountdown('');
                setError('');
                clearInterval(timer);
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [lockedUntil]);

    // Фокус на email при смене таба
    useEffect(() => {
        setError('');
        setLockedUntil(null);
        setCountdown('');
        emailRef.current?.focus();
    }, [tab]);

    // Автофокус при загрузке
    useEffect(() => {
        setTimeout(() => emailRef.current?.focus(), 400);
    }, []);

    const handleTabChange = (e, newTab) => {
        setTab(newTab);
        setShakeForm(false);
    };

    const validateForm = () => {
        if (!email.includes('@') || !email.includes('.')) {
            setError('Проверьте email — кажется, там опечатка');
            return false;
        }
        if (!password || password.length < 3) {
            setError('Введите пароль');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setShakeForm(true);
            setTimeout(() => setShakeForm(false), 500);
            return;
        }
        
        setError('');
        setLoading(true);
        
        try {
            let result;
            if (tab === 0) {
                result = await login(email.trim().toLowerCase(), password);
            } else if (tab === 1) {
                result = await studentLogin(email.trim().toLowerCase(), password);
            } else {
                result = await parentLogin(email.trim().toLowerCase(), password);
            }
            
            if (result?.error) {
                if (result.lockedUntil) {
                    setLockedUntil(result.lockedUntil);
                }
                setError(result.error);
            } else {
                const redirectPath = tab === 0 ? '/dashboard' : tab === 1 ? '/student' : '/parent/dashboard';
                navigate(redirectPath, { replace: true });
            }
        } catch (err) {
            setError('Не удалось войти. Проверьте данные или попробуйте позже.');
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

    // Быстрые подсказки для демо
    const handleQuickFill = (role) => {
        const demos = {
            tutor: { email: 'demo@edspace.ru', password: 'demo123' },
            student: { email: 'student@edspace.ru', password: 'demo123' },
            parent: { email: 'parent@edspace.ru', password: 'demo123' },
        };
        const demo = role === 0 ? demos.tutor : role === 1 ? demos.student : demos.parent;
        setEmail(demo.email);
        setPassword(demo.password);
    };

    const leftContent = {
        0: {
            emoji: '👋',
            title: 'С возвращением!',
            subtitle: 'Ваши ученики уже заждались',
            features: [
                { icon: '📊', text: 'Посмотрите статистику за неделю' },
                { icon: '📅', text: 'Проверьте расписание на сегодня' },
            ],
        },
        1: {
            emoji: '📚',
            title: 'Привет, ученик!',
            subtitle: 'Продолжим заниматься?',
            features: [
                { icon: '✅', text: 'Проверь домашние задания' },
                { icon: '🎯', text: 'Посмотри свои успехи' },
            ],
        },
        2: {
            emoji: '👨‍👩‍👧',
            title: 'Здравствуйте!',
            subtitle: 'Всё под контролем',
            features: [
                { icon: '📈', text: 'Успеваемость ребёнка' },
                { icon: '💰', text: 'История платежей' },
            ],
        },
    };

    const currentLeft = leftContent[tab];

    return (
        <PageWrapper>
            {/* ========== ЛЕВАЯ ПАНЕЛЬ (десктоп) ========== */}
            <LeftPanel sx={{ display: { xs: 'none', md: 'flex' } }}>
                <GridTexture />
                <FloatingOrb size={350} color={INDIGO} top={15} left={8} delay={0} duration={5} />
                <FloatingOrb size={280} color={roleInfo[tab].color} top={55} left={55} delay={1.5} duration={6} />
                <FloatingOrb size={200} color={SKY} top={35} left={45} delay={3} duration={7} />
                
                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 360, textAlign: 'center' }}>
                    {/* Логотип */}
                    <Zoom in timeout={500}>
                        <Box sx={{ mb: 5 }}>
                            <Box sx={{ 
                                width: 56, height: 56, borderRadius: 18, 
                                background: `linear-gradient(135deg, ${INDIGO}, ${INDIGO_LIGHT})`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                                margin: '0 auto',
                                fontSize: 26, 
                                fontWeight: 800,
                                boxShadow: `0 12px 40px ${INDIGO}55`,
                                animation: `${gentleFloat} 4s ease-in-out infinite`,
                            }}>
                                E
                            </Box>
                        </Box>
                    </Zoom>
                    
                    {/* Эмодзи роли */}
                    <Typography sx={{ fontSize: '3.5rem', mb: 2, animation: `${gentleFloat} 3.5s ease-in-out infinite` }}>
                        {currentLeft.emoji}
                    </Typography>
                    
                    <Typography sx={{ 
                        fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', mb: 1.5,
                        letterSpacing: '-0.03em', lineHeight: 1.2,
                    }}>
                        {currentLeft.title}
                    </Typography>
                    
                    <Typography sx={{ color: '#94A3B8', fontSize: '1rem', mb: 5, lineHeight: 1.6 }}>
                        {currentLeft.subtitle}
                    </Typography>
                    
                    {/* Фичи роли */}
                    {currentLeft.features.map((f, i) => (
                        <FeatureRow key={i}>
                            <Typography sx={{ fontSize: '1.8rem', flexShrink: 0, lineHeight: 1 }}>
                                {f.icon}
                            </Typography>
                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.95rem', textAlign: 'left', lineHeight: 1.5 }}>
                                {f.text}
                            </Typography>
                        </FeatureRow>
                    ))}
                    
                    {/* Точки-индикаторы */}
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 6 }}>
                        {[0, 1, 2].map(i => (
                            <Box 
                                key={i} 
                                onClick={() => setTab(i)}
                                sx={{
                                    width: tab === i ? 28 : 10, 
                                    height: 10,
                                    borderRadius: 5,
                                    backgroundColor: tab === i ? roleInfo[i].color : 'rgba(255,255,255,0.18)',
                                    transition: 'all 0.4s cubic-bezier(0.4, 1.2, 0.7, 1)',
                                    cursor: 'pointer',
                                    '&:hover': {
                                        backgroundColor: tab === i ? roleInfo[i].color : 'rgba(255,255,255,0.3)',
                                    },
                                }} 
                            />
                        ))}
                    </Box>
                </Box>
            </LeftPanel>

            {/* ========== ПРАВАЯ ПАНЕЛЬ (форма) ========== */}
            <RightPanel>
                <FormCard sx={{ 
                    animation: shakeForm 
                        ? `${fadeSlideUp} 0.5s ease, ${keyframes`0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}`} 0.5s ease`
                        : `${fadeSlideUp} 0.5s ease`,
                }}>
                    {/* Заголовок */}
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Typography sx={{ 
                            fontSize: '1.7rem', fontWeight: 800, color: TEXT_PRIMARY, mb: 0.5,
                            letterSpacing: '-0.02em',
                        }}>
                            Вход в EdSpace
                        </Typography>
                        <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.9rem' }}>
                            Выберите роль и введите данные
                        </Typography>
                    </Box>

                    {/* Табы ролей */}
                    <StyledTabs 
                        value={tab} 
                        onChange={handleTabChange} 
                        variant="fullWidth" 
                        sx={{ mb: 4 }}
                    >
                        {roleInfo.map((role, i) => (
                            <RoleTab 
                                key={i}
                                icon={role.icon} 
                                label={role.label} 
                                iconPosition="start"
                                sx={{
                                    '&.Mui-selected': { 
                                        backgroundColor: role.color,
                                        boxShadow: `0 4px 16px ${role.color}44`,
                                    },
                                }}
                            />
                        ))}
                    </StyledTabs>

                    {/* Описание роли */}
                    <Fade in key={tab}>
                        <Box sx={{ 
                            mb: 4, p: 3, borderRadius: 4, 
                            backgroundColor: roleInfo[tab].bgLight,
                            border: `1px solid ${roleInfo[tab].color}22`,
                        }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box sx={{ 
                                    width: 40, height: 40, borderRadius: 3,
                                    backgroundColor: roleInfo[tab].color,
                                    color: '#FFFFFF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {roleInfo[tab].icon}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: TEXT_PRIMARY }}>
                                        {roleInfo[tab].label}
                                    </Typography>
                                    <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.82rem' }}>
                                        {roleInfo[tab].description}
                                    </Typography>
                                </Box>
                            </Stack>
                        </Box>
                    </Fade>

                    {/* Ошибка */}
                    {error && (
                        <Fade in>
                            <Box sx={{ mb: 3 }}>
                                <Alert 
                                    severity={lockedUntil ? 'warning' : 'error'} 
                                    sx={{ 
                                        borderRadius: 3,
                                        backgroundColor: lockedUntil ? '#FEF3C7' : '#FEF2F2',
                                        color: lockedUntil ? '#92400E' : ROSE,
                                        '& .MuiAlert-icon': { color: lockedUntil ? AMBER : ROSE },
                                    }}
                                    onClose={() => { setError(''); setLockedUntil(null); }}
                                >
                                    {error}
                                    {lockedUntil && countdown && (
                                        <CountdownBadge>
                                            <Lock sx={{ fontSize: 14 }} />
                                            {countdown}
                                        </CountdownBadge>
                                    )}
                                </Alert>
                            </Box>
                        </Fade>
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
                            onKeyDown={handleKeyDown}
                            autoComplete="email"
                            inputRef={emailRef}
                            sx={{ mb: 2.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: '#9CA3AF', fontSize: 22 }} />
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
                            inputRef={passwordRef}
                            sx={{ mb: 1.5 }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Lock sx={{ color: '#9CA3AF', fontSize: 22 }} />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton 
                                            onClick={() => setShowPassword(!showPassword)} 
                                            edge="end" 
                                            sx={{ color: '#9CA3AF' }}
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />

                        <Box sx={{ textAlign: 'right', mb: 3 }}>
                            <Button 
                                onClick={() => navigate('/forgot-password')} 
                                sx={{ 
                                    color: INDIGO, 
                                    textTransform: 'none', 
                                    fontSize: '0.85rem', 
                                    fontWeight: 500,
                                    '&:hover': { backgroundColor: '#EEF2FF' },
                                    borderRadius: 3,
                                }}
                            >
                                Забыли пароль?
                            </Button>
                        </Box>

                        <PrimaryButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            sx={{ 
                                bgcolor: roleInfo[tab].color, 
                                '&:hover': { 
                                    bgcolor: tab === 0 ? INDIGO_DARK : tab === 1 ? '#047857' : '#D97706',
                                },
                                mb: 3,
                                boxShadow: `0 4px 16px ${roleInfo[tab].color}44`,
                            }}
                        >
                            {loading ? (
                                <CircularProgress size={24} sx={{ color: 'white' }} />
                            ) : (
                                <>
                                    Войти как {roleInfo[tab].label.toLowerCase()}
                                    <ArrowForward sx={{ ml: 1, fontSize: 20 }} />
                                </>
                            )}
                        </PrimaryButton>
                    </form>

                    <Divider sx={{ my: 3, '&::before, &::after': { borderColor: BORDER_LIGHT } }}>
                        <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.8rem', px: 1.5 }}>
                            впервые здесь
                        </Typography>
                    </Divider>

                    <Button
                        fullWidth
                        onClick={() => navigate('/register')}
                        sx={{ 
                            color: INDIGO, 
                            textTransform: 'none', 
                            fontWeight: 600, 
                            fontSize: '0.95rem',
                            borderRadius: 3,
                            py: 1.5,
                            '&:hover': { backgroundColor: '#EEF2FF' },
                        }}
                        startIcon={<AutoAwesome sx={{ fontSize: 18 }} />}
                    >
                        Создать аккаунт
                    </Button>

                    {/* Быстрый доступ для тестирования */}
                    {process.env.NODE_ENV === 'development' && (
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.7rem', mb: 1 }}>
                                Быстрый вход (демо)
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                {['Репетитор', 'Ученик', 'Родитель'].map((label, i) => (
                                    <Button
                                        key={i}
                                        size="small"
                                        onClick={() => { setTab(i); handleQuickFill(i); }}
                                        sx={{ 
                                            fontSize: '0.7rem', 
                                            color: TEXT_SECONDARY,
                                            textTransform: 'none',
                                            border: `1px solid ${BORDER_LIGHT}`,
                                            borderRadius: 3,
                                            '&:hover': { backgroundColor: roleInfo[i].bgLight },
                                        }}
                                    >
                                        {label}
                                    </Button>
                                ))}
                            </Box>
                        </Box>
                    )}
                </FormCard>
            </RightPanel>
        </PageWrapper>
    );
};

// Добавим Stack в импорт

export default Login;