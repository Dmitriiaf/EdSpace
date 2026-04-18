// ========== frontend/src/pages/TaskBank.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
// ✅ Заменяем axios на axiosInstance
import axiosInstance from '../services/api';
import {
    Box, Typography, Paper, Button, Grid, Card, CardContent,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    Tabs, Tab, IconButton, Tooltip, Dialog,
    DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Stack,
    Avatar, Divider, Pagination, Link,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, LinearProgress
} from '@mui/material';
import {
    Search as SearchIcon,
    School as SchoolIcon,
    Refresh as RefreshIcon,
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
    Sync as SyncIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

function TaskBank() {
    const { user } = useAuth();
    const [mainTabValue, setMainTabValue] = useState(0);
    
    // Задания
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [selectedExamType, setSelectedExamType] = useState('');
    const [page, setPage] = useState(1);
    const [tasksPerPage] = useState(9);
    const [error, setError] = useState(null);
    
    // Ручное создание задания
    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [manualForm, setManualForm] = useState({
        question: '', answer: '', explanation: '', topic: '', difficulty: 3, maxScore: 1
    });
    const [savingManual, setSavingManual] = useState(false);
    
    // Варианты
    const [variants, setVariants] = useState([]);
    const [filteredVariants, setFilteredVariants] = useState([]);
    const [variantSearchQuery, setVariantSearchQuery] = useState('');
    const [variantSubject, setVariantSubject] = useState('');
    const [variantExamType, setVariantExamType] = useState('');
    const [variantPage, setVariantPage] = useState(1);
    const [variantsPerPage] = useState(6);
    const [variantLoading, setVariantLoading] = useState(false);
    
    // Stepik
    const [stepikConnected, setStepikConnected] = useState(false);
    const [stepikCourses, setStepikCourses] = useState([]);
    const [stepikLoading, setStepikLoading] = useState(false);
    const STEPIK_CLIENT_ID = 'h0HezWworAZiYKIhIWJEEvXSLBP62Gl1RXgRN3CP';
    const REDIRECT_URI = 'http://localhost:3000/stepik/callback';
    
    // Stepik — внутренние вкладки
    const [stepikTabValue, setStepikTabValue] = useState(1);
    const [stepikSearchQuery, setStepikSearchQuery] = useState('');
    const [stepikCatalogCourses, setStepikCatalogCourses] = useState([]);
    const [stepikCatalogPage, setStepikCatalogPage] = useState(1);
    const [stepikCatalogHasMore, setStepikCatalogHasMore] = useState(false);
    const [stepikCatalogSearching, setStepikCatalogSearching] = useState(false);
    const [stepikAssignments, setStepikAssignments] = useState([]);
    const [stepikSyncing, setStepikSyncing] = useState(false);
    const [stepikAssignDialogOpen, setStepikAssignDialogOpen] = useState(false);
    const [stepikSelectedCourse, setStepikSelectedCourse] = useState(null);
    const [stepikSelectedStudentId, setStepikSelectedStudentId] = useState('');
    const [stepikAssigning, setStepikAssigning] = useState(false);
    
    // Планы уроков
    const [plans, setPlans] = useState([]);
    const [filteredPlans, setFilteredPlans] = useState([]);
    const [planSearchQuery, setPlanSearchQuery] = useState('');
    const [planLoading, setPlanLoading] = useState(false);
    const [planDialogOpen, setPlanDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState(null);
    const [planForm, setPlanForm] = useState({
        title: '', topic: '', description: '', learningObjectives: '',
        materialsNeeded: '', lessonStructure: '', homeworkTemplate: '',
        durationMinutes: 60, difficultyLevel: 3, tags: '', courseId: ''
    });
    const [savingPlan, setSavingPlan] = useState(false);
    const [courses, setCourses] = useState([]);
    
    // Диалог варианта
    const [variantDialogOpen, setVariantDialogOpen] = useState(false);
    const [editingVariant, setEditingVariant] = useState(null);
    const [variantForm, setVariantForm] = useState({
        title: '', url: '', description: '', subject: '', examType: '', courseId: ''
    });
    const [savingVariant, setSavingVariant] = useState(false);
    
    // ИИ-генерация
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [aiTaskType, setAiTaskType] = useState('');
    const [aiDifficulty, setAiDifficulty] = useState('medium');
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiSubject, setAiSubject] = useState('Информатика');
    const [aiExamType, setAiExamType] = useState('ЕГЭ');
    const [generating, setGenerating] = useState(false);
    const [generatedTask, setGeneratedTask] = useState(null);
    
    // Назначение
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [students, setStudents] = useState([]);
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [dueDate, setDueDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    const [assigning, setAssigning] = useState(false);
    
    const [subjects] = useState(['Информатика', 'Математика', 'Русский язык', 'Физика']);
    const [examTypes] = useState(['ЕГЭ', 'ОГЭ']);

    useEffect(() => {
        if (user && user.id) {
            fetchTasks();
            fetchVariants();
            fetchStepikStatus();
            fetchPlans();
            fetchStudents();
            fetchCourses();
        }
    }, [user]);

    useEffect(() => {
        filterTasks();
    }, [tasks, searchQuery, selectedSubject, selectedExamType]);

    useEffect(() => {
        filterVariants();
    }, [variants, variantSearchQuery, variantSubject, variantExamType]);

    useEffect(() => {
        filterPlans();
    }, [plans, planSearchQuery]);

    useEffect(() => {
        if (mainTabValue === 2 && stepikConnected) {
            fetchStepikCatalog();
            fetchStepikAssignments();
            fetchStepikCourses();
        }
    }, [mainTabValue, stepikConnected]);

    useEffect(() => {
        if (mainTabValue === 2 && stepikConnected) {
            if (stepikTabValue === 1) {
                fetchStepikCatalog();
            }
            if (stepikTabValue === 2) {
                fetchStepikAssignments();
            }
        }
    }, [stepikTabValue]);

    // ========== ЗАДАНИЯ ==========
    const fetchTasks = async () => {
        if (!user || !user.id) return;
        setLoading(true);
        try {
            const response = await axiosInstance.get('/integration/tasks/search');
            setTasks(response.data || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки заданий:', err);
        } finally {
            setLoading(false);
        }
    };

    const filterTasks = () => {
        let filtered = [...tasks];
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(t => 
                t.question?.toLowerCase().includes(query) ||
                t.topic?.toLowerCase().includes(query) ||
                t.tags?.toLowerCase().includes(query)
            );
        }
        if (selectedSubject) filtered = filtered.filter(t => t.subject === selectedSubject);
        if (selectedExamType) filtered = filtered.filter(t => t.examType === selectedExamType);
        setFilteredTasks(filtered);
        setPage(1);
    };

    const handleOpenManualDialog = () => {
        setManualForm({ question: '', answer: '', explanation: '', topic: '', difficulty: 3, maxScore: 1 });
        setManualDialogOpen(true);
    };

    const handleSaveManualTask = async () => {
        if (!manualForm.question || !manualForm.answer) {
            alert('Заполните задание и ответ');
            return;
        }
        setSavingManual(true);
        try {
            const taskData = {
                ...manualForm,
                source: 'MANUAL',
                subject: subjects[0],
                examType: examTypes[0],
                type: 'problem'
            };
            await axiosInstance.post('/integration/tasks', taskData);
            alert('✅ Задание сохранено!');
            setManualDialogOpen(false);
            fetchTasks();
        } catch (err) {
            alert('Ошибка сохранения');
        } finally {
            setSavingManual(false);
        }
    };

    // ========== ИИ-ГЕНЕРАЦИЯ ==========
    const buildPromptFromOptions = () => {
        if (aiTaskType === 'custom') return aiPrompt;
        
        const taskNames = {
            'math_13': '13 задание ЕГЭ математика профиль стереометрия',
            'math_15': '15 задание ЕГЭ математика профиль неравенство',
            'math_16': '16 задание ЕГЭ математика профиль планиметрия',
            'math_17': '17 задание ЕГЭ математика профиль финансовая задача',
            'math_18': '18 задание ЕГЭ математика профиль задача с параметром',
            'inf_15': '15 задание ЕГЭ информатика на отрезки и множества',
            'inf_16': '16 задание ЕГЭ информатика на рекурсию',
            'inf_17': '17 задание ЕГЭ информатика динамическое программирование',
            'inf_24': '24 задание ЕГЭ информатика обработка строк',
            'inf_25': '25 задание ЕГЭ информатика обработка чисел',
            'inf_26': '26 задание ЕГЭ информатика обработка массива',
            'inf_27': '27 задание ЕГЭ информатика сложный алгоритм',
            'rus_8': '8 задание ЕГЭ русский язык грамматические ошибки',
            'rus_16': '16 задание ЕГЭ русский язык пунктуация в сложном предложении',
            'rus_21': '21 задание ЕГЭ русский язык пунктуационный анализ',
            'rus_26': '26 задание ЕГЭ русский язык средства выразительности',
            'rus_27': '27 задание ЕГЭ русский язык сочинение',
            'phys_22': '22 задание ЕГЭ физика механика',
            'phys_23': '23 задание ЕГЭ физика молекулярная физика',
            'phys_24': '24 задание ЕГЭ физика электростатика',
            'phys_25': '25 задание ЕГЭ физика электродинамика',
            'phys_26': '26 задание ЕГЭ физика квантовая физика'
        };
        
        let prompt = taskNames[aiTaskType] || aiTaskType;
        if (aiDifficulty === 'easy') prompt += ' простое типовое';
        if (aiDifficulty === 'hard') prompt += ' сложное со звёздочкой';
        if (aiPrompt) prompt += ' ' + aiPrompt;
        return prompt;
    };

    const handleGenerateWithOptions = async () => {
        const finalPrompt = buildPromptFromOptions();
        if (!finalPrompt.trim()) {
            alert('Выберите тип задания или введите свой промт');
            return;
        }
        setGenerating(true);
        setGeneratedTask(null);
        try {
            const response = await axiosInstance.post('/ai/generate', {
                prompt: finalPrompt,
                subject: aiSubject,
                examType: aiExamType
            });
            setGeneratedTask(response.data);
        } catch (err) {
            alert('Ошибка генерации: ' + (err.response?.data?.error || 'Попробуйте позже'));
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveGenerated = async () => {
        if (!generatedTask) return;
        try {
            await axiosInstance.post('/ai/save', generatedTask);
            alert('✅ Задание сохранено в банк!');
            setAiDialogOpen(false);
            setGeneratedTask(null);
            setAiPrompt('');
            setAiTaskType('');
            fetchTasks();
        } catch (err) {
            alert('Ошибка сохранения: ' + (err.response?.data?.error || 'Попробуйте позже'));
        }
    };

    // ========== ВАРИАНТЫ ==========
    const fetchVariants = async () => {
        if (!user || !user.id) return;
        setVariantLoading(true);
        try {
            const response = await axiosInstance.get('/variants');
            setVariants(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки вариантов:', err);
        } finally {
            setVariantLoading(false);
        }
    };

    const filterVariants = () => {
        let filtered = [...variants];
        if (variantSearchQuery) {
            const query = variantSearchQuery.toLowerCase();
            filtered = filtered.filter(v => 
                v.title?.toLowerCase().includes(query) ||
                v.description?.toLowerCase().includes(query)
            );
        }
        if (variantSubject) filtered = filtered.filter(v => v.subject === variantSubject);
        if (variantExamType) filtered = filtered.filter(v => v.examType === variantExamType);
        setFilteredVariants(filtered);
        setVariantPage(1);
    };

    const handleOpenVariantDialog = (variant = null) => {
        if (variant) {
            setEditingVariant(variant);
            setVariantForm({
                title: variant.title || '',
                url: variant.url || '',
                description: variant.description || '',
                subject: variant.subject || '',
                examType: variant.examType || '',
                courseId: variant.course?.id || ''
            });
        } else {
            setEditingVariant(null);
            setVariantForm({ title: '', url: '', description: '', subject: '', examType: '', courseId: '' });
        }
        setVariantDialogOpen(true);
    };

    const handleSaveVariant = async () => {
        if (!variantForm.title || !variantForm.url) {
            alert('Заполните название и ссылку');
            return;
        }
        setSavingVariant(true);
        try {
            if (editingVariant) {
                await axiosInstance.put(`/variants/${editingVariant.id}`, variantForm);
            } else {
                await axiosInstance.post('/variants', variantForm);
            }
            setVariantDialogOpen(false);
            fetchVariants();
        } catch (err) {
            alert('Ошибка сохранения');
        } finally {
            setSavingVariant(false);
        }
    };

    const handleDeleteVariant = async (id) => {
        if (!window.confirm('Удалить вариант?')) return;
        try {
            await axiosInstance.delete(`/variants/${id}`);
            fetchVariants();
        } catch (err) {}
    };

    // ========== STEPIK ==========
    const fetchStepikStatus = async () => {
        if (!user || !user.id) return;
        try {
            const response = await axiosInstance.get('/stepik/status');
            setStepikConnected(response.data.connected);
            if (response.data.connected) {
                fetchStepikCourses();
            }
        } catch (err) {}
    };

    const fetchStepikCourses = async () => {
        if (!user || !user.id) return;
        setStepikLoading(true);
        try {
            const response = await axiosInstance.get('/stepik/my-courses');
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            setStepikCourses(data.courses || []);
        } catch (err) {
            console.error('Ошибка загрузки курсов Stepik:', err);
        } finally {
            setStepikLoading(false);
        }
    };

    const handleConnectStepik = () => {
        const authUrl = `https://stepik.org/oauth2/authorize/?response_type=code&client_id=${STEPIK_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
        window.location.href = authUrl;
    };

    // ========== STEPIK — ВНУТРЕННИЕ ВКЛАДКИ ==========
    const fetchStepikCatalog = async () => {
        if (!user || !user.id) return;
        setStepikCatalogSearching(true);
        try {
            const response = await axiosInstance.get('/stepik/courses/featured');
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            setStepikCatalogCourses(data.courses || []);
            setStepikCatalogHasMore(data.meta?.has_next || false);
        } catch (err) {
            console.error('Ошибка загрузки каталога Stepik:', err);
        } finally {
            setStepikCatalogSearching(false);
        }
    };

    const searchStepikCourses = async (reset = true) => {
        if (!stepikSearchQuery.trim()) {
            fetchStepikCatalog();
            return;
        }
        setStepikCatalogSearching(true);
        try {
            const response = await axiosInstance.get('/stepik/courses/search', {
                params: { query: stepikSearchQuery, page: reset ? 1 : stepikCatalogPage }
            });
            const data = typeof response.data === 'string' ? JSON.parse(response.data) : response.data;
            const newCourses = data.courses || [];
            if (reset) {
                setStepikCatalogCourses(newCourses);
                setStepikCatalogPage(1);
            } else {
                setStepikCatalogCourses(prev => [...prev, ...newCourses]);
            }
            setStepikCatalogHasMore(data.meta?.has_next || false);
            setStepikCatalogPage(prev => reset ? 1 : prev + 1);
        } catch (err) {
            console.error('Ошибка поиска курсов Stepik:', err);
        } finally {
            setStepikCatalogSearching(false);
        }
    };

    const fetchStepikAssignments = async () => {
        if (!user || !user.id) return;
        try {
            const response = await axiosInstance.get('/stepik/assignments');
            setStepikAssignments(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки назначенных курсов:', err);
        }
    };

    const handleStepikSync = async () => {
        setStepikSyncing(true);
        try {
            const response = await axiosInstance.post('/stepik/sync-progress', {});
            alert(`✅ Прогресс синхронизирован! Обновлено ${response.data.updated} из ${response.data.total} курсов.`);
            fetchStepikAssignments();
        } catch (err) {
            alert('Ошибка синхронизации: ' + (err.response?.data?.error || 'Не удалось синхронизировать'));
        } finally {
            setStepikSyncing(false);
        }
    };

    const handleStepikViewCourse = (course) => {
        setStepikSelectedCourse(course);
        setStepikSelectedStudentId('');
        setStepikAssignDialogOpen(true);
    };

    const handleStepikAssignCourse = async () => {
        if (!stepikSelectedStudentId) {
            alert('Выберите ученика');
            return;
        }
        setStepikAssigning(true);
        try {
            await axiosInstance.post('/stepik/assign', {
                studentId: stepikSelectedStudentId,
                courseId: stepikSelectedCourse.id,
                courseTitle: stepikSelectedCourse.title
            });
            alert('✅ Курс успешно назначен ученику!');
            setStepikAssignDialogOpen(false);
            setStepikSelectedStudentId('');
            setStepikSelectedCourse(null);
            fetchStepikAssignments();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось назначить курс'));
        } finally {
            setStepikAssigning(false);
        }
    };

    const getStepikStatusChip = (status, progress) => {
        if (status === 'completed' || progress >= 100) {
            return <Chip label="Завершён" color="success" size="small" icon={<CheckCircleIcon />} />;
        }
        if (status === 'in_progress' || progress > 0) {
            return <Chip label="В процессе" color="warning" size="small" />;
        }
        return <Chip label="Назначен" color="default" size="small" />;
    };

    // ========== ПЛАНЫ УРОКОВ ==========
    const fetchPlans = async () => {
        if (!user || !user.id) return;
        setPlanLoading(true);
        try {
            const response = await axiosInstance.get('/lesson-plans');
            setPlans(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки планов:', err);
        } finally {
            setPlanLoading(false);
        }
    };

    const filterPlans = () => {
        let filtered = [...plans];
        if (planSearchQuery) {
            const query = planSearchQuery.toLowerCase();
            filtered = filtered.filter(p => 
                p.title?.toLowerCase().includes(query) ||
                p.topic?.toLowerCase().includes(query) ||
                p.tags?.toLowerCase().includes(query)
            );
        }
        setFilteredPlans(filtered);
    };

    const fetchCourses = async () => {
        if (!user || !user.id) return;
        try {
            const response = await axiosInstance.get(`/courses/tutor/${user.id}`);
            setCourses(response.data || []);
        } catch (err) {}
    };

    const handleOpenPlanDialog = (plan = null) => {
        if (plan) {
            setEditingPlan(plan);
            setPlanForm({
                title: plan.title || '',
                topic: plan.topic || '',
                description: plan.description || '',
                learningObjectives: plan.learningObjectives || '',
                materialsNeeded: plan.materialsNeeded || '',
                lessonStructure: plan.lessonStructure || '',
                homeworkTemplate: plan.homeworkTemplate || '',
                durationMinutes: plan.durationMinutes || 60,
                difficultyLevel: plan.difficultyLevel || 3,
                tags: plan.tags || '',
                courseId: plan.course?.id || ''
            });
        } else {
            setEditingPlan(null);
            setPlanForm({
                title: '', topic: '', description: '', learningObjectives: '',
                materialsNeeded: '', lessonStructure: '', homeworkTemplate: '',
                durationMinutes: 60, difficultyLevel: 3, tags: '', courseId: ''
            });
        }
        setPlanDialogOpen(true);
    };

    const handleSavePlan = async () => {
        if (!planForm.title || !planForm.topic) {
            alert('Заполните название и тему');
            return;
        }
        setSavingPlan(true);
        try {
            if (editingPlan) {
                await axiosInstance.put(`/lesson-plans/${editingPlan.id}`, planForm);
            } else {
                await axiosInstance.post('/lesson-plans', planForm);
            }
            setPlanDialogOpen(false);
            fetchPlans();
        } catch (err) {
            alert('Ошибка сохранения');
        } finally {
            setSavingPlan(false);
        }
    };

    const handleDeletePlan = async (id) => {
        if (!window.confirm('Удалить план?')) return;
        try {
            await axiosInstance.delete(`/lesson-plans/${id}`);
            fetchPlans();
        } catch (err) {}
    };

    // ========== ОБЩИЕ ==========
    const fetchStudents = async () => {
        if (!user || !user.id) return;
        try {
            const response = await axiosInstance.get(`/students/tutor/${user.id}`);
            setStudents(response.data || []);
        } catch (err) {}
    };

    const handleOpenAssignDialog = (task = null, variant = null, plan = null) => {
        setSelectedTask(task);
        setSelectedVariant(variant);
        setSelectedPlan(plan);
        setSelectedStudentId('');
        setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
        setAssignDialogOpen(true);
    };

    const handleAssignHomework = async () => {
        if (!selectedStudentId) { 
            alert('Выберите ученика'); 
            return; 
        }
        setAssigning(true);
        try {
            const formattedDueDate = dueDate.toISOString().split('.')[0];
            
            if (selectedTask) {
                await axiosInstance.post('/integration/create-homework-from-task', {
                    taskId: selectedTask.id, studentId: selectedStudentId, dueDate: formattedDueDate
                });
                alert('✅ Задание назначено!');
            } else if (selectedVariant) {
                await axiosInstance.post(`/variants/${selectedVariant.id}/assign`, {
                    studentId: selectedStudentId, dueDate: formattedDueDate
                });
                alert('✅ Вариант назначен!');
            } else if (selectedPlan) {
                const homeworkText = selectedPlan.homeworkTemplate || `Домашнее задание по теме: ${selectedPlan.topic}`;
                await axiosInstance.post('/homework', {
                    tutorId: user.id, studentId: selectedStudentId, task: homeworkText,
                    dueDate: formattedDueDate, status: 'assigned'
                });
                alert('✅ Задание из плана назначено!');
            }
            setAssignDialogOpen(false);
            setSelectedTask(null);
            setSelectedVariant(null);
            setSelectedPlan(null);
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось назначить'));
        } finally {
            setAssigning(false);
        }
    };

    const getDifficultyLabel = (level) => {
        const labels = ['', 'Очень лёгкий', 'Лёгкий', 'Средний', 'Сложный', 'Очень сложный'];
        return (level >= 1 && level <= 5) ? labels[level] : 'Средний';
    };

    const getDifficultyColor = (level) => {
        const colors = ['', 'success', 'success', 'warning', 'error', 'error'];
        return (level >= 1 && level <= 5) ? colors[level] : 'warning';
    };

    const getSourceColor = (source) => {
        switch(source) {
            case 'AI_GENERATED': return '#8B5CF6';
            case 'MANUAL': return '#10B981';
            default: return '#6B7280';
        }
    };

    const getSourceLabel = (source) => {
        switch(source) {
            case 'AI_GENERATED': return '🤖 ИИ';
            case 'MANUAL': return '📝 Своё';
            default: return source;
        }
    };

    const indexOfLastTask = page * tasksPerPage;
    const indexOfFirstTask = indexOfLastTask - tasksPerPage;
    const currentTasks = filteredTasks.slice(indexOfFirstTask, indexOfLastTask);
    const totalPages = Math.ceil(filteredTasks.length / tasksPerPage);

    const indexOfLastVariant = variantPage * variantsPerPage;
    const indexOfFirstVariant = indexOfLastVariant - variantsPerPage;
    const currentVariants = filteredVariants.slice(indexOfFirstVariant, indexOfLastVariant);
    const totalVariantPages = Math.ceil(filteredVariants.length / variantsPerPage);

    // ========== КОМПОНЕНТ С ПОДВКЛАДКАМИ STEPIK ==========
    const StepikConnectedContent = () => (
        <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ color: '#6366F1' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Stepik
                    </Typography>
                    <Chip 
                        icon={<CheckCircleIcon />}
                        label="Подключено"
                        color="success"
                        size="small"
                        variant="outlined"
                    />
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<SyncIcon />}
                        onClick={handleStepikSync}
                        disabled={stepikSyncing}
                    >
                        {stepikSyncing ? 'Синхронизация...' : 'Синхронизировать'}
                    </Button>
                    <Button
                        variant="outlined"
                        size="small"
                        startIcon={<RefreshIcon />}
                        onClick={() => {
                            if (stepikTabValue === 0) fetchStepikCourses();
                            else if (stepikTabValue === 1) fetchStepikCatalog();
                            else fetchStepikAssignments();
                        }}
                    >
                        Обновить
                    </Button>
                </Box>
            </Box>

            <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
                <Tabs 
                    value={stepikTabValue} 
                    onChange={(e, v) => setStepikTabValue(v)}
                    sx={{ 
                        borderBottom: 1, 
                        borderColor: 'divider',
                        '& .MuiTab-root': { textTransform: 'none', fontWeight: 500 }
                    }}
                >
                    <Tab label="Мои курсы" />
                    <Tab label="Каталог курсов" />
                    <Tab label="Назначенные" />
                </Tabs>
            </Paper>

            {/* Мои курсы */}
            {stepikTabValue === 0 && (
                <Box>
                    {stepikLoading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : stepikCourses.length === 0 ? (
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
                            {stepikCourses.map(course => (
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
                                                    onClick={() => handleStepikViewCourse(course)}
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

            {/* Каталог курсов */}
            {stepikTabValue === 1 && (
                <Box>
                    <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                        <TextField
                            fullWidth
                            placeholder="Поиск курсов..."
                            size="small"
                            value={stepikSearchQuery}
                            onChange={(e) => setStepikSearchQuery(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && searchStepikCourses(true)}
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
                                            size="small"
                                            onClick={() => searchStepikCourses(true)}
                                            disabled={stepikCatalogSearching}
                                        >
                                            Найти
                                        </Button>
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Paper>

                    {stepikCatalogSearching && stepikCatalogCourses.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : stepikCatalogCourses.length > 0 ? (
                        <>
                            <Grid container spacing={3}>
                                {stepikCatalogCourses.map(course => (
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
                                                            onClick={() => handleStepikViewCourse(course)}
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
                            
                            {stepikCatalogHasMore && (
                                <Box sx={{ textAlign: 'center', mt: 3 }}>
                                    <Button 
                                        variant="outlined" 
                                        onClick={() => searchStepikCourses(false)}
                                        disabled={stepikCatalogSearching}
                                    >
                                        Загрузить ещё
                                    </Button>
                                </Box>
                            )}
                        </>
                    ) : !stepikCatalogSearching && (
                        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                            <Typography variant="body1" color="textSecondary">
                                Нажмите "Найти" для поиска курсов
                            </Typography>
                        </Paper>
                    )}
                </Box>
            )}

            {/* Назначенные курсы */}
            {stepikTabValue === 2 && (
                <Box>
                    {stepikAssignments.length === 0 ? (
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
                                    {stepikAssignments.map((assignment) => (
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
                                                {getStepikStatusChip(assignment.status, assignment.progressPercent)}
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
    );

    if (loading && mainTabValue === 0) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ bgcolor: '#6366F1', width: 56, height: 56 }}>
                            <AssignmentIcon sx={{ fontSize: 32 }} />
                        </Avatar>
                        <Box>
                            <Typography variant="h4" sx={{ fontWeight: 600 }}>Банк материалов</Typography>
                            <Typography variant="body2" color="textSecondary">Задания, варианты, курсы и планы уроков</Typography>
                        </Box>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        {mainTabValue === 0 && (
                            <>
                                <Button variant="outlined" startIcon={<AddIcon />} onClick={handleOpenManualDialog}>
                                    Создать
                                </Button>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<AutoAwesomeIcon />}
                                    onClick={() => {
                                        setAiDialogOpen(true);
                                        setGeneratedTask(null);
                                        setAiPrompt('');
                                        setAiTaskType('');
                                    }}
                                    sx={{ borderColor: '#8B5CF6', color: '#8B5CF6', '&:hover': { borderColor: '#7C3AED', bgcolor: '#F5F3FF' } }}
                                >
                                    ИИ-генерация
                                </Button>
                            </>
                        )}
                        {mainTabValue === 1 && (
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenVariantDialog()}
                                sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}>
                                Добавить вариант
                            </Button>
                        )}
                        {mainTabValue === 3 && (
                            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenPlanDialog()}
                                sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}>
                                Создать план
                            </Button>
                        )}
                        <Button variant="contained" startIcon={<RefreshIcon />} 
                            onClick={mainTabValue === 0 ? fetchTasks : mainTabValue === 1 ? fetchVariants : mainTabValue === 2 ? fetchStepikCourses : fetchPlans}
                            sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}>
                            Обновить
                        </Button>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

                <Paper sx={{ borderRadius: 4, overflow: 'hidden', mb: 3 }}>
                    <Tabs value={mainTabValue} onChange={(e, v) => setMainTabValue(v)} variant="fullWidth"
                        sx={{ borderBottom: 1, borderColor: '#F3F4F6', '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, py: 1.5 } }}>
                        <Tab label="Задания" />
                        <Tab label="Варианты" />
                        <Tab label="Stepik" />
                        <Tab label="Планы уроков" />
                    </Tabs>
                </Paper>

                {/* ========== ВКЛАДКА ЗАДАНИЯ ========== */}
                {mainTabValue === 0 && (
                    <>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <Card sx={{ borderRadius: 3, bgcolor: '#EEF2FF' }}>
                                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#6366F1' }}>{tasks.length}</Typography>
                                        <Typography variant="caption">Всего заданий</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={6}>
                                <Card sx={{ borderRadius: 3, bgcolor: '#EDE9FE' }}>
                                    <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                                        <Typography variant="h5" sx={{ fontWeight: 600, color: '#7C3AED' }}>{tasks.filter(t => t.source === 'AI_GENERATED' || t.source === 'MANUAL').length}</Typography>
                                        <Typography variant="caption">🤖 ИИ / 📝 Свои</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={5}>
                                    <TextField fullWidth placeholder="Поиск..." size="small" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <FormControl fullWidth size="small"><InputLabel>Предмет</InputLabel>
                                        <Select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)} label="Предмет">
                                            <MenuItem value="">Все</MenuItem>{subjects.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <FormControl fullWidth size="small"><InputLabel>Экзамен</InputLabel>
                                        <Select value={selectedExamType} onChange={(e) => setSelectedExamType(e.target.value)} label="Экзамен">
                                            <MenuItem value="">Все</MenuItem>{examTypes.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={1}>
                                    <Button fullWidth variant="outlined" onClick={() => { setSearchQuery(''); setSelectedSubject(''); setSelectedExamType(''); }}>Сбросить</Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {filteredTasks.length === 0 ? (
                            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                <AssignmentIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary">Нет заданий</Typography>
                                <Typography variant="body2" color="textSecondary">Нажмите "Создать" или "ИИ-генерация"</Typography>
                            </Paper>
                        ) : (
                            <>
                                <Grid container spacing={3}>
                                    {currentTasks.map(task => (
                                        <Grid item xs={12} sm={6} md={4} key={task.id}>
                                            <Card sx={{ borderRadius: 3, height: '100%', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } }}>
                                                <CardContent sx={{ flex: 1 }}>
                                                    <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                                        <Chip label={getSourceLabel(task.source)} size="small" sx={{ bgcolor: getSourceColor(task.source) + '20', color: getSourceColor(task.source) }} />
                                                        <Chip label={task.subject} size="small" variant="outlined" />
                                                        {task.examType && <Chip label={task.examType} size="small" variant="outlined" />}
                                                    </Box>
                                                    {task.topic && <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{task.topic}</Typography>}
                                                    <Typography variant="body2" sx={{ mb: 2, color: '#4B5563' }}>{task.question?.length > 150 ? task.question.substring(0, 150) + '...' : task.question}</Typography>
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {task.difficulty && <Chip label={getDifficultyLabel(task.difficulty)} size="small" color={getDifficultyColor(task.difficulty)} />}
                                                        {task.maxScore && <Chip label={`${task.maxScore} балл.`} size="small" variant="outlined" />}
                                                    </Box>
                                                </CardContent>
                                                <Divider />
                                                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1.5 }}>
                                                    <Button size="small" variant="outlined" startIcon={<AssignmentIcon />} onClick={() => handleOpenAssignDialog(task, null, null)}>Назначить</Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                {totalPages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><Pagination count={totalPages} page={page} onChange={(e, v) => setPage(v)} color="primary" /></Box>}
                            </>
                        )}
                    </>
                )}

                {/* ========== ВКЛАДКА ВАРИАНТЫ ========== */}
                {mainTabValue === 1 && (
                    <>
                        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={5}>
                                    <TextField fullWidth placeholder="Поиск по названию..." size="small" value={variantSearchQuery} onChange={(e) => setVariantSearchQuery(e.target.value)}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
                                </Grid>
                                <Grid item xs={6} md={3}>
                                    <FormControl fullWidth size="small"><InputLabel>Предмет</InputLabel>
                                        <Select value={variantSubject} onChange={(e) => setVariantSubject(e.target.value)} label="Предмет">
                                            <MenuItem value="">Все</MenuItem>{subjects.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6} md={2}>
                                    <FormControl fullWidth size="small"><InputLabel>Экзамен</InputLabel>
                                        <Select value={variantExamType} onChange={(e) => setVariantExamType(e.target.value)} label="Экзамен">
                                            <MenuItem value="">Все</MenuItem>{examTypes.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} md={2}>
                                    <Button fullWidth variant="outlined" onClick={() => { setVariantSearchQuery(''); setVariantSubject(''); setVariantExamType(''); }}>Сбросить</Button>
                                </Grid>
                            </Grid>
                        </Paper>

                        {variantLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box> :
                            filteredVariants.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                    <LinkIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary">Нет сохранённых вариантов</Typography>
                                    <Typography variant="body2" color="textSecondary">Нажмите "Добавить вариант"</Typography>
                                </Paper>
                            ) : (
                                <>
                                    <Grid container spacing={3}>
                                        {currentVariants.map(variant => (
                                            <Grid item xs={12} sm={6} md={4} key={variant.id}>
                                                <Card sx={{ borderRadius: 3, height: '100%', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                            <LinkIcon sx={{ color: '#6366F1' }} />
                                                            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>{variant.title}</Typography>
                                                        </Box>
                                                        {variant.description && <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>{variant.description}</Typography>}
                                                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 1.5 }}>
                                                            {variant.subject && <Chip label={variant.subject} size="small" variant="outlined" />}
                                                            {variant.examType && <Chip label={variant.examType} size="small" variant="outlined" />}
                                                        </Stack>
                                                        <Link href={variant.url} target="_blank" underline="hover" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: '#6366F1' }}>
                                                            {variant.url.substring(0, 50)}... <OpenInNewIcon sx={{ fontSize: 14 }} />
                                                        </Link>
                                                    </CardContent>
                                                    <Divider />
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5 }}>
                                                        <Box>
                                                            <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenVariantDialog(variant)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Копировать ссылку"><IconButton size="small" onClick={() => { navigator.clipboard.writeText(variant.url); alert('Ссылка скопирована!'); }}><CopyIcon fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Удалить"><IconButton size="small" color="error" onClick={() => handleDeleteVariant(variant.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                                        </Box>
                                                        <Button size="small" variant="contained" onClick={() => handleOpenAssignDialog(null, variant, null)} sx={{ bgcolor: '#8B5CF6' }}>Назначить</Button>
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                    {totalVariantPages > 1 && <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><Pagination count={totalVariantPages} page={variantPage} onChange={(e, v) => setVariantPage(v)} color="primary" /></Box>}
                                </>
                            )}
                    </>
                )}

                {/* ========== ВКЛАДКА STEPIK ========== */}
                {mainTabValue === 2 && (
                    <Box>
                        {!stepikConnected ? (
                            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                <SchoolIcon sx={{ fontSize: 80, color: '#E5E7EB', mb: 2 }} />
                                <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
                                    Подключите Stepik
                                </Typography>
                                <Typography variant="body1" color="textSecondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                                    После подключения вы сможете назначать ученикам курсы и задания с платформы Stepik.
                                </Typography>
                                <Button 
                                    variant="contained" 
                                    size="large"
                                    onClick={handleConnectStepik}
                                    sx={{ bgcolor: '#6366F1', '&:hover': { bgcolor: '#4F46E5' } }}
                                >
                                    Подключить Stepik
                                </Button>
                            </Paper>
                        ) : (
                            <StepikConnectedContent />
                        )}
                    </Box>
                )}

                {/* ========== ВКЛАДКА ПЛАНЫ УРОКОВ ========== */}
                {mainTabValue === 3 && (
                    <>
                        <Paper sx={{ p: 2, mb: 3, borderRadius: 3 }}>
                            <TextField fullWidth placeholder="Поиск по названию или теме..." size="small" value={planSearchQuery} onChange={(e) => setPlanSearchQuery(e.target.value)}
                                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>, endAdornment: planSearchQuery && (
                                    <InputAdornment position="end"><IconButton size="small" onClick={() => setPlanSearchQuery('')}><SearchIcon /></IconButton></InputAdornment>
                                )}} />
                        </Paper>

                        {planLoading ? <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box> :
                            filteredPlans.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4 }}>
                                    <MenuBookIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary">Нет планов уроков</Typography>
                                    <Typography variant="body2" color="textSecondary">Нажмите "Создать план"</Typography>
                                </Paper>
                            ) : (
                                <Grid container spacing={3}>
                                    {filteredPlans.map(plan => (
                                        <Grid item xs={12} sm={6} md={4} key={plan.id}>
                                            <Card sx={{ borderRadius: 3, height: '100%', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                                        <MenuBookIcon sx={{ color: '#8B5CF6' }} />
                                                        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>{plan.title}</Typography>
                                                    </Box>
                                                    <Chip label={plan.topic} size="small" variant="outlined" sx={{ mb: 1 }} />
                                                    {plan.description && <Typography variant="body2" color="textSecondary" sx={{ mb: 1.5 }}>{plan.description.substring(0, 100)}...</Typography>}
                                                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                                        <Chip label={`${plan.durationMinutes || 60} мин`} size="small" variant="outlined" />
                                                        <Chip label={getDifficultyLabel(plan.difficultyLevel)} size="small" color={getDifficultyColor(plan.difficultyLevel)} />
                                                    </Stack>
                                                </CardContent>
                                                <Divider />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5 }}>
                                                    <Box>
                                                        <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenPlanDialog(plan)}><EditIcon fontSize="small" /></IconButton></Tooltip>
                                                        <Tooltip title="Удалить"><IconButton size="small" color="error" onClick={() => handleDeletePlan(plan.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                                                    </Box>
                                                    <Button size="small" variant="contained" onClick={() => handleOpenAssignDialog(null, null, plan)} sx={{ bgcolor: '#8B5CF6' }}>Назначить</Button>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                    </>
                )}
            </Box>

            {/* Все диалоги остаются без изменений, только заменены axios на axiosInstance */}
            {/* Диалог ручного создания задания */}
            <Dialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Создать задание</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField label="Текст задания" value={manualForm.question} onChange={(e) => setManualForm({...manualForm, question: e.target.value})} fullWidth multiline rows={4} required />
                        <TextField label="Правильный ответ" value={manualForm.answer} onChange={(e) => setManualForm({...manualForm, answer: e.target.value})} fullWidth required />
                        <TextField label="Решение / Пояснение" value={manualForm.explanation} onChange={(e) => setManualForm({...manualForm, explanation: e.target.value})} fullWidth multiline rows={3} />
                        <TextField label="Тема" value={manualForm.topic} onChange={(e) => setManualForm({...manualForm, topic: e.target.value})} fullWidth />
                        <FormControl fullWidth>
                            <InputLabel>Сложность</InputLabel>
                            <Select value={manualForm.difficulty} onChange={(e) => setManualForm({...manualForm, difficulty: e.target.value})} label="Сложность">
                                <MenuItem value={1}>Очень лёгкий</MenuItem><MenuItem value={2}>Лёгкий</MenuItem><MenuItem value={3}>Средний</MenuItem><MenuItem value={4}>Сложный</MenuItem><MenuItem value={5}>Очень сложный</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField label="Максимальный балл" type="number" value={manualForm.maxScore} onChange={(e) => setManualForm({...manualForm, maxScore: e.target.value})} fullWidth />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setManualDialogOpen(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleSaveManualTask} disabled={savingManual} sx={{ bgcolor: '#6366F1' }}>{savingManual ? 'Сохранение...' : 'Сохранить'}</Button>
                </DialogActions>
            </Dialog>

            {/* Диалог ИИ-генерации */}
            <Dialog open={aiDialogOpen} onClose={() => setAiDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    <AutoAwesomeIcon sx={{ mr: 1, color: '#8B5CF6', verticalAlign: 'middle' }} />
                    Конструктор заданий с ИИ
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <FormControl fullWidth>
                            <InputLabel>Тип задания</InputLabel>
                            <Select value={aiTaskType} onChange={(e) => setAiTaskType(e.target.value)} label="Тип задания">
                                <MenuItem value="">— Выберите —</MenuItem>
                                <MenuItem value="custom">✏️ Свой промт</MenuItem>
                                <Divider />
                                <MenuItem disabled sx={{ fontWeight: 600 }}>📐 Математика</MenuItem>
                                <MenuItem value="math_13">Задание 13 (Стереометрия)</MenuItem>
                                <MenuItem value="math_15">Задание 15 (Неравенство)</MenuItem>
                                <MenuItem value="math_16">Задание 16 (Планиметрия)</MenuItem>
                                <MenuItem value="math_17">Задание 17 (Финансовая задача)</MenuItem>
                                <MenuItem value="math_18">Задание 18 (Параметр)</MenuItem>
                                <Divider />
                                <MenuItem disabled sx={{ fontWeight: 600 }}>💻 Информатика</MenuItem>
                                <MenuItem value="inf_15">Задание 15 (Отрезки/множества)</MenuItem>
                                <MenuItem value="inf_16">Задание 16 (Рекурсия)</MenuItem>
                                <MenuItem value="inf_17">Задание 17 (Динамическое программирование)</MenuItem>
                                <MenuItem value="inf_24">Задание 24 (Обработка строк)</MenuItem>
                                <MenuItem value="inf_25">Задание 25 (Обработка чисел)</MenuItem>
                                <MenuItem value="inf_26">Задание 26 (Обработка массива)</MenuItem>
                                <MenuItem value="inf_27">Задание 27 (Сложный алгоритм)</MenuItem>
                                <Divider />
                                <MenuItem disabled sx={{ fontWeight: 600 }}>📝 Русский язык</MenuItem>
                                <MenuItem value="rus_8">Задание 8 (Грамматические ошибки)</MenuItem>
                                <MenuItem value="rus_16">Задание 16 (Пунктуация в СПП)</MenuItem>
                                <MenuItem value="rus_21">Задание 21 (Пунктуационный анализ)</MenuItem>
                                <MenuItem value="rus_26">Задание 26 (Средства выразительности)</MenuItem>
                                <MenuItem value="rus_27">Задание 27 (Сочинение)</MenuItem>
                                <Divider />
                                <MenuItem disabled sx={{ fontWeight: 600 }}>⚡ Физика</MenuItem>
                                <MenuItem value="phys_22">Задание 22 (Механика)</MenuItem>
                                <MenuItem value="phys_23">Задание 23 (Молекулярная физика)</MenuItem>
                                <MenuItem value="phys_24">Задание 24 (Электростатика)</MenuItem>
                                <MenuItem value="phys_25">Задание 25 (Электродинамика)</MenuItem>
                                <MenuItem value="phys_26">Задание 26 (Квантовая физика)</MenuItem>
                            </Select>
                        </FormControl>

                        {aiTaskType && aiTaskType !== 'custom' && (
                            <FormControl fullWidth>
                                <InputLabel>Сложность</InputLabel>
                                <Select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)} label="Сложность">
                                    <MenuItem value="easy">🟢 Лёгкое (типовое)</MenuItem>
                                    <MenuItem value="medium">🟡 Среднее (как на ЕГЭ)</MenuItem>
                                    <MenuItem value="hard">🔴 Сложное (со звёздочкой)</MenuItem>
                                </Select>
                            </FormControl>
                        )}

                        {!aiTaskType && (
                            <FormControl fullWidth>
                                <InputLabel>Предмет</InputLabel>
                                <Select value={aiSubject} onChange={(e) => setAiSubject(e.target.value)}>
                                    {subjects.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}

                        <FormControl fullWidth>
                            <InputLabel>Тип экзамена</InputLabel>
                            <Select value={aiExamType} onChange={(e) => setAiExamType(e.target.value)}>
                                {examTypes.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                            </Select>
                        </FormControl>

                        {aiTaskType === 'custom' && (
                            <TextField
                                label="Опишите задание"
                                placeholder="Например: задача на циклы с условием..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                fullWidth
                                multiline
                                rows={2}
                                helperText="Опишите, какое задание нужно создать"
                            />
                        )}

                        {aiTaskType && aiTaskType !== 'custom' && (
                            <TextField
                                label="Дополнительные пожелания (необязательно)"
                                placeholder="Например: с чертежом, с таблицей..."
                                value={aiPrompt}
                                onChange={(e) => setAiPrompt(e.target.value)}
                                fullWidth
                                helperText="Можно оставить пустым"
                            />
                        )}

                        {aiTaskType && (
                            <Paper sx={{ p: 2, bgcolor: '#F5F3FF', borderRadius: 2 }}>
                                <Typography variant="caption" color="#8B5CF6" sx={{ fontWeight: 500 }}>
                                    📋 Сформированный запрос:
                                </Typography>
                                <Typography variant="body2" sx={{ mt: 0.5 }}>
                                    {buildPromptFromOptions()}
                                </Typography>
                            </Paper>
                        )}
                        
                        {generating && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                                <CircularProgress />
                                <Typography sx={{ ml: 2 }}>Генерирую задание...</Typography>
                            </Box>
                        )}
                        
                        {generatedTask && (
                            <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#8B5CF6' }}>
                                    ✨ Сгенерированное задание:
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>📝 Задание:</strong> {generatedTask.question}
                                </Typography>
                                <Typography variant="body2" sx={{ mb: 1 }}>
                                    <strong>✅ Ответ:</strong> {generatedTask.answer}
                                </Typography>
                                {generatedTask.explanation && (
                                    <Typography variant="body2">
                                        <strong>📖 Решение:</strong> {generatedTask.explanation}
                                    </Typography>
                                )}
                            </Paper>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAiDialogOpen(false)}>Отмена</Button>
                    {!generatedTask ? (
                        <Button 
                            variant="contained" 
                            onClick={handleGenerateWithOptions} 
                            disabled={(!aiTaskType && !aiPrompt.trim()) || (aiTaskType === 'custom' && !aiPrompt.trim()) || generating}
                            startIcon={<AutoAwesomeIcon />}
                            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
                        >
                            {generating ? 'Генерация...' : 'Сгенерировать'}
                        </Button>
                    ) : (
                        <Button 
                            variant="contained" 
                            onClick={handleSaveGenerated} 
                            color="success"
                            startIcon={<CheckCircleIcon />}
                        >
                            Сохранить в банк
                        </Button>
                    )}
                </DialogActions>
            </Dialog>

            {/* Диалог варианта */}
            <Dialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>{editingVariant ? 'Редактировать вариант' : 'Добавить вариант'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField label="Название варианта" value={variantForm.title} onChange={(e) => setVariantForm({...variantForm, title: e.target.value})} fullWidth required />
                        <TextField label="Ссылка на вариант" value={variantForm.url} onChange={(e) => setVariantForm({...variantForm, url: e.target.value})} fullWidth required placeholder="https://kege.ru/..." />
                        <TextField label="Описание" value={variantForm.description} onChange={(e) => setVariantForm({...variantForm, description: e.target.value})} fullWidth multiline rows={2} />
                        <FormControl fullWidth><InputLabel>Предмет</InputLabel><Select value={variantForm.subject} onChange={(e) => setVariantForm({...variantForm, subject: e.target.value})} label="Предмет">{subjects.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
                        <FormControl fullWidth><InputLabel>Тип экзамена</InputLabel><Select value={variantForm.examType} onChange={(e) => setVariantForm({...variantForm, examType: e.target.value})} label="Тип экзамена">{examTypes.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}</Select></FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setVariantDialogOpen(false)}>Отмена</Button><Button variant="contained" onClick={handleSaveVariant} disabled={savingVariant} sx={{ bgcolor: '#8B5CF6' }}>{savingVariant ? 'Сохранение...' : 'Сохранить'}</Button></DialogActions>
            </Dialog>

            {/* Диалог плана */}
            <Dialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>{editingPlan ? 'Редактировать план' : 'Создать план урока'}</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField label="Название" value={planForm.title} onChange={(e) => setPlanForm({...planForm, title: e.target.value})} fullWidth required />
                        <TextField label="Тема" value={planForm.topic} onChange={(e) => setPlanForm({...planForm, topic: e.target.value})} fullWidth required />
                        <TextField label="Описание" value={planForm.description} onChange={(e) => setPlanForm({...planForm, description: e.target.value})} fullWidth multiline rows={2} />
                        <TextField label="Цели урока" value={planForm.learningObjectives} onChange={(e) => setPlanForm({...planForm, learningObjectives: e.target.value})} fullWidth multiline rows={2} />
                        <TextField label="Необходимые материалы" value={planForm.materialsNeeded} onChange={(e) => setPlanForm({...planForm, materialsNeeded: e.target.value})} fullWidth multiline rows={2} />
                        <TextField label="Структура урока" value={planForm.lessonStructure} onChange={(e) => setPlanForm({...planForm, lessonStructure: e.target.value})} fullWidth multiline rows={4} />
                        <TextField label="Шаблон домашнего задания" value={planForm.homeworkTemplate} onChange={(e) => setPlanForm({...planForm, homeworkTemplate: e.target.value})} fullWidth multiline rows={3} />
                        <FormControl fullWidth><InputLabel>Сложность</InputLabel><Select value={planForm.difficultyLevel} onChange={(e) => setPlanForm({...planForm, difficultyLevel: e.target.value})} label="Сложность">
                            <MenuItem value={1}>Очень лёгкий</MenuItem><MenuItem value={2}>Лёгкий</MenuItem><MenuItem value={3}>Средний</MenuItem><MenuItem value={4}>Сложный</MenuItem><MenuItem value={5}>Очень сложный</MenuItem>
                        </Select></FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions><Button onClick={() => setPlanDialogOpen(false)}>Отмена</Button><Button variant="contained" onClick={handleSavePlan} disabled={savingPlan} sx={{ bgcolor: '#8B5CF6' }}>{savingPlan ? 'Сохранение...' : 'Сохранить'}</Button></DialogActions>
            </Dialog>

            {/* Диалог назначения (общий) */}
            <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Назначить ученику</DialogTitle>
                <DialogContent>
                    <Stack spacing={3} sx={{ pt: 1 }}>
                        <Box>
                            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                                {selectedTask ? 'Задание:' : selectedVariant ? 'Вариант:' : 'План:'}
                            </Typography>
                            <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                                <Typography variant="body2">
                                    {selectedTask && selectedTask.question 
                                        ? selectedTask.question.substring(0, 150) + '...' 
                                        : selectedVariant && selectedVariant.title 
                                            ? selectedVariant.title 
                                            : selectedPlan && selectedPlan.title 
                                                ? selectedPlan.title 
                                                : '—'}
                                </Typography>
                            </Paper>
                        </Box>
                        <FormControl fullWidth>
                            <InputLabel>Выберите ученика</InputLabel>
                            <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} label="Выберите ученика">
                                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <DatePicker 
                            label="Срок выполнения" 
                            value={dueDate} 
                            onChange={setDueDate} 
                            minDate={new Date()} 
                            slotProps={{ textField: { fullWidth: true } }} 
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setAssignDialogOpen(false)}>Отмена</Button>
                    <Button 
                        variant="contained" 
                        onClick={handleAssignHomework} 
                        disabled={!selectedStudentId || assigning} 
                        sx={{ bgcolor: '#6366F1' }}
                    >
                        {assigning ? 'Назначение...' : 'Назначить'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Диалог назначения Stepik */}
            <Dialog open={stepikAssignDialogOpen} onClose={() => setStepikAssignDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Назначить курс ученику</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        <strong>{stepikSelectedCourse?.title}</strong>
                    </Typography>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Выберите ученика</InputLabel>
                        <Select
                            value={stepikSelectedStudentId}
                            onChange={(e) => setStepikSelectedStudentId(e.target.value)}
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
                    <Button onClick={() => setStepikAssignDialogOpen(false)}>Отмена</Button>
                    <Button 
                        variant="contained"
                        onClick={handleStepikAssignCourse}
                        disabled={!stepikSelectedStudentId || stepikAssigning}
                    >
                        {stepikAssigning ? 'Назначение...' : 'Назначить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </LocalizationProvider>
    );
}

export default TaskBank;