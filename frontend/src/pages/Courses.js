// ========== frontend/src/pages/Courses.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect, useMemo } from 'react';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, IconButton,
    Alert, Snackbar, Chip, Typography, Grid, Card, CardContent,
    Avatar, LinearProgress, Tooltip, Tabs, Tab, Divider,
    CircularProgress, Menu, MenuItem, InputAdornment, Autocomplete
} from '@mui/material';
import { useStudentRate } from '../hooks/useStudentRate';
import { styled } from '@mui/material/styles';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import {
    Add, Edit, Delete, School, AttachMoney,
    People, CalendarToday, TrendingUp, MoreVert,
    BarChart, ShowChart, ArrowUpward, ArrowDownward,
    ColorLens, Close, Info, Bookmark as BookIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import ColorPicker from '../components/ColorPicker';
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance from '../api/axiosConfig';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========



const CourseCard = styled(Card)({
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
    },
});

const CourseColorBar = styled(Box)(({ color }) => ({
    height: '4px',
    backgroundColor: color || '#4F46E5',
}));

const MiniStatBox = styled(Box)({
    textAlign: 'center',
    padding: '12px 8px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #F3F4F6',
});

const IncomeBox = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: '#ECFDF5',
    borderRadius: '8px',
    border: '1px solid #A7F3D0',
    marginBottom: '12px',
});

const ProgressBar = styled(Box)({
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    overflow: 'hidden',
    marginBottom: '4px',
});

const ProgressFill = styled(Box)(({ width, color }) => ({
    height: '100%',
    backgroundColor: color || '#4F46E5',
    borderRadius: '3px',
    width: `${width}%`,
    transition: 'width 0.4s ease',
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
function Courses() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate(); 
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
    const [subjects, setSubjects] = useState([]);
    const [selectedSubject, setSelectedSubject] = useState(null);
    
    const [formData, setFormData] = useState({
        name: '',
        color: '#4F46E5',
        tutorId: user?.id
    });

    const [courseStats, setCourseStats] = useState({});

    useEffect(() => {
        if (user) {
            fetchData();
            fetchSubjects();
        }
    }, [user]);

    const fetchSubjects = async () => {
        try {
            const response = await axiosInstance.get('/subjects');
            setSubjects(response.data);
        } catch (err) {
            console.error('Ошибка загрузки предметов:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [coursesRes, studentsRes, lessonsRes, paymentsRes] = await Promise.all([
                axiosInstance.get(`/courses/tutor/${user.id}`, { headers }),
                axiosInstance.get(`/students/tutor/${user.id}`, { headers }),
                axiosInstance.get(`/lessons/all?tutorId=${user.id}`, { headers }),
                axiosInstance.get(`/payments/tutor/${user.id}`, { headers })
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
            const courseStudents = studentsData.filter(s => 
                s.course?.id === course.id || 
                lessonsData.some(l => l.course?.id === course.id && l.student?.id === s.id)
            );
            const uniqueStudents = [...new Map(courseStudents.map(s => [s.id, s])).values()];
            
            const courseLessons = lessonsData.filter(l => l.course?.id === course.id);
            const completedLessons = courseLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID');
            const paidLessons = courseLessons.filter(l => l.status === 'PAID');
            
            // 1. Все платежи по курсу (чеки + абонементы)
            const allPaymentIncome = paymentsData
                .filter(p => (p.courseId || p.course?.id) === course.id && 
                            (p.status === 'PAID' || p.status === 'paid'))
                .reduce((sum, p) => sum + (p.amount || 0), 0);

            // 2. ID занятий, уже учтённых в платежах
            const paidLessonIds = new Set(
                paymentsData
                    .map(p => p.lessonId || p.lesson?.id)
                    .filter(id => id)
            );

            // 3. Оплаченные занятия (PAID), не учтённые в payments
            const lessonsIncome = courseLessons
                .filter(l => l.status === 'PAID' && !paidLessonIds.has(l.id))
                .reduce((sum, l) => {
                    const student = studentsData.find(s => s.id === l.student?.id);
                    if (!student) return sum;
                    const rate = student.ratePerLesson || 
                                (student.rates && student.rates.length > 0 
                                    ? student.rates.find(r => r.tutor?.id === user.id)?.ratePerLesson 
                                    : 0) || 0;
                    return sum + rate;
                }, 0);

            const totalIncome = allPaymentIncome + lessonsIncome;
            
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
                students: uniqueStudents.slice(0, 5),
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
                color: course.color || '#4F46E5',
                tutorId: user.id
            });
            if (course.subject) {
                setSelectedSubject(course.subject);
            } else {
                setSelectedSubject(null);
            }
        } else {
            setEditingCourse(null);
            setFormData({
                name: '',
                color: '#4F46E5',
                tutorId: user.id
            });
            setSelectedSubject(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingCourse(null);
        setFormData({ name: '', color: '#4F46E5', tutorId: user.id });
        setSelectedSubject(null);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleColorChange = (newColor) => {
        setFormData({ ...formData, color: newColor });
    };

    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const dataToSend = {
                ...formData,
                subjectId: selectedSubject?.id || null
            };
            
            if (editingCourse) {
                await axiosInstance.put(`/courses/${editingCourse.id}`, dataToSend, { headers });
                showSnackbar('Курс обновлён', 'success');
            } else {
                await axiosInstance.post('/courses', dataToSend, { headers });
                showSnackbar('Курс добавлен', 'success');
            }
            
            handleCloseDialog();
            fetchData();
        } catch (err) {
            console.error('Ошибка при сохранении:', err);
            showSnackbar(err.response?.data?.error || 'Ошибка при сохранении курса', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить курс?')) {
            try {
                const token = localStorage.getItem('token');
                await axiosInstance.delete(`/courses/${id}`, {
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

    const totalStats = useMemo(() => ({
        coursesCount: courses.length,
        totalStudents: Object.values(courseStats).reduce((sum, s) => sum + s.studentsCount, 0),
        totalLessons: Object.values(courseStats).reduce((sum, s) => sum + s.lessonsCount, 0),
        totalIncome: Object.values(courseStats).reduce((sum, s) => sum + s.totalIncome, 0)
    }), [courseStats, courses]);

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
                        Аналитика курсов
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        Статистика и управление учебными курсами
                    </Typography>
                </Box>
                <StyledButton
                    variant="contained"
                    startIcon={<Add sx={{ fontSize: 18 }} />}
                    onClick={() => handleOpenDialog()}
                    sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                >
                    Добавить курс
                </StyledButton>
            </Box>

            {/* ========== ОБЩАЯ СТАТИСТИКА ========== */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Всего курсов', value: totalStats.coursesCount, icon: BookIcon, color: '#4F46E5', bg: '#EEF2FF' },
                    { label: 'Всего учеников', value: totalStats.totalStudents, icon: People, color: '#10B981', bg: '#ECFDF5' },
                    { label: 'Всего занятий', value: totalStats.totalLessons, icon: CalendarToday, color: '#F59E0B', bg: '#FFFBEB' },
                    { label: 'Общий доход', value: `${totalStats.totalIncome.toLocaleString()} ₽`, icon: AttachMoney, color: '#7C3AED', bg: '#F5F3FF' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Grid item xs={6} md={3} key={i}>
                            <StatCard>
                                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{
                                            width: 44, height: 44, borderRadius: '10px',
                                            backgroundColor: stat.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            flexShrink: 0,
                                        }}>
                                            <Icon sx={{ fontSize: 22, color: stat.color }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                {stat.label}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </CardContent>
                            </StatCard>
                        </Grid>
                    );
                })}
            </Grid>

            {error ? (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
            ) : courses.length === 0 ? (
                <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <School sx={{ fontSize: 40, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            У вас пока нет курсов
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                            Нажмите «Добавить курс» чтобы создать первый
                        </Typography>
                        <StyledButton variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            Добавить курс
                        </StyledButton>
                    </EmptyStateContainer>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {courses.map((course) => {
                        const stats = courseStats[course.id] || {
                            studentsCount: 0, lessonsCount: 0, completedCount: 0,
                            totalIncome: 0, monthlyStats: [], students: [], progress: 0
                        };
                        const courseColor = course.color || '#4F46E5';
                        
                        return (
                            <Grid item xs={12} md={6} key={course.id}>
                                <CourseCard>
                                    <CourseColorBar color={courseColor} />
                                    
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        {/* Шапка */}
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: courseColor, width: 40, height: 40, fontWeight: 600, fontSize: 16 }}>
                                                    {getInitials(course.name)}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1F2937' }}>
                                                        {course.name}
                                                    </Typography>
                                                    {course.subject && (
                                                        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                            {course.subject.name}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Box>
                                            <IconButton onClick={(e) => handleMenuOpen(e, course)} sx={{ color: '#9CA3AF' }}>
                                                <MoreVert />
                                            </IconButton>
                                        </Box>

                                        {/* Мини-статистика */}
                                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                            <Grid item xs={4}>
                                                <MiniStatBox>
                                                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#4F46E5' }}>
                                                        {stats.studentsCount}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        Учеников
                                                    </Typography>
                                                </MiniStatBox>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <MiniStatBox>
                                                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>
                                                        {stats.lessonsCount}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        Занятий
                                                    </Typography>
                                                </MiniStatBox>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <MiniStatBox>
                                                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#F59E0B' }}>
                                                        {stats.completedCount}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        Проведено
                                                    </Typography>
                                                </MiniStatBox>
                                            </Grid>
                                        </Grid>

                                        {/* Прогресс */}
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                    Прогресс прохождения
                                                </Typography>
                                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: courseColor }}>
                                                    {Math.round(stats.progress)}%
                                                </Typography>
                                            </Box>
                                            <ProgressBar>
                                                <ProgressFill width={stats.progress} color={courseColor} />
                                            </ProgressBar>
                                        </Box>

                                        {/* Доход */}
                                        <IncomeBox>
                                            <AttachMoney sx={{ fontSize: 18, color: '#10B981' }} />
                                            <Typography sx={{ fontWeight: 600, color: '#065F46', fontSize: '14px' }}>
                                                Доход: {stats.totalIncome.toLocaleString()} ₽
                                            </Typography>
                                        </IncomeBox>

                                        {/* Ученики */}
                                        {stats.students.length > 0 && (
                                            <Box sx={{ mb: 2 }}>
                                                <Typography sx={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                    <People sx={{ fontSize: 14 }} />
                                                    Ученики
                                                </Typography>
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {stats.students.map(student => (
                                                        <Tooltip key={student.id} title={`${student.fullName} — ${student.ratePerLesson || '—'} ₽/занятие`}>
                                                            <Chip
                                                                avatar={<Avatar sx={{ bgcolor: getAvatarColor(student.fullName), width: 24, height: 24, fontSize: 11, fontWeight: 600 }}>{getInitials(student.fullName)}</Avatar>}
                                                                label={student.fullName}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ borderRadius: '8px', borderColor: '#E5E7EB', fontSize: '12px' }}
                                                            />
                                                        </Tooltip>
                                                    ))}
                                                    {stats.studentsCount > 5 && (
                                                        <Chip label={`+${stats.studentsCount - 5}`} size="small" variant="outlined"
                                                            sx={{ borderRadius: '8px', borderColor: '#E5E7EB', fontSize: '12px' }} />
                                                    )}
                                                </Box>
                                            </Box>
                                        )}

                                        {/* Мини-график */}
                                        {stats.monthlyStats.length > 0 && (
                                            <Box>
                                                <Typography sx={{ fontSize: '12px', color: '#6B7280', display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                                    <TrendingUp sx={{ fontSize: 14 }} />
                                                    Динамика занятий
                                                </Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '4%', height: 50, px: 0.5 }}>
                                                    {stats.monthlyStats.map((month, idx) => {
                                                        const maxCount = Math.max(...stats.monthlyStats.map(m => m.count), 1);
                                                        const height = (month.count / maxCount) * 40;
                                                        return (
                                                            <Tooltip key={idx} title={`${month.month}: ${month.count} занятий (${month.completed} проведено)`}>
                                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                                    <Box sx={{ 
                                                                        height: Math.max(height, 3),
                                                                        bgcolor: courseColor,
                                                                        borderRadius: '3px 3px 1px 1px',
                                                                        opacity: 0.7,
                                                                        transition: 'height 0.3s',
                                                                    }} />
                                                                    <Typography sx={{ fontSize: '10px', mt: 0.5, display: 'block', color: '#9CA3AF' }}>
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
                                </CourseCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== МЕНЮ ДЕЙСТВИЙ ========== */}
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{ sx: { borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: 180 } }}
            >
                <MenuItem onClick={() => { handleMenuClose(); handleOpenDialog(selectedCourse); }} sx={{ fontSize: '14px', gap: 1 }}>
                    <Edit sx={{ fontSize: 18, color: '#6B7280' }} /> Редактировать
                </MenuItem>
                <MenuItem onClick={() => { handleMenuClose(); if (selectedCourse) handleDelete(selectedCourse.id); }} sx={{ fontSize: '14px', gap: 1 }}>
                    <Delete sx={{ fontSize: 18, color: '#EF4444' }} /> Удалить
                </MenuItem>
            </Menu>

            {/* ========== ДИАЛОГ ДОБАВЛЕНИЯ/РЕДАКТИРОВАНИЯ ========== */}
            <StyledDialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    {editingCourse ? 'Редактировать курс' : 'Добавить новый курс'}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Autocomplete
                            freeSolo
                            options={[
                                ...subjects.map(s => ({ type: 'subject', name: s.name, original: s })),
                                ...courses.map(c => ({ type: 'course', name: c.name, original: c }))
                            ]}
                            groupBy={(option) => option.type === 'subject' ? '📚 Предметы' : '📖 Мои курсы'}
                            getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                            value={formData.name}
                            onChange={(event, newValue) => {
                                if (typeof newValue === 'string') {
                                    setFormData({ ...formData, name: newValue });
                                    setSelectedSubject(null);
                                } else if (newValue?.type === 'subject') {
                                    setFormData({ ...formData, name: newValue.name });
                                    setSelectedSubject(newValue.original);
                                } else if (newValue?.type === 'course') {
                                    setFormData({ ...formData, name: newValue.name });
                                    setSelectedSubject(newValue.original.subject || null);
                                } else {
                                    setFormData({ ...formData, name: '' });
                                    setSelectedSubject(null);
                                }
                            }}
                            onInputChange={(event, newInputValue) => {
                                setFormData({ ...formData, name: newInputValue });
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Название курса"
                                    fullWidth
                                    required
                                    placeholder="Например: Математика ОГЭ"
                                    helperText="Выберите из списка или введите своё название"
                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                    InputProps={{
                                        ...params.InputProps,
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <School sx={{ color: '#9CA3AF' }} />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            )}
                            renderGroup={(params) => (
                                <Box key={params.key}>
                                    <Box sx={{ px: 2, py: 1, bgcolor: '#F9FAFB', fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>
                                        {params.group}
                                    </Box>
                                    <Box>{params.children}</Box>
                                </Box>
                            )}
                            isOptionEqualToValue={(option, value) => option.name === value.name}
                        />

                        <Box sx={{ mt: 2, mb: 1 }}>
                            <ColorPicker value={formData.color} onChange={handleColorChange} />
                        </Box>

                        <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                            {selectedSubject 
                                ? `Курс будет привязан к предмету «${selectedSubject.name}»`
                                : 'Введите название курса или выберите из списка'
                            }
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={handleCloseDialog} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSubmit} variant="contained" disabled={!formData.name}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                        {editingCourse ? 'Сохранить' : 'Добавить'}
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ borderRadius: '8px' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Courses;