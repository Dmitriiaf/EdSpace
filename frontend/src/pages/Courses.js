// frontend/src/pages/Courses.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton,
    Alert, Snackbar, Chip, Typography, Grid, Card, CardContent,
    Avatar, LinearProgress, Tooltip, Tabs, Tab, Divider,
    CircularProgress, Menu, MenuItem, InputAdornment
} from '@mui/material';
import {
    Add, Edit, Delete, School, AttachMoney,
    People, CalendarToday, TrendingUp, MoreVert,
    BarChart, ShowChart, ArrowUpward, ArrowDownward,
    ColorLens, Close, Info
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ColorPicker from '../components/ColorPicker';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';

function Courses() {
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [lessons, setLessons] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [anchorEl, setAnchorEl] = useState(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        name: '',
        color: '#3B82F6',
        tutorId: user?.id
    });

    // Статистика по курсам
    const [courseStats, setCourseStats] = useState({});

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [coursesRes, studentsRes, lessonsRes, paymentsRes] = await Promise.all([
                axios.get(`http://localhost:8080/api/courses/tutor/${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/students/tutor/${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/lessons/all?tutorId=${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/payments/tutor/${user.id}`, { headers })
            ]);

            setCourses(coursesRes.data);
            setStudents(studentsRes.data);
            setLessons(lessonsRes.data);
            setPayments(paymentsRes.data);
            
            calculateCourseStats(coursesRes.data, studentsRes.data, lessonsRes.data, paymentsRes.data);
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке:', err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const calculateCourseStats = (coursesData, studentsData, lessonsData, paymentsData) => {
        const stats = {};
        
        coursesData.forEach(course => {
            // Ученики, которые занимаются этим курсом
            const courseStudents = studentsData.filter(s => 
                s.course?.id === course.id || 
                lessonsData.some(l => l.course?.id === course.id && l.student?.id === s.id)
            );
            const uniqueStudents = [...new Map(courseStudents.map(s => [s.id, s])).values()];
            
            // Занятия по курсу
            const courseLessons = lessonsData.filter(l => l.course?.id === course.id);
            const completedLessons = courseLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID');
            const paidLessons = courseLessons.filter(l => l.status === 'PAID');
            
            // Доход по курсу
            const coursePayments = paymentsData.filter(p => 
                p.courseName === course.name || 
                lessonsData.some(l => l.id === p.lesson?.id && l.course?.id === course.id)
            );
            const totalIncome = coursePayments
                .filter(p => p.status === 'paid')
                .reduce((sum, p) => sum + p.amount, 0);
            
            // Динамика по месяцам (последние 6 месяцев)
            const now = new Date();
            const months = eachMonthOfInterval({
                start: subMonths(now, 5),
                end: now
            });
            
            const monthlyStats = months.map(month => {
                const start = startOfMonth(month);
                const end = endOfMonth(month);
                const monthLessons = courseLessons.filter(l => {
                    const lessonDate = new Date(l.lessonDate);
                    return lessonDate >= start && lessonDate <= end;
                });
                return {
                    month: format(month, 'MMM', { locale: ru }),
                    count: monthLessons.length,
                    completed: monthLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length
                };
            });
            
            stats[course.id] = {
                studentsCount: uniqueStudents.length,
                lessonsCount: courseLessons.length,
                completedCount: completedLessons.length,
                paidCount: paidLessons.length,
                totalIncome,
                monthlyStats,
                students: uniqueStudents.slice(0, 5), // последние 5 учеников
                progress: courseLessons.length > 0 
                    ? (completedLessons.length / courseLessons.length) * 100 
                    : 0
            };
        });
        
        setCourseStats(stats);
    };

    const handleOpenDialog = (course = null) => {
        if (course) {
            setEditingCourse(course);
            setFormData({
                name: course.name,
                color: course.color || '#3B82F6',
                tutorId: user.id
            });
        } else {
            setEditingCourse(null);
            setFormData({
                name: '',
                color: '#3B82F6',
                tutorId: user.id
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCourse(null);
        setFormData({
            name: '',
            color: '#3B82F6',
            tutorId: user.id
        });
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleColorChange = (newColor) => {
        setFormData({
            ...formData,
            color: newColor
        });
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            if (editingCourse) {
                await axios.put(`http://localhost:8080/api/courses/${editingCourse.id}`, formData, { headers });
                showSnackbar('Курс обновлён', 'success');
            } else {
                await axios.post('http://localhost:8080/api/courses', formData, { headers });
                showSnackbar('Курс добавлен', 'success');
            }
            
            handleCloseDialog();
            fetchData();
        } catch (err) {
            console.error('Ошибка при сохранении:', err);
            showSnackbar('Ошибка при сохранении курса', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить курс?')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`http://localhost:8080/api/courses/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                showSnackbar('Курс удалён', 'success');
                fetchData();
            } catch (err) {
                console.error('Ошибка при удалении:', err);
                showSnackbar('Ошибка при удалении курса', 'error');
            }
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const handleMenuOpen = (event, course) => {
        setAnchorEl(event.currentTarget);
        setSelectedCourse(course);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCourse(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    // Общая статистика по всем курсам
    const totalStats = {
        coursesCount: courses.length,
        totalStudents: Object.values(courseStats).reduce((sum, s) => sum + s.studentsCount, 0),
        totalLessons: Object.values(courseStats).reduce((sum, s) => sum + s.lessonsCount, 0),
        totalIncome: Object.values(courseStats).reduce((sum, s) => sum + s.totalIncome, 0)
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
                        Аналитика курсов
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Статистика и управление учебными курсами
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => handleOpenDialog()}
                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500 }}
                >
                    Добавить курс
                </Button>
            </Box>

            {/* Общая статистика */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                        {totalStats.coursesCount}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Всего курсов
                                    </Typography>
                                </Box>
                                <School sx={{ fontSize: 40, color: '#3B82F6', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#10B981' }}>
                                        {totalStats.totalStudents}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Всего учеников
                                    </Typography>
                                </Box>
                                <People sx={{ fontSize: 40, color: '#10B981', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                        {totalStats.totalLessons}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Всего занятий
                                    </Typography>
                                </Box>
                                <CalendarToday sx={{ fontSize: 40, color: '#F59E0B', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                                        {totalStats.totalIncome.toLocaleString()} ₽
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Общий доход
                                    </Typography>
                                </Box>
                                <AttachMoney sx={{ fontSize: 40, color: '#8B5CF6', opacity: 0.3 }} />
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : courses.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <School sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        У вас пока нет курсов
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                        Нажмите "Добавить курс" чтобы создать первый
                    </Typography>
                    <Button variant="outlined" startIcon={<Add />} onClick={() => handleOpenDialog()}>
                        Добавить курс
                    </Button>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {courses.map((course) => {
                        const stats = courseStats[course.id] || {
                            studentsCount: 0,
                            lessonsCount: 0,
                            completedCount: 0,
                            totalIncome: 0,
                            monthlyStats: [],
                            students: [],
                            progress: 0
                        };
                        
                        return (
                            <Grid item xs={12} md={6} key={course.id}>
                                <Card 
                                    sx={{ 
                                        borderRadius: 3,
                                        overflow: 'hidden',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                            boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                                        }
                                    }}
                                >
                                    {/* Цветная полоска */}
                                    <Box sx={{ height: 4, bgcolor: course.color || '#3B82F6' }} />
                                    
                                    <CardContent>
                                        {/* Заголовок курса */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar 
                                                    sx={{ 
                                                        bgcolor: course.color || '#3B82F6',
                                                        width: 40,
                                                        height: 40
                                                    }}
                                                >
                                                    <School />
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {course.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        ID: {course.id}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <IconButton onClick={(e) => handleMenuOpen(e, course)}>
                                                <MoreVert />
                                            </IconButton>
                                        </Box>

                                        {/* Статистика курса */}
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                                        {stats.studentsCount}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Учеников
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                                                        {stats.lessonsCount}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Занятий
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                                        {stats.completedCount}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Проведено
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>

                                        {/* Прогресс */}
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Прогресс прохождения
                                                </Typography>
                                                <Typography variant="caption" fontWeight={500}>
                                                    {Math.round(stats.progress)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={stats.progress}
                                                sx={{ 
                                                    borderRadius: 1, 
                                                    height: 6,
                                                    bgcolor: '#e0e0e0',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: course.color || '#3B82F6'
                                                    }
                                                }}
                                            />
                                        </Box>

                                        {/* Доход */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, p: 1, bgcolor: '#f5f5f5', borderRadius: 2 }}>
                                            <AttachMoney sx={{ fontSize: 18, color: '#2E7D32' }} />
                                            <Typography variant="body2" sx={{ fontWeight: 500, color: '#2E7D32' }}>
                                                Доход: {stats.totalIncome.toLocaleString()} ₽
                                            </Typography>
                                        </Box>

                                        {/* Ученики */}
                                        {stats.students.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                    <People sx={{ fontSize: 14 }} />
                                                    Ученики
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {stats.students.map(student => (
                                                        <Tooltip key={student.id} title={`${student.fullName} - ${student.ratePerLesson || '—'} ₽/занятие`}>
                                                            <Chip
                                                                avatar={<Avatar sx={{ bgcolor: '#ff6b6b', width: 24, height: 24, fontSize: 12 }}>{student.fullName?.charAt(0)}</Avatar>}
                                                                label={student.fullName}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                    {stats.studentsCount > 5 && (
                                                        <Chip 
                                                            label={`+${stats.studentsCount - 5}`} 
                                                            size="small" 
                                                            variant="outlined" 
                                                        />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* График динамики */}
                                        {stats.monthlyStats.length > 0 && (
                                            <Box>
                                                <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                    <TrendingUp sx={{ fontSize: 14 }} />
                                                    Динамика занятий
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 60 }}>
                                                    {stats.monthlyStats.map((month, idx) => {
                                                        const maxCount = Math.max(...stats.monthlyStats.map(m => m.count), 1);
                                                        const height = (month.count / maxCount) * 50;
                                                        return (
                                                            <Tooltip key={idx} title={`${month.month}: ${month.count} занятий (${month.completed} проведено)`}>
                                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                                    <Box 
                                                                        sx={{ 
                                                                            height: height,
                                                                            bgcolor: course.color || '#3B82F6',
                                                                            borderRadius: 1,
                                                                            transition: 'height 0.3s',
                                                                            opacity: 0.7
                                                                        }}
                                                                    />
                                                                    <Typography variant="caption" sx={{ fontSize: '0.65rem', mt: 0.5, display: 'block' }}>
                                                                        {month.month}
                                                                    </Typography>
                                                                </Box>
                                                            </Tooltip>
                                                        );
                                                    })}
                                                </Box>
                                            </Box>
                                        )}
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* Меню действий для курса */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <MenuItem onClick={() => {
                    handleMenuClose();
                    handleOpenDialog(selectedCourse);
                }}>
                    <Edit sx={{ mr: 1, fontSize: 18 }} /> Редактировать
                </MenuItem>
                <MenuItem onClick={() => {
                    handleMenuClose();
                    if (selectedCourse) handleDelete(selectedCourse.id);
                }}>
                    <Delete sx={{ mr: 1, fontSize: 18, color: 'error.main' }} /> Удалить
                </MenuItem>
            </Menu>

            {/* Диалог добавления/редактирования */}
            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingCourse ? 'Редактировать курс' : 'Добавить новый курс'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Название курса"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            autoFocus
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <School color="action" />
                                    </InputAdornment>
                                )
                            }}
                        />
                        
                        <Box sx={{ mt: 2, mb: 1 }}>
                            <ColorPicker 
                                value={formData.color}
                                onChange={handleColorChange}
                            />
                        </Box>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Курс поможет группировать занятия и отслеживать статистику по предметам.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained" 
                        disabled={!formData.name}
                    >
                        {editingCourse ? 'Сохранить' : 'Добавить'}
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Courses;