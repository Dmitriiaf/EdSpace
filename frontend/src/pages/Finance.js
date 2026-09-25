// ========== frontend/src/pages/Finance.js (v4 — сводная таблица, флоу Б) ==========
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Paper, Grid, Card, CardContent, Button,
    Alert, CircularProgress, Chip, IconButton, Tooltip, Menu,
    MenuItem, Fade, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Avatar, Divider,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, List, ListItem,
    ListItemText, ListItemButton, Radio
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Payments as PaymentsIcon,
    CardGiftcard as CardGiftcardIcon,
    School as SchoolIcon,
    CalendarToday as CalendarIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreVertIcon,
    TrendingUp as TrendingUpIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckIcon,
    EventBusy as CancelIcon,
    SwapHoriz as RescheduleIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import axiosInstance from '../services/api';

// ========== СТИЛИ ==========
const GlassPageContainer = styled(Box)(({ theme }) => ({
    background: 'radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
    minHeight: '100vh',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
}));

const GlassHero = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.9) 0%, rgba(16, 185, 129, 0.85) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '28px',
    padding: theme.spacing(4),
    color: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 25px 40px -12px rgba(79, 70, 229, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: theme.spacing(3),
}));

const GlassStatCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    padding: theme.spacing(2.5),
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.25)',
}));

const BentoCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    padding: theme.spacing(3),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
}));

const StyledTableRow = styled(TableRow)({
    '&:nth-of-type(even)': { backgroundColor: 'rgba(249, 250, 251, 0.5)' },
    '&:hover': { backgroundColor: 'rgba(238, 242, 255, 0.6) !important' },
});

const GlassButton = styled(Button)({
    borderRadius: '40px',
    padding: '8px 20px',
    background: 'rgba(255, 255, 255, 0.9)',
    color: '#4F46E5',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': { background: '#FFFFFF', boxShadow: '0 8px 20px rgba(79, 70, 229, 0.15)' },
});

// ========== УТИЛИТЫ ==========
function getAvatarColor(name) {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#3B82F6'];
    let hash = 0;
    const str = name || '?';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}
function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Finance({ tutorIdOverride }) {
    const { user } = useAuth();
    const effectiveUserId = tutorIdOverride || user?.id;
    const { getStudentRateForTutor } = useStudentRate();

    useEffect(() => { document.title = 'EdSpace — Финансы'; }, []);

    const [month, setMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);
    const [subscriptions, setSubscriptions] = useState({}); // studentId -> subscription
    const [payments, setPayments] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // меню действий
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [menuStudent, setMenuStudent] = useState(null);

    // диалоги
    const [subscriptionDialog, setSubscriptionDialog] = useState({ open: false, mode: 'create', subscription: null });
    const [subscriptionForm, setSubscriptionForm] = useState({ lessonsCount: 8, price: 14400, debtLessons: 0 });
    const [rescheduleDialog, setRescheduleDialog] = useState({ open: false, student: null });
    const [cancelDialog, setCancelDialog] = useState({ open: false, student: null });
    const [lessonPickerDialog, setLessonPickerDialog] = useState({ open: false, type: null, student: null });
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [rescheduleForm, setRescheduleForm] = useState({ newDate: '', newStartTime: '11:00', newEndTime: '12:00' });
    const [cancelForm, setCancelForm] = useState({ reason: '' });

    // ========== ЗАГРУЗКА ==========
    useEffect(() => {
        if (user && effectiveUserId) fetchData();
        // eslint-disable-next-line
    }, [user, effectiveUserId, month]);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [studentsRes, paymentsRes, lessonsRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${effectiveUserId}`),
                axiosInstance.get(`/payments/tutor/${effectiveUserId}`),
                axiosInstance.get(`/lessons/all?tutorId=${effectiveUserId}`)
            ]);

            const studentsList = studentsRes.data || [];
            const paymentsList = paymentsRes.data || [];
            const lessonsList = lessonsRes.data || [];

            setStudents(studentsList);
            setPayments(paymentsList);
            setLessons(lessonsList);

            // Загружаем абонементы для каждого ученика на абонементе
            const subsMap = {};
            const subStudents = studentsList.filter(s => s.paymentType === 'subscription');
            await Promise.all(subStudents.map(async (s) => {
                try {
                    const res = await axiosInstance.get(`/subscriptions/student/${s.id}`);
                    const subs = res.data || [];
                    // Выбираем приоритетный: ACTIVE > PENDING > последний
                    const sorted = subs.sort((a, b) => b.id - a.id);
                    const preferred = sorted.find(x => x.status === 'ACTIVE')
                        || sorted.find(x => x.status === 'PENDING')
                        || sorted[0];
                    if (preferred) subsMap[s.id] = preferred;
                } catch (e) {
                    console.warn(`Не удалось загрузить абонемент ученика ${s.id}:`, e?.message);
                }
            }));
            setSubscriptions(subsMap);

        } catch (err) {
            console.error('Ошибка загрузки финансов:', err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity = 'success') =>
        setSnackbar({ open: true, message, severity });

    // ========== РАСЧЁТ СТРОК ==========
    const rows = useMemo(() => {
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);

        return students.map(s => {
            const rate = getStudentRateForTutor(s, effectiveUserId) || 0;
            const sub = subscriptions[s.id];
            const isSubscription = s.paymentType === 'subscription';

            // Уроки ученика в выбранном месяце
            const studentLessons = lessons.filter(l => {
                if (l.student?.id !== s.id) return false;
                if (!l.lessonDate) return false;
                try {
                    const d = parseISO(l.lessonDate);
                    return isWithinInterval(d, { start: mStart, end: mEnd });
                } catch { return false; }
            });

            const completedLessons = studentLessons.filter(l =>
                l.status === 'COMPLETED' || l.status === 'PAID').length;
            const cancelledLessons = studentLessons.filter(l =>
                l.status === 'CANCELLED').length;

            let totalLessons, usedLessons, missedLessons, remaining, paidAmount;

            if (isSubscription && sub) {
                totalLessons = sub.lessonsCount || 0;
                usedLessons = sub.lessonsUsed || 0;
                missedLessons = sub.debtLessons || 0;
                remaining = Math.max(0, totalLessons - usedLessons);
                paidAmount = (sub.status === 'ACTIVE' || sub.status === 'PAID')
                    ? (sub.price || 0)
                    : 0;
            } else {
                totalLessons = studentLessons.filter(l => l.status !== 'CANCELLED').length;
                usedLessons = completedLessons;
                missedLessons = cancelledLessons;
                remaining = null;

                paidAmount = payments
                    .filter(p => p.student?.id === s.id
                        && (p.status === 'PAID' || p.status === 'CONFIRMED')
                        && p.paymentDate)
                    .filter(p => {
                        try {
                            const d = parseISO(p.paymentDate);
                            return isWithinInterval(d, { start: mStart, end: mEnd });
                        } catch { return false; }
                    })
                    .reduce((sum, p) => sum + (p.amount || 0), 0);
            }

            return {
                student: s,
                rate,
                isSubscription,
                subscription: sub,
                totalLessons,
                paidAmount,
                usedLessons,
                missedLessons,
                remaining,
            };
        });
    }, [students, subscriptions, payments, lessons, month, effectiveUserId, getStudentRateForTutor]);

    // ========== KPI ==========
    const kpi = useMemo(() => {
        const totalIncome = rows.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
        const subsCount = rows.filter(r => r.isSubscription).length;
        const avg = rows.length > 0 ? Math.round(totalIncome / rows.length) : 0;
        return { totalIncome, subsCount, avg };
    }, [rows]);

    // ========== ДЕЙСТВИЯ ==========
    const openMenu = (e, row) => {
        setMenuAnchor(e.currentTarget);
        setMenuStudent(row);
    };
    const closeMenu = () => { setMenuAnchor(null); setMenuStudent(null); };

    const handleOpenSubscriptionDialog = (mode) => {
        const row = menuStudent;
        closeMenu();
        if (mode === 'create') {
            setSubscriptionForm({
                lessonsCount: 8,
                price: (row?.rate || 1800) * 8,
                debtLessons: 0
            });
            setSubscriptionDialog({ open: true, mode: 'create', subscription: null, student: row?.student });
        } else if (mode === 'edit' && row?.subscription) {
            setSubscriptionForm({
                lessonsCount: row.subscription.lessonsCount || 0,
                price: row.subscription.price || 0,
                debtLessons: row.subscription.debtLessons || 0
            });
            setSubscriptionDialog({ open: true, mode: 'edit', subscription: row.subscription, student: row.student });
        }
    };

    const handleSaveSubscription = async () => {
        try {
            const student = subscriptionDialog.student;
            if (!student) return;

            if (subscriptionDialog.mode === 'create') {
                const startDate = format(startOfMonth(month), 'yyyy-MM-dd');
                const endDate = format(endOfMonth(month), 'yyyy-MM-dd');
                await axiosInstance.post('/subscriptions', {
                    tutorId: effectiveUserId,
                    studentId: student.id,
                    lessonsCount: parseInt(subscriptionForm.lessonsCount),
                    price: parseFloat(subscriptionForm.price),
                    startDate,
                    endDate
                });
                showSnackbar('✅ Абонемент создан');
            } else {
                await axiosInstance.put(`/subscriptions/${subscriptionDialog.subscription.id}`, {
                    lessonsCount: parseInt(subscriptionForm.lessonsCount),
                    price: parseFloat(subscriptionForm.price),
                    debtLessons: parseInt(subscriptionForm.debtLessons) || 0
                });
                showSnackbar('✅ Абонемент обновлён');
            }

            setSubscriptionDialog({ open: false, mode: 'create', subscription: null, student: null });
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleActivateSubscription = async () => {
        const row = menuStudent;
        closeMenu();
        if (!row?.subscription) return;
        try {
            await axiosInstance.patch(`/subscriptions/${row.subscription.id}/activate`);
            showSnackbar('✅ Оплата подтверждена');
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleDeleteSubscription = async () => {
        const row = menuStudent;
        closeMenu();
        if (!row?.subscription) return;
        if (!window.confirm('Удалить абонемент?')) return;
        try {
            await axiosInstance.delete(`/subscriptions/${row.subscription.id}`);
            showSnackbar('🗑 Абонемент удалён');
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const openLessonPicker = (type) => {
        const row = menuStudent;
        closeMenu();
        if (!row) return;
        setLessonPickerDialog({ open: true, type, student: row.student });
        setSelectedLesson(null);
    };

    const studentLessonsForMonth = useMemo(() => {
        if (!lessonPickerDialog.student) return [];
        const mStart = startOfMonth(month);
        const mEnd = endOfMonth(month);
        return lessons.filter(l => {
            if (l.student?.id !== lessonPickerDialog.student.id) return false;
            if (l.status !== 'SCHEDULED' && l.status !== 'IN_PROGRESS') return false;
            try {
                const d = parseISO(l.lessonDate);
                return isWithinInterval(d, { start: mStart, end: mEnd });
            } catch { return false; }
        });
    }, [lessonPickerDialog.student, lessons, month]);

    const handleLessonPicked = (lesson) => {
        const type = lessonPickerDialog.type;
        setSelectedLesson(lesson);
        setLessonPickerDialog({ open: false, type: null, student: null });
        if (type === 'reschedule') {
            setRescheduleForm({
                newDate: lesson.lessonDate || '',
                newStartTime: (lesson.startTime || '11:00').slice(0, 5),
                newEndTime: (lesson.endTime || '12:00').slice(0, 5)
            });
            setRescheduleDialog({ open: true, student: lessonPickerDialog.student });
        } else if (type === 'cancel') {
            setCancelForm({ reason: '' });
            setCancelDialog({ open: true, student: lessonPickerDialog.student });
        }
    };

    const handleReschedule = async () => {
        if (!selectedLesson) return;
        try {
            await axiosInstance.post(`/lessons/${selectedLesson.id}/reschedule`, {
                newDate: rescheduleForm.newDate,
                newStartTime: rescheduleForm.newStartTime + ':00',
                newEndTime: rescheduleForm.newEndTime + ':00'
            });
            showSnackbar('✅ Урок перенесён');
            setRescheduleDialog({ open: false, student: null });
            setSelectedLesson(null);
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleCancelLesson = async () => {
        if (!selectedLesson) return;
        try {
            await axiosInstance.post(`/lessons/${selectedLesson.id}/cancel`, {
                reason: cancelForm.reason
            });
            showSnackbar('✅ Урок отменён');
            setCancelDialog({ open: false, student: null });
            setSelectedLesson(null);
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    // ========== РЕНДЕР ==========
    if (loading) return (
        <GlassPageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#4F46E5' }} />
            </Box>
        </GlassPageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <GlassPageContainer>
                {/* HERO с KPI */}
                <GlassHero>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PaymentsIcon sx={{ fontSize: 36 }} />
                                <Box>
                                    <Typography sx={{ fontSize: '28px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                        Финансы
                                    </Typography>
                                    <Typography sx={{ opacity: 0.85, fontSize: '14px' }}>
                                        Ученики, абонементы и оплаты
                                    </Typography>
                                </Box>
                            </Box>
                            <GlassButton startIcon={<RefreshIcon />} onClick={fetchData}>
                                Обновить
                            </GlassButton>
                        </Box>

                        <Grid container spacing={2}>
                            {[
                                { label: 'Доход за месяц', value: `${kpi.totalIncome.toLocaleString()} ₽`, icon: <PaymentsIcon sx={{ fontSize: 26 }} /> },
                                { label: 'На абонементе', value: kpi.subsCount, icon: <CardGiftcardIcon sx={{ fontSize: 26 }} /> },
                                { label: 'Всего учеников', value: rows.length, icon: <SchoolIcon sx={{ fontSize: 26 }} /> },
                                { label: 'Средний чек', value: `${kpi.avg.toLocaleString()} ₽`, icon: <TrendingUpIcon sx={{ fontSize: 26 }} /> },
                            ].map((s, i) => (
                                <Grid item xs={6} md={3} key={i}>
                                    <GlassStatCard elevation={0}>
                                        <Box sx={{ mb: 1, opacity: 0.9 }}>{s.icon}</Box>
                                        <Typography sx={{ fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                            {s.value}
                                        </Typography>
                                        <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>{s.label}</Typography>
                                    </GlassStatCard>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </GlassHero>

                {/* Селектор месяца */}
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <DatePicker
                        label="Месяц"
                        value={month}
                        onChange={(v) => v && setMonth(v)}
                        views={['year', 'month']}
                        format="LLLL yyyy"
                        slotProps={{
                            textField: {
                                size: 'small',
                                sx: {
                                    width: 220,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '40px',
                                        background: 'rgba(255,255,255,0.7)',
                                        backdropFilter: 'blur(8px)'
                                    }
                                }
                            }
                        }}
                    />
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px' }}>{error}</Alert>}

                {/* Таблица */}
                <BentoCard elevation={0}>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 2 }}>
                        Ученики ({rows.length})
                    </Typography>

                    <TableContainer component={Paper} elevation={0} sx={{ borderRadius: '16px', background: 'rgba(255,255,255,0.5)' }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    {['Ученик', 'Тип оплаты', 'Уроков в месяце', 'Оплачено', 'Проведено', 'Пропущено', 'Осталось', 'Ставка', ''].map((h, i) => (
                                        <TableCell key={i} sx={{
                                            fontWeight: 600, fontSize: '12px', color: '#6B7280',
                                            background: 'rgba(249, 250, 251, 0.7)',
                                            borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                                            whiteSpace: 'nowrap'
                                        }}>
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {rows.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} align="center" sx={{ py: 4, color: '#6B7280' }}>
                                            Нет учеников
                                        </TableCell>
                                    </TableRow>
                                ) : rows.map(row => (
                                    <StyledTableRow key={row.student.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(row.student.fullName), fontSize: 12, fontWeight: 600 }}>
                                                    {getInitials(row.student.fullName)}
                                                </Avatar>
                                                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                                                    {row.student.fullName}
                                                </Typography>
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={row.student.paymentType || 'single'}
                                                size="small"
                                                onChange={async (e) => {
                                                    const newType = e.target.value;
                                                    if (newType === row.student.paymentType) return;
                                                    try {
                                                        await axiosInstance.put(`/admin/students/${row.student.id}/payment-type`, {
                                                            paymentType: newType,
                                                            tutorId: effectiveUserId
                                                        });
                                                        showSnackbar('✅ Тип оплаты обновлён');
                                                        fetchData();
                                                    } catch (err) {
                                                        showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
                                                    }
                                                }}
                                                sx={{
                                                    fontSize: '11px',
                                                    minWidth: 130,
                                                    '& .MuiOutlinedInput-root': {
                                                        borderRadius: '100px',
                                                        '& fieldset': { borderColor: 'transparent' },
                                                        '&:hover fieldset': { borderColor: '#4F46E5' },
                                                    }
                                                }}
                                            >
                                                <MenuItem value="single">
                                                    <Chip label="Поурочно" size="small"
                                                        sx={{ bgcolor: '#F3F4F6', color: '#374151', fontWeight: 500, fontSize: '11px', borderRadius: '100px' }} />
                                                </MenuItem>
                                                <MenuItem value="subscription">
                                                    <Chip label="Абонемент" size="small"
                                                        sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 500, fontSize: '11px', borderRadius: '100px' }} />
                                                </MenuItem>
                                            </Select>
                                            {row.subscription?.status === 'PENDING' && (
                                                <Chip label="ожидает оплаты" size="small"
                                                    sx={{ ml: 0.5, mt: 0.5, bgcolor: '#FEF3C7', color: '#92400E', fontSize: '10px', height: 18 }} />
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px' }}>{row.totalLessons ?? '—'}</TableCell>
                                        <TableCell sx={{ fontSize: '14px', fontWeight: 600, color: '#10B981' }}>
                                            {row.paidAmount.toLocaleString()} ₽
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 500 }}>
                                            {row.usedLessons}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px', color: row.missedLessons > 0 ? '#EF4444' : '#6B7280', fontWeight: row.missedLessons > 0 ? 600 : 400 }}>
                                            {row.missedLessons}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px', fontWeight: 500 }}>
                                            {row.remaining === null ? '—' : row.remaining}
                                        </TableCell>
                                        <TableCell sx={{ fontSize: '14px' }}>
                                            {row.rate ? `${row.rate.toLocaleString()} ₽` : '—'}
                                        </TableCell>
                                        <TableCell align="right">
                                            <IconButton size="small" onClick={(e) => openMenu(e, row)}>
                                                <MoreVertIcon fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </StyledTableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </BentoCard>

                {/* МЕНЮ ДЕЙСТВИЙ */}
                <Menu
                    anchorEl={menuAnchor}
                    open={Boolean(menuAnchor)}
                    onClose={closeMenu}
                    PaperProps={{ sx: { borderRadius: '16px', minWidth: 240 } }}
                >
                    {(!menuStudent?.isSubscription || !menuStudent?.subscription) && (
                        <MenuItem onClick={() => handleOpenSubscriptionDialog('create')}>
                            <AddIcon sx={{ mr: 1, fontSize: 18, color: '#4F46E5' }} />
                            Создать абонемент
                        </MenuItem>
                    )}
                    {menuStudent?.subscription?.status === 'PENDING' && (
                        <MenuItem onClick={handleActivateSubscription}>
                            <CheckIcon sx={{ mr: 1, fontSize: 18, color: '#10B981' }} />
                            Подтвердить оплату
                        </MenuItem>
                    )}
                    {menuStudent?.subscription && (
                        <MenuItem onClick={() => handleOpenSubscriptionDialog('edit')}>
                            <EditIcon sx={{ mr: 1, fontSize: 18, color: '#6B7280' }} />
                            Редактировать абонемент
                        </MenuItem>
                    )}
                    {menuStudent?.subscription && (
                        <MenuItem onClick={handleDeleteSubscription}>
                            <DeleteIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
                            Удалить абонемент
                        </MenuItem>
                    )}
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={() => openLessonPicker('reschedule')}>
                        <RescheduleIcon sx={{ mr: 1, fontSize: 18, color: '#F59E0B' }} />
                        Перенести урок
                    </MenuItem>
                    <MenuItem onClick={() => openLessonPicker('cancel')}>
                        <CancelIcon sx={{ mr: 1, fontSize: 18, color: '#EF4444' }} />
                        Отменить урок
                    </MenuItem>
                </Menu>

                {/* ДИАЛОГ АБОНЕМЕНТА */}
                <Dialog open={subscriptionDialog.open} onClose={() => setSubscriptionDialog({ open: false, mode: 'create', subscription: null, student: null })} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        {subscriptionDialog.mode === 'create' ? 'Создать абонемент' : 'Редактировать абонемент'}
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                Ученик: <b>{subscriptionDialog.student?.fullName}</b>
                            </Typography>
                            <TextField
                                label="Количество уроков" type="number" fullWidth
                                value={subscriptionForm.lessonsCount}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, lessonsCount: e.target.value })}
                            />
                            <TextField
                                label="Сумма (₽)" type="number" fullWidth
                                value={subscriptionForm.price}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, price: e.target.value })}
                            />
                            <TextField
                                label="Пропущено (долг)" type="number" fullWidth
                                value={subscriptionForm.debtLessons}
                                onChange={(e) => setSubscriptionForm({ ...subscriptionForm, debtLessons: e.target.value })}
                                helperText="Количество неиспользованных занятий по вине ученика"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setSubscriptionDialog({ open: false, mode: 'create', subscription: null, student: null })}>Отмена</Button>
                        <Button variant="contained" onClick={handleSaveSubscription}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            Сохранить
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ДИАЛОГ ВЫБОРА УРОКА */}
                <Dialog open={lessonPickerDialog.open} onClose={() => setLessonPickerDialog({ open: false, type: null, student: null })} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        {lessonPickerDialog.type === 'reschedule' ? 'Выберите урок для переноса' : 'Выберите урок для отмены'}
                    </DialogTitle>
                    <DialogContent>
                        {studentLessonsForMonth.length === 0 ? (
                            <Typography sx={{ py: 3, textAlign: 'center', color: '#6B7280' }}>
                                Нет запланированных уроков в этом месяце
                            </Typography>
                        ) : (
                            <List dense>
                                {studentLessonsForMonth.map(l => (
                                    <ListItem key={l.id} disablePadding>
                                        <ListItemButton onClick={() => handleLessonPicked(l)}>
                                            <ListItemText
                                                primary={`${l.lessonDate} • ${(l.startTime || '').slice(0, 5)}–${(l.endTime || '').slice(0, 5)}`}
                                                secondary={l.course?.name || '—'}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                ))}
                            </List>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLessonPickerDialog({ open: false, type: null, student: null })}>Закрыть</Button>
                    </DialogActions>
                </Dialog>

                {/* ДИАЛОГ ПЕРЕНОСА */}
                <Dialog open={rescheduleDialog.open} onClose={() => setRescheduleDialog({ open: false, student: null })} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>Перенести урок</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {selectedLesson && (
                                <Alert severity="info" sx={{ borderRadius: '12px' }}>
                                    Текущий: {selectedLesson.lessonDate} • {(selectedLesson.startTime || '').slice(0, 5)}
                                </Alert>
                            )}
                            <TextField label="Новая дата" type="date" fullWidth
                                value={rescheduleForm.newDate}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newDate: e.target.value })}
                                InputLabelProps={{ shrink: true }} />
                            <TextField label="Новое время начала" type="time" fullWidth
                                value={rescheduleForm.newStartTime}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newStartTime: e.target.value })}
                                InputLabelProps={{ shrink: true }} />
                            <TextField label="Новое время окончания" type="time" fullWidth
                                value={rescheduleForm.newEndTime}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, newEndTime: e.target.value })}
                                InputLabelProps={{ shrink: true }} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setRescheduleDialog({ open: false, student: null })}>Отмена</Button>
                        <Button variant="contained" onClick={handleReschedule}
                            sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' } }}>
                            Перенести
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* ДИАЛОГ ОТМЕНЫ */}
                <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, student: null })} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>Отменить урок</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            {selectedLesson && (
                                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                                    Урок: {selectedLesson.lessonDate} • {(selectedLesson.startTime || '').slice(0, 5)}
                                </Alert>
                            )}
                            <TextField label="Причина отмены" fullWidth multiline minRows={2}
                                value={cancelForm.reason}
                                onChange={(e) => setCancelForm({ ...cancelForm, reason: e.target.value })} />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setCancelDialog({ open: false, student: null })}>Отмена</Button>
                        <Button variant="contained" color="error" onClick={handleCancelLesson}>
                            Отменить урок
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* SNACKBAR */}
                {snackbar.open && (
                    <Box sx={{ position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)', zIndex: 2000 }}>
                        <Fade in={snackbar.open}>
                            <Alert
                                severity={snackbar.severity}
                                onClose={() => setSnackbar({ ...snackbar, open: false })}
                                sx={{ borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}>
                                {snackbar.message}
                            </Alert>
                        </Fade>
                    </Box>
                )}
            </GlassPageContainer>
        </LocalizationProvider>
    );
}

export default Finance;