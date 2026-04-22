// frontend/src/pages/TutorProgress.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Avatar, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Tooltip, LinearProgress
} from '@mui/material';
import {
    TrendingUp, TrendingDown, Visibility,
    School, Star, StarHalf, StarBorder
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

function TutorProgress() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [students, setStudents] = useState([]);

    useEffect(() => {
        fetchStudentsProgress();
    }, [user]);

    const fetchStudentsProgress = async () => {
        try {
            const response = await axiosInstance.get(`/students/tutor/${user.id}`);
            const studentsData = response.data || [];
            
            // Для каждого ученика загружаем статистику
            const studentsWithStats = await Promise.all(
                studentsData.map(async (student) => {
                    try {
                        const statsRes = await axiosInstance.get(`/progress/student/${student.id}`);
                        return {
                            ...student,
                            stats: statsRes.data || { averageGrade: 0, completedHomeworks: 0, totalHomeworks: 0 }
                        };
                    } catch (err) {
                        return {
                            ...student,
                            stats: { averageGrade: 0, completedHomeworks: 0, totalHomeworks: 0 }
                        };
                    }
                })
            );
            
            setStudents(studentsWithStats);
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
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Star key={i} sx={{ color: '#FFD700', fontSize: 18 }} />);
        }
        if (hasHalfStar) {
            stars.push(<StarHalf key="half" sx={{ color: '#FFD700', fontSize: 18 }} />);
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<StarBorder key={i} sx={{ color: '#FFD700', fontSize: 18 }} />);
        }
        return stars;
    };

    const getProgressColor = (completed, total) => {
        if (total === 0) return '#9E9E9E';
        const percent = (completed / total) * 100;
        if (percent >= 80) return '#4CAF50';
        if (percent >= 50) return '#FFC107';
        return '#F44336';
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                Успеваемость учеников
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                Сводная статистика по всем ученикам
            </Typography>

            {students.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <School sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary">
                        У вас пока нет учеников
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {students.map((student) => {
                        const stats = student.stats || {};
                        const completed = stats.completedHomeworks || 0;
                        const total = stats.totalHomeworks || 0;
                        const progressPercent = total > 0 ? (completed / total) * 100 : 0;
                        
                        return (
                            <Grid item xs={12} md={6} key={student.id}>
                                <Card sx={{ borderRadius: 3, '&:hover': { boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } }}>
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Avatar sx={{ bgcolor: '#6366F1', width: 56, height: 56 }}>
                                                    {student.fullName?.charAt(0) || 'У'}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {student.fullName}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {student.email}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            <Tooltip title="Подробная статистика">
                                                <IconButton 
                                                    color="primary"
                                                    onClick={() => navigate(`/student-progress/${student.id}`)}
                                                >
                                                    <Visibility />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                        
                                        <Divider sx={{ my: 2 }} />
                                        
                                        <Grid container spacing={2}>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#6366F1' }}>
                                                        {total}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Всего заданий
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#10B981' }}>
                                                        {completed}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Выполнено
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Box sx={{ textAlign: 'center' }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                                                        {renderStars(stats.averageGrade || 0)}
                                                    </Box>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Ср. оценка: {stats.averageGrade?.toFixed(1) || '0.0'}
                                                    </Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                        
                                        <Box sx={{ mt: 2 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                <Typography variant="caption" color="textSecondary">
                                                    Прогресс
                                                </Typography>
                                                <Typography variant="caption" fontWeight={500}>
                                                    {Math.round(progressPercent)}%
                                                </Typography>
                                            </Box>
                                            <LinearProgress 
                                                variant="determinate" 
                                                value={progressPercent}
                                                sx={{ 
                                                    borderRadius: 1, 
                                                    height: 8,
                                                    bgcolor: '#E0E0E0',
                                                    '& .MuiLinearProgress-bar': {
                                                        bgcolor: getProgressColor(completed, total)
                                                    }
                                                }}
                                            />
                                        </Box>
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                            <Chip 
                                                icon={progressPercent >= 50 ? <TrendingUp /> : <TrendingDown />}
                                                label={progressPercent >= 50 ? 'Хороший прогресс' : 'Требует внимания'}
                                                size="small"
                                                color={progressPercent >= 50 ? 'success' : 'warning'}
                                            />
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