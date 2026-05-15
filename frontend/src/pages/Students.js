// ========== frontend/src/pages/Students.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect } from 'react';
import axiosInstance, { getAllLessons } from '../services/api';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Paper, IconButton, Alert, Snackbar,
    Chip, Typography, Tabs, Tab,
    FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Avatar, Tooltip, InputAdornment,
    Card, CardContent, Grid,
    Badge, Divider, LinearProgress, CardActions,
    Collapse, Checkbox, FormControlLabel, Stack
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    Add, Edit, Delete, PersonAdd, Search, 
    Phone, Email, 
    CheckCircle, Cake, Schedule,
    ExpandMore, ExpandLess, TrendingUp,
    Warning as WarningIcon,
    AttachMoney,
    Link as LinkIcon,
    Archive as ArchiveIcon,
    Unarchive as UnarchiveIcon,
    People as PeopleIcon,
    Repeat as RepeatIcon,
    AccessTime as ClockIcon,
    PersonOutline as ParentIcon,
    CalendarMonth as CalendarIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const StudentCard = styled(Card)({
    borderRadius: '12px',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    position: 'relative',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
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

const SubscriptionProgress = styled(Box)({
    marginBottom: '12px',
});

const ProgressBar = styled(Box)({
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '6px',
});



const ProgressFill = styled(Box)(({ width }) => ({
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: '3px',
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

// ========== MINIBOARD (БЕЗ ИЗМЕНЕНИЙ) ==========
function MiniBoard({ studentId, tutorId, expanded }) {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    useEffect(() => { if (expanded) { setLoading(true); fetchNotes(); } }, [expanded, studentId, tutorId]);

    const fetchNotes = async () => {
        try { const r = await axiosInstance.get(`/board/${studentId}/${tutorId}`); setNotes(JSON.parse(r.data.notes || '[]')); }
        catch (err) { setNotes([]); } finally { setLoading(false); }
    };

    const saveNotes = async (u) => { setNotes(u); try { await axiosInstance.put(`/board/${studentId}/${tutorId}`, { notes: JSON.stringify(u) }); } catch (err) {} };
    const handleSave = () => { if (!editText.trim()) return; saveNotes(notes.map(n => n.id === editingId ? { ...n, text: editText } : n)); setEditingId(null); setEditText(''); };
    const handleDelete = (id) => { if (window.confirm('Удалить?')) saveNotes(notes.filter(n => n.id !== id)); };

    if (loading) return <CircularProgress size={16} />;
    if (!notes.length) return <Typography variant="caption" sx={{ color: '#9CA3AF' }}>Нет заметок</Typography>;

    return (
        <Stack spacing={1}>
            {notes.map(n => (
                <Paper key={n.id} sx={{ p: 1.5, bgcolor: n.color || '#FFF9C4', borderRadius: '8px' }}>
                    {editingId === n.id ? (
                        <Box onClick={(e) => e.stopPropagation()}>
                            <TextField fullWidth multiline size="small" value={editText} onChange={(e) => setEditText(e.target.value)} autoFocus />
                            <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end', mt: 0.5 }}>
                                <Button size="small" onClick={() => { setEditingId(null); setEditText(''); }}>Отмена</Button>
                                <Button size="small" variant="contained" onClick={handleSave}>Сохранить</Button>
                            </Box>
                        </Box>
                    ) : (
                        <Box onClick={(e) => e.stopPropagation()}>
                            <Typography variant="caption" sx={{ whiteSpace: 'pre-wrap', cursor: 'pointer', fontSize: '13px', color: '#374151' }} onClick={() => { setEditingId(n.id); setEditText(n.text); }}>{n.text}</Typography>
                            <Box sx={{ display: 'flex', gap: 0.3, justifyContent: 'flex-end', mt: 0.5 }}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); setEditingId(n.id); setEditText(n.text); }}><Edit sx={{ fontSize: 14 }} /></IconButton>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}><Delete sx={{ fontSize: 14, color: '#EF4444' }} /></IconButton>
                            </Box>
                        </Box>
                    )}
                </Paper>
            ))}
        </Stack>
    );
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
    const handleOpenDialog = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({ fullName: student.fullName, email: student.email || '', ratePerLesson: getStudentRate(student) || '', paymentType: student.paymentType || 'single', parentEmail: student.parent?.email || '', selfPaid: student.selfPaid || false, tutorId: user.id });
        } else {
            setEditingStudent(null);
            setFormData({ fullName: '', email: '', ratePerLesson: '', paymentType: 'single', parentEmail: '', selfPaid: false, tutorId: user.id });
            setExistingStudent(null);
        }
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
            if (sortBy === 'name') {
                return (a.fullName || '').localeCompare(b.fullName || '');
            }
            return (b.id || 0) - (a.id || 0); // по ID (новые сверху)
        });
    const upcomingBirthdays = getUpcomingBirthdays();

    const statCards = [
        { v: stats.total, l: 'Всего учеников', icon: <PeopleIcon sx={{ fontSize: 22, color: '#4F46E5' }} />, bg: '#EEF2FF' },
        { v: stats.subscription, l: 'Абонемент', icon: <RepeatIcon sx={{ fontSize: 22, color: '#10B981' }} />, bg: '#ECFDF5' },
        { v: stats.single, l: 'Поурочно', icon: <ClockIcon sx={{ fontSize: 22, color: '#3B82F6' }} />, bg: '#EFF6FF' },
        { v: stats.withParent, l: 'С родителем', icon: <ParentIcon sx={{ fontSize: 22, color: '#7C3AED' }} />, bg: '#F5F3FF' },
    ];

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                Мои ученики
            </Typography>
            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                Управление списком учеников и их данными
            </Typography>

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

            {/* ========== СТАТИСТИКА ========== */}
            {tabValue === 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {statCards.map((s, i) => (
                        <Grid item xs={6} sm={3} key={i}>
                            <StatCard>
                                <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2, '&:last-child': { pb: 2.5 } }}>
                                    <Box sx={{ 
                                        width: 44, height: 44, 
                                        borderRadius: '10px', 
                                        backgroundColor: s.bg, 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        flexShrink: 0,
                                    }}>
                                        {s.icon}
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                                            {s.v}
                                        </Typography>
                                        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                            {s.l}
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </StatCard>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* ========== ПОИСК + ФИЛЬТРЫ + КНОПКА ========== */}
            <Box data-tour="student-filters" sx={{ 
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
                            borderRadius: '8px', 
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
                <Box sx={{ display: 'flex', gap: 1 }}>
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
                {tabValue === 0 && (
                    <>
                        <StyledButton 
                            data-tour="add-student-btn"
                            variant="contained" 
                            startIcon={<Add sx={{ fontSize: 18 }} />} 
                            onClick={() => handleOpenDialog()}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                        >
                            Добавить ученика
                        </StyledButton>
                        <StyledButton 
                            variant="outlined" 
                            startIcon={<LinkIcon />}
                            onClick={handleGenerateInviteLink}
                            sx={{ color: '#4F46E5', borderColor: '#C7D2FE' }}
                        >
                            Пригласить по ссылке
                        </StyledButton>
                    </>
                )}
            </Box>

            {/* ========== КОНТЕНТ ========== */}
            {error ? (
                <Alert severity="error" sx={{ borderRadius: '12px', mb: 3 }}>{error}</Alert>
            ) : filteredStudents.length === 0 ? (
                <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <PersonAdd sx={{ fontSize: 40, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            {tabValue === 0 ? (searchTerm ? 'Ничего не найдено' : 'У вас пока нет учеников') : 'Архив пуст'}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                            {tabValue === 0 && !searchTerm ? 'Добавьте первого ученика, чтобы начать работу' : 'Попробуйте изменить параметры поиска'}
                        </Typography>
                        {!searchTerm && tabValue === 0 && (
                            <StyledButton 
                                variant="contained" 
                                startIcon={<Add />} 
                                onClick={() => handleOpenDialog()}
                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                            >
                                Добавить ученика
                            </StyledButton>
                        )}
                    </EmptyStateContainer>
                </Paper>
            ) : (
                <Grid container spacing={2}>
                    {filteredStudents.map((student, index) => {
                        const st = getStudentStats(student.email);
                        const next = getNextLesson(student.email);
                        const birthday = getBirthdayText(student.birthday);
                        const sub = getSubscriptionProgress(student.id);
                        const isExp = expandedId === student.id;
                        const rate = getStudentRate(student);
                        const avatarColor = getAvatarColor(student.fullName);

                        return (
                            <Grid item xs={12} sm={6} lg={4} key={student.id} data-tour={index === 0 ? "student-card" : undefined}>
                                <StudentCard>
                                    {/* Бейдж дня рождения */}
                                    {birthday && (
                                        <Box sx={{ 
                                            position: 'absolute', 
                                            top: -10, 
                                            right: 16, 
                                            bgcolor: '#D97706', 
                                            color: '#FFFFFF', 
                                            px: 1.5, 
                                            py: 0.5, 
                                            borderRadius: '8px', 
                                            fontSize: '11px', 
                                            fontWeight: 600, 
                                            zIndex: 2 
                                        }}>
                                            {birthday}
                                        </Box>
                                    )}
                                    
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        {/* Шапка: аватар + имя + тип оплаты */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <Avatar 
                                                sx={{ 
                                                    width: 44, height: 44, 
                                                    bgcolor: avatarColor, 
                                                    fontSize: 18, 
                                                    fontWeight: 600, 
                                                    flexShrink: 0 
                                                }}
                                            >
                                                {getInitials(student.fullName)}
                                            </Avatar>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 500, color: '#1F2937', fontSize: '16px', lineHeight: 1.3 }}>
                                                    {student.fullName}
                                                </Typography>
                                                <Typography sx={{ color: '#9CA3AF', fontSize: '12px' }}>
                                                    ID: {student.id}
                                                </Typography>
                                            </Box>
                                            {student.parent && (
                                                <Tooltip title="Родитель подключён">
                                                    <CheckCircle sx={{ fontSize: 16, color: '#10B981' }} />
                                                </Tooltip>
                                            )}
                                        </Box>

                                        {/* Информация */}
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                                                    {next ? `${format(new Date(next.lessonDate), 'd MMM', { locale: ru })} в ${next.startTime?.slice(0, 5)}` : 'Нет занятий'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <AttachMoney sx={{ fontSize: 14, color: student.discount > 0 ? '#F59E0B' : '#10B981' }} />
                                                <Typography sx={{ fontWeight: 600, color: student.discount > 0 ? '#F59E0B' : '#10B981', fontSize: '16px' }}>
                                                    {rate || '—'} ₽/занятие
                                                    {student.discount > 0 && (
                                                        <Typography component="span" sx={{ fontSize: '12px', color: '#9CA3AF', ml: 0.5 }}>
                                                            (-{student.discount}%)
                                                        </Typography>
                                                    )}
                                                </Typography>
                                            </Box>
                                        </Box>

                                        {/* Прогресс абонемента */}
                                        {sub && (
                                            <SubscriptionProgress>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography sx={{ color: '#6B7280', fontWeight: 500, fontSize: '12px' }}>
                                                        Абонемент
                                                    </Typography>
                                                    <Typography sx={{ color: '#1F2937', fontWeight: 600, fontSize: '12px' }}>
                                                        {sub.used}/{sub.total}
                                                    </Typography>
                                                </Box>
                                                <ProgressBar>
                                                    <ProgressFill width={sub.percent} />
                                                </ProgressBar>
                                            </SubscriptionProgress>
                                        )}

                                        {/* Статистика */}
                                        {tabValue === 0 && (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Chip 
                                                    label={`${st.total} занятий`} 
                                                    size="small" 
                                                    sx={{ 
                                                        bgcolor: '#EEF2FF', 
                                                        color: '#4F46E5', 
                                                        fontWeight: 500, 
                                                        fontSize: '11px',
                                                        borderRadius: '100px',
                                                        height: 24,
                                                    }} 
                                                />
                                                <Chip 
                                                    label={`${st.completed} проведено`} 
                                                    size="small" 
                                                    sx={{ 
                                                        bgcolor: '#ECFDF5', 
                                                        color: '#065F46', 
                                                        fontWeight: 500, 
                                                        fontSize: '11px',
                                                        borderRadius: '100px',
                                                        height: 24,
                                                    }} 
                                                />
                                            </Box>
                                        )}
                                    </CardContent>

                                    <Divider sx={{ borderColor: '#F3F4F6' }} />
                                    
                                    <CardActions sx={{ px: 2, py: 1, justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            {tabValue === 0 ? (
                                                <>
                                                    <Tooltip title="Редактировать">
                                                        <IconButton size="small" onClick={() => handleOpenDialog(student)}>
                                                            <Edit sx={{ fontSize: 16, color: '#6B7280' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Удалить">
                                                        <IconButton size="small" onClick={() => handleDelete(student.id)}>
                                                            <Delete sx={{ fontSize: 16, color: '#EF4444' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Успеваемость">
                                                        <IconButton size="small" onClick={() => navigate(`/student-progress/${student.id}`)}>
                                                            <TrendingUp sx={{ fontSize: 16, color: '#4F46E5' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Архивировать">
                                                        <IconButton size="small" onClick={() => handleArchive(student.id, student.fullName)}>
                                                            <ArchiveIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            ) : (
                                                <>
                                                    <Tooltip title="Восстановить">
                                                        <IconButton size="small" onClick={() => handleUnarchive(student.id, student.fullName)}>
                                                            <UnarchiveIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Удалить">
                                                        <IconButton size="small" onClick={() => handleDelete(student.id)}>
                                                            <Delete sx={{ fontSize: 16, color: '#EF4444' }} />
                                                        </IconButton>
                                                    </Tooltip>
                                                </>
                                            )}
                                        </Box>
                                        <Button 
                                            size="small" 
                                            onClick={() => handleExpandClick(student.id)} 
                                            endIcon={isExp ? <ExpandLess /> : <ExpandMore />}
                                            sx={{ 
                                                color: '#4F46E5', 
                                                textTransform: 'none', 
                                                fontWeight: 500, 
                                                fontSize: '13px',
                                                '&:hover': { backgroundColor: '#EEF2FF' },
                                            }}
                                        >
                                            Подробнее
                                        </Button>
                                    </CardActions>

                                    <Collapse in={isExp} timeout="auto" unmountOnExit>
                                        <CardContent sx={{ bgcolor: '#F9FAFB', pt: 0, px: 2.5, pb: 2 }}>
                                            <Typography sx={{ fontWeight: 600, color: '#374151', mb: 1, fontSize: '14px' }}>
                                                О родителе
                                            </Typography>
                                            {student.parent ? (
                                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                                    <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                        <strong>Имя:</strong> {student.parent.fullName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                        <strong>Email:</strong> {student.parent.email}
                                                    </Typography>
                                                    {student.parent.phone && (
                                                        <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                            <strong>Тел:</strong> {student.parent.phone}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography sx={{ fontSize: '14px', color: '#9CA3AF' }}>
                                                    Не привязан
                                                </Typography>
                                            )}
                                            {student.birthday && (
                                                <>
                                                    <Divider sx={{ my: 1.5, borderColor: '#E5E7EB' }} />
                                                    <Typography sx={{ fontWeight: 600, color: '#374151', mb: 0.5, fontSize: '14px' }}>
                                                        День рождения
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                        {new Date(student.birthday).toLocaleDateString('ru-RU')}
                                                    </Typography>
                                                </>
                                            )}
                                            <Divider sx={{ my: 1.5, borderColor: '#E5E7EB' }} />
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                <Typography sx={{ fontWeight: 600, color: '#374151', fontSize: '14px' }}>
                                                    📌 Заметки
                                                </Typography>
                                                <Button 
                                                    size="small" 
                                                    variant="outlined" 
                                                    sx={{ 
                                                        fontSize: '12px', 
                                                        py: 0.3, 
                                                        px: 1, 
                                                        borderRadius: '8px', 
                                                        color: '#6B7280', 
                                                        borderColor: '#D1D5DB',
                                                        textTransform: 'none',
                                                        '&:hover': { backgroundColor: '#F9FAFB', borderColor: '#9CA3AF' },
                                                    }}
                                                    onClick={async (e) => {
                                                        e.stopPropagation();
                                                        try {
                                                            const res = await axiosInstance.get(`/board/${student.id}/${user.id}`);
                                                            const notes = JSON.parse(res.data.notes || '[]');
                                                            const updated = [...notes, { id: Date.now(), text: 'Новая заметка...', color: '#FFE0B2', width: 260, height: 100 }];
                                                            await axiosInstance.put(`/board/${student.id}/${user.id}`, { notes: JSON.stringify(updated) });
                                                            showSnackbar('Заметка добавлена', 'success');
                                                            setExpandedId(null); setTimeout(() => setExpandedId(student.id), 100);
                                                        } catch (err) { try {
                                                            await axiosInstance.put(`/board/${student.id}/${user.id}`, { notes: JSON.stringify([{ id: Date.now(), text: 'Новая заметка...', color: '#FFE0B2' }]) });
                                                            showSnackbar('Заметка добавлена', 'success');
                                                            setExpandedId(null); setTimeout(() => setExpandedId(student.id), 100);
                                                        } catch (e) {} }
                                                    }}
                                                >
                                                    + Заметка
                                                </Button>
                                            </Box>
                                            <MiniBoard studentId={student.id} tutorId={user.id} expanded={isExp} />
                                        </CardContent>
                                    </Collapse>
                                </StudentCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== ДИАЛОГ ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ========== */}
            <StyledDialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ 
                    fontSize: '18px', 
                    fontWeight: 600, 
                    color: '#1F2937',
                    px: 3,
                    pt: 3,
                    pb: 1,
                }}>
                    {editingStudent ? 'Редактировать' : 'Добавить ученика'}
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                },
                            }}
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                },
                            }}
                        />
                        <TextField 
                            fullWidth 
                            label="Ставка (₽)" 
                            name="ratePerLesson" 
                            type="number" 
                            value={formData.ratePerLesson} 
                            onChange={handleInputChange} 
                            required 
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                },
                            }}
                        />
                        <TextField 
                            fullWidth 
                            label="Скидка (%)" 
                            name="discount" 
                            type="number" 
                            value={formData.discount || 0} 
                            onChange={handleInputChange}
                            inputProps={{ min: 0, max: 100 }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                },
                            }}
                        />
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Тип оплаты</InputLabel>
                            <Select 
                                name="paymentType" 
                                value={formData.paymentType} 
                                onChange={handleInputChange} 
                                label="Тип оплаты"
                                sx={{
                                    borderRadius: '8px',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' },
                                }}
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
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                },
                            }}
                        />
                        <FormControlLabel 
                            control={
                                <Checkbox 
                                    checked={formData.selfPaid || false} 
                                    onChange={(e) => setFormData({ ...formData, selfPaid: e.target.checked })} 
                                    sx={{ color: '#4F46E5', '&.Mui-checked': { color: '#4F46E5' } }}
                                />
                            } 
                            label={<Typography sx={{ fontSize: '14px' }}>Самостоятельная оплата</Typography>} 
                        />
                        <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                            После сохранения ученик и родитель получат приглашения на email.
                        </Alert>
                        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                            <StyledButton 
                                fullWidth 
                                variant="outlined" 
                                onClick={handleCloseDialog}
                                sx={{ borderColor: '#D1D5DB', color: '#374151', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}
                            >
                                Отмена
                            </StyledButton>
                            <StyledButton 
                                fullWidth 
                                variant="contained" 
                                onClick={handleSubmit} 
                                disabled={!formData.fullName || !formData.email || !formData.ratePerLesson || submitting}
                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                            >
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
                    sx={{ borderRadius: '8px' }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Students;