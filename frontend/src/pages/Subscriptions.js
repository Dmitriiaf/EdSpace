// ========== frontend/src/pages/Subscriptions.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
// ✅ Убираем import axios from 'axios'
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import {
    Add, Edit, Delete, Refresh,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Warning as WarningIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format, startOfMonth, endOfMonth, differenceInDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
// ✅ Импортируем ТОЛЬКО axiosInstance и getAllLessons
import axiosInstance, { getAllLessons } from '../services/api';

function Subscriptions() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [editingSubscription, setEditingSubscription] = useState(null);
    const [editFormData, setEditFormData] = useState({ lessonsCount: '', price: '' });
    const [subscriptions, setSubscriptions] = useState([]);
    const [students, setStudents] = useState([]);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [viewMode, setViewMode] = useState('active');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        lessonsCount: '',
        price: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (user && user.id) {
            fetchData();
        }
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

    const handleEditSubscription = (subscription) => {
        setEditingSubscription(subscription);
        setEditFormData({
            lessonsCount: subscription.lessonsCount,
            price: subscription.price
        });
        setEditDialogOpen(true);
    };

    const handleUpdateSubscription = async () => {
        try {
            await axiosInstance.put(`/subscriptions/${editingSubscription.id}`, {
                lessonsCount: parseInt(editFormData.lessonsCount),
                price: parseFloat(editFormData.price)
            });
            showSnackbar('Абонемент обновлён', 'success');
            setEditDialogOpen(false);
            fetchData();
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка обновления', 'error');
        }
    };

    const handleCreateSubscription = async () => {
        try {
            await axiosInstance.post('/subscriptions', {
                tutorId: user.id,
                studentId: selectedStudent,
                lessonsCount: parseInt(formData.lessonsCount),
                price: parseFloat(formData.price),
                startDate: formData.startDate,
                endDate: formData.endDate
            });
            
            showSnackbar('Абонемент создан', 'success');
            setOpenDialog(false);
            setSelectedStudent('');
            setFormData({ lessonsCount: '', price: '', startDate: '', endDate: '' });
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка при создании абонемента', 'error');
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

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const getStatusChip = (status) => {
        switch(status) {
            case 'active':
                return <Chip label="Активен" color="success" size="small" icon={<CheckIcon sx={{ fontSize: 14 }} />} />;
            case 'pending':
                return <Chip label="Ожидает оплаты" color="warning" size="small" icon={<WarningIcon sx={{ fontSize: 14 }} />} />;
            case 'completed':
                return <Chip label="Завершён" color="default" size="small" />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    const getRemainingDays = (endDate) => {
        const today = new Date();
        const end = new Date(endDate);
        const days = differenceInDays(end, today);
        if (days < 0) return 0;
        return days;
    };

    const getProgress = (used, total) => {
        if (total === 0) return 0;
        return (used / total) * 100;
    };

    const getFilteredSubscriptions = () => {
        if (viewMode === 'active') {
            return subscriptions.filter(s => 
                s.status === 'active' || s.status === 'ACTIVE' || 
                s.status === 'pending' || s.status === 'PENDING'
            );
        }
        if (viewMode === 'history') {
            return subscriptions.filter(s => 
                s.status === 'completed' || s.status === 'COMPLETED'
            );
        }
        return subscriptions;
    };

    const stats = {
        active: subscriptions.filter(s => s.status === 'active').length,
        pending: subscriptions.filter(s => s.status === 'pending').length,
        completed: subscriptions.filter(s => s.status === 'completed').length,
        totalLessons: subscriptions.reduce((sum, s) => sum + (s.lessonsCount || 0), 0),
        usedLessons: subscriptions.reduce((sum, s) => sum + (s.lessonsUsed || 0), 0),
        totalRevenue: subscriptions.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0)
    };

    const filteredSubscriptions = getFilteredSubscriptions();

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ width: '100%' }}>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#10B981' }}>
                                    {stats.active}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Активных
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                    {stats.pending}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Ожидают оплаты
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#6B7280' }}>
                                    {stats.completed}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Завершённых
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                                    {stats.totalLessons > 0 ? Math.round((stats.usedLessons / stats.totalLessons) * 100) : 0}%
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Использовано
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Tabs 
                        value={viewMode} 
                        onChange={(e, v) => setViewMode(v)}
                        sx={{ minHeight: 36 }}
                    >
                        <Tab value="active" label="Активные" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
                        <Tab value="history" label="История" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
                        <Tab value="all" label="Все" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
                    </Tabs>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {filteredSubscriptions.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                        <TimelineIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            {viewMode === 'active' ? 'Нет активных абонементов' : 
                             viewMode === 'history' ? 'Нет завершённых абонементов' : 
                             'Нет абонементов'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {viewMode === 'active' ? 
                                'Создайте абонемент для ученика с типом оплаты "Абонемент"' : 
                                'Здесь будут отображаться завершённые абонементы'}
                        </Typography>
                    </Paper>
                ) : (
                    <Grid container spacing={3}>
                        {filteredSubscriptions.map((sub) => {
                            const remainingDays = getRemainingDays(sub.endDate);
                            const progress = getProgress(sub.lessonsUsed || 0, sub.lessonsCount);
                            const isExpiring = remainingDays <= 7 && remainingDays > 0 && sub.status === 'active';
                            const isOverdue = remainingDays === 0 && sub.status === 'active';
                            
                            return (
                                <Grid item xs={12} md={6} key={sub.id}>
                                    <Card 
                                        sx={{ 
                                            borderRadius: 3,
                                            transition: 'all 0.2s',
                                            '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
                                            position: 'relative',
                                            overflow: 'visible',
                                            borderLeft: isExpiring ? '4px solid #F59E0B' : isOverdue ? '4px solid #EF5350' : 'none'
                                        }}
                                    >
                                        {isExpiring && (
                                            <Box sx={{ position: 'absolute', top: -10, right: 12, bgcolor: '#F59E0B', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.7rem', fontWeight: 500 }}>
                                                Заканчивается через {remainingDays} дн.
                                            </Box>
                                        )}
                                        {isOverdue && (
                                            <Box sx={{ position: 'absolute', top: -10, right: 12, bgcolor: '#EF5350', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.7rem', fontWeight: 500 }}>
                                                Срок истёк
                                            </Box>
                                        )}
                                        
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                    <Avatar sx={{ bgcolor: '#ff6b6b', width: 48, height: 48 }}>
                                                        <SchoolIcon />
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                            {sub.studentName}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Ставка: {sub.ratePerLesson?.toLocaleString() || 0} ₽/занятие
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                                {getStatusChip(sub.status)}
                                            </Box>

                                            <Divider sx={{ my: 1.5 }} />

                                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                                <Grid item xs={4}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                                            {sub.lessonsCount}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Всего
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                                                            {sub.lessonsUsed || 0}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Использовано
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Box sx={{ textAlign: 'center' }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                                            {(sub.lessonsCount || 0) - (sub.lessonsUsed || 0)}
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            Осталось
                                                        </Typography>
                                                    </Box>
                                                </Grid>
                                            </Grid>

                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Прогресс
                                                    </Typography>
                                                    <Typography variant="caption" fontWeight={500}>
                                                        {Math.round(progress)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={progress}
                                                    sx={{ borderRadius: 1, height: 8 }}
                                                />
                                            </Box>

                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="textSecondary">
                                                        {sub.startDate ? format(new Date(sub.startDate), 'd MMM yyyy', { locale: ru }) : '-'} — 
                                                        {sub.endDate ? format(new Date(sub.endDate), 'd MMM yyyy', { locale: ru }) : '-'}
                                                    </Typography>
                                                </Box>
                                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#2E7D32' }}>
                                                    {parseFloat(sub.price || 0).toLocaleString()} ₽
                                                </Typography>
                                            </Box>

                                            {sub.status === 'active' && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                                    <WarningIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                                                    <Typography variant="caption" color="textSecondary">
                                                        {remainingDays === 0 ? 'Абонемент просрочен' : 
                                                         remainingDays <= 7 ? `Осталось ${remainingDays} дней` : 
                                                         `Действует до ${sub.endDate ? format(new Date(sub.endDate), 'd MMM yyyy', { locale: ru }) : '-'}`}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                        
                                        <Divider />
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, p: 1 }}>
                                            {/* Кнопка редактирования — только для PENDING */}
                                            {sub.status === 'pending' && (
                                                <Tooltip title="Редактировать">
                                                    <IconButton size="small" color="primary" onClick={() => handleEditSubscription(sub)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" color="error" onClick={() => handleDeleteSubscription(sub.id)}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                )}

                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Создать абонемент</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Ученик</InputLabel>
                                <Select
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                    label="Ученик"
                                >
                                    {students
                                        .filter(s => s.paymentType === 'subscription')
                                        .map(s => {
                                            const rate = getStudentRateForTutor(s, user?.id);
                                            return (
                                                <MenuItem key={s.id} value={s.id}>
                                                    {s.fullName} ({rate || '—'} ₽/занятие)
                                                </MenuItem>
                                            );
                                        })}
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Количество занятий"
                                type="number"
                                value={formData.lessonsCount}
                                onChange={(e) => setFormData({...formData, lessonsCount: e.target.value})}
                                margin="normal"
                                required
                                InputProps={{ startAdornment: <InputAdornment position="start">📚</InputAdornment> }}
                            />

                            <TextField
                                fullWidth
                                label="Сумма (₽)"
                                type="number"
                                value={formData.price}
                                onChange={(e) => setFormData({...formData, price: e.target.value})}
                                margin="normal"
                                required
                                InputProps={{ startAdornment: <InputAdornment position="start">₽</InputAdornment> }}
                            />

                            <TextField
                                fullWidth
                                label="Дата начала"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                                required
                            />

                            <TextField
                                fullWidth
                                label="Дата окончания"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                                margin="normal"
                                InputLabelProps={{ shrink: true }}
                                required
                            />

                            <Alert severity="info" sx={{ mt: 2 }}>
                                Абонемент будет создан со статусом "Ожидает оплаты". После оплаты родителем, занятия будут списываться из абонемента.
                            </Alert>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
                        <Button 
                            onClick={handleCreateSubscription} 
                            variant="contained"
                            disabled={!selectedStudent || !formData.lessonsCount || !formData.price}
                        >
                            Создать
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
                <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Редактировать абонемент</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Редактирование возможно только для неоплаченных абонементов.
                            </Alert>
                            <TextField
                                fullWidth
                                label="Количество занятий"
                                type="number"
                                value={editFormData.lessonsCount}
                                onChange={(e) => setEditFormData({...editFormData, lessonsCount: e.target.value})}
                                margin="normal"
                                required
                            />
                            <TextField
                                fullWidth
                                label="Сумма (₽)"
                                type="number"
                                value={editFormData.price}
                                onChange={(e) => setEditFormData({...editFormData, price: e.target.value})}
                                margin="normal"
                                required
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setEditDialogOpen(false)}>Отмена</Button>
                        <Button onClick={handleUpdateSubscription} variant="contained">Сохранить</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
    }

export default Subscriptions;