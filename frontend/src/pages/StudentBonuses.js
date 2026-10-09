// frontend/src/pages/StudentBonuses.js
import React, { useState } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, IconButton,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Avatar, Snackbar, Alert, Stack, Divider,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    Send as TelegramIcon,
    Phone as PhoneIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import { useAuth } from '../context/AuthContext';

// ========== КОНТАКТЫ ==========
const CONTACTS = {
    phone: '+7 950 432-18-06',
    phoneLink: 'tel:+79504321806',
    telegram: '@pprprprprr',
    telegramLink: 'https://t.me/pprprprprr',
    landing: 'https://ed-space.ru',
};

// ========== АНИМАЦИИ ==========
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.4s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const PromoCard = styled(Paper)(({ accent, hovered }) => ({
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    border: '1px solid #F3F4F6',
    padding: '24px 24px 20px',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: hovered
        ? `0 12px 28px ${alpha(accent, 0.18)}`
        : '0 2px 8px rgba(0,0,0,0.04)',
    transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: 5,
        background: `linear-gradient(90deg, ${accent} 0%, ${alpha(accent, 0.5)} 100%)`,
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: -40, right: -40,
        width: 160, height: 160,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${alpha(accent, 0.08)} 0%, transparent 70%)`,
        pointerEvents: 'none',
    },
}));

const Badge = styled(Box)(({ color }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: 8,
    backgroundColor: alpha(color, 0.12),
    color: color,
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginBottom: 14,
}));

const BigIcon = styled(Box)(({ color }) => ({
    position: 'absolute',
    top: 20,
    right: 20,
    fontSize: '52px',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.08))',
    transition: 'transform 0.3s ease',
    '&:hover': { transform: 'rotate(10deg) scale(1.1)' },
}));

const CardTitle = styled(Typography)({
    fontSize: '22px',
    fontWeight: 800,
    color: '#141414',
    letterSpacing: '-0.02em',
    lineHeight: 1.2,
    marginBottom: 8,
    maxWidth: 'calc(100% - 70px)',
});

const CardSubtitle = styled(Typography)({
    fontSize: '14px',
    color: '#6B7280',
    lineHeight: 1.5,
    marginBottom: 16,
    maxWidth: 'calc(100% - 20px)',
});

const CardFooterLine = styled(Box)(({ color }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '5px 10px',
    borderRadius: 8,
    backgroundColor: alpha(color, 0.1),
    color: color,
    fontSize: '12px',
    fontWeight: 700,
}));

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
export default function StudentBonuses() {
    const { user } = useAuth();
    const navigate = useNavigate();
    React.useEffect(() => { document.title = 'EdSpace — Бонусы и возможности'; }, []);

    const [hoveredCard, setHoveredCard] = useState(null);
    const [openModal, setOpenModal] = useState(null); // 'referral' | 'tutor' | 'tournament'
    const [toast, setToast] = useState(null);

    const firstName = user?.fullName?.split(' ')[0] || 'друг';

    // ========== РЕФЕРАЛЬНЫЙ ТЕКСТ ==========
    const referralText = `Привет! Занимаюсь у Дмитрия — он репетитор по информатике и математике. Очень нравится, рекомендую. Если будешь записываться — скажи, что от меня (${firstName}), мне за это бонус дадут 🙂
${CONTACTS.landing}`;

    const copyToClipboard = async (text, successMessage = 'Скопировано!') => {
        try {
            await navigator.clipboard.writeText(text);
            setToast({ type: 'success', message: successMessage });
        } catch (err) {
            setToast({ type: 'error', message: 'Не удалось скопировать' });
        }
    };

    // ========== КАРТОЧКИ ==========
    const cards = [
        {
            key: 'referral',
            emoji: '🎁',
            badge: '🤝 ПРИГЛАСИ ДРУГА',
            badgeColor: '#7C3AED',
            accent: '#7C3AED',
            title: 'Получи 5000 ₽',
            subtitle: 'За каждого друга, который начнёт заниматься и назовёт тебя при первом обращении',
            footer: '💰 Бонус на оплату занятий',
            footerColor: '#10B981',
        },
        {
            key: 'tutor',
            emoji: '🎯',
            badge: '🎓 ЛЮБОЙ ПРЕДМЕТ',
            badgeColor: '#EF4444',
            accent: '#EF4444',
            title: 'Найдём репетитора',
            subtitle: 'Физика, химия, английский, русский — подберём проверенного преподавателя под твои цели',
            footer: '✓ Проверенные коллеги',
            footerColor: '#EF4444',
        },
        {
            key: 'tournament',
            emoji: '👑',
            badge: '🏆 ТУРНИРЫ И ДУЭЛИ',
            badgeColor: '#3B82F6',
            accent: '#3B82F6',
            title: 'Соревнуйся и расти',
            subtitle: 'Марафон на месяц: 4 пробника, побеждает тот, кто больше вырос относительно себя',
            footer: '🎁 Призы: бонусы и скидки',
            footerColor: '#3B82F6',
        },
    ];

    return (
        <PageContainer sx={{
            px: { xs: 2, sm: 3 },
            bgcolor: '#FAFAFA',
            minHeight: '100vh',
        }}>

            {/* ЗАГОЛОВОК СТРАНИЦЫ */}
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                mb: 3.5, flexWrap: 'wrap',
            }}>
                <Typography sx={{
                    fontSize: { xs: '24px', sm: '28px' },
                    fontWeight: 800,
                    color: '#141414',
                    letterSpacing: '-0.02em',
                }}>
                    🔥 Бонусы и возможности
                </Typography>
                <Chip
                    label={cards.length}
                    size="small"
                    sx={{
                        bgcolor: '#EEF2FF',
                        color: '#4F46E5',
                        fontWeight: 800,
                        fontSize: '13px',
                        height: 26,
                        borderRadius: 100,
                        minWidth: 34,
                    }}
                />
            </Box>

            {/* СЕТКА КАРТОЧЕК */}
            <Grid container spacing={2.5}>
                {cards.map((card, i) => (
                    <Grid item xs={12} md={4} key={card.key}>
                        <Reveal delay={i * 0.08}>
                            <PromoCard
                                accent={card.accent}
                                hovered={hoveredCard === card.key}
                                onMouseEnter={() => setHoveredCard(card.key)}
                                onMouseLeave={() => setHoveredCard(null)}
                                onClick={() => setOpenModal(card.key)}
                                elevation={0}
                            >
                                <BigIcon color={card.accent}>{card.emoji}</BigIcon>

                                <Badge color={card.badgeColor}>{card.badge}</Badge>

                                <CardTitle>{card.title}</CardTitle>

                                <CardSubtitle>{card.subtitle}</CardSubtitle>

                                <CardFooterLine color={card.footerColor}>
                                    {card.footer}
                                </CardFooterLine>
                            </PromoCard>
                        </Reveal>
                    </Grid>
                ))}
            </Grid>

            {/* ========== МОДАЛКА: ПРИГЛАСИ ДРУГА ========== */}
            <StyledDialog
                open={openModal === 'referral'}
                onClose={() => setOpenModal(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 20, overflow: 'hidden' } }}
            >
                <Box sx={{
                    px: 3, pt: 3, pb: 2,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44, fontSize: '1.5rem' }}>
                        🎁
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.08em' }}>
                            🤝 ПРИГЛАСИ ДРУГА
                        </Typography>
                        <Typography sx={{ fontSize: '19px', color: '#FFF', fontWeight: 800, letterSpacing: '-0.01em' }}>
                            Получи 5000 ₽
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setOpenModal(null)} size="small" sx={{ color: '#FFF' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: 3, pt: 3 }}>
                    <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.65, mb: 2.5 }}>
                        Расскажи другу про занятия с Дмитрием. Когда он начнёт заниматься и при первом
                        обращении скажет, что пришёл от тебя, — ты получишь <b>5000 ₽</b>.
                    </Typography>

                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        Как это работает:
                    </Typography>
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                        {[
                            'Расскажи другу про EdSpace — покажи сайт или скинь ссылку',
                            `Друг напишет Дмитрию и скажет: «Меня привёл(а) ${firstName}»`,
                            'Друг начинает заниматься и оплачивает первый месяц занятий',
                            'Через месяц после этого ты получаешь 5000 ₽',
                        ].map((step, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{
                                    width: 24, height: 24, borderRadius: '50%',
                                    bgcolor: '#EEF2FF', color: '#4F46E5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 800, fontSize: '12px', flexShrink: 0,
                                }}>
                                    {i + 1}
                                </Box>
                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.55 }}>
                                    {step}
                                </Typography>
                            </Box>
                        ))}
                    </Stack>

                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E5E7EB', mb: 2.5 }}>
                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', fontWeight: 700, letterSpacing: '0.05em', mb: 1 }}>
                            УСЛОВИЯ
                        </Typography>
                        <Typography component="div" sx={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.75 }}>
                            • Выплата — один раз за каждого нового ученика<br />
                            • Друг обязательно должен назвать твоё имя при первом обращении к Дмитрию<br />
                            • 5000 ₽ начисляются через месяц после того, как друг оплатит первый месяц занятий — так мы уверены, что он остался и всё серьёзно<br />
                            • Деньги можно получить на карту или зачесть в счёт следующего месяца занятий (скидка 5000 ₽)
                        </Typography>
                    </Paper>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        Готовое сообщение для друга:
                    </Typography>
                    <Paper sx={{
                        p: 2, bgcolor: '#F9FAFB', borderRadius: 2,
                        border: '1px dashed #C7D2FE', mb: 2,
                    }}>
                        <Typography sx={{
                            fontSize: '13px', color: '#4B5563', lineHeight: 1.65,
                            whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                        }}>
                            {referralText}
                        </Typography>
                    </Paper>

                    <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                            <StyledButton
                                fullWidth
                                startIcon={<CopyIcon sx={{ fontSize: 16 }} />}
                                onClick={() => copyToClipboard(referralText, 'Сообщение скопировано!')}
                                sx={{
                                    bgcolor: '#EEF2FF', color: '#4F46E5',
                                    borderRadius: 2, fontSize: '13px', fontWeight: 700,
                                    textTransform: 'none', py: 1.3,
                                    '&:hover': { bgcolor: '#DDD6FE' },
                                }}
                            >
                                Скопировать сообщение
                            </StyledButton>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledButton
                                fullWidth
                                startIcon={<CopyIcon sx={{ fontSize: 16 }} />}
                                onClick={() => copyToClipboard(CONTACTS.landing, 'Ссылка скопирована!')}
                                sx={{
                                    bgcolor: '#F3F4F6', color: '#374151',
                                    borderRadius: 2, fontSize: '13px', fontWeight: 700,
                                    textTransform: 'none', py: 1.3,
                                    '&:hover': { bgcolor: '#E5E7EB' },
                                }}
                            >
                                Скопировать ссылку на сайт
                            </StyledButton>
                        </Grid>
                    </Grid>

                    <Box sx={{ mt: 2, p: 1.75, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0' }}>
                        <Typography sx={{ fontSize: '12px', color: '#166534', lineHeight: 1.6 }}>
                            💡 Важно: попроси друга обязательно сказать Дмитрию, что он от тебя. Без этого мы не сможем связать вас и начислить выплату.
                        </Typography>
                    </Box>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
                    <StyledButton
                        onClick={() => setOpenModal(null)}
                        sx={{ color: '#6B7280' }}
                    >
                        Закрыть
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== МОДАЛКА: РЕПЕТИТОР ПО ДРУГОМУ ПРЕДМЕТУ ========== */}
            <StyledDialog
                open={openModal === 'tutor'}
                onClose={() => setOpenModal(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 20, overflow: 'hidden' } }}
            >
                <Box sx={{
                    px: 3, pt: 3, pb: 2,
                    background: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44, fontSize: '1.5rem' }}>
                        🎯
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.08em' }}>
                            🎓 ЛЮБОЙ ПРЕДМЕТ
                        </Typography>
                        <Typography sx={{ fontSize: '19px', color: '#FFF', fontWeight: 800, letterSpacing: '-0.01em' }}>
                            Найдём репетитора
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setOpenModal(null)} size="small" sx={{ color: '#FFF' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: 3, pt: 3 }}>
                    <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.65, mb: 2.5 }}>
                        Если кроме основного предмета нужен ещё какой-то — поможем найти проверенного
                        преподавателя. У нас есть коллеги-репетиторы по разным направлениям: подберём
                        под твои цели и уровень подготовки.
                    </Typography>

                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        По каким предметам можем помочь:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                        {['Математика (профиль)', 'Математика (база)', 'Информатика', 'Физика', 'Химия', 'Русский язык', 'Английский', 'Биология', 'История', 'Обществознание'].map(subj => (
                            <Chip
                                key={subj}
                                label={subj}
                                size="small"
                                sx={{
                                    bgcolor: '#FEF2F2', color: '#991B1B',
                                    fontWeight: 600, fontSize: '12px',
                                    borderRadius: 100, height: 26,
                                }}
                            />
                        ))}
                    </Box>

                    <Paper sx={{ p: 2, bgcolor: '#FEF2F2', borderRadius: 2, border: '1px solid #FECACA', mb: 3 }}>
                        <Typography sx={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.65 }}>
                            💡 Расскажи, какой предмет нужен и в каком формате удобно заниматься
                            (онлайн / оффлайн / интенсив) — мы подберём преподавателя и свяжем вас.
                        </Typography>
                    </Paper>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.65, mb: 2 }}>
                        Чтобы оставить заявку — просто напиши нам в Telegram или позвони.
                        Мы всё уточним и подберём репетитора.
                    </Typography>

                    <Grid container spacing={1.5}>
                        <Grid item xs={12} sm={6}>
                            <StyledButton
                                fullWidth
                                startIcon={<TelegramIcon sx={{ fontSize: 16 }} />}
                                onClick={() => window.open(CONTACTS.telegramLink, '_blank')}
                                sx={{
                                    bgcolor: '#E0F2FE', color: '#0284C7',
                                    borderRadius: 2, fontSize: '13px', fontWeight: 700,
                                    textTransform: 'none', py: 1.3,
                                    '&:hover': { bgcolor: '#BAE6FD' },
                                }}
                            >
                                Написать в Telegram
                            </StyledButton>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <StyledButton
                                fullWidth
                                startIcon={<PhoneIcon sx={{ fontSize: 16 }} />}
                                onClick={() => window.open(CONTACTS.phoneLink, '_blank')}
                                sx={{
                                    bgcolor: '#F3F4F6', color: '#374151',
                                    borderRadius: 2, fontSize: '13px', fontWeight: 700,
                                    textTransform: 'none', py: 1.3,
                                    '&:hover': { bgcolor: '#E5E7EB' },
                                }}
                            >
                                Позвонить
                            </StyledButton>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <StyledButton
                        onClick={() => setOpenModal(null)}
                        sx={{ color: '#6B7280' }}
                    >
                        Закрыть
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        startIcon={<TelegramIcon sx={{ fontSize: 16 }} />}
                        onClick={() => window.open(CONTACTS.telegramLink, '_blank')}
                        sx={{
                            bgcolor: '#EF4444', borderRadius: 2, textTransform: 'none', fontWeight: 700,
                            '&:hover': { bgcolor: '#DC2626' },
                        }}
                    >
                        Оставить заявку
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== МОДАЛКА: ТУРНИРЫ ========== */}
            <StyledDialog
                open={openModal === 'tournament'}
                onClose={() => setOpenModal(null)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 20, overflow: 'hidden' } }}
            >
                <Box sx={{
                    px: 3, pt: 3, pb: 2,
                    background: 'linear-gradient(135deg, #3B82F6 0%, #7C3AED 100%)',
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44, fontSize: '1.5rem' }}>
                        👑
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.08em' }}>
                            🏆 МАРАФОН НА МЕСЯЦ
                        </Typography>
                        <Typography sx={{ fontSize: '19px', color: '#FFF', fontWeight: 800, letterSpacing: '-0.01em' }}>
                            Соревнуйся и расти
                        </Typography>
                    </Box>
                    <IconButton onClick={() => setOpenModal(null)} size="small" sx={{ color: '#FFF' }}>
                        <CloseIcon />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: 3, pt: 3 }}>
                    <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.65, mb: 2.5 }}>
                        Раз в месяц проводим <b>марафон по пробникам</b>. Соревнование идёт не по абсолютному баллу,
                        а по <b>прогрессу относительно себя</b>: побеждает не тот, кто изначально сильнее,
                        а тот, кто больше вырос за месяц.
                    </Typography>

                    <Paper sx={{ p: 2, bgcolor: '#EFF6FF', borderRadius: 2, border: '1px solid #BFDBFE', mb: 3 }}>
                        <Typography sx={{ fontSize: '12px', color: '#1E40AF', lineHeight: 1.65 }}>
                            💡 Почему по прогрессу? У всех учеников разный уровень. Если считать по баллам —
                            отличник всегда впереди, и соревноваться становится неинтересно. А если считать рост —
                            шанс есть у каждого.
                        </Typography>
                    </Paper>

                    {/* Формат */}
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        Формат марафона:
                    </Typography>
                    <Stack spacing={1.5} sx={{ mb: 3 }}>
                        {[
                            { emoji: '📅', title: 'Месяц', desc: 'Марафон идёт ровно месяц с момента старта.' },
                            { emoji: '📝', title: '4 пробника', desc: 'Нужно сдать 4 полноценных пробника за это время. Меньше — не засчитывается.' },
                            { emoji: '⏱', title: 'С таймером', desc: 'Каждый пробник решается в один заход, не более 4 часов — как на настоящем экзамене.' },
                            { emoji: '📷', title: 'Присылай решения', desc: 'Обязательно присылать фото решений всех задач, а не только ответы. Это и честно, и показывает, как ты думаешь.' },
                        ].map((item, i) => (
                            <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                                <Box sx={{
                                    width: 36, height: 36, borderRadius: 2,
                                    bgcolor: '#EEF2FF',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.1rem', flexShrink: 0,
                                }}>
                                    {item.emoji}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#141414', mb: 0.25 }}>
                                        {item.title}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.5 }}>
                                        {item.desc}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <Divider sx={{ my: 2.5 }} />

                    {/* Как считается прогресс */}
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        Как считается прогресс:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2, border: '1px solid #E5E7EB', mb: 2 }}>
                        <Typography sx={{ fontSize: '13px', color: '#374151', lineHeight: 1.75 }}>
                            1. Перед стартом марафона у каждого ученика считается <b>база</b> —
                            средний балл за последние 3 пробника.<br />
                            2. За каждый новый пробник считается <b>рост относительно базы</b>.<br />
                            3. Побеждает тот, у кого <b>средний рост за 4 пробника</b> больше.
                        </Typography>
                    </Paper>

                    <Paper sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0', mb: 3 }}>
                        <Typography sx={{ fontSize: '12px', color: '#166534', lineHeight: 1.65 }}>
                            💡 Так честнее: у отличника каждый дополнительный балл «стоит дороже»,
                            чем у того, кто только начинает. Шанс выиграть есть у каждого.
                        </Typography>
                    </Paper>

                    {/* Честность */}
                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        Про честность:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#FEF2F2', borderRadius: 2, border: '1px solid #FECACA', mb: 3 }}>
                        <Typography component="div" sx={{ fontSize: '13px', color: '#7F1D1D', lineHeight: 1.75 }}>
                            • Марафон — это <b>соревнование с собой</b>. Списывать — значит обманывать только себя.<br />
                            • Мы <b>доверяем тебе</b>, но обязательно проверяем: присылай решения всех задач, а не только ответы.<br />
                            • Если у тебя один пробник сильно выше остальных, а решения не сходятся — результат может быть пересмотрен.<br />
                            • Участие в следующих марафонах — только для тех, кто играет честно.
                        </Typography>
                    </Paper>

                    <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#141414', mb: 1.5 }}>
                        Призы:
                    </Typography>
                    <Stack spacing={1.25} sx={{ mb: 3 }}>
                        {[
                            { emoji: '🥇', place: '1 место', prize: 'Сертификат на 3000 ₽ + книга', color: '#F59E0B', bg: '#FFF3D6' },
                            { emoji: '🥈', place: '2 место', prize: 'Сертификат на 1500 ₽ + книга', color: '#6B7280', bg: '#F3F4F6' },
                            { emoji: '🥉', place: '3 место', prize: 'Сертификат на 500 ₽ + книга', color: '#B45309', bg: '#FEF3C7' },
                            { emoji: '📚', place: '4 место', prize: 'Книга по выбору Дмитрия', color: '#7C3AED', bg: '#F5F3FF' },
                        ].map((item, i) => (
                            <Box key={i} sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                p: 1.5, borderRadius: 2,
                                bgcolor: item.bg,
                                border: `1px solid ${item.color}30`,
                            }}>
                                <Box sx={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.emoji}</Box>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{
                                        fontSize: '0.85rem', fontWeight: 800,
                                        color: item.color, lineHeight: 1.2,
                                    }}>
                                        {item.place}
                                    </Typography>
                                    <Typography sx={{
                                        fontSize: '0.82rem', color: '#374151',
                                        mt: 0.25, lineHeight: 1.4,
                                    }}>
                                        {item.prize}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Stack>

                    <Paper sx={{ p: 2, bgcolor: '#F0FDF4', borderRadius: 2, border: '1px solid #BBF7D0', mb: 3 }}>
                        <Typography sx={{ fontSize: '12px', color: '#166534', lineHeight: 1.65 }}>
                            💡 Сертификат можно потратить куда захочешь — какой магазин, решаешь сам после победы.
                            Книгу Дмитрий подберёт лично — такую, которая тебе точно зайдёт.
                        </Typography>
                    </Paper>

                    <Divider sx={{ my: 2.5 }} />

                    <Typography sx={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.65 }}>
                        Хочешь участвовать? Напиши нам — расскажем, когда стартует следующий марафон и как записаться.
                    </Typography>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <StyledButton onClick={() => setOpenModal(null)} sx={{ color: '#6B7280' }}>
                        Закрыть
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        startIcon={<TrophyIcon sx={{ fontSize: 16 }} />}
                        onClick={() => { setOpenModal(null); navigate('/student/tournament'); }}
                        sx={{
                            bgcolor: '#3B82F6', borderRadius: 2, textTransform: 'none', fontWeight: 700,
                            '&:hover': { bgcolor: '#2563EB' },
                        }}
                    >
                        Перейти к турниру
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== TOAST ========== */}
            <Snackbar
                open={!!toast}
                autoHideDuration={2500}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {toast ? (
                    <Alert
                        severity={toast.type}
                        onClose={() => setToast(null)}
                        sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                        {toast.message}
                    </Alert>
                ) : <div />}
            </Snackbar>

        </PageContainer>
    );
}