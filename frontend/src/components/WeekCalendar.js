// ========== frontend/src/components/WeekCalendar.js ==========
import React, { useState } from 'react';
import {
    Box, Typography, Paper, Chip, Card, CardContent, Avatar,
    Menu, MenuItem, Dialog, DialogTitle, DialogContent,
    DialogActions, Button, TextField, FormControl,
    InputLabel, Select
} from '@mui/material';
import { Edit, Delete, Work as WorkIcon } from '@mui/icons-material';
import { format, addMinutes, parse } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance from '../api/axiosConfig';

const HOUR_HEIGHT = 60;
const MIN_STEP = 15;

const STATUS_COLORS = {
    SCHEDULED: { bg: '#FEF7E0', text: '#B45F06', label: 'Запланировано' },
    COMPLETED: { bg: '#FEF3E0', text: '#C4450C', label: 'Проведено' },
    PAID: { bg: '#E8F5E9', text: '#1B5E20', label: 'Оплачено' },
    CANCELLED: { bg: '#FEF2F2', text: '#C62828', label: 'Отменено' },
    RESCHEDULED: { bg: '#E8F0FE', text: '#1A73E8', label: 'Перенесено' }
};

function WeekCalendar({ weekDates, lessons, students, courses, debtors, user, onRefresh, onShowSnackbar, onOpenResurrect }) {
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [createForm, setCreateForm] = useState({ date: '', startTime: '', duration: 60, studentId: '', courseId: '' });
    const [editForm, setEditForm] = useState({ startTime: '', duration: 60, courseId: '' });
    const [hoverSlot, setHoverSlot] = useState(null);

    const timeSlots = [];
    for (let h = 8; h <= 23; h++) {
        timeSlots.push(`${h.toString().padStart(2, '0')}:00`);
        timeSlots.push(`${h.toString().padStart(2, '0')}:30`);
    }

    const timeToPosition = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return (h - 8) * HOUR_HEIGHT + (m / 60) * HOUR_HEIGHT - HOUR_HEIGHT / 2;
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
            return !(newEnd <= lStart || newStart >= lEnd);
        });
    };

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
        } catch (err) {
            onShowSnackbar('Ошибка', 'error');
        }
        setAnchorEl(null);
    };

    const handleSaveCreate = async () => {
        if (!createForm.studentId) {
            onShowSnackbar('Выберите ученика', 'error');
            return;
        }
        const lessonDate = parse(createForm.date, 'yyyy-MM-dd', new Date());
        if (checkTimeConflict(lessonDate, createForm.startTime, createForm.duration)) {
            onShowSnackbar('❌ Время занято', 'error');
            return;
        }
        try {
            const endTime = addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration);
            await axiosInstance.post('/lessons', {
                tutorId: user.id,
                studentId: createForm.studentId,
                lessonDate: createForm.date,
                startTime: createForm.startTime + ':00',
                endTime: format(endTime, 'HH:mm:ss'),
                duration: createForm.duration,
                courseId: createForm.courseId || null
            });
            onShowSnackbar('✅ Занятие создано', 'success');
            setOpenCreateDialog(false);
            onRefresh();
        } catch (err) {
            onShowSnackbar('Ошибка', 'error');
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedLesson) return;
        const lessonDate = parse(selectedLesson.lessonDate, 'yyyy-MM-dd', new Date());
        if (checkTimeConflict(lessonDate, editForm.startTime, editForm.duration, selectedLesson.id)) {
            onShowSnackbar('❌ Время занято', 'error');
            return;
        }
        try {
            const endTime = addMinutes(parse(editForm.startTime, 'HH:mm', new Date()), editForm.duration);
            await axiosInstance.put(`/lessons/${selectedLesson.id}`, {
                startTime: editForm.startTime + ':00',
                endTime: format(endTime, 'HH:mm:ss'),
                duration: editForm.duration,
                courseId: editForm.courseId || null
            });
            onShowSnackbar('Занятие обновлено', 'success');
            setOpenEditDialog(false);
            onRefresh();
        } catch (err) {
            onShowSnackbar('Ошибка', 'error');
        }
    };

    return (
        <>
            

            {/* Календарь */}
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0', bgcolor: '#f8f9fa' }}>
                    <Box sx={{ width: 60, p: 1 }} />
                    {weekDates.map((date, idx) => (
                        <Box key={idx} sx={{ flex: 1, textAlign: 'center', p: 1, borderLeft: '1px solid #e0e0e0' }}>
                            <Typography variant="body2" fontWeight={600}>
                                {format(date, 'EEEEEE', { locale: ru }).toUpperCase()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                {format(date, 'd MMM', { locale: ru })}
                            </Typography>
                        </Box>
                    ))}
                </Box>

                <Box sx={{ display: 'flex', position: 'relative' }}>
                    <Box sx={{ width: 60, flexShrink: 0 }}>
                        {timeSlots.map((time, idx) => (
                            <Box key={time} sx={{ height: HOUR_HEIGHT / 2, borderBottom: idx % 2 === 0 ? '1px solid #ccc' : '1px solid #eee', pr: 1, textAlign: 'right', fontSize: 11, color: '#666', position: 'relative' }}>
                                {idx % 2 === 0 && (
                                    <Typography variant="caption" sx={{ position: 'absolute', top: -8, right: 4, fontWeight: 500 }}>
                                        {time}
                                    </Typography>
                                )}
                            </Box>
                        ))}
                    </Box>

                    {weekDates.map((date, dayIdx) => {
                        const dayLessons = getLessonsForDate(date);
                        return (
                            <Box
                                key={dayIdx}
                                sx={{ flex: 1, position: 'relative', borderLeft: '1px solid #e0e0e0', minHeight: timeSlots.length * (HOUR_HEIGHT / 2), cursor: 'pointer' }}
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
                                {timeSlots.map((_, idx) => (
                                    <Box key={idx} sx={{ height: HOUR_HEIGHT / 2, borderBottom: idx % 2 === 0 ? '1px solid #e0e0e0' : '1px solid #f5f5f5' }} />
                                ))}

                                {hoverSlot && format(hoverSlot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && (
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: timeToPosition(hoverSlot.startTime),
                                            left: 4,
                                            right: 4,
                                            height: HOUR_HEIGHT,
                                            bgcolor: 'rgba(25, 118, 210, 0.1)',
                                            border: '1px dashed #1976d2',
                                            borderRadius: 1,
                                            pointerEvents: 'none',
                                            zIndex: 20
                                        }}
                                    />
                                )}

                                {dayLessons.map(lesson => {
                                    const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                    const top = timeToPosition(lesson.startTime.slice(0, 5));
                                    const height = ((lesson.duration || 60) / 60) * HOUR_HEIGHT;
                                    return (
                                        <Box
                                            key={lesson.id}
                                            sx={{
                                                position: 'absolute', top, left: 4, right: 4, height, zIndex: 5,
                                                bgcolor: statusStyle.bg, borderLeft: `4px solid ${statusStyle.text}`,
                                                borderRadius: 1, p: 0.5, overflow: 'hidden', cursor: 'pointer',
                                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)', '&:hover': { opacity: 0.9, zIndex: 10 }
                                            }}
                                            onClick={(e) => handleLessonClick(e, lesson)}
                                        >
                                            <Typography variant="caption" fontWeight={600} display="block">{lesson.student?.fullName}</Typography>
                                            <Typography variant="caption" display="block" fontSize={10}>{lesson.startTime.slice(0, 5)} ({lesson.duration || 60} мин)</Typography>
                                            {lesson.course && <Typography variant="caption" display="block" fontSize={10} color="textSecondary">{lesson.course.name}</Typography>}
                                        </Box>
                                    );
                                })}
                            </Box>
                        );
                    })}
                </Box>
            </Paper>

            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                <MenuItem onClick={handleEditLesson}><Edit sx={{ mr: 1, fontSize: 18 }} /> Редактировать</MenuItem>
                <MenuItem onClick={handleDeleteLesson}><Delete sx={{ mr: 1, fontSize: 18, color: 'error.main' }} /> Удалить</MenuItem>
            </Menu>

            <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Добавить занятие</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>{createForm.date}, {createForm.startTime}</Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Длительность</InputLabel>
                            <Select value={createForm.duration} onChange={(e) => setCreateForm({...createForm, duration: e.target.value})} label="Длительность">
                                <MenuItem value={30}>30 минут</MenuItem><MenuItem value={45}>45 минут</MenuItem><MenuItem value={60}>1 час</MenuItem><MenuItem value={90}>1,5 часа</MenuItem><MenuItem value={120}>2 часа</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Ученик</InputLabel>
                            <Select value={createForm.studentId} onChange={(e) => setCreateForm({...createForm, studentId: e.target.value})} label="Ученик">
                                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Предмет</InputLabel>
                            <Select value={createForm.courseId} onChange={(e) => setCreateForm({...createForm, courseId: e.target.value})} label="Предмет">
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreateDialog(false)}>Отмена</Button>
                    <Button onClick={handleSaveCreate} variant="contained" disabled={!createForm.studentId}>Добавить</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать занятие</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField label="Время начала" type="time" value={editForm.startTime} onChange={(e) => setEditForm({...editForm, startTime: e.target.value})} fullWidth margin="normal" inputProps={{ step: 300 }} />
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Длительность</InputLabel>
                            <Select value={editForm.duration} onChange={(e) => setEditForm({...editForm, duration: e.target.value})} label="Длительность">
                                <MenuItem value={30}>30 минут</MenuItem><MenuItem value={45}>45 минут</MenuItem><MenuItem value={60}>1 час</MenuItem><MenuItem value={90}>1,5 часа</MenuItem><MenuItem value={120}>2 часа</MenuItem>
                            </Select>
                        </FormControl>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Предмет</InputLabel>
                            <Select value={editForm.courseId} onChange={(e) => setEditForm({...editForm, courseId: e.target.value})} label="Предмет">
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)}>Отмена</Button>
                    <Button onClick={handleSaveEdit} variant="contained">Сохранить</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default WeekCalendar;