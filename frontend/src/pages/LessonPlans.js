import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Typography, Paper, Button, Grid, Card, CardContent,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    Tabs, Tab, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Stack,
    Divider, Avatar
} from '@mui/material';
import {
    Add as AddIcon,
    Search as SearchIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Refresh as RefreshIcon,
    School as SchoolIcon,
    MenuBook as MenuBookIcon,
    ContentCopy as CopyIcon,
    Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function LessonPlans() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState([]);
    const [filteredPlans, setFilteredPlans] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [courses, setCourses] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    
    const [formData, setFormData] = useState({
        title: '',
        topic: '',
        courseId: '',
        description: '',
        learningObjectives: '',
        materialsNeeded: '',
        lessonStructure: '',
        homeworkTemplate: '',
        durationMinutes: 60,
        difficultyLevel: 3,
        tags: ''
    });

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user]);

    useEffect(() => {
        filterPlans();
    }, [plans, searchQuery, selectedCourseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [plansRes, coursesRes] = await Promise.all([
                axios.get('/lesson-plans', { headers }),
                axios.get(`/courses/tutor/${user.id}`, { headers })
            ]);
            
            setPlans(plansRes.data || []);
            setCourses(coursesRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const filterPlans = () => {
        let filtered = [...plans];
        
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.title?.toLowerCase().includes(query) ||
                p.topic?.toLowerCase().includes(query) ||
                p.tags?.toLowerCase().includes(query)
            );
        }
        
        if (selectedCourseId) {
            filtered = filtered.filter(p => p.course?.id === parseInt(selectedCourseId));
        }
        
        setFilteredPlans(filtered);
    };

    const handleOpenDialog = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                title: plan.title || '',
                topic: plan.topic || '',
                courseId: plan.course?.id || '',
                description: plan.description || '',
                learningObjectives: plan.learningObjectives || '',
                materialsNeeded: plan.materialsNeeded || '',
                lessonStructure: plan.lessonStructure || '',
                homeworkTemplate: plan.homeworkTemplate || '',
                durationMinutes: plan.durationMinutes || 60,
                difficultyLevel: plan.difficultyLevel || 3,
                tags: plan.tags || ''
            });
        } else {
            setEditingPlan(null);
            setFormData({
                title: '',
                topic: '',
                courseId: '',
                description: '',
                learningObjectives: '',
                materialsNeeded: '',
                lessonStructure: '',
                homeworkTemplate: '',
                durationMinutes: 60,
                difficultyLevel: 3,
                tags: ''
            });
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingPlan(null);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.title || !formData.topic) {
            alert('Заполните название и тему');
            return;
        }
        
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const submitData = {
                ...formData,
                courseId: formData.courseId || null
            };
            
            if (editingPlan) {
                await axios.put(`/lesson-plans/${editingPlan.id}`, submitData, { headers });
            } else {
                await axios.post('/lesson-plans', submitData, { headers });
            }
            
            handleCloseDialog();
            fetchData();
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            alert('Ошибка при сохранении плана');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить план урока?')) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/lesson-plans/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Ошибка удаления:', err);
            alert('Ошибка при удалении');
        }
    };

    const getDifficultyLabel = (level) => {
        const labels = ['', 'Очень лёгкий', 'Лёгкий', 'Средний', 'Сложный', 'Очень сложный'];
        return labels[level] || 'Средний';
    };

    const getDifficultyColor = (level) => {
        const colors = ['', 'success', 'success', 'warning', 'error', 'error'];
        return colors[level] || 'warning';
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: '#8B5CF6', width: 56, height: 56 }}>
                        <MenuBookIcon sx={{ fontSize: 32 }} />
                    </Avatar>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                            Методическая копилка
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Планы уроков и методические материалы
                        </Typography>
                    </Box>
                </Box>
                
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => handleOpenDialog()}
                    sx={{ 
                        bgcolor: '#8B5CF6',
                        '&:hover': { bgcolor: '#7C3AED' },
                        borderRadius: 2,
                        textTransform: 'none'
                    }}
                >
                    Создать план
                </Button>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* Фильтры */}
            <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            placeholder="Поиск по названию, теме или тегам..."
                            size="small"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <SearchIcon sx={{ color: 'text.secondary' }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Фильтр по курсу</InputLabel>
                            <Select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                label="Фильтр по курсу"
                            >
                                <MenuItem value="">Все курсы</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={2}>
                        <Button 
                            fullWidth 
                            variant="outlined" 
                            startIcon={<RefreshIcon />}
                            onClick={fetchData}
                        >
                            Обновить
                        </Button>
                    </Grid>
                </Grid>
            </Paper>

            {/* Список планов */}
            {filteredPlans.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                    <MenuBookIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Нет планов уроков
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {searchQuery || selectedCourseId 
                            ? 'Попробуйте изменить параметры фильтрации'
                            : 'Нажмите "Создать план" чтобы добавить первый план урока'}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {filteredPlans.map(plan => (
                        <Grid item xs={12} sm={6} md={4} key={plan.id}>
                            <Card sx={{ 
                                borderRadius: 3, 
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.15s',
                                '&:hover': { 
                                    transform: 'translateY(-2px)',
                                    boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
                                }
                            }}>
                                <CardContent sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: '#F5F3FF', width: 40, height: 40 }}>
                                            <MenuBookIcon sx={{ color: '#8B5CF6', fontSize: 20 }} />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem', mb: 0.5 }}>
                                                {plan.title}
                                            </Typography>
                                            <Chip 
                                                label={plan.topic}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem' }}
                                            />
                                        </Box>
                                    </Box>
                                    
                                    {plan.description && (
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>
                                            {plan.description.length > 100 
                                                ? plan.description.substring(0, 100) + '...' 
                                                : plan.description}
                                        </Typography>
                                    )}
                                    
                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                                        {plan.course && (
                                            <Chip 
                                                icon={<SchoolIcon sx={{ fontSize: 14 }} />}
                                                label={plan.course.name}
                                                size="small"
                                                sx={{ bgcolor: '#EEF2FF', color: '#6366F1' }}
                                            />
                                        )}
                                        <Chip 
                                            label={`${plan.durationMinutes || 60} мин`}
                                            size="small"
                                            variant="outlined"
                                        />
                                        <Chip 
                                            label={getDifficultyLabel(plan.difficultyLevel)}
                                            size="small"
                                            color={getDifficultyColor(plan.difficultyLevel)}
                                        />
                                    </Stack>
                                    
                                    {plan.tags && (
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                            {plan.tags.split(',').slice(0, 3).map((tag, i) => (
                                                <Chip 
                                                    key={i}
                                                    label={tag.trim()}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ fontSize: '0.6rem', height: 20 }}
                                                />
                                            ))}
                                        </Box>
                                    )}
                                </CardContent>
                                
                                <Divider />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                                    <Tooltip title="Редактировать">
                                        <IconButton size="small" onClick={() => handleOpenDialog(plan)}>
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Копировать">
                                        <IconButton size="small" onClick={() => handleOpenDialog({ ...plan, id: null, title: plan.title + ' (копия)' })}>
                                            <CopyIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Удалить">
                                        <IconButton size="small" color="error" onClick={() => handleDelete(plan.id)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </Box>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Диалог создания/редактирования */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="lg" 
                fullWidth
                PaperProps={{ sx: { borderRadius: 4, maxHeight: '90vh' } }}
            >
                <DialogTitle sx={{ 
                    borderBottom: '1px solid #E5E7EB', 
                    px: 3, 
                    py: 2,
                    bgcolor: '#F9FAFB'
                }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#8B5CF6', width: 40, height: 40 }}>
                                <MenuBookIcon />
                            </Avatar>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    {editingPlan ? 'Редактирование плана' : 'Новый план урока'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Заполните информацию о плане урока
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={handleCloseDialog} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>
                </DialogTitle>
                
                <DialogContent sx={{ p: 3, bgcolor: '#F9FAFB' }}>
                    <Grid container spacing={3}>
                        {/* Левая колонка - основные поля */}
                        <Grid item xs={12} md={7}>
                            <Stack spacing={2.5}>
                                {/* Основная информация */}
                                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                                        📝 Основная информация
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                label="Название плана"
                                                name="title"
                                                value={formData.title}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Например: Present Perfect - введение"
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={8}>
                                            <TextField
                                                fullWidth
                                                label="Тема"
                                                name="topic"
                                                value={formData.topic}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="Грамматика / Алгебра / Программирование"
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Сложность</InputLabel>
                                                <Select
                                                    name="difficultyLevel"
                                                    value={formData.difficultyLevel}
                                                    onChange={handleInputChange}
                                                    label="Сложность"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value={1}>🟢 Очень лёгкий</MenuItem>
                                                    <MenuItem value={2}>🟢 Лёгкий</MenuItem>
                                                    <MenuItem value={3}>🟡 Средний</MenuItem>
                                                    <MenuItem value={4}>🟠 Сложный</MenuItem>
                                                    <MenuItem value={5}>🔴 Очень сложный</MenuItem>
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <FormControl fullWidth>
                                                <InputLabel>Привязать к курсу</InputLabel>
                                                <Select
                                                    name="courseId"
                                                    value={formData.courseId}
                                                    onChange={handleInputChange}
                                                    label="Привязать к курсу"
                                                    sx={{ borderRadius: 2 }}
                                                >
                                                    <MenuItem value="">Без привязки к курсу</MenuItem>
                                                    {courses.map(c => (
                                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                            <TextField
                                                fullWidth
                                                label="Длительность"
                                                name="durationMinutes"
                                                type="number"
                                                value={formData.durationMinutes}
                                                onChange={handleInputChange}
                                                placeholder="60"
                                                InputProps={{ 
                                                    endAdornment: <InputAdornment position="end">мин</InputAdornment>,
                                                    sx: { borderRadius: 2 }
                                                }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={3}>
                                            <TextField
                                                fullWidth
                                                label="Теги"
                                                name="tags"
                                                value={formData.tags}
                                                onChange={handleInputChange}
                                                placeholder="алгебра, егэ"
                                                InputProps={{ sx: { borderRadius: 2 } }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Paper>
                                
                                {/* Цели и материалы */}
                                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                                        🎯 Цели и подготовка
                                    </Typography>
                                    <Stack spacing={2}>
                                        <TextField
                                            fullWidth
                                            label="Краткое описание"
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            placeholder="Кратко о чём этот урок..."
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Цели урока"
                                            name="learningObjectives"
                                            value={formData.learningObjectives}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            placeholder="Что ученик должен узнать или научиться делать..."
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        />
                                        <TextField
                                            fullWidth
                                            label="Необходимые материалы"
                                            name="materialsNeeded"
                                            value={formData.materialsNeeded}
                                            onChange={handleInputChange}
                                            multiline
                                            rows={2}
                                            placeholder="Учебники, презентации, ссылки на ресурсы..."
                                            InputProps={{ sx: { borderRadius: 2 } }}
                                        />
                                    </Stack>
                                </Paper>
                            </Stack>
                        </Grid>
                        
                        {/* Правая колонка - структура и ДЗ */}
                        <Grid item xs={12} md={5}>
                            <Stack spacing={2.5}>
                                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white', flex: 1 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                                        📋 Структура урока
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="lessonStructure"
                                        value={formData.lessonStructure}
                                        onChange={handleInputChange}
                                        multiline
                                        rows={10}
                                        placeholder={`1. Организационный момент (3 мин)
            - Приветствие, проверка готовности
            
            2. Проверка домашнего задания (7 мин)
            - Разбор сложных моментов
            
            3. Новая тема (25 мин)
            - Объяснение материала
            - Примеры
            
            4. Закрепление (15 мин)
            - Практические задания
            
            5. Подведение итогов (10 мин)
            - Ответы на вопросы
            - Домашнее задание`}
                                        InputProps={{ sx: { borderRadius: 2, fontFamily: 'monospace', fontSize: '0.9rem' } }}
                                        sx={{ '& .MuiOutlinedInput-root': { alignItems: 'flex-start' } }}
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                        Используйте переносы строк для разделения этапов урока
                                    </Typography>
                                </Paper>
                                
                                <Paper sx={{ p: 2.5, borderRadius: 3, bgcolor: 'white' }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                                        📚 Шаблон домашнего задания
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        name="homeworkTemplate"
                                        value={formData.homeworkTemplate}
                                        onChange={handleInputChange}
                                        multiline
                                        rows={5}
                                        placeholder={`1. Повторить правила на стр. 45-47
            2. Выполнить упражнения №12, 14, 15
            3. *Дополнительно: составить 5 своих примеров`}
                                        InputProps={{ sx: { borderRadius: 2 } }}
                                    />
                                </Paper>
                            </Stack>
                        </Grid>
                    </Grid>
                </DialogContent>
                
                <DialogActions sx={{ 
                    px: 3, 
                    py: 2, 
                    borderTop: '1px solid #E5E7EB',
                    bgcolor: 'white',
                    justifyContent: 'space-between'
                }}>
                    <Box>
                        {editingPlan && (
                            <Button 
                                color="error" 
                                onClick={() => {
                                    if (window.confirm('Удалить план?')) {
                                        handleDelete(editingPlan.id);
                                        handleCloseDialog();
                                    }
                                }}
                                startIcon={<DeleteIcon />}
                            >
                                Удалить
                            </Button>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                        <Button onClick={handleCloseDialog} variant="outlined">
                            Отмена
                        </Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSubmit}
                            disabled={saving || !formData.title || !formData.topic}
                            sx={{ 
                                bgcolor: '#8B5CF6', 
                                '&:hover': { bgcolor: '#7C3AED' },
                                px: 4
                            }}
                        >
                            {saving ? 'Сохранение...' : (editingPlan ? 'Сохранить' : 'Создать план')}
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default LessonPlans;