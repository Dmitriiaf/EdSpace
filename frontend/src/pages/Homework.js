// ========== frontend/src/pages/Homework.js (v13 — Таблица + Фильтры: ученик, курс, дата) ==========
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Typography, Card, CardContent, CardActions,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Chip, Grid, Tabs, Tab,
    Paper, IconButton, Rating, Avatar, LinearProgress,
    FormControlLabel, Checkbox, Tooltip, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, TableSortLabel
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon,
    Refresh as RefreshIcon,
    Delete as DeleteIcon,
    Send as SendIcon,
    Upload as UploadIcon,
    RateReview as ReviewIcon,
    CalendarToday as CalendarIcon,
    Grade as GradeIcon,
    Replay as ReplayIcon,
    Schedule as ScheduleIcon,
    CloudUpload as CloudUploadIcon,
    Close as CloseIcon,
    InsertDriveFile as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    Description as DocIcon,
    Search as SearchIcon,
    FilterList as FilterIcon,
    ViewList as ViewListIcon,
    ViewModule as ViewModuleIcon,
    Clear as ClearIcon
} from '@mui/icons-material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format, isAfter, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const HomeworkCard = styled(Card)(({ borderColor }) => ({
    borderRadius: '16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    borderLeft: `5px solid ${borderColor || '#4F46E5'}`,
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        transform: 'translateY(-3px)',
    },
}));

const DropZone = styled(Box)(({ isDragActive }) => ({
    border: `2px dashed ${isDragActive ? '#4F46E5' : '#D1D5DB'}`,
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'center',
    backgroundColor: isDragActive ? '#EEF2FF' : '#FAFAFA',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
        borderColor: '#4F46E5',
        backgroundColor: '#F5F7FF',
    },
}));

const FilePreviewCard = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '10px',
    border: '1px solid #E5E7EB',
    position: 'relative',
    animation: 'fadeIn 0.3s ease',
    '@keyframes fadeIn': {
        from: { opacity: 0, transform: 'translateY(-10px)' },
        to: { opacity: 1, transform: 'translateY(0)' },
    },
});

const ImagePreview = styled('img')({
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
});

const StyledTableRow = styled(TableRow)(({ overdue }) => ({
    backgroundColor: overdue ? '#FFF5F5' : '#FFFFFF',
    '&:hover': { backgroundColor: overdue ? '#FEF2F2' : '#F9FAFB' },
    '&:last-child td, &:last-child th': { border: 0 },
}));

const StyledTableCell = styled(TableCell)({
    padding: '14px 16px',
    borderBottom: '1px solid #F3F4F6',
});

const FilterChip = styled(Chip)(({ active }) => ({
    borderRadius: '8px',
    fontSize: '12px',
    height: 28,
    backgroundColor: active ? '#EEF2FF' : '#F9FAFB',
    color: active ? '#4F46E5' : '#6B7280',
    border: active ? '1px solid #C7D2FE' : '1px solid #E5E7EB',
    cursor: 'pointer',
    '&:hover': {
        backgroundColor: '#EEF2FF',
        color: '#4F46E5',
    },
}));

// ========== УТИЛИТЫ ==========

function getAvatarColor(name) {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#059669', '#3B82F6', '#2563EB', '#6366F1'];
    let hash = 0;
    const str = name || '?';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

function getFileIcon(file) {
    if (!file) return <FileIcon />;
    const type = file.type || '';
    if (type.startsWith('image/')) return <ImageIcon sx={{ color: '#10B981' }} />;
    if (type === 'application/pdf') return <PdfIcon sx={{ color: '#EF4444' }} />;
    if (type.includes('word')) return <DocIcon sx={{ color: '#3B82F6' }} />;
    return <FileIcon sx={{ color: '#6B7280' }} />;
}

function getFilePreviewUrl(file) {
    if (!file) return null;
    if (file.type && file.type.startsWith('image/')) return URL.createObjectURL(file);
    return null;
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Homework() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Домашние задания'; }, []);
    const isTutor = user?.role === 'tutor' || user?.role === 'ROLE_TUTOR';
    
    // ========== СОСТОЯНИЯ ==========
    const [loading, setLoading] = useState(true);
    const [homeworkList, setHomeworkList] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [error, setError] = useState(null);
    
    // Отображение
    const [viewMode, setViewMode] = useState('table');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [studentFilter, setStudentFilter] = useState('ALL');
    const [courseFilter, setCourseFilter] = useState('ALL');
    const [dateFilter, setDateFilter] = useState('ALL');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [sortField, setSortField] = useState('dueDate');
    const [sortDirection, setSortDirection] = useState('asc');
    
    // Диалоги
    const [openAssign, setOpenAssign] = useState(false);
    const [openSubmit, setOpenSubmit] = useState(false);
    const [openCheck, setOpenCheck] = useState(false);
    const [openBankPicker, setOpenBankPicker] = useState(false);
    
    // Формы
    const [newHomework, setNewHomework] = useState({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5' });
    const [submission, setSubmission] = useState('');
    const [grade, setGrade] = useState({ grade: 0, feedback: '', returnForRevision: false });
    const [selectedHomework, setSelectedHomework] = useState(null);
    
    // Файлы
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [assignFiles, setAssignFiles] = useState([]);
    const [isAssignDragActive, setIsAssignDragActive] = useState(false);
    
    // Банк заданий
    const [bankTab, setBankTab] = useState(0);
    const [bankTasks, setBankTasks] = useState([]);
    const [bankVariants, setBankVariants] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);

    useEffect(() => { if (openBankPicker) loadBankItems(); }, [openBankPicker]);
    useEffect(() => { loadHomework(); if (isTutor) { loadStudents(); loadCourses(); } }, []);
    
    useEffect(() => {
        if (!openSubmit) {
            filesToUpload.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
            setFilesToUpload([]);
        }
    }, [openSubmit]);

    // ========== ЗАГРУЗКА ДАННЫХ ==========
    const loadBankItems = async () => {
        setBankLoading(true);
        try {
            const [tasksRes, variantsRes] = await Promise.all([
                axiosInstance.get('/integration/tasks/search'), axiosInstance.get('/variants')
            ]);
            setBankTasks(tasksRes.data || []); setBankVariants(variantsRes.data || []);
        } catch (err) {} finally { setBankLoading(false); }
    };

    const loadHomework = async () => {
        setLoading(true);
        try {
            const endpoint = isTutor ? `/homework/tutor/${user.id}` : `/homework/student/${user.id}/all`;
            setHomeworkList((await axiosInstance.get(endpoint)).data || []);
        } catch (err) { setError('Ошибка загрузки заданий'); } finally { setLoading(false); }
    };

    const loadStudents = async () => {
        try { setStudents((await axiosInstance.get(`/students/tutor/${user.id}`)).data || []); } catch (err) {}
    };

    const loadCourses = async () => {
        try { 
            const res = await axiosInstance.get(`/courses/tutor/${user.id}`);
            setCourses(res.data || []); 
        } catch (err) {}
    };

    // ========== ДЕЙСТВИЯ ==========
    const handleAssign = async () => {
        if (!newHomework.studentId || !newHomework.task) return;
        try {
            if (assignFiles.length > 0) {
                // С файлами — FormData
                const formData = new FormData();
                formData.append('tutorId', user.id);
                formData.append('studentId', newHomework.studentId);
                formData.append('task', newHomework.task);
                if (newHomework.dueDate) formData.append('dueDate', newHomework.dueDate + 'T23:59:59');
                formData.append('status', 'ASSIGNED');
                formData.append('gradeType', newHomework.gradeType || 'GRADE_5');
                assignFiles.forEach(file => formData.append('files', file));
                await axiosInstance.post('/homework', formData);
            } else {
                // Без файлов — JSON
                await axiosInstance.post('/homework', {
                    tutorId: user.id,
                    studentId: newHomework.studentId,
                    task: newHomework.task,
                    dueDate: newHomework.dueDate ? newHomework.dueDate + 'T23:59:59' : null,
                    status: 'ASSIGNED',
                    gradeType: newHomework.gradeType || 'GRADE_5'
                });
            }
            setOpenAssign(false); 
            setNewHomework({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5' }); 
            setAssignFiles([]);
            loadHomework();
        } catch (err) { setError('Ошибка назначения задания'); }
    };

    const handleSubmit = async () => {
        if (!selectedHomework) return;
        try {
            const formData = new FormData(); 
            formData.append('answer', submission || '');
            filesToUpload.forEach(file => formData.append('files', file));
            await axiosInstance.patch(`/homework/${selectedHomework.id}/submit`, formData);
            setOpenSubmit(false); 
            setSelectedHomework(null); 
            setSubmission(''); 
            setFilesToUpload([]); 
            loadHomework();
        } catch (err) { setError('Ошибка отправки задания'); }
    };

        const handleCheck = async () => {
            if (!selectedHomework) return;
            try {
                if (grade.returnForRevision) {
                    await axiosInstance.patch(`/homework/${selectedHomework.id}/revision`, { feedback: grade.feedback });
                } else {
                    // Если ASSIGNED (без ответа) — сразу оцениваем без отправки
                    // Репетитор не может вызывать /submit (доступ только ученику)
                    
                    if (selectedHomework.gradeType === 'GRADE_100' || selectedHomework.gradeType === 'GRADE_10') {
                        const maxScore = selectedHomework.gradeType === 'GRADE_100' ? 100 : 10;
                        await axiosInstance.patch(`/homework/${selectedHomework.id}/grade-with-score`, {
                            score: grade.grade, maxScore: maxScore, feedback: grade.feedback
                        });
                    } else {
                        await axiosInstance.patch(`/homework/${selectedHomework.id}/grade`, {
                            grade: grade.grade, feedback: grade.feedback
                        });
                    }
                }
                setOpenCheck(false); setSelectedHomework(null);
                setGrade({ grade: 0, feedback: '', returnForRevision: false }); loadHomework();
            } catch (err) { setError('Ошибка проверки задания'); }
        };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить задание?')) return;
        try { await axiosInstance.delete(`/homework/${id}`); loadHomework(); } catch (err) { setError('Ошибка удаления'); }
    };

    // ========== DRAG-N-DROP ==========
    const handleDragEnter = useCallback((e, setter) => {
        e.preventDefault(); e.stopPropagation();
        setter(true);
    }, []);

    const handleDragLeave = useCallback((e, setter) => {
        e.preventDefault(); e.stopPropagation();
        setter(false);
    }, []);

    const handleDragOver = useCallback((e, setter) => {
        e.preventDefault(); e.stopPropagation();
        setter(true);
    }, []);

    const handleDrop = useCallback((e, setter, fileSetter, existingFiles) => {
        e.preventDefault(); e.stopPropagation();
        setter(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = validateAndAddFiles(droppedFiles, existingFiles);
        fileSetter(prev => [...prev, ...validFiles]);
    }, []);

    const handleFileSelect = useCallback((e, fileSetter, existingFiles) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = validateAndAddFiles(selectedFiles, existingFiles);
        fileSetter(prev => [...prev, ...validFiles]);
        e.target.value = '';
    }, []);

    const validateAndAddFiles = (files, existingFiles) => {
        const validFiles = [];
        const maxSize = 10 * 1024 * 1024;
        const allowedExtensions = /\.(jpg|jpeg|png|gif|webp|pdf|doc|docx|txt|odt|rtf|xlsx|xls|csv)$/i;

        for (let file of files) {
            if (file.size > maxSize) {
                setError(`Файл "${file.name}" слишком большой. Максимум 10MB`);
                continue;
            }
            if (!allowedExtensions.test(file.name)) {
                setError(`Файл "${file.name}" имеет неподдерживаемый формат`);
                continue;
            }
            if (existingFiles.some(f => f.name === file.name && f.size === file.size)) {
                continue;
            }
            if (file.type && file.type.startsWith('image/')) {
                file.preview = URL.createObjectURL(file);
            }
            validFiles.push(file);
        }
        return validFiles;
    };

    const removeFile = (index, fileSetter, files) => {
        const file = files[index];
        if (file.preview) URL.revokeObjectURL(file.preview);
        fileSetter(prev => prev.filter((_, i) => i !== index));
    };

    // ========== УТИЛИТЫ ==========
    const getStatusConfig = (status) => {
        const configs = {
            'ASSIGNED':  { label: 'Назначено',  color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
            'SUBMITTED': { label: 'Сдано',      color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
            'CHECKED':   { label: 'Проверено',  color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
            'RETURNED':  { label: 'Доработка',  color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
        };
        return configs[(status || '').toUpperCase()] || { label: status, color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' };
    };

    const isOverdue = (hw) => {
        if (!hw.dueDate || (hw.status || '').toUpperCase() === 'CHECKED') return false;
        return isAfter(new Date(), parseISO(hw.dueDate));
    };

    // ========== ФИЛЬТРАЦИЯ И СОРТИРОВКА ==========
    const filteredAndSorted = useMemo(() => {
        let result = [...homeworkList];

        // Поиск
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(hw => 
                (hw.task && hw.task.toLowerCase().includes(q)) ||
                (hw.student?.fullName && hw.student.fullName.toLowerCase().includes(q))
            );
        }

        // Фильтр по статусу
        if (statusFilter !== 'ALL') {
            result = result.filter(hw => (hw.status || '').toUpperCase() === statusFilter);
        }

        // Фильтр по ученику
        if (studentFilter !== 'ALL') {
            result = result.filter(hw => hw.student?.id == studentFilter);
        }

        // Фильтр по курсу
        if (courseFilter !== 'ALL') {
            result = result.filter(hw => hw.course?.id == courseFilter);
        }

        // Фильтр по дате
        if (dateFilter !== 'ALL') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            if (dateFilter === 'TODAY') {
                const tomorrow = new Date(today.getTime() + 86400000);
                result = result.filter(hw => {
                    if (!hw.dueDate) return false;
                    const d = new Date(hw.dueDate);
                    return d >= today && d < tomorrow;
                });
            } else if (dateFilter === 'WEEK') {
                const weekEnd = new Date(today.getTime() + 7 * 86400000);
                result = result.filter(hw => {
                    if (!hw.dueDate) return false;
                    const d = new Date(hw.dueDate);
                    return d >= today && d <= weekEnd;
                });
            } else if (dateFilter === 'MONTH') {
                const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
                result = result.filter(hw => {
                    if (!hw.dueDate) return false;
                    const d = new Date(hw.dueDate);
                    return d >= today && d <= monthEnd;
                });
            } else if (dateFilter === 'OVERDUE') {
                result = result.filter(hw => isOverdue(hw));
            }
        }

        // Сортировка
        result.sort((a, b) => {
            let valA, valB;
            switch (sortField) {
                case 'studentName':
                    valA = (a.student?.fullName || '').toLowerCase();
                    valB = (b.student?.fullName || '').toLowerCase();
                    break;
                case 'status':
                    valA = a.status || '';
                    valB = b.status || '';
                    break;
                case 'dueDate':
                default:
                    valA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
                    valB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
                    break;
            }
            return sortDirection === 'asc' ? valA - valB : valB - valA;
        });

        return result;
    }, [homeworkList, searchQuery, statusFilter, studentFilter, courseFilter, dateFilter, sortField, sortDirection]);

    const paginatedHomework = useMemo(() => {
        const start = page * rowsPerPage;
        return filteredAndSorted.slice(start, start + rowsPerPage);
    }, [filteredAndSorted, page, rowsPerPage]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setStatusFilter('ALL');
        setStudentFilter('ALL');
        setCourseFilter('ALL');
        setDateFilter('ALL');
        setPage(0);
    };

    const hasActiveFilters = searchQuery || statusFilter !== 'ALL' || studentFilter !== 'ALL' || courseFilter !== 'ALL' || dateFilter !== 'ALL';

    // ========== СТАТИСТИКА ==========
    const stats = useMemo(() => {
        const total = homeworkList.length;
        const submitted = homeworkList.filter(h => (h.status || '').toUpperCase() === 'SUBMITTED').length;
        const checked = homeworkList.filter(h => (h.status || '').toUpperCase() === 'CHECKED').length;
        const overdue = homeworkList.filter(h => isOverdue(h)).length;
        return { total, submitted, checked, overdue };
    }, [homeworkList]);

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: { xs: '22px', sm: '28px' }, fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
                        {isTutor ? '📋 Домашние задания' : '📝 Мои задания'}
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {isTutor 
                            ? `${stats.total} заданий • ${stats.submitted} на проверке • ${stats.overdue} просрочено` 
                            : 'Ваши активные и проверенные задания'}
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <StyledButton variant="outlined" startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} onClick={loadHomework}
                        sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '10px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                        Обновить
                    </StyledButton>
                    {isTutor && (
                        <StyledButton variant="contained" startIcon={<AddIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenAssign(true)}
                            sx={{ bgcolor: '#4F46E5', borderRadius: '10px', '&:hover': { bgcolor: '#4338CA' } }}>
                            Назначить ДЗ
                        </StyledButton>
                    )}
                </Box>
            </Box>

            {/* ========== СТАТИСТИКА (репетитор) ========== */}
            {isTutor && (
                <Grid container spacing={1.5} sx={{ mb: 3 }}>
                    {[
                        { label: 'Всего', value: stats.total, icon: AssignmentIcon, color: '#4F46E5', bg: '#EEF2FF' },
                        { label: 'На проверке', value: stats.submitted, icon: ReviewIcon, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: 'Проверено', value: stats.checked, icon: CheckIcon, color: '#10B981', bg: '#ECFDF5' },
                        { label: 'Просрочено', value: stats.overdue, icon: ScheduleIcon, color: '#EF4444', bg: '#FEF2F2' },
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Grid item xs={6} md={3} key={i}>
                                <Paper sx={{ 
                                    p: { xs: 1.5, sm: 2.5 }, 
                                    borderRadius: '12px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                                    bgcolor: '#FFFFFF', border: '1px solid #F3F4F6',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                                }}>
                                    <Box>
                                        <Typography sx={{ fontSize: { xs: '18px', sm: '24px' }, fontWeight: 700, color: '#1F2937', lineHeight: 1.2 }}>{stat.value}</Typography>
                                        <Typography sx={{ fontSize: { xs: '11px', sm: '13px' }, color: '#6B7280', mt: 0.5 }}>{stat.label}</Typography>
                                    </Box>
                                    <Box sx={{ width: { xs: 36, sm: 42 }, height: { xs: 36, sm: 42 }, borderRadius: '12px', backgroundColor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Icon sx={{ fontSize: { xs: 18, sm: 20 }, color: stat.color }} />
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ========== ПОИСК + ФИЛЬТРЫ + ПЕРЕКЛЮЧЕНИЕ ВИДА ========== */}
            <Paper sx={{ p: 2, mb: 2.5, borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                {/* Первая строка: поиск + статус + переключатель */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: isTutor ? 1.5 : 0 }}>
                    <TextField
                        placeholder="Поиск по заданию или ученику..."
                        size="small"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment>,
                            endAdornment: searchQuery ? (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => { setSearchQuery(''); setPage(0); }}><ClearIcon fontSize="small" /></IconButton>
                                </InputAdornment>
                            ) : null,
                        }}
                        sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#F9FAFB' } }}
                    />

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {['ALL', 'ASSIGNED', 'SUBMITTED', 'CHECKED', 'RETURNED'].map(status => (
                            <FilterChip
                                key={status}
                                label={status === 'ALL' ? 'Все' : getStatusConfig(status).label}
                                active={statusFilter === status}
                                onClick={() => { setStatusFilter(status); setPage(0); }}
                            />
                        ))}
                    </Box>

                    <Box sx={{ ml: 'auto', display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Таблица">
                            <IconButton onClick={() => setViewMode('table')}
                                sx={{ bgcolor: viewMode === 'table' ? '#EEF2FF' : 'transparent', color: viewMode === 'table' ? '#4F46E5' : '#9CA3AF', '&:hover': { bgcolor: '#F3F4F6' } }}>
                                <ViewListIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Карточки">
                            <IconButton onClick={() => setViewMode('cards')}
                                sx={{ bgcolor: viewMode === 'cards' ? '#EEF2FF' : 'transparent', color: viewMode === 'cards' ? '#4F46E5' : '#9CA3AF', '&:hover': { bgcolor: '#F3F4F6' } }}>
                                <ViewModuleIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* Вторая строка: фильтры репетитора */}
                {isTutor && (
                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap', pt: 0.5 }}>
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                            <InputLabel sx={{ fontSize: '13px' }}>👤 Ученик</InputLabel>
                            <Select value={studentFilter} onChange={(e) => { setStudentFilter(e.target.value); setPage(0); }} label="👤 Ученик"
                                sx={{ borderRadius: '10px', bgcolor: '#FFFFFF', fontSize: '13px' }}>
                                <MenuItem value="ALL">Все ученики</MenuItem>
                                {students.map(s => (<MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>))}
                            </Select>
                        </FormControl>

                        {courses.length > 0 && (
                            <FormControl size="small" sx={{ minWidth: 180 }}>
                                <InputLabel sx={{ fontSize: '13px' }}>📚 Курс</InputLabel>
                                <Select value={courseFilter} onChange={(e) => { setCourseFilter(e.target.value); setPage(0); }} label="📚 Курс"
                                    sx={{ borderRadius: '10px', bgcolor: '#FFFFFF', fontSize: '13px' }}>
                                    <MenuItem value="ALL">Все курсы</MenuItem>
                                    {courses.map(c => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                                </Select>
                            </FormControl>
                        )}

                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                            {[
                                { value: 'ALL', label: '📅 Всё время' },
                                { value: 'TODAY', label: 'Сегодня' },
                                { value: 'WEEK', label: 'Неделя' },
                                { value: 'MONTH', label: 'Месяц' },
                                { value: 'OVERDUE', label: '⚠️ Просрочено' },
                            ].map(item => (
                                <FilterChip key={item.value} label={item.label} active={dateFilter === item.value}
                                    onClick={() => { setDateFilter(item.value); setPage(0); }} />
                            ))}
                        </Box>

                        {hasActiveFilters && (
                            <StyledButton size="small" variant="text" startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                                onClick={resetFilters}
                                sx={{ color: '#EF4444', fontSize: '12px', '&:hover': { bgcolor: '#FEF2F2' } }}>
                                Сбросить
                            </StyledButton>
                        )}
                    </Box>
                )}
            </Paper>

            {/* ========== ТАБЛИЦА ========== */}
            {viewMode === 'table' && (
                <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', overflow: 'hidden' }}>
                    <TableContainer>
                        <Table>
                            <TableHead>
                                <TableRow sx={{ backgroundColor: '#F9FAFB' }}>
                                    {isTutor && (
                                        <StyledTableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px' }}>
                                            <TableSortLabel active={sortField === 'studentName'} direction={sortField === 'studentName' ? sortDirection : 'asc'}
                                                onClick={() => handleSort('studentName')}>Ученик</TableSortLabel>
                                        </StyledTableCell>
                                    )}
                                    <StyledTableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px' }}>Задание</StyledTableCell>
                                    <StyledTableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px' }}>
                                        <TableSortLabel active={sortField === 'status'} direction={sortField === 'status' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('status')}>Статус</TableSortLabel>
                                    </StyledTableCell>
                                    <StyledTableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px' }}>
                                        <TableSortLabel active={sortField === 'dueDate'} direction={sortField === 'dueDate' ? sortDirection : 'asc'}
                                            onClick={() => handleSort('dueDate')}>Срок</TableSortLabel>
                                    </StyledTableCell>
                                    {isTutor && <StyledTableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px' }}>Оценка</StyledTableCell>}
                                    <StyledTableCell sx={{ fontWeight: 600, color: '#6B7280', fontSize: '13px', width: 180 }}>Действия</StyledTableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {paginatedHomework.length === 0 ? (
                                    <TableRow>
                                        <StyledTableCell colSpan={isTutor ? 6 : 4} align="center">
                                            <Box sx={{ py: 6 }}>
                                                <AssignmentIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                                                <Typography sx={{ color: '#9CA3AF', fontSize: '16px', fontWeight: 500 }}>
                                                    {hasActiveFilters ? 'Ничего не найдено' : 'Нет заданий'}
                                                </Typography>
                                                <Typography sx={{ color: '#9CA3AF', fontSize: '14px' }}>
                                                    {hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Назначьте первое домашнее задание'}
                                                </Typography>
                                            </Box>
                                        </StyledTableCell>
                                    </TableRow>
                                ) : (
                                    paginatedHomework.map(hw => {
                                        const statusConfig = getStatusConfig(hw.status);
                                        const overdue = isOverdue(hw);
                                        return (
                                            <StyledTableRow key={hw.id} overdue={overdue}>
                                                {isTutor && (
                                                    <StyledTableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(hw.student?.fullName || '?'), fontSize: 12, fontWeight: 600 }}>
                                                                {getInitials(hw.student?.fullName || '?')}
                                                            </Avatar>
                                                            <Typography sx={{ fontWeight: 500, color: '#1F2937', fontSize: '14px' }}>
                                                                {hw.student?.fullName || 'Ученик'}
                                                            </Typography>
                                                        </Box>
                                                    </StyledTableCell>
                                                )}
                                                <StyledTableCell>
                                                    <Typography sx={{ color: '#374151', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 300 }}>
                                                        {hw.task || '—'}
                                                    </Typography>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flexWrap: 'wrap' }}>
                                                        <Chip label={statusConfig.label} size="small"
                                                            sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 600, fontSize: '11px', height: 24, borderRadius: '6px', border: `1px solid ${statusConfig.dot}40` }} />
                                                        {overdue && (
                                                            <Chip label="Просрочено" size="small" icon={<ScheduleIcon sx={{ fontSize: 12, color: '#DC2626 !important' }} />}
                                                                sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: '11px', height: 24, borderRadius: '6px', border: '1px solid #FECACA' }} />
                                                        )}
                                                    </Box>
                                                </StyledTableCell>
                                                <StyledTableCell>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CalendarIcon sx={{ fontSize: 14, color: overdue ? '#EF4444' : '#9CA3AF' }} />
                                                        <Typography sx={{ fontSize: '13px', color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 600 : 400 }}>
                                                            {hw.dueDate ? format(new Date(hw.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                        </Typography>
                                                    </Box>
                                                </StyledTableCell>
                                                {isTutor && (
                                                    <StyledTableCell>
                                                        {hw.grade != null ? (
                                                            <Chip label={hw.gradeType === 'GRADE_100' ? `💯 ${hw.score || hw.grade}/100` : hw.gradeType === 'GRADE_10' ? `📊 ${hw.score || hw.grade}/10` : `⭐ ${hw.grade}/5`}
                                                                size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700, borderRadius: '6px', fontSize: '12px' }} />
                                                        ) : (
                                                            <Typography sx={{ color: '#9CA3AF', fontSize: '13px' }}>—</Typography>
                                                        )}
                                                    </StyledTableCell>
                                                )}
                                                <StyledTableCell>
                                                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                        {isTutor && (hw.status || '').toUpperCase() === 'SUBMITTED' && (
                                                            <StyledButton variant="contained" size="small"
                                                                onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                                sx={{ bgcolor: '#10B981', borderRadius: '6px', fontSize: '12px', px: 1.5, py: 0.5, '&:hover': { bgcolor: '#059669' } }}>
                                                                <CheckIcon sx={{ fontSize: 14, mr: 0.5 }} /> Проверить
                                                            </StyledButton>
                                                        )}
                                                        {isTutor && (hw.status || '').toUpperCase() === 'ASSIGNED' && (
                                                            <StyledButton variant="outlined" size="small"
                                                                onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                                sx={{ color: '#6B7280', borderColor: '#D1D5DB', borderRadius: '6px', fontSize: '12px', px: 1.5, py: 0.5, '&:hover': { bgcolor: '#F9FAFB' } }}>
                                                                <ReviewIcon viewIcon sx={{ fontSize: 14, mr: 0.5 }} /> Проверить без ответа
                                                            </StyledButton>
                                                        )}
                                                        {isTutor && (hw.status || '').toUpperCase() === 'CHECKED' && (
                                                            <StyledButton variant="outlined" size="small"
                                                                onClick={() => { setSelectedHomework(hw); setOpenCheck(true); }}
                                                                sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '6px', fontSize: '12px', px: 1.5, py: 0.5 }}>
                                                                <ReviewIcon sx={{ fontSize: 14, mr: 0.5 }} /> Смотреть
                                                            </StyledButton>
                                                        )}
                                                        {!isTutor && ((hw.status || '').toUpperCase() === 'ASSIGNED' || (hw.status || '').toUpperCase() === 'RETURNED') && (
                                                            <StyledButton variant="contained" size="small"
                                                                onClick={() => { setSelectedHomework(hw); setSubmission(''); setFilesToUpload([]); setOpenSubmit(true); }}
                                                                sx={{ bgcolor: '#4F46E5', borderRadius: '6px', fontSize: '12px', px: 1.5, py: 0.5, '&:hover': { bgcolor: '#4338CA' } }}>
                                                                <SendIcon sx={{ fontSize: 14, mr: 0.5 }} /> Сдать
                                                            </StyledButton>
                                                        )}
                                                        {isTutor && (
                                                            <Tooltip title="Удалить">
                                                                <IconButton size="small" onClick={() => handleDelete(hw.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}>
                                                                    <DeleteIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </Box>
                                                </StyledTableCell>
                                            </StyledTableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        rowsPerPageOptions={[15, 25, 50, 100]}
                        component="div"
                        count={filteredAndSorted.length}
                        rowsPerPage={rowsPerPage}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                        labelRowsPerPage="Записей на странице:"
                        labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
                        sx={{ borderTop: '1px solid #F3F4F6' }}
                    />
                </Paper>
            )}

            {/* ========== КАРТОЧКИ ========== */}
            {viewMode === 'cards' && (
                <>
                    {filteredAndSorted.length === 0 ? (
                        <Paper sx={{ borderRadius: '16px', bgcolor: '#FFFFFF', p: 6, textAlign: 'center' }}>
                            <EmptyStateIcon sx={{ mb: 2 }}><AssignmentIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                                {hasActiveFilters ? 'Ничего не найдено' : isTutor ? 'Нет заданий' : 'У вас пока нет заданий'}
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                                {hasActiveFilters ? 'Попробуйте изменить фильтры' : isTutor ? 'Назначьте первое домашнее задание' : 'Здесь появятся задания от репетитора'}
                            </Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {filteredAndSorted.slice(page * rowsPerPage, (page + 1) * rowsPerPage).map(hw => {
                                const statusConfig = getStatusConfig(hw.status);
                                const overdue = isOverdue(hw);
                                return (
                                    <Grid item xs={12} sm={6} md={6} lg={4} key={hw.id}>
                                        <HomeworkCard borderColor={overdue ? '#EF4444' : statusConfig.dot}>
                                            <CardContent sx={{ p: 2.5, pb: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5, gap: 1, flexWrap: 'wrap' }}>
                                                    <Chip label={statusConfig.label} size="small" sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 600, fontSize: '11px', height: 26, borderRadius: '8px', border: `1px solid ${statusConfig.dot}40` }} />
                                                    {overdue && (
                                                        <Chip icon={<ScheduleIcon sx={{ fontSize: 12, color: '#DC2626 !important' }} />} label="Просрочено" size="small" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 600, fontSize: '11px', height: 26, borderRadius: '8px', border: '1px solid #FECACA' }} />
                                                    )}
                                                </Box>
                                                {isTutor && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                                        <Avatar sx={{ width: 34, height: 34, bgcolor: getAvatarColor(hw.student?.fullName || '?'), fontSize: 13, fontWeight: 600 }}>
                                                            {getInitials(hw.student?.fullName || '?')}
                                                        </Avatar>
                                                        <Typography sx={{ fontWeight: 600, color: '#1F2937', fontSize: '15px' }}>{hw.student?.fullName || 'Ученик'}</Typography>
                                                    </Box>
                                                )}
                                                <Typography sx={{ color: '#374151', lineHeight: 1.6, mb: 2, fontSize: '14px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', bgcolor: '#F9FAFB', p: 1.5, borderRadius: '10px' }}>{hw.task}</Typography>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <CalendarIcon sx={{ fontSize: 14, color: overdue ? '#EF4444' : '#9CA3AF' }} />
                                                        <Typography sx={{ fontSize: '13px', color: overdue ? '#EF4444' : '#6B7280', fontWeight: overdue ? 600 : 400 }}>
                                                            {hw.dueDate ? format(new Date(hw.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                        </Typography>
                                                    </Box>
                                                    {hw.grade != null && (
                                                        <Chip label={`⭐ ${hw.grade}/5`} size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700, borderRadius: '8px', fontSize: '12px' }} />
                                                    )}
                                                </Box>
                                            </CardContent>
                                            <CardActions sx={{ px: 2.5, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {isTutor && (hw.status || '').toUpperCase() === 'SUBMITTED' && (
                                                        <StyledButton variant="contained" startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                            sx={{ bgcolor: '#10B981', borderRadius: '8px', '&:hover': { bgcolor: '#059669' }, fontSize: '13px' }}>Проверить</StyledButton>
                                                    )}
                                                    {isTutor && (hw.status || '').toUpperCase() === 'ASSIGNED' && (
                                                        <StyledButton variant="outlined" startIcon={<ReviewIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => { setSelectedHomework(hw); setGrade({ grade: 0, feedback: '', returnForRevision: false }); setOpenCheck(true); }}
                                                            sx={{ color: '#6B7280', borderColor: '#D1D5DB', borderRadius: '8px', fontSize: '13px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                                            Проверить без ответа
                                                        </StyledButton>
                                                    )}
                                                    {isTutor && (hw.status || '').toUpperCase() === 'CHECKED' && (
                                                        <StyledButton variant="outlined" startIcon={<ReviewIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => { setSelectedHomework(hw); setOpenCheck(true); }}
                                                            sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '8px', fontSize: '13px', '&:hover': { bgcolor: '#F9FAFB' } }}>Посмотреть</StyledButton>
                                                    )}
                                                    {!isTutor && ((hw.status || '').toUpperCase() === 'ASSIGNED' || (hw.status || '').toUpperCase() === 'RETURNED') && (
                                                        <StyledButton variant="contained" startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                                                            onClick={() => { setSelectedHomework(hw); setSubmission(''); setFilesToUpload([]); setOpenSubmit(true); }}
                                                            sx={{ bgcolor: '#4F46E5', borderRadius: '8px', '&:hover': { bgcolor: '#4338CA' }, fontSize: '13px' }}>Сдать</StyledButton>
                                                    )}
                                                </Box>
                                                {isTutor && (
                                                    <Tooltip title="Удалить">
                                                        <IconButton size="small" onClick={() => handleDelete(hw.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}><DeleteIcon fontSize="small" /></IconButton>
                                                    </Tooltip>
                                                )}
                                            </CardActions>
                                        </HomeworkCard>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                    {filteredAndSorted.length > rowsPerPage && (
                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                            <TablePagination
                                rowsPerPageOptions={[15, 25, 50, 100]}
                                component="div"
                                count={filteredAndSorted.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={(e, newPage) => setPage(newPage)}
                                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                                labelRowsPerPage="Записей:"
                                labelDisplayedRows={({ from, to, count }) => `${from}-${to} из ${count}`}
                            />
                        </Box>
                    )}
                </>
            )}

            {/* ========== ДИАЛОГ НАЗНАЧЕНИЯ ДЗ ========== */}
            {isTutor && (
                <StyledDialog open={openAssign} onClose={() => { setOpenAssign(false); setAssignFiles([]); }} maxWidth="sm" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Avatar sx={{ bgcolor: '#EEF2FF', width: 36, height: 36 }}><AssignmentIcon sx={{ color: '#4F46E5', fontSize: 18 }} /></Avatar>
                            ✨ Назначить домашнее задание
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <FormControl fullWidth><InputLabel>Ученик</InputLabel>
                                <Select value={newHomework.studentId} onChange={(e) => setNewHomework({ ...newHomework, studentId: e.target.value })} label="Ученик" sx={{ borderRadius: '10px' }}>
                                    {students.map(s => (<MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="Задание" multiline rows={4} value={newHomework.task} onChange={(e) => setNewHomework({ ...newHomework, task: e.target.value })} placeholder="Текст задания или ссылка на вариант" sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            
                            <StyledButton variant="outlined" onClick={() => setOpenBankPicker(true)} sx={{ color: '#6B7280', borderColor: '#D1D5DB', borderRadius: '10px' }}>
                                📋 Выбрать из банка
                            </StyledButton>

                            <Box>
                                <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>📎 Прикрепить материалы (необязательно)</Typography>
                                <DropZone isDragActive={isAssignDragActive} onClick={() => document.getElementById('assign-file-input').click()}
                                    onDragEnter={(e) => handleDragEnter(e, setIsAssignDragActive)} onDragLeave={(e) => handleDragLeave(e, setIsAssignDragActive)}
                                    onDragOver={(e) => handleDragOver(e, setIsAssignDragActive)} onDrop={(e) => handleDrop(e, setIsAssignDragActive, setAssignFiles, assignFiles)}>
                                    <input id="assign-file-input" type="file" hidden multiple onChange={(e) => handleFileSelect(e, setAssignFiles, assignFiles)} />
                                    <CloudUploadIcon sx={{ fontSize: 36, color: isAssignDragActive ? '#4F46E5' : '#9CA3AF', mb: 1 }} />
                                    <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>
                                        {isAssignDragActive ? '✨ Отпустите файлы здесь' : 'Перетащите файлы сюда'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>или нажмите для выбора • Максимум 10MB на файл</Typography>
                                </DropZone>
                                {assignFiles.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1 }}>Прикреплено: {assignFiles.length} файл(а)</Typography>
                                        {assignFiles.map((file, index) => (
                                            <FilePreviewCard key={index} sx={{ mb: 1 }}>
                                                {file.type && file.type.startsWith('image/') ? (
                                                    <ImagePreview src={getFilePreviewUrl(file)} alt={file.name} />
                                                ) : (
                                                    <Box sx={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{getFileIcon(file)}</Box>
                                                )}
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</Typography>
                                                    <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>{formatFileSize(file.size)}</Typography>
                                                </Box>
                                                <IconButton size="small" onClick={() => removeFile(index, setAssignFiles, assignFiles)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}><CloseIcon fontSize="small" /></IconButton>
                                            </FilePreviewCard>
                                        ))}
                                    </Box>
                                )}
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField fullWidth label="Срок сдачи" type="date" value={newHomework.dueDate} onChange={(e) => setNewHomework({ ...newHomework, dueDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                <FormControl fullWidth><InputLabel>Шкала</InputLabel>
                                    <Select value={newHomework.gradeType || 'GRADE_5'} onChange={(e) => setNewHomework({ ...newHomework, gradeType: e.target.value })} label="Шкала" sx={{ borderRadius: '10px' }}>
                                        <MenuItem value="GRADE_5">⭐ 5-балльная</MenuItem>
                                        <MenuItem value="GRADE_10">📊 10-балльная</MenuItem>
                                        <MenuItem value="GRADE_100">💯 100-балльная</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => { setOpenAssign(false); setAssignFiles([]); }} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleAssign} variant="contained" disabled={!newHomework.studentId || !newHomework.task} sx={{ bgcolor: '#4F46E5', borderRadius: '10px' }}>Назначить</StyledButton>
                    </DialogActions>
                </StyledDialog>
            )}

            {/* ========== БАНК ЗАДАНИЙ ========== */}
            <StyledDialog open={openBankPicker} onClose={() => setOpenBankPicker(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, px: 3, pt: 3 }}>📚 Банк заданий</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Tabs value={bankTab} onChange={(e, v) => setBankTab(v)} sx={{ mb: 2 }}><Tab label="Задания" /><Tab label="Варианты" /></Tabs>
                    {bankLoading ? <CircularProgress sx={{ color: '#4F46E5' }} /> : (
                        <Grid container spacing={1} sx={{ maxHeight: 400, overflow: 'auto' }}>
                            {(bankTab === 0 ? bankTasks : bankVariants).map(item => (
                                <Grid item xs={12} key={item.id}>
                                    <Paper sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '10px', cursor: 'pointer', '&:hover': { bgcolor: '#EEF2FF' } }}
                                        onClick={() => { setNewHomework({ ...newHomework, task: item.question || item.topic || item.url || item.title }); setOpenBankPicker(false); }}>
                                        <Typography sx={{ fontSize: '14px' }}>{item.question || item.topic || item.title}</Typography>
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions><StyledButton onClick={() => setOpenBankPicker(false)}>Отмена</StyledButton></DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ СДАЧИ ДЗ ========== */}
            <StyledDialog open={openSubmit} onClose={() => { setOpenSubmit(false); setSubmission(''); setFilesToUpload([]); }} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: '#EEF2FF', width: 36, height: 36 }}><SendIcon sx={{ color: '#4F46E5', fontSize: 18 }} /></Avatar>
                        Сдать задание
                    </Box>
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {selectedHomework && (
                        <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <Paper sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>📋 Задание:</Typography>
                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.6 }}>{selectedHomework.task}</Typography>
                            </Paper>
                            <TextField fullWidth label="✏️ Ваш ответ" multiline rows={5} value={submission} onChange={(e) => setSubmission(e.target.value)} placeholder="Введите ответ..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                            <Box>
                                <Typography sx={{ fontSize: '12px', color: '#6B7280', mb: 1, fontWeight: 500 }}>📎 Прикрепить файлы (фото, PDF, документы)</Typography>
                                <DropZone isDragActive={isDragActive} onClick={() => document.getElementById('file-input')?.click()}
                                    onDragEnter={(e) => handleDragEnter(e, setIsDragActive)} onDragLeave={(e) => handleDragLeave(e, setIsDragActive)}
                                    onDragOver={(e) => handleDragOver(e, setIsDragActive)} onDrop={(e) => handleDrop(e, setIsDragActive, setFilesToUpload, filesToUpload)}>
                                    <input id="file-input" type="file" hidden multiple onChange={(e) => handleFileSelect(e, setFilesToUpload, filesToUpload)} />
                                    {filesToUpload.length === 0 ? (
                                        <>
                                            <CloudUploadIcon sx={{ fontSize: 40, color: isDragActive ? '#4F46E5' : '#9CA3AF', mb: 1 }} />
                                            <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 500 }}>{isDragActive ? '✨ Отпустите файлы здесь' : 'Перетащите файлы сюда'}</Typography>
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>или нажмите для выбора • Максимум 10MB на файл</Typography>
                                        </>
                                    ) : (
                                        <>
                                            <CloudUploadIcon sx={{ fontSize: 32, color: '#4F46E5', mb: 0.5 }} />
                                            <Typography sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 500 }}>Добавить ещё файлы</Typography>
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>Перетащите или нажмите сюда</Typography>
                                        </>
                                    )}
                                </DropZone>
                                {filesToUpload.length > 0 && (
                                    <Box sx={{ mt: 2 }}>
                                        <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 1.5, fontWeight: 500 }}>
                                            Прикреплено: {filesToUpload.length} файл(а) • {formatFileSize(filesToUpload.reduce((sum, f) => sum + f.size, 0))}
                                        </Typography>
                                        <Grid container spacing={1.5}>
                                            {filesToUpload.map((file, index) => (
                                                <Grid item xs={12} key={index}>
                                                    <FilePreviewCard>
                                                        {file.type && file.type.startsWith('image/') ? (
                                                            <ImagePreview src={getFilePreviewUrl(file)} alt={file.name} />
                                                        ) : (
                                                            <Box sx={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px', bgcolor: '#F3F4F6' }}>{getFileIcon(file)}</Box>
                                                        )}
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: '13px', fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</Typography>
                                                            <Typography sx={{ fontSize: '11px', color: '#6B7280' }}>{formatFileSize(file.size)}</Typography>
                                                        </Box>
                                                        <IconButton size="small" onClick={() => removeFile(index, setFilesToUpload, filesToUpload)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444', bgcolor: '#FEF2F2' } }}><CloseIcon fontSize="small" /></IconButton>
                                                    </FilePreviewCard>
                                                </Grid>
                                            ))}
                                        </Grid>
                                    </Box>
                                )}
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => { setOpenSubmit(false); setFilesToUpload([]); }} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSubmit} variant="contained" disabled={!submission && filesToUpload.length === 0} sx={{ bgcolor: '#4F46E5', borderRadius: '10px' }}>
                        <SendIcon sx={{ fontSize: 16, mr: 0.5 }} /> Отправить
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ ПРОВЕРКИ ========== */}
            <StyledDialog open={openCheck} onClose={() => setOpenCheck(false)} maxWidth="lg" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                    {selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Просмотр' : 'Проверить'} — {selectedHomework?.student?.fullName}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    {selectedHomework && (
                        <Box sx={{ pt: 2 }}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', height: '100%' }}>
                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', mb: 1, fontWeight: 600 }}>📋 Задание</Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{selectedHomework.task}</Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} md={6}>
                                    <Paper sx={{ p: 2.5, bgcolor: '#EEF2FF', borderRadius: '12px', border: '1px solid #C7D2FE', height: '100%' }}>
                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', mb: 1, fontWeight: 600 }}>✏️ Ответ ученика</Typography>
                                        {selectedHomework.attachments ? (
                                            <Box>
                                                {selectedHomework.attachments.split('\n').map((line, i) => {
                                                    if (line.startsWith('/uploads/')) {
                                                        return (
                                                            <StyledButton key={i} variant="outlined" size="small"
                                                                href={`https://ed-space.ru/api/homework/file/${line.replace('/uploads/homework/', '')}`} target="_blank"
                                                                sx={{ mr: 1, mb: 1, color: '#4F46E5', borderColor: '#C7D2FE', borderRadius: '8px', fontSize: '12px' }}>
                                                                📎 {line.split('/').pop()}
                                                            </StyledButton>
                                                        );
                                                    }
                                                    return <Typography key={i} sx={{ fontSize: '14px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{line}</Typography>;
                                                })}
                                            </Box>
                                        ) : (
                                            <Typography sx={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>Ученик не прикрепил ответ</Typography>
                                        )}
                                    </Paper>
                                </Grid>
                            </Grid>

                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                    {['Отлично!', 'Есть ошибки', 'Покажи решение', 'Оформление'].map(tpl => (
                                        <Chip key={tpl} label={tpl} size="small" variant="outlined"
                                            onClick={() => setGrade({ ...grade, feedback: grade.feedback ? grade.feedback + '\n' + tpl : tpl })}
                                            sx={{ cursor: 'pointer', borderRadius: '8px', fontSize: '11px', '&:hover': { borderColor: '#4F46E5', color: '#4F46E5', bgcolor: '#EEF2FF' } }} />
                                    ))}
                                </Box>
                            )}

                            {selectedHomework?.status?.toUpperCase() === 'CHECKED' && selectedHomework.grade != null && (
                                <Box sx={{ mt: 3, p: 2.5, bgcolor: '#ECFDF5', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
                                    <Typography sx={{ fontWeight: 600, color: '#065F46', fontSize: '16px' }}>
                                        ✅ Оценка: {selectedHomework.gradeType === 'GRADE_100' ? `💯 ${selectedHomework.score || selectedHomework.grade}/100` : selectedHomework.gradeType === 'GRADE_10' ? `📊 ${selectedHomework.score || selectedHomework.grade}/10` : `⭐ ${selectedHomework.grade}/5`}
                                    </Typography>
                                    {selectedHomework.feedback && <Typography sx={{ color: '#374151', mt: 1.5, fontSize: '14px' }}>💬 {selectedHomework.feedback}</Typography>}
                                </Box>
                            )}

                            {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                                <Box sx={{ mt: 3 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#1F2937', mb: 2, fontSize: '16px' }}>Оценивание</Typography>
                                    <Paper sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB', mb: 2 }}>
                                        {(selectedHomework.gradeType === 'GRADE_5' || selectedHomework.gradeType === 'GRADE_10') && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Оценка:</Typography>
                                                <Rating value={grade.grade} onChange={(e, v) => setGrade({ ...grade, grade: v })} max={selectedHomework.gradeType === 'GRADE_10' ? 10 : 5} size="large" />
                                                <Typography sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 600 }}>{grade.grade > 0 ? `${grade.grade}/${selectedHomework.gradeType === 'GRADE_10' ? 10 : 5}` : ''}</Typography>
                                            </Box>
                                        )}
                                        {selectedHomework.gradeType === 'GRADE_100' && (
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Баллы (0-100):</Typography>
                                                <TextField type="number" value={grade.grade || ''} onChange={(e) => setGrade({ ...grade, grade: parseInt(e.target.value) || 0 })} inputProps={{ min: 0, max: 100 }} size="small" sx={{ width: 100, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                                <Typography sx={{ fontSize: '14px', color: '#4F46E5', fontWeight: 600 }}>{grade.grade > 0 ? `${grade.grade}/100` : ''}</Typography>
                                            </Box>
                                        )}
                                    </Paper>
                                    <TextField fullWidth label="Комментарий" multiline rows={3} value={grade.feedback} onChange={(e) => setGrade({ ...grade, feedback: e.target.value })} placeholder="Что хорошо, что исправить..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }} />
                                    <FormControlLabel control={<Checkbox checked={grade.returnForRevision} onChange={(e) => setGrade({ ...grade, returnForRevision: e.target.checked })} />} label="Вернуть на доработку" sx={{ mt: 1, color: '#92400E' }} />
                                </Box>
                            )}
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenCheck(false)} sx={{ color: '#6B7280' }}>{selectedHomework?.status?.toUpperCase() === 'CHECKED' ? 'Закрыть' : 'Отмена'}</StyledButton>
                    {selectedHomework?.status?.toUpperCase() !== 'CHECKED' && (
                        <StyledButton onClick={handleCheck} variant="contained" startIcon={grade.returnForRevision ? <ReplayIcon /> : <CheckIcon />}
                            sx={{ bgcolor: grade.returnForRevision ? '#F59E0B' : '#10B981', borderRadius: '10px', '&:hover': { bgcolor: grade.returnForRevision ? '#D97706' : '#059669' } }}>
                            {grade.returnForRevision ? 'Вернуть' : 'Проверить'}
                        </StyledButton>
                    )}
                </DialogActions>
            </StyledDialog>
        </PageContainer>
    );
}

export default Homework;