// ========== frontend/src/pages/Dashboard.js (ФИНАЛЬНАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, CircularProgress, Alert, Button,
    Chip, Snackbar, Avatar, Stack, Divider, TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { formatLessonTime } from '../utils/timezone';
import {
    Refresh as RefreshIcon,
    Assignment as AssignmentIcon,
    Send as SendIcon,
    Videocam as VideocamIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import EdSpaceOwl from '../components/EdSpaceOwl';
import { format, isSameDay, subDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { getLessonsByDate } from '../services/api';

// ========== СТИЛИ ==========
const PageContainer = styled(Box)({
    padding: '24px 32px',
    minHeight: '100vh',
    background: '#F8FAFC',
});

const StatCard = styled(Card)({
    borderRadius: 16,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #E2E8F0',
    transition: 'all 0.3s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
});

const HomeworkAlert = styled(Box)({
    background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
    border: '1px solid #FDE68A',
    borderRadius: 16,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
});

// Стили для мини-календаря
const TimelineItem = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'statusColor',
})(({ statusColor }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    borderRadius: 14,
    marginBottom: 8,
    background: '#FFFFFF',
    border: '1px solid #E2E8F0',
    position: 'relative',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateX(4px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
    },
    '&::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 4,
        background: statusColor || '#3B82F6',
    },
}));

const ChatContainer = styled(Paper)({
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    height: 420,
    marginTop: 24,
});

function Dashboard() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Главная'; }, []);
    
    const [loading, setLoading] = useState(true);
    const [todayLessons, setTodayLessons] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    const [unreviewedHomeworkCount, setUnreviewedHomeworkCount] = useState(0);
    const [chatMessage, setChatMessage] = useState('');
    
    // Фейковые данные чата
    const [chatStudents] = useState([
        { id: 1, name: 'Димочка Дима', lastMessage: 'Здравствуйте! А когда следующий урок?', time: '14:32', unread: 2, avatar: 'Д' },
        { id: 2, name: 'Раченкова Софья', lastMessage: 'Спасибо за урок!', time: '13:15', unread: 0, avatar: 'Р' },
        { id: 3, name: 'Мария Иванова', lastMessage: 'А можно перенести занятие?', time: '12:00', unread: 1, avatar: 'М' },
        { id: 4, name: 'Павел Сидоров', lastMessage: 'Домашку сделал ✅', time: '11:45', unread: 0, avatar: 'П' },
    ]);
    
    const [selectedChatStudent, setSelectedChatStudent] = useState(chatStudents[0]);
    const [chatMessages, setChatMessages] = useState([
        { id: 1, from: 'student', text: 'Здравствуйте! А когда следующий урок?', time: '14:30' },
        { id: 2, from: 'tutor', text: 'Добрый день! В четверг в 16:00', time: '14:31' },
        { id: 3, from: 'student', text: 'Отлично, спасибо!', time: '14:32' },
    ]);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user) { loadAllData(); }
    }, [user, selectedDate]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            const lessonsRes = await getLessonsByDate(user.id, dateStr);
            const todayLessonsData = (lessonsRes.data || []).filter(lesson => {
                if (lesson.originalLesson && (lesson.status === 'CANCELLED' || lesson.status === 'COMPLETED' || lesson.status === 'PAID')) {
                    return false;
                }
                return true;
            });
            setTodayLessons(todayLessonsData.sort((a, b) => a.startTime.localeCompare(b.startTime)));
            // Загрузка реального количества непроверенных ДЗ
            try {
                const hwRes = await axiosInstance.get(`/homework/tutor/${user.id}/unreviewed`);
                setUnreviewedHomeworkCount(hwRes.data?.length || 0);
            } catch (err) {
                setUnreviewedHomeworkCount(0);
            }
        } catch (err) {
            setTodayLessons([]);
        } finally {
            setLoading(false);
        }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return 'Доброе утро';
        if (hour >= 12 && hour < 17) return 'Добрый день';
        if (hour >= 17 && hour < 22) return 'Добрый вечер';
        return 'Доброй ночи';
    };

    const getStatusColor = (status) => {
        const colors = {
            'SCHEDULED': '#3B82F6',
            'IN_PROGRESS': '#10B981',
            'COMPLETED': '#10B981',
            'PAID': '#10B981',
            'CANCELLED': '#EF4444',
            'RESCHEDULED': '#8B5CF6',
        };
        return colors[status] || '#9CA3AF';
    };

    const getStatusLabel = (status) => {
        const labels = {
            'SCHEDULED': 'Запланировано',
            'IN_PROGRESS': 'Идёт сейчас',
            'COMPLETED': 'Проведено',
            'PAID': 'Проведено',
            'CANCELLED': 'Отменено',
            'RESCHEDULED': 'Перенесено',
        };
        return labels[status] || status;
    };

    const handleSendMessage = () => {
        if (!chatMessage.trim()) return;
        setChatMessages([...chatMessages, { 
            id: Date.now(), 
            from: 'tutor', 
            text: chatMessage, 
            time: format(new Date(), 'HH:mm') 
        }]);
        setChatMessage('');
    };

    const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
    const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
    const goToToday = () => setSelectedDate(new Date());
    const isToday = isSameDay(selectedDate, new Date());

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', gap: 2 }}>
                <EdSpaceOwl state="loading" size={180} />
                <Typography sx={{ color: '#6B7280', fontSize: '16px', fontWeight: 500 }}>
                    Загружаем...
                </Typography>
            </Box>
        </PageContainer>
    );

    const completedCount = todayLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length;
    const remainingCount = todayLessons.filter(l => l.status === 'SCHEDULED' || l.status === 'IN_PROGRESS' || l.status === 'RESCHEDULED').length;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer>
                {/* ШАПКА */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                            width: 56, height: 56, borderRadius: 4,
                            bgcolor: '#FFFFFF', border: '1px solid #E2E8F0',
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#4F46E5', lineHeight: 1 }}>
                                {format(selectedDate, 'd')}
                            </Typography>
                            <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                                {format(selectedDate, 'MMM', { locale: ru })}
                            </Typography>
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '24px', fontWeight: 800, letterSpacing: '-0.03em' }}>
                                {getGreeting()}, {user?.fullName?.split(' ')[0]}! 👋
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: '#64748B', mt: 0.5 }}>
                                {format(currentTime, 'EEEE, d MMMM • HH:mm', { locale: ru })}
                            </Typography>
                        </Box>
                    </Box>
                    <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadAllData}
                        sx={{ textTransform: 'none', borderRadius: 3, color: '#64748B', borderColor: '#E2E8F0' }}>
                        Обновить
                    </Button>
                </Box>

                {/* НЕПРОВЕРЕННЫЕ ДЗ */}
                {unreviewedHomeworkCount > 0 && (
                    <HomeworkAlert>
                        <AssignmentIcon sx={{ fontSize: 28, color: '#D97706' }} />
                        <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontWeight: 700, color: '#92400E', fontSize: '15px' }}>
                                Непроверенные домашние задания
                            </Typography>
                            <Typography sx={{ fontSize: '13px', color: '#A16207' }}>
                                {unreviewedHomeworkCount} {unreviewedHomeworkCount === 1 ? 'работа ждёт' : 'работ ждут'} проверки
                            </Typography>
                        </Box>
                        <Button variant="contained" onClick={() => window.location.href = '/extracurricular'}
                            sx={{ bgcolor: '#D97706', textTransform: 'none', borderRadius: 2, fontSize: '12px', '&:hover': { bgcolor: '#B45309' } }}>
                            Проверить →
                        </Button>
                    </HomeworkAlert>
                )}

                {/* СТАТИСТИКА */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={6} sm={3}>
                        <StatCard><CardContent>
                            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#4F46E5', lineHeight: 1 }}>{todayLessons.length}</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#64748B' }}>Уроков сегодня</Typography>
                        </CardContent></StatCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard><CardContent>
                            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#10B981', lineHeight: 1 }}>{completedCount}</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#64748B' }}>Проведено</Typography>
                        </CardContent></StatCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard><CardContent>
                            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#F59E0B', lineHeight: 1 }}>{remainingCount}</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#64748B' }}>Осталось</Typography>
                        </CardContent></StatCard>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                        <StatCard><CardContent>
                            <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#EF4444', lineHeight: 1 }}>{unreviewedHomeworkCount}</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#64748B' }}>Непроверенных ДЗ</Typography>
                        </CardContent></StatCard>
                    </Grid>
                </Grid>

                {/* МИНИ-КАЛЕНДАРЬ ДНЯ */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
                        📅 {format(selectedDate, 'd MMMM', { locale: ru })}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Button onClick={goToPreviousDay} size="small" sx={{ minWidth: 'auto', color: '#64748B' }}>←</Button>
                        <Button onClick={goToToday} size="small" variant={isToday ? "contained" : "outlined"}
                            sx={{ minWidth: 'auto', textTransform: 'none', borderRadius: 2, bgcolor: isToday ? '#4F46E5' : 'transparent', color: isToday ? '#fff' : '#64748B' }}>
                            Сегодня
                        </Button>
                        <Button onClick={goToNextDay} size="small" sx={{ minWidth: 'auto', color: '#64748B' }}>→</Button>
                    </Box>
                </Box>

                {todayLessons.length === 0 ? (
                    <Paper sx={{ borderRadius: 4, p: 5, textAlign: 'center', bgcolor: '#FFFFFF', border: '1px solid #E2E8F0' }}>
                        <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1E293B' }}>Нет занятий</Typography>
                        <Typography sx={{ fontSize: '13px', color: '#64748B' }}>На этот день ничего не запланировано</Typography>
                    </Paper>
                ) : (
                    <Box>
                        {todayLessons.map(lesson => (
                            <TimelineItem key={lesson.id} statusColor={getStatusColor(lesson.status)}>
                                <Box sx={{ minWidth: 70, textAlign: 'center' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#1E293B' }}>
                                        {formatLessonTime(lesson.lessonDate, lesson.startTime)}
                                    </Typography>
                                    <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                                        {lesson.duration || 60} мин
                                    </Typography>
                                </Box>
                                <Box sx={{ width: 1, height: 30, bgcolor: '#E2E8F0' }} />
                                <Avatar sx={{ bgcolor: getStatusColor(lesson.status), width: 36, height: 36, fontSize: 15 }}>
                                    {lesson.student?.fullName?.charAt(0) || 'У'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
                                        {lesson.student?.fullName || 'Ученик'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                                        {lesson.course?.name || 'Занятие'}
                                    </Typography>
                                </Box>
                                <Chip 
                                    label={getStatusLabel(lesson.status)} 
                                    size="small"
                                    sx={{ 
                                        fontSize: '11px', 
                                        height: 24,
                                        bgcolor: `${getStatusColor(lesson.status)}15`,
                                        color: getStatusColor(lesson.status),
                                        fontWeight: 600,
                                    }}
                                />
                            </TimelineItem>
                        ))}
                    </Box>
                )}

                {/* ЧАТ */}
                <ChatContainer>
                    {/* Список учеников */}
                    <Box sx={{ width: 280, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC', flexShrink: 0 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>💬 Чаты</Typography>
                        </Box>
                        <Box sx={{ overflow: 'auto', maxHeight: 370 }}>
                            {chatStudents.map(student => (
                                <Box 
                                    key={student.id}
                                    onClick={() => setSelectedChatStudent(student)}
                                    sx={{ 
                                        p: 2, 
                                        cursor: 'pointer', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1.5,
                                        bgcolor: selectedChatStudent?.id === student.id ? '#EEF2FF' : 'transparent',
                                        '&:hover': { bgcolor: selectedChatStudent?.id === student.id ? '#EEF2FF' : '#F1F5F9' },
                                        borderLeft: selectedChatStudent?.id === student.id ? '3px solid #4F46E5' : '3px solid transparent',
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: '#4F46E5', width: 40, height: 40, fontSize: 16 }}>
                                        {student.avatar}
                                    </Avatar>
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '14px' }}>
                                                {student.name}
                                            </Typography>
                                            <Typography sx={{ fontSize: '10px', color: '#94A3B8' }}>
                                                {student.time}
                                            </Typography>
                                        </Box>
                                        <Typography sx={{ fontSize: '12px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {student.lastMessage}
                                        </Typography>
                                    </Box>
                                    {student.unread > 0 && (
                                        <Box sx={{ 
                                            width: 20, height: 20, borderRadius: '50%', 
                                            bgcolor: '#EF4444', color: '#fff', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '11px', fontWeight: 700, flexShrink: 0,
                                        }}>
                                            {student.unread}
                                        </Box>
                                    )}
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* Окно чата */}
                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#4F46E5', width: 36, height: 36, fontSize: 15 }}>
                                {selectedChatStudent?.avatar || 'У'}
                            </Avatar>
                            <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
                                {selectedChatStudent?.name}
                            </Typography>
                        </Box>

                        <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#FFFFFF' }}>
                            {chatMessages.map(msg => (
                                <Box key={msg.id} sx={{ 
                                    display: 'flex', 
                                    justifyContent: msg.from === 'tutor' ? 'flex-end' : 'flex-start',
                                    mb: 1.5,
                                }}>
                                    <Box sx={{ 
                                        maxWidth: '70%',
                                        p: 1.5,
                                        borderRadius: 3,
                                        bgcolor: msg.from === 'tutor' ? '#4F46E5' : '#F1F5F9',
                                        color: msg.from === 'tutor' ? '#fff' : '#1E293B',
                                        fontSize: '13px',
                                    }}>
                                        {msg.text}
                                        <Typography sx={{ fontSize: '10px', opacity: 0.7, mt: 0.5 }}>
                                            {msg.time}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>

                        <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 1 }}>
                            <TextField 
                                fullWidth 
                                size="small" 
                                placeholder="Написать сообщение..." 
                                value={chatMessage}
                                onChange={(e) => setChatMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                            />
                            <Button 
                                variant="contained" 
                                onClick={handleSendMessage}
                                sx={{ bgcolor: '#4F46E5', borderRadius: 3, minWidth: 'auto', '&:hover': { bgcolor: '#3730A3' } }}
                            >
                                <SendIcon sx={{ fontSize: 20 }} />
                            </Button>
                        </Box>
                    </Box>
                </ChatContainer>

                <Snackbar open={false} autoHideDuration={4000} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
            </PageContainer>
        </LocalizationProvider>
    );
}

export default Dashboard;