// ========== frontend/src/pages/WeeklyScheduleNew.js ==========
import React, { useState, useEffect } from 'react';
import { Delete, Edit, Refresh as RefreshIcon, ViewList as ListIcon, CalendarToday as CalendarIcon, Work as WorkIcon } from '@mui/icons-material';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Alert, CircularProgress, Chip, Snackbar,
    Avatar, Card, CardContent, ToggleButton, ToggleButtonGroup,
    TextField
} from '@mui/material';
import { formatLessonTime } from '../utils/timezone';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import axiosInstance, { getAllLessons, generateLessons, deleteLesson } from '../services/api';
import WeekCalendar from '../components/WeekCalendar';
import { format, addDays, startOfWeek, addMinutes, parse } from 'date-fns';
import { ru } from 'date-fns/locale';

const DAYS = [
    { id: 1, name: 'ПН' }, { id: 2, name: 'ВТ' }, { id: 3, name: 'СР' },
    { id: 4, name: 'ЧТ' }, { id: 5, name: 'ПТ' }, { id: 6, name: 'СБ' }, { id: 7, name: 'ВС' }
];

const TIME_SLOTS = [
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    '22:00', '23:00'
];

const STATUS_COLORS = {
    SCHEDULED: { bg: '#FEF7E0', text: '#B45F06', label: 'Запланировано' },
    COMPLETED: { bg: '#FEF3E0', text: '#C4450C', label: 'Проведено (ждёт оплаты)'},
    PAID: { bg: '#E8F5E9', text: '#1B5E20', label: 'Оплачено' },
    CANCELLED: { bg: '#FEF2F2', text: '#C62828', label: 'Отменено' },
    RESCHEDULED: { bg: '#E8F0FE', text: '#1A73E8', label: 'Перенесено' }
};

function WeeklySchedule() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    
    const [viewMode, setViewMode] = useState('table');
    const [templates, setTemplates] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        studentId: '', courseId: '', dayOfWeek: 1, startTime: '10:00', endTime: '11:00'
    });

    const [debtors, setDebtors] = useState([]);
    
    // Диалог для отработки долга
    const [openResurrectDialog, setOpenResurrectDialog] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [resurrectForm, setResurrectForm] = useState({
        date: new Date(),
        startTime: '10:00',
        duration: 60,
        courseId: ''
    });

    useEffect(() => {
        if (user && user.id) {
            fetchData();
            fetchDebtors();
        }
    }, [user, currentWeekOffset]);

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
            
            const debtorsList = studentsData.filter(student => {
                const activeSub = subscriptionsData.find(
                    sub => sub.student?.id === student.id && sub.status === 'active' && sub.debtLessons > 0
                );
                return !!activeSub;
            }).map(student => {
                const activeSub = subscriptionsData.find(
                    sub => sub.student?.id === student.id && sub.status === 'active'
                );
                return {
                    ...student,
                    debtLessons: activeSub?.debtLessons || 0
                };
            });
            
            setDebtors(debtorsList);
        } catch (err) {
            console.error('Ошибка загрузки должников:', err);
        }
    };

    const handleGenerateLessons = async () => {
        try { await generateLessons(); showSnackbar('✅ Занятия созданы на месяц вперёд', 'success'); fetchData(); } 
        catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };

    const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
    const goToNextWeek = () => setCurrentWeekOffset(currentWeekOffset + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    const getWeekDates = () => {
        const today = new Date();
        const targetDate = addDays(today, currentWeekOffset * 7);
        const monday = startOfWeek(targetDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    };

    const getTemplate = (dayId, timeSlot) => templates.find(t => t.dayOfWeek === dayId && t.startTime === timeSlot + ':00');
    
    const getLessonForSlot = (date, timeSlot) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return lessons.find(l => {
            if (l.lessonDate !== dateStr) return false;
            const lessonStart = l.startTime.slice(0, 5);
            const duration = l.duration || 60;
            const slotIndex = TIME_SLOTS.indexOf(timeSlot);
            const startIndex = TIME_SLOTS.indexOf(lessonStart);
            if (startIndex === -1) return false;
            const endIndex = startIndex + (duration / 60);
            return slotIndex >= startIndex && slotIndex < endIndex;
        });
    };

    const getDailyIncome = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayLessons = lessons.filter(l => l.lessonDate === dateStr); let total = 0;
        dayLessons.forEach(l => { if (l.status === 'PAID' && l.student?.paymentType !== 'subscription') total += getStudentRateForTutor(l.student, user?.id) || 0; });
        return total;
    };
    const getTotalIncome = () => { const weekDates = getWeekDates(); let total = 0; weekDates.forEach(date => total += getDailyIncome(date)); return total; };

    const handleAddClick = (dayId, timeSlot) => {
        setEditingTemplate(null);
        setFormData({ studentId: '', courseId: '', dayOfWeek: dayId, startTime: timeSlot, endTime: (parseInt(timeSlot.split(':')[0]) + 1).toString().padStart(2, '0') + ':00' });
        setOpenDialog(true);
    };
    const handleEditClick = (template) => { if (!template) return; setEditingTemplate(template); setFormData({ studentId: template.student?.id || '', courseId: template.course?.id || '', dayOfWeek: template.dayOfWeek, startTime: template.startTime?.slice(0,5) || '10:00', endTime: template.endTime?.slice(0,5) || '11:00' }); setOpenDialog(true); };
    const handleDeleteTemplate = async (id) => { if (!window.confirm('Удалить шаблон?')) return; try { await axiosInstance.delete(`/weekly-template/${id}`); showSnackbar('Шаблон удалён', 'success'); fetchData(); } catch (err) { showSnackbar('Ошибка', 'error'); } };
    const handleDeleteLesson = async (lessonId) => { if (!window.confirm('Удалить занятие?')) return; try { await deleteLesson(lessonId); showSnackbar('Занятие удалено', 'success'); fetchData(); } catch (err) { showSnackbar('Ошибка', 'error'); } };
    const handleSave = async () => {
        if (!user || !user.id) { showSnackbar('Ошибка: пользователь не авторизован', 'error'); return; }
        try {
            const data = { tutorId: user.id, studentId: formData.studentId, courseId: formData.courseId || null, dayOfWeek: formData.dayOfWeek, startTime: formData.startTime + ':00', endTime: formData.endTime + ':00' };
            if (editingTemplate) { await axiosInstance.put(`/weekly-template/${editingTemplate.id}`, data); showSnackbar('Шаблон обновлён', 'success'); }
            else { await axiosInstance.post('/weekly-template', data); showSnackbar('Шаблон добавлен', 'success'); }
            setOpenDialog(false); fetchData();
        } catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };

    const handleOpenResurrect = (student) => {
        setSelectedDebtor(student);
        setResurrectForm({
            date: new Date(),
            startTime: '10:00',
            duration: 60,
            courseId: ''
        });
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

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });
    const formatDate = (date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    const weekDates = getWeekDates();
    const totalIncome = getTotalIncome();
    const weekDateStr = weekDates[0] && weekDates[6] ? `${format(weekDates[0], 'd MMM', { locale: ru })} - ${format(weekDates[6], 'd MMM yyyy', { locale: ru })}` : '';

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>Расписание</Typography>
                        <Typography variant="body2" color="textSecondary">Управление постоянными занятиями и расписанием на неделю</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <ToggleButtonGroup value={viewMode} exclusive onChange={(e, v) => v && setViewMode(v)} size="small">
                            <ToggleButton value="table"><ListIcon sx={{ mr: 0.5 }} /> Таблица</ToggleButton>
                            <ToggleButton value="calendar"><CalendarIcon sx={{ mr: 0.5 }} /> Календарь</ToggleButton>
                        </ToggleButtonGroup>
                        <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleGenerateLessons} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}>Создать занятия на месяц</Button>
                    </Box>
                </Box>

                <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button size="small" variant="outlined" onClick={goToPreviousWeek} sx={{ minWidth: 'auto', px: 1, borderRadius: 2 }}>←</Button>
                        <Typography variant="body1" sx={{ mx: 1, fontWeight: 500 }}>{weekDateStr}</Typography>
                        <Button size="small" variant="outlined" onClick={goToNextWeek} sx={{ minWidth: 'auto', px: 1, borderRadius: 2 }}>→</Button>
                        <Button size="small" variant="text" onClick={goToCurrentWeek} sx={{ ml: 1, borderRadius: 2 }}>Сегодня</Button>
                    </Box>
                </Paper>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                {viewMode === 'calendar' ? (
                    <WeekCalendar
                        weekDates={weekDates}
                        lessons={lessons}
                        students={students}
                        courses={courses}
                        debtors={debtors}
                        user={user}
                        onRefresh={fetchData}
                        onShowSnackbar={showSnackbar}
                        onOpenResurrect={handleOpenResurrect}
                    />
                ) : (
                    <>
                        {/* ✅ ПАНЕЛЬ ДОЛЖНИКОВ ТОЛЬКО ДЛЯ ТАБЛИЦЫ */}
                        {debtors.length > 0 && (
                            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#FFF8E1', border: '1px solid #FFE0B5' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#E65100' }}>
                                    ⚠️ Должники (пропущенные занятия)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {debtors.map(student => (
                                        <Card key={student.id} sx={{ width: 220, bgcolor: '#FFF3E0', border: '1px solid #FFB74D' }}>
                                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#E65100', fontSize: 14 }}>
                                                        {student.fullName?.charAt(0) || 'У'}
                                                    </Avatar>
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                        {student.fullName}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={`Пропущено: ${student.debtLessons}`}
                                                    size="small"
                                                    sx={{ bgcolor: '#FFCC80', color: '#E65100', fontWeight: 600, width: '100%', mb: 1 }}
                                                />
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    variant="contained"
                                                    color="primary"
                                                    startIcon={<WorkIcon />}
                                                    onClick={() => handleOpenResurrect(student)}
                                                >
                                                    Отработать
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </Paper>
                        )}

                        {/* ТАБЛИЦА */}
                        <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, minWidth: 100 }}>Время</TableCell>
                                            {DAYS.map((day, index) => {
                                                const date = weekDates[index];
                                                const dailyIncome = getDailyIncome(date);
                                                return (
                                                    <TableCell key={day.id} align="center" sx={{ bgcolor: '#f8f9fa', fontWeight: 600, minWidth: 140 }}>
                                                        <Box>{day.name}<Typography variant="caption" display="block" color="textSecondary">{formatDate(date)}</Typography>
                                                        {dailyIncome > 0 && <Typography variant="caption" display="block" color="success.main" fontWeight="bold">+{dailyIncome} ₽</Typography>}
                                                        </Box>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {TIME_SLOTS.map((timeSlot) => {
                                            const startHour = parseInt(timeSlot.split(':')[0]); const endHour = startHour + 1;
                                            const timeDisplay = `${timeSlot}-${endHour.toString().padStart(2, '0')}:00`;
                                            return (
                                                <TableRow key={timeSlot} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                    <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>{timeDisplay}</TableCell>
                                                    {DAYS.map((day, index) => {
                                                        const date = weekDates[index];
                                                        const lesson = getLessonForSlot(date, timeSlot);
                                                        const template = getTemplate(day.id, timeSlot);
                                                        
                                                        if (lesson) {
                                                            const isFirstSlot = lesson.startTime.slice(0, 5) === timeSlot;
                                                            if (!isFirstSlot) return null;
                                                            
                                                            const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                                            const hasTemplate = template !== null;
                                                            const studentRate = getStudentRateForTutor(lesson.student, user?.id);
                                                            const rowSpan = (lesson.duration || 60) / 60;
                                                            
                                                            return (
                                                                <TableCell 
                                                                    key={day.id}
                                                                    rowSpan={rowSpan}
                                                                    sx={{ 
                                                                        bgcolor: statusStyle.bg,
                                                                        p: 1,
                                                                        minWidth: 140,
                                                                        border: '1px solid #e0e0e0',
                                                                        position: 'relative',
                                                                        verticalAlign: 'top'
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={600} sx={{ color: statusStyle.text }}>
                                                                            {lesson.student?.fullName || '—'}
                                                                        </Typography>
                                                                        {lesson.course && (
                                                                            <Typography variant="caption" display="block" color="textSecondary">
                                                                                {lesson.course.name}
                                                                            </Typography>
                                                                        )}
                                                                        <Typography variant="caption" display="block" color="textSecondary">
                                                                            {formatLessonTime(lesson.lessonDate, lesson.startTime)} ({lesson.duration || 60} мин)
                                                                        </Typography>
                                                                        {studentRate && lesson.status !== 'CANCELLED' && (
                                                                            <Typography variant="caption" display="block" color="success.main">
                                                                                {studentRate} ₽
                                                                            </Typography>
                                                                        )}
                                                                        <Chip 
                                                                            label={statusStyle.label}
                                                                            size="small"
                                                                            sx={{ 
                                                                                mt: 0.5, 
                                                                                fontSize: '0.65rem',
                                                                                height: 20,
                                                                                bgcolor: statusStyle.bg,
                                                                                color: statusStyle.text,
                                                                                border: `1px solid ${statusStyle.text}`
                                                                            }}
                                                                        />
                                                                        
                                                                        {hasTemplate && (
                                                                            <IconButton 
                                                                                size="small" 
                                                                                sx={{ position: 'absolute', top: 0, right: 0 }}
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    handleEditClick(template);
                                                                                }}
                                                                            >
                                                                                <Edit fontSize="small" />
                                                                            </IconButton>
                                                                        )}
                                                                        
                                                                        <IconButton 
                                                                            size="small" 
                                                                            color="error"
                                                                            sx={{ position: 'absolute', bottom: 0, right: 0 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteLesson(lesson.id);
                                                                            }}
                                                                        >
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    </Box>
                                                                </TableCell>
                                                            );
                                                        }
                                                        
                                                        if (template) {
                                                            return (
                                                                <TableCell 
                                                                    key={day.id}
                                                                    sx={{ 
                                                                        bgcolor: '#fafafa',
                                                                        p: 1,
                                                                        minWidth: 140,
                                                                        cursor: 'pointer',
                                                                        '&:hover': { bgcolor: '#f0f0f0' },
                                                                        border: '1px solid #e0e0e0',
                                                                        position: 'relative'
                                                                    }}
                                                                    onClick={() => handleEditClick(template)}
                                                                >
                                                                    <Box>
                                                                        <Typography variant="body2" fontWeight={600}>
                                                                            {template.student?.fullName || '—'}
                                                                        </Typography>
                                                                        {template.course && (
                                                                            <Typography variant="caption" display="block" color="textSecondary">
                                                                                {template.course.name}
                                                                            </Typography>
                                                                        )}
                                                                        <Chip 
                                                                            label="Шаблон"
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ mt: 0.5, fontSize: '0.65rem' }}
                                                                        />
                                                                        <IconButton 
                                                                            size="small" 
                                                                            sx={{ position: 'absolute', top: 0, right: 0 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleEditClick(template);
                                                                            }}
                                                                        >
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                        <IconButton 
                                                                            size="small" 
                                                                            color="error"
                                                                            sx={{ position: 'absolute', bottom: 0, right: 0 }}
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleDeleteTemplate(template.id);
                                                                            }}
                                                                        >
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    </Box>
                                                                </TableCell>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <TableCell 
                                                                key={day.id}
                                                                sx={{ 
                                                                    bgcolor: '#ffffff',
                                                                    cursor: 'pointer',
                                                                    '&:hover': { bgcolor: '#f5f5f5' },
                                                                    p: 1,
                                                                    minWidth: 140,
                                                                    border: '1px solid #e0e0e0',
                                                                    transition: 'all 0.15s'
                                                                }}
                                                                onClick={() => handleAddClick(day.id, timeSlot)}
                                                            >
                                                                <Typography variant="body2" color="textSecondary" align="center">
                                                                    +
                                                                </Typography>
                                                            </TableCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Итого за неделю:</TableCell>
                                            <TableCell colSpan={7} sx={{ bgcolor: '#f8f9fa' }}>
                                                <Typography variant="h6" color="success.main" fontWeight={600}>{totalIncome} ₽</Typography>
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </>
                )}

                {/* Диалог создания шаблона */}
                <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>{editingTemplate ? 'Редактировать постоянное занятие' : 'Добавить постоянное занятие'}</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                {DAYS.find(d => d.id === formData.dayOfWeek)?.name}, {formData.startTime} - {formData.endTime}
                            </Typography>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Ученик</InputLabel>
                                <Select value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} label="Ученик">
                                    {students.map(s => { const rate = getStudentRateForTutor(s, user?.id); return <MenuItem key={s.id} value={s.id}>{s.fullName} ({rate || '—'} ₽/час)</MenuItem>; })}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Предмет (необязательно)</InputLabel>
                                <Select value={formData.courseId} onChange={(e) => setFormData({...formData, courseId: e.target.value})} label="Предмет">
                                    <MenuItem value="">— Без предмета —</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Alert severity="info" sx={{ mt: 2 }}>Это постоянное занятие будет автоматически добавляться в расписание каждую неделю.</Alert>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        {editingTemplate && <Button onClick={() => handleDeleteTemplate(editingTemplate.id)} color="error">Удалить</Button>}
                        <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
                        <Button onClick={handleSave} variant="contained" disabled={!formData.studentId}>{editingTemplate ? 'Сохранить' : 'Добавить'}</Button>
                    </DialogActions>
                </Dialog>

                {/* Диалог отработки долга */}
                <Dialog open={openResurrectDialog} onClose={() => setOpenResurrectDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Отработать пропущенное занятие</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Ученик: {selectedDebtor?.fullName}
                            </Typography>
                            
                            <DatePicker
                                label="Дата"
                                value={resurrectForm.date}
                                onChange={(newDate) => setResurrectForm({...resurrectForm, date: newDate})}
                                minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                            />
                            
                            <TextField
                                label="Время начала"
                                type="time"
                                value={resurrectForm.startTime}
                                onChange={(e) => setResurrectForm({...resurrectForm, startTime: e.target.value})}
                                fullWidth
                                margin="normal"
                                inputProps={{ step: 300 }}
                            />
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Длительность</InputLabel>
                                <Select
                                    value={resurrectForm.duration}
                                    onChange={(e) => setResurrectForm({...resurrectForm, duration: e.target.value})}
                                    label="Длительность"
                                >
                                    <MenuItem value={30}>30 минут</MenuItem>
                                    <MenuItem value={45}>45 минут</MenuItem>
                                    <MenuItem value={60}>1 час</MenuItem>
                                    <MenuItem value={90}>1,5 часа</MenuItem>
                                    <MenuItem value={120}>2 часа</MenuItem>
                                </Select>
                            </FormControl>
                            
                            <FormControl fullWidth margin="normal">
                                <InputLabel>Предмет</InputLabel>
                                <Select
                                    value={resurrectForm.courseId}
                                    onChange={(e) => setResurrectForm({...resurrectForm, courseId: e.target.value})}
                                    label="Предмет"
                                >
                                    <MenuItem value="">— Без предмета —</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenResurrectDialog(false)}>Отмена</Button>
                        <Button onClick={handleSaveResurrect} variant="contained" color="primary">
                            Создать занятие
                        </Button>
                    </DialogActions>
                </Dialog>

                <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
}

export default WeeklySchedule;