// frontend/src/pages/StudentHomework.js
// Список-строки + улучшенное окно сдачи для ученика
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Typography, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Alert, Chip, Grid, IconButton, Avatar, Tooltip,
    Accordion, AccordionSummary, AccordionDetails, Divider,
    LinearProgress, Collapse,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon,
    Assignment as AssignmentIcon,
    Refresh as RefreshIcon,
    Send as SendIcon,
    CalendarToday as CalendarIcon,
    Schedule as ScheduleIcon,
    CloudUpload as CloudUploadIcon,
    Close as CloseIcon,
    InsertDriveFile as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    Description as DocIcon,
    EmojiEvents as TrophyIcon,
    OpenInNew as OpenInNewIcon,
    Link as LinkIcon,
    ExpandMore as ExpandMoreIcon,
    Comment as CommentIcon,
    AccessTime as TimeIcon,
    ZoomIn as ZoomInIcon,
    History as HistoryIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format, isAfter, parseISO, differenceInDays } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const RowCard = styled(Paper)(({ accent, overdue }) => ({
    display: 'flex',
    alignItems: 'stretch',
    borderRadius: '14px',
    border: '1px solid #F3F4F6',
    borderLeft: `4px solid ${overdue ? '#EF4444' : accent || '#4F46E5'}`,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: 10,
    '&:hover': {
        boxShadow: '0 6px 20px rgba(0,0,0,0.06)',
        transform: 'translateX(2px)',
    },
}));

const IconBox = styled(Box)(({ color, bg }) => ({
    width: 52,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: bg,
    flexShrink: 0,
    color: color,
}));

const SectionHeader = styled(Box)(({ color }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    mb: 1.5,
    mt: 3,
    '& .dot': {
        width: 8, height: 8, borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 0 4px ${color}22`,
    },
}));

const LinkPill = styled('a')({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    borderRadius: '8px',
    backgroundColor: '#EEF2FF',
    border: '1px solid #C7D2FE',
    color: '#4F46E5',
    fontWeight: 600,
    fontSize: '13px',
    textDecoration: 'none',
    transition: 'all 0.2s ease',
    maxWidth: '100%',
    '&:hover': { backgroundColor: '#E0E7FF', borderColor: '#A5B4FC' },
    '& span': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320 },
});

const StatusChip = styled(Chip)(({ color, bg, border }) => ({
    backgroundColor: bg,
    color: color,
    fontWeight: 700,
    fontSize: '11px',
    height: 24,
    borderRadius: '7px',
    border: `1px solid ${border}`,
}));

const DropZone = styled(Box)(({ isDragActive }) => ({
    border: `2px dashed ${isDragActive ? '#4F46E5' : '#D1D5DB'}`,
    borderRadius: '14px',
    padding: '28px 20px',
    textAlign: 'center',
    backgroundColor: isDragActive ? '#EEF2FF' : '#FAFAFA',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': { borderColor: '#4F46E5', backgroundColor: '#F5F7FF' },
}));

const FileTile = styled(Box)({
    position: 'relative',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    aspectRatio: '1 / 1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    '&:hover': { borderColor: '#4F46E5', boxShadow: '0 4px 12px rgba(79,70,229,0.15)' },
});

const FileImg = styled('img')({
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    cursor: 'zoom-in',
});

const RemoveBtn = styled(IconButton)({
    position: 'absolute',
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    backgroundColor: 'rgba(0,0,0,0.55)',
    color: '#FFF',
    backdropFilter: 'blur(4px)',
    zIndex: 2,
    '&:hover': { backgroundColor: 'rgba(239,68,68,0.95)' },
});

const ZoomOverlay = styled(Box)({
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.88)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    cursor: 'zoom-out',
    padding: 20,
});

const SuccessScreen = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    gap: 16,
});

// ========== УТИЛИТЫ ==========

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
const DRAFT_KEY_PREFIX = 'edspace_hw_draft_';

function extractUrl(text) {
    if (!text) return null;
    const match = text.match(URL_REGEX);
    return match ? match[0] : null;
}

function getStatusConfig(status) {
    const configs = {
        'ASSIGNED':  { label: 'Назначено',    color: '#1E40AF', bg: '#EFF6FF', dot: '#3B82F6' },
        'SUBMITTED': { label: 'На проверке',  color: '#92400E', bg: '#FFFBEB', dot: '#F59E0B' },
        'CHECKED':   { label: 'Проверено',    color: '#065F46', bg: '#ECFDF5', dot: '#10B981' },
        'RETURNED':  { label: 'На доработку', color: '#991B1B', bg: '#FEF2F2', dot: '#EF4444' },
    };
    return configs[(status || '').toUpperCase()] || { label: status || '—', color: '#374151', bg: '#F3F4F6', dot: '#9CA3AF' };
}

function getFileIcon(file) {
    if (!file) return <FileIcon sx={{ color: '#6B7280', fontSize: 40 }} />;
    const type = file.type || '';
    if (type.startsWith('image/')) return <ImageIcon sx={{ color: '#10B981', fontSize: 40 }} />;
    if (type === 'application/pdf') return <PdfIcon sx={{ color: '#EF4444', fontSize: 40 }} />;
    if (type.includes('word')) return <DocIcon sx={{ color: '#3B82F6', fontSize: 40 }} />;
    return <FileIcon sx={{ color: '#6B7280', fontSize: 40 }} />;
}

function getFileIconByName(name) {
    const ext = (name || '').split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif'].includes(ext)) return <ImageIcon sx={{ color: '#10B981', fontSize: 40 }} />;
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#EF4444', fontSize: 40 }} />;
    if (['doc', 'docx'].includes(ext)) return <DocIcon sx={{ color: '#3B82F6', fontSize: 40 }} />;
    return <FileIcon sx={{ color: '#6B7280', fontSize: 40 }} />;
}

function isImageByName(name) {
    const ext = (name || '').split('.').pop()?.toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function formatDueDate(dueDate) {
    if (!dueDate) return null;
    const d = new Date(dueDate);
    const now = new Date();
    const diff = differenceInDays(d, now);
    if (diff === 0) return { text: 'Сегодня', urgent: true };
    if (diff === 1) return { text: 'Завтра', urgent: true };
    if (diff > 1 && diff <= 7) return { text: `Через ${diff} дн.`, urgent: false };
    if (diff > 7) return { text: format(d, 'd MMM', { locale: ru }), urgent: false };
    if (diff < 0) return { text: `Просрочено на ${Math.abs(diff)} дн.`, urgent: true };
    return { text: format(d, 'd MMM', { locale: ru }), urgent: false };
}

function formatSubmittedAt(dateStr) {
    if (!dateStr) return '—';
    try { return format(new Date(dateStr), 'd MMMM yyyy, HH:mm', { locale: ru }); }
    catch { return '—'; }
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
export default function StudentHomework() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Мои задания'; }, []);

    const [loading, setLoading] = useState(true);
    const [homeworkList, setHomeworkList] = useState([]);
    const [error, setError] = useState(null);
    const [activeType, setActiveType] = useState('HOMEWORK');

    // Просмотр деталей
    const [openDetails, setOpenDetails] = useState(false);
    const [detailsHomework, setDetailsHomework] = useState(null);

    // Окно сдачи
    const [openSubmit, setOpenSubmit] = useState(false);
    const [selectedHomework, setSelectedHomework] = useState(null);
    const [submission, setSubmission] = useState('');
    const [filesToUpload, setFilesToUpload] = useState([]);
    const [isDragActive, setIsDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [success, setSuccess] = useState(false);
    const [draftRestored, setDraftRestored] = useState(false);

    // Зум картинок
    const [zoomImage, setZoomImage] = useState(null);

    const fileInputRef = useRef(null);

    // ========== ЗАГРУЗКА ==========
    const loadHomework = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/homework/student/${user.id}/all`);
            setHomeworkList(res.data || []);
        } catch (err) {
            setError('Ошибка загрузки заданий');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { loadHomework(); }, [loadHomework]);

    // Восстановление черновика
    useEffect(() => {
        if (openSubmit && selectedHomework) {
            const key = DRAFT_KEY_PREFIX + selectedHomework.id;
            const saved = localStorage.getItem(key);
            if (saved && !submission) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.text) { setSubmission(parsed.text); setDraftRestored(true); }
                } catch (e) {}
            }
        }
    }, [openSubmit, selectedHomework]);

    // Автосохранение черновика
    useEffect(() => {
        if (!openSubmit || !selectedHomework || success) return;
        const key = DRAFT_KEY_PREFIX + selectedHomework.id;
        const timer = setTimeout(() => {
            if (submission.trim()) {
                localStorage.setItem(key, JSON.stringify({ text: submission }));
            }
        }, 800);
        return () => clearTimeout(timer);
    }, [submission, openSubmit, selectedHomework, success]);

    // Очистка при закрытии
    useEffect(() => {
        if (!openSubmit) {
            filesToUpload.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
            setFilesToUpload([]);
            setSubmission('');
            setUploadProgress(0);
            setUploading(false);
            setSuccess(false);
            setDraftRestored(false);
            setIsDragActive(false);
        }
    }, [openSubmit]);

    // ========== ОТПРАВКА ==========
    const handleSubmit = async () => {
        if (!selectedHomework) return;
        if (!submission.trim() && filesToUpload.length === 0) {
            setError('Введите ответ или прикрепите файл');
            return;
        }
        setUploading(true);
        setUploadProgress(0);
        try {
            const formData = new FormData();
            formData.append('answer', submission || '');
            filesToUpload.forEach(file => formData.append('files', file));

            await axiosInstance.patch(
                `/homework/${selectedHomework.id}/submit`,
                formData,
                {
                    headers: { 'Content-Type': undefined },
                    onUploadProgress: (e) => {
                        if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
                    },
                }
            );

            try { localStorage.removeItem(DRAFT_KEY_PREFIX + selectedHomework.id); } catch (e) {}

            setUploadProgress(100);
            setSuccess(true);

            setTimeout(() => {
                setOpenSubmit(false);
                setSelectedHomework(null);
                loadHomework();
            }, 1200);
        } catch (err) {
            setError('Ошибка отправки: ' + (err.response?.data?.error || err.message));
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const handleClearAll = () => {
        if (!submission && filesToUpload.length === 0) return;
        if (!window.confirm('Очистить ответ и все файлы?')) return;
        setSubmission('');
        filesToUpload.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
        setFilesToUpload([]);
        if (selectedHomework) {
            try { localStorage.removeItem(DRAFT_KEY_PREFIX + selectedHomework.id); } catch (e) {}
        }
        setDraftRestored(false);
    };

    // ========== ФАЙЛЫ ==========
    const validateAndAddFiles = (files, existingFiles) => {
        const validFiles = [];
        const maxSize = 10 * 1024 * 1024;
        for (let file of files) {
            if (file.size > maxSize) {
                setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ`);
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

    const handleFileSelect = useCallback((e) => {
        const selectedFiles = Array.from(e.target.files);
        const validFiles = validateAndAddFiles(selectedFiles, filesToUpload);
        setFilesToUpload(prev => [...prev, ...validFiles]);
        e.target.value = '';
    }, [filesToUpload]);

    const handleDrop = useCallback((e) => {
        e.preventDefault(); e.stopPropagation();
        setIsDragActive(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        const validFiles = validateAndAddFiles(droppedFiles, filesToUpload);
        setFilesToUpload(prev => [...prev, ...validFiles]);
    }, [filesToUpload]);

    const removeFile = (index) => {
        const file = filesToUpload[index];
        if (file.preview) URL.revokeObjectURL(file.preview);
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
    };

    // ========== ВЫЧИСЛЕНИЯ ==========
    const homeworkOnly = useMemo(() =>
        homeworkList.filter(h => (h.homeworkType || h.type || 'HOMEWORK') === 'HOMEWORK'), [homeworkList]);
    const examsOnly = useMemo(() =>
        homeworkList.filter(h => (h.homeworkType || h.type) === 'MOCK_EXAM'), [homeworkList]);

    const countHomework = homeworkOnly.length;
    const countMock = examsOnly.length;
    const currentList = activeType === 'HOMEWORK' ? homeworkOnly : examsOnly;

    const isOverdue = (hw) => {
        if (!hw.dueDate || (hw.status || '').toUpperCase() === 'CHECKED') return false;
        return isAfter(new Date(), parseISO(hw.dueDate));
    };

    const activeItems = useMemo(() =>
        currentList.filter(h => ['ASSIGNED', 'RETURNED'].includes((h.status || '').toUpperCase()))
            .sort((a, b) => {
                const aOver = isOverdue(a) ? 0 : 1;
                const bOver = isOverdue(b) ? 0 : 1;
                if (aOver !== bOver) return aOver - bOver;
                const aD = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
                const bD = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
                return aD - bD;
            }), [currentList]);

    const doneItems = useMemo(() =>
        currentList.filter(h => ['SUBMITTED', 'CHECKED'].includes((h.status || '').toUpperCase()))
            .sort((a, b) => {
                const aD = a.submittedAt ? new Date(a.submittedAt).getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
                const bD = b.submittedAt ? new Date(b.submittedAt).getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
                return bD - aD;
            }), [currentList]);

    // ========== РЕНДЕР ==========
    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <EdSpaceLoader text="Загрузка..." />
                </Box>
            </PageContainer>
        );
    }

    const renderRow = (hw) => {
        const statusConfig = getStatusConfig(hw.status);
        const overdue = isOverdue(hw);
        const url = extractUrl(hw.task);
        const isExam = activeType === 'MOCK_EXAM';
        const isChecked = (hw.status || '').toUpperCase() === 'CHECKED';
        const hasGrade = hw.score != null || hw.grade != null;
        const canSubmit = ['ASSIGNED', 'RETURNED'].includes((hw.status || '').toUpperCase());
        const isSubmitted = (hw.status || '').toUpperCase() === 'SUBMITTED';
        const dueInfo = hw.dueDate && !isExam ? formatDueDate(hw.dueDate) : null;

        const accentColor = overdue ? '#EF4444' : (isExam ? '#7C3AED' : statusConfig.dot);
        const iconBg = isExam ? '#F5F3FF' : (overdue ? '#FEF2F2' : statusConfig.bg);
        const iconColor = isExam ? '#7C3AED' : (overdue ? '#EF4444' : statusConfig.color);

        return (
            <RowCard key={hw.id} accent={accentColor} overdue={overdue} elevation={0}
                onClick={() => { setDetailsHomework(hw); setOpenDetails(true); }}
                sx={{ cursor: 'pointer' }}>

                <IconBox color={iconColor} bg={iconBg}>
                    {isExam ? <TrophyIcon sx={{ fontSize: 24 }} /> : <AssignmentIcon sx={{ fontSize: 24 }} />}
                </IconBox>

                <Box sx={{
                    flex: 1, minWidth: 0,
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { xs: 'flex-start', md: 'center' },
                    gap: { xs: 1.5, md: 3 },
                    p: 2,
                }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 0.75 }}>
                            <StatusChip label={statusConfig.label} color={statusConfig.color} bg={statusConfig.bg} border={`${statusConfig.dot}44`} />
                            {isExam && hw.examType && (
                                <StatusChip label={hw.examType === 'EGE' ? 'ЕГЭ' : 'ОГЭ'} color="#5B21B6" bg="#F5F3FF" border="#C4B5FD" />
                            )}
                            {isExam && hw.subject && <StatusChip label={hw.subject} color="#374151" bg="#F3F4F6" border="#E5E7EB" />}
                            {overdue && <StatusChip label="⏰ Просрочено" color="#991B1B" bg="#FEF2F2" border="#FECACA" />}
                        </Box>

                        <Typography sx={{
                            fontSize: '14px', color: '#1F2937', fontWeight: 500, lineHeight: 1.5,
                            wordBreak: 'break-word',
                            display: '-webkit-box',
                            WebkitLineClamp: url ? 1 : 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}>
                            {url ? (hw.task.replace(url, '').trim() || 'Ссылка на задание') : (hw.task || '—')}
                        </Typography>

                        {url && (
                            <Box sx={{ mt: 0.75 }}>
                                <LinkPill href={url} target="_blank" rel="noopener noreferrer" title={url} onClick={(e) => e.stopPropagation()}>
                                    <LinkIcon sx={{ fontSize: 14 }} />
                                    <span>{url.replace(/^https?:\/\//, '')}</span>
                                    <OpenInNewIcon sx={{ fontSize: 12 }} />
                                </LinkPill>
                            </Box>
                        )}
                    </Box>

                    {dueInfo && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 140, color: dueInfo.urgent ? '#EF4444' : '#6B7280' }}>
                            <ScheduleIcon sx={{ fontSize: 18 }} />
                            <Box>
                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Срок</Typography>
                                <Typography sx={{ fontSize: '14px', fontWeight: dueInfo.urgent ? 700 : 600, lineHeight: 1.2 }}>{dueInfo.text}</Typography>
                            </Box>
                        </Box>
                    )}

                    {isExam && hw.examDate && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 140, color: '#7C3AED' }}>
                            <CalendarIcon sx={{ fontSize: 18 }} />
                            <Box>
                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Экзамен</Typography>
                                <Typography sx={{ fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>
                                    {format(new Date(hw.examDate), 'd MMM yyyy', { locale: ru })}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {isChecked && hasGrade && (
                        <Box sx={{ minWidth: 110, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: '#ECFDF5', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon sx={{ fontSize: 22 }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: 600 }}>Оценка</Typography>
                                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#065F46', lineHeight: 1.2 }}>
                                    {hw.gradeType === 'GRADE_100' ? `${hw.score ?? hw.grade}/100`
                                        : hw.gradeType === 'GRADE_10' ? `${hw.score ?? hw.grade}/10`
                                        : `${hw.grade}/5`}
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    <Box sx={{ minWidth: { xs: '100%', md: 150 }, display: 'flex', justifyContent: 'flex-end', flexShrink: 0 }}>
                        {canSubmit && (
                            <StyledButton
                                variant="contained"
                                startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedHomework(hw);
                                    setSubmission('');
                                    setFilesToUpload([]);
                                    setOpenSubmit(true);
                                }}
                                sx={{
                                    bgcolor: '#4F46E5', borderRadius: '10px',
                                    px: 2.5, py: 1, fontWeight: 700,
                                    textTransform: 'none', fontSize: '13px',
                                    boxShadow: 'none',
                                    '&:hover': { bgcolor: '#4338CA', boxShadow: '0 4px 12px rgba(79,70,229,0.3)' },
                                }}
                            >
                                {(hw.status || '').toUpperCase() === 'RETURNED' ? 'Сдать заново' : 'Сдать'}
                            </StyledButton>
                        )}
                        {isSubmitted && (
                            <Box sx={{
                                px: 2, py: 1, bgcolor: '#FFFBEB',
                                borderRadius: '10px', border: '1px solid #FDE68A',
                                display: 'flex', alignItems: 'center', gap: 0.75,
                            }}>
                                <TimeIcon sx={{ fontSize: 16, color: '#92400E' }} />
                                <Typography sx={{ fontSize: '12px', color: '#92400E', fontWeight: 600 }}>
                                    Ожидает проверки
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </Box>
            </RowCard>
        );
    };

    const renderEmpty = (title, subtitle) => (
        <Paper sx={{ borderRadius: '16px', bgcolor: '#FFFFFF', p: 6, textAlign: 'center' }}>
            <Box sx={{ mb: 2 }}>
                {activeType === 'MOCK_EXAM'
                    ? <TrophyIcon sx={{ fontSize: 48, color: '#D1D5DB' }} />
                    : <AssignmentIcon sx={{ fontSize: 48, color: '#D1D5DB' }} />}
            </Box>
            <Typography sx={{ fontSize: '17px', fontWeight: 600, color: '#1F2937', mb: 1 }}>{title}</Typography>
            <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>{subtitle}</Typography>
        </Paper>
    );

    const previousAnswerText = selectedHomework?.attachments
        ? selectedHomework.attachments.split('\n').filter(l => l.trim() && !l.startsWith('/uploads/')).join('\n')
        : '';
    const previousAnswerFiles = selectedHomework?.attachments
        ? selectedHomework.attachments.split('\n').filter(l => l.startsWith('/uploads/'))
        : [];

    const totalSize = filesToUpload.reduce((s, f) => s + f.size, 0);
    const totalSizeMb = totalSize / (1024 * 1024);
    const nearLimit = totalSizeMb > 8;

    return (
        <PageContainer sx={{ px: { xs: 1.5, sm: 3 } }}>

            {/* ЗАГОЛОВОК */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: { xs: '22px', sm: '28px' }, fontWeight: 700, color: '#1F2937', mb: 0.5 }}>
                        📝 Мои задания
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {activeItems.length > 0
                            ? `${activeItems.length} активных • ${doneItems.length} завершённых`
                            : `${doneItems.length} завершённых`}
                    </Typography>
                </Box>
                <StyledButton variant="outlined" startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} onClick={loadHomework}
                    sx={{ color: '#374151', borderColor: '#D1D5DB', borderRadius: '10px', '&:hover': { bgcolor: '#F9FAFB' } }}>
                    Обновить
                </StyledButton>
            </Box>

            {/* ВКЛАДКИ */}
            <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                {[
                    { key: 'HOMEWORK', label: 'Домашние задания', count: countHomework, icon: AssignmentIcon, color: '#4F46E5', soft: '#EEF2FF' },
                    { key: 'MOCK_EXAM', label: 'Пробники', count: countMock, icon: TrophyIcon, color: '#7C3AED', soft: '#F5F3FF' },
                ].map(tab => {
                    const active = activeType === tab.key;
                    const Icon = tab.icon;
                    return (
                        <Box key={tab.key} onClick={() => setActiveType(tab.key)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                px: 2.5, py: 1.5, borderRadius: '14px', cursor: 'pointer',
                                border: '2px solid',
                                borderColor: active ? tab.color : '#E5E7EB',
                                backgroundColor: active ? tab.soft : '#FFFFFF',
                                transition: 'all 0.2s ease',
                                '&:hover': { borderColor: tab.color },
                            }}>
                            <Box sx={{
                                width: 38, height: 38, borderRadius: '11px',
                                backgroundColor: active ? tab.color : '#F3F4F6',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon sx={{ fontSize: 20, color: active ? '#FFF' : '#6B7280' }} />
                            </Box>
                            <Box>
                                <Typography sx={{ fontSize: '15px', fontWeight: 700, color: active ? tab.color : '#1F2937', lineHeight: 1.2 }}>
                                    {tab.label}
                                </Typography>
                                <Typography sx={{ fontSize: '12px', color: active ? tab.color : '#9CA3AF', fontWeight: 600 }}>
                                    {tab.count} шт.
                                </Typography>
                            </Box>
                        </Box>
                    );
                })}
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

            {/* АКТИВНЫЕ */}
            {activeItems.length > 0 && (
                <>
                    <SectionHeader color="#EF4444">
                        <Box className="dot" />
                        <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>Активные</Typography>
                        <Chip label={activeItems.length} size="small" sx={{ bgcolor: '#FEF2F2', color: '#991B1B', fontWeight: 700, height: 20, fontSize: '11px' }} />
                    </SectionHeader>
                    {activeItems.map(renderRow)}
                </>
            )}

            {/* ЗАВЕРШЁННЫЕ */}
            {doneItems.length > 0 && (
                <>
                    <SectionHeader color="#10B981">
                        <Box className="dot" />
                        <Typography sx={{ fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>Завершённые</Typography>
                        <Chip label={doneItems.length} size="small" sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontWeight: 700, height: 20, fontSize: '11px' }} />
                    </SectionHeader>
                    {doneItems.map(renderRow)}
                </>
            )}

            {activeItems.length === 0 && doneItems.length === 0 && (
                activeType === 'HOMEWORK'
                    ? renderEmpty('Пока нет заданий', 'Когда учитель назначит ДЗ, оно появится здесь')
                    : renderEmpty('Пока нет пробников', 'Здесь будут появляться назначенные пробники')
            )}

            {/* ========== МОДАЛКА ПРОСМОТРА ========== */}
            <StyledDialog
                open={openDetails}
                onClose={() => { setOpenDetails(false); setDetailsHomework(null); }}
                maxWidth="md"
                fullWidth
            >
                {detailsHomework && (() => {
                    const hw = detailsHomework;
                    const statusConfig = getStatusConfig(hw.status);
                    const overdue = isOverdue(hw);
                    const url = extractUrl(hw.task);
                    const isExam = (hw.homeworkType || hw.type) === 'MOCK_EXAM';
                    const isChecked = (hw.status || '').toUpperCase() === 'CHECKED';
                    const hasGrade = hw.score != null || hw.grade != null;
                    const canSubmit = ['ASSIGNED', 'RETURNED'].includes((hw.status || '').toUpperCase());
                    const isSubmitted = (hw.status || '').toUpperCase() === 'SUBMITTED';
                    const dueInfo = hw.dueDate && !isExam ? formatDueDate(hw.dueDate) : null;

                    const attachmentsList = (hw.attachments || '').split('\n').map(s => s.trim()).filter(Boolean);
                    const fileAttachments = attachmentsList.filter(l => l.startsWith('/uploads/'));
                    const textAnswer = attachmentsList.filter(l => !l.startsWith('/uploads/')).join('\n');
                    const tutorFiles = (hw.status || '').toUpperCase() === 'ASSIGNED' ? fileAttachments : [];

                    return (
                        <>
                            <DialogTitle sx={{
                                px: 3, pt: 3, pb: 2,
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                borderBottom: '1px solid #F3F4F6',
                            }}>
                                <Avatar sx={{ bgcolor: isExam ? '#F5F3FF' : '#EEF2FF', width: 44, height: 44 }}>
                                    {isExam ? <TrophyIcon sx={{ color: '#7C3AED', fontSize: 22 }} /> : <AssignmentIcon sx={{ color: '#4F46E5', fontSize: 22 }} />}
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '17px', fontWeight: 700, color: '#1F2937' }}>
                                        {isExam ? 'Пробник' : 'Домашнее задание'}
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                                        <StatusChip label={statusConfig.label} color={statusConfig.color} bg={statusConfig.bg} border={`${statusConfig.dot}44`} />
                                        {isExam && hw.examType && <StatusChip label={hw.examType === 'EGE' ? 'ЕГЭ' : 'ОГЭ'} color="#5B21B6" bg="#F5F3FF" border="#C4B5FD" />}
                                        {isExam && hw.subject && <StatusChip label={hw.subject} color="#374151" bg="#F3F4F6" border="#E5E7EB" />}
                                        {overdue && <StatusChip label="⏰ Просрочено" color="#991B1B" bg="#FEF2F2" border="#FECACA" />}
                                    </Box>
                                </Box>
                                <IconButton onClick={() => setOpenDetails(false)} size="small"><CloseIcon fontSize="small" /></IconButton>
                            </DialogTitle>

                            <DialogContent sx={{ px: 3, pt: 3 }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                                    {(dueInfo || (isExam && hw.examDate) || hw.submittedAt) && (
                                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', p: 2, bgcolor: '#F9FAFB', borderRadius: '12px', border: '1px solid #E5E7EB' }}>
                                            {dueInfo && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <ScheduleIcon sx={{ fontSize: 20, color: dueInfo.urgent ? '#EF4444' : '#6B7280' }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Срок сдачи</Typography>
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: dueInfo.urgent ? '#EF4444' : '#1F2937' }}>{dueInfo.text}</Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            {isExam && hw.examDate && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon sx={{ fontSize: 20, color: '#7C3AED' }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Дата экзамена</Typography>
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#7C3AED' }}>
                                                            {format(new Date(hw.examDate), 'd MMMM yyyy', { locale: ru })}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                            {hw.submittedAt && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <TimeIcon sx={{ fontSize: 20, color: '#6B7280' }} />
                                                    <Box>
                                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.5 }}>Сдано</Typography>
                                                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>{formatSubmittedAt(hw.submittedAt)}</Typography>
                                                    </Box>
                                                </Box>
                                            )}
                                        </Box>
                                    )}

                                    <Box>
                                        <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>📋 Задание</Typography>
                                        <Paper sx={{ p: 2.5, bgcolor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '12px' }}>
                                            {url ? (
                                                <Box>
                                                    <LinkPill href={url} target="_blank" rel="noopener noreferrer" title={url} sx={{ mb: 1.5 }}>
                                                        <LinkIcon sx={{ fontSize: 16 }} />
                                                        <span>{url.replace(/^https?:\/\//, '')}</span>
                                                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                                                    </LinkPill>
                                                    {hw.task.replace(url, '').trim() && (
                                                        <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, mt: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                            {hw.task.replace(url, '').trim()}
                                                        </Typography>
                                                    )}
                                                </Box>
                                            ) : (
                                                <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {hw.task || '—'}
                                                </Typography>
                                            )}
                                        </Paper>
                                    </Box>

                                    {tutorFiles.length > 0 && (
                                        <Box>
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>📎 Материалы к заданию</Typography>
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                {tutorFiles.map((line, i) => {
                                                    const name = line.split('/').pop();
                                                    const href = `https://ed-space.ru/api/homework/file/${name}`;
                                                    const isImg = isImageByName(name);
                                                    return isImg ? (
                                                        <Box key={i} onClick={() => setZoomImage(href)}
                                                            sx={{
                                                                width: 100, height: 100, borderRadius: '10px',
                                                                overflow: 'hidden', border: '1px solid #E5E7EB',
                                                                cursor: 'zoom-in', transition: 'all 0.2s ease',
                                                                '&:hover': { transform: 'scale(1.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                                                            }}>
                                                            <Box component="img" src={href} alt={name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        </Box>
                                                    ) : (
                                                        <LinkPill key={i} href={href} target="_blank" rel="noopener noreferrer">
                                                            📎 <span>{name}</span>
                                                        </LinkPill>
                                                    );
                                                })}
                                            </Box>
                                        </Box>
                                    )}

                                    {(textAnswer || fileAttachments.length > 0) && (hw.status || '').toUpperCase() !== 'ASSIGNED' && (
                                        <Box>
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>✏️ Твой ответ</Typography>
                                            <Paper sx={{ p: 2.5, bgcolor: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: '12px' }}>
                                                {textAnswer && (
                                                    <Typography sx={{ fontSize: '14px', color: '#374151', lineHeight: 1.7, mb: fileAttachments.length > 0 ? 2 : 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                        {textAnswer}
                                                    </Typography>
                                                )}
                                                {fileAttachments.length > 0 && (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                        {fileAttachments.map((line, i) => {
                                                            const name = line.split('/').pop();
                                                            const href = `https://ed-space.ru/api/homework/file/${name}`;
                                                            const isImg = isImageByName(name);
                                                            return isImg ? (
                                                                <Box key={i} onClick={() => setZoomImage(href)}
                                                                    sx={{
                                                                        width: 100, height: 100, borderRadius: '10px',
                                                                        overflow: 'hidden', border: '1px solid #E5E7EB',
                                                                        cursor: 'zoom-in', transition: 'all 0.2s ease',
                                                                        '&:hover': { transform: 'scale(1.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
                                                                    }}>
                                                                    <Box component="img" src={href} alt={name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                                </Box>
                                                            ) : (
                                                                <LinkPill key={i} href={href} target="_blank" rel="noopener noreferrer">
                                                                    📎 <span>{name}</span>
                                                                </LinkPill>
                                                            );
                                                        })}
                                                    </Box>
                                                )}
                                            </Paper>
                                        </Box>
                                    )}

                                    {isChecked && hasGrade && (
                                        <Box>
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>✅ Оценка</Typography>
                                            <Paper sx={{ p: 3, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 2 }}>
                                                <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: '#10B981', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <CheckIcon sx={{ fontSize: 32 }} />
                                                </Box>
                                                <Box>
                                                    <Typography sx={{ fontSize: '12px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Итоговый балл</Typography>
                                                    <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#065F46', lineHeight: 1.1 }}>
                                                        {hw.gradeType === 'GRADE_100' ? `${hw.score ?? hw.grade}/100`
                                                            : hw.gradeType === 'GRADE_10' ? `${hw.score ?? hw.grade}/10`
                                                            : `${hw.grade}/5`}
                                                    </Typography>
                                                </Box>
                                            </Paper>
                                        </Box>
                                    )}

                                    {hw.feedback && (
                                        <Box>
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>💬 Комментарий учителя</Typography>
                                            <Paper sx={{ p: 2.5, bgcolor: isChecked ? '#F0F9FF' : '#FEF2F2', border: `1px solid ${isChecked ? '#BAE6FD' : '#FECACA'}`, borderRadius: '12px' }}>
                                                <Typography sx={{ fontSize: '14px', color: isChecked ? '#0C4A6E' : '#7F1D1D', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{hw.feedback}</Typography>
                                            </Paper>
                                        </Box>
                                    )}

                                    {isSubmitted && (
                                        <Box sx={{ p: 2.5, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <TimeIcon sx={{ color: '#92400E' }} />
                                            <Typography sx={{ fontSize: '14px', color: '#92400E', fontWeight: 600 }}>Работа сдана, ожидает проверки учителя</Typography>
                                        </Box>
                                    )}
                                </Box>
                            </DialogContent>

                            <DialogActions sx={{ px: 3, pb: 3, pt: 1, borderTop: '1px solid #F3F4F6', gap: 1 }}>
                                <StyledButton onClick={() => { setOpenDetails(false); setDetailsHomework(null); }} sx={{ color: '#6B7280' }}>
                                    Закрыть
                                </StyledButton>
                                {canSubmit && (
                                    <StyledButton variant="contained" startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => {
                                            setOpenDetails(false);
                                            setSelectedHomework(hw);
                                            setSubmission('');
                                            setFilesToUpload([]);
                                            setOpenSubmit(true);
                                        }}
                                        sx={{ bgcolor: '#4F46E5', borderRadius: '10px', '&:hover': { bgcolor: '#4338CA' } }}>
                                        {(hw.status || '').toUpperCase() === 'RETURNED' ? 'Сдать заново' : 'Сдать задание'}
                                    </StyledButton>
                                )}
                            </DialogActions>
                        </>
                    );
                })()}
            </StyledDialog>

            {/* ========== УЛУЧШЕННОЕ ОКНО СДАЧИ ========== */}
            <StyledDialog
                open={openSubmit}
                onClose={(e, reason) => {
                    if (reason === 'backdropClick' || reason === 'escapeKeyDown') {
                        if (!window.confirm('Закрыть окно? Черновик ответа сохранится.')) return;
                    }
                    if (!uploading && !success) {
                        setOpenSubmit(false);
                        setSelectedHomework(null);
                    }
                }}
                maxWidth="md"
                fullWidth
                PaperProps={{ sx: { borderRadius: '18px', overflow: 'hidden' } }}
            >
                {success ? (
                    <SuccessScreen>
                        <Box sx={{
                            width: 88, height: 88, borderRadius: '50%',
                            bgcolor: '#ECFDF5', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            animation: 'scaleIn 0.4s ease',
                            '@keyframes scaleIn': {
                                '0%': { transform: 'scale(0.3)', opacity: 0 },
                                '60%': { transform: 'scale(1.1)' },
                                '100%': { transform: 'scale(1)', opacity: 1 },
                            },
                        }}>
                            <CheckIcon sx={{ fontSize: 56, color: '#10B981' }} />
                        </Box>
                        <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#065F46' }}>
                            Отправлено!
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            Учитель увидит работу в ближайшее время
                        </Typography>
                    </SuccessScreen>
                ) : (
                    <>
                        <DialogTitle sx={{
                            px: 3, pt: 3, pb: 2,
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            borderBottom: '1px solid #F3F4F6',
                        }}>
                            <Avatar sx={{ bgcolor: '#EEF2FF', width: 40, height: 40 }}>
                                <SendIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography sx={{ fontSize: '18px', fontWeight: 700, color: '#1F2937' }}>
                                    {selectedHomework?.homeworkType === 'MOCK_EXAM' || selectedHomework?.type === 'MOCK_EXAM'
                                        ? 'Сдать пробник'
                                        : 'Сдать задание'}
                                </Typography>
                                {selectedHomework?.dueDate && (
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 0.25 }}>
                                        Срок: {format(new Date(selectedHomework.dueDate), 'd MMMM', { locale: ru })}
                                    </Typography>
                                )}
                            </Box>
                            <Tooltip title="Очистить всё">
                                <span>
                                    <IconButton
                                        onClick={handleClearAll}
                                        size="small"
                                        disabled={uploading || (!submission && filesToUpload.length === 0)}
                                        sx={{ mr: 0.5 }}
                                    >
                                        <RefreshIcon fontSize="small" />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <IconButton
                                onClick={() => { if (!uploading) { setOpenSubmit(false); setSelectedHomework(null); } }}
                                size="small"
                                disabled={uploading}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </DialogTitle>

                        <DialogContent sx={{ px: 3, pt: 2.5, pb: 2, bgcolor: '#FFFFFF' }}>

                            {/* Задание */}
                            {selectedHomework && (
                                <Box sx={{ mb: 2.5 }}>
                                    <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5, mb: 1 }}>
                                        📋 Задание
                                    </Typography>
                                    <Paper sx={{
                                        p: 2, bgcolor: '#F9FAFB',
                                        border: '1px solid #E5E7EB', borderRadius: '12px',
                                        maxHeight: 160, overflowY: 'auto',
                                        '&::-webkit-scrollbar': { width: 6 },
                                        '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                                    }}>
                                        {(() => {
                                            const url = extractUrl(selectedHomework.task);
                                            if (url) {
                                                const rest = selectedHomework.task.replace(url, '').trim();
                                                return (
                                                    <Box>
                                                        <LinkPill href={url} target="_blank" rel="noopener noreferrer" title={url}>
                                                            <LinkIcon sx={{ fontSize: 14 }} />
                                                            <span>{url.replace(/^https?:\/\//, '')}</span>
                                                            <OpenInNewIcon sx={{ fontSize: 12 }} />
                                                        </LinkPill>
                                                        {rest && (
                                                            <Typography sx={{ fontSize: '13px', color: '#374151', mt: 1.25, lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                                {rest}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                );
                                            }
                                            return (
                                                <Typography sx={{ fontSize: '13px', color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {selectedHomework.task || '—'}
                                                </Typography>
                                            );
                                        })()}
                                    </Paper>
                                </Box>
                            )}

                            {/* Прошлый ответ (если RETURNED) */}
                            {(selectedHomework?.status || '').toUpperCase() === 'RETURNED' && (previousAnswerText || previousAnswerFiles.length > 0) && (
                                <Collapse in={true}>
                                    <Box sx={{ mb: 2.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                                            <HistoryIcon sx={{ fontSize: 14, color: '#92400E' }} />
                                            <Typography sx={{ fontSize: '11px', color: '#92400E', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                                                Твой прошлый ответ
                                            </Typography>
                                        </Box>
                                        <Paper sx={{ p: 2, bgcolor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px' }}>
                                            {previousAnswerText && (
                                                <Typography sx={{ fontSize: '13px', color: '#78350F', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word', mb: previousAnswerFiles.length > 0 ? 1.5 : 0 }}>
                                                    {previousAnswerText}
                                                </Typography>
                                            )}
                                            {previousAnswerFiles.length > 0 && (
                                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                                    {previousAnswerFiles.map((line, i) => {
                                                        const name = line.split('/').pop();
                                                        const href = `https://ed-space.ru/api/homework/file/${name}`;
                                                        const isImg = isImageByName(name);
                                                        return isImg ? (
                                                            <Box key={i} onClick={() => setZoomImage(href)}
                                                                sx={{
                                                                    width: 60, height: 60, borderRadius: '8px',
                                                                    overflow: 'hidden', border: '1px solid #FDE68A',
                                                                    cursor: 'zoom-in',
                                                                }}>
                                                                <Box component="img" src={href} alt={name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            </Box>
                                                        ) : (
                                                            <LinkPill key={i} href={href} target="_blank" rel="noopener noreferrer">
                                                                📎 <span>{name}</span>
                                                            </LinkPill>
                                                        );
                                                    })}
                                                </Box>
                                            )}
                                        </Paper>
                                    </Box>
                                </Collapse>
                            )}

                            {/* Ответ */}
                            <Box sx={{ mb: 2.5 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                                        ✏️ Твой ответ
                                    </Typography>
                                    {draftRestored && (
                                        <Chip
                                            label="Черновик восстановлен"
                                            size="small"
                                            onDelete={() => setDraftRestored(false)}
                                            sx={{
                                                height: 20, fontSize: '10px', fontWeight: 600,
                                                bgcolor: '#FEF3C7', color: '#92400E',
                                                '& .MuiChip-deleteIcon': { fontSize: 14, color: '#92400E' },
                                            }}
                                        />
                                    )}
                                </Box>
                                <TextField
                                    fullWidth
                                    multiline
                                    minRows={4}
                                    maxRows={10}
                                    value={submission}
                                    onChange={(e) => setSubmission(e.target.value)}
                                    placeholder="Введи ответ или напиши комментарий к работе..."
                                    disabled={uploading}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            bgcolor: '#FFFFFF',
                                        },
                                    }}
                                />
                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF', mt: 0.5, textAlign: 'right' }}>
                                    {submission.length} симв.
                                </Typography>
                            </Box>

                            {/* Файлы */}
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                    <Typography sx={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: 0.5 }}>
                                        📎 Файлы ({filesToUpload.length})
                                    </Typography>
                                    {totalSize > 0 && (
                                        <Typography sx={{
                                            fontSize: '11px',
                                            color: nearLimit ? '#EF4444' : '#9CA3AF',
                                            fontWeight: nearLimit ? 700 : 400,
                                        }}>
                                            {formatFileSize(totalSize)}
                                        </Typography>
                                    )}
                                </Box>

                                <DropZone
                                    isDragActive={isDragActive}
                                    onClick={() => !uploading && fileInputRef.current?.click()}
                                    onDragEnter={(e) => { e.preventDefault(); if (!uploading) setIsDragActive(true); }}
                                    onDragLeave={(e) => { e.preventDefault(); setIsDragActive(false); }}
                                    onDragOver={(e) => { e.preventDefault(); if (!uploading) setIsDragActive(true); }}
                                    onDrop={!uploading ? handleDrop : undefined}
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        hidden
                                        multiple
                                        onChange={handleFileSelect}
                                        disabled={uploading}
                                    />
                                    <CloudUploadIcon sx={{ fontSize: 40, color: isDragActive ? '#4F46E5' : '#9CA3AF', mb: 1 }} />
                                    <Typography sx={{ fontSize: '14px', color: '#374151', fontWeight: 600 }}>
                                        {isDragActive ? '✨ Отпусти файлы здесь' : (filesToUpload.length > 0 ? 'Добавить ещё файлы' : 'Перетащи файлы сюда')}
                                    </Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mt: 0.5 }}>
                                        или нажми для выбора • Любой формат • Максимум 10 МБ
                                    </Typography>
                                </DropZone>

                                {nearLimit && (
                                    <Alert severity="warning" icon={<WarningIcon />} sx={{ mt: 1.5, borderRadius: '10px', py: 0.25 }}>
                                        <Typography sx={{ fontSize: '12px' }}>
                                            Приближаешься к лимиту. Файлы крупнее 10 МБ не загрузятся.
                                        </Typography>
                                    </Alert>
                                )}

                                {filesToUpload.length > 0 && (
                                    <Grid container spacing={1.5} sx={{ mt: 1.5 }}>
                                        {filesToUpload.map((file, index) => (
                                            <Grid item xs={6} sm={4} md={3} key={index}>
                                                <FileTile>
                                                    {file.preview ? (
                                                        <FileImg
                                                            src={file.preview}
                                                            alt={file.name}
                                                            onClick={() => setZoomImage(file.preview)}
                                                        />
                                                    ) : (
                                                        <Box sx={{ textAlign: 'center', p: 1 }}>
                                                            {getFileIcon(file)}
                                                        </Box>
                                                    )}
                                                    <RemoveBtn
                                                        size="small"
                                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                                        disabled={uploading}
                                                    >
                                                        <CloseIcon sx={{ fontSize: 16 }} />
                                                    </RemoveBtn>
                                                    {file.preview && (
                                                        <Box sx={{
                                                            position: 'absolute',
                                                            bottom: 4, left: 4,
                                                            bgcolor: 'rgba(0,0,0,0.6)', color: '#FFF',
                                                            borderRadius: '6px', px: 0.75, py: 0.25,
                                                            fontSize: '10px', fontWeight: 600,
                                                        }}>
                                                            <ZoomInIcon sx={{ fontSize: 10, verticalAlign: 'middle' }} /> Открыть
                                                        </Box>
                                                    )}
                                                    <Box sx={{
                                                        position: 'absolute',
                                                        bottom: 0, left: 0, right: 0,
                                                        bgcolor: 'rgba(0,0,0,0.55)', color: '#FFF',
                                                        px: 0.75, py: 0.5,
                                                        fontSize: '10px',
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap',
                                                    }}>
                                                        {file.name}
                                                    </Box>
                                                </FileTile>
                                            </Grid>
                                        ))}
                                    </Grid>
                                )}
                            </Box>

                            {/* Прогресс загрузки */}
                            {uploading && (
                                <Box sx={{ mt: 2.5 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                        <Typography sx={{ fontSize: '12px', color: '#4F46E5', fontWeight: 600 }}>
                                            Отправка...
                                        </Typography>
                                        <Typography sx={{ fontSize: '12px', color: '#4F46E5', fontWeight: 700 }}>
                                            {uploadProgress}%
                                        </Typography>
                                    </Box>
                                    <LinearProgress
                                        variant="determinate"
                                        value={uploadProgress}
                                        sx={{
                                            height: 8, borderRadius: 4,
                                            bgcolor: '#EEF2FF',
                                            '& .MuiLinearProgress-bar': { bgcolor: '#4F46E5', borderRadius: 4 },
                                        }}
                                    />
                                </Box>
                            )}
                        </DialogContent>

                        <DialogActions sx={{ px: 3, pb: 3, pt: 2, borderTop: '1px solid #F3F4F6', gap: 1 }}>
                            <StyledButton
                                onClick={() => { if (!uploading) { setOpenSubmit(false); setSelectedHomework(null); } }}
                                disabled={uploading}
                                sx={{ color: '#6B7280' }}
                            >
                                Отмена
                            </StyledButton>
                            <StyledButton
                                onClick={handleSubmit}
                                variant="contained"
                                disabled={uploading || (!submission.trim() && filesToUpload.length === 0)}
                                startIcon={uploading ? null : <SendIcon sx={{ fontSize: 16 }} />}
                                sx={{
                                    bgcolor: '#4F46E5',
                                    borderRadius: '10px',
                                    px: 3,
                                    '&:hover': { bgcolor: '#4338CA' },
                                    '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                                }}
                            >
                                {uploading ? 'Отправка...' : 'Отправить'}
                            </StyledButton>
                        </DialogActions>
                    </>
                )}
            </StyledDialog>

            {/* ========== ЗУМ КАРТИНКИ ========== */}
            {zoomImage && (
                <ZoomOverlay onClick={() => setZoomImage(null)}>
                    <Box
                        component="img"
                        src={zoomImage}
                        alt="zoom"
                        onClick={(e) => e.stopPropagation()}
                        sx={{
                            maxWidth: '90vw',
                            maxHeight: '90vh',
                            borderRadius: '12px',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                            cursor: 'default',
                        }}
                    />
                    <IconButton
                        onClick={() => setZoomImage(null)}
                        sx={{
                            position: 'absolute',
                            top: 20, right: 20,
                            bgcolor: 'rgba(255,255,255,0.15)',
                            color: '#FFF',
                            backdropFilter: 'blur(4px)',
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </ZoomOverlay>
            )}
        </PageContainer>
    );
}