// frontend/src/pages/TutorEgeTaskDetail.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, CircularProgress,
    Alert, Stack, Chip, Snackbar, IconButton,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    ArrowBack as ArrowBackIcon,
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import EgeSolutionView from '../components/EgeSolutionView';
import EgeSolutionForm from '../components/EgeSolutionForm';

const BG = '#FAFAFA';
const INK = '#141414';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const RED = '#EF4444';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const SolutionWrapper = styled(Box)({
    position: 'relative',
    '&:hover .solution-actions': { opacity: 1 },
});

const ActionsOverlay = styled(Box)({
    position: 'absolute',
    top: 20,
    right: 20,
    display: 'flex',
    gap: 6,
    opacity: 0,
    transition: 'opacity 0.2s ease',
    zIndex: 5,
});

export default function TutorEgeTaskDetail() {
    const { taskNumber } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    useEffect(() => { document.title = `EdSpace — Задание ${taskNumber}`; }, [taskNumber]);

    const [loading, setLoading] = useState(true);
    const [solutions, setSolutions] = useState([]);
    const [error, setError] = useState(null);
    const [toast, setToast] = useState(null);

    const [openForm, setOpenForm] = useState(false);
    const [editingSolution, setEditingSolution] = useState(null);

    const loadSolutions = async () => {
        try {
            const res = await axiosInstance.get(`/ege-solutions?taskNumber=${taskNumber}`);
            setSolutions(res.data || []);
            setError(null);
        } catch (err) {
            setError('Не удалось загрузить разборы');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSolutions();
    }, [taskNumber]);

    const handleCreate = () => {
        setEditingSolution(null);
        setOpenForm(true);
    };

    const handleEdit = (sol) => {
        setEditingSolution(sol);
        setOpenForm(true);
    };

    const handleDelete = async (sol) => {
        if (!window.confirm(`Удалить разбор "${sol.title}"?`)) return;
        try {
            await axiosInstance.delete(`/ege-solutions/${sol.id}`);
            setToast({ type: 'success', message: 'Разбор удалён' });
            loadSolutions();
        } catch (err) {
            setToast({ type: 'error', message: err.response?.data?.error || 'Ошибка удаления' });
        }
    };

    const handleSave = async (formData, filesPayload, filesToRemove) => {
        try {
            let solutionId;

            if (editingSolution) {
                // Обновление
                await axiosInstance.patch(`/ege-solutions/${editingSolution.id}`, {
                    taskNumber: parseInt(taskNumber),
                    title: formData.title,
                    explanation: formData.explanation,
                    code: formData.code,
                    codeLanguage: formData.codeLanguage,
                    videoUrl: formData.videoUrl,
                    sourceUrl: formData.sourceUrl,
                });
                solutionId = editingSolution.id;

                // Удаляем помеченные картинки
                if (filesToRemove && filesToRemove.length > 0) {
                    for (const imgId of filesToRemove) {
                        await axiosInstance.delete(`/ege-solutions/image/${imgId}`);
                    }
                }
            } else {
                // Создание — сначала JSON, потом отдельно картинки
                const res = await axiosInstance.post('/ege-solutions', {
                    taskNumber: parseInt(taskNumber),
                    title: formData.title,
                    explanation: formData.explanation,
                    code: formData.code,
                    codeLanguage: formData.codeLanguage,
                    videoUrl: formData.videoUrl,
                    sourceUrl: formData.sourceUrl,
                });
                solutionId = res.data.id;
            }

            // Загружаем скрины задачи
            if (filesPayload?.taskFiles && filesPayload.taskFiles.length > 0) {
                const fd = new FormData();
                filesPayload.taskFiles.forEach(f => fd.append('files', f));
                fd.append('imageType', 'TASK');
                await axiosInstance.post(`/ege-solutions/${solutionId}/images`, fd, {
                    headers: { 'Content-Type': undefined },
                });
            }

            // Загружаем скрины решения
            if (filesPayload?.solutionFiles && filesPayload.solutionFiles.length > 0) {
                const fd = new FormData();
                filesPayload.solutionFiles.forEach(f => fd.append('files', f));
                fd.append('imageType', 'SOLUTION');
                await axiosInstance.post(`/ege-solutions/${solutionId}/images`, fd, {
                    headers: { 'Content-Type': undefined },
                });
            }

            setToast({
                type: 'success',
                message: editingSolution ? 'Разбор обновлён' : 'Разбор создан',
            });
            setOpenForm(false);
            setEditingSolution(null);
            loadSolutions();
        } catch (err) {
            setToast({
                type: 'error',
                message: err.response?.data?.error || 'Ошибка сохранения',
            });
            throw err;
        }
    };

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress sx={{ color: PURPLE }} />
                </Box>
            </PageContainer>
        );
    }

    return (
        <PageContainer sx={{ px: { xs: 2, sm: 3 }, bgcolor: BG, minHeight: '100vh' }}>
            <Reveal>
                <Box sx={{ mb: 3 }}>
                    <StyledButton
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/materials/ege')}
                        sx={{
                            color: INK_MUTED,
                            textTransform: 'none',
                            fontWeight: 600,
                            mb: 2,
                            '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
                        }}
                    >
                        К списку заданий
                    </StyledButton>

                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', flexWrap: 'wrap', gap: 2,
                    }}>
                        <Box>
                            <Typography sx={{
                                fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                                color: INK, letterSpacing: '-0.02em', mb: 0.5,
                            }}>
                                📖 Задание {taskNumber}
                            </Typography>
                            <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                                {solutions.length} {solutions.length === 1 ? 'разбор' : solutions.length < 5 ? 'разбора' : 'разборов'}
                            </Typography>
                        </Box>
                        <StyledButton
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{
                                bgcolor: PURPLE,
                                borderRadius: '10px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 3,
                                py: 1.2,
                                boxShadow: `0 4px 12px ${alpha(PURPLE, 0.3)}`,
                                '&:hover': { bgcolor: '#6B4BEB' },
                            }}
                        >
                            Добавить разбор
                        </StyledButton>
                    </Box>
                </Box>
            </Reveal>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

            {solutions.length === 0 && !error && (
                <Reveal delay={0.05}>
                    <Paper sx={{
                        p: 6, borderRadius: 4, bgcolor: '#FFF',
                        border: `1px dashed ${LINE}`, textAlign: 'center',
                    }}>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: INK, mb: 1 }}>
                            Пока нет разборов
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem', mb: 3 }}>
                            Добавь первый разбор для задания №{taskNumber}
                        </Typography>
                        <StyledButton
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreate}
                            sx={{
                                bgcolor: PURPLE, borderRadius: '10px',
                                textTransform: 'none', fontWeight: 700,
                                '&:hover': { bgcolor: '#6B4BEB' },
                            }}
                        >
                            Добавить разбор
                        </StyledButton>
                    </Paper>
                </Reveal>
            )}

            <Stack spacing={2.5}>
                {solutions.map((sol, i) => (
                    <Reveal key={sol.id} delay={0.05 * i}>
                        <SolutionWrapper>
                            <ActionsOverlay className="solution-actions">
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(sol); }}
                                    sx={{
                                        bgcolor: '#FFF',
                                        color: PURPLE,
                                        border: `1px solid ${LINE}`,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        '&:hover': { bgcolor: PURPLE, color: '#FFF' },
                                    }}
                                >
                                    <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                    size="small"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(sol); }}
                                    sx={{
                                        bgcolor: '#FFF',
                                        color: RED,
                                        border: `1px solid ${LINE}`,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                        '&:hover': { bgcolor: RED, color: '#FFF' },
                                    }}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </ActionsOverlay>
                            <EgeSolutionView solution={sol} />
                        </SolutionWrapper>
                    </Reveal>
                ))}
            </Stack>

            {/* Форма создания/редактирования */}
            <EgeSolutionForm
                open={openForm}
                onClose={() => { setOpenForm(false); setEditingSolution(null); }}
                onSave={handleSave}
                initialData={editingSolution}
                taskNumber={parseInt(taskNumber)}
            />

            <Snackbar
                open={!!toast}
                autoHideDuration={2500}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {toast ? (
                    <Alert severity={toast.type} onClose={() => setToast(null)} sx={{ borderRadius: 2, fontWeight: 600 }}>
                        {toast.message}
                    </Alert>
                ) : <div />}
            </Snackbar>
        </PageContainer>
    );
}