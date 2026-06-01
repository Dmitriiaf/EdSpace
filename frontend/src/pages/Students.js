// ========== frontend/src/pages/Students.js (РЕДИЗАЙН v4 — КАРТОЧКИ КАК В СОЦСЕТЯХ) ==========
import React, { useState, useEffect } from 'react';
import axiosInstance, { getAllLessons } from '../services/api';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Paper, IconButton, Alert, Snackbar,
    Chip, Typography, Tabs, Tab,
    FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Avatar, Tooltip, InputAdornment,
    Card, CardContent, Grid, Divider, Collapse, 
    Checkbox, FormControlLabel, Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    Add, Edit, Delete, PersonAdd, Search, 
    CheckCircle, Cake,
    ExpandMore, ExpandLess, TrendingUp,
    AttachMoney, Link as LinkIcon,
    Archive as ArchiveIcon, Unarchive as UnarchiveIcon,
    People as PeopleIcon, Repeat as RepeatIcon,
    AccessTime as ClockIcon, PersonOutline as ParentIcon,
    CalendarMonth as CalendarIcon, Mail as MailIcon,
    Phone as PhoneIcon, MoreVert as MoreIcon
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const StudentCard = styled(Card)({
    borderRadius: '16px',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'visible',
    '&:hover': {
        boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
        transform: 'translateY(-4px)',
        '& .quick-actions': {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
});

const QuickActions = styled(Box)({
    position: 'absolute',
    top: -12,
    right: 12,
    display: 'flex',
    gap: 4,
    opacity: 0,
    transform: 'translateY(8px)',
    transition: 'all 0.2s ease',
    zIndex: 10,
    '& .MuiIconButton-root': {
        backgroundColor: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
        width: 32,
        height: 32,
        '&:hover': {
            backgroundColor: '#F9FAFB',
        },
    },
});

const BirthdayBanner = styled(Paper)({
    padding: '16px 20px',
    marginBottom: '20px',
    borderRadius: '12px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    boxShadow: 'none',
});

const StyledTabs = styled(Tabs)({
    marginBottom: '20px',
    '& .MuiTab-root': {
        textTransform: 'none',
        fontWeight: 500,
        fontSize: '14px',
        color: '#6B7280',
        padding: '10px 20px',
        '&.Mui-selected': {
            color: '#4F46E5',
        },
    },
    '& .MuiTabs-indicator': {
        backgroundColor: '#4F46E5',
        height: '2px',
    },
});

const FilterChip = styled(Chip)(({ active }) => ({
    borderRadius: '8px',
    fontWeight: 500,
    fontSize: '13px',
    backgroundColor: active ? '#4F46E5' : 'transparent',
    color: active ? '#FFFFFF' : '#6B7280',
    border: active ? 'none' : '1px solid #E5E7EB',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: active ? '#4338CA' : '#F9FAFB',
    },
}));

const MiniProgress = styled(Box)({
    height: '3px',
    backgroundColor: '#E5E7EB',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '8px',
});

const MiniProgressFill = styled(Box)(({ width }) => ({
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: '2px',
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

function getBirthdayText(date) {
    if (!date) return null;
    const today = new Date();
    const birthday = new Date(date);
    const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
    if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
    const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
    if (daysUntil === 0) return '🎂 Сегодня!';
    if (daysUntil === 1) return '🎂 Завтра!';
    if (daysUntil <= 7) return `🎂 Через ${daysUntil} дн.`;
    return null;
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Students() {
    const navigate = useNavigate();
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Ученики'; }, []);
    const { getStudentRateForTutor } = useStudentRate();
    
    const [students, setStudents] = useState([]);
    const [archivedStudents, setArchivedStudents] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [openDialog, setOpenDialog] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [existingStudent, setExistingStudent] = useState(null);
    const [showExistingDialog, setShowExistingDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [allLessons, setAllLessons] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    const [formData, setFormData] = useState({
        fullName: '', email: '', ratePerLesson: '', discount: 0,
        paymentType: 'single', parentEmail: '', tutorId: user?.id
    });
    const [stats, setStats] = useState({ total: 0, subscription: 0, single: 0, withParent: 0 });

    const getStudentRate = (student) => getStudentRateForTutor(student, user?.id);

    useEffect(() => { if (user) { fetchStudents(); fetchArchivedStudents(); fetchAllLessons(); fetchSubscriptions(); } }, [user]);
    useEffect(() => { calculateStats(); }, [students]);

    const fetchStudents = async () => {
        try { const r = await axiosInstance.get(`/students/tutor/${user.id}`); setStudents(r.data); setError(null); } 
        catch (err) { setError('Не удалось загрузить учеников'); } finally { setLoading(false); }
    };
    const fetchArchivedStudents = async () => {
        try { const r = await axiosInstance.get(`/students/tutor/${user.id}/archived`); setArchivedStudents(r.data); } catch (err) {}
    };
    const fetchAllLessons = async () => {
        try { const r = await getAllLessons(user.id); setAllLessons(r.data !== undefined ? r.data : r); } catch (err) {}
    };
    const fetchSubscriptions = async () => {
        try { const r = await axiosInstance.get(`/subscriptions/tutor/${user.id}`); setSubscriptions(r.data); } catch (err) {}
    };

    const handleGenerateInviteLink = async () => {
        try {
            const res = await axiosInstance.post('/invitations/generate');
            await navigator.clipboard.writeText(res.data.link);
            setSnackbar({ open: true, message: '✅ Ссылка скопирована! Отправьте её ученику', severity: 'success' });
        } catch (err) {
            setSnackbar({ open: true, message: 'Ошибка при создании ссылки', severity: 'error' });
        }
    };

    const calculateStats = () => {
        setStats({
            total: students.length,
            subscription: students.filter(s => s.paymentType === 'subscription').length,
            single: students.filter(s => s.paymentType === 'single').length,
            withParent: students.filter(s => s.parent).length
        });
    };

    const getStudentStats = (email) => {
        const now = new Date();
        const month = allLessons.filter(l => l.student?.email === email && new Date(l.lessonDate).getMonth() === now.getMonth());
        return {
            total: month.length,
            completed: month.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length,
            upcoming: month.filter(l => new Date(l.lessonDate) >= now && l.status === 'SCHEDULED').length
        };
    };

    const getNextLesson = (email) => {
        const now = new Date();
        return allLessons.filter(l => l.student?.email === email && (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') && new Date(l.lessonDate) >= now)
            .sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate))[0] || null;
    };

    const getSubscriptionProgress = (id) => {
        const sub = subscriptions.find(s => s.student?.id === id && (s.status === 'ACTIVE' || s.status === 'active'));
        if (!sub) return null;
        return { used: sub.lessonsUsed || 0, total: sub.lessonsCount, percent: sub.lessonsCount > 0 ? ((sub.lessonsUsed || 0) / sub.lessonsCount) * 100 : 0, debt: sub.debtLessons || 0 };
    };

    const getUpcomingBirthdays = () => {
        const today = new Date();
        return (tabValue === 0 ? students : archivedStudents).filter(s => s.birthday).map(s => {
            const bd = new Date(s.birthday);
            const next = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
            if (next < today) next.setFullYear(today.getFullYear() + 1);
            return { ...s, daysUntil: Math.ceil((next - today) / (1000 * 60 * 60 * 24)) };
        }).filter(s => s.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);
    };

    const checkExistingStudent = async (email) => {
        if (!email) return;
        setCheckingEmail(true);
        try {
            const r = await axiosInstance.get(`/students/search-by-email?email=${email}`);
            if (r.data?.exists) {
                if (r.data.alreadyLinked) { showSnackbar(`Ученик ${r.data.fullName} уже привязан`, 'warning'); setExistingStudent(null); }
                else { setExistingStudent(r.data); setShowExistingDialog(true); }
            } else { setExistingStudent(null); setShowExistingDialog(false); }
        } catch (err) { setExistingStudent(null); }
        finally { setCheckingEmail(false); }
    };

    const handleEmailBlur = () => { if (formData.email && !editingStudent) checkExistingStudent(formData.email); };
    const handleUseExistingStudent = () => {
        if (existingStudent) {
            setFormData({ fullName: existingStudent.fullName, email: existingStudent.email, ratePerLesson: '', paymentType: existingStudent.paymentType || 'single', parentEmail: existingStudent.parent?.email || '', tutorId: user.id });
            setShowExistingDialog(false); setExistingStudent(null);
        }
    };
    const handleOpenDialog = (student) => {
        if (!student) return; // Больше не открываем для нового ученика
        setEditingStudent(student);
        setFormData({ 
            fullName: student.fullName, 
            email: student.email || '', 
            ratePerLesson: getStudentRate(student) || '', 
            paymentType: student.paymentType || 'single', 
            parentEmail: student.parent?.email || '', 
            selfPaid: student.selfPaid || false, 
            tutorId: user.id 
        });
        setOpenDialog(true);
    };
    const handleCloseDialog = () => { setOpenDialog(false); setEditingStudent(null); setExistingStudent(null); setShowExistingDialog(false); };
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const d = { fullName: formData.fullName, email: formData.email, ratePerLesson: formData.ratePerLesson ? parseFloat(formData.ratePerLesson) : null, discount: formData.discount || 0, paymentType: formData.paymentType, parentEmail: formData.parentEmail || null, selfPaid: formData.selfPaid || false, tutorId: user.id };
            if (editingStudent) { await axiosInstance.put(`/students/${editingStudent.id}`, d); showSnackbar('Ученик обновлён', 'success'); }
            else { await axiosInstance.post('/students', d); showSnackbar('📧 Приглашение отправлено', 'success'); }
            handleCloseDialog();
            fetchStudents(); fetchArchivedStudents(); fetchAllLessons(); fetchSubscriptions();
        } catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка', 'error'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => { if (window.confirm('Удалить?')) { try { await axiosInstance.delete(`/students/${id}`); showSnackbar('Удалён', 'success'); fetchStudents(); fetchArchivedStudents(); } catch (err) { showSnackbar('Ошибка', 'error'); } } };
    const handleArchive = async (id, name) => { if (window.confirm(`В архив: ${name}?`)) { try { await axiosInstance.put(`/students/${id}`, { archived: true }); showSnackbar('В архив', 'success'); fetchStudents(); fetchArchivedStudents(); } catch (err) { showSnackbar('Ошибка', 'error'); } } };
    const handleUnarchive = async (id, name) => { if (window.confirm(`Восстановить: ${name}?`)) { try { await axiosInstance.put(`/students/${id}`, { archived: false }); showSnackbar('Восстановлен', 'success'); fetchStudents(); fetchArchivedStudents(); } catch (err) { showSnackbar('Ошибка', 'error'); } } };
    const showSnackbar = (m, s) => setSnackbar({ open: true, message: m, severity: s });
    const handleExpandClick = (id) => setExpandedId(expandedId === id ? null : id);

    const currentStudents = tabValue === 0 ? students : archivedStudents;
    const filteredStudents = currentStudents
        .filter(s => 
            (s.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) && 
            (filterType === 'all' || s.paymentType === filterType)
        )
        .sort((a, b) => {
            if (sortBy === 'name') return (a.fullName || '').localeCompare(b.fullName || '');
            return (b.id || 0) - (a.id || 0);
        });
    const upcomingBirthdays = getUpcomingBirthdays();

    const statCards = [
        { v: stats.total, l: 'Всего учеников', icon: <PeopleIcon sx={{ fontSize: 22, color: '#4F46E5' }} />, bg: '#EEF2FF' },
        { v: stats.subscription, l: 'Абонемент', icon: <RepeatIcon sx={{ fontSize: 22, color: '#10B981' }} />, bg: '#ECFDF5' },
        { v: stats.single, l: 'Поурочно', icon: <ClockIcon sx={{ fontSize: 22, color: '#3B82F6' }} />, bg: '#EFF6FF' },
        { v: stats.withParent, l: 'С родителем', icon: <ParentIcon sx={{ fontSize: 22, color: '#7C3AED' }} />, bg: '#F5F3FF' },
    ];

    if (loading) return (
        <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
                        Мои ученики
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {stats.total} учеников · {stats.subscription} на абонементе · {stats.single} поурочно
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <StyledButton 
                        variant="outlined" 
                        startIcon={<LinkIcon />}
                        onClick={handleGenerateInviteLink}
                        sx={{ color: '#4F46E5', borderColor: '#C7D2FE' }}
                    >
                        Пригласить по ссылке
                    </StyledButton>
                </Box>
            </Box>

            {/* ========== ВКЛАДКИ ========== */}
            <StyledTabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                <Tab label={`Активные (${students.length})`} />
                <Tab label={`Архив (${archivedStudents.length})`} />
            </StyledTabs>

            {/* ========== ДНИ РОЖДЕНИЯ ========== */}
            {upcomingBirthdays.length > 0 && tabValue === 0 && (
                <BirthdayBanner elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                        <Cake sx={{ color: '#D97706', fontSize: 20 }} />
                        <Typography sx={{ fontWeight: 600, color: '#92400E', fontSize: '14px' }}>
                            Ближайшие дни рождения
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {upcomingBirthdays.map(s => (
                            <Chip 
                                key={s.id} 
                                avatar={<Avatar sx={{ bgcolor: '#D97706', width: 24, height: 24, fontSize: 12, fontWeight: 600 }}>{s.fullName?.charAt(0)}</Avatar>}
                                label={`${s.fullName} — ${getBirthdayText(s.birthday)}`} 
                                variant="outlined" 
                                sx={{ 
                                    bgcolor: '#FFFFFF', 
                                    borderColor: '#FDE68A', 
                                    color: '#92400E', 
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    borderRadius: '8px',
                                }} 
                            />
                        ))}
                    </Box>
                </BirthdayBanner>
            )}

            {/* ========== ПОИСК + ФИЛЬТРЫ ========== */}
            <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3, 
                gap: 2, 
                flexWrap: 'wrap' 
            }}>
                <TextField 
                    placeholder="Поиск по имени..." 
                    size="small" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ 
                        width: { xs: '100%', sm: 280 },
                        '& .MuiOutlinedInput-root': { 
                            borderRadius: '10px', 
                            bgcolor: '#FFFFFF',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
                        },
                    }}
                    InputProps={{ 
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#9CA3AF', fontSize: 18 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={sortBy === 'name' ? 'По алфавиту' : 'По дате добавления'}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}
                                        sx={{ color: '#9CA3AF' }}
                                    >
                                        {sortBy === 'name' ? 'А-Я' : '↓'}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {[
                        { value: 'all', label: 'Все' },
                        { value: 'subscription', label: 'Абонемент' },
                        { value: 'single', label: 'Поурочно' },
                    ].map(t => (
                        <FilterChip 
                            key={t.value}
                            label={t.label}
                            active={filterType === t.value}
                            onClick={() => setFilterType(t.value)}
                            variant={filterType === t.value ? 'filled' : 'outlined'}
                        />
                    ))}
                </Box>
            </Box>

            {/* ========== КОНТЕНТ ========== */}
            {error ? (
                <Alert severity="error" sx={{ borderRadius: '12px', mb: 3 }}>{error}</Alert>
            ) : filteredStudents.length === 0 ? (
                <Paper sx={{ borderRadius: '16px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <PersonAdd sx={{ fontSize: 48, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            {tabValue === 0 ? (searchTerm ? 'Ничего не найдено' : 'У вас пока нет учеников') : 'Архив пуст'}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                            {tabValue === 0 && !searchTerm ? 'Отправьте ссылку-приглашение первому ученику' : 'Попробуйте изменить параметры поиска'}                        </Typography>
                        {!searchTerm && tabValue === 0 && (
                            <StyledButton 
                                variant="outlined" 
                                startIcon={<LinkIcon />} 
                                onClick={handleGenerateInviteLink}
                                sx={{ color: '#4F46E5', borderColor: '#C7D2FE' }}
                            >
                                Пригласить по ссылке
                            </StyledButton>
                        )}
                    </EmptyStateContainer>
                </Paper>
            ) : (
                <Grid container spacing={1.5}>
                    {filteredStudents.map((student, index) => {
                        const next = getNextLesson(student.email);
                        const birthday = getBirthdayText(student.birthday);
                        const sub = getSubscriptionProgress(student.id);
                        const isExp = expandedId === student.id;
                        const rate = getStudentRate(student);
                        const avatarColor = getAvatarColor(student.fullName);

                        return (
                            <Grid item xs={6} sm={4} md={3} lg={2.4} key={student.id}>
                                <StudentCard>
                                    {/* Быстрые действия при наведении */}
                                    <QuickActions className="quick-actions">
                                        <Tooltip title="Редактировать" placement="top">
                                            <IconButton size="small" onClick={() => handleOpenDialog(student)}>
                                                <Edit sx={{ fontSize: 15, color: '#6B7280' }} />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Успеваемость" placement="top">
                                            <IconButton size="small" onClick={() => navigate(`/student-progress/${student.id}`)}>
                                                <TrendingUp sx={{ fontSize: 15, color: '#4F46E5' }} />
                                            </IconButton>
                                        </Tooltip>
                                        {tabValue === 0 ? (
                                            <Tooltip title="Архивировать" placement="top">
                                                <IconButton size="small" onClick={() => handleArchive(student.id, student.fullName)}>
                                                    <ArchiveIcon sx={{ fontSize: 15, color: '#9CA3AF' }} />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="Восстановить" placement="top">
                                                <IconButton size="small" onClick={() => handleUnarchive(student.id, student.fullName)}>
                                                    <UnarchiveIcon sx={{ fontSize: 15, color: '#10B981' }} />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </QuickActions>

                                    {/* Бейдж дня рождения */}
                                    {birthday && (
                                        <Box sx={{ 
                                            position: 'absolute', 
                                            top: 8, 
                                            left: 8, 
                                            bgcolor: '#FEF3C7', 
                                            color: '#92400E', 
                                            px: 1, 
                                            py: 0.3, 
                                            borderRadius: '6px', 
                                            fontSize: '10px', 
                                            fontWeight: 600, 
                                            zIndex: 2 
                                        }}>
                                            {birthday}
                                        </Box>
                                    )}
                                    
                                    <CardContent sx={{ p: 2, pb: '12px !important', textAlign: 'center' }}>
                                        {/* Аватар */}
                                        <Avatar 
                                            sx={{ 
                                                width: 52, height: 52, 
                                                bgcolor: avatarColor, 
                                                fontSize: 22, 
                                                fontWeight: 700, 
                                                mx: 'auto',
                                                mb: 1.5,
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                            }}
                                        >
                                            {getInitials(student.fullName)}
                                        </Avatar>

                                        {/* Имя */}
                                        <Typography sx={{ 
                                            fontWeight: 600, 
                                            color: '#1F2937', 
                                            fontSize: '14px', 
                                            lineHeight: 1.3,
                                            mb: 0.5,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {student.fullName}
                                        </Typography>

                                        {/* Тип оплаты */}
                                        <Chip 
                                            label={student.paymentType === 'subscription' ? 'Абонемент' : 'Поурочно'}
                                            size="small"
                                            sx={{ 
                                                fontSize: '10px', 
                                                height: 20, 
                                                fontWeight: 500,
                                                bgcolor: student.paymentType === 'subscription' ? '#ECFDF5' : '#EFF6FF',
                                                color: student.paymentType === 'subscription' ? '#065F46' : '#1E40AF',
                                                mb: 1,
                                            }}
                                        />

                                        {/* Ставка */}
                                        <Typography sx={{ 
                                            fontWeight: 700, 
                                            color: student.discount > 0 ? '#F59E0B' : '#10B981', 
                                            fontSize: '18px',
                                            mb: 0.5,
                                        }}>
                                            {rate || '—'} ₽
                                        </Typography>
                                        {student.discount > 0 && (
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF', mt: -0.5, mb: 0.5 }}>
                                                Скидка {student.discount}%
                                            </Typography>
                                        )}

                                        {/* Ближайший урок */}
                                        {next && (
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center',
                                                gap: 0.5, 
                                                mt: 0.5,
                                                px: 1,
                                                py: 0.5,
                                                bgcolor: '#F9FAFB',
                                                borderRadius: '6px',
                                            }}>
                                                <CalendarIcon sx={{ fontSize: 12, color: '#9CA3AF' }} />
                                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                    {format(new Date(next.lessonDate), 'd MMM', { locale: ru })} {next.startTime?.slice(0, 5)}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Прогресс абонемента */}
                                        {sub && (
                                            <Box sx={{ mt: 1 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>
                                                        Абонемент
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '10px', fontWeight: 600, color: '#4F46E5' }}>
                                                        {sub.used}/{sub.total}
                                                    </Typography>
                                                </Box>
                                                <MiniProgress>
                                                    <MiniProgressFill width={sub.percent} />
                                                </MiniProgress>
                                                {sub.debt > 0 && (
                                                    <Typography sx={{ fontSize: '10px', color: '#EF4444', fontWeight: 500, mt: 0.3 }}>
                                                        Долг: {sub.debt} занятий
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}

                                        {/* Родитель */}
                                        <Box sx={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            gap: 0.5, 
                                            mt: 1,
                                            color: student.parent ? '#10B981' : '#D1D5DB',
                                        }}>
                                            <CheckCircle sx={{ fontSize: 12 }} />
                                            <Typography sx={{ fontSize: '10px' }}>
                                                {student.parent ? 'Родитель подключён' : 'Без родителя'}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                </StudentCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== ДИАЛОГ ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ========== */}
            <StyledDialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: '#1F2937',
                    px: 3,
                    pt: 3,
                    pb: 1,
                }}>
                    {editingStudent ? 'Редактировать ученика' : 'Новый ученик'}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField 
                            fullWidth 
                            label="Имя ученика" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                            required 
                            autoFocus 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <TextField 
                            fullWidth 
                            label="Email" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            onBlur={handleEmailBlur} 
                            required 
                            helperText="На этот email придёт приглашение"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <TextField 
                            fullWidth 
                            label="Ставка (₽)" 
                            name="ratePerLesson" 
                            type="number" 
                            value={formData.ratePerLesson} 
                            onChange={handleInputChange} 
                            required 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <TextField 
                            fullWidth 
                            label="Скидка (%)" 
                            name="discount" 
                            type="number" 
                            value={formData.discount || 0} 
                            onChange={handleInputChange}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <FormControl fullWidth>
                            <InputLabel>Тип оплаты</InputLabel>
                            <Select 
                                name="paymentType" 
                                value={formData.paymentType} 
                                onChange={handleInputChange} 
                                label="Тип оплаты"
                                sx={{ borderRadius: '10px' }}
                            >
                                <MenuItem value="single">Поурочно</MenuItem>
                                <MenuItem value="subscription">Абонемент</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField 
                            fullWidth 
                            label="Email родителя" 
                            name="parentEmail" 
                            type="email" 
                            value={formData.parentEmail || ''} 
                            onChange={handleInputChange} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    checked={formData.selfPaid || false} 
                                    onChange={(e) => setFormData({ ...formData, selfPaid: e.target.checked })} 
                                />
                            } 
                            label="Самостоятельная оплата" 
                        />
                        <Alert severity="info" sx={{ borderRadius: '10px', fontSize: '13px' }}>
                            После сохранения ученик и родитель получат приглашения на email.
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <StyledButton fullWidth variant="outlined" onClick={handleCloseDialog}
                                sx={{ borderColor: '#D1D5DB', color: '#374151' }}>
                                Отмена
                            </StyledButton>
                            <StyledButton fullWidth variant="contained" onClick={handleSubmit} 
                                disabled={!formData.fullName || !formData.email || !formData.ratePerLesson || submitting}
                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                                {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : (editingStudent ? 'Сохранить' : 'Отправить')}
                            </StyledButton>
                        </Box>
                    </Box>
                </DialogContent>
            </StyledDialog>

            {/* ========== ДИАЛОГ СУЩЕСТВУЮЩЕГО УЧЕНИКА ========== */}
            <StyledDialog open={showExistingDialog} onClose={() => setShowExistingDialog(false)}>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600 }}>
                    Ученик уже существует
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, fontSize: '14px', color: '#374151' }}>
                        Найден: <strong>{existingStudent?.email}</strong>
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                        <Typography sx={{ fontSize: '14px' }}>
                            <strong>ФИО:</strong> {existingStudent?.fullName}
                        </Typography>
                    </Paper>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setShowExistingDialog(false)} sx={{ color: '#6B7280' }}>
                        Новые данные
                    </StyledButton>
                    <StyledButton 
                        onClick={handleUseExistingStudent} 
                        variant="contained" 
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                    >
                        Использовать
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== SNACKBAR ========== */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={5000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={snackbar.severity} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{ borderRadius: '10px' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Students;