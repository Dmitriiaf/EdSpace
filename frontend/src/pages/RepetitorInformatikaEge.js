import React, { useEffect, useState } from 'react';
import {
    Box, Container, Typography, Button, Paper, Grid, Stack,
    Accordion, AccordionSummary, AccordionDetails, Divider, Dialog,
    DialogContent, IconButton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon,
    ExpandMore as ExpandMoreIcon,
    Videocam as VideoIcon,
    School as SchoolIcon,
    EmojiEvents as TrophyIcon,
    Book as BookIcon,
    Close as CloseIcon,
    Telegram as TelegramIcon,
    Phone as PhoneIcon,
} from '@mui/icons-material';

// ========== ПАЛИТРА ==========
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const LIME = '#C4F542';
const LIME_SOFT = '#EBFFB0';
const PINK = '#FF5FA2';
const PINK_SOFT = '#FFE0EE';
const BG = '#FAFAFA';
const CARD = '#FFFFFF';
const LINE = '#EAEAEA';

// ========== АНИМАЦИИ ==========
const float = keyframes`
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-30px) translateX(20px); }
`;
const float2 = keyframes`
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(40px) translateX(-25px); }
`;
const float3 = keyframes`
    0%, 100% { transform: translateY(0) translateX(0); }
    50% { transform: translateY(-25px) translateX(-15px); }
`;
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
`;
const glow = keyframes`
    0%, 100% { opacity: 0.6; }
    50% { opacity: 1; }
`;

// ========== STYLED ==========
const Page = styled(Box)({
    bgcolor: BG,
    minHeight: '100vh',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    position: 'relative',
    overflow: 'hidden',
});

const Blob = styled(Box)(({ $size, $color, $top, $left, $right, $bottom, $delay = 0, $anim = 1 }) => ({
    position: 'absolute',
    width: $size,
    height: $size,
    borderRadius: '50%',
    background: $color,
    filter: 'blur(80px)',
    opacity: 0.5,
    top: $top,
    left: $left,
    right: $right,
    bottom: $bottom,
    pointerEvents: 'none',
    zIndex: 0,
    animation: `${$anim === 1 ? float : $anim === 2 ? float2 : float3} ${18 + $delay}s ease-in-out infinite`,
    animationDelay: `${$delay}s`,
}));

const GridOverlay = styled(Box)({
    position: 'absolute',
    inset: 0,
    backgroundImage: `linear-gradient(rgba(123,92,250,0.04) 1px, transparent 1px),
                     linear-gradient(90deg, rgba(123,92,250,0.04) 1px, transparent 1px)`,
    backgroundSize: '60px 60px',
    pointerEvents: 'none',
    zIndex: 0,
    maskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
    WebkitMaskImage: 'radial-gradient(ellipse at center, black 40%, transparent 80%)',
});

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.7s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
    position: 'relative',
    zIndex: 1,
}));

const Container_ = styled(Container)({
    maxWidth: 900,
    paddingTop: 48,
    paddingBottom: 64,
    position: 'relative',
    zIndex: 1,
});

const H1 = styled(Typography)({
    fontSize: 'clamp(1.8rem, 4vw, 2.6rem)',
    fontWeight: 800,
    color: INK,
    letterSpacing: '-0.03em',
    lineHeight: 1.15,
    marginBottom: 16,
});

const Lead = styled(Typography)({
    fontSize: '1.05rem',
    color: INK_SOFT,
    lineHeight: 1.6,
    maxWidth: 720,
    margin: '0 auto 32px',
});

const PrimaryBtn = styled(Button)({
    textTransform: 'none',
    fontWeight: 700,
    fontSize: '1rem',
    padding: '14px 32px',
    borderRadius: 100,
    background: PURPLE,
    color: '#FFF',
    boxShadow: '0 8px 24px rgba(123,92,250,0.35)',
    transition: 'all 0.25s ease',
    '&:hover': {
        background: '#6B4BEB',
        boxShadow: '0 12px 32px rgba(123,92,250,0.55)',
        transform: 'translateY(-2px)',
    },
});

const Section = styled(Paper)({
    padding: 32,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    border: `1px solid ${LINE}`,
    marginBottom: 24,
    transition: 'all 0.3s ease',
    position: 'relative',
    zIndex: 1,
    '&:hover': {
        boxShadow: '0 12px 40px rgba(123,92,250,0.12)',
        borderColor: 'rgba(123,92,250,0.3)',
    },
});

const SectionTitle = styled(Typography)({
    fontSize: '1.4rem',
    fontWeight: 800,
    color: INK,
    marginBottom: 16,
    letterSpacing: '-0.02em',
});

const BulletRow = styled(Box)({
    display: 'flex',
    gap: 12,
    marginBottom: 12,
    alignItems: 'flex-start',
});

const StatCard = styled(Box)({
    padding: 20,
    borderRadius: 20,
    background: PURPLE_SOFT,
    textAlign: 'center',
    transition: 'transform 0.25s ease',
    '&:hover': { transform: 'translateY(-4px) scale(1.03)' },
});

const LinkRow = styled(Box)({
    display: 'flex',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
});

const StyledLink = styled('a')({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 100,
    background: CARD,
    color: PURPLE,
    textDecoration: 'none',
    fontWeight: 600,
    fontSize: '0.9rem',
    border: `1px solid ${LINE}`,
    transition: 'all 0.2s ease',
    '&:hover': {
        background: PURPLE_SOFT,
        borderColor: PURPLE,
        transform: 'translateY(-2px)',
    },
});

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
    width: 42,
    height: 42,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
});

export default function RepetitorInformatikaEge() {
    const [contactsOpen, setContactsOpen] = useState(false);

    useEffect(() => {
        document.title = 'Репетитор по информатике ЕГЭ онлайн | EdSpace';
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
        }
        meta.content = 'Подготовка к ЕГЭ по информатике с репетитором онлайн. Разбор всех заданий, программирование на Python. Средний балл учеников 74+.';
    }, []);

    const openContacts = () => setContactsOpen(true);

    return (
        <Page>
            {/* ФОНОВЫЕ ПУЗЫРИ */}
            <Blob $size={420} $color={PURPLE} $top={-120} $left={-100} $delay={0} $anim={1} />
            <Blob $size={360} $color={PINK} $top="15%" $right={-120} $delay={2} $anim={2} />
            <Blob $size={300} $color={LIME} $top="55%" $left={-140} $delay={4} $anim={3} />
            <Blob $size={340} $color={PURPLE} $bottom={-100} $right={-80} $delay={1} $anim={1} />
            <Blob $size={220} $color={PINK} $top="35%" $left="45%" $delay={3} $anim={2} />

            {/* СЕТКА */}
            <GridOverlay />

            <Container_>
                <Reveal>
                    <Box sx={{ paddingBottom: 40, textAlign: 'center' }}>
                        <Typography sx={{
                            fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em',
                            textTransform: 'uppercase', color: PURPLE, mb: 1.5,
                        }}>
                            EdSpace · Онлайн-репетитор
                        </Typography>
                        <H1>Подготовка к ЕГЭ по информатике с репетитором</H1>
                        <Lead>
                            Индивидуальные онлайн-занятия по информатике для 10–11 классов.
                            Разбираем все 27 заданий ЕГЭ, учим программировать на Python,
                            готовим к высоким баллам. Средний балл моих учеников — 74+.
                        </Lead>
                        <PrimaryBtn onClick={openContacts}>
                            Записаться на пробный урок
                        </PrimaryBtn>
                    </Box>
                </Reveal>

                <Reveal delay={0.1}>
                    <Section>
                        <SectionTitle>🎯 Что входит в подготовку</SectionTitle>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Диагностика</b> — определяем текущий уровень и пробелы</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Теория</b> — системный разбор всех тем: системы счисления, логика, графы, алгоритмы</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Программирование</b> — Python с нуля до уровня заданий 26–27</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Практика</b> — решаем задачи прошлых лет и авторские варианты</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Пробники</b> — регулярные тренировочные экзамены с разбором</Typography></BulletRow>
                    </Section>
                </Reveal>

                <Reveal delay={0.15}>
                    <Section>
                        <SectionTitle>📊 Формат ЕГЭ по информатике</SectionTitle>
                        <Typography sx={{ color: INK_SOFT, lineHeight: 1.7, mb: 2 }}>
                            Экзамен длится <b>235 минут</b> (3 часа 55 минут) и содержит <b>27 заданий</b>.
                            Из них 25 заданий базового и повышенного уровня (по 1 баллу)
                            и 2 задания высокого уровня (по 2 балла). Максимум — <b>29 первичных баллов</b>,
                            которые переводятся в 100-балльную шкалу.
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6} sm={3}><StatCard><Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: PURPLE }}>27</Typography><Typography sx={{ fontSize: '0.8rem', color: INK_SOFT }}>заданий</Typography></StatCard></Grid>
                            <Grid item xs={6} sm={3}><StatCard><Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: PURPLE }}>235</Typography><Typography sx={{ fontSize: '0.8rem', color: INK_SOFT }}>минут</Typography></StatCard></Grid>
                            <Grid item xs={6} sm={3}><StatCard><Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: PURPLE }}>29</Typography><Typography sx={{ fontSize: '0.8rem', color: INK_SOFT }}>первичных</Typography></StatCard></Grid>
                            <Grid item xs={6} sm={3}><StatCard><Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: PURPLE }}>74+</Typography><Typography sx={{ fontSize: '0.8rem', color: INK_SOFT }}>средний балл</Typography></StatCard></Grid>
                        </Grid>
                    </Section>
                </Reveal>

                <Reveal delay={0.2}>
                    <Section>
                        <SectionTitle>🎓 Как проходят занятия</SectionTitle>
                        <BulletRow><VideoIcon sx={{ color: PURPLE, mt: 0.3 }} /><Typography><b>Онлайн</b> — Яндекс Телемост + интерактивная доска Meleto</Typography></BulletRow>
                        <BulletRow><SchoolIcon sx={{ color: PURPLE, mt: 0.3 }} /><Typography><b>Индивидуально</b> — программа подстраивается под уровень и цель ученика</Typography></BulletRow>
                        <BulletRow><BookIcon sx={{ color: PURPLE, mt: 0.3 }} /><Typography><b>Материалы</b> — конспекты, задачи, записи занятий сохраняются в личном кабинете</Typography></BulletRow>
                        <BulletRow><TrophyIcon sx={{ color: PURPLE, mt: 0.3 }} /><Typography><b>Результат</b> — 153 ученика за 5 лет, средний балл 74+, есть 90+</Typography></BulletRow>
                    </Section>
                </Reveal>

                <Reveal delay={0.25}>
                    <Section>
                        <SectionTitle>❓ Частые вопросы</SectionTitle>
                        <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 600 }}>За сколько месяцев можно подготовиться к ЕГЭ?</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography sx={{ color: INK_SOFT }}>
                                    Оптимально — 8–12 месяцев при занятиях 2 раза в неделю.
                                    За 3–4 месяца можно подтянуть уровень, если база уже есть.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                        <Divider sx={{ my: 1 }} />
                        <Accordion elevation={0} sx={{ bgcolor: 'transparent', '&:before': { display: 'none' } }}>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography sx={{ fontWeight: 600 }}>Нужно ли уметь программировать заранее?</Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <Typography sx={{ color: INK_SOFT }}>
                                    Нет. Программирование на Python разбираем с нуля — от синтаксиса
                                    до заданий 26–27.
                                </Typography>
                            </AccordionDetails>
                        </Accordion>
                    </Section>
                </Reveal>

                <Reveal delay={0.3}>
                    <Section sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #7B5CFA, #6B4BEB)', color: '#FFF', border: 'none', overflow: 'hidden' }}>
                        <Box sx={{
                            position: 'absolute', top: -60, right: -60,
                            width: 200, height: 200, borderRadius: '50%',
                            background: LIME, filter: 'blur(60px)', opacity: 0.3,
                            pointerEvents: 'none',
                        }} />
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, mb: 1.5, position: 'relative' }}>
                            Готовы начать подготовку?
                        </Typography>
                        <Typography sx={{ opacity: 0.9, mb: 3, maxWidth: 480, mx: 'auto', position: 'relative' }}>
                            Первое занятие — пробное. Определим уровень и составим план.
                        </Typography>
                        <Button
                            onClick={openContacts}
                            sx={{
                                textTransform: 'none', fontWeight: 700, fontSize: '1rem',
                                padding: '14px 32px', borderRadius: 100,
                                background: LIME, color: INK,
                                position: 'relative',
                                transition: 'all 0.25s ease',
                                '&:hover': { background: LIME_SOFT, transform: 'translateY(-2px)' },
                            }}
                        >
                            Записаться на пробный урок
                        </Button>
                    </Section>
                </Reveal>

                <Reveal delay={0.35}>
                    <Box sx={{ mt: 4 }}>
                        <Typography sx={{ fontWeight: 700, color: INK, mb: 1.5, fontSize: '0.9rem' }}>
                            Другие направления:
                        </Typography>
                        <LinkRow>
                            <StyledLink href="/repetitor-informatika">Репетитор по информатике</StyledLink>
                            <StyledLink href="/repetitor-informatika-oge">Подготовка к ОГЭ по информатике</StyledLink>
                            <StyledLink href="/repetitor-matematika-ege">Репетитор по математике ЕГЭ</StyledLink>
                        </LinkRow>
                    </Box>
                </Reveal>
            </Container_>

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
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem', mb: 2.5, lineHeight: 1.5 }}>
                        Напишите в любой мессенджер или позвоните — отвечу в течение дня.
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
                                <TelegramIcon />
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
        </Page>
    );
}