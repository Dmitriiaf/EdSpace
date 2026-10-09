// frontend/src/pages/TutorEgeChecklist.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Alert, Stack, LinearProgress, Divider, Tooltip,
    TextField, IconButton, Avatar, Snackbar, Collapse, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Add as AddIcon,
    Save as SaveIcon,
    Close as CloseIcon,
    EmojiEvents as TrophyIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Person as PersonIcon,
    Lock as LockIcon,
    ListAlt as ListIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import TutorEgeRatingContent from '../components/TutorEgeRatingContent';

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

const TaskRow = styled(Box)(({ knows, difficulty }) => {
    const bgcolor = knows ? GREEN_SOFT : '#F9FAFB';
    const accent = knows ? GREEN
        : difficulty === 'EASY' ? '#94A3B8'
        : difficulty === 'MEDIUM' ? AMBER
        : RED;
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor,
        border: `1px solid ${knows ? alpha(GREEN, 0.3) : LINE}`,
        borderLeft: `4px solid ${accent}`,
        transition: 'all 0.15s ease',
    };
});

const StudentRow = styled(TableRow)(({ hasChecklist, expanded }) => ({
    cursor: 'pointer',
    backgroundColor: expanded ? alpha(PURPLE, 0.04) : (hasChecklist ? '#FFFFFF' : '#FAFAFA'),
    transition: 'background-color 0.15s',
    '&:hover': {
        backgroundColor: expanded ? alpha(PURPLE, 0.08) : BG_ALT,
    },
    '& td': {
        borderBottom: `1px solid ${LINE}`,
        padding: '14px 16px',
    },
}));

const DIFFICULTY_LABELS = {
    EASY: { label: 'Лёгкое', color: '#94A3B8', bg: '#F1F5F9' },
    MEDIUM: { label: 'Среднее', color: AMBER, bg: AMBER_SOFT },
    HARD: { label: 'Сложное', color: RED, bg: RED_SOFT },
};

const SOLUTION_LABELS = {
    MANUAL: 'Ручное',
    PROGRAMMING: 'Прога',
    LIBREOFFICE: 'LibreOffice',
    BOTH: 'Прога/ручное',
};

function TutorEgeChecklist() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — ЕГЭ Чек-листы'; }, []);

    const [activeTab, setActiveTab] = useState(0);

    const [loading, setLoading] = useState(true);
    const [data, setData] = useState([]); // [{ student, checklist, items, stats }, ...]
    const [expandedId, setExpandedId] = useState(null);
    const [toast, setToast] = useState(null);

    // Редактирование заметок
    const [editingItemId, setEditingItemId] = useState(null);
    const [editingNote, setEditingNote] = useState('');
    const [savingItemId, setSavingItemId] = useState(null);

    // Создание чек-листа
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [pendingStudent, setPendingStudent] = useState(null);
    const [creating, setCreating] = useState(false);

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/ege-checklist/tutor/${user.id}/all`);
            setData(res.data || []);
        } catch (err) {
            setToast({ type: 'error', message: 'Ошибка загрузки' });
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { loadAll(); }, [loadAll]);

    // ========== РАСКРЫТИЕ ==========
    const toggleExpand = (studentId) => {
        setExpandedId(prev => prev === studentId ? null : studentId);
    };

    // ========== ПЕРЕХОД ИЗ РЕЙТИНГА В ЧЕК-ЛИСТ ==========
    const handleStudentClickFromRating = (studentId) => {
        setActiveTab(0);
        // Небольшая задержка, чтобы вкладка успела отрисоваться
        setTimeout(() => {
            const row = data.find(r => r.student.id === studentId);
            if (row && row.checklist) {
                setExpandedId(studentId);
                // Скроллим к строке
                const el = document.getElementById(`student-row-${studentId}`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }, 100);
    };

    // ========== СОЗДАНИЕ ==========
    const openCreate = (student, e) => {
        e.stopPropagation();
        setPendingStudent(student);
        setOpenCreateDialog(true);
    };

    const handleCreate = async () => {
        if (!pendingStudent) return;
        setCreating(true);
        try {
            await axiosInstance.post(`/ege-checklist/student/${pendingStudent.id}`);
            setToast({ type: 'success', message: 'Чек-лист создан' });
            setOpenCreateDialog(false);
            setPendingStudent(null);
            await loadAll();
            // Автоматически раскрываем созданный чек-лист
            setExpandedId(pendingStudent.id);
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка создания' });
        } finally {
            setCreating(false);
        }
    };

    // ========== УДАЛЕНИЕ ==========
    const handleDelete = async (checklistId, studentName, e) => {
        e.stopPropagation();
        if (!window.confirm(`Удалить чек-лист у ${studentName}? Вся история прогресса будет потеряна.`)) return;
        try {
            await axiosInstance.delete(`/ege-checklist/${checklistId}`);
            setToast({ type: 'success', message: 'Чек-лист удалён' });
            await loadAll();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка' });
        }
    };

    // ========== ГАЛОЧКА ==========
    const toggleKnows = async (studentId, item, e) => {
        e.stopPropagation();
        setSavingItemId(item.id);
        try {
            const res = await axiosInstance.patch(`/ege-checklist/item/${item.id}`, {
                knows: !item.knows,
            });
            setData(prev => prev.map(row =>
                row.student.id === studentId
                    ? { ...row, items: res.data.items, stats: res.data.stats }
                    : row
            ));
        } catch (err) {
            setToast({ type: 'error', message: 'Ошибка сохранения' });
        } finally {
            setSavingItemId(null);
        }
    };

    // ========== ЗАМЕТКА ==========
    const startEditNote = (item, e) => {
        e.stopPropagation();
        setEditingItemId(item.id);
        setEditingNote(item.note || '');
    };

    const cancelEditNote = (e) => {
        if (e) e.stopPropagation();
        setEditingItemId(null);
        setEditingNote('');
    };

    const saveNote = async (studentId, itemId, e) => {
        if (e) e.stopPropagation();
        setSavingItemId(itemId);
        try {
            const res = await axiosInstance.patch(`/ege-checklist/item/${itemId}`, {
                note: editingNote,
            });
            setData(prev => prev.map(row =>
                row.student.id === studentId
                    ? { ...row, items: res.data.items, stats: res.data.stats }
                    : row
            ));
            cancelEditNote();
        } catch (err) {
            setToast({ type: 'error', message: 'Ошибка сохранения заметки' });
        } finally {
            setSavingItemId(null);
        }
    };

    // ========== ХЕЛПЕРЫ ==========
    const getScoreColor = (score) => {
        if (score >= 80) return GREEN;
        if (score >= 60) return AMBER;
        if (score >= 40) return '#3B82F6';
        return RED;
    };

    const renderMiniProgressBar = (known, total, color) => {
        const percent = total > 0 ? (known / total) * 100 : 0;
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                <Box sx={{ flex: 1 }}>
                    <LinearProgress
                        variant="determinate"
                        value={percent}
                        sx={{
                            height: 6, borderRadius: 3, bgcolor: BG_ALT,
                            '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 3 },
                        }}
                    />
                </Box>
                <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: INK, whiteSpace: 'nowrap' }}>
                    {known}/{total}
                </Typography>
            </Box>
        );
    };

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
                            fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                            color: INK, letterSpacing: '-0.02em', mb: 0.5,
                        }}>
                            🎯 ЕГЭ
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                            {activeTab === 0
                                ? 'Прогресс всех учеников по 27 заданиям'
                                : 'Рейтинг учеников по среднему баллу за пробники'}
                        </Typography>
                    </Box>
                    <StyledButton
                        variant="outlined"
                        startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                        onClick={loadAll}
                        sx={{
                            color: INK_SOFT, borderColor: LINE, borderRadius: '10px',
                            '&:hover': { bgcolor: BG_ALT, borderColor: INK_MUTED },
                        }}
                    >
                        Обновить
                    </StyledButton>
                </Box>
            </Reveal>

            {/* ВКЛАДКИ */}
            <Reveal delay={0.03}>
                <Paper sx={{
                    borderRadius: 3, border: `1px solid ${LINE}`,
                    bgcolor: CARD, overflow: 'hidden', mb: 3,
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, v) => setActiveTab(v)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                minHeight: 56,
                                color: INK_MUTED,
                                '&.Mui-selected': { color: PURPLE },
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: PURPLE,
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                            },
                        }}
                    >
                        <Tab
                            icon={<ListIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="📋 Чек-листы"
                        />
                        <Tab
                            icon={<TrophyIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="🏆 Рейтинг ЕГЭ"
                        />
                    </Tabs>
                </Paper>
            </Reveal>

            {/* ========== ВКЛАДКА 1 — ЧЕК-ЛИСТЫ ========== */}
            {activeTab === 0 && (
                <>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress sx={{ color: PURPLE }} />
                        </Box>
                    ) : data.length === 0 ? (
                        <Reveal delay={0.05}>
                            <Paper sx={{
                                p: 6, borderRadius: 4, bgcolor: CARD,
                                border: `1px dashed ${LINE}`, textAlign: 'center',
                            }}>
                                <PersonIcon sx={{ fontSize: 56, color: INK_MUTED, mb: 2 }} />
                                <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: INK, mb: 1 }}>
                                    Учеников пока нет
                                </Typography>
                                <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                                    Добавь учеников в разделе «Мои ученики» — они появятся здесь
                                </Typography>
                            </Paper>
                        </Reveal>
                    ) : (
                        <Reveal delay={0.05}>
                            <Paper sx={{
                                borderRadius: 4, bgcolor: CARD,
                                border: `1px solid ${LINE}`, overflow: 'hidden',
                            }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ backgroundColor: BG_ALT }}>
                                                <TableCell sx={{
                                                    fontWeight: 800, fontSize: '0.72rem', color: INK_MUTED,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    borderBottom: `1px solid ${LINE}`,
                                                }}>
                                                    Ученик
                                                </TableCell>
                                                <TableCell sx={{
                                                    fontWeight: 800, fontSize: '0.72rem', color: INK_MUTED,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    borderBottom: `1px solid ${LINE}`, width: 160,
                                                }}>
                                                    Прогресс
                                                </TableCell>
                                                <TableCell sx={{
                                                    fontWeight: 800, fontSize: '0.72rem', color: INK_MUTED,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    borderBottom: `1px solid ${LINE}`, width: 120,
                                                    textAlign: 'center',
                                                }}>
                                                    Балл
                                                </TableCell>
                                                <TableCell sx={{
                                                    fontWeight: 800, fontSize: '0.72rem', color: INK_MUTED,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    borderBottom: `1px solid ${LINE}`, width: 200,
                                                }}>
                                                    По сложности
                                                </TableCell>
                                                <TableCell sx={{
                                                    fontWeight: 800, fontSize: '0.72rem', color: INK_MUTED,
                                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                                    borderBottom: `1px solid ${LINE}`, width: 140,
                                                    textAlign: 'right',
                                                }}>
                                                    Действия
                                                </TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {data.map(row => {
                                                const { student, checklist, items, stats } = row;
                                                const hasChecklist = !!checklist;
                                                const isExpanded = expandedId === student.id;
                                                const score = stats?.estimatedScore || 0;
                                                const scoreColor = getScoreColor(score);

                                                return (
                                                    <React.Fragment key={student.id}>
                                                        <StudentRow
                                                            id={`student-row-${student.id}`}
                                                            hasChecklist={hasChecklist}
                                                            expanded={isExpanded}
                                                            onClick={() => hasChecklist && toggleExpand(student.id)}
                                                        >
                                                            <TableCell>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                    <Avatar sx={{
                                                                        width: 36, height: 36,
                                                                        bgcolor: hasChecklist ? PURPLE_SOFT : BG_ALT,
                                                                        color: hasChecklist ? PURPLE : INK_MUTED,
                                                                        fontWeight: 700, fontSize: '0.85rem',
                                                                    }}>
                                                                        {student.fullName?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                                                                    </Avatar>
                                                                    <Box>
                                                                        <Typography sx={{
                                                                            fontWeight: 700, fontSize: '0.92rem', color: INK,
                                                                        }}>
                                                                            {student.fullName}
                                                                        </Typography>
                                                                        {student.grade && (
                                                                            <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED }}>
                                                                                {student.grade} класс
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                </Box>
                                                            </TableCell>

                                                            <TableCell>
                                                                {hasChecklist && stats ? (
                                                                    renderMiniProgressBar(stats.knownTasks, stats.totalTasks, scoreColor)
                                                                ) : (
                                                                    <Typography sx={{ fontSize: '0.8rem', color: INK_MUTED, fontStyle: 'italic' }}>
                                                                        —
                                                                    </Typography>
                                                                )}
                                                            </TableCell>

                                                            <TableCell align="center">
                                                                {hasChecklist && stats ? (
                                                                    <Chip
                                                                        label={score}
                                                                        size="small"
                                                                        sx={{
                                                                            bgcolor: alpha(scoreColor, 0.12),
                                                                            color: scoreColor,
                                                                            fontWeight: 800, fontSize: '0.9rem',
                                                                            height: 28, borderRadius: 2,
                                                                            minWidth: 52,
                                                                        }}
                                                                    />
                                                                ) : (
                                                                    <Typography sx={{ fontSize: '0.8rem', color: INK_MUTED }}>
                                                                        —
                                                                    </Typography>
                                                                )}
                                                            </TableCell>

                                                            <TableCell>
                                                                {hasChecklist && stats?.byDifficulty ? (
                                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                        <Chip
                                                                            label={`🟢 ${stats.byDifficulty.easy.known}/${stats.byDifficulty.easy.total}`}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: '#F1F5F9', color: '#475569',
                                                                                fontWeight: 700, fontSize: '0.7rem',
                                                                                height: 22, borderRadius: 100,
                                                                            }}
                                                                        />
                                                                        <Chip
                                                                            label={`🟡 ${stats.byDifficulty.medium.known}/${stats.byDifficulty.medium.total}`}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: AMBER_SOFT, color: '#92400E',
                                                                                fontWeight: 700, fontSize: '0.7rem',
                                                                                height: 22, borderRadius: 100,
                                                                            }}
                                                                        />
                                                                        <Chip
                                                                            label={`🔴 ${stats.byDifficulty.hard.known}/${stats.byDifficulty.hard.total}`}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: RED_SOFT, color: '#991B1B',
                                                                                fontWeight: 700, fontSize: '0.7rem',
                                                                                height: 22, borderRadius: 100,
                                                                            }}
                                                                        />
                                                                    </Box>
                                                                ) : (
                                                                    <Typography sx={{ fontSize: '0.8rem', color: INK_MUTED }}>
                                                                        —
                                                                    </Typography>
                                                                )}
                                                            </TableCell>

                                                            <TableCell align="right">
                                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
                                                                    {!hasChecklist ? (
                                                                        <StyledButton
                                                                            size="small"
                                                                            variant="contained"
                                                                            startIcon={<AddIcon sx={{ fontSize: 14 }} />}
                                                                            onClick={(e) => openCreate(student, e)}
                                                                            sx={{
                                                                                bgcolor: PURPLE, borderRadius: 2,
                                                                                textTransform: 'none', fontWeight: 700,
                                                                                fontSize: '0.75rem', px: 1.5, py: 0.5,
                                                                                '&:hover': { bgcolor: '#6B4BEB' },
                                                                            }}
                                                                        >
                                                                            Создать
                                                                        </StyledButton>
                                                                    ) : (
                                                                        <>
                                                                            <IconButton
                                                                                size="small"
                                                                                onClick={(e) => handleDelete(checklist.id, student.fullName, e)}
                                                                                sx={{ color: INK_MUTED, '&:hover': { color: RED } }}
                                                                            >
                                                                                <DeleteIcon fontSize="small" />
                                                                            </IconButton>
                                                                            <IconButton size="small" sx={{ color: PURPLE }}>
                                                                                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                                            </IconButton>
                                                                        </>
                                                                    )}
                                                                </Stack>
                                                            </TableCell>
                                                        </StudentRow>

                                                        {/* РАСКРЫВАЮЩИЙСЯ СПИСОК 27 ЗАДАНИЙ */}
                                                        {hasChecklist && (
                                                            <TableRow>
                                                                <TableCell colSpan={5} sx={{ p: 0, borderBottom: isExpanded ? `1px solid ${LINE}` : 'none' }}>
                                                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                                                        <Box sx={{
                                                                            p: 3,
                                                                            bgcolor: alpha(PURPLE, 0.02),
                                                                            borderTop: `1px dashed ${LINE}`,
                                                                        }}>
                                                                            <Box sx={{
                                                                                mb: 2.5,
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 2,
                                                                                flexWrap: 'wrap',
                                                                                p: 2,
                                                                                bgcolor: '#FFF',
                                                                                borderRadius: 2,
                                                                                border: `1px solid ${LINE}`,
                                                                            }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                                    <TrophyIcon sx={{ color: scoreColor, fontSize: 20 }} />
                                                                                    <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT }}>
                                                                                        Балл:
                                                                                    </Typography>
                                                                                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: scoreColor }}>
                                                                                        {score}
                                                                                    </Typography>
                                                                                </Box>
                                                                                <Divider orientation="vertical" flexItem sx={{ borderColor: LINE }} />
                                                                                <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT }}>
                                                                                    Решено: <b style={{ color: INK }}>{stats?.knownTasks}</b> из {stats?.totalTasks}
                                                                                </Typography>
                                                                                {stats?.unknownNumbers?.length > 0 && (
                                                                                    <>
                                                                                        <Divider orientation="vertical" flexItem sx={{ borderColor: LINE }} />
                                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                                            <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT }}>
                                                                                                Осталось:
                                                                                            </Typography>
                                                                                            {stats.unknownNumbers.slice(0, 10).map(num => (
                                                                                                <Chip
                                                                                                    key={num}
                                                                                                    label={`№${num}`}
                                                                                                    size="small"
                                                                                                    sx={{
                                                                                                        bgcolor: BG_ALT, color: INK_SOFT,
                                                                                                        fontWeight: 700, fontSize: '0.68rem',
                                                                                                        height: 20, borderRadius: 100,
                                                                                                    }}
                                                                                                />
                                                                                            ))}
                                                                                            {stats.unknownNumbers.length > 10 && (
                                                                                                <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED }}>
                                                                                                    +{stats.unknownNumbers.length - 10}
                                                                                                </Typography>
                                                                                            )}
                                                                                        </Box>
                                                                                    </>
                                                                                )}
                                                                            </Box>

                                                                            <Stack spacing={1.25}>
                                                                                {items.map(item => {
                                                                                    const diffCfg = DIFFICULTY_LABELS[item.difficulty] || DIFFICULTY_LABELS.EASY;
                                                                                    const isEditingThis = editingItemId === item.id;
                                                                                    const isSaving = savingItemId === item.id;

                                                                                    return (
                                                                                        <TaskRow
                                                                                            key={item.id}
                                                                                            knows={item.knows}
                                                                                            difficulty={item.difficulty}
                                                                                            onClick={(e) => e.stopPropagation()}
                                                                                        >
                                                                                            <IconButton
                                                                                                onClick={(e) => toggleKnows(student.id, item, e)}
                                                                                                disabled={isSaving}
                                                                                                sx={{
                                                                                                    width: 40, height: 40, flexShrink: 0,
                                                                                                    bgcolor: item.knows ? GREEN : 'transparent',
                                                                                                    color: item.knows ? '#FFF' : INK_MUTED,
                                                                                                    border: item.knows ? 'none' : `2px solid ${LINE}`,
                                                                                                    '&:hover': {
                                                                                                        bgcolor: item.knows ? '#059669' : BG_ALT,
                                                                                                    },
                                                                                                }}
                                                                                            >
                                                                                                {item.knows
                                                                                                    ? <CheckIcon sx={{ fontSize: 22 }} />
                                                                                                    : <Typography sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{item.taskNumber}</Typography>
                                                                                                }
                                                                                            </IconButton>

                                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                                                                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: INK }}>
                                                                                                        №{item.taskNumber}
                                                                                                    </Typography>
                                                                                                    <Chip
                                                                                                        label={diffCfg.label}
                                                                                                        size="small"
                                                                                                        sx={{
                                                                                                            bgcolor: diffCfg.bg, color: diffCfg.color,
                                                                                                            fontWeight: 700, fontSize: '0.65rem',
                                                                                                            height: 18, borderRadius: 100,
                                                                                                        }}
                                                                                                    />
                                                                                                    <Chip
                                                                                                        label={SOLUTION_LABELS[item.solutionType] || item.solutionType}
                                                                                                        size="small"
                                                                                                        sx={{
                                                                                                            bgcolor: BG_ALT, color: INK_SOFT,
                                                                                                            fontWeight: 600, fontSize: '0.65rem',
                                                                                                            height: 18, borderRadius: 100,
                                                                                                        }}
                                                                                                    />
                                                                                                    <Typography sx={{ fontSize: '0.8rem', color: INK_SOFT }}>
                                                                                                        {item.topic}
                                                                                                    </Typography>
                                                                                                </Box>

                                                                                                {isEditingThis ? (
                                                                                                    <Box
                                                                                                        sx={{ display: 'flex', gap: 0.5, mt: 0.75, alignItems: 'center' }}
                                                                                                        onClick={(e) => e.stopPropagation()}
                                                                                                    >
                                                                                                        <TextField
                                                                                                            size="small"
                                                                                                            fullWidth
                                                                                                            placeholder="Заметка (что подтянуть и т.д.)"
                                                                                                            value={editingNote}
                                                                                                            onChange={(e) => setEditingNote(e.target.value)}
                                                                                                            onKeyDown={(e) => {
                                                                                                                if (e.key === 'Enter') saveNote(student.id, item.id, e);
                                                                                                                if (e.key === 'Escape') cancelEditNote(e);
                                                                                                            }}
                                                                                                            autoFocus
                                                                                                            sx={{
                                                                                                                '& .MuiOutlinedInput-root': {
                                                                                                                    borderRadius: 2, fontSize: '0.82rem',
                                                                                                                    bgcolor: '#FFF',
                                                                                                                },
                                                                                                            }}
                                                                                                        />
                                                                                                        <IconButton
                                                                                                            size="small"
                                                                                                            onClick={(e) => saveNote(student.id, item.id, e)}
                                                                                                            disabled={isSaving}
                                                                                                            sx={{ color: GREEN }}
                                                                                                        >
                                                                                                            <SaveIcon fontSize="small" />
                                                                                                        </IconButton>
                                                                                                        <IconButton
                                                                                                            size="small"
                                                                                                            onClick={(e) => cancelEditNote(e)}
                                                                                                            sx={{ color: INK_MUTED }}
                                                                                                        >
                                                                                                            <CloseIcon fontSize="small" />
                                                                                                        </IconButton>
                                                                                                    </Box>
                                                                                                ) : (
                                                                                                    <Box
                                                                                                        onClick={(e) => startEditNote(item, e)}
                                                                                                        sx={{
                                                                                                            mt: 0.5, p: 0.75, borderRadius: 1.5,
                                                                                                            cursor: 'pointer',
                                                                                                            transition: 'all 0.15s',
                                                                                                            '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
                                                                                                        }}
                                                                                                    >
                                                                                                        {item.note ? (
                                                                                                            <Typography sx={{
                                                                                                                fontSize: '0.78rem', color: INK_SOFT,
                                                                                                                fontStyle: 'italic', lineHeight: 1.4,
                                                                                                            }}>
                                                                                                                💬 {item.note}
                                                                                                            </Typography>
                                                                                                        ) : (
                                                                                                            <Typography sx={{
                                                                                                                fontSize: '0.75rem', color: INK_MUTED,
                                                                                                                fontStyle: 'italic',
                                                                                                            }}>
                                                                                                                + добавить заметку
                                                                                                            </Typography>
                                                                                                        )}
                                                                                                    </Box>
                                                                                                )}
                                                                                            </Box>
                                                                                        </TaskRow>
                                                                                    );
                                                                                })}
                                                                            </Stack>
                                                                        </Box>
                                                                    </Collapse>
                                                                </TableCell>
                                                            </TableRow>
                                                        )}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        </Reveal>
                    )}
                </>
            )}

            {/* ========== ВКЛАДКА 2 — РЕЙТИНГ ЕГЭ ========== */}
            {activeTab === 1 && (
                <TutorEgeRatingContent onStudentClick={handleStudentClickFromRating} />
            )}

            {/* ДИАЛОГ СОЗДАНИЯ */}
            <StyledDialog
                open={openCreateDialog}
                onClose={() => { setOpenCreateDialog(false); setPendingStudent(null); }}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
            >
                <Box sx={{
                    px: 3, pt: 3, pb: 2,
                    background: `linear-gradient(135deg, ${PURPLE} 0%, #4F46E5 100%)`,
                    display: 'flex', alignItems: 'center', gap: 1.5,
                }}>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
                        <TrophyIcon sx={{ color: '#FFF' }} />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.06em' }}>
                            ЕГЭ ПО ИНФОРМАТИКЕ
                        </Typography>
                        <Typography sx={{ fontSize: '1.05rem', color: '#FFF', fontWeight: 800 }}>
                            Создать чек-лист
                        </Typography>
                    </Box>
                    <IconButton onClick={() => { setOpenCreateDialog(false); setPendingStudent(null); }} sx={{ color: '#FFF' }} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>
                <Box sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: '0.9rem', color: INK_SOFT, lineHeight: 1.6, mb: 2 }}>
                        Будет создан чек-лист для ученика <b>{pendingStudent?.fullName}</b> —
                        <b> 27 заданий ЕГЭ по информатике</b> с уровнями сложности и типами решения.
                    </Typography>
                    <Typography sx={{ fontSize: '0.85rem', color: INK_MUTED, lineHeight: 1.6 }}>
                        Ты сможешь отмечать, какие задания ученик уже освоил, и добавлять заметки. Ученик будет видеть свой прогресс.
                    </Typography>
                </Box>
                <Box sx={{ px: 3, pb: 3, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                    <StyledButton
                        onClick={() => { setOpenCreateDialog(false); setPendingStudent(null); }}
                        sx={{ color: INK_SOFT }}
                    >
                        Отмена
                    </StyledButton>
                    <StyledButton
                        variant="contained"
                        onClick={handleCreate}
                        disabled={creating}
                        sx={{
                            bgcolor: PURPLE, borderRadius: '10px',
                            textTransform: 'none', fontWeight: 700,
                            '&:hover': { bgcolor: '#6B4BEB' },
                        }}
                    >
                        {creating ? 'Создаём…' : 'Создать чек-лист'}
                    </StyledButton>
                </Box>
            </StyledDialog>

            <Snackbar
                open={!!toast}
                autoHideDuration={2500}
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

export default TutorEgeChecklist;