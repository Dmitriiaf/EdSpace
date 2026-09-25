import React, { useState, useEffect } from 'react';
import {
    Box, Container, Typography, Grid, Card, CardContent, Stack,
    Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
    Table, TableHead, TableRow, TableCell, TableBody,
    IconButton, Chip, Alert, Snackbar, Tabs, Tab, FormControl,
    InputLabel, Select, MenuItem
} from '@mui/material';
import AdminSchedule from '../components/AdminSchedule';
import { styled } from '@mui/material/styles';
import {
    Add, Delete, School, Person, Refresh, Logout,
    Dashboard as DashboardIcon, Group, Groups,
    Notifications as NotificationsIcon
} from '@mui/icons-material';
import axios from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import Finance from './Finance';
import { useNavigate } from 'react-router-dom';

const PRIMARY = '#4F46E5';
const TEXT = '#1E293B';
const TEXT_DIM = '#64748B';
const BORDER = '#E2E8F0';

const StyledCard = styled(Card)({
    borderRadius: 20,
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    border: `1px solid ${BORDER}`,
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 8px 30px rgba(79,70,229,0.12)',
        transform: 'translateY(-2px)',
    },
});

const AdminDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [tab, setTab] = useState(0);
    const [tutors, setTutors] = useState([]);
    const [students, setStudents] = useState([]);
    const [stats, setStats] = useState({ tutors: 0, students: 0, lessons: 0 });
    const [lessons, setLessons] = useState([]);
    const [lessonDialog, setLessonDialog] = useState(false);
    const [lessonForm, setLessonForm] = useState({ studentId: '', tutorId: '', lessonDate: '', startTime: '10:00', endTime: '11:00' });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [selectedTutorId, setSelectedTutorId] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [activeNotification, setActiveNotification] = useState(null);
    const [lessonsFilter, setLessonsFilter] = useState('all');
    // Новое состояние: 'tabs' — обычные вкладки, 'tutor-schedule' — расписание выбранного репетитора
    const [view, setView] = useState('tabs');
    // Форма репетитора
    const [tutorDialog, setTutorDialog] = useState(false);
    const [tutorForm, setTutorForm] = useState({ fullName: '', email: '', phone: '', subjects: '' });
    // Форма ученика
    const [studentDialog, setStudentDialog] = useState(false);
    const [studentForm, setStudentForm] = useState({ fullName: '', email: '', phone: '', grade: '' });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [statsRes, tutorsRes, studentsRes, lessonsRes, notifRes] = await Promise.all([
                axios.get('/admin/stats'),
                axios.get('/admin/tutors'),
                axios.get('/admin/students'),
                axios.get('/admin/lessons'),
                axios.get('/admin/notifications')
            ]);
            setStats(statsRes.data);
            setTutors(tutorsRes.data);
            setStudents(studentsRes.data);
            setLessons(lessonsRes.data);
            setNotifications(notifRes.data || []);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    };

    const handleCreateTutor = async () => {
        try {
            await axios.post('/admin/tutors', tutorForm);
            setTutorDialog(false);
            setTutorForm({ fullName: '', email: '', phone: '', subjects: '' });
            setSnackbar({ open: true, message: 'Репетитор создан! Письмо с доступами отправлено.', severity: 'success' });
            loadData();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.error || 'Ошибка создания', severity: 'error' });
        }
    };

    const handleCreateStudent = async () => {
        try {
            await axios.post('/admin/students', studentForm);
            setStudentDialog(false);
            setStudentForm({ fullName: '', email: '', phone: '', grade: '' });
            setSnackbar({ open: true, message: 'Ученик создан!', severity: 'success' });
            loadData();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.error || 'Ошибка создания', severity: 'error' });
        }
    };

    const handleCreateLesson = async () => {
        try {
            await axios.post('/admin/lessons', lessonForm);
            setLessonDialog(false);
            setLessonForm({ studentId: '', tutorId: '', lessonDate: '', startTime: '10:00', endTime: '11:00' });
            setSnackbar({ open: true, message: 'Урок создан!', severity: 'success' });
            loadData();
        } catch (error) {
            setSnackbar({ open: true, message: error.response?.data?.error || 'Ошибка создания', severity: 'error' });
        }
    };

    const handleStatusChange = async (lessonId, newStatus) => {
        try {
            await axios.patch(`/admin/lessons/${lessonId}/status`, { status: newStatus });
            setSnackbar({ open: true, message: 'Статус обновлён', severity: 'success' });
            loadData();
        } catch (error) {
            setSnackbar({ open: true, message: 'Ошибка', severity: 'error' });
        }
    };

    const handleDeleteTutor = async (id) => {
        if (window.confirm('Удалить репетитора?')) {
            await axios.delete(`/admin/tutors/${id}`);
            loadData();
        }
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm('Удалить ученика?')) {
            await axios.delete(`/admin/students/${id}`);
            loadData();
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const getFilteredLessons = () => {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);

        return lessons.filter(l => {
            const lessonDate = new Date(l.lessonDate);
            if (lessonsFilter === 'week') return lessonDate >= weekAgo;
            if (lessonsFilter === 'month') return lessonDate >= monthAgo;
            return true;
        });
    };

    const inputStyle = {
        '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            '& fieldset': { borderColor: BORDER },
            '&:hover fieldset': { borderColor: PRIMARY },
            '&.Mui-focused fieldset': { borderColor: PRIMARY, borderWidth: 1.5 },
        },
        '& .MuiInputBase-input': { color: TEXT },
        '& .MuiInputLabel-root': { color: TEXT_DIM },
    };

    return (
        <Box sx={{ bgcolor: '#F8FAFC', minHeight: '100vh' }}>
            {/* HEADER */}
            <Box sx={{ bgcolor: '#FFFFFF', borderBottom: `1px solid ${BORDER}`, py: 2, px: 3, mb: 4 }}>
                <Container maxWidth="lg">
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{
                                width: 42, height: 42, borderRadius: '12px',
                                bgcolor: PRIMARY, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <DashboardIcon sx={{ color: '#fff' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: TEXT }}>
                                    Панель администратора
                                </Typography>
                                <Typography sx={{ color: TEXT_DIM, fontSize: '0.85rem' }}>
                                    EdSpace School
                                </Typography>
                            </Box>
                        </Stack>
                        <Button onClick={handleLogout} startIcon={<Logout />} sx={{ color: TEXT_DIM, textTransform: 'none' }}>
                            Выйти
                        </Button>
                    </Stack>
                </Container>
            </Box>

            <Container maxWidth="lg">
                {/* СТАТИСТИКА */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 50, height: 50, borderRadius: '14px', bgcolor: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <School sx={{ color: PRIMARY }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: TEXT }}>
                                            {stats.tutors}
                                        </Typography>
                                        <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>Репетиторов</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 50, height: 50, borderRadius: '14px', bgcolor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Groups sx={{ color: '#F59E0B' }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: TEXT }}>
                                            {stats.students}
                                        </Typography>
                                        <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>Учеников</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <StyledCard onClick={() => setShowNotifications(!showNotifications)} sx={{ cursor: 'pointer' }}>
                            <CardContent>
                                <Stack direction="row" spacing={2} alignItems="center">
                                    <Box sx={{ width: 50, height: 50, borderRadius: '14px', bgcolor: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <NotificationsIcon sx={{ color: '#EF4444' }} />
                                    </Box>
                                    <Box>
                                        <Typography sx={{ fontSize: '1.8rem', fontWeight: 800, color: TEXT }}>
                                            {notifications.length}
                                        </Typography>
                                        <Typography sx={{ color: TEXT_DIM, fontSize: '0.9rem' }}>Уведомлений</Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </StyledCard>
                    </Grid>
                </Grid>

                {showNotifications && notifications.length > 0 && (
                    <StyledCard sx={{ mb: 3, p: 2 }}>
                        <Typography sx={{ fontWeight: 700, mb: 2 }}>🔔 Уведомления</Typography>
                        {notifications.map(n => (
                            <Box key={n.id} sx={{ p: 1.5, borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: n.read ? '#9CA3AF' : '#EF4444', flexShrink: 0 }} />
                                <Box sx={{ flex: 1, minWidth: 200 }}>
                                    <Typography sx={{ fontSize: '14px' }}>{n.message}</Typography>
                                    <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>{n.createdAt}</Typography>
                                </Box>
                                {!n.read && (
                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <Button size="small" variant="contained"
                                            onClick={() => {
                                                const match = n.message.match(/урока (\d+)/);
                                                if (match) {
                                                    const lessonId = parseInt(match[1]);
                                                    setActiveNotification(n);
                                                    setShowNotifications(false);
                                                    const lesson = lessons.find(l => l.id === lessonId);
                                                    if (lesson) {
                                                        const tutor = tutors.find(t => t.fullName === lesson.tutorName);
                                                        if (tutor) {
                                                            setSelectedTutorId(tutor.id);
                                                            setView('tutor-schedule');
                                                        }
                                                    }
                                                }
                                            }}
                                            sx={{ textTransform: 'none', fontSize: '11px' }}>
                                            Рассмотреть
                                        </Button>
                                        <Button size="small" color="error"
                                            onClick={async () => {
                                                await axios.patch(`/admin/notifications/${n.id}/read`);
                                                loadData();
                                            }}
                                            sx={{ textTransform: 'none', fontSize: '11px' }}>
                                            Отклонить
                                        </Button>
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </StyledCard>
                )}

                {/* TABS — показываем только когда view === 'tabs' */}
                {view === 'tabs' && (
                    <Tabs value={tab} onChange={(e, v) => setTab(v)} sx={{ mb: 3 }}>
                        <Tab label="Репетиторы" />
                        <Tab label="Ученики" />
                        <Tab label="Расписание" />
                        <Tab label="Финансы" />
                    </Tabs>
                )}

                {/* РЕПЕТИТОРЫ */}
                {view === 'tabs' && tab === 0 && (
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: TEXT }}>
                                Все репетиторы ({tutors.length})
                            </Typography>
                            <Button variant="contained" startIcon={<Add />} onClick={() => setTutorDialog(true)}
                                sx={{ bgcolor: PRIMARY, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#3730A3' } }}>
                                Добавить репетитора
                            </Button>
                        </Stack>

                        <StyledCard>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Имя</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Телефон</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Предметы</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tutors.map(t => (
                                        <TableRow key={t.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                                            <TableCell sx={{ color: TEXT, fontWeight: 600 }}>{t.fullName}</TableCell>
                                            <TableCell sx={{ color: TEXT_DIM }}>{t.email}</TableCell>
                                            <TableCell sx={{ color: TEXT_DIM }}>{t.phone || '—'}</TableCell>
                                            <TableCell>
                                                {t.subjects ? (
                                                    <Chip label={t.subjects} size="small" sx={{ bgcolor: '#EEF2FF', color: PRIMARY }} />
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleDeleteTutor(t.id)} sx={{ color: '#EF4444' }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </StyledCard>
                    </Box>
                )}

                {/* УЧЕНИКИ */}
                {view === 'tabs' && tab === 1 && (
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: TEXT }}>
                                Все ученики ({students.length})
                            </Typography>
                            <Button variant="contained" startIcon={<Add />} onClick={() => setStudentDialog(true)}
                                sx={{ bgcolor: PRIMARY, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#3730A3' } }}>
                                Добавить ученика
                            </Button>
                        </Stack>

                        <StyledCard>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Имя</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Email</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Телефон</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Класс</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Репетитор</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Ставка</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {students.map(s => (
                                        <TableRow key={s.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                                            <TableCell sx={{ color: TEXT, fontWeight: 600 }}>{s.fullName}</TableCell>
                                            <TableCell sx={{ color: TEXT_DIM }}>{s.email || '—'}</TableCell>
                                            <TableCell sx={{ color: TEXT_DIM }}>{s.phone || '—'}</TableCell>
                                            <TableCell>
                                                {s.grade ? (
                                                    <Chip label={`${s.grade} класс`} size="small" sx={{ bgcolor: '#FEF3C7', color: '#D97706' }} />
                                                ) : '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={s.tutorId || ''}
                                                    size="small"
                                                    onChange={async (e) => {
                                                        const tutorId = e.target.value;
                                                        if (tutorId) {
                                                            try {
                                                                await axios.post(`/admin/students/${s.id}/assign-tutor`, { tutorId: parseInt(tutorId) });
                                                                setSnackbar({ open: true, message: 'Репетитор назначен', severity: 'success' });
                                                                loadData();
                                                            } catch (error) {
                                                                setSnackbar({ open: true, message: 'Ошибка', severity: 'error' });
                                                            }
                                                        }
                                                    }}
                                                    sx={{ fontSize: '12px', minWidth: 150 }}
                                                >
                                                    <MenuItem value="">Не назначен</MenuItem>
                                                    {tutors.filter(t => t.id !== user?.id).map(t => (
                                                        <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>
                                                    ))}
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    defaultValue={s.ratePerLesson ?? ''}
                                                    placeholder="—"
                                                    onBlur={async (e) => {
                                                        const newRate = e.target.value;
                                                        if (newRate === '' || newRate === null) return;
                                                        if (parseFloat(newRate) === parseFloat(s.ratePerLesson)) return;
                                                        try {
                                                            await axios.put(`/admin/students/${s.id}/rate`, {
                                                                ratePerLesson: parseFloat(newRate),
                                                                tutorId: s.tutorId
                                                            });
                                                            setSnackbar({ open: true, message: '✅ Ставка обновлена', severity: 'success' });
                                                            loadData();
                                                        } catch (error) {
                                                            setSnackbar({
                                                                open: true,
                                                                message: error.response?.data?.error || 'Ошибка сохранения ставки',
                                                                severity: 'error'
                                                            });
                                                        }
                                                    }}
                                                    onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
                                                    sx={{
                                                        width: 110,
                                                        '& .MuiOutlinedInput-root': {
                                                            borderRadius: 2,
                                                            '& fieldset': { borderColor: BORDER },
                                                            '&:hover fieldset': { borderColor: PRIMARY },
                                                            '&.Mui-focused fieldset': { borderColor: PRIMARY },
                                                        },
                                                        '& input': { fontSize: '13px', color: TEXT, textAlign: 'right', padding: '8px 4px' },
                                                    }}
                                                    InputProps={{
                                                        endAdornment: (
                                                            <Typography sx={{ fontSize: '12px', color: TEXT_DIM, ml: 0.5 }}>₽</Typography>
                                                        ),
                                                    }}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <IconButton size="small" onClick={() => handleDeleteStudent(s.id)} sx={{ color: '#EF4444' }}>
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </StyledCard>
                    </Box>
                )}

                {/* РАСПИСАНИЕ - ТАБЛИЦА РЕПЕТИТОРОВ */}
                {view === 'tabs' && tab === 2 && (
                    <Box>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: TEXT }}>
                                Репетиторы и расписание
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button size="small" variant={lessonsFilter === 'all' ? "contained" : "outlined"}
                                    onClick={() => setLessonsFilter('all')}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '12px' }}>Все</Button>
                                <Button size="small" variant={lessonsFilter === 'week' ? "contained" : "outlined"}
                                    onClick={() => setLessonsFilter('week')}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '12px' }}>Неделя</Button>
                                <Button size="small" variant={lessonsFilter === 'month' ? "contained" : "outlined"}
                                    onClick={() => setLessonsFilter('month')}
                                    sx={{ textTransform: 'none', borderRadius: 2, fontSize: '12px' }}>Месяц</Button>
                            </Box>
                        </Stack>

                        <StyledCard>
                            <Table>
                                <TableHead>
                                    <TableRow sx={{ bgcolor: '#F8FAFC' }}>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Репетитор</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Предметы</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Учеников</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Уроков сегодня</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Всего уроков</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Занятость</TableCell>
                                        <TableCell sx={{ fontWeight: 700, color: TEXT_DIM }}>Действия</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {tutors.filter(t => t.id !== user?.id).map(tutor => {
                                        const tutorLessons = getFilteredLessons().filter(l => l.tutorName === tutor.fullName);
                                        const todayLessons = tutorLessons.filter(l => l.lessonDate === new Date().toISOString().split('T')[0]);
                                        const activeLessons = tutorLessons.filter(l => l.status === 'SCHEDULED');
                                        // Занятость: активные уроки / 20 (5 дней * 4 слота)
                                        const occupancy = Math.round((activeLessons.length / 20) * 100);
                                        const tutorStudents = tutor.studentCount || 0;
                                        return (
                                            <TableRow key={tutor.id} sx={{ '&:hover': { bgcolor: '#F8FAFC' } }}>
                                                <TableCell sx={{ fontWeight: 600 }}>{tutor.fullName}</TableCell>
                                                <TableCell>
                                                    <Chip label={tutor.subjects || '—'} size="small" sx={{ bgcolor: '#EEF2FF', color: PRIMARY }} />
                                                </TableCell>
                                                <TableCell>{tutorStudents}</TableCell>
                                                <TableCell>
                                                    <Chip label={todayLessons.length} size="small" color={todayLessons.length > 0 ? 'success' : 'default'} />
                                                </TableCell>
                                                <TableCell>{tutorLessons.length}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={`${occupancy}%`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: occupancy > 80 ? '#FEE2E2' : occupancy > 50 ? '#FEF3C7' : '#D1FAE5',
                                                            color: occupancy > 80 ? '#991B1B' : occupancy > 50 ? '#92400E' : '#065F46'
                                                        }}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={() => {
                                                            setSelectedTutorId(tutor.id);
                                                            setView('tutor-schedule');
                                                        }}
                                                        sx={{ textTransform: 'none', borderRadius: 2, fontSize: '12px' }}
                                                    >
                                                        📅 Расписание
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </StyledCard>
                    </Box>
                )}

                {/* РАСПИСАНИЕ ВЫБРАННОГО РЕПЕТИТОРА — открывается поверх вкладок */}
                {view === 'tutor-schedule' && selectedTutorId && (() => {
                    const selectedTutor = tutors.find(t => t.id === selectedTutorId);
                    const tutorLessons = getFilteredLessons().filter(l => l.tutorName === selectedTutor?.fullName);
                    const tutorStudents = students.filter(s => s.tutorName === selectedTutor?.fullName);

                    return (
                        <Box>
                            {activeNotification && (
                                <Alert severity="info" sx={{ mb: 2 }}>
                                    <Typography sx={{ fontWeight: 700 }}>📩 Активный запрос:</Typography>
                                    <Typography sx={{ fontSize: '14px' }}>{activeNotification.message}</Typography>
                                    <Button size="small" onClick={() => setActiveNotification(null)} sx={{ mt: 1 }}>Закрыть</Button>
                                </Alert>
                            )}
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                                <Button onClick={() => { setView('tabs'); setSelectedTutorId(null); }} sx={{ textTransform: 'none', color: TEXT_DIM }}>
                                    ← Назад
                                </Button>
                            </Stack>
                            <AdminSchedule
                                tutorId={selectedTutorId}
                                tutorName={selectedTutor?.fullName}
                                tutorStudents={tutorStudents}
                                allStudents={students}
                                lessons={tutorLessons}
                                onRefresh={loadData}
                                onShowSnackbar={(msg, sev) => setSnackbar({ open: true, message: msg, severity: sev })}
                            />
                        </Box>
                    );
                })()}

                {/* ФИНАНСЫ ШКОЛЫ */}
                {view === 'tabs' && tab === 3 && (
                    <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '1.1rem', color: TEXT, mb: 2 }}>
                            💰 Финансы школы
                        </Typography>
                        <Finance tutorIdOverride={22} />
                    </Box>
                )}

                {/* ДИАЛОГ УРОКА */}
                <Dialog open={lessonDialog} onClose={() => setLessonDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>Создать урок</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2.5} sx={{ mt: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Ученик</InputLabel>
                                <Select value={lessonForm.studentId} onChange={(e) => setLessonForm({ ...lessonForm, studentId: e.target.value })} label="Ученик">
                                    {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel>Репетитор</InputLabel>
                                <Select value={lessonForm.tutorId} onChange={(e) => setLessonForm({ ...lessonForm, tutorId: e.target.value })} label="Репетитор">
                                    {tutors.filter(t => t.id !== user?.id).map(t => <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Дата" type="date" value={lessonForm.lessonDate}
                                onChange={(e) => setLessonForm({ ...lessonForm, lessonDate: e.target.value })}
                                InputLabelProps={{ shrink: true }} />
                            <TextField fullWidth label="Время начала" type="time" value={lessonForm.startTime}
                                onChange={(e) => setLessonForm({ ...lessonForm, startTime: e.target.value })}
                                InputLabelProps={{ shrink: true }} />
                            <TextField fullWidth label="Время окончания" type="time" value={lessonForm.endTime}
                                onChange={(e) => setLessonForm({ ...lessonForm, endTime: e.target.value })}
                                InputLabelProps={{ shrink: true }} />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setLessonDialog(false)}>Отмена</Button>
                        <Button variant="contained" onClick={handleCreateLesson} sx={{ bgcolor: PRIMARY }}>Создать</Button>
                    </DialogActions>
                </Dialog>
            </Container>

            {/* ДИАЛОГ РЕПЕТИТОРА */}
            <Dialog open={tutorDialog} onClose={() => setTutorDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Добавить репетитора</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField fullWidth label="ФИО" value={tutorForm.fullName}
                            onChange={(e) => setTutorForm({ ...tutorForm, fullName: e.target.value })}
                            sx={inputStyle} />
                        <TextField fullWidth label="Email" type="email" value={tutorForm.email}
                            onChange={(e) => setTutorForm({ ...tutorForm, email: e.target.value })}
                            sx={inputStyle} />
                        <TextField fullWidth label="Телефон" value={tutorForm.phone}
                            onChange={(e) => setTutorForm({ ...tutorForm, phone: e.target.value })}
                            sx={inputStyle} />
                        <TextField fullWidth label="Предметы (через запятую)" value={tutorForm.subjects}
                            onChange={(e) => setTutorForm({ ...tutorForm, subjects: e.target.value })}
                            placeholder="Математика, Физика"
                            sx={inputStyle} />
                        <Button variant="contained" fullWidth onClick={handleCreateTutor}
                            sx={{ bgcolor: PRIMARY, textTransform: 'none', borderRadius: 2, py: 1.5, '&:hover': { bgcolor: '#3730A3' } }}>
                            Создать репетитора
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* ДИАЛОГ УЧЕНИКА */}
            <Dialog open={studentDialog} onClose={() => setStudentDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Добавить ученика</DialogTitle>
                <DialogContent>
                    <Stack spacing={2.5} sx={{ mt: 1 }}>
                        <TextField fullWidth label="ФИО" value={studentForm.fullName}
                            onChange={(e) => setStudentForm({ ...studentForm, fullName: e.target.value })}
                            sx={inputStyle} />
                        <TextField fullWidth label="Email" type="email" value={studentForm.email}
                            onChange={(e) => setStudentForm({ ...studentForm, email: e.target.value })}
                            sx={inputStyle} />
                        <TextField fullWidth label="Телефон" value={studentForm.phone}
                            onChange={(e) => setStudentForm({ ...studentForm, phone: e.target.value })}
                            sx={inputStyle} />
                        <TextField fullWidth label="Класс" value={studentForm.grade}
                            onChange={(e) => setStudentForm({ ...studentForm, grade: e.target.value })}
                            placeholder="Например: 7"
                            sx={inputStyle} />
                        <Button variant="contained" fullWidth onClick={handleCreateStudent}
                            sx={{ bgcolor: PRIMARY, textTransform: 'none', borderRadius: 2, py: 1.5, '&:hover': { bgcolor: '#3730A3' } }}>
                            Создать ученика
                        </Button>
                    </Stack>
                </DialogContent>
            </Dialog>

            {/* SNACKBAR */}
            <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: 3, width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default AdminDashboard;