// ========== frontend/src/pages/WeeklyScheduleNew.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import { Delete, Edit, Refresh as RefreshIcon, ViewList as ListIcon, CalendarToday as CalendarIcon, Work as WorkIcon, Event as EventIcon, Add as AddIcon } from '@mui/icons-material';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Alert, CircularProgress, Chip, Snackbar,
    Avatar, Card, CardContent, ToggleButton, ToggleButtonGroup,
    TextField, Tooltip
} from '@mui/material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { styled } from '@mui/material/styles';
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

// ========== КОНСТАНТЫ ==========
const DAYS = [
    { id: 1, name: 'ПН' }, { id: 2, name: 'ВТ' }, { id: 3, name: 'СР' },
    { id: 4, name: 'ЧТ' }, { id: 5, name: 'ПТ' }, { id: 6, name: 'СБ' }, { id: 7, name: 'ВС' }
];

const TIME_SLOTS = [
    '10:00', '11:00', '12:00', '13:00', '14:00', '15:00',
    '16:00', '17:00', '18:00', '19:00', '20:00', '21:00',
    '22:00', '23:00',
    '00:00', '01:00', '02:00', '03:00'
];

const STATUS_COLORS = {
    SCHEDULED:      { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: 'Не проведено' },
    COMPLETED:      { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Проведено (ждёт оплаты)' },
    PAID:           { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Оплачено' },
    RESCHEDULED:    { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Перенесено' },
    CANCELLED:      { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Отменено' },
    // Разовое занятие — использует SCHEDULED, но можно добавить отдельный статус если нужно
    SINGLE:         { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6', label: 'Разовое' },
};

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const HeaderPaper = styled(Paper)({
    marginBottom: '24px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    padding: '24px',
});

const ScheduleTableContainer = styled(Paper)({
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
});


const ViewToggleContainer = styled(Box)({
    display: 'inline-flex',
    backgroundColor: '#F3F4F6',
    borderRadius: '10px',
    padding: '3px',
});



const DebtorsBar = styled(Paper)({
    padding: '16px 20px',
    marginBottom: '20px',
    borderRadius: '12px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    boxShadow: 'none',
});

const SlotCell = styled(TableCell)(({ isEmpty, isTemplate }) => ({
    padding: '8px',
    minWidth: 140,
    border: '1px solid #F3F4F6',
    cursor: isEmpty ? 'pointer' : 'default',
    backgroundColor: isEmpty ? '#FFFFFF' : (isTemplate ? '#F9FAFB' : 'inherit'),
    transition: 'all 0.15s ease',
    verticalAlign: 'top',
    position: 'relative',
    '&:hover': {
        backgroundColor: isEmpty ? '#EEF2FF' : undefined,
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
function WeeklySchedule() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Расписание'; }, []);
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
    const [openResurrectDialog, setOpenResurrectDialog] = useState(false);
    const [selectedDebtor, setSelectedDebtor] = useState(null);
    const [resurrectForm, setResurrectForm] = useState({
        date: new Date(), startTime: '10:00', duration: 60, courseId: ''
    });

    const [openSingleLesson, setOpenSingleLesson] = useState(false);
    const [singleLesson, setSingleLesson] = useState({
        studentId: '', courseId: '', date: new Date(), time: '10:00'
    });

    useEffect(() => {
        if (user && user.id) { fetchData(); fetchDebtors(); }
    }, [user, currentWeekOffset]);

    // ========== ВСЕ ФУНКЦИИ ОСТАЮТСЯ БЕЗ ИЗМЕНЕНИЙ ==========
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
            
            // Только ученики с типом оплаты "абонемент" у которых есть долги
            const debtorsList = studentsData
                .filter(student => student.paymentType === 'subscription')
                .filter(student => {
                    const activeSub = subscriptionsData.find(
                        sub => sub.student?.id === student.id && 
                            (sub.status === 'ACTIVE' || sub.status === 'active') && 
                            sub.debtLessons > 0
                    );
                    return !!activeSub;
                })
                .map(student => {
                    const activeSub = subscriptionsData.find(
                        sub => sub.student?.id === student.id && 
                            (sub.status === 'ACTIVE' || sub.status === 'active')
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

    const getTemplate = (dayId, timeSlot) => templates.find(t => t.dayOfWeek === dayId && formatLessonTime('2026-01-01', t.startTime) === timeSlot);    
    const getLessonForSlot = (date, timeSlot) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return lessons.find(l => {
            if (l.lessonDate !== dateStr) return false;
            const localLessonStart = formatLessonTime(l.lessonDate, l.startTime);
            const localLessonEnd = formatLessonTime(l.lessonDate, l.endTime);
            const duration = l.duration || 60;
            const slotIndex = TIME_SLOTS.indexOf(timeSlot);
            const startIndex = TIME_SLOTS.indexOf(localLessonStart);
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
    const handleEditClick = (template) => { if (!template) return; setEditingTemplate(template); setFormData({ studentId: template.student?.id || '', courseId: template.course?.id || '', dayOfWeek: template.dayOfWeek, startTime: formatLessonTime('2026-01-01', template.startTime) || '10:00', endTime: formatLessonTime('2026-01-01', template.endTime) || '11:00'}); setOpenDialog(true); };
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

    const handleCreateSingleLesson = async () => {
        if (!singleLesson.studentId || !singleLesson.time) return;
        try {
            await axiosInstance.post('/lessons', {
                tutorId: user.id,
                studentId: parseInt(singleLesson.studentId),
                courseId: singleLesson.courseId ? parseInt(singleLesson.courseId) : null,
                lessonDate: format(singleLesson.date, 'yyyy-MM-dd'),
                startTime: singleLesson.time + ':00',
                endTime: (parseInt(singleLesson.time.split(':')[0]) + 1).toString().padStart(2, '0') + ':00:00'
            });
            setOpenSingleLesson(false);
            setSingleLesson({ studentId: '', courseId: '', date: new Date(), time: '10:00' });
            fetchData();
            showSnackbar('✅ Разовое занятие создано', 'success');
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });
    const formatDate = (date) => date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

    const weekDates = getWeekDates();
    const totalIncome = getTotalIncome();
    const isCurrentWeek = currentWeekOffset === 0;
    const weekDateStr = weekDates[0] && weekDates[6] ? `${format(weekDates[0], 'd MMM', { locale: ru })} – ${format(weekDates[6], 'd MMM yyyy', { locale: ru })}` : '';

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка расписания..." />
            </Box>
        </PageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer>
                {/* ========== ЗАГОЛОВОК ========== */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                            Расписание
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            Управление постоянными занятиями и расписанием на неделю
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                        <ViewToggleContainer>
                            <ViewToggleBtn active={viewMode === 'table'} onClick={() => setViewMode('table')}>
                                <ListIcon sx={{ fontSize: 18 }} />
                                Таблица
                            </ViewToggleBtn>
                            <ViewToggleBtn active={viewMode === 'calendar'} onClick={() => setViewMode('calendar')}>
                                <CalendarIcon sx={{ fontSize: 18 }} />
                                Календарь
                            </ViewToggleBtn>
                        </ViewToggleContainer>
                        <StyledButton variant="outlined" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenSingleLesson(true)}
                            sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}>
                            + Разовое
                        </StyledButton>
                        <StyledButton variant="contained" startIcon={<RefreshIcon sx={{ fontSize: 18 }} />} onClick={handleGenerateLessons}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            Создать занятия на месяц
                        </StyledButton>
                    </Box>
                </Box>

                {/* ========== НАВИГАЦИЯ ПО НЕДЕЛЕ ========== */}
                <Paper sx={{ 
                    p: 2, mb: 3, borderRadius: '12px', 
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

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

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
                        {/* ========== ДОЛЖНИКИ ========== */}
                        {debtors.length > 0 && (
                            <DebtorsBar elevation={0}>
                                <Typography sx={{ fontWeight: 600, mb: 2, color: '#92400E', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    ⚠️ Должники (пропущенные занятия)
                                </Typography>
                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                    {debtors.map(student => (
                                        <Card key={student.id} sx={{ 
                                            width: 220, 
                                            borderRadius: '10px',
                                            border: '1px solid #FDE68A', 
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                            backgroundColor: '#FFFFFF',
                                        }}>
                                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(student.fullName), fontSize: 14, fontWeight: 600 }}>
                                                        {getInitials(student.fullName)}
                                                    </Avatar>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1F2937' }}>
                                                        {student.fullName}
                                                    </Typography>
                                                </Box>
                                                <Chip
                                                    label={`Пропущено: ${student.debtLessons}`}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: '#FEF3C7', color: '#92400E', fontWeight: 600, 
                                                        width: '100%', mb: 1, borderRadius: '8px', fontSize: '12px',
                                                    }}
                                                />
                                                <StyledButton
                                                    fullWidth
                                                    size="small"
                                                    variant="contained"
                                                    startIcon={<WorkIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => handleOpenResurrect(student)}
                                                    sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontSize: '12px', py: 0.5 }}
                                                >
                                                    Отработать
                                                </StyledButton>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Box>
                            </DebtorsBar>
                        )}

                        {/* ========== ТАБЛИЦА РАСПИСАНИЯ ========== */}
                        <ScheduleTableContainer elevation={0}>
                            <TableContainer sx={{ overflowX: 'auto' }}>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ 
                                                fontWeight: 600, fontSize: '12px', color: '#6B7280',
                                                backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB',
                                                minWidth: 100, position: 'sticky', left: 0, zIndex: 3,
                                            }}>
                                                Время
                                            </TableCell>
                                            {DAYS.map((day, index) => {
                                                const date = weekDates[index];
                                                const dailyIncome = getDailyIncome(date);
                                                const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                                                return (
                                                    <TableCell key={day.id} align="center" sx={{ 
                                                        fontWeight: 600, fontSize: '12px', color: '#6B7280',
                                                        backgroundColor: isToday ? '#EEF2FF' : '#F9FAFB',
                                                        borderBottom: '1px solid #E5E7EB', minWidth: 140,
                                                    }}>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#1F2937' }}>
                                                                {day.name}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                                {formatDate(date)}
                                                            </Typography>
                                                            {dailyIncome > 0 && (
                                                                <Typography sx={{ fontSize: '11px', color: '#10B981', fontWeight: 600 }}>
                                                                    +{dailyIncome} ₽
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                );
                                            })}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {TIME_SLOTS.map((timeSlot) => {
                                            const startHour = parseInt(timeSlot.split(':')[0]); 
                                            const endHour = startHour + 1;
                                            const timeDisplay = `${timeSlot}–${endHour.toString().padStart(2, '0')}:00`;
                                            
                                            return (
                                                <TableRow key={timeSlot} sx={{ '&:hover': { backgroundColor: '#F9FAFB' } }}>
                                                    <TableCell sx={{ 
                                                        fontWeight: 500, fontSize: '12px', color: '#6B7280',
                                                        backgroundColor: '#FAFAFA', borderBottom: '1px solid #F3F4F6',
                                                        position: 'sticky', left: 0, zIndex: 2,
                                                    }}>
                                                        {timeDisplay}
                                                    </TableCell>
                                                    
                                                    {DAYS.map((day, index) => {
                                                        const date = weekDates[index];
                                                        const lesson = getLessonForSlot(date, timeSlot);
                                                        const template = getTemplate(day.id, timeSlot);
                                                        
                                                        if (lesson) {
                                                            const isFirstSlot = formatLessonTime(lesson.lessonDate, lesson.startTime) === timeSlot;
                                                            if (!isFirstSlot) return <TableCell key={day.id} sx={{ display: 'none' }} />;
                                                            
                                                            const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                                            const hasTemplate = template !== null;
                                                            const studentRate = getStudentRateForTutor(lesson.student, user?.id);
                                                            const rowSpan = (lesson.duration || 60) / 60;
                                                            
                                                            return (
                                                                <SlotCell 
                                                                    key={day.id}
                                                                    rowSpan={rowSpan}
                                                                    sx={{ 
                                                                        backgroundColor: statusStyle.bg,
                                                                        border: `1px solid ${statusStyle.dot}30`,
                                                                        borderLeft: `3px solid ${statusStyle.dot}`,
                                                                    }}
                                                                >
                                                                    <Box sx={{ position: 'relative', minHeight: 60 }}>
                                                                        <Typography sx={{ fontWeight: 600, fontSize: '13px', color: statusStyle.text }}>
                                                                            {lesson.student?.fullName || '—'}
                                                                        </Typography>
                                                                        {lesson.course && (
                                                                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                                                {lesson.course.name}
                                                                            </Typography>
                                                                        )}
                                                                        <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                                            {formatLessonTime(lesson.lessonDate, lesson.startTime)} ({lesson.duration || 60} мин)
                                                                        </Typography>
                                                                        {studentRate && lesson.status !== 'CANCELLED' && (
                                                                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#10B981' }}>
                                                                                {studentRate} ₽
                                                                            </Typography>
                                                                        )}
                                                                        <Chip 
                                                                            label={statusStyle.label}
                                                                            size="small"
                                                                            sx={{ 
                                                                                mt: 0.5, fontSize: '10px', height: 20,
                                                                                bgcolor: statusStyle.bg, color: statusStyle.text,
                                                                                border: `1px solid ${statusStyle.text}40`,
                                                                                borderRadius: '100px',
                                                                            }}
                                                                        />
                                                                        
                                                                        {hasTemplate && (
                                                                            <Tooltip title="Редактировать шаблон">
                                                                                <IconButton size="small" sx={{ position: 'absolute', top: 0, right: 0, color: '#6B7280' }}
                                                                                    onClick={(e) => { e.stopPropagation(); handleEditClick(template); }}>
                                                                                    <Edit sx={{ fontSize: 14 }} />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                        <Tooltip title="Удалить занятие">
                                                                            <IconButton size="small" sx={{ position: 'absolute', bottom: 0, right: 0, color: '#EF4444' }}
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lesson.id); }}>
                                                                                <Delete sx={{ fontSize: 14 }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                </SlotCell>
                                                            );
                                                        }
                                                        
                                                        if (template) {
                                                            return (
                                                                <SlotCell key={day.id} isTemplate onClick={() => handleEditClick(template)}>
                                                                    <Box sx={{ position: 'relative', minHeight: 50 }}>
                                                                        <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#1F2937' }}>
                                                                            {template.student?.fullName || '—'}
                                                                        </Typography>
                                                                        {template.course && (
                                                                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                                                                {template.course.name}
                                                                            </Typography>
                                                                        )}
                                                                        <Chip 
                                                                            label={`Шаблон ${formatLessonTime('2026-01-01', template.startTime)}`}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ mt: 0.5, fontSize: '10px', borderRadius: '100px', borderColor: '#D1D5DB', color: '#6B7280' }}
                                                                        />
                                                                        <Tooltip title="Редактировать шаблон">
                                                                            <IconButton size="small" sx={{ position: 'absolute', top: 0, right: 0, color: '#6B7280' }}
                                                                                onClick={(e) => { e.stopPropagation(); handleEditClick(template); }}>
                                                                                <Edit sx={{ fontSize: 14 }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Удалить шаблон">
                                                                            <IconButton size="small" sx={{ position: 'absolute', bottom: 0, right: 0, color: '#EF4444' }}
                                                                                onClick={(e) => { e.stopPropagation(); handleDeleteTemplate(template.id); }}>
                                                                                <Delete sx={{ fontSize: 14 }} />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </Box>
                                                                </SlotCell>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <SlotCell key={day.id} isEmpty onClick={() => handleAddClick(day.id, timeSlot)}>
                                                                <Box sx={{ 
                                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                    minHeight: 50, color: '#D1D5DB',
                                                                    '&:hover': { color: '#4F46E5' },
                                                                }}>
                                                                    <AddIcon sx={{ fontSize: 20, opacity: 0, transition: 'opacity 0.15s', '.MuiTableCell-root:hover &': { opacity: 1 } }} />
                                                                </Box>
                                                            </SlotCell>
                                                        );
                                                    })}
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </ScheduleTableContainer>
                    </>
                )}

                {/* ========== ДИАЛОГ ШАБЛОНА ========== */}
                <StyledDialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                        {editingTemplate ? 'Редактировать постоянное занятие' : 'Добавить постоянное занятие'}
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                                {DAYS.find(d => d.id === formData.dayOfWeek)?.name}, {formData.startTime} – {formData.endTime}
                            </Typography>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Ученик</InputLabel>
                                <Select value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} label="Ученик"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' } }}>
                                    {students.map(s => { const rate = getStudentRateForTutor(s, user?.id); return <MenuItem key={s.id} value={s.id}>{s.fullName} ({rate || '—'} ₽/час)</MenuItem>; })}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Предмет (необязательно)</InputLabel>
                                <Select value={formData.courseId} onChange={(e) => setFormData({...formData, courseId: e.target.value})} label="Предмет"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' } }}>
                                    <MenuItem value="">— Без предмета —</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                                Это постоянное занятие будет автоматически добавляться в расписание каждую неделю.
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
                        <StyledButton onClick={() => setOpenDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleSave} variant="contained" disabled={!formData.studentId}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            {editingTemplate ? 'Сохранить' : 'Добавить'}
                        </StyledButton>
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ ОТРАБОТКИ ДОЛГА ========== */}
                <StyledDialog open={openResurrectDialog} onClose={() => setOpenResurrectDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                        Отработать пропущенное занятие
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                                Ученик: {selectedDebtor?.fullName}
                            </Typography>
                            <DatePicker label="Дата" value={resurrectForm.date}
                                onChange={(newDate) => setResurrectForm({...resurrectForm, date: newDate})}
                                minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, sx: { mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }} />
                            <TextField label="Время начала" type="time" value={resurrectForm.startTime}
                                onChange={(e) => setResurrectForm({...resurrectForm, startTime: e.target.value})}
                                fullWidth sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Длительность</InputLabel>
                                <Select value={resurrectForm.duration} onChange={(e) => setResurrectForm({...resurrectForm, duration: e.target.value})} label="Длительность"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    <MenuItem value={30}>30 минут</MenuItem><MenuItem value={45}>45 минут</MenuItem>
                                    <MenuItem value={60}>1 час</MenuItem><MenuItem value={90}>1,5 часа</MenuItem>
                                    <MenuItem value={120}>2 часа</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontSize: '14px' }}>Предмет</InputLabel>
                                <Select value={resurrectForm.courseId} onChange={(e) => setResurrectForm({...resurrectForm, courseId: e.target.value})} label="Предмет"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    <MenuItem value="">— Без предмета —</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setOpenResurrectDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleSaveResurrect} variant="contained"
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            Создать занятие
                        </StyledButton>
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ РАЗОВОГО ЗАНЯТИЯ ========== */}
                <StyledDialog open={openSingleLesson} onClose={() => setOpenSingleLesson(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                        Разовое занятие
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Ученик</InputLabel>
                                <Select value={singleLesson.studentId} onChange={(e) => setSingleLesson({ ...singleLesson, studentId: e.target.value })} label="Ученик"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth sx={{ mb: 2 }}>
                                <InputLabel sx={{ fontSize: '14px' }}>Предмет</InputLabel>
                                <Select value={singleLesson.courseId} onChange={(e) => setSingleLesson({ ...singleLesson, courseId: e.target.value })} label="Предмет"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    <MenuItem value="">Без предмета</MenuItem>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <DatePicker label="Дата" value={singleLesson.date} onChange={(d) => setSingleLesson({ ...singleLesson, date: d })} minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, sx: { mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }} />
                            <TextField fullWidth label="Время" type="time" value={singleLesson.time}
                                onChange={(e) => setSingleLesson({ ...singleLesson, time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setOpenSingleLesson(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleCreateSingleLesson} variant="contained" disabled={!singleLesson.studentId || !singleLesson.time}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            Создать
                        </StyledButton>
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