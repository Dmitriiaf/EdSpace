// ========== frontend/src/pages/WeeklyScheduleNew.js (v3 — UnifiedSchedule) ==========
import React, { useState, useEffect } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import { Add as AddIcon, Work as WorkIcon } from '@mui/icons-material';
import { Checkbox, FormControlLabel } from '@mui/material';
import {
    Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, IconButton, Alert, Chip, Snackbar,
    Avatar, TextField, Autocomplete, Stack, Grid, Divider, Paper
} from '@mui/material';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import { styled } from '@mui/material/styles';
import { formatLessonTime } from '../utils/timezone';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import axiosInstance, { getAllLessons, generateLessons, deleteLesson } from '../services/api';
import UnifiedSchedule from '../components/UnifiedSchedule';
import { format, addDays, startOfWeek, addMinutes, parse } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== КОНСТАНТЫ ==========
const DAYS = [
    { id: 1, name: 'ПН' }, { id: 2, name: 'ВТ' }, { id: 3, name: 'СР' },
    { id: 4, name: 'ЧТ' }, { id: 5, name: 'ПТ' }, { id: 6, name: 'СБ' }, { id: 7, name: 'ВС' }
];

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function WeeklySchedule() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Расписание'; }, []);
    const { getStudentRateForTutor } = useStudentRate();
    
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [lessons, setLessons] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    // Диалоги
    const [openResurrectDialog, setOpenResurrectDialog] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [resurrectForm, setResurrectForm] = useState({
        date: new Date(), startTime: '10:00', duration: 60, courseId: ''
    });
    const [openTemplateDialog, setOpenTemplateDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [templateForm, setTemplateForm] = useState({
        studentId: '', courseId: '', dayOfWeek: 1, startTime: '10:00', endTime: '11:00'
    });
    const [openSingleLesson, setOpenSingleLesson] = useState(false);
    const [singleLesson, setSingleLesson] = useState({
        studentId: '', courseId: '', date: new Date(), time: '10:00',
        isTrial: false, trialName: '', trialEmail: '', trialPrice: 0
    });

    useEffect(() => {
        if (user && user.id) { fetchData(); fetchDebtors(); }
    }, [user, currentWeekOffset]);

    // ========== ЗАГРУЗКА ДАННЫХ ==========
    const fetchData = async () => {
        if (!user || !user.id) { setError('Ошибка авторизации'); setLoading(false); return; }
        try {
            setLoading(true); setError(null);
            const lessonsData = await getAllLessons(user.id);
            const lessonsArray = lessonsData.data !== undefined ? lessonsData.data : lessonsData;
            const [templatesRes, studentsRes, coursesRes] = await Promise.all([
                axiosInstance.get(`/weekly-template/tutor/${user.id}`),
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/courses/tutor/${user.id}`)
            ]);
            setTemplates(templatesRes.data || []);
            setLessons(Array.isArray(lessonsArray) ? lessonsArray : []);
            setStudents(studentsRes.data || []);
            setCourses(coursesRes.data || []);
        } catch (err) {
            setError('Ошибка загрузки данных: ' + (err.response?.data?.message || err.message));
        } finally { setLoading(false); }
    };

    const fetchDebtors = async () => {
        try {
            const [studentsRes, subscriptionsRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/subscriptions/tutor/${user.id}`)
            ]);
            const studentsData = studentsRes.data || [];
            const subscriptionsData = subscriptionsRes.data || [];
            const debtorsList = studentsData
                .filter(s => s.paymentType === 'subscription')
                .filter(s => {
                    const activeSub = subscriptionsData.find(
                        sub => sub.student?.id === s.id && 
                            (sub.status === 'ACTIVE' || sub.status === 'active') && 
                            sub.debtLessons > 0
                    );
                    return !!activeSub;
                })
                .map(s => {
                    const activeSub = subscriptionsData.find(
                        sub => sub.student?.id === s.id && 
                            (sub.status === 'ACTIVE' || sub.status === 'active')
                    );
                    return { ...s, debtLessons: activeSub?.debtLessons || 0 };
                });
            setDebtors(debtorsList);
        } catch (err) { console.error('Ошибка загрузки должников:', err); }
    };

    // ========== НАВИГАЦИЯ ==========
    const goToPreviousWeek = () => setCurrentWeekOffset(prev => prev - 1);
    const goToNextWeek = () => setCurrentWeekOffset(prev => prev + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    const getWeekDates = () => {
        const today = new Date();
        const targetDate = addDays(today, currentWeekOffset * 7);
        const monday = startOfWeek(targetDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    };

    // ========== ДЕЙСТВИЯ ==========
    const handleGenerateLessons = async () => {
        try { 
            await generateLessons(); 
            showSnackbar('✅ Занятия созданы на месяц вперёд', 'success'); 
            fetchData(); 
        } catch (err) { 
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); 
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Удалить занятие?')) return;
        try { 
            await deleteLesson(lessonId); 
            showSnackbar('Занятие удалено', 'success'); 
            fetchData(); 
        } catch (err) { 
            showSnackbar('Ошибка', 'error'); 
        }
    };

    const handleOpenResurrect = (student) => {
        setSelectedDebtor(student);
        setResurrectForm({ date: new Date(), startTime: '10:00', duration: 60, courseId: '' });
        setOpenResurrectDialog(true);
    };

    const handleSaveResurrect = async () => {
        if (!selectedDebtor) return;
        try {
            const dateStr = format(resurrectForm.date, 'yyyy-MM-dd');
            const startTime = resurrectForm.startTime + ':00';
            const endTime = addMinutes(parse(resurrectForm.startTime, 'HH:mm', new Date()), resurrectForm.duration);
            const response = await axiosInstance.post('/lessons/resurrect', {
                studentId: selectedDebtor.id,
                newDate: dateStr,
                newStartTime: startTime,
                newEndTime: format(endTime, 'HH:mm:ss')
            });
            showSnackbar(response.data.message || '✅ Занятие создано', 'success');
            setOpenResurrectDialog(false);
            fetchData();
            fetchDebtors();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleAddClick = (dayId, timeSlot) => {
        setEditingTemplate(null);
        setTemplateForm({ 
            studentId: '', courseId: '', dayOfWeek: dayId, 
            startTime: timeSlot, 
            endTime: (parseInt(timeSlot.split(':')[0]) + 1).toString().padStart(2, '0') + ':00' 
        });
        setOpenTemplateDialog(true);
    };

    const handleEditTemplate = (template) => {
        if (!template) return;
        setEditingTemplate(template);
        setTemplateForm({ 
            studentId: template.student?.id || '', 
            courseId: template.course?.id || '', 
            dayOfWeek: template.dayOfWeek, 
            startTime: formatLessonTime('2026-01-01', template.startTime) || '10:00', 
            endTime: formatLessonTime('2026-01-01', template.endTime) || '11:00'
        });
        setOpenTemplateDialog(true);
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Удалить шаблон?')) return;
        try { 
            await axiosInstance.delete(`/weekly-template/${id}`); 
            showSnackbar('Шаблон удалён', 'success'); 
            fetchData(); 
        } catch (err) { 
            showSnackbar('Ошибка', 'error'); 
        }
    };

    const handleSaveTemplate = async () => {
        if (!user || !user.id) { showSnackbar('Ошибка: пользователь не авторизован', 'error'); return; }
        try {
            const data = { 
                tutorId: user.id, 
                studentId: templateForm.studentId, 
                courseId: templateForm.courseId || null, 
                dayOfWeek: templateForm.dayOfWeek, 
                startTime: templateForm.startTime + ':00', 
                endTime: templateForm.endTime + ':00' 
            };
            if (editingTemplate) { 
                await axiosInstance.put(`/weekly-template/${editingTemplate.id}`, data); 
                showSnackbar('Шаблон обновлён', 'success'); 
            } else { 
                await axiosInstance.post('/weekly-template', data); 
                showSnackbar('Шаблон добавлен', 'success'); 
            }
            setOpenTemplateDialog(false); 
            fetchData();
        } catch (err) { 
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); 
        }
    };

    const handleCreateSingleLesson = async () => {
        if (!singleLesson.time) return;
        if (!singleLesson.isTrial && !singleLesson.studentId) return;
        if (singleLesson.isTrial && !singleLesson.trialName) return;
        
        try {
            const payload = {
                tutorId: user.id,
                lessonDate: format(singleLesson.date, 'yyyy-MM-dd'),
                startTime: singleLesson.time + ':00',
                endTime: (parseInt(singleLesson.time.split(':')[0]) + 1).toString().padStart(2, '0') + ':00:00'
            };

            if (singleLesson.isTrial) {
                payload.trialName = singleLesson.trialName;
                payload.trialEmail = singleLesson.trialEmail || '';
                payload.trialPrice = singleLesson.trialPrice || 0;
                payload.isTrial = true;
            } else {
                payload.studentId = parseInt(singleLesson.studentId);
                payload.courseId = singleLesson.courseId ? parseInt(singleLesson.courseId) : null;
            }

            await axiosInstance.post('/lessons', payload);
            setOpenSingleLesson(false);
            setSingleLesson({ studentId: '', courseId: '', date: new Date(), time: '10:00', isTrial: false, trialName: '', trialEmail: '', trialPrice: 0 });
            fetchData();
            showSnackbar(singleLesson.isTrial ? '✅ Пробное занятие создано' : '✅ Разовое занятие создано', 'success');
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    // ========== ВЫЧИСЛЕНИЯ ==========
    const weekDates = getWeekDates();
    const isCurrentWeek = currentWeekOffset === 0;
    const weekDateStr = weekDates[0] && weekDates[6] 
        ? `${format(weekDates[0], 'd MMM', { locale: ru })} – ${format(weekDates[6], 'd MMM yyyy', { locale: ru })}` 
        : '';

    const getDailyIncome = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLessons = lessons.filter(l => l.lessonDate === dateStr);
        let total = 0;
        dayLessons.forEach(l => { 
            if (l.status === 'PAID' && l.student?.paymentType !== 'subscription') 
                total += getStudentRateForTutor(l.student, user?.id) || 0; 
        });
        return total;
    };

    const totalIncome = (() => { 
        let total = 0; 
        weekDates.forEach(date => total += getDailyIncome(date)); 
        return total; 
    })();

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка расписания..." />
            </Box>
        </PageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
                {/* ========== ЗАГОЛОВОК ========== */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                    <Box data-tour="schedule-page">
                        <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                            Расписание
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            Управление занятиями и расписанием на неделю
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Кнопки перенесены в UnifiedSchedule */}
                    </Box>
                </Box>

                {/* ========== НАВИГАЦИЯ ПО НЕДЕЛЕ ========== */}
                <Paper sx={{ 
                    p: 2, mb: 2, borderRadius: '12px', 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    flexWrap: 'wrap', gap: 2,
                    backgroundColor: '#FFFFFF',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton size="small" onClick={goToPreviousWeek} sx={{ color: '#374151', '&:hover': { bgcolor: '#F3F4F6' } }}>←</IconButton>
                        <Typography sx={{ mx: 1, fontWeight: 500, color: '#1F2937', fontSize: '15px' }}>{weekDateStr}</Typography>
                        <IconButton size="small" onClick={goToNextWeek} sx={{ color: '#374151', '&:hover': { bgcolor: '#F3F4F6' } }}>→</IconButton>
                        {!isCurrentWeek && (
                            <StyledButton size="small" variant="outlined" onClick={goToCurrentWeek}
                                sx={{ ml: 1, color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                Сегодня
                            </StyledButton>
                        )}
                    </Box>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>
                        {totalIncome.toLocaleString()} ₽
                    </Typography>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 2, borderRadius: '12px' }}>{error}</Alert>}

                {/* ========== ЕДИНЫЙ КАЛЕНДАРЬ ========== */}
                <UnifiedSchedule 
                    weekDates={weekDates}
                    lessons={lessons}
                    students={students}
                    courses={courses}
                    debtors={debtors}
                    user={user}
                    onRefresh={fetchData}
                    onShowSnackbar={showSnackbar}
                    onOpenResurrect={handleOpenResurrect}
                    getStudentRateForTutor={getStudentRateForTutor}
                    templates={templates}
                    onEditTemplate={handleEditTemplate}
                    onDeleteTemplate={handleDeleteTemplate}
                    onDeleteLesson={handleDeleteLesson}
                />

                {/* ========== ДИАЛОГ ШАБЛОНА ========== */}
                <StyledDialog open={openTemplateDialog} onClose={() => setOpenTemplateDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                        {editingTemplate ? 'Редактировать шаблон' : 'Добавить шаблон'}
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                                {DAYS.find(d => d.id === templateForm.dayOfWeek)?.name}, {templateForm.startTime} – {templateForm.endTime}
                            </Typography>
                            <Autocomplete
                                options={students}
                                getOptionLabel={(s) => `${s.fullName} (${getStudentRateForTutor(s, user?.id) || '—'} ₽/час)`}
                                value={students.find(s => s.id === templateForm.studentId) || null}
                                onChange={(e, newValue) => setTemplateForm({...templateForm, studentId: newValue?.id || ''})}
                                renderInput={(params) => (
                                    <TextField {...params} label="Ученик" size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                )}
                                sx={{ mb: 2 }}
                            />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Предмет</InputLabel>
                                <Select value={templateForm.courseId} onChange={(e) => setTemplateForm({...templateForm, courseId: e.target.value})} label="Предмет"
                                    sx={{ borderRadius: '8px' }}>
                                    <MenuItem value="">— Без предмета —</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                                Постоянное занятие будет добавляться в расписание каждую неделю.
                            </Alert>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        {editingTemplate && (
                            <StyledButton onClick={() => handleDeleteTemplate(editingTemplate.id)} 
                                sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEF2F2' } }}>
                                Удалить
                            </StyledButton>
                        )}
                        <StyledButton onClick={() => setOpenTemplateDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleSaveTemplate} variant="contained" disabled={!templateForm.studentId}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            {editingTemplate ? 'Сохранить' : 'Добавить'}
                        </StyledButton>
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ ОТРАБОТКИ ДОЛГА ========== */}
                <StyledDialog open={openResurrectDialog} onClose={() => setOpenResurrectDialog(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
                    <Box sx={{ background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)', p: 3, color: '#fff' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <WorkIcon sx={{ color: '#fff' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>Отработать пропущенное занятие</Typography>
                                <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>Создать занятие для списания долга</Typography>
                            </Box>
                        </Box>
                    </Box>
                    <DialogContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 1.5, color: '#374151' }}>👤 Ученик-должник</Typography>
                                <Autocomplete
                                    options={debtors}
                                    getOptionLabel={(s) => `${s.fullName} (долг: ${s.debtLessons || 0} занятий)`}
                                    value={debtors.find(s => s.id === selectedDebtor?.id) || null}
                                    onChange={(e, newValue) => { if (newValue) setSelectedDebtor(newValue); }}
                                    renderInput={(params) => (
                                        <TextField {...params} label="Выберите должника" placeholder="Начните вводить имя..."
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                    )}
                                />
                            </Paper>
                            <Divider sx={{ borderColor: '#F3F4F6' }} />
                            <DatePicker label="Дата отработки" value={resurrectForm.date}
                                onChange={(newDate) => setResurrectForm({...resurrectForm, date: newDate})}
                                minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } } } }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Время начала" type="time" value={resurrectForm.startTime}
                                        onChange={(e) => setResurrectForm({...resurrectForm, startTime: e.target.value})}
                                        InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Длительность</InputLabel>
                                        <Select value={resurrectForm.duration} onChange={(e) => setResurrectForm({...resurrectForm, duration: e.target.value})} label="Длительность"
                                            sx={{ borderRadius: '12px', bgcolor: '#fff' }}>
                                            <MenuItem value={30}>30 минут</MenuItem>
                                            <MenuItem value={45}>45 минут</MenuItem>
                                            <MenuItem value={60}>1 час</MenuItem>
                                            <MenuItem value={90}>1,5 часа</MenuItem>
                                            <MenuItem value={120}>2 часа</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            <FormControl fullWidth>
                                <InputLabel>Предмет</InputLabel>
                                <Select value={resurrectForm.courseId} onChange={(e) => setResurrectForm({...resurrectForm, courseId: e.target.value})} label="Предмет"
                                    sx={{ borderRadius: '12px', bgcolor: '#fff' }}>
                                    <MenuItem value="">— Без предмета —</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Alert severity="success" sx={{ borderRadius: '12px', fontSize: '13px' }}>
                                ✅ При создании занятия долг автоматически уменьшится на 1.
                            </Alert>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Button onClick={() => setOpenResurrectDialog(false)} sx={{ borderRadius: '12px', color: '#6B7280' }}>Отмена</Button>
                        <Button variant="contained" onClick={handleSaveResurrect} disabled={!selectedDebtor || !resurrectForm.startTime}
                            startIcon={<WorkIcon />}
                            sx={{ bgcolor: '#059669', borderRadius: '12px', px: 4, fontWeight: 600, '&:hover': { bgcolor: '#047857' } }}>
                            Создать занятие
                        </Button>
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ РАЗОВОГО ЗАНЯТИЯ ========== */}
                <StyledDialog open={openSingleLesson} onClose={() => setOpenSingleLesson(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
                    <Box sx={{ 
                        background: singleLesson.isTrial 
                            ? 'linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)' 
                            : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                        p: 3, color: '#fff'
                    }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box sx={{ width: 44, height: 44, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {singleLesson.isTrial ? '🎯' : '📅'}
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
                                    {singleLesson.isTrial ? 'Пробное занятие' : 'Разовое занятие'}
                                </Typography>
                                <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>
                                    {singleLesson.isTrial ? 'Для нового ученика' : 'Одно занятие на выбранную дату'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>
                    <DialogContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            <FormControlLabel
                                control={
                                    <Checkbox checked={singleLesson.isTrial || false} 
                                        onChange={(e) => setSingleLesson({ ...singleLesson, isTrial: e.target.checked, studentId: '', courseId: '', trialName: '', trialEmail: '', trialPrice: 0 })} 
                                        sx={{ color: '#7C3AED', '&.Mui-checked': { color: '#7C3AED' } }} />
                                }
                                label={<Typography sx={{ fontWeight: 500, fontSize: '14px' }}>Пробное занятие (новый ученик)</Typography>}
                            />
                            {singleLesson.isTrial ? (
                                <>
                                    <TextField fullWidth label="Имя ученика" value={singleLesson.trialName || ''}
                                        onChange={(e) => setSingleLesson({ ...singleLesson, trialName: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                    <TextField fullWidth label="Email ученика" value={singleLesson.trialEmail || ''}
                                        onChange={(e) => setSingleLesson({ ...singleLesson, trialEmail: e.target.value })}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                    <TextField fullWidth label="Стоимость (₽)" type="number" value={singleLesson.trialPrice || 0}
                                        onChange={(e) => setSingleLesson({ ...singleLesson, trialPrice: Number(e.target.value) })}
                                        helperText="0 — бесплатное пробное занятие"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                </>
                            ) : (
                                <>
                                    <Autocomplete
                                        options={students}
                                        getOptionLabel={(s) => `${s.fullName} (${getStudentRateForTutor(s, user?.id) || '—'} ₽)`}
                                        value={students.find(s => s.id === singleLesson.studentId) || null}
                                        onChange={(e, newValue) => setSingleLesson({ ...singleLesson, studentId: newValue?.id || '' })}
                                        renderInput={(params) => (
                                            <TextField {...params} label="Ученик" placeholder="Начните вводить имя..."
                                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                        )} />
                                    <FormControl fullWidth>
                                        <InputLabel>Предмет</InputLabel>
                                        <Select value={singleLesson.courseId} onChange={(e) => setSingleLesson({ ...singleLesson, courseId: e.target.value })} label="Предмет"
                                            sx={{ borderRadius: '12px', bgcolor: '#fff' }}>
                                            <MenuItem value="">Без предмета</MenuItem>
                                            {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </>
                            )}
                            <Divider sx={{ borderColor: '#F3F4F6' }} />
                            <DatePicker label="Дата занятия" value={singleLesson.date} 
                                onChange={(d) => setSingleLesson({ ...singleLesson, date: d })} minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } } } }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField fullWidth label="Время начала" type="time" value={singleLesson.time}
                                        onChange={(e) => setSingleLesson({ ...singleLesson, time: e.target.value })}
                                        InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Длительность</InputLabel>
                                        <Select value={singleLesson.duration || 60} 
                                            onChange={(e) => setSingleLesson({ ...singleLesson, duration: Number(e.target.value) })} 
                                            label="Длительность"
                                            sx={{ borderRadius: '12px', bgcolor: '#fff' }}>
                                            <MenuItem value={30}>30 минут</MenuItem>
                                            <MenuItem value={45}>45 минут</MenuItem>
                                            <MenuItem value={60}>1 час</MenuItem>
                                            <MenuItem value={90}>1,5 часа</MenuItem>
                                            <MenuItem value={120}>2 часа</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            <Alert severity="info" sx={{ borderRadius: '12px', fontSize: '13px' }}>
                                {singleLesson.isTrial 
                                    ? 'Пробное занятие — ученик будет создан автоматически.'
                                    : 'Занятие будет добавлено в расписание на выбранную дату.'}
                            </Alert>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Button onClick={() => setOpenSingleLesson(false)} sx={{ borderRadius: '12px', color: '#6B7280' }}>Отмена</Button>
                        <Button variant="contained" onClick={handleCreateSingleLesson}
                            disabled={singleLesson.isTrial ? (!singleLesson.trialName || !singleLesson.time) : (!singleLesson.studentId || !singleLesson.time)}
                            sx={{ bgcolor: singleLesson.isTrial ? '#7C3AED' : '#4F46E5', borderRadius: '12px', px: 4, fontWeight: 600,
                                '&:hover': { bgcolor: singleLesson.isTrial ? '#6D28D9' : '#4338CA' } }}>
                            {singleLesson.isTrial ? 'Создать пробное' : 'Создать занятие'}
                        </Button>
                    </DialogActions>
                </StyledDialog>

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })} sx={{ borderRadius: '8px' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </PageContainer>
        </LocalizationProvider>
    );
}

export default WeeklySchedule;