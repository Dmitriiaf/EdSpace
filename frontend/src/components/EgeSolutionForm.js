// frontend/src/components/EgeSolutionForm.js
import React, { useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, FormControl, InputLabel,
    Select, MenuItem, Stack, Alert, IconButton,
    Dialog, DialogContent, DialogActions,
    LinearProgress,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Close as CloseIcon,
    CloudUpload as CloudUploadIcon,
    Image as ImageIcon,
    Delete as DeleteIcon,
    Code as CodeIcon,
    Link as LinkIcon,
    PlayCircleOutline as PlayIcon,
    Save as SaveIcon,
    Assignment as TaskIcon,
    CheckCircle as SolutionIcon,
} from '@mui/icons-material';
import { StyledButton, StyledDialog } from '../styles/shared';

// ========== ПАЛИТРА ==========
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const GREEN = '#10B981';
const RED = '#EF4444';
const AMBER = '#F59E0B';
const AMBER_SOFT = '#FFF3D6';

const DropZone = styled(Box)(({ isDragActive, accent = PURPLE }) => ({
    border: `2px dashed ${isDragActive ? accent : '#D1D5DB'}`,
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    backgroundColor: isDragActive ? alpha(accent, 0.08) : '#FAFAFA',
    transition: 'all 0.2s ease',
    cursor: 'pointer',
    '&:hover': {
        borderColor: accent,
        backgroundColor: alpha(accent, 0.04),
    },
}));

const ImagePreviewTile = styled(Box)({
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 2,
    overflow: 'hidden',
    border: `1px solid ${LINE}`,
    backgroundColor: '#F9FAFB',
    '&:hover .remove-btn': { opacity: 1 },
});

const SectionTitle = styled(Typography)({
    fontSize: '0.72rem',
    color: INK_MUTED,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    mb: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
});

const LANGUAGES = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'pascal', label: 'Pascal' },
    { value: 'basic', label: 'Basic' },
    { value: 'text', label: 'Просто текст' },
];

export default function EgeSolutionForm({ open, onClose, onSave, initialData, taskNumber }) {
    const [formData, setFormData] = useState({
        title: '',
        explanation: '',
        code: '',
        codeLanguage: 'python',
        videoUrl: '',
        sourceUrl: '',
    });

    // Отдельные списки для задачи и решения
    const [newTaskFiles, setNewTaskFiles] = useState([]);
    const [newSolutionFiles, setNewSolutionFiles] = useState([]);
    const [existingTaskImages, setExistingTaskImages] = useState([]);
    const [existingSolutionImages, setExistingSolutionImages] = useState([]);
    const [filesToRemove, setFilesToRemove] = useState([]);

    const [isTaskDragActive, setIsTaskDragActive] = useState(false);
    const [isSolutionDragActive, setIsSolutionDragActive] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    const taskFileInputRef = useRef(null);
    const solutionFileInputRef = useRef(null);

    // Инициализация
    useEffect(() => {
        if (open) {
            if (initialData) {
                setFormData({
                    title: initialData.title || '',
                    explanation: initialData.explanation || '',
                    code: initialData.code || '',
                    codeLanguage: initialData.codeLanguage || 'python',
                    videoUrl: initialData.videoUrl || '',
                    sourceUrl: initialData.sourceUrl || '',
                });
                const imgs = initialData.images || [];
                setExistingTaskImages(imgs.filter(i => i.imageType === 'TASK'));
                setExistingSolutionImages(imgs.filter(i => i.imageType !== 'TASK'));
            } else {
                setFormData({
                    title: '',
                    explanation: '',
                    code: '',
                    codeLanguage: 'python',
                    videoUrl: '',
                    sourceUrl: '',
                });
                setExistingTaskImages([]);
                setExistingSolutionImages([]);
            }
            setNewTaskFiles([]);
            setNewSolutionFiles([]);
            setFilesToRemove([]);
            setError(null);
        }
    }, [open, initialData]);

    // ========== ФАЙЛЫ ==========
    const validateAndAdd = (files) => {
        const valid = [];
        const maxSize = 10 * 1024 * 1024;
        const allowedExt = /\.(jpg|jpeg|png|gif|webp|heic|heif)$/i;

        for (let file of files) {
            if (file.size > maxSize) {
                setError(`Файл "${file.name}" слишком большой. Максимум 10 МБ`);
                continue;
            }
            if (!allowedExt.test(file.name)) {
                setError(`Файл "${file.name}" — не изображение`);
                continue;
            }
            file.preview = URL.createObjectURL(file);
            valid.push(file);
        }
        return valid;
    };

    const handleTaskFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const valid = validateAndAdd(files);
        setNewTaskFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };

    const handleSolutionFileSelect = (e) => {
        const files = Array.from(e.target.files);
        const valid = validateAndAdd(files);
        setNewSolutionFiles(prev => [...prev, ...valid]);
        e.target.value = '';
    };

    const handleTaskDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setIsTaskDragActive(false);
        const files = Array.from(e.dataTransfer.files);
        const valid = validateAndAdd(files);
        setNewTaskFiles(prev => [...prev, ...valid]);
    };

    const handleSolutionDrop = (e) => {
        e.preventDefault(); e.stopPropagation();
        setIsSolutionDragActive(false);
        const files = Array.from(e.dataTransfer.files);
        const valid = validateAndAdd(files);
        setNewSolutionFiles(prev => [...prev, ...valid]);
    };

    const removeNewTaskFile = (index) => {
        const file = newTaskFiles[index];
        if (file.preview) URL.revokeObjectURL(file.preview);
        setNewTaskFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeNewSolutionFile = (index) => {
        const file = newSolutionFiles[index];
        if (file.preview) URL.revokeObjectURL(file.preview);
        setNewSolutionFiles(prev => prev.filter((_, i) => i !== index));
    };

    const removeExistingImage = (imgId) => {
        setFilesToRemove(prev => [...prev, imgId]);
        setExistingTaskImages(prev => prev.filter(img => img.id !== imgId));
        setExistingSolutionImages(prev => prev.filter(img => img.id !== imgId));
    };

    // ========== СОХРАНЕНИЕ ==========
    const handleSave = async () => {
        if (!formData.title.trim()) {
            setError('Введи название разбора');
            return;
        }

        setSaving(true);
        setError(null);
        try {
            await onSave(
                formData,
                { taskFiles: newTaskFiles, solutionFiles: newSolutionFiles },
                filesToRemove
            );
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Ошибка сохранения');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        newTaskFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
        newSolutionFiles.forEach(f => { if (f.preview) URL.revokeObjectURL(f.preview); });
        onClose();
    };

    return (
        <StyledDialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
        >
            {/* Заголовок */}
            <Box sx={{
                px: 3, pt: 3, pb: 2,
                background: `linear-gradient(135deg, ${PURPLE} 0%, #4F46E5 100%)`,
                display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
                <Box sx={{
                    width: 40, height: 40, borderRadius: 2,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '1rem', color: '#FFF',
                }}>
                    №{taskNumber}
                </Box>
                <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.75)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {initialData ? 'Редактировать' : 'Новый разбор'}
                    </Typography>
                    <Typography sx={{ fontSize: '1.05rem', color: '#FFF', fontWeight: 800 }}>
                        Задание {taskNumber}
                    </Typography>
                </Box>
                <IconButton onClick={handleClose} sx={{ color: '#FFF' }} size="small">
                    <CloseIcon />
                </IconButton>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                <Stack spacing={3}>

                    {/* Название */}
                    <Box>
                        <SectionTitle>📝 Название</SectionTitle>
                        <TextField
                            fullWidth
                            placeholder="Например: Множества через битовые операции"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                        />
                    </Box>

                    {/* СКРИНШОТ ЗАДАЧИ */}
                    <Box>
                        <SectionTitle sx={{ color: AMBER }}>
                            <TaskIcon sx={{ fontSize: 14 }} /> Скриншот задачи (опционально)
                        </SectionTitle>
                        <Typography sx={{ fontSize: '0.78rem', color: INK_MUTED, mb: 1 }}>
                            Скрин условия задачи — покажется сверху в разборе
                        </Typography>

                        <DropZone
                            isDragActive={isTaskDragActive}
                            accent={AMBER}
                            onClick={() => taskFileInputRef.current?.click()}
                            onDragEnter={(e) => { e.preventDefault(); setIsTaskDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsTaskDragActive(false); }}
                            onDragOver={(e) => { e.preventDefault(); setIsTaskDragActive(true); }}
                            onDrop={handleTaskDrop}
                        >
                            <input
                                ref={taskFileInputRef}
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={handleTaskFileSelect}
                            />
                            <CloudUploadIcon sx={{ fontSize: 28, color: isTaskDragActive ? AMBER : INK_MUTED, mb: 0.5 }} />
                            <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT, fontWeight: 600 }}>
                                {isTaskDragActive ? '✨ Отпусти здесь' : 'Перетащи или нажми'}
                            </Typography>
                        </DropZone>

                        {(existingTaskImages.length > 0 || newTaskFiles.length > 0) && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                {existingTaskImages.map(img => (
                                    <ImagePreviewTile key={`ext-${img.id}`}>
                                        <Box component="img" src={img.imageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <IconButton
                                            className="remove-btn"
                                            size="small"
                                            onClick={() => removeExistingImage(img.id)}
                                            sx={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 22, height: 22,
                                                bgcolor: 'rgba(0,0,0,0.6)', color: '#FFF',
                                                opacity: 0, transition: 'opacity 0.2s',
                                                '&:hover': { bgcolor: RED },
                                            }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </ImagePreviewTile>
                                ))}
                                {newTaskFiles.map((file, i) => (
                                    <ImagePreviewTile key={`newt-${i}`}>
                                        <Box component="img" src={file.preview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <Box sx={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            bgcolor: alpha(GREEN, 0.9), color: '#FFF',
                                            fontSize: '0.55rem', fontWeight: 700,
                                            textAlign: 'center', py: 0.3,
                                        }}>
                                            НОВОЕ
                                        </Box>
                                        <IconButton
                                            className="remove-btn"
                                            size="small"
                                            onClick={() => removeNewTaskFile(i)}
                                            sx={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 22, height: 22,
                                                bgcolor: 'rgba(0,0,0,0.6)', color: '#FFF',
                                                opacity: 0, transition: 'opacity 0.2s',
                                                '&:hover': { bgcolor: RED },
                                            }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </ImagePreviewTile>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {/* Объяснение */}
                    <Box>
                        <SectionTitle>💡 Объяснение</SectionTitle>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            maxRows={12}
                            placeholder="Пошаговое объяснение решения, ключевые моменты, типичные ошибки..."
                            value={formData.explanation}
                            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', fontSize: '0.9rem' } }}
                        />
                    </Box>

                    {/* Код */}
                    <Box>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', mb: 1.5 }}>
                            <SectionTitle sx={{ mb: 0, flex: 1 }}>
                                <CodeIcon sx={{ fontSize: 14 }} /> Код (опционально)
                            </SectionTitle>
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <Select
                                    value={formData.codeLanguage}
                                    onChange={(e) => setFormData({ ...formData, codeLanguage: e.target.value })}
                                    sx={{ borderRadius: '10px', fontSize: '0.85rem' }}
                                >
                                    {LANGUAGES.map(l => (
                                        <MenuItem key={l.value} value={l.value}>{l.label}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField
                            fullWidth
                            multiline
                            minRows={4}
                            maxRows={20}
                            placeholder="Вставь код решения..."
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '10px',
                                    fontFamily: 'monospace',
                                    fontSize: '0.85rem',
                                    bgcolor: '#F9FAFB',
                                },
                            }}
                        />
                    </Box>

                    {/* СКРИНШОТ РЕШЕНИЯ */}
                    <Box>
                        <SectionTitle sx={{ color: GREEN }}>
                            <SolutionIcon sx={{ fontSize: 14 }} /> Скриншот решения (опционально)
                        </SectionTitle>
                        <Typography sx={{ fontSize: '0.78rem', color: INK_MUTED, mb: 1 }}>
                            Скрин готового решения — покажется внизу разбора
                        </Typography>

                        <DropZone
                            isDragActive={isSolutionDragActive}
                            accent={GREEN}
                            onClick={() => solutionFileInputRef.current?.click()}
                            onDragEnter={(e) => { e.preventDefault(); setIsSolutionDragActive(true); }}
                            onDragLeave={(e) => { e.preventDefault(); setIsSolutionDragActive(false); }}
                            onDragOver={(e) => { e.preventDefault(); setIsSolutionDragActive(true); }}
                            onDrop={handleSolutionDrop}
                        >
                            <input
                                ref={solutionFileInputRef}
                                type="file"
                                hidden
                                multiple
                                accept="image/*"
                                onChange={handleSolutionFileSelect}
                            />
                            <CloudUploadIcon sx={{ fontSize: 28, color: isSolutionDragActive ? GREEN : INK_MUTED, mb: 0.5 }} />
                            <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT, fontWeight: 600 }}>
                                {isSolutionDragActive ? '✨ Отпусти здесь' : 'Перетащи или нажми'}
                            </Typography>
                        </DropZone>

                        {(existingSolutionImages.length > 0 || newSolutionFiles.length > 0) && (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1.5 }}>
                                {existingSolutionImages.map(img => (
                                    <ImagePreviewTile key={`exs-${img.id}`}>
                                        <Box component="img" src={img.imageUrl} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <IconButton
                                            className="remove-btn"
                                            size="small"
                                            onClick={() => removeExistingImage(img.id)}
                                            sx={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 22, height: 22,
                                                bgcolor: 'rgba(0,0,0,0.6)', color: '#FFF',
                                                opacity: 0, transition: 'opacity 0.2s',
                                                '&:hover': { bgcolor: RED },
                                            }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </ImagePreviewTile>
                                ))}
                                {newSolutionFiles.map((file, i) => (
                                    <ImagePreviewTile key={`news-${i}`}>
                                        <Box component="img" src={file.preview} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        <Box sx={{
                                            position: 'absolute', bottom: 0, left: 0, right: 0,
                                            bgcolor: alpha(GREEN, 0.9), color: '#FFF',
                                            fontSize: '0.55rem', fontWeight: 700,
                                            textAlign: 'center', py: 0.3,
                                        }}>
                                            НОВОЕ
                                        </Box>
                                        <IconButton
                                            className="remove-btn"
                                            size="small"
                                            onClick={() => removeNewSolutionFile(i)}
                                            sx={{
                                                position: 'absolute', top: 4, right: 4,
                                                width: 22, height: 22,
                                                bgcolor: 'rgba(0,0,0,0.6)', color: '#FFF',
                                                opacity: 0, transition: 'opacity 0.2s',
                                                '&:hover': { bgcolor: RED },
                                            }}
                                        >
                                            <DeleteIcon sx={{ fontSize: 12 }} />
                                        </IconButton>
                                    </ImagePreviewTile>
                                ))}
                            </Box>
                        )}
                    </Box>

                    {/* Видео */}
                    <Box>
                        <SectionTitle>
                            <PlayIcon sx={{ fontSize: 14 }} /> Видео-разбор (опционально)
                        </SectionTitle>
                        <TextField
                            fullWidth
                            placeholder="https://youtube.com/watch?v=... или rutube.ru/video/..."
                            value={formData.videoUrl}
                            onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            InputProps={{
                                startAdornment: <PlayIcon sx={{ color: INK_MUTED, mr: 1, fontSize: 20 }} />,
                            }}
                        />
                    </Box>

                    {/* Источник */}
                    <Box>
                        <SectionTitle>
                            <LinkIcon sx={{ fontSize: 14 }} /> Источник задачи (опционально)
                        </SectionTitle>
                        <TextField
                            fullWidth
                            placeholder="https://..."
                            value={formData.sourceUrl}
                            onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                            InputProps={{
                                startAdornment: <LinkIcon sx={{ color: INK_MUTED, mr: 1, fontSize: 20 }} />,
                            }}
                        />
                    </Box>

                    {error && (
                        <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: '10px' }}>
                            {error}
                        </Alert>
                    )}

                    {saving && (
                        <LinearProgress sx={{
                            borderRadius: 3, height: 6,
                            bgcolor: PURPLE_SOFT,
                            '& .MuiLinearProgress-bar': { bgcolor: PURPLE },
                        }} />
                    )}

                </Stack>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1 }}>
                <StyledButton
                    onClick={handleClose}
                    disabled={saving}
                    sx={{ color: INK_SOFT }}
                >
                    Отмена
                </StyledButton>
                <StyledButton
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={saving || !formData.title.trim()}
                    sx={{
                        bgcolor: PURPLE, borderRadius: '10px',
                        textTransform: 'none', fontWeight: 700,
                        px: 3,
                        '&:hover': { bgcolor: '#6B4BEB' },
                        '&.Mui-disabled': { bgcolor: '#E5E7EB', color: '#9CA3AF' },
                    }}
                >
                    {saving ? 'Сохраняем…' : (initialData ? 'Сохранить' : 'Создать разбор')}
                </StyledButton>
            </DialogActions>
        </StyledDialog>
    );
}