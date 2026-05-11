// ========== frontend/src/pages/Login.js (ПЕРЕХОДНЫЙ ДИЗАЙН) ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Typography, Container, Tabs, Tab,
    InputAdornment, IconButton, Alert, CircularProgress,
    Divider
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward,
    Person, School, Badge
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== АНИМАЦИИ ==========
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
`;

// ========== ЦВЕТА ==========
const ACCENT = '#4F46E5';
const BG_LEFT = '#0F0F1A';
const BG_RIGHT = '#F3F4F6';
const CARD_BG = '#FFFFFF';
const TEXT_DARK = '#1F2937';
const TEXT_DIM = '#6B7280';
const BORDER = '#E5E7EB';

// ========== СТИЛИ ==========
const PageWrapper = styled(Box)({
    display: 'flex',
    minHeight: '100vh',
    '@media (max-width: 768px)': {
        flexDirection: 'column',
    },
});

const LeftPanel = styled(Box)({
    flex: 1,
    background: `linear-gradient(160deg, ${BG_LEFT} 0%, #1A1040 60%, #0F0F1A 100%)`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: '-20%',
        right: '-10%',
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(79,70,229,0.3) 0%, transparent 70%)`,
        animation: `${pulse} 4s ease-in-out infinite`,
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: '-15%',
        left: '-5%',
        width: 400,
        height: 400,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)`,
        animation: `${pulse} 4s ease-in-out 2s infinite`,
    },
});

const LeftContent = styled(Box)({
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    padding: 40,
});

const RightPanel = styled(Box)({
    flex: 1,
    backgroundColor: BG_RIGHT,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
});

const FormCard = styled(Box)({
    backgroundColor: CARD_BG,
    borderRadius: 24,
    padding: '48px 40px',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)',
    animation: `${fadeUp} 0.6s ease`,
});

const StyledTextField = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: 14,
        backgroundColor: BG_RIGHT,
        transition: 'all 0.2s ease',
        '& fieldset': { borderColor: BORDER },
        '&:hover fieldset': { borderColor: '#D1D5DB' },
        '&.Mui-focused fieldset': { borderColor: ACCENT, borderWidth: 2 },
    },
    '& .MuiInputBase-input': {
        padding: '14px 16px',
    },
});

const StyledButton = styled(Button)({
    borderRadius: 14,
    textTransform: 'none',
    fontWeight: 600,
    padding: '14px 28px',
    fontSize: '1rem',
});

const StyledTabs = styled(Tabs)({
    '& .MuiTab-root': {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '0.95rem',
        color: TEXT_DIM,
        '&.Mui-selected': { color: ACCENT },
    },
    '& .MuiTabs-indicator': { backgroundColor: ACCENT, height: 3, borderRadius: 2 },
});

const Login = () => {
    const navigate = useNavigate();
    const { login, studentLogin, parentLogin } = useAuth();
    const [tab, setTab] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [lockedUntil, setLockedUntil] = useState(null);
    const [countdown, setCountdown] = useState('');

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            let result;
            if (tab === 0) result = await login(email, password);
            else if (tab === 1) result = await studentLogin(email, password);
            else result = await parentLogin(email, password);
            
            if (result?.error) {
                if (result.lockedUntil) {
                    setLockedUntil(result.lockedUntil);
                }
                setError(result.error);
            } else {
                navigate(tab === 0 ? '/dashboard' : tab === 1 ? '/student' : '/parent/dashboard', { replace: true });
            }
        } catch (err) {
            setError('Неверный email или пароль');
        } finally {
            setLoading(false);
        }
    };

    const roleIcons = [<School />, <Person />, <Badge />];

    return (
        <PageWrapper>
            {/* ========== ЛЕВАЯ ПАНЕЛЬ ========== */}
            <LeftPanel>
                <LeftContent>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 3, background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 24, fontWeight: 700 }}>
                            E
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, mb: 2, letterSpacing: -0.5 }}>
                        С возвращением
                    </Typography>
                    <Typography sx={{ color: '#8892B0', fontSize: '1.05rem', lineHeight: 1.7, maxWidth: 320, mx: 'auto' }}>
                        Войдите в свой аккаунт, чтобы продолжить работу с учениками
                    </Typography>
                    
                    {/* Точки-индикаторы */}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 6 }}>
                        {[0, 1, 2].map(i => (
                            <Box key={i} sx={{
                                width: tab === i ? 24 : 8, height: 8,
                                borderRadius: 4,
                                backgroundColor: tab === i ? ACCENT : 'rgba(255,255,255,0.2)',
                                transition: 'all 0.3s ease',
                            }} />
                        ))}
                    </Box>
                </LeftContent>
            </LeftPanel>

            {/* ========== ПРАВАЯ ПАНЕЛЬ ========== */}
            <RightPanel>
                <FormCard>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: TEXT_DARK, mb: 1, textAlign: 'center' }}>
                        Вход в EdSpace
                    </Typography>
                    <Typography sx={{ color: TEXT_DIM, textAlign: 'center', mb: 4, fontSize: '0.95rem' }}>
                        Выберите роль и введите данные
                    </Typography>

                    <StyledTabs value={tab} onChange={(e, v) => { setTab(v); setError(''); }} variant="fullWidth" sx={{ mb: 4 }}>
                        <Tab icon={<School sx={{ fontSize: 20, mr: 1 }} />} label="Репетитор" iconPosition="start" />
                        <Tab icon={<Person sx={{ fontSize: 20, mr: 1 }} />} label="Ученик" iconPosition="start" />
                        <Tab icon={<Badge sx={{ fontSize: 20, mr: 1 }} />} label="Родитель" iconPosition="start" />
                    </StyledTabs>

                    {error && (
                        <Alert severity={lockedUntil ? 'warning' : 'error'} sx={{ mb: 3, borderRadius: 3 }}>
                            {error}
                            {countdown && (
                                <Typography sx={{ fontWeight: 700, mt: 0.5, fontSize: '1.1rem' }}>
                                    {countdown}
                                </Typography>
                            )}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <StyledTextField
                            fullWidth
                            placeholder="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Email sx={{ color: TEXT_DIM, fontSize: 20 }} /></InputAdornment>,
                            }}
                        />
                        <StyledTextField
                            fullWidth
                            placeholder="Пароль"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            sx={{ mb: 1 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Lock sx={{ color: TEXT_DIM, fontSize: 20 }} /></InputAdornment>,
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" sx={{ color: TEXT_DIM }}>
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Box sx={{ textAlign: 'right', mb: 3 }}>
                            <Button onClick={() => navigate('/forgot-password')} sx={{ color: ACCENT, textTransform: 'none', fontSize: '0.85rem', fontWeight: 500 }}>
                                Забыли пароль?
                            </Button>
                        </Box>

                        <StyledButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            endIcon={!loading && <ArrowForward />}
                            sx={{ bgcolor: ACCENT, '&:hover': { bgcolor: '#4338CA' }, mb: 3 }}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Войти'}
                        </StyledButton>
                    </form>

                    <Divider sx={{ my: 3, '&::before, &::after': { borderColor: BORDER } }}>
                        <Typography sx={{ color: TEXT_DIM, fontSize: '0.85rem', px: 1 }}>или</Typography>
                    </Divider>

                    <Typography sx={{ textAlign: 'center', color: TEXT_DIM, fontSize: '0.9rem' }}>
                        Ещё нет аккаунта?{' '}
                        <Button onClick={() => navigate('/register')} sx={{ color: ACCENT, textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                            Зарегистрироваться
                        </Button>
                    </Typography>
                </FormCard>
            </RightPanel>
        </PageWrapper>
    );
};

export default Login;