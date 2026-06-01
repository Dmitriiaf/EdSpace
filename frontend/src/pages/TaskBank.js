// ========== frontend/src/pages/TaskBank.js (v8 — Полный редизайн) ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance from '../services/api';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActions,
    Chip, CircularProgress, Alert, TextField, InputAdornment,
    IconButton, Tooltip, Dialog, DialogTitle, DialogContent,
    DialogActions, FormControl, InputLabel, Select, MenuItem,
    Stack, Divider, Pagination, Button, Snackbar,
    Menu, ListItemIcon, ListItemText, ToggleButtonGroup, ToggleButton,
    Fab, Zoom, Badge, Avatar, LinearProgress, Breadcrumbs,
    Popover, List, ListItem, Fade, ListItemAvatar, Skeleton,
    Checkbox, FormControlLabel
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Search, Add, Edit, Delete, ContentCopy, ContentPaste,
    Star, StarBorder, MenuBook, CheckCircle, AutoAwesome,
    Clear, Refresh, School, OpenInNew, Link as LinkIcon,
    Assignment, GridView, ViewList, Bookmark, BookmarkBorder,
    Image, InsertDriveFile, CameraAlt, UploadFile, FileUpload,
    CloudUpload, Scanner, PhotoCamera, Collections,
    FilterList, SortByAlpha, Close, Download, Share,
    Layers, FormatPaint, AutoFixHigh,
    Psychology, CleaningServices, DocumentScanner,
    TextSnippet, SmartToy, FindInPage, DragHandle,
    ChevronLeft, ChevronRight, KeyboardArrowDown,
    FiberManualRecord, ContentCut, MoreVert, Check,
    PersonAdd, AccessTime, CalendarToday, Send
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';

// ========== СТИЛИ (Полностью переработанные) ==========

// Новый компактный AppBar вместо громоздкого Hero
const CompactAppBar = styled(Box)(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    background: '#fff',
    borderBottom: '1px solid #F3F4F6',
    marginBottom: '0',
    flexWrap: 'wrap',
}));

const PageTitle = styled(Typography)({
    fontSize: '24px',
    fontWeight: 700,
    color: '#1F2937',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
});

// Интеллектуальная строка поиска
const SmartSearchInput = styled(TextField)({
    flex: 1,
    minWidth: '280px',
    '& .MuiOutlinedInput-root': {
        borderRadius: '14px',
        bgcolor: '#F9FAFB',
        transition: 'all 0.2s ease',
        '& fieldset': { borderColor: '#E5E7EB' },
        '&:hover fieldset': { borderColor: '#D1D5DB' },
        '&.Mui-focused fieldset': { 
            borderColor: '#764ba2', 
            boxShadow: '0 0 0 3px rgba(118,75,162,0.1)',
            bgcolor: '#fff'
        },
    },
});

// Группа кнопок действий (справа в AppBar)
const ActionGroup = styled(Box)({
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
});

const PrimaryActionButton = styled(Button)({
    borderRadius: '12px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 16px',
    boxShadow: 'none',
    '&:hover': { boxShadow: 'none' },
});

// Боковая панель навигации
const SideNav = styled(Paper)(({ theme }) => ({
    width: '260px',
    minWidth: '260px',
    borderRadius: '16px',
    border: '1px solid #F3F4F6',
    overflow: 'hidden',
    position: 'sticky',
    top: '16px',
    height: 'fit-content',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}));

const NavItem = styled(Box)(({ active }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: active ? alpha('#764ba2', 0.08) : 'transparent',
    borderLeft: active ? '3px solid #764ba2' : '3px solid transparent',
    color: active ? '#764ba2' : '#6B7280',
    fontWeight: active ? 600 : 400,
    '&:hover': {
        backgroundColor: active ? alpha('#764ba2', 0.12) : '#F9FAFB',
    },
}));

// Карточка задания (полностью переработана)
const TaskCardNew = styled(Card)(({ theme, typeColor, isSelected, isAssemblyMode }) => ({
    borderRadius: '16px',
    overflow: 'visible',
    border: `2px solid ${isSelected ? '#764ba2' : '#F3F4F6'}`,
    boxShadow: isSelected ? '0 0 0 4px rgba(118,75,162,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: isAssemblyMode ? 'pointer' : 'default',
    position: 'relative',
    backgroundColor: '#fff',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
        borderColor: isAssemblyMode ? '#764ba2' : '#D1D5DB',
    },
}));

// Тип-индикатор на карточке
const TypeIndicator = styled(Box)(({ color }) => ({
    position: 'absolute',
    top: '-1px',
    left: '20px',
    padding: '4px 12px',
    borderRadius: '0 0 8px 8px',
    backgroundColor: color,
    color: '#fff',
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.3px',
    zIndex: 1,
}));

// Иконка быстрого назначения
const QuickAssignButton = styled(IconButton)({
    backgroundColor: '#764ba2',
    color: '#fff',
    width: '40px',
    height: '40px',
    boxShadow: '0 4px 12px rgba(118,75,162,0.3)',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: '#5a3782',
        transform: 'scale(1.1)',
        boxShadow: '0 6px 16px rgba(118,75,162,0.4)',
    },
});

// Скрытые действия на карточке (появляются при наведении)
const HoverActions = styled(Box)({
    display: 'flex',
    gap: '4px',
    opacity: 0,
    transition: 'opacity 0.2s ease',
    '.task-card:hover &': {
        opacity: 1,
    },
});

// Кнопка "Собрать вариант" с каунтером
const AssemblyFAB = styled(Zoom)(({ theme }) => ({
    position: 'fixed',
    bottom: 24,
    right: 24,
    zIndex: 1000,
}));

// ========== КОНСТАНТЫ ==========
const SUBJECTS = ['Информатика', 'Математика', 'Русский язык', 'Физика'];
const EXAM_TYPES = ['ЕГЭ', 'ОГЭ'];
const TASK_NUMBERS_BY_SUBJECT = {
    'Информатика': {
        'ЕГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
        'ОГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]
    },
    'Математика': {
        'ЕГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21],
        'ОГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26]
    },
    'Русский язык': {
        'ЕГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27],
        'ОГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13]
    },
    'Физика': {
        'ЕГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32],
        'ОГЭ': [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25]
    }
};

const TYPE_CONFIG = {
    task: { color: '#4F46E5', label: 'Задание', icon: '📝', bgLight: '#EEF2FF' },
    variant: { color: '#10B981', label: 'Вариант', icon: '🔗', bgLight: '#ECFDF5' },
    plan: { color: '#F59E0B', label: 'План', icon: '📋', bgLight: '#FFFBEB' },
};

const DIFFICULTY_CONFIG = {
    1: { label: 'Очень лёгкая', color: '#10B981', icon: '🟢' },
    2: { label: 'Лёгкая', color: '#10B981', icon: '🟢' },
    3: { label: 'Средняя', color: '#F59E0B', icon: '🟡' },
    4: { label: 'Сложная', color: '#EF4444', icon: '🔴' },
    5: { label: 'Очень сложная', color: '#EF4444', icon: '🔴' },
};

// ========== УМНЫЙ БУФЕР (без изменений) ==========
const smartClipboardParse = (rawText) => {
    if (!rawText) return null;
    let cleaned = rawText
        .replace(/РешуЕГЭ|reshu\.ru|КЕГЭ|kegе\.ru/gi, '')
        .replace(/©\s*\d{4}.*$/gm, '')
        .replace(/^\s*Ответ:\s*$/gm, '')
        .replace(/<[^>]*>/g, '')
        .replace(/&[a-z]+;/gi, '')
        .trim();
    const answerMatch = cleaned.match(/(?:Ответ|Ответ:|ответ|ответ:)\s*([^\n]+)/i);
    const question = cleaned.replace(/(?:Ответ|Ответ:|ответ|ответ:)\s*[^\n]+/i, '').trim();
    const answer = answerMatch?.[1]?.trim() || '';
    let source = 'CLIPBOARD';
    if (rawText.includes('reshu.ru') || rawText.includes('РешуЕГЭ')) source = 'RESHUEGE';
    else if (rawText.includes('kegе.ru') || rawText.includes('КЕГЭ')) source = 'KEGE';
    return { question: question.substring(0, 1000), answer, source };
};

// ========== КОМПОНЕНТ ==========
function TaskBank() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Банк заданий'; }, []);

    // ===== СОСТОЯНИЯ =====
    const [activeNav, setActiveNav] = useState('all'); // 'all' | 'imported' | 'ai' | 'favorites' | 'variants'
    const [searchQuery, setSearchQuery] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('');
    const [examFilter, setExamFilter] = useState('');
    const [difficultyFilter, setDifficultyFilter] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [tasks, setTasks] = useState([]);
    const [variants, setVariants] = useState([]);
    const [plans, setPlans] = useState([]);
    const [students, setStudents] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [favorites, setFavorites] = useState(new Set());
    const [quickAssignAnchor, setQuickAssignAnchor] = useState(null);
    const [quickAssignMaterial, setQuickAssignMaterial] = useState(null);

    // Режим сборки варианта
    const [assemblyMode, setAssemblyMode] = useState(false);
    const [selectedForVariant, setSelectedForVariant] = useState(new Set());
    const [variantTasksOrder, setVariantTasksOrder] = useState([]);

    // Диалоги
    const [createMenuAnchor, setCreateMenuAnchor] = useState(null);
    const [aiDialogOpen, setAiDialogOpen] = useState(false);
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiSubject, setAiSubject] = useState('Информатика');
    const [aiExamType, setAiExamType] = useState('ЕГЭ');
    const [aiTaskNumber, setAiTaskNumber] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedTask, setGeneratedTask] = useState(null);
    const [quickUploadOpen, setQuickUploadOpen] = useState(false);
    const [uploadingFiles, setUploadingFiles] = useState([]);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [ocrDialogOpen, setOcrDialogOpen] = useState(false);
    const [ocrResult, setOcrResult] = useState(null);
    const [ocrLoading, setOcrLoading] = useState(false);
    const [manualDialogOpen, setManualDialogOpen] = useState(false);
    const [manualForm, setManualForm] = useState({ question: '', answer: '', explanation: '', topic: '', difficulty: 3, subject: 'Информатика', examType: 'ЕГЭ', taskNumber: '', isPublic: false });    const [savingManual, setSavingManual] = useState(false);
    const [variantDialogOpen, setVariantDialogOpen] = useState(false);
    const [variantForm, setVariantForm] = useState({ title: '', url: '', subject: '', examType: '', taskIds: [] });
    const [variantSource, setVariantSource] = useState('url');
    const [savingVariant, setSavingVariant] = useState(false);
    const [planDialogOpen, setPlanDialogOpen] = useState(false);
    const [planForm, setPlanForm] = useState({ title: '', topic: '', lessonStructure: '', learningObjectives: '', materialsNeeded: '', homeworkTemplate: '' });
    const [savingPlan, setSavingPlan] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [taskPickerOpen, setTaskPickerOpen] = useState(false);
    const [taskPickerSearch, setTaskPickerSearch] = useState('');

    const perPage = 12;
    const fileInputRef = useRef(null);

    useEffect(() => { if (user?.id) fetchAllData(); }, [user]);

    // ===== API =====
    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [t, v, p, s] = await Promise.all([
                axiosInstance.get('/integration/tasks/search'),
                axiosInstance.get('/variants'),
                axiosInstance.get('/lesson-plans'),
                axiosInstance.get(`/students/tutor/${user.id}`),
            ]);
            setTasks(t.data || []);
            setVariants(v.data || []);
            setPlans(p.data || []);
            setStudents(s.data || []);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
        } finally {
            setLoading(false);
        }
    };

    // ===== ФИЛЬТРАЦИЯ =====
    const getFilteredItems = useCallback(() => {
        let items = [];
        
        if (activeNav === 'variants') {
            variants.forEach(v => items.push({ ...v, materialType: 'variant' }));
        } else {
            tasks.forEach(t => items.push({ ...t, materialType: 'task' }));
            if (activeNav !== 'imported' && activeNav !== 'ai') {
                variants.forEach(v => items.push({ ...v, materialType: 'variant' }));
                plans.forEach(p => items.push({ ...p, materialType: 'plan' }));
            }
        }

        // Фильтр по источнику (навигация)
        if (activeNav === 'imported') items = items.filter(i => i.source === 'MANUAL' || i.source === 'FILE' || i.source === 'CLIPBOARD');
        if (activeNav === 'ai') items = items.filter(i => i.source === 'AI_GENERATED');
        if (activeNav === 'favorites') items = items.filter(i => favorites.has(`${i.materialType}-${i.id}`));

        // Поиск
        const q = searchQuery.toLowerCase();
        if (q) {
            items = items.filter(i => 
                (i.question || i.title || i.topic || '').toLowerCase().includes(q) ||
                (i.description || '').toLowerCase().includes(q)
            );
        }
        
        // Фильтры
        if (subjectFilter) items = items.filter(i => i.subject === subjectFilter);
        if (examFilter) items = items.filter(i => i.examType === examFilter);
        if (difficultyFilter) {
            const map = { easy: [1,2], medium: [3], hard: [4,5] };
            items = items.filter(i => map[difficultyFilter]?.includes(i.difficulty || i.difficultyLevel));
        }

        return items;
    }, [activeNav, searchQuery, subjectFilter, examFilter, difficultyFilter, tasks, variants, plans, favorites]);

    const filteredItems = getFilteredItems();
    const totalPages = Math.ceil(filteredItems.length / perPage);
    const currentItems = filteredItems.slice((page - 1) * perPage, page * perPage);

    // ===== ИЗБРАННОЕ =====
    const toggleFav = (id, type) => {
        const key = `${type}-${id}`;
        setFavorites(prev => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    };

    // ===== СБОРКА ВАРИАНТА =====
    const toggleAssemblyMode = () => {
        setAssemblyMode(!assemblyMode);
        if (assemblyMode) {
            setSelectedForVariant(new Set());
            setVariantTasksOrder([]);
        }
    };

    const toggleForVariant = (item) => {
        if (!assemblyMode) return;
        const key = `${item.materialType}-${item.id}`;
        setSelectedForVariant(prev => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
                setVariantTasksOrder(prev => prev.filter(k => k !== key));
            } else {
                next.add(key);
                setVariantTasksOrder(prev => [...prev, key]);
            }
            return next;
        });
    };

    const handleCreateVariantFromSelected = async () => {
        const taskIds = variantTasksOrder
            .filter(k => k.startsWith('task-'))
            .map(k => parseInt(k.replace('task-', '')));
        
        if (taskIds.length === 0) {
            showSnackbar('Выберите хотя бы одно задание', 'error');
            return;
        }

        const name = window.prompt('Название варианта:', `Вариант (${new Date().toLocaleDateString('ru-RU')})`);
        if (!name) return;

        try {
            await axiosInstance.post('/variants', { title: name, subject: 'Информатика', examType: 'ЕГЭ', taskIds });
            showSnackbar('✅ Вариант создан!', 'success');
            setAssemblyMode(false);
            setSelectedForVariant(new Set());
            setVariantTasksOrder([]);
            fetchAllData();
        } catch (err) {
            showSnackbar('Ошибка создания варианта', 'error');
        }
    };

    // ===== БЫСТРОЕ НАЗНАЧЕНИЕ (Popover) =====
    const handleQuickAssignOpen = (event, material) => {
        event.stopPropagation();
        setQuickAssignAnchor(event.currentTarget);
        setQuickAssignMaterial(material);
    };

    const handleQuickAssignClose = () => {
        setQuickAssignAnchor(null);
        setQuickAssignMaterial(null);
    };

    const handleQuickAssign = async (studentId) => {
        if (!quickAssignMaterial) return;
        try {
            const due = new Date();
            due.setDate(due.getDate() + 7);
            const d = due.toISOString().split('.')[0];
            
            if (quickAssignMaterial.materialType === 'task') {
                await axiosInstance.post('/integration/create-homework-from-task', { 
                    taskId: quickAssignMaterial.id, studentId, dueDate: d 
                });
            } else if (quickAssignMaterial.materialType === 'variant') {
                await axiosInstance.post(`/variants/${quickAssignMaterial.id}/assign`, { 
                    studentId, dueDate: d 
                });
            } else {
                await axiosInstance.post('/homework', { 
                    tutorId: user.id, studentId, 
                    task: quickAssignMaterial.homeworkTemplate || `ДЗ: ${quickAssignMaterial.topic}`, 
                    dueDate: d, status: 'assigned' 
                });
            }
            
            const student = students.find(s => s.id === studentId);
            showSnackbar(`✅ Назначено: ${student?.fullName || 'ученику'}`, 'success');
            handleQuickAssignClose();
        } catch (err) {
            showSnackbar('Ошибка назначения', 'error');
        }
    };

    // ===== УМНЫЙ БУФЕР =====
    const handleClipboardPaste = async () => {
        try {
            const rawText = await navigator.clipboard.readText();
            if (!rawText.trim()) {
                showSnackbar('Буфер обмена пуст', 'info');
                return;
            }
            const parsed = smartClipboardParse(rawText);
            if (parsed && parsed.question) {
                await axiosInstance.post('/integration/tasks', {
                    question: parsed.question,
                    answer: parsed.answer,
                    source: parsed.source,
                    subject: 'Информатика',
                    examType: 'ЕГЭ',
                    type: 'problem',
                    difficulty: 3
                });
                showSnackbar(`✅ Задание сохранено из буфера (${parsed.source})`, 'success');
                fetchAllData();
            } else {
                showSnackbar('Не удалось распознать задание в буфере', 'error');
            }
        } catch (err) {
            showSnackbar('Не удалось прочитать буфер обмена', 'error');
        }
    };

    // ===== OCR =====
    const handleOCRUpload = async (file) => {
        setOcrDialogOpen(true);
        setOcrLoading(true);
        setOcrResult(null);
        try {
            const formData = new FormData();
            formData.append('image', file);
            try {
                const res = await axiosInstance.post('/ocr/recognize', formData);
                setOcrResult({
                    text: res.data.text || '',
                    answer: res.data.answer || '',
                    subject: res.data.subject || 'Информатика',
                    imagePreview: URL.createObjectURL(file)
                });
            } catch {
                setOcrResult({
                    text: `Задание из файла: ${file.name}`,
                    answer: '',
                    subject: 'Информатика',
                    imagePreview: URL.createObjectURL(file)
                });
            }
        } catch {
            showSnackbar('Ошибка обработки изображения', 'error');
            setOcrDialogOpen(false);
        } finally {
            setOcrLoading(false);
        }
    };

    const handleSaveOCRResult = async () => {
        if (!ocrResult) return;
        try {
            await axiosInstance.post('/integration/tasks', {
                question: ocrResult.text,
                answer: ocrResult.answer,
                source: 'FILE',
                subject: ocrResult.subject,
                examType: 'ЕГЭ',
                type: 'problem',
                difficulty: 3
            });
            showSnackbar('✅ Задание сохранено!', 'success');
            setOcrDialogOpen(false);
            setOcrResult(null);
            fetchAllData();
        } catch {
            showSnackbar('Ошибка сохранения', 'error');
        }
    };

    // ===== ЗАГРУЗКА ФАЙЛОВ =====
    const handleFileUpload = async (files) => {
        const fileArray = Array.from(files);
        if (fileArray.length === 0) return;
        if (fileArray.length === 1 && fileArray[0].type.startsWith('image/')) {
            handleOCRUpload(fileArray[0]);
            return;
        }
        setUploadingFiles(fileArray);
        setUploadProgress(0);
        for (let i = 0; i < fileArray.length; i++) {
            const file = fileArray[i];
            try {
                await axiosInstance.post('/integration/tasks', {
                    question: `Файл: ${file.name}`,
                    answer: '',
                    topic: file.name.replace(/\.[^/.]+$/, ''),
                    source: 'FILE',
                    subject: 'Информатика',
                    examType: 'ЕГЭ',
                    type: 'problem',
                    difficulty: 3
                });
                setUploadProgress(((i + 1) / fileArray.length) * 100);
            } catch {
                showSnackbar(`Ошибка: ${file.name}`, 'error');
            }
        }
        showSnackbar(`✅ Создано ${fileArray.length} заданий!`, 'success');
        setQuickUploadOpen(false);
        setUploadingFiles([]);
        setUploadProgress(0);
        fetchAllData();
    };

    // ===== ИИ ГЕНЕРАЦИЯ =====
    const handleGenerateAI = async () => {
        if (!aiPrompt.trim()) return;
        setGenerating(true);
        try {
            const res = await axiosInstance.post('/ai/generate', { prompt: aiPrompt, subject: aiSubject, examType: aiExamType });
            setGeneratedTask(res.data);
        } catch {
            showSnackbar('Ошибка генерации', 'error');
        } finally {
            setGenerating(false);
        }
    };

    const handleSaveGenerated = async () => {
        if (!generatedTask) return;
        try {
            await axiosInstance.post('/ai/save', generatedTask);
            showSnackbar('✅ Сохранено в банк!', 'success');
            setAiDialogOpen(false);
            setGeneratedTask(null);
            setAiPrompt('');
            fetchAllData();
        } catch {
            showSnackbar('Ошибка сохранения', 'error');
        }
    };

    // ===== РУЧНОЕ СОЗДАНИЕ =====
    const handleSaveManual = async () => {
        if (!manualForm.question || !manualForm.answer) return;
        setSavingManual(true);
        try {
            await axiosInstance.post('/integration/tasks', {
                question: manualForm.question,
                answer: manualForm.answer,
                explanation: manualForm.explanation || '',
                topic: manualForm.topic || '',
                difficulty: manualForm.difficulty || 3,
                taskNumber: manualForm.taskNumber ? parseInt(manualForm.taskNumber) : null,
                source: 'MANUAL',
                subject: manualForm.subject || 'Информатика',
                examType: manualForm.examType || 'ЕГЭ',
                type: 'problem',
                isPublic: manualForm.isPublic || false
            });
            showSnackbar('✅ Задание создано!', 'success');
            setManualDialogOpen(false);
            setManualForm({ question: '', answer: '', explanation: '', topic: '', difficulty: 3 });
            setEditItem(null);
            fetchAllData();
        } catch {
            showSnackbar('Ошибка', 'error');
        } finally {
            setSavingManual(false);
        }
    };

    // ===== ВАРИАНТ =====
    const handleSaveVariant = async () => {
        if (!variantForm.title) return;
        if (variantSource === 'url' && !variantForm.url) return;
        if (variantSource === 'tasks' && !variantForm.taskIds?.length) return;
        setSavingVariant(true);
        try {
            await axiosInstance.post('/variants', variantForm);
            showSnackbar('✅ Вариант добавлен!', 'success');
            setVariantDialogOpen(false);
            fetchAllData();
        } catch {
            showSnackbar('Ошибка', 'error');
        } finally {
            setSavingVariant(false);
        }
    };

    // ===== ПЛАН =====
    const handleSavePlan = async () => {
        if (!planForm.title) return;
        setSavingPlan(true);
        try {
            await axiosInstance.post('/lesson-plans', planForm);
            showSnackbar('✅ План создан!', 'success');
            setPlanDialogOpen(false);
            fetchAllData();
        } catch {
            showSnackbar('Ошибка', 'error');
        } finally {
            setSavingPlan(false);
        }
    };

    // ===== УДАЛЕНИЕ =====
    const handleDeleteTask = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Удалить задание?')) return;
        try {
            await axiosInstance.delete(`/integration/tasks/${id}`);
            showSnackbar('🗑️ Задание удалено', 'success');
            fetchAllData();
        } catch (err) {
            showSnackbar('Ошибка удаления', 'error');
        }
    };

    const handleDeleteVariant = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm('Удалить вариант?')) return;
        try {
            await axiosInstance.delete(`/variants/${id}`);
            showSnackbar('🗑️ Вариант удалён', 'success');
            fetchAllData();
        } catch (err) {
            showSnackbar('Ошибка удаления', 'error');
        }
    };

    const showSnackbar = (msg, sev) => setSnackbar({ open: true, message: msg, severity: sev });

    // ===== ОБРАБОТЧИК ПОИСКА =====
    const handleSearchChange = (e) => {
        const val = e.target.value;
        setSearchQuery(val);
        setPage(1);
        if (/(reshu\.ru|kegе\.ru|yandex\.ru\/tutor)/i.test(val)) {
            showSnackbar('🔗 Обнаружена ссылка. Скопируйте текст задания и нажмите "Буфер"', 'info');
        }
    };

    // ===== РЕНДЕР =====
    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <EdSpaceLoader text="Загрузка банка..." />
            </Box>
        </PageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer sx={{ p: '0 !important', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
                
                {/* ========== НОВЫЙ КОМПАКТНЫЙ APP BAR ========== */}
                <CompactAppBar>
                    <PageTitle>
                        <MenuBook sx={{ color: '#764ba2' }} />
                        Банк заданий
                    </PageTitle>
                    
                    <SmartSearchInput
                        placeholder="Поиск по тексту, теме или вставьте ссылку..."
                        size="small"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                            endAdornment: searchQuery && (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                                        <Clear fontSize="small" />
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    <ActionGroup>
                        {/* Кнопка "Создать" с выпадающим меню */}
                        <PrimaryActionButton
                            variant="contained"
                            startIcon={<Add />}
                            endIcon={<KeyboardArrowDown />}
                            onClick={(e) => setCreateMenuAnchor(e.currentTarget)}
                            sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}
                        >
                            Создать
                        </PrimaryActionButton>
                        <Menu
                            anchorEl={createMenuAnchor}
                            open={Boolean(createMenuAnchor)}
                            onClose={() => setCreateMenuAnchor(null)}
                            PaperProps={{ sx: { borderRadius: '14px', mt: 1, minWidth: 220 } }}
                        >
                            <MenuItem onClick={() => { setCreateMenuAnchor(null); setAiDialogOpen(true); setGeneratedTask(null); setAiPrompt(''); }}>
                                <ListItemIcon><AutoAwesome sx={{ color: '#8B5CF6' }} /></ListItemIcon>
                                <ListItemText>ИИ-генерация</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { setCreateMenuAnchor(null); handleClipboardPaste(); }}>
                                <ListItemIcon><ContentPaste sx={{ color: '#F59E0B' }} /></ListItemIcon>
                                <ListItemText>Из буфера обмена</ListItemText>
                            </MenuItem>
                            <MenuItem onClick={() => { setCreateMenuAnchor(null); setManualDialogOpen(true); setEditItem(null); setManualForm({ question: '', answer: '', explanation: '', topic: '', difficulty: 3 }); }}>
                                <ListItemIcon><Edit sx={{ color: '#3B82F6' }} /></ListItemIcon>
                                <ListItemText>Вручную</ListItemText>
                            </MenuItem>
                        </Menu>
                        
                        <PrimaryActionButton
                            variant="outlined"
                            startIcon={<CloudUpload />}
                            onClick={() => setQuickUploadOpen(true)}
                            sx={{ borderColor: '#D1D5DB', color: '#374151' }}
                        >
                            Загрузить
                        </PrimaryActionButton>
                        
                        {/* Переключатель вида */}
                        <ToggleButtonGroup
                            value={viewMode}
                            exclusive
                            onChange={(e, val) => val && setViewMode(val)}
                            size="small"
                            sx={{ '& .MuiToggleButton-root': { borderRadius: '8px', border: '1px solid #E5E7EB', px: 1 } }}
                        >
                            <ToggleButton value="grid"><GridView fontSize="small" /></ToggleButton>
                            <ToggleButton value="list"><ViewList fontSize="small" /></ToggleButton>
                        </ToggleButtonGroup>
                    </ActionGroup>
                </CompactAppBar>

                {/* ========== ОСНОВНАЯ ОБЛАСТЬ: БОКОВАЯ ПАНЕЛЬ + КОНТЕНТ ========== */}
                <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
                    
                    {/* ========== БОКОВАЯ ПАНЕЛЬ НАВИГАЦИИ ========== */}
                    <SideNav>
                        <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                Разделы
                            </Typography>
                            <Stack spacing={0.5}>
                                <NavItem active={activeNav === 'all'} onClick={() => { setActiveNav('all'); setPage(1); }}>
                                    <MenuBook fontSize="small" />
                                    Весь банк
                                    <Chip label={tasks.length + variants.length + plans.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                                </NavItem>
                                <NavItem active={activeNav === 'imported'} onClick={() => { setActiveNav('imported'); setPage(1); }}>
                                    <FileUpload fontSize="small" />
                                    Импортированное
                                </NavItem>
                                <NavItem active={activeNav === 'ai'} onClick={() => { setActiveNav('ai'); setPage(1); }}>
                                    <SmartToy fontSize="small" />
                                    ИИ-сгенерированное
                                </NavItem>
                                <NavItem active={activeNav === 'favorites'} onClick={() => { setActiveNav('favorites'); setPage(1); }}>
                                    <Star fontSize="small" />
                                    Избранное
                                    {favorites.size > 0 && <Chip label={favorites.size} size="small" color="warning" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />}
                                </NavItem>
                                <NavItem active={activeNav === 'variants'} onClick={() => { setActiveNav('variants'); setPage(1); }}>
                                    <Layers fontSize="small" />
                                    Варианты
                                </NavItem>
                            </Stack>
                        </Box>
                        
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                                Фильтры
                            </Typography>
                            <Stack spacing={1.5}>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Предмет</InputLabel>
                                    <Select
                                        value={subjectFilter}
                                        onChange={(e) => { setSubjectFilter(e.target.value); setPage(1); }}
                                        label="Предмет"
                                        sx={{ borderRadius: '10px', bgcolor: '#fff' }}
                                    >
                                        <MenuItem value="">Все предметы</MenuItem>
                                        {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Экзамен</InputLabel>
                                    <Select
                                        value={examFilter}
                                        onChange={(e) => { setExamFilter(e.target.value); setPage(1); }}
                                        label="Экзамен"
                                        sx={{ borderRadius: '10px', bgcolor: '#fff' }}
                                    >
                                        <MenuItem value="">Все экзамены</MenuItem>
                                        {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl size="small" fullWidth>
                                    <InputLabel>Сложность</InputLabel>
                                    <Select
                                        value={difficultyFilter}
                                        onChange={(e) => { setDifficultyFilter(e.target.value); setPage(1); }}
                                        label="Сложность"
                                        sx={{ borderRadius: '10px', bgcolor: '#fff' }}
                                    >
                                        <MenuItem value="">Любая</MenuItem>
                                        <MenuItem value="easy">🟢 Лёгкая</MenuItem>
                                        <MenuItem value="medium">🟡 Средняя</MenuItem>
                                        <MenuItem value="hard">🔴 Сложная</MenuItem>
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Box>
                        
                        <Divider />
                        
                        {/* Режим сборки варианта */}
                        <Box sx={{ p: 2 }}>
                            <Button
                                fullWidth
                                variant={assemblyMode ? "contained" : "outlined"}
                                color={assemblyMode ? "secondary" : "inherit"}
                                startIcon={<Layers />}
                                onClick={toggleAssemblyMode}
                                sx={{
                                    borderRadius: '12px',
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    ...(assemblyMode ? { bgcolor: '#764ba2' } : { borderColor: '#D1D5DB', color: '#374151' })
                                }}
                            >
                                {assemblyMode ? 'Выйти из режима' : 'Режим сборки'}
                            </Button>
                            {assemblyMode && (
                                <Typography sx={{ fontSize: '11px', color: '#6B7280', mt: 1, textAlign: 'center' }}>
                                    Кликайте на карточки для выбора
                                </Typography>
                            )}
                        </Box>
                    </SideNav>

                    {/* ========== ОСНОВНОЙ КОНТЕНТ ========== */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        
                        {/* Статистика (компактная) */}
                        {!assemblyMode && (
                            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                                {[
                                    { label: 'Всего', value: tasks.length + variants.length + plans.length, icon: '📚', color: '#4F46E5' },
                                    { label: 'Избранное', value: favorites.size, icon: '⭐', color: '#F59E0B' },
                                    { label: 'ИИ', value: tasks.filter(t => t.source === 'AI_GENERATED').length, icon: '🤖', color: '#8B5CF6' },
                                ].map((stat, i) => (
                                    <Paper key={i} sx={{ 
                                        px: 2, py: 1, borderRadius: '12px', 
                                        display: 'flex', alignItems: 'center', gap: 1.5,
                                        border: '1px solid #F3F4F6', bgcolor: '#fff'
                                    }}>
                                        <Typography sx={{ fontSize: '18px' }}>{stat.icon}</Typography>
                                        <Box>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 700, color: stat.color, lineHeight: 1 }}>
                                                {stat.value}
                                            </Typography>
                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                {stat.label}
                                            </Typography>
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        )}

                        {/* ========== КАРТОЧКИ ЗАДАНИЙ (НОВЫЙ ДИЗАЙН) ========== */}
                        {currentItems.length === 0 ? (
                            <Paper sx={{ 
                                borderRadius: '20px', p: 6, textAlign: 'center',
                                border: '2px dashed #D1D5DB', bgcolor: '#F9FAFB'
                            }}>
                                <FindInPage sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
                                <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#6B7280' }}>
                                    {searchQuery ? 'Ничего не найдено' : 'Здесь пока пусто'}
                                </Typography>
                                <Typography sx={{ color: '#9CA3AF', mt: 1 }}>
                                    {searchQuery ? 'Попробуйте изменить поисковый запрос' : 'Создайте первое задание или импортируйте файлы'}
                                </Typography>
                            </Paper>
                        ) : viewMode === 'grid' ? (
                            <Grid container spacing={2.5}>
                                {currentItems.map(item => {
                                    const cfg = TYPE_CONFIG[item.materialType] || {};
                                    const key = `${item.materialType}-${item.id}`;
                                    const isSelected = selectedForVariant.has(key);
                                    const isFav = favorites.has(key);
                                    const diffInfo = DIFFICULTY_CONFIG[item.difficulty] || null;
                                    
                                    return (
                                        <Grid item xs={12} sm={6} md={4} key={key}>
                                            <Box className="task-card" sx={{ position: 'relative' }}>
                                                <TaskCardNew
                                                    typeColor={cfg.color}
                                                    isSelected={isSelected}
                                                    isAssemblyMode={assemblyMode}
                                                    onClick={() => assemblyMode && toggleForVariant(item)}
                                                >
                                                    {/* Тип-индикатор */}
                                                    <TypeIndicator color={cfg.color}>
                                                        {cfg.icon} {cfg.label}
                                                    </TypeIndicator>
                                                    
                                                    <CardContent sx={{ p: 2.5, pt: 4, flex: 1 }}>
                                                        {/* Контент задания */}
                                                        <Typography sx={{ 
                                                            fontWeight: 600, fontSize: '15px', mb: 1,
                                                            display: '-webkit-box', WebkitLineClamp: 2, 
                                                            overflow: 'hidden', WebkitBoxOrient: 'vertical',
                                                            lineHeight: 1.4
                                                        }}>
                                                            {item.topic || item.title || item.question?.substring(0, 80) || 'Без названия'}
                                                        </Typography>
                                                        
                                                        <Typography sx={{ 
                                                            fontSize: '13px', color: '#6B7280', mb: 1.5, 
                                                            lineHeight: 1.5,
                                                            display: '-webkit-box', WebkitLineClamp: 2, 
                                                            overflow: 'hidden', WebkitBoxOrient: 'vertical'
                                                        }}>
                                                            {item.question || item.description || ''}
                                                        </Typography>
                                                        
                                                        {/* Мета-чипы */}
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                                            {item.subject && (
                                                                <Chip 
                                                                    label={item.subject} 
                                                                    size="small" 
                                                                    variant="outlined" 
                                                                    sx={{ fontSize: '10px', borderRadius: '6px', height: 22 }} 
                                                                />
                                                            )}
                                                            {diffInfo && (
                                                                <Chip 
                                                                    label={`${diffInfo.icon} ${diffInfo.label}`} 
                                                                    size="small" 
                                                                    sx={{ 
                                                                        fontSize: '10px', borderRadius: '6px', height: 22,
                                                                        bgcolor: alpha(diffInfo.color, 0.1),
                                                                        color: diffInfo.color,
                                                                        fontWeight: 500
                                                                    }} 
                                                                />
                                                            )}
                                                            {item.source === 'AI_GENERATED' && (
                                                                <Chip 
                                                                    label="🤖 ИИ" 
                                                                    size="small" 
                                                                    sx={{ fontSize: '10px', borderRadius: '6px', height: 22 }} 
                                                                />
                                                            )}
                                                        </Box>
                                                    </CardContent>
                                                    
                                                    <Divider />
                                                    
                                                    <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                                                        {/* Скрытые действия (появляются при наведении) */}
                                                        <HoverActions>
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={(e) => { e.stopPropagation(); toggleFav(item.id, item.materialType); }}
                                                                sx={{ color: isFav ? '#F59E0B' : '#D1D5DB' }}
                                                            >
                                                                {isFav ? <Star fontSize="small" /> : <StarBorder fontSize="small" />}
                                                            </IconButton>
                                                            <IconButton 
                                                                size="small"
                                                                onClick={(e) => { 
                                                                    e.stopPropagation(); 
                                                                    setEditItem(item); 
                                                                    setManualForm({ 
                                                                        question: item.question || '', 
                                                                        answer: item.answer || '', 
                                                                        explanation: item.explanation || '', 
                                                                        topic: item.topic || '', 
                                                                        difficulty: item.difficulty || 3 
                                                                    }); 
                                                                    setManualDialogOpen(true); 
                                                                }}
                                                                sx={{ color: '#9CA3AF' }}
                                                            >
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                            {/* Кнопка удаления */}
                                                            <IconButton 
                                                                size="small"
                                                                onClick={(e) => item.materialType === 'variant' ? handleDeleteVariant(item.id, e) : handleDeleteTask(item.id, e)}
                                                                sx={{ color: '#EF4444' }}
                                                            >
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </HoverActions>
                                                        
                                                        {/* Кнопка быстрого назначения (всегда видна) */}
                                                        <QuickAssignButton
                                                            size="small"
                                                            onClick={(e) => handleQuickAssignOpen(e, item)}
                                                        >
                                                            <School fontSize="small" />
                                                        </QuickAssignButton>
                                                    </CardActions>
                                                    
                                                    {/* Индикатор выбора для режима сборки */}
                                                    {assemblyMode && (
                                                        <Box sx={{
                                                            position: 'absolute', top: 10, right: 10,
                                                            width: 24, height: 24, borderRadius: '50%',
                                                            border: `2px solid ${isSelected ? '#764ba2' : '#D1D5DB'}`,
                                                            bgcolor: isSelected ? '#764ba2' : '#fff',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            transition: 'all 0.2s ease'
                                                        }}>
                                                            {isSelected && <Check sx={{ fontSize: 16, color: '#fff' }} />}
                                                        </Box>
                                                    )}
                                                </TaskCardNew>
                                            </Box>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        ) : (
                            /* ========== LIST VIEW ========== */
                            <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                                {currentItems.map((item, idx) => {
                                    const cfg = TYPE_CONFIG[item.materialType] || {};
                                    const key = `${item.materialType}-${item.id}`;
                                    const isSelected = selectedForVariant.has(key);
                                    
                                    return (
                                        <Box 
                                            key={key} 
                                            onClick={() => assemblyMode && toggleForVariant(item)}
                                            sx={{ 
                                                display: 'flex', alignItems: 'center', gap: 2, p: 2,
                                                borderBottom: idx < currentItems.length - 1 ? '1px solid #F3F4F6' : 'none',
                                                cursor: assemblyMode ? 'pointer' : 'default',
                                                bgcolor: isSelected ? alpha('#764ba2', 0.04) : '#fff',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { bgcolor: '#F9FAFB' }
                                            }}
                                        >
                                            <FiberManualRecord sx={{ fontSize: 10, color: cfg.color, flexShrink: 0 }} />
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>
                                                    {item.topic || item.title || 'Без названия'}
                                                </Typography>
                                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF', 
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {(item.question || item.description || '').substring(0, 100)}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                                                {assemblyMode && (
                                                    <CheckCircle sx={{ 
                                                        color: isSelected ? '#764ba2' : '#D1D5DB', 
                                                        fontSize: 22,
                                                        transition: 'all 0.2s ease'
                                                    }} />
                                                )}
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => handleQuickAssignOpen(e, item)}
                                                    sx={{ color: '#764ba2' }}
                                                >
                                                    <School fontSize="small" />
                                                </IconButton>
                                                <IconButton 
                                                    size="small" 
                                                    onClick={(e) => item.materialType === 'variant' ? handleDeleteVariant(item.id, e) : handleDeleteTask(item.id, e)}
                                                    sx={{ color: '#EF4444' }}
                                                >
                                                    <Delete fontSize="small" />
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Paper>
                        )}

                        {/* Пагинация */}
                        {totalPages > 1 && (
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                                <Pagination 
                                    count={totalPages} 
                                    page={page} 
                                    onChange={(e, v) => setPage(v)} 
                                    size="small"
                                    sx={{ 
                                        '& .Mui-selected': { 
                                            bgcolor: '#764ba2 !important', 
                                            color: '#fff',
                                            borderRadius: '8px'
                                        },
                                        '& .MuiPaginationItem-root': {
                                            borderRadius: '8px'
                                        }
                                    }} 
                                />
                            </Box>
                        )}
                    </Box>
                </Box>

                {/* ========== БЫСТРОЕ НАЗНАЧЕНИЕ (POPOVER) ========== */}
                <Popover
                    open={Boolean(quickAssignAnchor)}
                    anchorEl={quickAssignAnchor}
                    onClose={handleQuickAssignClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'center' }}
                    PaperProps={{ 
                        sx: { 
                            borderRadius: '16px', 
                            p: 1.5, 
                            minWidth: 280,
                            boxShadow: '0 16px 48px rgba(0,0,0,0.15)',
                            mt: 1
                        } 
                    }}
                >
                    <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 1.5, px: 1 }}>
                        👤 Назначить ученику
                    </Typography>
                    
                    <TextField
                        placeholder="Быстрый поиск ученика..."
                        size="small"
                        fullWidth
                        autoFocus
                        sx={{ 
                            mb: 1,
                            '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' }
                        }}
                    />
                    
                    <List dense sx={{ maxHeight: 250, overflow: 'auto' }}>
                        {students.slice(0, 8).map(s => (
                            <ListItem 
                                key={s.id} 
                                button 
                                onClick={() => handleQuickAssign(s.id)}
                                sx={{ 
                                    borderRadius: '10px', 
                                    mb: 0.5,
                                    '&:hover': { bgcolor: alpha('#764ba2', 0.06) }
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ width: 32, height: 32, bgcolor: '#4F46E5', fontSize: 14 }}>
                                        {s.fullName?.[0] || '?'}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText 
                                    primary={s.fullName} 
                                    primaryTypographyProps={{ fontSize: '14px', fontWeight: 500 }}
                                />
                                <Send sx={{ color: '#9CA3AF', fontSize: 16 }} />
                            </ListItem>
                        ))}
                    </List>
                    
                    {students.length === 0 && (
                        <Typography sx={{ textAlign: 'center', color: '#9CA3AF', py: 2, fontSize: '13px' }}>
                            Нет учеников. Добавьте ученика в разделе "Ученики".
                        </Typography>
                    )}
                </Popover>

                {/* ========== FAB СБОРКИ ВАРИАНТА ========== */}
                {assemblyMode && selectedForVariant.size > 0 && (
                    <AssemblyFAB in={selectedForVariant.size > 0}>
                        <Fab
                            variant="extended"
                            color="secondary"
                            onClick={handleCreateVariantFromSelected}
                            sx={{
                                bgcolor: '#764ba2',
                                color: '#fff',
                                borderRadius: '16px',
                                px: 3,
                                '&:hover': { bgcolor: '#5a3782' }
                            }}
                        >
                            <Badge badgeContent={selectedForVariant.size} color="error" sx={{ mr: 1.5 }}>
                                <Layers />
                            </Badge>
                            Собрать вариант
                        </Fab>
                    </AssemblyFAB>
                )}

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    hidden 
                    multiple 
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    onChange={(e) => handleFileUpload(e.target.files)} 
                />

                {/* ========== ДИАЛОГИ (оставлены как были, с улучшенными стилями) ========== */}
                
                                {/* ========== ИИ-ГЕНЕРАЦИЯ (v3 — Предмет → Экзамен → Задание) ========== */}
                <StyledDialog open={aiDialogOpen} onClose={() => { setAiDialogOpen(false); setGeneratedTask(null); setAiPrompt(''); }} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
                        <Box sx={{ 
                            width: 40, height: 40, borderRadius: '12px', 
                            background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <AutoAwesome sx={{ color: '#fff', fontSize: 22 }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>ИИ-генерация задания</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#6B7280', fontWeight: 400 }}>
                                Выберите предмет, экзамен и номер задания
                            </Typography>
                        </Box>
                    </DialogTitle>

                    <DialogContent sx={{ p: 3 }}>
                        <Stack spacing={2.5}>
                            {!generatedTask && (
                                <Box>
                                    <Grid container spacing={2}>
                                        <Grid item xs={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Предмет</InputLabel>
                                                <Select
                                                    value={aiSubject}
                                                    onChange={(e) => {
                                                        setAiSubject(e.target.value);
                                                        setAiExamType('ЕГЭ');
                                                        setAiTaskNumber('');
                                                        setAiPrompt('');
                                                    }}
                                                    sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                                                >
                                                    {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Экзамен</InputLabel>
                                                <Select
                                                    value={aiExamType}
                                                    onChange={(e) => {
                                                        setAiExamType(e.target.value);
                                                        setAiTaskNumber('');
                                                        setAiPrompt('');
                                                    }}
                                                    sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                                                >
                                                    {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <FormControl fullWidth>
                                                <InputLabel>Номер задания</InputLabel>
                                                <Select
                                                    value={aiTaskNumber}
                                                    onChange={(e) => {
                                                        setAiTaskNumber(e.target.value);
                                                        if (aiSubject === 'Информатика' && aiExamType === 'ЕГЭ') {
                                                            const prompts = {
                                                                1: 'Задание 1 ЕГЭ по информатике: анализ информационных моделей. Графы, таблицы, диаграммы. Создай уникальное задание.',
                                                                2: 'Задание 2 ЕГЭ по информатике: таблицы истинности логических выражений. Создай уникальное задание.',
                                                                3: 'Задание 3 ЕГЭ по информатике: поиск информации в базах данных. Создай уникальное задание.',
                                                                4: 'Задание 4 ЕГЭ по информатике: кодирование и декодирование информации. Условие Фано.',
                                                                5: 'Задание 5 ЕГЭ по информатике: анализ алгоритмов. Программа с простым циклом.',
                                                                6: 'Задание 6 ЕГЭ по информатике: анализ программ с циклами. Вложенные циклы.',
                                                                7: 'Задание 7 ЕГЭ по информатике: кодирование графической и звуковой информации.',
                                                                8: 'Задание 8 ЕГЭ по информатике: комбинаторика. Перебор слов и системы счисления.',
                                                                9: 'Задание 9 ЕГЭ по информатике: электронные таблицы. Формулы и функции.',
                                                                10: 'Задание 10 ЕГЭ по информатике: информационный поиск средствами ОС.',
                                                                11: 'Задание 11 ЕГЭ по информатике: кодирование информации. Вычисление объёма памяти.',
                                                                12: 'Задание 12 ЕГЭ по информатике: логические выражения. Поиск количества решений.',
                                                                13: 'Задание 13 ЕГЭ по информатике: представление чисел в компьютере. Системы счисления.',
                                                                14: 'Задание 14 ЕГЭ по информатике: алгоритмы обработки чисел. Побитовые операции.',
                                                                15: 'Задание 15 ЕГЭ по информатике: теория игр. Одна куча камней.',
                                                                16: 'Задание 16 ЕГЭ по информатике: рекурсивные алгоритмы.',
                                                                17: 'Задание 17 ЕГЭ по информатике: обработка целочисленных данных из файла.',
                                                                18: 'Задание 18 ЕГЭ по информатике: динамическое программирование. Матрица.',
                                                                19: 'Задание 19 ЕГЭ по информатике: теория игр. Одна куча.',
                                                                20: 'Задание 20 ЕГЭ по информатике: теория игр. Две кучи.',
                                                                21: 'Задание 21 ЕГЭ по информатике: теория игр. Усложнённая.',
                                                                22: 'Задание 22 ЕГЭ по информатике: многопроцессорные системы.',
                                                                23: 'Задание 23 ЕГЭ по информатике: системы логических уравнений.',
                                                                24: 'Задание 24 ЕГЭ по информатике: обработка символьных строк из файла.',
                                                                25: 'Задание 25 ЕГЭ по информатике: поиск чисел с заданными свойствами.',
                                                                26: 'Задание 26 ЕГЭ по информатике: обработка данных сортировкой.',
                                                                27: 'Задание 27 ЕГЭ по информатике: анализ программ с циклами и условиями.'
                                                            };
                                                            setAiPrompt(prompts[e.target.value] || '');
                                                        } else {
                                                            setAiPrompt(`Задание ${e.target.value} ${aiExamType} по ${aiSubject}. Создай уникальное задание как в реальном экзамене.`);
                                                        }
                                                    }}
                                                    sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                                                >
                                                    <MenuItem value=""><em>Выберите номер</em></MenuItem>
                                                    {(TASK_NUMBERS_BY_SUBJECT[aiSubject]?.[aiExamType] || []).map(num => (
                                                        <MenuItem key={num} value={num}>Задание {num}</MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {/* ===== ПОЛЯ ВВОДА ===== */}
                            {!generatedTask && (
                                <>
                                    <TextField 
                                        label="Опишите задание подробно"
                                        value={aiPrompt} 
                                        onChange={(e) => setAiPrompt(e.target.value)}
                                        fullWidth multiline rows={4}
                                        placeholder="Промт заполнится автоматически после выбора номера задания. Вы можете его отредактировать."
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '14px', bgcolor: '#fff', fontSize: '14px' } }}
                                        helperText={`${aiPrompt.length} / 1000 символов`}
                                        inputProps={{ maxLength: 1000 }}
                                    />
                                </>
                            )}

                            {/* ===== ПРОЦЕСС ГЕНЕРАЦИИ ===== */}
                            {generating && (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <Box sx={{ 
                                        width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
                                        background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                        <SmartToy sx={{ color: '#fff', fontSize: 40 }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 600, fontSize: '16px', mb: 1 }}>
                                        Генерирую задание...
                                    </Typography>
                                    <LinearProgress sx={{ mt: 3, borderRadius: 4, height: 6, maxWidth: 300, mx: 'auto' }} />
                                </Box>
                            )}

                            {/* ===== РЕЗУЛЬТАТ ===== */}
                            {generatedTask && !generating && (
                                <Fade in={true}>
                                    <Paper sx={{ p: 3, borderRadius: '16px', bgcolor: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                            <CheckCircle sx={{ color: '#10B981', fontSize: 24 }} />
                                            <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '16px' }}>
                                                Задание сгенерировано!
                                            </Typography>
                                        </Box>

                                        <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#fff', border: '1px solid #E5E7EB', mb: 2 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#8B5CF6', mb: 1 }}>
                                                📝 Текст задания
                                            </Typography>
                                            <Typography sx={{ fontSize: '14px', color: '#1F2937', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                                                {generatedTask.question}
                                            </Typography>
                                        </Paper>

                                        {generatedTask.answer && (
                                            <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', mb: 2 }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#065F46', mb: 1 }}>
                                                    ✅ Правильный ответ
                                                </Typography>
                                                <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#065F46' }}>
                                                    {generatedTask.answer}
                                                </Typography>
                                            </Paper>
                                        )}

                                        {generatedTask.explanation && (
                                            <Paper sx={{ p: 2.5, borderRadius: '12px', bgcolor: '#EEF2FF', border: '1px solid #C7D2FE' }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '13px', color: '#4F46E5', mb: 1 }}>
                                                    💡 Пояснение
                                                </Typography>
                                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.7 }}>
                                                    {generatedTask.explanation}
                                                </Typography>
                                            </Paper>
                                        )}

                                        <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'space-between', alignItems: 'center' }}>
                                            <Chip 
                                                icon={<AutoAwesome />} 
                                                label={`${generatedTask.subject || aiSubject} · ${generatedTask.examType || aiExamType}`} 
                                                size="small" 
                                                sx={{ borderRadius: '8px', bgcolor: '#F5F3FF', color: '#7C3AED' }}
                                            />
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button 
                                                    variant="outlined" 
                                                    startIcon={<Refresh />}
                                                    onClick={handleGenerateAI}
                                                    sx={{ borderRadius: '10px', borderColor: '#D1D5DB', color: '#6B7280' }}
                                                >
                                                    Перегенерировать
                                                </Button>
                                            </Box>
                                        </Box>
                                    </Paper>
                                </Fade>
                            )}
                        </Stack>
                    </DialogContent>

                    <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
                        <Button onClick={() => { setAiDialogOpen(false); setGeneratedTask(null); setAiPrompt(''); }} sx={{ borderRadius: '10px' }}>
                            Отмена
                        </Button>
                        {!generatedTask ? (
                            <Button 
                                variant="contained" 
                                onClick={handleGenerateAI} 
                                disabled={!aiPrompt.trim() || generating}
                                startIcon={<AutoAwesome />}
                                sx={{ 
                                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                                    borderRadius: '12px', px: 4, fontWeight: 600,
                                    '&:hover': { opacity: 0.9 },
                                    '&:disabled': { background: '#D1D5DB' }
                                }}
                            >
                                {generating ? 'Генерирую...' : '🚀 Сгенерировать'}
                            </Button>
                        ) : (
                            <Button 
                                variant="contained" 
                                onClick={handleSaveGenerated}
                                startIcon={<Bookmark />}
                                sx={{ 
                                    bgcolor: '#10B981', borderRadius: '12px', px: 4, fontWeight: 600,
                                    '&:hover': { bgcolor: '#059669' }
                                }}
                            >
                                💾 Сохранить в банк
                            </Button>
                        )}
                    </DialogActions>
                </StyledDialog>

                {/* Быстрая загрузка */}
                <Dialog open={quickUploadOpen} onClose={() => setQuickUploadOpen(false)} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>📤 Быстрая загрузка</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <Paper
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => { e.preventDefault(); handleFileUpload(e.dataTransfer.files); setQuickUploadOpen(false); }}
                                onClick={() => fileInputRef.current?.click()}
                                sx={{ 
                                    border: '2px dashed #D1D5DB', borderRadius: '20px', p: 5, textAlign: 'center', 
                                    cursor: 'pointer', bgcolor: '#F9FAFB',
                                    '&:hover': { borderColor: '#764ba2', bgcolor: alpha('#764ba2', 0.02) }
                                }}
                            >
                                <CloudUpload sx={{ fontSize: 48, color: '#764ba2', mb: 1 }} />
                                <Typography sx={{ fontWeight: 600 }}>Перетащите файлы или нажмите</Typography>
                                <Typography sx={{ color: '#6B7280', fontSize: '13px', mt: 0.5 }}>
                                    Скриншоты, PDF, Word — до 50 МБ
                                </Typography>
                            </Paper>
                            {uploadingFiles.length > 0 && (
                                <Box>
                                    <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, mb: 1 }} />
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>{Math.round(uploadProgress)}%</Typography>
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setQuickUploadOpen(false)}>Закрыть</Button>
                    </DialogActions>
                </Dialog>

                {/* OCR распознавание */}
                <StyledDialog open={ocrDialogOpen} onClose={() => setOcrDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <DocumentScanner sx={{ color: '#764ba2' }} /> Распознавание задания
                    </DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            {ocrLoading ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}>
                                    <CircularProgress sx={{ color: '#764ba2' }} />
                                    <Typography sx={{ mt: 2 }}>Распознаём текст...</Typography>
                                </Box>
                            ) : ocrResult ? (
                                <>
                                    {ocrResult.imagePreview && (
                                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                                            <img src={ocrResult.imagePreview} alt="Задание" style={{ maxHeight: 200, borderRadius: '12px' }} />
                                        </Box>
                                    )}
                                    <TextField 
                                        label="Текст задания" 
                                        value={ocrResult.text} 
                                        onChange={(e) => setOcrResult(prev => ({ ...prev, text: e.target.value }))}
                                        fullWidth multiline rows={5} 
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                                    />
                                    <TextField 
                                        label="Ответ" 
                                        value={ocrResult.answer}
                                        onChange={(e) => setOcrResult(prev => ({ ...prev, answer: e.target.value }))}
                                        fullWidth 
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                                    />
                                    <FormControl fullWidth>
                                        <InputLabel>Предмет</InputLabel>
                                        <Select 
                                            value={ocrResult.subject} 
                                            onChange={(e) => setOcrResult(prev => ({ ...prev, subject: e.target.value }))}
                                            sx={{ borderRadius: '10px' }}
                                        >
                                            {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </>
                            ) : null}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => { setOcrDialogOpen(false); setOcrResult(null); }}>Отмена</Button>
                        {ocrResult && (
                            <Button variant="contained" onClick={handleSaveOCRResult} sx={{ bgcolor: '#764ba2', borderRadius: '10px' }}>
                                💾 Сохранить задание
                            </Button>
                        )}
                    </DialogActions>
                </StyledDialog>

                {/* Ручное создание */}
                <StyledDialog open={manualDialogOpen} onClose={() => setManualDialogOpen(false)} maxWidth="md" fullWidth
                    PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
                    <Box sx={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)', p: 3, color: '#fff' }}>
                        <Typography sx={{ fontSize: '22px', fontWeight: 700 }}>
                            {editItem ? '✏️ Редактировать задание' : '📝 Новое задание'}
                        </Typography>
                    </Box>
                    <DialogContent sx={{ p: 3 }}>
                        <Stack spacing={2}>
                            <TextField 
                                label="Текст задания" 
                                value={manualForm.question} 
                                onChange={(e) => setManualForm({...manualForm, question: e.target.value})}
                                fullWidth multiline rows={5} required 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }} 
                            />
                            <TextField 
                                label="Ответ" 
                                value={manualForm.answer} 
                                onChange={(e) => setManualForm({...manualForm, answer: e.target.value})}
                                fullWidth required 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#ECFDF5' } }} 
                            />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Предмет</InputLabel>
                                        <Select
                                            value={manualForm.subject || 'Информатика'}
                                            onChange={(e) => setManualForm({...manualForm, subject: e.target.value})}
                                            sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                                        >
                                            {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Экзамен</InputLabel>
                                        <Select
                                            value={manualForm.examType || 'ЕГЭ'}
                                            onChange={(e) => setManualForm({...manualForm, examType: e.target.value})}
                                            sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                                        >
                                            {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField 
                                        label="Номер задания (1-27)" 
                                        type="number"
                                        value={manualForm.taskNumber || ''} 
                                        onChange={(e) => setManualForm({...manualForm, taskNumber: e.target.value})}
                                        fullWidth 
                                        inputProps={{ min: 1, max: 27 }}
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <FormControl fullWidth>
                                        <InputLabel>Сложность</InputLabel>
                                        <Select 
                                            value={manualForm.difficulty} 
                                            onChange={(e) => setManualForm({...manualForm, difficulty: e.target.value})}
                                            label="Сложность" 
                                            sx={{ borderRadius: '12px', bgcolor: '#fff' }}
                                        >
                                            <MenuItem value={1}>🟢 Очень лёгкая</MenuItem>
                                            <MenuItem value={2}>🟢 Лёгкая</MenuItem>
                                            <MenuItem value={3}>🟡 Средняя</MenuItem>
                                            <MenuItem value={4}>🔴 Сложная</MenuItem>
                                            <MenuItem value={5}>🔴 Очень сложная</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                            <FormControlLabel
                                control={
                                    <Checkbox 
                                        checked={manualForm.isPublic || false}
                                        onChange={(e) => setManualForm({...manualForm, isPublic: e.target.checked})}
                                    />
                                }
                                label="📢 Опубликовать для всех репетиторов"
                                sx={{ mt: 1 }}
                            />
                            <TextField 
                                label="Тема" 
                                value={manualForm.topic} 
                                onChange={(e) => setManualForm({...manualForm, topic: e.target.value})}
                                fullWidth 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                            />
                            <TextField 
                                label="Пояснение" 
                                value={manualForm.explanation} 
                                onChange={(e) => setManualForm({...manualForm, explanation: e.target.value})}
                                fullWidth multiline rows={3} 
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} 
                            />
                        </Stack>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button onClick={() => { setManualDialogOpen(false); setEditItem(null); }}>Отмена</Button>
                        <Button 
                            variant="contained" 
                            onClick={handleSaveManual} 
                            disabled={savingManual || !manualForm.question || !manualForm.answer}
                            sx={{ bgcolor: '#4F46E5', borderRadius: '12px', px: 4, fontWeight: 600 }}
                        >
                            {editItem ? '💾 Сохранить изменения' : '💾 Создать задание'}
                        </Button>
                    </DialogActions>
                </StyledDialog>

                {/* Диалог варианта (без изменений) */}
                <StyledDialog open={variantDialogOpen} onClose={() => setVariantDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>🔗 Новый вариант</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <ToggleButtonGroup value={variantSource} exclusive
                                onChange={(e, val) => { if (val) { setVariantSource(val); setVariantForm(prev => ({...prev, url: '', taskIds: []})); } }}
                                sx={{ width: '100%' }}>
                                <ToggleButton value="url" sx={{ flex: 1, borderRadius: '12px', textTransform: 'none', py: 1.5 }}>🔗 По ссылке</ToggleButton>
                                <ToggleButton value="tasks" sx={{ flex: 1, borderRadius: '12px', textTransform: 'none', py: 1.5 }}>📝 Из заданий</ToggleButton>
                            </ToggleButtonGroup>
                            <TextField label="Название" value={variantForm.title} onChange={(e) => setVariantForm({...variantForm, title: e.target.value})}
                                fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <FormControl fullWidth><InputLabel>Предмет</InputLabel>
                                    <Select value={variantForm.subject} onChange={(e) => setVariantForm({...variantForm, subject: e.target.value})} sx={{ borderRadius: '10px' }}>
                                        {SUBJECTS.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth><InputLabel>Экзамен</InputLabel>
                                    <Select value={variantForm.examType} onChange={(e) => setVariantForm({...variantForm, examType: e.target.value})} sx={{ borderRadius: '10px' }}>
                                        {EXAM_TYPES.map(e => <MenuItem key={e} value={e}>{e}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            </Box>
                            {variantSource === 'url' ? (
                                <TextField label="Ссылка" value={variantForm.url} onChange={(e) => setVariantForm({...variantForm, url: e.target.value})}
                                    fullWidth required placeholder="https://..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            ) : (
                                <Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography>Заданий: {variantForm.taskIds?.length || 0}</Typography>
                                        <Button size="small" onClick={() => setTaskPickerOpen(true)}>+ Добавить</Button>
                                    </Box>
                                    {variantForm.taskIds?.map((tid, i) => {
                                        const t = tasks.find(x => x.id === tid);
                                        return (
                                            <Paper key={i} sx={{ p: 1, mb: 0.5, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Chip label={`№${i+1}`} size="small" sx={{ bgcolor: '#4F46E5', color: '#fff' }} />
                                                <Typography sx={{ flex: 1, fontSize: '13px' }} noWrap>{t?.topic || `Задание #${tid}`}</Typography>
                                                <IconButton size="small" onClick={() => setVariantForm(prev => ({...prev, taskIds: prev.taskIds.filter(id => id !== tid)}))}>
                                                    <Clear fontSize="small" />
                                                </IconButton>
                                            </Paper>
                                        );
                                    })}
                                </Box>
                            )}
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setVariantDialogOpen(false)}>Отмена</Button>
                        <Button variant="contained" onClick={handleSaveVariant} disabled={savingVariant || !variantForm.title}
                            sx={{ bgcolor: '#10B981', borderRadius: '10px' }}>Создать вариант</Button>
                    </DialogActions>
                </StyledDialog>

                {/* Модальное окно выбора заданий (без изменений) */}
                <Dialog open={taskPickerOpen} onClose={() => setTaskPickerOpen(false)} maxWidth="lg" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>📝 Выберите задания</DialogTitle>
                    <DialogContent>
                        <TextField placeholder="Поиск..." size="small" value={taskPickerSearch} onChange={(e) => setTaskPickerSearch(e.target.value)}
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                        <Grid container spacing={1.5} sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {tasks.filter(t => !taskPickerSearch || (t.topic || '').toLowerCase().includes(taskPickerSearch.toLowerCase())).map(task => {
                                const isSel = variantForm.taskIds?.includes(task.id);
                                return (
                                    <Grid item xs={12} sm={6} key={task.id}>
                                        <Paper onClick={() => {
                                            if (isSel) setVariantForm(prev => ({...prev, taskIds: prev.taskIds.filter(id => id !== task.id)}));
                                            else setVariantForm(prev => ({...prev, taskIds: [...(prev.taskIds || []), task.id]}));
                                        }}
                                        sx={{ p: 2, borderRadius: '12px', cursor: 'pointer', border: `2px solid ${isSel ? '#4F46E5' : '#F3F4F6'}`, bgcolor: isSel ? '#EEF2FF' : '#fff' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                <CheckCircle sx={{ color: isSel ? '#4F46E5' : '#D1D5DB', fontSize: 22 }} />
                                                <Box>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>{task.topic || 'Без названия'}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                                        {task.subject && <Chip label={task.subject} size="small" sx={{ fontSize: '10px' }} />}
                                                        {task.difficulty && <Chip label={`⭐${task.difficulty}`} size="small" sx={{ fontSize: '10px' }} />}
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Paper>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    </DialogContent>
                    <DialogActions><Button onClick={() => setTaskPickerOpen(false)}>Готово</Button></DialogActions>
                </Dialog>

                {/* Диалог плана урока */}
                <StyledDialog open={planDialogOpen} onClose={() => setPlanDialogOpen(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontWeight: 700 }}>📋 План урока</DialogTitle>
                    <DialogContent>
                        <Stack spacing={2} sx={{ pt: 1 }}>
                            <TextField label="Название" value={planForm.title} onChange={(e) => setPlanForm({...planForm, title: e.target.value})} fullWidth required sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            <TextField label="Тема" value={planForm.topic} onChange={(e) => setPlanForm({...planForm, topic: e.target.value})} fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            <TextField label="Структура" value={planForm.lessonStructure} onChange={(e) => setPlanForm({...planForm, lessonStructure: e.target.value})} fullWidth multiline rows={3} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            <TextField label="Цели" value={planForm.learningObjectives} onChange={(e) => setPlanForm({...planForm, learningObjectives: e.target.value})} fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            <TextField label="Материалы" value={planForm.materialsNeeded} onChange={(e) => setPlanForm({...planForm, materialsNeeded: e.target.value})} fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                            <TextField label="Шаблон ДЗ" value={planForm.homeworkTemplate} onChange={(e) => setPlanForm({...planForm, homeworkTemplate: e.target.value})} fullWidth multiline rows={2} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setPlanDialogOpen(false)}>Отмена</Button>
                        <Button variant="contained" onClick={handleSavePlan} disabled={savingPlan} sx={{ bgcolor: '#764ba2', borderRadius: '10px' }}>Сохранить</Button>
                    </DialogActions>
                </StyledDialog>

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}>
                    <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
                </Snackbar>
            </PageContainer>
        </LocalizationProvider>
    );
}

export default TaskBank;