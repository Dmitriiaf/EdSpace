// ========== frontend/src/pages/ParentDashboard.js (v7 — FINAL FIXED) ==========
import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, Chip, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Avatar, LinearProgress, Fade, Grow,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Badge, List, ListItem, ListItemText, Divider,
    Stack, Breadcrumbs, Link as MuiLink, Collapse, TextField,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon, Payment as PaymentIcon, History as HistoryIcon,
    School as SchoolIcon, Person as PersonIcon, Refresh as RefreshIcon,
    Notifications as NotificationsIcon, Close as CloseIcon,
    CardGiftcard as SubscriptionIcon, Warning as WarningIcon,
    Assessment as AssessmentIcon, Grade as GradeIcon, TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon, CalendarToday as CalendarIcon,
    AccessTime as AccessTimeIcon, EmojiEvents as EmojiEventsIcon,
    Chat as ChatIcon, Celebration as CelebrationIcon, Bolt as BoltIcon,
    ArrowForward as ArrowForwardIcon, Circle as CircleIcon,
    ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon,
    Edit as EditIcon, Save as SaveIcon, Delete as DeleteIcon,
    NavigateNext as NavigateNextIcon, Folder as FolderIcon,
    Download as DownloadIcon, OpenInNew as OpenInNewIcon,
    Info as InfoIcon, Schedule as ScheduleIcon, Cancel as CancelIcon,
    Videocam as VideocamIcon
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, isSameDay, isAfter, differenceInDays, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { formatLessonTime } from '../utils/timezone';
import { getLessonsByStudent } from '../services/api';

// ========== СТИЛИ ==========
const HeroPaper = styled(Paper)({
    borderRadius: '16px', p: 3,
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    color: '#fff', position: 'relative', overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(79,70,229,0.3)',
});

const StyledTab = styled(Tab)({
    textTransform: 'none', fontWeight: 500, fontSize: '14px', minHeight: 48,
    '&.Mui-selected': { color: '#4F46E5' },
});

const LessonStatusBadge = ({ status }) => {
    const config = {
        'SCHEDULED': { label: 'Запланировано', color: '#3B82F6', bg: '#EFF6FF', icon: ScheduleIcon },
        'COMPLETED': { label: 'Проведено', color: '#F59E0B', bg: '#FFFBEB', icon: CheckIcon },
        'PAID': { label: 'Оплачено', color: '#10B981', bg: '#ECFDF5', icon: CheckIcon },
        'CONFIRMED': { label: 'Подтверждено', color: '#10B981', bg: '#ECFDF5', icon: CheckIcon },
        'CANCELLED': { label: 'Отменено', color: '#EF4444', bg: '#FEF2F2', icon: CancelIcon },
        'RESCHEDULED': { label: 'Перенесено', color: '#8B5CF6', bg: '#F5F3FF', icon: ScheduleIcon },
        'IN_PROGRESS': { label: 'Идёт', color: '#10B981', bg: '#ECFDF5', icon: VideocamIcon }
    };
    const cfg = config[status] || { label: status, color: '#6B7280', bg: '#F3F4F6', icon: InfoIcon };
    const Icon = cfg.icon;
    return (
        <Chip icon={<Icon sx={{ fontSize: 14, color: cfg.color }} />} label={cfg.label} size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 500, fontSize: '0.7rem', height: 24 }} />
    );
};

function TabPanel({ children, value, index }) {
    return <div hidden={value !== index}>{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}</div>;
}

function ParentDashboard() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Родитель'; }, []);
    const { getStudentRateForTutor } = useStudentRate();
    
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [selectedChild, setSelectedChild] = useState('all');
    const [childrenList, setChildrenList] = useState([]);
    const [allLessons, setAllLessons] = useState([]);
    const [allPayments, setAllPayments] = useState([]);
    const [pendingSubscriptions, setPendingSubscriptions] = useState([]);
    const [activeSubscriptions, setActiveSubscriptions] = useState([]);
    const [partiallyPaidSubscriptions, setPartiallyPaidSubscriptions] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [progressData, setProgressData] = useState(null);
    const [progressLoading, setProgressLoading] = useState(false);
    
    // Календарь
    const [selectedDate, setSelectedDate] = useState(new Date());
    
    // Доска-стикер
    const [stickyNotes, setStickyNotes] = useState([]);
    const [editingNote, setEditingNote] = useState(null);
    const [editText, setEditText] = useState('');
    const [boardChildId, setBoardChildId] = useState(null);

    useEffect(() => { if (user?.id) loadChildren(); }, [user]);
    useEffect(() => { if (selectedChild !== 'all') fetchChildProgress(selectedChild); else setProgressData(null); }, [selectedChild]);
    useEffect(() => { if (selectedChild !== 'all') { fetchBoard(parseInt(selectedChild)); setBoardChildId(parseInt(selectedChild)); } }, [selectedChild]);

    const loadChildren = async () => {
        setLoading(true);
        try {
            const r = await axiosInstance.get(`/students/parent/${user.id}`);
            const fresh = (r.data || []).map(c => ({ id: c.id, fullName: c.fullName, email: c.email, allIds: [c.id] }));
            setChildrenList(fresh);
            if (fresh.length === 1) setSelectedChild(fresh[0].id);
            await fetchAllData(fresh);
            await fetchSubscriptions(fresh);
        } catch (err) { setError('Ошибка загрузки'); }
        finally { setLoading(false); }
    };

    const fetchChildProgress = async (childId) => {
        setProgressLoading(true);
        try { const r = await axiosInstance.get(`/homework/parent/child/${childId}/progress`); setProgressData(r.data); }
        catch (err) {} finally { setProgressLoading(false); }
    };

    const fetchSubscriptions = async (children) => {
        try {
            let pending = [], active = [], partial = [];
            for (const c of children) {
                try {
                    const sRes = await axiosInstance.get(`/students/${c.id}`);
                    if (sRes.data.paymentType === 'subscription') {
                        const r = await axiosInstance.get(`/subscriptions/student/${c.id}`);
                        pending = [...pending, ...r.data.filter(s => s.status === 'PENDING' || s.status === 'pending').map(s => ({...s, childId: c.id, childName: c.fullName}))];
                        active = [...active, ...r.data.filter(s => s.status === 'ACTIVE' || s.status === 'active').map(s => ({...s, childId: c.id, childName: c.fullName}))];
                        for (const sub of r.data.filter(s => s.status === 'ACTIVE' || s.status === 'active')) {
                            const pRes = await axiosInstance.get(`/payments/student/${c.id}`);
                            const paid = pRes.data.filter(p => p.subscriptionId === sub.id && (p.status === 'PAID' || p.status === 'paid')).reduce((sum, p) => sum + p.amount, 0);
                            if (paid > 0 && paid < sub.price) partial.push({...sub, childId: c.id, childName: c.fullName, paidAmount: paid, remainingAmount: sub.price - paid});
                        }
                    }
                } catch (err) {}
            }
            setPendingSubscriptions(pending); setActiveSubscriptions(active); setPartiallyPaidSubscriptions(partial);
        } catch (err) {}
    };

    const fetchAllData = async (children) => {
        try {
            try { const r = await axiosInstance.get(`/notifications/parent/${user.id}`); setNotifications(r.data || []); } catch (err) {}
            try { const r = await axiosInstance.get(`/notifications/parent/${user.id}/unread-count`); setUnreadCount(r.data?.count || 0); } catch (err) {}
            let lessons = [], payments = [];
            for (const c of children) {
                for (const sid of (c.allIds || [c.id])) {
                    try { const r = await getLessonsByStudent(sid); lessons = [...lessons, ...(r.data !== undefined ? r.data : r).map(l => ({...l, childId: c.id, childName: c.fullName}))]; } catch (err) {}
                    try { const r = await axiosInstance.get(`/payments/student/${sid}`); payments = [...payments, ...r.data.map(p => ({...p, childId: c.id, childName: c.fullName}))]; } catch (err) {}
                }
            }
            setAllLessons(lessons.sort((a,b) => new Date(a.lessonDate)-new Date(b.lessonDate)));
            setAllPayments(payments.sort((a,b) => new Date(b.paymentDate)-new Date(a.paymentDate)));
        } catch (err) {}
    };

    // ========== ДОСКА-СТИКЕР ==========
    const fetchBoard = async (childId) => {
        try {
            const res = await axiosInstance.get(`/board/parent/${childId}`);
            const notes = JSON.parse(res.data.notes || '[]');
            setStickyNotes(notes);
        } catch (err) { setStickyNotes([]); }
    };

    const saveBoard = async (notes) => {
        try {
            await axiosInstance.put(`/board/parent/${boardChildId}`, { notes: JSON.stringify(notes) });
        } catch (err) {}
    };

    const handleAddNote = () => {
        const newNote = { id: Date.now(), text: 'Новая заметка...', color: '#FFE0B2', width: 260, height: 160 };
        const updated = [...stickyNotes, newNote];
        setStickyNotes(updated);
        saveBoard(updated);
    };

    const handleEditNote = (note) => { setEditingNote(note.id); setEditText(note.text); };

    const handleSaveNote = () => {
        const updated = stickyNotes.map(n => n.id === editingNote ? { ...n, text: editText } : n);
        setStickyNotes(updated);
        saveBoard(updated);
        setEditingNote(null);
    };

    const handleDeleteNote = (id) => {
        const updated = stickyNotes.filter(n => n.id !== id);
        setStickyNotes(updated);
        saveBoard(updated);
    };

    // ========== ПЛАТЕЖИ ==========
    const createFileInput = (cb) => {
        const inp = document.createElement('input'); inp.type='file'; inp.accept='image/*'; inp.setAttribute('capture','environment');
        inp.onchange = e => { const f = e.target.files[0]; if (!f) return; if (f.size > 2*1024*1024) { alert('Максимум 2MB'); return; } cb(f); };
        inp.click();
    };

    const paySubscription = (sub) => createFileInput(async (file) => {
        try {
            const pr = await axiosInstance.post('/payments', { tutorId: sub.tutor?.id, studentId: sub.studentId || sub.student?.id, amount: sub.price, paymentType: 'subscription', status: 'PAID' });
            const fd = new FormData(); fd.append('file', file);
            await axiosInstance.post(`/payments/${pr.data.id}/upload-receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await axiosInstance.post(`/subscriptions/${sub.id}/pay`, {});
            alert('✅ Чек загружен!'); loadChildren();
        } catch (err) { alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось')); }
    });

    const payAdditional = (sub) => createFileInput(async (file) => {
        if (!window.confirm(`Доплатить ${sub.remainingAmount} ₽?`)) return;
        try {
            const pr = await axiosInstance.post('/payments', { tutorId: sub.tutor?.id, studentId: sub.studentId || sub.student?.id, amount: sub.remainingAmount, paymentType: 'subscription', status: 'PAID' });
            const fd = new FormData(); fd.append('file', file);
            await axiosInstance.post(`/payments/${pr.data.id}/upload-receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            await axiosInstance.post(`/subscriptions/${sub.id}/additional-pay`, { amount: sub.remainingAmount });
            alert('✅ Доплата отправлена!'); loadChildren();
        } catch (err) { alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось')); }
    });

    const payLesson = (lesson) => createFileInput(async (file) => {
        try {
            const pr = await axiosInstance.post('/payments/lesson', { tutorId: lesson.tutor?.id, studentId: lesson.student?.id, amount: getStudentRateForTutor(lesson.student, lesson.tutor?.id), paymentType: 'single', lessonId: lesson.id });
            const fd = new FormData(); fd.append('file', file);
            await axiosInstance.post(`/payments/${pr.data.id}/upload-receipt`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            alert('✅ Чек загружен!'); loadChildren();
        } catch (err) { alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось')); }
    });

    const payAll = () => {
        const pending = getPendingPayments();
        if (pending.length === 0) return alert('Нет неоплаченных занятий');
        if (!window.confirm(`Оплатить ${pending.length} занятий на сумму ${pending.reduce((s,l) => s + (getStudentRateForTutor(l.student, l.tutor?.id) || 0), 0)} ₽?`)) return;
        pending.forEach(l => payLesson(l));
    };

    // ========== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ==========
    const getFiltered = (arr) => selectedChild === 'all' ? arr : arr.filter(i => i.childId === parseInt(selectedChild));
    const getPendingPayments = () => {
        const now = new Date(); const eom = new Date(now.getFullYear(), now.getMonth()+1, 0);
        return allLessons.filter(l => l.status === 'COMPLETED' && new Date(l.lessonDate) <= eom && !activeSubscriptions.some(s => s.studentId === l.student?.id));
    };
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '-';
    const selectedName = selectedChild === 'all' ? null : childrenList.find(c => c.id === parseInt(selectedChild))?.fullName;

    const getNextLesson = () => {
        if (selectedChild === 'all') return null;
        const now = new Date();
        return allLessons
            .filter(l => l.childId === parseInt(selectedChild) && (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED'))
            .sort((a, b) => new Date(a.lessonDate + 'T' + a.startTime) - new Date(b.lessonDate + 'T' + b.startTime))
            .find(l => isAfter(new Date(l.lessonDate + 'T' + l.startTime), now)) || null;
    };

    const getQuickStats = () => {
        if (!progressData) return null;
        const checked = progressData.detailedStats?.checkedHomework || 0;
        const total = progressData.homeworkStats?.totalHomework || 0;
        const avg = progressData.detailedStats?.averageGrade || 0;
        const pct = Math.round(progressData.detailedStats?.averagePercentage || 0);
        return { checked, total, avg, pct };
    };

    const lessonsOnSelectedDate = useMemo(() => {
        return getFiltered(allLessons)
            .filter(lesson => isSameDay(new Date(lesson.lessonDate), selectedDate))
            .sort((a, b) => a.startTime?.localeCompare(b.startTime));
    }, [allLessons, selectedDate, selectedChild]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center' }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
        </Box>
    );

    const nextLesson = getNextLesson();
    const quickStats = getQuickStats();

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ maxWidth: 1400, mx: 'auto', p: { xs: 2, sm: 3 }, bgcolor: '#F9FAFB', minHeight: '100vh' }}>
                
                {/* ========== HERO-ШАПКА ========== */}
                <HeroPaper elevation={0} sx={{ p: { xs: 2.5, sm: 4 }, mb: 3 }}>
                    <Box sx={{ position: 'absolute', top: -30, right: -20, width: 120, height: 120, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography sx={{ fontSize: { xs: '22px', sm: '28px' }, fontWeight: 700 }}>
                                    Здравствуйте, {user?.fullName?.split(' ')[0]}! 👋
                                </Typography>
                                <Typography sx={{ fontSize: '14px', opacity: 0.85, mt: 0.5 }}>
                                    {format(new Date(), 'EEEE, d MMMM', { locale: ru })} • {format(new Date(), 'HH:mm')}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton onClick={() => {}} sx={{ color: '#fff' }}>
                                    <Badge badgeContent={unreadCount} color="error"><NotificationsIcon /></Badge>
                                </IconButton>
                                <Button onClick={loadChildren} disabled={refreshing} sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.3)', '&:hover': { borderColor: '#fff' } }} variant="outlined" size="small" startIcon={<RefreshIcon />}>Обновить</Button>
                            </Box>
                        </Box>
                        {childrenList.length > 0 && (
                            <FormControl size="small" sx={{ mt: 2, minWidth: 200, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '& fieldset': { borderColor: 'rgba(255,255,255,0.3)' }, '&:hover fieldset': { borderColor: '#fff' } }, '& .MuiSvgIcon-root': { color: '#fff' } }}>
                                <Select value={selectedChild} onChange={e => setSelectedChild(e.target.value)}>
                                    <MenuItem value="all">Все дети</MenuItem>
                                    {childrenList.map(c => <MenuItem key={c.id} value={c.id}>{c.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        {selectedChild !== 'all' && (
                            <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, flex: 1 }}>
                                    {allLessons.filter(l => l.childId === parseInt(selectedChild) && (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') && new Date(l.lessonDate) >= new Date())
                                        .sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate)).slice(0, 4).map(lesson => (
                                        <Chip key={lesson.id}
                                            label={`${format(new Date(lesson.lessonDate), 'd MMM', { locale: ru })} ${formatLessonTime(lesson.lessonDate, lesson.startTime)}`}
                                            size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', fontSize: '12px', height: 28, border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }} />
                                    ))}
                                    {allLessons.filter(l => l.childId === parseInt(selectedChild) && (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') && new Date(l.lessonDate) >= new Date()).length === 0 && 
                                        <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>Нет предстоящих занятий</Typography>}
                                </Box>
                                {nextLesson && (
                                    <Chip icon={<AccessTimeIcon sx={{ color: '#FDE68A !important' }} />}
                                        label={`Ближайшее: ${format(new Date(nextLesson.lessonDate), 'd MMM', { locale: ru })} ${formatLessonTime(nextLesson.lessonDate, nextLesson.startTime)}`}
                                        sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#FDE68A', fontWeight: 600, borderRadius: '10px', fontSize: '13px', height: 32, border: '1px solid rgba(253,232,138,0.3)' }} />
                                )}
                            </Box>
                        )}
                    </Box>
                </HeroPaper>

                {/* ========== ОСНОВНОЙ GRID ========== */}
                <Grid container spacing={3}>
                    {/* ЛЕВАЯ ЧАСТЬ */}
                    <Grid item xs={12} md={8}>
                        
                        {/* Быстрая статистика */}
                        {selectedChild !== 'all' && quickStats && (
                            <Grow in={true} timeout={500}>
                                <Paper sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid #F3F4F6' }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '16px', mb: 2, color: '#1F2937' }}>
                                        {selectedName} — сводка
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {[{ l: 'Проверено работ', v: quickStats.checked, c: '#10B981', bg: '#ECFDF5', i: CheckIcon },
                                          { l: 'Всего заданий', v: quickStats.total, c: '#4F46E5', bg: '#EEF2FF', i: AssignmentIcon },
                                          { l: 'Средний балл', v: `${quickStats.avg}/5`, c: '#F59E0B', bg: '#FFFBEB', i: GradeIcon },
                                          { l: 'Успеваемость', v: `${quickStats.pct}%`, c: '#6366F1', bg: '#F5F3FF', i: TrendingUpIcon }].map((s, i) => {
                                            const I = s.i;
                                            return <Grid item xs={6} sm={3} key={i}>
                                                <Box sx={{ bgcolor: s.bg, borderRadius: '12px', p: 2, textAlign: 'center' }}>
                                                    <I sx={{ fontSize: 24, color: s.c, mb: 0.5 }} />
                                                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: s.c }}>{s.v}</Typography>
                                                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>{s.l}</Typography>
                                                </Box>
                                            </Grid>;
                                        })}
                                    </Grid>
                                </Paper>
                            </Grow>
                        )}

                        {/* Блок оплаты */}
                        {[...getFiltered(pendingSubscriptions).map(s => ({...s, type:'sub'})), 
                          ...getFiltered(partiallyPaidSubscriptions).map(s => ({...s, type:'partial'})),
                          ...getPendingPayments().filter(l => getFiltered([l]).length).map(l => ({...l, type:'lesson'}))].length > 0 && (
                            <Grow in={true} timeout={600}>
                                <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: '16px', border: '1px solid #F3F4F6' }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '18px', mb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <WarningIcon sx={{ color: '#F59E0B' }} /> Требуется действие
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 2 }}>
                                        Оплатите занятия или абонементы для продолжения обучения
                                    </Typography>
                                    <Grid container spacing={2}>
                                        {getFiltered(pendingSubscriptions).map(s => (
                                            <Grid item xs={12} sm={6} key={'sub-'+s.id}>
                                                <Card sx={{ bgcolor: '#ECFDF5', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                                                    <CardContent sx={{ p: 2.5 }}>
                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            <Avatar sx={{ bgcolor: '#10B981', width: 40, height: 40 }}><SubscriptionIcon /></Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography sx={{ fontWeight: 600 }}>{s.childName}</Typography>
                                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Абонемент: {s.lessonsCount} занятий</Typography>
                                                                <Typography sx={{ fontWeight: 700, color: '#059669', mt: 1 }}>{s.price?.toLocaleString()} ₽</Typography>
                                                                <Button variant="contained" size="small" sx={{ mt: 1, bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }} onClick={() => paySubscription(s)}>Оплатить</Button>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                        {getFiltered(partiallyPaidSubscriptions).map(s => (
                                            <Grid item xs={12} sm={6} key={'part-'+s.id}>
                                                <Card sx={{ bgcolor: '#FFF7ED', borderRadius: '12px', border: '1px solid #FED7AA' }}>
                                                    <CardContent sx={{ p: 2.5 }}>
                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            <Avatar sx={{ bgcolor: '#F97316', width: 40, height: 40 }}><WarningIcon /></Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography sx={{ fontWeight: 600 }}>{s.childName}</Typography>
                                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Оплачено {s.paidAmount?.toLocaleString()} из {s.price?.toLocaleString()} ₽</Typography>
                                                                <Typography sx={{ fontWeight: 700, color: '#C2410C', mt: 1 }}>Доплатить: {s.remainingAmount?.toLocaleString()} ₽</Typography>
                                                                <Button variant="contained" size="small" sx={{ mt: 1, bgcolor: '#F97316', '&:hover': { bgcolor: '#EA580C' } }} onClick={() => payAdditional(s)}>Доплатить</Button>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                        {getPendingPayments().filter(l => getFiltered([l]).length).map(l => (
                                            <Grid item xs={12} sm={6} key={'les-'+l.id}>
                                                <Card sx={{ bgcolor: '#FFFBEB', borderRadius: '12px', border: '1px solid #FDE68A' }}>
                                                    <CardContent sx={{ p: 2.5 }}>
                                                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                            <Avatar sx={{ bgcolor: '#D97706', width: 40, height: 40 }}><PaymentIcon /></Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography sx={{ fontWeight: 600 }}>{l.childName}</Typography>
                                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>{l.course?.name || 'Занятие'} • {fmtDate(l.lessonDate)}</Typography>
                                                                <Typography sx={{ fontWeight: 700, color: '#92400E', mt: 1 }}>{getStudentRateForTutor(l.student, l.tutor?.id) || 0} ₽</Typography>
                                                                <Button variant="contained" size="small" sx={{ mt: 1, bgcolor: '#D97706', '&:hover': { bgcolor: '#B45309' } }} onClick={() => payLesson(l)}>Оплатить</Button>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    {getPendingPayments().length > 1 && (
                                        <Box sx={{ mt: 2, textAlign: 'right' }}>
                                            <Button variant="contained" size="small" startIcon={<BoltIcon />} onClick={payAll}
                                                sx={{ bgcolor: '#4F46E5', borderRadius: '10px', '&:hover': { bgcolor: '#4338CA' } }}>
                                                Оплатить всё ({getPendingPayments().reduce((s,l) => s + (getStudentRateForTutor(l.student, l.tutor?.id) || 0), 0)} ₽)
                                            </Button>
                                        </Box>
                                    )}
                                </Paper>
                            </Grow>
                        )}

                        {/* Рекомендация */}
                        {selectedChild !== 'all' && quickStats && (
                            <Grow in={true} timeout={700}>
                                <Paper sx={{ p: 2.5, mb: 3, borderRadius: '16px', border: '1px solid #F3F4F6', 
                                    bgcolor: quickStats.pct >= 80 ? '#ECFDF5' : quickStats.pct >= 60 ? '#FFFBEB' : '#EEF2FF' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        {quickStats.pct >= 80 ? <EmojiEventsIcon sx={{ color: '#D97706', fontSize: 32 }} /> :
                                         quickStats.pct >= 60 ? <TrendingUpIcon sx={{ color: '#4F46E5', fontSize: 32 }} /> :
                                         <SchoolIcon sx={{ color: '#4F46E5', fontSize: 32 }} />}
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1F2937' }}>
                                                {quickStats.pct >= 80 ? 'Отличный прогресс! Так держать!' :
                                                 quickStats.pct >= 60 ? 'Хороший результат. Продолжайте в том же темпе' :
                                                 'Стабильная работа. Результаты улучшаются'}
                                            </Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                                {`Проверено ${quickStats.checked} из ${quickStats.total} работ. Средний балл ${quickStats.avg}/5`}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grow>
                        )}

                        {/* Календарь + уроки дня */}
                        <Grid container spacing={3} sx={{ mb: 3 }}>
                            <Grid item xs={12} md={5}>
                                <Paper sx={{ borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>Календарь</Typography>
                                    </Box>
                                    <DateCalendar value={selectedDate} onChange={setSelectedDate}
                                        slots={{ day: (props) => {
                                            const { day, ...other } = props;
                                            const hasLessons = getFiltered(allLessons).some(l => isSameDay(new Date(l.lessonDate), day));
                                            return <Badge key={day.toString()} color="primary" variant="dot" overlap="circular" invisible={!hasLessons}
                                                sx={{ '& .MuiBadge-dot': { backgroundColor: '#6366F1' } }}>
                                                <PickersDay {...other} day={day} />
                                            </Badge>;
                                        } }}
                                        sx={{ '& .MuiPickersDay-root': { borderRadius: 2, '&.Mui-selected': { backgroundColor: '#6366F1 !important', color: 'white' } } }} />
                                </Paper>
                            </Grid>
                            <Grid item xs={12} md={7}>
                                <Paper sx={{ borderRadius: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>{format(selectedDate, 'd MMMM yyyy', { locale: ru })}</Typography>
                                        <Chip label={`${lessonsOnSelectedDate.length} занятий`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 500 }} />
                                    </Box>
                                    <Box sx={{ p: 2, flex: 1, overflow: 'auto', maxHeight: 450 }}>
                                        {lessonsOnSelectedDate.length === 0 ? (
                                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 4 }}>
                                                <CalendarIcon sx={{ fontSize: 64, color: '#E5E7EB', mb: 2 }} />
                                                <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>Нет занятий</Typography>
                                            </Box>
                                        ) : (
                                            <Stack spacing={1.5}>
                                                {lessonsOnSelectedDate.map(lesson => (
                                                    <Card key={lesson.id} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #F3F4F6', '&:hover': { borderColor: '#6366F1', boxShadow: '0 2px 8px rgba(99,102,241,0.1)' } }}>
                                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                                <Box sx={{ width: 3, minHeight: 40, borderRadius: 3, bgcolor: lesson.status === 'CANCELLED' ? '#EF4444' : (lesson.status === 'COMPLETED' || lesson.status === 'PAID') ? '#10B981' : '#6366F1', alignSelf: 'stretch' }} />
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>{formatLessonTime(lesson.lessonDate, lesson.startTime)} — {formatLessonTime(lesson.lessonDate, lesson.endTime)}</Typography>
                                                                        <LessonStatusBadge status={lesson.status} />
                                                                    </Box>
                                                                    <Typography variant="body2" sx={{ color: '#374151' }}>{lesson.childName}</Typography>
                                                                    <Typography variant="body2" sx={{ color: '#374151' }}>{lesson.course?.name || 'Занятие'}</Typography>
                                                                    <Typography variant="caption" sx={{ color: '#6B7280' }}>{lesson.tutor?.fullName}</Typography>
                                                                    {lesson.notes && (
                                                                        <Paper sx={{ mt: 1, p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px' }}>
                                                                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, display: 'block', mb: 0.3 }}>📝 Что делали:</Typography>
                                                                            <Typography variant="body2" sx={{ color: '#374151' }}>{lesson.notes}</Typography>
                                                                        </Paper>
                                                                    )}
                                                                    {lesson.nextLessonPlan && (
                                                                        <Paper sx={{ mt: 1, p: 1.5, bgcolor: '#EEF2FF', borderRadius: '8px' }}>
                                                                            <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 500, display: 'block', mb: 0.3 }}>🎯 К следующему уроку:</Typography>
                                                                            <Typography variant="body2" sx={{ color: '#374151' }}>{lesson.nextLessonPlan}</Typography>
                                                                        </Paper>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </Stack>
                                        )}
                                    </Box>
                                </Paper>
                            </Grid>
                        </Grid>

                        {/* Вкладки */}
                        <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                            <Tabs value={tabValue} onChange={(e,v) => setTabValue(v)} variant="fullWidth" sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                <StyledTab icon={<CalendarIcon sx={{ fontSize: 18 }} />} label="Занятия" iconPosition="start" />
                                <StyledTab icon={<PaymentIcon sx={{ fontSize: 18 }} />} label="Платежи" iconPosition="start" />
                                <StyledTab icon={<AssessmentIcon sx={{ fontSize: 18 }} />} label="Успеваемость" iconPosition="start" />
                            </Tabs>
                            <Box sx={{ p: 3 }}>
                                {tabValue === 0 && (
                                    <Box>
                                        {getFiltered(allLessons).length === 0 ? <Alert severity="info">Нет занятий</Alert> : 
                                            getFiltered(allLessons).slice().reverse().map(l => (
                                            <Card key={l.id} sx={{ mb: 1.5, borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } }}>
                                                <CardContent sx={{ p: 2.5 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', width: 42, height: 42, fontSize: 16, fontWeight: 600 }}>{l.childName?.[0] || '?'}</Avatar>
                                                            <Box>
                                                                <Typography sx={{ fontWeight: 600 }}>{l.childName}</Typography>
                                                                <Typography variant="body2" sx={{ color: '#6B7280' }}>{l.course?.name || 'Занятие'} • {l.tutor?.fullName}</Typography>
                                                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{fmtDate(l.lessonDate)} {formatLessonTime(l.lessonDate, l.startTime)}–{formatLessonTime(l.lessonDate, l.endTime)}</Typography>
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                                                            <LessonStatusBadge status={l.status} />
                                                        </Box>
                                                    </Box>
                                                    {(l.notes || l.nextLessonPlan) && (
                                                        <Box sx={{ mt: 2 }}>
                                                            {l.notes && (
                                                                <Paper sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', mb: 1 }}>
                                                                    <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500, display: 'block', mb: 0.3 }}>📝 Что делали:</Typography>
                                                                    <Typography variant="body2" sx={{ color: '#374151' }}>{l.notes}</Typography>
                                                                </Paper>
                                                            )}
                                                            {l.nextLessonPlan && (
                                                                <Paper sx={{ p: 1.5, bgcolor: '#EEF2FF', borderRadius: '8px' }}>
                                                                    <Typography variant="caption" sx={{ color: '#4F46E5', fontWeight: 500, display: 'block', mb: 0.3 }}>🎯 К следующему уроку:</Typography>
                                                                    <Typography variant="body2" sx={{ color: '#374151' }}>{l.nextLessonPlan}</Typography>
                                                                </Paper>
                                                            )}
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                                {tabValue === 1 && (
                                    <Box>
                                        {getFiltered(allPayments).length === 0 ? <Alert severity="info">Нет платежей</Alert> :
                                            getFiltered(allPayments).map(p => (
                                            <Card key={p.id} sx={{ mb: 1.5, borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: 'none' }}>
                                                <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#ECFDF5', color: '#10B981', width: 42, height: 42, fontSize: 16, fontWeight: 600 }}>{p.childName?.[0] || '?'}</Avatar>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 600 }}>{p.childName}</Typography>
                                                            <Typography variant="body2" sx={{ color: '#6B7280' }}>{p.courseName || p.lesson?.course?.name || 'Занятие'}</Typography>
                                                            <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{fmtDate(p.paymentDate)}</Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '18px' }}>{p.amount} ₽</Typography>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </Box>
                                )}
                                {tabValue === 2 && (
                                    <Box>
                                        {selectedChild === 'all' ? <Alert severity="info">Выберите ребёнка</Alert> :
                                         progressLoading ? <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress sx={{ color: '#4F46E5' }} /></Box> :
                                         progressData ? (
                                            <>
                                                <Grid container spacing={2} sx={{ mb: 4 }}>
                                                    {[{ l: 'Всего заданий', v: progressData.homeworkStats?.totalHomework || 0, c: '#4F46E5', b: '#EEF2FF', i: AssignmentIcon },
                                                      { l: 'Проверено', v: progressData.homeworkStats?.checked || 0, c: '#10B981', b: '#ECFDF5', i: CheckIcon },
                                                      { l: 'Средний балл', v: `${progressData.detailedStats?.averageGrade || 0}/5`, c: '#F59E0B', b: '#FFFBEB', i: GradeIcon },
                                                      { l: 'Успеваемость', v: `${Math.round(progressData.detailedStats?.averagePercentage || 0)}%`, c: '#6366F1', b: '#F5F3FF', i: TrendingUpIcon }].map((s, i) => {
                                                        const I = s.i;
                                                        return <Grid item xs={6} sm={3} key={i}><Box sx={{ bgcolor: s.b, borderRadius: '12px', p: 2.5, textAlign: 'center' }}><I sx={{ fontSize: 32, color: s.c, mb: 1 }} /><Typography sx={{ fontSize: '26px', fontWeight: 700, color: s.c }}>{s.v}</Typography><Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 0.5 }}>{s.l}</Typography></Box></Grid>;
                                                    })}
                                                </Grid>
                                                {progressData.recentHomework?.length > 0 && (
                                                    <Paper sx={{ p: 2.5, borderRadius: '12px', mb: 3, border: '1px solid #F3F4F6' }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mb: 2 }}>Последние проверенные работы</Typography>
                                                        {progressData.recentHomework.map((hw, i) => (
                                                            <Paper key={i} sx={{ p: 2, mb: 1, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between' }}>
                                                                <Box><Typography sx={{ fontSize: '14px' }}>{hw.task}</Typography>{hw.feedback && <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 0.5, fontStyle: 'italic' }}>💬 {hw.feedback}</Typography>}</Box>
                                                                <Chip label={hw.gradeType === 'GRADE_100' ? `${hw.score || hw.grade}/100` : hw.gradeType === 'GRADE_10' ? `${hw.score || hw.grade}/10` : `⭐ ${hw.grade}/5`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 600, ml: 1 }} />
                                                            </Paper>
                                                        ))}
                                                    </Paper>
                                                )}
                                                {progressData.timeline?.length > 0 && (
                                                    <Paper sx={{ p: 2.5, borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', mb: 2 }}>Динамика оценок</Typography>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2%', height: 120, px: 1 }}>
                                                            {progressData.timeline.slice(-10).map((pt, i) => (
                                                                <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
                                                                    <Box sx={{ height: `${Math.max(10, (pt.percentage || 0) * 0.9)}px`, bgcolor: (pt.percentage || 0) >= 80 ? '#10B981' : (pt.percentage || 0) >= 60 ? '#F59E0B' : '#EF4444', borderRadius: '4px 4px 2px 2px' }} />
                                                                    <Typography sx={{ fontSize: '8px', color: '#9CA3AF', mt: 0.5 }}>{format(new Date(pt.date), 'd.MM', { locale: ru })}</Typography>
                                                                </Box>
                                                            ))}
                                                        </Box>
                                                    </Paper>
                                                )}
                                            </>
                                        ) : <Alert severity="info">Нет данных об успеваемости</Alert>}
                                    </Box>
                                )}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* ПРАВАЯ ЧАСТЬ — ДОСКА-СТИКЕР */}
                    <Grid item xs={12} md={4}>
                        <Paper sx={{ 
                            p: 2, borderRadius: 4, border: '1px solid #F3F4F6',
                            bgcolor: '#FFFEF5', position: 'sticky', top: 20,
                            maxHeight: 'calc(100vh - 40px)', overflow: 'auto'
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    📌 Заметки {selectedName ? `для ${selectedName}` : ''}
                                </Typography>
                                {selectedChild !== 'all' && (
                                    <Button size="small" startIcon={<EditIcon />} onClick={handleAddNote} sx={{ textTransform: 'none' }}>
                                        + Заметка
                                    </Button>
                                )}
                            </Box>
                            
                            {selectedChild === 'all' ? (
                                <Box sx={{ textAlign: 'center', py: 4, color: '#9CA3AF' }}>
                                    <EditIcon sx={{ fontSize: 48, mb: 1 }} />
                                    <Typography>Выберите ребёнка для заметок</Typography>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {stickyNotes.map(note => (
                                        <Paper key={note.id}
                                            sx={{ p: 2, bgcolor: note.color, borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative', width: note.width || 260, minHeight: note.height || 150, overflow: 'auto', '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.12)' } }}>
                                            {editingNote === note.id ? (
                                                <Box>
                                                    <TextField fullWidth multiline minRows={3} value={editText} onChange={(e) => setEditText(e.target.value)} variant="standard" autoFocus sx={{ mb: 1 }} />
                                                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                        <Button size="small" onClick={() => setEditingNote(null)}>Отмена</Button>
                                                        <Button size="small" variant="contained" onClick={handleSaveNote} startIcon={<SaveIcon />}>Сохранить</Button>
                                                    </Box>
                                                </Box>
                                            ) : (
                                                <Box>
                                                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', color: '#374151', fontSize: '0.9rem', lineHeight: 1.6 }}>{note.text}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', mt: 1 }}>
                                                        <IconButton size="small" onClick={() => handleEditNote(note)}><EditIcon sx={{ fontSize: 16 }} /></IconButton>
                                                        <IconButton size="small" onClick={() => handleDeleteNote(note.id)}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                                                    </Box>
                                                </Box>
                                            )}
                                            <Box onMouseDown={(e) => {
                                                e.preventDefault(); e.stopPropagation();
                                                const startX = e.clientX; const startY = e.clientY;
                                                const startW = note.width || 260; const startH = note.height || 150;
                                                const mm = (e) => { setStickyNotes(prev => prev.map(n => n.id === note.id ? { ...n, width: Math.max(200, startW + e.clientX - startX), height: Math.max(120, startH + e.clientY - startY) } : n)); };
                                                const mu = () => { document.removeEventListener('mousemove', mm); document.removeEventListener('mouseup', mu); };
                                                document.addEventListener('mousemove', mm); document.addEventListener('mouseup', mu);
                                            }} sx={{ position: 'absolute', bottom: 4, right: 4, width: 16, height: 16, cursor: 'nwse-resize', borderRight: '2px solid #94A3B8', borderBottom: '2px solid #94A3B8', opacity: 0.5, '&:hover': { opacity: 1 } }} />
                                        </Paper>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        </LocalizationProvider>
    );
}

export default ParentDashboard;