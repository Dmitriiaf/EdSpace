// ========== frontend/src/components/WeekCalendar.js (РЕДИЗАЙН v2) ==========
import React, { useState } from 'react';
import {
    Box, Typography, Paper, Chip, Menu, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, Button, TextField,
    FormControl, InputLabel, Select, Alert, IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { getLocalHoursMinutes, formatLessonTime } from '../utils/timezone';
import { Edit, Delete, Work as WorkIcon, Add as AddIcon } from '@mui/icons-material';
import { format, addMinutes, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance from '../api/axiosConfig';
import { replaceCancelledWithResurrect } from '../services/api';

// ========== КОНСТАНТЫ ==========
const HOUR_HEIGHT = 60;
const MIN_STEP = 15;

// ✅ Исправленные цвета статусов
const STATUS_COLORS = {
    SCHEDULED:      { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: 'Не проведено' },
    COMPLETED:      { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Проведено (ждёт оплаты)' },
    PAID:           { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Оплачено' },
    CONFIRMED:      { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Подтверждено' },
    RESCHEDULED:    { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Перенесено' },
    CANCELLED:      { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Отменено' },
    IN_PROGRESS:    { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'В процессе' },
};

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========
const CalendarPaper = styled(Paper)({
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
});

const DayHeader = styled(Box)(({ isToday }) => ({
    flex: 1,
    textAlign: 'center',
    padding: '10px 8px',
    borderLeft: '1px solid #F3F4F6',
    backgroundColor: isToday ? '#EEF2FF' : '#F9FAFB',
}));

const TimeLabel = styled(Box)({
    width: 56,
    flexShrink: 0,
    paddingRight: 8,
    textAlign: 'right',
    fontSize: 11,
    color: '#9CA3AF',
    position: 'relative',
});

const LessonBlock = styled(Box)(({ statusStyle }) => ({
    position: 'absolute',
    left: 4,
    right: 4,
    zIndex: 5,
    backgroundColor: statusStyle.bg,
    borderLeft: `3px solid ${statusStyle.dot}`,
    borderRadius: '6px',
    padding: '4px 6px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease',
    '&:hover': { 
        opacity: 0.92, 
        zIndex: 10,
        boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
    },
}));

const HoverSlot = styled(Box)({
    position: 'absolute',
    left: 4,
    right: 4,
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    border: '1px solid rgba(79, 70, 229, 0.4)',
    borderRadius: '6px',
    pointerEvents: 'none',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledDialog = styled(Dialog)({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.08)',
    },
});

const StyledMenu = styled(Menu)({
    '& .MuiPaper-root': {
        borderRadius: '10px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        minWidth: 200,
    },
});

const StyledButton = styled(Button)({
    borderRadius: '8px',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
});

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function WeekCalendar({ weekDates, lessons, students, courses, debtors, user, onRefresh, onShowSnackbar, onOpenResurrect }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [createForm, setCreateForm] = useState({ date: '', startTime: '', duration: 60, studentId: '', courseId: '' });
    const [editForm, setEditForm] = useState({ startTime: '', duration: 60, courseId: '' });
    const [hoverSlot, setHoverSlot] = useState(null);

    const [openReplaceDialog, setOpenReplaceDialog] = useState(false);
    const [cancelledLesson, setCancelledLesson] = useState(null);
    const [selectedDebtorId, setSelectedDebtorId] = useState('');

    const timeSlots = [];
    for (let h = 8; h <= 23; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const timeToPosition = (lesson) => {
        if (!lesson) return 0;
        const { hours, minutes } = getLocalHoursMinutes(lesson.lessonDate, lesson.startTime);
        return (hours - 8) * HOUR_HEIGHT + (minutes / 60) * HOUR_HEIGHT;
    };

    const positionToTime = (y) => {
        const totalMinutes = (y / HOUR_HEIGHT) * 60 + 8 * 60;
        let h = Math.floor(totalMinutes / 60);
        let m = Math.round((totalMinutes % 60) / MIN_STEP) * MIN_STEP;
        if (m >= 60) { h += 1; m = 0; }
        h = Math.max(8, Math.min(23, h));
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    };

    const getLessonsForDate = (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        return lessons.filter(l => l.lessonDate === dateStr);
    };

    const checkTimeConflict = (date, startTime, duration, excludeLessonId = null) => {
        const dayLessons = getLessonsForDate(date);
        const newStart = parse(startTime, 'HH:mm', new Date());
        const newEnd = addMinutes(newStart, duration);
        return dayLessons.some(l => {
            if (excludeLessonId && l.id === excludeLessonId) return false;
            if (l.status === 'CANCELLED') return false;
            const lStart = parse(l.startTime.slice(0, 5), 'HH:mm', new Date());
            const lEnd = addMinutes(lStart, l.duration || 60);
            return newStart < lEnd && newEnd > lStart;
        });
    };

    // ========== ВСЕ ОБРАБОТЧИКИ БЕЗ ИЗМЕНЕНИЙ ==========
    const handleSlotClick = (date, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const startTime = positionToTime(y);
        const dateStr = format(date, 'yyyy-MM-dd');
        const [h, m] = startTime.split(':').map(Number);
        const roundedM = Math.round(m / 15) * 15;
        const roundedTime = `${h.toString().padStart(2, '0')}:${roundedM.toString().padStart(2, '0')}`;

        if (checkTimeConflict(date, roundedTime, 60)) {
            onShowSnackbar('❌ Время занято', 'error');
            return;
        }
        setCreateForm({ date: dateStr, startTime: roundedTime, duration: 60, studentId: '', courseId: '' });
        setOpenCreateDialog(true);
    };

    const handleLessonClick = (e, lesson) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedLesson(lesson);
    };

    const handleEditLesson = () => {
        if (selectedLesson) {
            setEditForm({
                startTime: selectedLesson.startTime.slice(0, 5),
                duration: selectedLesson.duration || 60,
                courseId: selectedLesson.course?.id || ''
            });
            setOpenEditDialog(true);
        }
        setAnchorEl(null);
    };

    const handleDeleteLesson = async () => {
        if (!selectedLesson) return;
        if (!window.confirm('Удалить занятие?')) return;
        try {
            await axiosInstance.delete(`/lessons/${selectedLesson.id}`);
            onShowSnackbar('Занятие удалено', 'success');
            onRefresh();
        } catch (err) { onShowSnackbar('Ошибка', 'error'); }
        setAnchorEl(null);
    };

    const handleSaveCreate = async () => {
        if (!createForm.studentId) { onShowSnackbar('Выберите ученика', 'error'); return; }
        const lessonDate = parse(createForm.date, 'yyyy-MM-dd', new Date());
        if (checkTimeConflict(lessonDate, createForm.startTime, createForm.duration)) {
            onShowSnackbar('❌ Время занято', 'error'); return;
        }
        try {
            const endTime = addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration);
            await axiosInstance.post('/lessons', {
                tutorId: user.id, studentId: createForm.studentId,
                lessonDate: createForm.date, startTime: createForm.startTime + ':00',
                endTime: format(endTime, 'HH:mm:ss'), duration: createForm.duration,
                courseId: createForm.courseId || null
            });
            onShowSnackbar('✅ Занятие создано', 'success');
            setOpenCreateDialog(false);
            onRefresh();
        } catch (err) { onShowSnackbar('Ошибка', 'error'); }
    };

    const handleSaveEdit = async () => {
        if (!selectedLesson) return;
        const lessonDate = parse(selectedLesson.lessonDate, 'yyyy-MM-dd', new Date());
        if (checkTimeConflict(lessonDate, editForm.startTime, editForm.duration, selectedLesson.id)) {
            onShowSnackbar('❌ Время занято', 'error'); return;
        }
        try {
            const endTime = addMinutes(parse(editForm.startTime, 'HH:mm', new Date()), editForm.duration);
            await axiosInstance.put(`/lessons/${selectedLesson.id}`, {
                startTime: editForm.startTime + ':00',
                endTime: format(endTime, 'HH:mm:ss'), duration: editForm.duration,
                courseId: editForm.courseId || null
            });
            onShowSnackbar('Занятие обновлено', 'success');
            setOpenEditDialog(false);
            onRefresh();
        } catch (err) { onShowSnackbar('Ошибка', 'error'); }
    };

    const handleReplaceClick = (lesson) => {
        setCancelledLesson(lesson);
        setSelectedDebtorId('');
        setOpenReplaceDialog(true);
        setAnchorEl(null);
    };

    const handleConfirmReplace = async () => {
        if (!cancelledLesson || !selectedDebtorId) return;
        try {
            await replaceCancelledWithResurrect(cancelledLesson.id, parseInt(selectedDebtorId));
            onShowSnackbar('✅ Урок заменён на отработку долга', 'success');
            setOpenReplaceDialog(false);
            setCancelledLesson(null);
            onRefresh();
        } catch (err) {
            onShowSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    // ========== РЕНДЕР ==========
    return (
        <>
            <CalendarPaper elevation={0}>
                {/* Заголовки дней */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                    <Box sx={{ width: 56, p: 1 }} />
                    {weekDates.map((date, idx) => {
                        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        return (
                            <DayHeader key={idx} isToday={isToday}>
                                <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#1F2937' }}>
                                    {format(date, 'EEEEEE', { locale: ru }).toUpperCase()}
                                </Typography>
                                <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>
                                    {format(date, 'd MMM', { locale: ru })}
                                </Typography>
                            </DayHeader>
                        );
                    })}
                </Box>

                {/* Сетка времени */}
                <Box sx={{ display: 'flex', position: 'relative' }}>
                    {/* Шкала времени */}
                    <Box sx={{ width: 56, flexShrink: 0 }}>
                        {timeSlots.map((time, idx) => (
                            <TimeLabel key={time} sx={{ 
                                height: HOUR_HEIGHT / 2, 
                                borderBottom: idx % 2 === 0 ? '1px solid #E5E7EB' : '1px solid #F3F4F6',
                            }}>
                                {idx % 2 === 0 && (
                                    <Typography variant="caption" sx={{ 
                                        position: 'absolute', top: -8, right: 4, 
                                        fontWeight: 500, color: '#9CA3AF', fontSize: '10px',
                                    }}>
                                        {time}
                                    </Typography>
                                )}
                            </TimeLabel>
                        ))}
                    </Box>

                    {/* Колонки дней */}
                    {weekDates.map((date, dayIdx) => {
                        const dayLessons = getLessonsForDate(date);
                        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        
                        return (
                            <Box
                                key={dayIdx}
                                sx={{ 
                                    flex: 1, position: 'relative', 
                                    borderLeft: '1px solid #F3F4F6', 
                                    minHeight: timeSlots.length * (HOUR_HEIGHT / 2), 
                                    cursor: 'pointer',
                                    backgroundColor: isToday ? '#FAFBFF' : '#FFFFFF',
                                }}
                                onClick={(e) => handleSlotClick(date, e)}
                                onMouseMove={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    const y = e.clientY - rect.top;
                                    const startTime = positionToTime(y);
                                    const [h, m] = startTime.split(':').map(Number);
                                    const roundedM = Math.round(m / 15) * 15;
                                    const roundedTime = `${h.toString().padStart(2, '0')}:${roundedM.toString().padStart(2, '0')}`;
                                    setHoverSlot({ date, startTime: roundedTime });
                                }}
                                onMouseLeave={() => setHoverSlot(null)}
                            >
                                {/* Фоновые линии */}
                                {timeSlots.map((_, idx) => (
                                    <Box key={idx} sx={{ 
                                        height: HOUR_HEIGHT / 2, 
                                        borderBottom: idx % 2 === 0 ? '1px solid #E5E7EB' : '1px solid #F9FAFB',
                                    }} />
                                ))}

                                {/* Ховер-слот */}
                                {hoverSlot && format(hoverSlot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && (() => {
                                    const [h, m] = hoverSlot.startTime.split(':').map(Number);
                                    const hourTop = (h - 8) * HOUR_HEIGHT;
                                    const minuteOffset = (m / 60) * HOUR_HEIGHT;
                                    const top = hourTop + minuteOffset - HOUR_HEIGHT / 4;
                                    const displayTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
                                    return (
                                        <HoverSlot sx={{ top, height: HOUR_HEIGHT / 2 }}>
                                            <Typography sx={{ 
                                                color: '#4F46E5', fontWeight: 600, fontSize: '12px',
                                            }}>
                                                + {displayTime}
                                            </Typography>
                                        </HoverSlot>
                                    );
                                })()}

                                {/* Блоки занятий */}
                                {dayLessons.map(lesson => {
                                    const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                    const top = timeToPosition(lesson);
                                    const height = ((lesson.duration || 60) / 60) * HOUR_HEIGHT;
                                    return (
                                        <LessonBlock
                                            key={lesson.id}
                                            statusStyle={statusStyle}
                                            sx={{ top, height }}
                                            onClick={(e) => handleLessonClick(e, lesson)}
                                        >
                                            <Typography sx={{ 
                                                fontWeight: 600, fontSize: '11px', color: statusStyle.text,
                                                lineHeight: 1.2,
                                            }}>
                                                {lesson.student?.fullName}
                                            </Typography>
                                            <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                                {formatLessonTime(lesson.lessonDate, lesson.startTime)} ({lesson.duration || 60} мин)
                                            </Typography>
                                            {lesson.course && (
                                                <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>
                                                    {lesson.course.name}
                                                </Typography>
                                            )}
                                        </LessonBlock>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </CalendarPaper>

            {/* Меню при клике на занятие */}
            <StyledMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                {selectedLesson?.status === 'CANCELLED' ? (
                    <MenuItem onClick={() => handleReplaceClick(selectedLesson)} sx={{ fontSize: '14px', gap: 1 }}>
                        <WorkIcon sx={{ fontSize: 18, color: '#10B981' }} />
                        Заменить на отработку долга
                    </MenuItem>
                ) : (
                    [
                        <MenuItem key="edit" onClick={handleEditLesson} sx={{ fontSize: '14px', gap: 1 }}>
                            <Edit sx={{ fontSize: 18, color: '#6B7280' }} />
                            Редактировать
                        </MenuItem>,
                        <MenuItem key="delete" onClick={handleDeleteLesson} sx={{ fontSize: '14px', gap: 1 }}>
                            <Delete sx={{ fontSize: 18, color: '#EF4444' }} />
                            Удалить
                        </MenuItem>
                    ]
                )}
            </StyledMenu>

            {/* Диалог создания занятия */}
            <StyledDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Добавить занятие
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                            {createForm.date}, {createForm.startTime}
                        </Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Длительность</InputLabel>
                            <Select value={createForm.duration} onChange={(e) => setCreateForm({...createForm, duration: e.target.value})} label="Длительность"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                <MenuItem value={30}>30 минут</MenuItem><MenuItem value={45}>45 минут</MenuItem>
                                <MenuItem value={60}>1 час</MenuItem><MenuItem value={90}>1,5 часа</MenuItem>
                                <MenuItem value={120}>2 часа</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Ученик</InputLabel>
                            <Select value={createForm.studentId} onChange={(e) => setCreateForm({...createForm, studentId: e.target.value})} label="Ученик"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Предмет</InputLabel>
                            <Select value={createForm.courseId} onChange={(e) => setCreateForm({...createForm, courseId: e.target.value})} label="Предмет"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenCreateDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSaveCreate} variant="contained" disabled={!createForm.studentId}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>Добавить</StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Диалог редактирования */}
            <StyledDialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Редактировать занятие
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <TextField label="Время начала" type="time" value={editForm.startTime}
                            onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                            fullWidth sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            InputLabelProps={{ shrink: true }} inputProps={{ step: 300 }} />
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Длительность</InputLabel>
                            <Select value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: e.target.value})} label="Длительность"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                <MenuItem value={30}>30 минут</MenuItem><MenuItem value={45}>45 минут</MenuItem>
                                <MenuItem value={60}>1 час</MenuItem><MenuItem value={90}>1,5 часа</MenuItem>
                                <MenuItem value={120}>2 часа</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Предмет</InputLabel>
                            <Select value={editForm.courseId} onChange={(e) => setEditForm({...editForm, courseId: e.target.value})} label="Предмет"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenEditDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSaveEdit} variant="contained"
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>Сохранить</StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Диалог замены на отработку */}
            <StyledDialog open={openReplaceDialog} onClose={() => setOpenReplaceDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Заменить отменённый урок на отработку долга
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                            Отменённый урок: {cancelledLesson?.lessonDate} в {cancelledLesson?.startTime?.slice(0,5)}
                        </Typography>
                        {debtors.length > 0 ? (
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontSize: '14px' }}>Выберите должника</InputLabel>
                                <Select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} label="Выберите должника"
                                    sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                    {debtors.map(student => (
                                        <MenuItem key={student.id} value={student.id}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: '14px' }}>{student.fullName}</Typography>
                                                <Chip
                                                    label={`Долг: ${student.debtLessons || student.missedLessons || 0}`}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: '#FFFBEB', color: '#92400E', 
                                                        fontWeight: 500, borderRadius: '100px', fontSize: '11px',
                                                    }}
                                                />
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        ) : (
                            <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                                Нет учеников с долгами
                            </Alert>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenReplaceDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleConfirmReplace} variant="contained" disabled={!selectedDebtorId}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                        Заменить
                    </StyledButton>
                </DialogActions>
            </StyledDialog>
        </>
    );
}

export default WeekCalendar;