// ========== frontend/src/pages/Boards.js (РЕДИЗАЙН v2 — С РИСОВАННЫМ ФОНОМ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, Alert, Chip, IconButton, Grid,
    FormControl, InputLabel, Select, MenuItem, Tooltip, Paper
} from '@mui/material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon,
    OpenInNew as OpenInNewIcon,
    Archive as ArchiveIcon,
    Delete as DeleteIcon,
    Link as LinkIcon,
    Draw as PenToolIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========



const BoardCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    transition: 'all 0.2s ease',
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
    },
    // Большой размытый круг — правый верхний угол
    '&::before': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -40,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(79, 70, 229, 0.12) 0%, rgba(124, 58, 237, 0.05) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
    // Маленький круг — левый нижний угол
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -60,
        left: -30,
        width: 160,
        height: 160,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167, 139, 250, 0.08) 0%, rgba(79, 70, 229, 0.03) 50%, transparent 80%)',
        pointerEvents: 'none',
        zIndex: 0,
    },
});

const CardContentWrapper = styled(CardContent)({
    position: 'relative',
    zIndex: 1,
});

const ServiceBadge = styled(Box)(({ serviceColor }) => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    backgroundColor: serviceColor ? `${serviceColor}18` : '#F3F4F6',
    color: serviceColor || '#6B7280',
    border: serviceColor ? `1px solid ${serviceColor}35` : '1px solid #E5E7EB',
}));

const UrlPreview = styled(Box)({
    padding: '12px 16px',
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #F3F4F6',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    '&:hover': {
        backgroundColor: '#EEF2FF',
        borderColor: '#C7D2FE',
    },
});

// ========== УТИЛИТЫ ==========

const SERVICE_INFO = {
    miro:       { name: 'Miro',       icon: '🔵', color: '#FACC15', bgLight: '#FFFBEB' },
    figma:      { name: 'Figma',      icon: '🟣', color: '#A259FF', bgLight: '#F5F0FF' },
    figjam:     { name: 'FigJam',     icon: '🟣', color: '#A259FF', bgLight: '#F5F0FF' },
    excalidraw: { name: 'Excalidraw', icon: '🟢', color: '#10B981', bgLight: '#ECFDF5' },
    tldraw:     { name: 'tldraw',     icon: '🟠', color: '#F59E0B', bgLight: '#FFFBEB' },
    google:     { name: 'Google Jamboard', icon: '🟡', color: '#F59E0B', bgLight: '#FFFBEB' },
    default:    { name: 'Онлайн-доска',    icon: '🔗', color: '#4F46E5', bgLight: '#EEF2FF' },
};

function getServiceInfo(url) {
    if (!url) return SERVICE_INFO.default;
    const lower = url.toLowerCase();
    if (lower.includes('miro.com')) return SERVICE_INFO.miro;
    if (lower.includes('figma.com') || lower.includes('figjam')) return SERVICE_INFO.figma;
    if (lower.includes('excalidraw')) return SERVICE_INFO.excalidraw;
    if (lower.includes('tldraw')) return SERVICE_INFO.tldraw;
    if (lower.includes('google.com') && lower.includes('jam')) return SERVICE_INFO.google;
    return SERVICE_INFO.default;
}

// ========== ДЕКОРАТИВНЫЕ SVG ДЛЯ КАРТОЧЕК ==========
const CardDecorTopRight = () => (
    <Box sx={{ position: 'absolute', top: 10, right: 14, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="44" height="44" viewBox="0 0 44 44">
            <rect x="0" y="0" width="18" height="18" rx="4" fill="#4F46E5" transform="rotate(12 9 9)"/>
            <circle cx="30" cy="14" r="7" fill="#7C3AED"/>
            <rect x="22" y="28" width="14" height="5" rx="2.5" fill="#A78BFA" transform="rotate(-8 29 30.5)"/>
        </svg>
    </Box>
);

const CardDecorBottomLeft = () => (
    <Box sx={{ position: 'absolute', bottom: 14, left: 10, opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="52" height="32" viewBox="0 0 52 32">
            <circle cx="10" cy="16" r="9" fill="#4F46E5"/>
            <circle cx="30" cy="11" r="6" fill="#7C3AED"/>
            <circle cx="44" cy="20" r="7" fill="#A78BFA"/>
        </svg>
    </Box>
);

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Boards() {
    const { user } = useAuth();
    const isTutor = user?.role === 'TUTOR' || user?.role === 'ROLE_TUTOR' || user?.role === 'tutor';    
    const [boards, setBoards] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [newBoard, setNewBoard] = useState({ title: '', url: '', studentId: '' });

    useEffect(() => {
        loadBoards();
        if (isTutor) loadStudents();
    }, []);

    const loadBoards = async () => {
        setLoading(true);
        try {
            const endpoint = isTutor ? '/boards/tutor' : '/boards/student';
            const res = await axiosInstance.get(endpoint);
            setBoards(res.data || []);
        } catch (err) {
            setError('Ошибка загрузки досок');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const res = await axiosInstance.get(`/students/tutor/${user.id}`);
            setStudents(res.data || []);
        } catch (err) {
            console.error('Ошибка загрузки учеников:', err);
        }
    };

    const handleCreate = async () => {
        if (!newBoard.url || !newBoard.title) return;
        try {
            await axiosInstance.post('/boards', {
                title: newBoard.title,
                url: newBoard.url,
                studentId: newBoard.studentId || null
            });
            setOpenCreate(false);
            setNewBoard({ title: '', url: '', studentId: '' });
            loadBoards();
        } catch (err) {
            setError('Ошибка создания доски');
        }
    };

    const handleArchive = async (id) => {
        try {
            await axiosInstance.put(`/boards/${id}/archive`);
            loadBoards();
        } catch (err) {
            setError('Ошибка архивации доски');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить доску навсегда?')) return;
        try {
            await axiosInstance.delete(`/boards/${id}`);
            loadBoards();
        } catch (err) {
            setError('Ошибка удаления доски');
        }
    };

    const handleOpen = (url) => {
        window.open(url, '_blank', 'width=1200,height=800');
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#4F46E5' }} />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer>
            {/* ========== ЗАГОЛОВОК ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                        Онлайн-доски
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {isTutor
                            ? 'Управление ссылками на доски для совместной работы с учениками'
                            : 'Доски, которыми поделился репетитор'}
                    </Typography>
                </Box>
                {isTutor && (
                    <StyledButton
                        variant="contained"
                        startIcon={<AddIcon sx={{ fontSize: 18 }} />}
                        onClick={() => setOpenCreate(true)}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                    >
                        Добавить доску
                    </StyledButton>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {/* ========== ПУСТОЕ СОСТОЯНИЕ ========== */}
            {boards.length === 0 ? (
                <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                    <EmptyStateContainer>
                        <EmptyStateIcon>
                            <PenToolIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
                        </EmptyStateIcon>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                            Нет активных досок
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>
                            {isTutor
                                ? 'Добавьте ссылку на доску для совместной работы с учениками'
                                : 'Репетитор добавит доску и вы увидите её здесь'}
                        </Typography>
                        {isTutor && (
                            <StyledButton
                                variant="contained"
                                startIcon={<AddIcon />}
                                onClick={() => setOpenCreate(true)}
                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                            >
                                Добавить доску
                            </StyledButton>
                        )}
                    </EmptyStateContainer>
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {boards.map(board => {
                        const service = getServiceInfo(board.url);
                        
                        return (
                            <Grid item xs={12} sm={6} md={4} key={board.id}>
                                <BoardCard>
                                    {/* Рисованные декоративные элементы */}
                                    <CardDecorTopRight />
                                    <CardDecorBottomLeft />
                                    
                                    <CardContentWrapper sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        {/* Заголовок + ученик */}
                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                <Typography sx={{ fontWeight: 600, fontSize: '16px', color: '#1F2937', mb: 0.5 }}>
                                                    {board.title}
                                                </Typography>
                                                {board.studentName && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                        <PersonIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                        <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                            {board.studentName}
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Бейдж сервиса */}
                                        <Box sx={{ mb: 1.5 }}>
                                            <ServiceBadge serviceColor={service.color}>
                                                <Typography sx={{ fontSize: '16px', lineHeight: 1 }}>
                                                    {service.icon}
                                                </Typography>
                                                <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>
                                                    {service.name}
                                                </Typography>
                                            </ServiceBadge>
                                        </Box>

                                        {/* Мини-превью ссылки */}
                                        <UrlPreview onClick={() => handleOpen(board.url)}>
                                            <LinkIcon sx={{ fontSize: 16, color: '#4F46E5', flexShrink: 0 }} />
                                            <Typography sx={{ 
                                                fontSize: '13px', color: '#4F46E5', 
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>
                                                {board.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                            </Typography>
                                            <OpenInNewIcon sx={{ fontSize: 14, color: '#9CA3AF', flexShrink: 0, ml: 'auto' }} />
                                        </UrlPreview>

                                        {/* Дата */}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                                                {new Date(board.createdAt).toLocaleString('ru-RU', {
                                                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </Typography>
                                        </Box>
                                    </CardContentWrapper>

                                    <CardActions sx={{ 
                                        justifyContent: 'space-between', 
                                        px: 2.5, pb: 2, pt: 0,
                                        position: 'relative', 
                                        zIndex: 1,
                                    }}>
                                        <StyledButton
                                            variant="contained"
                                            startIcon={<OpenInNewIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => handleOpen(board.url)}
                                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontSize: '13px' }}
                                        >
                                            Открыть
                                        </StyledButton>
                                        {isTutor && (
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                <Tooltip title="Архивировать">
                                                    <IconButton size="small" onClick={() => handleArchive(board.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#6B7280' } }}>
                                                        <ArchiveIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="Удалить">
                                                    <IconButton size="small" onClick={() => handleDelete(board.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}>
                                                        <DeleteIcon sx={{ fontSize: 18 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        )}
                                    </CardActions>
                                </BoardCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {/* ========== ДИАЛОГ ДОБАВЛЕНИЯ ДОСКИ ========== */}
            <StyledDialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Добавить онлайн-доску
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2.5 }}>
                            Вставьте ссылку на любую онлайн-доску (Miro, FigJam, Excalidraw, tldraw и др.), 
                            к которой у ученика есть доступ по ссылке.
                        </Typography>

                        <TextField
                            fullWidth
                            label="Название доски"
                            value={newBoard.title}
                            onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                            placeholder="Например: ЕГЭ по математике"
                            sx={{ 
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
                                },
                            }}
                        />

                        <TextField
                            fullWidth
                            label="Ссылка на доску"
                            value={newBoard.url}
                            onChange={(e) => setNewBoard({ ...newBoard, url: e.target.value })}
                            placeholder="https://miro.com/app/board/..."
                            sx={{ 
                                mb: 2,
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: '8px',
                                    '& fieldset': { borderColor: '#E5E7EB' },
                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
                                },
                            }}
                        />

                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Ученик</InputLabel>
                            <Select
                                value={newBoard.studentId}
                                onChange={(e) => setNewBoard({ ...newBoard, studentId: e.target.value })}
                                label="Ученик"
                                sx={{
                                    borderRadius: '8px',
                                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' },
                                }}
                            >
                                <MenuItem value="">— Без ученика (только для меня) —</MenuItem>
                                {students.map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                            💡 <strong>Совет:</strong> Убедитесь, что ученик имеет доступ к доске по ссылке. 
                            Большинство сервисов (Miro, FigJam) позволяют поделиться доской по ссылке 
                            с правами «Редактирование».
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenCreate(false)} sx={{ color: '#6B7280' }}>
                        Отмена
                    </StyledButton>
                    <StyledButton 
                        onClick={handleCreate} 
                        variant="contained" 
                        disabled={!newBoard.url || !newBoard.title}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                    >
                        Добавить доску
                    </StyledButton>
                </DialogActions>
            </StyledDialog>
        </PageContainer>
    );
}

export default Boards;