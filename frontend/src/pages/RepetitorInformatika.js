import React, { useEffect, useState } from 'react';
import {
    Box, Container, Typography, Button, Paper, Grid, Stack,
    Divider, Dialog, DialogContent, IconButton,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon,
    Close as CloseIcon,
    Telegram as TelegramIcon,
    Phone as PhoneIcon,
    Code as CodeIcon,
    RocketLaunch as RocketIcon,
    Build as BuildIcon,
    EmojiObjects as IdeaIcon,
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

const ProjectCard = styled(Box)({
    padding: 20,
    borderRadius: 18,
    background: CARD,
    border: `1px solid ${LINE}`,
    height: '100%',
    transition: 'all 0.25s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 30px rgba(123,92,250,0.15)',
        borderColor: PURPLE,
    },
});

const ProjectIconBox = styled(Box)(({ $color }) => ({
    width: 46, height: 46, borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: $color,
    marginBottom: 14,
}));

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

export default function RepetitorInformatika() {
    const [contactsOpen, setContactsOpen] = useState(false);

    useEffect(() => {
        document.title = 'Репетитор по информатике онлайн | 5–11 классы | EdSpace';
        let meta = document.querySelector('meta[name="description"]');
        if (!meta) {
            meta = document.createElement('meta');
            meta.name = 'description';
            document.head.appendChild(meta);
        }
        meta.content = 'Репетитор по информатике для 5–11 классов. Подготовка к ЕГЭ, ОГЭ, обучение программированию через реальные проекты. Онлайн-занятия. Средний балл учеников 74+.';
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
                        <H1>Репетитор по информатике для 5–11 классов</H1>
                        <Lead>
                            Индивидуальные онлайн-занятия по информатике: школьная программа,
                            подготовка к ЕГЭ и ОГЭ, программирование на Python. Работаю
                            с учениками любого уровня — от «догоняющих» до олимпиадников.
                        </Lead>
                        <PrimaryBtn onClick={openContacts}>
                            Записаться на пробный урок
                        </PrimaryBtn>
                    </Box>
                </Reveal>

                <Reveal delay={0.1}>
                    <Section>
                        <SectionTitle>📚 Направления работы</SectionTitle>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>5–9 классы</b> — школьная программа, домашка, контрольные, ОГЭ</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>10–11 классы</b> — подготовка к ЕГЭ, программирование, проекты</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Программирование</b> — Python с нуля до уровня реальных проектов</Typography></BulletRow>
                        <BulletRow><CheckIcon sx={{ color: '#10B981', mt: 0.3 }} /><Typography><b>Олимпиады</b> — углублённая подготовка для мотивированных</Typography></BulletRow>
                    </Section>
                </Reveal>

                {/* БЛОК ПРО PYTHON — ПРОЕКТНЫЙ ПОДХОД */}
                <Reveal delay={0.15}>
                    <Section sx={{
                        background: 'linear-gradient(135deg, #1F1F1F 0%, #2A2A2A 100%)',
                        color: '#FFF',
                        border: 'none',
                        overflow: 'hidden',
                    }}>
                        <Box sx={{
                            position: 'absolute', top: -80, right: -80,
                            width: 260, height: 260, borderRadius: '50%',
                            background: PURPLE, filter: 'blur(80px)', opacity: 0.4,
                            pointerEvents: 'none',
                        }} />
                        <Box sx={{
                            position: 'absolute', bottom: -60, left: -60,
                            width: 220, height: 220, borderRadius: '50%',
                            background: LIME, filter: 'blur(70px)', opacity: 0.25,
                            pointerEvents: 'none',
                        }} />

                        <Box sx={{ position: 'relative' }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <Box sx={{
                                    width: 44, height: 44, borderRadius: 2.5,
                                    bgcolor: LIME, color: INK,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <CodeIcon />
                                </Box>
                                <Typography sx={{
                                    fontSize: '0.75rem', fontWeight: 700,
                                    letterSpacing: '0.1em', textTransform: 'uppercase',
                                    color: LIME,
                                }}>
                                    Python · Проектный подход
                                </Typography>
                            </Box>

                            <Typography sx={{
                                fontSize: { xs: '1.5rem', md: '1.9rem' },
                                fontWeight: 800, lineHeight: 1.15,
                                letterSpacing: '-0.02em', mb: 2, color: '#FFF',
                            }}>
                                Учимся программировать <br />
                                <Box component="span" sx={{ color: LIME, fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 500 }}>
                                    на реальных задачах
                                </Box>
                            </Typography>

                            <Typography sx={{
                                color: 'rgba(255,255,255,0.8)',
                                fontSize: { xs: '0.95rem', md: '1.02rem' },
                                lineHeight: 1.65, mb: 4, maxWidth: 640,
                            }}>
                                В обучении Python я делаю упор <b style={{ color: '#FFF' }}>не на нарешивание задач</b>,
                                а на <b style={{ color: '#FFF' }}>разработку проектов, которые интересны ученику</b>.
                                Мы не «тренируемся ради тренировки» — мы создаём то, что хочется показать друзьям:
                                игры, боты, сайты, автоматизацию. Разбираем реальные сценарии и учимся
                                доводить идею до рабочего результата.
                            </Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                    <ProjectCard>
                                        <ProjectIconBox $color={PURPLE_SOFT}>
                                            <IdeaIcon sx={{ color: PURPLE }} />
                                        </ProjectIconBox>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: INK, mb: 0.75 }}>
                                            Идея и цель
                                        </Typography>
                                        <Typography sx={{ color: INK_SOFT, fontSize: '0.88rem', lineHeight: 1.55 }}>
                                            Выбираем проект под интересы: игра, чат-бот, сайт, утилита.
                                        </Typography>
                                    </ProjectCard>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <ProjectCard>
                                        <ProjectIconBox $color={PINK_SOFT}>
                                            <BuildIcon sx={{ color: PINK }} />
                                        </ProjectIconBox>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: INK, mb: 0.75 }}>
                                            Разработка
                                        </Typography>
                                        <Typography sx={{ color: INK_SOFT, fontSize: '0.88rem', lineHeight: 1.55 }}>
                                            Пишем код, изучаем Python на практике, разбираем библиотеки.
                                        </Typography>
                                    </ProjectCard>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <ProjectCard>
                                        <ProjectIconBox $color={LIME_SOFT}>
                                            <RocketIcon sx={{ color: '#10B981' }} />
                                        </ProjectIconBox>
                                        <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: INK, mb: 0.75 }}>
                                            Запуск
                                        </Typography>
                                        <Typography sx={{ color: INK_SOFT, fontSize: '0.88rem', lineHeight: 1.55 }}>
                                            Доводим проект до работающего состояния и делимся результатом.
                                        </Typography>
                                    </ProjectCard>
                                </Grid>
                            </Grid>

                            <Typography sx={{
                                mt: 3.5, color: 'rgba(255,255,255,0.65)',
                                fontSize: '0.88rem', fontStyle: 'italic',
                            }}>
                                Такой подход даёт не только знание языка, но и умение решать реальные
                                задачи — то, что действительно пригодится в учёбе и работе.
                            </Typography>
                        </Box>
                    </Section>
                </Reveal>

                <Reveal delay={0.2}>
                    <Section>
                        <SectionTitle>🎓 Как проходят занятия</SectionTitle>
                        <BulletRow><Typography><b>Онлайн</b> — Яндекс Телемост + интерактивная доска Meleto</Typography></BulletRow>
                        <BulletRow><Typography><b>Индивидуально</b> — программа подстраивается под уровень и цель</Typography></BulletRow>
                        <BulletRow><Typography><b>Материалы</b> — конспекты, код и задачи сохраняются в кабинете</Typography></BulletRow>
                        <BulletRow><Typography><b>Платформа EdSpace</b> — расписание, домашки, прогресс в одном месте</Typography></BulletRow>
                    </Section>
                </Reveal>

                <Reveal delay={0.25}>
                    <Section sx={{ textAlign: 'center', background: 'linear-gradient(135deg, #7B5CFA, #6B4BEB)', color: '#FFF', border: 'none', overflow: 'hidden' }}>
                        <Box sx={{
                            position: 'absolute', top: -60, right: -60,
                            width: 200, height: 200, borderRadius: '50%',
                            background: LIME, filter: 'blur(60px)', opacity: 0.3,
                            pointerEvents: 'none',
                        }} />
                        <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, mb: 1.5, position: 'relative' }}>
                            Готовы начать?
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

                <Reveal delay={0.3}>
                    <Box sx={{ mt: 4 }}>
                        <Typography sx={{ fontWeight: 700, color: INK, mb: 1.5, fontSize: '0.9rem' }}>
                            Другие направления:
                        </Typography>
                        <LinkRow>
                            <StyledLink href="/repetitor-informatika-ege">Подготовка к ЕГЭ по информатике</StyledLink>
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