// ========== frontend/src/pages/LandingPage.js (ПОЛНОСТЬЮ НОВЫЙ) ==========
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Button, Typography, Container, Grid,
    AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText,
    useMediaQuery, useTheme, Stack, TextField, Snackbar, Alert,
    Avatar, AvatarGroup, Chip
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    CalendarMonth, AttachMoney, Videocam, Draw,
    Menu as MenuIcon, ArrowForward, Star, Send,
    Close, TrendingUp, Groups, AutoAwesome,
    Bolt, VerifiedUser, SupportAgent
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ========== АНИМАЦИИ ==========
const fadeInUp = keyframes`
    from { opacity: 0; transform: translateY(40px); }
    to { opacity: 1; transform: translateY(0); }
`;

const shimmer = keyframes`
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
`;

const orbit = keyframes`
    from { transform: rotate(0deg) translateX(80px) rotate(0deg); }
    to { transform: rotate(360deg) translateX(80px) rotate(-360deg); }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
`;

// ========== СТИЛИ ==========
const ACCENT = '#4F46E5';
const DARK = '#0F0F1A';
const SURFACE = '#1A1A2E';
const CARD = '#16213E';
const TEXT = '#FFFFFF';
const TEXT_DIM = '#8892B0';
const SUCCESS = '#10B981';

const StyledButton = styled(Button)({
    borderRadius: 50,
    textTransform: 'none',
    fontWeight: 600,
    padding: '14px 36px',
    fontSize: '1rem',
    letterSpacing: '0.3px',
});

const GlowButton = styled(StyledButton)({
    background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)`,
    color: 'white',
    boxShadow: `0 0 30px rgba(79, 70, 229, 0.4)`,
    '&:hover': {
        boxShadow: `0 0 50px rgba(79, 70, 229, 0.6)`,
        transform: 'translateY(-2px)',
    },
});

const GlassCard = styled(Box)({
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    borderRadius: 24,
    padding: 40,
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        transform: 'translateY(-4px)',
    },
});

const StatNumber = styled(Typography)({
    fontSize: '3.5rem',
    fontWeight: 800,
    background: `linear-gradient(135deg, ${ACCENT}, #A78BFA)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
});

const StatLabel = styled(Typography)({
    color: TEXT_DIM,
    fontSize: '0.95rem',
    fontWeight: 500,
    marginTop: 8,
});

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenu, setMobileMenu] = useState(false);
    const [email, setEmail] = useState('');
    const [snackbar, setSnackbar] = useState(false);
    const [typedText, setTypedText] = useState('');
    const fullText = 'репетитора';
    const [statsVisible, setStatsVisible] = useState(false);
    const statsRef = useRef(null);

    useEffect(() => {
        let i = 0;
        const interval = setInterval(() => {
            if (i <= fullText.length) {
                setTypedText(fullText.substring(0, i));
                i++;
            } else {
                clearInterval(interval);
                setTimeout(() => { i = 0; setTypedText(''); }, 2000);
            }
        }, 100);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
            { threshold: 0.3 }
        );
        if (statsRef.current) observer.observe(statsRef.current);
        return () => observer.disconnect();
    }, []);

    const handleSubscribe = () => {
        if (email) { setSnackbar(true); setEmail(''); }
    };

    const advantages = [
        { icon: <Bolt sx={{ fontSize: 28 }} />, title: 'Молниеносно', desc: 'Создайте расписание на месяц вперёд за 10 секунд. Шаблоны, повторы, переносы.' },
        { icon: <VerifiedUser  sx={{ fontSize: 28 }} />, title: 'Прозрачно', desc: 'Родители видят каждое занятие, каждую оплату. Больше никаких вопросов «а было ли занятие?»' },
        { icon: <SupportAgent sx={{ fontSize: 28 }} />, title: 'Поддержка 24/7', desc: 'Мы на связи в Telegram. Ответим, поможем, доработаем платформу под вас.' },
    ];

    const testimonials = [
        { name: 'Дмитрий А.', role: 'Репетитор по информатике', text: 'Наконец-то всё в одном месте. Раньше у меня было 4 разных сервиса, теперь только EdSpace.', avatar: 'ДА' },
        { name: 'Анна К.', role: 'Репетитор по математике', text: 'Родители в восторге — видят расписание и оплачивают занятия сами. Я просто веду уроки.', avatar: 'АК' },
    ];

    return (
        <Box sx={{ bgcolor: DARK, color: TEXT, minHeight: '100vh', overflowX: 'hidden' }}>
            {/* ========== ДЕКОРАТИВНЫЙ ФОН ========== */}
            <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
                <Box sx={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, rgba(79,70,229,0.15) 0%, transparent 70%)`, filter: 'blur(40px)' }} />
                <Box sx={{ position: 'absolute', bottom: '20%', right: '5%', width: 500, height: 500, borderRadius: '50%', background: `radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)`, filter: 'blur(60px)' }} />
                <Box sx={{ position: 'absolute', top: '50%', left: '50%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%)`, filter: 'blur(50px)' }} />
            </Box>

            {/* ========== ХЕДЕР ========== */}
            <AppBar position="sticky" sx={{ bgcolor: 'rgba(15,15,26,0.85)', backdropFilter: 'blur(20px)', boxShadow: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', zIndex: 10 }}>
                <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1200, mx: 'auto', width: '100%' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 32, height: 32, borderRadius: 2, background: `linear-gradient(135deg, ${ACCENT}, #7C3AED)` }} />
                        <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', letterSpacing: -0.5 }}>EdSpace</Typography>
                    </Box>
                    {!isMobile && (
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Button onClick={() => navigate('/login')} sx={{ color: TEXT_DIM, textTransform: 'none', fontWeight: 500, borderRadius: 3, px: 3, '&:hover': { color: TEXT } }}>Войти</Button>
                            <StyledButton onClick={() => navigate('/register')} sx={{ bgcolor: ACCENT, color: 'white', py: 1, px: 4, fontSize: '0.9rem', '&:hover': { bgcolor: '#4338CA' } }}>Попробовать</StyledButton>
                        </Stack>
                    )}
                    {isMobile && <IconButton onClick={() => setMobileMenu(true)} sx={{ color: TEXT }}><MenuIcon /></IconButton>}
                </Toolbar>
            </AppBar>

            {/* ========== МОБИЛЬНОЕ МЕНЮ ========== */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)} PaperProps={{ sx: { bgcolor: SURFACE, color: TEXT } }}>
                <Box sx={{ width: 250, p: 2 }}>
                    <IconButton onClick={() => setMobileMenu(false)} sx={{ color: TEXT, mb: 2 }}><Close /></IconButton>
                    <List>
                        <ListItem button onClick={() => { navigate('/login'); setMobileMenu(false); }}><ListItemText primary="Войти" /></ListItem>
                        <ListItem button onClick={() => { navigate('/register'); setMobileMenu(false); }}><ListItemText primary="Попробовать" sx={{ color: ACCENT }} /></ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* ========== HERO ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, pt: { xs: 10, md: 16 }, pb: { xs: 8, md: 12 } }}>
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    {/* Бейдж */}
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 50, px: 2.5, py: 1, mb: 4 }}>
                        <AutoAwesome sx={{ fontSize: 16, color: ACCENT }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#A78BFA' }}>Бета-тест открыт</Typography>
                    </Box>

                    {/* Заголовок */}
                    <Typography sx={{ fontSize: { xs: '2.2rem', md: '4rem' }, fontWeight: 800, lineHeight: 1.1, mb: 3, letterSpacing: -1 }}>
                        Платформа для{' '}
                        <Box component="span" sx={{ color: ACCENT, position: 'relative' }}>
                            {typedText}
                            <Box component="span" sx={{ animation: `${float} 0.6s ease-in-out infinite`, color: ACCENT }}>|</Box>
                        </Box>
                    </Typography>

                    <Typography sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, color: TEXT_DIM, maxWidth: 500, mx: 'auto', mb: 6, lineHeight: 1.7 }}>
                        Расписание, видео, онлайн-доска, домашки, оплаты — всё, что нужно для проведения занятий. Соберите свой идеальный рабочий день в одном окне.
                    </Typography>

                    {/* Кнопки */}
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 8 }}>
                        <GlowButton onClick={() => navigate('/register')} endIcon={<ArrowForward />}>
                            Начать бесплатно
                        </GlowButton>
                        <StyledButton variant="outlined" onClick={() => navigate('/login')}
                            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: TEXT, '&:hover': { borderColor: 'rgba(255,255,255,0.5)' } }}>
                            Уже есть аккаунт
                        </StyledButton>
                    </Stack>

                    {/* Аватарки */}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <AvatarGroup max={5}>
                            {['#4F46E5', '#7C3AED', '#EC4899', '#10B981', '#F59E0B'].map((color, i) => (
                                <Avatar key={i} sx={{ bgcolor: color, width: 40, height: 40, fontSize: 16, fontWeight: 600, border: '2px solid #0F0F1A' }}>
                                    {['Д', 'А', 'М', 'С', 'Е'][i]}
                                </Avatar>
                            ))}
                        </AvatarGroup>
                        <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>
                            <strong style={{ color: SUCCESS }}>30+</strong> репетиторов уже тестируют
                        </Typography>
                    </Box>
                </Container>
            </Box>

            {/* ========== СТАТИСТИКА ========== */}
            <Box ref={statsRef} sx={{ position: 'relative', zIndex: 1, py: 8, borderTop: '1px solid rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} justifyContent="center">
                        {[
                            { value: '250+', label: 'Проведено занятий' },
                            { value: '30', label: 'Активных учеников' },
                            { value: '200k+', label: 'Заработано репетиторами' },
                            { value: '98%', label: 'Довольных пользователей' },
                        ].map((stat, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <StatNumber sx={{
                                        opacity: statsVisible ? 1 : 0,
                                        transform: statsVisible ? 'translateY(0)' : 'translateY(20px)',
                                        transition: `all 0.6s ease ${i * 0.1}s`,
                                    }}>
                                        {stat.value}
                                    </StatNumber>
                                    <StatLabel>{stat.label}</StatLabel>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ========== ПРЕИМУЩЕСТВА ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 14 } }}>
                <Container maxWidth="lg">
                    <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 700, textAlign: 'center', mb: 2 }}>
                        Почему{' '}
                        <Box component="span" sx={{ background: `linear-gradient(135deg, ${ACCENT}, #A78BFA)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            EdSpace
                        </Box>
                        ?
                    </Typography>
                    <Typography sx={{ textAlign: 'center', color: TEXT_DIM, mb: 8, fontSize: '1.1rem' }}>
                        Три причины, почему репетиторы выбирают нас
                    </Typography>
                    <Grid container spacing={4}>
                        {advantages.map((item, i) => (
                            <Grid item xs={12} md={4} key={i}>
                                <GlassCard>
                                    <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'rgba(79,70,229,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3, color: ACCENT }}>
                                        {item.icon}
                                    </Box>
                                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>{item.title}</Typography>
                                    <Typography sx={{ color: TEXT_DIM, lineHeight: 1.7 }}>{item.desc}</Typography>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ========== ОТЗЫВЫ ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 14 }, bgcolor: '#0A0A14' }}>
                <Container maxWidth="md">
                    <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 700, textAlign: 'center', mb: 2 }}>
                        Что говорят{' '}
                        <Box component="span" sx={{ background: `linear-gradient(135deg, ${ACCENT}, #A78BFA)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            репетиторы
                        </Box>
                    </Typography>
                    <Typography sx={{ textAlign: 'center', color: TEXT_DIM, mb: 8, fontSize: '1.1rem' }}>
                        Присоединяйтесь к тем, кто уже работает на EdSpace
                    </Typography>
                    <Grid container spacing={4}>
                        {testimonials.map((t, i) => (
                            <Grid item xs={12} md={6} key={i}>
                                <GlassCard>
                                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                        <Avatar sx={{ bgcolor: ACCENT, width: 48, height: 48, fontSize: 18, fontWeight: 700 }}>{t.avatar}</Avatar>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600 }}>{t.name}</Typography>
                                            <Typography sx={{ color: TEXT_DIM, fontSize: '0.85rem' }}>{t.role}</Typography>
                                        </Box>
                                    </Stack>
                                    <Typography sx={{ color: '#CBD5E1', lineHeight: 1.8, fontStyle: 'italic', fontSize: '1.05rem' }}>
                                        «{t.text}»
                                    </Typography>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ========== ПОДПИСКА ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 14 } }}>
                <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
                    <Star sx={{ fontSize: 48, color: '#F59E0B', mb: 3 }} />
                    <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.5rem' }, fontWeight: 700, mb: 2 }}>
                        Готовы начать?
                    </Typography>
                    <Typography sx={{ color: TEXT_DIM, mb: 5, fontSize: '1.05rem', lineHeight: 1.7 }}>
                        Оставьте email — и мы пришлём приглашение в бету. Первые 14 дней — бесплатно.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <TextField
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSubscribe()}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 50,
                                    bgcolor: SURFACE,
                                    color: TEXT,
                                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                                    '&.Mui-focused fieldset': { borderColor: ACCENT },
                                },
                                '& .MuiInputBase-input::placeholder': { color: TEXT_DIM },
                            }}
                        />
                        <GlowButton onClick={handleSubscribe} endIcon={<Send />}>
                            Получить доступ
                        </GlowButton>
                    </Stack>
                </Container>
            </Box>

            {/* ========== ФУТЕР ========== */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.04)', py: 4, textAlign: 'center' }}>
                <Container maxWidth="lg">
                    <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>
                        © 2026 EdSpace. Сделано с ❤️ для репетиторов.
                    </Typography>
                </Container>
            </Box>

            <Snackbar open={snackbar} autoHideDuration={4000} onClose={() => setSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" sx={{ borderRadius: 3, bgcolor: '#065F46', color: '#A7F3D0' }}>
                    🎉 Спасибо! Мы свяжемся с вами в ближайшее время.
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LandingPage;