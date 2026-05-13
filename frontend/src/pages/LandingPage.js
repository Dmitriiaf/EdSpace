// ========== frontend/src/pages/LandingPage.js (v3 — С ТАРИФАМИ) ==========
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Button, Typography, Container, Grid,
    AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText,
    useMediaQuery, useTheme, Stack, TextField, Snackbar, Alert,
    Avatar, AvatarGroup
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Menu as MenuIcon, ArrowForward, Star, Send,
    Close, Bolt, VerifiedUser, SupportAgent, AutoAwesome,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ========== АНИМАЦИИ ==========
const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
`;

const glow = keyframes`
    0%, 100% { boxShadow: '0 0 20px rgba(79, 70, 229, 0.3)'; }
    50% { boxShadow: '0 0 40px rgba(79, 70, 229, 0.6)'; }
`;

// ========== СТИЛИ ==========
const ACCENT = '#4F46E5';
const DARK = '#0F0F1A';
const CARD_BG = 'rgba(255, 255, 255, 0.03)';
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
    animation: `${glow} 3s ease-in-out infinite`,
    '&:hover': { transform: 'translateY(-2px)' },
});

const GlassCard = styled(Box)({
    background: CARD_BG,
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
    fontSize: '3rem',
    fontWeight: 800,
    background: `linear-gradient(135deg, ${ACCENT}, #A78BFA)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    lineHeight: 1,
    '@media (max-width: 600px)': { fontSize: '2.2rem' },
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
    const statsRef = useRef(null);
    const [statsVisible, setStatsVisible] = useState(false);

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
        { icon: <Bolt sx={{ fontSize: 28 }} />, title: 'Всё в одном окне', desc: 'Расписание, видеозвонки, онлайн-доска, домашние задания, оплаты и уведомления — одна платформа вместо четырёх сервисов.' },
        { icon: <VerifiedUser sx={{ fontSize: 28 }} />, title: 'Прозрачно для родителей', desc: 'Родители видят расписание, успеваемость и финансы. Сами загружают чеки и оплачивают занятия — вы просто ведёте уроки.' },
        { icon: <SupportAgent sx={{ fontSize: 28 }} />, title: 'Активная доработка', desc: 'Платформа в бета-тесте. Мы каждый день добавляем новые функции по запросам репетиторов. Ваши идеи становятся реальностью.' },
    ];

    const testimonials = [
        { name: 'Дмитрий А.', role: 'Репетитор по информатике', text: 'Наконец-то всё в одном месте. Раньше у меня было 4 разных сервиса, теперь только EdSpace.', avatar: 'ДА' },
        { name: 'Анна К.', role: 'Репетитор по математике', text: 'Родители в восторге — видят расписание и оплачивают занятия сами. Я просто веду уроки.', avatar: 'АК' },
    ];

    return (
        <Box sx={{ bgcolor: DARK, color: '#FFFFFF', minHeight: '100vh', overflowX: 'hidden' }}>
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
                            <Button onClick={() => navigate('/login')} sx={{ color: TEXT_DIM, textTransform: 'none', fontWeight: 500, borderRadius: 3, px: 3, '&:hover': { color: '#FFFFFF' } }}>Войти</Button>
                            <StyledButton onClick={() => navigate('/register')} sx={{ bgcolor: ACCENT, color: 'white', py: 1, px: 4, fontSize: '0.9rem', '&:hover': { bgcolor: '#4338CA' } }}>Попробовать</StyledButton>
                        </Stack>
                    )}
                    {isMobile && <IconButton onClick={() => setMobileMenu(true)} sx={{ color: '#FFFFFF' }}><MenuIcon /></IconButton>}
                </Toolbar>
            </AppBar>

            {/* ========== МОБИЛЬНОЕ МЕНЮ ========== */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)} PaperProps={{ sx: { bgcolor: '#1A1A2E', color: '#FFFFFF' } }}>
                <Box sx={{ width: 250, p: 2 }}>
                    <IconButton onClick={() => setMobileMenu(false)} sx={{ color: '#FFFFFF', mb: 2 }}><Close /></IconButton>
                    <List>
                        <ListItem button onClick={() => { navigate('/login'); setMobileMenu(false); }}><ListItemText primary="Войти" /></ListItem>
                        <ListItem button onClick={() => { navigate('/register'); setMobileMenu(false); }}><ListItemText primary="Попробовать" sx={{ color: ACCENT }} /></ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* ========== HERO ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, pt: { xs: 10, md: 16 }, pb: { xs: 8, md: 12 } }}>
                <Container maxWidth="md" sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, bgcolor: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 50, px: 2.5, py: 1, mb: 4 }}>
                        <AutoAwesome sx={{ fontSize: 16, color: ACCENT }} />
                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: '#A78BFA' }}>Бесплатный пробный период — 14 дней</Typography>
                    </Box>

                    <Typography component="h1" sx={{ fontSize: { xs: '2.2rem', md: '4rem' }, fontWeight: 800, lineHeight: 1.1, mb: 3, letterSpacing: -1 }}>
                        Платформа для{' '}
                        <Box component="span" sx={{ color: ACCENT, position: 'relative' }}>
                            {typedText}
                            <Box component="span" sx={{ animation: `${float} 0.6s ease-in-out infinite`, color: ACCENT }}>|</Box>
                        </Box>
                    </Typography>

                    <Typography sx={{ fontSize: { xs: '1rem', md: '1.2rem' }, color: TEXT_DIM, maxWidth: 550, mx: 'auto', mb: 6, lineHeight: 1.7 }}>
                        Расписание, видео, онлайн-доска, домашние задания, оплаты и уведомления — всё, что нужно для проведения занятий, в одном окне.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 8 }}>
                        <GlowButton onClick={() => navigate('/register')} endIcon={<ArrowForward />}>
                            Начать бесплатно
                        </GlowButton>
                        <StyledButton variant="outlined" onClick={() => navigate('/login')}
                            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', '&:hover': { borderColor: 'rgba(255,255,255,0.5)' } }}>
                            Уже есть аккаунт
                        </StyledButton>
                    </Stack>

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
                            { value: '300+', label: 'Проведено занятий' },
                            { value: '35', label: 'Активных учеников' },
                            { value: '200k+', label: 'Заработано репетиторами' },
                            { value: '24/7', label: 'Поддержка в Telegram' },
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

            {/* ========== ТАРИФЫ ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 14 }, bgcolor: '#0A0A14' }}>
                <Container maxWidth="md">
                    <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 700, textAlign: 'center', mb: 2 }}>
                        Выберите{' '}
                        <Box component="span" sx={{ background: `linear-gradient(135deg, ${ACCENT}, #A78BFA)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            тариф
                        </Box>
                    </Typography>
                    <Typography sx={{ textAlign: 'center', color: TEXT_DIM, mb: 3, fontSize: '1.1rem' }}>
                        14 дней бесплатно — карта не нужна. Отменить можно в любой момент.
                    </Typography>
                    <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 800, mx: 'auto' }}>
                        {/* Пробный */}
                        <Grid item xs={12} sm={6}>
                            <GlassCard sx={{ textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, mb: 1 }}>Пробный</Typography>
                                <Typography sx={{ color: TEXT_DIM, mb: 3, fontSize: '0.95rem' }}>Для знакомства с платформой</Typography>
                                <Typography sx={{ fontSize: '3rem', fontWeight: 800, mb: 4 }}>0 ₽</Typography>
                                <Box sx={{ textAlign: 'left', mb: 4 }}>
                                    {['14 дней бесплатно', 'До 5 учеников', 'Все функции платформы', 'Расписание', 'Видеозвонки', 'Домашние задания', 'Финансовый учёт'].map((f, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <CheckIcon sx={{ color: SUCCESS, fontSize: 18 }} />
                                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.9rem' }}>{f}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <StyledButton fullWidth onClick={() => navigate('/register')}
                                    sx={{ bgcolor: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', '&:hover': { borderColor: ACCENT } }}>
                                    Начать бесплатно
                                </StyledButton>
                            </GlassCard>
                        </Grid>

                        {/* Профи */}
                        <Grid item xs={12} sm={6}>
                            <GlassCard sx={{ 
                                textAlign: 'center', 
                                position: 'relative',
                                border: `2px solid ${ACCENT}`,
                            }}>
                                <Box sx={{ 
                                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                                    bgcolor: ACCENT, color: '#fff', px: 2.5, py: 0.5, borderRadius: 50, fontSize: '0.85rem', fontWeight: 600
                                }}>
                                    Основной
                                </Box>
                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 700, mb: 1 }}>Профи</Typography>
                                <Typography sx={{ color: TEXT_DIM, mb: 3, fontSize: '0.95rem' }}>Для активных репетиторов</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', mb: 1 }}>
                                    <Typography sx={{ fontSize: '3rem', fontWeight: 800 }}>500</Typography>
                                    <Typography sx={{ color: TEXT_DIM, fontSize: '1.5rem', ml: 0.5 }}>₽/мес</Typography>
                                </Box>
                                <Box sx={{ textAlign: 'left', mb: 4 }}>
                                    {['Всё из Пробного', 'Безлимит учеников', 'Полный финансовый учёт с прогнозами', 'Родительский кабинет', 'Экспорт чеков', 'Приоритетная поддержка', 'Реферальная программа'].map((f, i) => (
                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                            <CheckIcon sx={{ color: SUCCESS, fontSize: 18 }} />
                                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.9rem' }}>{f}</Typography>
                                        </Box>
                                    ))}
                                </Box>
                                <StyledButton fullWidth onClick={() => navigate('/register')}
                                    sx={{ bgcolor: ACCENT, color: '#fff', '&:hover': { bgcolor: '#4338CA' } }}>
                                    Попробовать
                                </StyledButton>
                            </GlassCard>
                        </Grid>
                    </Grid>
                    <Typography sx={{ textAlign: 'center', color: TEXT_DIM, mt: 4, fontSize: '0.85rem' }}>
                        Все функции доступны с первого дня. Ограничиваем только количество учеников в пробном периоде.
                    </Typography>
                </Container>
            </Box>

            {/* ========== FAQ ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 14 } }}>
                <Container maxWidth="sm">
                    <Typography sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 700, textAlign: 'center', mb: 6 }}>
                        Частые вопросы
                    </Typography>
                    {[
                        { q: 'Можно ли отменить подписку в любой момент?', a: 'Да, вы можете отменить подписку в любой момент. Все данные сохранятся, вы просто вернётесь на бесплатный тариф.' },
                        { q: 'Нужно ли привязывать карту для пробного периода?', a: 'Нет. 14 дней бесплатно без привязки карты. Просто зарегистрируйтесь и пользуйтесь.' },
                        { q: 'Что будет после пробного периода?', a: 'Вы сможете выбрать тариф Профи за 500 ₽/мес или остаться на бесплатном с ограничением в 5 учеников.' },
                        { q: 'Подходит ли EdSpace для групповых занятий?', a: 'Да, вы можете создавать группы и вести занятия для нескольких учеников одновременно. Видеозвонки и доски работают для групп.' },
                    ].map((faq, i) => (
                        <GlassCard key={i} sx={{ mb: 3, p: 3 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '1.05rem', mb: 1 }}>{faq.q}</Typography>
                            <Typography sx={{ color: TEXT_DIM, fontSize: '0.95rem', lineHeight: 1.6 }}>{faq.a}</Typography>
                        </GlassCard>
                    ))}
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
                        Присоединяйтесь к бета-тесту. Первые 14 дней — бесплатно. Мы поможем настроить всё под вас.
                    </Typography>
                    <GlowButton onClick={() => navigate('/register')} endIcon={<ArrowForward />}>
                        Начать бесплатно
                    </GlowButton>
                </Container>
            </Box>

            {/* ========== ФУТЕР ========== */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.04)', py: 4, textAlign: 'center' }}>
                <Container maxWidth="lg">
                    <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>
                        © 2026 EdSpace. Сделано с ❤️ для репетиторов. Сейчас платформа в стадии бета-тестирования.
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