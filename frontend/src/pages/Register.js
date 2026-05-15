// ========== frontend/src/pages/Register.js (ПЕРЕХОДНЫЙ ДИЗАЙН) ==========
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, TextField, Button, Typography, Container,
    InputAdornment, IconButton, Alert, CircularProgress,
    Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Email, Lock, Visibility, VisibilityOff, ArrowForward,
    Person, Badge, CheckCircle
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
const SUCCESS = '#10B981';

// ========== СТИЛИ ==========
const PageWrapper = styled(Box)({
    display: 'flex',
    minHeight: '100vh',
    '@media (max-width: 768px)': { flexDirection: 'column' },
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
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `radial-gradient(circle, rgba(79,70,229,0.2) 0%, transparent 70%)`,
        animation: `${pulse} 4s ease-in-out infinite`,
    },
});

const LeftContent = styled(Box)({
    position: 'relative',
    zIndex: 1,
    textAlign: 'center',
    color: '#FFFFFF',
    padding: 40,
    maxWidth: 360,
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
    '& .MuiInputBase-input': { padding: '14px 16px' },
});

const StyledButton = styled(Button)({
    borderRadius: 14,
    textTransform: 'none',
    fontWeight: 600,
    padding: '14px 28px',
    fontSize: '1rem',
});

const FeatureItem = styled(Box)({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 24,
});

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({ fullName: '', email: '', password: '' });
    const [agree, setAgree] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!agree) { setError('Примите условия использования'); return; }
        setError('');
        setLoading(true);
        try {
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            // Извлекаем ref из URL (?ref=ede52283)
            const params = new URLSearchParams(window.location.search);
            const refCode = params.get('ref') || '';
            const result = await register(formData.fullName, formData.email, formData.password, timezone, refCode);
            if (result?.error) setError(result.error);
            else navigate('/onboarding', { replace: true });
        } catch (err) {
            setError('Ошибка регистрации. Попробуйте позже.');
        } finally {
            setLoading(false);
        }
    };

    const features = [
        { icon: '📅', text: 'Автоматическое расписание на месяц вперёд' },
        { icon: '💰', text: 'Учёт доходов, чеки, статистика' },
        { icon: '🎥', text: 'Видеозвонки без установки программ' },
    ];

    return (
        <PageWrapper>
            {/* ========== ЛЕВАЯ ПАНЕЛЬ ========== */}
            <LeftPanel>
                <LeftContent>
                    <Box sx={{ mb: 4 }}>
                        <Box sx={{ width: 48, height: 48, borderRadius: 3, background: `linear-gradient(135deg, ${SUCCESS}, #34D399)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', fontSize: 24, fontWeight: 700 }}>
                            E
                        </Box>
                    </Box>
                    <Typography sx={{ fontSize: '2rem', fontWeight: 700, mb: 3, letterSpacing: -0.5 }}>
                        Начните за 2 минуты
                    </Typography>
                    
                    {features.map((f, i) => (
                        <FeatureItem key={i}>
                            <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>{f.icon}</Typography>
                            <Typography sx={{ color: '#8892B0', fontSize: '0.95rem', lineHeight: 1.5, textAlign: 'left' }}>
                                {f.text}
                            </Typography>
                        </FeatureItem>
                    ))}
                </LeftContent>
            </LeftPanel>

            {/* ========== ПРАВАЯ ПАНЕЛЬ ========== */}
            <RightPanel>
                <FormCard>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: TEXT_DARK, mb: 1, textAlign: 'center' }}>
                        Регистрация
                    </Typography>
                    <Typography sx={{ color: TEXT_DIM, textAlign: 'center', mb: 4, fontSize: '0.95rem' }}>
                        Создайте аккаунт репетитора
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 3 }}>{error}</Alert>}

                    <form onSubmit={handleSubmit}>
                        <StyledTextField
                            fullWidth
                            placeholder="Ваше имя"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Person sx={{ color: TEXT_DIM, fontSize: 20 }} /></InputAdornment>,
                            }}
                        />
                        <StyledTextField
                            fullWidth
                            placeholder="Email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            sx={{ mb: 2 }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><Email sx={{ color: TEXT_DIM, fontSize: 20 }} /></InputAdornment>,
                            }}
                        />
                        <StyledTextField
                            fullWidth
                            placeholder="Пароль"
                            name="password"
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={handleChange}
                            required
                            sx={{ mb: 3 }}
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
                        <FormControlLabel
                            control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} sx={{ color: ACCENT, '&.Mui-checked': { color: ACCENT } }} />}
                            label={
                                <Typography sx={{ fontSize: '0.85rem', color: TEXT_DIM }}>
                                    Я принимаю{' '}
                                    <a href="/privacy" target="_blank" style={{ color: ACCENT, textDecoration: 'underline' }}>условия использования</a>
                                    {' '}и соглашаюсь на{' '}
                                    <a href="/privacy" target="_blank" style={{ color: ACCENT, textDecoration: 'underline' }}>обработку персональных данных</a>
                                </Typography>
                            }
                            sx={{ mb: 3 }}
                        />
                        <StyledButton
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            endIcon={!loading && <ArrowForward />}
                            sx={{ bgcolor: SUCCESS, '&:hover': { bgcolor: '#059669' }, mb: 3 }}
                        >
                            {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Создать аккаунт'}
                        </StyledButton>
                    </form>

                    <Divider sx={{ my: 3, '&::before, &::after': { borderColor: BORDER } }}>
                        <Typography sx={{ color: TEXT_DIM, fontSize: '0.85rem', px: 1 }}>или</Typography>
                    </Divider>

                    <Typography sx={{ textAlign: 'center', color: TEXT_DIM, fontSize: '0.9rem' }}>
                        Уже есть аккаунт?{' '}
                        <Button onClick={() => navigate('/login')} sx={{ color: ACCENT, textTransform: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                            Войти
                        </Button>
                    </Typography>
                </FormCard>
            </RightPanel>
        </PageWrapper>
    );
};

export default Register;