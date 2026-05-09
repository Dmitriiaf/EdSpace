// ========== frontend/src/pages/Homework.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect, useMemo } from 'react';
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
    TrendingUp as TrendingUpIcon,
    AutoGraph as AutoGraphIcon,
    Circle as CircleIcon,
    School as SchoolIcon,
    Schedule as ScheduleIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format, isAfter, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const HomeworkCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
    },
});

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
    const [selectedHomework, setSelectedHomework] = useState(null);
    const [newHomework, setNewHomework] = useState({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5' });
    const [submission, setSubmission] = useState('');
    const [grade, setGrade] = useState({ grade: 0, feedback: '', returnForRevision: false });

    useEffect(() => {
        if (openBankPicker) loadBankItems();
    }, [openBankPicker]);

    useEffect(() => {
        loadHomework();
        if (isTutor) loadStudents();
    }, []);

    // ========== ВСЕ ФУНКЦИИ БЕЗ ИЗМЕНЕНИЙ ==========

    const loadBankItems = async () => {
        setBankLoading(true);
        try {
            const [tasksRes, variantsRes] = await Promise.all([
                axiosInstance.get('/integration/tasks/search'),
                axiosInstance.get('/variants')
            ]);
            setBankTasks(tasksRes.data || []);
            setBankVariants(variantsRes.data || []);
        } catch (err) { console.error('Ошибка загрузки банка:', err); }
        finally { setBankLoading(false); }
    };

    const loadHomework = async () => {
        setLoading(true);
        try {
            const endpoint = isTutor ? `/homework/tutor/${user.id}` : `/homework/student/${user.id}/all`;
            const res = await axiosInstance.get(endpoint);
            setHomeworkList(res.data || []);
        } catch (err) {
            setError('Ошибка загрузки заданий');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const res = await axiosInstance.get(`/students/tutor/${user.id}`);
            setStudents(res.data || []);
        } catch (err) {}
    };

    const handleAssign = async () => {
        if (!newHomework.studentId || !newHomework.task) return;
        try {
            await axiosInstance.post('/homework', {
                tutorId: user.id, studentId: parseInt(newHomework.studentId),
                task: newHomework.task,
                dueDate: newHomework.dueDate ? newHomework.dueDate + 'T23:59:59' : null,
                status: 'ASSIGNED', gradeType: newHomework.gradeType || 'GRADE_5'
            });
            setOpenAssign(false);
            setNewHomework({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5' });
            loadHomework();
        } catch (err) { setError('Ошибка назначения задания'); }
    };

    const handleSubmit = async () => {
        if (!selectedHomework) return;
        try {
            const formData = new FormData();
            formData.append('answer', submission || '');
            if (fileToUpload) formData.append('file', fileToUpload);
            await axiosInstance.patch(`/homework/${selectedHomework.id}/submit`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setOpenSubmit(false); setSelectedHomework(null);
            setSubmission(''); setFileToUpload(null); loadHomework();
        } catch (err) { setError('Ошибка отправки задания'); }
    };

    const handleCheck = async () => {
        if (!selectedHomework) return;
        try {
            if (grade.returnForRevision) {
                await axiosInstance.patch(`/homework/${selectedHomework.id}/revision`, { feedback: grade.feedback });
            } else {
                await axiosInstance.patch(`/homework/${selectedHomework.id}/grade`, { grade: grade.grade, feedback: grade.feedback });
            }
            setOpenCheck(false); setSelectedHomework(null);
            setGrade({ grade: 0, feedback: '', returnForRevision: false }); loadHomework();
        } catch (err) { setError('Ошибка проверки задания'); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить задание?')) return;
        try { await axiosInstance.delete(`/homework/${id}`); loadHomework(); }
        catch (err) { setError('Ошибка удаления'); }
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
        const avgPct = homeworkList.filter(h => h.percentage).length > 0
            ? Math.round(homeworkList.filter(h => h.percentage).reduce((a, b) => a + b.percentage, 0) / homeworkList.filter(h => h.percentage).length)
            : 0;
        return { total, submitted, checked, avgGrade, avgPct };
    }, [homeworkList]);

    const isOverdue = (hw) => {
        if (!hw.dueDate) return false;
        if ((hw.status || '').toUpperCase() === 'CHECKED') return false;
        return isAfter(new Date(), parseISO(hw.dueDate));
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#4F46E5' }} />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                        {isTutor ? 'Домашние задания' : 'Мои задания'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {isTutor ? 'Управляйте домашними заданиями учеников' : 'Ваши активные и проверенные задания'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <StyledButton variant="outlined" startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} onClick={loadHomework}
                        sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}>
                        Обновить
                    </StyledButton>
                    {isTutor && (
                        <StyledButton variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenAssign(true)}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
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
                                                <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                width: 42, height: 42, borderRadius: '10px',
                                                backgroundColor: stat.bg,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
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
                    <ViewToggleBtn active={tabValue === 0} onClick={() => setTabValue(0)}>
                        Все ({homeworkList.length})
                    </ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 1} onClick={() => setTabValue(1)}>
                        Назначено
                    </ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 2} onClick={() => setTabValue(2)}>
                        Сдано ({stats.submitted})
                    </ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 3} onClick={() => setTabValue(3)}>
                        Проверено ({stats.checked})
                    </ViewToggleBtn>
                    <ViewToggleBtn active={tabValue === 4} onClick={() => setTabValue(4)}>
                        Доработка
                    </ViewToggleBtn>
                </ViewToggle>
            </Box>

            {/* ========== КАРТОЧКИ ЗАДАНИЙ ========== */}
            {filteredHomework().length === 0 ? (
                <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <AssignmentIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            {isTutor ? 'Нет заданий' : 'У вас пока нет заданий'}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            {isTutor ? 'Назначьте первое домашнее задание ученику' : 'Здесь появятся задания от репетитора'}
                        </Typography>
                    </EmptyStateContainer>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {filteredHomework().map(hw => {
                        const statusConfig = getStatusConfig(hw.status);
                        const overdue = isOverdue(hw);
                        
                        return (
                            <Grid item xs={12} sm={6} md={6} lg={4} key={hw.id}>
                                <HomeworkCard sx={{
                                    borderLeft: `4px solid ${statusConfig.dot}`,
                                }}>
                                    <CardContent sx={{ p: 2.5, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                                        {/* Статус + Просрочено */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, gap: 1 }}>
                                            <Box className="badge" sx={{ 
                                                backgroundColor: statusConfig.bg, 
                                                color: statusConfig.color,
                                                '&::before': { backgroundColor: statusConfig.dot },
                                            }}>
                                                {statusConfig.label}
                                            </Box>
                                            {overdue && (
                                                <Box className="badge" sx={{ 
                                                    backgroundColor: '#FEF2F2', 
                                                    color: '#991B1B',
                                                    '&::before': { backgroundColor: '#EF4444' },
                                                }}>
                                                    <ScheduleIcon sx={{ fontSize: 12 }} />
                                                    Просрочено
                                                </Box>
                                            )}
                                        </Box>

                                        {/* Ученик */}
                                        {isTutor && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                <Avatar sx={{ 
                                                    width: 32, height: 32, 
                                                    bgcolor: getAvatarColor(hw.student?.fullName || '?'),
                                                    fontSize: 12, fontWeight: 600,
                                                }}>
                                                    {getInitials(hw.student?.fullName || '?')}
                                                </Avatar>
                                                <Typography sx={{ fontWeight: 500, color: '#1F2937', fontSize: '15px' }}>
                                                    {hw.student?.fullName || 'Ученик'}
                                                </Typography>
                                            </Box>
                                        )}

                                        {/* Текст задания */}
                                        <Typography sx={{ 
                                            color: '#374151', lineHeight: 1.5, mb: 2, fontSize: '14px',
                                            display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                        }}>
                                            {hw.task}
                                        </Typography>

                                        {/* Срок + Оценка */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarIcon sx={{ fontSize: 14, color: overdue ? '#EF4444' : '#9CA3AF' }} />
                                                <Typography sx={{ fontSize: '13px', color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 500 : 400 }}>
                                                    {hw.dueDate ? format(new Date(hw.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                </Typography>
                                            </Box>
                                            {hw.grade != null && (
                                                <Chip
                                                    label={hw.gradeType === 'GRADE_100' ? `${hw.score || hw.grade}/100` : hw.gradeType === 'GRADE_10' ? `${hw.score || hw.grade}/10` : `⭐ ${hw.grade}/5`}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: '#ECFDF5', color: '#065F46', 
                                                        fontWeight: 600, borderRadius: '100px', fontSize: '12px',
                                                    }} 
                                                />
                                            )}
                                        </Box>
                                    </CardContent>

                                    <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {isTutor && (hw.status || '').toUpperCase() === 'SUBMITTED' && (
                                                <StyledButton variant="contained" startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                    sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, fontSize: '13px' }}>
                                                    Проверить
                                                </StyledButton>
                                            )}
                                            {isTutor && (hw.status || '').toUpperCase() === 'CHECKED' && (
                                                <StyledButton variant="outlined" startIcon={<ReviewIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => { setSelectedHomework(hw); setOpenCheck(true); }}
                                                    sx={{ color: '#374151', borderColor: '#D1D5DB', fontSize: '13px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                                    Посмотреть
                                                </StyledButton>
                                            )}
                                            {!isTutor && ((hw.status || '').toUpperCase() === 'ASSIGNED' || (hw.status || '').toUpperCase() === 'RETURNED') && (
                                                <StyledButton variant="contained" startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                                                    onClick={() => { setSelectedHomework(hw); setSubmission(''); setFileToUpload(null); setOpenSubmit(true); }}
                                                    sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontSize: '13px' }}>
                                                    Сдать
                                                </StyledButton>
                                            )}
                                        </Box>
                                        {isTutor && (
                                            <Tooltip title="Удалить">
                                                <IconButton size="small" onClick={() => handleDelete(hw.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}>
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
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                        Назначить домашнее задание
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Ученик</InputLabel>
                                <Select value={newHomework.studentId} onChange={(e) => setNewHomework({ ...newHomework, studentId: e.target.value })} label="Ученик"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    {students.map(s => (<MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Задание" multiline rows={4} value={newHomework.task}
                                onChange={(e) => setNewHomework({ ...newHomework, task: e.target.value })}
                                placeholder="Текст задания или ссылка на вариант" sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <StyledButton variant="outlined" onClick={() => setOpenBankPicker(true)}
                                sx={{ mb: 2, color: '#6B7280', borderColor: '#D1D5DB', fontSize: '13px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                📋 Выбрать из банка заданий
                            </StyledButton>
                            <TextField fullWidth label="Срок сдачи" type="date" value={newHomework.dueDate}
                                onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })}
                                InputLabelProps={{ shrink: true }} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontSize: '14px' }}>Шкала оценивания</InputLabel>
                                <Select value={newHomework.gradeType || 'GRADE_5'} onChange={(e) => setNewHomework({ ...newHomework, gradeType: e.target.value })} label="Шкала оценивания"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    <MenuItem value="GRADE_5">5-балльная (1-5) ⭐</MenuItem>
                                    <MenuItem value="GRADE_10">10-балльная (1-10)</MenuItem>
                                    <MenuItem value="GRADE_100">100-балльная (0-100)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setOpenAssign(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleAssign} variant="contained" disabled={!newHomework.studentId || !newHomework.task}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>Назначить</StyledButton>
                    </DialogActions>
                </StyledDialog>
            )}

            {/* ========== МОДАЛКА БАНКА ========== */}
            <StyledDialog open={openBankPicker} onClose={() => setOpenBankPicker(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Выбрать из банка заданий
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Tabs value={bankTab} onChange={(e, v) => setBankTab(v)} sx={{ mb: 2 }}>
                            <Tab label="Задания" /><Tab label="Варианты" />
                        </Tabs>
                        {bankLoading ? <CircularProgress sx={{ color: '#4F46E5' }} /> : (
                            <Grid container spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {(bankTab === 0 ? bankTasks : bankVariants).map(item => (
                                    <Grid item xs={12} key={item.id}>
                                        <Paper sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB', cursor: 'pointer', '&:hover': { borderColor: '#4F46E5', bgcolor: '#EEF2FF' } }}
                                            onClick={() => { setNewHomework({ ...newHomework, task: item.question || item.topic || item.url || item.title }); setOpenBankPicker(false); }}>
                                            <Typography sx={{ fontSize: '14px', color: '#374151' }}>{item.question || item.topic || item.title}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                {item.subject && <Chip label={item.subject} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', height: 18, fontSize: '11px', borderRadius: '100px' }} />}
                                                {item.examType && <Chip label={item.examType} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', height: 18, fontSize: '11px', borderRadius: '100px' }} />}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenBankPicker(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ СДАЧИ ========== */}
            <StyledDialog open={openSubmit} onClose={() => setOpenSubmit(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Сдать задание
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            <Paper sx={{ p: 2, bgcolor: '#F9FAFB', mb: 2, borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>Задание:</Typography>
                                <Typography sx={{ fontSize: '14px', color: '#374151' }}>{selectedHomework.task}</Typography>
                            </Paper>
                            <TextField fullWidth label="Ваш ответ" multiline rows={5} value={submission} onChange={(e) => setSubmission(e.target.value)}
                                placeholder="Введите ответ..." sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <StyledButton variant="outlined" component="label" startIcon={<UploadIcon sx={{ fontSize: 16 }} />}
                                sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                {fileToUpload ? fileToUpload.name : 'Прикрепить файл'}
                                <input type="file" hidden onChange={(e) => setFileToUpload(e.target.files[0])} />
                            </StyledButton>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenSubmit(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSubmit} variant="contained" disabled={!submission && !fileToUpload}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>Отправить</StyledButton>
                </DialogActions>
            </StyledDialog>

                        {/* ========== ДИАЛОГ ПРОВЕРКИ (УЛУЧШЕННЫЙ) ========== */}
            <StyledDialog open={openCheck} onClose={() => setOpenCheck(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    {selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Просмотр' : 'Проверить'} — {selectedHomework?.student?.fullName}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            {/* Задание и Ответ — рядом */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB', height: '100%' }}>
                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', mb: 1, fontWeight: 600 }}>
                                            📋 Задание
                                        </Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                            {selectedHomework.task}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2.5, bgcolor: '#EEF2FF', borderRadius: '10px', border: '1px solid #C7D2FE', height: '100%' }}>
                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', mb: 1, fontWeight: 600 }}>
                                            ✏️ Ответ ученика
                                        </Typography>
                                        {selectedHomework.attachments ? (
                                            <Box>
                                                {selectedHomework.attachments.split('\n').map((line, i) => {
                                                    if (line.startsWith('/uploads/')) {
                                                        return (
                                                            <StyledButton key={i} variant="outlined" size="small"
                                                                href={`https://ed-space.ru/api/homework/file/${line.replace('/uploads/homework/', '')}`} target="_blank"
                                                                sx={{ mr: 1, mb: 1, color: '#4F46E5', borderColor: '#C7D2FE', fontSize: '12px' }}>
                                                                📎 {line.split('/').pop()}
                                                            </StyledButton>
                                                        );
                                                    }
                                                    return (
                                                        <Typography key={i} sx={{ 
                                                            fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6,
                                                            fontFamily: line.includes('function') || line.includes('class') || line.includes('def ') ? 'monospace' : 'inherit',
                                                            bgcolor: line.includes('function') || line.includes('class') ? '#F3F4F6' : 'transparent',
                                                            p: line.includes('function') || line.includes('class') ? 1 : 0,
                                                            borderRadius: '4px',
                                                        }}>
                                                            {line}
                                                        </Typography>
                                                    );
                                                })}
                                            </Box>
                                        ) : (
                                            <Typography sx={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>
                                                Ученик не прикрепил ответ
                                            </Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>

                            {/* Шаблоны комментариев */}
                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {[
                                        'Отлично, всё верно!',
                                        'Есть ошибки, посмотри внимательнее',
                                        'Нужно показать решение, а не только ответ',
                                        'Оформление хромает, перепиши аккуратнее',
                                    ].map(tpl => (
                                        <Chip
                                            key={tpl}
                                            label={tpl}
                                            size="small"
                                            variant="outlined"
                                            onClick={() => setGrade({ ...grade, feedback: grade.feedback ? grade.feedback + '\n' + tpl : tpl })}
                                            sx={{ 
                                                cursor: 'pointer', borderRadius: '8px', fontSize: '11px',
                                                borderColor: '#E5E7EB', color: '#6B7280',
                                                '&:hover': { borderColor: '#4F46E5', color: '#4F46E5', bgcolor: '#EEF2FF' },
                                            }}
                                        />
                                    ))}
                                </Box>
                            )}

                            {/* Результат проверки */}
                            {selectedHomework?.status?.toUpperCase() === 'CHECKED' && selectedHomework.grade != null && (
                                <Box sx={{ mt: 3, p: 2.5, bgcolor: '#ECFDF5', borderRadius: '10px', border: '1px solid #A7F3D0' }}>
                                    <Typography sx={{ fontWeight: 600, color: '#065F46', fontSize: '16px' }}>
                                        ✅ Оценка: {selectedHomework.gradeType === 'GRADE_100' ? `${selectedHomework.score || selectedHomework.grade}/100` : selectedHomework.gradeType === 'GRADE_10' ? `${selectedHomework.score || selectedHomework.grade}/10` : `⭐ ${selectedHomework.grade}/5`}
                                    </Typography>
                                    {selectedHomework.feedback && (
                                        <Typography sx={{ color: '#374151', mt: 1.5, fontSize: '14px', lineHeight: 1.5 }}>
                                            💬 {selectedHomework.feedback}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {/* Форма проверки */}
                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#1F2937', mb: 2, fontSize: '16px' }}>
                                        Оценивание
                                    </Typography>
                                    
                                    {/* Выбор оценки */}
                                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB', mb: 2 }}>
                                        {selectedHomework?.gradeType === 'GRADE_100' ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap' }}>Баллы:</Typography>
                                                <TextField 
                                                    type="number" 
                                                    size="small"
                                                    value={grade.grade || ''}
                                                    onChange={(e) => setGrade({ ...grade, grade: parseInt(e.target.value) || 0 })}
                                                    inputProps={{ min: 0, max: 100 }}
                                                    sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                />
                                                <Typography sx={{ fontSize: '14px', color: '#9CA3AF' }}>/ 100</Typography>
                                            </Box>
                                        ) : selectedHomework?.gradeType === 'GRADE_10' ? (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280', whiteSpace: 'nowrap' }}>Баллы:</Typography>
                                                <TextField 
                                                    type="number" 
                                                    size="small"
                                                    value={grade.grade || ''}
                                                    onChange={(e) => setGrade({ ...grade, grade: parseInt(e.target.value) || 0 })}
                                                    inputProps={{ min: 1, max: 10 }}
                                                    sx={{ width: 120, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                                />
                                                <Typography sx={{ fontSize: '14px', color: '#9CA3AF' }}>/ 10</Typography>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Оценка:</Typography>
                                                <Rating 
                                                    value={grade.grade} 
                                                    onChange={(e, v) => setGrade({ ...grade, grade: v })} 
                                                    max={5} 
                                                    size="large" 
                                                />
                                                <Typography sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 600 }}>
                                                    {grade.grade > 0 ? `${grade.grade}/5` : ''}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Paper>

                                    {/* Комментарий */}
                                    <TextField 
                                        fullWidth 
                                        label="Комментарий" 
                                        multiline 
                                        rows={3} 
                                        value={grade.feedback}
                                        onChange={(e) => setGrade({ ...grade, feedback: e.target.value })}
                                        placeholder="Что хорошо, что исправить..."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    />

                                    {/* Вернуть на доработку */}
                                    <FormControlLabel 
                                        control={
                                            <Checkbox 
                                                checked={grade.returnForRevision} 
                                                onChange={(e) => setGrade({ ...grade, returnForRevision: e.target.checked })} 
                                                sx={{ color: '#F59E0B', '&.Mui-checked': { color: '#F59E0B' } }}
                                            />
                                        } 
                                        label={
                                            <Typography sx={{ fontSize: '14px', color: '#92400E' }}>
                                                Вернуть на доработку
                                            </Typography>
                                        }
                                        sx={{ mt: 1 }} 
                                    />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenCheck(false)} sx={{ color: '#6B7280' }}>
                        {selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Закрыть' : 'Отмена'}
                    </StyledButton>
                    {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                        <StyledButton onClick={handleCheck} variant="contained"
                            startIcon={grade.returnForRevision ? <ReplayIcon /> : <CheckIcon />}
                            sx={{ 
                                bgcolor: grade.returnForRevision ? '#F59E0B' : '#10B981', 
                                '&:hover': { bgcolor: grade.returnForRevision ? '#D97706' : '#059669' } 
                            }}>
                            {grade.returnForRevision ? 'Вернуть' : 'Проверить'}
                        </StyledButton>
                    )}
                </DialogActions>
            </StyledDialog>
        </PageContainer>
    );
}

export default Homework;