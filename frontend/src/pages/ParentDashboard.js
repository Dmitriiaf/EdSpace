// ========== frontend/src/pages/ParentDashboard.js (v5 — ФИНАЛ) ==========
import React, { useState, useEffect } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, Chip, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Avatar, LinearProgress, Fade, Grow,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Badge, List, ListItem, ListItemText, Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon, Payment as PaymentIcon, History as HistoryIcon,
    School as SchoolIcon, Person as PersonIcon, Refresh as RefreshIcon,
    Notifications as NotificationsIcon, Close as CloseIcon,
    CardGiftcard as SubscriptionIcon, Warning as WarningIcon,
    CameraAlt as CameraIcon, Assessment as AssessmentIcon,
    Grade as GradeIcon, TrendingUp as TrendingUpIcon,
    Assignment as AssignmentIcon, CalendarToday as CalendarIcon,
    AccessTime as AccessTimeIcon, EmojiEvents as EmojiEventsIcon,
    Chat as ChatIcon, Celebration as CelebrationIcon, Bolt as BoltIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { formatLessonTime } from '../utils/timezone';
import { getLessonsByStudent, confirmPayment } from '../services/api';
import { format, isAfter, differenceInDays, differenceInHours } from 'date-fns';
import { ru } from 'date-fns/locale';

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

    useEffect(() => { if (user?.id) loadChildren(); }, [user]);
    useEffect(() => { if (selectedChild !== 'all') fetchChildProgress(selectedChild); else setProgressData(null); }, [selectedChild]);

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

    const getFiltered = (arr) => selectedChild === 'all' ? arr : arr.filter(i => i.childId === parseInt(selectedChild));
    const getPendingPayments = () => {
        const now = new Date(); const eom = new Date(now.getFullYear(), now.getMonth()+1, 0);
        return allLessons.filter(l => l.status === 'COMPLETED' && new Date(l.lessonDate) <= eom && !activeSubscriptions.some(s => s.studentId === l.student?.id));
    };
    const getStatus = (l) => {
        if (activeSubscriptions.some(s => s.studentId === l.student?.id)) return l.status === 'CANCELLED' ? { l: 'Отменено', c: 'error' } : { l: 'Оплачено (абонемент)', c: 'success' };
        if (l.status === 'PAID') return { l: '✅ Оплачено', c: 'success' };
        const m = { COMPLETED: { l: 'Проведено', c: 'warning' }, CANCELLED: { l: 'Отменено', c: 'error' }, RESCHEDULED: { l: 'Перенесено', c: 'secondary' } };
        return m[l.status] || { l: 'Запланировано', c: 'info' };
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

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '80vh', alignItems: 'center' }}><EdSpaceLoader text="Загрузка..." /></Box>;

    const nextLesson = getNextLesson();
    const quickStats = getQuickStats();

    return (
        <Box sx={{ maxWidth: 1100, mx: 'auto', p: { xs: 2, sm: 4 } }}>
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
                                        label={`${format(new Date(lesson.lessonDate), 'd MMM', { locale: ru })} ${lesson.startTime?.slice(0, 5)}`}
                                        size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', fontSize: '12px', height: 28, border: '1px solid rgba(255,255,255,0.25)', '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } }} />
                                ))}
                                {allLessons.filter(l => l.childId === parseInt(selectedChild) && (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') && new Date(l.lessonDate) >= new Date()).length === 0 && 
                                    <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>Нет предстоящих занятий</Typography>}
                            </Box>
                            {nextLesson && (
                                <Chip icon={<AccessTimeIcon sx={{ color: '#FDE68A !important' }} />}
                                    label={`Ближайшее: ${format(new Date(nextLesson.lessonDate), 'd MMM', { locale: ru })} ${nextLesson.startTime?.slice(0, 5)}`}
                                    sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#FDE68A', fontWeight: 600, borderRadius: '10px', fontSize: '13px', height: 32, border: '1px solid rgba(253,232,138,0.3)' }} />
                            )}
                        </Box>
                    )}
                </Box>
            </HeroPaper>

            {/* ========== БЫСТРАЯ СТАТИСТИКА ========== */}
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

            {/* ========== БЛОКИ ОПЛАТЫ ========== */}
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

            {/* ========== РЕКОМЕНДАЦИЯ ========== */}
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

            {/* ========== ВКЛАДКИ ========== */}
            <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                <Tabs value={tabValue} onChange={(e,v) => setTabValue(v)} variant="fullWidth" sx={{ bgcolor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <StyledTab icon={<CalendarIcon sx={{ fontSize: 18 }} />} label="Занятия" iconPosition="start" />
                    <StyledTab icon={<PaymentIcon sx={{ fontSize: 18 }} />} label="Платежи" iconPosition="start" />
                    <StyledTab icon={<AssessmentIcon sx={{ fontSize: 18 }} />} label="Успеваемость" iconPosition="start" />
                </Tabs>
                <Box sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <Box>
                            {selectedName && <Typography sx={{ fontWeight: 600, mb: 2, color: '#1F2937', fontSize: '16px' }}>{selectedName}</Typography>}
                            {getFiltered(allLessons).length === 0 ? <Alert severity="info">Нет занятий</Alert> : 
                                getFiltered(allLessons).map(l => { const s = getStatus(l); return (
                                <Card key={l.id} sx={{ mb: 1.5, borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: 'none', '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } }}>
                                    <CardContent sx={{ p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', width: 42, height: 42, fontSize: 16, fontWeight: 600 }}>{l.childName?.[0] || '?'}</Avatar>
                                            <Box>
                                                <Typography sx={{ fontWeight: 600 }}>{l.childName}</Typography>
                                                <Typography variant="body2" sx={{ color: '#6B7280' }}>{l.course?.name || 'Занятие'} • {l.tutor?.fullName}</Typography>
                                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>{fmtDate(l.lessonDate)} {l.startTime?.slice(0,5)}–{l.endTime?.slice(0,5)}</Typography>
                                            </Box>
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getStudentRateForTutor(l.student, l.tutor?.id) && l.status === 'COMPLETED' && !activeSubscriptions.some(s => s.studentId === l.student?.id) && (
                                                <Button size="small" variant="outlined" startIcon={<PaymentIcon />} onClick={() => payLesson(l)}
                                                    sx={{ borderRadius: '8px', color: '#D97706', borderColor: '#FDE68A', fontSize: '12px' }}>Оплатить</Button>
                                            )}
                                            <Chip label={s.l} color={s.c} size="small" />
                                        </Box>
                                    </CardContent>
                                </Card>
                            )})}
                        </Box>
                    )}
                    {tabValue === 1 && (
                        <Box>
                            {selectedName && <Typography sx={{ fontWeight: 600, mb: 2, color: '#1F2937', fontSize: '16px' }}>{selectedName}</Typography>}
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
                                    <Typography sx={{ fontWeight: 600, mb: 3, color: '#1F2937', fontSize: '18px' }}>Успеваемость {selectedName}</Typography>
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
        </Box>
    );
}

export default ParentDashboard;