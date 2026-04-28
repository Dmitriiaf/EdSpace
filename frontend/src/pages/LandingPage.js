import React, { useState } from 'react';
import {
    Box, Button, Typography, Container, Grid, Card, CardContent,
    AppBar, Toolbar, IconButton, Drawer, List, ListItem, ListItemText,
    useMediaQuery, useTheme, Chip, Stack, Accordion, AccordionSummary,
    AccordionDetails, TextField, Snackbar, Alert
} from '@mui/material';
import {
    CalendarMonth as CalendarIcon,
    AttachMoney as MoneyIcon,
    Videocam as VideoIcon,
    Draw as BoardIcon,
    Menu as MenuIcon,
    CheckCircle as CheckIcon,
    ArrowForward as ArrowIcon,
    Star as StarIcon,
    Telegram as TelegramIcon,
    Email as EmailIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const COLORS = {
    murrey: '#8B004A',
    alabaster: '#F2EFE7',
};

const LandingPage = () => {
    const navigate = useNavigate();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const [mobileMenu, setMobileMenu] = useState(false);
    const [email, setEmail] = useState('');
    const [snackbar, setSnackbar] = useState(false);

    const handleSubscribe = () => {
        if (email) {
            setSnackbar(true);
            setEmail('');
        }
    };

    const features = [
        { icon: <CalendarIcon sx={{ fontSize: 48, color: COLORS.murrey }} />, title: 'Умное расписание', desc: 'Автоматическое составление расписания, переносы, отмена занятий. Всё в одном месте.' },
        { icon: <MoneyIcon sx={{ fontSize: 48, color: COLORS.murrey }} />, title: 'Финансы под контролем', desc: 'Учёт оплат, абонементы, загрузка чеков, статистика доходов. Репетитор видит всё.' },
        { icon: <VideoIcon sx={{ fontSize: 48, color: COLORS.murrey }} />, title: 'Видеозвонки', desc: 'Встроенные видеозвонки на базе Jitsi Meet. Не нужно ставить Zoom или Skype.' },
        { icon: <BoardIcon sx={{ fontSize: 48, color: COLORS.murrey }} />, title: 'Онлайн-доска', desc: 'Рисуйте, пишите формулы, объясняйте материал на интерактивной доске Excalidraw.' },
    ];

    const steps = [
        { step: '1', title: 'Регистрируетесь', desc: 'За 2 минуты создаёте аккаунт репетитора' },
        { step: '2', title: 'Добавляете учеников', desc: 'Указываете ставку, предмет, тип оплаты' },
        { step: '3', title: 'Работаете', desc: 'Расписание, видео, доска, платежи — всё в одном окне' },
    ];

    const pricingCards = [
        { title: 'Бесплатный период', price: '0 ₽', period: '14 дней', features: ['Полный функционал', 'До 5 учеников', 'Без ограничений'], highlighted: false },
        { title: 'Стандарт', price: '500 ₽', period: 'в месяц', features: ['Всё включено', 'Безлимитные ученики', 'Приоритетная поддержка', 'Выгрузка чеков для налогов'], highlighted: true },
    ];

    return (
        <Box sx={{ bgcolor: COLORS.alabaster, minHeight: '100vh' }}>
            {/* Хедер */}
            <AppBar position="sticky" sx={{ bgcolor: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <Toolbar sx={{ justifyContent: 'space-between', maxWidth: 1200, mx: 'auto', width: '100%' }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: COLORS.murrey, letterSpacing: -0.5 }}>
                        EdSpace
                    </Typography>
                    {!isMobile && (
                        <Stack direction="row" spacing={3} alignItems="center">
                            <Typography variant="body2" sx={{ color: '#666', cursor: 'pointer', '&:hover': { color: COLORS.murrey } }}>Возможности</Typography>
                            <Typography variant="body2" sx={{ color: '#666', cursor: 'pointer', '&:hover': { color: COLORS.murrey } }}>Цены</Typography>
                            <Typography variant="body2" sx={{ color: '#666', cursor: 'pointer', '&:hover': { color: COLORS.murrey } }}>FAQ</Typography>
                            <Button variant="outlined" size="small" onClick={() => navigate('/login')} sx={{ borderColor: COLORS.murrey, color: COLORS.murrey, borderRadius: 2, textTransform: 'none' }}>Войти</Button>
                            <Button variant="contained" size="small" onClick={() => navigate('/register')} sx={{ bgcolor: COLORS.murrey, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#6B0038' } }}>Начать бесплатно</Button>
                        </Stack>
                    )}
                    {isMobile && (
                        <IconButton onClick={() => setMobileMenu(true)}><MenuIcon /></IconButton>
                    )}
                </Toolbar>
            </AppBar>

            {/* Мобильное меню */}
            <Drawer anchor="right" open={mobileMenu} onClose={() => setMobileMenu(false)}>
                <Box sx={{ width: 250, p: 2 }}>
                    <IconButton onClick={() => setMobileMenu(false)} sx={{ mb: 2 }}><CloseIcon /></IconButton>
                    <List>
                        <ListItem button onClick={() => navigate('/login')}><ListItemText primary="Войти" /></ListItem>
                        <ListItem button onClick={() => navigate('/register')}><ListItemText primary="Регистрация" sx={{ color: COLORS.murrey, fontWeight: 600 }} /></ListItem>
                    </List>
                </Box>
            </Drawer>

            {/* Hero */}
            <Container maxWidth="lg" sx={{ py: { xs: 8, md: 14 }, textAlign: 'center' }}>
                <Chip label="🚀 Бета-тест открыт" color="error" size="small" sx={{ mb: 3, px: 2, fontWeight: 600 }} />
                <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '3.5rem' }, lineHeight: 1.2, mb: 2, color: '#1a1a1a' }}>
                    Всё для репетитора<br />в одном окне
                </Typography>
                <Typography variant="h6" sx={{ color: '#666', maxWidth: 600, mx: 'auto', mb: 5, fontWeight: 400, lineHeight: 1.6 }}>
                    Расписание + Финансы + Видеозвонки + Онлайн-доска.<br />
                    Подключите родителей, принимайте оплату и ведите учёт.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    <Button variant="contained" size="large" onClick={() => navigate('/register')} endIcon={<ArrowIcon />}
                        sx={{ bgcolor: COLORS.murrey, borderRadius: 3, px: 5, py: 1.8, fontSize: '1.1rem', textTransform: 'none', '&:hover': { bgcolor: '#6B0038' } }}>
                        Попробовать бесплатно
                    </Button>
                    <Button variant="outlined" size="large" onClick={() => navigate('/login')}
                        sx={{ borderColor: COLORS.murrey, color: COLORS.murrey, borderRadius: 3, px: 5, py: 1.8, fontSize: '1.1rem', textTransform: 'none' }}>
                        Уже есть аккаунт
                    </Button>
                </Stack>
                <Typography variant="body2" sx={{ color: '#999', mt: 2 }}>
                    🔒 Без привязки карты. 14 дней бесплатно, потом 500 ₽/мес.
                </Typography>
            </Container>

            {/* Преимущества */}
            <Box sx={{ bgcolor: 'white', py: { xs: 6, md: 10 } }}>
                <Container maxWidth="lg">
                    <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 2, color: '#1a1a1a' }}>
                        Почему EdSpace?
                    </Typography>
                    <Typography variant="body1" sx={{ textAlign: 'center', color: '#666', mb: 6, maxWidth: 500, mx: 'auto' }}>
                        Всё, что нужно репетитору, уже внутри. Не нужно собирать сервисы по кусочкам.
                    </Typography>
                    <Grid container spacing={4}>
                        {features.map((f, i) => (
                            <Grid item xs={12} sm={6} md={3} key={i}>
                                <Card sx={{ textAlign: 'center', p: 3, borderRadius: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', height: '100%', '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.1)', transform: 'translateY(-4px)', transition: 'all 0.3s' } }}>
                                    <Box sx={{ mb: 2 }}>{f.icon}</Box>
                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>{f.title}</Typography>
                                    <Typography variant="body2" color="textSecondary">{f.desc}</Typography>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Как это работает */}
            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
                <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 2, color: '#1a1a1a' }}>
                    Как начать?
                </Typography>
                <Typography variant="body1" sx={{ textAlign: 'center', color: '#666', mb: 6 }}>
                    Три простых шага — и вы готовы к работе
                </Typography>
                <Stack spacing={4}>
                    {steps.map((s, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 3 }}>
                            <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: COLORS.murrey, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, flexShrink: 0 }}>
                                {s.step}
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>{s.title}</Typography>
                                <Typography variant="body2" color="textSecondary">{s.desc}</Typography>
                            </Box>
                        </Box>
                    ))}
                </Stack>
            </Container>

            {/* Цены */}
            <Box sx={{ bgcolor: 'white', py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 2, color: '#1a1a1a' }}>
                        Сколько стоит?
                    </Typography>
                    <Typography variant="body1" sx={{ textAlign: 'center', color: '#666', mb: 6 }}>
                        Один тариф — всё включено. Никаких скрытых платежей.
                    </Typography>
                    <Grid container spacing={3} justifyContent="center">
                        {pricingCards.map((card, i) => (
                            <Grid item xs={12} sm={6} key={i}>
                                <Card sx={{ p: 4, borderRadius: 4, textAlign: 'center', border: card.highlighted ? `2px solid ${COLORS.murrey}` : '1px solid #e0e0e0', position: 'relative', height: '100%' }}>
                                    {card.highlighted && <Chip label="Популярный" size="small" sx={{ position: 'absolute', top: 12, right: 12, bgcolor: COLORS.murrey, color: 'white' }} />}
                                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>{card.title}</Typography>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: COLORS.murrey, mb: 0.5 }}>{card.price}</Typography>
                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>{card.period}</Typography>
                                    <Stack spacing={1}>
                                        {card.features.map((f, j) => (
                                            <Box key={j} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center' }}>
                                                <CheckIcon sx={{ color: '#4CAF50', fontSize: 18 }} />
                                                <Typography variant="body2">{f}</Typography>
                                            </Box>
                                        ))}
                                    </Stack>
                                    {card.highlighted && (
                                        <Button variant="contained" fullWidth onClick={() => navigate('/register')} sx={{ mt: 4, bgcolor: COLORS.murrey, borderRadius: 3, py: 1.5, textTransform: 'none', '&:hover': { bgcolor: '#6B0038' } }}>
                                            Начать бесплатно
                                        </Button>
                                    )}
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </Container>
            </Box>

            {/* Социальное доказательство */}
            <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 48, color: '#FFD700', mb: 2 }} />
                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1, color: '#1a1a1a' }}>
                    Присоединяйтесь к бета-тесту
                </Typography>
                <Typography variant="body1" sx={{ color: '#666', mb: 4, maxWidth: 500, mx: 'auto' }}>
                    Мы ищем первых репетиторов, готовых протестировать платформу и повлиять на её развитие. Ваши идеи станут приоритетными фичами.
                </Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
                    <TextField size="small" placeholder="Ваш email" value={email} onChange={(e) => setEmail(e.target.value)}
                        sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: 3 } }} />
                    <Button variant="contained" onClick={handleSubscribe}
                        sx={{ bgcolor: COLORS.murrey, borderRadius: 3, px: 4, py: 1.2, textTransform: 'none', '&:hover': { bgcolor: '#6B0038' } }}>
                        Получить приглашение
                    </Button>
                </Stack>
            </Container>

            {/* FAQ */}
            <Box sx={{ bgcolor: 'white', py: { xs: 6, md: 10 } }}>
                <Container maxWidth="md">
                    <Typography variant="h3" sx={{ fontWeight: 700, textAlign: 'center', mb: 6, color: '#1a1a1a' }}>
                        Часто задаваемые вопросы
                    </Typography>
                    {[
                        { q: 'Как проходит бета-тест?', a: 'Вы регистрируетесь, получаете полный доступ на 14 дней бесплатно. Мы собираем обратную связь и дорабатываем платформу.' },
                        { q: 'Можно ли подключить родителей?', a: 'Да! Родители видят расписание, оплачивают занятия и загружают чеки. У каждого родителя свой личный кабинет.' },
                        { q: 'Нужно ли устанавливать Zoom?', a: 'Нет. Видеозвонки работают прямо в браузере через Jitsi Meet. Ничего устанавливать не нужно.' },
                        { q: 'Как учитывать налоги?', a: 'Все чеки сохраняются в системе. Вы можете скачать их за любой период и предоставить в налоговую.' },
                    ].map((faq, i) => (
                        <Accordion key={i} sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' }, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <AccordionSummary expandIcon={<ArrowIcon />}>
                                <Typography sx={{ fontWeight: 500 }}>{faq.q}</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography color="textSecondary">{faq.a}</Typography>
                            </AccordionDetails>
                        </Accordion>
                    ))}
                </Container>
            </Box>

            {/* Футер */}
            <Box sx={{ bgcolor: '#1a1a1a', color: 'white', py: 4 }}>
                <Container maxWidth="lg">
                    <Grid container spacing={4} alignItems="center">
                        <Grid item xs={12} md={6}>
                            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>EdSpace</Typography>
                            <Typography variant="body2" sx={{ color: '#aaa' }}>
                                Универсальная платформа для репетиторов. Расписание, финансы, видео — всё в одном окне.
                            </Typography>
                        </Grid>
                        <Grid item xs={12} md={6} sx={{ textAlign: { md: 'right' } }}>
                            <Stack direction="row" spacing={2} justifyContent={{ md: 'flex-end' }}>
                                <IconButton sx={{ color: '#aaa' }}><TelegramIcon /></IconButton>
                                <IconButton sx={{ color: '#aaa' }}><EmailIcon /></IconButton>
                            </Stack>
                            <Typography variant="caption" sx={{ color: '#666', display: 'block', mt: 1 }}>
                                © 2026 EdSpace. Все права защищены.
                            </Typography>
                        </Grid>
                    </Grid>
                </Container>
            </Box>

            <Snackbar open={snackbar} autoHideDuration={4000} onClose={() => setSnackbar(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity="success" sx={{ borderRadius: 3 }}>✅ Спасибо! Мы свяжемся с вами.</Alert>
            </Snackbar>
        </Box>
    );
};

export default LandingPage;