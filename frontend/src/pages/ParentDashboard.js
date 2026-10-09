// ========== frontend/src/pages/ParentDashboard.js (v9 — ДЗ таблицей, темы без обрезки) ==========
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Grid, Typography, Paper, Chip, CircularProgress, Alert,
    IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Avatar, Divider, Stack, FormControl, Select, MenuItem,
    Tooltip, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import {
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Close as CloseIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Assignment as AssignmentIcon,
    Info as InfoIcon,
    Videocam as VideocamIcon,
    ArrowBackIosNew as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardSmallIcon,
    MenuBook as BookIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import {
    format, isSameDay, addDays, startOfMonth, endOfMonth, addMonths, subMonths,
    getDay, isSameMonth, isToday,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { getLessonsByStudent } from '../services/api';
import { formatLessonTime } from '../utils/timezone';
import axiosInstance from '../api/axiosConfig';

// ========== ПАЛИТРА (как в StudentDashboard) ==========
const BG = '#FAFAFA';
const BG_ALT = '#F5F5F7';
const DARK = '#141414';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';

const LIME = '#C4F542';
const LIME_SOFT = '#EBFFB0';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const PINK = '#FF5FA2';
const PINK_SOFT = '#FFE0EE';
const GREEN = '#10B981';
const GREEN_SOFT = '#D9F5E0';
const AMBER = '#F59E0B';
const AMBER_SOFT = '#FFF3D6';
const BLUE = '#3B82F6';
const BLUE_SOFT = '#DBEAFE';
const RED = '#EF4444';
const RED_SOFT = '#FEE2E2';

// ========== АНИМАЦИИ ==========
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const PillButton = styled(Button)(({ $variant = 'dark' }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '9px 20px',
    borderRadius: 100,
    boxShadow: 'none',
    transition: 'all 0.2s ease',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    ...($variant === 'dark' && {
        background: DARK, color: '#FFF',
        '&:hover': { background: '#000', transform: 'translateY(-1px)' },
    }),
    ...($variant === 'ghost' && {
        background: 'transparent', color: INK, border: `1px solid ${LINE}`,
        '&:hover': { background: BG_ALT, borderColor: INK },
    }),
    ...($variant === 'purple' && {
        background: PURPLE, color: '#FFF',
        '&:hover': { background: '#6B4BEB', transform: 'translateY(-1px)' },
    }),
}));

const LessonStatusBadge = ({ status }) => {
    const config = {
        'SCHEDULED':   { label: 'Запланировано', color: PURPLE, bg: PURPLE_SOFT, icon: ScheduleIcon },
        'IN_PROGRESS': { label: 'Идёт сейчас',   color: GREEN,  bg: GREEN_SOFT,  icon: VideocamIcon },
        'COMPLETED':   { label: 'Проведено',     color: AMBER,  bg: AMBER_SOFT,  icon: CheckIcon },
        'PAID':        { label: 'Оплачено',      color: AMBER,  bg: AMBER_SOFT,  icon: CheckIcon },
        'CONFIRMED':   { label: 'Подтверждено',  color: GREEN,  bg: GREEN_SOFT,  icon: CheckIcon },
        'CANCELLED':   { label: 'Отменено',      color: RED,    bg: RED_SOFT,    icon: CancelIcon },
        'RESCHEDULED': { label: 'Перенесено',    color: PURPLE, bg: PURPLE_SOFT, icon: ScheduleIcon },
    };
    const cfg = config[status] || { label: status, color: INK_MUTED, bg: BG_ALT, icon: InfoIcon };
    const Icon = cfg.icon;
    return (
        <Chip
            icon={<Icon sx={{ fontSize: 12, color: `${cfg.color} !important` }} />}
            label={cfg.label}
            size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: '0.68rem', height: 22, borderRadius: 100 }}
        />
    );
};

// ========== КАЛЕНДАРЬ МЕСЯЦА ==========
function MonthCalendar({ month, setMonth, lessonsByDate, selectedDate, setSelectedDate, onDayClick }) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const startWeekday = (getDay(monthStart) + 6) % 7;
    const daysInMonth = monthEnd.getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

    const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <Paper sx={{ p: 2, borderRadius: 4, bgcolor: CARD, border: `1px solid ${LINE}`, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.95rem', textTransform: 'capitalize' }}>
                    {format(month, 'LLLL yyyy', { locale: ru })}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => setMonth(subMonths(month, 1))}
                        sx={{ border: `1px solid ${LINE}`, width: 26, height: 26 }}>
                        <ArrowBackIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                    <Button size="small"
                        onClick={() => { setMonth(new Date()); setSelectedDate(new Date()); }}
                        sx={{ border: `1px solid ${LINE}`, color: INK, px: 1, borderRadius: 2, fontSize: '0.68rem', fontWeight: 600, textTransform: 'none', minWidth: 0 }}>
                        Сегодня
                    </Button>
                    <IconButton size="small" onClick={() => setMonth(addMonths(month, 1))}
                        sx={{ border: `1px solid ${LINE}`, width: 26, height: 26 }}>
                        <ArrowForwardSmallIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                </Stack>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mb: 0.5 }}>
                {WEEKDAYS.map((d, i) => (
                    <Typography key={i} sx={{
                        textAlign: 'center', fontSize: '0.65rem', fontWeight: 600,
                        color: INK_MUTED, textTransform: 'uppercase', letterSpacing: '0.05em',
                    }}>
                        {d}
                    </Typography>
                ))}
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
                {cells.map((day, idx) => {
                    if (!day) return <Box key={idx} sx={{ height: 40 }} />;

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const hasLessons = (lessonsByDate[dateStr] || []).length > 0;
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, month);
                    const today = isToday(day);

                    return (
                        <Box
                            key={idx}
                            onClick={() => { setSelectedDate(day); if (typeof onDayClick === 'function') onDayClick(day); }}
                            sx={{
                                height: 40, borderRadius: 2, cursor: 'pointer',
                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                bgcolor: isSelected ? DARK : 'transparent',
                                color: isSelected ? '#FFF' : (isCurrentMonth ? INK : INK_MUTED),
                                border: today && !isSelected ? `1px solid ${PURPLE}` : '1px solid transparent',
                                transition: 'all 0.15s ease',
                                '&:hover': { bgcolor: isSelected ? DARK : BG_ALT },
                            }}
                        >
                            <Typography sx={{
                                fontSize: '0.82rem',
                                fontWeight: isSelected || today ? 700 : 500,
                                color: isSelected ? LIME : 'inherit', lineHeight: 1,
                            }}>
                                {format(day, 'd')}
                            </Typography>
                            {hasLessons && (
                                <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: isSelected ? LIME : PURPLE, mt: 0.4 }} />
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
}

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========
function ParentDashboard() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Родитель'; }, []);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [childrenList, setChildrenList] = useState([]);
    const [selectedChild, setSelectedChild] = useState('all');

    const [allLessons, setAllLessons] = useState([]);
    const [homeworkList, setHomeworkList] = useState([]);
    const [progressData, setProgressData] = useState(null);

    const [month, setMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [dayDialogOpen, setDayDialogOpen] = useState(false);

    useEffect(() => { if (user?.id) loadChildren(); }, [user]);
    useEffect(() => {
        if (selectedChild !== 'all') {
            fetchChildProgress(selectedChild);
            fetchHomework(selectedChild);
        } else {
            setProgressData(null);
            setHomeworkList([]);
        }
    }, [selectedChild]);

    const loadChildren = async () => {
        setLoading(true);
        try {
            const r = await axiosInstance.get(`/students/parent/${user.id}`);
            const fresh = (r.data || []).map(c => ({ id: c.id, fullName: c.fullName, email: c.email, grade: c.grade, school: c.school }));
            setChildrenList(fresh);
            if (fresh.length === 1) {
                setSelectedChild(fresh[0].id);
            } else if (fresh.length > 0) {
                setSelectedChild(fresh[0].id);
            }
            await fetchAllData(fresh);
        } catch (err) {
            setError('Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllData = async (children) => {
        try {
            let lessons = [];
            for (const c of children) {
                try {
                    const r = await getLessonsByStudent(c.id);
                    const arr = r.data !== undefined ? r.data : r;
                    lessons = [...lessons, ...arr.map(l => ({ ...l, childId: c.id, childName: c.fullName }))];
                } catch (err) {}
            }
            setAllLessons(lessons.sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate)));
        } catch (err) {}
    };

    const fetchChildProgress = async (childId) => {
        try {
            const r = await axiosInstance.get(`/homework/parent/child/${childId}/progress`);
            setProgressData(r.data);
        } catch (err) {}
    };

    const fetchHomework = async (childId) => {
        try {
            const r = await axiosInstance.get(`/homework/student/${childId}/all`);
            setHomeworkList(r.data || []);
        } catch (err) {
            setHomeworkList([]);
        }
    };

    const filteredLessons = useMemo(() => {
        if (selectedChild === 'all') return allLessons;
        return allLessons.filter(l => l.childId === parseInt(selectedChild));
    }, [allLessons, selectedChild]);

    const stats = useMemo(() => {
        const now = new Date();
        const nextLesson = filteredLessons
            .filter(l => {
                const end = new Date(`${l.lessonDate}T${l.endTime}Z`);
                const statusOk = ['SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS'].includes(l.status);
                return statusOk && end > now;
            })
            .sort((a, b) =>
                new Date(`${a.lessonDate}T${a.startTime}Z`) - new Date(`${b.lessonDate}T${b.startTime}Z`)
            )[0] || null;
        return { nextLesson };
    }, [filteredLessons]);

    const lessonsByDate = useMemo(() => {
        const map = {};
        filteredLessons.forEach(l => {
            if (!map[l.lessonDate]) map[l.lessonDate] = [];
            map[l.lessonDate].push(l);
        });
        return map;
    }, [filteredLessons]);

    const lessonsOnSelectedDate = useMemo(() => {
        return filteredLessons
            .filter(l => isSameDay(new Date(l.lessonDate), selectedDate))
            .sort((a, b) => a.startTime?.localeCompare(b.startTime));
    }, [filteredLessons, selectedDate]);

    // Пройденные темы (журнал)
    const journal = useMemo(() => {
        return filteredLessons
            .filter(l => ['COMPLETED', 'PAID', 'CONFIRMED'].includes(l.status))
            .filter(l => l.notes && l.notes.trim())
            .sort((a, b) =>
                new Date(`${b.lessonDate}T${b.startTime}Z`) - new Date(`${a.lessonDate}T${a.startTime}Z`)
            )
            .slice(0, 20);
    }, [filteredLessons]);

    // Домашки — сортируем: назначено / на проверке / проверено
    const sortedHomework = useMemo(() => {
        const order = { assigned: 0, submitted: 1, checked: 2 };
        return [...homeworkList].sort((a, b) => (order[a.status] ?? 99) - (order[b.status] ?? 99));
    }, [homeworkList]);

    const selectedChildName = selectedChild === 'all' ? null : childrenList.find(c => c.id === parseInt(selectedChild))?.fullName;
    const selectedChildData = selectedChild === 'all' ? null : childrenList.find(c => c.id === parseInt(selectedChild));

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', bgcolor: BG }}>
            <CircularProgress sx={{ color: PURPLE }} />
        </Box>
    );

    if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{
                bgcolor: BG, minHeight: '100vh', width: '100%',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
            }}>
                <Box sx={{
                    display: 'flex', gap: 2.5, p: { xs: 2, sm: 3 },
                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                    alignItems: 'flex-start',
                    width: '100%', boxSizing: 'border-box', maxWidth: '100%',
                }}>
                    {/* ===== ОСНОВНАЯ ЧАСТЬ ===== */}
                    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                        {/* ХЕДЕР */}
                        <Reveal>
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                flexWrap: 'wrap', gap: 2, mb: 3,
                            }}>
                                <Box>
                                    <Typography sx={{
                                        fontSize: { xs: '1.6rem', md: '2rem' },
                                        fontWeight: 800, letterSpacing: '-0.03em', color: INK,
                                    }}>
                                        Здравствуйте, {user?.fullName?.split(' ')[0] || 'родитель'} 👋
                                    </Typography>
                                    <Typography sx={{ color: INK_MUTED, fontSize: '0.95rem', mt: 0.5 }}>
                                        {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
                                    </Typography>
                                </Box>

                                {childrenList.length > 1 && (
                                    <FormControl size="small" sx={{ minWidth: 200 }}>
                                        <Select
                                            value={selectedChild}
                                            onChange={(e) => setSelectedChild(e.target.value)}
                                            sx={{
                                                borderRadius: 100, bgcolor: CARD,
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: LINE },
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            <MenuItem value="all">Все дети</MenuItem>
                                            {childrenList.map(c => (
                                                <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>
                        </Reveal>

                        {/* БЛИЖАЙШЕЕ ЗАНЯТИЕ + КАЛЕНДАРЬ */}
                        <Reveal delay={0.05}>
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={7}>
                                    <Paper sx={{
                                        p: { xs: 2.5, md: 3 }, borderRadius: 4,
                                        bgcolor: CARD, border: `2px solid ${PURPLE}`,
                                        height: '100%', position: 'relative', overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                    }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}>
                                            Ближайшее занятие
                                        </Typography>
                                        {stats.nextLesson ? (
                                            <>
                                                <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, color: INK, letterSpacing: '-0.02em', mb: 0.5 }}>
                                                    {format(new Date(stats.nextLesson.lessonDate), 'd MMMM', { locale: ru })}
                                                    {' · '}
                                                    {formatLessonTime(stats.nextLesson.lessonDate, stats.nextLesson.startTime)} — {formatLessonTime(stats.nextLesson.lessonDate, stats.nextLesson.endTime)}
                                                </Typography>
                                                <Typography sx={{ color: INK_SOFT, fontSize: '0.95rem', fontWeight: 500, mb: 2 }}>
                                                    {stats.nextLesson.course?.name || 'Занятие'} · {stats.nextLesson.tutor?.fullName}
                                                    {stats.nextLesson.childName && ` · ${stats.nextLesson.childName}`}
                                                </Typography>
                                            </>
                                        ) : (
                                            <>
                                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: INK_MUTED, mb: 0.5 }}>
                                                    Пока ничего не запланировано
                                                </Typography>
                                                <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                                                    Как только репетитор назначит занятие, оно появится здесь
                                                </Typography>
                                            </>
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <MonthCalendar
                                        month={month}
                                        setMonth={setMonth}
                                        lessonsByDate={lessonsByDate}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        onDayClick={() => setDayDialogOpen(true)}
                                    />
                                </Grid>
                            </Grid>
                        </Reveal>

                        {/* ДОМАШНИЕ РАБОТЫ + ПРОЙДЕННЫЕ ТЕМЫ */}
                        <Reveal delay={0.1}>
                            <Paper sx={{ borderRadius: 4, bgcolor: CARD, border: `1px solid ${LINE}`, p: 3, mb: 3 }}>
                                <Grid container spacing={3}>

                                    {/* ДОМАШНИЕ РАБОТЫ — ТАБЛИЦА */}
                                    <Grid item xs={12} lg={6}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography sx={{ fontWeight: 800, color: INK, fontSize: '0.95rem' }}>
                                                📝 Домашние работы
                                            </Typography>
                                            <Chip
                                                label={`${sortedHomework.length}`}
                                                size="small"
                                                sx={{ bgcolor: PINK_SOFT, color: PINK, fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                                            />
                                        </Box>

                                        {sortedHomework.length === 0 ? (
                                            <Box sx={{ p: 3, borderRadius: 2, bgcolor: BG_ALT, textAlign: 'center', border: `1px dashed ${LINE}` }}>
                                                <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem' }}>
                                                    Нет заданий
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <TableContainer sx={{
                                                borderRadius: 2,
                                                border: `1px solid ${LINE}`,
                                                maxHeight: 480,
                                                overflowY: 'auto',
                                                '&::-webkit-scrollbar': { width: 6 },
                                                '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                                            }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{
                                                                bgcolor: BG_ALT, fontWeight: 800,
                                                                fontSize: '0.68rem', color: INK_MUTED,
                                                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                                                borderBottom: `1px solid ${LINE}`,
                                                            }}>
                                                                Задание
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                bgcolor: BG_ALT, fontWeight: 800,
                                                                fontSize: '0.68rem', color: INK_MUTED,
                                                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                                                borderBottom: `1px solid ${LINE}`,
                                                                width: 90,
                                                            }}>
                                                                Срок
                                                            </TableCell>
                                                            <TableCell sx={{
                                                                bgcolor: BG_ALT, fontWeight: 800,
                                                                fontSize: '0.68rem', color: INK_MUTED,
                                                                textTransform: 'uppercase', letterSpacing: '0.04em',
                                                                borderBottom: `1px solid ${LINE}`,
                                                                width: 110,
                                                            }}>
                                                                Статус
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {sortedHomework.map(hw => {
                                                            const isChecked = hw.status === 'checked';
                                                            const isSubmitted = hw.status === 'submitted';
                                                            const statusLabel = isChecked ? 'Проверено' : isSubmitted ? 'На проверке' : 'Назначено';
                                                            const statusColor = isChecked ? GREEN : isSubmitted ? AMBER : PURPLE;
                                                            const gradeDisplay = isChecked && hw.grade != null
                                                                ? (hw.gradeType === 'GRADE_100' ? `${hw.grade}/100`
                                                                    : hw.gradeType === 'GRADE_10' ? `${hw.grade}/10`
                                                                    : `${hw.grade}/5`)
                                                                : null;

                                                            const taskText = hw.variantTitle || hw.task || 'Задание';

                                                            return (
                                                                <TableRow
                                                                    key={hw.id}
                                                                    sx={{
                                                                        '&:hover': { bgcolor: BG_ALT },
                                                                        '& td': { borderBottom: `1px solid ${LINE}` },
                                                                    }}
                                                                >
                                                                    <TableCell sx={{ py: 1.5, verticalAlign: 'top' }}>
                                                                        <Typography sx={{
                                                                            fontSize: '0.82rem',
                                                                            color: INK,
                                                                            fontWeight: 500,
                                                                            lineHeight: 1.4,
                                                                            wordBreak: 'break-word',
                                                                            whiteSpace: 'pre-wrap',
                                                                        }}>
                                                                            {taskText}
                                                                        </Typography>
                                                                        {isChecked && hw.feedback && (
                                                                            <Typography sx={{
                                                                                fontSize: '0.72rem',
                                                                                color: INK_SOFT,
                                                                                fontStyle: 'italic',
                                                                                mt: 0.5,
                                                                                lineHeight: 1.4,
                                                                                wordBreak: 'break-word',
                                                                                whiteSpace: 'pre-wrap',
                                                                            }}>
                                                                                💬 {hw.feedback}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ py: 1.5, verticalAlign: 'top' }}>
                                                                        <Typography sx={{ fontSize: '0.78rem', color: INK_MUTED, whiteSpace: 'nowrap' }}>
                                                                            {hw.dueDate ? format(new Date(hw.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                                        </Typography>
                                                                    </TableCell>
                                                                    <TableCell sx={{ py: 1.5, verticalAlign: 'top' }}>
                                                                        <Stack spacing={0.5} alignItems="flex-start">
                                                                            <Chip
                                                                                label={statusLabel}
                                                                                size="small"
                                                                                sx={{
                                                                                    fontSize: '0.62rem',
                                                                                    height: 20,
                                                                                    bgcolor: `${statusColor}20`,
                                                                                    color: statusColor,
                                                                                    fontWeight: 700,
                                                                                    borderRadius: 100,
                                                                                }}
                                                                            />
                                                                            {gradeDisplay && (
                                                                                <Chip
                                                                                    label={gradeDisplay}
                                                                                    size="small"
                                                                                    sx={{
                                                                                        fontSize: '0.62rem',
                                                                                        height: 20,
                                                                                        bgcolor: GREEN,
                                                                                        color: '#FFF',
                                                                                        fontWeight: 800,
                                                                                        borderRadius: 100,
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </Stack>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        )}
                                    </Grid>

                                    {/* ПРОЙДЕННЫЕ ТЕМЫ — КАРТОЧКИ БЕЗ ОБРЕЗКИ */}
                                    <Grid item xs={12} lg={6}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                            <Typography sx={{ fontWeight: 800, color: INK, fontSize: '0.95rem' }}>
                                                📖 Пройденные темы
                                            </Typography>
                                            <Chip
                                                label={`${journal.length}`}
                                                size="small"
                                                sx={{ bgcolor: GREEN_SOFT, color: GREEN, fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                                            />
                                        </Box>

                                        {journal.length === 0 ? (
                                            <Box sx={{ p: 3, borderRadius: 2, bgcolor: BG_ALT, textAlign: 'center', border: `1px dashed ${LINE}` }}>
                                                <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem' }}>
                                                    Пока нет проведённых уроков
                                                </Typography>
                                            </Box>
                                        ) : (
                                            <Stack spacing={1.25} sx={{
                                                maxHeight: 480,
                                                overflowY: 'auto',
                                                pr: 0.5,
                                                '&::-webkit-scrollbar': { width: 6 },
                                                '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                                            }}>
                                                {journal.map(lesson => (
                                                    <Box
                                                        key={lesson.id}
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 1.5,
                                                            alignItems: 'flex-start',
                                                            p: 1.75,
                                                            borderRadius: 2,
                                                            bgcolor: BG_ALT,
                                                            borderLeft: `3px solid ${GREEN}`,
                                                        }}
                                                    >
                                                        <Box sx={{
                                                            width: 22, height: 22, borderRadius: '50%',
                                                            bgcolor: GREEN, color: '#FFF',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.72rem', fontWeight: 900, flexShrink: 0, mt: 0.15,
                                                        }}>✓</Box>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: INK }}>
                                                                {lesson.course?.name || 'Занятие'} · {format(new Date(lesson.lessonDate), 'd MMM', { locale: ru })}
                                                            </Typography>
                                                            <Typography sx={{
                                                                color: INK_SOFT,
                                                                fontSize: '0.82rem',
                                                                mt: 0.5,
                                                                lineHeight: 1.55,
                                                                whiteSpace: 'pre-wrap',
                                                                wordBreak: 'break-word',
                                                            }}>
                                                                {lesson.notes}
                                                            </Typography>
                                                            {lesson.nextLessonPlan && (
                                                                <Box sx={{
                                                                    mt: 1, pt: 1,
                                                                    borderTop: `1px dashed ${LINE}`,
                                                                }}>
                                                                    <Typography sx={{
                                                                        fontSize: '0.68rem',
                                                                        color: AMBER,
                                                                        fontWeight: 800,
                                                                        textTransform: 'uppercase',
                                                                        letterSpacing: '0.04em',
                                                                        mb: 0.3,
                                                                    }}>
                                                                        Задано
                                                                    </Typography>
                                                                    <Typography sx={{
                                                                        fontSize: '0.8rem',
                                                                        color: INK_SOFT,
                                                                        lineHeight: 1.5,
                                                                        whiteSpace: 'pre-wrap',
                                                                        wordBreak: 'break-word',
                                                                    }}>
                                                                        {lesson.nextLessonPlan}
                                                                    </Typography>
                                                                </Box>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Reveal>

                        {/* ЗАНЯТИЯ НА ВЫБРАННУЮ ДАТУ (если открыт день) */}
                        {dayDialogOpen && (
                            <Reveal delay={0.15}>
                                <Paper sx={{ borderRadius: 4, bgcolor: CARD, border: `1px solid ${LINE}`, p: 3, mb: 3 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1rem' }}>
                                            📅 {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                                        </Typography>
                                        <IconButton size="small" onClick={() => setDayDialogOpen(false)}>
                                            <CloseIcon fontSize="small" />
                                        </IconButton>
                                    </Box>
                                    {lessonsOnSelectedDate.length === 0 ? (
                                        <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem' }}>
                                            Нет занятий на эту дату
                                        </Typography>
                                    ) : (
                                        <Stack spacing={1.5}>
                                            {lessonsOnSelectedDate.map(lesson => (
                                                <Box key={lesson.id} sx={{
                                                    p: 2, borderRadius: 2, bgcolor: BG_ALT,
                                                    borderLeft: `4px solid ${lesson.status === 'CANCELLED' ? RED : ['COMPLETED', 'PAID', 'CONFIRMED'].includes(lesson.status) ? GREEN : PURPLE}`,
                                                }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                                                        <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.95rem' }}>
                                                            {formatLessonTime(lesson.lessonDate, lesson.startTime)} — {formatLessonTime(lesson.lessonDate, lesson.endTime)}
                                                        </Typography>
                                                        <LessonStatusBadge status={lesson.status} />
                                                    </Box>
                                                    <Typography sx={{ color: INK_SOFT, fontSize: '0.85rem' }}>
                                                        {lesson.childName} · {lesson.course?.name || 'Занятие'} · {lesson.tutor?.fullName}
                                                    </Typography>
                                                    {lesson.notes && (
                                                        <Box sx={{ mt: 1, p: 1.5, bgcolor: GREEN_SOFT, borderRadius: 2, borderLeft: `3px solid ${GREEN}` }}>
                                                            <Typography sx={{ color: '#065F46', fontWeight: 700, fontSize: '0.65rem', textTransform: 'uppercase', mb: 0.3 }}>
                                                                ✅ Что прошли
                                                            </Typography>
                                                            <Typography sx={{ color: INK, fontSize: '0.85rem', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                                                                {lesson.notes}
                                                            </Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            ))}
                                        </Stack>
                                    )}
                                </Paper>
                            </Reveal>
                        )}
                    </Box>

                    {/* ===== ПРАВАЯ КОЛОНКА: ПРОФИЛЬ + СТАТИСТИКА ===== */}
                    <Box sx={{
                        flex: { lg: '0 0 320px', xs: '1 1 100%' },
                        width: { lg: 320, xs: '100%' },
                        maxWidth: '100%',
                        minWidth: 0,
                    }}>
                        {selectedChildData && (
                            <Reveal delay={0.15}>
                                <Paper sx={{
                                    p: 3, borderRadius: 4, bgcolor: CARD,
                                    border: `1px solid ${LINE}`, mb: 2.5,
                                }}>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                                        <Avatar sx={{
                                            width: 96, height: 96,
                                            bgcolor: PURPLE_SOFT, color: PURPLE,
                                            fontWeight: 800, fontSize: '2rem',
                                            border: `3px solid ${LIME}`,
                                        }}>
                                            {selectedChildData.fullName?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                                        </Avatar>
                                        <Typography sx={{ mt: 2, fontWeight: 800, fontSize: '1.15rem', color: INK, textAlign: 'center' }}>
                                            {selectedChildData.fullName}
                                        </Typography>
                                        {(selectedChildData.grade || selectedChildData.school) && (
                                            <Typography sx={{ color: INK_MUTED, fontSize: '0.82rem', mt: 0.5, textAlign: 'center' }}>
                                                {[selectedChildData.grade && `${selectedChildData.grade} класс`, selectedChildData.school].filter(Boolean).join(' · ')}
                                            </Typography>
                                        )}
                                    </Box>

                                    <Divider sx={{ my: 2, borderColor: LINE }} />

                                    {/* Мини-статистика */}
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.25 }}>
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: GREEN_SOFT, textAlign: 'center' }}>
                                            <Typography sx={{ fontWeight: 800, color: GREEN, fontSize: '1.3rem', lineHeight: 1 }}>
                                                {filteredLessons.filter(l => ['COMPLETED', 'PAID', 'CONFIRMED'].includes(l.status)).length}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600, mt: 0.4 }}>
                                                уроков
                                            </Typography>
                                        </Box>
                                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: AMBER_SOFT, textAlign: 'center' }}>
                                            <Typography sx={{ fontWeight: 800, color: AMBER, fontSize: '1.3rem', lineHeight: 1 }}>
                                                {progressData?.detailedStats?.averageGrade != null ? `${progressData.detailedStats.averageGrade}` : '—'}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600, mt: 0.4 }}>
                                                средн. балл
                                            </Typography>
                                        </Box>
                                    </Box>

                                    {/* Успеваемость */}
                                    {progressData?.detailedStats?.averagePercentage != null && (
                                        <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, bgcolor: PURPLE_SOFT, textAlign: 'center' }}>
                                            <Typography sx={{ fontWeight: 800, color: PURPLE, fontSize: '1.3rem', lineHeight: 1 }}>
                                                {Math.round(progressData.detailedStats.averagePercentage)}%
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600, mt: 0.4 }}>
                                                успеваемость
                                            </Typography>
                                        </Box>
                                    )}
                                </Paper>
                            </Reveal>
                        )}
                    </Box>
                </Box>
            </Box>
        </LocalizationProvider>
    );
}

export default ParentDashboard;