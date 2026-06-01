// ========== frontend/src/pages/Profile.js (v4.1 — TIMELINE, ИСПРАВЛЕНО) ==========
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    Grid, Divider, Alert, Snackbar, CircularProgress,
    Chip, InputAdornment, Dialog, DialogTitle, DialogContent,
    DialogActions, IconButton, Tooltip, Tabs, Tab, Badge, Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Save as SaveIcon, Edit as EditIcon, PhotoCamera as PhotoCameraIcon,
    Lock as LockIcon, Person as PersonIcon, Email as EmailIcon,
    Phone as PhoneIcon, Cake as CakeIcon, LocationCity as LocationCityIcon,
    TrendingUp as TrendingUpIcon, TrendingDown as TrendingDownIcon,
    CopyAll as CopyIcon, EmojiEvents as TrophyIcon,
    Timeline as TimelineIcon, School as SchoolIcon, Groups as GroupsIcon,
    CalendarMonth as CalendarIcon, AccessTime as ClockIcon,
    AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const CoverBg = styled(Box)({
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #A78BFA 100%)',
    height: 180,
    borderRadius: '20px 20px 0 0',
    position: 'relative',
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: 'linear-gradient(transparent, rgba(0,0,0,0.05))',
    },
});

const MainCard = styled(Paper)({
    borderRadius: '0 0 20px 20px',
    marginTop: -1,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    borderTop: 'none',
    backgroundColor: '#FFFFFF',
    overflow: 'visible',
});

const AvatarWrapper = styled(Box)({
    marginTop: -60,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    justifyContent: 'center',
});

const StatItem = styled(Box)({
    textAlign: 'center',
    padding: '12px 16px',
    flex: 1,
});

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========

const Profile = () => {
    const { user, updateUser } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Профиль'; }, []);
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [avatar, setAvatar] = useState(null);
    const fileInputRef = useRef(null);
    const [activeTab, setActiveTab] = useState(0);
    
    const [stats, setStats] = useState({
        studentsCount: 0, lessonsCount: 0, totalHours: 0,
        totalIncome: 0, monthlyGrowth: 0, thisMonthIncome: 0, lastMonthIncome: 0
    });
    
    const [profile, setProfile] = useState({
        fullName: '', email: '', phone: '', birthday: '', about: '', city: ''
    });
    
    const [passwordDialog, setPasswordDialog] = useState(false);
    const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordError, setPasswordError] = useState('');
    const [referralStats, setReferralStats] = useState({ totalReferrals: 0, bonusDays: 0 });
    
    useEffect(() => { if (user?.id) { fetchAll(); } }, [user]);

    const fetchAll = async () => {
        try {
            const [profileRes, studentsRes, lessonsRes, paymentsRes] = await Promise.all([
                axiosInstance.get(`/tutors/${user.id}`),
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/lessons/all?tutorId=${user.id}`),
                axiosInstance.get(`/payments/tutor/${user.id}`)
            ]);
            
            // Профиль
            setProfile({
                fullName: profileRes.data.fullName || user?.fullName || '',
                email: profileRes.data.email || user?.email || '',
                phone: profileRes.data.phone || '',
                birthday: profileRes.data.birthday || '',
                about: profileRes.data.about || '',
                city: profileRes.data.city || ''
            });
            
            // Статистика
            const studentsCount = studentsRes.data.length;
            
            // Все уроки кроме отменённых
            const allValidLessons = lessonsRes.data.filter(l => l.status !== 'CANCELLED');
            const completedLessons = lessonsRes.data.filter(l => l.status === 'COMPLETED' || l.status === 'PAID');
            
            // Часы: сумма duration всех НЕотменённых уроков
            const totalMinutes = allValidLessons.reduce((sum, l) => sum + (l.duration || 60), 0);
            const totalHours = Math.round(totalMinutes / 60);
            
            // Доход: из payments (PAID)
            const totalIncome = paymentsRes.data
                .filter(p => p.status === 'PAID' || p.status === 'paid')
                .reduce((sum, p) => sum + (p.amount || 0), 0);
            
            // Рост дохода
            const now = new Date();
            const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            const thisMonthIncome = paymentsRes.data.filter(p => {
                const d = new Date(p.paymentDate);
                return d >= thisMonthStart && (p.status === 'PAID' || p.status === 'paid');
            }).reduce((s, p) => s + (p.amount || 0), 0);
            const lastMonthIncome = paymentsRes.data.filter(p => {
                const d = new Date(p.paymentDate);
                return d >= lastMonthStart && d <= lastMonthEnd && p.status === 'paid';
            }).reduce((s, p) => s + (p.amount || 0), 0);
            const monthlyGrowth = lastMonthIncome > 0 ? ((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100 : 0;
            
            setStats({ 
                studentsCount, 
                lessonsCount: completedLessons.length, 
                totalHours, 
                totalIncome, 
                monthlyGrowth, 
                thisMonthIncome, 
                lastMonthIncome 
            });
            
            // Рефералы
            try {
                const refRes = await axiosInstance.get(`/tutors/${user.id}/referral-stats`);
                setReferralStats(refRes.data);
            } catch (e) {}
            
            // Аватар
            try {
                const avRes = await axiosInstance.get(`/tutors/${user.id}/avatar`);
                if (avRes.data.avatar) setAvatar(avRes.data.avatar);
            } catch (e) {}
            
        } catch (err) { console.error('Ошибка загрузки:', err); }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await axiosInstance.put(`/tutors/${user.id}`, profile);
            if (updateUser) updateUser({ ...user, fullName: profile.fullName });
            setEditMode(false);
            showSnackbar('Профиль обновлён', 'success');
        } catch (err) { showSnackbar('Ошибка', 'error'); }
        finally { setLoading(false); }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) { setPasswordError('Пароли не совпадают'); return; }
        if (passwordData.newPassword.length < 6) { setPasswordError('Минимум 6 символов'); return; }
        setLoading(true);
        try {
            await axiosInstance.post(`/tutors/${user.id}/change-password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            setPasswordDialog(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showSnackbar('Пароль изменён', 'success');
        } catch (err) { showSnackbar('Ошибка', 'error'); }
        finally { setLoading(false); }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const avatarPresets = [
        { bg: '#4F46E5', icon: '👨‍🏫' }, { bg: '#10B981', icon: '👩‍🏫' }, { bg: '#3B82F6', icon: '🎓' },
        { bg: '#F59E0B', icon: '📚' }, { bg: '#7C3AED', icon: '🧠' }, { bg: '#A78BFA', icon: '💡' },
        { bg: '#EC4899', icon: '🌟' }, { bg: '#10B981', icon: '🚀' },
    ];

    const achievements = [
        { icon: '🌟', label: 'Первое занятие', unlocked: stats.lessonsCount >= 1 },
        { icon: '🔥', label: '10 занятий', unlocked: stats.lessonsCount >= 10 },
        { icon: '💪', label: '50 занятий', unlocked: stats.lessonsCount >= 50 },
        { icon: '👥', label: '5 учеников', unlocked: stats.studentsCount >= 5 },
        { icon: '👑', label: '10 учеников', unlocked: stats.studentsCount >= 10 },
        { icon: '⏰', label: '100 часов', unlocked: stats.totalHours >= 100 },
        { icon: '💰', label: '50k доход', unlocked: stats.totalIncome >= 50000 },
        { icon: '🚀', label: '100k доход', unlocked: stats.totalIncome >= 100000 },
    ];

    return (
        <PageContainer sx={{ px: { xs: 1, sm: 3 }, pb: 4 }}>
            {/* ========== ОБЛОЖКА ========== */}
            <CoverBg />
            
            {/* ========== АВАТАР + ИМЯ + СТАТИСТИКА ========== */}
            <MainCard elevation={0}>
                <AvatarWrapper>
                    <Badge
                        overlap="circular"
                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        badgeContent={
                            <IconButton size="small" onClick={() => setAvatarDialogOpen(true)}
                                sx={{ bgcolor: '#4F46E5', color: '#FFFFFF', width: 32, height: 32, '&:hover': { bgcolor: '#4338CA' } }}>
                                <PhotoCameraIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                        }
                    >
                        <Avatar src={avatar}
                            sx={{ width: 120, height: 120, border: '4px solid #FFFFFF', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 44, fontWeight: 700, bgcolor: '#4F46E5' }}>
                            {!avatar && (profile.fullName?.charAt(0) || 'Р')}
                        </Avatar>
                    </Badge>
                </AvatarWrapper>

                <Box sx={{ textAlign: 'center', px: 3, pt: 2, pb: 1 }}>
                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1F2937' }}>
                        {profile.fullName || 'Репетитор'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280', mt: 0.5 }}>
                        {profile.city || 'Не указан город'} · ID: {user?.id}
                    </Typography>
                    {profile.about && (
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mt: 1.5, maxWidth: 500, mx: 'auto', lineHeight: 1.6 }}>
                            {profile.about}
                        </Typography>
                    )}
                </Box>

                {/* Статистика — 4 числа в ряд */}
                <Box sx={{ display: 'flex', borderTop: '1px solid #F3F4F6', mt: 2 }}>
                    {[
                        { value: stats.studentsCount, label: 'Учеников', icon: '👥' },
                        { value: stats.lessonsCount, label: 'Занятий', icon: '📅' },
                        { value: stats.totalHours, label: 'Часов', icon: '⏰' },
                        { value: `${(stats.totalIncome / 1000).toFixed(0)}k ₽`, label: 'Доход', icon: '💰' },
                    ].map((s, i) => (
                        <StatItem key={i} sx={{ borderRight: i < 3 ? '1px solid #F3F4F6' : 'none' }}>
                            <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>
                                {s.value}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                {s.icon} {s.label}
                            </Typography>
                        </StatItem>
                    ))}
                </Box>
            </MainCard>

            {/* Рост дохода */}
            <Paper sx={{ 
                borderRadius: '16px', p: 3, mt: 2, 
                display: 'flex', alignItems: 'center', gap: 3,
                bgcolor: stats.monthlyGrowth >= 0 ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${stats.monthlyGrowth >= 0 ? '#A7F3D0' : '#FECACA'}`,
            }}>
                {stats.monthlyGrowth >= 0 ? 
                    <TrendingUpIcon sx={{ fontSize: 40, color: '#10B981' }} /> : 
                    <TrendingDownIcon sx={{ fontSize: 40, color: '#EF4444' }} />
                }
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '20px', color: stats.monthlyGrowth >= 0 ? '#065F46' : '#991B1B' }}>
                        {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}% к прошлому месяцу
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {stats.thisMonthIncome.toLocaleString()} ₽ в этом месяце · {stats.lastMonthIncome.toLocaleString()} ₽ в прошлом
                    </Typography>
                </Box>
            </Paper>

            {/* ========== ТАБЫ ========== */}
            <Tabs 
                value={activeTab} 
                onChange={(e, v) => setActiveTab(v)}
                sx={{ 
                    mt: 3, mb: 2,
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, fontSize: '14px', px: 2 },
                    '& .MuiTabs-indicator': { backgroundColor: '#4F46E5' },
                }}
            >
                <Tab icon={<TrophyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Достижения" />
                <Tab icon={<PersonIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Данные" />
            </Tabs>

            {/* ========== ДОСТИЖЕНИЯ ========== */}
            {activeTab === 0 && (
                <Paper sx={{ borderRadius: '16px', p: 3, border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <Grid container spacing={1.5}>
                        {achievements.map((a, i) => (
                            <Grid item xs={6} sm={4} md={3} key={i}>
                                <Paper sx={{ 
                                    p: 2, textAlign: 'center', borderRadius: '14px',
                                    bgcolor: a.unlocked ? '#FFFFFF' : '#F9FAFB',
                                    border: `1px solid ${a.unlocked ? '#E5E7EB' : '#F3F4F6'}`,
                                    opacity: a.unlocked ? 1 : 0.5,
                                    transition: 'all 0.2s',
                                    '&:hover': a.unlocked ? { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' } : {},
                                }}>
                                    <Typography sx={{ fontSize: '36px', mb: 1 }}>
                                        {a.unlocked ? a.icon : '🔒'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: a.unlocked ? '#1F2937' : '#9CA3AF' }}>
                                        {a.label}
                                    </Typography>
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* ========== ДАННЫЕ ========== */}
            {activeTab === 1 && (
                <Paper sx={{ borderRadius: '16px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                    <Box sx={{ px: 3, py: 2, borderBottom: '1px solid #F3F4F6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '16px' }}>Личные данные</Typography>
                        {!editMode ? (
                            <StyledButton size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => setEditMode(true)}
                                sx={{ color: '#374151', borderColor: '#D1D5DB' }}>Редактировать</StyledButton>
                        ) : (
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <StyledButton size="small" variant="outlined" onClick={() => setEditMode(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                                <StyledButton size="small" variant="contained" startIcon={<SaveIcon />} onClick={handleSaveProfile}
                                    sx={{ bgcolor: '#4F46E5' }}>Сохранить</StyledButton>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ p: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="ФИО" value={profile.fullName} onChange={(e) => setProfile({...profile, fullName: e.target.value})} disabled={!editMode}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Email" value={profile.email} disabled helperText="Нельзя изменить"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Телефон" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} disabled={!editMode}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Город" value={profile.city} onChange={(e) => setProfile({...profile, city: e.target.value})} disabled={!editMode}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField fullWidth label="Дата рождения" type="date" value={profile.birthday} onChange={(e) => setProfile({...profile, birthday: e.target.value})} disabled={!editMode} InputLabelProps={{ shrink: true }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField fullWidth label="О себе" multiline rows={3} value={profile.about} onChange={(e) => setProfile({...profile, about: e.target.value})} disabled={!editMode}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            </Grid>
                        </Grid>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 2 }}>⚙️ Действия</Typography>
                        <Grid container spacing={1.5}>
                            <Grid item xs={12} sm={4}>
                                <StyledButton fullWidth variant="outlined" startIcon={<LockIcon />} onClick={() => setPasswordDialog(true)}
                                    sx={{ color: '#D97706', borderColor: '#FDE68A', justifyContent: 'center' }}>
                                    Сменить пароль
                                </StyledButton>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StyledButton fullWidth variant="outlined" startIcon={<CopyIcon />} onClick={async () => {
                                    try { const r = await axiosInstance.get(`/tutors/${user.id}/export-data`, { responseType: 'blob' }); const u = window.URL.createObjectURL(new Blob([r.data])); const a = document.createElement('a'); a.href = u; a.download = `edspace_${user.id}.json`; a.click(); showSnackbar('Скачано', 'success'); } catch (e) { showSnackbar('Ошибка', 'error'); }
                                }} sx={{ color: '#4F46E5', borderColor: '#C7D2FE', justifyContent: 'center' }}>
                                    Скачать данные
                                </StyledButton>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <StyledButton fullWidth variant="outlined" onClick={() => {
                                    if (window.confirm('Удалить аккаунт? Это необратимо.') && window.confirm('Точно?')) {
                                        axiosInstance.delete(`/tutors/${user.id}`).then(() => { localStorage.clear(); window.location.href = '/'; });
                                    }
                                }} sx={{ color: '#EF4444', borderColor: '#FECACA', justifyContent: 'center' }}>
                                    Удалить аккаунт
                                </StyledButton>
                            </Grid>
                        </Grid>
                    </Box>
                    <Divider />
                    <Box sx={{ p: 2.5 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 2 }}>🎁 Пригласи друга</Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: '#F5F3FF', borderRadius: '12px' }}>
                                <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#7C3AED' }}>{referralStats.totalReferrals || 0}</Typography>
                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Приглашено</Typography>
                            </Box>
                            <Box sx={{ flex: 1, textAlign: 'center', p: 1.5, bgcolor: '#ECFDF5', borderRadius: '12px' }}>
                                <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#10B981' }}>+{referralStats.bonusDays || 0}</Typography>
                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>Бонусных дней</Typography>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <TextField fullWidth size="small" value={`https://ed-space.ru/register?ref=${user?.referralCode || ''}`}
                                InputProps={{ readOnly: true }} sx={{ '& .MuiInputBase-input': { fontFamily: 'monospace', fontSize: '11px' } }} />
                            <StyledButton variant="contained" size="small"
                                onClick={() => { navigator.clipboard.writeText(`https://ed-space.ru/register?ref=${user?.referralCode || ''}`); showSnackbar('Ссылка скопирована!', 'success'); }}
                                sx={{ bgcolor: '#7C3AED', whiteSpace: 'nowrap', px: 2 }}>
                                📋 Копировать
                            </StyledButton>
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* Скрытый input */}
            <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={async (e) => {
                const f = e.target.files[0]; if (!f) return;
                const r = new FileReader(); r.onload = async () => {
                    try { await axiosInstance.post(`/tutors/${user.id}/avatar`, { avatar: r.result }); setAvatar(r.result); showSnackbar('Фото обновлено', 'success'); } catch (err) { showSnackbar('Ошибка', 'error'); }
                }; r.readAsDataURL(f);
            }} />

            {/* Диалог аватара */}
            <StyledDialog open={avatarDialogOpen} onClose={() => setAvatarDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Выберите аватар</DialogTitle>
                <DialogContent>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center', mb: 2 }}>
                        {avatarPresets.map((p, i) => (
                            <Avatar key={i} onClick={() => {
                                const c = document.createElement('canvas'); c.width = 140; c.height = 140;
                                const ctx = c.getContext('2d'); ctx.fillStyle = p.bg; ctx.fillRect(0, 0, 140, 140);
                                ctx.font = '64px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p.icon, 70, 70);
                                const d = c.toDataURL(); setAvatar(d); setAvatarDialogOpen(false);
                                axiosInstance.post(`/tutors/${user.id}/avatar`, { avatar: d });
                            }} sx={{ width: 64, height: 64, bgcolor: p.bg, fontSize: 30, cursor: 'pointer', '&:hover': { transform: 'scale(1.1)' } }}>
                                {p.icon}
                            </Avatar>
                        ))}
                    </Box>
                    <StyledButton fullWidth variant="outlined" startIcon={<PhotoCameraIcon />} onClick={() => { fileInputRef.current?.click(); setAvatarDialogOpen(false); }}>
                        Загрузить фото
                    </StyledButton>
                </DialogContent>
            </StyledDialog>

            {/* Диалог пароля */}
            <StyledDialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ fontWeight: 600 }}>Смена пароля</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField fullWidth label="Текущий пароль" type="password" value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} />
                        <TextField fullWidth label="Новый пароль" type="password" value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} helperText="Минимум 6 символов" />
                        <TextField fullWidth label="Подтвердите" type="password" value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})} error={!!passwordError} helperText={passwordError} />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <StyledButton onClick={() => setPasswordDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleChangePassword} variant="contained" sx={{ bgcolor: '#4F46E5' }}>Сменить</StyledButton>
                </DialogActions>
            </StyledDialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '10px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageContainer>
    );
};

export default Profile;