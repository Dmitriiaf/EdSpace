// ========== frontend/src/pages/LandingPage.js (v3 — DEEP PURPLE + FAQ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Button, Typography, Container, Grid, AppBar, Toolbar,
    IconButton, Drawer, List, ListItem, ListItemText,
    useMediaQuery, useTheme, Stack, Avatar, AvatarGroup,
    Chip, Divider, Dialog, DialogContent, Accordion, AccordionSummary, AccordionDetails,
    TextField, InputAdornment
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Menu as MenuIcon, ArrowForward, Close, Bolt, VerifiedUser,
    SupportAgent, AutoAwesome, CheckCircle, PlayArrow,
    CalendarMonth, Payments, Videocam, BarChart,
    TrendingUp, School, Groups, Grade, Stars,
    RocketLaunch, Psychology, Speed, EmojiEvents,
    ExpandMore, Telegram, Send, Email, Notifications
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ========== NEW COLOR PALETTE ==========
// Deep Purple + Almond Oil
const DEEP_PURPLE = '#2D1B69';      // Тёмно-фиолетовый фон
const PURPLE_PRIMARY = '#6C3BAA';   // Основной фиолетовый
const PURPLE_LIGHT = '#9B6FD4';     // Светло-фиолетовый
const ALMOND = '#F5E6D3';          // Миндальное масло (светлый)
const ALMOND_DARK = '#E8D5C0';     // Тёмный миндальный
const CREAM = '#FFF8F0';           // Кремовый
const GOLD = '#C8963E';            // Золотой акцент
const ROSE = '#D4856B';            // Розовый акцент
const SUCCESS_GREEN = '#5B8C5A';   // Зелёный (приглушённый)

// ========== ANIMATIONS ==========
const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-20px); }
`;

const pulse = keyframes`
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.6; }
`;

// ========== STYLED ==========
const StyledButton = styled(Button)({
    borderRadius: 18,
    textTransform: 'none',
    fontWeight: 600,
    padding: '14px 26px',
    fontSize: '1rem',
    transition: 'all .3s cubic-bezier(.22,1,.36,1)',
});

const PrimaryButton = styled(StyledButton)({
    background: `linear-gradient(135deg, ${PURPLE_PRIMARY}, ${PURPLE_LIGHT})`,
    color: CREAM,
    boxShadow: `0 10px 30px rgba(108,59,170,.35)`,
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 18px 40px rgba(108,59,170,.45)`,
    },
});

const SecondaryButton = styled(StyledButton)({
    border: `1px solid ${ALMOND_DARK}`,
    color: ALMOND,
    background: 'rgba(245,230,211,.05)',
    '&:hover': {
        borderColor: ALMOND,
        background: 'rgba(245,230,211,.1)',
    },
});

const AccentButton = styled(StyledButton)({
    background: `linear-gradient(135deg, ${GOLD}, ${ROSE})`,
    color: CREAM,
    boxShadow: `0 10px 30px rgba(200,150,62,.25)`,
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 18px 40px rgba(200,150,62,.35)`,
    },
});

const GlassCard = styled(Box)({
    position: 'relative', overflow: 'hidden',
    background: `linear-gradient(180deg, rgba(245,230,211,.06), rgba(245,230,211,.03))`,
    border: `1px solid rgba(245,230,211,.1)`,
    backdropFilter: 'blur(20px)',
    borderRadius: 32,
    transition: 'all .45s cubic-bezier(.22,1,.36,1)',
    '&:hover': {
        transform: 'translateY(-6px)',
        border: `1px solid rgba(245,230,211,.2)`,
        background: `linear-gradient(180deg, rgba(245,230,211,.1), rgba(245,230,211,.05))`,
    },
});

const GradientText = styled('span')({
    background: `linear-gradient(135deg, ${ALMOND}, ${PURPLE_LIGHT})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
});

const StyledAccordion = styled(Accordion)({
    background: 'transparent',
    border: `1px solid rgba(245,230,211,.08)`,
    borderRadius: '16px !important',
    marginBottom: 12,
    '&:before': { display: 'none' },
});

// ========== COMPONENT ==========
const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenu, setMobileMenu] = useState(false);
    const [demoOpen, setDemoOpen] = useState(false);
    const [counts, setCounts] = useState({ lessons: 0, students: 0, income: 0 });
    const [faqExpanded, setFaqExpanded] = useState(false);

    useEffect(() => {
        const targets = { lessons: 300, students: 35, income: 200 };
        const duration = 2000;
        const steps = 60;
        let step = 0;
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            setCounts({
                lessons: Math.floor(targets.lessons * progress),
                students: Math.floor(targets.students * progress),
                income: Math.floor(targets.income * progress),
            });
            if (step >= steps) clearInterval(timer);
        }, duration / steps);
        return () => clearInterval(timer);
    }, []);

    const advantages = [
        { icon: <Bolt sx={{ fontSize: 28 }} />, title: 'Всё в одном месте', desc: 'Расписание, видеоуроки, оплаты, домашние задания и онлайн-доска — одна система вместо пяти сервисов.' },
        { icon: <VerifiedUser sx={{ fontSize: 28 }} />, title: 'Прозрачно для родителей', desc: 'Родители видят прогресс, расписание и оплаты. Вам не нужно вести бесконечные переписки.' },
        { icon: <SupportAgent sx={{ fontSize: 28 }} />, title: 'Развиваем вместе', desc: 'Мы ежедневно улучшаем платформу на основе обратной связи репетиторов.' },
    ];

    const steps = [
        { icon: <RocketLaunch sx={{ fontSize: 36 }} />, title: 'Регистрация', desc: 'Создайте аккаунт за 2 минуты' },
        { icon: <School sx={{ fontSize: 36 }} />, title: 'Добавьте учеников', desc: 'Пригласите или создайте вручную' },
        { icon: <CalendarMonth sx={{ fontSize: 36 }} />, title: 'Составьте расписание', desc: 'Постоянные и разовые занятия' },
        { icon: <Videocam sx={{ fontSize: 36 }} />, title: 'Проводите занятия', desc: 'Видеозвонки, доски, задания' },
    ];

    const testimonials = [
        { name: 'Ангелина', role: 'Репетитор по математике', text: 'EdSpace заменил мне 4 разных сервиса. Теперь всё в одном месте — это сэкономило кучу времени!', avatar: 'А' },
        { name: 'Дмитрий', role: 'Репетитор по информатике', text: 'Ученики и родители в восторге от прозрачности. Все видят расписание, оценки и платежи.', avatar: 'Д' },
        { name: 'Юлия', role: 'Репетитор по русскому', text: 'Генерация заданий через ИИ — это просто магия. Уроки стали интереснее, а готовиться стало легче.', avatar: 'Ю' },
    ];

    const faqItems = [
        {
            question: 'Сколько стоит EdSpace?',
            answer: 'Первые 14 дней — бесплатно. Затем 990 ₽ в месяц. Никаких скрытых платежей, отменить можно в любой момент.'
        },
        {
            question: 'Нужно ли устанавливать что-то на компьютер?',
            answer: 'Нет, EdSpace работает в браузере. Вы можете зайти с любого устройства — компьютера, ноутбука, планшета или телефона.'
        },
        {
            question: 'Как подключить учеников?',
            answer: 'Вы можете создать ученика вручную или отправить приглашение по ссылке. Ученик получит доступ к своему расписанию, домашним заданиям и материалам.'
        },
        {
            question: 'Какие видеоплатформы поддерживаются?',
            answer: 'Zoom, Яндекс.Телемост, Skype, Jitsi и другие. Вы можете выбрать любую удобную платформу для каждого урока.'
        },
        {
            question: 'Могут ли родители следить за прогрессом?',
            answer: 'Да! Родители видят расписание, оценки за домашние задания, оплаты и могут подтверждать платежи через платформу.'
        },
        {
            question: 'Что будет с моими данными?',
            answer: 'Все данные хранятся на серверах в России. Мы соблюдаем 152-ФЗ «О персональных данных». Вы можете экспортировать или удалить данные в любой момент.'
        },
        {
            question: 'Как работает ИИ-генерация заданий?',
            answer: 'Вы описываете тему или тип задания, и нейросеть создаёт уникальное задание с ответом. Это экономит часы подготовки к урокам.'
        },
    ];

    return (
        <Box sx={{ bgcolor: DEEP_PURPLE, color: CREAM, minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
            {/* BACKGROUND EFFECTS */}
            <Box sx={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: `linear-gradient(rgba(245,230,211,.02) 1px, transparent 1px), linear-gradient(90deg, rgba(245,230,211,.02) 1px, transparent 1px)`,
                backgroundSize: '42px 42px',
                maskImage: 'radial-gradient(circle at 70% 30%, black, transparent 90%)',
            }} />

            <Box sx={{ position: 'fixed', top: -200, right: -100, width: 600, height: 600, borderRadius: '50%',
                background: `radial-gradient(circle, rgba(108,59,170,.3), transparent 70%)`,
                filter: 'blur(80px)', zIndex: 0, animation: `${pulse} 4s ease-in-out infinite`,
            }} />

            <Box sx={{ position: 'fixed', bottom: -200, right: -100, width: 500, height: 500, borderRadius: '50%',
                background: `radial-gradient(circle, rgba(212,133,107,.2), transparent 70%)`,
                filter: 'blur(90px)', zIndex: 0, animation: `${pulse} 5s ease-in-out infinite alternate`,
            }} />

            {/* HEADER */}
            <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'rgba(45,27,105,.8)', backdropFilter: 'blur(20px)', borderBottom: `1px solid rgba(245,230,211,.06)` }}>
                <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', py: 1.5 }}>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{ width: 36, height: 36, borderRadius: 3,
                                background: `linear-gradient(135deg, ${PURPLE_PRIMARY}, ${PURPLE_LIGHT})`,
                                boxShadow: `0 10px 30px rgba(108,59,170,.4)`,
                            }} />
                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.04em', color: ALMOND }}>EdSpace</Typography>
                        </Stack>

                        {!isMobile ? (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Button onClick={() => navigate('/login')} sx={{ color: ALMOND_DARK, textTransform: 'none', fontWeight: 500, '&:hover': { color: ALMOND } }}>Войти</Button>
                                <PrimaryButton onClick={() => navigate('/register')} endIcon={<ArrowForward />}>Попробовать бесплатно</PrimaryButton>
                            </Stack>
                        ) : (
                            <IconButton onClick={() => setMobileMenu(true)} sx={{ color: ALMOND }}><MenuIcon /></IconButton>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* MOBILE MENU */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)}
                PaperProps={{ sx: { bgcolor: DEEP_PURPLE, color: CREAM, width: 260 } }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton onClick={() => setMobileMenu(false)} sx={{ color: ALMOND }}><Close /></IconButton>
                    </Box>
                    <List>
                        <ListItem button onClick={() => navigate('/login')}><ListItemText primary="Войти" /></ListItem>
                        <ListItem button onClick={() => navigate('/register')}><ListItemText primary="Попробовать бесплатно" sx={{ color: PURPLE_LIGHT }} /></ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* ========== HERO ========== */}
            <Container maxWidth="xl" sx={{ position: 'relative', zIndex: 1, pt: { xs: 14, md: 20 }, pb: { xs: 10, md: 16 } }}>
                <Grid container spacing={8} alignItems="center">
                    <Grid item xs={12} md={1} />
                    
                    <Grid item xs={12} md={5}>
                        <Chip icon={<AutoAwesome />} label="14 дней бесплатно"
                            sx={{ mb: 4, bgcolor: 'rgba(108,59,170,.2)', color: PURPLE_LIGHT, border: `1px solid rgba(108,59,170,.3)`, px: 1 }} />

                        <Typography component="h1"
                            sx={{ fontSize: { xs: '2.8rem', md: '5.2rem' }, lineHeight: .95, fontWeight: 900,
                                letterSpacing: '-0.06em', maxWidth: 760, mb: 3, color: ALMOND }}>
                            Ведите занятия,<br />
                            <GradientText>а не таблицы и чаты</GradientText>
                        </Typography>

                        <Typography sx={{ fontSize: { xs: '1rem', md: '1.15rem' }, lineHeight: 1.8, color: ALMOND_DARK, maxWidth: 560, mb: 5 }}>
                            Расписание, онлайн-уроки, домашние задания, оплаты и уведомления — всё в одной платформе для современных репетиторов.
                        </Typography>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                            <PrimaryButton size="large" onClick={() => navigate('/register')} endIcon={<ArrowForward />}>Начать бесплатно</PrimaryButton>
                            <SecondaryButton startIcon={<PlayArrow />} onClick={() => setDemoOpen(true)}>Посмотреть демо</SecondaryButton>
                        </Stack>

                        {/* Extra buttons */}
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 6 }}>
                            <AccentButton startIcon={<Telegram />} onClick={() => window.open('https://t.me/edspace', '_blank')}>
                                Telegram-канал
                            </AccentButton>
                            <SecondaryButton startIcon={<Email />} onClick={() => navigate('/register')}>
                                Подписаться на рассылку
                            </SecondaryButton>
                        </Stack>

                        <Stack direction="row" spacing={2} alignItems="center">
                            <AvatarGroup max={5}>
                                {['Д', 'А', 'М', 'Е', 'С'].map((x, i) => (
                                    <Avatar key={i} sx={{ bgcolor: [PURPLE_PRIMARY, PURPLE_LIGHT, GOLD, ROSE, SUCCESS_GREEN][i], border: `2px solid ${DEEP_PURPLE}` }}>{x}</Avatar>
                                ))}
                            </AvatarGroup>
                            <Typography sx={{ color: ALMOND_DARK }}>
                                Уже используют <Box component="span" sx={{ color: GOLD, fontWeight: 700 }}>30+</Box> репетиторов
                            </Typography>
                        </Stack>
                    </Grid>

                    {/* RIGHT — Dashboard Preview */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ position: 'relative', maxWidth: 620, mx: 'auto' }}>
                            <GlassCard sx={{ p: 4 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: ALMOND }}>Dashboard</Typography>
                                    <Chip label="Онлайн" sx={{ bgcolor: 'rgba(91,140,90,.15)', color: SUCCESS_GREEN }} />
                                </Stack>

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        { title: 'Уроков', value: '42', icon: <CalendarMonth /> },
                                        { title: 'Доход', value: '92k', icon: <Payments /> },
                                        { title: 'Созвонов', value: '18', icon: <Videocam /> },
                                    ].map((item, i) => (
                                        <Grid item xs={4} key={i}>
                                            <Box sx={{ p: 2, borderRadius: 4, background: 'rgba(245,230,211,.04)', border: `1px solid rgba(245,230,211,.06)` }}>
                                                <Box sx={{ color: PURPLE_LIGHT, mb: 1 }}>{item.icon}</Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: ALMOND }}>{item.value}</Typography>
                                                <Typography sx={{ color: ALMOND_DARK, fontSize: '.85rem' }}>{item.title}</Typography>
                                            </Box>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Box sx={{ p: 3, borderRadius: 5, background: 'rgba(245,230,211,.04)', border: `1px solid rgba(245,230,211,.06)` }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                        <Typography sx={{ fontWeight: 700, color: ALMOND }}>Ближайшие занятия</Typography>
                                        <BarChart sx={{ color: ALMOND_DARK }} />
                                    </Stack>
                                    {[
                                        { name: 'Математика', time: '16:00' },
                                        { name: 'Информатика', time: '18:30' },
                                    ].map((x, i) => (
                                        <Box key={i}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 1.5 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PURPLE_PRIMARY }} />
                                                    <Typography sx={{ color: ALMOND }}>{x.name}</Typography>
                                                </Stack>
                                                <Typography sx={{ color: ALMOND_DARK }}>{x.time}</Typography>
                                            </Stack>
                                            {i !== 1 && <Divider sx={{ borderColor: 'rgba(245,230,211,.08)' }} />}
                                        </Box>
                                    ))}
                                </Box>
                            </GlassCard>

                            <GlassCard sx={{ position: 'absolute', right: -40, bottom: -40, p: 3, width: 240, display: { xs: 'none', md: 'block' } }}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <CheckCircle sx={{ color: SUCCESS_GREEN }} />
                                    <Typography sx={{ fontWeight: 700, color: ALMOND }}>Оплата получена</Typography>
                                </Stack>
                                <Typography sx={{ color: ALMOND_DARK, fontSize: '.95rem', lineHeight: 1.7 }}>
                                    Родитель оплатил пакет занятий автоматически.
                                </Typography>
                            </GlassCard>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={1} />
                </Grid>
            </Container>

            {/* ========== STATS ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 10, md: 14 } }}>
                <GlassCard sx={{ p: { xs: 4, md: 6 } }}>
                    <Grid container spacing={4}>
                        {[
                            [`${counts.lessons}+`, 'Проведено занятий'],
                            [`${counts.students}`, 'Активных учеников'],
                            [`${counts.income}k+`, 'Заработано'],
                            ['24/7', 'Поддержка'],
                        ].map((x, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.05em', mb: 1,
                                    background: `linear-gradient(135deg, ${ALMOND}, ${PURPLE_LIGHT})`,
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    {x[0]}
                                </Typography>
                                <Typography sx={{ color: ALMOND_DARK }}>{x[1]}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </GlassCard>
            </Container>

            {/* ========== HOW IT WORKS ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 10, md: 16 } }}>
                <Typography sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.05em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Как начать работать
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, maxWidth: 600, mx: 'auto', mb: 8 }}>
                    Всё просто — от регистрации до первого урока за 5 минут
                </Typography>

                <Grid container spacing={3} sx={{ pl: { md: 4 } }}>
                    {steps.map((step, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <GlassCard sx={{ p: 4, textAlign: 'center', height: '100%' }}>
                                <Box sx={{ width: 64, height: 64, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: `linear-gradient(135deg, rgba(108,59,170,.3), rgba(155,111,212,.15))`,
                                    color: PURPLE_LIGHT, mx: 'auto', mb: 3 }}>
                                    {step.icon}
                                </Box>
                                <Chip label={`Шаг ${i + 1}`} size="small" sx={{ mb: 2, bgcolor: 'rgba(108,59,170,.2)', color: PURPLE_LIGHT }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', mb: 1, color: ALMOND }}>{step.title}</Typography>
                                <Typography sx={{ color: ALMOND_DARK, fontSize: '.9rem' }}>{step.desc}</Typography>
                            </GlassCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ========== FEATURES ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 10, md: 16 } }}>
                <Typography sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, fontWeight: 900, letterSpacing: '-0.05em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Почему выбирают EdSpace
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, maxWidth: 680, mx: 'auto', lineHeight: 1.8, mb: 8 }}>
                    Мы убираем рутину из работы репетитора, чтобы вы могли сосредоточиться на учениках.
                </Typography>

                <Grid container spacing={4} sx={{ pl: { md: 4 } }}>
                    {advantages.map((item, i) => (
                        <Grid item xs={12} md={4} key={i}>
                            <GlassCard sx={{ p: 4, height: '100%' }}>
                                <Box sx={{ width: 58, height: 58, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(108,59,170,.2)', color: PURPLE_LIGHT, mb: 4 }}>
                                    {item.icon}
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.35rem', mb: 2, color: ALMOND }}>{item.title}</Typography>
                                <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.8 }}>{item.desc}</Typography>
                            </GlassCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ========== TESTIMONIALS ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 10, md: 16 } }}>
                <Typography sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.05em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Что говорят репетиторы
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mb: 8 }}>Присоединяйтесь к сообществу EdSpace</Typography>

                <Grid container spacing={4} sx={{ pl: { md: 4 } }}>
                    {testimonials.map((t, i) => (
                        <Grid item xs={12} md={4} key={i}>
                            <GlassCard sx={{ p: 4, height: '100%' }}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                    <Avatar sx={{ bgcolor: [PURPLE_PRIMARY, GOLD, ROSE][i], fontWeight: 700 }}>{t.avatar}</Avatar>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: ALMOND }}>{t.name}</Typography>
                                        <Typography sx={{ color: ALMOND_DARK, fontSize: '.85rem' }}>{t.role}</Typography>
                                    </Box>
                                </Stack>
                                <Box sx={{ color: GOLD, mb: 2 }}>{'★'.repeat(5)}</Box>
                                <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.8, fontStyle: 'italic' }}>«{t.text}»</Typography>
                            </GlassCard>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ========== PRICING ========== */}
            <Box sx={{ position: 'relative', zIndex: 1, py: { xs: 10, md: 16 }, background: `linear-gradient(180deg, transparent, rgba(245,230,211,.02))` }}>
                <Container maxWidth="lg">
                    <Typography sx={{ fontSize: { xs: '2.2rem', md: '3.5rem' }, fontWeight: 900, letterSpacing: '-0.05em', textAlign: 'center', mb: 2, color: ALMOND }}>
                        Простой тариф
                    </Typography>
                    <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mb: 8, lineHeight: 1.8 }}>
                        14 дней бесплатно. Без карты и скрытых условий.
                    </Typography>

                    <Grid container spacing={4} justifyContent="center" sx={{ pl: { md: 4 } }}>
                        <Grid item xs={12} md={5}>
                            <GlassCard sx={{ p: 5, height: '100%' }}>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', mb: 1, color: ALMOND }}>Starter</Typography>
                                <Typography sx={{ color: ALMOND_DARK, mb: 4 }}>Для знакомства с платформой</Typography>
                                <Typography sx={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.06em', mb: 4, color: ALMOND }}>0 ₽</Typography>
                                <Stack spacing={2.5} sx={{ mb: 5 }}>
                                    {['14 дней бесплатно', 'Все основные функции', 'Онлайн-занятия', 'Поддержка'].map((x, i) => (
                                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                                            <CheckCircle sx={{ color: SUCCESS_GREEN, fontSize: 20 }} />
                                            <Typography sx={{ color: ALMOND }}>{x}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                                <SecondaryButton fullWidth onClick={() => navigate('/register')}>Попробовать</SecondaryButton>
                            </GlassCard>
                        </Grid>

                        <Grid item xs={12} md={5}>
                            <GlassCard sx={{ p: 5, height: '100%', border: `1px solid rgba(108,59,170,.5)`, boxShadow: `0 20px 60px rgba(108,59,170,.2)` }}>
                                <Chip label="Самый популярный" sx={{ mb: 3, bgcolor: 'rgba(108,59,170,.2)', color: PURPLE_LIGHT, border: `1px solid rgba(108,59,170,.3)` }} />
                                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', mb: 1, color: ALMOND }}>Pro</Typography>
                                <Typography sx={{ color: ALMOND_DARK, mb: 4 }}>Для активных репетиторов</Typography>
                                <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mb: 4 }}>
                                    <Typography sx={{ fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.06em', lineHeight: 1, color: ALMOND }}>990 ₽</Typography>
                                    <Typography sx={{ color: ALMOND_DARK, mb: .7 }}>/ месяц</Typography>
                                </Stack>
                                <Stack spacing={2.5} sx={{ mb: 5 }}>
                                    {['Без ограничений', 'Все будущие функции', 'Приоритетная поддержка', 'Расширенная аналитика'].map((x, i) => (
                                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                                            <CheckCircle sx={{ color: SUCCESS_GREEN, fontSize: 20 }} />
                                            <Typography sx={{ color: ALMOND }}>{x}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                                <PrimaryButton fullWidth onClick={() => navigate('/register')}>Начать бесплатно</PrimaryButton>
                            </GlassCard>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ========== FAQ ========== */}
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: { xs: 10, md: 16 } }}>
                <Typography sx={{ fontSize: { xs: '2.2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.05em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Частые вопросы
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mb: 6 }}>
                    Всё что нужно знать о платформе
                </Typography>

                {faqItems.map((item, i) => (
                    <StyledAccordion key={i} expanded={faqExpanded === i} onChange={() => setFaqExpanded(faqExpanded === i ? false : i)}>
                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: PURPLE_LIGHT }} />}>
                            <Typography sx={{ fontWeight: 600, color: ALMOND, fontSize: '1.1rem' }}>{item.question}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.8 }}>{item.answer}</Typography>
                        </AccordionDetails>
                    </StyledAccordion>
                ))}

                {/* Ещё вопросы */}
                <Box sx={{ textAlign: 'center', mt: 6, p: 4, borderRadius: 4, background: 'rgba(245,230,211,.03)', border: `1px solid rgba(245,230,211,.06)` }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.3rem', mb: 2, color: ALMOND }}>Остались вопросы?</Typography>
                    <Typography sx={{ color: ALMOND_DARK, mb: 3 }}>Напишите нам — ответим в течение часа</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <AccentButton startIcon={<Telegram />} onClick={() => window.open('https://t.me/edspace', '_blank')}>
                            Telegram
                        </AccentButton>
                        <SecondaryButton startIcon={<Email />}>
                            Написать на почту
                        </SecondaryButton>
                    </Stack>
                </Box>
            </Container>

            {/* ========== CTA ========== */}
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: { xs: 10, md: 16 } }}>
                <GlassCard sx={{ p: { xs: 5, md: 8 }, textAlign: 'center', border: `1px solid rgba(108,59,170,.3)` }}>
                    <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.05em', mb: 3, color: ALMOND }}>
                        Попробуйте EdSpace
                    </Typography>
                    <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.8, maxWidth: 620, mx: 'auto', mb: 5 }}>
                        Подключитесь за пару минут и начните вести занятия в единой современной платформе.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <PrimaryButton size="large" onClick={() => navigate('/register')} endIcon={<ArrowForward />}>Начать бесплатно</PrimaryButton>
                        <AccentButton size="large" startIcon={<Telegram />} onClick={() => window.open('https://t.me/edspace', '_blank')}>Telegram-канал</AccentButton>
                    </Stack>
                </GlassCard>
            </Container>

            {/* DEMO DIALOG */}
            <Dialog open={demoOpen} onClose={() => setDemoOpen(false)} maxWidth="md" fullWidth
                PaperProps={{ sx: { bgcolor: DEEP_PURPLE, borderRadius: 4, border: `1px solid rgba(245,230,211,.1)` } }}>
                <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, mb: 3, color: ALMOND }}>🎥 Демо-видео</Typography>
                    <Box sx={{ bgcolor: '#000', borderRadius: 3, height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 3 }}>
                        <PlayArrow sx={{ fontSize: 64, color: PURPLE_LIGHT, opacity: 0.6 }} />
                    </Box>
                    <Typography sx={{ color: ALMOND_DARK }}>
                        Демо-видео появится здесь. А пока — <Box component="span" onClick={() => { setDemoOpen(false); navigate('/register'); }} sx={{ color: PURPLE_LIGHT, cursor: 'pointer', fontWeight: 600 }}>попробуйте сами!</Box>
                    </Typography>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LandingPage;