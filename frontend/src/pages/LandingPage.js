import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Container, Grid, AppBar, Toolbar,
    IconButton, Drawer, Stack, Dialog, DialogContent,
    DialogTitle, Snackbar, Alert, Divider, Fade
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Menu as MenuIcon, Close, Telegram, ArrowForward,
    Add as Plus, Remove as Minus,
    Phone as PhoneIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

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

// ========== КОНТАКТЫ ==========
const ContactRow = styled('a')({
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 18px',
    borderRadius: 16,
    background: '#F8F8F8',
    textDecoration: 'none',
    color: INK,
    transition: 'all 0.2s ease',
    border: '1px solid transparent',
    '&:hover': {
        background: PURPLE_SOFT,
        borderColor: PURPLE,
        transform: 'translateX(4px)',
    },
});

const ContactIconBox = styled(Box)({
    width: 42, height: 42, borderRadius: 12,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
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
    { title: 'ЕГЭ по информатике', desc: 'С 10 класса, спокойно и без паники', tone: LIME_SOFT, link: '/repetitor-informatika-ege' },
    { title: 'ОГЭ по информатике', desc: 'С 8–9 класса', tone: PINK_SOFT, link: '/repetitor-informatika-oge' },
    { title: 'Python с нуля', desc: 'От основ до небольших проектов', tone: PURPLE_SOFT, link: '/repetitor-informatika' },
    { title: 'Репетитор по математике', desc: 'ЕГЭ/ОГЭ, 1–11 классы', tone: BLUE_SOFT, link: '/repetitor-matematika-ege' },
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
    const [contactsOpen, setContactsOpen] = useState(false);
    const [selectedReview, setSelectedReview] = useState(null);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [showReviews, setShowReviews] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openFaq, setOpenFaq] = useState(null);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 400);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const openContacts = () => setContactsOpen(true);

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
                            <NavLink onClick={() => document.getElementById('directions')?.scrollIntoView({ behavior: 'smooth' })}>Направления</NavLink>
                            <NavLink onClick={() => document.getElementById('tournaments')?.scrollIntoView({ behavior: 'smooth' })}>Турниры</NavLink>
                            <NavLink onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })}>Вопросы</NavLink>
                            <NavLink onClick={() => navigate('/login')}>Войти</NavLink>
                            <PillButton $variant="dark" onClick={openContacts} sx={{ py: 1.2, px: 3, fontSize: '0.9rem' }}>
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
                            { label: 'Направления', id: 'directions' },
                            { label: 'Турниры', id: 'tournaments' },
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
                                minHeight: 280,
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                            }}>
                                <Box>
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
                                    <Typography sx={{ fontSize: '0.88rem', color: INK_SOFT }}>
                                        за 5 лет преподавания
                                    </Typography>
                                </Box>
                                <Stack direction="row" spacing={-1} sx={{ mt: 3 }}>
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
                                minHeight: 280,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 3,
                            }}>
                                <Box sx={{
                                    position: 'relative',
                                    width: 150,
                                    height: 150,
                                    animation: `${float} 4s ease-in-out infinite`,
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
                                    onClick={openContacts}
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
                                minHeight: 280,
                                display: 'flex',
                                flexDirection: 'column',
                            }}>
                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: INK, mb: 2.5 }}>
                                    Что вас ждёт:
                                </Typography>
                                <Stack spacing={1.25} sx={{ flexGrow: 1 }}>
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
                                        minHeight: 180,
                                        transition: 'all 0.3s ease',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        display: 'flex',
                                        flexDirection: 'column',
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
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
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
                </Container>
            </Box>

            {/* НАПРАВЛЕНИЯ ПОДГОТОВКИ */}
            <Box id="directions" sx={{ bgcolor: DARK, color: '#FFF', py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Typography sx={{
                                fontWeight: 800,
                                fontSize: { xs: '2rem', md: '3rem' },
                                lineHeight: 1.1,
                                letterSpacing: '-0.03em',
                                color: '#FFF',
                            }}>
                                Направления <SerifAccent sx={{ color: LIME, fontSize: '1.15em' }}>подготовки</SerifAccent>
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.65)', mt: 1.5, maxWidth: 520, mx: 'auto', fontSize: '1rem' }}>
                                Подробнее о каждом направлении — на отдельной странице
                            </Typography>
                        </Box>
                    </Reveal>

                    <Grid container spacing={2.5}>
                        {directions.map((d, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Reveal delay={0.06 * i}>
                                    <Box
                                        onClick={() => navigate(d.link)}
                                        sx={{
                                            bgcolor: DARK_ALT,
                                            borderRadius: 4,
                                            p: 3,
                                            height: '100%',
                                            minHeight: 210,
                                            cursor: 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            '&:hover': {
                                                transform: 'translateY(-4px)',
                                                bgcolor: '#252525',
                                            },
                                        }}
                                    >
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: 2.5,
                                            bgcolor: d.tone,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.3rem',
                                            mb: 2.5,
                                        }}>
                                            {d.tone === LIME_SOFT ? '💻' : d.tone === PINK_SOFT ? '📘' : d.tone === PURPLE_SOFT ? '🐍' : '📐'}
                                        </Box>
                                        <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, mb: 0.75, color: '#FFF' }}>
                                            {d.title}
                                        </Typography>
                                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', lineHeight: 1.55, mb: 2, flexGrow: 1 }}>
                                            {d.desc}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: LIME }}>
                                            Подробнее →
                                        </Typography>
                                    </Box>
                                </Reveal>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ТУРНИРЫ */}
            <Box id="tournaments" sx={{ py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Reveal>
                        <Box sx={{ textAlign: 'center', mb: 5 }}>
                            <Typography sx={{ ...T.h2 }}>
                                🏆 Турниры <SerifAccent>для учеников</SerifAccent>
                            </Typography>
                            <Typography sx={{ ...T.body, mt: 1.5, maxWidth: 620, mx: 'auto' }}>
                                Раз в месяц проводим марафон по пробникам. Соревнование идёт не по абсолютному баллу,
                                а по <Box component="span" sx={{ color: INK, fontWeight: 600 }}>прогрессу относительно себя</Box> —
                                побеждает не тот, кто изначально сильнее, а тот, кто больше вырос.
                            </Typography>
                        </Box>
                    </Reveal>

                    {/* 3 шага */}
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        {[
                            { emoji: '📅', title: 'Марафон на месяц', desc: 'Месяц соревнований — 4 пробника за это время.' },
                            { emoji: '📈', title: 'Прогресс важнее балла', desc: 'Считаем рост относительно личного уровня — шанс есть у каждого.' },
                            { emoji: '🎁', title: 'Призы для всех', desc: 'Сертификаты на покупки и книги по информатике.' },
                        ].map((item, i) => (
                            <Grid item xs={12} md={4} key={i}>
                                <Reveal delay={0.06 * i}>
                                    <Box sx={{
                                        bgcolor: CARD,
                                        borderRadius: 4,
                                        border: `1px solid ${LINE}`,
                                        p: 3,
                                        height: '100%',
                                        minHeight: 180,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        transition: 'all 0.3s ease',
                                        '&:hover': { transform: 'translateY(-4px)', borderColor: PURPLE },
                                    }}>
                                        <Box sx={{
                                            width: 52, height: 52, borderRadius: 3,
                                            bgcolor: PURPLE_SOFT,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '1.6rem', mb: 2.5,
                                        }}>
                                            {item.emoji}
                                        </Box>
                                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: INK, mb: 1 }}>
                                            {item.title}
                                        </Typography>
                                        <Typography sx={{ ...T.bodySmall, flexGrow: 1 }}>
                                            {item.desc}
                                        </Typography>
                                    </Box>
                                </Reveal>
                            </Grid>
                        ))}
                    </Grid>

                    {/* Полоса с призами */}
                    <Reveal delay={0.2}>
                        <Box sx={{
                            background: `linear-gradient(135deg, ${DARK} 0%, #2A2A2A 100%)`,
                            borderRadius: 5,
                            p: { xs: 3, md: 4 },
                            position: 'relative',
                            overflow: 'hidden',
                        }}>
                            <Box sx={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: PURPLE, filter: 'blur(80px)', opacity: 0.4 }} />
                            <Box sx={{ position: 'absolute', bottom: -40, left: -40, width: 200, height: 200, borderRadius: '50%', background: PINK, filter: 'blur(80px)', opacity: 0.3 }} />

                            <Box sx={{ position: 'relative', zIndex: 1 }}>
                                <Typography sx={{
                                    textAlign: 'center',
                                    fontWeight: 800,
                                    fontSize: { xs: '1.3rem', md: '1.6rem' },
                                    color: '#FFF',
                                    letterSpacing: '-0.02em',
                                    mb: 3,
                                }}>
                                    Призы в каждом марафоне
                                </Typography>

                                <Grid container spacing={2}>
                                    {[
                                        { emoji: '🥇', place: '1 место', prize: 'Сертификат 3000 ₽ + книга', color: '#FFD700' },
                                        { emoji: '🥈', place: '2 место', prize: 'Сертификат 1500 ₽ + книга', color: '#C0C0C0' },
                                        { emoji: '🥉', place: '3 место', prize: 'Сертификат 500 ₽ + книга', color: '#CD7F32' },
                                        { emoji: '📚', place: '4 место', prize: 'Книга по выбору', color: LIME },
                                    ].map((p, i) => (
                                        <Grid item xs={12} sm={6} md={3} key={i}>
                                            <Box sx={{
                                                bgcolor: 'rgba(255,255,255,0.04)',
                                                border: '1px solid rgba(255,255,255,0.08)',
                                                borderRadius: 3,
                                                p: 2.5,
                                                height: '100%',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                textAlign: 'center',
                                            }}>
                                                <Typography sx={{ fontSize: '2rem', mb: 1.5, lineHeight: 1 }}>
                                                    {p.emoji}
                                                </Typography>
                                                <Typography sx={{
                                                    fontSize: '0.7rem',
                                                    color: p.color,
                                                    fontWeight: 800,
                                                    letterSpacing: '0.08em',
                                                    textTransform: 'uppercase',
                                                    mb: 0.75,
                                                }}>
                                                    {p.place}
                                                </Typography>
                                                <Typography sx={{
                                                    fontSize: '0.9rem',
                                                    color: '#FFF',
                                                    fontWeight: 600,
                                                    lineHeight: 1.4,
                                                }}>
                                                    {p.prize}
                                                </Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Typography sx={{
                                    mt: 3,
                                    textAlign: 'center',
                                    color: 'rgba(255,255,255,0.55)',
                                    fontSize: '0.85rem',
                                    lineHeight: 1.6,
                                    maxWidth: 560,
                                    mx: 'auto',
                                }}>
                                    Участвовать могут все ученики. Допуск подтверждает репетитор —
                                    нужно, чтобы ученик решал пробники до старта марафона.
                                </Typography>
                            </Box>
                        </Box>
                    </Reveal>
                </Container>
            </Box>

            {/* УЧЕНИКУ / РОДИТЕЛЮ */}
            <Box sx={{ bgcolor: BG_ALT, py: { xs: 8, md: 11 }, position: 'relative', zIndex: 1 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={{ xs: 3, md: 4 }} alignItems="stretch">
                        <Grid item xs={12} md={6}>
                            <Reveal>
                                <Box sx={{
                                    background: `linear-gradient(135deg, ${PURPLE} 0%, #9B7FFB 100%)`,
                                    borderRadius: 5,
                                    p: { xs: 3.5, md: 4 },
                                    height: '100%',
                                    minHeight: 320,
                                    color: '#FFF',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
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
                                    <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
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
                                    minHeight: 320,
                                    color: '#FFF',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    display: 'flex',
                                    flexDirection: 'column',
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
                                    <Stack spacing={1.5} sx={{ flexGrow: 1 }}>
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

                    <Grid container spacing={2} justifyContent="center">
                        {examResults.map((r, i) => (
                            <Grid item xs={6} sm={4} md={2.4} key={i} sx={{ flexGrow: { xs: 1, md: 0 }, flexBasis: { md: '18%' } }}>
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
                            <Box sx={{ position: 'relative', maxWidth: 420, mx: 'auto' }}>
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
                                        width: '100%',
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
                                <PillButton $variant="lime" onClick={openContacts}>
                                    Оставить заявку
                                </PillButton>
                                <PillButton
                                    $variant="light"
                                    onClick={openContacts}
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
            <Box sx={{ py: 5, borderTop: `1px solid ${LINE}` }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Typography sx={{ fontWeight: 900, fontSize: '1.2rem', color: INK, letterSpacing: '-0.03em', mb: 1.5 }}>
                                EdSpace
                            </Typography>
                            <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem', lineHeight: 1.6 }}>
                                Онлайн-платформа для подготовки к ЕГЭ и ОГЭ по информатике и математике.
                            </Typography>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: INK, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                                Направления
                            </Typography>
                            <Stack spacing={1}>
                                <Typography onClick={() => navigate('/repetitor-informatika-ege')} sx={{ fontSize: '0.88rem', color: INK_SOFT, cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                                    ЕГЭ по информатике
                                </Typography>
                                <Typography onClick={() => navigate('/repetitor-informatika-oge')} sx={{ fontSize: '0.88rem', color: INK_SOFT, cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                                    ОГЭ по информатике
                                </Typography>
                                <Typography onClick={() => navigate('/repetitor-informatika')} sx={{ fontSize: '0.88rem', color: INK_SOFT, cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                                    Репетитор по информатике
                                </Typography>
                                <Typography onClick={() => navigate('/repetitor-matematika-ege')} sx={{ fontSize: '0.88rem', color: INK_SOFT, cursor: 'pointer', '&:hover': { color: PURPLE } }}>
                                    Репетитор по математике
                                </Typography>
                            </Stack>
                        </Grid>
                        <Grid item xs={6} md={4}>
                            <Typography sx={{ fontWeight: 700, fontSize: '0.8rem', color: INK, textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1.5 }}>
                                Контакты
                            </Typography>
                            <Stack spacing={1}>
                                <Typography sx={{ fontSize: '0.88rem', color: INK_SOFT }}>
                                    +7 950 432-18-06
                                </Typography>
                                <Typography sx={{ fontSize: '0.88rem', color: INK_SOFT }}>
                                    d.atrochhenko@mail.ru
                                </Typography>
                                <Typography sx={{ fontSize: '0.88rem', color: INK_SOFT }}>
                                    @edspace_school
                                </Typography>
                            </Stack>
                        </Grid>
                    </Grid>
                    <Divider sx={{ borderColor: LINE, my: 3 }} />
                    <Typography sx={{ color: INK_MUTED, fontSize: '0.82rem', textAlign: 'center' }}>
                        © 2026 · Дмитрий Атрощенко — репетитор по информатике
                    </Typography>
                </Container>
            </Box>

            {scrolled && (
                <Fade in={scrolled}>
                    <Box sx={{
                        position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 100,
                        display: { xs: 'flex', md: 'none' }, justifyContent: 'center',
                    }}>
                        <PillButton $variant="dark" fullWidth onClick={openContacts}>
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

            {/* МОДАЛКА КОНТАКТОВ */}
            <Dialog
                open={contactsOpen}
                onClose={() => setContactsOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 0 } }}
            >
                <DialogContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: INK }}>
                            Связаться со мной
                        </Typography>
                        <IconButton size="small" onClick={() => setContactsOpen(false)}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Box>

                    <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem', mb: 2.5, lineHeight: 1.5 }}>
                        Напишите в любой мессенджер или позвоните — отвечу в течение дня. Обсудим цели, уровень и подберём формат занятий.
                    </Typography>

                    <Stack spacing={1.5}>
                        <ContactRow href="tel:+79504321806">
                            <ContactIconBox sx={{ bgcolor: '#E8F5E9', color: '#10B981' }}>
                                <PhoneIcon />
                            </ContactIconBox>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Телефон
                                </Typography>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK }}>
                                    +7 950 432-18-06
                                </Typography>
                            </Box>
                        </ContactRow>

                        <ContactRow href="tel:+79504321806">
                            <ContactIconBox sx={{ bgcolor: '#F3E5F5', color: '#9C27B0' }}>
                                <PhoneIcon />
                            </ContactIconBox>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Макс
                                </Typography>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK }}>
                                    +7 950 432-18-06
                                </Typography>
                            </Box>
                        </ContactRow>

                        <ContactRow
                            href="https://t.me/pprprprprr"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ContactIconBox sx={{ bgcolor: '#E3F2FD', color: '#229ED9' }}>
                                <Telegram sx={{ fontSize: 22 }} />
                            </ContactIconBox>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Telegram
                                </Typography>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK }}>
                                    @pprprprprr
                                </Typography>
                            </Box>
                        </ContactRow>

                        <ContactRow
                            href="https://vk.ru/prprprprrp"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ContactIconBox sx={{ bgcolor: '#E8EAF6', color: '#0077FF' }}>
                                <Box component="svg" viewBox="0 0 24 24" sx={{ width: 24, height: 24, fill: 'currentColor' }}>
                                    <path d="M12.785 16.241s.288-.032.436-.19c.136-.145.132-.417.132-.417s-.02-1.27.573-1.458c.582-.184 1.329 1.249 2.12 1.812.6.425 1.055.332 1.055.332l2.122-.03s1.11-.068.583-.94c-.043-.072-.306-.642-1.572-1.815-1.324-1.229-1.147-1.03.448-3.157.971-1.295 1.36-2.085 1.238-2.42-.115-.32-.834-.235-.834-.235l-2.387.015s-.177-.024-.308.054c-.128.076-.211.253-.211.253s-.378 1.004-.883 1.86c-1.063 1.808-1.489 1.902-1.661 1.789-.404-.263-.303-1.056-.303-1.619 0-1.763.265-2.499-.517-2.69-.26-.062-.45-.104-1.111-.11-.85-.008-1.567.003-1.972.203-.271.133-.48.431-.353.448.158.022.516.096.705.356.244.334.235 1.084.235 1.084s.14 2.075-.327 2.332c-.32.175-.756-.182-1.698-1.82-.484-.837-.849-1.76-.849-1.76s-.07-.173-.196-.266c-.152-.112-.365-.147-.365-.147l-2.268.015s-.34.01-.466.158c-.112.132-.009.404-.009.404s1.779 4.166 3.798 6.264c1.85 1.923 3.95 1.797 3.95 1.797h.948z" />
                                </Box>
                            </ContactIconBox>
                            <Box sx={{ flex: 1 }}>
                                <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    ВКонтакте
                                </Typography>
                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK }}>
                                    vk.ru/prprprprrp
                                </Typography>
                            </Box>
                        </ContactRow>
                    </Stack>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LandingPage;