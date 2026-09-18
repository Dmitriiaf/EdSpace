import React, { useState } from 'react';
import {
    Box, Button, Typography, Container, Grid, AppBar, Toolbar,
    IconButton, Drawer, List, ListItem, ListItemText,
    useMediaQuery, useTheme, Stack, Chip, TextField, Dialog,
    DialogContent, DialogTitle, Select, MenuItem, FormControl,
    InputLabel, Snackbar, Alert, Avatar, Paper, Divider
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    Menu as MenuIcon, School, Computer, Phone, Telegram,
    Send, RocketLaunch, ArrowForward, Star, EmojiEvents,
    Timeline, Code, CalendarMonth, Close, ChevronLeft, ChevronRight,
    TrackChanges, CheckCircle, PlayCircle
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// ========== КОНФИГУРАЦИЯ ТЕМЫ И ЦВЕТОВ ==========
const PRIMARY = '#6366F1';
const PRIMARY_DARK = '#4338ca';
const PRIMARY_LIGHT = '#A5B4FC';
const ACCENT = '#F59E0B';
const BG = '#FAFAFA';
const BG_LIGHT = '#F4F4F5';
const TEXT = '#18181B';
const TEXT_DIM = '#52525B';
const GREEN = '#10B981';

const gradientShift = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

const floatAnimation = keyframes`
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
`;

const GradientButton = styled(Button)({
    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
    backgroundSize: '200% 200%',
    animation: `${gradientShift} 4s ease infinite`,
    color: '#FFFFFF',
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    padding: '12px 28px',
    borderRadius: 12,
    boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 8px 25px rgba(99,102,241,0.4)',
    },
});

const GlassCard = styled(Paper)({
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
        borderColor: PRIMARY,
    },
});

const GradientText = styled('span')({
    background: `linear-gradient(135deg, ${PRIMARY}, ${ACCENT})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    fontWeight: 900,
});

const Blob = styled(Box)({
    position: 'absolute',
    borderRadius: '50%',
    filter: 'blur(80px)',
    opacity: 0.4,
    zIndex: -1,
    animation: `${floatAnimation} 10s infinite ease-in-out`,
});

// ========== ДАННЫЕ ==========
const REVIEWS = [
    { id: 1, image: '/reviews/1.jpg', alt: 'Отзыв 1' },
    { id: 2, image: '/reviews/2.jpg', alt: 'Отзыв 2' },
    { id: 3, image: '/reviews/3.jpg', alt: 'Отзыв 3' },
    { id: 4, image: '/reviews/4.jpg', alt: 'Отзыв 4' },
    { id: 5, image: '/reviews/5.jpg', alt: 'Отзыв 5' },
    { id: 6, image: '/reviews/6.jpg', alt: 'Отзыв 6' },
    { id: 7, image: '/reviews/7.jpg', alt: 'Отзыв 7' },
    { id: 8, image: '/reviews/8.jpg', alt: 'Отзыв 8' },
    { id: 9, image: '/reviews/9.jpg', alt: 'Отзыв 9' },
    { id: 10, image: '/reviews/10.jpg', alt: 'Отзыв 10' },
    { id: 11, image: '/reviews/11.jpg', alt: 'Отзыв 11' },
];

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    
    const [mobileMenu, setMobileMenu] = useState(false);
    const [studentDialog, setStudentDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [selectedReview, setSelectedReview] = useState(null);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [showReviews, setShowReviews] = useState(false);


    const [studentForm, setStudentForm] = useState({
        name: '', phone: '', className: '', goal: 'Подготовка к ЕГЭ'
    });

    const handleStudentSubmit = async () => {
        if (!studentForm.name || !studentForm.phone) {
            setSnackbar({ open: true, message: 'Пожалуйста, заполните имя и телефон', severity: 'warning' });
            return;
        }
        try {
            await axios.post('/api/leads/student', {
                ...studentForm,
                subject: 'Информатика',
                tariff: 'Индивидуально'
            });
            setStudentDialog(false);
            setSnackbar({ open: true, message: 'Заявка успешно отправлена!', severity: 'success' });
            setStudentForm({ name: '', phone: '', className: '', goal: 'Подготовка к ЕГЭ' });
        } catch (error) {
            setSnackbar({ open: true, message: 'Ошибка отправки. Позвоните: +79504321806', severity: 'error' });
        }
    };

    const examResults = [
        { year: '2022', score: 86 },
        { year: '2023', score: 82 },
        { year: '2024', score: 84 },
        { year: '2025', score: 82 },
        { year: '2026', score: 85 },
    ];

    const helpAreas = [
        { icon: '🎯', title: 'ЕГЭ / ОГЭ', desc: 'Уверенная сдача экзаменов' },
        { icon: '📚', title: 'Школьная программа', desc: 'Помощь с домашкой' },
        { icon: '💻', title: 'Python', desc: 'От основ до проектов' },
        { icon: '📈', title: 'Успеваемость', desc: 'Исправление оценок' },
    ];

    const nextReview = () => setReviewIndex((prev) => (prev + 1) % REVIEWS.length);
    const prevReview = () => setReviewIndex((prev) => (prev - 1 + REVIEWS.length) % REVIEWS.length);

    return (
        <Box sx={{ bgcolor: BG, color: TEXT, minHeight: '100vh', overflowX: 'hidden', position: 'relative', fontFamily: '"Inter", "Roboto", sans-serif' }}>
            
            {/* ФОНОВЫЕ ЭФФЕКТЫ */}
            <Blob sx={{ top: -100, left: -100, width: 400, height: 400, bgcolor: PRIMARY_LIGHT }} />
            <Blob sx={{ bottom: 0, right: -100, width: 500, height: 500, bgcolor: '#A5B4FC', animationDelay: '2s' }} />

            {/* HEADER */}
            <AppBar position="sticky" elevation={0} sx={{ 
                bgcolor: 'rgba(255,255,255,0.8)', 
                backdropFilter: 'blur(12px)', 
                borderBottom: '1px solid rgba(0,0,0,0.05)' 
            }}>
                <Container maxWidth="lg">
                    <Toolbar disableGutters sx={{ justifyContent: 'space-between', py: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={1.5} onClick={() => window.scrollTo(0,0)} sx={{ cursor: 'pointer' }}>
                            <Box sx={{ 
                                width: 40, height: 40, borderRadius: '12px', 
                                background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`, 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 10px rgba(99,102,241,0.3)'
                            }}>
                                <School sx={{ color: '#fff', fontSize: 20 }} />
                            </Box>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px', color: TEXT }}>
                                <span style={{ color: PRIMARY }}>Дмитрий</span>{' '}
                                <span style={{ color: ACCENT }}>Атрощенко</span>
                            </Typography>
                        </Stack>

                        {!isMobile ? (
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Button onClick={() => navigate('/login')} sx={{ color: TEXT_DIM, fontWeight: 600, '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' } }}>
                                    Личный кабинет
                                </Button>
                                <GradientButton onClick={() => setStudentDialog(true)} size="small">
                                    Записаться
                                </GradientButton>
                            </Stack>
                        ) : (
                            <IconButton onClick={() => setMobileMenu(true)} sx={{ color: TEXT }}>
                                <MenuIcon />
                            </IconButton>
                        )}
                    </Toolbar>
                </Container>
            </AppBar>

            {/* MOBILE MENU DRAWER */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)}>
                <Box sx={{ p: 3, width: 280, height: '100%', bgcolor: '#fff' }}>
                    <Stack spacing={3} mt={2}>
                        <Typography variant="h6" fontWeight={800}>Меню</Typography>
                        <List>
                            <ListItem button onClick={() => { navigate('/login'); setMobileMenu(false); }}>
                                <ListItemText primary="Войти в кабинет" />
                            </ListItem>
                            <ListItem button onClick={() => { setStudentDialog(true); setMobileMenu(false); }}>
                                <ListItemText primary={<span style={{ color: PRIMARY, fontWeight: 700 }}>Записаться на урок</span>} />
                            </ListItem>
                        </List>
                        <Divider />
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Phone sx={{ color: PRIMARY }} />
                            <Typography>+7 950 432-18-06</Typography>
                        </Stack>
                    </Stack>
                </Box>
            </Drawer>

            {/* HERO SECTION */}
            <Container maxWidth="lg" sx={{ pt: { xs: 6, md: 10 }, pb: { xs: 8, md: 12 }, position: 'relative' }}>
                <Grid container spacing={6} alignItems="center">
                    <Grid item xs={12} md={7}>
                        <Chip 
                            icon={<Computer sx={{ fontSize: 16 }} />} 
                            label="Репетитор по информатике" 
                            sx={{ 
                                bgcolor: 'rgba(99,102,241,0.1)', 
                                color: PRIMARY, 
                                mb: 2, 
                                fontWeight: 600, 
                                py: 0.5,
                                px: 1,
                                borderRadius: 2
                            }} 
                        />
                        <Typography sx={{ 
                            fontSize: { xs: '2.5rem', md: '3.5rem' }, 
                            fontWeight: 900, 
                            letterSpacing: '-0.04em', 
                            lineHeight: 1.1, 
                            mb: 3 
                        }}>
                            Подготовлю к ЕГЭ на <br/>
                            <GradientText>85+ баллов</GradientText>
                        </Typography>
                        <Typography sx={{ fontSize: '1.1rem', color: TEXT_DIM, lineHeight: 1.7, mb: 4, maxWidth: 500 }}>
                            Индивидуальные занятия по информатике и программированию на Python. 
                            Объясняю сложное простым языком без зубрежки.
                        </Typography>
                        
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <GradientButton onClick={() => setStudentDialog(true)} endIcon={<RocketLaunch />}>
                                Бесплатный пробный урок
                            </GradientButton>
                            <Button 
                                variant="outlined" 
                                startIcon={<Telegram />} 
                                onClick={() => window.open('https://t.me/+79504321806', '_blank')}
                                sx={{ 
                                    color: TEXT, 
                                    borderColor: '#E4E4E7', 
                                    textTransform: 'none', 
                                    borderRadius: 3, 
                                    padding: '12px 24px', 
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    '&:hover': { borderColor: PRIMARY, bgcolor: 'rgba(99,102,241,0.05)' }
                                }}>
                                Написать в Telegram
                            </Button>
                        </Stack>
                        
                        <Stack direction="row" spacing={4} mt={5} divider={<Box sx={{ width: 1, height: 30, bgcolor: '#E4E4E7' }} />}>
                            <Box>
                                <Typography variant="h4" fontWeight={800} color={TEXT}>60+</Typography>
                                <Typography variant="body2" color={TEXT_DIM}>Учеников</Typography>
                            </Box>
                            <Box>
                                <Typography variant="h4" fontWeight={800} color={TEXT}>5 лет</Typography>
                                <Typography variant="body2" color={TEXT_DIM}>Опыта</Typography>
                            </Box>
                        </Stack>
                    </Grid>

                    <Grid item xs={12} md={5} sx={{ position: 'relative' }}>
                        <Box sx={{ 
                            position: 'absolute', top: -20, right: -20, width: '100%', height: '100%', 
                            bgcolor: PRIMARY, borderRadius: 40, opacity: 0.1, zIndex: 0, transform: 'rotate(3deg)' 
                        }} />
                        
                        <GlassCard sx={{ p: 4, textAlign: 'center', position: 'relative', zIndex: 1 }}>
                            <Avatar 
                                sx={{ 
                                    width: 120, height: 120, 
                                    bgcolor: PRIMARY, color: '#fff', 
                                    fontSize: 40, mx: 'auto', mb: 2,
                                    border: '4px solid #fff',
                                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                                }}
                            >
                                Д
                            </Avatar>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', mb: 0.5 }}>Дмитрий Атрощенко</Typography>
                            <Typography sx={{ color: TEXT_DIM, fontSize: '0.95rem', mb: 3 }}>Репетитор по информатике</Typography>

                            <Box sx={{ bgcolor: BG_LIGHT, borderRadius: 2, p: 2, mb: 3, textAlign: 'left' }}>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                    <CheckCircle sx={{ color: GREEN, fontSize: 18 }} />
                                    <Typography variant="body2" fontWeight={600}>5 лет опыта</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                                    <CheckCircle sx={{ color: GREEN, fontSize: 18 }} />
                                    <Typography variant="body2" fontWeight={600}>Средний балл учеников — 84+</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1} alignItems="center">
                                    <CheckCircle sx={{ color: GREEN, fontSize: 18 }} />
                                    <Typography variant="body2" fontWeight={600}>Индивидуальная программа</Typography>
                                </Stack>
                            </Box>

                            <GradientButton fullWidth onClick={() => setStudentDialog(true)}>
                                Связаться со мной
                            </GradientButton>
                        </GlassCard>
                    </Grid>
                </Grid>
            </Container>

            {/* ОБО МНЕ & ОБРАЗОВАНИЕ */}
            <Box sx={{ py: 8, bgcolor: '#fff' }}>
                <Container maxWidth="lg">
                    <Stack alignItems="center" mb={6}>
                        <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 900, textAlign: 'center', mb: 2 }}>
                            Мой подход и опыт
                        </Typography>
                        <Typography sx={{ color: TEXT_DIM, maxWidth: 600, textAlign: 'center' }}>
                            Не просто натаскиваю на тесты, а учу понимать логику программирования и алгоритмов.
                        </Typography>
                    </Stack>

                    <Grid container spacing={3}>
                        {[
                            { icon: <School />, title: 'Образование', text: 'СФУ: Информационные системы и технологии' },
                            { icon: <EmojiEvents />, title: 'Магистратура', text: 'КГПУ: Цифровая трансформация образования' },
                            { icon: <Timeline />, title: 'Практика', text: '5 лет успешной подготовки к экзаменам' },
                        ].map((item, i) => (
                            <Grid item xs={12} md={4} key={i}>
                                <GlassCard sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                                    <Box sx={{ 
                                        p: 2, borderRadius: '50%', bgcolor: 'rgba(99,102,241,0.1)', color: PRIMARY, mb: 2 
                                    }}>
                                        {React.cloneElement(item.icon, { fontSize: 'large' })}
                                    </Box>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', mb: 1 }}>{item.title}</Typography>
                                    <Typography sx={{ color: TEXT_DIM, lineHeight: 1.6 }}>{item.text}</Typography>
                                </GlassCard>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* ЧЕМУ УЧУ */}
            <Box sx={{ py: 8, bgcolor: BG_LIGHT }}>
                <Container maxWidth="lg">
                    <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 900, textAlign: 'center', mb: 6 }}>
                        Направления подготовки
                    </Typography>
                    <Grid container spacing={2}>
                        {helpAreas.map((item, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <Paper sx={{ 
                                    p: 3, height: '100%', borderRadius: 4, border: '1px solid #eee',
                                    transition: '0.3s', '&:hover': { borderColor: PRIMARY, transform: 'translateY(-5px)' }
                                }}>
                                    <Typography sx={{ fontSize: 32, mb: 2 }}>{item.icon}</Typography>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', mb: 1 }}>{item.title}</Typography>
                                    <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>{item.desc}</Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* РЕЗУЛЬТАТЫ */}
            <Container maxWidth="lg" sx={{ py: 8 }}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 900, textAlign: 'center', mb: 2 }}>
                    Средний балл моих учеников
                </Typography>
                <Typography sx={{ textAlign: 'center', color: TEXT_DIM, mb: 6 }}>Стабильно высокий результат из года в год</Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                    {examResults.map((r, i) => (
                        <Box key={i} sx={{ textAlign: 'center', minWidth: 100 }}>
                            <GlassCard sx={{ p: 2, mb: 1, bgcolor: i === examResults.length - 1 ? 'rgba(99,102,241,0.1)' : '#fff' }}>
                                <Typography sx={{ fontSize: '1.8rem', fontWeight: 900, color: PRIMARY }}>{r.score}</Typography>
                            </GlassCard>
                            <Typography sx={{ fontSize: '0.9rem', color: TEXT_DIM, fontWeight: 600 }}>{r.year}</Typography>
                        </Box>
                    ))}
                </Box>
            </Container>

            {/* ОТЗЫВЫ */}
            <Box sx={{ bgcolor: '#fff', py: 8, borderTop: '1px solid #f0f0f0' }}>
                <Container maxWidth="md">
                    <Typography variant="h2" sx={{ fontSize: { xs: '2rem', md: '2.5rem' }, fontWeight: 900, textAlign: 'center', mb: 4 }}>
                        Отзывы
                    </Typography>
                    {!showReviews ? (
                        <Box sx={{ textAlign: 'center' }}>
                            <GradientButton onClick={() => setShowReviews(true)} endIcon={<ArrowForward />}>
                                Читать отзывы
                            </GradientButton>
                        </Box>
                    ) : (
                        <Box sx={{ position: 'relative' }}>
                            <IconButton onClick={prevReview} sx={{ position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)', bgcolor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 5 }}>
                                <ChevronLeft />
                            </IconButton>
                            <GlassCard onClick={() => setSelectedReview(REVIEWS[reviewIndex])}
                                sx={{ cursor: 'pointer', overflow: 'hidden', maxWidth: 450, mx: 'auto', p: 0 }}>
                                <Box component="img" src={REVIEWS[reviewIndex].image} alt={REVIEWS[reviewIndex].alt}
                                    sx={{ width: '100%', height: 450, objectFit: 'contain', display: 'block', bgcolor: '#fff' }} />
                            </GlassCard>
                            <IconButton onClick={nextReview} sx={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', bgcolor: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', zIndex: 5 }}>
                                <ChevronRight />
                            </IconButton>
                            <Box sx={{ textAlign: 'center', mt: 2 }}>
                                <Typography color={TEXT_DIM} sx={{ fontSize: '0.9rem' }}>{reviewIndex + 1} / {REVIEWS.length}</Typography>
                                <Button onClick={() => setShowReviews(false)} sx={{ color: TEXT_DIM, textTransform: 'none', fontSize: '0.85rem', mt: 0.5 }}>
                                    Скрыть отзывы
                                </Button>
                            </Box>
                        </Box>
                    )}
                </Container>
            </Box>

            {/* CTA FOOTER */}
            <Container maxWidth="sm" sx={{ py: 10 }}>
                <Paper sx={{ 
                    p: { xs: 4, md: 6 }, 
                    borderRadius: 6, 
                    textAlign: 'center',
                    background: `linear-gradient(135deg, ${PRIMARY}, ${PRIMARY_DARK})`,
                    color: '#fff',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <Box sx={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: '50%' }} />
                    
                    <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, position: 'relative' }}>
                        Готовы начать?
                    </Typography>
                    <Typography sx={{ fontSize: '1.1rem', mb: 4, opacity: 0.9, position: 'relative' }}>
                        Запишитесь на первое занятие, чтобы оценить уровень знаний и составить план подготовки.
                    </Typography>
                    
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={() => setStudentDialog(true)}
                        endIcon={<Send />}
                        sx={{ 
                            bgcolor: '#fff', 
                            color: PRIMARY, 
                            fontWeight: 800, 
                            fontSize: '1.1rem',
                            px: 4, py: 1.5,
                            borderRadius: 3,
                            '&:hover': { bgcolor: '#f0f0f0' }
                        }}
                    >
                        Оставить заявку
                    </Button>
                </Paper>
            </Container>

            {/* FOOTER INFO */}
            <Box sx={{ py: 4, textAlign: 'center', borderTop: '1px solid #E4E4E7', bgcolor: '#fff' }}>
                <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>
                    © 2026 Дмитрий Атрощенко. Репетитор по информатике.
                </Typography>
            </Box>

            {/* Просмотр отзыва */}
            <Dialog open={!!selectedReview} onClose={() => setSelectedReview(null)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}>
                <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <IconButton onClick={() => setSelectedReview(null)}
                        sx={{ position: 'fixed', top: 20, right: 20, bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', backdropFilter: 'blur(5px)', '&:hover': { bgcolor: 'rgba(255,255,255,0.4)' } }}>
                        <Close />
                    </IconButton>
                    {selectedReview && (
                        <Box component="img" src={selectedReview.image} alt={selectedReview.alt}
                            sx={{ width: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: 2 }} />
                    )}
                </Box>
            </Dialog>

            {/* Форма записи */}
            <Dialog open={studentDialog} onClose={() => setStudentDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
                <DialogTitle sx={{ fontWeight: 800, fontSize: '1.5rem', textAlign: 'center', pb: 0 }}>
                    Запись на занятие 🚀
                </DialogTitle>
                <DialogContent dividers sx={{ border: 'none', pt: 3 }}>
                    <Stack spacing={2.5}>
                        <TextField 
                            fullWidth 
                            label="Ваше имя" 
                            variant="outlined"
                            value={studentForm.name}
                            onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                        <TextField 
                            fullWidth 
                            label="Телефон" 
                            variant="outlined"
                            value={studentForm.phone}
                            onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        />
                        <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}>
                            <InputLabel>Цель занятий</InputLabel>
                            <Select value={studentForm.goal} label="Цель занятий"
                                onChange={(e) => setStudentForm({ ...studentForm, goal: e.target.value })}>
                                <MenuItem value="Подготовка к ЕГЭ">Подготовка к ЕГЭ (10-11 класс)</MenuItem>
                                <MenuItem value="Подготовка к ОГЭ">Подготовка к ОГЭ (9 класс)</MenuItem>
                                <MenuItem value="Python">Программирование на Python</MenuItem>
                                <MenuItem value="Школьная программа">Повышение успеваемости</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <GradientButton 
                            fullWidth 
                            onClick={handleStudentSubmit} 
                            endIcon={<Send />}
                            sx={{ mt: 1, py: 1.5 }}
                        >
                            Отправить заявку
                        </GradientButton>
                        
                        <Typography variant="caption" align="center" color={TEXT_DIM}>
                            Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                        </Typography>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* SNACKBAR */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} variant="filled" sx={{ width: '100%', borderRadius: 3 }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default LandingPage;