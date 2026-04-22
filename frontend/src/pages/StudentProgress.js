import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Paper, Typography, Grid, Card, CardContent,
    CircularProgress, Alert, Chip, Divider,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Dialog, DialogTitle, DialogContent, LinearProgress
} from '@mui/material';
import {
    TrendingUp, TrendingDown, TrendingFlat,
    School, CheckCircle,
    Star, StarHalf, StarBorder
} from '@mui/icons-material';
import { getStudentProgressStats, getProgressTimeline } from '../services/api';

function StudentProgress() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState(null);
    const [timeline, setTimeline] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState(null);
    const [studentName, setStudentName] = useState(''); // ✅ Для хранения имени ученика

    useEffect(() => {
        fetchData();
        if (user?.role === 'tutor') {
            fetchStudentName();
        }
    }, [user]);

    const fetchStudentName = async () => {
        try {
            const studentId = window.location.pathname.split('/').pop();
            const response = await axiosInstance.get(`/students/${studentId}`);
            setStudentName(response.data.fullName);
        } catch (err) {
            console.error('Ошибка загрузки имени ученика:', err);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            // Для репетитора ID ученика берётся из URL, для ученика — из user.id
            const studentId = user?.role === 'tutor' 
                ? window.location.pathname.split('/').pop() 
                : user?.id;
            
            const [statsRes, timelineRes] = await Promise.all([
                getStudentProgressStats(studentId),
                getProgressTimeline(studentId)
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

    const getTrendIcon = (trend) => {
        if (trend === 'up') return <TrendingUp sx={{ color: '#4CAF50' }} />;
        if (trend === 'down') return <TrendingDown sx={{ color: '#F44336' }} />;
        return <TrendingFlat sx={{ color: '#FFC107' }} />;
    };

    const renderStars = (grade) => {
        const stars = [];
        const fullStars = Math.floor(grade);
        const hasHalfStar = grade % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<Star key={i} sx={{ color: '#FFD700', fontSize: 20 }} />);
        }
        if (hasHalfStar) {
            stars.push(<StarHalf key="half" sx={{ color: '#FFD700', fontSize: 20 }} />);
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<StarBorder key={i} sx={{ color: '#FFD700', fontSize: 20 }} />);
        }
        return stars;
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
            {/* ✅ ИСПРАВЛЕННЫЙ ЗАГОЛОВОК */}
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                {user?.role === 'tutor' 
                    ? `Успеваемость: ${studentName || 'Ученик'}` 
                    : 'Моя успеваемость'}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 4 }}>
                Детальная статистика прогресса и успеваемости
            </Typography>

            {/* Карточки статистики */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                        <CardContent>
                            <School sx={{ fontSize: 40, color: '#3B82F6', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                {stats?.totalHomework || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Всего заданий
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                        <CardContent>
                            <CheckCircle sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
                            <Typography variant="h4" sx={{ fontWeight: 600, color: '#4CAF50' }}>
                                {stats?.checkedHomework || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Проверено
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                        <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                {renderStars(stats?.averageGrade || 0)}
                            </Box>
                            <Typography variant="h4" sx={{ fontWeight: 600, color: '#FF9800' }}>
                                {stats?.averageGrade || 0}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Средняя оценка
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ borderRadius: 3, textAlign: 'center', py: 2 }}>
                        <CardContent>
                            {getTrendIcon(stats?.trend || 'neutral')}
                            <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                {stats?.averagePercentage || 0}%
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Средний процент
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Распределение оценок */}
            {stats?.gradeDistribution && (
                <Paper sx={{ p: 3, mb: 4, borderRadius: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                        Распределение оценок
                    </Typography>
                    <Grid container spacing={2}>
                        {Object.entries(stats.gradeDistribution).map(([grade, count]) => (
                            <Grid item xs={2.4} key={grade}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h5" sx={{ fontWeight: 600, color: '#FFD700' }}>
                                        {grade}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {count} шт.
                                    </Typography>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={Math.min(100, (count / (stats.checkedHomework || 1)) * 100)} 
                                        sx={{ mt: 1, borderRadius: 4, height: 8 }}
                                    />
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Paper>
            )}

            {/* Таймлайн прогресса */}
            <Paper sx={{ p: 3, borderRadius: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Динамика успеваемости
                </Typography>
                
                {timeline.length === 0 ? (
                    <Alert severity="info">Нет данных для отображения графика</Alert>
                ) : (
                    <Box sx={{ height: 300, position: 'relative', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: '100%' }}>
                            {timeline.slice(-12).map((point, idx) => {
                                const height = (point.score / 100) * 250;
                                return (
                                    <Box key={idx} sx={{ flex: 1, textAlign: 'center' }}>
                                        <Box 
                                            sx={{ 
                                                height: height,
                                                bgcolor: point.score >= 80 ? '#4CAF50' : 
                                                         point.score >= 60 ? '#FFC107' : '#F44336',
                                                borderRadius: '8px 8px 4px 4px',
                                                transition: 'all 0.2s',
                                                cursor: 'pointer'
                                            }}
                                        />
                                        <Typography variant="caption" sx={{ fontSize: '0.6rem', mt: 1, display: 'block' }}>
                                            {new Date(point.date).toLocaleDateString()}
                                        </Typography>
                                    </Box>
                                );
                            })}
                        </Box>
                    </Box>
                )}

                {/* Детали домашних заданий */}
                {timeline.length > 0 && (
                    <>
                        <Divider sx={{ my: 2 }} />
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                            История домашних заданий
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                        <TableCell>Дата</TableCell>
                                        <TableCell>Задание</TableCell>
                                        <TableCell align="center">Баллы</TableCell>
                                        <TableCell align="center">Оценка</TableCell>
                                        <TableCell>Статус</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {timeline.slice().reverse().map((item, idx) => (
                                        <TableRow key={idx}>
                                            <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                            <TableCell sx={{ maxWidth: 300 }}>
                                                <Typography variant="body2" noWrap>
                                                    {item.topic || 'Домашнее задание'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell align="center">
                                                {item.score || 0} / {item.maxScore || 100}
                                            </TableCell>
                                            <TableCell align="center">
                                                <Chip 
                                                    label={item.grade || '—'}
                                                    size="small"
                                                    sx={{ 
                                                        bgcolor: item.grade >= 4 ? '#4CAF5020' : 
                                                                 item.grade >= 3 ? '#FFC10720' : '#F4433620',
                                                        color: item.grade >= 4 ? '#2E7D32' : 
                                                               item.grade >= 3 ? '#ED6C02' : '#C62828',
                                                        fontWeight: 500
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={item.status === 'checked' ? 'Проверено' : 
                                                           item.status === 'submitted' ? 'На проверке' : 'Назначено'}
                                                    size="small"
                                                    color={item.status === 'checked' ? 'success' : 
                                                           item.status === 'submitted' ? 'warning' : 'default'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
                )}
            </Paper>

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
                <DialogTitle>Детали задания</DialogTitle>
                <DialogContent>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                Задание:
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                                <Typography variant="body1">
                                    {selectedHomework.task}
                                </Typography>
                            </Paper>
                            
                            {selectedHomework.feedback && (
                                <>
                                    <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                        Обратная связь:
                                    </Typography>
                                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                                        <Typography variant="body1">
                                            {selectedHomework.feedback}
                                        </Typography>
                                    </Paper>
                                </>
                            )}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Box>
    );
}

export default StudentProgress;