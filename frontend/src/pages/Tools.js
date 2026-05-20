import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions,
    TextField, CircularProgress, Alert, Chip, IconButton, Grid,
    Tooltip, Paper, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { PageContainer, StyledButton, StyledDialog, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { styled } from '@mui/material/styles';
import {
    Add as AddIcon, Edit as EditIcon,
    OpenInNew as OpenInNewIcon,
    Archive as ArchiveIcon,
    Unarchive as UnarchiveIcon,
    Delete as DeleteIcon,
    Link as LinkIcon,
    Draw as DrawIcon,
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Videocam as VideocamIcon,
    Save as SaveIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import WhiteboardModal from '../components/WhiteboardModal';

// ========== СТИЛИ ==========
const BoardCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    transition: 'all 0.2s ease',
    position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF',
    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
});

const CardContentWrapper = styled(CardContent)({ position: 'relative', zIndex: 1 });

const UrlPreview = styled(Box)({
    padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6',
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer',
    '&:hover': { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
});

// ========== УТИЛИТЫ ==========
function getAvatarColor(name) {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    let hash = 0;
    for (let i = 0; i < (name || '?').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

const SERVICE_INFO = {
    miro: { name: 'Miro', icon: '🔵' }, figma: { name: 'Figma', icon: '🟣' },
    figjam: { name: 'FigJam', icon: '🟣' }, excalidraw: { name: 'Excalidraw', icon: '🟢' },
    tldraw: { name: 'tldraw', icon: '🟠' }, google: { name: 'Jamboard', icon: '🟡' },
    default: { name: 'Доска', icon: '🔗' },
};
function getServiceInfo(url) {
    if (!url) return SERVICE_INFO.default;
    const l = url.toLowerCase();
    if (l.includes('miro')) return SERVICE_INFO.miro;
    if (l.includes('figma') || l.includes('figjam')) return SERVICE_INFO.figma;
    if (l.includes('excalidraw')) return SERVICE_INFO.excalidraw;
    if (l.includes('tldraw')) return SERVICE_INFO.tldraw;
    if (l.includes('google') && l.includes('jam')) return SERVICE_INFO.google;
    return SERVICE_INFO.default;
}

const VIDEO_PLATFORMS = {
    JITSI: { label: 'Jitsi Meet', color: '#6366F1' },
    ZOOM: { label: 'Zoom', color: '#2D8CFF' },
    TELEMOST: { label: 'Яндекс.Телемост', color: '#FC3F1D' },
    SKYPE: { label: 'Skype', color: '#00AFF0' },
    OTHER: { label: 'Другое', color: '#6366F1' },
};

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Tools() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Инструменты'; }, []);
    const isTutor = user?.role === 'TUTOR' || user?.role === 'ROLE_TUTOR' || user?.role === 'tutor';
    
    const [tabValue, setTabValue] = useState(isTutor ? 0 : 1);    
    // Состояния для досок
    const [boards, setBoards] = useState([]);
    const [archivedBoards, setArchivedBoards] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [boardViewMode, setBoardViewMode] = useState('active');
    const [openDialog, setOpenDialog] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [formData, setFormData] = useState({ title: '', url: '', studentIds: [], boardType: 'link' });
    const [saving, setSaving] = useState(false);
    const [whiteboardOpen, setWhiteboardOpen] = useState(false);
    const [whiteboardData, setWhiteboardData] = useState({ roomName: '', boardId: null });
    
    // Состояния для видео-комнат
    const [videoRooms, setVideoRooms] = useState([]);
    const [videoRoomsLoading, setVideoRoomsLoading] = useState(false);
    const [videoRoomDialogOpen, setVideoRoomDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [videoRoomForm, setVideoRoomForm] = useState({ name: '', platform: 'ZOOM', url: '' });
    const [videoRoomSaving, setVideoRoomSaving] = useState(false);

    useEffect(() => { 
        loadBoards(); 
        if (isTutor) { loadStudents(); loadArchivedBoards(); loadVideoRooms(); } 
    }, []);
    useEffect(() => { if (boardViewMode === 'archived' && isTutor) loadArchivedBoards(); }, [boardViewMode]);

    // ========== ЗАГРУЗКА ДОСОК ==========
    const loadBoards = async () => {
        setLoading(true);
        try { setBoards((await axiosInstance.get(isTutor ? '/boards/tutor' : '/boards/student')).data || []); } 
        catch (err) { setError('Ошибка загрузки'); } 
        finally { setLoading(false); }
    };
    const loadArchivedBoards = async () => {
        try { setArchivedBoards((await axiosInstance.get('/boards/tutor/archived')).data || []); } catch (err) {}
    };
    const loadStudents = async () => {
        try { setStudents((await axiosInstance.get(`/students/tutor/${user.id}`)).data || []); } catch (err) {}
    };

    // ========== ЗАГРУЗКА ВИДЕО-КОМНАТ ==========
    const loadVideoRooms = async () => {
        setVideoRoomsLoading(true);
        try {
            const res = await axiosInstance.get(`/video-rooms/tutor/${user.id}`);
            setVideoRooms(res.data || []);
        } catch (err) { console.error('Ошибка загрузки комнат:', err); }
        finally { setVideoRoomsLoading(false); }
    };

    // ========== СОХРАНЕНИЕ КОМНАТЫ ==========
    const handleSaveVideoRoom = async () => {
        if (!videoRoomForm.name || !videoRoomForm.url) return;
        setVideoRoomSaving(true);
        try {
            if (editingRoom) {
                await axiosInstance.put(`/video-rooms/${editingRoom.id}`, videoRoomForm);
            } else {
                await axiosInstance.post('/video-rooms', videoRoomForm);
            }
            setVideoRoomDialogOpen(false);
            setEditingRoom(null);
            setVideoRoomForm({ name: '', platform: 'ZOOM', url: '' });
            loadVideoRooms();
        } catch (err) {
            setError('Ошибка сохранения комнаты');
        } finally {
            setVideoRoomSaving(false);
        }
    };

    // ========== РЕДАКТИРОВАНИЕ КОМНАТЫ ==========
    const handleEditRoom = (room) => {
        setEditingRoom(room);
        setVideoRoomForm({ name: room.name, platform: room.platform, url: room.url });
        setVideoRoomDialogOpen(true);
    };

    // ========== УДАЛЕНИЕ КОМНАТЫ ==========
    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Удалить комнату?')) return;
        try {
            await axiosInstance.delete(`/video-rooms/${id}`);
            loadVideoRooms();
        } catch (err) {
            setError('Ошибка удаления комнаты');
        }
    };

    // ========== МЕТОДЫ ДЛЯ ДОСОК ==========
    const handleOpenDialog = (board = null) => {
        if (board) {
            setEditingBoard(board);
            setFormData({ title: board.title || '', url: board.url || '', studentIds: board.studentIds || [], boardType: board.url ? 'link' : 'builtin' });
        } else {
            setEditingBoard(null); setFormData({ title: '', url: '', studentIds: [], boardType: 'link' });
        }
        setOpenDialog(true);
    };

    const handleSave = async () => {
        if (!formData.title) return;
        if (formData.boardType === 'link' && !formData.url) return;
        setSaving(true);
        try {
            const payload = { title: formData.title, url: formData.boardType === 'builtin' ? '' : formData.url, studentIds: formData.studentIds };
            if (editingBoard) await axiosInstance.put(`/boards/${editingBoard.id}`, payload);
            else await axiosInstance.post('/boards', payload);
            setOpenDialog(false); setEditingBoard(null); setFormData({ title: '', url: '', studentIds: [], boardType: 'link' });
            loadBoards(); loadArchivedBoards();
        } catch (err) { setError('Ошибка сохранения'); } finally { setSaving(false); }
    };

    const handleToggleStudent = (id) => setFormData(p => ({ ...p, studentIds: p.studentIds.includes(id) ? p.studentIds.filter(i => i !== id) : [...p.studentIds, id] }));
    const handleArchive = async (id) => { try { await axiosInstance.put(`/boards/${id}/archive`); loadBoards(); loadArchivedBoards(); } catch (err) {} };
    const handleRestore = async (id) => { try { await axiosInstance.put(`/boards/${id}/restore`); loadBoards(); loadArchivedBoards(); } catch (err) {} };
    const handleDelete = async (id) => { if (!window.confirm('Удалить?')) return; try { await axiosInstance.delete(`/boards/${id}`); loadBoards(); loadArchivedBoards(); } catch (err) {} };
    const handleOpen = (url) => window.open(url, '_blank', 'width=1200,height=800');
    const handleOpenWhiteboard = (board) => { 
        setWhiteboardData({ roomName: board.roomName, encryptionKey: board.encryptionKey, boardId: board.id }); 
        setWhiteboardOpen(true); 
    };

    const displayBoards = boardViewMode === 'active' ? boards : archivedBoards;

    if (loading) return <PageContainer><Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><CircularProgress /></Box></PageContainer>;

    return (
        <PageContainer sx={{ px: { xs: 1, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        {isTutor ? 'Видеоконференции и доски для совместной работы' : 'Доски для совместной работы'}
                    </Typography>
                </Box>
            </Box>

            {/* Вкладки */}
            <Box sx={{ mb: 3 }}>
                <ViewToggle>
                    {isTutor && (
                        <ViewToggleBtn active={tabValue === 0} onClick={() => setTabValue(0)}>
                            <VideocamIcon sx={{ fontSize: 18, mr: 0.5 }} /> Видеоконференции
                        </ViewToggleBtn>
                    )}
                    <ViewToggleBtn active={tabValue === 1 || (!isTutor && tabValue === 1)} onClick={() => setTabValue(1)}>
                        <DrawIcon sx={{ fontSize: 18, mr: 0.5 }} /> Доски
                    </ViewToggleBtn>
                </ViewToggle>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

            {/* ========== ВКЛАДКА: ВИДЕОКОНФЕРЕНЦИИ ========== */}
            {tabValue === 0 && (
                <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '18px' }}>
                            🎥 Мои комнаты ({videoRooms.length})
                        </Typography>
                        <StyledButton 
                            variant="contained" 
                            startIcon={<AddIcon />} 
                            onClick={() => { setEditingRoom(null); setVideoRoomForm({ name: '', platform: 'ZOOM', url: '' }); setVideoRoomDialogOpen(true); }}
                            sx={{ bgcolor: '#4F46E5' }}
                        >
                            Добавить комнату
                        </StyledButton>
                    </Box>

                    {videoRoomsLoading ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : videoRooms.length === 0 ? (
                        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: '12px' }}>
                            <VideocamIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                            <Typography sx={{ fontSize: '16px', fontWeight: 500, mb: 1 }}>Нет комнат</Typography>
                            <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 2 }}>
                                Добавьте комнаты для разных платформ. При старте урока можно будет выбрать нужную.
                            </Typography>
                            <StyledButton variant="contained" startIcon={<AddIcon />}
                                onClick={() => { setEditingRoom(null); setVideoRoomForm({ name: '', platform: 'ZOOM', url: '' }); setVideoRoomDialogOpen(true); }}
                                sx={{ bgcolor: '#4F46E5' }}>
                                Добавить комнату
                            </StyledButton>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {videoRooms.map(room => {
                                const platformInfo = VIDEO_PLATFORMS[room.platform] || { label: room.platform, color: '#6366F1' };
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={room.id}>
                                        <Card sx={{ 
                                            borderRadius: '12px', 
                                            border: '1px solid #F3F4F6',
                                            borderLeft: `4px solid ${platformInfo.color}`,
                                            '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }
                                        }}>
                                            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <Chip 
                                                        label={platformInfo.label} 
                                                        size="small"
                                                        sx={{ bgcolor: platformInfo.color, color: '#fff', fontWeight: 500, fontSize: '11px' }}
                                                    />
                                                    {room.isDefault && (
                                                        <Chip label="По умолчанию" size="small" 
                                                            sx={{ bgcolor: '#ECFDF5', color: '#065F46', fontSize: '10px', height: 20 }} />
                                                    )}
                                                </Box>
                                                <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 1 }}>{room.name}</Typography>
                                                {room.url && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                        <LinkIcon sx={{ fontSize: 14, color: '#6B7280' }} />
                                                        <Typography sx={{ fontSize: '12px', color: '#4F46E5', wordBreak: 'break-all' }}>
                                                            {room.url.replace(/^https?:\/\//, '').substring(0, 40)}...
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </CardContent>
                                            <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 1.5 }}>
                                                <IconButton size="small" onClick={() => handleEditRoom(room)}>
                                                    <EditIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                                <IconButton size="small" onClick={() => handleDeleteRoom(room.id)} sx={{ color: '#EF4444' }}>
                                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                                </IconButton>
                                            </CardActions>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* Диалог создания/редактирования комнаты */}
                    <StyledDialog open={videoRoomDialogOpen} onClose={() => setVideoRoomDialogOpen(false)} maxWidth="sm" fullWidth>
                        <DialogTitle sx={{ fontWeight: 600, px: 3, pt: 3, pb: 1 }}>
                            {editingRoom ? 'Редактировать комнату' : 'Добавить комнату'}
                        </DialogTitle>
                        <DialogContent sx={{ px: 3 }}>
                            <Box sx={{ pt: 2 }}>
                                <TextField fullWidth label="Название" value={videoRoomForm.name} 
                                    onChange={e => setVideoRoomForm({...videoRoomForm, name: e.target.value})}
                                    placeholder="Например: Zoom Петя, Телемост Маша"
                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                <FormControl fullWidth sx={{ mb: 2 }}>
                                    <InputLabel>Платформа</InputLabel>
                                    <Select value={videoRoomForm.platform} 
                                        onChange={e => setVideoRoomForm({...videoRoomForm, platform: e.target.value})}
                                        label="Платформа" sx={{ borderRadius: '8px' }}>
                                        <MenuItem value="ZOOM">Zoom</MenuItem>
                                        <MenuItem value="TELEMOST">Яндекс.Телемост</MenuItem>
                                        <MenuItem value="SKYPE">Skype</MenuItem>
                                        <MenuItem value="JITSI">Jitsi Meet</MenuItem>
                                        <MenuItem value="OTHER">Другое</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField fullWidth label="Ссылка на конференцию" value={videoRoomForm.url} 
                                    onChange={e => setVideoRoomForm({...videoRoomForm, url: e.target.value})}
                                    placeholder="https://zoom.us/j/123456789"
                                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                                    💡 Добавьте несколько комнат для разных платформ. При старте урока вы сможете выбрать нужную.
                                </Alert>
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{ px: 3, pb: 3 }}>
                            <StyledButton onClick={() => setVideoRoomDialogOpen(false)}>Отмена</StyledButton>
                            <StyledButton onClick={handleSaveVideoRoom} variant="contained" 
                                disabled={!videoRoomForm.name || !videoRoomForm.url || videoRoomSaving}
                                sx={{ bgcolor: '#4F46E5' }}>
                                {videoRoomSaving ? <CircularProgress size={20} /> : editingRoom ? 'Сохранить' : 'Добавить'}
                            </StyledButton>
                        </DialogActions>
                    </StyledDialog>
                </Box>
            )}

            {/* ========== ВКЛАДКА: ДОСКИ ========== */}
            {tabValue === 1 && (
                <Box>
                    {isTutor && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <ViewToggle>
                                <ViewToggleBtn active={boardViewMode === 'active'} onClick={() => setBoardViewMode('active')}>
                                    Активные ({boards.length})
                                </ViewToggleBtn>
                                <ViewToggleBtn active={boardViewMode === 'archived'} onClick={() => setBoardViewMode('archived')}>
                                    Архив ({archivedBoards.length})
                                </ViewToggleBtn>
                            </ViewToggle>
                            <StyledButton variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null)} sx={{ bgcolor: '#4F46E5' }}>
                                Добавить доску
                            </StyledButton>
                        </Box>
                    )}

                    {displayBoards.length === 0 ? (
                        <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', p: 6, textAlign: 'center' }}>
                            <EmptyStateIcon><DrawIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 1 }}>
                                {boardViewMode === 'archived' ? 'Архив пуст' : 'Нет активных досок'}
                            </Typography>
                            {isTutor && boardViewMode === 'active' && (
                                <StyledButton variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null)} sx={{ mt: 2, bgcolor: '#4F46E5' }}>
                                    Добавить доску
                                </StyledButton>
                            )}
                        </Paper>
                    ) : (
                        <Grid container spacing={2.5}>
                            {displayBoards.map(board => {
                                const isArchived = boardViewMode === 'archived';
                                const isBuiltin = !board.url;
                                const studentCount = board.studentCount || (board.studentName ? 1 : 0);
                                const service = getServiceInfo(board.url);
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={board.id}>
                                        <BoardCard sx={{ ...(isArchived ? { opacity: 0.7 } : {}), borderLeft: isBuiltin ? '4px solid #7C3AED' : '1px solid #F3F4F6' }}>
                                            <CardContentWrapper sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '16px' }}>{board.title}</Typography>
                                                    <Chip icon={isBuiltin ? <DrawIcon sx={{ fontSize: 14 }} /> : <LinkIcon sx={{ fontSize: 14 }} />}
                                                        label={isBuiltin ? 'Доска' : 'Ссылка'} size="small"
                                                        sx={{ bgcolor: isBuiltin ? '#F5F3FF' : '#F3F4F6', color: isBuiltin ? '#7C3AED' : '#6B7280', borderRadius: '8px', height: 26, fontSize: '11px' }} />
                                                </Box>
                                                {studentCount > 0 && (
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                                                        <PersonIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                        <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>{studentCount > 1 ? `${studentCount} ученика` : board.studentName}</Typography>
                                                    </Box>
                                                )}
                                                {isBuiltin ? (
                                                    <Box sx={{ p: 2, mb: 1.5, bgcolor: '#F5F3FF', borderRadius: '8px', textAlign: 'center' }}>
                                                        <DrawIcon sx={{ fontSize: 32, color: '#7C3AED', mb: 0.5 }} />
                                                        <Typography sx={{ fontSize: '12px', color: '#7C3AED' }}>Встроенная доска</Typography>
                                                    </Box>
                                                ) : (
                                                    <>
                                                        <Box sx={{ mb: 1 }}><Chip icon={<Typography>{service.icon}</Typography>} label={service.name} size="small" variant="outlined" sx={{ borderRadius: '6px' }} /></Box>
                                                        <UrlPreview onClick={() => handleOpen(board.url)}>
                                                            <LinkIcon sx={{ fontSize: 16, color: '#4F46E5' }} />
                                                            <Typography sx={{ fontSize: '13px', color: '#4F46E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {board.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                            </Typography>
                                                            <OpenInNewIcon sx={{ fontSize: 14, color: '#9CA3AF', ml: 'auto' }} />
                                                        </UrlPreview>
                                                    </>
                                                )}
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                    <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                                                        {isArchived && board.archivedAt 
                                                            ? `Архив: ${new Date(board.archivedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}` 
                                                            : `Создана: ${new Date(board.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                                                    </Typography>
                                                </Box>
                                            </CardContentWrapper>
                                            <CardActions sx={{ justifyContent: 'space-between', px: 2.5, pb: 2, pt: 0, zIndex: 1 }}>
                                                {isArchived ? (
                                                    <>
                                                        <StyledButton variant="outlined" startIcon={<UnarchiveIcon />} onClick={() => handleRestore(board.id)} sx={{ fontSize: '13px' }}>Восстановить</StyledButton>
                                                        <IconButton size="small" onClick={() => handleDelete(board.id)} sx={{ color: '#9CA3AF', '&:hover': { color: '#EF4444' } }}><DeleteIcon /></IconButton>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                            {isBuiltin ? (
                                                                <StyledButton variant="contained" startIcon={<DrawIcon />} onClick={() => handleOpenWhiteboard(board)} sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, fontSize: '13px' }}>Открыть</StyledButton>
                                                            ) : (
                                                                <StyledButton variant="contained" startIcon={<OpenInNewIcon />} onClick={() => handleOpen(board.url)} sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, fontSize: '13px' }}>Открыть</StyledButton>
                                                            )}
                                                            {isTutor && <IconButton size="small" onClick={() => handleOpenDialog(board)}><EditIcon /></IconButton>}
                                                        </Box>
                                                        {isTutor && (
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                <IconButton size="small" onClick={() => handleArchive(board.id)}><ArchiveIcon /></IconButton>
                                                                <IconButton size="small" onClick={() => handleDelete(board.id)} sx={{ '&:hover': { color: '#EF4444' } }}><DeleteIcon /></IconButton>
                                                            </Box>
                                                        )}
                                                    </>
                                                )}
                                            </CardActions>
                                        </BoardCard>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            )}

            {/* Диалог создания/редактирования доски */}
            <StyledDialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 600, px: 3, pt: 3, pb: 1 }}>{editingBoard ? 'Редактировать' : 'Добавить доску'}</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Тип доски</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2.5 }}>
                            <Chip icon={<LinkIcon />} label="Ссылка на сервис" onClick={() => setFormData({...formData, boardType: 'link'})}
                                variant={formData.boardType === 'link' ? 'filled' : 'outlined'}
                                sx={{ borderRadius: '10px', px: 1, py: 2.5, cursor: 'pointer', bgcolor: formData.boardType === 'link' ? '#EEF2FF' : 'transparent', color: formData.boardType === 'link' ? '#4F46E5' : '#6B7280' }} />
                            <Chip icon={<DrawIcon />} label="Встроенная доска" onClick={() => setFormData({...formData, boardType: 'builtin'})}
                                variant={formData.boardType === 'builtin' ? 'filled' : 'outlined'}
                                sx={{ borderRadius: '10px', px: 1, py: 2.5, cursor: 'pointer', bgcolor: formData.boardType === 'builtin' ? '#F5F3FF' : 'transparent', color: formData.boardType === 'builtin' ? '#7C3AED' : '#6B7280' }} />
                        </Box>
                        <TextField fullWidth label="Название" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        {formData.boardType === 'link' && (
                            <>
                                <TextField fullWidth label="Ссылка" value={formData.url} onChange={e => setFormData({...formData, url: e.target.value})} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px', mb: 2 }}>💡 Miro, FigJam, Excalidraw и др. Убедитесь, что у учеников есть доступ.</Alert>
                            </>
                        )}
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, mb: 1 }}>Ученики ({formData.studentIds.length})</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                            {students.map(s => {
                                const sel = formData.studentIds.includes(s.id);
                                return <Chip key={s.id} avatar={<Avatar sx={{ bgcolor: getAvatarColor(s.fullName), width: 24, height: 24, fontSize: 11 }}>{s.fullName[0]}</Avatar>} label={s.fullName} onClick={() => handleToggleStudent(s.id)} variant={sel ? 'filled' : 'outlined'}
                                    sx={{ borderRadius: '8px', cursor: 'pointer', bgcolor: sel ? '#EEF2FF' : 'transparent', color: sel ? '#4F46E5' : '#6B7280', fontWeight: sel ? 600 : 400 }} />;
                            })}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenDialog(false)}>Отмена</StyledButton>
                    <StyledButton onClick={handleSave} variant="contained" disabled={!formData.title || (formData.boardType === 'link' && !formData.url) || saving} sx={{ bgcolor: '#4F46E5' }}>
                        {saving ? <CircularProgress size={20} /> : editingBoard ? 'Сохранить' : 'Добавить'}
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            <WhiteboardModal 
                open={whiteboardOpen} 
                onClose={() => setWhiteboardOpen(false)} 
                roomName={whiteboardData.roomName} 
                encryptionKey={whiteboardData.encryptionKey}
                boardId={whiteboardData.boardId} 
                username={user?.fullName || 'Репетитор'} 
            />
        </PageContainer>
    );
}

export default Tools;