// ========== frontend/src/pages/StudentProgress.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    FormControl, InputLabel, Select, MenuItem,
    Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    TrendingUp, School, CheckCircle,
    Star, StarHalf, StarBorder,
    CalendarToday as CalendarIcon,
    BarChart as BarChartIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from 'recharts';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const ChartPaper = styled(Paper)({
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
    marginBottom: '20px',
});

const HistoryPaper = styled(Paper)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
});


const StyledTableRow = styled(TableRow)({
    '&:nth-of-type(odd)': { backgroundColor: '#FFFFFF' },
    '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
    '&:hover': { backgroundColor: '#EEF2FF !important' },
});

// ========== УТИЛИТЫ ==========

function getPercentageColor(percentage) {
    if (percentage >= 80) return '#10B981';
    if (percentage >= 60) return '#F59E0B';
    return '#EF4444';
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function StudentProgress() {
    const { studentId: paramStudentId } = useParams();
    const location = useLocation();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [studentName, setStudentName] = useState('');
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('all');

    // ✅ Правильно определяем ID ученика
    const pathParts = location.pathname.split('/').filter(p => p);
    const lastPart = pathParts[pathParts.length - 1];
    const studentId = (paramStudentId && paramStudentId !== 'progress') 
        ? paramStudentId 
        : (!isNaN(lastPart) ? lastPart : user?.id);

    useEffect(() => {
        if (studentId && studentId !== 'undefined' && studentId !== 'progress') {
            fetchData();
            fetchStudentInfo();
            if (user?.role === 'ROLE_TUTOR' || user?.role === 'tutor') {
                fetchCourses();
            }
        }
    }, [studentId, selectedCourseId]);

    const fetchStudentInfo = async () => {
        try {
            const res = await axiosInstance.get(`/students/${studentId}`);
            setStudentName(res.data.fullName || 'Ученик');
        } catch (err) {
            console.error('Ошибка загрузки ученика:', err);
            setStudentName('Ученик #' + studentId);
        }
    };

    const fetchCourses = async () => {
        try {
            const res = await axiosInstance.get(`/courses/tutor/${user.id}`);
            setCourses(res.data || []);
        } catch (err) {
            console.error('Ошибка загрузки курсов:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = selectedCourseId !== 'all' ? `?courseId=${selectedCourseId}` : '';
            
            const [statsRes, timelineRes] = await Promise.all([
                axiosInstance.get(`/homework/progress/student/${studentId}${params}`),
                axiosInstance.get(`/homework/progress/student/${studentId}/timeline${params}`)
            ]);
            
            setStats(statsRes.data);
            setTimeline(timelineRes.data?.timeline || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Не удалось загрузить данные успеваемости');
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (grade) => {
        const stars = [];
        const fullStars = Math.floor(grade);
        const hasHalfStar = grade % 1 >= 0.5;
        for (let i = 0; i < fullStars; i++) stars.push(<Star key={`s${i}`} sx={{ color: '#F59E0B', fontSize: 18 }} />);
        if (hasHalfStar) stars.push(<StarHalf key="half" sx={{ color: '#F59E0B', fontSize: 18 }} />);
        for (let i = stars.length; i < 5; i++) stars.push(<StarBorder key={`e${i}`} sx={{ color: '#D1D5DB', fontSize: 18 }} />);
        return stars;
    };

    const chartData = timeline.map((point, index) => ({
        name: `ДЗ ${index + 1}`,
        date: new Date(point.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        percentage: point.percentage || 0,
        grade: point.grade || 0,
        maxScore: point.maxScore || 100,
        score: point.score || 0,
        courseName: point.courseName,
        fullDate: new Date(point.date).toLocaleDateString('ru-RU')
    }));

    const maxPercentage = Math.max(...chartData.map(d => d.percentage), 100);
    const minPercentage = Math.min(...chartData.map(d => d.percentage), 0);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <Paper sx={{ p: 2, border: '1px solid #E5E7EB', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#1F2937', mb: 1 }}>
                        {data.fullDate}
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        Результат: <strong>{data.percentage}%</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        Баллы: <strong>{data.score}/{data.maxScore}</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: '#374151' }}>
                        Оценка: <strong>{data.grade}/5</strong>
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
                        {data.courseName}
                    </Typography>
                </Paper>
            );
        }
        return null;
    };

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
                    <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                        Успеваемость: {studentName}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        Детальная статистика прогресса и успеваемости
                    </Typography>
                </Box>
                {courses.length > 0 && (
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ fontSize: '13px' }}>Предмет</InputLabel>
                        <Select 
                            value={selectedCourseId} 
                            onChange={(e) => setSelectedCourseId(e.target.value)} 
                            label="Предмет"
                            sx={{ 
                                borderRadius: '8px', 
                                backgroundColor: '#FFFFFF',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' },
                            }}
                        >
                            <MenuItem value="all">Все предметы</MenuItem>
                            {courses.map(c => (
                                <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                )}
            </Box>

            {/* ========== КАРТОЧКИ СТАТИСТИКИ ========== */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {[
                    { label: 'Всего заданий', value: stats?.totalHomework || 0, icon: School, color: '#3B82F6', bg: '#EFF6FF' },
                    { label: 'Проверено', value: stats?.checkedHomework || 0, icon: CheckCircle, color: '#10B981', bg: '#ECFDF5' },
                    { label: 'Средняя оценка', value: stats?.averageGrade || 0, icon: Star, color: '#F59E0B', bg: '#FFFBEB', isStars: true },
                    { label: 'Средний процент', value: `${stats?.averagePercentage || 0}%`, icon: TrendingUp, color: '#7C3AED', bg: '#F5F3FF' },
                ].map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Grid item xs={6} md={3} key={i}>
                            <StatCard>
                                <CardContent sx={{ p: 2.5, textAlign: 'center', '&:last-child': { pb: 2.5 } }}>
                                    {stat.isStars ? (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
                                            {renderStars(stat.value)}
                                        </Box>
                                    ) : (
                                        <Box sx={{
                                            width: 48, height: 48, borderRadius: '12px',
                                            backgroundColor: stat.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 12px',
                                        }}>
                                            <Icon sx={{ fontSize: 24, color: stat.color }} />
                                        </Box>
                                    )}
                                    <Typography sx={{ fontSize: '24px', fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>
                                        {stat.value}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                        {stat.label}
                                    </Typography>
                                </CardContent>
                            </StatCard>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ========== ГРАФИК ========== */}
            {timeline.length > 0 ? (
                <ChartPaper elevation={0}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                        <TimelineIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
                            Динамика успеваемости
                        </Typography>
                    </Box>
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} />
                            <YAxis 
                                domain={[Math.max(0, minPercentage - 10), Math.min(100, maxPercentage + 10)]}
                                tick={{ fontSize: 12, fill: '#6B7280' }}
                                label={{ value: 'Процент (%)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 12 }}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: '13px' }} />
                            <ReferenceLine 
                                y={80} 
                                stroke="#10B981" 
                                strokeDasharray="5 5" 
                                label={{ value: 'Цель: 80%', position: 'right', fill: '#10B981', fontSize: 12 }} 
                            />
                            <Line 
                                type="monotone" 
                                dataKey="percentage" 
                                stroke="#4F46E5" 
                                strokeWidth={3} 
                                name="Результат (%)"
                                dot={{ r: 6, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 2 }}
                                activeDot={{ r: 8, fill: '#4F46E5', stroke: '#FFFFFF', strokeWidth: 3 }} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </ChartPaper>
            ) : (
                <ChartPaper elevation={0}>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <BarChartIcon sx={{ fontSize: 36, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            Нет данных для отображения графика
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            Проверенные домашние задания появятся здесь
                        </Typography>
                    </EmptyStateContainer>
                </ChartPaper>
            )}

            {/* ========== ТАБЛИЦА ИСТОРИИ ========== */}
            {timeline.length > 0 && (
                <HistoryPaper elevation={0}>
                    <Box sx={{ p: 3, pb: 0 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 2 }}>
                            История домашних заданий
                        </Typography>
                    </Box>
                    <TableContainer>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                        Дата
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                        Предмет
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                        Баллы
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                        %
                                    </TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                        Оценка
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {timeline.slice().reverse().map((item, idx) => {
                                    const pct = item.percentage || 0;
                                    const pctColor = getPercentageColor(pct);
                                    
                                    return (
                                        <StyledTableRow key={idx}>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                    <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                        {new Date(item.date).toLocaleDateString('ru-RU')}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <Typography sx={{ fontSize: '14px', color: '#374151' }}>
                                                    {item.courseName || '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>
                                                    {item.score || 0}/{item.maxScore || 100}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <Chip
                                                    label={`${pct}%`}
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: pct >= 80 ? '#ECFDF5' : pct >= 60 ? '#FFFBEB' : '#FEF2F2',
                                                        color: pctColor,
                                                        fontWeight: 600,
                                                        fontSize: '12px',
                                                        borderRadius: '100px',
                                                        minWidth: 50,
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                    {renderStars(item.grade || 0)}
                                                </Box>
                                            </TableCell>
                                        </StyledTableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </HistoryPaper>
            )}
        </PageContainer>
    );
}

export default StudentProgress;