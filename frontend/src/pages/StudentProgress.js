// ========== frontend/src/pages/StudentProgress.js (v4 — ДЗ + Пробники) ==========
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { styled } from '@mui/material/styles';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    CircularProgress, Alert, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TableSortLabel,
    FormControl, InputLabel, Select, MenuItem,
    Chip, TextField, InputAdornment, IconButton, Tooltip
} from '@mui/material';
import {
    TrendingUp, School, CheckCircle,
    Star, StarHalf, StarBorder,
    CalendarToday as CalendarIcon,
    BarChart as BarChartIcon,
    Timeline as TimelineIcon,
    Search as SearchIcon,
    Clear as ClearIcon,
    FilterList as FilterIcon,
    Assignment as AssignmentIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton } from '../styles/shared';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ========== СТИЛИ ==========

const ChartPaper = styled(Paper)({
    padding: '24px',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    marginBottom: '24px',
});

const HistoryPaper = styled(Paper)({
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
});

const StyledTableRow = styled(TableRow)(({ highlight }) => ({
    backgroundColor: highlight ? '#FFF5F5' : '#FFFFFF',
    '&:nth-of-type(even)': { backgroundColor: highlight ? '#FFF5F5' : '#F9FAFB' },
    '&:hover': { backgroundColor: '#EEF2FF !important' },
}));

const FilterChip = styled(Chip)(({ active }) => ({
    borderRadius: '8px',
    fontSize: '12px',
    height: 28,
    backgroundColor: active ? '#EEF2FF' : '#F9FAFB',
    color: active ? '#4F46E5' : '#6B7280',
    border: active ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#EEF2FF',
        color: '#4F46E5',
    },
}));

// ========== УТИЛИТЫ ==========

function getPercentageColor(percentage) {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
}

function getScoreColor(score) {
    if (score >= 80) return '#10B981';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
}

function renderStars(grade) {
    const stars = [];
    const fullStars = Math.floor(grade);
    const hasHalfStar = grade % 1 >= 0.5;
    for (let i = 0; i < fullStars; i++) stars.push(<Star key={`s${i}`} sx={{ color: '#F59E0B', fontSize: 16 }} />);
    if (hasHalfStar) stars.push(<StarHalf key="half" sx={{ color: '#F59E0B', fontSize: 16 }} />);
    for (let i = stars.length; i < 5; i++) stars.push(<StarBorder key={`e${i}`} sx={{ color: '#D1D5DB', fontSize: 16 }} />);
    return stars;
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function StudentProgress() {
    const { studentId: paramStudentId } = useParams();
    const location = useLocation();
    const { user } = useAuth();

    // Состояния
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [studentName, setStudentName] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('all');

    // ✅ Тип активной вкладки
    const [activeType, setActiveType] = useState('HOMEWORK'); // HOMEWORK | MOCK_EXAM

    // Поиск, сортировка, пагинация
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortField, setSortField] = useState('date');
    const [sortDirection, setSortDirection] = useState('desc');
    const [showGraph, setShowGraph] = useState(true);

    const pathParts = location.pathname.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    const studentId = (paramStudentId && paramStudentId !== 'progress')
        ? paramStudentId
        : (!isNaN(lastPart) ? lastPart : user?.id);

    useEffect(() => {
        if (studentId && studentId !== 'undefined' && studentId !== 'progress') {
            fetchStudentInfo();
            if (user?.role === 'ROLE_TUTOR' || user?.role === 'tutor') {
                fetchCourses();
            }
        }
    }, [studentId]);

    // ✅ Загрузка данных по типу
    useEffect(() => {
        if (studentId && studentId !== 'undefined' && studentId !== 'progress') {
            fetchData();
        }
    }, [studentId, selectedCourseId, activeType]);

    const fetchStudentInfo = async () => {
        try {
            const res = await axiosInstance.get(`/students/${studentId}`);
            setStudentName(res.data.fullName || 'Ученик');
        } catch (err) {
            setStudentName('Ученик #' + studentId);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await axiosInstance.get(`/courses/tutor/${user.id}`);
            setCourses(res.data || []);
        } catch (err) {}
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = selectedCourseId !== 'all' ? `?courseId=${selectedCourseId}` : '';
            const sep = params ? '&' : '?';

            const [statsRes, timelineRes] = await Promise.all([
                axiosInstance.get(`/homework/progress/student/${studentId}/type/${activeType}${params}`),
                axiosInstance.get(`/homework/progress/student/${studentId}/timeline/type/${activeType}${params}`)
            ]);

            setStats(statsRes.data);
            setTimeline(timelineRes.data?.timeline || []);
            setError(null);
            setPage(0);
        } catch (err) {
            setError('Не удалось загрузить данные успеваемости');
        } finally {
            setLoading(false);
        }
    };

    // ========== ФИЛЬТРАЦИЯ, СОРТИРОВКА, ПАГИНАЦИЯ ==========

    const filteredAndSorted = useMemo(() => {
        let result = [...timeline];

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                (item.courseName && item.courseName.toLowerCase().includes(q)) ||
                (item.subject && item.subject.toLowerCase().includes(q)) ||
                (item.examType && item.examType.toLowerCase().includes(q))
            );
        }

        if (statusFilter !== 'ALL') {
            if (activeType === 'MOCK_EXAM') {
                // Фильтр по баллам для пробников
                const threshold = statusFilter === 'HIGH' ? 80 : statusFilter === 'MEDIUM' ? 60 : 0;
                result = result.filter(item => {
                    const sc = item.score || 0;
                    if (statusFilter === 'LOW') return sc < 60;
                    return sc >= threshold;
                });
            } else {
                const pctThreshold = statusFilter === 'HIGH' ? 80 : statusFilter === 'MEDIUM' ? 60 : 0;
                const pctThresholdMax = statusFilter === 'HIGH' ? 100 : statusFilter === 'MEDIUM' ? 79 : 59;
                result = result.filter(item => {
                    const pct = item.percentage || 0;
                    if (statusFilter === 'LOW') return pct < 60;
                    return pct >= pctThreshold && pct <= pctThresholdMax;
                });
            }
        }

        result.sort((a, b) => {
            let valA, valB;
            switch (sortField) {
                case 'percentage':
                    valA = a.percentage || 0;
                    valB = b.percentage || 0;
                    break;
                case 'score':
                    valA = a.score || 0;
                    valB = b.score || 0;
                    break;
                case 'courseName':
                    valA = (a.courseName || '').toLowerCase();
                    valB = (b.courseName || '').toLowerCase();
                    break;
                case 'date':
                default:
                    valA = a.date ? new Date(a.date).getTime() : 0;
                    valB = b.date ? new Date(b.date).getTime() : 0;
                    break;
            }
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        });

        return result;
    }, [timeline, searchQuery, statusFilter, sortField, sortDirection, activeType]);

    const paginatedTimeline = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredAndSorted.slice(start, start + rowsPerPage);
    }, [filteredAndSorted, page, rowsPerPage]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // ✅ Данные для графика
    const chartData = useMemo(() => {
        return timeline
            .slice()
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((point, index) => {
                const isExam = activeType === 'MOCK_EXAM';
                return {
                    name: isExam ? `Пробник ${index + 1}` : `ДЗ ${index + 1}`,
                    date: new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
                    percentage: point.percentage || 0,
                    score: point.score || 0,
                    grade: point.grade || 0,
                    maxScore: point.maxScore || (isExam ? 100 : 100),
                    courseName: point.courseName,
                    subject: point.subject,
                    examType: point.examType,
                    fullDate: new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
                };
            });
    }, [timeline, activeType]);

    const maxPercentage = Math.max(...chartData.map(d => d.percentage), 100);
    const minPercentage = Math.min(...chartData.map(d => d.percentage), 0);
    const maxScore = Math.max(...chartData.map(d => d.score), 100);
    const minScore = Math.min(...chartData.map(d => d.score), 0);

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const isExam = activeType === 'MOCK_EXAM';
            return (
                <Paper sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#1F2937', mb: 1 }}>{data.fullDate}</Typography>
                    {isExam && data.examType && (
                        <Typography sx={{ fontSize: '13px', color: '#7C3AED', fontWeight: 600 }}>
                            {data.examType === 'EGE' ? 'ЕГЭ' : 'ОГЭ'}{data.subject ? ` · ${data.subject}` : ''}
                        </Typography>
                    )}
                    <Typography sx={{ fontSize: '13px', color: '#374151' }}>Результат: <strong>{data.percentage}%</strong></Typography>
                    <Typography sx={{ fontSize: '13px', color: '#374151' }}>Баллы: <strong>{data.score}/{data.maxScore}</strong></Typography>
                    {!isExam && <Typography sx={{ fontSize: '13px', color: '#374151' }}>Оценка: <strong>{data.grade}/5</strong></Typography>}
                    {data.courseName && <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>{data.courseName}</Typography>}
                </Paper>
            );
        }
        return null;
    };

    // ✅ Статистика для текущего типа
    const statCards = useMemo(() => {
        if (activeType === 'MOCK_EXAM') {
            const scores = timeline.filter(t => t.score != null).map(t => t.score);
            const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
            const bestScore = scores.length > 0 ? Math.max(...scores) : 0;
            return [
                { label: 'Всего пробников', value: stats?.totalHomework || 0, icon: TrophyIcon, color: '#7C3AED', bg: '#F5F3FF' },
                { label: 'Проверено', value: stats?.checkedHomework || 0, icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
                { label: 'Средний балл', value: `${avgScore}/100`, icon: TrendingUp, color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Лучший балл', value: `${bestScore}/100`, icon: Star, color: '#EC4899', bg: '#FCE7F3' },
            ];
        }
        return [
            { label: 'Всего заданий', value: stats?.totalHomework || 0, icon: School, color: '#3B82F6', bg: '#EFF6FF' },
            { label: 'Проверено', value: stats?.checkedHomework || 0, icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
            { label: 'Средняя оценка', value: stats?.averageGrade || 0, icon: Star, color: '#F59E0B', bg: '#FFFBEB', isStars: true },
            { label: 'Средний %', value: `${stats?.averagePercentage || 0}%`, icon: TrendingUp, color: '#7C3AED', bg: '#F5F3FF' },
        ];
    }, [stats, timeline, activeType]);

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#4F46E5' }} />
            </Box>
        </PageContainer>
    );

    if (error) return (
        <PageContainer>
            <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
        </PageContainer>
    );

    return (
        <PageContainer>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
                        📊 Успеваемость: {studentName}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {activeType === 'HOMEWORK'
                            ? `${stats?.totalHomework || 0} заданий • Средний балл ${stats?.averageGrade || 0} • ${stats?.averagePercentage || 0}%`
                            : `${stats?.totalHomework || 0} пробников • Проверено ${stats?.checkedHomework || 0}`}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    {courses.length > 0 && (
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel>Предмет</InputLabel>
                            <Select
                                value={selectedCourseId}
                                onChange={(e) => { setSelectedCourseId(e.target.value); setPage(0); }}
                                label="Предмет"
                                sx={{ borderRadius: '10px', bgcolor: '#FFFFFF' }}
                            >
                                <MenuItem value="all">Все предметы</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                    <StyledButton
                        variant="outlined"
                        startIcon={<TimelineIcon sx={{ fontSize: 16 }} />}
                        onClick={() => setShowGraph(!showGraph)}
                        sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '10px', '&:hover': { bgcolor: '#F9FAFB' } }}
                    >
                        {showGraph ? 'Скрыть график' : 'Показать график'}
                    </StyledButton>
                </Box>
            </Box>

            {/* ========== ВКЛАДКИ ========== */}
            <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', mb: 3 }}>
                <Tabs
                    value={activeType}
                    onChange={(e, v) => { setActiveType(v); setPage(0); setSearchQuery(''); setStatusFilter('ALL'); }}
                    sx={{
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '14px', minHeight: 52 },
                        '& .Mui-selected': { color: '#4F46E5' },
                        '& .MuiTabs-indicator': { backgroundColor: '#4F46E5', height: 3 },
                    }}
                >
                    <Tab value="HOMEWORK" icon={<AssignmentIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Домашние задания" />
                    <Tab value="MOCK_EXAM" icon={<TrophyIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Пробники" />
                </Tabs>
            </Paper>

            {/* ========== КАРТОЧКИ СТАТИСТИКИ ========== */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statCards.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Grid item xs={6} md={3} key={i}>
                            <StatCard>
                                <CardContent sx={{ p: 2.5, textAlign: 'center', '&:last-child': { pb: 2.5 } }}>
                                    {stat.isStars ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>{renderStars(stat.value)}</Box>
                                    ) : (
                                        <Box sx={{ width: 48, height: 48, borderRadius: '12px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                                            <Icon sx={{ fontSize: 24, color: stat.color }} />
                                        </Box>
                                    )}
                                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>{stat.value}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>{stat.label}</Typography>
                                </CardContent>
                            </StatCard>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ========== ГРАФИК ========== */}
            {showGraph && (
                timeline.length > 0 ? (
                    <ChartPaper elevation={0}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                            <TimelineIcon sx={{ color: activeType === 'MOCK_EXAM' ? '#7C3AED' : '#4F46E5', fontSize: 20 }} />
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
                                {activeType === 'MOCK_EXAM' ? 'Динамика баллов за пробники' : 'Динамика успеваемости'}
                            </Typography>
                        </Box>
                        <ResponsiveContainer width="100%" height={350}>
                            {activeType === 'MOCK_EXAM' ? (
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis
                                        domain={[Math.max(0, minScore - 10), Math.min(100, maxScore + 10)]}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                    <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Цель: 80', position: 'right', fill: '#10B981', fontSize: 12 }} />
                                    <Line type="monotone" dataKey="score" stroke="#7C3AED" strokeWidth={3} name="Баллы (0-100)" dot={{ r: 6, fill: '#7C3AED', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            ) : (
                                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                                    <YAxis
                                        domain={[Math.max(0, minPercentage - 10), Math.min(100, maxPercentage + 10)]}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                    />
                                    <RechartsTooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                    <ReferenceLine y={80} stroke="#10B981" strokeDasharray="5 5" label={{ value: 'Цель: 80%', position: 'right', fill: '#10B981', fontSize: 12 }} />
                                    <Line type="monotone" dataKey="percentage" stroke="#4F46E5" strokeWidth={3} name="Результат (%)" dot={{ r: 6, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }} activeDot={{ r: 8 }} />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </ChartPaper>
                ) : (
                    <ChartPaper elevation={0}>
                        <Box sx={{ textAlign: 'center', py: 6 }}>
                            {activeType === 'MOCK_EXAM' ? (
                                <TrophyIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                            ) : (
                                <BarChartIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                            )}
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#9CA3AF' }}>
                                {activeType === 'MOCK_EXAM' ? 'Нет данных по пробникам' : 'Нет данных для графика'}
                            </Typography>
                        </Box>
                    </ChartPaper>
                )
            )}

            {/* ========== ПОИСК + ФИЛЬТРЫ ========== */}
            {timeline.length > 0 && (
                <Paper sx={{ p: 2, mb: 2.5, borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                        <TextField
                            placeholder={activeType === 'MOCK_EXAM' ? 'Поиск по предмету или экзамену...' : 'Поиск по предмету...'}
                            size="small"
                            value={searchQuery}
                            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                            InputProps={{
                                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment>,
                                endAdornment: searchQuery ? (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setSearchQuery('')}><ClearIcon fontSize="small" /></IconButton>
                                    </InputAdornment>
                                ) : null,
                            }}
                            sx={{ minWidth: 250, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}
                        />
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {activeType === 'MOCK_EXAM' ? (
                                [
                                    { value: 'ALL', label: 'Все' },
                                    { value: 'HIGH', label: '👍 80-100' },
                                    { value: 'MEDIUM', label: '👌 60-79' },
                                    { value: 'LOW', label: '⚠️ <60' },
                                ].map(item => (
                                    <FilterChip key={item.value} label={item.label} active={statusFilter === item.value}
                                        onClick={() => { setStatusFilter(item.value); setPage(0); }} />
                                ))
                            ) : (
                                [
                                    { value: 'ALL', label: 'Все' },
                                    { value: 'HIGH', label: '👍 80-100%' },
                                    { value: 'MEDIUM', label: '👌 60-79%' },
                                    { value: 'LOW', label: '⚠️ <60%' },
                                ].map(item => (
                                    <FilterChip key={item.value} label={item.label} active={statusFilter === item.value}
                                        onClick={() => { setStatusFilter(item.value); setPage(0); }} />
                                ))
                            )}
                        </Box>
                    </Box>
                </Paper>
            )}

            {/* ========== ТАБЛИЦА ИСТОРИИ ========== */}
            {timeline.length > 0 && (
                <HistoryPaper elevation={0}>
                    <Box sx={{ px: 3, pt: 3, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
                                {activeType === 'MOCK_EXAM' ? '🏆 История пробников' : '📋 История домашних заданий'}
                            </Typography>
                            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                {filteredAndSorted.length} записей
                            </Typography>
                        </Box>
                    </Box>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>
                                        <TableSortLabel
                                            active={sortField === 'date'}
                                            direction={sortField === 'date' ? sortDirection : 'desc'}
                                            onClick={() => handleSort('date')}
                                        >
                                            Дата
                                        </TableSortLabel>
                                    </TableCell>
                                    {activeType === 'MOCK_EXAM' ? (
                                        <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>
                                            Экзамен
                                        </TableCell>
                                    ) : (
                                        <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>
                                            <TableSortLabel
                                                active={sortField === 'courseName'}
                                                direction={sortField === 'courseName' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('courseName')}
                                            >
                                                Предмет
                                            </TableSortLabel>
                                        </TableCell>
                                    )}
                                    {activeType === 'MOCK_EXAM' ? (
                                        <>
                                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>
                                                <TableSortLabel
                                                    active={sortField === 'score'}
                                                    direction={sortField === 'score' ? sortDirection : 'desc'}
                                                    onClick={() => handleSort('score')}
                                                >
                                                    Баллы
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>
                                                %
                                            </TableCell>
                                        </>
                                    ) : (
                                        <>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>Баллы</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>
                                                <TableSortLabel
                                                    active={sortField === 'percentage'}
                                                    direction={sortField === 'percentage' ? sortDirection : 'desc'}
                                                    onClick={() => handleSort('percentage')}
                                                >
                                                    %
                                                </TableSortLabel>
                                            </TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '13px', color: '#6B7280', py: 1.5 }}>Оценка</TableCell>
                                        </>
                                    )}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedTimeline.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={activeType === 'MOCK_EXAM' ? 4 : 5} align="center" sx={{ py: 6 }}>
                                            <Typography sx={{ color: '#9CA3AF' }}>Ничего не найдено</Typography>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    paginatedTimeline.map((item, idx) => {
                                        const isExam = activeType === 'MOCK_EXAM';
                                        const pct = item.percentage || 0;
                                        const score = item.score || 0;
                                        const value = isExam ? score : pct;
                                        const valueColor = isExam ? getScoreColor(score) : getPercentageColor(pct);
                                        const isLow = value < 60;

                                        return (
                                            <StyledTableRow key={idx} highlight={isLow}>
                                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarIcon sx={{ fontSize: 14, color: isLow ? '#EF4444' : '#9CA3AF' }} />
                                                        <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                            {new Date(item.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                        </Typography>
                                                    </Box>
                                                </TableCell>

                                                {isExam ? (
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                            {item.examType && (
                                                                <Chip label={item.examType === 'EGE' ? 'ЕГЭ' : 'ОГЭ'} size="small"
                                                                    sx={{ fontSize: '12px', bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 700, borderRadius: '6px', height: 24 }} />
                                                            )}
                                                            {item.subject && (
                                                                <Chip label={item.subject} size="small"
                                                                    sx={{ fontSize: '12px', bgcolor: '#F3F4F6', color: '#374151', fontWeight: 600, borderRadius: '6px', height: 24 }} />
                                                            )}
                                                        </Box>
                                                    </TableCell>
                                                ) : (
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                        <Chip
                                                            label={item.courseName || 'Без предмета'}
                                                            size="small"
                                                            sx={{ fontSize: '13px', bgcolor: '#F3F4F6', color: '#374151', borderRadius: '6px', height: 26 }}
                                                        />
                                                    </TableCell>
                                                )}

                                                {isExam ? (
                                                    <>
                                                        <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                            <Chip
                                                                label={`${score}/${item.maxScore || 100}`}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: score >= 80 ? '#ECFDF5' : score >= 60 ? '#FFFBEB' : '#FEF2F2',
                                                                    color: valueColor,
                                                                    fontWeight: 700,
                                                                    fontSize: '13px',
                                                                    borderRadius: '100px',
                                                                    minWidth: 70,
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                            <Typography sx={{ fontSize: '14px', color: '#6B7280', fontWeight: 500 }}>
                                                                {pct}%
                                                            </Typography>
                                                        </TableCell>
                                                    </>
                                                ) : (
                                                    <>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                            <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>
                                                                {item.score || 0}/{item.maxScore || 100}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                            <Chip
                                                                label={`${pct}%`}
                                                                size="small"
                                                                sx={{
                                                                    backgroundColor: pct >= 80 ? '#ECFDF5' : pct >= 60 ? '#FFFBEB' : '#FEF2F2',
                                                                    color: valueColor,
                                                                    fontWeight: 700,
                                                                    fontSize: '13px',
                                                                    borderRadius: '100px',
                                                                    minWidth: 55,
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6', py: 1.5 }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'center' }}>{renderStars(item.grade || 0)}</Box>
                                                        </TableCell>
                                                    </>
                                                )}
                                            </StyledTableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[15, 25, 50, 100]}
                        component="div"
                        count={filteredAndSorted.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage="Записей:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
                        sx={{ borderTop: '1px solid #F3F4F6' }}
                    />
                </HistoryPaper>
            )}

            {/* ========== ПУСТОЕ СОСТОЯНИЕ ========== */}
            {timeline.length === 0 && (
                <Paper sx={{ borderRadius: '16px', p: 6, textAlign: 'center' }}>
                    {activeType === 'MOCK_EXAM' ? (
                        <TrophyIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                    ) : (
                        <BarChartIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                    )}
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                        {activeType === 'MOCK_EXAM' ? 'Нет данных по пробникам' : 'Нет данных об успеваемости'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {activeType === 'MOCK_EXAM'
                            ? 'Проверенные пробники появятся здесь'
                            : 'Проверенные домашние задания появятся здесь'}
                    </Typography>
                </Paper>
            )}
        </PageContainer>
    );
}

export default StudentProgress;