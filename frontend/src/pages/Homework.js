// ========== frontend/src/pages/Homework.js (ОРИГИНАЛ + СВЕЖИЙ ДИЗАЙН v11 — ИСПРАВЛЕН BUG-3) ==========
import React, { useState, useEffect, useMemo } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Typography, Card, CardContent, CardActions,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Chip, Grid, Tabs, Tab,
    Paper, IconButton, Rating, Avatar, LinearProgress,
    FormControlLabel, Checkbox, Tooltip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Upload as UploadIcon,
    RateReview as ReviewIcon,
    CalendarToday as CalendarIcon,
    Grade as GradeIcon,
    Replay as ReplayIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format, isAfter, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const HomeworkCard = styled(Card)(({ borderColor }) => ({
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    borderLeft: `5px solid ${borderColor || '#4F46E5'}`,
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        transform: 'translateY(-3px)',
        borderLeft: `5px solid ${borderColor || '#4F46E5'}`,
    },
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
function Homework() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Домашние задания'; }, []);
    const isTutor = user?.role === 'tutor' || user?.role === 'ROLE_TUTOR';
    const [openBankPicker, setOpenBankPicker] = useState(false);
    const [bankTab, setBankTab] = useState(0);
    const [bankTasks, setBankTasks] = useState([]);
    const [bankVariants, setBankVariants] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [homeworkList, setHomeworkList] = useState([]);
    const [students, setStudents] = useState([]);
    const [error, setError] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [openAssign, setOpenAssign] = useState(false);
    const [openSubmit, setOpenSubmit] = useState(false);
    const [openCheck, setOpenCheck] = useState(false);
    const [fileToUpload, setFileToUpload] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedHomework, setSelectedHomework] = useState(null);
    const [newHomework, setNewHomework] = useState({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5' });
    const [submission, setSubmission] = useState('');
    const [grade, setGrade] = useState({ grade: 0, feedback: '', returnForRevision: false });

    useEffect(() => { if (openBankPicker) loadBankItems(); }, [openBankPicker]);
    useEffect(() => { loadHomework(); if (isTutor) loadStudents(); }, []);

    const loadBankItems = async () => {
        setBankLoading(true);
        try {
            const [tasksRes, variantsRes] = await Promise.all([
                axiosInstance.get('/integration/tasks/search'), axiosInstance.get('/variants')
            ]);
            setBankTasks(tasksRes.data || []); setBankVariants(variantsRes.data || []);
        } catch (err) {} finally { setBankLoading(false); }
    };

    const loadHomework = async () => {
        setLoading(true);
        try {
            const endpoint = isTutor ? `/homework/tutor/${user.id}` : `/homework/student/${user.id}/all`;
            setHomeworkList((await axiosInstance.get(endpoint)).data || []);
        } catch (err) { setError('Ошибка загрузки заданий'); } finally { setLoading(false); }
    };

    const loadStudents = async () => {
        try { setStudents((await axiosInstance.get(`/students/tutor/${user.id}`)).data || []); } catch (err) {}
    };

    const handleAssign = async () => {
        if (!newHomework.studentId || !newHomework.task) return;
        try {
            await axiosInstance.post('/homework', {
                tutorId: user.id, studentId: parseInt(newHomework.studentId), task: newHomework.task,
                dueDate: newHomework.dueDate ? newHomework.dueDate + 'T23:59:59' : null,
                status: 'ASSIGNED', gradeType: newHomework.gradeType || 'GRADE_5'
            });
            setOpenAssign(false); setNewHomework({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5' }); loadHomework();
        } catch (err) { setError('Ошибка назначения задания'); }
    };

    const handleSubmit = async () => {
        if (!selectedHomework) return;
        try {
            const formData = new FormData(); formData.append('answer', submission || '');
            if (fileToUpload) formData.append('file', fileToUpload);
            await axiosInstance.patch(`/homework/${selectedHomework.id}/submit`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setOpenSubmit(false); setSelectedHomework(null); setSubmission(''); setFileToUpload(null); setPreviewUrl(null); loadHomework();
        } catch (err) { setError('Ошибка отправки задания'); }
    };

    const handleCheck = async () => {
        if (!selectedHomework) return;
        try {
            if (grade.returnForRevision) {
                await axiosInstance.patch(`/homework/${selectedHomework.id}/revision`, { feedback: grade.feedback });
            } else {
                // Для 100-балльной и 10-балльной — отправляем score
                if (selectedHomework.gradeType === 'GRADE_100' || selectedHomework.gradeType === 'GRADE_10') {
                    const maxScore = selectedHomework.gradeType === 'GRADE_100' ? 100 : 10;
                    await axiosInstance.patch(`/homework/${selectedHomework.id}/grade-with-score`, {
                        score: grade.grade,
                        maxScore: maxScore,
                        feedback: grade.feedback
                    });
                } else {
                    await axiosInstance.patch(`/homework/${selectedHomework.id}/grade`, {
                        grade: grade.grade,
                        feedback: grade.feedback
                    });
                }
            }
            setOpenCheck(false); setSelectedHomework(null);
            setGrade({ grade: 0, feedback: '', returnForRevision: false }); loadHomework();
        } catch (err) { setError('Ошибка проверки задания'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить задание?')) return;
        try { await axiosInstance.delete(`/homework/${id}`); loadHomework(); } catch (err) { setError('Ошибка удаления'); }
    };

    const getStatusConfig = (status) => {
        const configs = {
            'ASSIGNED':  { label: 'Назначено',  color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
            'SUBMITTED': { label: 'Сдано',      color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
            'CHECKED':   { label: 'Проверено',  color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
            'RETURNED':  { label: 'Доработка',  color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
        };
        return configs[(status || '').toUpperCase()] || { label: status, color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' };
    };

    const filteredHomework = () => {
        if (tabValue === 0) return homeworkList;
        const statuses = ['ASSIGNED', 'SUBMITTED', 'CHECKED', 'RETURNED'];
        return homeworkList.filter(h => (h.status || '').toUpperCase() === statuses[tabValue - 1]);
    };

    const stats = useMemo(() => {
        const total = homeworkList.length;
        const submitted = homeworkList.filter(h => (h.status || '').toUpperCase() === 'SUBMITTED').length;
        const checked = homeworkList.filter(h => (h.status || '').toUpperCase() === 'CHECKED').length;
        const grades = homeworkList.filter(h => h.grade).map(h => h.grade);
        const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : 0;
        return { total, submitted, checked, avgGrade };
    }, [homeworkList]);

    const isOverdue = (hw) => {
        if (!hw.dueDate || (hw.status || '').toUpperCase() === 'CHECKED') return false;
        return isAfter(new Date(), parseISO(hw.dueDate));
    };

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
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
                        {isTutor ? '📋 Домашние задания' : '📝 Мои задания'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {isTutor ? 'Управляйте домашними заданиями учеников' : 'Ваши активные и проверенные задания'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <StyledButton variant="outlined" startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} onClick={loadHomework}
                        sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '10px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                        Обновить
                    </StyledButton>
                    {isTutor && (
                        <StyledButton variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenAssign(true)}
                            sx={{ bgcolor: '#4F46E5', borderRadius: '10px', '&:hover': { bgcolor: '#4338CA' } }}>
                            Назначить ДЗ
                        </StyledButton>
                    )}
                </Box>
            </Box>

            {/* ========== СТАТИСТИКА ========== */}
            {isTutor && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Всего заданий', value: stats.total, icon: AssignmentIcon, color: '#4F46E5', bg: '#EEF2FF' },
                        { label: 'На проверке', value: stats.submitted, icon: ReviewIcon, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: 'Проверено', value: stats.checked, icon: CheckIcon, color: '#10B981', bg: '#ECFDF5' },
                        { label: 'Средний балл', value: `${stats.avgGrade}/5`, icon: GradeIcon, color: '#3B82F6', bg: '#EFF6FF' },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Grid item xs={6} md={3} key={i}>
                                <StatCard>
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>{stat.label}</Typography>
                                            </Box>
                                            <Box sx={{ width: 42, height: 42, borderRadius: '12px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Icon sx={{ fontSize: 20, color: stat.color }} />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </StatCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ========== ВКЛАДКИ ========== */}
            <Box sx={{ mb: 3 }}>
                <ViewToggle>
                    <ViewToggleBtn active={tabValue === 0} onClick={() => setTabValue(0)}>Все ({homeworkList.length})</ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 1} onClick={() => setTabValue(1)}>Назначено</ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 2} onClick={() => setTabValue(2)}>Сдано ({stats.submitted})</ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 3} onClick={() => setTabValue(3)}>Проверено ({stats.checked})</ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 4} onClick={() => setTabValue(4)}>Доработка</ViewToggleBtn>
                </ViewToggle>
            </Box>

            {/* ========== КАРТОЧКИ ЗАДАНИЙ ========== */}
            {filteredHomework().length === 0 ? (
                <Paper sx={{ borderRadius: '16px', bgcolor: '#FFFFFF', p: 6, textAlign: 'center' }}>
                    <EmptyStateIcon sx={{ mb: 2 }}><AssignmentIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                        {isTutor ? 'Нет заданий' : 'У вас пока нет заданий'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {isTutor ? 'Назначьте первое домашнее задание ученику' : 'Здесь появятся задания от репетитора'}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {filteredHomework().map(hw => {
                        const statusConfig = getStatusConfig(hw.status);
                        const overdue = isOverdue(hw);
                        const borderColor = overdue ? '#EF4444' : statusConfig.dot;

                        return (
                            <Grid item xs={12} sm={6} md={6} lg={4} key={hw.id}>
                                <HomeworkCard borderColor={borderColor}>
                                    <CardContent sx={{ p: 2.5, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        {/* Статус + Просрочено */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
                                            <Chip 
                                                label={statusConfig.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: statusConfig.bg,
                                                    color: statusConfig.color,
                                                    fontWeight: 600,
                                                    fontSize: '11px',
                                                    height: 26,
                                                    borderRadius: '8px',
                                                    border: `1px solid ${statusConfig.dot}40`,
                                                }}
                                            />
                                            {overdue && (
                                                <Chip 
                                                    icon={<ScheduleIcon sx={{ fontSize: 12, color: '#DC2626 !important' }} />}
                                                    label="Просрочено"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#FEF2F2',
                                                        color: '#991B1B',
                                                        fontWeight: 600,
                                                        fontSize: '11px',
                                                        height: 26,
                                                        borderRadius: '8px',
                                                        border: '1px solid #FECACA',
                                                    }}
                                                />
                                            )}
                                        </Box>

                                        {/* Ученик */}
                                        {isTutor && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                <Avatar sx={{ width: 34, height: 34, bgcolor: getAvatarColor(hw.student?.fullName || '?'), fontSize: 13, fontWeight: 600 }}>
                                                    {getInitials(hw.student?.fullName || '?')}
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 600, color: '#1F2937', fontSize: '15px' }}>
                                                    {hw.student?.fullName || 'Ученик'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Текст задания */}
                                        <Typography sx={{ 
                                            color: '#374151', lineHeight: 1.6, mb: 2, fontSize: '14px',
                                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            bgcolor: '#F9FAFB', p: 1.5, borderRadius: '10px',
                                        }}>
                                            {hw.task}
                                        </Typography>

                                        {/* Срок + Оценка */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarIcon sx={{ fontSize: 14, color: overdue ? '#EF4444' : '#9CA3AF' }} />
                                                <Typography sx={{ fontSize: '13px', color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 600 : 400 }}>
                                                    {hw.dueDate ? format(new Date(hw.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                </Typography>
                                            </Box>
                                            {hw.grade != null && (
                                                <Chip
                                                    label={`⭐ ${hw.grade}/5`}
                                                    size="small"
                                                    sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700, borderRadius: '8px', fontSize: '12px' }}
                                                />
                                            )}
                                        </Box>
                                    </CardContent>

                                    <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {isTutor && (hw.status || '').toUpperCase() === 'SUBMITTED' && (
                                                <StyledButton variant="contained" startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                    sx={{ bgcolor: '#10B981', borderRadius: '8px', '&:hover': { bgcolor: '#059669' }, fontSize: '13px' }}>
                                                    Проверить
                                                </StyledButton>
                                            )}
                                            {isTutor && (hw.status || '').toUpperCase() === 'CHECKED' && (
                                                <StyledButton variant="outlined" startIcon={<ReviewIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => { setSelectedHomework(hw); setOpenCheck(true); }}
                                                    sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '8px', fontSize: '13px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                                    Посмотреть
                                                </StyledButton>
                                            )}
                                            {!isTutor && ((hw.status || '').toUpperCase() === 'ASSIGNED' || (hw.status || '').toUpperCase() === 'RETURNED') && (
                                                <StyledButton variant="contained" startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => { setSelectedHomework(hw); setSubmission(''); setFileToUpload(null); setPreviewUrl(null); setOpenSubmit(true); }}
                                                    sx={{ bgcolor: '#4F46E5', borderRadius: '8px', '&:hover': { bgcolor: '#4338CA' }, fontSize: '13px' }}>
                                                    Сдать
                                                </StyledButton>
                                            )}
                                        </Box>
                                        {isTutor && (
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" onClick={() => handleDelete(hw.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                    </CardActions>
                                </HomeworkCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== ДИАЛОГ НАЗНАЧЕНИЯ ДЗ ========== */}
            {isTutor && (
                <StyledDialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>✨ Назначить домашнее задание</DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth><InputLabel>Ученик</InputLabel>
                                <Select value={newHomework.studentId} onChange={(e) => setNewHomework({ ...newHomework, studentId: e.target.value })} label="Ученик" sx={{ borderRadius: '10px' }}>
                                    {students.map(s => (<MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Задание" multiline rows={4} value={newHomework.task} onChange={(e) => setNewHomework({ ...newHomework, task: e.target.value })} placeholder="Текст задания или ссылка на вариант" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <StyledButton variant="outlined" onClick={() => setOpenBankPicker(true)} sx={{ color: '#6B7280', borderColor: '#D1D5DB', borderRadius: '10px' }}>📋 Выбрать из банка</StyledButton>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField fullWidth label="Срок сдачи" type="date" value={newHomework.dueDate} onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                <FormControl fullWidth><InputLabel>Шкала</InputLabel>
                                    <Select value={newHomework.gradeType || 'GRADE_5'} onChange={(e) => setNewHomework({ ...newHomework, gradeType: e.target.value })} label="Шкала" sx={{ borderRadius: '10px' }}>
                                        <MenuItem value="GRADE_5">⭐ 5-балльная</MenuItem>
                                        <MenuItem value="GRADE_10">📊 10-балльная</MenuItem>
                                        <MenuItem value="GRADE_100">💯 100-балльная</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setOpenAssign(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleAssign} variant="contained" disabled={!newHomework.studentId || !newHomework.task} sx={{ bgcolor: '#4F46E5', borderRadius: '10px' }}>Назначить</StyledButton>
                    </DialogActions>
                </StyledDialog>
            )}

            {/* ========== БАНК ЗАДАНИЙ ========== */}
            <StyledDialog open={openBankPicker} onClose={() => setOpenBankPicker(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, px: 3, pt: 3 }}>📚 Банк заданий</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Tabs value={bankTab} onChange={(e, v) => setBankTab(v)} sx={{ mb: 2 }}><Tab label="Задания" /><Tab label="Варианты" /></Tabs>
                    {bankLoading ? <CircularProgress sx={{ color: '#4F46E5' }} /> : (
                        <Grid container spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {(bankTab === 0 ? bankTasks : bankVariants).map(item => (
                                <Grid item xs={12} key={item.id}>
                                    <Paper sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: '#EEF2FF' } }}
                                        onClick={() => { setNewHomework({ ...newHomework, task: item.question || item.topic || item.url || item.title }); setOpenBankPicker(false); }}>
                                        <Typography sx={{ fontSize: '14px' }}>{item.question || item.topic || item.title}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions><StyledButton onClick={() => setOpenBankPicker(false)}>Отмена</StyledButton></DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ СДАЧИ ========== */}
            <StyledDialog open={openSubmit} onClose={() => { setOpenSubmit(false); setSubmission(''); setFileToUpload(null); setPreviewUrl(null); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#EEF2FF', width: 36, height: 36 }}><SendIcon sx={{ color: '#4F46E5', fontSize: 18 }} /></Avatar>
                        Сдать задание
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {selectedHomework && (
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>📋 Задание:</Typography>
                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{selectedHomework.task}</Typography>
                            </Paper>
                            <TextField fullWidth label="✏️ Ваш ответ" multiline rows={5} value={submission} onChange={(e) => setSubmission(e.target.value)} placeholder="Введите ответ..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <StyledButton variant="outlined" component="label" startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
                                sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '10px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                {fileToUpload ? fileToUpload.name : '📎 Прикрепить файл'}
                                <input type="file" hidden onChange={(e) => setFileToUpload(e.target.files[0])} />
                            </StyledButton>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenSubmit(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSubmit} variant="contained" disabled={!submission && !fileToUpload} sx={{ bgcolor: '#4F46E5', borderRadius: '10px' }}>Отправить</StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ ПРОВЕРКИ ========== */}
            <StyledDialog open={openCheck} onClose={() => setOpenCheck(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                    {selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Просмотр' : 'Проверить'} — {selectedHomework?.student?.fullName}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', mb: 1, fontWeight: 600 }}>📋 Задание</Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedHomework.task}</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2.5, bgcolor: '#EEF2FF', borderRadius: '12px', border: '1px solid #C7D2FE', height: '100%' }}>
                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', mb: 1, fontWeight: 600 }}>✏️ Ответ ученика</Typography>
                                        {selectedHomework.attachments ? (
                                            <Box>
                                                {selectedHomework.attachments.split('\n').map((line, i) => {
                                                    if (line.startsWith('/uploads/')) {
                                                        return (
                                                            <StyledButton key={i} variant="outlined" size="small"
                                                                href={`https://ed-space.ru/api/homework/file/${line.replace('/uploads/homework/', '')}`} target="_blank"
                                                                sx={{ mr: 1, mb: 1, color: '#4F46E5', borderColor: '#C7D2FE', borderRadius: '8px', fontSize: '12px' }}>
                                                                📎 {line.split('/').pop()}
                                                            </StyledButton>
                                                        );
                                                    }
                                                    return <Typography key={i} sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{line}</Typography>;
                                                })}
                                            </Box>
                                        ) : (
                                            <Typography sx={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>Ученик не прикрепил ответ</Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>

                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {['Отлично!', 'Есть ошибки', 'Покажи решение', 'Оформление'].map(tpl => (
                                        <Chip key={tpl} label={tpl} size="small" variant="outlined"
                                            onClick={() => setGrade({ ...grade, feedback: grade.feedback ? grade.feedback + '\n' + tpl : tpl })}
                                            sx={{ cursor: 'pointer', borderRadius: '8px', fontSize: '11px', '&:hover': { borderColor: '#4F46E5', color: '#4F46E5', bgcolor: '#EEF2FF' } }} />
                                    ))}
                                </Box>
                            )}

                            {selectedHomework?.status?.toUpperCase() === 'CHECKED' && selectedHomework.grade != null && (
                                <Box sx={{ mt: 3, p: 2.5, bgcolor: '#ECFDF5', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                                    <Typography sx={{ fontWeight: 600, color: '#065F46', fontSize: '16px' }}>
                                        ✅ Оценка: {selectedHomework.gradeType === 'GRADE_100' ? `💯 ${selectedHomework.score || selectedHomework.grade}/100` : selectedHomework.gradeType === 'GRADE_10' ? `📊 ${selectedHomework.score || selectedHomework.grade}/10` : `⭐ ${selectedHomework.grade}/5`}
                                    </Typography>
                                    {selectedHomework.feedback && <Typography sx={{ color: '#374151', mt: 1.5, fontSize: '14px' }}>💬 {selectedHomework.feedback}</Typography>}
                                </Box>
                            )}

                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#1F2937', mb: 2, fontSize: '16px' }}>Оценивание</Typography>
                                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', mb: 2 }}>
                                        {/* 5-балльная и 10-балльная — звёзды */}
                                        {(selectedHomework.gradeType === 'GRADE_5' || selectedHomework.gradeType === 'GRADE_10') && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Оценка:</Typography>
                                                <Rating 
                                                    value={grade.grade} 
                                                    onChange={(e, v) => setGrade({ ...grade, grade: v })} 
                                                    max={selectedHomework.gradeType === 'GRADE_10' ? 10 : 5} 
                                                    size="large" 
                                                />
                                                <Typography sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 600 }}>
                                                    {grade.grade > 0 ? `${grade.grade}/${selectedHomework.gradeType === 'GRADE_10' ? 10 : 5}` : ''}
                                                </Typography>
                                            </Box>
                                        )}
                                        
                                        {/* 100-балльная — поле ввода */}
                                        {selectedHomework.gradeType === 'GRADE_100' && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Баллы (0-100):</Typography>
                                                <TextField 
                                                    type="number" 
                                                    value={grade.grade || ''} 
                                                    onChange={(e) => setGrade({ ...grade, grade: parseInt(e.target.value) || 0 })} 
                                                    inputProps={{ min: 0, max: 100 }} 
                                                    size="small" 
                                                    sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} 
                                                />
                                                <Typography sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 600 }}>
                                                    {grade.grade > 0 ? `${grade.grade}/100` : ''}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                    <TextField fullWidth label="Комментарий" multiline rows={3} value={grade.feedback} onChange={(e) => setGrade({ ...grade, feedback: e.target.value })} placeholder="Что хорошо, что исправить..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                    <FormControlLabel control={<Checkbox checked={grade.returnForRevision} onChange={(e) => setGrade({ ...grade, returnForRevision: e.target.checked })} />} label="Вернуть на доработку" sx={{ mt: 1, color: '#92400E' }} />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenCheck(false)} sx={{ color: '#6B7280' }}>{selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Закрыть' : 'Отмена'}</StyledButton>
                    {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                        <StyledButton onClick={handleCheck} variant="contained" startIcon={grade.returnForRevision ? <ReplayIcon /> : <CheckIcon />}
                            sx={{ bgcolor: grade.returnForRevision ? '#F59E0B' : '#10B981', borderRadius: '10px', '&:hover': { bgcolor: grade.returnForRevision ? '#D97706' : '#059669' } }}>
                            {grade.returnForRevision ? 'Вернуть' : 'Проверить'}
                        </StyledButton>
                    )}
                </DialogActions>
            </StyledDialog>
        </PageContainer>
    );
}

export default Homework;