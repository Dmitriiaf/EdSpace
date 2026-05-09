// ========== frontend/src/pages/Profile.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    Grid, Divider, Alert, Snackbar, CircularProgress,
    Card, CardContent, Chip, InputAdornment,
    Dialog, DialogTitle, DialogContent, DialogActions,
    IconButton, Tooltip, Tabs, Tab, Badge
} from '@mui/material';
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
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
    Warning as WarningIcon,
    Star as StarIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const StyledPaper = styled(Paper)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
});



const AvatarBadge = styled(Badge)({
    '& .MuiBadge-badge': {
        backgroundColor: '#4F46E5',
        color: '#FFFFFF',
        '&:hover': { backgroundColor: '#4338CA' },
    },
});

const GrowthCard = styled(Paper)(({ positive }) => ({
    padding: '16px 20px',
    marginBottom: '20px',
    backgroundColor: positive ? '#ECFDF5' : '#FEF2F2',
    borderRadius: '12px',
    border: positive ? '1px solid #A7F3D0' : '1px solid #FECACA',
    boxShadow: 'none',
}));

const ActivityBar = styled(Box)(({ height, hasActivity }) => ({
    height: Math.max(height, 4),
    backgroundColor: hasActivity ? '#4F46E5' : '#E5E7EB',
    borderRadius: '4px 4px 8px 8px',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': { backgroundColor: hasActivity ? '#4338CA' : '#D1D5DB' },
}));

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========

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
        studentsCount: 0, lessonsCount: 0, totalHours: 0,
        totalIncome: 0, monthlyGrowth: 0, thisMonthIncome: 0, lastMonthIncome: 0
    });
    
    const [activityData, setActivityData] = useState({ lastMonth: [], thisMonth: [] });
    
    const [profile, setProfile] = useState({
        fullName: user?.fullName || '', email: user?.email || '',
        phone: '', birthday: '', about: '', city: ''
    });
    
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [avatarTab, setAvatarTab] = useState(0);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');

    useEffect(() => { if (user?.id) { fetchProfile(); fetchStats(); fetchAvatar(); fetchActivityData(); } }, [user]);

    // ========== ВСЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ ==========
    const fetchProfile = async () => {
        try {
            const response = await axiosInstance.get(`/tutors/${user.id}`);
            setProfile({ fullName: response.data.fullName || user?.fullName, email: response.data.email || user?.email, phone: response.data.phone || '', birthday: response.data.birthday || '', about: response.data.about || '', city: response.data.city || '' });
        } catch (err) { console.error('Ошибка загрузки профиля:', err); }
    };

    const fetchStats = async () => {
        try {
            const [studentsRes, lessonsRes, paymentsRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/lessons/all?tutorId=${user.id}`),
                axiosInstance.get(`/payments/tutor/${user.id}`)
            ]);
            const studentsCount = studentsRes.data.length;
            const completedLessons = lessonsRes.data.filter(l => l.status === 'COMPLETED' || l.status === 'PAID');
            let totalHours = 0;
            completedLessons.forEach(l => { const start = l.startTime.split(':'); const end = l.endTime.split(':'); totalHours += parseInt(end[0]) - parseInt(start[0]); });
            const totalIncome = paymentsRes.data.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0);
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const thisMonthIncome = paymentsRes.data.filter(p => { const d = new Date(p.paymentDate); return d >= thisMonthStart && p.status === 'paid'; }).reduce((s, p) => s + p.amount, 0);
            const lastMonthIncome = paymentsRes.data.filter(p => { const d = new Date(p.paymentDate); return d >= lastMonthStart && d <= lastMonthEnd && p.status === 'paid'; }).reduce((s, p) => s + p.amount, 0);
            const monthlyGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
            setStats({ studentsCount, lessonsCount: completedLessons.length, totalHours, totalIncome, monthlyGrowth, thisMonthIncome, lastMonthIncome });
        } catch (err) { console.error('Ошибка загрузки статистики:', err); }
    };

    const fetchActivityData = async () => {
        try {
            const response = await axiosInstance.get(`/lessons/all?tutorId=${user.id}`);
            const lessons = response.data; const now = new Date(); const lastWeek = [];
            for (let i = 6; i >= 0; i--) { const date = new Date(now); date.setDate(now.getDate() - i); const dateStr = format(date, 'yyyy-MM-dd'); const dayLessons = lessons.filter(l => l.lessonDate === dateStr); lastWeek.push({ date: format(date, 'EEE', { locale: ru }), fullDate: format(date, 'd MMM', { locale: ru }), count: dayLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length, total: dayLessons.length }); }
            setActivityData({ lastMonth: [], thisMonth: lastWeek });
        } catch (err) { console.error('Ошибка загрузки активности:', err); }
    };

    const fetchAvatar = async () => {
        try { const response = await axiosInstance.get(`/tutors/${user.id}/avatar`); if (response.data.avatar) setAvatar(response.data.avatar); }
        catch (err) { console.error('Ошибка загрузки фото:', err); }
    };

    const handleFileChange = async (event) => {
        const file = event.target.files[0]; if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showSnackbar('Файл слишком большой. Максимум 2MB', 'error'); return; }
        if (!file.type.startsWith('image/')) { showSnackbar('Можно загружать только изображения', 'error'); return; }
        setUploading(true);
        const reader = new FileReader();
        reader.onloadend = async () => {
            try { const base64 = reader.result; await axiosInstance.post(`/tutors/${user.id}/avatar`, { avatar: base64 }); setAvatar(base64); showSnackbar('Фото успешно загружено', 'success'); window.dispatchEvent(new CustomEvent('avatar-updated', { detail: base64 })); }
            catch (err) { showSnackbar('Ошибка при загрузке фото', 'error'); }
            finally { setUploading(false); }
        };
        reader.readAsDataURL(file);
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await axiosInstance.put(`/tutors/${user.id}`, { fullName: profile.fullName, phone: profile.phone, birthday: profile.birthday, about: profile.about, city: profile.city });
            if (updateUser) updateUser({ ...user, fullName: profile.fullName });
            setEditMode(false); showSnackbar('Профиль успешно обновлён', 'success');
        } catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка при сохранении профиля', 'error'); }
        finally { setLoading(false); }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('Пароли не совпадают'); return; }
        if (passwordData.newPassword.length < 6) { setPasswordError('Пароль должен быть не менее 6 символов'); return; }
        setLoading(true);
        try { await axiosInstance.post(`/tutors/${user.id}/change-password`, { currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword }); setPasswordDialog(false); setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' }); setPasswordError(''); showSnackbar('Пароль успешно изменён', 'success'); }
        catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка при смене пароля', 'error'); }
        finally { setLoading(false); }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });
    const maxActivity = Math.max(...activityData.thisMonth.map(d => d.count), 1);

    const statCards = [
        { label: 'Учеников', value: stats.studentsCount, icon: SchoolIcon, color: '#3B82F6', bg: '#EFF6FF' },
        { label: 'Занятий', value: stats.lessonsCount, icon: CalendarIcon, color: '#10B981', bg: '#ECFDF5' },
        { label: 'Часов', value: stats.totalHours, icon: AccessTimeIcon, color: '#F59E0B', bg: '#FFFBEB' },
        { label: 'Доход', value: `${stats.totalIncome.toLocaleString()} ₽`, icon: MoneyIcon, color: '#7C3AED', bg: '#F5F3FF' },
    ];

    const avatarPresets = [
        { bg: '#4F46E5', icon: '👨‍🏫' }, { bg: '#10B981', icon: '👩‍🏫' }, { bg: '#3B82F6', icon: '🎓' },
        { bg: '#F59E0B', icon: '📚' }, { bg: '#7C3AED', icon: '🧠' }, { bg: '#A78BFA', icon: '💡' },
        { bg: '#EC4899', icon: '🌟' }, { bg: '#10B981', icon: '🚀' }, { bg: '#F59E0B', icon: '🦊' },
        { bg: '#3B82F6', icon: '🐼' }, { bg: '#EF4444', icon: '🔥' }, { bg: '#6B7280', icon: '💎' },
    ];

    return (
        <PageContainer>
            <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                Мой профиль
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                Управление личной информацией и настройками
            </Typography>
            
            <Grid container spacing={3}>
                {/* Левая колонка */}
                <Grid item xs={12} md={4}>
                    <StyledPaper elevation={0} sx={{ p: 3, textAlign: 'center', position: 'sticky', top: 24 }}>
                        <AvatarBadge
                            overlap="circular"
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            badgeContent={
                                <Tooltip title="Изменить аватар">
                                    <IconButton size="small" onClick={() => setAvatarDialogOpen(true)} sx={{ bgcolor: '#4F46E5', color: '#FFFFFF', width: 32, height: 32, '&:hover': { bgcolor: '#4338CA' } }}>
                                        <PhotoCameraIcon sx={{ fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            }
                        >
                            <Avatar src={avatar}
                                sx={{ width: 140, height: 140, mx: 'auto', mb: 2, bgcolor: '#4F46E5', fontSize: 56, cursor: 'pointer', fontWeight: 600, '&:hover': { opacity: 0.9 } }}
                                onClick={() => setAvatarDialogOpen(true)}>
                                {!avatar && (profile.fullName?.charAt(0) || 'U')}
                            </Avatar>
                        </AvatarBadge>
                        
                        <Typography sx={{ fontWeight: 600, fontSize: '18px', color: '#1F2937' }}>{profile.fullName}</Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Репетитор</Typography>
                        
                        <Divider sx={{ my: 2, borderColor: '#F3F4F6' }} />
                        
                        <Chip icon={<BadgeIcon sx={{ fontSize: 16 }} />} label={`ID: ${user?.id}`} variant="outlined"
                            sx={{ mb: 1, borderRadius: '8px', borderColor: '#E5E7EB', color: '#6B7280' }} />
                        
                        <StyledButton variant="outlined" startIcon={<LockIcon sx={{ fontSize: 16 }} />} fullWidth onClick={() => setPasswordDialog(true)}
                            sx={{ mt: 2, color: '#D97706', borderColor: '#FDE68A', '&:hover': { bgcolor: '#FFFBEB', borderColor: '#F59E0B' } }}>
                            Сменить пароль
                        </StyledButton>
                    </StyledPaper>
                </Grid>
                
                {/* Правая колонка */}
                <Grid item xs={12} md={8}>
                    <StyledPaper elevation={0} sx={{ overflow: 'hidden' }}>
                        <Box sx={{ borderBottom: '1px solid #F3F4F6', px: 2 }}>
                            <ViewToggle sx={{ my: 1.5 }}>
                                <ViewToggleBtn active={tabValue === 0} onClick={() => setTabValue(0)}>Личная информация</ViewToggleBtn>
                                <ViewToggleBtn active={tabValue === 1} onClick={() => setTabValue(1)}>Статистика</ViewToggleBtn>
                            </ViewToggle>
                        </Box>
                        
                        {/* Личная информация */}
                        {tabValue === 0 && (
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1F2937' }}>Личная информация</Typography>
                                    {!editMode ? (
                                        <StyledButton variant="outlined" startIcon={<EditIcon sx={{ fontSize: 16 }} />} onClick={() => setEditMode(true)}
                                            sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>Редактировать</StyledButton>
                                    ) : (
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <StyledButton variant="outlined" onClick={() => setEditMode(false)} sx={{ color: '#6B7280', borderColor: '#D1D5DB' }}>Отмена</StyledButton>
                                            <StyledButton variant="contained" startIcon={<SaveIcon sx={{ fontSize: 16 }} />} onClick={handleSaveProfile} disabled={loading}
                                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>{loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Сохранить'}</StyledButton>
                                        </Box>
                                    )}
                                </Box>
                                
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="ФИО" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} disabled={!editMode}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Email" value={profile.email} disabled helperText="Email нельзя изменить"
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Телефон" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={!editMode}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Дата рождения" type="date" value={profile.birthday} onChange={(e) => setProfile({...profile, birthday: e.target.value})} disabled={!editMode} InputLabelProps={{ shrink: true }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><CakeIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Город" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} disabled={!editMode}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><LocationCityIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }} />
                                    </Grid>
                                    <Grid item xs={12}>
                                        <TextField fullWidth label="О себе" multiline rows={4} value={profile.about} onChange={(e) => setProfile({...profile, about: e.target.value})} disabled={!editMode} placeholder="Расскажите о себе, своём опыте, образовании..."
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                            InputProps={{ startAdornment: <InputAdornment position="start"><InfoIcon sx={{ color: '#9CA3AF' }} /></InputAdornment> }} />
                                    </Grid>
                                </Grid>
                            </Box>
                        )}
                        
                        {/* Статистика */}
                        {tabValue === 1 && (
                            <Box sx={{ p: 3 }}>
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {statCards.map((stat, i) => {
                                        const Icon = stat.icon;
                                        return (
                                            <Grid item xs={6} sm={3} key={i}>
                                                <StatCard>
                                                    <CardContent sx={{ p: 2, textAlign: 'center', '&:last-child': { pb: 2 } }}>
                                                        <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                                            <Icon sx={{ fontSize: 18, color: stat.color }} />
                                                        </Box>
                                                        <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>{stat.value}</Typography>
                                                        <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>{stat.label}</Typography>
                                                    </CardContent>
                                                </StatCard>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                                
                                <GrowthCard elevation={0} positive={stats.monthlyGrowth >= 0}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {stats.monthlyGrowth >= 0 ? <TrendingUpIcon sx={{ color: '#10B981' }} /> : <TrendingDownIcon sx={{ color: '#EF4444' }} />}
                                            <Typography sx={{ fontWeight: 600, fontSize: '14px', color: stats.monthlyGrowth >= 0 ? '#065F46' : '#991B1B' }}>Динамика дохода</Typography>
                                        </Box>
                                        <Typography sx={{ fontWeight: 700, fontSize: '20px', color: stats.monthlyGrowth >= 0 ? '#065F46' : '#991B1B' }}>
                                            {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                        {stats.thisMonthIncome.toLocaleString()} ₽ в этом месяце vs {stats.lastMonthIncome.toLocaleString()} ₽ в прошлом
                                    </Typography>
                                </GrowthCard>
                                
                                <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937', mb: 2 }}>Активность за последние 7 дней</Typography>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, mb: 2, minHeight: 100 }}>
                                    {activityData.thisMonth.map((day, idx) => (
                                        <Tooltip key={idx} title={`${day.fullDate}: ${day.count} занятий`} arrow>
                                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                <ActivityBar height={(day.count / maxActivity) * 80} hasActivity={day.count > 0} />
                                                <Typography sx={{ fontSize: '11px', mt: 1, display: 'block', color: '#6B7280' }}>{day.date}</Typography>
                                            </Box>
                                        </Tooltip>
                                    ))}
                                </Box>
                                
                                <Divider sx={{ my: 2, borderColor: '#F3F4F6' }} />
                                
                                <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937', mb: 2 }}>Достижения</Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                    {[
                                        { show: stats.lessonsCount >= 10, label: '10+ занятий', color: 'success' },
                                        { show: stats.lessonsCount >= 50, label: '50+ занятий', color: 'primary' },
                                        { show: stats.studentsCount >= 5, label: '5+ учеников', color: 'info' },
                                        { show: stats.totalHours >= 100, label: '100+ часов', color: 'warning' },
                                        { show: stats.totalIncome >= 100000, label: '100k+ доход', color: 'success' },
                                        { show: stats.monthlyGrowth > 20, label: 'Быстрый рост', color: 'secondary' },
                                    ].filter(a => a.show).map((a, i) => (
                                        <Chip key={i} icon={<StarIcon sx={{ fontSize: 14 }} />} label={a.label} variant="outlined"
                                            sx={{ borderRadius: '100px', borderColor: '#E5E7EB', fontWeight: 500, fontSize: '12px' }} />
                                    ))}
                                    {stats.lessonsCount === 0 && <Chip icon={<WarningIcon sx={{ fontSize: 14 }} />} label="Начинающий" variant="outlined" sx={{ borderRadius: '100px', borderColor: '#E5E7EB' }} />}
                                </Box>
                                {stats.lessonsCount === 0 && <Alert severity="info" sx={{ mt: 2, borderRadius: '8px', fontSize: '13px' }}>Начните проводить занятия, чтобы открывать новые достижения!</Alert>}
                            </Box>
                        )}
                    </StyledPaper>
                </Grid>
            </Grid>

            {/* Скрытый input */}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleFileChange} />

            {/* Диалог аватара */}
            <StyledDialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Выберите аватар</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <ViewToggle sx={{ mb: 3 }}>
                        <ViewToggleBtn active={avatarTab === 0} onClick={() => setAvatarTab(0)}>Галерея</ViewToggleBtn>
                        <ViewToggleBtn active={avatarTab === 1} onClick={() => setAvatarTab(1)}>Загрузить фото</ViewToggleBtn>
                    </ViewToggle>
                    {avatarTab === 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                            {avatarPresets.map((preset, i) => (
                                <Avatar key={i} onClick={() => {
                                    const canvas = document.createElement('canvas'); canvas.width = 140; canvas.height = 140;
                                    const ctx = canvas.getContext('2d'); ctx.fillStyle = preset.bg; ctx.fillRect(0, 0, 140, 140);
                                    ctx.font = '64px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(preset.icon, 70, 70);
                                    const dataUrl = canvas.toDataURL(); setAvatar(dataUrl); setAvatarDialogOpen(false);
                                    axiosInstance.post(`/tutors/${user.id}/avatar`, { avatar: dataUrl }).then(() => { showSnackbar('Аватар обновлён', 'success'); window.dispatchEvent(new CustomEvent('avatar-updated', { detail: dataUrl })); }).catch(() => showSnackbar('Ошибка при сохранении', 'error'));
                                }} sx={{ width: 80, height: 80, bgcolor: preset.bg, fontSize: 36, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'scale(1.1)', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' } }}>
                                    {preset.icon}
                                </Avatar>
                            ))}
                        </Box>
                    )}
                    {avatarTab === 1 && (
                        <Box sx={{ textAlign: 'center', py: 3 }}>
                            <StyledButton variant="outlined" startIcon={<PhotoCameraIcon sx={{ fontSize: 18 }} />} onClick={() => { fileInputRef.current?.click(); setAvatarDialogOpen(false); }}
                                sx={{ color: '#374151', borderColor: '#D1D5DB', mb: 2 }}>Выбрать фото с устройства</StyledButton>
                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>JPG, PNG до 2MB</Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setAvatarDialogOpen(false)} sx={{ color: '#6B7280' }}>Закрыть</StyledButton>
                </DialogActions>
            </StyledDialog>
            
            {/* Диалог пароля */}
            <StyledDialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Смена пароля</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <TextField fullWidth label="Текущий пароль" type="password" value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <TextField fullWidth label="Новый пароль" type="password" value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                            helperText="Минимум 6 символов" sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <TextField fullWidth label="Подтвердите пароль" type="password" value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            error={!!passwordError} helperText={passwordError}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setPasswordDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleChangePassword} variant="contained" disabled={loading}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>{loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Сменить пароль'}</StyledButton>
                </DialogActions>
            </StyledDialog>
            
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageContainer>
    );
};

export default Profile;