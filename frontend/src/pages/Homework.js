import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Chip, Grid, Tabs, Tab,
    Paper, IconButton, Rating, Avatar, LinearProgress,
    FormControlLabel, Checkbox
} from '@mui/material';
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
    Circle as CircleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format, isAfter, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

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

    const getStatusLabel = (status) => {
        const map = { 'ASSIGNED': 'Назначено', 'SUBMITTED': 'Сдано', 'CHECKED': 'Проверено', 'RETURNED': 'Доработка' };
        return map[(status || '').toUpperCase()] || status;
    };

    const getStatusColor = (status) => {
        const map = { 'ASSIGNED': 'info', 'SUBMITTED': 'warning', 'CHECKED': 'success', 'RETURNED': 'error' };
        return map[(status || '').toUpperCase()] || 'default';
    };

    const getStatusGradient = (status) => {
        const map = {
            'ASSIGNED': 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            'SUBMITTED': 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            'CHECKED': 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            'RETURNED': 'linear-gradient(135deg, #FEF2F2 0%, #FEE2E2 100%)'
        };
        return map[(status || '').toUpperCase()] || 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)';
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
    );

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto', bgcolor: '#0F172A', minHeight: '100vh', borderRadius: { md: 4 }, mt: { md: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#F1F5F9', letterSpacing: '-0.5px' }}>
                        {isTutor ? 'Домашние задания' : 'Мои задания'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94A3B8', mt: 0.5 }}>
                        {isTutor ? 'Управляйте домашними заданиями учеников' : 'Ваши активные и проверенные задания'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadHomework}
                        sx={{ color: '#94A3B8', borderColor: '#334155', borderRadius: 2, textTransform: 'none', '&:hover': { borderColor: '#6366F1', color: '#6366F1' } }}>
                        Обновить
                    </Button>
                    {isTutor && (
                        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpenAssign(true)}
                            sx={{ bgcolor: '#6366F1', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#4F46E5' } }}>
                            Назначить ДЗ
                        </Button>
                    )}
                </Box>
            </Box>

            {isTutor && (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                        { label: 'Всего заданий', value: stats.total, icon: AssignmentIcon, gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
                        { label: 'На проверке', value: stats.submitted, icon: ReviewIcon, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
                        { label: 'Проверено', value: stats.checked, icon: CheckIcon, gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
                        { label: 'Средний балл', value: `${stats.avgGrade}/5`, icon: GradeIcon, gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Grid item xs={6} md={3} key={i}>
                                <Card sx={{ bgcolor: '#1E293B', borderRadius: 3, border: '1px solid #334155', backdropFilter: 'blur(10px)', transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)' } }}>
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h4" sx={{ fontWeight: 800, background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>{stat.label}</Typography>
                                            </Box>
                                            <Box sx={{ width: 42, height: 42, borderRadius: 2, background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.15 }}>
                                                <Icon sx={{ color: 'white', fontSize: 20 }} />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError(null)}>{error}</Alert>}

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 3, '& .MuiTab-root': { color: '#64748B', textTransform: 'none', fontWeight: 500, '&.Mui-selected': { color: '#6366F1' } }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1' } }}>
                <Tab label={`Все (${homeworkList.length})`} />
                <Tab label="Назначено" />
                <Tab label={`Сдано (${stats.submitted})`} />
                <Tab label={`Проверено (${stats.checked})`} />
                <Tab label="Доработка" />
            </Tabs>

            {filteredHomework().length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 10 }}>
                    <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#1E293B', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
                        <AssignmentIcon sx={{ fontSize: 36, color: '#475569' }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: '#94A3B8', fontWeight: 500 }}>{isTutor ? 'Нет заданий' : 'У вас пока нет заданий'}</Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {filteredHomework().map(hw => {
                        const overdue = isOverdue(hw);
                        return (
                            <Grid item xs={12} sm={6} md={6} lg={4} key={hw.id}>
                                <Card sx={{
                                    bgcolor: '#1E293B', borderRadius: 3, border: '1px solid #334155',
                                    backdropFilter: 'blur(10px)', transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(0,0,0,0.4)', borderColor: '#6366F1' }
                                }}>
                                    <CardContent sx={{ p: 2.5, pb: 1.5 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Chip label={getStatusLabel(hw.status)} size="small"
                                                sx={{ bgcolor: getStatusColor(hw.status) === 'success' ? '#065F46' : getStatusColor(hw.status) === 'warning' ? '#92400E' : getStatusColor(hw.status) === 'error' ? '#991B1B' : '#1E3A5F', color: getStatusColor(hw.status) === 'success' ? '#6EE7B7' : getStatusColor(hw.status) === 'warning' ? '#FCD34D' : getStatusColor(hw.status) === 'error' ? '#FCA5A5' : '#93C5FD', fontWeight: 600, borderRadius: 1.5 }} />
                                            {overdue && <Chip label="Просрочено" size="small" icon={<CalendarIcon sx={{ fontSize: 14 }} />} sx={{ bgcolor: '#7F1D1D', color: '#FCA5A5', fontWeight: 600, borderRadius: 1.5 }} />}
                                        </Box>
                                        {isTutor && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#6366F1', fontSize: 14, fontWeight: 700 }}>
                                                    {hw.student?.fullName?.charAt(0) || 'У'}
                                                </Avatar>
                                                <Typography variant="subtitle2" sx={{ color: '#E2E8F0', fontWeight: 600 }}>
                                                    {hw.student?.fullName || 'Ученик'}
                                                </Typography>
                                            </Box>
                                        )}
                                        <Typography variant="body2" sx={{ color: '#CBD5E1', lineHeight: 1.5, mb: 2 }}
                                            style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                            {hw.task}
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                <CalendarIcon sx={{ fontSize: 14, color: overdue ? '#EF4444' : '#64748B' }} />
                                                <Typography variant="caption" sx={{ color: overdue ? '#EF4444' : '#94A3B8' }}>
                                                    {hw.dueDate ? format(new Date(hw.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                </Typography>
                                            </Box>
                                            {hw.grade != null && (
                                                <Chip
                                                    label={hw.gradeType === 'GRADE_100' ? `${hw.score || hw.grade}/100` : hw.gradeType === 'GRADE_10' ? `${hw.score || hw.grade}/10` : `⭐ ${hw.grade}/5`}
                                                    size="small"
                                                    sx={{ bgcolor: '#065F46', color: '#6EE7B7', fontWeight: 600, borderRadius: 1.5, fontSize: '0.7rem' }} />
                                            )}
                                        </Box>
                                    </CardContent>
                                    <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            {isTutor && (hw.status || '').toUpperCase() === 'SUBMITTED' && (
                                                <Button size="small" variant="contained" startIcon={<CheckIcon />}
                                                    onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                    sx={{ bgcolor: '#10B981', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#059669' } }}>
                                                    Проверить
                                                </Button>
                                            )}
                                            {isTutor && (hw.status || '').toUpperCase() === 'CHECKED' && (
                                                <Button size="small" variant="outlined" startIcon={<ReviewIcon />}
                                                    onClick={() => { setSelectedHomework(hw); setOpenCheck(true); }}
                                                    sx={{ borderRadius: 2, textTransform: 'none', color: '#94A3B8', borderColor: '#334155' }}>
                                                    Посмотреть
                                                </Button>
                                            )}
                                            {!isTutor && ((hw.status || '').toUpperCase() === 'ASSIGNED' || (hw.status || '').toUpperCase() === 'RETURNED') && (
                                                <Button size="small" variant="contained" startIcon={<SendIcon />}
                                                    onClick={() => { setSelectedHomework(hw); setSubmission(''); setFileToUpload(null); setOpenSubmit(true); }}
                                                    sx={{ bgcolor: '#6366F1', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
                                                    Сдать
                                                </Button>
                                            )}
                                        </Box>
                                        {isTutor && (
                                            <IconButton size="small" onClick={() => handleDelete(hw.id)} sx={{ color: '#64748B', '&:hover': { color: '#EF4444' } }}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Диалог назначения ДЗ */}
            {isTutor && (
                <Dialog open={openAssign} onClose={() => setOpenAssign(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1E293B', color: '#F1F5F9', borderRadius: 3, border: '1px solid #334155' } }}>
                    <DialogTitle sx={{ fontWeight: 600 }}>Назначить домашнее задание</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ color: '#94A3B8' }}>Ученик</InputLabel>
                                <Select value={newHomework.studentId} onChange={(e) => setNewHomework({ ...newHomework, studentId: e.target.value })} label="Ученик"
                                    sx={{ color: '#F1F5F9', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}>
                                    {students.map(s => (<MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Задание" multiline rows={4} value={newHomework.task}
                                onChange={(e) => setNewHomework({ ...newHomework, task: e.target.value })}
                                placeholder="Текст задания или ссылка на вариант" sx={{ mb: 1 }}
                                InputProps={{ sx: { color: '#F1F5F9' } }} InputLabelProps={{ sx: { color: '#94A3B8' } }} />
                            <Button size="small" variant="outlined" onClick={() => setOpenBankPicker(true)}
                                sx={{ mb: 2, color: '#94A3B8', borderColor: '#334155', textTransform: 'none', borderRadius: 2 }}>
                                📋 Выбрать из банка заданий
                            </Button>
                            <TextField fullWidth label="Срок сдачи" type="date" value={newHomework.dueDate}
                                onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })}
                                InputLabelProps={{ shrink: true, sx: { color: '#94A3B8' } }} sx={{ mb: 2 }} />
                            <FormControl fullWidth>
                                <InputLabel sx={{ color: '#94A3B8' }}>Шкала оценивания</InputLabel>
                                <Select value={newHomework.gradeType || 'GRADE_5'} onChange={(e) => setNewHomework({ ...newHomework, gradeType: e.target.value })} label="Шкала оценивания"
                                    sx={{ color: '#F1F5F9', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#334155' } }}>
                                    <MenuItem value="GRADE_5">5-балльная (1-5) ⭐</MenuItem>
                                    <MenuItem value="GRADE_10">10-балльная (1-10)</MenuItem>
                                    <MenuItem value="GRADE_100">100-балльная (0-100)</MenuItem>
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2 }}>
                        <Button onClick={() => setOpenAssign(false)} sx={{ color: '#94A3B8' }}>Отмена</Button>
                        <Button onClick={handleAssign} variant="contained" disabled={!newHomework.studentId || !newHomework.task}
                            sx={{ bgcolor: '#6366F1', borderRadius: 2, '&:hover': { bgcolor: '#4F46E5' } }}>Назначить</Button>
                    </DialogActions>
                </Dialog>
            )}

            {/* Модалка банка */}
            <Dialog open={openBankPicker} onClose={() => setOpenBankPicker(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#1E293B', color: '#F1F5F9', borderRadius: 3, border: '1px solid #334155' } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>Выбрать из банка заданий</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Tabs value={bankTab} onChange={(e, v) => setBankTab(v)} sx={{ mb: 2, '& .MuiTab-root': { color: '#64748B', textTransform: 'none', '&.Mui-selected': { color: '#6366F1' } }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1' } }}>
                            <Tab label="Задания" /><Tab label="Варианты" />
                        </Tabs>
                        {bankLoading ? <CircularProgress /> : (
                            <Grid container spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                                {(bankTab === 0 ? bankTasks : bankVariants).map(item => (
                                    <Grid item xs={12} key={item.id}>
                                        <Paper sx={{ p: 1.5, bgcolor: '#0F172A', borderRadius: 2, border: '1px solid #334155', cursor: 'pointer', '&:hover': { borderColor: '#6366F1' } }}
                                            onClick={() => { setNewHomework({ ...newHomework, task: item.question || item.topic || item.url || item.title }); setOpenBankPicker(false); }}>
                                            <Typography variant="body2" sx={{ color: '#CBD5E1' }}>{item.question || item.topic || item.title}</Typography>
                                            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                {item.subject && <Chip label={item.subject} size="small" sx={{ bgcolor: '#1E3A5F', color: '#93C5FD', height: 18, fontSize: '0.6rem' }} />}
                                                {item.examType && <Chip label={item.examType} size="small" sx={{ bgcolor: '#1E3A5F', color: '#93C5FD', height: 18, fontSize: '0.6rem' }} />}
                                            </Box>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions><Button onClick={() => setOpenBankPicker(false)} sx={{ color: '#94A3B8' }}>Отмена</Button></DialogActions>
            </Dialog>

            {/* Диалог сдачи */}
            <Dialog open={openSubmit} onClose={() => setOpenSubmit(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1E293B', color: '#F1F5F9', borderRadius: 3, border: '1px solid #334155' } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>Сдать задание</DialogTitle>
                <DialogContent>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            <Paper sx={{ p: 2, bgcolor: '#0F172A', mb: 2, borderRadius: 2, border: '1px solid #334155' }}>
                                <Typography variant="caption" sx={{ color: '#94A3B8' }}>Задание:</Typography>
                                <Typography variant="body2" sx={{ mt: 0.5, color: '#CBD5E1' }}>{selectedHomework.task}</Typography>
                            </Paper>
                            <TextField fullWidth label="Ваш ответ" multiline rows={5} value={submission} onChange={(e) => setSubmission(e.target.value)}
                                placeholder="Введите ответ..." sx={{ mb: 2 }} InputProps={{ sx: { color: '#F1F5F9' } }} InputLabelProps={{ sx: { color: '#94A3B8' } }} />
                            <Button variant="outlined" component="label" startIcon={<UploadIcon />}
                                sx={{ color: '#94A3B8', borderColor: '#334155', borderRadius: 2, textTransform: 'none' }}>
                                {fileToUpload ? fileToUpload.name : 'Прикрепить файл'}
                                <input type="file" hidden onChange={(e) => setFileToUpload(e.target.files[0])} />
                            </Button>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenSubmit(false)} sx={{ color: '#94A3B8' }}>Отмена</Button>
                    <Button onClick={handleSubmit} variant="contained" disabled={!submission && !fileToUpload}
                        sx={{ bgcolor: '#6366F1', borderRadius: 2 }}>Отправить</Button>
                </DialogActions>
            </Dialog>

            {/* Check Dialog */}
            <Dialog open={openCheck} onClose={() => setOpenCheck(false)} maxWidth="md" fullWidth PaperProps={{ sx: { bgcolor: '#1E293B', color: '#F1F5F9', borderRadius: 3, border: '1px solid #334155' } }}>
                <DialogTitle sx={{ fontWeight: 600 }}>
                    {selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Просмотр' : 'Проверить'} — {selectedHomework?.student?.fullName}
                </DialogTitle>
                <DialogContent>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, bgcolor: '#0F172A', borderRadius: 2, border: '1px solid #334155', height: '100%' }}>
                                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>Задание:</Typography>
                                        <Typography variant="body2" sx={{ mt: 0.5, color: '#CBD5E1', whiteSpace: 'pre-wrap' }}>{selectedHomework.task}</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2, bgcolor: '#0F172A', borderRadius: 2, border: '1px solid #1E3A5F', height: '100%' }}>
                                        <Typography variant="caption" sx={{ color: '#94A3B8' }}>Ответ ученика:</Typography>
                                        {selectedHomework.attachments ? (
                                            <Box sx={{ mt: 0.5 }}>
                                                {selectedHomework.attachments.split('\n').map((line, i) => {
                                                    if (line.startsWith('/uploads/')) {
                                                        return (
                                                            <Button key={i} size="small" variant="outlined"
                                                                href={`https://ed-space.ru/api/homework/file/${line.replace('/uploads/homework/', '')}`} target="_blank"
                                                                sx={{ mr: 1, mb: 1, color: '#93C5FD', borderColor: '#1E3A5F', borderRadius: 2, textTransform: 'none' }}>
                                                                📎 {line.split('/').pop()}
                                                            </Button>
                                                        );
                                                    }
                                                    return <Typography key={i} variant="body2" sx={{ color: '#CBD5E1', whiteSpace: 'pre-wrap' }}>{line}</Typography>;
                                                })}
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" sx={{ color: '#64748B' }}>Нет ответа</Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>

                            {selectedHomework?.status?.toUpperCase() === 'CHECKED' && selectedHomework.grade != null && (
                                <Box sx={{ mt: 3, p: 2, bgcolor: '#065F46', borderRadius: 2 }}>
                                    <Typography variant="subtitle2" sx={{ color: '#6EE7B7', fontWeight: 600 }}>
                                        Оценка: {selectedHomework.gradeType === 'GRADE_100' ? `${selectedHomework.score || selectedHomework.grade}/100` : selectedHomework.gradeType === 'GRADE_10' ? `${selectedHomework.score || selectedHomework.grade}/10` : `⭐ ${selectedHomework.grade}/5`}
                                    </Typography>
                                    {selectedHomework.feedback && (
                                        <Typography variant="body2" sx={{ color: '#A7F3D0', mt: 1 }}>
                                            {selectedHomework.feedback}
                                        </Typography>
                                    )}
                                </Box>
                            )}

                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <>
                                    <Box sx={{ mt: 3 }}>
                                        <Typography variant="subtitle2" sx={{ color: '#E2E8F0', fontWeight: 600, mb: 1 }}>Оценка</Typography>
                                        {selectedHomework?.gradeType === 'GRADE_100' ? (
                                            <TextField type="number" label="Баллы (0-100)" value={grade.grade || ''}
                                                onChange={(e) => setGrade({ ...grade, grade: parseInt(e.target.value) || 0 })}
                                                sx={{ mb: 1 }} InputProps={{ sx: { color: '#F1F5F9' } }} InputLabelProps={{ sx: { color: '#94A3B8' } }}
                                                inputProps={{ min: 0, max: 100 }} />
                                        ) : selectedHomework?.gradeType === 'GRADE_10' ? (
                                            <TextField type="number" label="Баллы (1-10)" value={grade.grade || ''}
                                                onChange={(e) => setGrade({ ...grade, grade: parseInt(e.target.value) || 0 })}
                                                sx={{ mb: 1 }} InputProps={{ sx: { color: '#F1F5F9' } }} InputLabelProps={{ sx: { color: '#94A3B8' } }}
                                                inputProps={{ min: 1, max: 10 }} />
                                        ) : (
                                            <Rating value={grade.grade} onChange={(e, v) => setGrade({ ...grade, grade: v })} max={5} size="large" sx={{ mb: 1 }} />
                                        )}
                                    </Box>
                                    <TextField fullWidth label="Комментарий" multiline rows={3} value={grade.feedback}
                                        onChange={(e) => setGrade({ ...grade, feedback: e.target.value })}
                                        placeholder="Что хорошо, что исправить..." sx={{ mt: 2 }}
                                        InputProps={{ sx: { color: '#F1F5F9' } }} InputLabelProps={{ sx: { color: '#94A3B8' } }} />
                                    <FormControlLabel control={<Checkbox checked={grade.returnForRevision} onChange={(e) => setGrade({ ...grade, returnForRevision: e.target.checked })} sx={{ color: '#6366F1' }} />}
                                        label="Вернуть на доработку" sx={{ mt: 1, color: '#94A3B8' }} />
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenCheck(false)} sx={{ color: '#94A3B8' }}>
                        {selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Закрыть' : 'Отмена'}
                    </Button>
                    {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                        <Button onClick={handleCheck} variant="contained" color={grade.returnForRevision ? 'warning' : 'success'}
                            startIcon={grade.returnForRevision ? <ReplayIcon /> : <CheckIcon />} sx={{ borderRadius: 2 }}>
                            {grade.returnForRevision ? 'Вернуть' : 'Проверить'}
                        </Button>
                    )}
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Homework;