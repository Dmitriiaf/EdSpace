// frontend/src/pages/Groups.js — v2 MODERN
import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/api';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActions,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    IconButton, Tooltip, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem,
    Avatar, AvatarGroup, Stack, Snackbar, List, ListItem,
    ListItemAvatar, ListItemText, ListItemSecondaryAction,
    Divider, Badge, LinearProgress
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Add, Edit, Delete, Search, Group as GroupIcon,
    School, Person, People, Close, CheckCircle,
    CalendarToday, AttachMoney, TrendingUp,
    PersonAdd, PersonRemove, Info
} from '@mui/icons-material';
import { PageContainer, StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';

// ========== СТИЛИ ==========
const GroupCard = styled(Card)({
    borderRadius: '20px',
    border: '1px solid #F3F4F6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'visible',
    '&:hover': {
        transform: 'translateY(-6px)',
        boxShadow: '0 16px 40px rgba(0,0,0,0.1)',
    },
});

const GradientBadge = styled(Box)(({ color }) => ({
    position: 'absolute',
    top: -10,
    right: 20,
    background: `linear-gradient(135deg, ${color}, ${alpha(color, 0.7)})`,
    color: '#fff',
    px: 2,
    py: 0.5,
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    zIndex: 2,
    boxShadow: `0 4px 12px ${alpha(color, 0.3)}`,
}));

const StatMini = styled(Box)({
    textAlign: 'center',
    padding: '12px 8px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    border: '1px solid #F3F4F6',
    flex: 1,
});

const StudentChip = styled(Chip)(({ selected }) => ({
    borderRadius: '10px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: selected ? '#EEF2FF' : '#F9FAFB',
    color: selected ? '#4F46E5' : '#6B7280',
    border: selected ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
    '&:hover': {
        backgroundColor: selected ? '#E0E7FF' : '#F3F4F6',
        transform: 'scale(1.03)',
    },
}));

const EmptyState = styled(Box)({
    textAlign: 'center',
    padding: '60px 20px',
});

// ========== КОМПОНЕНТ ==========
function Groups() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Группы'; }, []);

    const [groups, setGroups] = useState([]);
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    const [openDialog, setOpenDialog] = useState(false);
    const [editingGroup, setEditingGroup] = useState(null);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '', description: '', courseId: '', maxStudents: '', pricePerStudent: '', status: 'active', studentIds: []
    });
    const [studentSearch, setStudentSearch] = useState('');

    useEffect(() => { if (user?.id) fetchData(); }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [groupsRes, coursesRes, studentsRes] = await Promise.all([
                axiosInstance.get(`/groups/tutor/${user.id}`),
                axiosInstance.get(`/courses/tutor/${user.id}`),
                axiosInstance.get(`/students/tutor/${user.id}`)
            ]);
            setGroups(groupsRes.data || []);
            setCourses(coursesRes.data || []);
            setStudents(studentsRes.data || []);
        } catch (err) {
            setError('Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (group = null) => {
        if (group) {
            setEditingGroup(group);
            setFormData({
                name: group.name || '',
                description: group.description || '',
                courseId: group.course?.id || '',
                maxStudents: group.maxStudents || '',
                pricePerStudent: group.pricePerStudent || '',
                status: group.status || 'active',
                studentIds: group.students?.map(s => s.id) || []
            });
        } else {
            setEditingGroup(null);
            setFormData({ name: '', description: '', courseId: '', maxStudents: '', pricePerStudent: '', status: 'active', studentIds: [] });
        }
        setStudentSearch('');
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.courseId) {
            showSnackbar('Название и курс обязательны', 'error');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                name: formData.name,
                description: formData.description,
                courseId: parseInt(formData.courseId),
                maxStudents: formData.maxStudents || null,
                pricePerStudent: formData.pricePerStudent || null,
                status: formData.status,
                studentIds: formData.studentIds
            };
            if (editingGroup) {
                await axiosInstance.put(`/groups/${editingGroup.id}`, payload);
                showSnackbar('Группа обновлена', 'success');
            } else {
                await axiosInstance.post('/groups', payload);
                showSnackbar('Группа создана', 'success');
            }
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (group) => {
        const count = group.students?.length || 0;
        const msg = count > 0 
            ? `Удалить группу «${group.name}»?\n\n${count} учеников будут исключены из группы.`
            : `Удалить группу «${group.name}»?`;
        
        if (!window.confirm(msg)) return;
        try {
            if (count > 0) {
                for (const s of group.students) {
                    await axiosInstance.patch(`/groups/${group.id}/remove-student/${s.id}`);
                }
            }
            await axiosInstance.delete(`/groups/${group.id}`);
            showSnackbar('Группа удалена', 'success');
            fetchData();
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка удаления', 'error');
        }
    };

    const handleCancelGroup = async (group) => {
        if (!window.confirm(`Отменить ВСЕ будущие уроки группы «${group.name}»?\n\nЭто действие нельзя отменить.`)) return;
        try {
            const res = await axiosInstance.post(`/groups/${group.id}/cancel-lessons`);
            showSnackbar(res.data?.message || `✅ Уроки группы «${group.name}» отменены`, 'success');
            fetchData();
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка', 'error');
        }
    };

    const handleRemoveAllStudents = async () => {
        if (!editingGroup) return;
        const count = editingGroup.students?.length || 0;
        if (!window.confirm(`Удалить всех ${count} учеников из группы?`)) return;
        try {
            for (const s of editingGroup.students) {
                await axiosInstance.patch(`/groups/${editingGroup.id}/remove-student/${s.id}`);
            }
            fetchData();
            setOpenDialog(false);
            showSnackbar('Ученики удалены', 'success');
        } catch (err) {
            showSnackbar('Ошибка', 'error');
        }
    };

    const toggleStudent = (id) => {
        setFormData(prev => ({
            ...prev,
            studentIds: prev.studentIds.includes(id)
                ? prev.studentIds.filter(sid => sid !== id)
                : [...prev.studentIds, id]
        }));
    };

    const showSnackbar = (msg, sev) => setSnackbar({ open: true, message: msg, severity: sev });

    const filteredGroups = groups.filter(g =>
        g.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredStudents = students.filter(s =>
        s.fullName?.toLowerCase().includes(studentSearch.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'active': return '#10B981';
            case 'finished': return '#F59E0B';
            case 'archived': return '#6B7280';
            default: return '#9CA3AF';
        }
    };

    const getStatusLabel = (status) => {
        switch(status) {
            case 'active': return 'Активна';
            case 'finished': return 'Завершена';
            case 'archived': return 'Архив';
            default: return status;
        }
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ 
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                mb: 4, flexWrap: 'wrap', gap: 2 
            }}>
                <Box>
                    <Box data-tour="groups-page">
                        <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
                            Учебные группы
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            {groups.length} групп
                        </Typography>
                        <Chip 
                            icon={<People sx={{ fontSize: 14 }} />}
                            label={`${groups.reduce((sum, g) => sum + (g.students?.length || 0), 0)} учеников`}
                            size="small"
                            sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 500, borderRadius: '8px' }}
                        />
                        <Chip 
                            icon={<CheckCircle sx={{ fontSize: 14 }} />}
                            label={`${groups.filter(g => g.status === 'active').length} активных`}
                            size="small"
                            sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 500, borderRadius: '8px' }}
                        />
                    </Box>
                </Box>
                <StyledButton variant="contained" data-tour="groups-add-btn" startIcon={<Add />} onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: '#4F46E5', borderRadius: '14px', px: 3, py: 1.5, '&:hover': { bgcolor: '#4338CA' } }}>
                    Создать группу
                </StyledButton>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '14px' }}>{error}</Alert>}

            {/* ========== ПОИСК ========== */}
            <TextField
                placeholder="Поиск групп..."
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ mb: 3, width: 300 }}
                InputProps={{
                    startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                    endAdornment: searchTerm && (
                        <InputAdornment position="end">
                            <IconButton size="small" onClick={() => setSearchTerm('')}><Close sx={{ fontSize: 16 }} /></IconButton>
                        </InputAdornment>
                    ),
                }}
            />

            {/* ========== СПИСОК ГРУПП ========== */}
            {filteredGroups.length === 0 ? (
                <Paper sx={{ borderRadius: '20px', border: '2px dashed #E5E7EB', bgcolor: '#F9FAFB' }}>
                    <EmptyState>
                        <GroupIcon sx={{ fontSize: 72, color: '#D1D5DB', mb: 2 }} />
                        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#6B7280', mb: 1 }}>
                            Нет групп
                        </Typography>
                        <Typography sx={{ color: '#9CA3AF', mb: 3, maxWidth: 400, mx: 'auto' }}>
                            Создайте группу для совместных занятий. Объедините учеников по курсу, уровню подготовки или расписанию.
                        </Typography>
                        <StyledButton variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
                            sx={{ bgcolor: '#4F46E5', borderRadius: '14px' }}>
                            Создать первую группу
                        </StyledButton>
                    </EmptyState>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {filteredGroups.map(group => {
                        const statusColor = getStatusColor(group.status);
                        const studentCount = group.students?.length || 0;
                        const maxStudents = group.maxStudents;
                        const occupancyPercent = maxStudents ? (studentCount / maxStudents) * 100 : 0;
                        
                        return (
                            <Grid item xs={12} sm={6} md={4} key={group.id}>
                                <GroupCard sx={{ position: 'relative' }}>
                                    {/* Бейдж статуса */}
                                    <GradientBadge color={statusColor}>
                                        {getStatusLabel(group.status)}
                                    </GradientBadge>

                                    <CardContent sx={{ p: 3, pt: 2.5 }}>
                                        {/* Название и курс */}
                                        <Box sx={{ mb: 2 }}>
                                            <Typography sx={{ fontWeight: 700, fontSize: '17px', color: '#1F2937', mb: 0.5 }}>
                                                {group.name}
                                            </Typography>
                                            {group.course && (
                                                <Chip 
                                                    icon={<School sx={{ fontSize: 14 }} />} 
                                                    label={group.course.name}
                                                    size="small"
                                                    sx={{ bgcolor: '#F5F3FF', color: '#7C3AED', fontWeight: 500, borderRadius: '8px' }}
                                                />
                                            )}
                                        </Box>

                                        {group.description && (
                                            <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 2, lineHeight: 1.5 }}>
                                                {group.description}
                                            </Typography>
                                        )}

                                        {/* Статистика */}
                                        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                            <StatMini>
                                                <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#4F46E5' }}>
                                                    {studentCount}
                                                </Typography>
                                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                    {maxStudents ? `из ${maxStudents}` : 'учеников'}
                                                </Typography>
                                            </StatMini>
                                            {group.pricePerStudent > 0 && (
                                                <StatMini>
                                                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
                                                        {group.pricePerStudent}₽
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                        за урок
                                                    </Typography>
                                                </StatMini>
                                            )}
                                            <StatMini>
                                                <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B' }}>
                                                    {group.pricePerStudent > 0 && studentCount > 0 
                                                        ? `${(group.pricePerStudent * studentCount).toLocaleString()}₽`
                                                        : '—'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                    общий сбор
                                                </Typography>
                                            </StatMini>
                                        </Box>

                                        {/* Прогресс заполнения */}
                                        {maxStudents > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                    <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                        Заполненность
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#4F46E5' }}>
                                                        {Math.round(occupancyPercent)}%
                                                    </Typography>
                                                </Box>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={occupancyPercent} 
                                                    sx={{ 
                                                        borderRadius: 4, height: 6, bgcolor: '#E5E7EB',
                                                        '& .MuiLinearProgress-bar': { bgcolor: '#4F46E5', borderRadius: 4 }
                                                    }} 
                                                />
                                            </Box>
                                        )}

                                        {/* Аватарки учеников */}
                                        {studentCount > 0 && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <AvatarGroup max={6} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 13 } }}>
                                                    {group.students.map(s => (
                                                        <Tooltip key={s.id} title={s.fullName}>
                                                            <Avatar sx={{ bgcolor: '#4F46E5' }}>
                                                                {s.fullName?.[0]}
                                                            </Avatar>
                                                        </Tooltip>
                                                    ))}
                                                </AvatarGroup>
                                                {studentCount > 6 && (
                                                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                                                        +{studentCount - 6}
                                                    </Typography>
                                                )}
                                            </Box>
                                        )}
                                    </CardContent>

                                    <Divider sx={{ borderColor: '#F3F4F6' }} />

                                    <CardActions sx={{ px: 2, py: 1.5, justifyContent: 'space-between', flexWrap: 'wrap', gap: 0.5 }}>
                                        <Chip 
                                            icon={<CalendarToday sx={{ fontSize: 14 }} />}
                                            label={studentCount > 0 ? 'Можно создать урок' : 'Добавьте учеников'}
                                            size="small"
                                            sx={{ 
                                                bgcolor: studentCount > 0 ? '#ECFDF5' : '#FFFBEB',
                                                color: studentCount > 0 ? '#065F46' : '#92400E',
                                                fontWeight: 500, borderRadius: '8px', fontSize: '11px'
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                            {group.status === 'active' && studentCount > 0 && (
                                                <Tooltip title="Завершить все уроки группы">
                                                    <Button
                                                        size="small"
                                                        color="warning"
                                                        variant="outlined"
                                                        onClick={() => handleCancelGroup(group)}
                                                        sx={{ 
                                                            textTransform: 'none', fontSize: '11px', borderRadius: '8px',
                                                            borderColor: '#F59E0B', color: '#92400E',
                                                            '&:hover': { bgcolor: '#FFFBEB', borderColor: '#D97706' }
                                                        }}
                                                    >
                                                        Отменить уроки
                                                    </Button>
                                                </Tooltip>
                                            )}
                                            <Tooltip title="Редактировать">
                                                <IconButton size="small" onClick={() => handleOpenDialog(group)}>
                                                    <Edit sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" onClick={() => handleDelete(group)} sx={{ color: '#EF4444' }}>
                                                    <Delete sx={{ fontSize: 17 }} />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </CardActions>
                                </GroupCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== ДИАЛОГ СОЗДАНИЯ/РЕДАКТИРОВАНИЯ ========== */}
            <Dialog 
                open={openDialog} 
                onClose={() => setOpenDialog(false)} 
                maxWidth="md" 
                fullWidth
                PaperProps={{ sx: { borderRadius: '24px', overflow: 'hidden' } }}
            >
                {/* Шапка */}
                <Box sx={{ 
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    p: 3, color: '#fff'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                            width: 44, height: 44, borderRadius: '14px', 
                            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <GroupIcon sx={{ color: '#fff' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '22px', fontWeight: 700 }}>
                                {editingGroup ? 'Редактировать группу' : 'Новая группа'}
                            </Typography>
                            <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>
                                {editingGroup 
                                    ? `«${editingGroup.name}» · ${editingGroup.students?.length || 0} учеников`
                                    : 'Объедините учеников для совместных занятий'}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <DialogContent sx={{ p: 3 }}>
                    <Grid container spacing={3}>
                        {/* Левая колонка — основные поля */}
                        <Grid item xs={12} md={7}>
                            <Stack spacing={2.5}>
                                <TextField 
                                    fullWidth 
                                    label="Название группы" 
                                    value={formData.name}
                                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                                    required
                                    placeholder="Например: ЕГЭ Информатика группа 1"
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F9FAFB' } }}
                                />
                                
                                <TextField 
                                    fullWidth 
                                    label="Описание" 
                                    multiline 
                                    rows={2} 
                                    value={formData.description}
                                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                                    placeholder="Уровень подготовки, особенности группы..."
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F9FAFB' } }}
                                />

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth required>
                                            <InputLabel>Курс</InputLabel>
                                            <Select 
                                                value={formData.courseId} 
                                                onChange={(e) => setFormData({...formData, courseId: e.target.value})} 
                                                label="Курс"
                                                sx={{ borderRadius: '12px', bgcolor: '#F9FAFB' }}
                                            >
                                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <FormControl fullWidth>
                                            <InputLabel>Статус</InputLabel>
                                            <Select 
                                                value={formData.status} 
                                                onChange={(e) => setFormData({...formData, status: e.target.value})} 
                                                label="Статус"
                                                sx={{ borderRadius: '12px', bgcolor: '#F9FAFB' }}
                                            >
                                                <MenuItem value="active">🟢 Активна</MenuItem>
                                                <MenuItem value="finished">🟡 Завершена</MenuItem>
                                                <MenuItem value="archived">⚫ Архив</MenuItem>
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                </Grid>

                                <Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <TextField 
                                            fullWidth 
                                            label="Макс. учеников" 
                                            type="number" 
                                            value={formData.maxStudents}
                                            onChange={(e) => setFormData({...formData, maxStudents: e.target.value})}
                                            inputProps={{ min: 1 }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F9FAFB' } }}
                                        />
                                    </Grid>
                                    <Grid item xs={6}>
                                        <TextField 
                                            fullWidth 
                                            label="Цена за урок (₽)" 
                                            type="number" 
                                            value={formData.pricePerStudent}
                                            onChange={(e) => setFormData({...formData, pricePerStudent: e.target.value})}
                                            inputProps={{ min: 0 }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F9FAFB' } }}
                                        />
                                    </Grid>
                                </Grid>

                                <Paper sx={{ p: 2, borderRadius: '14px', bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#065F46' }}>
                                        💰 При заполненной группе общий доход за урок:
                                    </Typography>
                                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#065F46' }}>
                                        {formData.pricePerStudent > 0 && formData.studentIds.length > 0
                                            ? `${(formData.pricePerStudent * formData.studentIds.length).toLocaleString()} ₽`
                                            : '—'}
                                    </Typography>
                                </Paper>
                            </Stack>
                        </Grid>

                        {/* Правая колонка — ученики */}
                        <Grid item xs={12} md={5}>
                            <Paper sx={{ 
                                p: 2, borderRadius: '16px', bgcolor: '#F9FAFB', 
                                border: '1px solid #F3F4F6', height: '100%' 
                            }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>
                                        👥 Ученики ({formData.studentIds.length})
                                    </Typography>
                                    {editingGroup && editingGroup.students?.length > 0 && (
                                        <Button 
                                            size="small" 
                                            color="error" 
                                            onClick={handleRemoveAllStudents}
                                            startIcon={<PersonRemove sx={{ fontSize: 16 }} />}
                                            sx={{ textTransform: 'none', fontSize: '12px', borderRadius: '8px' }}
                                        >
                                            Удалить всех
                                        </Button>
                                    )}
                                </Box>

                                {/* Поиск учеников */}
                                <TextField
                                    placeholder="Поиск ученика..."
                                    size="small"
                                    fullWidth
                                    value={studentSearch}
                                    onChange={(e) => setStudentSearch(e.target.value)}
                                    sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#fff' } }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment>,
                                    }}
                                />

                                {/* Список учеников */}
                                <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                                    {filteredStudents.length === 0 ? (
                                        <Typography sx={{ color: '#9CA3AF', textAlign: 'center', py: 3, fontSize: '13px' }}>
                                            Нет учеников
                                        </Typography>
                                    ) : (
                                        filteredStudents.map(s => {
                                            const selected = formData.studentIds.includes(s.id);
                                            return (
                                                <Box 
                                                    key={s.id}
                                                    onClick={() => toggleStudent(s.id)}
                                                    sx={{ 
                                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                                        p: 1.5, mb: 0.5, borderRadius: '12px',
                                                        cursor: 'pointer',
                                                        bgcolor: selected ? '#EEF2FF' : '#fff',
                                                        border: selected ? '1px solid #C7D2FE' : '1px solid #F3F4F6',
                                                        transition: 'all 0.2s ease',
                                                        '&:hover': { bgcolor: selected ? '#E0E7FF' : '#F9FAFB' },
                                                    }}
                                                >
                                                    <Avatar sx={{ width: 36, height: 36, bgcolor: selected ? '#4F46E5' : '#9CA3AF', fontSize: 15, fontWeight: 600 }}>
                                                        {s.fullName?.[0]}
                                                    </Avatar>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                                                            {s.fullName}
                                                        </Typography>
                                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                            {s.paymentType === 'subscription' ? 'Абонемент' : 'Поурочно'}
                                                        </Typography>
                                                    </Box>
                                                    {selected && <CheckCircle sx={{ color: '#4F46E5', fontSize: 20 }} />}
                                                </Box>
                                            );
                                        })
                                    )}
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                    <Button onClick={() => setOpenDialog(false)} sx={{ borderRadius: '10px' }}>
                        Отмена
                    </Button>
                    <StyledButton 
                        onClick={handleSave} 
                        variant="contained" 
                        disabled={!formData.name || !formData.courseId || saving}
                        sx={{ bgcolor: '#4F46E5', borderRadius: '12px', px: 4, '&:hover': { bgcolor: '#4338CA' } }}
                    >
                        {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editingGroup ? '💾 Сохранить' : '🚀 Создать группу'}
                    </StyledButton>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({...snackbar, open: false})}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Groups;