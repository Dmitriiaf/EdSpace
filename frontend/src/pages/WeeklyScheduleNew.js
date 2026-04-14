// ========== frontend/src/pages/WeeklyScheduleNew.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Add, Delete, Edit, Refresh as RefreshIcon } from '@mui/icons-material';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    IconButton, Alert, CircularProgress, Chip, Snackbar,
    Card, CardContent, Grid, Avatar
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
// ✅ Импорт из объединённого API
import { getAllLessons, generateLessons, deleteLesson } from '../services/api';

const DAYS = [
    { id: 1, name: 'ПН' },
    { id: 2, name: 'ВТ' },
    { id: 3, name: 'СР' },
    { id: 4, name: 'ЧТ' },
    { id: 5, name: 'ПТ' },
    { id: 6, name: 'СБ' },
    { id: 7, name: 'ВС' }
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
        studentId: '',
        courseId: '',
        dayOfWeek: 1,
        startTime: '10:00',
        endTime: '11:00'
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            // ✅ Заменено на API-функцию для занятий
            const lessonsData = await getAllLessons(user.id);
            const lessonsArray = lessonsData.data !== undefined ? lessonsData.data : lessonsData;
            
            const [templatesRes, studentsRes, coursesRes] = await Promise.all([
                axios.get(`http://localhost:8080/api/weekly-template/tutor/${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/students/tutor/${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/courses/tutor/${user.id}`, { headers })
            ]);
            
            setTemplates(templatesRes.data);
            setLessons(Array.isArray(lessonsArray) ? lessonsArray : []);
            setStudents(studentsRes.data);
            setCourses(coursesRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Ошибка загрузки данных');
            setLoading(false);
        }
    };

    const handleGenerateLessons = async () => {
        try {
            // ✅ Заменено на API-функцию
            await generateLessons();
            showSnackbar('✅ Занятия созданы на месяц вперёд (существующие не изменены)', 'success');
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const goToPreviousWeek = () => setCurrentWeekOffset(currentWeekOffset - 1);
    const goToNextWeek = () => setCurrentWeekOffset(currentWeekOffset + 1);
    const goToCurrentWeek = () => setCurrentWeekOffset(0);

    const getWeekDates = () => {
        const dates = [];
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + (currentWeekOffset * 7));
        
        const dayOfWeek = targetDate.getDay();
        const diffToMonday = dayOfWeek === 0 ? 1 : -(dayOfWeek - 1);
        const monday = new Date(targetDate);
        monday.setDate(targetDate.getDate() + diffToMonday);
        monday.setHours(0, 0, 0, 0);
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            dates.push(date);
        }
        return dates;
    };

    const getTemplate = (dayId, timeSlot) => {
        return templates.find(t => 
            t.dayOfWeek === dayId && 
            t.startTime === timeSlot + ':00'
        );
    };

    const getLessonForSlot = (date, timeSlot) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const lessonDate = `${year}-${month}-${day}`;
        
        return lessons.find(l => 
            l.lessonDate === lessonDate && 
            l.startTime === timeSlot + ':00'
        );
    };

    const getDailyIncome = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day}`;
        
        const dayLessons = lessons.filter(l => l.lessonDate === dateStr);
        let total = 0;
        dayLessons.forEach(l => {
            if (l.status === 'PAID' && l.student?.paymentType !== 'subscription') {
                const rate = getStudentRateForTutor(l.student, user?.id);
                total += rate || 0;
            }
        });
        return total;
    };

    const getTotalIncome = () => {
        const weekDates = getWeekDates();
        let total = 0;
        weekDates.forEach(date => {
            total += getDailyIncome(date);
        });
        return total;
    };

    const handleAddClick = (dayId, timeSlot) => {
        setEditingTemplate(null);
        setFormData({
            studentId: '',
            courseId: '',
            dayOfWeek: dayId,
            startTime: timeSlot,
            endTime: (parseInt(timeSlot.split(':')[0]) + 1).toString().padStart(2, '0') + ':00'
        });
        setOpenDialog(true);
    };

    const handleEditClick = (template) => {
        if (!template) return;
        setEditingTemplate(template);
        setFormData({
            studentId: template.student?.id || '',
            courseId: template.course?.id || '',
            dayOfWeek: template.dayOfWeek,
            startTime: template.startTime?.slice(0,5) || '10:00',
            endTime: template.endTime?.slice(0,5) || '11:00'
        });
        setOpenDialog(true);
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm('Удалить этот шаблон?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:8080/api/weekly-template/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showSnackbar('Шаблон удалён', 'success');
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка при удалении', 'error');
        }
    };

    const handleDeleteLesson = async (lessonId) => {
        if (!window.confirm('Удалить это занятие? Оно будет удалено без возможности восстановления.')) return;
        
        try {
            // ✅ Заменено на API-функцию
            await deleteLesson(lessonId);
            showSnackbar('Занятие удалено', 'success');
            fetchData();
        } catch (err) {
            showSnackbar('Ошибка при удалении занятия', 'error');
        }
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const data = {
                tutorId: user.id,
                studentId: formData.studentId,
                courseId: formData.courseId || null,
                dayOfWeek: formData.dayOfWeek,
                startTime: formData.startTime + ':00',
                endTime: formData.endTime + ':00'
            };
            
            if (editingTemplate) {
                await axios.put(`http://localhost:8080/api/weekly-template/${editingTemplate.id}`, data, { headers });
                showSnackbar('Шаблон обновлён', 'success');
            } else {
                await axios.post('http://localhost:8080/api/weekly-template', data, { headers });
                showSnackbar('Шаблон добавлен', 'success');
            }
            
            setOpenDialog(false);
            fetchData();
        } catch (err) {
            console.error('Ошибка при сохранении:', err);
            const errorMessage = err.response?.data?.error || 'Ошибка при сохранении шаблона';
            showSnackbar(errorMessage, 'error');
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const formatDate = (date) => {
        return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    };

    const weekDates = getWeekDates();
    const totalIncome = getTotalIncome();

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                        Расписание
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Управление постоянными занятиями и расписанием на неделю
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<RefreshIcon />}
                    onClick={handleGenerateLessons}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                >
                    Создать занятия на месяц
                </Button>
            </Box>

            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={goToPreviousWeek}
                        sx={{ minWidth: 'auto', px: 1, borderRadius: 2 }}
                    >
                        ←
                    </Button>
                    <Typography variant="body1" sx={{ mx: 1, fontWeight: 500 }}>
                        {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
                    </Typography>
                    <Button 
                        size="small" 
                        variant="outlined" 
                        onClick={goToNextWeek}
                        sx={{ minWidth: 'auto', px: 1, borderRadius: 2 }}
                    >
                        →
                    </Button>
                    <Button 
                        size="small" 
                        variant="text" 
                        onClick={goToCurrentWeek}
                        sx={{ ml: 1, borderRadius: 2 }}
                    >
                        Сегодня
                    </Button>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#FEF7E0', border: '1px solid #B45F06' }} />
                        <Typography variant="caption">Шаблон</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#E8F5E9', border: '1px solid #1B5E20' }} />
                        <Typography variant="caption">Оплачено</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 1, bgcolor: '#FEF2F2', border: '1px solid #C62828' }} />
                        <Typography variant="caption">Отменено</Typography>
                    </Box>
                </Box>
            </Paper>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <TableContainer sx={{ overflowX: 'auto' }}>
                    <Table stickyHeader size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ bgcolor: '#f8f9fa', fontWeight: 600, minWidth: 100 }}>
                                    Время
                                </TableCell>
                                {DAYS.map((day, index) => {
                                    const date = weekDates[index];
                                    const dailyIncome = getDailyIncome(date);
                                    return (
                                        <TableCell 
                                            key={day.id} 
                                            align="center" 
                                            sx={{ 
                                                bgcolor: '#f8f9fa', 
                                                fontWeight: 600,
                                                minWidth: 140
                                            }}
                                        >
                                            <Box>
                                                {day.name}
                                                <Typography variant="caption" display="block" color="textSecondary">
                                                    {formatDate(date)}
                                                </Typography>
                                                {dailyIncome > 0 && (
                                                    <Typography variant="caption" display="block" color="success.main" fontWeight="bold">
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
                                const timeDisplay = `${timeSlot}-${endHour.toString().padStart(2, '0')}:00`;
                                
                                return (
                                    <TableRow key={timeSlot} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                        <TableCell sx={{ fontWeight: 500, bgcolor: '#fafafa' }}>
                                            {timeDisplay}
                                        </TableCell>
                                        {DAYS.map((day, index) => {
                                            const date = weekDates[index];
                                            const lesson = getLessonForSlot(date, timeSlot);
                                            const template = getTemplate(day.id, timeSlot);
                                            
                                            if (lesson) {
                                                const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                                const student = students.find(s => s.id === lesson.student?.id);
                                                const hasTemplate = template !== null && template !== undefined;
                                                const studentRate = getStudentRateForTutor(lesson.student, user?.id);
                                                
                                                return (
                                                    <TableCell 
                                                        key={day.id}
                                                        sx={{ 
                                                            bgcolor: statusStyle.bg,
                                                            p: 1,
                                                            minWidth: 140,
                                                            border: '1px solid #e0e0e0',
                                                            position: 'relative'
                                                        }}
                                                    >
                                                        <Box>
                                                            <Typography variant="body2" fontWeight={600} sx={{ color: statusStyle.text }}>
                                                                {lesson.student?.fullName}
                                                            </Typography>
                                                            {lesson.course && (
                                                                <Typography variant="caption" display="block" color="textSecondary">
                                                                    {lesson.course.name}
                                                                </Typography>
                                                            )}
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
                                                                {template.student?.fullName}
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
                                                        border: '1px solid #e0e0e0'
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
                                <TableCell sx={{ fontWeight: 600 }}>
                                    Итого за неделю:
                                </TableCell>
                                <TableCell colSpan={7} sx={{ bgcolor: '#f8f9fa' }}>
                                    <Typography variant="h6" color="success.main" fontWeight={600}>
                                        {totalIncome} ₽
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                    </Table>
                </TableContainer>
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingTemplate ? 'Редактировать постоянное занятие' : 'Добавить постоянное занятие'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            {DAYS.find(d => d.id === formData.dayOfWeek)?.name}, {formData.startTime} - {formData.endTime}
                        </Typography>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Ученик</InputLabel>
                            <Select
                                value={formData.studentId}
                                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                                label="Ученик"
                            >
                                {students.map(s => {
                                    const rate = getStudentRateForTutor(s, user?.id);
                                    return (
                                        <MenuItem key={s.id} value={s.id}>
                                            {s.fullName} ({rate || '—'} ₽/час)
                                        </MenuItem>
                                    );
                                })}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth margin="normal">
                            <InputLabel>Предмет (необязательно)</InputLabel>
                            <Select
                                value={formData.courseId}
                                onChange={(e) => setFormData({...formData, courseId: e.target.value})}
                                label="Предмет"
                            >
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>
                                        {c.name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Это постоянное занятие будет автоматически добавляться в расписание каждую неделю.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    {editingTemplate && (
                        <Button onClick={() => handleDeleteTemplate(editingTemplate.id)} color="error">
                            Удалить
                        </Button>
                    )}
                    <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
                    <Button 
                        onClick={handleSave} 
                        variant="contained" 
                        disabled={!formData.studentId}
                    >
                        {editingTemplate ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default WeeklySchedule;