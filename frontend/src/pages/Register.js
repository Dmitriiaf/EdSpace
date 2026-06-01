// ========== frontend/src/pages/Register.js (v3 — Premium Human Edition) ==========
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Typography, Container,
    InputAdornment, IconButton, Alert, CircularProgress,
    Checkbox, FormControlLabel, Divider, Fade, Zoom
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward,
    Person, Badge, CheckCircle, Refresh, ArrowBack,
    Rocket, Star, Shield, Zap, Coffee, Gift
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== АНИМАЦИИ (неидеальные, "живые") ==========
const gentleFloat = keyframes`
    0%, 100% { transform: translateY(0px); }
    40% { transform: translateY(-8px); }
    70% { transform: translateY(-3px); }
`;

const organicPulse = keyframes`
    0%, 100% { opacity: 0.3; transform: scale(1); }
    35% { opacity: 0.6; transform: scale(1.08); }
    70% { opacity: 0.4; transform: scale(0.97); }
`;

const subtleShake = keyframes`
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
`;

const fadeSlideUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const typewriterCursor = keyframes`
    0%, 100% { border-color: transparent; }
    50% { border-color: #4F46E5; }
`;

const shimmer = keyframes`
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
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

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========
const PageWrapper = styled(Box)({
    display: 'flex',
    minHeight: '100vh',
    '@media (max-width: 768px)': { flexDirection: 'column' },
});

const LeftPanel = styled(Box)({
    flex: 1,
    background: `linear-gradient(165deg, ${BG_DARK} 0%, #131129 40%, #0F0C1F 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    padding: 40,
});

// Декоративные элементы на фоне
const FloatingOrb = styled(Box)(({ size, color, top, left, delay, duration }) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '55% 45% 60% 40%',
    background: `radial-gradient(circle at 30% 30%, ${color}33, ${color}08)`,
    top: `${top}%`,
    left: `${left}%`,
    filter: 'blur(60px)',
    animation: `${organicPulse} ${duration}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    pointerEvents: 'none',
}));

const GridOverlay = styled(Box)({
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(rgba(79,70,229,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(79,70,229,0.03) 1px, transparent 1px)`,
    backgroundSize: '32px 32px',
    maskImage: 'radial-gradient(ellipse at 50% 50%, black 30%, transparent 80%)',
    pointerEvents: 'none',
});

const FeatureRow = styled(Box)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 28,
    animation: `${fadeSlideUp} 0.6s ease both`,
    '&:nth-of-type(1)': { animationDelay: '0.1s' },
    '&:nth-of-type(2)': { animationDelay: '0.25s' },
    '&:nth-of-type(3)': { animationDelay: '0.4s' },
});

const RightPanel = styled(Box)({
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 8px 40px rgba(0,0,0,0.04)',
    animation: `${fadeSlideUp} 0.5s ease`,
    position: 'relative',
});

const StyledInput = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        transition: 'all 0.25s ease',
        fontSize: '0.95rem',
        '& fieldset': { 
            borderColor: BORDER_LIGHT,
            borderWidth: 1.5,
        },
        '&:hover fieldset': { 
            borderColor: '#D1D5DB',
        },
        '&.Mui-focused fieldset': { 
            borderColor: INDIGO, 
            borderWidth: 2,
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
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
        transition: 'left 0.6s ease',
    },
    '&:hover::after': {
        left: '100%',
    },
});

const CodeInput = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: 18,
        backgroundColor: '#F9FAFB',
        transition: 'all 0.25s ease',
        '& fieldset': { 
            borderColor: BORDER_LIGHT,
            borderWidth: 1.5,
        },
        '&:hover fieldset': { 
            borderColor: '#D1D5DB',
        },
        '&.Mui-focused fieldset': { 
            borderColor: INDIGO, 
            borderWidth: 2,
        },
        '&.Mui-error fieldset': {
            borderColor: ROSE,
            animation: `${subtleShake} 0.4s ease`,
        },
    },
    '& input': { 
        fontSize: '32px', 
        fontWeight: 700, 
        letterSpacing: '14px', 
        textAlign: 'center', 
        padding: '18px 12px',
        fontFamily: '"SF Mono", "Fira Code", monospace',
        color: TEXT_PRIMARY,
        caretColor: INDIGO,
    },
});

const FeatureIconWrapper = styled(Box)(({ bgcolor }) => ({
    width: 44,
    height: 44,
    borderRadius: 14,
    background: bgcolor,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    fontSize: '1.3rem',
    boxShadow: `0 4px 12px ${bgcolor}44`,
}));

const EmailBadge = styled(Box)({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EEF2FF',
    color: INDIGO,
    padding: '6px 14px',
    borderRadius: 20,
    fontSize: '0.85rem',
    fontWeight: 600,
    marginTop: 8,
});

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
const Register = () => {
    const navigate = useNavigate();
    const { register, login } = useAuth();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [shakeError, setShakeError] = useState(false);
    
    // Шаг 2
    const [verificationCode, setVerificationCode] = useState('');
    const [codeError, setCodeError] = useState(false);
    const [timer, setTimer] = useState(120);
    const [canResend, setCanResend] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    
    const codeInputRef = useRef(null);
    const formRef = useRef(null);

    // Таймер для повторной отправки кода
    useEffect(() => {
        let interval;
        if (step === 2 && timer > 0) {
            interval = setInterval(() => setTimer(t => t - 1), 1000);
        }
        if (timer === 0) setCanResend(true);
        return () => clearInterval(interval);
    }, [step, timer]);

    // Фокус на поле кода при переходе на шаг 2
    useEffect(() => {
        if (step === 2 && codeInputRef.current) {
            setTimeout(() => codeInputRef.current?.focus(), 300);
        }
    }, [step]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        if (error) setError('');
        if (shakeError) setShakeError(false);
    };

    const validateForm = () => {
        if (!formData.fullName.trim()) {
            setError('Как к вам обращаться?');
            return false;
        }
        if (!formData.email.includes('@') || !formData.email.includes('.')) {
            setError('Похоже, email указан неверно');
            return false;
        }
        if (formData.password.length < 6) {
            setError('Пароль должен быть минимум 6 символов');
            return false;
        }
        if (!agree) {
            setError('Нужно принять условия использования');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setShakeError(true);
            setTimeout(() => setShakeError(false), 500);
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
                ref: refCode
            });
            
            if (response.data.requiresVerification) {
                setRegisteredEmail(formData.email.trim().toLowerCase());
                setStep(2);
                setTimer(120);
                setCanResend(false);
                setVerificationCode('');
            } else {
                const result = await register(
                    formData.fullName.trim(), 
                    formData.email.trim().toLowerCase(), 
                    formData.password, 
                    timezone, 
                    refCode
                );
                if (result?.error) {
                    setError(result.error);
                } else {
                    navigate('/onboarding', { replace: true });
                }
            }
        } catch (err) {
            const errorMessage = err.response?.data?.error || 
                                 err.response?.data?.message ||
                                 'Что-то пошло не так. Попробуйте ещё раз.';
            setError(errorMessage);
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
                code: verificationCode
            });
            
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                id: response.data.id,
                email: response.data.email,
                fullName: response.data.fullName,
                role: 'tutor'
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
            await axiosInstance.post('/auth/resend-code', {
                email: registeredEmail
            });
            setTimer(120);
            setCanResend(false);
            setSuccess('Новый код отправлен! Проверьте почту.');
            setVerificationCode('');
            codeInputRef.current?.focus();
        } catch (err) {
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

    const handleBackToForm = () => {
        setStep(1);
        setVerificationCode('');
        setError('');
        setSuccess('');
        setCodeError(false);
        setTimer(120);
        setCanResend(false);
    };

    // Обработка вставки кода
    const handlePaste = (e) => {
        e.preventDefault();
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const digits = pasted.replace(/[^0-9]/g, '').substring(0, 6);
        setVerificationCode(digits);
        if (digits.length === 6) {
            setCodeError(false);
        }
    };

    const features = [
        { 
            icon: '📅', 
            text: 'Расписание на месяц вперёд',
            subtext: 'Автоматически, без ручного ввода',
            bgcolor: '#EEF2FF'
        },
        { 
            icon: '💰', 
            text: 'Учёт доходов и платежей',
            subtext: 'Чеки, статистика, напоминания',
            bgcolor: '#ECFDF5'
        },
        { 
            icon: '🎥', 
            text: 'Видеоуроки без установки',
            subtext: 'Zoom, Телемост — что удобно',
            bgcolor: '#FFF7ED'
        },
    ];

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <PageWrapper>
            {/* ========== ЛЕВАЯ ПАНЕЛЬ (десктоп) ========== */}
            <LeftPanel sx={{ display: { xs: 'none', md: 'flex' } }}>
                <GridOverlay />
                <FloatingOrb size={400} color={INDIGO} top={20} left={10} delay={0} duration={5} />
                <FloatingOrb size={300} color={EMERALD} top={60} left={60} delay={1.5} duration={6} />
                <FloatingOrb size={250} color={AMBER} top={30} left={50} delay={3} duration={7} />
                
                <Box sx={{ position: 'relative', zIndex: 1, maxWidth: 380, textAlign: 'center' }}>
                    {/* Логотип */}
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
                    
                    <Typography sx={{ 
                        fontSize: '2.2rem', fontWeight: 800, color: '#FFFFFF', mb: 2,
                        letterSpacing: '-0.03em', lineHeight: 1.15,
                    }}>
                        {step === 1 ? 'Начните за пару минут' : 'Почти готово!'}
                    </Typography>
                    
                    <Typography sx={{ color: '#94A3B8', fontSize: '1rem', mb: 5, lineHeight: 1.6 }}>
                        {step === 1 
                            ? 'Присоединяйтесь к платформе, где уже работают сотни репетиторов.'
                            : `Код подтверждения отправлен на почту. Обычно приходит за пару секунд.`
                        }
                    </Typography>
                    
                    {step === 1 ? (
                        features.map((f, i) => (
                            <FeatureRow key={i}>
                                <FeatureIconWrapper bgcolor={f.bgcolor}>
                                    {f.icon}
                                </FeatureIconWrapper>
                                <Box sx={{ textAlign: 'left' }}>
                                    <Typography sx={{ color: '#E2E8F0', fontWeight: 600, fontSize: '0.95rem', mb: 0.3 }}>
                                        {f.text}
                                    </Typography>
                                    <Typography sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                                        {f.subtext}
                                    </Typography>
                                </Box>
                            </FeatureRow>
                        ))
                    ) : (
                        <Box sx={{ textAlign: 'center' }}>
                            <Box sx={{ fontSize: '5rem', mb: 3, animation: `${gentleFloat} 3s ease-in-out infinite` }}>
                                📬
                            </Box>
                            <EmailBadge sx={{ mx: 'auto', display: 'inline-flex', mb: 2 }}>
                                <Email sx={{ fontSize: 14 }} />
                                {registeredEmail}
                            </EmailBadge>
                            <Typography sx={{ color: '#94A3B8', fontSize: '0.9rem', mt: 3, lineHeight: 1.6 }}>
                                Не пришло? Проверьте папку «Спам» или запросите новый код.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </LeftPanel>

            {/* ========== ПРАВАЯ ПАНЕЛЬ (форма) ========== */}
            <RightPanel>
                <FormCard ref={formRef} sx={{ 
                    animation: shakeError ? `${subtleShake} 0.5s ease` : `${fadeSlideUp} 0.5s ease`,
                }}>
                    {step === 1 ? (
                        <>
                            {/* Заголовок */}
                            <Box sx={{ textAlign: 'center', mb: 5 }}>
                                <Typography sx={{ 
                                    fontSize: '1.8rem', fontWeight: 800, color: TEXT_PRIMARY, mb: 0.5,
                                    letterSpacing: '-0.02em',
                                }}>
                                    Регистрация
                                </Typography>
                                <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.95rem' }}>
                                    Бесплатно 14 дней, потом 499 ₽/мес
                                </Typography>
                            </Box>

                            {/* Ошибка */}
                            {error && (
                                <Fade in>
                                    <Alert 
                                        severity="error" 
                                        sx={{ 
                                            mb: 3, borderRadius: 3, 
                                            backgroundColor: '#FEF2F2', 
                                            color: ROSE,
                                            '& .MuiAlert-icon': { color: ROSE },
                                        }}
                                        onClose={() => setError('')}
                                    >
                                        {error}
                                    </Alert>
                                </Fade>
                            )}

                            {/* Форма */}
                            <form onSubmit={handleSubmit} noValidate>
                                <StyledInput
                                    fullWidth
                                    placeholder="Имя и фамилия"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    autoComplete="name"
                                    autoFocus
                                    sx={{ mb: 2.5 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Person sx={{ color: '#9CA3AF', fontSize: 22 }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                                
                                <StyledInput
                                    fullWidth
                                    placeholder="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    autoComplete="email"
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
                                    placeholder="Пароль (от 6 символов)"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={handleChange}
                                    autoComplete="new-password"
                                    sx={{ mb: 3 }}
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

                                {/* Чекбокс */}
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={agree} 
                                            onChange={(e) => setAgree(e.target.checked)} 
                                            sx={{ 
                                                color: '#D1D5DB',
                                                '&.Mui-checked': { color: INDIGO },
                                            }} 
                                        />
                                    }
                                    label={
                                        <Typography sx={{ fontSize: '0.85rem', color: TEXT_SECONDARY }}>
                                            Принимаю{' '}
                                            <Box 
                                                component="a" 
                                                href="/privacy" 
                                                target="_blank"
                                                sx={{ 
                                                    color: INDIGO, 
                                                    textDecoration: 'underline',
                                                    textUnderlineOffset: 2,
                                                    '&:hover': { color: INDIGO_DARK },
                                                }}
                                            >
                                                условия использования
                                            </Box>
                                        </Typography>
                                    }
                                    sx={{ mb: 3, ml: -1 }}
                                />

                                {/* Кнопка */}
                                <PrimaryButton
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                    sx={{ 
                                        bgcolor: EMERALD, 
                                        '&:hover': { bgcolor: '#047857' },
                                        mb: 3,
                                        boxShadow: `0 4px 16px ${EMERALD}44`,
                                    }}
                                >
                                    {loading ? (
                                        <CircularProgress size={24} sx={{ color: 'white' }} />
                                    ) : (
                                        <>
                                            Создать аккаунт
                                            <ArrowForward sx={{ ml: 1, fontSize: 20 }} />
                                        </>
                                    )}
                                </PrimaryButton>
                            </form>

                            <Divider sx={{ my: 3, '&::before, &::after': { borderColor: BORDER_LIGHT } }}>
                                <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.8rem', px: 1.5 }}>
                                    уже есть аккаунт
                                </Typography>
                            </Divider>

                            <Button
                                fullWidth
                                onClick={() => navigate('/login')}
                                sx={{ 
                                    color: INDIGO, 
                                    textTransform: 'none', 
                                    fontWeight: 600, 
                                    fontSize: '0.95rem',
                                    borderRadius: 3,
                                    py: 1.5,
                                    '&:hover': { backgroundColor: '#EEF2FF' },
                                }}
                            >
                                Войти
                            </Button>
                        </>
                    ) : (
                        /* ========== ШАГ 2: ПОДТВЕРЖДЕНИЕ ========== */
                        <>
                            {/* Кнопка назад */}
                            <Box sx={{ mb: 4 }}>
                                <IconButton 
                                    onClick={handleBackToForm} 
                                    sx={{ 
                                        color: TEXT_SECONDARY,
                                        '&:hover': { color: TEXT_PRIMARY, backgroundColor: '#F3F4F6' },
                                    }}
                                >
                                    <ArrowBack />
                                </IconButton>
                            </Box>
                            
                            <Typography sx={{ 
                                fontSize: '1.5rem', fontWeight: 800, color: TEXT_PRIMARY, mb: 1,
                                letterSpacing: '-0.02em',
                            }}>
                                Код из письма
                            </Typography>
                            
                            <Typography sx={{ color: TEXT_SECONDARY, mb: 1, fontSize: '0.9rem', lineHeight: 1.5 }}>
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
                                            backgroundColor: '#FEF2F2',
                                            color: ROSE,
                                            '& .MuiAlert-icon': { color: ROSE },
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
                                            backgroundColor: EMERALD_LIGHT,
                                            color: EMERALD,
                                            '& .MuiAlert-icon': { color: EMERALD },
                                        }}
                                    >
                                        {success}
                                    </Alert>
                                </Fade>
                            )}

                            {/* Поле ввода кода */}
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
                                sx={{ mb: 3 }}
                            />

                            {/* Подсказка */}
                            <Typography sx={{ 
                                textAlign: 'center', 
                                color: TEXT_SECONDARY, 
                                fontSize: '0.8rem',
                                mb: 3,
                            }}>
                                {verificationCode.length}/6 цифр
                            </Typography>

                            {/* Кнопка подтверждения */}
                            <PrimaryButton
                                fullWidth
                                variant="contained"
                                disabled={loading || verificationCode.length !== 6}
                                onClick={handleVerifyCode}
                                sx={{ 
                                    bgcolor: INDIGO, 
                                    '&:hover': { bgcolor: INDIGO_DARK },
                                    mb: 2,
                                    boxShadow: `0 4px 16px ${INDIGO}44`,
                                }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} sx={{ color: 'white' }} />
                                ) : (
                                    <>
                                        Подтвердить
                                        <CheckCircle sx={{ ml: 1, fontSize: 20 }} />
                                    </>
                                )}
                            </PrimaryButton>

                            {/* Таймер / повторная отправка */}
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                {canResend ? (
                                    <Button 
                                        onClick={handleResendCode} 
                                        disabled={loading}
                                        startIcon={<Refresh />}
                                        sx={{ 
                                            color: INDIGO, 
                                            textTransform: 'none', 
                                            fontWeight: 600,
                                            fontSize: '0.9rem',
                                            '&:hover': { backgroundColor: '#EEF2FF' },
                                        }}
                                    >
                                        Отправить новый код
                                    </Button>
                                ) : (
                                    <Typography sx={{ color: TEXT_SECONDARY, fontSize: '0.85rem' }}>
                                        Отправить повторно через {formatTime(timer)}
                                    </Typography>
                                )}
                            </Box>
                        </>
                    )}
                </FormCard>
            </RightPanel>
        </PageWrapper>
    );
};

export default Register;