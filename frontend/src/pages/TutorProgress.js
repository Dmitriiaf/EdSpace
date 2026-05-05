import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Avatar, Divider,
    IconButton, Tooltip, LinearProgress,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    TrendingUp, Visibility, School,
    Star, StarHalf, StarBorder,
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

function TutorProgress() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('all');
    const [globalStats, setGlobalStats] = useState({ total: 0, completed: 0, avgGrade: 0, avgPct: 0 });

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        fetchStudentsProgress();
    }, [user, selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const res = await axiosInstance.get(`/courses/tutor/${user?.id}`);
            setCourses(res.data || []);
        } catch (err) {}
    };

    const fetchStudentsProgress = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/students/tutor/${user.id}`);
            const studentsData = response.data || [];
            
            const studentsWithStats = await Promise.all(
                studentsData.map(async (student) => {
                    try {
                        const url = `/homework/progress/student/${student.id}${selectedCourseId !== 'all' ? `?courseId=${selectedCourseId}` : ''}`;
                        const statsRes = await axiosInstance.get(url);
                        return { ...student, stats: statsRes.data || {} };
                    } catch (err) {
                        return { ...student, stats: {} };
                    }
                })
            );
            
            setStudents(studentsWithStats);
            
            const total = studentsWithStats.reduce((a, s) => a + (s.stats.totalHomework || 0), 0);
            const completed = studentsWithStats.reduce((a, s) => a + (s.stats.checkedHomework || 0), 0);
            const grades = studentsWithStats.flatMap(s => s.stats.averageGrade ? [s.stats.averageGrade] : []);
            const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : 0;
            const avgPct = Math.round(studentsWithStats.reduce((a, s) => a + (s.stats.averagePercentage || 0), 0) / Math.max(1, studentsWithStats.length));
            setGlobalStats({ total, completed, avgGrade, avgPct });
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
        for (let i = 0; i < fullStars; i++) stars.push(<Star key={`s${i}`} sx={{ color: '#FFD700', fontSize: 16 }} />);
        if (hasHalfStar) stars.push(<StarHalf key="half" sx={{ color: '#FFD700', fontSize: 16 }} />);
        for (let i = stars.length; i < 5; i++) stars.push(<StarBorder key={`e${i}`} sx={{ color: '#475569', fontSize: 16 }} />);
        return stars;
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
    );

    if (error) return <Box sx={{ p: 3 }}><Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert></Box>;

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px' }}>
                    Успеваемость учеников
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748B', mt: 0.5 }}>
                    Сводная статистика и прогресс по каждому ученику
                </Typography>
            </Box>

            {/* Фильтр по предмету */}
            <Box sx={{ mb: 3 }}>
                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel>Предмет</InputLabel>
                    <Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} label="Предмет"
                        sx={{ borderRadius: 2, bgcolor: 'white' }}>
                        <MenuItem value="all">Все предметы</MenuItem>
                        {courses.map(c => (
                            <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Box>

            {/* Global Stats */}
            {students.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 4 }}>
                    {[
                        { label: 'Всего заданий', value: globalStats.total, icon: AssignmentIcon, gradient: 'linear-gradient(135deg, #6366F1, #8B5CF6)' },
                        { label: 'Проверено', value: globalStats.completed, icon: CheckIcon, gradient: 'linear-gradient(135deg, #10B981, #34D399)' },
                        { label: 'Средний балл', value: `${globalStats.avgGrade}/5`, icon: Star, gradient: 'linear-gradient(135deg, #F59E0B, #EF4444)' },
                        { label: 'Успеваемость', value: `${globalStats.avgPct}%`, icon: TrendingUp, gradient: 'linear-gradient(135deg, #06B6D4, #3B82F6)' },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Grid item xs={6} md={3} key={i}>
                                <Card sx={{
                                    borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF',
                                    backdropFilter: 'blur(10px)', transition: 'all 0.3s',
                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(0,0,0,0.08)' }
                                }}>
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Typography variant="h4" sx={{ fontWeight: 800, background: stat.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>{stat.label}</Typography>
                                            </Box>
                                            <Box sx={{ width: 40, height: 40, borderRadius: 2, background: stat.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.12 }}>
                                                <Icon sx={{ color: 'white', fontSize: 18 }} />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {students.length === 0 ? (
                <Card sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF' }}>
                    <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                        <School sx={{ fontSize: 36, color: '#94A3B8' }} />
                    </Box>
                    <Typography variant="h6" sx={{ color: '#64748B', fontWeight: 500 }}>У вас пока нет учеников</Typography>
                </Card>
            ) : (
                <Grid container spacing={2}>
                    {students.map((student) => {
                        const stats = student.stats || {};
                        const completed = stats.checkedHomework || 0;
                        const total = stats.totalHomework || 0;
                        const progressPercent = total > 0 ? (completed / total) * 100 : 0;
                        const avgGrade = stats.averageGrade || 0;
                        const avgPct = Math.round(stats.averagePercentage || 0);
                        
                        return (
                            <Grid item xs={12} md={6} key={student.id}>
                                <Card sx={{
                                    borderRadius: 3, border: '1px solid #E2E8F0', bgcolor: '#FFFFFF',
                                    transition: 'all 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 16px 48px rgba(0,0,0,0.08)', borderColor: '#6366F1' }
                                }}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ width: 52, height: 52, background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', fontWeight: 700, fontSize: 20 }}>
                                                    {student.fullName?.charAt(0) || 'У'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#0F172A' }}>
                                                        {student.fullName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        {renderStars(avgGrade)}
                                                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                                                            {avgGrade.toFixed(1)}/5
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Tooltip title="Подробная статистика">
                                                <IconButton onClick={() => navigate(`/student-progress/${student.id}`)}
                                                    sx={{ color: '#6366F1', bgcolor: '#EEF2FF', '&:hover': { bgcolor: '#DBEAFE' } }}>
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        
                                        <Divider sx={{ mb: 2 }} />
                                        
                                        <Grid container spacing={2} sx={{ mb: 2 }}>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#6366F1' }}>{total}</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748B' }}>Заданий</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#10B981' }}>{completed}</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748B' }}>Проверено</Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: '#F8FAFC', borderRadius: 2 }}>
                                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#8B5CF6' }}>{avgPct}%</Typography>
                                                    <Typography variant="caption" sx={{ color: '#64748B' }}>Успеваемость</Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                        
                                        <Box sx={{ mb: 1 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" sx={{ color: '#64748B' }}>Прогресс</Typography>
                                                <Typography variant="caption" sx={{ fontWeight: 600, color: '#0F172A' }}>{Math.round(progressPercent)}%</Typography>
                                            </Box>
                                            <LinearProgress variant="determinate" value={progressPercent}
                                                sx={{ height: 8, borderRadius: 4, bgcolor: '#F1F5F9',
                                                    '& .MuiLinearProgress-bar': {
                                                        borderRadius: 4,
                                                        background: progressPercent >= 80 ? 'linear-gradient(90deg, #10B981, #34D399)' :
                                                                    progressPercent >= 50 ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' :
                                                                    'linear-gradient(90deg, #EF4444, #F87171)'
                                                    }
                                                }} />
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Chip size="small"
                                                label={progressPercent >= 80 ? 'Отличный прогресс' : progressPercent >= 50 ? 'Хороший прогресс' : 'Требует внимания'}
                                                sx={{
                                                    bgcolor: progressPercent >= 80 ? '#ECFDF5' : progressPercent >= 50 ? '#FFFBEB' : '#FEF2F2',
                                                    color: progressPercent >= 80 ? '#065F46' : progressPercent >= 50 ? '#92400E' : '#991B1B',
                                                    fontWeight: 600, borderRadius: 1.5
                                                }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </Box>
    );
}

export default TutorProgress;