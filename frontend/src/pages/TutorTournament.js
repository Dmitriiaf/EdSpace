// frontend/src/pages/TutorTournament.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Button, Alert, Stack, Avatar, Snackbar, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, IconButton, Tooltip, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { styled, keyframes, alpha } from '@mui/material/styles';
import {
    Add as AddIcon,
    EmojiEvents as TrophyIcon,
    Refresh as RefreshIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    PersonAdd as ApproveIcon,
    HourglassEmpty as PendingIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
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

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const MedalCell = styled(Box)(({ color }) => ({
    width: 28, height: 28, borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: color, color: '#FFF',
    fontWeight: 800, fontSize: '0.85rem',
    boxShadow: `0 2px 6px ${color}40`,
}));

const EditableScoreCell = styled(TableCell)({
    padding: '6px 4px',
    textAlign: 'center',
    '& input': {
        width: '100%',
        maxWidth: 60,
        padding: '6px 8px',
        fontSize: '0.85rem',
        fontWeight: 700,
        textAlign: 'center',
        border: `1px solid ${LINE}`,
        borderRadius: 8,
        backgroundColor: '#FFF',
        color: '#141414',
        outline: 'none',
        transition: 'all 0.15s ease',
        fontFamily: 'inherit',
        '&:focus': {
            borderColor: PURPLE,
            boxShadow: `0 0 0 3px ${alpha(PURPLE, 0.15)}`,
        },
        '&:hover': {
            borderColor: INK_MUTED,
        },
    },
});

function TutorTournament() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Турниры'; }, []);

    const [loading, setLoading] = useState(true);
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournamentId, setSelectedTournamentId] = useState(null);
    const [tournament, setTournament] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [toast, setToast] = useState(null);

    // Форма редактирования баллов
    const [editingScores, setEditingScores] = useState({}); // { participantId: {base, r1, r2, r3, r4} }
    const [savingId, setSavingId] = useState(null);

    // Диалог создания
    const [openCreate, setOpenCreate] = useState(false);
    const [newTournament, setNewTournament] = useState({
        name: '',
        startDate: '',
        endDate: '',
    });

    // ========== ЗАГРУЗКА ==========
    const loadTournaments = useCallback(async () => {
        try {
            const res = await axiosInstance.get('/tournaments/all');
            const list = res.data || [];
            setTournaments(list);
            if (list.length > 0 && !selectedTournamentId) {
                // Выбираем активный, если есть; иначе первый
                const active = list.find(t => t.status === 'ACTIVE') || list[0];
                setSelectedTournamentId(active.id);
            }
        } catch (err) {
            console.error(err);
        }
    }, [selectedTournamentId]);

    const loadTournamentDetail = useCallback(async (id) => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/tournaments/${id}`);
            setTournament(res.data?.tournament);
            setParticipants(res.data?.participants || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadTournaments(); }, []);
    useEffect(() => {
        if (selectedTournamentId) loadTournamentDetail(selectedTournamentId);
    }, [selectedTournamentId]);

    // ========== СОЗДАНИЕ ==========
    const handleCreate = async () => {
        if (!newTournament.name || !newTournament.startDate || !newTournament.endDate) {
            setToast({ type: 'error', message: 'Заполни все поля' });
            return;
        }
        try {
            const res = await axiosInstance.post('/tournaments', newTournament);
            setToast({ type: 'success', message: 'Турнир создан!' });
            setOpenCreate(false);
            setNewTournament({ name: '', startDate: '', endDate: '' });
            await loadTournaments();
            setSelectedTournamentId(res.data.id);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка' });
        }
    };

    // ========== РЕДАКТИРОВАНИЕ БАЛЛОВ ==========
    const startEditing = (p) => {
        setEditingScores(prev => ({
            ...prev,
            [p.id]: {
                baseScore: p.baseScore ?? '',
                round1Score: p.round1Score ?? '',
                round2Score: p.round2Score ?? '',
                round3Score: p.round3Score ?? '',
                round4Score: p.round4Score ?? '',
            }
        }));
    };

    const cancelEditing = (participantId) => {
        setEditingScores(prev => {
            const copy = { ...prev };
            delete copy[participantId];
            return copy;
        });
    };

    const updateField = (participantId, field, value) => {
        setEditingScores(prev => ({
            ...prev,
            [participantId]: {
                ...prev[participantId],
                [field]: value,
            }
        }));
    };

    const saveScores = async (participantId) => {
        setSavingId(participantId);
        try {
            const scores = editingScores[participantId];
            const payload = {};
            ['baseScore', 'round1Score', 'round2Score', 'round3Score', 'round4Score'].forEach(k => {
                const v = scores[k];
                payload[k] = (v === '' || v === null || v === undefined) ? null : parseInt(v, 10);
            });

            await axiosInstance.patch(`/tournaments/participants/${participantId}`, payload);

            setToast({ type: 'success', message: 'Баллы сохранены' });
            cancelEditing(participantId);
            await loadTournamentDetail(selectedTournamentId);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка сохранения' });
        } finally {
            setSavingId(null);
        }
    };

    // ========== ДОПУСК / ОТКЛОНЕНИЕ ==========
    const handleApprove = async (participantId, approved) => {
        try {
            await axiosInstance.patch(`/tournaments/participants/${participantId}/approve`, { approved });
            setToast({ type: 'success', message: approved ? 'Участник допущен' : 'Участник отклонён' });
            await loadTournamentDetail(selectedTournamentId);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка' });
        }
    };

    const handleRemove = async (participantId, name) => {
        if (!window.confirm(`Удалить ${name} из турнира?`)) return;
        try {
            await axiosInstance.delete(`/tournaments/participants/${participantId}`);
            setToast({ type: 'success', message: 'Участник удалён' });
            await loadTournamentDetail(selectedTournamentId);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка' });
        }
    };

    // ========== ЗАВЕРШИТЬ ТУРНИР ==========
    const handleFinish = async () => {
        if (!window.confirm('Завершить турнир? Он станет неактивным.')) return;
        try {
            await axiosInstance.patch(`/tournaments/${selectedTournamentId}`, { status: 'FINISHED' });
            setToast({ type: 'success', message: 'Турнир завершён' });
            await loadTournaments();
            await loadTournamentDetail(selectedTournamentId);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка' });
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

    const pendingParticipants = participants.filter(p => p.status === 'PENDING');
    const approvedParticipants = participants.filter(p => p.status === 'APPROVED');
    const rejectedParticipants = participants.filter(p => p.status === 'REJECTED');

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
                            🏆 Турниры
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                            Управление марафонами по пробникам
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={1.5}>
                        <StyledButton
                            variant="outlined"
                            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                            onClick={() => loadTournamentDetail(selectedTournamentId)}
                            sx={{ color: INK_SOFT, borderColor: LINE, borderRadius: '10px' }}
                        >
                            Обновить
                        </StyledButton>
                        <StyledButton
                            variant="contained"
                            startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                            onClick={() => setOpenCreate(true)}
                            sx={{
                                bgcolor: PURPLE, borderRadius: '10px',
                                '&:hover': { bgcolor: '#6B4BEB' },
                            }}
                        >
                            Создать турнир
                        </StyledButton>
                    </Stack>
                </Box>
            </Reveal>

            {/* СПИСОК ТУРНИРОВ */}
            {tournaments.length > 1 && (
                <Reveal delay={0.05}>
                    <Paper sx={{
                        p: 2, borderRadius: 3, bgcolor: CARD,
                        border: `1px solid ${LINE}`, mb: 2.5,
                    }}>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {tournaments.map(t => (
                                <Chip
                                    key={t.id}
                                    label={`${t.name} · ${t.status}`}
                                    onClick={() => setSelectedTournamentId(t.id)}
                                    sx={{
                                        bgcolor: t.id === selectedTournamentId ? PURPLE : BG_ALT,
                                        color: t.id === selectedTournamentId ? '#FFF' : INK_SOFT,
                                        fontWeight: 700, fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        '&:hover': {
                                            bgcolor: t.id === selectedTournamentId ? '#6B4BEB' : '#EBEBEF',
                                        },
                                    }}
                                />
                            ))}
                        </Stack>
                    </Paper>
                </Reveal>
            )}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                    <CircularProgress sx={{ color: PURPLE }} />
                </Box>
            ) : !tournament ? (
                <Paper sx={{
                    p: 6, borderRadius: 4, bgcolor: CARD,
                    border: `1px dashed ${LINE}`, textAlign: 'center',
                }}>
                    <TrophyIcon sx={{ fontSize: 56, color: INK_MUTED, mb: 2 }} />
                    <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: INK, mb: 1 }}>
                        Пока нет турниров
                    </Typography>
                    <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem', mb: 3 }}>
                        Создай первый турнир — ученики увидят его на своей странице
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                        sx={{ bgcolor: PURPLE, borderRadius: '10px', textTransform: 'none', fontWeight: 700 }}
                    >
                        Создать турнир
                    </Button>
                </Paper>
            ) : (
                <>
                    {/* ИНФО О ТУРНИРЕ */}
                    <Reveal delay={0.05}>
                        <Paper sx={{
                            p: 3, borderRadius: 4, bgcolor: CARD,
                            border: `2px solid ${PURPLE}`, mb: 2.5,
                            display: 'flex', justifyContent: 'space-between',
                            alignItems: 'center', flexWrap: 'wrap', gap: 2,
                        }}>
                            <Box>
                                <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color: INK, mb: 0.5 }}>
                                    {tournament.name}
                                </Typography>
                                <Stack direction="row" spacing={2} flexWrap="wrap">
                                    <Typography sx={{ fontSize: '0.82rem', color: INK_MUTED }}>
                                        📅 {format(new Date(tournament.startDate), 'd MMM', { locale: ru })} — {format(new Date(tournament.endDate), 'd MMM yyyy', { locale: ru })}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.82rem', color: INK_MUTED }}>
                                        👥 {approvedParticipants.length} участников · {pendingParticipants.length} заявок
                                    </Typography>
                                </Stack>
                            </Box>
                            <Stack direction="row" spacing={1.5}>
                                <Chip
                                    label={tournament.status === 'ACTIVE' ? '● Активен' : '✓ Завершён'}
                                    sx={{
                                        bgcolor: tournament.status === 'ACTIVE' ? GREEN_SOFT : BG_ALT,
                                        color: tournament.status === 'ACTIVE' ? GREEN : INK_MUTED,
                                        fontWeight: 700, fontSize: '0.8rem',
                                    }}
                                />
                                {tournament.status === 'ACTIVE' && (
                                    <Button
                                        size="small"
                                        onClick={handleFinish}
                                        sx={{
                                            textTransform: 'none', fontWeight: 700,
                                            color: AMBER, fontSize: '0.8rem',
                                            '&:hover': { bgcolor: AMBER_SOFT },
                                        }}
                                    >
                                        Завершить
                                    </Button>
                                )}
                            </Stack>
                        </Paper>
                    </Reveal>

                    {/* ЗАЯВКИ НА ДОПУСК */}
                    {pendingParticipants.length > 0 && (
                        <Reveal delay={0.1}>
                            <Paper sx={{
                                p: 3, borderRadius: 4, bgcolor: CARD,
                                border: `1px solid ${AMBER}`, mb: 2.5,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    <PendingIcon sx={{ color: AMBER }} />
                                    <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1rem' }}>
                                        Заявки на участие ({pendingParticipants.length})
                                    </Typography>
                                </Box>
                                <Stack spacing={1.5}>
                                    {pendingParticipants.map(p => (
                                        <Box key={p.id} sx={{
                                            p: 2, borderRadius: 2, bgcolor: AMBER_SOFT,
                                            display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', gap: 2, flexWrap: 'wrap',
                                        }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{
                                                    width: 36, height: 36,
                                                    bgcolor: '#FFF', color: AMBER,
                                                    fontWeight: 700, fontSize: '0.85rem',
                                                }}>
                                                    {p.student?.fullName?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.9rem' }}>
                                                        {p.student?.fullName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '0.75rem', color: '#92400E' }}>
                                                        Заявка от {format(new Date(p.joinedAt), 'd MMM, HH:mm', { locale: ru })}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Stack direction="row" spacing={1}>
                                                <Button
                                                    size="small"
                                                    startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleApprove(p.id, true)}
                                                    sx={{
                                                        bgcolor: GREEN, color: '#FFF',
                                                        borderRadius: 2, textTransform: 'none',
                                                        fontWeight: 700, fontSize: '0.78rem',
                                                        '&:hover': { bgcolor: '#059669' },
                                                    }}
                                                >
                                                    Допустить
                                                </Button>
                                                <Button
                                                    size="small"
                                                    startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => handleApprove(p.id, false)}
                                                    sx={{
                                                        bgcolor: '#FFF', color: RED,
                                                        borderRadius: 2, textTransform: 'none',
                                                        fontWeight: 700, fontSize: '0.78rem',
                                                        border: `1px solid ${RED}`,
                                                        '&:hover': { bgcolor: RED_SOFT },
                                                    }}
                                                >
                                                    Отклонить
                                                </Button>
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            </Paper>
                        </Reveal>
                    )}

                    {/* ТАБЛИЦА УЧАСТНИКОВ — РЕДАКТИРУЕМАЯ */}
                    <Reveal delay={0.15}>
                        <Paper sx={{
                            p: 3, borderRadius: 4, bgcolor: CARD,
                            border: `1px solid ${LINE}`,
                        }}>
                            <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1rem', mb: 2 }}>
                                📊 Участники ({approvedParticipants.length})
                            </Typography>

                            {approvedParticipants.length === 0 ? (
                                <Box sx={{
                                    p: 4, borderRadius: 3, bgcolor: BG_ALT,
                                    textAlign: 'center', border: `1px dashed ${LINE}`,
                                }}>
                                    <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                                        Пока нет допущенных участников
                                    </Typography>
                                </Box>
                            ) : (
                                <TableContainer sx={{
                                    borderRadius: 2, border: `1px solid ${LINE}`,
                                    '&::-webkit-scrollbar': { width: 6 },
                                    '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                                }}>
                                    <Table size="small">
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
                                                <TableCell align="center" sx={{
                                                    bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                    color: INK_MUTED, textTransform: 'uppercase',
                                                    letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                    width: 90,
                                                }}>
                                                    База
                                                </TableCell>
                                                {[1, 2, 3, 4].map(n => (
                                                    <TableCell key={n} align="center" sx={{
                                                        bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                        color: INK_MUTED, textTransform: 'uppercase',
                                                        letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                        width: 80,
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
                                                <TableCell align="center" sx={{
                                                    bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.68rem',
                                                    color: INK_MUTED, textTransform: 'uppercase',
                                                    letterSpacing: '0.04em', borderBottom: `1px solid ${LINE}`,
                                                    width: 150,
                                                }}>
                                                    Действия
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {approvedParticipants.map(p => {
                                                const isEditing = !!editingScores[p.id];
                                                const medal = getMedalColor(p.place);
                                                const editData = editingScores[p.id] || {};
                                                return (
                                                    <TableRow
                                                        key={p.id}
                                                        sx={{
                                                            '&:hover': { bgcolor: BG_ALT },
                                                            '& td': { borderBottom: `1px solid ${LINE}` },
                                                        }}
                                                    >
                                                        <TableCell>
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
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Avatar sx={{
                                                                    width: 28, height: 28,
                                                                    bgcolor: PURPLE_SOFT, color: PURPLE,
                                                                    fontSize: '0.7rem', fontWeight: 700,
                                                                }}>
                                                                    {p.student?.fullName?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                                                                </Avatar>
                                                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: INK }}>
                                                                    {p.student?.fullName || 'Ученик'}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <EditableScoreCell>
                                                            <input
                                                                type="number"
                                                                min="0"
                                                                max="100"
                                                                disabled={!isEditing}
                                                                value={isEditing ? editData.baseScore : (p.baseScore ?? '')}
                                                                onChange={(e) => updateField(p.id, 'baseScore', e.target.value)}
                                                                placeholder="—"
                                                                style={{
                                                                    backgroundColor: isEditing ? '#FFF' : '#F5F5F7',
                                                                }}
                                                            />
                                                        </EditableScoreCell>
                                                        {[1, 2, 3, 4].map(n => {
                                                            const field = `round${n}Score`;
                                                            return (
                                                                <EditableScoreCell key={n}>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        disabled={!isEditing}
                                                                        value={isEditing ? editData[field] : (p[field] ?? '')}
                                                                        onChange={(e) => updateField(p.id, field, e.target.value)}
                                                                        placeholder="—"
                                                                        style={{
                                                                            backgroundColor: isEditing ? '#FFF' : '#F5F5F7',
                                                                        }}
                                                                    />
                                                                </EditableScoreCell>
                                                            );
                                                        })}
                                                        <TableCell align="center">
                                                            <Typography sx={{
                                                                fontSize: '0.85rem', fontWeight: 800,
                                                                color: p.averageProgress > 0 ? GREEN
                                                                    : p.averageProgress < 0 ? RED
                                                                    : INK_MUTED,
                                                            }}>
                                                                {formatProgress(p.averageProgress)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            <Stack direction="row" spacing={0.5} justifyContent="center">
                                                                {!isEditing ? (
                                                                    <Tooltip title="Редактировать баллы">
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => startEditing(p)}
                                                                            sx={{ color: PURPLE }}
                                                                        >
                                                                            <EditIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                ) : (
                                                                    <>
                                                                        <Tooltip title="Сохранить">
                                                                            <IconButton
                                                                                size="small"
                                                                                disabled={savingId === p.id}
                                                                                onClick={() => saveScores(p.id)}
                                                                                sx={{ color: GREEN }}
                                                                            >
                                                                                <SaveIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Отмена">
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={() => cancelEditing(p.id)}
                                                                                sx={{ color: INK_MUTED }}
                                                                            >
                                                                                <CloseIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                )}
                                                                <Tooltip title="Удалить из турнира">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => handleRemove(p.id, p.student?.fullName)}
                                                                        sx={{ color: INK_MUTED, '&:hover': { color: RED } }}
                                                                    >
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Stack>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                            {/* Отклонённые */}
                            {rejectedParticipants.length > 0 && (
                                <>
                                    <Divider sx={{ my: 3, borderColor: LINE }} />
                                    <Typography sx={{
                                        fontWeight: 700, color: INK_MUTED,
                                        fontSize: '0.85rem', mb: 1.5,
                                    }}>
                                        Отклонённые ({rejectedParticipants.length})
                                    </Typography>
                                    <Stack spacing={1}>
                                        {rejectedParticipants.map(p => (
                                            <Box key={p.id} sx={{
                                                p: 1.5, borderRadius: 2, bgcolor: BG_ALT,
                                                display: 'flex', justifyContent: 'space-between',
                                                alignItems: 'center',
                                            }}>
                                                <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT }}>
                                                    {p.student?.fullName}
                                                </Typography>
                                                <Button
                                                    size="small"
                                                    onClick={() => handleApprove(p.id, true)}
                                                    sx={{
                                                        textTransform: 'none', fontSize: '0.75rem',
                                                        color: GREEN,
                                                    }}
                                                >
                                                    Восстановить
                                                </Button>
                                            </Box>
                                        ))}
                                    </Stack>
                                </>
                            )}
                        </Paper>
                    </Reveal>
                </>
            )}

            {/* ДИАЛОГ СОЗДАНИЯ */}
            <StyledDialog
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <DialogTitle sx={{
                    px: 3, pt: 3, pb: 2,
                    background: `linear-gradient(135deg, ${PURPLE} 0%, #4F46E5 100%)`,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <TrophyIcon sx={{ color: '#FFF' }} />
                    </Avatar>
                    <Typography sx={{ fontSize: '1.1rem', color: '#FFF', fontWeight: 800, flex: 1 }}>
                        Новый турнир
                    </Typography>
                    <IconButton onClick={() => setOpenCreate(false)} size="small" sx={{ color: '#FFF' }}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ px: 3, pt: 3 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            fullWidth
                            label="Название турнира"
                            value={newTournament.name}
                            onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                            placeholder="Например: Октябрьский марафон по информатике"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                                fullWidth
                                label="Дата начала"
                                type="date"
                                value={newTournament.startDate}
                                onChange={(e) => setNewTournament({ ...newTournament, startDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                            <TextField
                                fullWidth
                                label="Дата окончания"
                                type="date"
                                value={newTournament.endDate}
                                onChange={(e) => setNewTournament({ ...newTournament, endDate: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            />
                        </Stack>
                        <Box sx={{
                            p: 2, bgcolor: '#EFF6FF',
                            borderRadius: 2, border: `1px solid ${alpha('#3B82F6', 0.25)}`,
                        }}>
                            <Typography sx={{ fontSize: '0.8rem', color: '#1E40AF', lineHeight: 1.55 }}>
                                💡 После создания турнира ученики смогут записаться на странице «Бонусы».
                                Ты подтверждаешь участие вручную — и выставляешь баллы за 4 раунда.
                            </Typography>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3, pt: 2, gap: 1 }}>
                    <StyledButton onClick={() => setOpenCreate(false)} sx={{ color: INK_SOFT }}>
                        Отмена
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        onClick={handleCreate}
                        disabled={!newTournament.name || !newTournament.startDate || !newTournament.endDate}
                        sx={{
                            bgcolor: PURPLE, borderRadius: '10px',
                            textTransform: 'none', fontWeight: 700,
                            '&:hover': { bgcolor: '#6B4BEB' },
                            '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                        }}
                    >
                        Создать турнир
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

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

export default TutorTournament;