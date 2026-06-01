// ========== frontend/src/pages/LandingPage.js (v5 — Human Touch Edition) ==========
import React, { useState, useEffect, useRef } from 'react';
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
    ExpandMore, Telegram, Send, Email, Notifications,
    Star, Diamond, LocalOffer, FlashOn, Favorite,
    Coffee, Mood, WavingHand
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// ========== COLOR PALETTE (чуть приглушённые, "живые" оттенки) ==========
const DEEP_PURPLE = '#2D1B69';
const PURPLE_PRIMARY = '#6C3BAA';
const PURPLE_LIGHT = '#9B6FD4';
const ALMOND = '#F5E6D3';
const ALMOND_DARK = '#E8D5C0';
const CREAM = '#FFF8F0';
const GOLD = '#C8963E';
const ROSE = '#D4856B';
const SUCCESS_GREEN = '#5B8C5A';
const HOT_PINK = '#FF6B9D';
const CYBER_BLUE = '#00E5FF';
const WARM_YELLOW = '#FFD166';

// ========== IMPERFECT ANIMATIONS (человеческие, не-математические) ==========
const gentleFloat = keyframes`
    0%, 100% { transform: translateY(0px) rotate(0deg); }
    30% { transform: translateY(-12px) rotate(2deg); }
    60% { transform: translateY(-18px) rotate(-1.5deg); }
    85% { transform: translateY(-5px) rotate(0.5deg); }
`;

const subtleWobble = keyframes`
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(0.5deg); }
    75% { transform: rotate(-0.5deg); }
`;

const unevenPulse = keyframes`
    0%, 100% { opacity: 0.15; transform: scale(1); }
    40% { opacity: 0.4; transform: scale(1.12); }
    70% { opacity: 0.25; transform: scale(0.98); }
`;

const organicGlow = keyframes`
    0%, 100% { box-shadow: 0 0 25px rgba(108,59,170,.25), 0 0 50px rgba(108,59,170,.1); }
    35% { box-shadow: 0 0 45px rgba(108,59,170,.45), 0 0 90px rgba(155,111,212,.25); }
    70% { box-shadow: 0 0 30px rgba(200,150,62,.3), 0 0 60px rgba(200,150,62,.15); }
`;

const naturalShimmer = keyframes`
    0% { background-position: -150% center; }
    100% { background-position: 150% center; }
`;

const slowSpin = keyframes`
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
`;

const popIn = keyframes`
    0% { transform: scale(0.4); opacity: 0; }
    60% { transform: scale(1.08); }
    80% { transform: scale(0.95); }
    100% { transform: scale(1); opacity: 1; }
`;

const gradualSlideUp = keyframes`
    0% { transform: translateY(40px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
`;

const gentleGradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

// ========== STYLED COMPONENTS (с "человеческими" нюансами) ==========
const DustParticle = styled(Box)(({ size, color, top, left, duration, delay, blur }) => ({
    position: 'absolute',
    width: size,
    height: size,
    borderRadius: '60% 40% 70% 30%', // неровная форма
    background: color,
    top: `${top}%`,
    left: `${left}%`,
    opacity: 0,
    animation: `${gentleFloat} ${duration}s ease-in-out infinite`,
    animationDelay: `${delay}s`,
    filter: `blur(${blur}px)`,
}));

const HumanButton = styled(Button)({
    borderRadius: 20,
    textTransform: 'none',
    fontWeight: 600,
    padding: '14px 28px',
    fontSize: '1.05rem',
    transition: 'all 0.35s cubic-bezier(0.4, 1.4, 0.7, 1)',
    position: 'relative',
    overflow: 'hidden',
    letterSpacing: '-0.01em',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: '-120%',
        width: '120%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
        transition: 'left 0.7s ease',
    },
    '&:hover::before': {
        left: '120%',
    },
    '&:active': {
        transform: 'scale(0.97)',
    },
});

const PrimaryButton = styled(HumanButton)({
    background: `linear-gradient(135deg, #7B4FBF, #A07AD4)`,
    backgroundSize: '180% 180%',
    animation: `${gentleGradientShift} 5s ease infinite`,
    color: CREAM,
    boxShadow: '0 8px 25px rgba(108,59,170,.3)',
    '&:hover': {
        transform: 'translateY(-2px) scale(1.01)',
        boxShadow: '0 16px 40px rgba(108,59,170,.45)',
    },
});

const OutlineButton = styled(HumanButton)({
    border: `2px solid ${ALMOND_DARK}`,
    color: ALMOND_DARK,
    background: 'rgba(245,230,211,.03)',
    backdropFilter: 'blur(15px)',
    '&:hover': {
        borderColor: ALMOND,
        color: ALMOND,
        background: 'rgba(245,230,211,.1)',
        transform: 'translateY(-1px)',
    },
});

const AccentButton = styled(HumanButton)({
    background: `linear-gradient(135deg, #D4A24E, #E09570)`,
    backgroundSize: '180% 180%',
    animation: `${gentleGradientShift} 4s ease infinite`,
    color: CREAM,
    boxShadow: '0 8px 25px rgba(200,150,62,.2)',
    '&:hover': {
        transform: 'translateY(-2px) scale(1.01)',
        boxShadow: '0 16px 40px rgba(200,150,62,.35)',
    },
});

const CTAGlowButton = styled(HumanButton)({
    background: `linear-gradient(135deg, #FF6B9D, #A07AD4)`,
    backgroundSize: '180% 180%',
    animation: `${gentleGradientShift} 3s ease infinite, ${organicGlow} 3s ease-in-out infinite`,
    color: CREAM,
    fontWeight: 700,
    fontSize: '1.15rem',
    padding: '18px 36px',
    borderRadius: 24,
    '&:hover': {
        transform: 'translateY(-3px) scale(1.03)',
        animation: `${gentleGradientShift} 1.5s ease infinite, ${organicGlow} 1.5s ease-in-out infinite`,
    },
});

const CardWithDepth = styled(Box)(({ theme }) => ({
    position: 'relative',
    overflow: 'hidden',
    background: 'linear-gradient(175deg, rgba(245,230,211,.07), rgba(245,230,211,.02))',
    border: '1px solid rgba(245,230,211,.08)',
    backdropFilter: 'blur(25px)',
    borderRadius: 36,
    transition: 'all 0.45s cubic-bezier(0.4, 1.3, 0.7, 1)',
    '&:hover': {
        transform: 'translateY(-6px)',
        border: '1px solid rgba(245,230,211,.18)',
        background: 'linear-gradient(175deg, rgba(245,230,211,.1), rgba(245,230,211,.05))',
        boxShadow: '0 25px 50px rgba(108,59,170,.12)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(145deg, transparent, rgba(255,255,255,.015))',
        borderRadius: 36,
        pointerEvents: 'none',
    },
}));

const GradientText = styled('span')({
    background: `linear-gradient(135deg, ${ALMOND}, ${PURPLE_LIGHT}, ${GOLD})`,
    backgroundSize: '200% 200%',
    animation: `${gentleGradientShift} 5s ease infinite`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 900,
    letterSpacing: '-0.02em',
});

const HighlightText = styled('span')({
    color: HOT_PINK,
    textShadow: '0 0 8px rgba(255,107,157,.4), 0 0 25px rgba(255,107,157,.2)',
    animation: `${unevenPulse} 2.5s ease-in-out infinite`,
});

const AccordionStyled = styled(Accordion)({
    background: 'transparent',
    border: '1px solid rgba(245,230,211,.06)',
    borderRadius: '18px !important',
    marginBottom: 14,
    transition: 'all 0.3s ease',
    '&:before': { display: 'none' },
    '&:hover': {
        border: '1px solid rgba(245,230,211,.14)',
        transform: 'translateX(3px)',
    },
});

const PriceHighlight = styled(Box)({
    position: 'relative',
    display: 'inline-block',
    animation: `${popIn} 0.7s cubic-bezier(0.4, 1.3, 0.7, 1)`,
    '&::before': {
        content: '"💫"',
        position: 'absolute',
        top: -25,
        right: -25,
        fontSize: '1.8rem',
        animation: `${gentleFloat} 2.5s ease-in-out infinite`,
    },
});

// ========== ORGANIC PARTICLES (пылинки, а не идеальные круги) ==========
const DustParticles = ({ count = 18 }) => {
    const particles = Array.from({ length: count }, (_, i) => ({
        id: i,
        size: Math.random() * 7 + 1.5,
        color: [PURPLE_PRIMARY, PURPLE_LIGHT, GOLD, ROSE, HOT_PINK, WARM_YELLOW][Math.floor(Math.random() * 6)],
        top: Math.random() * 100,
        left: Math.random() * 100,
        duration: Math.random() * 8 + 5,
        delay: Math.random() * 3,
        blur: Math.random() * 3 + 0.5,
    }));

    return (
        <Box sx={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
            {particles.map(p => (
                <DustParticle key={p.id} {...p} />
            ))}
        </Box>
    );
};

// ========== TYPEWRITER (с ошибками и исправлениями) ==========
const TypewriterText = ({ texts, speed = 80, pauseTime = 2500 }) => {
    const [displayText, setDisplayText] = useState('');
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);
    const [mistake, setMistake] = useState(false);

    useEffect(() => {
        const currentText = texts[textIndex];
        
        const timer = setTimeout(() => {
            if (!isDeleting && charIndex < currentText.length) {
                // Иногда "ошибаемся" — вставляем случайный символ
                if (!mistake && Math.random() < 0.08 && charIndex > 1) {
                    setDisplayText(currentText.substring(0, charIndex) + String.fromCharCode(97 + Math.floor(Math.random() * 26)));
                    setMistake(true);
                } else if (mistake) {
                    // Исправляем ошибку
                    setDisplayText(currentText.substring(0, charIndex));
                    setMistake(false);
                    setCharIndex(charIndex + 1);
                } else {
                    setDisplayText(currentText.substring(0, charIndex + 1));
                    setCharIndex(charIndex + 1);
                }
            } else if (!isDeleting && charIndex >= currentText.length) {
                setTimeout(() => setIsDeleting(true), pauseTime);
            } else if (isDeleting && charIndex > 0) {
                setDisplayText(currentText.substring(0, charIndex - 1));
                setCharIndex(charIndex - 1);
            } else if (isDeleting && charIndex === 0) {
                setIsDeleting(false);
                setTextIndex((textIndex + 1) % texts.length);
            }
        }, isDeleting ? speed / 2.5 : speed * (Math.random() * 0.4 + 0.8)); // случайная скорость

        return () => clearTimeout(timer);
    }, [charIndex, isDeleting, textIndex, texts, speed, pauseTime, mistake]);

    return (
        <Box component="span" sx={{ 
            borderRight: `3px solid ${PURPLE_LIGHT}`,
            animation: `${unevenPulse} 1.2s ease-in-out infinite`,
            paddingRight: '5px',
            marginRight: '2px',
        }}>
            {displayText}
        </Box>
    );
};

// ========== SCROLL REVEAL HOOK ==========
const useScrollReveal = (threshold = 0.1) => {
    const ref = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            { threshold }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => {
            if (ref.current) {
                observer.unobserve(ref.current);
            }
        };
    }, [threshold]);

    return [ref, isVisible];
};

// ========== MAIN COMPONENT ==========
const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenu, setMobileMenu] = useState(false);
    const [demoOpen, setDemoOpen] = useState(false);
    const [counts, setCounts] = useState({ lessons: 0, students: 0, income: 0 });
    const [faqExpanded, setFaqExpanded] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [heroRef, heroVisible] = useScrollReveal(0.05);
    const [statsRef, statsVisible] = useScrollReveal(0.1);
    const [pricingRef, pricingVisible] = useScrollReveal(0.1);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Анимируем счётчики только когда они видны
    useEffect(() => {
        if (!statsVisible) return;
        
        const targets = { lessons: 287, students: 34, income: 198 };
        const duration = 2200;
        const steps = 80;
        let step = 0;
        
        const timer = setInterval(() => {
            step++;
            const progress = step / steps;
            // Неравномерная функция easing — имитация "живого" счётчика
            const easeInOut = progress < 0.5 
                ? 2 * progress * progress 
                : -1 + (4 - 2 * progress) * progress;
            
            setCounts({
                lessons: Math.floor(targets.lessons * easeInOut + Math.sin(step * 0.3) * 2),
                students: Math.floor(targets.students * easeInOut),
                income: Math.floor(targets.income * easeInOut + Math.sin(step * 0.2) * 1.5),
            });
            
            if (step >= steps) {
                setCounts(targets);
                clearInterval(timer);
            }
        }, duration / steps);
        
        return () => clearInterval(timer);
    }, [statsVisible]);

    const advantages = [
        { 
            icon: <Bolt sx={{ fontSize: 32 }} />, 
            title: 'Всё в одном месте', 
            desc: 'Расписание, видеоуроки, домашки и оплаты — одна система вместо пяти. Серьёзно, я сам удивился, насколько это удобно.' 
        },
        { 
            icon: <VerifiedUser sx={{ fontSize: 32 }} />, 
            title: 'Родители видят прогресс', 
            desc: 'Больше не нужно писать в чаты: "Да, оплата пришла" или "Нет, занятия не будет". Всё видно сразу.' 
        },
        { 
            icon: <Mood sx={{ fontSize: 32 }} />, 
            title: 'Делаем вместе', 
            desc: 'Каждую неделю добавляем что-то новое. И нет, не потому что "надо", а потому что репетиторы просят.' 
        },
    ];

    const steps = [
        { icon: <WavingHand sx={{ fontSize: 38 }} />, title: 'Регистрируетесь', desc: 'Имя, почта — и вы внутри' },
        { icon: <School sx={{ fontSize: 38 }} />, title: 'Добавляете учеников', desc: 'По ссылке или вручную, как удобно' },
        { icon: <CalendarMonth sx={{ fontSize: 38 }} />, title: 'Планируете занятия', desc: 'Разовые и постоянные — без путаницы' },
        { icon: <Coffee sx={{ fontSize: 38 }} />, title: 'Работаете с комфортом', desc: 'Видео, доски, домашки — всё под рукой' },
    ];

    const testimonials = [
        { 
            name: 'Ангелина', 
            role: 'Математика, 5–9 классы', 
            text: 'EdSpace заменил мне 4 приложения. Честно, я сначала сомневалась, но после первой недели поняла — назад дороги нет. Всё работает, как часы.', 
            avatar: 'А',
            color: PURPLE_PRIMARY
        },
        { 
            name: 'Дмитрий', 
            role: 'Информатика, ЕГЭ', 
            text: 'Родители довольны — видят расписание и оценки без лишних вопросов. А я вижу статистику по ученикам. Это прям кайф.', 
            avatar: 'Д',
            color: GOLD
        },
        { 
            name: 'Юлия', 
            role: 'Русский, началка', 
            text: 'ИИ-генерация заданий — это не магия, но близко к тому. За пару минут готовлю то, на что раньше уходил час. И задания интересные!', 
            avatar: 'Ю',
            color: HOT_PINK
        },
    ];

    const faqItems = [
        {
            question: 'Сколько это стоит? Честно.',
            answer: '14 дней — бесплатно. Потом 499 ₽ в месяц. И да, это всё. Никаких "звёздочек", скрытых платежей и внезапных списаний. Цена как одна пицца.'
        },
        {
            question: 'А если я не технарь? Справлюсь?',
            answer: 'Справитесь. Серьёзно. Там всё интуитивно — если вы умеете пользоваться WhatsApp и YouTube, то с EdSpace проблем не будет. А если что — поддержка ответит за полчаса.'
        },
        {
            question: 'Как ученики попадают в систему?',
            answer: 'Даёте им ссылку — они переходят, и всё. Или создаёте карточку ученика сами. Никаких "установите программу, зарегистрируйтесь, подтвердите email".'
        },
        {
            question: 'Какие платформы для видео?',
            answer: 'Zoom, Телемост, Skype, Jitsi — что вам удобнее. Для каждого урока можно выбрать свою. Мы не заставляем пользоваться чем-то одним.'
        },
        {
            question: 'Родители увидят оценки?',
            answer: 'Да. И расписание, и домашки, и оплаты. Это избавляет от 80% вопросов в чатах. Проверено на десятках репетиторов.'
        },
        {
            question: 'Где хранятся данные?',
            answer: 'В России, на наших серверах. Всё по 152-ФЗ. Данные можно выгрузить или удалить в любой момент — они ваши, не наши.'
        },
        {
            question: 'А что с ИИ-заданиями? Это вообще законно?',
            answer: 'Законно. Нейросеть генерирует уникальные задания по теме, которую вы зададите. Это не "списывание", а инструмент подготовки. Как калькулятор для математика.'
        },
    ];

    const typewriterTexts = ['репетиторов', 'учителей', 'наставников', 'тех, кто учит'];

    return (
        <Box sx={{ bgcolor: DEEP_PURPLE, color: CREAM, minHeight: '100vh', overflowX: 'hidden', position: 'relative' }}>
            {/* DUST & TEXTURE (вместо идеальных частиц) */}
            <DustParticles count={22} />
            
            {/* ФОНОВАЯ ТЕКСТУРА (неравномерная сетка) */}
            <Box sx={{ 
                position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
                backgroundImage: `linear-gradient(rgba(245,230,211,.015) 1px, transparent 1px), linear-gradient(90deg, rgba(245,230,211,.015) 1px, transparent 1px)`,
                backgroundSize: '48px 48px',
                backgroundPosition: '5px 8px', // смещение для "неидеальности"
                maskImage: 'radial-gradient(ellipse at 65% 35%, black 30%, transparent 85%)',
                opacity: 0.7,
            }} />

            {/* ОРГАНИЧЕСКИЕ ПЯТНА СВЕТА */}
            <Box sx={{ 
                position: 'fixed', top: -250, right: -180, width: 750, height: 750, borderRadius: '45% 55% 60% 40%',
                background: 'radial-gradient(circle, rgba(108,59,170,.35), transparent 75%)',
                filter: 'blur(120px)', zIndex: 0, animation: `${unevenPulse} 5s ease-in-out infinite`,
            }} />
            <Box sx={{ 
                position: 'fixed', bottom: -280, left: -150, width: 650, height: 650, borderRadius: '55% 45% 40% 60%',
                background: 'radial-gradient(circle, rgba(255,107,157,.25), transparent 75%)',
                filter: 'blur(110px)', zIndex: 0, animation: `${unevenPulse} 6s ease-in-out infinite alternate`,
            }} />
            <Box sx={{ 
                position: 'fixed', top: '40%', right: '10%', width: 400, height: 400, borderRadius: '50% 50% 45% 55%',
                background: 'radial-gradient(circle, rgba(200,150,62,.15), transparent 80%)',
                filter: 'blur(90px)', zIndex: 0, animation: `${gentleFloat} 8s ease-in-out infinite`,
            }} />

            {/* HEADER */}
            <AppBar position="fixed" elevation={0} 
                sx={{ 
                    bgcolor: scrolled ? 'rgba(45,27,105,.92)' : 'rgba(45,27,105,.65)',
                    backdropFilter: 'blur(20px)',
                    borderBottom: `1px solid rgba(245,230,211,.06)`,
                    transition: 'all 0.5s ease',
                }}>
                <Toolbar sx={{ maxWidth: 1280, width: '100%', mx: 'auto', py: 2 }}>
                    <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ cursor: 'pointer' }}>
                            <Box sx={{ 
                                width: 40, height: 40, borderRadius: '14px',
                                background: `linear-gradient(135deg, ${PURPLE_PRIMARY}, ${HOT_PINK})`,
                                boxShadow: '0 8px 25px rgba(108,59,170,.45)',
                                animation: `${organicGlow} 3s ease-in-out infinite`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transform: 'rotate(-3deg)', // лёгкий наклон
                            }}>
                                <AutoAwesome sx={{ color: CREAM, fontSize: 18 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.03em', color: ALMOND }}>
                                EdSpace
                            </Typography>
                        </Stack>

                        {!isMobile ? (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Button onClick={() => navigate('/login')} 
                                    sx={{ 
                                        color: ALMOND_DARK, textTransform: 'none', fontWeight: 500,
                                        '&:hover': { color: ALMOND },
                                        transition: 'color 0.3s',
                                    }}>
                                    Войти
                                </Button>
                                <PrimaryButton onClick={() => navigate('/register')} endIcon={<RocketLaunch />}>
                                    Попробовать
                                </PrimaryButton>
                            </Stack>
                        ) : (
                            <IconButton onClick={() => setMobileMenu(true)} sx={{ color: ALMOND }}>
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            {/* MOBILE MENU */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)}
                PaperProps={{ sx: { bgcolor: DEEP_PURPLE, color: CREAM, width: 280 } }}>
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton onClick={() => setMobileMenu(false)} sx={{ color: ALMOND }}>
                            <Close />
                        </IconButton>
                    </Box>
                    <List>
                        <ListItem onClick={() => { navigate('/login'); setMobileMenu(false); }} sx={{ cursor: 'pointer' }}>
                            <ListItemText primary="Войти" />
                        </ListItem>
                        <ListItem onClick={() => { navigate('/register'); setMobileMenu(false); }} sx={{ cursor: 'pointer' }}>
                            <ListItemText primary="Попробовать" sx={{ color: PURPLE_LIGHT }} />
                        </ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* ========== HERO ========== */}
            <Container maxWidth="xl" ref={heroRef} sx={{ position: 'relative', zIndex: 1, pt: { xs: 13, md: 18 }, pb: { xs: 8, md: 14 } }}>
                <Grid container spacing={8} alignItems="center">
                    <Grid item xs={12} md={1} />
                    
                    <Grid item xs={12} md={5}>
                        <Box sx={{ 
                            opacity: heroVisible ? 1 : 0,
                            transform: heroVisible ? 'translateY(0)' : 'translateY(20px)',
                            transition: 'all 0.8s ease-out',
                        }}>
                            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
                                <Chip icon={<LocalOffer />} label="14 дней бесплатно"
                                    sx={{ 
                                        bgcolor: 'rgba(108,59,170,.15)', color: PURPLE_LIGHT,
                                        border: '1px solid rgba(108,59,170,.25)',
                                        animation: `${unevenPulse} 2.5s ease-in-out infinite`,
                                        borderRadius: '12px',
                                    }} />
                                <Chip icon={<Favorite sx={{ color: HOT_PINK, fontSize: 16 }} />} label="499 ₽/мес"
                                    sx={{ 
                                        bgcolor: 'rgba(255,107,157,.12)', color: HOT_PINK,
                                        border: '1px solid rgba(255,107,157,.25)',
                                        fontWeight: 700,
                                        borderRadius: '12px',
                                    }} />
                            </Stack>

                            <Typography component="h1"
                                sx={{ 
                                    fontSize: { xs: '2.4rem', md: '5rem' }, lineHeight: 1,
                                    fontWeight: 900, letterSpacing: '-0.05em', maxWidth: 720, mb: 3, color: ALMOND,
                                }}>
                                Платформа для{' '}
                                <GradientText>современных</GradientText>
                                <br />
                                <TypewriterText texts={typewriterTexts} speed={90} pauseTime={2200} />
                            </Typography>

                            <Typography sx={{ 
                                fontSize: { xs: '1rem', md: '1.2rem' }, lineHeight: 1.75,
                                color: ALMOND_DARK, maxWidth: 520, mb: 5,
                            }}>
                                Календарь, видеоуроки, домашки, платежи — всё, что нужно репетитору, в одном окне.{' '}
                                <HighlightText>И всего за 499 ₽ в месяц.</HighlightText>
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                                <CTAGlowButton onClick={() => navigate('/register')} endIcon={<RocketLaunch />}>
                                    Начать бесплатно
                                </CTAGlowButton>
                                <OutlineButton startIcon={<PlayArrow />} onClick={() => setDemoOpen(true)}>
                                    Посмотреть демо
                                </OutlineButton>
                            </Stack>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 5 }}>
                                <AccentButton startIcon={<Telegram />} onClick={() => window.open('https://t.me/edspace', '_blank')}>
                                    Наш Telegram
                                </AccentButton>
                                <OutlineButton startIcon={<Email />} onClick={() => navigate('/register')}>
                                    Новости на почту
                                </OutlineButton>
                            </Stack>

                            <Stack direction="row" spacing={2} alignItems="center">
                                <AvatarGroup max={5} spacing={-8}>
                                    {['Д', 'А', 'М', 'Е', 'С'].map((x, i) => (
                                        <Avatar key={i} 
                                            sx={{ 
                                                bgcolor: [PURPLE_PRIMARY, PURPLE_LIGHT, GOLD, ROSE, HOT_PINK][i],
                                                border: `3px solid ${DEEP_PURPLE}`,
                                                boxShadow: '0 0 15px rgba(108,59,170,.25)',
                                                width: 38, height: 38,
                                                fontSize: '0.9rem',
                                            }}>
                                            {x}
                                        </Avatar>
                                    ))}
                                </AvatarGroup>
                                <Typography sx={{ color: ALMOND_DARK, fontSize: '0.95rem' }}>
                                    <Box component="span" sx={{ color: GOLD, fontWeight: 700 }}>45+</Box> репетиторов уже работают
                                </Typography>
                            </Stack>
                        </Box>
                    </Grid>

                    {/* RIGHT — Dashboard Preview */}
                    <Grid item xs={12} md={5}>
                        <Box sx={{ position: 'relative', maxWidth: 600, mx: 'auto', opacity: heroVisible ? 1 : 0, transform: heroVisible ? 'translateY(0)' : 'translateY(30px)', transition: 'all 0.9s ease-out 0.2s' }}>
                            <CardWithDepth sx={{ p: 4 }}>
                                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                                    <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: ALMOND }}>
                                        📊 Моя панель
                                    </Typography>
                                    <Chip label="Онлайн" icon={<FlashOn sx={{ color: SUCCESS_GREEN, fontSize: 14 }} />}
                                        sx={{ bgcolor: 'rgba(91,140,90,.12)', color: SUCCESS_GREEN, borderRadius: '10px', fontSize: '0.8rem' }} />
                                </Stack>

                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        { title: 'Уроков', value: '42', icon: <CalendarMonth />, color: PURPLE_PRIMARY },
                                        { title: 'Доход', value: '87k', icon: <Payments />, color: GOLD },
                                        { title: 'Созвонов', value: '19', icon: <Videocam />, color: HOT_PINK },
                                    ].map((item, i) => (
                                        <Grid item xs={4} key={i}>
                                            <CardWithDepth sx={{ p: 2, textAlign: 'center', borderRadius: 20 }}>
                                                <Box sx={{ color: item.color, mb: 1 }}>{item.icon}</Box>
                                                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: ALMOND }}>
                                                    {item.value}
                                                </Typography>
                                                <Typography sx={{ color: ALMOND_DARK, fontSize: '.8rem' }}>{item.title}</Typography>
                                            </CardWithDepth>
                                        </Grid>
                                    ))}
                                </Grid>

                                <Box sx={{ p: 3, borderRadius: 5, background: 'rgba(245,230,211,.03)', border: '1px solid rgba(245,230,211,.05)' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                        <Typography sx={{ fontWeight: 700, color: ALMOND }}>⏰ Сегодня</Typography>
                                        <BarChart sx={{ color: ALMOND_DARK, fontSize: 20 }} />
                                    </Stack>
                                    {[
                                        { name: 'Математика', time: '16:00', student: 'Катя', color: PURPLE_PRIMARY },
                                        { name: 'Информатика', time: '18:30', student: 'Паша', color: HOT_PINK },
                                    ].map((x, i) => (
                                        <Box key={i}>
                                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2 }}>
                                                <Stack direction="row" spacing={2} alignItems="center">
                                                    <Box sx={{ width: 11, height: 11, borderRadius: '40% 60% 50% 50%', bgcolor: x.color,
                                                        boxShadow: `0 0 12px ${x.color}` }} />
                                                    <Box>
                                                        <Typography sx={{ color: ALMOND, fontSize: '0.95rem' }}>{x.name}</Typography>
                                                        <Typography sx={{ color: ALMOND_DARK, fontSize: '0.75rem' }}>{x.student}</Typography>
                                                    </Box>
                                                </Stack>
                                                <Chip label={x.time} size="small"
                                                    sx={{ bgcolor: 'rgba(245,230,211,.08)', color: ALMOND_DARK, fontSize: '0.8rem' }} />
                                            </Stack>
                                            {i !== 1 && <Divider sx={{ borderColor: 'rgba(245,230,211,.05)' }} />}
                                        </Box>
                                    ))}
                                </Box>
                            </CardWithDepth>

                            {/* Плавающая карточка (несимметричное положение) */}
                            <CardWithDepth sx={{ 
                                position: 'absolute', right: -40, bottom: -40, p: 3, width: 250,
                                display: { xs: 'none', md: 'block' },
                                animation: `${gentleFloat} 5s ease-in-out infinite`,
                                animationDelay: '0.8s',
                                borderRadius: 24,
                            }}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                                    <CheckCircle sx={{ color: SUCCESS_GREEN, fontSize: 28 }} />
                                    <Typography sx={{ fontWeight: 700, color: ALMOND, fontSize: '0.95rem' }}>Оплата прошла</Typography>
                                </Stack>
                                <Typography sx={{ color: ALMOND_DARK, fontSize: '.9rem', lineHeight: 1.6 }}>
                                    Родитель оплатил абонемент. Вам пришло уведомление — больше никаких напоминаний.
                                </Typography>
                            </CardWithDepth>
                        </Box>
                    </Grid>
                    
                    <Grid item xs={12} md={1} />
                </Grid>
            </Container>

            {/* ========== STATS (с эффектом появления) ========== */}
            <Container maxWidth="lg" ref={statsRef} sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 12 } }}>
                <CardWithDepth sx={{ 
                    p: { xs: 4, md: 6 }, 
                    opacity: statsVisible ? 1 : 0, 
                    transform: statsVisible ? 'translateY(0)' : 'translateY(15px)',
                    transition: 'all 0.7s ease-out',
                }}>
                    <Grid container spacing={4}>
                        {[
                            [`${counts.lessons}+`, 'Занятий проведено', PURPLE_PRIMARY],
                            [`${counts.students}`, 'Учеников учится', GOLD],
                            [`${counts.income}k+ ₽`, 'Заработано на платформе', SUCCESS_GREEN],
                            ['24/7', 'Поддержка без выходных', HOT_PINK],
                        ].map((x, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Typography sx={{ 
                                    fontSize: { xs: '1.8rem', md: '3rem' }, fontWeight: 900,
                                    letterSpacing: '-0.04em', mb: 1,
                                    color: x[2],
                                    textShadow: `0 0 25px ${x[2]}33`,
                                }}>
                                    {x[0]}
                                </Typography>
                                <Typography sx={{ color: ALMOND_DARK, fontSize: '1rem' }}>{x[1]}</Typography>
                            </Grid>
                        ))}
                    </Grid>
                </CardWithDepth>
            </Container>

            {/* ========== PRICING ========== */}
            <Box ref={pricingRef} sx={{ position: 'relative', zIndex: 1, py: { xs: 8, md: 14 }, background: 'linear-gradient(180deg, transparent, rgba(245,230,211,.015))' }}>
                <Container maxWidth="lg">
                    <Box sx={{ 
                        opacity: pricingVisible ? 1 : 0, 
                        transform: pricingVisible ? 'translateY(0)' : 'translateY(20px)',
                        transition: 'all 0.8s ease-out',
                    }}>
                        <Typography sx={{ 
                            fontSize: { xs: '2rem', md: '3.2rem' }, fontWeight: 900,
                            letterSpacing: '-0.04em', textAlign: 'center', mb: 2, color: ALMOND,
                        }}>
                            <PriceHighlight>
                                <HighlightText>499 ₽</HighlightText>
                            </PriceHighlight> в месяц
                        </Typography>
                        <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mb: 2, lineHeight: 1.7 }}>
                            14 дней бесплатно • Без карты • Отменить можно когда угодно
                        </Typography>
                        <Typography sx={{ 
                            textAlign: 'center', color: WARM_YELLOW, mb: 8, fontSize: '1.1rem', fontWeight: 600,
                            animation: `${unevenPulse} 2.2s ease-in-out infinite`,
                        }}>
                            🎁 Цена снижена с 990 ₽ — успейте попробовать!
                        </Typography>
                    </Box>

                    <Grid container spacing={4} justifyContent="center">
                        <Grid item xs={12} md={5}>
                            <CardWithDepth sx={{ 
                                p: 5, height: '100%',
                                opacity: pricingVisible ? 1 : 0,
                                transform: pricingVisible ? 'translateY(0)' : 'translateY(30px)',
                                transition: 'all 0.8s ease-out 0.2s',
                            }}>
                                <Chip icon={<Diamond sx={{ fontSize: 16 }} />} label="ВЫГОДНО" 
                                    sx={{ 
                                        mb: 3, bgcolor: 'rgba(108,59,170,.18)', color: PURPLE_LIGHT,
                                        border: '1px solid rgba(108,59,170,.25)',
                                        animation: `${organicGlow} 3s ease-in-out infinite`,
                                        borderRadius: '10px',
                                    }} />
                                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', mb: 1, color: ALMOND }}>
                                    Pro
                                </Typography>
                                <Typography sx={{ color: ALMOND_DARK, mb: 4 }}>
                                    Для тех, кто учит всерьёз
                                </Typography>
                                <Stack direction="row" alignItems="flex-end" spacing={1} sx={{ mb: 1 }}>
                                    <Typography sx={{ 
                                        fontSize: '3.5rem', fontWeight: 900, letterSpacing: '-0.05em',
                                        lineHeight: 1, color: HOT_PINK,
                                        textShadow: '0 0 25px rgba(255,107,157,.4)',
                                    }}>
                                        499
                                    </Typography>
                                    <Typography sx={{ color: ALMOND_DARK, mb: 1, fontSize: '1.2rem' }}>₽/мес</Typography>
                                </Stack>
                                <Typography sx={{ 
                                    color: ALMOND_DARK, mb: 4, textDecoration: 'line-through',
                                    fontSize: '1.1rem', opacity: 0.7,
                                }}>
                                    990 ₽
                                </Typography>
                                
                                <Stack spacing={2.5} sx={{ mb: 5 }}>
                                    {[
                                        '✨ Все возможности без ограничений',
                                        '🚀 Новые функции по мере выхода',
                                        '💎 Приоритетная поддержка',
                                        '📊 Аналитика по ученикам',
                                        '🤖 ИИ-генерация заданий',
                                        '💰 Автоматические платежи',
                                    ].map((x, i) => (
                                        <Stack key={i} direction="row" spacing={2} alignItems="center">
                                            <CheckCircle sx={{ color: SUCCESS_GREEN, fontSize: 20 }} />
                                            <Typography sx={{ color: ALMOND, fontSize: '0.95rem' }}>{x}</Typography>
                                        </Stack>
                                    ))}
                                </Stack>
                                <CTAGlowButton fullWidth onClick={() => navigate('/register')} endIcon={<RocketLaunch />}>
                                    Попробовать 14 дней
                                </CTAGlowButton>
                                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mt: 2, fontSize: '.85rem' }}>
                                    🔒 Карта не нужна
                                </Typography>
                            </CardWithDepth>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            {/* ========== HOW IT WORKS ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 14 } }}>
                <Typography sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, fontWeight: 900, letterSpacing: '-0.04em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Как начать
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, maxWidth: 550, mx: 'auto', mb: 8 }}>
                    От регистрации до первого урока — пара минут
                </Typography>

                <Grid container spacing={3}>
                    {steps.map((step, i) => (
                        <Grid item xs={12} sm={6} md={3} key={i}>
                            <CardWithDepth sx={{ 
                                p: 4, textAlign: 'center', height: '100%',
                                '&:hover': {
                                    '& .step-icon-wrapper': {
                                        transform: 'scale(1.08) rotate(5deg)',
                                        boxShadow: '0 0 35px rgba(108,59,170,.35)',
                                    },
                                },
                            }}>
                                <Box className="step-icon-wrapper" sx={{ 
                                    width: 75, height: 75, borderRadius: '18px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'linear-gradient(145deg, rgba(108,59,170,.35), rgba(155,111,212,.15))',
                                    color: PURPLE_LIGHT, mx: 'auto', mb: 3,
                                    transition: 'all 0.4s cubic-bezier(0.4, 1.3, 0.7, 1)',
                                }}>
                                    {step.icon}
                                </Box>
                                <Chip label={`Шаг ${i + 1}`} size="small"
                                    sx={{ mb: 2, bgcolor: 'rgba(108,59,170,.15)', color: PURPLE_LIGHT, borderRadius: '8px' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', mb: 1, color: ALMOND }}>
                                    {step.title}
                                </Typography>
                                <Typography sx={{ color: ALMOND_DARK, fontSize: '.9rem', lineHeight: 1.6 }}>
                                    {step.desc}
                                </Typography>
                            </CardWithDepth>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ========== ADVANTAGES ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 14 } }}>
                <Typography sx={{ fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 900, letterSpacing: '-0.04em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Почему EdSpace
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, maxWidth: 600, mx: 'auto', lineHeight: 1.7, mb: 8 }}>
                    Мы убираем рутину, чтобы вы занимались главным — учениками.
                </Typography>

                <Grid container spacing={4}>
                    {advantages.map((item, i) => (
                        <Grid item xs={12} md={4} key={i}>
                            <CardWithDepth sx={{ 
                                p: 4, height: '100%',
                                '&:hover': {
                                    '& .adv-icon': {
                                        transform: 'rotate(15deg) scale(1.05)',
                                        background: `linear-gradient(135deg, ${HOT_PINK}, ${PURPLE_LIGHT})`,
                                        color: CREAM,
                                    },
                                },
                            }}>
                                <Box className="adv-icon" sx={{ 
                                    width: 60, height: 60, borderRadius: '16px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    background: 'rgba(108,59,170,.18)', color: PURPLE_LIGHT, mb: 3,
                                    transition: 'all 0.5s cubic-bezier(0.4, 1.3, 0.7, 1)',
                                }}>
                                    {item.icon}
                                </Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.3rem', mb: 2, color: ALMOND }}>
                                    {item.title}
                                </Typography>
                                <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.7, fontSize: '0.95rem' }}>
                                    {item.desc}
                                </Typography>
                            </CardWithDepth>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ========== TESTIMONIALS ========== */}
            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 14 } }}>
                <Typography sx={{ fontSize: { xs: '2rem', md: '2.6rem' }, fontWeight: 900, letterSpacing: '-0.04em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Отзывы
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mb: 8 }}>
                    Настоящие слова настоящих репетиторов
                </Typography>

                <Grid container spacing={4}>
                    {testimonials.map((t, i) => (
                        <Grid item xs={12} md={4} key={i}>
                            <CardWithDepth sx={{ 
                                p: 4, height: '100%',
                                '&:hover': {
                                    '& .stars': {
                                        color: WARM_YELLOW,
                                    },
                                },
                            }}>
                                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                                    <Avatar sx={{ 
                                        bgcolor: t.color,
                                        fontWeight: 700,
                                        boxShadow: `0 0 18px ${t.color}55`,
                                        width: 48, height: 48,
                                        fontSize: '1.2rem',
                                    }}>
                                        {t.avatar}
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{ fontWeight: 700, color: ALMOND }}>{t.name}</Typography>
                                        <Typography sx={{ color: ALMOND_DARK, fontSize: '.8rem' }}>{t.role}</Typography>
                                    </Box>
                                </Stack>
                                <Box className="stars" sx={{ color: GOLD, mb: 2, transition: 'color 0.4s ease', letterSpacing: '2px' }}>
                                    ★★★★★
                                </Box>
                                <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.7, fontStyle: 'italic', fontSize: '0.95rem' }}>
                                    «{t.text}»
                                </Typography>
                            </CardWithDepth>
                        </Grid>
                    ))}
                </Grid>
            </Container>

            {/* ========== FAQ ========== */}
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 14 } }}>
                <Typography sx={{ fontSize: { xs: '2rem', md: '2.8rem' }, fontWeight: 900, letterSpacing: '-0.04em', textAlign: 'center', mb: 2, color: ALMOND }}>
                    Вопросы и ответы
                </Typography>
                <Typography sx={{ textAlign: 'center', color: ALMOND_DARK, mb: 6 }}>
                    Честно, без маркетинга
                </Typography>

                {faqItems.map((item, i) => (
                    <AccordionStyled key={i} expanded={faqExpanded === i} onChange={() => setFaqExpanded(faqExpanded === i ? false : i)}>
                        <AccordionSummary expandIcon={<ExpandMore sx={{ color: PURPLE_LIGHT }} />}>
                            <Typography sx={{ fontWeight: 600, color: ALMOND, fontSize: '1.05rem' }}>
                                {item.question}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.8 }}>
                                {item.answer}
                            </Typography>
                        </AccordionDetails>
                    </AccordionStyled>
                ))}

                <Box sx={{ 
                    textAlign: 'center', mt: 6, p: 4, borderRadius: 4,
                    background: 'rgba(245,230,211,.02)', border: '1px solid rgba(245,230,211,.05)',
                }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '1.2rem', mb: 2, color: ALMOND }}>
                        Остались вопросы?
                    </Typography>
                    <Typography sx={{ color: ALMOND_DARK, mb: 3 }}>
                        Напишите — ответим в течение часа. Даже в выходные.
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <AccentButton startIcon={<Telegram />} onClick={() => window.open('https://t.me/edspace', '_blank')}>
                            Telegram
                        </AccentButton>
                        <OutlineButton startIcon={<Email />}>
                            Написать
                        </OutlineButton>
                    </Stack>
                </Box>
            </Container>

            {/* ========== FINAL CTA ========== */}
            <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, pb: { xs: 8, md: 14 } }}>
                <CardWithDepth sx={{ 
                    p: { xs: 5, md: 8 }, textAlign: 'center',
                    border: '1px solid rgba(108,59,170,.25)',
                    animation: `${organicGlow} 3.5s ease-in-out infinite`,
                }}>
                    <Typography sx={{ fontSize: { xs: '1.8rem', md: '2.6rem' }, fontWeight: 900, letterSpacing: '-0.04em', mb: 3, color: ALMOND }}>
                        Давайте начнём?
                    </Typography>
                    <Typography sx={{ color: ALMOND_DARK, lineHeight: 1.7, maxWidth: 560, mx: 'auto', mb: 2 }}>
                        Пара минут на регистрацию — и у вас под рукой расписание, видео, домашки и платежи. Без путаницы.
                    </Typography>
                    <Typography sx={{ 
                        color: WARM_YELLOW, fontSize: '1.2rem', fontWeight: 700, mb: 5,
                        animation: `${unevenPulse} 2.2s ease-in-out infinite`,
                    }}>
                        Всего 499 ₽ в месяц
                    </Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                        <CTAGlowButton onClick={() => navigate('/register')} endIcon={<RocketLaunch />}>
                            Попробовать бесплатно
                        </CTAGlowButton>
                        <AccentButton startIcon={<Telegram />} onClick={() => window.open('https://t.me/edspace', '_blank')}>
                            Telegram
                        </AccentButton>
                    </Stack>
                </CardWithDepth>
            </Container>

            {/* DEMO DIALOG */}
            <Dialog open={demoOpen} onClose={() => setDemoOpen(false)} maxWidth="md" fullWidth
                PaperProps={{ 
                    sx: { 
                        bgcolor: DEEP_PURPLE, borderRadius: 4,
                        border: '1px solid rgba(245,230,211,.1)',
                        boxShadow: '0 0 50px rgba(108,59,170,.25)',
                    }
                }}>
                <DialogContent sx={{ p: 4, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.6rem', fontWeight: 700, mb: 3, color: ALMOND }}>
                        🎥 Демо-ролик
                    </Typography>
                    <Box sx={{ 
                        bgcolor: '#000', borderRadius: 3, height: 320,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        mb: 3, border: '1px solid rgba(245,230,211,.08)',
                    }}>
                        <PlayArrow sx={{ fontSize: 70, color: PURPLE_LIGHT, opacity: 0.5 }} />
                    </Box>
                    <Typography sx={{ color: ALMOND_DARK, fontSize: '0.95rem' }}>
                        Видео скоро появится. А пока —{' '}
                        <Box component="span" onClick={() => { setDemoOpen(false); navigate('/register'); }}
                            sx={{ color: HOT_PINK, cursor: 'pointer', fontWeight: 600, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            попробуйте сами!
                        </Box>
                    </Typography>
                </DialogContent>
            </Dialog>
        </Box>
    );
};

export default LandingPage;