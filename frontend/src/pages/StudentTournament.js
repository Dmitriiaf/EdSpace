// frontend/src/pages/StudentTournament.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Button, Alert, Stack, Avatar, Snackbar, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { styled, keyframes, alpha } from '@mui/material/styles';
import {
    EmojiEvents as TrophyIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    HourglassEmpty as PendingIcon,
    Cancel as CancelIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== ПАЛИТРА ==========
const BG = '#FAFAFA';
const BG_ALT = '#F5F5F7';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const GREEN = '#10B981';
const GREEN_SOFT = '#D9F5E0';
const AMBER = '#F59E0B';
const AMBER_SOFT = '#FFF3D6';
const RED = '#EF4444';
const RED_SOFT = '#FEE2E2';
const BLUE = '#3B82F6';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const StatusChip = styled(Chip)(({ color, bg, border }) => ({
    backgroundColor: bg,
    color: color,
    fontWeight: 700,
    fontSize: '0.72rem',
    height: 24,
    borderRadius: 100,
    border: `1px solid ${border}`,
}));

const MedalCell = styled(Box)(({ color }) => ({
    width: 28,
    height: 28,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color,
    color: '#FFF',
    fontWeight: 800,
    fontSize: '0.85rem',
    boxShadow: `0 2px 6px ${color}40`,
}));

function StudentTournament() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Турнир'; }, []);

    const [loading, setLoading] = useState(true);
    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [myStatus, setMyStatus] = useState('NOT_JOINED');
    const [myParticipant, setMyParticipant] = useState(null);
    const [joining, setJoining] = useState(false);
    const [toast, setToast] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Активный турнир + участники
            const activeRes = await axiosInstance.get('/tournaments/active');
            const t = activeRes.data?.tournament;
            const list = activeRes.data?.participants || [];
            setTournament(t);
            setParticipants(list);

            // 2. Мой статус
            if (t) {
                try {
                    const myRes = await axiosInstance.get(`/tournaments/${t.id}/my-status`);
                    setMyStatus(myRes.data?.status || 'NOT_JOINED');
                    setMyParticipant(myRes.data?.participant || null);
                } catch (err) {
                    setMyStatus('NOT_JOINED');
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const handleJoin = async () => {
        if (!tournament) return;
        setJoining(true);
        try {
            await axiosInstance.post(`/tournaments/${tournament.id}/join`);
            setToast({ type: 'success', message: 'Заявка отправлена! Ждём подтверждения репетитора' });
            await loadData();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.error || 'Не удалось записаться',
            });
        } finally {
            setJoining(false);
        }
    };

    const getMedalColor = (place) => {
        if (place === 1) return '#FFD700';
        if (place === 2) return '#C0C0C0';
        if (place === 3) return '#CD7F32';
        return null;
    };

    const formatProgress = (avg) => {
        if (avg === null || avg === undefined) return '—';
        const num = typeof avg === 'string' ? parseFloat(avg) : avg;
        const percent = (num * 100).toFixed(1);
        if (num > 0) return `+${percent}%`;
        return `${percent}%`;
    };

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress sx={{ color: PURPLE }} />
                </Box>
            </PageContainer>
        );
    }

    return (
        <PageContainer sx={{ px: { xs: 2, sm: 3 }, bgcolor: BG, minHeight: '100vh' }}>
            {/* ЗАГОЛОВОК */}
            <Reveal>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    mb: 3, flexWrap: 'wrap', gap: 2,
                }}>
                    <Box>
                        <Typography sx={{
                            fontSize: { xs: '24px', sm: '28px' },
                            fontWeight: 800, color: INK, letterSpacing: '-0.02em', mb: 0.5,
                        }}>
                            🏆 Турнир
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                            Марафон по пробникам. Побеждает тот, кто больше вырос.
                        </Typography>
                    </Box>
                    <StyledButton
                        variant="outlined"
                        startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                        onClick={loadData}
                        sx={{
                            color: INK_SOFT, borderColor: LINE, borderRadius: '10px',
                            '&:hover': { bgcolor: BG_ALT, borderColor: INK_MUTED },
                        }}
                    >
                        Обновить
                    </StyledButton>
                </Box>
            </Reveal>

            {!tournament && (
                <Reveal delay={0.05}>
                    <Paper sx={{
                        p: 6, borderRadius: 4, bgcolor: CARD,
                        border: `1px dashed ${LINE}`, textAlign: 'center',
                    }}>
                        <TrophyIcon sx={{ fontSize: 56, color: INK_MUTED, mb: 2 }} />
                        <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: INK, mb: 1 }}>
                            Сейчас нет активного турнира
                        </Typography>
                        <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                            Как только репетитор запустит новый марафон — он появится здесь
                        </Typography>
                    </Paper>
                </Reveal>
            )}

            {tournament && (
                <Grid container spacing={2.5}>
                    {/* ЛЕВАЯ КОЛОНКА — ИНФОРМАЦИЯ О ТУРНИРЕ + СТАТУС */}
                    <Grid item xs={12} lg={4}>
                        <Reveal delay={0.05}>
                            <Paper sx={{
                                p: 3, borderRadius: 4, bgcolor: CARD,
                                border: `2px solid ${PURPLE}`, mb: 2.5,
                            }}>
                                <Typography sx={{
                                    fontSize: '0.72rem', color: INK_MUTED, fontWeight: 700,
                                    letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1,
                                }}>
                                    Активный турнир
                                </Typography>
                                <Typography sx={{
                                    fontSize: '1.3rem', fontWeight: 800, color: INK,
                                    letterSpacing: '-0.01em', mb: 1.5, lineHeight: 1.3,
                                }}>
                                    {tournament.name}
                                </Typography>
                                <Stack spacing={1}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.82rem', color: INK_MUTED }}>Начало</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: INK }}>
                                            {format(new Date(tournament.startDate), 'd MMMM yyyy', { locale: ru })}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.82rem', color: INK_MUTED }}>Конец</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: INK }}>
                                            {format(new Date(tournament.endDate), 'd MMMM yyyy', { locale: ru })}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.82rem', color: INK_MUTED }}>Участников</Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: PURPLE }}>
                                            {participants.length}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </Paper>
                        </Reveal>

                        {/* СТАТУС МОЕЙ ЗАЯВКИ */}
                        <Reveal delay={0.1}>
                            <Paper sx={{
                                p: 3, borderRadius: 4, bgcolor: CARD,
                                border: `1px solid ${LINE}`,
                            }}>
                                <Typography sx={{
                                    fontSize: '0.72rem', color: INK_MUTED, fontWeight: 700,
                                    letterSpacing: '0.08em', textTransform: 'uppercase', mb: 2,
                                }}>
                                    Твоё участие
                                </Typography>

                                {myStatus === 'NOT_JOINED' && (
                                    <>
                                        <Typography sx={{ fontSize: '0.9rem', color: INK_SOFT, mb: 2, lineHeight: 1.55 }}>
                                            Ты ещё не записан. Нажми кнопку ниже — заявка уйдёт Дмитрию на подтверждение.
                                        </Typography>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            onClick={handleJoin}
                                            disabled={joining}
                                            sx={{
                                                bgcolor: PURPLE, borderRadius: '10px',
                                                textTransform: 'none', fontWeight: 700, py: 1.2,
                                                '&:hover': { bgcolor: '#6B4BEB' },
                                                '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                                            }}
                                        >
                                            {joining ? 'Отправляем…' : '🎯 Записаться на турнир'}
                                        </Button>
                                    </>
                                )}

                                {myStatus === 'PENDING' && (
                                    <Box sx={{
                                        p: 2, borderRadius: 3, bgcolor: AMBER_SOFT,
                                        border: `1px solid ${alpha(AMBER, 0.3)}`,
                                        display: 'flex', gap: 1.5, alignItems: 'flex-start',
                                    }}>
                                        <PendingIcon sx={{ color: AMBER, fontSize: 22, flexShrink: 0, mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: '#92400E', fontSize: '0.9rem', mb: 0.3 }}>
                                                Заявка на рассмотрении
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.8rem', color: '#78350F', lineHeight: 1.5 }}>
                                                Дмитрий проверит, сколько пробников ты сдал за последний месяц, и подтвердит участие.
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {myStatus === 'APPROVED' && (
                                    <Box sx={{
                                        p: 2, borderRadius: 3, bgcolor: GREEN_SOFT,
                                        border: `1px solid ${alpha(GREEN, 0.3)}`,
                                        display: 'flex', gap: 1.5, alignItems: 'flex-start',
                                    }}>
                                        <CheckIcon sx={{ color: GREEN, fontSize: 22, flexShrink: 0, mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: '#065F46', fontSize: '0.9rem', mb: 0.3 }}>
                                                Ты в турнире
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.8rem', color: '#047857', lineHeight: 1.5 }}>
                                                Сдавай пробники, репетитор будет ставить баллы. Удачи!
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {myStatus === 'REJECTED' && (
                                    <Box sx={{
                                        p: 2, borderRadius: 3, bgcolor: RED_SOFT,
                                        border: `1px solid ${alpha(RED, 0.3)}`,
                                        display: 'flex', gap: 1.5, alignItems: 'flex-start',
                                    }}>
                                        <CancelIcon sx={{ color: RED, fontSize: 22, flexShrink: 0, mt: 0.2 }} />
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: '#991B1B', fontSize: '0.9rem', mb: 0.3 }}>
                                                Заявка отклонена
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.8rem', color: '#7F1D1D', lineHeight: 1.5 }}>
                                                Свяжись с Дмитрием, чтобы узнать причину.
                                            </Typography>
                                        </Box>
                                    </Box>
                                )}

                                {/* Мой прогресс, если участвую */}
                                {myStatus === 'APPROVED' && myParticipant && (
                                    <>
                                        <Divider sx={{ my: 2.5, borderColor: LINE }} />
                                        <Typography sx={{
                                            fontSize: '0.72rem', color: INK_MUTED, fontWeight: 700,
                                            letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5,
                                        }}>
                                            Мой прогресс
                                        </Typography>
                                        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
                                            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: BG_ALT, textAlign: 'center' }}>
                                                <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.1rem', lineHeight: 1 }}>
                                                    {myParticipant.baseScore ?? '—'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600, mt: 0.4 }}>
                                                    база
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                p: 1.5, borderRadius: 2, textAlign: 'center',
                                                bgcolor: myParticipant.averageProgress > 0 ? GREEN_SOFT : PURPLE_SOFT,
                                            }}>
                                                <Typography sx={{
                                                    fontWeight: 800,
                                                    color: myParticipant.averageProgress > 0 ? GREEN : PURPLE,
                                                    fontSize: '1.1rem', lineHeight: 1,
                                                }}>
                                                    {formatProgress(myParticipant.averageProgress)}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600, mt: 0.4 }}>
                                                    прогресс
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {myParticipant.place && (
                                            <Box sx={{ mt: 1.5, p: 1.5, borderRadius: 2, bgcolor: PURPLE_SOFT, textAlign: 'center' }}>
                                                <Typography sx={{ fontWeight: 800, color: PURPLE, fontSize: '1.1rem', lineHeight: 1 }}>
                                                    #{myParticipant.place}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600, mt: 0.4 }}>
                                                    место
                                                </Typography>
                                            </Box>
                                        )}
                                    </>
                                )}
                            </Paper>
                        </Reveal>
                    </Grid>

                    {/* ПРАВАЯ КОЛОНКА — ТАБЛИЦА УЧАСТНИКОВ */}
                    <Grid item xs={12} lg={8}>
                        <Reveal delay={0.15}>
                            <Paper sx={{
                                p: 3, borderRadius: 4, bgcolor: CARD,
                                border: `1px solid ${LINE}`,
                            }}>
                                <Box sx={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', mb: 2,
                                }}>
                                    <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1rem' }}>
                                        📊 Таблица участников
                                    </Typography>
                                    <Chip
                                        label={`${participants.length}`}
                                        size="small"
                                        sx={{
                                            bgcolor: PURPLE_SOFT, color: PURPLE,
                                            fontWeight: 700, fontSize: '0.72rem', height: 22,
                                        }}
                                    />
                                </Box>

                                {participants.length === 0 ? (
                                    <Box sx={{
                                        p: 4, borderRadius: 3, bgcolor: BG_ALT,
                                        textAlign: 'center', border: `1px dashed ${LINE}`,
                                    }}>
                                        <InfoIcon sx={{ fontSize: 40, color: INK_MUTED, mb: 1.5 }} />
                                        <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                                            Пока никто не участвует. Стань первым!
                                        </Typography>
                                    </Box>
                                ) : (
                                    <TableContainer sx={{
                                        borderRadius: 2, border: `1px solid ${LINE}`,
                                        maxHeight: 560, overflowY: 'auto',
                                        '&::-webkit-scrollbar': { width: 6 },
                                        '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                                    }}>
                                        <Table size="small" stickyHeader>
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{
                                                        bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                        color: INK_MUTED, textTransform: 'uppercase',
                                                        letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                        width: 40,
                                                    }}>
                                                        #
                                                    </TableCell>
                                                    <TableCell sx={{
                                                        bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                        color: INK_MUTED, textTransform: 'uppercase',
                                                        letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                    }}>
                                                        Ученик
                                                    </TableCell>
                                                    {[1, 2, 3, 4].map(n => (
                                                        <TableCell key={n} align="center" sx={{
                                                            bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                            color: INK_MUTED, textTransform: 'uppercase',
                                                            letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                            width: 70,
                                                        }}>
                                                            Р{n}
                                                        </TableCell>
                                                    ))}
                                                    <TableCell align="center" sx={{
                                                        bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                        color: INK_MUTED, textTransform: 'uppercase',
                                                        letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                        width: 90,
                                                    }}>
                                                        Прогресс
                                                    </TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {participants.map((p) => {
                                                    const isMe = p.student?.id === user?.id;
                                                    const medal = getMedalColor(p.place);
                                                    return (
                                                        <TableRow
                                                            key={p.id}
                                                            sx={{
                                                                bgcolor: isMe ? alpha(PURPLE, 0.06) : 'transparent',
                                                                '&:hover': { bgcolor: isMe ? alpha(PURPLE, 0.1) : BG_ALT },
                                                                '& td': { borderBottom: `1px solid ${LINE}` },
                                                            }}
                                                        >
                                                            <TableCell sx={{ py: 1.25 }}>
                                                                {medal ? (
                                                                    <MedalCell color={medal}>{p.place}</MedalCell>
                                                                ) : (
                                                                    <Typography sx={{
                                                                        fontSize: '0.82rem', fontWeight: 700,
                                                                        color: INK_MUTED, pl: 1,
                                                                    }}>
                                                                        {p.place ?? '—'}
                                                                    </Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell sx={{ py: 1.25 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <Avatar sx={{
                                                                        width: 28, height: 28,
                                                                        bgcolor: PURPLE_SOFT, color: PURPLE,
                                                                        fontSize: '0.7rem', fontWeight: 700,
                                                                    }}>
                                                                        {p.student?.fullName?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                                                                    </Avatar>
                                                                    <Typography sx={{
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: isMe ? 700 : 500,
                                                                        color: INK,
                                                                    }}>
                                                                        {p.student?.fullName || 'Ученик'}
                                                                        {isMe && (
                                                                            <Box component="span" sx={{
                                                                                ml: 0.75, fontSize: '0.7rem',
                                                                                color: PURPLE, fontWeight: 700,
                                                                            }}>
                                                                                (ты)
                                                                            </Box>
                                                                        )}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            {[p.round1Score, p.round2Score, p.round3Score, p.round4Score].map((score, i) => (
                                                                <TableCell key={i} align="center" sx={{ py: 1.25 }}>
                                                                    <Typography sx={{
                                                                        fontSize: '0.85rem',
                                                                        fontWeight: score != null ? 700 : 400,
                                                                        color: score != null ? INK : INK_MUTED,
                                                                    }}>
                                                                        {score ?? '—'}
                                                                    </Typography>
                                                                </TableCell>
                                                            ))}
                                                            <TableCell align="center" sx={{ py: 1.25 }}>
                                                                <Typography sx={{
                                                                    fontSize: '0.85rem', fontWeight: 800,
                                                                    color: p.averageProgress > 0 ? GREEN
                                                                        : p.averageProgress < 0 ? RED
                                                                        : INK_MUTED,
                                                                }}>
                                                                    {formatProgress(p.averageProgress)}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}

                                <Box sx={{
                                    mt: 2, p: 1.75, bgcolor: BLUE + '10',
                                    borderRadius: 2, border: `1px solid ${alpha(BLUE, 0.25)}`,
                                }}>
                                    <Typography sx={{ fontSize: '0.78rem', color: '#1E40AF', lineHeight: 1.55 }}>
                                        💡 Прогресс = <b>(балл − база) / (100 − база)</b>, усреднённый по всем 4 раундам.
                                        База — твой средний балл до турнира. Чем выше был уровень, тем дороже каждый новый балл.
                                    </Typography>
                                </Box>
                            </Paper>
                        </Reveal>
                    </Grid>
                </Grid>
            )}

            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {toast ? (
                    <Alert severity={toast.type} onClose={() => setToast(null)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {toast.message}
                    </Alert>
                ) : <div />}
            </Snackbar>
        </PageContainer>
    );
}

export default StudentTournament;