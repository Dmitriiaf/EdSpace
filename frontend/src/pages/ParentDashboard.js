// ========== frontend/src/pages/ParentDashboard.js (МОБИЛЬНАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, Chip, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Tabs, Tab, Avatar,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Badge, List, ListItem, ListItemText,
    Divider
} from '@mui/material';
import {
    CheckCircle as CheckIcon,
    Payment as PaymentIcon,
    History as HistoryIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Refresh as RefreshIcon,
    Notifications as NotificationsIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    CardGiftcard as SubscriptionIcon,
    Warning as WarningIcon,
    CameraAlt as CameraIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { formatLessonTime } from '../utils/timezone';
import { getLessonsByStudent, confirmPayment } from '../services/api';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function ParentDashboard() {
    const { user } = useAuth();
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
    const [openNotifications, setOpenNotifications] = useState(false);
    const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
    const [openNotesDialog, setOpenNotesDialog] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [selectedLessonNotes, setSelectedLessonNotes] = useState({ notes: '', nextLessonPlan: '' });

    useEffect(() => {
        if (user && user.id) {
            const loadChildren = async () => {
                setLoading(true);
                try {
                    const childrenRes = await axiosInstance.get(`/students/parent/${user.id}`);
                    const freshChildren = (childrenRes.data || []).map(child => ({
                        id: child.id,
                        fullName: child.fullName,
                        email: child.email,
                        allIds: [child.id]
                    }));
                    
                    setChildrenList(freshChildren);
                    
                    if (freshChildren.length === 1) {
                        setSelectedChild(freshChildren[0].id);
                    }
                    
                    await fetchAllData(freshChildren);
                    await fetchPendingSubscriptions(freshChildren);
                    await checkPartiallyPaidSubscriptions(freshChildren);
                } catch (err) {
                    console.error('Ошибка загрузки:', err);
                    setError('Ошибка загрузки данных');
                } finally {
                    setLoading(false);
                }
            };
            loadChildren();
        } else {
            setLoading(false);
        }
    }, [user]);

    const fetchPendingSubscriptions = async (children) => {
        try {
            let allPending = [];
            let allActive = [];
            
            for (const child of children) {
                try {
                    const studentRes = await axiosInstance.get(`/students/${child.id}`);
                    const student = studentRes.data;
                    
                    if (student.paymentType === 'subscription') {
                        const response = await axiosInstance.get(`/subscriptions/student/${child.id}`);
                        
                        const pending = response.data.filter(s => s.status === 'pending');
                        const active = response.data.filter(s => s.status === 'active');
                        
                        const pendingWithChild = pending.map(sub => ({
                            ...sub,
                            childId: child.id,
                            childName: child.fullName,
                            studentId: child.id
                        }));
                        
                        const activeWithChild = active.map(sub => ({
                            ...sub,
                            childId: child.id,
                            childName: child.fullName,
                            studentId: child.id
                        }));
                        
                        allPending = [...allPending, ...pendingWithChild];
                        allActive = [...allActive, ...activeWithChild];
                    }
                } catch (err) {
                    console.error(`Ошибка загрузки для childId=${child.id}:`, err);
                }
            }
            setPendingSubscriptions(allPending);
            setActiveSubscriptions(allActive);
        } catch (err) {
            console.error('Ошибка загрузки абонементов:', err);
        }
    };

    const checkPartiallyPaidSubscriptions = async (children) => {
        try {
            let allPartiallyPaid = [];
            
            for (const child of children) {
                try {
                    const response = await axiosInstance.get(`/subscriptions/student/${child.id}`);
                    const subscriptions = response.data;
                    
                    for (const sub of subscriptions) {
                        if (sub.status === 'active') {
                            const paymentsRes = await axiosInstance.get(`/payments/student/${child.id}`);
                            
                            const paidAmount = paymentsRes.data
                                .filter(p => p.subscriptionId === sub.id && p.status === 'paid')
                                .reduce((sum, p) => sum + p.amount, 0);
                            
                            const remainingAmount = sub.price - paidAmount;
                            
                            if (remainingAmount > 0 && remainingAmount < sub.price) {
                                allPartiallyPaid.push({
                                    ...sub,
                                    childId: child.id,
                                    childName: child.fullName,
                                    paidAmount: paidAmount,
                                    remainingAmount: remainingAmount
                                });
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Ошибка загрузки для childId=${child.id}:`, err);
                }
            }
            
            setPartiallyPaidSubscriptions(allPartiallyPaid);
        } catch (err) {
            console.error('Ошибка проверки частичной оплаты:', err);
        }
    };

    const createFileInput = (onFileSelected) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.setAttribute('capture', 'environment');
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 2MB');
                return;
            }
            onFileSelected(file);
        };
        fileInput.click();
    };

    const handleAdditionalPayment = (subscription) => {
        createFileInput(async (file) => {
            if (!window.confirm(`Доплатить ${subscription.remainingAmount} ₽?`)) return;
            
            try {
                const paymentRes = await axiosInstance.post('/payments', {
                    tutorId: subscription.tutor?.id,
                    studentId: subscription.studentId || subscription.student?.id,
                    amount: subscription.remainingAmount,
                    paymentType: 'subscription',
                    status: 'PAID'
                });
                const paymentId = paymentRes.data.id;
                if (!paymentId) { alert('Ошибка: не удалось создать платёж'); return; }
                
                const formData = new FormData();
                formData.append('file', file);
                await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                await axiosInstance.post(`/subscriptions/${subscription.id}/additional-pay`, { 
                    amount: subscription.remainingAmount 
                });
                
                alert('✅ Чек загружен! Репетитор подтвердит оплату.');
                fetchAllData(childrenList);
                fetchPendingSubscriptions(childrenList);
                checkPartiallyPaidSubscriptions(childrenList);
            } catch (err) {
                alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось загрузить чек'));
            }
        });
    };

    const handlePaySubscription = (subscription) => {
        createFileInput(async (file) => {
            try {
                const paymentRes = await axiosInstance.post('/payments', {
                    tutorId: subscription.tutor?.id,
                    studentId: subscription.studentId || subscription.student?.id,
                    amount: subscription.price,
                    paymentType: 'subscription',
                    status: 'PAID'
                });
                const paymentId = paymentRes.data.id;
                if (!paymentId) { alert('Ошибка: не удалось создать платёж'); return; }
                
                const formData = new FormData();
                formData.append('file', file);
                await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                await axiosInstance.post(`/subscriptions/${subscription.id}/pay`, {});
                
                alert('✅ Чек загружен! Репетитор подтвердит оплату.');
                fetchAllData(childrenList);
                fetchPendingSubscriptions(childrenList);
                checkPartiallyPaidSubscriptions(childrenList);
            } catch (err) {
                alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось загрузить чек'));
            }
        });
    };

    const fetchAllData = async (children) => {
        try {
            try {
                const notificationsRes = await axiosInstance.get(`/notifications/parent/${user.id}`);
                setNotifications(notificationsRes.data || []);
            } catch (err) {
                console.error('Ошибка загрузки уведомлений:', err);
                setNotifications([]);
            }
            
            try {
                const unreadRes = await axiosInstance.get(`/notifications/parent/${user.id}/unread-count`);
                setUnreadCount(unreadRes.data.count || 0);
            } catch (err) {
                setUnreadCount(0);
            }
            
            let allLessonsData = [];
            let allPaymentsData = [];
            
            for (const child of children) {
                const allStudentIds = child.allIds || [child.id];
                
                for (const studentId of allStudentIds) {
                    try {
                        const lessonsRes = await getLessonsByStudent(studentId);
                        const lessonsArray = lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes;
                        const lessonsWithChild = lessonsArray.map(lesson => ({
                            ...lesson,
                            childId: child.id,
                            childName: child.fullName,
                            childEmail: child.email
                        }));
                        allLessonsData = [...allLessonsData, ...lessonsWithChild];
                    } catch (err) {
                        console.error(`Ошибка загрузки занятий для studentId=${studentId}:`, err);
                    }
                    
                    try {
                        const paymentsRes = await axiosInstance.get(`/payments/student/${studentId}`);
                        const paymentsWithChild = paymentsRes.data.map(payment => ({
                            ...payment,
                            childId: child.id,
                            childName: child.fullName
                        }));
                        allPaymentsData = [...allPaymentsData, ...paymentsWithChild];
                    } catch (err) {
                        console.error(`Ошибка загрузки платежей для studentId=${studentId}:`, err);
                    }
                }
            }
            
            allLessonsData.sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate));
            allPaymentsData.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));
            
            setAllLessons(allLessonsData);
            setAllPayments(allPaymentsData);
            setError(null);
            
        } catch (err) {
            console.error('Ошибка:', err);
            setError('Ошибка загрузки данных');
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            const childrenRes = await axiosInstance.get(`/students/parent/${user.id}`);
            const freshChildren = (childrenRes.data || []).map(child => ({
                id: child.id,
                fullName: child.fullName,
                email: child.email,
                allIds: [child.id]
            }));
            setChildrenList(freshChildren);
            await fetchAllData(freshChildren);
            await fetchPendingSubscriptions(freshChildren);
            await checkPartiallyPaidSubscriptions(freshChildren);
        } catch (err) {
            console.error('Ошибка обновления:', err);
        }
        setRefreshing(false);
    };

    const handleChildChange = (event) => {
        setSelectedChild(event.target.value);
    };

    const handleOpenNotifications = () => {
        setOpenNotifications(true);
        markAllAsRead();
    };

    const markAllAsRead = async () => {
        try {
            await axiosInstance.patch(`/notifications/parent/${user.id}/read-all`, {});
            setUnreadCount(0);
            const notificationsRes = await axiosInstance.get(`/notifications/parent/${user.id}`);
            setNotifications(notificationsRes.data || []);
        } catch (err) {
            console.error('Ошибка при отметке прочитанных:', err);
        }
    };

    const handlePayLesson = (lesson) => {
        createFileInput(async (file) => {
            try {
                const paymentRes = await axiosInstance.post(`/payments/lesson`, {
                    tutorId: lesson.tutor?.id,
                    studentId: lesson.student?.id,
                    amount: getStudentRateForTutor(lesson.student, lesson.tutor?.id),
                    paymentType: 'single',
                    lessonId: lesson.id
                });
                
                const paymentId = paymentRes.data.id;
                if (!paymentId) {
                    alert('Ошибка: не удалось создать платёж');
                    return;
                }
                
                const formData = new FormData();
                formData.append('file', file);
                
                await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                alert('✅ Чек загружен! Репетитор подтвердит оплату.');
                fetchAllData(childrenList);
            } catch (err) {
                console.error('Ошибка:', err);
                alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось загрузить чек'));
            }
        });
    };

    const handleConfirmPayment = async () => {
        if (!selectedLesson) return;
        
        try {
            await confirmPayment(selectedLesson.id);
            setOpenPaymentDialog(false);
            setSelectedLesson(null);
            await fetchAllData(childrenList);
            alert('✅ Оплата подтверждена!');
        } catch (err) {
            console.error('Ошибка при подтверждении оплаты:', err);
            alert(err.response?.data?.error || 'Ошибка при подтверждении оплаты');
        }
    };

    const handleOpenNotes = (lesson) => {
        setSelectedLessonNotes({
            notes: lesson.notes || 'Нет заметок',
            nextLessonPlan: lesson.nextLessonPlan || 'Нет плана'
        });
        setOpenNotesDialog(true);
    };

    const getFilteredLessons = () => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        let lessons = selectedChild === 'all' ? allLessons : allLessons.filter(l => l.childId === parseInt(selectedChild));
        
        return lessons.filter(l => {
            const d = new Date(l.lessonDate);
            return d <= endOfMonth;
        });
    };

    const getFilteredPayments = () => {
        if (selectedChild === 'all') return allPayments;
        return allPayments.filter(p => p.childId === parseInt(selectedChild));
    };

    const getPendingPayments = () => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return allLessons.filter(l => {
            if (l.status !== 'COMPLETED') return false;
            const d = new Date(l.lessonDate);
            if (d > endOfMonth) return false;
            const hasActiveSubscription = activeSubscriptions.some(s => s.studentId === l.student?.id);
            if (hasActiveSubscription) return false;
            return true;
        });
    };

    const getFilteredPendingSubscriptions = () => {
        if (selectedChild === 'all') return pendingSubscriptions;
        return pendingSubscriptions.filter(s => s.childId === parseInt(selectedChild));
    };

    const getFilteredPartiallyPaidSubscriptions = () => {
        if (selectedChild === 'all') return partiallyPaidSubscriptions;
        return partiallyPaidSubscriptions.filter(s => s.childId === parseInt(selectedChild));
    };

    const getLessonStatus = (lesson) => {
        const hasActiveSubscription = activeSubscriptions.some(s => s.studentId === lesson.student?.id);
        
        if (hasActiveSubscription) {
            if (lesson.status === 'CANCELLED') return { label: 'Отменено', color: 'error' };
            if (lesson.status === 'SCHEDULED') return { label: 'Запланировано (абонемент)', color: 'info' };
            return { label: 'Оплачено (абонемент)', color: 'success' };
        }
        
        if (lesson.status === 'CONFIRMED') return { label: '✅ Оплачено (подтверждено)', color: 'success' };
        if (lesson.status === 'PAID') return { label: '⏳ Оплачено (ожидает подтверждения)', color: 'warning' };
        
        switch(lesson.status) {
            case 'COMPLETED': return { label: 'Проведено (ждёт оплаты)', color: 'warning' };
            case 'CANCELLED': return { label: 'Отменено', color: 'error' };
            case 'RESCHEDULED': return { label: 'Перенесено', color: 'secondary' };
            case 'SCHEDULED': return { label: 'Запланировано', color: 'info' };
            default: return { label: lesson.status, color: 'default' };
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', { 
            day: 'numeric', 
            month: 'long',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateStr, timeStr) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return `${date.toLocaleDateString('ru-RU')} ${formatLessonTime(dateStr, timeStr) || ''}`;
    };

    const getSelectedChildData = () => {
        if (selectedChild === 'all') return null;
        return childrenList.find(c => c.id === parseInt(selectedChild));
    };

    const filteredLessons = getFilteredLessons();
    const filteredPayments = getFilteredPayments();
    const pendingPayments = getPendingPayments();
    const filteredPendingSubscriptions = getFilteredPendingSubscriptions();
    const filteredPartiallyPaidSubscriptions = getFilteredPartiallyPaidSubscriptions();

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '2rem' }, fontWeight: 600 }}>
                    {user?.fullName?.split(' ')[0]}! 👋
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={handleOpenNotifications}>
                        <Badge badgeContent={unreadCount} color="error">
                            <NotificationsIcon />
                        </Badge>
                    </IconButton>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={handleRefresh}
                        disabled={refreshing}
                        size="small"
                        sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                        {refreshing ? 'Обновление...' : 'Обновить'}
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {childrenList.length > 0 && (
                <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Ребёнок</InputLabel>
                        <Select value={selectedChild} onChange={handleChildChange} label="Ребёнок">
                            <MenuItem value="all">Все дети</MenuItem>
                            {childrenList.map(child => (
                                <MenuItem key={child.id} value={child.id}>{child.fullName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Paper>
            )}

            {/* ========== АБОНЕМЕНТЫ К ОПЛАТЕ ========== */}
            {filteredPendingSubscriptions.length > 0 && (
                <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 2, bgcolor: '#e8f5e9' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SubscriptionIcon color="primary" fontSize="small" />
                        Абонементы к оплате
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {filteredPendingSubscriptions.map(sub => (
                            <Card key={sub.id} sx={{ border: '1px solid #C8E6C9' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: 14 }}>
                                            {sub.childName?.[0] || '?'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{sub.childName}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {new Date(sub.startDate).toLocaleDateString()} – {new Date(sub.endDate).toLocaleDateString()}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary">{sub.lessonsCount} занятий</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{sub.price.toLocaleString()} ₽</Typography>
                                        </Box>
                                        <Button variant="contained" color="success" size="small" startIcon={<PaymentIcon />}
                                            onClick={() => handlePaySubscription(sub)}>
                                            Оплатить
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* ========== ДОПЛАТА ========== */}
            {filteredPartiallyPaidSubscriptions.length > 0 && (
                <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 2, bgcolor: '#FFF8E1' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" fontSize="small" />
                        Требуется доплата
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {filteredPartiallyPaidSubscriptions.map(sub => (
                            <Card key={sub.id} sx={{ border: '1px solid #FFCC80' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#ED6C02', fontSize: 14 }}>
                                            {sub.childName?.[0] || '?'}
                                        </Avatar>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{sub.childName}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Оплачено {sub.paidAmount.toLocaleString()} ₽ из {sub.price.toLocaleString()} ₽
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#E65100' }}>
                                            Ещё {sub.remainingAmount.toLocaleString()} ₽
                                        </Typography>
                                        <Button variant="contained" color="warning" size="small" startIcon={<PaymentIcon />}
                                            onClick={() => handleAdditionalPayment(sub)}>
                                            Доплатить
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Box>
                </Paper>
            )}

            {/* ========== ПОУРОЧНАЯ ОПЛАТА ========== */}
            {pendingPayments.length > 0 && (
                <Paper sx={{ p: { xs: 1.5, sm: 3 }, mb: 2, bgcolor: '#FFF8E1' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon color="warning" fontSize="small" />
                        Ожидают оплаты
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {pendingPayments.map(lesson => {
                            const correctRate = getStudentRateForTutor(lesson.student, lesson.tutor?.id);
                            return (
                                <Card key={lesson.id} sx={{ border: '1px solid #FFE0B2' }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#1976d2', fontSize: 14 }}>
                                                {lesson.childName?.[0] || '?'}
                                            </Avatar>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{lesson.childName}</Typography>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    <Chip icon={<SchoolIcon />} label={lesson.course?.name || 'Занятие'} size="small" variant="outlined" />
                                                    <Chip icon={<PersonIcon />} label={lesson.tutor?.fullName || '—'} size="small" variant="outlined" />
                                                </Box>
                                            </Box>
                                        </Box>
                                        <Typography variant="caption" color="textSecondary">
                                            {formatDateTime(lesson.lessonDate, lesson.startTime)}
                                        </Typography>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{correctRate || 0} ₽</Typography>
                                            <Button variant="contained" color="success" size="small" startIcon={<CameraIcon />}
                                                onClick={() => handlePayLesson(lesson)}>
                                                Оплатить
                                            </Button>
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </Box>
                </Paper>
            )}

            {/* ========== ВКЛАДКИ: ИСТОРИЯ ========== */}
            <Paper sx={{ width: '100%', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} variant="fullWidth">
                    <Tab icon={<HistoryIcon />} label="Занятия" sx={{ textTransform: 'none', fontSize: '0.8rem' }} />
                    <Tab icon={<PaymentIcon />} label="Платежи" sx={{ textTransform: 'none', fontSize: '0.8rem' }} />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedChild !== 'all' ? getSelectedChildData()?.fullName : 'Все дети'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {filteredLessons.length === 0 ? (
                        <Alert severity="info">Нет занятий</Alert>
                    ) : (
                        filteredLessons.map(lesson => {
                            const status = getLessonStatus(lesson);
                            return (
                                <Card key={lesson.id} sx={{ border: '1px solid #E0E0E0' }}>
                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', fontSize: 12 }}>
                                                        {lesson.childName?.[0] || '?'}
                                                    </Avatar>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {lesson.childName}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="body2" color="textSecondary">
                                                    {lesson.course?.name || 'Занятие'} с {lesson.tutor?.fullName || '—'}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 0.5 }}>
                                                    {formatDateTime(lesson.lessonDate, lesson.startTime)}
                                                </Typography>
                                                {lesson.notes && (
                                                    <Button size="small" variant="text" sx={{ mt: 0.5, p: 0, minWidth: 'auto', textTransform: 'none' }}
                                                        onClick={() => handleOpenNotes(lesson)}>
                                                        📝 Заметки
                                                    </Button>
                                                )}
                                            </Box>
                                            <Chip label={status.label} color={status.color} size="small" />
                                        </Box>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    {selectedChild !== 'all' ? getSelectedChildData()?.fullName : 'Все дети'}
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {filteredPayments.length === 0 ? (
                        <Alert severity="info">Нет платежей</Alert>
                    ) : (
                        filteredPayments.map(payment => (
                            <Card key={payment.id} sx={{ border: '1px solid #E0E0E0' }}>
                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#1976d2', fontSize: 12 }}>
                                            {payment.childName?.[0] || '?'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{payment.childName}</Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {payment.courseName || payment.lesson?.course?.name || 'Занятие'}
                                                {' • '}
                                                {payment.tutorName || payment.tutor?.fullName || '—'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Box>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatDate(payment.paymentDate)}
                                            </Typography>
                                            {payment.lessonDate && (
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                                                    Занятие: {formatDate(payment.lessonDate)}
                                                </Typography>
                                            )}
                                        </Box>
                                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                            {payment.amount} ₽
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </Box>
            </TabPanel>

            {/* ============ ДИАЛОГИ ============ */}
            <Dialog open={openNotifications} onClose={() => setOpenNotifications(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Уведомления</Typography>
                        <IconButton onClick={() => setOpenNotifications(false)}><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent>
                    {notifications.length === 0 ? (
                        <Alert severity="info">У вас нет уведомлений</Alert>
                    ) : (
                        <List>
                            {notifications.map(notification => (
                                <React.Fragment key={notification.id}>
                                    <ListItem>
                                        <ListItemText
                                            primary={notification.message}
                                            secondary={new Date(notification.createdAt).toLocaleString()}
                                            sx={{
                                                color: notification.isRead ? 'text.secondary' : 'text.primary',
                                                fontWeight: notification.isRead ? 'normal' : 'bold'
                                            }}
                                        />
                                    </ListItem>
                                    <Divider />
                                </React.Fragment>
                            ))}
                        </List>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNotifications(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)}>
                <DialogTitle>Подтверждение оплаты</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" sx={{ mt: 1 }}><strong>Ребенок:</strong> {selectedLesson?.childName}</Typography>
                        <Typography variant="body2"><strong>Репетитор:</strong> {selectedLesson?.tutor?.fullName || 'Неизвестно'}</Typography>
                        <Typography variant="body2"><strong>Дата:</strong> {selectedLesson?.lessonDate && formatDate(selectedLesson.lessonDate)}</Typography>
                        <Typography variant="body2">
                            <strong>Время:</strong> {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)} - {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.endTime)}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Сумма:</strong> {getStudentRateForTutor(selectedLesson?.student, selectedLesson?.tutor?.id) || 0} ₽
                        </Typography>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            После подтверждения репетитор увидит, что урок оплачен.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPaymentDialog(false)}>Отмена</Button>
                    <Button onClick={handleConfirmPayment} variant="contained" color="success" autoFocus>
                        ✅ Да, я оплатил
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Заметки к занятию</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>📝 Что делали на уроке:</Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                            <Typography variant="body1">{selectedLessonNotes.notes}</Typography>
                        </Paper>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>🎯 Что сделать к следующему уроку:</Typography>
                        <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                            <Typography variant="body1">{selectedLessonNotes.nextLessonPlan}</Typography>
                        </Paper>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenNotesDialog(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default ParentDashboard;