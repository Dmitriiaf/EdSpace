// ========== frontend/src/pages/StepikPage.jsx (ПОЛНАЯ ЗАМЕНА - ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Button, Grid, Card, CardContent,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    Tabs, Tab, Avatar, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, LinearProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    School as SchoolIcon,
    Link as LinkIcon,
    CheckCircle as CheckCircleIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    Sync as SyncIcon,
    CloudDownload as CloudDownloadIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function StepikPage() {
    const { user } = useAuth();
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [courses, setCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [tabValue, setTabValue] = useState(0);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [searching, setSearching] = useState(false);
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [assigning, setAssigning] = useState(false);
    const [syncing, setSyncing] = useState(false);

    const dataLoaded = useRef(false);
    const STEPIK_CLIENT_ID = process.env.REACT_APP_STEPIK_CLIENT_ID || 'h0HezWworAZiYKIhIWJEEvXSLBP62Gl1RXgRN3CP';
    const REDIRECT_URI = 'http://localhost:3000/stepik/callback';

    // ========== ПРОВЕРКА ПОДКЛЮЧЕНИЯ ==========
    const checkConnection = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/stepik/status', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const isConnected = response.data.connected;
            setConnected(isConnected);
            
            // Если подключен, сразу загружаем данные
            if (isConnected) {
                setTabValue(1); // По умолчанию открываем каталог
            }
        } catch (err) {
            console.error('Ошибка проверки подключения:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // ========== ЗАГРУЗКА ДАННЫХ ПРИ ПОДКЛЮЧЕНИИ ==========
    useEffect(() => {
        checkConnection();
        
        // Сброс при уходе со страницы
        return () => {
            dataLoaded.current = false;
            setCourses([]);
            setMyCourses([]);
            setAssignments([]);
        };
    }, [checkConnection]);

    // ========== ЗАГРУЗКА ДАННЫХ ПОСЛЕ ПОДКЛЮЧЕНИЯ ==========
    useEffect(() => {
        if (connected && !dataLoaded.current) {
            dataLoaded.current = true;
            fetchFeaturedCourses();
            fetchMyCourses();
            fetchAssignments();
        }
    }, [connected]);

    // ========== ЗАГРУЗКА ПРИ СМЕНЕ ВКЛАДКИ ==========
    useEffect(() => {
        if (connected) {
            if (tabValue === 1) {
                fetchFeaturedCourses();
            }
            if (tabValue === 2) {
                fetchAssignments();
            }
        }
    }, [tabValue, connected]);

    // ========== ПОДКЛЮЧЕНИЕ STEPIK ==========
    const handleConnect = () => {
        const authUrl = `https://stepik.org/oauth2/authorize/?response_type=code&client_id=${STEPIK_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = authUrl;
    };

    // ========== ПРИНУДИТЕЛЬНАЯ ЗАГРУЗКА КАТАЛОГА ==========
    const handleForceLoadCatalog = () => {
        setTabValue(1);
        fetchFeaturedCourses();
    };

    // ========== МОИ КУРСЫ ==========
    const fetchMyCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/stepik/my-courses', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            setMyCourses(data.courses || []);
        } catch (err) {
            console.error('Ошибка загрузки моих курсов:', err);
        }
    };

    // ========== НАЗНАЧЕННЫЕ КУРСЫ ==========
    const fetchAssignments = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/stepik/assignments', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setAssignments(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки назначенных курсов:', err);
        }
    };

    // ========== СИНХРОНИЗАЦИЯ ПРОГРЕССА ==========
    const handleSyncProgress = async () => {
        setSyncing(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.post(
                '/stepik/sync-progress',
                {},
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            alert(`✅ Прогресс синхронизирован! Обновлено ${response.data.updated} из ${response.data.total} курсов.`);
            fetchAssignments();
        } catch (err) {
            alert('Ошибка синхронизации: ' + (err.response?.data?.error || 'Не удалось синхронизировать'));
        } finally {
            setSyncing(false);
        }
    };

    // ========== КАТАЛОГ КУРСОВ (ПОПУЛЯРНЫЕ) ==========
    const fetchFeaturedCourses = async () => {
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/stepik/courses/featured', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            
            console.log('📦 Stepik catalog loaded:', data.courses?.length, 'courses');
            
            setCourses(data.courses || []);
            setHasMore(data.meta?.has_next || false);
        } catch (err) {
            console.error('Ошибка загрузки популярных курсов:', err);
        } finally {
            setSearching(false);
        }
    };

    // ========== ПОИСК КУРСОВ ==========
    const searchCourses = async (reset = true) => {
        if (!searchQuery.trim()) {
            fetchFeaturedCourses();
            return;
        }
        
        setSearching(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get('/stepik/courses/search', {
                params: { query: searchQuery, page: reset ? 1 : page },
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const newCourses = data.courses || [];
            
            if (reset) {
                setCourses(newCourses);
                setPage(1);
            } else {
                setCourses(prev => [...prev, ...newCourses]);
            }
            
            setHasMore(data.meta?.has_next || false);
            setPage(prev => reset ? 1 : prev + 1);
        } catch (err) {
            console.error('Ошибка поиска:', err);
        } finally {
            setSearching(false);
        }
    };

    const handleSearch = () => {
        setCourses([]);
        searchCourses(true);
    };

    const handleLoadMore = () => {
        searchCourses(false);
    };

    // ========== УЧЕНИКИ ==========
    const fetchStudents = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/students/tutor/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStudents(response.data);
        } catch (err) {
            console.error('Ошибка загрузки учеников:', err);
        }
    };

    // ========== НАЗНАЧЕНИЕ КУРСА ==========
    const handleViewCourse = (course) => {
        setSelectedCourse(course);
        setSelectedStudentId('');
        fetchStudents();
        setOpenDialog(true);
    };

    const handleAssignCourse = async () => {
        if (!selectedStudentId) {
            alert('Выберите ученика');
            return;
        }
        
        setAssigning(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                '/stepik/assign',
                {
                    studentId: selectedStudentId,
                    courseId: selectedCourse.id,
                    courseTitle: selectedCourse.title
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            alert('✅ Курс успешно назначен ученику!');
            setOpenDialog(false);
            setSelectedStudentId('');
            setSelectedCourse(null);
            fetchAssignments();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось назначить курс'));
        } finally {
            setAssigning(false);
        }
    };

    // ========== ВСПОМОГАТЕЛЬНЫЕ ==========
    const getStatusChip = (status, progress) => {
        if (status === 'completed' || progress >= 100) {
            return <Chip label="Завершён" color="success" size="small" icon={<CheckCircleIcon />} />;
        }
        if (status === 'in_progress' || progress > 0) {
            return <Chip label="В процессе" color="warning" size="small" />;
        }
        return <Chip label="Назначен" color="default" size="small" />;
    };

    // ========== РЕНДЕР ==========
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#6366F1', width: 56, height: 56 }}>
                        <SchoolIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            Stepik
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Интеграция с образовательной платформой
                        </Typography>
                    </Box>
                </Box>
                
                {connected ? (
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<CloudDownloadIcon />}
                            onClick={handleForceLoadCatalog}
                            size="small"
                        >
                            Загрузить каталог
                        </Button>
                        <Button
                            variant="outlined"
                            startIcon={<SyncIcon />}
                            onClick={handleSyncProgress}
                            disabled={syncing}
                        >
                            {syncing ? 'Синхронизация...' : 'Синхронизировать'}
                        </Button>
                        <Chip 
                            icon={<CheckCircleIcon />}
                            label="Подключено"
                            color="success"
                            variant="outlined"
                        />
                    </Box>
                ) : (
                    <Button 
                        variant="contained" 
                        onClick={handleConnect}
                        sx={{ 
                            bgcolor: '#6366F1',
                            '&:hover': { bgcolor: '#4F46E5' }
                        }}
                    >
                        Подключить Stepik
                    </Button>
                )}
            </Box>

            {!connected ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                    <SchoolIcon sx={{ fontSize: 80, color: '#E5E7EB', mb: 2 }} />
                    <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                        Подключите Stepik
                    </Typography>
                    <Typography variant="body1" color="textSecondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                        После подключения вы сможете назначать ученикам курсы и задания с платформы Stepik, 
                        а их прогресс будет автоматически отображаться в LMS.
                    </Typography>
                    <Button 
                        variant="contained" 
                        size="large"
                        onClick={handleConnect}
                        sx={{ 
                            bgcolor: '#6366F1',
                            '&:hover': { bgcolor: '#4F46E5' }
                        }}
                    >
                        Подключить Stepik
                    </Button>
                </Paper>
            ) : (
                <>
                    {/* Вкладки */}
                    <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={(e, v) => setTabValue(v)}
                            sx={{ 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 }
                            }}
                        >
                            <Tab label="Мои курсы" />
                            <Tab label="Каталог курсов" />
                            <Tab label="Назначенные курсы" />
                        </Tabs>
                    </Paper>

                    {/* Вкладка МОИ КУРСЫ */}
                    {tabValue === 0 && (
                        <Box>
                            {myCourses.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        У вас пока нет созданных курсов на Stepik.
                                    </Typography>
                                    <Button 
                                        variant="outlined" 
                                        sx={{ mt: 2 }}
                                        href="https://stepik.org/teach"
                                        target="_blank"
                                        endIcon={<OpenInNewIcon />}
                                    >
                                        Создать курс на Stepik
                                    </Button>
                                </Paper>
                            ) : (
                                <Grid container spacing={3}>
                                    {myCourses.map(course => (
                                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                                            <Card sx={{ borderRadius: 3, height: '100%' }}>
                                                {course.cover && (
                                                    <Box 
                                                        component="img"
                                                        src={course.cover}
                                                        sx={{ 
                                                            width: '100%', 
                                                            height: 140, 
                                                            objectFit: 'cover',
                                                            borderTopLeftRadius: 12,
                                                            borderTopRightRadius: 12
                                                        }}
                                                    />
                                                )}
                                                <CardContent>
                                                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                        {course.title}
                                                    </Typography>
                                                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                                        {course.summary?.substring(0, 100)}...
                                                    </Typography>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <Button 
                                                            variant="outlined" 
                                                            size="small"
                                                            onClick={() => handleViewCourse(course)}
                                                        >
                                                            Назначить
                                                        </Button>
                                                        <IconButton 
                                                            size="small"
                                                            href={`https://stepik.org/course/${course.id}`}
                                                            target="_blank"
                                                        >
                                                            <LinkIcon />
                                                        </IconButton>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {/* Вкладка КАТАЛОГ КУРСОВ */}
                    {tabValue === 1 && (
                        <Box>
                            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                                <TextField
                                    fullWidth
                                    placeholder="Поиск курсов..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon />
                                            </InputAdornment>
                                        ),
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <Button 
                                                    variant="contained" 
                                                    onClick={handleSearch}
                                                    disabled={searching}
                                                >
                                                    Найти
                                                </Button>
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Paper>

                            {searching && courses.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                                    <CircularProgress />
                                </Box>
                            ) : courses.length > 0 ? (
                                <>
                                    <Grid container spacing={3}>
                                        {courses.map(course => (
                                            <Grid item xs={12} sm={6} md={4} key={course.id}>
                                                <Card sx={{ borderRadius: 3, height: '100%' }}>
                                                    {course.cover && (
                                                        <Box 
                                                            component="img"
                                                            src={course.cover}
                                                            sx={{ 
                                                                width: '100%', 
                                                                height: 140, 
                                                                objectFit: 'cover',
                                                                borderTopLeftRadius: 12,
                                                                borderTopRightRadius: 12
                                                            }}
                                                        />
                                                    )}
                                                    <CardContent>
                                                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                            {course.title}
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                                            {course.summary?.substring(0, 120)}...
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Chip 
                                                                label={course.is_paid ? 'Платный' : 'Бесплатный'}
                                                                size="small"
                                                                color={course.is_paid ? 'warning' : 'success'}
                                                            />
                                                            <Box>
                                                                <Tooltip title="Открыть на Stepik">
                                                                    <IconButton 
                                                                        size="small"
                                                                        href={`https://stepik.org/course/${course.id}`}
                                                                        target="_blank"
                                                                    >
                                                                        <LinkIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Button 
                                                                    variant="outlined" 
                                                                    size="small"
                                                                    onClick={() => handleViewCourse(course)}
                                                                    sx={{ ml: 1 }}
                                                                >
                                                                    Назначить
                                                                </Button>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    
                                    {hasMore && (
                                        <Box sx={{ textAlign: 'center', mt: 3 }}>
                                            <Button 
                                                variant="outlined" 
                                                onClick={handleLoadMore}
                                                disabled={searching}
                                            >
                                                Загрузить ещё
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            ) : !searching && (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                    <Typography variant="body1" color="textSecondary">
                                        Нажмите "Найти" для поиска курсов
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                    )}

                    {/* Вкладка НАЗНАЧЕННЫЕ КУРСЫ */}
                    {tabValue === 2 && (
                        <Box>
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchAssignments}
                                >
                                    Обновить
                                </Button>
                            </Box>

                            {assignments.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                    <SchoolIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary" gutterBottom>
                                        Нет назначенных курсов
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Назначьте курс ученику на вкладке "Мои курсы" или "Каталог курсов"
                                    </Typography>
                                </Paper>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                                <TableCell sx={{ fontWeight: 600 }}>Ученик</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Курс</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Дата назначения</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Прогресс</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="right">Действия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {assignments.map((assignment) => (
                                                <TableRow key={assignment.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff6b6b', fontSize: 14 }}>
                                                                {assignment.student?.fullName?.charAt(0) || 'У'}
                                                            </Avatar>
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {assignment.student?.fullName || 'Неизвестно'}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {assignment.courseTitle || `Курс #${assignment.courseId}`}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" color="textSecondary">
                                                            {new Date(assignment.assignedAt).toLocaleDateString('ru-RU')}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getStatusChip(assignment.status, assignment.progressPercent)}
                                                    </TableCell>
                                                    <TableCell sx={{ minWidth: 120 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={assignment.progressPercent || 0}
                                                                sx={{ flex: 1, borderRadius: 1, height: 6 }}
                                                            />
                                                            <Typography variant="caption" color="textSecondary">
                                                                {assignment.progressPercent || 0}%
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Открыть на Stepik">
                                                            <IconButton 
                                                                size="small"
                                                                href={`https://stepik.org/course/${assignment.courseId}`}
                                                                target="_blank"
                                                            >
                                                                <OpenInNewIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </Box>
                    )}
                </>
            )}

            {/* Диалог назначения курса */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Назначить курс ученику</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        <strong>{selectedCourse?.title}</strong>
                    </Typography>
                    
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Выберите ученика</InputLabel>
                        <Select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            label="Выберите ученика"
                        >
                            {students.map(student => (
                                <MenuItem key={student.id} value={student.id}>
                                    {student.fullName} ({student.email || 'без email'})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    
                    <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block' }}>
                        Ученик получит доступ к курсу на платформе Stepik. 
                        Прогресс будет автоматически отслеживаться.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Отмена</Button>
                    <Button 
                        variant="contained"
                        onClick={handleAssignCourse}
                        disabled={!selectedStudentId || assigning}
                    >
                        {assigning ? 'Назначение...' : 'Назначить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default StepikPage;