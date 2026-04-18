// ========== frontend/src/pages/Students.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ С DRAG-AND-DROP) ==========
import React, { useState, useEffect } from 'react';
// ✅ Правильный импорт
import axiosInstance, { getAllLessons } from '../services/api';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, Paper, IconButton, Alert, Snackbar,
    Chip, Typography,
    FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Avatar, Tooltip, InputAdornment,
    Card, CardContent, Grid,
    Badge, Divider, LinearProgress, CardActions,
    Collapse
} from '@mui/material';
import { 
    Add, Edit, Delete, PersonAdd, Search, 
    Phone, Email, 
    School, AttachMoney,
    CheckCircle, Cake, Schedule,
    ExpandMore, ExpandLess, TrendingUp,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

function Students() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [openDialog, setOpenDialog] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const [editingStudent, setEditingStudent] = useState(null);
    const [checkingEmail, setCheckingEmail] = useState(false);
    const [existingStudent, setExistingStudent] = useState(null);
    const [showExistingDialog, setShowExistingDialog] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [allLessons, setAllLessons] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    
    const [formData, setFormData] = useState({
        fullName: '', 
        email: '', 
        ratePerLesson: '', 
        paymentType: 'single', 
        parentEmail: '',
        tutorId: user?.id
    });

    const [stats, setStats] = useState({ total: 0, subscription: 0, single: 0, withParent: 0 });

    const getStudentRate = (student) => {
        return getStudentRateForTutor(student, user?.id);
    };

    const getBirthdayText = (date) => {
        if (!date) return null;
        const today = new Date();
        const birthday = new Date(date);
        const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
        if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
        if (daysUntil === 0) return '🎂 Сегодня!';
        if (daysUntil === 1) return '🎂 Завтра!';
        if (daysUntil <= 7) return `🎂 Через ${daysUntil} дн.`;
        return null;
    };

    useEffect(() => { if (user) { fetchStudents(); fetchAllLessons(); fetchSubscriptions(); } }, [user]);
    useEffect(() => { calculateStats(); }, [students]);

    const fetchStudents = async () => {
        try {
            const response = await axiosInstance.get(`/students/tutor/${user.id}`);
            setStudents(response.data);
            setError(null);
        } catch (err) { setError('Не удалось загрузить учеников'); } finally { setLoading(false); }
    };

    const fetchAllLessons = async () => {
        try {
            const lessonsRes = await getAllLessons(user.id);
            setAllLessons(lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes);
        } catch (err) {
            console.error('Ошибка загрузки занятий:', err);
        }
    };

    const fetchSubscriptions = async () => {
        try {
            const response = await axiosInstance.get(`/subscriptions/tutor/${user.id}`);
            setSubscriptions(response.data);
        } catch (err) {}
    };

    const calculateStats = () => {
        const total = students.length;
        const subscription = students.filter(s => s.paymentType === 'subscription').length;
        const single = students.filter(s => s.paymentType === 'single').length;
        const withParent = students.filter(s => s.parent).length;
        setStats({ total, subscription, single, withParent });
    };

    const getStudentStats = (studentEmail) => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const studentLessons = allLessons.filter(l => l.student?.email === studentEmail);
        const monthLessons = studentLessons.filter(l => {
            const lessonDate = new Date(l.lessonDate);
            return lessonDate.getFullYear() === currentYear && lessonDate.getMonth() === currentMonth;
        });
        const total = monthLessons.length;
        const completed = monthLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length;
        const upcoming = monthLessons.filter(l => { const lessonDate = new Date(l.lessonDate); return lessonDate >= now && l.status === 'SCHEDULED'; }).length;
        return { total, completed, upcoming };
    };

    const getNextLesson = (studentEmail) => {
        const now = new Date();
        const studentLessons = allLessons.filter(l => l.student?.email === studentEmail);
        const upcoming = studentLessons.filter(l => {
            const lessonDate = new Date(l.lessonDate);
            return (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') && lessonDate >= now;
        }).sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate));
        return upcoming.length > 0 ? upcoming[0] : null;
    };

    const getSubscriptionProgress = (studentId) => {
        const studentSub = subscriptions.find(s => s.student?.id === studentId && s.status === 'active');
        if (!studentSub) return null;
        const used = studentSub.lessonsUsed || 0;
        const total = studentSub.lessonsCount;
        const percent = total > 0 ? (used / total) * 100 : 0;
        const debt = studentSub.debtLessons || 0;
        return { used, total, percent, debt };
    };

    const getUpcomingBirthdays = () => {
        const today = new Date();
        return students.filter(s => s.birthday).map(s => {
            const birthday = new Date(s.birthday);
            const nextBirthday = new Date(today.getFullYear(), birthday.getMonth(), birthday.getDate());
            if (nextBirthday < today) nextBirthday.setFullYear(today.getFullYear() + 1);
            const daysUntil = Math.ceil((nextBirthday - today) / (1000 * 60 * 60 * 24));
            return { ...s, daysUntil, nextBirthday };
        }).filter(s => s.daysUntil <= 30).sort((a, b) => a.daysUntil - b.daysUntil);
    };

    const checkExistingStudent = async (email) => {
        if (!email) return;
        setCheckingEmail(true);
        try {
            const response = await axiosInstance.get(`/students/search-by-email?email=${email}`);
            
            const data = response.data;
            console.log('Search response:', data);
            
            if (data && data.exists === true) {
                if (data.alreadyLinked) {
                    showSnackbar(`Ученик ${data.fullName} уже привязан к вам`, 'warning');
                    setExistingStudent(null);
                    setShowExistingDialog(false);
                } else {
                    setExistingStudent(data);
                    setShowExistingDialog(true);
                }
            } else {
                setExistingStudent(null);
                setShowExistingDialog(false);
            }
        } catch (err) {
            console.log('Search error:', err);
            setExistingStudent(null);
            setShowExistingDialog(false);
        } finally {
            setCheckingEmail(false);
        }
    };

    const handleEmailBlur = async () => { 
        if (formData.email && !editingStudent) {
            await checkExistingStudent(formData.email);
        }
    };

    const handleUseExistingStudent = () => {
        if (existingStudent) {
            setFormData({
                fullName: existingStudent.fullName, 
                email: existingStudent.email, 
                ratePerLesson: '',
                paymentType: existingStudent.paymentType || 'single', 
                parentEmail: existingStudent.parent?.email || '',
                tutorId: user.id
            });
            setShowExistingDialog(false);
            setExistingStudent(null);
        }
    };

    const handleOpenDialog = (student = null) => {
        if (student) {
            setEditingStudent(student);
            setFormData({
                fullName: student.fullName, 
                email: student.email || '', 
                ratePerLesson: getStudentRate(student) || '',
                paymentType: student.paymentType || 'single', 
                parentEmail: student.parent?.email || '',
                tutorId: user.id
            });
        } else {
            setEditingStudent(null);
            setFormData({ 
                fullName: '', 
                email: '', 
                ratePerLesson: '', 
                paymentType: 'single', 
                parentEmail: '', 
                tutorId: user.id 
            });
            setExistingStudent(null);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => { 
        setOpenDialog(false); 
        setEditingStudent(null); 
        setExistingStudent(null); 
        setShowExistingDialog(false); 
    };

    const handleInputChange = (e) => { 
        setFormData({ ...formData, [e.target.name]: e.target.value }); 
    };

    const handleSubmit = async () => {
        try {
            const requestData = {
                fullName: formData.fullName, 
                email: formData.email,
                ratePerLesson: formData.ratePerLesson ? parseFloat(formData.ratePerLesson) : null,
                paymentType: formData.paymentType, 
                parentEmail: formData.parentEmail || null,
                tutorId: user.id
            };
            
            if (editingStudent) {
                await axiosInstance.put(`/students/${editingStudent.id}`, requestData);
                showSnackbar('Ученик обновлён', 'success');
            } else {
                await axiosInstance.post('/students', requestData);
                showSnackbar('📧 Приглашение отправлено ученику на email', 'success');
            }
            handleCloseDialog();
            await fetchStudents();
            await fetchAllLessons();
            await fetchSubscriptions();
        } catch (err) { 
            showSnackbar(err.response?.data?.error || 'Ошибка при сохранении', 'error'); 
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Вы уверены, что хотите удалить ученика?')) {
            try {
                await axiosInstance.delete(`/students/${id}`);
                showSnackbar('Ученик удалён', 'success');
                fetchStudents(); fetchAllLessons(); fetchSubscriptions();
            } catch (err) { showSnackbar('Ошибка при удалении ученика', 'error'); }
        }
    };

    const showSnackbar = (message, severity) => { 
        setSnackbar({ open: true, message, severity }); 
    };

    const getPaymentTypeLabel = (type) => type === 'subscription' ? 'Абонемент' : 'Поурочно';
    const getPaymentTypeColor = (type) => type === 'subscription' ? 'primary' : 'default';
    const handleExpandClick = (id) => { setExpandedId(expandedId === id ? null : id); };

    const filteredStudents = students.filter(student => {
        const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            student.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'all' || student.paymentType === filterType;
        return matchesSearch && matchesFilter;
    });

    const upcomingBirthdays = getUpcomingBirthdays();

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>;

    return (
        <Box sx={{ 
            minHeight: '100vh',
            background: '#FFFFFF',
            position: 'relative',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 40% 40%, rgba(16, 185, 129, 0.02) 0%, transparent 40%)',
                pointerEvents: 'none',
                zIndex: 0
            }
        }}>
            <Box sx={{ position: 'relative', zIndex: 1, p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>Мои ученики</Typography>
                <Typography variant="body2" color="textSecondary">Управление списком учеников и их данными</Typography>
            </Box>

            {upcomingBirthdays.length > 0 && (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#FFF8E7', border: '1px solid #FFE0B5' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}><Cake sx={{ color: '#F4B942' }} /><Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#B45F06' }}>Ближайшие дни рождения</Typography></Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                        {upcomingBirthdays.map(student => (
                            <Chip key={student.id} avatar={<Avatar sx={{ bgcolor: '#F4B942' }}>{student.fullName?.charAt(0)}</Avatar>} label={`${student.fullName} — ${getBirthdayText(student.birthday)}`} variant="outlined" sx={{ bgcolor: 'white', borderColor: '#FFE0B5', '&:hover': { bgcolor: '#FFF4E5' } }} />
                        ))}
                    </Box>
                </Paper>
            )}

            <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}><Typography variant="h4" sx={{ fontWeight: 600, color: '#6366F1' }}>{stats.total}</Typography><Typography variant="caption" color="textSecondary">Всего учеников</Typography></CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}><Typography variant="h4" sx={{ fontWeight: 600, color: '#10B981' }}>{stats.subscription}</Typography><Typography variant="caption" color="textSecondary">Абонемент</Typography></CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}><Typography variant="h4" sx={{ fontWeight: 600, color: '#F59E0B' }}>{stats.single}</Typography><Typography variant="caption" color="textSecondary">Поурочно</Typography></CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', border: '1px solid #F3F4F6' }}>
                        <CardContent sx={{ textAlign: 'center', py: 2 }}><Typography variant="h4" sx={{ fontWeight: 600, color: '#8B5CF6' }}>{stats.withParent}</Typography><Typography variant="caption" color="textSecondary">С родителем</Typography></CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <TextField placeholder="Поиск по имени или email..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ width: { xs: '100%', sm: 300 } }} InputProps={{ startAdornment: <InputAdornment position="start"><Search sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }} />
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip label="Все" onClick={() => setFilterType('all')} color={filterType === 'all' ? 'primary' : 'default'} variant={filterType === 'all' ? 'filled' : 'outlined'} />
                    <Chip label="Абонемент" onClick={() => setFilterType('subscription')} color={filterType === 'subscription' ? 'primary' : 'default'} variant={filterType === 'subscription' ? 'filled' : 'outlined'} />
                    <Chip label="Поурочно" onClick={() => setFilterType('single')} color={filterType === 'single' ? 'primary' : 'default'} variant={filterType === 'single' ? 'filled' : 'outlined'} />
                </Box>
                <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 500, bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}>Добавить ученика</Button>
            </Box>

            {error ? <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert> : filteredStudents.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3, border: '1px solid #F3F4F6' }}>
                    <PersonAdd sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>{searchTerm ? 'Ничего не найдено' : 'У вас пока нет учеников'}</Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>{searchTerm ? 'Попробуйте изменить поисковый запрос' : 'Нажмите "Добавить ученика" чтобы создать первого'}</Typography>
                    {!searchTerm && <Button variant="outlined" startIcon={<Add />} onClick={() => handleOpenDialog()}>Добавить ученика</Button>}
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredStudents.map((student) => {
                        const stats = getStudentStats(student.email);
                        const nextLesson = getNextLesson(student.email);
                        const birthdayText = getBirthdayText(student.birthday);
                        const subscriptionProgress = getSubscriptionProgress(student.id);
                        const isExpanded = expandedId === student.id;
                        const studentRate = getStudentRate(student);
                        
                        return (
                            <Grid item xs={12} sm={6} md={4} key={student.id}>
                                <Card sx={{ borderRadius: 3, position: 'relative', overflow: 'visible', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', transition: 'all 0.15s', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.08)', borderColor: '#6366F1' } }}>
                                    {birthdayText && <Box sx={{ position: 'absolute', top: -10, right: 12, bgcolor: '#F4B942', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: '0.7rem', fontWeight: 500, zIndex: 1, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>{birthdayText}</Box>}
                                    <CardContent>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                            <Badge overlap="circular" anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} badgeContent={student.parent ? <Tooltip title="Есть аккаунт родителя"><CheckCircle sx={{ fontSize: 14, color: '#10B981' }} /></Tooltip> : null}>
                                                <Avatar sx={{ width: 56, height: 56, bgcolor: '#6366F1', fontSize: 24, fontWeight: 500 }}>{student.fullName?.charAt(0) || 'У'}</Avatar>
                                            </Badge>
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 600 }}>{student.fullName}</Typography>
                                                <Typography variant="caption" color="textSecondary">ID: {student.id}</Typography>
                                            </Box>
                                            <Chip label={getPaymentTypeLabel(student.paymentType)} color={getPaymentTypeColor(student.paymentType)} size="small" sx={{ borderRadius: 1.5, fontWeight: 500 }} />
                                        </Box>
                                        <Divider sx={{ my: 1.5 }} />
                                        
                                        {/* ✅ ОБНОВЛЁННЫЙ БЛОК: ОТОБРАЖЕНИЕ ДОЛГОВ С DRAG-AND-DROP */}
                                        {subscriptionProgress && subscriptionProgress.debt > 0 && (
                                            <Box 
                                                sx={{ 
                                                    mb: 1.5, p: 1, bgcolor: '#FFF3E0', borderRadius: 2, 
                                                    border: '1px solid #FFB74D', cursor: 'grab',
                                                    '&:active': { cursor: 'grabbing', opacity: 0.7 }
                                                }}
                                                draggable
                                                onDragStart={(e) => {
                                                    const dragData = JSON.stringify({
                                                        id: student.id,
                                                        fullName: student.fullName,
                                                        debt: subscriptionProgress.debt
                                                    });
                                                    e.dataTransfer.setData('text/plain', dragData);
                                                    e.dataTransfer.effectAllowed = 'move';
                                                }}
                                            >
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <WarningIcon sx={{ color: '#E65100', fontSize: 18 }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#E65100' }}>
                                                        Пропущено занятий: {subscriptionProgress.debt}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        )}
                                        
                                        <Box sx={{ display: 'flex', justifyContent: 'space-around', mb: 1.5, p: 1, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                                            <Box sx={{ textAlign: 'center', flex: 1 }}><Typography variant="h6" sx={{ fontWeight: 600, color: '#6366F1' }}>{stats.total}</Typography><Typography variant="caption" color="textSecondary">Всего</Typography></Box>
                                            <Box sx={{ textAlign: 'center', flex: 1 }}><Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>{stats.completed}</Typography><Typography variant="caption" color="textSecondary">Проведено</Typography></Box>
                                        </Box>
                                        
                                        {nextLesson && <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, p: 1, bgcolor: '#F9FAFB', borderRadius: 2 }}><Schedule sx={{ fontSize: 16, color: '#F59E0B' }} /><Typography variant="body2" sx={{ fontSize: '0.75rem' }}>След. занятие: {format(new Date(nextLesson.lessonDate), 'd MMM', { locale: ru })} в {nextLesson.startTime?.slice(0,5)}</Typography></Box>}
                                        {subscriptionProgress && (
                                            <Box sx={{ mb: 1.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}><Typography variant="caption" color="textSecondary">Абонемент</Typography><Typography variant="caption" fontWeight={500}>{subscriptionProgress.used}/{subscriptionProgress.total}</Typography></Box>
                                                <LinearProgress variant="determinate" value={subscriptionProgress.percent} sx={{ borderRadius: 1, height: 6 }} />
                                            </Box>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                                            {student.email && <Tooltip title={student.email}><Chip icon={<Email sx={{ fontSize: 14 }} />} label={student.email} size="small" variant="outlined" sx={{ maxWidth: '100%' }} /></Tooltip>}
                                            {student.phone && <Tooltip title={student.phone}><Chip icon={<Phone sx={{ fontSize: 14 }} />} label={student.phone} size="small" variant="outlined" /></Tooltip>}
                                        </Box>
                                        {studentRate && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}><AttachMoney sx={{ fontSize: 14, color: '#10B981' }} /><Typography variant="body2" sx={{ fontWeight: 500, color: '#10B981' }}>{studentRate} ₽/занятие</Typography></Box>}
                                    </CardContent>
                                    <Divider />
                                    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1 }}>
                                        <Box>
                                            <IconButton size="small" onClick={() => handleOpenDialog(student)}><Edit fontSize="small" /></IconButton>
                                            <IconButton size="small" color="error" onClick={() => handleDelete(student.id)}><Delete fontSize="small" /></IconButton>
                                            <IconButton size="small" color="primary" onClick={() => navigate(`/student-progress/${student.id}`)}><TrendingUp fontSize="small" /></IconButton>
                                        </Box>
                                        <Button size="small" onClick={() => handleExpandClick(student.id)} endIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}>Подробнее</Button>
                                    </CardActions>
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <CardContent sx={{ bgcolor: '#F9FAFB', pt: 0 }}>
                                            <Typography variant="subtitle2" gutterBottom>О родителе</Typography>
                                            {student.parent ? <><Typography variant="body2"><strong>Имя:</strong> {student.parent.fullName}</Typography><Typography variant="body2"><strong>Email:</strong> {student.parent.email}</Typography>{student.parent.phone && <Typography variant="body2"><strong>Телефон:</strong> {student.parent.phone}</Typography>}</> : <Typography variant="body2" color="textSecondary">Родитель не привязан</Typography>}
                                            {student.birthday && <><Divider sx={{ my: 1 }} /><Typography variant="subtitle2" gutterBottom>День рождения</Typography><Typography variant="body2">{new Date(student.birthday).toLocaleDateString('ru-RU')}</Typography></>}
                                        </CardContent>
                                    </Collapse>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{editingStudent ? 'Редактировать ученика' : 'Добавить нового ученика'}</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField 
                            fullWidth 
                            label="Имя ученика" 
                            name="fullName" 
                            value={formData.fullName} 
                            onChange={handleInputChange} 
                            margin="normal" 
                            required 
                            autoFocus 
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonAdd sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                        
                        <TextField 
                            fullWidth 
                            label="Email ученика" 
                            name="email" 
                            type="email" 
                            value={formData.email} 
                            onChange={handleInputChange} 
                            onBlur={handleEmailBlur} 
                            margin="normal" 
                            required 
                            helperText="На этот email будет отправлено приглашение"
                            InputProps={{ 
                                endAdornment: checkingEmail && <CircularProgress size={20} />,
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                )
                            }} 
                        />
                        
                        <TextField 
                            fullWidth 
                            label="Ставка за занятие (₽)" 
                            name="ratePerLesson" 
                            type="number" 
                            value={formData.ratePerLesson} 
                            onChange={handleInputChange} 
                            margin="normal" 
                            required 
                            InputProps={{ 
                                startAdornment: <InputAdornment position="start">₽</InputAdornment> 
                            }} 
                        />
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Тип оплаты</InputLabel>
                            <Select 
                                name="paymentType" 
                                value={formData.paymentType} 
                                onChange={handleInputChange} 
                                label="Тип оплаты"
                            >
                                <MenuItem value="single">Поурочная оплата</MenuItem>
                                <MenuItem value="subscription">Абонемент (авторасчёт)</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <TextField 
                            fullWidth 
                            label="Email родителя (необязательно)" 
                            name="parentEmail" 
                            type="email" 
                            value={formData.parentEmail || ''} 
                            onChange={handleInputChange} 
                            margin="normal" 
                            helperText="На этот email будет отправлено приглашение для родителя"
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Email sx={{ color: '#9CA3AF' }} />
                                    </InputAdornment>
                                )
                            }}
                        />
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                            После добавления ученик и родитель получат приглашения на email для завершения регистрации.
                        </Alert>
                        
                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                            <Button fullWidth variant="outlined" onClick={handleCloseDialog}>Отмена</Button>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                onClick={handleSubmit} 
                                disabled={!formData.fullName || !formData.email || !formData.ratePerLesson} 
                                sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}
                            >
                                {editingStudent ? 'Сохранить' : 'Отправить приглашение'}
                            </Button>
                        </Box>
                    </Box>
                </DialogContent>
            </Dialog>

            <Dialog open={showExistingDialog} onClose={() => setShowExistingDialog(false)}>
                <DialogTitle>Ученик уже существует</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>Найден ученик с email <strong>{existingStudent?.email}</strong>:</Typography>
                    <Paper sx={{ p: 2, mt: 1, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                        <Typography variant="body2"><strong>ФИО:</strong> {existingStudent?.fullName}</Typography>
                        {existingStudent?.phone && <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Телефон:</strong> {existingStudent.phone}</Typography>}
                        {existingStudent?.parent && <Typography variant="body2" sx={{ mt: 0.5 }}><strong>Родитель:</strong> {existingStudent.parent.fullName}</Typography>}
                    </Paper>
                    <Alert severity="info" sx={{ mt: 2 }}>Вы можете использовать эти данные. Ставку нужно будет указать отдельно.</Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setShowExistingDialog(false)}>Ввести новые данные</Button>
                    <Button onClick={handleUseExistingStudent} variant="contained" sx={{ bgcolor: '#6366F1' }}>Использовать эти данные</Button>
                </DialogActions>
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
            </Box>
        </Box>
    );
}

export default Students;