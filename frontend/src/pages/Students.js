// ========== frontend/src/pages/Students.js (РЕДИЗАЙН v5 — SOCIAL MEDIA STYLE) ==========
import React, { useState, useEffect } from 'react';
import axiosInstance, { getAllLessons } from '../services/api';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Paper, IconButton, Alert, Snackbar,
    Chip, Typography, Tabs, Tab,
    FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Avatar, Tooltip, InputAdornment,
    Card, CardContent, Grid, Divider, 
    Menu, // Добавлено для меню действий
    Checkbox, FormControlLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    Add, Edit, Delete, PersonAdd, Search, 
    CheckCircle, Cake, TrendingUp,
    Archive as ArchiveIcon, Unarchive as UnarchiveIcon,
    People as PeopleIcon, Repeat as RepeatIcon,
    AccessTime as ClockIcon, PersonOutline as ParentIcon,
    CalendarMonth as CalendarIcon, MoreVert as MoreIcon,
    AttachMoney
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const StudentCard = styled(Card)(({ theme }) => ({
    borderRadius: '20px',
    border: '1px solid #F3F4F6',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    position: 'relative',
    overflow: 'visible',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    '&:hover': {
        boxShadow: '0 12px 30px rgba(0,0,0,0.08)',
        transform: 'translateY(-4px)',
        borderColor: '#E0E7FF',
    },
}));

const CardFooter = styled(Box)({
    padding: '16px 20px',
    borderTop: '1px solid #F3F4F6',
    marginTop: 'auto',
    backgroundColor: '#FAFAFA',
    borderBottomLeftRadius: '20px',
    borderBottomRightRadius: '20px',
});

const BirthdayBanner = styled(Paper)({
    padding: '16px 20px',
    marginBottom: '24px',
    borderRadius: '16px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    boxShadow: 'none',
});

const StyledTabs = styled(Tabs)({
    marginBottom: '24px',
    '& .MuiTab-root': {
        textTransform: 'none',
        fontWeight: 600,
        fontSize: '15px',
        color: '#6B7280',
        padding: '12px 24px',
        minHeight: '48px',
        '&.Mui-selected': {
            color: '#4F46E5',
        },
    },
    '& .MuiTabs-indicator': {
        backgroundColor: '#4F46E5',
        height: '3px',
        borderRadius: '3px 3px 0 0',
    },
});

const FilterChip = styled(Chip)(({ active }) => ({
    borderRadius: '10px',
    fontWeight: 600,
    fontSize: '13px',
    padding: '0 4px',
    height: '32px',
    backgroundColor: active ? '#4F46E5' : 'transparent',
    color: active ? '#FFFFFF' : '#6B7280',
    border: active ? 'none' : '1px solid #E5E7EB',
    cursor: 'pointer',
    transition: 'all 0.2s',
    '&:hover': {
        backgroundColor: active ? '#4338CA' : '#F9FAFB',
    },
}));

const MiniProgress = styled(Box)({
    height: '6px',
    backgroundColor: '#F3F4F6',
    borderRadius: '3px',
    overflow: 'hidden',
    marginTop: '6px',
});

const MiniProgressFill = styled(Box)(({ width, color }) => ({
    height: '100%',
    backgroundColor: color || '#4F46E5',
    borderRadius: '3px',
    width: `${width}%`,
    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
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
    const [editingStudent, setEditingStudent] = useState(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [existingStudent, setExistingStudent] = useState(null);
    const [showExistingDialog, setShowExistingDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [allLessons, setAllLessons] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Меню действий для карточки
    const [anchorEl, setAnchorEl] = useState(null);
    const [activeStudentId, setActiveStudentId] = useState(null);

    const [formData, setFormData] = useState({
        fullName: '', email: '', ratePerLesson: '', discount: 0,
        paymentType: 'single', parentEmail: '', selfPaid: false, tutorId: user?.id
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

    const calculateStats = () => {
        setStats({
            total: students.length,
            subscription: students.filter(s => s.paymentType === 'subscription').length,
            single: students.filter(s => s.paymentType === 'single').length,
            withParent: students.filter(s => s.parent).length
        });
    };

    const getNextLesson = (email) => {
        const now = new Date();
        return allLessons.filter(l => l.student?.email === email && (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') && new Date(l.lessonDate) >= now)
            .sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate))[0] || null;
    };

    const getSubscriptionProgress = (id) => {
        const sub = subscriptions.find(s => s.student?.id === id && (s.status === 'ACTIVE' || s.status === 'active'));
        if (!sub) return null;
        return { 
            used: sub.lessonsUsed || 0, 
            total: sub.lessonsCount, 
            percent: sub.lessonsCount > 0 ? ((sub.lessonsUsed || 0) / sub.lessonsCount) * 100 : 0, 
            debt: sub.debtLessons || 0 
        };
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
            setFormData({ fullName: existingStudent.fullName, email: existingStudent.email, ratePerLesson: '', paymentType: existingStudent.paymentType || 'single', parentEmail: existingStudent.parent?.email || '', selfPaid: existingStudent.selfPaid || false, tutorId: user.id });
            setShowExistingDialog(false); setExistingStudent(null);
        }
    };
    
    const handleOpenDialog = (student) => {
        if (!student) {
            setEditingStudent(null);
            setFormData({ fullName: '', email: '', ratePerLesson: '', discount: 0, paymentType: 'single', parentEmail: '', selfPaid: false, tutorId: user.id });
        } else {
            setEditingStudent(student);
            setFormData({ 
                fullName: student.fullName, 
                email: student.email || '', 
                ratePerLesson: getStudentRate(student) || '', 
                discount: student.discount || 0,
                paymentType: student.paymentType || 'single', 
                parentEmail: student.parent?.email || '', 
                selfPaid: student.selfPaid || false, 
                tutorId: user.id 
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => { setOpenDialog(false); setEditingStudent(null); setExistingStudent(null); setShowExistingDialog(false); };
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const d = { 
                fullName: formData.fullName, 
                email: formData.email, 
                ratePerLesson: formData.ratePerLesson ? parseFloat(formData.ratePerLesson) : null, 
                discount: formData.discount || 0, 
                paymentType: formData.paymentType, 
                parentEmail: formData.parentEmail || null, 
                selfPaid: formData.selfPaid || false, 
                tutorId: user.id 
            };
            if (editingStudent) { 
                await axiosInstance.put(`/students/${editingStudent.id}`, d); 
                showSnackbar('Ученик обновлён', 'success'); 
            } else { 
                await axiosInstance.post('/students', d); 
                showSnackbar('✅ Ученик успешно добавлен', 'success'); 
            }
            handleCloseDialog();
            fetchStudents(); fetchArchivedStudents(); fetchAllLessons(); fetchSubscriptions();
        } catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка', 'error'); }
        finally { setSubmitting(false); }
    };

    const handleDelete = async (id) => { if (window.confirm('Удалить ученика безвозвратно?')) { try { await axiosInstance.delete(`/students/${id}`); showSnackbar('Удалён', 'success'); fetchStudents(); fetchArchivedStudents(); } catch (err) { showSnackbar('Ошибка', 'error'); } } };
    const handleArchive = async (id, name) => { if (window.confirm(`Отправить в архив: ${name}?`)) { try { await axiosInstance.put(`/students/${id}`, { archived: true }); showSnackbar('В архив', 'success'); fetchStudents(); fetchArchivedStudents(); } catch (err) { showSnackbar('Ошибка', 'error'); } } };
    const handleUnarchive = async (id, name) => { if (window.confirm(`Восстановить: ${name}?`)) { try { await axiosInstance.put(`/students/${id}`, { archived: false }); showSnackbar('Восстановлен', 'success'); fetchStudents(); fetchArchivedStudents(); } catch (err) { showSnackbar('Ошибка', 'error'); } } };
    const showSnackbar = (m, s) => setSnackbar({ open: true, message: m, severity: s });

    // Управление меню карточки
    const handleMenuOpen = (event, studentId) => {
        setAnchorEl(event.currentTarget);
        setActiveStudentId(studentId);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setActiveStudentId(null);
    };

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

    if (loading) return (
        <PageContainer sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка учеников..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer sx={{ px: { xs: 2, sm: 4 }, py: 4 }}>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap', gap: 3 }}>
                <Box>
                    <Typography sx={{ fontSize: '32px', fontWeight: 800, color: '#111827', mb: 1, letterSpacing: '-0.5px' }}>
                        Мои ученики
                    </Typography>
                    <Typography sx={{ fontSize: '15px', color: '#6B7280', fontWeight: 500 }}>
                        {stats.total} учеников · {stats.subscription} на абонементе · {stats.single} поурочно
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <StyledButton 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog(null)}
                        sx={{ 
                            bgcolor: '#4F46E5', 
                            color: '#fff', 
                            fontWeight: 600, 
                            borderRadius: '12px',
                            px: 3,
                            py: 1.2,
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                            '&:hover': { bgcolor: '#4338CA', boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)' }
                        }}
                    >
                        Добавить ученика
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                        <Box sx={{ bgcolor: '#FEF3C7', p: 1, borderRadius: '10px' }}>
                            <Cake sx={{ color: '#D97706', fontSize: 22 }} />
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: '#92400E', fontSize: '15px' }}>
                            Ближайшие дни рождения
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {upcomingBirthdays.map(s => (
                            <Chip 
                                key={s.id} 
                                avatar={<Avatar sx={{ bgcolor: '#F59E0B', width: 28, height: 28, fontSize: 12, fontWeight: 700 }}>{s.fullName?.charAt(0)}</Avatar>}
                                label={`${s.fullName} — ${getBirthdayText(s.birthday)}`} 
                                variant="outlined" 
                                sx={{ 
                                    bgcolor: '#FFFFFF', 
                                    borderColor: '#FDE68A', 
                                    color: '#92400E', 
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    borderRadius: '10px',
                                    height: '36px',
                                    px: 1,
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
                mb: 4, 
                gap: 3, 
                flexWrap: 'wrap' 
            }}>
                <TextField 
                    placeholder="Поиск по имени..." 
                    size="small" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ 
                        width: { xs: '100%', sm: 320 },
                        '& .MuiOutlinedInput-root': { 
                            borderRadius: '12px', 
                            bgcolor: '#FFFFFF',
                            '& fieldset': { borderColor: '#E5E7EB' },
                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                            '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 4px rgba(79,70,229,0.1)' },
                        },
                    }}
                    InputProps={{ 
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ color: '#9CA3AF', fontSize: 20 }} />
                            </InputAdornment>
                        ),
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={sortBy === 'name' ? 'Сортировать по алфавиту' : 'Сортировать по дате добавления'}>
                                    <IconButton 
                                        size="small" 
                                        onClick={() => setSortBy(sortBy === 'name' ? 'date' : 'name')}
                                        sx={{ color: '#9CA3AF', bgcolor: '#F9FAFB', '&:hover': { bgcolor: '#F3F4F6' } }}
                                    >
                                        {sortBy === 'name' ? 'А-Я' : '↓'}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
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
                        />
                    ))}
                </Box>
            </Box>

            {/* ========== КОНТЕНТ ========== */}
            {error ? (
                <Alert severity="error" sx={{ borderRadius: '16px', mb: 3, fontSize: '15px' }}>{error}</Alert>
            ) : filteredStudents.length === 0 ? (
                <Paper sx={{ borderRadius: '20px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', p: 6 }}>
                    <EmptyStateContainer>
                        <EmptyStateIcon sx={{ bgcolor: '#F3F4F6', width: 80, height: 80, borderRadius: '50%', mb: 3 }}>
                            <PersonAdd sx={{ fontSize: 40, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1F2937', mb: 1 }}>
                            {tabValue === 0 ? (searchTerm ? 'Ничего не найдено' : 'У вас пока нет учеников') : 'Архив пуст'}
                        </Typography>
                        <Typography sx={{ fontSize: '15px', color: '#6B7280', mb: 4, maxWidth: 400, mx: 'auto', textAlign: 'center' }}>
                            {tabValue === 0 && !searchTerm ? 'Нажмите кнопку «Добавить ученика», чтобы создать первую карточку и начать работу.' : 'Попробуйте изменить параметры поиска или переключитесь на вкладку активных.'}
                        </Typography>
                        {!searchTerm && tabValue === 0 && (
                            <StyledButton 
                                variant="contained" 
                                startIcon={<Add />} 
                                onClick={() => handleOpenDialog(null)}
                                sx={{ bgcolor: '#4F46E5', borderRadius: '12px', px: 4, py: 1.5 }}
                            >
                                Добавить первого ученика
                            </StyledButton>
                        )}
                    </EmptyStateContainer>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredStudents.map((student) => {
                        const next = getNextLesson(student.email);
                        const birthday = getBirthdayText(student.birthday);
                        const sub = getSubscriptionProgress(student.id);
                        const rate = getStudentRate(student);
                        const avatarColor = getAvatarColor(student.fullName);
                        const isActiveMenu = Boolean(anchorEl && activeStudentId === student.id);

                        return (
                            <Grid item xs={12} sm={6} md={4} lg={3} xl={2.4} key={student.id}>
                                <StudentCard>
                                    {/* Меню действий (три точки) */}
                                    <IconButton 
                                        size="small" 
                                        onClick={(e) => handleMenuOpen(e, student.id)}
                                        sx={{ 
                                            position: 'absolute', 
                                            top: 16, 
                                            right: 16, 
                                            bgcolor: 'rgba(255,255,255,0.8)', 
                                            backdropFilter: 'blur(4px)',
                                            '&:hover': { bgcolor: '#F3F4F6' }
                                        }}
                                    >
                                        <MoreIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                                    </IconButton>

                                    <CardContent sx={{ p: 3, pb: 2, flexGrow: 1 }}>
                                        {/* Бейдж дня рождения */}
                                        {birthday && (
                                            <Box sx={{ 
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: 0.5,
                                                bgcolor: '#FEF3C7', 
                                                color: '#92400E', 
                                                px: 1.5, 
                                                py: 0.5, 
                                                borderRadius: '8px', 
                                                fontSize: '11px', 
                                                fontWeight: 700,
                                                mb: 2,
                                                zIndex: 2 
                                            }}>
                                                <Cake sx={{ fontSize: 14 }} /> {birthday}
                                            </Box>
                                        )}

                                        {/* Аватар и Имя */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 56, height: 56, 
                                                    bgcolor: avatarColor, 
                                                    fontSize: 20, 
                                                    fontWeight: 800, 
                                                    boxShadow: `0 4px 12px ${avatarColor}40`,
                                                    border: '3px solid #FFFFFF'
                                                }}
                                            >
                                                {getInitials(student.fullName)}
                                            </Avatar>
                                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                                                <Typography sx={{ 
                                                    fontWeight: 700, 
                                                    color: '#111827', 
                                                    fontSize: '16px', 
                                                    lineHeight: 1.3,
                                                    mb: 0.5,
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}>
                                                    {student.fullName}
                                                </Typography>
                                                <Chip 
                                                    label={student.paymentType === 'subscription' ? 'Абонемент' : 'Поурочно'}
                                                    size="small"
                                                    sx={{ 
                                                        fontSize: '11px', 
                                                        height: 22, 
                                                        fontWeight: 700,
                                                        letterSpacing: '0.3px',
                                                        bgcolor: student.paymentType === 'subscription' ? '#ECFDF5' : '#EFF6FF',
                                                        color: student.paymentType === 'subscription' ? '#065F46' : '#1E40AF',
                                                    }}
                                                />
                                            </Box>
                                        </Box>

                                        <Divider sx={{ my: 2, borderColor: '#F3F4F6' }} />

                                        {/* Основная информация (Сетка) */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {/* Ставка */}
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#6B7280' }}>
                                                    <AttachMoney sx={{ fontSize: 18 }} />
                                                    <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>Ставка</Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography sx={{ fontWeight: 800, color: '#111827', fontSize: '18px' }}>
                                                        {rate || '—'} ₽
                                                    </Typography>
                                                    {student.discount > 0 && (
                                                        <Typography sx={{ fontSize: '11px', color: '#F59E0B', fontWeight: 700 }}>
                                                            Скидка {student.discount}%
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>

                                            {/* Ближайший урок */}
                                            {next && (
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    gap: 1.5, 
                                                    p: 1.5,
                                                    bgcolor: '#F9FAFB',
                                                    borderRadius: '12px',
                                                    border: '1px solid #F3F4F6'
                                                }}>
                                                    <Box sx={{ bgcolor: '#EEF2FF', p: 1, borderRadius: '8px' }}>
                                                        <CalendarIcon sx={{ fontSize: 18, color: '#4F46E5' }} />
                                                    </Box>
                                                    <Box>
                                                        <Typography sx={{ fontSize: '11px', color: '#6B7280', fontWeight: 500, mb: 0.2 }}>
                                                            Ближайший урок
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '13px', color: '#111827', fontWeight: 700 }}>
                                                            {format(new Date(next.lessonDate), 'd MMMM', { locale: ru })} в {next.startTime?.slice(0, 5)}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}

                                            {/* Прогресс абонемента */}
                                            {sub && (
                                                <Box sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                                                        <Typography sx={{ fontSize: '12px', color: '#6B7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            <RepeatIcon sx={{ fontSize: 14 }} /> Абонемент
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#4F46E5' }}>
                                                            {sub.used} / {sub.total}
                                                        </Typography>
                                                    </Box>
                                                    <MiniProgress>
                                                        <MiniProgressFill 
                                                            width={sub.percent} 
                                                            color={sub.percent > 80 ? '#EF4444' : '#4F46E5'} 
                                                        />
                                                    </MiniProgress>
                                                    {sub.debt > 0 && (
                                                        <Typography sx={{ fontSize: '11px', color: '#EF4444', fontWeight: 700, mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            ⚠️ Долг: {sub.debt} занятий
                                                        </Typography>
                                                    )}
                                                </Box>
                                            )}

                                            {/* Родитель */}
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1,
                                                p: 1,
                                                borderRadius: '8px',
                                                bgcolor: student.parent ? '#ECFDF5' : '#F9FAFB',
                                            }}>
                                                {student.parent ? (
                                                    <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                                                ) : (
                                                    <ParentIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                                                )}
                                                <Typography sx={{ 
                                                    fontSize: '12px', 
                                                    fontWeight: 600,
                                                    color: student.parent ? '#065F46' : '#6B7280'
                                                }}>
                                                    {student.parent ? `Родитель: ${student.parent.fullName || student.parent.email}` : 'Без привязки к родителю'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </CardContent>

                                    {/* Футер карточки с действиями */}
                                    <CardFooter>
                                        <Button 
                                            fullWidth 
                                            variant="outlined"
                                            startIcon={<TrendingUp />}
                                            onClick={() => navigate(`/student-progress/${student.id}`)}
                                            sx={{ 
                                                borderRadius: '10px', 
                                                borderColor: '#E0E7FF', 
                                                color: '#4F46E5',
                                                fontWeight: 600,
                                                fontSize: '13px',
                                                py: 1,
                                                '&:hover': {
                                                    bgcolor: '#EEF2FF',
                                                    borderColor: '#C7D2FE'
                                                }
                                            }}
                                        >
                                            Успеваемость
                                        </Button>
                                    </CardFooter>
                                </StudentCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== МЕНЮ ДЕЙСТВИЙ КАРТОЧКИ ========== */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    sx: { borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: 180, mt: 0.5 }
                }}
            >
                <MenuItem onClick={() => { handleOpenDialog(filteredStudents.find(s => s.id === activeStudentId)); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.5 }}>
                    <Edit sx={{ fontSize: 18, color: '#6B7280' }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Редактировать</Typography>
                </MenuItem>
                {tabValue === 0 ? (
                    <MenuItem onClick={() => { handleArchive(activeStudentId, filteredStudents.find(s => s.id === activeStudentId)?.fullName); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.5, color: '#D97706' }}>
                        <ArchiveIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>В архив</Typography>
                    </MenuItem>
                ) : (
                    <MenuItem onClick={() => { handleUnarchive(activeStudentId, filteredStudents.find(s => s.id === activeStudentId)?.fullName); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.5, color: '#059669' }}>
                        <UnarchiveIcon sx={{ fontSize: 18 }} />
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Восстановить</Typography>
                    </MenuItem>
                )}
                <Divider />
                <MenuItem onClick={() => { handleDelete(activeStudentId); handleMenuClose(); }} sx={{ gap: 1.5, py: 1.5, color: '#EF4444' }}>
                    <Delete sx={{ fontSize: 18 }} />
                    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>Удалить</Typography>
                </MenuItem>
            </Menu>

            {/* ========== ДИАЛОГ ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ========== */}
            <StyledDialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '22px', fontWeight: 700, color: '#111827', px: 4, pt: 4, pb: 1 }}>
                    {editingStudent ? 'Редактировать ученика' : 'Новый ученик'}
                </DialogTitle>
                <DialogContent sx={{ px: 4, py: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                        <TextField 
                            fullWidth 
                            label="ФИО ученика" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                            required 
                            autoFocus 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
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
                            helperText="На этот email придут данные для входа"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField 
                                fullWidth 
                                label="Ставка за урок (₽)" 
                                name="ratePerLesson" 
                                type="number" 
                                value={formData.ratePerLesson} 
                                onChange={handleInputChange} 
                                required 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                            <TextField 
                                fullWidth 
                                label="Скидка (%)" 
                                name="discount" 
                                type="number" 
                                value={formData.discount || 0} 
                                onChange={handleInputChange}
                                inputProps={{ min: 0, max: 100 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                            />
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Тип оплаты</InputLabel>
                            <Select 
                                name="paymentType" 
                                value={formData.paymentType} 
                                onChange={handleInputChange} 
                                label="Тип оплаты"
                                sx={{ borderRadius: '12px' }}
                            >
                                <MenuItem value="single">Поурочно</MenuItem>
                                <MenuItem value="subscription">Абонемент</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField 
                            fullWidth 
                            label="Email родителя (необязательно)" 
                            name="parentEmail" 
                            type="email" 
                            value={formData.parentEmail || ''} 
                            onChange={handleInputChange} 
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }}
                        />
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    checked={formData.selfPaid || false} 
                                    onChange={(e) => setFormData({ ...formData, selfPaid: e.target.checked })} 
                                    sx={{ '&.Mui-checked': { color: '#4F46E5' } }}
                                />
                            } 
                            label={<Typography sx={{ fontSize: '14px', color: '#374151' }}>Ученик оплачивает занятия самостоятельно</Typography>} 
                        />
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
                    <Button onClick={handleCloseDialog} sx={{ color: '#6B7280', fontWeight: 600, px: 3, py: 1.2, borderRadius: '10px' }}>
                        Отмена
                    </Button>
                    <Button 
                        variant="contained" 
                        onClick={handleSubmit} 
                        disabled={!formData.fullName || !formData.email || !formData.ratePerLesson || submitting}
                        sx={{ 
                            bgcolor: '#4F46E5', 
                            fontWeight: 600,
                            px: 4, 
                            py: 1.2, 
                            borderRadius: '10px',
                            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
                            '&:hover': { bgcolor: '#4338CA' },
                            '&.Mui-disabled': { bgcolor: '#C7D2FE' }
                        }}
                    >
                        {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : (editingStudent ? 'Сохранить' : 'Добавить')}
                    </Button>
                </DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ СУЩЕСТВУЮЩЕГО УЧЕНИКА ========== */}
            <StyledDialog open={showExistingDialog} onClose={() => setShowExistingDialog(false)}>
                <DialogTitle sx={{ fontSize: '20px', fontWeight: 700, color: '#111827', px: 4, pt: 4 }}>
                    Ученик уже существует
                </DialogTitle>
                <DialogContent sx={{ px: 4, py: 2 }}>
                    <Typography sx={{ mb: 2, fontSize: '15px', color: '#374151' }}>
                        В системе уже есть ученик с таким email:
                    </Typography>
                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#111827', mb: 0.5 }}>
                            {existingStudent?.fullName}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            {existingStudent?.email}
                        </Typography>
                    </Paper>
                    <Typography sx={{ mt: 2, fontSize: '14px', color: '#6B7280' }}>
                        Хотите привязать его к себе как куратору?
                    </Typography >
                </DialogContent>
                <DialogActions sx={{ px: 4, pb: 4, pt: 1 }}>
                    <Button onClick={() => setShowExistingDialog(false)} sx={{ color: '#6B7280', fontWeight: 600, px: 3, py: 1.2, borderRadius: '10px' }}>
                        Ввести новые данные
                    </Button>
                    <Button 
                        onClick={handleUseExistingStudent} 
                        variant="contained" 
                        sx={{ 
                            bgcolor: '#4F46E5', 
                            fontWeight: 600,
                            px: 4, 
                            py: 1.2, 
                            borderRadius: '10px',
                            '&:hover': { bgcolor: '#4338CA' } 
                        }}
                    >
                        Привязать существующего
                    </Button>
                </DialogActions>
            </StyledDialog>

            {/* ========== SNACKBAR ========== */}
            <Snackbar 
                open={snackbar.open} 
                autoHideDuration={4000} 
                onClose={() => setSnackbar({ ...snackbar, open: false })} 
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert 
                    severity={snackbar.severity} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    sx={{ borderRadius: '12px', fontSize: '14px', fontWeight: 500, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Students;