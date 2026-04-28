// frontend/src/pages/Profile.js
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    Grid, Divider, Alert, Snackbar, CircularProgress,
    Card, CardContent, Chip, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Tooltip, Tabs, Tab, Badge
} from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    PhotoCamera as PhotoCameraIcon,
    Lock as LockIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Cake as CakeIcon,
    Badge as BadgeIcon,
    LocationCity as LocationCityIcon,
    Info as InfoIcon,
    School as SchoolIcon,
    CalendarMonth as CalendarIcon,
    AccessTime as AccessTimeIcon,
    AttachMoney as MoneyIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
// ✅ Правильный импорт
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [avatar, setAvatar] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const fileInputRef = useRef(null);
    
    const [stats, setStats] = useState({
        studentsCount: 0,
        lessonsCount: 0,
        totalHours: 0,
        totalIncome: 0,
        monthlyGrowth: 0,
        thisMonthIncome: 0,
        lastMonthIncome: 0
    });
    
    const [activityData, setActivityData] = useState({
        lastMonth: [],
        thisMonth: []
    });
    
    const [profile, setProfile] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: '',
        birthday: '',
        about: '',
        city: ''
    });
    
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [avatarTab, setAvatarTab] = useState(0);
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => {
        if (user && user.id) {
            fetchProfile();
            fetchStats();
            fetchAvatar();
            fetchActivityData();
        }
    }, [user]);

    const fetchProfile = async () => {
        try {
            // ✅ Исправлено: axiosInstance
            const response = await axiosInstance.get(`/tutors/${user.id}`);
            
            setProfile({
                fullName: response.data.fullName || user?.fullName,
                email: response.data.email || user?.email,
                phone: response.data.phone || '',
                birthday: response.data.birthday || '',
                about: response.data.about || '',
                city: response.data.city || ''
            });
        } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
        }
    };

    const fetchStats = async () => {
        try {
            // ✅ Исправлено: axiosInstance
            const studentsRes = await axiosInstance.get(`/students/tutor/${user.id}`);
            const studentsCount = studentsRes.data.length;
            
            const lessonsRes = await axiosInstance.get(`/lessons/all?tutorId=${user.id}`);
            const completedLessons = lessonsRes.data.filter(l => 
                l.status === 'COMPLETED' || l.status === 'PAID'
            );
            const lessonsCount = completedLessons.length;
            
            let totalHours = 0;
            completedLessons.forEach(lesson => {
                const start = lesson.startTime.split(':');
                const end = lesson.endTime.split(':');
                const hours = parseInt(end[0]) - parseInt(start[0]);
                totalHours += hours;
            });
            
            const paymentsRes = await axiosInstance.get(`/payments/tutor/${user.id}`);
            
            const totalIncome = paymentsRes.data
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0);
            
            // Расчёт роста
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            
            const thisMonthPayments = paymentsRes.data.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= thisMonthStart && p.status === 'paid';
            });
            const lastMonthPayments = paymentsRes.data.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= lastMonthStart && paymentDate <= lastMonthEnd && p.status === 'paid';
            });
            
            const thisMonthIncome = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);
            const lastMonthIncome = lastMonthPayments.reduce((sum, p) => sum + p.amount, 0);
            const monthlyGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
            
            setStats({
                studentsCount,
                lessonsCount,
                totalHours,
                totalIncome,
                monthlyGrowth,
                thisMonthIncome,
                lastMonthIncome
            });
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
        }
    };

    const fetchActivityData = async () => {
        try {
            // ✅ Исправлено: axiosInstance
            const response = await axiosInstance.get(`/lessons/all?tutorId=${user.id}`);
            
            const lessons = response.data;
            const now = new Date();
            
            // Последние 7 дней активности
            const lastWeek = [];
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(now.getDate() - i);
                const dateStr = format(date, 'yyyy-MM-dd');
                const dayLessons = lessons.filter(l => l.lessonDate === dateStr);
                const completed = dayLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length;
                lastWeek.push({
                    date: format(date, 'EEE', { locale: ru }),
                    fullDate: format(date, 'd MMM', { locale: ru }),
                    count: completed,
                    total: dayLessons.length
                });
            }
            
            setActivityData({ lastMonth: [], thisMonth: lastWeek });
        } catch (err) {
            console.error('Ошибка загрузки активности:', err);
        }
    };

    const fetchAvatar = async () => {
        try {
            // ✅ Исправлено: axiosInstance
            const response = await axiosInstance.get(`/tutors/${user.id}/avatar`);
            if (response.data.avatar) {
                setAvatar(response.data.avatar);
            }
        } catch (err) {
            console.error('Ошибка загрузки фото:', err);
        }
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 2 * 1024 * 1024) {
            showSnackbar('Файл слишком большой. Максимум 2MB', 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showSnackbar('Можно загружать только изображения', 'error');
            return;
        }
        
        setUploading(true);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            try {
                const base64 = reader.result;
                // ✅ Исправлено: axiosInstance
                await axiosInstance.post(`/tutors/${user.id}/avatar`, { avatar: base64 });
                setAvatar(base64);
                showSnackbar('Фото успешно загружено', 'success');
                window.dispatchEvent(new CustomEvent('avatar-updated', { detail: base64 }));
            } catch (err) {
                console.error('Ошибка загрузки:', err);
                showSnackbar('Ошибка при загрузке фото', 'error');
            } finally {
                setUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // ✅ Исправлено: axiosInstance
            await axiosInstance.put(`/tutors/${user.id}`, {
                fullName: profile.fullName,
                phone: profile.phone,
                birthday: profile.birthday,
                about: profile.about,
                city: profile.city,
            });
            
            if (updateUser) {
                updateUser({ ...user, fullName: profile.fullName });
            }
            
            setEditMode(false);
            showSnackbar('Профиль успешно обновлён', 'success');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            showSnackbar(err.response?.data?.error || 'Ошибка при сохранении профиля', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Пароли не совпадают');
            return;
        }
        
        if (passwordData.newPassword.length < 6) {
            setPasswordError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        setLoading(true);
        try {
            // ✅ Исправлено: axiosInstance
            await axiosInstance.post(`/tutors/${user.id}/change-password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            
            setPasswordDialog(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setPasswordError('');
            showSnackbar('Пароль успешно изменён', 'success');
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка при смене пароля', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const maxActivity = Math.max(...activityData.thisMonth.map(d => d.count), 1);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                Мой профиль
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                Управление личной информацией и настройками
            </Typography>
            
            <Grid container spacing={4}>
                {/* Левая колонка - аватар и статистика */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, borderRadius: 4, textAlign: 'center', position: 'sticky', top: 24 }}>
                        {/* Аватар */}
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                            <Badge
                                overlap="circular"
                                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                badgeContent={
                                    <Tooltip title="Изменить аватар">
                                        <IconButton
                                            size="small"
                                            onClick={() => setAvatarDialogOpen(true)}
                                            sx={{
                                                bgcolor: '#ff6b6b',
                                                color: 'white',
                                                '&:hover': { bgcolor: '#ff5252' }
                                            }}
                                        >
                                            <PhotoCameraIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                }
                            >
                                <Avatar
                                    src={avatar}
                                    sx={{
                                        width: 140,
                                        height: 140,
                                        mx: 'auto',
                                        mb: 2,
                                        bgcolor: '#ff6b6b',
                                        fontSize: 56,
                                        cursor: 'pointer',
                                        '&:hover': { opacity: 0.9 }
                                    }}
                                    onClick={() => setAvatarDialogOpen(true)}
                                >
                                    {!avatar && (profile.fullName?.charAt(0) || 'U')}
                                </Avatar>
                            </Badge>
                        </Box>
                        
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {profile.fullName}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                            Репетитор
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Chip
                            icon={<BadgeIcon />}
                            label={`ID: ${user?.id}`}
                            variant="outlined"
                            sx={{ mb: 1 }}
                        />
                        
                        <Button
                            variant="outlined"
                            color="warning"
                            startIcon={<LockIcon />}
                            fullWidth
                            onClick={() => setPasswordDialog(true)}
                            sx={{ mt: 2, borderRadius: 2, textTransform: 'none' }}
                        >
                            Сменить пароль
                        </Button>
                    </Paper>
                </Grid>
                
                {/* Правая колонка - информация и статистика */}
                <Grid item xs={12} md={8}>
                    {/* Вкладки */}
                    <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={(e, v) => setTabValue(v)}
                            sx={{ borderBottom: 1, borderColor: 'divider' }}
                        >
                            <Tab label="Личная информация" sx={{ textTransform: 'none', fontWeight: 500 }} />
                            <Tab label="Статистика и активность" sx={{ textTransform: 'none', fontWeight: 500 }} />
                        </Tabs>
                        
                        {/* Вкладка: Личная информация */}
                        {tabValue === 0 && (
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        Личная информация
                                    </Typography>
                                    {!editMode ? (
                                        <Button
                                            variant="outlined"
                                            startIcon={<EditIcon />}
                                            onClick={() => setEditMode(true)}
                                            sx={{ borderRadius: 2, textTransform: 'none' }}
                                        >
                                            Редактировать
                                        </Button>
                                    ) : (
                                        <Box>
                                            <Button
                                                variant="outlined"
                                                onClick={() => setEditMode(false)}
                                                sx={{ mr: 1, borderRadius: 2, textTransform: 'none' }}
                                            >
                                                Отмена
                                            </Button>
                                            <Button
                                                variant="contained"
                                                startIcon={<SaveIcon />}
                                                onClick={handleSaveProfile}
                                                disabled={loading}
                                                sx={{ borderRadius: 2, textTransform: 'none' }}
                                            >
                                                {loading ? <CircularProgress size={24} /> : 'Сохранить'}
                                            </Button>
                                        </Box>
                                    )}
                                </Box>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="ФИО"
                                            value={profile.fullName}
                                            onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                                            disabled={!editMode}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PersonIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            value={profile.email}
                                            disabled
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <EmailIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            helperText="Email нельзя изменить"
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Телефон"
                                            value={profile.phone}
                                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                            disabled={!editMode}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <PhoneIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Дата рождения"
                                            type="date"
                                            value={profile.birthday}
                                            onChange={(e) => setProfile({...profile, birthday: e.target.value})}
                                            disabled={!editMode}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <CakeIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                            InputLabelProps={{ shrink: true }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Город"
                                            value={profile.city}
                                            onChange={(e) => setProfile({...profile, city: e.target.value})}
                                            disabled={!editMode}
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <LocationCityIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                    
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            label="О себе"
                                            multiline
                                            rows={4}
                                            value={profile.about}
                                            onChange={(e) => setProfile({...profile, about: e.target.value})}
                                            disabled={!editMode}
                                            placeholder="Расскажите о себе, своём опыте, образовании..."
                                            InputProps={{
                                                startAdornment: (
                                                    <InputAdornment position="start">
                                                        <InfoIcon color="action" />
                                                    </InputAdornment>
                                                ),
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                        
                        {/* Вкладка: Статистика и активность */}
                        {tabValue === 1 && (
                            <Box sx={{ p: 3 }}>
                                {/* Карточки статистики */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6} sm={3}>
                                        <Card sx={{ borderRadius: 2, bgcolor: '#f5f5f5' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                <SchoolIcon sx={{ fontSize: 28, color: '#3B82F6', mb: 0.5 }} />
                                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                                    {stats.studentsCount}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Учеников
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Card sx={{ borderRadius: 2, bgcolor: '#f5f5f5' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                <CalendarIcon sx={{ fontSize: 28, color: '#10B981', mb: 0.5 }} />
                                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#10B981' }}>
                                                    {stats.lessonsCount}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Занятий
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Card sx={{ borderRadius: 2, bgcolor: '#f5f5f5' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                <AccessTimeIcon sx={{ fontSize: 28, color: '#F59E0B', mb: 0.5 }} />
                                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                                    {stats.totalHours}
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Часов
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                    <Grid item xs={6} sm={3}>
                                        <Card sx={{ borderRadius: 2, bgcolor: '#f5f5f5' }}>
                                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                                <MoneyIcon sx={{ fontSize: 28, color: '#8B5CF6', mb: 0.5 }} />
                                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                                                    {stats.totalIncome.toLocaleString()} ₽
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    Доход
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                </Grid>
                                
                                {/* Динамика роста */}
                                <Paper sx={{ p: 2, mb: 3, bgcolor: stats.monthlyGrowth >= 0 ? '#E8F5E9' : '#FFEBEE', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {stats.monthlyGrowth >= 0 ? (
                                                <TrendingUpIcon sx={{ color: '#2E7D32' }} />
                                            ) : (
                                                <TrendingDownIcon sx={{ color: '#C62828' }} />
                                            )}
                                            <Typography variant="subtitle2">
                                                Динамика дохода
                                            </Typography>
                                        </Box>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: stats.monthlyGrowth >= 0 ? '#2E7D32' : '#C62828' }}>
                                            {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {stats.thisMonthIncome.toLocaleString()} ₽ в этом месяце vs {stats.lastMonthIncome.toLocaleString()} ₽ в прошлом
                                        </Typography>
                                    </Box>
                                </Paper>
                                
                                {/* Активность за неделю */}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                    Активность за последние 7 дней
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 2, minHeight: 120 }}>
                                    {activityData.thisMonth.map((day, idx) => {
                                        const height = day.count > 0 ? (day.count / maxActivity) * 80 : 4;
                                        return (
                                            <Tooltip key={idx} title={`${day.fullDate}: ${day.count} занятий проведено`} arrow>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Box 
                                                        sx={{ 
                                                            height: height,
                                                            bgcolor: day.count > 0 ? '#ff6b6b' : '#e0e0e0',
                                                            borderRadius: '4px 4px 8px 8px',
                                                            transition: 'all 0.2s',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: '#ff5252' }
                                                        }}
                                                    />
                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 1, display: 'block' }}>
                                                        {day.date}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                                
                                <Divider sx={{ my: 2 }} />
                                
                                {/* Достижения / Бейджи */}
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                    Достижения
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {stats.lessonsCount >= 10 && (
                                        <Tooltip title="Проведено более 10 занятий">
                                            <Chip 
                                                icon={<CheckIcon />}
                                                label="10+ занятий"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    )}
                                    {stats.lessonsCount >= 50 && (
                                        <Tooltip title="Проведено более 50 занятий">
                                            <Chip 
                                                icon={<TrendingUpIcon />}
                                                label="50+ занятий"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    )}
                                    {stats.studentsCount >= 5 && (
                                        <Tooltip title="Более 5 учеников">
                                            <Chip 
                                                icon={<SchoolIcon />}
                                                label="5+ учеников"
                                                color="info"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    )}
                                    {stats.totalHours >= 100 && (
                                        <Tooltip title="Проведено более 100 часов">
                                            <Chip 
                                                icon={<AccessTimeIcon />}
                                                label="100+ часов"
                                                color="warning"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    )}
                                    {stats.totalIncome >= 100000 && (
                                        <Tooltip title="Заработано более 100 000 ₽">
                                            <Chip 
                                                icon={<MoneyIcon />}
                                                label="100k+ доход"
                                                color="success"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    )}
                                    {stats.monthlyGrowth > 20 && (
                                        <Tooltip title="Рост дохода более 20%">
                                            <Chip 
                                                icon={<TrendingUpIcon />}
                                                label="Быстрый рост"
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                    )}
                                    {stats.lessonsCount === 0 && (
                                        <Chip 
                                            icon={<WarningIcon />}
                                            label="Начинающий"
                                            variant="outlined"
                                        />
                                    )}
                                </Box>
                                
                                {stats.lessonsCount === 0 && (
                                    <Alert severity="info" sx={{ mt: 2 }}>
                                        Начните проводить занятия, чтобы открывать новые достижения!
                                    </Alert>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
                        {/* Скрытый input для загрузки фото */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        {/* Диалог выбора аватара */}
            <Dialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Выберите аватар</DialogTitle>
                <DialogContent>
                    <Tabs value={avatarTab} onChange={(e, v) => setAvatarTab(v)} sx={{ mb: 2 }}>
                        <Tab label="Галерея" sx={{ textTransform: 'none' }} />
                        <Tab label="Загрузить фото" sx={{ textTransform: 'none' }} />
                    </Tabs>
                    
                    {avatarTab === 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                            {[
                                { bg: '#ff6b6b', icon: '👨‍🏫' },
                                { bg: '#4ecdc4', icon: '👩‍🏫' },
                                { bg: '#45b7d1', icon: '🎓' },
                                { bg: '#f9ca24', icon: '📚' },
                                { bg: '#6c5ce7', icon: '🧠' },
                                { bg: '#a29bfe', icon: '💡' },
                                { bg: '#fd79a8', icon: '🌟' },
                                { bg: '#00b894', icon: '🚀' },
                                { bg: '#e17055', icon: '🦊' },
                                { bg: '#0984e3', icon: '🐼' },
                                { bg: '#d63031', icon: '🔥' },
                                { bg: '#636e72', icon: '💎' },
                            ].map((preset, i) => (
                                <Avatar
                                    key={i}
                                    onClick={() => {
                                        const canvas = document.createElement('canvas');
                                        canvas.width = 140;
                                        canvas.height = 140;
                                        const ctx = canvas.getContext('2d');
                                        ctx.fillStyle = preset.bg;
                                        ctx.fillRect(0, 0, 140, 140);
                                        ctx.font = '64px Arial';
                                        ctx.textAlign = 'center';
                                        ctx.textBaseline = 'middle';
                                        ctx.fillText(preset.icon, 70, 70);
                                        const dataUrl = canvas.toDataURL();
                                        setAvatar(dataUrl);
                                        setAvatarDialogOpen(false);
                                        // Сохраняем на сервер
                                        axiosInstance.post(`/tutors/${user.id}/avatar`, { avatar: dataUrl })
                                            .then(() => {
                                                showSnackbar('Аватар обновлён', 'success');
                                                window.dispatchEvent(new CustomEvent('avatar-updated', { detail: dataUrl }));
                                            })
                                            .catch(() => showSnackbar('Ошибка при сохранении', 'error'));
                                    }}
                                    sx={{
                                        width: 80,
                                        height: 80,
                                        bgcolor: preset.bg,
                                        fontSize: 36,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }
                                    }}
                                >
                                    {preset.icon}
                                </Avatar>
                            ))}
                        </Box>
                    )}
                    
                    {avatarTab === 1 && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <Button
                                variant="outlined"
                                startIcon={<PhotoCameraIcon />}
                                onClick={() => {
                                    fileInputRef.current?.click();
                                    setAvatarDialogOpen(false);
                                }}
                                sx={{ borderRadius: 2, textTransform: 'none', mb: 2 }}
                            >
                                Выбрать фото с устройства
                            </Button>
                            <Typography variant="caption" color="textSecondary" display="block">
                                JPG, PNG до 2MB
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAvatarDialogOpen(false)}>Закрыть</Button>
                </DialogActions>
            </Dialog>
            
            {/* Диалог смены пароля */}
            <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Смена пароля</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Текущий пароль"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Новый пароль"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            margin="normal"
                            helperText="Минимум 6 символов"
                        />
                        <TextField
                            fullWidth
                            label="Подтвердите пароль"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            margin="normal"
                            error={!!passwordError}
                            helperText={passwordError}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPasswordDialog(false)}>Отмена</Button>
                    <Button onClick={handleChangePassword} variant="contained" disabled={loading}>
                        {loading ? <CircularProgress size={24} /> : 'Сменить пароль'}
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
        </Box>
    );
};

export default Profile;