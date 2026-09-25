import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Container, Grid, AppBar, Toolbar,
    IconButton, Drawer, Stack, TextField, Dialog, DialogContent,
    DialogTitle, Select, MenuItem, FormControl, InputLabel, Snackbar,
    Alert, Divider, Fade
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Menu as MenuIcon, Close, Telegram, ArrowForward,
    Add as Plus, Remove as Minus
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ========== ПАЛИТРА SECREP ==========
const BG = '#FAFAFA';
const BG_ALT = '#F5F5F7';
const DARK = '#141414';
const DARK_ALT = '#1F1F1F';
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
const BLUE_SOFT = '#E0E7FF';

// ========== ТИПОГРАФИКА ==========
const T = {
    h1: { fontSize: { xs: '3.4rem', md: '5.6rem' }, lineHeight: 0.95, letterSpacing: '-0.05em', fontWeight: 900, color: INK },
    h2: { fontSize: { xs: '1.8rem', md: '2.6rem' }, lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 800, color: INK },
    h3: { fontSize: { xs: '1.1rem', md: '1.25rem' }, lineHeight: 1.25, letterSpacing: '-0.02em', fontWeight: 700, color: INK },
    body: { fontSize: { xs: '0.95rem', md: '1rem' }, lineHeight: 1.6, color: INK_SOFT },
    bodySmall: { fontSize: '0.88rem', lineHeight: 1.55, color: INK_SOFT },
};

// ========== АНИМАЦИИ ==========
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
`;

// ========== SVG ИКОНКИ ==========
const Sparkle = ({ size = 20, color = LIME, style = {} }) => (
    <Box component="svg" viewBox="0 0 24 24" sx={{ width: size, height: size, ...style }}>
        <path d="M12 0 L14 10 L24 12 L14 14 L12 24 L10 14 L0 12 L10 10 Z" fill={color} />
    </Box>
);

// ========== КОМПОНЕНТЫ ==========
const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.8s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const SerifAccent = styled('span')({
    fontFamily: '"Playfair Display", "Georgia", serif',
    fontStyle: 'italic',
    fontWeight: 500,
    letterSpacing: '-0.01em',
});

const PillButton = styled(Button)(({ $variant = 'dark' }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '1rem',
    padding: '16px 32px',
    borderRadius: 100,
    fontFamily: '"Inter", sans-serif',
    transition: 'all 0.2s ease',
    boxShadow: 'none',
    ...($variant === 'dark' && {
        background: DARK,
        color: '#FFF',
        '&:hover': {
            background: '#000',
            transform: 'translateY(-1px)',
            boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
        },
    }),
    ...($variant === 'light' && {
        background: '#FFF',
        color: INK,
        border: `1px solid ${LINE}`,
        '&:hover': {
            background: BG_ALT,
            borderColor: INK,
        },
    }),
    ...($variant === 'gradient' && {
        background: `linear-gradient(135deg, ${PURPLE} 0%, ${PINK} 100%)`,
        color: '#FFF',
        '&:hover': {
            background: `linear-gradient(135deg, ${PURPLE} 20%, ${PINK} 100%)`,
            transform: 'translateY(-1px)',
            boxShadow: `0 12px 30px rgba(123,92,250,0.35)`,
        },
    }),
    ...($variant === 'lime' && {
        background: LIME,
        color: DARK,
        '&:hover': {
            background: LIME_SOFT,
            transform: 'translateY(-1px)',
            boxShadow: '0 12px 30px rgba(196,245,66,0.4)',
        },
    }),
}));

const NavLink = styled(Button)({
    color: INK_SOFT,
    textTransform: 'none',
    fontWeight: 500,
    fontSize: '0.95rem',
    padding: '6px 0',
    minWidth: 0,
    fontFamily: '"Inter", sans-serif',
    transition: 'color 0.2s ease',
    '&:hover': { background: 'transparent', color: INK },
});

// ========== ДАННЫЕ ==========
const REVIEWS = Array.from({ length: 11 }, (_, i) => ({
    id: i + 1, image: `/reviews/${i + 1}.jpg`, alt: `Отзыв ${i + 1}`,
}));

const examResults = [
    { year: '2022', score: 74 },
    { year: '2023', score: 72 },
    { year: '2024', score: 76 },
    { year: '2025', score: 73 },
    { year: '2026', score: 75 },
];

const platformFeatures = [
    { num: '01', title: 'Расписание', desc: 'Все занятия в календаре с напоминаниями.', icon: '📅', tone: PURPLE_SOFT },
    { num: '02', title: 'Домашние задания', desc: 'Сдаются и проверяются прямо в кабинете.', icon: '📝', tone: PINK_SOFT },
    { num: '03', title: 'Видеозанятия', desc: 'Google Meet открывается в один клик.', icon: '🎥', tone: BLUE_SOFT },
    { num: '04', title: 'Интерактивная доска', desc: 'Разбираем задачи вместе, в реальном времени.', icon: '✏️', tone: '#FFF3D6' },
    { num: '05', title: 'Прогресс', desc: 'Видно, какие темы пройдены и где закрепить.', icon: '📊', tone: '#D9F5E0' },
    { num: '06', title: 'Оплата', desc: 'Абонементы и платежи учитываются автоматически.', icon: '💳', tone: PURPLE_SOFT },
];

const studentPoints = [
    'Все материалы, конспекты и записи — в одном месте',
    'История занятий: можно вернуться к любой теме',
    'Прогресс по темам — не абстрактно, а конкретно',
    'Напоминания про уроки и дедлайны домашек',
];

const parentPoints = [
    'Видно, что было на уроке: тема, конспект, задачи',
    'Видно, что задавали и как ребёнок справился',
    'Посещаемость и активность на занятиях',
    'Оценки и комментарии после каждого урока',
];

const directions = [
    { title: 'ЕГЭ по информатике', desc: 'С 10 класса, спокойно и без паники', tone: LIME_SOFT },
    { title: 'ОГЭ по информатике', desc: 'С 8–9 класса', tone: PINK_SOFT },
    { title: 'Python с нуля', desc: 'От основ до небольших проектов', tone: PURPLE_SOFT },
    { title: 'Школьная программа', desc: 'Домашка, контрольные, зачёты', tone: BLUE_SOFT },
];

const faqItems = [
    { q: 'Как проходят занятия?', a: 'Онлайн, в Google Meet. Дополнительно — интерактивная доска, чтобы разбирать задачи вместе. Всё открывается прямо из личного кабинета.' },
    { q: 'Что такое EdSpace?', a: 'Это моя платформа для занятий. Расписание, домашние задания, видеозвонки, доска, материалы и прогресс — в одном месте. У ученика и родителя — свои кабинеты.' },
    { q: 'Сколько нужно заниматься в неделю?', a: 'Стандартно — 2 раза в неделю по часу. При плотной подготовке к ЕГЭ можно 3 раза. Всё обсуждаем индивидуально на пробном уроке.' },
    { q: 'Вы даёте гарантию результата?', a: 'Я не обещаю «100 баллов каждому». Обещаю понятную систему, честную работу и обратную связь. За 5 лет средний балл моих учеников — 74+, и это закономерность, а не удача.' },
    { q: 'Что нужно для первого урока?', a: 'Только стабильный интернет и компьютер. Остальное — платформа, доска, материалы — я подключаю сам. Первое занятие бесплатное.' },
];

// ========== КОМПОНЕНТ ==========
const LandingPage = () => {
    const navigate = useNavigate();
    const [mobileMenu, setMobileMenu] = useState(false);
    const [studentDialog, setStudentDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [selectedReview, setSelectedReview] = useState(null);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [showReviews, setShowReviews] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);
    const [studentForm, setStudentForm] = useState({ name: '', phone: '', goal: 'Подготовка к ЕГЭ' });

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 400);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const handleStudentSubmit = async () => {
        if (!studentForm.name || !studentForm.phone) {
            setSnackbar({ open: true, message: 'Заполните имя и телефон', severity: 'warning' });
            return;
        }
        try {
            await axios.post('/api/leads/student', { ...studentForm, subject: 'Информатика', tariff: 'Индивидуально' });
            setStudentDialog(false);
            setSnackbar({ open: true, message: 'Заявка отправлена. Отвечу в течение дня.', severity: 'success' });
            setStudentForm({ name: '', phone: '', goal: 'Подготовка к ЕГЭ' });
        } catch {
            setSnackbar({ open: true, message: 'Ошибка. Позвоните: +7 950 432-18-06', severity: 'error' });
        }
    };

    const nextReview = () => setReviewIndex((p) => (p + 1) % REVIEWS.length);
    const prevReview = () => setReviewIndex((p) => (p - 1 + REVIEWS.length) % REVIEWS.length);

    return (
        <Box sx={{
            bgcolor: BG,
            color: INK,
            minHeight: '100vh',
            fontFamily: '"Inter", "Segoe UI", sans-serif',
            position: 'relative',
            overflow: 'hidden',
        }}>

            {/* HEADER */}
            <AppBar position="sticky" elevation={0} sx={{
                bgcolor: scrolled ? 'rgba(250,250,250,0.85)' : 'transparent',
                backdropFilter: scrolled ? 'blur(20px)' : 'none',
                borderBottom: scrolled ? `1px solid ${LINE}` : '1px solid transparent',
                transition: 'all 0.3s ease',
                zIndex: 10,
            }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 2 }}>
                        <Stack
                            direction="row" alignItems="center" spacing={1}
                            onClick={() => window.scrollTo(0, 0)} sx={{ cursor: 'pointer' }}
                        >
                            <Typography sx={{
                                fontWeight: 900, fontSize: '1.5rem',
                                color: INK, letterSpacing: '-0.04em',
                                fontFamily: '"Inter", sans-serif',
                            }}>
                                EdSpace
                            </Typography>
                        </Stack>

                        <Stack direction="row" spacing={4} alignItems="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
                            <NavLink onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}>Обо мне</NavLink>
                            <NavLink onClick={() => document.getElementById('platform')?.scrollIntoView({ behavior: 'smooth' })}>Платформа</NavLink>
                            <NavLink onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>Вопросы</NavLink>
                            <NavLink onClick={() => navigate('/login')}>Войти</NavLink>
                            <PillButton $variant="dark" onClick={() => setStudentDialog(true)} sx={{ py: 1.2, px: 3, fontSize: '0.9rem' }}>
                                Записаться
                            </PillButton>
                        </Stack>

                        <IconButton onClick={() => setMobileMenu(true)} sx={{ display: { xs: 'flex', md: 'none' }, color: INK }}>
                            <MenuIcon />
                        </IconButton>
                    </Toolbar>
                </Container>
            </AppBar>

            {/* MOBILE MENU */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)}
                PaperProps={{ sx: { bgcolor: BG, border: 'none' } }}>
                <Box sx={{ p: 4, width: 300 }}>
                    <Stack spacing={4}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography sx={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.03em', color: INK }}>EdSpace</Typography>
                            <IconButton onClick={() => setMobileMenu(false)} sx={{ color: INK }}><Close /></IconButton>
                        </Stack>
                        <Divider sx={{ borderColor: LINE }} />
                        {[
                            { label: 'Обо мне', id: 'about' },
                            { label: 'Платформа', id: 'platform' },
                            { label: 'Вопросы', id: 'faq' },
                        ].map((item, i) => (
                            <Typography
                                key={i}
                                onClick={() => { document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' }); setMobileMenu(false); }}
                                sx={{ fontSize: '1.05rem', fontWeight: 500, cursor: 'pointer', color: INK }}
                            >
                                {item.label}
                            </Typography>
                        ))}
                        <Divider sx={{ borderColor: LINE }} />
                        <Typography
                            onClick={() => { navigate('/login'); setMobileMenu(false); }}
                            sx={{ fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', color: INK_SOFT }}
                        >
                            Войти в кабинет
                        </Typography>
                        <Typography sx={{ fontSize: '0.9rem', color: INK_MUTED }}>+7 950 432-18-06</Typography>
                    </Stack>
                </Box>
            </Drawer>

            {/* HERO */}
            <Container maxWidth="lg" sx={{ pt: { xs: 5, md: 8 }, pb: { xs: 7, md: 10 }, position: 'relative', zIndex: 1 }}>
                <Reveal>
                    <Box sx={{ textAlign: 'center', mb: { xs: 6, md: 7 } }}>
                        <Typography sx={{ ...T.h1, mb: 2.5 }}>
                            EdSpace
                        </Typography>
                        <Typography sx={{
                            fontSize: { xs: '1.05rem', md: '1.25rem' },
                            fontWeight: 500,
                            color: INK_SOFT,
                            letterSpacing: '-0.01em',
                        }}>
                            персональная платформа{' '}
                            <SerifAccent sx={{ color: INK, fontSize: '1.15em' }}>
                                для подготовки к ЕГЭ по информатике
                            </SerifAccent>
                        </Typography>
                    </Box>
                </Reveal>

                <Grid container spacing={3} alignItems="stretch">
                    {/* Левая карточка — доверие */}
                    <Grid item xs={12} md={4}>
                        <Reveal delay={0.1}>
                            <Box sx={{
                                bgcolor: BG_ALT,
                                borderRadius: 5,
                                p: 3.5,
                                height: '100%',
                                position: 'relative',
                                minHeight: 260,
                                overflow: 'hidden',
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: INK }}>
                                        Мне доверяет
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Sparkle size={20} color={PURPLE} />
                                        <Sparkle size={14} color={PURPLE} style={{ marginTop: 8 }} />
                                    </Stack>
                                </Box>
                                <Typography sx={{
                                    fontFamily: '"Playfair Display", serif',
                                    fontSize: { xs: '2rem', md: '2.4rem' },
                                    fontWeight: 500,
                                    lineHeight: 1,
                                    color: INK,
                                    mb: 1,
                                }}>
                                    153 <Box component="span" sx={{ color: PURPLE }}>ученика</Box>
                                </Typography>
                                <Typography sx={{ fontSize: '0.88rem', color: INK_SOFT, mb: 3.5 }}>
                                    за 5 лет преподавания
                                </Typography>
                                <Stack direction="row" spacing={-1}>
                                    {[1, 2, 3, 4].map((i) => (
                                        <Box key={i} sx={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            border: `2px solid ${BG_ALT}`,
                                            background: `linear-gradient(135deg, ${[PURPLE, PINK, LIME, '#4A7CFA'][i-1]}, ${[PURPLE, PINK, LIME, '#4A7CFA'][i-1]}dd)`,
                                            ml: i > 1 ? -2 : 0,
                                        }} />
                                    ))}
                                    <Box sx={{
                                        width: 40, height: 40, borderRadius: '50%',
                                        border: `2px solid ${BG_ALT}`,
                                        bgcolor: INK, color: '#FFF',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.78rem', fontWeight: 700,
                                        ml: -2,
                                    }}>+</Box>
                                </Stack>
                            </Box>
                        </Reveal>
                    </Grid>

                    {/* Центральная колонка */}
                    <Grid item xs={12} md={4}>
                        <Reveal delay={0.2}>
                            <Box sx={{
                                textAlign: 'center',
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-end',
                                pt: 1,
                            }}>
                                <Box sx={{
                                    position: 'relative',
                                    width: 170,
                                    height: 170,
                                    animation: `${float} 4s ease-in-out infinite`,
                                    mb: 3.5,
                                }}>
                                    <Box sx={{
                                        position: 'absolute', inset: -40,
                                        background: `radial-gradient(circle, ${PINK_SOFT} 0%, transparent 65%)`,
                                        filter: 'blur(20px)',
                                        borderRadius: '50%',
                                    }} />
                                    <Box component="svg" viewBox="0 0 100 100" sx={{ width: '100%', height: '100%', position: 'relative' }}>
                                        <path d="M50 5 L58 30 L83 25 L65 43 L85 58 L60 58 L60 85 L50 65 L40 85 L40 58 L15 58 L35 43 L17 25 L42 30 Z"
                                              fill={PURPLE} stroke={DARK} strokeWidth="2" strokeLinejoin="round" />
                                        <ellipse cx="38" cy="52" rx="11" ry="9" fill={DARK} />
                                        <ellipse cx="62" cy="52" rx="11" ry="9" fill={DARK} />
                                        <rect x="48" y="50" width="4" height="2" fill={DARK} />
                                        <circle cx="40" cy="50" r="2.5" fill="#FFF" />
                                        <circle cx="64" cy="50" r="2.5" fill="#FFF" />
                                    </Box>
                                    <Sparkle size={22} color={LIME} style={{ position: 'absolute', top: -10, left: -20 }} />
                                    <Sparkle size={16} color={PINK} style={{ position: 'absolute', bottom: 10, right: -20 }} />
                                </Box>

                                <PillButton
                                    $variant="dark"
                                    onClick={() => setStudentDialog(true)}
                                    sx={{ px: 4.5, py: 1.8 }}
                                >
                                    Начать бесплатно
                                </PillButton>
                            </Box>
                        </Reveal>
                    </Grid>

                    {/* Правая карточка — список */}
                    <Grid item xs={12} md={4}>
                        <Reveal delay={0.3}>
                            <Box sx={{
                                bgcolor: BG_ALT,
                                borderRadius: 5,
                                p: 3.5,
                                height: '100%',
                                minHeight: 260,
                            }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: INK, mb: 2.5 }}>
                                    Что вас ждёт:
                                </Typography>
                                <Stack spacing={1.25}>
                                    {[
                                        'Готовлю к ЕГЭ на 85+ баллов',
                                        'Своя платформа для занятий',
                                        'Кабинеты для ученика и родителя',
                                        'Пробное занятие — бесплатно',
                                    ].map((t, i) => (
                                        <Box key={i} sx={{
                                            bgcolor: CARD,
                                            borderRadius: 3,
                                            px: 2,
                                            py: 1.5,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 1.5,
                                        }}>
                                            <Sparkle size={14} color={PINK} />
                                            <Typography sx={{ fontSize: '0.88rem', fontWeight: 500, color: INK }}>
                                                {t}
                                            </Typography>
                                        </Box>
                                    ))}
                                </Stack>
                            </Box>
                        </Reveal>
                    </Grid>
                </Grid>

                {/* БИОГРАФИЯ ПОД HERO */}
                <Reveal delay={0.4}>
                    <Grid container spacing={4} sx={{ mt: { xs: 5, md: 6 } }} alignItems="center">
                        <Grid item xs={12} md={7}>
                            <Typography sx={{
                                fontSize: { xs: '1rem', md: '1.08rem' },
                                lineHeight: 1.6,
                                color: INK_SOFT,
                                maxWidth: 560,
                                mb: 3,
                            }}>
                                Меня зовут <Box component="span" sx={{ color: INK, fontWeight: 600 }}>Дмитрий Атрощенко</Box>.
                                Учу понимать логику и алгоритмы, а не просто решать тесты. Занимаемся
                                на моей платформе EdSpace — у ученика и родителя есть свой кабинет.
                            </Typography>
                            <Stack direction="row" spacing={5} sx={{ pt: 3, borderTop: `1px solid ${LINE}` }}>
                                {[
                                    { num: '5', label: 'лет опыта' },
                                    { num: '153', label: 'ученика' },
                                    { num: '74+', label: 'средний балл' },
                                ].map((s, i) => (
                                    <Box key={i}>
                                        <Typography sx={{
                                            fontWeight: 800,
                                            fontSize: { xs: '1.5rem', md: '1.8rem' },
                                            lineHeight: 1,
                                            color: INK,
                                            letterSpacing: '-0.03em',
                                        }}>
                                            {s.num}
                                        </Typography>
                                        <Typography sx={{
                                            fontSize: '0.75rem', color: INK_MUTED,
                                            mt: 0.5, fontWeight: 500,
                                        }}>
                                            {s.label}
                                        </Typography>
                                    </Box>
                                ))}
                            </Stack>
                        </Grid>
                        <Grid item xs={12} md={5}>
                            <Box sx={{
                                aspectRatio: '4/5',
                                maxWidth: 300,
                                ml: 'auto',
                                background: `url(/photos/tutor.jpg) center/cover, ${BG_ALT}`,
                                borderRadius: 5,
                                border: `1px solid ${LINE}`,
                            }} />
                        </Grid>
                    </Grid>
                </Reveal>
            </Container>

            {/* ТЁМНАЯ СЕКЦИЯ — ФУНКЦИИ */}
            <Box id="platform" sx={{
                bgcolor: DARK,
                color: '#FFF',
                py: { xs: 8, md: 11 },
                position: 'relative',
                zIndex: 1,
                mt: { xs: 3, md: 6 },
            }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: { xs: 5, md: 6 } }}>
                            <Typography sx={{
                                fontWeight: 800,
                                fontSize: { xs: '2rem', md: '3rem' },
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                                color: '#FFF',
                            }}>
                                Возможности <SerifAccent sx={{ color: LIME, fontSize: '1.15em' }}>платформы</SerifAccent>
                            </Typography>
                        </Box>
                    </Reveal>

                    <Grid container spacing={2.5}>
                        {platformFeatures.map((f, i) => (
                            <Grid item xs={12} sm={6} md={4} key={i}>
                                <Reveal delay={0.05 * i}>
                                    <Box sx={{
                                        bgcolor: DARK_ALT,
                                        borderRadius: 4,
                                        p: 3,
                                        height: '100%',
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            bgcolor: '#252525',
                                        },
                                    }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2.5 }}>
                                            <Box sx={{
                                                width: 44, height: 44, borderRadius: 2.5,
                                                bgcolor: f.tone,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                fontSize: '1.3rem',
                                            }}>
                                                {f.icon}
                                            </Box>
                                            <Typography sx={{
                                                fontSize: '0.88rem',
                                                fontWeight: 700,
                                                color: 'rgba(255,255,255,0.3)',
                                                fontFamily: '"Playfair Display", serif',
                                                fontStyle: 'italic',
                                            }}>
                                                {f.num}
                                            </Typography>
                                        </Stack>
                                        <Typography sx={{ fontSize: '1.08rem', fontWeight: 700, mb: 0.75, color: '#FFF' }}>
                                            {f.title}
                                        </Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.55 }}>
                                            {f.desc}
                                        </Typography>
                                    </Box>
                                </Reveal>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ОБО МНЕ */}
            <Box id="about" sx={{ py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Typography sx={{ ...T.h2, mb: 5 }}>
                            Обо <SerifAccent>мне</SerifAccent>
                        </Typography>
                    </Reveal>

                    <Grid container spacing={{ xs: 3.5, md: 5 }}>
                        <Grid item xs={12} md={7}>
                            <Reveal delay={0.1}>
                                <Stack spacing={2}>
                                    <Typography sx={{
                                        fontSize: { xs: '1rem', md: '1.05rem' },
                                        lineHeight: 1.6,
                                        color: INK,
                                        fontWeight: 500,
                                    }}>
                                        Окончил СФУ («Информационные системы и технологии»), учусь
                                        в магистратуре КГПУ на «Цифровую трансформацию образования».
                                    </Typography>
                                    <Typography sx={T.body}>
                                        За 5 лет — больше 153 учеников. Средний балл на ЕГЭ за последние
                                        годы — <Box component="span" sx={{ color: INK, fontWeight: 600 }}>74+</Box>.
                                        Не обещаю «100 баллов каждому», но обещаю понятную систему
                                        и честную работу.
                                    </Typography>
                                    <Typography sx={T.body}>
                                        EdSpace я сделал для того, чтобы уроки были организованными:
                                        расписание, домашки, материалы и прогресс — в одном месте.
                                    </Typography>
                                </Stack>
                            </Reveal>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <Reveal delay={0.2}>
                                <Box sx={{
                                    background: `linear-gradient(135deg, ${PURPLE} 0%, ${PINK} 100%)`,
                                    borderRadius: 5,
                                    p: 3.5,
                                    color: '#FFF',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}>
                                    <Box sx={{
                                        position: 'absolute',
                                        top: 20, right: 20,
                                    }}>
                                        <Sparkle size={26} color={LIME} />
                                    </Box>
                                    <Typography sx={{
                                        fontFamily: '"Playfair Display", serif',
                                        fontStyle: 'italic',
                                        fontSize: { xs: '1.4rem', md: '1.7rem' },
                                        fontWeight: 500,
                                        lineHeight: 1.2,
                                        mb: 2.5,
                                        letterSpacing: '-0.01em',
                                    }}>
                                        Сначала обо мне,<br />потом о подходе
                                    </Typography>
                                    <Typography sx={{ lineHeight: 1.6, mb: 1.5, fontSize: '0.92rem', opacity: 0.95 }}>
                                        Меня зовут Дмитрий Атрощенко. Учу понимать логику и алгоритмы,
                                        а не просто решать тесты. Занимаемся на моей платформе EdSpace —
                                        у ученика и родителя есть свой кабинет.
                                    </Typography>
                                    <Typography sx={{ lineHeight: 1.6, fontSize: '0.92rem', opacity: 0.95 }}>
                                        Спешка на старте — главная причина, почему ученики боятся экзамена.
                                        Поэтому первые занятия разбираем базу спокойно, на ручных задачах,
                                        а к концу года закрываем большую часть первой части ЕГЭ.
                                    </Typography>
                                </Box>
                            </Reveal>
                        </Grid>
                    </Grid>

                    <Reveal delay={0.3}>
                        <Box sx={{ mt: 8 }}>
                            <Typography sx={{ ...T.h2, fontSize: { xs: '1.5rem', md: '2rem' }, mb: 3.5 }}>
                                Направления <SerifAccent>подготовки</SerifAccent>
                            </Typography>
                            <Grid container spacing={2}>
                                {directions.map((item, i) => (
                                    <Grid item xs={12} sm={6} key={i}>
                                        <Box sx={{
                                            p: 3,
                                            height: '100%',
                                            background: item.tone,
                                            borderRadius: 4,
                                            transition: 'transform 0.25s ease',
                                            '&:hover': { transform: 'translateY(-3px)' },
                                        }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 0.75, color: INK }}>
                                                {item.title}
                                            </Typography>
                                            <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem', lineHeight: 1.55 }}>
                                                {item.desc}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    </Reveal>
                </Container>
            </Box>

            {/* УЧЕНИКУ / РОДИТЕЛЮ */}
            <Box sx={{ bgcolor: BG_ALT, py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={{ xs: 3, md: 4 }}>
                        <Grid item xs={12} md={6}>
                            <Reveal>
                                <Box sx={{
                                    background: `linear-gradient(135deg, ${PURPLE} 0%, #9B7FFB 100%)`,
                                    borderRadius: 5,
                                    p: { xs: 3.5, md: 4 },
                                    height: '100%',
                                    color: '#FFF',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}>
                                    <Box sx={{ position: 'absolute', top: 22, right: 22 }}>
                                        <Sparkle size={22} color={LIME} />
                                    </Box>
                                    <Typography sx={{
                                        fontFamily: '"Playfair Display", serif',
                                        fontStyle: 'italic',
                                        fontSize: '0.9rem',
                                        opacity: 0.85,
                                        mb: 0.5,
                                    }}>
                                        Ученику
                                    </Typography>
                                    <Typography sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: '1.5rem', md: '1.85rem' },
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        mb: 3,
                                    }}>
                                        Всё нужное —<br />под рукой
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {studentPoints.map((t, i) => (
                                            <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                                                <Box sx={{
                                                    mt: 0.4, flexShrink: 0,
                                                    width: 18, height: 18, borderRadius: '50%',
                                                    bgcolor: LIME,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.65rem', fontWeight: 900, color: DARK,
                                                }}>✓</Box>
                                                <Typography sx={{ lineHeight: 1.5, fontSize: '0.92rem', fontWeight: 500 }}>
                                                    {t}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            </Reveal>
                        </Grid>

                        <Grid item xs={12} md={6}>
                            <Reveal delay={0.15}>
                                <Box sx={{
                                    background: `linear-gradient(135deg, ${PINK} 0%, #FF8FBF 100%)`,
                                    borderRadius: 5,
                                    p: { xs: 3.5, md: 4 },
                                    height: '100%',
                                    color: '#FFF',
                                    position: 'relative',
                                    overflow: 'hidden',
                                }}>
                                    <Box sx={{ position: 'absolute', top: 22, right: 22 }}>
                                        <Sparkle size={22} color={LIME} />
                                    </Box>
                                    <Typography sx={{
                                        fontFamily: '"Playfair Display", serif',
                                        fontStyle: 'italic',
                                        fontSize: '0.9rem',
                                        opacity: 0.85,
                                        mb: 0.5,
                                    }}>
                                        Родителю
                                    </Typography>
                                    <Typography sx={{
                                        fontWeight: 800,
                                        fontSize: { xs: '1.5rem', md: '1.85rem' },
                                        lineHeight: 1.15,
                                        letterSpacing: '-0.02em',
                                        mb: 3,
                                    }}>
                                        Всё видно<br />в личном кабинете
                                    </Typography>
                                    <Stack spacing={1.5}>
                                        {parentPoints.map((t, i) => (
                                            <Stack key={i} direction="row" spacing={1.5} alignItems="flex-start">
                                                <Box sx={{
                                                    mt: 0.4, flexShrink: 0,
                                                    width: 18, height: 18, borderRadius: '50%',
                                                    bgcolor: LIME,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    fontSize: '0.65rem', fontWeight: 900, color: DARK,
                                                }}>✓</Box>
                                                <Typography sx={{ lineHeight: 1.5, fontSize: '0.92rem', fontWeight: 500 }}>
                                                    {t}
                                                </Typography>
                                            </Stack>
                                        ))}
                                    </Stack>
                                </Box>
                            </Reveal>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* РЕЗУЛЬТАТЫ */}
            <Box sx={{ py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Typography sx={{ ...T.h2 }}>
                                Средний балл <SerifAccent>на ЕГЭ</SerifAccent>
                            </Typography>
                            <Typography sx={{ ...T.body, mt: 1.5, maxWidth: 500, mx: 'auto' }}>
                                За последние 5 лет — стабильно 72–76. Средний за 5 лет: 74.
                            </Typography>
                        </Box>
                    </Reveal>

                    <Grid container spacing={2}>
                        {examResults.map((r, i) => (
                            <Grid item xs={6} sm={4} md={2.4} key={i} sx={{ flexGrow: 1 }}>
                                <Reveal delay={0.06 * i}>
                                    <Box sx={{
                                        py: 3.5,
                                        px: 2,
                                        background: i === examResults.length - 1
                                            ? `linear-gradient(135deg, ${PURPLE} 0%, ${PINK} 100%)`
                                            : CARD,
                                        borderRadius: 4,
                                        border: `1px solid ${i === examResults.length - 1 ? 'transparent' : LINE}`,
                                        textAlign: 'center',
                                        transition: 'transform 0.25s ease',
                                        '&:hover': { transform: 'translateY(-4px)' },
                                    }}>
                                        <Typography sx={{
                                            fontWeight: 800,
                                            fontSize: { xs: '2rem', md: '2.5rem' },
                                            lineHeight: 1,
                                            color: i === examResults.length - 1 ? '#FFF' : INK,
                                            letterSpacing: '-0.04em',
                                        }}>
                                            {r.score}
                                        </Typography>
                                        <Typography sx={{
                                            color: i === examResults.length - 1 ? 'rgba(255,255,255,0.7)' : INK_MUTED,
                                            fontSize: '0.75rem',
                                            mt: 1, fontWeight: 600,
                                            letterSpacing: '0.1em',
                                        }}>
                                            {r.year}
                                        </Typography>
                                    </Box>
                                </Reveal>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* FAQ */}
            <Box id="faq" sx={{ bgcolor: BG_ALT, py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="sm">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Typography sx={{ ...T.h2 }}>
                                Что важно <SerifAccent>знать</SerifAccent>
                            </Typography>
                        </Box>
                    </Reveal>

                    <Stack spacing={1.25}>
                        {faqItems.map((item, i) => (
                            <Reveal key={i} delay={0.05 * i}>
                                <Box
                                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                    sx={{
                                        bgcolor: CARD,
                                        borderRadius: 4,
                                        p: 2.5,
                                        cursor: 'pointer',
                                        transition: 'all 0.25s ease',
                                        border: `1px solid ${openFaq === i ? INK : 'transparent'}`,
                                        '&:hover': { borderColor: LINE },
                                    }}
                                >
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                                        <Typography sx={{
                                            fontSize: { xs: '0.98rem', md: '1.08rem' },
                                            fontWeight: 600,
                                            color: INK,
                                        }}>
                                            {item.q}
                                        </Typography>
                                        <Box sx={{
                                            width: 30, height: 30, flexShrink: 0,
                                            borderRadius: '50%',
                                            bgcolor: openFaq === i ? INK : BG_ALT,
                                            color: openFaq === i ? '#FFF' : INK,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.25s ease',
                                        }}>
                                            {openFaq === i ? <Minus fontSize="small" /> : <Plus fontSize="small" />}
                                        </Box>
                                    </Stack>
                                    <Fade in={openFaq === i}>
                                        <Typography sx={{
                                            color: INK_SOFT,
                                            lineHeight: 1.65,
                                            fontSize: '0.92rem',
                                            mt: 2,
                                        }}>
                                            {item.a}
                                        </Typography>
                                    </Fade>
                                </Box>
                            </Reveal>
                        ))}
                    </Stack>
                </Container>
            </Box>

            {/* ОТЗЫВЫ */}
            <Box sx={{ py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="md">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Typography sx={{ ...T.h2 }}>
                                Что говорят <SerifAccent>ученики</SerifAccent>
                            </Typography>
                        </Box>
                    </Reveal>

                    {!showReviews ? (
                        <Reveal delay={0.1}>
                            <Box sx={{ textAlign: 'center' }}>
                                <PillButton $variant="dark" onClick={() => setShowReviews(true)}>
                                    Посмотреть отзывы
                                </PillButton>
                            </Box>
                        </Reveal>
                    ) : (
                        <Reveal>
                            <Box sx={{ position: 'relative' }}>
                                <IconButton
                                    onClick={prevReview}
                                    sx={{
                                        position: 'absolute',
                                        left: { xs: -8, md: -70 }, top: '50%',
                                        transform: 'translateY(-50%)',
                                        bgcolor: CARD, border: `1px solid ${LINE}`,
                                        color: INK, zIndex: 5,
                                        '&:hover': { bgcolor: INK, color: '#FFF', borderColor: INK },
                                    }}
                                >
                                    <ArrowForward sx={{ transform: 'rotate(180deg)', fontSize: 18 }} />
                                </IconButton>
                                <Box
                                    onClick={() => setSelectedReview(REVIEWS[reviewIndex])}
                                    sx={{
                                        cursor: 'pointer',
                                        maxWidth: 420,
                                        mx: 'auto',
                                        borderRadius: 5,
                                        overflow: 'hidden',
                                        boxShadow: '0 20px 60px -20px rgba(0,0,0,0.2)',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { transform: 'translateY(-4px)' },
                                    }}
                                >
                                    <Box
                                        component="img"
                                        src={REVIEWS[reviewIndex].image}
                                        alt={REVIEWS[reviewIndex].alt}
                                        sx={{ width: '100%', height: 440, objectFit: 'contain', display: 'block', bgcolor: '#fff' }}
                                    />
                                </Box>
                                <IconButton
                                    onClick={nextReview}
                                    sx={{
                                        position: 'absolute',
                                        right: { xs: -8, md: -70 }, top: '50%',
                                        transform: 'translateY(-50%)',
                                        bgcolor: CARD, border: `1px solid ${LINE}`,
                                        color: INK, zIndex: 5,
                                        '&:hover': { bgcolor: INK, color: '#FFF', borderColor: INK },
                                    }}
                                >
                                    <ArrowForward sx={{ fontSize: 18 }} />
                                </IconButton>
                                <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                                    <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem', fontWeight: 600 }}>
                                        {reviewIndex + 1} / {REVIEWS.length}
                                    </Typography>
                                    <Button
                                        onClick={() => setShowReviews(false)}
                                        sx={{
                                            color: INK_MUTED, textTransform: 'none',
                                            fontSize: '0.82rem', mt: 0.5, fontWeight: 600,
                                            '&:hover': { background: 'transparent', color: INK },
                                        }}
                                    >
                                        Скрыть
                                    </Button>
                                </Box>
                            </Box>
                        </Reveal>
                    )}
                </Container>
            </Box>

            {/* CTA */}
            <Box sx={{ px: { xs: 2, md: 0 }, pb: { xs: 7, md: 10 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{
                            background: `linear-gradient(135deg, ${DARK} 0%, #2A2A2A 100%)`,
                            borderRadius: 6,
                            p: { xs: 4, md: 6 },
                            position: 'relative',
                            overflow: 'hidden',
                            textAlign: 'center',
                        }}>
                            <Box sx={{
                                position: 'absolute', top: -50, left: '10%',
                                width: 200, height: 200, borderRadius: '50%',
                                background: PURPLE, filter: 'blur(80px)', opacity: 0.5,
                            }} />
                            <Box sx={{
                                position: 'absolute', bottom: -50, right: '10%',
                                width: 200, height: 200, borderRadius: '50%',
                                background: PINK, filter: 'blur(80px)', opacity: 0.4,
                            }} />
                            <Box sx={{ position: 'absolute', top: 30, right: 40 }}>
                                <Sparkle size={30} color={LIME} />
                            </Box>
                            <Box sx={{ position: 'absolute', bottom: 40, left: 50 }}>
                                <Sparkle size={22} color={LIME} />
                            </Box>

                            <Typography sx={{
                                fontWeight: 800,
                                fontSize: { xs: '1.8rem', md: '3rem' },
                                lineHeight: 1.08,
                                letterSpacing: '-0.03em',
                                color: '#FFF',
                                mb: 2,
                                position: 'relative',
                                zIndex: 1,
                            }}>
                                Первое занятие —{' '}
                                <SerifAccent sx={{ color: LIME, fontSize: '1.1em' }}>бесплатно</SerifAccent>
                            </Typography>
                            <Typography sx={{
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '1rem',
                                lineHeight: 1.55,
                                maxWidth: 440,
                                mx: 'auto',
                                mb: 4,
                                position: 'relative',
                                zIndex: 1,
                            }}>
                                Оценим уровень, поставим цель и составим план.
                                Дальше — просто занимаемся.
                            </Typography>
                            <Stack
                                direction={{ xs: 'column', sm: 'row' }}
                                spacing={2}
                                justifyContent="center"
                                sx={{ position: 'relative', zIndex: 1 }}
                            >
                                <PillButton $variant="lime" onClick={() => setStudentDialog(true)}>
                                    Оставить заявку
                                </PillButton>
                                <PillButton
                                    $variant="light"
                                    onClick={() => window.open('https://t.me/+79504321806', '_blank')}
                                    startIcon={<Telegram sx={{ fontSize: 18 }} />}
                                    sx={{ borderColor: 'rgba(255,255,255,0.2)', bgcolor: 'transparent', color: '#FFF',
                                          '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', borderColor: '#FFF' } }}
                                >
                                    Написать в Telegram
                                </PillButton>
                            </Stack>
                        </Box>
                    </Reveal>
                </Container>
            </Box>

            {/* FOOTER */}
            <Box sx={{ py: 4, borderTop: `1px solid ${LINE}` }}>
                <Container maxWidth="lg">
                    <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2}>
                        <Typography sx={{ fontWeight: 900, fontSize: '1.1rem', color: INK, letterSpacing: '-0.03em' }}>
                            EdSpace
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.82rem' }}>
                            © 2026 · Дмитрий Атрощенко — репетитор по информатике
                        </Typography>
                    </Stack>
                </Container>
            </Box>

            {scrolled && (
                <Fade in={scrolled}>
                    <Box sx={{
                        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 100,
                        display: { xs: 'flex', md: 'none' }, justifyContent: 'center',
                    }}>
                        <PillButton $variant="dark" fullWidth onClick={() => setStudentDialog(true)}>
                            Бесплатный пробный урок
                        </PillButton>
                    </Box>
                </Fade>
            )}

            {/* REVIEW VIEWER */}
            <Dialog
                open={!!selectedReview}
                onClose={() => setSelectedReview(null)}
                maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
            >
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <IconButton
                        onClick={() => setSelectedReview(null)}
                        sx={{
                            position: 'fixed', top: 20, right: 20,
                            bgcolor: CARD, color: INK,
                            border: `1px solid ${LINE}`,
                        }}
                    >
                        <Close />
                    </IconButton>
                    {selectedReview && (
                        <Box
                            component="img"
                            src={selectedReview.image}
                            alt={selectedReview.alt}
                            sx={{ width: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 4 }}
                        />
                    )}
                </Box>
            </Dialog>

            {/* FORM */}
            <Dialog
                open={studentDialog}
                onClose={() => setStudentDialog(false)}
                maxWidth="sm" fullWidth
                PaperProps={{ sx: { bgcolor: CARD, borderRadius: 5, border: `1px solid ${LINE}` } }}
            >
                <DialogTitle sx={{
                    fontWeight: 800,
                    fontSize: '1.8rem',
                    pt: 5, px: 5,
                    letterSpacing: '-0.03em',
                    color: INK,
                }}>
                    Запись на <SerifAccent>занятие</SerifAccent>
                </DialogTitle>
                <DialogContent sx={{ px: 5, pb: 5, pt: 2 }}>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField
                            fullWidth label="Ваше имя"
                            value={studentForm.name}
                            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    color: INK,
                                    bgcolor: BG_ALT,
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: LINE },
                                    '&.Mui-focused fieldset': { borderColor: INK },
                                },
                                '& .MuiInputLabel-root': { color: INK_MUTED },
                                '& .MuiInputLabel-root.Mui-focused': { color: INK },
                            }}
                        />
                        <TextField
                            fullWidth label="Телефон"
                            value={studentForm.phone}
                            onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 3,
                                    color: INK,
                                    bgcolor: BG_ALT,
                                    '& fieldset': { borderColor: 'transparent' },
                                    '&:hover fieldset': { borderColor: LINE },
                                    '&.Mui-focused fieldset': { borderColor: INK },
                                },
                                '& .MuiInputLabel-root': { color: INK_MUTED },
                                '& .MuiInputLabel-root.Mui-focused': { color: INK },
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel sx={{ color: INK_MUTED, '&.Mui-focused': { color: INK } }}>Цель занятий</InputLabel>
                            <Select
                                value={studentForm.goal}
                                label="Цель занятий"
                                onChange={(e) => setStudentForm({ ...studentForm, goal: e.target.value })}
                                sx={{
                                    borderRadius: 3,
                                    color: INK,
                                    bgcolor: BG_ALT,
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'transparent' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: LINE },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: INK },
                                    '& .MuiSvgIcon-root': { color: INK_MUTED },
                                }}
                                MenuProps={{
                                    PaperProps: {
                                        sx: { bgcolor: CARD, borderRadius: 3, border: `1px solid ${LINE}` }
                                    }
                                }}
                            >
                                <MenuItem value="Подготовка к ЕГЭ" sx={{ color: INK }}>Подготовка к ЕГЭ (10–11 класс)</MenuItem>
                                <MenuItem value="Подготовка к ОГЭ" sx={{ color: INK }}>Подготовка к ОГЭ (9 класс)</MenuItem>
                                <MenuItem value="Python" sx={{ color: INK }}>Программирование на Python</MenuItem>
                                <MenuItem value="Школьная программа" sx={{ color: INK }}>Повышение успеваемости</MenuItem>
                            </Select>
                        </FormControl>
                        <PillButton $variant="dark" fullWidth onClick={handleStudentSubmit} sx={{ mt: 1, py: 1.8 }}>
                            Отправить заявку
                        </PillButton>
                        <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, textAlign: 'center' }}>
                            Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                        </Typography>
                    </Stack>
                </DialogContent>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3 }}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
};

export default LandingPage;