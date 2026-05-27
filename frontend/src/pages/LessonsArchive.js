// ========== frontend/src/pages/LessonsArchive.js (v4 — исправленная аналитика) ==========
import React, { useState, useEffect } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance, { getArchivedLessons } from '../services/api';
import {
    Box, Paper, Typography, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip,
    Alert, CircularProgress, FormControl, InputLabel,
    Select, MenuItem, Grid, Button, Dialog,
    DialogTitle, Snackbar, DialogContent, DialogActions,
    Card, CardContent, IconButton, Tooltip,
    Tabs, Tab, TableSortLabel, InputAdornment,
    TextField, Pagination, Avatar, Divider
} from '@mui/material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { startOfMonth, endOfMonth, format, subMonths, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import {
    Search as SearchIcon,
    Refresh as RefreshIcon,
    CalendarToday as CalendarIcon,
    School as SchoolIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Visibility as VisibilityIcon,
    Clear as ClearIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon,
    Archive as ArchiveIcon,
    KeyboardArrowDown as ChevronDownIcon,
    KeyboardArrowRight as ChevronRightIcon
} from '@mui/icons-material';

// ========== СТИЛИ ==========

const FilterPaper = styled(Paper)({
    padding: '20px',
    marginBottom: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
});

const StyledTableContainer = styled(TableContainer)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
});

const StyledTableRow = styled(TableRow)({
    '&:nth-of-type(odd)': { backgroundColor: '#FFFFFF' },
    '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
    '&:hover': { backgroundColor: '#EEF2FF !important', cursor: 'pointer' },
    '&:last-child td': { borderBottom: 0 },
});

// ========== УТИЛИТЫ ==========

function getAvatarColor(name) {
    const avatarColors = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#059669', '#3B82F6', '#2563EB', '#6366F1'];
    let hash = 0;
    const str = name || '?';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return avatarColors[Math.abs(hash) % avatarColors.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function LessonsArchive() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Расписание'; }, []);
    const { getStudentRateForTutor } = useStudentRate();
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [lessons, setLessons] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterStudent, setFilterStudent] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [orderBy, setOrderBy] = useState('lessonDate');
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(0);
    const [rowsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('table');
    const [openNotesDialog, setOpenNotesDialog] = useState(false);
    const [selectedLessonNotes, setSelectedLessonNotes] = useState({ notes: '', nextLessonPlan: '' });
    const [topAbsentStudents, setTopAbsentStudents] = useState([]);
    const [filteredLessons, setFilteredLessons] = useState([]);
    const [expandedRow, setExpandedRow] = useState(null);
    const [stats, setStats] = useState({
        total: 0, completed: 0, paid: 0, cancelled: 0, monthlyStats: []
    });

    useEffect(() => { if (user && user.id) fetchData(); }, [user]);
    useEffect(() => { applyFilters(); }, [lessons, payments, filterStatus, filterStudent, selectedMonth, searchTerm]);
    useEffect(() => { calculateStats(); }, [lessons, payments, selectedMonth]);

    const fetchData = async () => {
        if (!user || !user.id) return;
        try {
            setLoading(true);
            const [lessonsRes, studentsRes, coursesRes, paymentsRes] = await Promise.all([
                getArchivedLessons(user.id),
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/courses/tutor/${user.id}`),
                axiosInstance.get(`/payments/tutor/${user.id}`)
            ]);
            const lessonsData = lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes;
            setLessons(Array.isArray(lessonsData) ? lessonsData : []);
            setStudents(studentsRes.data || []);
            setCourses(coursesRes.data || []);
            setPayments(paymentsRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const calculateTopAbsentStudents = () => {
        const studentAbsences = {};
        filteredLessons.forEach(lesson => {
            if (lesson.status === 'CANCELLED') {
                const studentId = lesson.student?.id;
                if (studentId) {
                    if (!studentAbsences[studentId]) {
                        const student = students.find(s => s.id === studentId);
                        studentAbsences[studentId] = { id: studentId, name: student?.fullName || 'Неизвестно', count: 0, lessons: [] };
                    }
                    studentAbsences[studentId].count++;
                    studentAbsences[studentId].lessons.push({ date: lesson.lessonDate, course: lesson.course?.name });
                }
            }
        });
        const top = Object.values(studentAbsences).sort((a, b) => b.count - a.count).slice(0, 5);
        setTopAbsentStudents(top);
    };

    const calculateStats = () => {
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        const monthLessons = lessons.filter(l => {
            const d = new Date(l.lessonDate);
            return d >= monthStart && d <= monthEnd;
        });

        const total = monthLessons.length;
        const completed = monthLessons.filter(l => l.status === 'COMPLETED').length;
        const paid = monthLessons.filter(l => l.status === 'PAID').length;
        const cancelled = monthLessons.filter(l => l.status === 'CANCELLED').length;

        const months = eachMonthOfInterval({ start: subMonths(new Date(), 5), end: new Date() });

        const monthlyStats = months.map(month => {
            const mStart = startOfMonth(month);
            const mEnd = endOfMonth(month);
            const mMonthLessons = lessons.filter(l => {
                const lessonDate = new Date(l.lessonDate);
                return lessonDate >= mStart && lessonDate <= mEnd;
            });

            const monthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= mStart && paymentDate <= mEnd &&
                    (p.status === 'PAID' || p.status === 'paid' || p.status === 'CONFIRMED');
            });

            const totalIncome = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

            return {
                month: format(month, 'MMM', { locale: ru }),
                fullMonth: format(month, 'LLLL yyyy', { locale: ru }),
                total: mMonthLessons.length,
                completed: mMonthLessons.filter(l => l.status === 'COMPLETED').length,
                paid: mMonthLessons.filter(l => l.status === 'PAID').length,
                cancelled: mMonthLessons.filter(l => l.status === 'CANCELLED').length,
                income: totalIncome
            };
        });

        setStats({ total, completed, paid, cancelled, monthlyStats });
        calculateTopAbsentStudents();
    };

    const getFilteredLessonsInternal = () => {
        let filtered = [...lessons];
        
        if (filterStatus !== 'all') {
            if (filterStatus === 'COMPLETED') {
                filtered = filtered.filter(l => l.status === 'COMPLETED');
            } else {
                filtered = filtered.filter(l => l.status === filterStatus);
            }
        }
        
        if (filterStudent !== 'all') filtered = filtered.filter(l => l.student?.id === parseInt(filterStudent));
        const monthStart = startOfMonth(selectedMonth);
        const monthEnd = endOfMonth(selectedMonth);
        filtered = filtered.filter(l => {
            const d = new Date(l.lessonDate);
            return d >= monthStart && d <= monthEnd;
        });
        if (searchTerm) {
            filtered = filtered.filter(l => {
                const student = students.find(s => s.id === l.student?.id);
                const course = courses.find(c => c.id === l.course?.id);
                return student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    l.notes?.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }
        return filtered;
    };

    const applyFilters = () => {
        const filtered = getFilteredLessonsInternal();
        filtered.sort((a, b) => {
            let aVal, bVal;
            switch (orderBy) {
                case 'lessonDate': aVal = new Date(a.lessonDate); bVal = new Date(b.lessonDate); break;
                case 'startTime': aVal = a.startTime; bVal = b.startTime; break;
                case 'studentName':
                    const sA = students.find(s => s.id === a.student?.id);
                    const sB = students.find(s => s.id === b.student?.id);
                    aVal = sA?.fullName || ''; bVal = sB?.fullName || ''; break;
                default: aVal = a[orderBy]; bVal = b[orderBy];
            }
            return order === 'asc' ? (aVal < bVal ? -1 : aVal > bVal ? 1 : 0) : (aVal > bVal ? -1 : aVal < bVal ? 1 : 0);
        });
        setFilteredLessons(filtered);
    };

    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const handleOpenNotes = (lesson) => {
        setSelectedLessonNotes({ notes: lesson.notes || 'Нет заметок', nextLessonPlan: lesson.nextLessonPlan || 'Нет плана' });
        setOpenNotesDialog(true);
    };

    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const handleManualPayment = async (lesson) => {
        if (!window.confirm('Подтвердить оплату вручную?')) return;
        try {
            await axiosInstance.patch(`/lessons/${lesson.id}/status`, { status: 'PAID' });
            showSnackbar('✅ Оплата подтверждена', 'success');
            await fetchData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleResetFilters = () => {
        setFilterStatus('all'); setFilterStudent('all'); setSelectedMonth(new Date()); setSearchTerm(''); setPage(0);
    };

    const handleRowClick = (lessonId) => setExpandedRow(expandedRow === lessonId ? null : lessonId);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PAID': return <Box className="badge badge-success"><CheckIcon sx={{ fontSize: 12 }} />Оплачено</Box>;
            case 'COMPLETED': return <Box className="badge badge-info"><ScheduleIcon sx={{ fontSize: 12 }} />Не оплачено</Box>;
            case 'CANCELLED': return <Box className="badge badge-danger"><CancelIcon sx={{ fontSize: 12 }} />Отменено</Box>;
            default: return <Box className="badge badge-neutral">{status}</Box>;
        }
    };

    const formatDate = (dateStr) => dateStr ? format(new Date(dateStr), 'd MMMM yyyy', { locale: ru }) : '-';

    const paginatedLessons = filteredLessons.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const maxMonthlyTotal = Math.max(...stats.monthlyStats.map(m => m.total), 1);

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка архива..." />
            </Box>
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: { xs: '22px', sm: '28px' }, fontWeight: 600, color: '#1F2937', mb: 0.5 }}>Архив занятий</Typography>
                        <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>История проведённых, оплаченных и отменённых занятий</Typography>
                    </Box>
                    <ViewToggle>
                        <ViewToggleBtn active={viewMode === 'table'} onClick={() => setViewMode('table')} startIcon={<VisibilityIcon />}>Список</ViewToggleBtn>
                        <ViewToggleBtn active={viewMode === 'stats'} onClick={() => setViewMode('stats')} startIcon={<TimelineIcon />}>Аналитика</ViewToggleBtn>
                    </ViewToggle>
                </Box>

                {/* Статистика */}
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {[
                        { label: 'Всего записей', value: stats.total, color: '#3B82F6', bg: '#EFF6FF' },
                        { label: 'Не оплачено', value: stats.completed, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: 'Оплачено', value: stats.paid, color: '#10B981', bg: '#ECFDF5' },
                        { label: 'Отменено', value: stats.cancelled, color: '#EF4444', bg: '#FEF2F2' },
                    ].map((item) => (
                        <Grid item xs={6} sm={3} key={item.label}>
                            <Paper sx={{ 
                                p: { xs: 1.5, sm: 2.5 }, 
                                borderRadius: '12px', textAlign: 'center',
                                bgcolor: '#FFFFFF', border: '1px solid #F3F4F6',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                            }}>
                                <Box sx={{ width: { xs: 36, sm: 40 }, height: { xs: 36, sm: 40 }, borderRadius: '10px', backgroundColor: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                    <Typography sx={{ fontSize: { xs: 16, sm: 18 }, fontWeight: 700, color: item.color }}>{item.value}</Typography>
                                </Box>
                                <Typography sx={{ fontWeight: 600, color: '#1F2937', fontSize: { xs: '20px', sm: '24px' } }}>{item.value}</Typography>
                                <Typography sx={{ color: '#6B7280', fontSize: { xs: '11px', sm: '13px' } }}>{item.label}</Typography>
                            </Paper>
                        </Grid>
                    ))}
                </Grid>

                {/* Фильтры */}
                <FilterPaper elevation={0}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Статус</InputLabel>
                                <Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} label="Статус" sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB', borderRadius: '8px' } }}>
                                    <MenuItem value="all">Все статусы</MenuItem>
                                    <MenuItem value="PAID">Оплачено</MenuItem>
                                    <MenuItem value="COMPLETED">Не оплачено</MenuItem>
                                    <MenuItem value="CANCELLED">Отменено</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Ученик</InputLabel>
                                <Select value={filterStudent} onChange={(e) => setFilterStudent(e.target.value)} label="Ученик" sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB', borderRadius: '8px' } }}>
                                    <MenuItem value="all">Все ученики</MenuItem>
                                    {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <DatePicker label="Месяц" value={selectedMonth} onChange={setSelectedMonth} views={['year', 'month']} format="LLLL yyyy"
                                slotProps={{ textField: { size: 'small', fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }} />
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                            <TextField placeholder="Поиск..." size="small" fullWidth value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#9CA3AF' }} /></InputAdornment>,
                                    endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment>,
                                }} />
                        </Grid>
                        {(filterStatus !== 'all' || filterStudent !== 'all' || searchTerm) && (
                            <Grid item xs={12}>
                                <Button size="small" onClick={handleResetFilters} startIcon={<ClearIcon />} sx={{ color: '#6B7280', textTransform: 'none', '&:hover': { bgcolor: '#F3F4F6' } }}>Сбросить</Button>
                                <Button size="small" onClick={fetchData} startIcon={<RefreshIcon />} sx={{ color: '#4F46E5', textTransform: 'none', ml: 1, '&:hover': { bgcolor: '#EEF2FF' } }}>Обновить</Button>
                            </Grid>
                        )}
                    </Grid>
                </FilterPaper>

                {error ? (
                    <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
                ) : viewMode === 'stats' ? (
                    <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 3 }}>Динамика занятий по месяцам</Typography>
                        <Box sx={{ height: 200, mb: 4 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: '100%', px: 1 }}>
                                {stats.monthlyStats.map((item, idx) => {
                                    const height = maxMonthlyTotal > 0 ? (item.total / maxMonthlyTotal) * 160 : 0;
                                    return (
                                        <Tooltip key={idx} title={`${item.fullMonth}: ${item.total} занятий`} arrow>
                                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                <Box sx={{ height: Math.max(height, 4), background: 'linear-gradient(180deg, #4F46E5 0%, #7C3AED 100%)', borderRadius: '8px 8px 4px 4px', cursor: 'pointer', transition: 'all 0.3s ease', '&:hover': { opacity: 0.85, transform: 'scaleY(1.05)', transformOrigin: 'bottom' } }} />
                                                <Typography sx={{ fontSize: '11px', mt: 1, display: 'block', color: '#6B7280' }}>{item.month}</Typography>
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>

                        {topAbsentStudents.length > 0 && (
                            <Box sx={{ mb: 4 }}>
                                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <WarningIcon sx={{ color: '#EF4444', fontSize: 20 }} />Чаще всего пропускают
                                </Typography>
                                <Grid container spacing={2}>
                                    {topAbsentStudents.map((student) => (
                                        <Grid item xs={12} sm={6} md={4} key={student.id}>
                                            <Card sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' } }}>
                                                <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: getAvatarColor(student.name), width: 44, height: 44, fontSize: 16, fontWeight: 600 }}>{getInitials(student.name)}</Avatar>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>{student.name}</Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <Chip label={`${student.count} пропусков`} size="small" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 500, fontSize: '11px', borderRadius: '100px' }} />
                                                                <Typography sx={{ color: '#6B7280', fontSize: '12px' }}>{student.lessons.length} занятий</Typography>
                                                            </Box>
                                                        </Box>
                                                    </Box>
                                                    {student.lessons.length > 0 && (
                                                        <>
                                                            <Divider sx={{ my: 1.5, borderColor: '#F3F4F6' }} />
                                                            <Typography sx={{ color: '#9CA3AF', display: 'block', mb: 1, fontSize: '11px' }}>Последние пропуски:</Typography>
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                                {student.lessons.slice(0, 3).map((lesson, i) => (
                                                                    <Tooltip key={i} title={lesson.course || 'Занятие'} arrow>
                                                                        <Chip label={format(new Date(lesson.date), 'd MMM', { locale: ru })} size="small" variant="outlined" sx={{ fontSize: '11px', borderRadius: '6px', borderColor: '#E5E7EB', color: '#6B7280' }} />
                                                                    </Tooltip>
                                                                ))}
                                                                {student.lessons.length > 3 && <Chip label={`+${student.lessons.length - 3}`} size="small" variant="outlined" sx={{ fontSize: '11px', borderRadius: '6px', borderColor: '#E5E7EB' }} />}
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

                        <Divider sx={{ my: 3, borderColor: '#F3F4F6' }} />
                        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 2 }}>Детали по месяцам</Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none' }}>
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>Месяц</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>Всего</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>Проведено</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>Оплачено</TableCell>
                                        <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>Отменено</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280' }}>Доход</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {stats.monthlyStats.slice().reverse().map((item, idx) => (
                                        <TableRow key={idx} sx={{ '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' } }}>
                                            <TableCell sx={{ fontSize: '14px', color: '#1F2937' }}>{item.fullMonth}</TableCell>
                                            <TableCell align="center" sx={{ fontSize: '14px', color: '#1F2937' }}>{item.total}</TableCell>
                                            <TableCell align="center" sx={{ fontSize: '14px', color: '#1F2937' }}>{item.completed}</TableCell>
                                            <TableCell align="center">
                                                <Chip label={item.paid} size="small" sx={{ bgcolor: item.paid > 0 ? '#ECFDF5' : '#F3F4F6', color: item.paid > 0 ? '#065F46' : '#9CA3AF', fontWeight: 500, minWidth: 40, borderRadius: '100px', fontSize: '12px' }} />
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip label={item.cancelled} size="small" sx={{ bgcolor: item.cancelled > 0 ? '#FEF2F2' : '#F3F4F6', color: item.cancelled > 0 ? '#991B1B' : '#9CA3AF', fontWeight: 500, minWidth: 40, borderRadius: '100px', fontSize: '12px' }} />
                                            </TableCell>
                                            <TableCell align="right">
                                                <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>{item.income.toLocaleString()} ₽</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                ) : filteredLessons.length === 0 ? (
                    <Paper sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                        <EmptyStateContainer>
                            <EmptyStateIcon><ArchiveIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>Нет записей в архиве</Typography>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3, maxWidth: 400 }}>
                                {filterStatus !== 'all' || filterStudent !== 'all' || searchTerm ? 'Попробуйте изменить параметры фильтрации' : 'Здесь будут отображаться проведённые, оплаченные и отменённые занятия'}
                            </Typography>
                            {(filterStatus !== 'all' || filterStudent !== 'all' || searchTerm) && (
                                <Button onClick={handleResetFilters} startIcon={<ClearIcon />} sx={{ color: '#4F46E5', textTransform: 'none', fontSize: '14px', fontWeight: 500, borderRadius: '8px', '&:hover': { bgcolor: '#EEF2FF' } }}>Сбросить фильтры</Button>
                            )}
                        </EmptyStateContainer>
                    </Paper>
                ) : (
                    <>
                        <StyledTableContainer component={Paper} elevation={0}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', width: 40 }}></TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>
                                            <TableSortLabel active={orderBy === 'lessonDate'} direction={orderBy === 'lessonDate' ? order : 'asc'} onClick={() => handleRequestSort('lessonDate')}>Дата</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>
                                            <TableSortLabel active={orderBy === 'startTime'} direction={orderBy === 'startTime' ? order : 'asc'} onClick={() => handleRequestSort('startTime')}>Время</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>
                                            <TableSortLabel active={orderBy === 'studentName'} direction={orderBy === 'studentName' ? order : 'asc'} onClick={() => handleRequestSort('studentName')}>Ученик</TableSortLabel>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>Предмет</TableCell>
                                        <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>Статус</TableCell>
                                        <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB' }}>Сумма</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {paginatedLessons.map((lesson) => {
                                        const student = students.find(s => s.id === lesson.student?.id);
                                        const course = courses.find(c => c.id === lesson.course?.id);
                                        const rate = getStudentRateForTutor(student, user?.id) || 0;
                                        const isExpanded = expandedRow === lesson.id;
                                        
                                        const lessonPayment = payments.find(p => p.lesson?.id === lesson.id && (p.status === 'PAID' || p.status === 'paid'));
                                        const displayAmount = lessonPayment ? lessonPayment.amount : (lesson.status === 'PAID' ? rate : 0);

                                        return (
                                            <React.Fragment key={lesson.id}>
                                                <StyledTableRow onClick={() => handleRowClick(lesson.id)}>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', width: 40 }}>
                                                        <IconButton size="small" sx={{ color: '#9CA3AF' }}>{isExpanded ? <ChevronDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}</IconButton>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                            <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>{formatDate(lesson.lessonDate)}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Typography sx={{ fontSize: '14px', color: '#1F2937', fontFamily: 'monospace' }}>{lesson.startTime?.slice(0, 5)} – {lesson.endTime?.slice(0, 5)}</Typography>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(student?.fullName || '?'), fontSize: 12, fontWeight: 600 }}>{getInitials(student?.fullName || '?')}</Avatar>
                                                            <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>{student?.fullName || 'Неизвестно'}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Chip icon={<SchoolIcon sx={{ fontSize: 12, color: '#6B7280 !important' }} />} label={course?.name || lesson.course?.name || '—'} size="small" variant="outlined"
                                                            sx={{ borderRadius: '6px', borderColor: '#E5E7EB', color: '#6B7280', fontSize: '12px' }} />
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                            {getStatusBadge(lesson.status)}
                                                            {lesson.status === 'COMPLETED' && (
                                                                <Tooltip title="Подтвердить оплату">
                                                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleManualPayment(lesson); }}
                                                                        sx={{ color: '#10B981', '&:hover': { color: '#059669', bgcolor: '#ECFDF5' }, ml: 0.5 }}><CheckIcon sx={{ fontSize: 16 }} /></IconButton>
                                                                </Tooltip>
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Typography sx={{ fontWeight: 600, color: displayAmount > 0 ? '#10B981' : '#9CA3AF', fontSize: '14px' }}>
                                                            {displayAmount > 0 ? `${displayAmount.toLocaleString()} ₽` : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                </StyledTableRow>
                                                {isExpanded && (
                                                    <TableRow>
                                                        <TableCell colSpan={7} sx={{ backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB', p: 0 }}>
                                                            <Box sx={{ p: 3, display: 'flex', gap: 3 }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', mb: 1 }}>Что делали на уроке</Typography>
                                                                    <Paper sx={{ p: 2, backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                                                        <Typography sx={{ fontSize: '14px', color: '#374151' }}>{lesson.notes || 'Нет заметок'}</Typography>
                                                                    </Paper>
                                                                </Box>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography sx={{ fontSize: '11px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', mb: 1 }}>К следующему уроку</Typography>
                                                                    <Paper sx={{ p: 2, backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                                                        <Typography sx={{ fontSize: '14px', color: '#374151' }}>{lesson.nextLessonPlan || 'Нет плана'}</Typography>
                                                                    </Paper>
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </StyledTableContainer>
                        {filteredLessons.length > rowsPerPage && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination count={Math.ceil(filteredLessons.length / rowsPerPage)} page={page + 1} onChange={(e, newPage) => setPage(newPage - 1)} size="small"
                                    sx={{ '& .MuiPaginationItem-root': { borderRadius: '8px', color: '#6B7280' }, '& .Mui-selected': { backgroundColor: '#4F46E5 !important', color: '#FFFFFF' } }} />
                            </Box>
                        )}
                    </>
                )}

                <StyledDialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Заметки к занятию</DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', mb: 1 }}>Что делали на уроке</Typography>
                            <Paper sx={{ p: 2.5, backgroundColor: '#F9FAFB', mb: 3, borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{selectedLessonNotes.notes}</Typography>
                            </Paper>
                            <Typography sx={{ fontSize: '12px', fontWeight: 500, color: '#9CA3AF', textTransform: 'uppercase', mb: 1 }}>Что сделать к следующему уроку</Typography>
                            <Paper sx={{ p: 2.5, backgroundColor: '#EEF2FF', borderRadius: '8px', border: '1px solid #C7D2FE' }}>
                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{selectedLessonNotes.nextLessonPlan}</Typography>
                            </Paper>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => setOpenNotesDialog(false)} sx={{ backgroundColor: '#4F46E5', color: '#FFFFFF', borderRadius: '8px', px: 3, textTransform: 'none', fontSize: '14px', fontWeight: 500, '&:hover': { backgroundColor: '#4338CA' } }}>Закрыть</Button>
                    </DialogActions>
                </StyledDialog>
            </PageContainer>
        </LocalizationProvider>
    );
}

export default LessonsArchive;