// ========== frontend/src/pages/LessonsArchive.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Alert, CircularProgress, FormControl, InputLabel,
    Select, MenuItem, Grid, Button, Dialog,
    DialogTitle, DialogContent, DialogActions,
    Card, CardContent, IconButton, Tooltip,
    Tabs, Tab, TableSortLabel, InputAdornment,
    TextField, Pagination, Avatar, Fade, Divider,
    Badge
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { startOfMonth, endOfMonth, format, subMonths, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
// ✅ Импорт из объединённого API
import { getArchivedLessons } from '../services/api';
import {
    Edit as EditIcon,
    Search as SearchIcon,
    Refresh as RefreshIcon,
    Download as DownloadIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    School as SchoolIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    Visibility as VisibilityIcon,
    Clear as ClearIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon,
    EmojiPeople as AbsentIcon
} from '@mui/icons-material';

function LessonsArchive() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    
    const [lessons, setLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterStudent, setFilterStudent] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('lessonDate');
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('table');
    const [openNotesDialog, setOpenNotesDialog] = useState(false);
    const [selectedLessonNotes, setSelectedLessonNotes] = useState({ notes: '', nextLessonPlan: '' });
    const [topAbsentStudents, setTopAbsentStudents] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        paid: 0,
        cancelled: 0,
        monthlyStats: []
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        applyFilters();
        calculateStats();
    }, [lessons, filterStatus, filterStudent, selectedMonth, searchTerm]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            // ✅ Правильно извлекаем данные из ответа API
            const lessonsRes = await getArchivedLessons(user.id);
            const lessonsData = lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes;
            
            const studentsRes = await axios.get(`http://localhost:8080/api/students/tutor/${user.id}`, { headers });
            const coursesRes = await axios.get(`http://localhost:8080/api/courses/tutor/${user.id}`, { headers });
            
            // ✅ Гарантируем, что lessons - массив
            setLessons(Array.isArray(lessonsData) ? lessonsData : []);
            setStudents(studentsRes.data);
            setCourses(coursesRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Ошибка загрузки данных');
            setLoading(false);
        }
    };

    const calculateTopAbsentStudents = () => {
        const filtered = getFilteredLessonsInternal();
        
        const studentAbsences = {};
        
        filtered.forEach(lesson => {
            if (lesson.status === 'CANCELLED') {
                const studentId = lesson.student?.id;
                if (studentId) {
                    if (!studentAbsences[studentId]) {
                        const student = students.find(s => s.id === studentId);
                        studentAbsences[studentId] = {
                            id: studentId,
                            name: student?.fullName || 'Неизвестно',
                            count: 0,
                            lessons: []
                        };
                    }
                    studentAbsences[studentId].count++;
                    studentAbsences[studentId].lessons.push({
                        date: lesson.lessonDate,
                        course: lesson.course?.name
                    });
                }
            }
        });
        
        const top = Object.values(studentAbsences)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        setTopAbsentStudents(top);
    };

    const calculateStats = () => {
        const filtered = getFilteredLessonsInternal();
        
        const total = filtered.length;
        const completed = filtered.filter(l => l.status === 'COMPLETED').length;
        const paid = filtered.filter(l => l.status === 'PAID').length;
        const cancelled = filtered.filter(l => l.status === 'CANCELLED').length;
        
        const months = eachMonthOfInterval({
            start: subMonths(new Date(), 5),
            end: new Date()
        });
        
        const monthlyStats = months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthLessons = filtered.filter(l => {
                const lessonDate = new Date(l.lessonDate);
                return lessonDate >= monthStart && lessonDate <= monthEnd;
            });
            return {
                month: format(month, 'MMM', { locale: ru }),
                fullMonth: format(month, 'LLLL yyyy', { locale: ru }),
                total: monthLessons.length,
                completed: monthLessons.filter(l => l.status === 'COMPLETED').length,
                paid: monthLessons.filter(l => l.status === 'PAID').length,
                cancelled: monthLessons.filter(l => l.status === 'CANCELLED').length,
                income: monthLessons
                    .filter(l => l.status === 'PAID')
                    .reduce((sum, l) => sum + (getStudentRateForTutor(l.student, user?.id) || 0), 0)
            };
        });
        
        setStats({ total, completed, paid, cancelled, monthlyStats });
        calculateTopAbsentStudents();
    };

    const getFilteredLessonsInternal = () => {
        let filtered = [...lessons];
        
        if (filterStatus !== 'all') {
            filtered = filtered.filter(lesson => lesson.status === filterStatus);
        }
        
        if (filterStudent !== 'all') {
            filtered = filtered.filter(lesson => lesson.student?.id === parseInt(filterStudent));
        }
        
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        filtered = filtered.filter(lesson => {
            const lessonDate = new Date(lesson.lessonDate);
            return lessonDate >= monthStart && lessonDate <= monthEnd;
        });
        
        if (searchTerm) {
            filtered = filtered.filter(lesson => {
                const student = students.find(s => s.id === lesson.student?.id);
                const course = courses.find(c => c.id === lesson.course?.id);
                return student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       lesson.notes?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        
        return filtered;
    };

    const applyFilters = () => {
        const filtered = getFilteredLessonsInternal();
        
        filtered.sort((a, b) => {
            let aValue, bValue;
            
            switch(orderBy) {
                case 'lessonDate':
                    aValue = new Date(a.lessonDate);
                    bValue = new Date(b.lessonDate);
                    break;
                case 'startTime':
                    aValue = a.startTime;
                    bValue = b.startTime;
                    break;
                case 'studentName':
                    const studentA = students.find(s => s.id === a.student?.id);
                    const studentB = students.find(s => s.id === b.student?.id);
                    aValue = studentA?.fullName || '';
                    bValue = studentB?.fullName || '';
                    break;
                default:
                    aValue = a[orderBy];
                    bValue = b[orderBy];
            }
            
            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
        
        setFilteredLessons(filtered);
    };

    const [filteredLessons, setFilteredLessons] = useState([]);
    
    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleOpenNotes = (lesson) => {
        setSelectedLessonNotes({
            notes: lesson.notes || 'Нет заметок',
            nextLessonPlan: lesson.nextLessonPlan || 'Нет плана'
        });
        setOpenNotesDialog(true);
    };

    const handleResetFilters = () => {
        setFilterStatus('all');
        setFilterStudent('all');
        setSelectedMonth(new Date());
        setSearchTerm('');
        setPage(0);
    };

    const getStatusChip = (status) => {
        switch(status) {
            case 'PAID':
                return <Chip label="Оплачено" color="success" size="small" icon={<CheckIcon />} />;
            case 'COMPLETED':
                return <Chip label="Проведено" color="warning" size="small" icon={<ScheduleIcon />} />;
            case 'CANCELLED':
                return <Chip label="Отменено" color="error" size="small" icon={<CancelIcon />} />;
            default:
                return <Chip label={status} size="small" />;
        }
    };

    const formatDate = (dateStr) => {
        return format(new Date(dateStr), 'd MMMM yyyy', { locale: ru });
    };

    const paginatedLessons = filteredLessons.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const maxMonthlyTotal = Math.max(...stats.monthlyStats.map(m => m.total), 1);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ p: 3 }}>
                {/* Заголовок */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Архив занятий
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            История проведённых, оплаченных и отменённых занятий
                        </Typography>
                    </Box>
                    <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={fetchData}
                        size="small"
                        sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                        Обновить
                    </Button>
                </Box>

                {/* Статистика */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                    {stats.total}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Всего записей
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                    {stats.completed}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Проведено
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#10B981' }}>
                                    {stats.paid}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Оплачено
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <Card sx={{ borderRadius: 3 }}>
                            <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                <Typography variant="h5" sx={{ fontWeight: 600, color: '#EF5350' }}>
                                    {stats.cancelled}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Отменено
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Фильтры */}
                <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Статус</InputLabel>
                                <Select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    label="Статус"
                                >
                                    <MenuItem value="all">Все статусы</MenuItem>
                                    <MenuItem value="PAID">Оплачено</MenuItem>
                                    <MenuItem value="COMPLETED">Проведено</MenuItem>
                                    <MenuItem value="CANCELLED">Отменено</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Ученик</InputLabel>
                                <Select
                                    value={filterStudent}
                                    onChange={(e) => setFilterStudent(e.target.value)}
                                    label="Ученик"
                                >
                                    <MenuItem value="all">Все ученики</MenuItem>
                                    {students.map(s => (
                                        <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker
                                label="Месяц"
                                value={selectedMonth}
                                onChange={setSelectedMonth}
                                views={['year', 'month']}
                                format="LLLL yyyy"
                                slotProps={{ textField: { size: 'small', fullWidth: true } }}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField
                                placeholder="Поиск по ученику, предмету..."
                                size="small"
                                fullWidth
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Grid>
                        {(filterStatus !== 'all' || filterStudent !== 'all' || searchTerm) && (
                            <Grid item xs={12}>
                                <Button 
                                    size="small" 
                                    variant="text" 
                                    onClick={handleResetFilters}
                                    startIcon={<ClearIcon />}
                                >
                                    Сбросить все фильтры
                                </Button>
                            </Grid>
                        )}
                    </Grid>
                </Paper>

                {/* Переключатель вида */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Tabs 
                        value={viewMode} 
                        onChange={(e, v) => setViewMode(v)}
                        sx={{ minHeight: 36 }}
                    >
                        <Tab 
                            value="table" 
                            icon={<VisibilityIcon />} 
                            label="Список"
                            sx={{ textTransform: 'none', minHeight: 36, py: 0 }}
                        />
                        <Tab 
                            value="stats" 
                            icon={<TimelineIcon />} 
                            label="Аналитика"
                            sx={{ textTransform: 'none', minHeight: 36, py: 0 }}
                        />
                    </Tabs>
                </Box>

                {error ? (
                    <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                ) : viewMode === 'stats' ? (
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            Динамика занятий по месяцам
                        </Typography>
                        <Box sx={{ height: 200, mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: '100%' }}>
                                {stats.monthlyStats.map((item, idx) => {
                                    const height = (item.total / maxMonthlyTotal) * 160;
                                    return (
                                        <Tooltip key={idx} title={`${item.fullMonth}: ${item.total} занятий`} arrow>
                                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                <Box 
                                                    sx={{ 
                                                        height: height,
                                                        bgcolor: '#ff6b6b',
                                                        borderRadius: '8px 8px 4px 4px',
                                                        transition: 'all 0.2s',
                                                        cursor: 'pointer',
                                                        '&:hover': { bgcolor: '#ff5252' }
                                                    }}
                                                />
                                                <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 1, display: 'block' }}>
                                                    {item.month}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>

                        {topAbsentStudents.length > 0 && (
                            <Box sx={{ mb: 3 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ color: '#EF5350' }} />
                                    Чаще всего пропускают
                                </Typography>
                                <Grid container spacing={2}>
                                    {topAbsentStudents.map((student) => (
                                        <Grid item xs={12} sm={6} md={4} key={student.id}>
                                            <Card 
                                                sx={{ 
                                                    borderRadius: 2,
                                                    transition: 'all 0.2s',
                                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }
                                                }}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#EF5350', width: 48, height: 48 }}>
                                                            <AbsentIcon />
                                                        </Avatar>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                {student.name}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <Chip 
                                                                    label={`${student.count} пропусков`}
                                                                    size="small"
                                                                    color="error"
                                                                    sx={{ fontWeight: 500 }}
                                                                />
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {student.lessons.length} занятий
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    
                                                    {student.lessons.length > 0 && (
                                                        <>
                                                            <Divider sx={{ my: 1.5 }} />
                                                            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 1 }}>
                                                                Последние пропуски:
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {student.lessons.slice(0, 3).map((lesson, i) => (
                                                                    <Tooltip key={i} title={lesson.course || 'Занятие'} arrow>
                                                                        <Chip 
                                                                            label={format(new Date(lesson.date), 'd MMM', { locale: ru })}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ fontSize: '0.7rem' }}
                                                                        />
                                                                    </Tooltip>
                                                                ))}
                                                                {student.lessons.length > 3 && (
                                                                    <Chip 
                                                                        label={`+${student.lessons.length - 3}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                    />
                                                                )}
                                                            </Box>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Box>
                        )}
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            Детали по месяцам
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>Месяц</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Всего</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Проведено</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Оплачено</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600 }}>Отменено</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600 }}>Доход</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.monthlyStats.slice().reverse().map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{item.fullMonth}</TableCell>
                                            <TableCell align="center">{item.total}</TableCell>
                                            <TableCell align="center">{item.completed}</TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={item.paid} 
                                                    size="small" 
                                                    color={item.paid > 0 ? 'success' : 'default'}
                                                    sx={{ minWidth: 40 }}
                                                />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={item.cancelled} 
                                                    size="small" 
                                                    color={item.cancelled > 0 ? 'error' : 'default'}
                                                    sx={{ minWidth: 40 }}
                                                />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography variant="body2" sx={{ fontWeight: 500, color: '#2E7D32' }}>
                                                    {item.income.toLocaleString()} ₽
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                ) : filteredLessons.length === 0 ? (
                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                        <CalendarIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="textSecondary" gutterBottom>
                            Нет записей в архиве
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {filterStatus !== 'all' || filterStudent !== 'all' || searchTerm 
                                ? 'Попробуйте изменить параметры фильтрации'
                                : 'Здесь будут отображаться проведённые, оплаченные и отменённые занятия'}
                        </Typography>
                    </Paper>
                ) : (
                    <>
                        <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            <TableSortLabel
                                                active={orderBy === 'lessonDate'}
                                                direction={orderBy === 'lessonDate' ? order : 'asc'}
                                                onClick={() => handleRequestSort('lessonDate')}
                                            >
                                                Дата
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            <TableSortLabel
                                                active={orderBy === 'startTime'}
                                                direction={orderBy === 'startTime' ? order : 'asc'}
                                                onClick={() => handleRequestSort('startTime')}
                                            >
                                                Время
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>
                                            <TableSortLabel
                                                active={orderBy === 'studentName'}
                                                direction={orderBy === 'studentName' ? order : 'asc'}
                                                onClick={() => handleRequestSort('studentName')}
                                            >
                                                Ученик
                                            </TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Предмет</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Заметки</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedLessons.map((lesson) => {
                                        const student = students.find(s => s.id === lesson.student?.id);
                                        const course = courses.find(c => c.id === lesson.course?.id);
                                        return (
                                            <TableRow 
                                                key={lesson.id}
                                                sx={{ '&:hover': { bgcolor: '#fafafa' }, transition: 'background-color 0.2s' }}
                                            >
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                        <Typography variant="body2">
                                                            {formatDate(lesson.lessonDate)}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                                        {lesson.startTime?.slice(0,5)} - {lesson.endTime?.slice(0,5)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff6b6b', fontSize: 14 }}>
                                                            {student?.fullName?.charAt(0) || 'У'}
                                                        </Avatar>
                                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                            {student?.fullName || 'Неизвестно'}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>
                                                <TableCell>
                                                    <Chip 
                                                        icon={<SchoolIcon sx={{ fontSize: 14 }} />}
                                                        label={course?.name || lesson.course?.name || '—'}
                                                        size="small"
                                                        variant="outlined"
                                                        sx={{ borderRadius: 1.5 }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    {getStatusChip(lesson.status)}
                                                </TableCell>
                                                <TableCell>
                                                    {lesson.notes ? (
                                                        <Button 
                                                            size="small" 
                                                            variant="text" 
                                                            onClick={() => handleOpenNotes(lesson)}
                                                            startIcon={<VisibilityIcon />}
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            Просмотреть
                                                        </Button>
                                                    ) : '-'}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        {filteredLessons.length > rowsPerPage && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Pagination
                                    count={Math.ceil(filteredLessons.length / rowsPerPage)}
                                    page={page + 1}
                                    onChange={(e, newPage) => setPage(newPage - 1)}
                                    color="primary"
                                    size="small"
                                />
                            </Box>
                        )}
                    </>
                )}

                {/* Диалог заметок */}
                <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Заметки к занятию</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                📝 Что делали на уроке:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2, borderRadius: 2 }}>
                                <Typography variant="body1">
                                    {selectedLessonNotes.notes}
                                </Typography>
                            </Paper>
                            
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                🎯 Что сделать к следующему уроку:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                                <Typography variant="body1">
                                    {selectedLessonNotes.nextLessonPlan}
                                </Typography>
                            </Paper>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenNotesDialog(false)}>Закрыть</Button>
                    </DialogActions>
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
}

export default LessonsArchive;