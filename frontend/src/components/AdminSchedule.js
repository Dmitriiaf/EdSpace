// ========== frontend/src/components/AdminSchedule.js ==========
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box, Typography, Paper, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, TextField, FormControl, InputLabel, Select,
    MenuItem, Alert, IconButton, Avatar, Grid, Stack, Divider, Autocomplete,
    Checkbox, FormControlLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    Delete, Add as AddIcon, Edit as EditIcon,
    Cancel as CancelIcon, Event as EventIcon,
    CheckCircle as CheckIcon, CalendarMonth as BulkIcon
} from '@mui/icons-material';
import { formatLessonTime, getLocalHoursMinutes } from '../utils/timezone';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays, startOfWeek } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance from '../api/axiosConfig';

// Конвертация местного времени в UTC (+7 → UTC)
const localToUtc = (dateStr, timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    let utcHours = hours - 7;
    let utcDate = dateStr;
    if (utcHours < 0) {
        utcHours += 24;
        const d = new Date(dateStr);
        d.setDate(d.getDate() - 1);
        utcDate = d.toISOString().split('T')[0];
    }
    return {
        date: utcDate,
        time: `${utcHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
    };
};

const HOUR_HEIGHT = 48;
const START_HOUR = 8;
const END_HOUR = 22;

const STATUS_COLORS = {
    SCHEDULED:   { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: 'Запланировано' },
    COMPLETED:   { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Проведено' },
    PAID:        { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Проведено' },
    RESCHEDULED: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Перенесено' },
    CANCELLED:   { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Отменено' },
};

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

const SchedulePaper = styled(Paper)({
    borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    backgroundColor: '#FFFFFF', border: '1px solid #F3F4F6',
});

const DayHeader = styled(Box)(({ isToday }) => ({
    flex: 1, textAlign: 'center', padding: '12px 8px',
    borderLeft: '1px solid #F3F4F6',
    backgroundColor: isToday ? '#EEF2FF' : '#FAFBFC',
}));

const TimeLabel = styled(Box)({
    width: 56, flexShrink: 0, paddingRight: 8,
    textAlign: 'right', fontSize: 11, color: '#9CA3AF', fontWeight: 500,
});

const LessonBlock = styled(Box)(({ statusStyle }) => ({
    position: 'absolute', left: 3, right: 3, zIndex: 5,
    backgroundColor: statusStyle.bg, borderLeft: `3px solid ${statusStyle.dot}`,
    borderRadius: '6px', padding: '4px 6px',
    overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease',
    '&:hover': { zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.12)' },
}));

const StyledDialog = styled(Dialog)({
    '& .MuiDialog-paper': { borderRadius: '20px', overflow: 'hidden' },
});

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function AdminSchedule({ 
    tutorId, tutorName, tutorStudents, allStudents, lessons,
    onRefresh, onShowSnackbar
}) {
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [openLessonDetails, setOpenLessonDetails] = useState(false);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
    const [openBulkDialog, setOpenBulkDialog] = useState(false);
    const [createForm, setCreateForm] = useState({ studentId: '', date: '', startTime: '10:00', duration: 60 });
    const [rescheduleForm, setRescheduleForm] = useState({ date: null, time: '' });
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    
    // Форма массового создания
    const [bulkForm, setBulkForm] = useState({
        studentId: '',
        startTime: '10:00',
        duration: 60,
        weeks: 4,
        daysOfWeek: [1, 3] // ПН, СР по умолчанию
    });
    const [bulkLoading, setBulkLoading] = useState(false);

    const weekDates = useMemo(() => {
        const today = new Date();
        const targetDate = addDays(today, currentWeekOffset * 7);
        const monday = startOfWeek(targetDate, { weekStartsOn: 1 });
        return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
    }, [currentWeekOffset]);

    const timeSlots = useMemo(() => {
        const slots = [];
        for (let h = START_HOUR; h <= END_HOUR; h++) {
            slots.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return slots;
    }, []);

    const timeToPosition = (lesson) => {
        const { hours, minutes } = getLocalHoursMinutes(lesson.lessonDate, lesson.startTime);
        return (hours - START_HOUR) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
    };

    const handleSlotClick = (date, time) => {
        setCreateForm({ 
            studentId: '', 
            date: format(date, 'yyyy-MM-dd'), 
            startTime: time, 
            duration: 60 
        });
        setOpenCreateDialog(true);
    };

    const handleCreateLesson = async () => {
        if (!createForm.studentId || !createForm.date || !createForm.startTime) return;
        try {
            const utcStart = localToUtc(createForm.date, createForm.startTime);
            const endHour = (parseInt(createForm.startTime.split(':')[0]) + 1).toString().padStart(2, '0');
            const utcEnd = localToUtc(createForm.date, endHour + ':00');
            
            await axiosInstance.post('/admin/lessons', {
                studentId: createForm.studentId,
                tutorId: tutorId,
                lessonDate: utcStart.date,
                startTime: utcStart.time,
                endTime: utcEnd.time,
            });
            onShowSnackbar?.('✅ Урок создан', 'success');
            setOpenCreateDialog(false);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    // Массовое создание уроков
    const handleBulkCreate = async () => {
        if (!bulkForm.studentId || bulkForm.daysOfWeek.length === 0) {
            onShowSnackbar?.('Выберите ученика и дни недели', 'error');
            return;
        }
        
        setBulkLoading(true);
        try {
            const endHour = (parseInt(bulkForm.startTime.split(':')[0]) + 1).toString().padStart(2, '0');
            const utcStart = localToUtc('2026-01-01', bulkForm.startTime);
            const utcEnd = localToUtc('2026-01-01', endHour + ':00');
            
            const response = await axiosInstance.post('/admin/lessons/bulk', {
                studentId: bulkForm.studentId,
                tutorId: tutorId,
                startTime: utcStart.time,
                duration: bulkForm.duration,
                weeks: bulkForm.weeks,
                daysOfWeek: bulkForm.daysOfWeek
            });
            
            onShowSnackbar?.(`✅ Создано ${response.data.created} уроков`, 'success');
            setOpenBulkDialog(false);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        } finally {
            setBulkLoading(false);
        }
    };

    const toggleDayOfWeek = (day) => {
        setBulkForm(prev => ({
            ...prev,
            daysOfWeek: prev.daysOfWeek.includes(day)
                ? prev.daysOfWeek.filter(d => d !== day)
                : [...prev.daysOfWeek, day].sort()
        }));
    };

    const handleStatusChange = async (lessonId, newStatus) => {
        try {
            await axiosInstance.patch(`/admin/lessons/${lessonId}/status`, { status: newStatus });
            onShowSnackbar?.('✅ Статус обновлён', 'success');
            setOpenLessonDetails(false);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка', 'error');
        }
    };

    const handleReschedule = async () => {
        if (!selectedLesson || !rescheduleForm.date || !rescheduleForm.time) return;
        try {
            const dateStr = format(rescheduleForm.date, 'yyyy-MM-dd');
            const utcStart = localToUtc(dateStr, rescheduleForm.time);
            const endHour = (parseInt(rescheduleForm.time.split(':')[0]) + 1).toString().padStart(2, '0');
            const utcEnd = localToUtc(dateStr, endHour + ':00');
            
            await axiosInstance.post(`/lessons/${selectedLesson.id}/reschedule`, {
                newDate: utcStart.date,
                newStartTime: utcStart.time,
                newEndTime: utcEnd.time,
            });
            onShowSnackbar?.('✅ Урок перенесён', 'success');
            setOpenRescheduleDialog(false);
            setOpenLessonDetails(false);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleCancel = async () => {
        if (!selectedLesson) return;
        try {
            await axiosInstance.post(`/lessons/${selectedLesson.id}/cancel`, {
                reason: 'Отменено администратором',
            });
            onShowSnackbar?.('❌ Урок отменён', 'info');
            setOpenLessonDetails(false);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const goToPrevWeek = () => setCurrentWeekOffset(o => o - 1);
    const goToNextWeek = () => setCurrentWeekOffset(o => o + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    // Подсчёт уроков, которые будут созданы
    const estimatedLessons = bulkForm.daysOfWeek.length * bulkForm.weeks;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
            <Box>
                {/* Навигация */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px' }}>
                        {tutorName} — Расписание
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button 
                            size="small" 
                            variant="contained" 
                            startIcon={<BulkIcon />}
                            onClick={() => setOpenBulkDialog(true)}
                            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, textTransform: 'none' }}
                        >
                            Создать на месяц
                        </Button>
                        <Button size="small" onClick={goToPrevWeek}>←</Button>
                        <Button size="small" variant="outlined" onClick={goToCurrentWeek}>Сегодня</Button>
                        <Button size="small" onClick={goToNextWeek}>→</Button>
                    </Box>
                </Box>

                <SchedulePaper elevation={0}>
                    {/* Дни недели */}
                    <Box sx={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                        <Box sx={{ width: 56, flexShrink: 0 }} />
                        {weekDates.map((date, idx) => {
                            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                            return (
                                <DayHeader key={idx} isToday={isToday}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>{WEEKDAYS[idx]}</Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>{format(date, 'd MMM', { locale: ru })}</Typography>
                                </DayHeader>
                            );
                        })}
                    </Box>

                    {/* Временная сетка */}
                    <Box sx={{ display: 'flex', position: 'relative' }}>
                        <Box sx={{ width: 56, flexShrink: 0 }}>
                            {timeSlots.map((time, idx) => (
                                <TimeLabel key={time} sx={{ height: HOUR_HEIGHT, borderBottom: '1px solid #F9FAFB' }}>
                                    {time}
                                </TimeLabel>
                            ))}
                        </Box>

                        {/* Дни */}
                        {weekDates.map((date, dayIdx) => {
                            const dateStr = format(date, 'yyyy-MM-dd');
                            const dayLessons = lessons.filter(l => l.lessonDate === dateStr);
                            return (
                                <Box key={dayIdx} sx={{ flex: 1, position: 'relative', borderLeft: '1px solid #F3F4F6', height: timeSlots.length * HOUR_HEIGHT }}>
                                    {/* Сетка */}
                                    {timeSlots.map((time, idx) => (
                                        <Box 
                                            key={time} 
                                            sx={{ height: HOUR_HEIGHT, borderBottom: '1px solid #F9FAFB', cursor: 'pointer' }}
                                            onClick={() => handleSlotClick(date, time)}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                        />
                                    ))}
                                    
                                    {/* Уроки */}
                                    {dayLessons.map(lesson => {
                                        const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                        const top = timeToPosition(lesson);
                                        const height = ((lesson.duration || 60) / 60) * HOUR_HEIGHT;
                                        return (
                                            <LessonBlock 
                                                key={lesson.id} 
                                                statusStyle={statusStyle}
                                                sx={{ top, height: Math.max(height, HOUR_HEIGHT - 2) }}
                                                onClick={(e) => { e.stopPropagation(); setSelectedLesson(lesson); setOpenLessonDetails(true); }}
                                            >
                                                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: statusStyle.text }}>
                                                    {lesson.studentName}
                                                </Typography>
                                                <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                                    {formatLessonTime(lesson.lessonDate, lesson.startTime)}
                                                </Typography>
                                            </LessonBlock>
                                        );
                                    })}
                                </Box>
                            );
                        })}
                    </Box>
                </SchedulePaper>

                {/* КАРТОЧКА УРОКА */}
                <StyledDialog open={openLessonDetails} onClose={() => setOpenLessonDetails(false)} maxWidth="sm" fullWidth>
                    {selectedLesson && (
                        <>
                            <DialogTitle sx={{ fontWeight: 700 }}>
                                {selectedLesson.studentName} — {selectedLesson.lessonDate}
                            </DialogTitle>
                            <DialogContent>
                                <Typography sx={{ mb: 2, color: '#64748B' }}>
                                    {formatLessonTime(selectedLesson.lessonDate, selectedLesson.startTime)} – {formatLessonTime(selectedLesson.lessonDate, selectedLesson.endTime)}
                                </Typography>
                                <Stack spacing={2}>
                                    <FormControl fullWidth>
                                        <InputLabel>Статус</InputLabel>
                                        <Select 
                                            value={selectedLesson.status} 
                                            onChange={(e) => handleStatusChange(selectedLesson.id, e.target.value)}
                                            label="Статус"
                                        >
                                            <MenuItem value="SCHEDULED">Запланирован</MenuItem>
                                            <MenuItem value="COMPLETED">Проведён</MenuItem>
                                            <MenuItem value="CANCELLED">Отменён</MenuItem>
                                            <MenuItem value="RESCHEDULED">Перенесён</MenuItem>
                                        </Select>
                                    </FormControl>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button 
                                            fullWidth 
                                            variant="outlined" 
                                            startIcon={<EventIcon />}
                                            onClick={() => { 
                                                const { hours, minutes } = getLocalHoursMinutes(selectedLesson.lessonDate, selectedLesson.startTime);
                                                const localTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                                                setRescheduleForm({ date: new Date(selectedLesson.lessonDate), time: localTime });
                                                setOpenRescheduleDialog(true); 
                                                setOpenLessonDetails(false);
                                            }}
                                        >
                                            Перенести
                                        </Button>
                                        <Button 
                                            fullWidth 
                                            variant="outlined" 
                                            color="error" 
                                            startIcon={<CancelIcon />}
                                            onClick={handleCancel}
                                        >
                                            Отменить
                                        </Button>
                                    </Box>
                                </Stack>
                            </DialogContent>
                        </>
                    )}
                </StyledDialog>

                {/* ДИАЛОГ СОЗДАНИЯ */}
                <StyledDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>Создать урок</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <Typography sx={{ color: '#64748B', fontSize: '14px' }}>
                                {createForm.date}, {createForm.startTime}
                            </Typography>
                            <FormControl fullWidth>
                                <InputLabel>Ученик</InputLabel>
                                <Select 
                                    value={createForm.studentId} 
                                    onChange={(e) => setCreateForm({ ...createForm, studentId: e.target.value })}
                                    label="Ученик"
                                >
                                    {tutorStudents.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCreateDialog(false)}>Отмена</Button>
                        <Button variant="contained" onClick={handleCreateLesson} sx={{ bgcolor: '#4F46E5' }}>Создать</Button>
                    </DialogActions>
                </StyledDialog>

                {/* ДИАЛОГ МАССОВОГО СОЗДАНИЯ */}
                <StyledDialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>
                        📅 Создать уроки на месяц
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <Alert severity="info" sx={{ borderRadius: 2 }}>
                                Уроки будут созданы начиная с текущей даты
                            </Alert>
                            
                            <FormControl fullWidth>
                                <InputLabel>Ученик</InputLabel>
                                <Select 
                                    value={bulkForm.studentId} 
                                    onChange={(e) => setBulkForm({ ...bulkForm, studentId: e.target.value })}
                                    label="Ученик"
                                >
                                    {tutorStudents.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>

                            <Box>
                                <Typography sx={{ mb: 1, fontWeight: 600, fontSize: '14px' }}>
                                    Дни недели
                                </Typography>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                    {['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'].map((day, idx) => (
                                        <Chip
                                            key={idx}
                                            label={day}
                                            onClick={() => toggleDayOfWeek(idx + 1)}
                                            sx={{
                                                cursor: 'pointer',
                                                bgcolor: bulkForm.daysOfWeek.includes(idx + 1) ? '#4F46E5' : '#F3F4F6',
                                                color: bulkForm.daysOfWeek.includes(idx + 1) ? '#fff' : '#374151',
                                                fontWeight: 600,
                                                '&:hover': {
                                                    bgcolor: bulkForm.daysOfWeek.includes(idx + 1) ? '#4338CA' : '#E5E7EB',
                                                }
                                            }}
                                        />
                                    ))}
                                </Stack>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <TextField 
                                        fullWidth
                                        label="Время начала" 
                                        type="time" 
                                        value={bulkForm.startTime}
                                        onChange={(e) => setBulkForm({ ...bulkForm, startTime: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Длительность</InputLabel>
                                        <Select 
                                            value={bulkForm.duration} 
                                            onChange={(e) => setBulkForm({ ...bulkForm, duration: Number(e.target.value) })}
                                            label="Длительность"
                                        >
                                            <MenuItem value={30}>30 мин</MenuItem>
                                            <MenuItem value={45}>45 мин</MenuItem>
                                            <MenuItem value={60}>1 час</MenuItem>
                                            <MenuItem value={90}>1,5 часа</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            <TextField 
                                fullWidth
                                label="Количество недель" 
                                type="number" 
                                value={bulkForm.weeks}
                                onChange={(e) => setBulkForm({ ...bulkForm, weeks: Math.max(1, Math.min(12, Number(e.target.value))) })}
                                inputProps={{ min: 1, max: 12 }}
                                helperText="От 1 до 12 недель"
                            />

                            <Alert severity="success" sx={{ borderRadius: 2 }}>
                                Будет создано <strong>{estimatedLessons}</strong> уроков
                            </Alert>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenBulkDialog(false)}>Отмена</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleBulkCreate} 
                            disabled={bulkLoading || !bulkForm.studentId || bulkForm.daysOfWeek.length === 0}
                            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                        >
                            {bulkLoading ? 'Создание...' : `Создать ${estimatedLessons} уроков`}
                        </Button>
                    </DialogActions>
                </StyledDialog>

                {/* ДИАЛОГ ПЕРЕНОСА */}
                <StyledDialog open={openRescheduleDialog} onClose={() => setOpenRescheduleDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>Перенос урока</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ mt: 1 }}>
                            <DatePicker 
                                label="Новая дата" 
                                value={rescheduleForm.date} 
                                onChange={(d) => setRescheduleForm({ ...rescheduleForm, date: d })}
                                minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true } }}
                            />
                            <TextField 
                                label="Время" 
                                type="time" 
                                value={rescheduleForm.time}
                                onChange={(e) => setRescheduleForm({ ...rescheduleForm, time: e.target.value })}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenRescheduleDialog(false)}>Отмена</Button>
                        <Button variant="contained" onClick={handleReschedule} sx={{ bgcolor: '#4F46E5' }}>Перенести</Button>
                    </DialogActions>
                </StyledDialog>
            </Box>
        </LocalizationProvider>
    );
}

export default AdminSchedule;