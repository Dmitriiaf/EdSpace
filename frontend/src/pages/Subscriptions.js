// ========== frontend/src/pages/Subscriptions.js (v4 — с кнопкой Активировать) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, FormControl, InputLabel,
    Select, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Chip,
    Alert, Snackbar, Grid, Card, CardContent, Typography,
    Avatar, Tooltip, TableSortLabel, InputAdornment,
    Pagination, CircularProgress, Tabs, Tab, Divider,
    LinearProgress, Fade
} from '@mui/material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import {
    Edit, Delete, Refresh,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    Timeline as TimelineIcon,
    CardGiftcard as SubscriptionIcon,
    Clear as ClearIcon,
    PlayCircle as ActivateIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format, startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance, { getAllLessons } from '../services/api';

// ========== СТИЛИ ==========

const SubscriptionCard = styled(Card)({
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'visible',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    '&:hover': { 
        transform: 'translateY(-2px)', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
});

const ExpiringBadge = styled(Box)({
    position: 'absolute',
    top: -10,
    right: 16,
    color: '#FFFFFF',
    px: 1.5,
    py: 0.5,
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 600,
    zIndex: 2,
});

const ProgressBar = styled(Box)({
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
});

const ProgressFill = styled(Box)(({ width, color }) => ({
    height: '100%',
    backgroundColor: color || '#4F46E5',
    borderRadius: '4px',
    width: `${width}%`,
    transition: 'width 0.4s ease',
}));

// ========== УТИЛИТЫ ==========

function getAvatarColor(name) {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#059669', '#3B82F6', '#2563EB', '#6366F1'];
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
function Subscriptions() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [editFormData, setEditFormData] = useState({ lessonsCount: '', price: '', debtLessons: 0 });
    const [subscriptions, setSubscriptions] = useState([]);
    const [students, setStudents] = useState([]);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('active');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        if (user && user.id) fetchData();
    }, [user]);

    const fetchData = async () => {
        if (!user || !user.id) return;
        try {
            setLoading(true);
            const [studentsRes, lessonsRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${user.id}`),
                getAllLessons(user.id)
            ]);
            const studentsData = studentsRes.data || [];
            setStudents(studentsData);
            setAllLessons(lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes);
            
            let allSubscriptions = [];
            const subscriptionStudents = studentsData.filter(s => s.paymentType === 'subscription');
            for (const student of subscriptionStudents) {
                try {
                    const subsRes = await axiosInstance.get(`/subscriptions/student/${student.id}`);
                    allSubscriptions = [...allSubscriptions, ...subsRes.data.map(sub => ({
                        ...sub,
                        studentName: student.fullName,
                        studentId: student.id,
                        ratePerLesson: getStudentRateForTutor(student, user?.id)
                    }))];
                } catch (err) {
                    console.error(`Ошибка загрузки абонементов для ученика ${student.id}:`, err);
                }
            }
            allSubscriptions.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
            setSubscriptions(allSubscriptions);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки данных:', err);
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    // ✅ НОВОЕ: Активация абонемента
    const handleActivate = async (subscriptionId) => {
        if (!window.confirm('Активировать абонемент? Будет создан платёж на полную стоимость.')) return;
        try {
            await axiosInstance.patch(`/subscriptions/${subscriptionId}/activate`);
            showSnackbar('✅ Абонемент активирован, платёж создан', 'success');
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleEditSubscription = (subscription) => {
        setEditingSubscription(subscription);
        setEditFormData({ 
            lessonsCount: subscription.lessonsCount, 
            price: subscription.price,
            debtLessons: subscription.debtLessons || 0
        });
        setEditDialogOpen(true);
    };

    const handleUpdateSubscription = async () => {
        try {
            await axiosInstance.put(`/subscriptions/${editingSubscription.id}`, {
                lessonsCount: parseInt(editFormData.lessonsCount),
                price: parseFloat(editFormData.price),
                debtLessons: parseInt(editFormData.debtLessons) || 0
            });
            showSnackbar('Абонемент обновлён', 'success');
            setEditDialogOpen(false);
            fetchData();
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка обновления', 'error');
        }
    };

    const handleDeleteSubscription = async (id) => {
        if (window.confirm('Удалить абонемент?')) {
            try {
                await axiosInstance.delete(`/subscriptions/${id}`);
                showSnackbar('Абонемент удалён', 'success');
                fetchData();
            } catch (err) {
                showSnackbar('Ошибка удаления', 'error');
            }
        }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const getStatusBadge = (status) => {
        switch(status) {
            case 'active':
            case 'ACTIVE':
                return (
                    <Box className="badge badge-success">
                        <CheckIcon sx={{ fontSize: 12 }} />
                        Активен
                    </Box>
                );
            case 'pending':
            case 'PENDING':
                return (
                    <Box className="badge badge-info">
                        <WarningIcon sx={{ fontSize: 12 }} />
                        Ожидает оплаты
                    </Box>
                );
            case 'completed':
            case 'COMPLETED':
            case 'EXPIRED':
                return (
                    <Box className="badge badge-neutral">
                        Завершён
                    </Box>
                );
            default:
                return (
                    <Box className="badge badge-neutral">
                        {status}
                    </Box>
                );
        }
    };

    const getRemainingDays = (endDate) => {
        const today = new Date();
        const end = new Date(endDate);
        const days = differenceInDays(end, today);
        return Math.max(0, days);
    };

    const getProgress = (used, total) => total === 0 ? 0 : (used / total) * 100;

    const getFilteredSubscriptions = () => {
        if (viewMode === 'active') return subscriptions.filter(s => 
            s.status === 'ACTIVE' || s.status === 'active' || 
            s.status === 'PENDING' || s.status === 'pending'
        );
        if (viewMode === 'history') return subscriptions.filter(s => 
            s.status === 'EXPIRED' || s.status === 'COMPLETED' || s.status === 'completed'
        );
        return subscriptions;
    };

    const stats = {
        active: subscriptions.filter(s => s.status === 'ACTIVE' || s.status === 'active').length,
        pending: subscriptions.filter(s => s.status === 'PENDING' || s.status === 'pending').length,
        completed: subscriptions.filter(s => s.status === 'EXPIRED' || s.status === 'COMPLETED' || s.status === 'completed').length,
        totalLessons: subscriptions.reduce((sum, s) => sum + (s.lessonsCount || 0), 0),
        usedLessons: subscriptions.reduce((sum, s) => sum + (s.lessonsUsed || 0), 0),
        totalRevenue: subscriptions.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
    };

    const filteredSubscriptions = getFilteredSubscriptions();

    const statItems = [
        { label: 'Активных', value: stats.active, color: '#10B981', bg: '#ECFDF5' },
        { label: 'Ожидают оплаты', value: stats.pending, color: '#F59E0B', bg: '#FFFBEB' },
        { label: 'Завершённых', value: stats.completed, color: '#6B7280', bg: '#F3F4F6' },
        { label: 'Использовано', value: stats.totalLessons > 0 ? `${Math.round((stats.usedLessons / stats.totalLessons) * 100)}%` : '0%', color: '#7C3AED', bg: '#F5F3FF' },
    ];

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {statItems.map((item, idx) => (
                        <Grid item xs={6} sm={3} key={idx}>
                            <StatCard>
                                <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                        <Typography sx={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{item.value}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{item.label}</Typography>
                                </CardContent>
                            </StatCard>
                        </Grid>
                    ))}
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'inline-flex', backgroundColor: '#F3F4F6', borderRadius: '10px', p: '3px' }}>
                        {[
                            { value: 'active', label: 'Активные' },
                            { value: 'history', label: 'История' },
                            { value: 'all', label: 'Все' },
                        ].map(t => (
                            <Button key={t.value} onClick={() => setViewMode(t.value)}
                                sx={{ py: 1, px: 2, borderRadius: '8px', border: 'none', backgroundColor: viewMode === t.value ? '#FFFFFF' : 'transparent', color: viewMode === t.value ? '#1F2937' : '#6B7280', fontSize: '14px', fontWeight: 500, textTransform: 'none', boxShadow: viewMode === t.value ? '0 1px 3px rgba(0,0,0,0.08)' : 'none', minWidth: 'auto', '&:hover': { backgroundColor: viewMode === t.value ? '#FFFFFF' : '#F9FAFB' } }}>
                                {t.label}
                            </Button>
                        ))}
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                {filteredSubscriptions.length === 0 ? (
                    <Paper sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <EmptyStateContainer>
                            <EmptyStateIcon><SubscriptionIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                                {viewMode === 'active' ? 'Нет активных абонементов' : viewMode === 'history' ? 'Нет завершённых абонементов' : 'Нет абонементов'}
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                                {viewMode === 'active' ? 'Абонементы появятся после создания ученика с типом оплаты "Абонемент"' : 'Здесь будут отображаться завершённые абонементы'}
                            </Typography>
                        </EmptyStateContainer>
                    </Paper>
                ) : (
                    <Grid container spacing={2.5}>
                        {filteredSubscriptions.map((sub) => {
                            const remainingDays = getRemainingDays(sub.endDate);
                            const progress = getProgress(sub.lessonsUsed || 0, sub.lessonsCount);
                            const isExpiring = remainingDays <= 7 && remainingDays > 0 && (sub.status === 'ACTIVE' || sub.status === 'active');
                            const isOverdue = remainingDays === 0 && (sub.status === 'ACTIVE' || sub.status === 'active');
                            const isPending = sub.status === 'PENDING' || sub.status === 'pending';
                            const studentName = sub.studentName || 'Неизвестно';
                            const avatarColor = getAvatarColor(studentName);
                            
                            return (
                                <Grid item xs={12} md={6} key={sub.id}>
                                    <SubscriptionCard>
                                        {isExpiring && <ExpiringBadge sx={{ bgcolor: '#F59E0B' }}>Заканчивается через {remainingDays} дн.</ExpiringBadge>}
                                        {isOverdue && <ExpiringBadge sx={{ bgcolor: '#EF4444' }}>Срок истёк</ExpiringBadge>}
                                        
                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ bgcolor: avatarColor, width: 44, height: 44, fontSize: 16, fontWeight: 600 }}>{getInitials(studentName)}</Avatar>
                                                    <Box>
                                                        <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1F2937' }}>{studentName}</Typography>
                                                        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>Ставка: {sub.ratePerLesson?.toLocaleString() || 0} ₽/занятие</Typography>
                                                        {sub.debtLessons > 0 && <Typography sx={{ fontSize: '13px', color: '#EF4444', fontWeight: 500 }}>Пропущено: {sub.debtLessons}</Typography>}
                                                    </Box>
                                                </Box>
                                                {getStatusBadge(sub.status)}
                                            </Box>

                                            <Divider sx={{ my: 1.5, borderColor: '#F3F4F6' }} />

                                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                                {[
                                                    { label: 'Всего', value: sub.lessonsCount, color: '#3B82F6' },
                                                    { label: 'Использовано', value: sub.lessonsUsed || 0, color: '#10B981' },
                                                    { label: 'Осталось', value: (sub.lessonsCount || 0) - (sub.lessonsUsed || 0), color: '#F59E0B' },
                                                ].map((item, idx) => (
                                                    <Grid item xs={4} key={idx}>
                                                        <Box sx={{ textAlign: 'center' }}>
                                                            <Typography sx={{ fontSize: '20px', fontWeight: 600, color: item.color }}>{item.value}</Typography>
                                                            <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>{item.label}</Typography>
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>

                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>Прогресс</Typography>
                                                    <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#1F2937' }}>{Math.round(progress)}%</Typography>
                                                </Box>
                                                <ProgressBar>
                                                    <ProgressFill width={progress} color={progress >= 80 ? '#10B981' : progress >= 50 ? '#4F46E5' : '#F59E0B'} />
                                                </ProgressBar>
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                        {sub.startDate ? format(new Date(sub.startDate), 'd MMM yyyy', { locale: ru }) : '-'} — {sub.endDate ? format(new Date(sub.endDate), 'd MMM yyyy', { locale: ru }) : '-'}
                                                    </Typography>
                                                </Box>
                                                <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '16px' }}>{parseFloat(sub.price || 0).toLocaleString()} ₽</Typography>
                                            </Box>

                                            {(sub.status === 'ACTIVE' || sub.status === 'active') && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderRadius: '8px', bgcolor: isOverdue ? '#FEF2F2' : isExpiring ? '#FFFBEB' : '#F3F4F6' }}>
                                                    <WarningIcon sx={{ fontSize: 16, color: isOverdue ? '#EF4444' : isExpiring ? '#F59E0B' : '#9CA3AF' }} />
                                                    <Typography sx={{ fontSize: '12px', color: isOverdue ? '#991B1B' : isExpiring ? '#92400E' : '#6B7280' }}>
                                                        {isOverdue ? 'Абонемент просрочен' : isExpiring ? `Осталось ${remainingDays} дн.` : `Действует до ${sub.endDate ? format(new Date(sub.endDate), 'd MMM yyyy', { locale: ru }) : '-'}`}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                        
                                        <Divider sx={{ borderColor: '#F3F4F6' }} />
                                        
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {/* ✅ КНОПКА АКТИВИРОВАТЬ — только для PENDING */}
                                            {isPending && (
                                                <Tooltip title="Активировать (создаст платёж)">
                                                    <IconButton size="small" onClick={() => handleActivate(sub.id)} sx={{ color: '#10B981', '&:hover': { color: '#059669', bgcolor: '#ECFDF5' } }}>
                                                        <ActivateIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            
                                            {(isPending || sub.status === 'ACTIVE' || sub.status === 'active') && (
                                                <>
                                                    <Tooltip title="Пересчитать занятия">
                                                        <IconButton size="small" onClick={async () => {
                                                            if (!window.confirm('Пересчитать использованные занятия по абонементу?')) return;
                                                            try {
                                                                await axiosInstance.post(`/subscriptions/${sub.id}/recalculate`);
                                                                showSnackbar('✅ Абонемент пересчитан', 'success');
                                                                fetchData();
                                                            } catch (err) {
                                                                showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
                                                            }
                                                        }} sx={{ color: '#10B981', '&:hover': { color: '#059669' } }}>
                                                            <Refresh fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Редактировать">
                                                        <IconButton size="small" onClick={() => handleEditSubscription(sub)} sx={{ color: '#6B7280', '&:hover': { color: '#4F46E5' } }}>
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" onClick={() => handleDeleteSubscription(sub.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </SubscriptionCard>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                <StyledDialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Редактировать абонемент</DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>Изменение количества занятий или цены абонемента.</Alert>
                            <TextField fullWidth label="Количество занятий" type="number" value={editFormData.lessonsCount} onChange={(e) => setEditFormData({...editFormData, lessonsCount: e.target.value})} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField fullWidth label="Сумма (₽)" type="number" value={editFormData.price} onChange={(e) => setEditFormData({...editFormData, price: e.target.value})} required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField fullWidth label="Пропущено занятий" type="number" value={editFormData.debtLessons} onChange={(e) => setEditFormData({...editFormData, debtLessons: e.target.value})}
                                helperText="Количество неиспользованных занятий по вине ученика" inputProps={{ min: 0 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setEditDialogOpen(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleUpdateSubscription} variant="contained" sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>Сохранить</StyledButton>
                    </DialogActions>
                </StyledDialog>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
}

export default Subscriptions;