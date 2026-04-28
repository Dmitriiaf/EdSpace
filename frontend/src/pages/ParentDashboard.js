// ========== frontend/src/pages/ParentDashboard.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
// ✅ Правильный импорт
import axiosInstance from '../api/axiosConfig';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, Chip, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Tabs, Tab, Avatar,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Badge, List, ListItem, ListItemText,
    Divider
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
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
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
// ✅ Импорт из объединённого API
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
                    // Загружаем актуальный список детей из API
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
                    
                    // Загружаем все данные для этих детей
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

    const handleUploadReceipt = async (paymentId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        try {
            await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('✅ Чек загружен!');
            fetchAllData(childrenList);
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось загрузить чек'));
        }
    };

    const fetchPendingSubscriptions = async (children) => {
        try {
            let allPending = [];
            let allActive = [];
            
            for (const child of children) {
                try {
                    // ✅ Исправлено: axiosInstance и правильный URL
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

    const handleAdditionalPayment = async (subscription) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,.pdf,.doc,.docx';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 2MB');
                return;
            }
            
            if (!window.confirm(`Доплатить ${subscription.remainingAmount} ₽?`)) return;
            
            try {
                // 1. Создаём платёж
                const paymentRes = await axiosInstance.post('/payments', {
                    tutorId: subscription.tutor?.id,
                    studentId: subscription.studentId || subscription.student?.id,
                    amount: subscription.remainingAmount,
                    paymentType: 'subscription',
                    status: 'PAID'
                });
                const paymentId = paymentRes.data.id;
                if (!paymentId) { alert('Ошибка: не удалось создать платёж'); return; }
                
                // 2. Загружаем чек
                const formData = new FormData();
                formData.append('file', file);
                await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                // 3. Доплата
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
        };
        fileInput.click();
    };

    const handlePaySubscription = async (subscription) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,.pdf,.doc,.docx';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 2MB');
                return;
            }
            
            try {
                // 1. Создаём платёж
                const paymentRes = await axiosInstance.post('/payments', {
                    tutorId: subscription.tutor?.id,
                    studentId: subscription.studentId || subscription.student?.id,
                    amount: subscription.price,
                    paymentType: 'subscription',
                    status: 'PAID'
                });
                const paymentId = paymentRes.data.id;
                if (!paymentId) { alert('Ошибка: не удалось создать платёж'); return; }
                
                // 2. Загружаем чек
                const formData = new FormData();
                formData.append('file', file);
                await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                // 3. Активируем абонемент
                await axiosInstance.post(`/subscriptions/${subscription.id}/pay`, {});
                
                alert('✅ Чек загружен! Репетитор подтвердит оплату.');
                fetchAllData(childrenList);
                fetchPendingSubscriptions(childrenList);
                checkPartiallyPaidSubscriptions(childrenList);
            } catch (err) {
                alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось загрузить чек'));
            }
        };
        fileInput.click();
    };

    const fetchAllData = async (children) => {
        try {
            // ✅ Исправлено: axiosInstance
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

    const handlePayLesson = async (lesson) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        // Разрешены изображения и PDF
        fileInput.accept = 'image/*,.pdf,.doc,.docx';                   fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (file.size > 2 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 2MB');
                return;
            }
            
            try {
                // 1. Создаём платёж
                const paymentRes = await axiosInstance.post(`/payments/lesson`, {
                    tutorId: lesson.tutor?.id,
                    studentId: lesson.student?.id,
                    amount: getStudentRateForTutor(lesson.student, lesson.tutor?.id),
                    paymentType: 'single'
                });
                
                const paymentId = paymentRes.data.id;
                
                if (!paymentId) {
                    alert('Ошибка: не удалось создать платёж');
                    return;
                }
                
                // 2. Загружаем чек
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
        };
        fileInput.click();
    };

    const handleConfirmPayment = async () => {
        if (!selectedLesson) return;
        
        try {
            // ✅ Исправлено: API-функция
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
        
        // Показываем только уроки до конца текущего месяца
        return lessons.filter(l => {
            const d = new Date(l.lessonDate);
            return d <= endOfMonth;
        });
    };
    const getFilteredPayments = () => {
        if (selectedChild === 'all') {
            return allPayments;
        }
        return allPayments.filter(p => p.childId === parseInt(selectedChild));
    };

    const getPendingPayments = () => {
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return allLessons.filter(l => {
            if (l.status !== 'COMPLETED') return false;
            
            const d = new Date(l.lessonDate);
            if (d > endOfMonth) return false;
            
            const hasActiveSubscription = activeSubscriptions.some(s => 
                s.studentId === l.student?.id
            );
            if (hasActiveSubscription) return false;
            
            return true;
        });
    };

    const getFilteredPendingSubscriptions = () => {
        if (selectedChild === 'all') {
            return pendingSubscriptions;
        }
        return pendingSubscriptions.filter(s => s.childId === parseInt(selectedChild));
    };

    const getFilteredPartiallyPaidSubscriptions = () => {
        if (selectedChild === 'all') {
            return partiallyPaidSubscriptions;
        }
        return partiallyPaidSubscriptions.filter(s => s.childId === parseInt(selectedChild));
    };

    const getLessonStatus = (lesson) => {
        const hasActiveSubscription = activeSubscriptions.some(s => 
            s.studentId === lesson.student?.id
        );
        
        // Для активного абонемента все уроки считаются оплаченными
        if (hasActiveSubscription) {
            if (lesson.status === 'CANCELLED') return { label: 'Отменено', color: 'error' };
            if (lesson.status === 'SCHEDULED') return { label: 'Запланировано (абонемент)', color: 'info' };
            return { label: 'Оплачено (абонемент)', color: 'success' };
        }
        
        if (lesson.status === 'CONFIRMED') {
            return { label: '✅ Оплачено (подтверждено)', color: 'success' };
        }
        if (lesson.status === 'PAID') {
            return { label: '⏳ Оплачено (ожидает подтверждения)', color: 'warning' };
        }
        
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
        return `${date.toLocaleDateString('ru-RU')} ${timeStr?.slice(0,5) || ''}`;
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
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">
                    Здравствуйте, {user?.fullName}! 👋
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
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
                    >
                        {refreshing ? 'Обновление...' : 'Обновить'}
                    </Button>
                </Box>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {childrenList.length > 0 && (
                <Paper sx={{ p: 2, mb: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Выберите ребенка</InputLabel>
                                <Select
                                    value={selectedChild}
                                    onChange={handleChildChange}
                                    label="Выберите ребенка"
                                >
                                    <MenuItem value="all">Все дети</MenuItem>
                                    {childrenList.map(child => (
                                        <MenuItem key={child.id} value={child.id}>
                                            {child.fullName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {filteredPartiallyPaidSubscriptions.length > 0 && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#FFF8E1' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WarningIcon color="warning" />
                        Требуется доплата за дополнительные занятия
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ребенок</TableCell>
                                    <TableCell>Период</TableCell>
                                    <TableCell align="center">Занятий</TableCell>
                                    <TableCell align="right">Оплачено</TableCell>
                                    <TableCell align="right">Осталось</TableCell>
                                    <TableCell align="right">Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPartiallyPaidSubscriptions.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: '#ED6C02' }}>
                                                    {sub.childName?.[0] || '?'}
                                                </Avatar>
                                                {sub.childName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(sub.startDate).toLocaleDateString()} - 
                                            {new Date(sub.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center">{sub.lessonsCount}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body2" color="success.main">
                                                {sub.paidAmount.toLocaleString()} ₽
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body1" fontWeight="bold" color="warning.main">
                                                {sub.remainingAmount.toLocaleString()} ₽
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                color="warning"
                                                size="small"
                                                startIcon={<PaymentIcon />}
                                                onClick={() => handleAdditionalPayment(sub)}
                                            >
                                                Доплатить {sub.remainingAmount.toLocaleString()} ₽
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {filteredPendingSubscriptions.length > 0 && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#e8f5e9' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SubscriptionIcon color="primary" />
                        Абонементы, ожидающие оплаты
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ребенок</TableCell>
                                    <TableCell>Период</TableCell>
                                    <TableCell align="center">Занятий</TableCell>
                                    <TableCell align="right">Сумма</TableCell>
                                    <TableCell align="right">Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPendingSubscriptions.map(sub => (
                                    <TableRow key={sub.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: '#1976d2' }}>
                                                    {sub.childName?.[0] || '?'}
                                                </Avatar>
                                                {sub.childName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(sub.startDate).toLocaleDateString()} - 
                                            {new Date(sub.endDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell align="center">{sub.lessonsCount}</TableCell>
                                        <TableCell align="right">
                                            <Typography variant="body1" fontWeight="bold">
                                                {sub.price.toLocaleString()} ₽
                                            </Typography>
                                        </TableCell>
                                        <TableCell align="right">
                                            <Button
                                                variant="contained"
                                                color="success"
                                                size="small"
                                                startIcon={<PaymentIcon />}
                                                onClick={() => handlePaySubscription(sub)}
                                            >
                                                Оплатить абонемент
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {pendingPayments.length > 0 && (
                <Paper sx={{ p: 3, mb: 3, bgcolor: '#fff8e1' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PaymentIcon color="warning" />
                        Ожидают оплаты (поурочно)
                    </Typography>
                    
                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Ребенок</TableCell>
                                    <TableCell>Предмет</TableCell>
                                    <TableCell>Репетитор</TableCell>
                                    <TableCell>Дата и время</TableCell>
                                    <TableCell>Сумма</TableCell>
                                    <TableCell align="right">Действия</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pendingPayments.map(lesson => {
                                    const correctRate = getStudentRateForTutor(lesson.student, lesson.tutor?.id);
                                    return (
                                        <TableRow key={lesson.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: '#1976d2' }}>
                                                        {lesson.childName?.[0] || '?'}
                                                    </Avatar>
                                                    {lesson.childName}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    icon={<SchoolIcon />}
                                                    label={lesson.course?.name || 'Занятие'}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    icon={<PersonIcon />}
                                                    label={lesson.tutor?.fullName || 'Неизвестно'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDateTime(lesson.lessonDate, lesson.startTime)}
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body1" fontWeight="bold">
                                                    {correctRate || 0} ₽
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Button
                                                    variant="contained"
                                                    color="success"
                                                    size="small"
                                                    startIcon={<PaymentIcon />}
                                                    onClick={() => handlePayLesson(lesson)}
                                                >
                                                    Оплатить {correctRate || 0} ₽
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            <Paper sx={{ width: '100%', mb: 3 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                    <Tab icon={<HistoryIcon />} label="История занятий" />
                    <Tab icon={<PaymentIcon />} label="История платежей" />
                </Tabs>
            </Paper>

            <TabPanel value={tabValue} index={0}>
                <Typography variant="h5" gutterBottom>
                    История занятий {selectedChild !== 'all' ? getSelectedChildData()?.fullName : 'всех детей'}
                </Typography>
                
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Ребенок</TableCell>
                                <TableCell>Предмет</TableCell>
                                <TableCell>Репетитор</TableCell>
                                <TableCell>Дата и время</TableCell>
                                <TableCell>Статус</TableCell>
                                <TableCell>Заметки</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredLessons.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Alert severity="info">
                                            {selectedChild !== 'all' 
                                                ? `У ${getSelectedChildData()?.fullName} нет истории занятий` 
                                                : 'Нет истории занятий'}
                                        </Alert>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredLessons.map(lesson => {
                                    const status = getLessonStatus(lesson);
                                    return (
                                        <TableRow key={lesson.id}>
                                            <TableCell>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Avatar sx={{ width: 30, height: 30, bgcolor: '#1976d2' }}>
                                                        {lesson.childName?.[0] || '?'}
                                                    </Avatar>
                                                    {lesson.childName}
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    icon={<SchoolIcon />}
                                                    label={lesson.course?.name || 'Занятие'}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    icon={<PersonIcon />}
                                                    label={lesson.tutor?.fullName || 'Неизвестно'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {formatDateTime(lesson.lessonDate, lesson.startTime)}
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={status.label}
                                                    color={status.color}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {lesson.notes ? (
                                                    <Button 
                                                        size="small" 
                                                        variant="text" 
                                                        onClick={() => handleOpenNotes(lesson)}
                                                        startIcon={<EditIcon />}
                                                    >
                                                        Просмотреть
                                                    </Button>
                                                ) : '-'}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
                <Typography variant="h5" gutterBottom>
                    История платежей {selectedChild !== 'all' ? getSelectedChildData()?.fullName : 'всех детей'}
                </Typography>
                
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Ребенок</TableCell>
                                <TableCell>Предмет</TableCell>
                                <TableCell>Репетитор</TableCell>
                                <TableCell>Дата оплаты</TableCell>
                                <TableCell>За занятие от</TableCell>
                                <TableCell>Сумма</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPayments.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        <Alert severity="info">
                                            {selectedChild !== 'all' 
                                                ? `У ${getSelectedChildData()?.fullName} нет истории платежей` 
                                                : 'Нет истории платежей'}
                                        </Alert>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPayments.map(payment => (
                                    <TableRow key={payment.id}>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar sx={{ width: 30, height: 30, bgcolor: '#1976d2' }}>
                                                    {payment.childName?.[0] || '?'}
                                                </Avatar>
                                                {payment.childName}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={<SchoolIcon />}
                                                label={payment.courseName || payment.lesson?.course?.name || 'Занятие'}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                icon={<PersonIcon />}
                                                label={payment.tutorName || payment.tutor?.fullName || payment.lesson?.tutor?.fullName || 'Неизвестно'}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </TableCell>
                                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                        <TableCell>
                                            {payment.lessonDate ? formatDate(payment.lessonDate) : '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body1" fontWeight="bold">
                                                {payment.amount} ₽
                                            </Typography>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </TabPanel>

            <Dialog open={openNotifications} onClose={() => setOpenNotifications(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h6">Уведомления</Typography>
                        <IconButton onClick={() => setOpenNotifications(false)}>
                            <CloseIcon />
                        </IconButton>
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
                        <Typography variant="body1" gutterBottom>
                            Подтвердите оплату за занятие:
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>Ребенок:</strong> {selectedLesson?.childName}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Репетитор:</strong> {selectedLesson?.tutor?.fullName || 'Неизвестно'}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Дата:</strong> {selectedLesson?.lessonDate && formatDate(selectedLesson.lessonDate)}
                        </Typography>
                        <Typography variant="body2">
                            <strong>Время:</strong> {selectedLesson?.startTime?.slice(0,5)} - {selectedLesson?.endTime?.slice(0,5)}
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
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            📝 Что делали на уроке:
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                            <Typography variant="body1">
                                {selectedLessonNotes.notes}
                            </Typography>
                        </Paper>
                        
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                            🎯 Что сделать к следующему уроку:
                        </Typography>
                        <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                            <Typography variant="body1">
                                {selectedLessonNotes.nextLessonPlan}
                            </Typography>
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