// ========== frontend/src/pages/TaskBank.js (РЕДИЗАЙН v3 — ЕДИНЫЙ ПОИСК) ==========
import React, { useState, useEffect } from 'react';
import axiosInstance from '../services/api';
import {
    Box, Typography, Paper, Button, Grid, Card, CardContent,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem,
    Stack, Avatar, Divider, Pagination
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Search as SearchIcon,
    Assignment as AssignmentIcon,
    OpenInNew as OpenInNewIcon,
    Link as LinkIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    ContentCopy as CopyIcon,
    MenuBook as MenuBookIcon,
    CheckCircle as CheckCircleIcon,
    AutoAwesome as AutoAwesomeIcon,
    Clear as ClearIcon,
    Refresh as RefreshIcon,
    School as SchoolIcon,
    Sync as SyncIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

// ========== СТИЛИ ==========

const ChipFilter = styled(Chip)(({ active }) => ({
    borderRadius: '8px', fontWeight: 500, fontSize: '13px', cursor: 'pointer',
    backgroundColor: active ? '#4F46E5' : 'transparent',
    color: active ? '#FFFFFF' : '#6B7280',
    border: active ? 'none' : '1px solid #E5E7EB',
    '&:hover': { backgroundColor: active ? '#4338CA' : '#F9FAFB' },
}));

const MaterialCard = styled(Card)({
    borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF', height: '100%', transition: 'all 0.2s ease',
    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' },
});

const SearchBar = styled(TextField)({
    '& .MuiOutlinedInput-root': {
        borderRadius: '12px', backgroundColor: '#FFFFFF', fontSize: '15px',
        '& fieldset': { borderColor: '#E5E7EB' },
        '&:hover fieldset': { borderColor: '#D1D5DB' },
        '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
    },
});

// ========== УТИЛИТЫ ==========
const SUBJECTS = ['Информатика', 'Математика', 'Русский язык', 'Физика'];
const EXAM_TYPES = ['ЕГЭ', 'ОГЭ'];
const TASK_NUMBERS = {
    'Информатика': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
    'Математика': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19],
    'Русский язык': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
    'Физика': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26],
};

function getSourceColor(source) {
    switch(source) { case 'AI_GENERATED': return '#8B5CF6'; case 'MANUAL': return '#10B981'; default: return '#6B7280'; }
}
function getSourceLabel(source) {
    switch(source) { case 'AI_GENERATED': return '🤖 ИИ'; case 'MANUAL': return '📝 Своё'; default: return source || '📚 Банк'; }
}

// ========== КОМПОНЕНТ ==========
function TaskBank() {
    const { user } = useAuth();
    
    // Единый поиск и фильтры
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all, tasks, variants, plans, stepik
    const [subjectFilter, setSubjectFilter] = useState('');
    const [examFilter, setExamFilter] = useState('');
    const [taskNumber, setTaskNumber] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [page, setPage] = useState(1);
    const perPage = 12;
    
    // Данные
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [variants, setVariants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [students, setStudents] = useState([]);
    const [stepikConnected, setStepikConnected] = useState(false);
    
    // Диалоги
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [assigning, setAssigning] = useState(false);
    
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [aiTaskType, setAiTaskType] = useState('');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiSubject, setAiSubject] = useState('Информатика');
    const [aiExamType, setAiExamType] = useState('ЕГЭ');
    const [generating, setGenerating] = useState(false);
    const [generatedTask, setGeneratedTask] = useState(null);
    
    const [variantDialogOpen, setVariantDialogOpen] = useState(false);
    const [variantForm, setVariantForm] = useState({ title: '', url: '', subject: '', examType: '' });
    const [savingVariant, setSavingVariant] = useState(false);

    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [manualForm, setManualForm] = useState({ question: '', answer: '', explanation: '', topic: '', difficulty: 3, maxScore: 1 });
    const [savingManual, setSavingManual] = useState(false);

    useEffect(() => { if (user?.id) fetchAllData(); }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [tasksRes, variantsRes, plansRes, studentsRes, stepikRes] = await Promise.all([
                axiosInstance.get('/integration/tasks/search'),
                axiosInstance.get('/variants'),
                axiosInstance.get('/lesson-plans'),
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get('/stepik/status').catch(() => ({ data: { connected: false } })),
            ]);
            setTasks(tasksRes.data || []);
            setVariants(variantsRes.data || []);
            setPlans(plansRes.data || []);
            setStudents(studentsRes.data || []);
            setStepikConnected(stepikRes.data?.connected || false);
            setError(null);
        } catch (err) { setError('Ошибка загрузки'); }
        finally { setLoading(false); }
    };

    // ========== ЕДИНЫЙ СПИСОК ==========
    const getAllMaterials = () => {
        let items = [];
        
        if (typeFilter === 'all' || typeFilter === 'tasks') {
            tasks.forEach(t => items.push({ ...t, materialType: 'task' }));
        }
        if (typeFilter === 'all' || typeFilter === 'variants') {
            variants.forEach(v => items.push({ ...v, materialType: 'variant' }));
        }
        if (typeFilter === 'all' || typeFilter === 'plans') {
            plans.forEach(p => items.push({ ...p, materialType: 'plan' }));
        }
        
        // Поиск
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i => 
                (i.question || i.title || i.topic || i.name || '').toLowerCase().includes(q) ||
                (i.description || '').toLowerCase().includes(q)
            );
        }
        
        // Фильтры
        if (subjectFilter) items = items.filter(i => i.subject === subjectFilter);
        if (examFilter) items = items.filter(i => i.examType === examFilter);
        if (taskNumber && typeFilter !== 'variants') {
            items = items.filter(i => {
                const topic = (i.topic || i.question || i.title || '').toLowerCase();
                return topic.includes(`задание ${taskNumber}`) || topic.includes(`№${taskNumber}`);
            });
        }
        if (difficultyFilter) {
            items = items.filter(i => {
                const d = i.difficulty || i.difficultyLevel;
                const labels = { 'easy': [1,2], 'medium': [3], 'hard': [4,5] };
                return labels[difficultyFilter]?.includes(d);
            });
        }
        
        return items;
    };

    const allMaterials = getAllMaterials();
    const totalPages = Math.ceil(allMaterials.length / perPage);
    const currentMaterials = allMaterials.slice((page - 1) * perPage, page * perPage);

    // ========== НАЗНАЧЕНИЕ ==========
    const handleOpenAssign = (material) => {
        setSelectedMaterial(material);
        setSelectedStudentId('');
        setAssignDialogOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedStudentId || !selectedMaterial) return;
        setAssigning(true);
        try {
            const due = dueDate.toISOString().split('.')[0];
            
            if (selectedMaterial.materialType === 'task') {
                await axiosInstance.post('/integration/create-homework-from-task', {
                    taskId: selectedMaterial.id, studentId: selectedStudentId, dueDate: due
                });
            } else if (selectedMaterial.materialType === 'variant') {
                await axiosInstance.post(`/variants/${selectedMaterial.id}/assign`, {
                    studentId: selectedStudentId, dueDate: due
                });
            } else if (selectedMaterial.materialType === 'plan') {
                const hwText = selectedMaterial.homeworkTemplate || `ДЗ по теме: ${selectedMaterial.topic}`;
                await axiosInstance.post('/homework', {
                    tutorId: user.id, studentId: selectedStudentId, task: hwText, dueDate: due, status: 'assigned'
                });
            }
            alert('✅ Назначено!');
            setAssignDialogOpen(false);
            setSelectedMaterial(null);
        } catch (err) { alert('Ошибка назначения'); }
        finally { setAssigning(false); }
    };

    // ========== ИИ-генерация ==========
    const handleGenerate = async () => {
        const prompt = aiTaskType === 'custom' ? aiPrompt : `Сгенерируй ${aiTaskType} по ${aiSubject} (${aiExamType})`;
        if (!prompt.trim()) return;
        setGenerating(true);
        try {
            const res = await axiosInstance.post('/ai/generate', { prompt, subject: aiSubject, examType: aiExamType });
            setGeneratedTask(res.data);
        } catch (err) { alert('Ошибка генерации'); }
        finally { setGenerating(false); }
    };

    const handleSaveGenerated = async () => {
        if (!generatedTask) return;
        try {
            await axiosInstance.post('/ai/save', generatedTask);
            alert('✅ Сохранено в банк!');
            setAiDialogOpen(false); setGeneratedTask(null); fetchAllData();
        } catch (err) { alert('Ошибка сохранения'); }
    };

    // ========== Ручное создание ==========
    const handleSaveManual = async () => {
        if (!manualForm.question || !manualForm.answer) return;
        setSavingManual(true);
        try {
            await axiosInstance.post('/integration/tasks', { ...manualForm, source: 'MANUAL', subject: 'Информатика', examType: 'ЕГЭ', type: 'problem' });
            alert('✅ Сохранено!');
            setManualDialogOpen(false); fetchAllData();
        } catch (err) { alert('Ошибка'); }
        finally { setSavingManual(false); }
    };

    // ========== Вариант ==========
    const handleSaveVariant = async () => {
        if (!variantForm.title || !variantForm.url) return;
        setSavingVariant(true);
        try {
            await axiosInstance.post('/variants', variantForm);
            alert('✅ Вариант добавлен!');
            setVariantDialogOpen(false); fetchAllData();
        } catch (err) { alert('Ошибка'); }
        finally { setSavingVariant(false); }
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#4F46E5' }} />
            </Box>
        </PageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer>
                {/* ========== ЗАГОЛОВОК ========== */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                            Поиск заданий
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            {allMaterials.length} материалов • Задания, варианты, планы уроков
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <StyledButton variant="outlined" startIcon={<AddIcon />} onClick={() => setManualDialogOpen(true)}
                            sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                            Создать
                        </StyledButton>
                        <StyledButton variant="outlined" startIcon={<AutoAwesomeIcon />}
                            onClick={() => { setAiDialogOpen(true); setGeneratedTask(null); setAiTaskType(''); setAiPrompt(''); }}
                            sx={{ color: '#7C3AED', borderColor: '#C4B5FD', '&:hover': { bgcolor: '#F5F3FF' } }}>
                            ИИ-генерация
                        </StyledButton>
                        <StyledButton variant="outlined" startIcon={<LinkIcon />}
                            onClick={() => { setVariantForm({ title: '', url: '', subject: '', examType: '' }); setVariantDialogOpen(true); }}
                            sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                            Добавить вариант
                        </StyledButton>
                        <StyledButton variant="contained" startIcon={<RefreshIcon />} onClick={fetchAllData}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                            Обновить
                        </StyledButton>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

                {/* ========== ПОИСК ========== */}
                <SearchBar
                    fullWidth
                    placeholder="Поиск по заданиям, вариантам, темам..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
                    sx={{ mb: 2 }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                        endAdornment: searchQuery && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchQuery('')}><ClearIcon /></IconButton>
                            </InputAdornment>
                        ),
                    }}
                />

                {/* ========== ФИЛЬТРЫ ========== */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    {[
                        { value: 'all', label: 'Все материалы' },
                        { value: 'tasks', label: '📝 Задания' },
                        { value: 'variants', label: '🔗 Варианты' },
                        { value: 'plans', label: '📋 Планы' },
                    ].map(f => (
                        <ChipFilter key={f.value} label={f.label} active={typeFilter === f.value}
                            onClick={() => { setTypeFilter(f.value); setPage(1); }} />
                    ))}
                </Box>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3, alignItems: 'center' }}>
                    <FormControl size="small" sx={{ minWidth: 140 }}>
                        <InputLabel>Предмет</InputLabel>
                        <Select value={subjectFilter} onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }} label="Предмет"
                            sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                            <MenuItem value="">Все</MenuItem>
                            {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Экзамен</InputLabel>
                        <Select value={examFilter} onChange={(e) => { setExamFilter(e.target.value); setPage(1); }} label="Экзамен"
                            sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                            <MenuItem value="">Все</MenuItem>
                            {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                        </Select>
                    </FormControl>
                    {typeFilter !== 'variants' && subjectFilter && TASK_NUMBERS[subjectFilter] && (
                        <FormControl size="small" sx={{ minWidth: 100 }}>
                            <InputLabel>Номер</InputLabel>
                            <Select value={taskNumber} onChange={(e) => { setTaskNumber(e.target.value); setPage(1); }} label="Номер"
                                sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                                <MenuItem value="">Любой</MenuItem>
                                {TASK_NUMBERS[subjectFilter].map(n => <MenuItem key={n} value={n}>№{n}</MenuItem>)}
                            </Select>
                        </FormControl>
                    )}
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <InputLabel>Сложность</InputLabel>
                        <Select value={difficultyFilter} onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }} label="Сложность"
                            sx={{ borderRadius: '8px', bgcolor: '#fff' }}>
                            <MenuItem value="">Любая</MenuItem>
                            <MenuItem value="easy">🟢 Лёгкая</MenuItem>
                            <MenuItem value="medium">🟡 Средняя</MenuItem>
                            <MenuItem value="hard">🔴 Сложная</MenuItem>
                        </Select>
                    </FormControl>
                    {(subjectFilter || examFilter || taskNumber || difficultyFilter) && (
                        <StyledButton size="small" onClick={() => { setSubjectFilter(''); setExamFilter(''); setTaskNumber(''); setDifficultyFilter(''); setPage(1); }}
                            startIcon={<ClearIcon />} sx={{ color: '#6B7280' }}>
                            Сбросить
                        </StyledButton>
                    )}
                </Box>

                {/* ========== КАРТОЧКИ ========== */}
                {allMaterials.length === 0 ? (
                    <Paper sx={{ borderRadius: '12px', p: 6, textAlign: 'center', border: '1px solid #F3F4F6', boxShadow: 'none' }}>
                        <AssignmentIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            {searchQuery ? 'Ничего не найдено' : 'Нет материалов'}
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                            {searchQuery ? 'Попробуйте изменить запрос' : 'Создайте задание, добавьте вариант или сгенерируйте через ИИ'}
                        </Typography>
                        {!searchQuery && (
                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                <StyledButton variant="contained" startIcon={<AddIcon />} onClick={() => setManualDialogOpen(true)}
                                    sx={{ bgcolor: '#4F46E5' }}>Создать</StyledButton>
                                <StyledButton variant="outlined" startIcon={<AutoAwesomeIcon />}
                                    onClick={() => setAiDialogOpen(true)}
                                    sx={{ color: '#7C3AED', borderColor: '#C4B5FD' }}>ИИ-генерация</StyledButton>
                            </Box>
                        )}
                    </Paper>
                ) : (
                    <>
                        <Grid container spacing={2}>
                            {currentMaterials.map(item => (
                                <Grid item xs={12} sm={6} md={4} key={`${item.materialType}-${item.id}`}>
                                    <MaterialCard>
                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                            {/* Тип материала */}
                                            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, flexWrap: 'wrap' }}>
                                                <Chip
                                                    label={item.materialType === 'task' ? '📝 Задание' : item.materialType === 'variant' ? '🔗 Вариант' : '📋 План'}
                                                    size="small"
                                                    sx={{ borderRadius: '100px', fontSize: '11px', fontWeight: 500,
                                                        bgcolor: item.materialType === 'task' ? '#EEF2FF' : item.materialType === 'variant' ? '#ECFDF5' : '#FFFBEB',
                                                        color: item.materialType === 'task' ? '#4F46E5' : item.materialType === 'variant' ? '#065F46' : '#92400E',
                                                    }}
                                                />
                                                {item.materialType === 'task' && (
                                                    <Chip label={getSourceLabel(item.source)} size="small"
                                                        sx={{ bgcolor: getSourceColor(item.source) + '20', color: getSourceColor(item.source), borderRadius: '100px', fontSize: '11px', fontWeight: 500 }} />
                                                )}
                                                {item.subject && <Chip label={item.subject} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} />}
                                                {item.examType && <Chip label={item.examType} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} />}
                                            </Box>

                                            {/* Заголовок */}
                                            <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937', mb: 1 }}>
                                                {item.topic || item.title || item.name || 'Без названия'}
                                            </Typography>

                                            {/* Описание */}
                                            <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 1.5, lineHeight: 1.5,
                                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                                            }}>
                                                {item.description || item.question || item.url || 'Нет описания'}
                                            </Typography>

                                            {/* Доп. информация */}
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                {item.difficulty && <Chip label={`Сложность: ${item.difficulty}`} size="small" variant="outlined" sx={{ fontSize: '10px' }} />}
                                                {item.durationMinutes && <Chip label={`${item.durationMinutes} мин`} size="small" variant="outlined" sx={{ fontSize: '10px' }} />}
                                            </Box>
                                        </CardContent>

                                        <Divider sx={{ borderColor: '#F3F4F6' }} />
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1.5 }}>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                {item.materialType === 'variant' && (
                                                    <>
                                                        <Tooltip title="Открыть"><IconButton size="small" href={item.url} target="_blank" sx={{ color: '#6B7280' }}><OpenInNewIcon fontSize="small" /></IconButton></Tooltip>
                                                        <Tooltip title="Копировать"><IconButton size="small" onClick={() => { navigator.clipboard.writeText(item.url); alert('Скопировано!'); }} sx={{ color: '#6B7280' }}><CopyIcon fontSize="small" /></IconButton></Tooltip>
                                                    </>
                                                )}
                                            </Box>
                                            <StyledButton variant="contained" size="small" onClick={() => handleOpenAssign(item)}
                                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontSize: '12px' }}>
                                                Назначить
                                            </StyledButton>
                                        </Box>
                                    </MaterialCard>
                                </Grid>
                            ))}
                        </Grid>
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} size="small"
                                    sx={{ '& .MuiPaginationItem-root': { borderRadius: '8px' }, '& .Mui-selected': { backgroundColor: '#4F46E5 !important', color: '#fff' } }} />
                            </Box>
                        )}
                    </>
                )}

                {/* ========== ДИАЛОГ НАЗНАЧЕНИЯ ========== */}
                <StyledDialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>Назначить ученику</DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                                    {selectedMaterial?.topic || selectedMaterial?.title || selectedMaterial?.question?.substring(0, 100) || 'Материал'}
                                </Typography>
                            </Paper>
                            <FormControl fullWidth>
                                <InputLabel>Ученик</InputLabel>
                                <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} label="Ученик"
                                    sx={{ borderRadius: '8px' }}>
                                    {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <DatePicker label="Срок выполнения" value={dueDate} onChange={setDueDate} minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, sx: { '& .MuiOutlinedInput-root': { borderRadius: '8px' } } } }} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setAssignDialogOpen(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton variant="contained" onClick={handleAssign} disabled={!selectedStudentId || assigning}
                            sx={{ bgcolor: '#4F46E5' }}>{assigning ? '...' : 'Назначить'}</StyledButton>
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ ИИ ========== */}
                <StyledDialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                        <AutoAwesomeIcon sx={{ mr: 1, color: '#8B5CF6', verticalAlign: 'middle' }} />
                        ИИ-генерация задания
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Stack spacing={2.5} sx={{ pt: 1 }}>
                            <FormControl fullWidth>
                                <InputLabel>Тип задания</InputLabel>
                                <Select value={aiTaskType} onChange={(e) => setAiTaskType(e.target.value)} label="Тип задания" sx={{ borderRadius: '8px' }}>
                                    <MenuItem value="">— Выберите —</MenuItem>
                                    <MenuItem value="custom">✏️ Свой промт</MenuItem>
                                    <Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600 }}>💻 Информатика</MenuItem>
                                    {TASK_NUMBERS['Информатика']?.map(n => (
                                        <MenuItem key={n} value={`информатика задание ${n}`}>Задание {n}</MenuItem>
                                    ))}
                                    <Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600 }}>📐 Математика</MenuItem>
                                    {TASK_NUMBERS['Математика']?.map(n => (
                                        <MenuItem key={n} value={`математика задание ${n}`}>Задание {n}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            {aiTaskType === 'custom' && (
                                <TextField label="Опишите задание" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                                    fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            )}
                            <FormControl fullWidth><InputLabel>Предмет</InputLabel>
                                <Select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)} sx={{ borderRadius: '8px' }}>
                                    {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth><InputLabel>Экзамен</InputLabel>
                                <Select value={aiExamType} onChange={(e) => setAiExamType(e.target.value)} sx={{ borderRadius: '8px' }}>
                                    {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                </Select>
                            </FormControl>
                            {generating && <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}><CircularProgress sx={{ color: '#4F46E5' }} /><Typography sx={{ ml: 2 }}>Генерирую...</Typography></Box>}
                            {generatedTask && (
                                <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                                    <Typography sx={{ fontWeight: 600, mb: 1, color: '#7C3AED' }}>✨ Результат:</Typography>
                                    <Typography sx={{ fontSize: '14px', mb: 1 }}><strong>Задание:</strong> {generatedTask.question}</Typography>
                                    <Typography sx={{ fontSize: '14px' }}><strong>Ответ:</strong> {generatedTask.answer}</Typography>
                                </Paper>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setAiDialogOpen(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        {!generatedTask ? (
                            <StyledButton variant="contained" onClick={handleGenerate} disabled={(!aiTaskType && !aiPrompt) || generating}
                                startIcon={<AutoAwesomeIcon />} sx={{ bgcolor: '#8B5CF6' }}>
                                {generating ? '...' : 'Сгенерировать'}
                            </StyledButton>
                        ) : (
                            <StyledButton variant="contained" onClick={handleSaveGenerated} sx={{ bgcolor: '#10B981' }}>
                                Сохранить
                            </StyledButton>
                        )}
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ ВАРИАНТА ========== */}
                <StyledDialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>Добавить вариант</DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField label="Название" value={variantForm.title} onChange={(e) => setVariantForm({...variantForm, title: e.target.value})} fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField label="Ссылка" value={variantForm.url} onChange={(e) => setVariantForm({...variantForm, url: e.target.value})} fullWidth required placeholder="https://kege.ru/..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <FormControl fullWidth><InputLabel>Предмет</InputLabel>
                                <Select value={variantForm.subject} onChange={(e) => setVariantForm({...variantForm, subject: e.target.value})} sx={{ borderRadius: '8px' }}>
                                    {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <FormControl fullWidth><InputLabel>Экзамен</InputLabel>
                                <Select value={variantForm.examType} onChange={(e) => setVariantForm({...variantForm, examType: e.target.value})} sx={{ borderRadius: '8px' }}>
                                    {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setVariantDialogOpen(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton variant="contained" onClick={handleSaveVariant} disabled={savingVariant} sx={{ bgcolor: '#4F46E5' }}>Добавить</StyledButton>
                    </DialogActions>
                </StyledDialog>

                {/* ========== ДИАЛОГ РУЧНОГО СОЗДАНИЯ ========== */}
                <StyledDialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>Создать задание</DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField label="Текст задания" value={manualForm.question} onChange={(e) => setManualForm({...manualForm, question: e.target.value})} fullWidth multiline rows={4} required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField label="Правильный ответ" value={manualForm.answer} onChange={(e) => setManualForm({...manualForm, answer: e.target.value})} fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField label="Тема" value={manualForm.topic} onChange={(e) => setManualForm({...manualForm, topic: e.target.value})} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                            <TextField label="Пояснение" value={manualForm.explanation} onChange={(e) => setManualForm({...manualForm, explanation: e.target.value})} fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setManualDialogOpen(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton variant="contained" onClick={handleSaveManual} disabled={savingManual} sx={{ bgcolor: '#4F46E5' }}>Сохранить</StyledButton>
                    </DialogActions>
                </StyledDialog>
            </PageContainer>
        </LocalizationProvider>
    );
}

export default TaskBank;