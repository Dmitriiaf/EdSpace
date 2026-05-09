// ========== frontend/src/pages/TutorProgress.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Grid, Card, CardContent,
    CircularProgress, Alert, Avatar, Divider,
    IconButton, Tooltip, LinearProgress,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    TrendingUp, Visibility, School,
    Star, StarHalf, StarBorder,
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon,
    Person as PersonIcon,
    BarChart as BarChartIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const StudentCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
    },
});



const ProgressBar = styled(Box)({
    height: '8px',
    backgroundColor: '#E5E7EB',
    borderRadius: '4px',
    overflow: 'hidden',
});

const ProgressFill = styled(Box)(({ width }) => ({
    height: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: '4px',
    width: `${width}%`,
    transition: 'width 0.4s ease',
}));

const MiniStatBox = styled(Box)({
    textAlign: 'center',
    padding: '12px 8px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #F3F4F6',
});

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

function getProgressColor(percent) {
    if (percent >= 80) return '#10B981';
    if (percent >= 50) return '#4F46E5';
    if (percent >= 25) return '#F59E0B';
    return '#EF4444';
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
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
        if (user?.id) fetchCourses();
    }, [user]);

    useEffect(() => {
        if (user?.id) fetchProgress();
    }, [user, selectedCourseId]);

    const fetchCourses = async () => {
        try {
            const res = await axiosInstance.get(`/courses/tutor/${user.id}`);
            setCourses(res.data || []);
        } catch (err) {
            console.error('Ошибка загрузки курсов:', err);
        }
    };

    const fetchProgress = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = selectedCourseId !== 'all' ? `?courseId=${selectedCourseId}` : '';
            const response = await axiosInstance.get(`/homework/progress/tutor/${user.id}${params}`);
            const data = response.data || [];
            
            const sorted = data.sort((a, b) => b.totalHomework - a.totalHomework);
            setStudents(sorted);
            
            const total = data.reduce((a, s) => a + (s.totalHomework || 0), 0);
            const completed = data.reduce((a, s) => a + (s.checkedHomework || 0), 0);
            const grades = data.flatMap(s => s.averageGrade > 0 ? [s.averageGrade] : []);
            const avgGrade = grades.length > 0 ? (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1) : 0;
            const avgPct = Math.round(data.reduce((a, s) => a + (s.averagePercentage || 0), 0) / Math.max(1, data.length));
            setGlobalStats({ total, completed, avgGrade, avgPct });
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
        for (let i = 0; i < fullStars; i++) stars.push(<Star key={`s${i}`} sx={{ color: '#F59E0B', fontSize: 16 }} />);
        if (hasHalfStar) stars.push(<StarHalf key="half" sx={{ color: '#F59E0B', fontSize: 16 }} />);
        for (let i = stars.length; i < 5; i++) stars.push(<StarBorder key={`e${i}`} sx={{ color: '#D1D5DB', fontSize: 16 }} />);
        return stars;
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
                        Успеваемость учеников
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        Сводная статистика и прогресс по каждому ученику
                    </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 220 }}>
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
            </Box>

            {/* ========== ГЛОБАЛЬНАЯ СТАТИСТИКА ========== */}
            {students.length > 0 && (
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Всего заданий', value: globalStats.total, icon: AssignmentIcon, color: '#4F46E5', bg: '#EEF2FF' },
                        { label: 'Проверено', value: globalStats.completed, icon: CheckIcon, color: '#10B981', bg: '#ECFDF5' },
                        { label: 'Средний балл', value: `${globalStats.avgGrade}/5`, icon: Star, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: 'Успеваемость', value: `${globalStats.avgPct}%`, icon: TrendingUp, color: '#3B82F6', bg: '#EFF6FF' },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Grid item xs={6} md={3} key={i}>
                                <StatCard>
                                    <CardContent sx={{ p: 2.5, textAlign: 'center', '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{
                                            width: 48, height: 48, borderRadius: '12px',
                                            backgroundColor: stat.bg,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 12px',
                                        }}>
                                            <Icon sx={{ fontSize: 24, color: stat.color }} />
                                        </Box>
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
            )}

            {/* ========== ПУСТОЕ СОСТОЯНИЕ ========== */}
            {students.length === 0 ? (
                <StatCard>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <School sx={{ fontSize: 40, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            {selectedCourseId === 'all' ? 'Нет данных об успеваемости' : 'На этом курсе нет домашних заданий'}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            Назначайте домашние задания ученикам, чтобы отслеживать их прогресс
                        </Typography>
                    </EmptyStateContainer>
                </StatCard>
            ) : (
                <Grid container spacing={2.5}>
                    {students.map((student) => {
                        const completed = student.checkedHomework || 0;
                        const total = student.totalHomework || 0;
                        const progressPercent = total > 0 ? (completed / total) * 100 : 0;
                        const avgGrade = student.averageGrade || 0;
                        const avgPct = Math.round(student.averagePercentage || 0);
                        const avatarColor = getAvatarColor(student.studentName);
                        const progressColor = getProgressColor(progressPercent);
                        
                        return (
                            <Grid item xs={12} md={6} key={student.studentId}>
                                <StudentCard>
                                    <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
                                        {/* Шапка: аватар + имя + звёзды */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ 
                                                    width: 52, height: 52, 
                                                    bgcolor: avatarColor,
                                                    fontSize: 20, fontWeight: 600,
                                                }}>
                                                    {getInitials(student.studentName)}
                                                </Avatar>
                                                <Box>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '17px', color: '#1F2937' }}>
                                                        {student.studentName}
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        {renderStars(avgGrade)}
                                                        <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
                                                            {avgGrade.toFixed(1)}/5
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                            <Tooltip title="Подробная статистика">
                                                <IconButton 
                                                    onClick={() => navigate(`/student-progress/${student.studentId}`)}
                                                    sx={{ 
                                                        color: '#6B7280', 
                                                        '&:hover': { color: '#4F46E5', bgcolor: '#EEF2FF' },
                                                    }}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        
                                        <Divider sx={{ mb: 2, borderColor: '#F3F4F6' }} />
                                        
                                        {/* Мини-статистика */}
                                        <Grid container spacing={1.5} sx={{ mb: 2 }}>
                                            <Grid item xs={4}>
                                                <MiniStatBox>
                                                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#4F46E5' }}>
                                                        {total}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        Заданий
                                                    </Typography>
                                                </MiniStatBox>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <MiniStatBox>
                                                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#10B981' }}>
                                                        {completed}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        Проверено
                                                    </Typography>
                                                </MiniStatBox>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <MiniStatBox>
                                                    <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#7C3AED' }}>
                                                        {avgPct}%
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        Успеваемость
                                                    </Typography>
                                                </MiniStatBox>
                                            </Grid>
                                        </Grid>
                                        
                                        {/* Прогресс-бар */}
                                        <Box>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                    Прогресс проверки
                                                </Typography>
                                                <Typography sx={{ fontSize: '12px', fontWeight: 600, color: progressColor }}>
                                                    {Math.round(progressPercent)}%
                                                </Typography>
                                            </Box>
                                            <ProgressBar>
                                                <ProgressFill width={progressPercent} sx={{ backgroundColor: progressColor }} />
                                            </ProgressBar>
                                        </Box>
                                    </CardContent>
                                </StudentCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}
        </PageContainer>
    );
}

export default TutorProgress;