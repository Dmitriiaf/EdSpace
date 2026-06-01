// ========== frontend/src/pages/Tools.js (РЕДИЗАЙН v2 — В СТИЛЕ БАНКА ЗАДАНИЙ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions,
    TextField, CircularProgress, Alert, Chip, IconButton, Grid,
    Tooltip, Paper, Avatar, Dialog, DialogTitle, DialogContent, DialogActions,
    FormControl, InputLabel, Select, MenuItem, Button, Stack,
    ListItemIcon, ListItemText
} from '@mui/material';
import { PageContainer, StyledButton, StyledDialog, ViewToggleBtn } from '../styles/shared';
import { styled, alpha } from '@mui/material/styles';
import {
    Add as AddIcon, Edit as EditIcon, OpenInNew as OpenInNewIcon,
    Archive as ArchiveIcon, Unarchive as UnarchiveIcon,
    Delete as DeleteIcon, Link as LinkIcon,
    Draw as DrawIcon, CalendarToday as CalendarIcon,
    Person as PersonIcon, Videocam as VideocamIcon,
    Save as SaveIcon, Search, KeyboardArrowDown,
    ViewModule, ViewList, Close, Add,
    School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import WhiteboardModal from '../components/WhiteboardModal';

// ========== СТИЛИ (В СТИЛЕ БАНКА ЗАДАНИЙ) ==========

const CompactAppBar = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '16px 24px',
    background: '#fff',
    borderBottom: '1px solid #F3F4F6',
    flexWrap: 'wrap',
});

const PageTitle = styled(Typography)({
    fontSize: '24px',
    fontWeight: 700,
    color: '#1F2937',
    whiteSpace: 'nowrap',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
});

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

const SideNav = styled(Paper)({
    width: '240px',
    minWidth: '240px',
    borderRadius: '16px',
    border: '1px solid #F3F4F6',
    overflow: 'hidden',
    position: 'sticky',
    top: '16px',
    height: 'fit-content',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
});

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
    '&:hover': { backgroundColor: active ? alpha('#764ba2', 0.12) : '#F9FAFB' },
}));

const ToolCard = styled(Card)({
    borderRadius: '16px',
    overflow: 'visible',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: '#fff',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
    },
});

const HoverActions = styled(Box)({
    position: 'absolute',
    top: 12,
    right: 12,
    display: 'flex',
    gap: 4,
    opacity: 0,
    transform: 'translateY(-8px)',
    transition: 'all 0.3s ease',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    padding: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    zIndex: 10,
    '.tool-card:hover &': { opacity: 1, transform: 'translateY(0)' },
});

// ========== УТИЛИТЫ ==========
function getAvatarColor(name) {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    let hash = 0;
    for (let i = 0; i < (name || '?').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

const VIDEO_PLATFORMS = {
    JITSI: { label: 'Jitsi Meet', color: '#6366F1', icon: '🎥' },
    ZOOM: { label: 'Zoom', color: '#2D8CFF', icon: '📹' },
    TELEMOST: { label: 'Яндекс.Телемост', color: '#FC3F1D', icon: '📺' },
    SKYPE: { label: 'Skype', color: '#00AFF0', icon: '💬' },
    OTHER: { label: 'Другое', color: '#6366F1', icon: '🔗' },
};

const SERVICE_INFO = {
    miro: { name: 'Miro', icon: '🔵', color: '#FFD02F' },
    figma: { name: 'Figma', icon: '🟣', color: '#A259FF' },
    figjam: { name: 'FigJam', icon: '🟣', color: '#A259FF' },
    excalidraw: { name: 'Excalidraw', icon: '🟢', color: '#6965DB' },
    tldraw: { name: 'tldraw', icon: '🟠', color: '#FA9C1B' },
    google: { name: 'Jamboard', icon: '🟡', color: '#F9AB00' },
    default: { name: 'Доска', icon: '🔗', color: '#9CA3AF' },
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

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Tools() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Инструменты'; }, []);
    const isTutor = user?.role === 'TUTOR' || user?.role === 'ROLE_TUTOR' || user?.role === 'tutor';
    
    const [activeNav, setActiveNav] = useState(isTutor ? 'video' : 'boards');    
    // Доски
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
    
    // Видео-комнаты
    const [videoRooms, setVideoRooms] = useState([]);
    const [videoRoomsLoading, setVideoRoomsLoading] = useState(false);
    const [videoRoomDialogOpen, setVideoRoomDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState(null);
    const [videoRoomForm, setVideoRoomForm] = useState({ name: '', platform: 'ZOOM', url: '' });
    const [videoRoomSaving, setVideoRoomSaving] = useState(false);
    useEffect(() => { 
        loadBoards(); 
        loadVideoRooms();
        if (isTutor) { loadStudents(); loadArchivedBoards(); } 
    }, []);
    useEffect(() => { if (boardViewMode === 'archived' && isTutor) loadArchivedBoards(); }, [boardViewMode]);

    // ========== ЗАГРУЗКА ==========
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
    const loadVideoRooms = async () => {
        setVideoRoomsLoading(true);
        try {
            if (isTutor) {
                setVideoRooms((await axiosInstance.get(`/video-rooms/tutor/${user.id}`)).data || []);
            } else {
                // Для ученика — получаем комнаты его репетитора
                try {
                    const studentRes = await axiosInstance.get(`/students/${user.id}`);
                    const tutorId = studentRes.data?.tutors?.[0]?.id;
                    if (tutorId) {
                        setVideoRooms((await axiosInstance.get(`/video-rooms/tutor/${tutorId}`)).data || []);
                    }
                } catch (e) { console.error(e); }
            }
        } catch (err) { console.error(err); } 
        finally { setVideoRoomsLoading(false); }
    };

    // ========== ВИДЕО-КОМНАТЫ ==========
    const handleSaveVideoRoom = async () => {
        if (!videoRoomForm.name || !videoRoomForm.url) return;
        setVideoRoomSaving(true);
        try {
            if (editingRoom) await axiosInstance.put(`/video-rooms/${editingRoom.id}`, videoRoomForm);
            else await axiosInstance.post('/video-rooms', videoRoomForm);
            setVideoRoomDialogOpen(false); setEditingRoom(null);
            setVideoRoomForm({ name: '', platform: 'ZOOM', url: '' });
            loadVideoRooms();
        } catch (err) { setError('Ошибка сохранения'); }
        finally { setVideoRoomSaving(false); }
    };

    const handleDeleteRoom = async (id) => {
        if (!window.confirm('Удалить комнату?')) return;
        try { await axiosInstance.delete(`/video-rooms/${id}`); loadVideoRooms(); } 
        catch (err) { setError('Ошибка удаления'); }
    };

    // ========== ДОСКИ ==========
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
    const handleDeleteBoard = async (id) => { if (!window.confirm('Удалить?')) return; try { await axiosInstance.delete(`/boards/${id}`); loadBoards(); loadArchivedBoards(); } catch (err) {} };
    const handleOpen = (url) => window.open(url, '_blank', 'width=1200,height=800');
    const handleOpenWhiteboard = (board) => { 
        setWhiteboardData({ roomName: board.roomName, encryptionKey: board.encryptionKey, boardId: board.id }); 
        setWhiteboardOpen(true); 
    };

    const displayBoards = boardViewMode === 'active' ? boards : archivedBoards;

    // ========== УЧЕНИК: ТОЛЬКО ДОСКИ (ПРОСМОТР) ==========
    if (!isTutor) {
        return (
            <PageContainer sx={{ p: '0 !important', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
                <CompactAppBar>
                    <PageTitle>
                        <DrawIcon sx={{ color: '#764ba2' }} />
                        Доски
                    </PageTitle>
                </CompactAppBar>

                <Box sx={{ p: 3 }}>
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                    ) : boards.length === 0 ? (
                        <Paper sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                            <DrawIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 1, color: '#6B7280' }}>Нет доступных досок</Typography>
                            <Typography sx={{ color: '#9CA3AF' }}>Репетитор ещё не добавил ни одной доски</Typography>
                        </Paper>
                    ) : (
                        <Grid container spacing={2}>
                            {boards.map(board => {
                                const isBuiltin = !board.url;
                                const service = getServiceInfo(board.url);
                                return (
                                    <Grid item xs={12} sm={6} md={4} key={board.id}>
                                        <ToolCard sx={{ borderLeft: isBuiltin ? '4px solid #7C3AED' : '1px solid #F3F4F6' }}>
                                            <CardContent sx={{ p: 2.5 }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>{board.title}</Typography>
                                                    <Chip 
                                                        icon={isBuiltin ? <DrawIcon sx={{ fontSize: 14 }} /> : <LinkIcon sx={{ fontSize: 14 }} />}
                                                        label={isBuiltin ? 'Встроенная' : 'Ссылка'} 
                                                        size="small"
                                                        sx={{ bgcolor: isBuiltin ? '#F5F3FF' : '#F3F4F6', color: isBuiltin ? '#7C3AED' : '#6B7280', borderRadius: '8px', height: 24, fontSize: '11px' }} />
                                                </Box>
                                                {isBuiltin ? (
                                                    <Box sx={{ p: 2.5, mb: 1.5, bgcolor: '#F5F3FF', borderRadius: '10px', textAlign: 'center' }}>
                                                        <DrawIcon sx={{ fontSize: 36, color: '#7C3AED', mb: 1 }} />
                                                        <Typography sx={{ fontSize: '12px', color: '#7C3AED', fontWeight: 500 }}>Встроенная доска EdSpace</Typography>
                                                    </Box>
                                                ) : (
                                                    <Box onClick={() => handleOpen(board.url)}
                                                        sx={{ mb: 1.5, p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1, '&:hover': { bgcolor: '#EEF2FF' } }}>
                                                        <Typography sx={{ fontSize: '20px' }}>{service.icon}</Typography>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{service.name}</Typography>
                                                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {board.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                            </Typography>
                                                        </Box>
                                                        <OpenInNewIcon sx={{ fontSize: 14, color: '#9CA3AF', flexShrink: 0 }} />
                                                    </Box>
                                                )}
                                            </CardContent>
                                            <CardActions sx={{ justifyContent: 'center', pb: 2 }}>
                                                {isBuiltin ? (
                                                    <StyledButton variant="contained" startIcon={<DrawIcon />} onClick={() => handleOpenWhiteboard(board)}
                                                        sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' } }}>
                                                        Открыть доску
                                                    </StyledButton>
                                                ) : (
                                                    <StyledButton variant="contained" startIcon={<OpenInNewIcon />} onClick={() => handleOpen(board.url)}
                                                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                                                        Открыть
                                                    </StyledButton>
                                                )}
                                            </CardActions>
                                        </ToolCard>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>

                <WhiteboardModal 
                    open={whiteboardOpen} 
                    onClose={() => setWhiteboardOpen(false)} 
                    roomName={whiteboardData.roomName} 
                    encryptionKey={whiteboardData.encryptionKey}
                    boardId={whiteboardData.boardId} 
                    username={user?.fullName || 'Ученик'} 
                />
            </PageContainer>
        );
    }


    if (loading) return <PageContainer><Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><CircularProgress /></Box></PageContainer>;

    return (
        <PageContainer sx={{ p: '0 !important', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
            
            {/* ========== КОМПАКТНЫЙ APP BAR ========== */}
            <CompactAppBar>
                <PageTitle>
                    <VideocamIcon sx={{ color: '#764ba2' }} />
                    Инструменты
                </PageTitle>
                
                <Box sx={{ flex: 1 }} />
                
                <ActionGroup>
                    {isTutor && (
                        <PrimaryActionButton
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => {
                                if (activeNav === 'video') {
                                    setEditingRoom(null);
                                    setVideoRoomForm({ name: '', platform: 'ZOOM', url: '' });
                                    setVideoRoomDialogOpen(true);
                                } else {
                                    handleOpenDialog(null);
                                }
                            }}
                            sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}
                        >
                            {activeNav === 'video' ? 'Добавить комнату' : 'Добавить доску'}
                        </PrimaryActionButton>
                    )}
                    {!isTutor && (
                        <PrimaryActionButton
                            variant="contained"
                            startIcon={<Add />}
                            onClick={() => handleOpenDialog(null)}
                            sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}
                        >
                            Добавить доску
                        </PrimaryActionButton>
                    )}
                </ActionGroup>
            </CompactAppBar>

            {/* ========== ОСНОВНАЯ ОБЛАСТЬ ========== */}
            <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
                
                {/* ========== БОКОВАЯ ПАНЕЛЬ ========== */}
                <SideNav>
                    <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                            Инструменты
                        </Typography>
                        <Stack spacing={0.5}>
                            {isTutor && (
                                <NavItem active={activeNav === 'video'} onClick={() => setActiveNav('video')}>
                                    <VideocamIcon fontSize="small" />
                                    Видеоконференции
                                    <Chip label={videoRooms.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                                </NavItem>
                            )}
                            <NavItem active={activeNav === 'boards'} onClick={() => setActiveNav('boards')}>
                                <DrawIcon fontSize="small" />
                                Доски
                                <Chip label={boards.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                            </NavItem>
                            {isTutor && (
                                <NavItem active={activeNav === 'archive'} onClick={() => { setActiveNav('archive'); setBoardViewMode('archived'); }}>
                                    <ArchiveIcon fontSize="small" />
                                    Архив досок
                                    <Chip label={archivedBoards.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                                </NavItem>
                            )}
                        </Stack>
                    </Box>
                    
                    {isTutor && (
                        <Box sx={{ p: 2 }}>
                            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                                Быстрые ссылки
                            </Typography>
                            <Stack spacing={0.5}>
                                <NavItem onClick={() => window.open('https://meet.ed-space.ru', '_blank')}>
                                    <VideocamIcon fontSize="small" />
                                    Jitsi Meet
                                </NavItem>
                                <NavItem onClick={() => window.open('https://zoom.us', '_blank')}>
                                    <OpenInNewIcon fontSize="small" />
                                    Zoom
                                </NavItem>
                                <NavItem onClick={() => window.open('https://telemost.yandex.ru', '_blank')}>
                                    <OpenInNewIcon fontSize="small" />
                                    Яндекс.Телемост
                                </NavItem>
                            </Stack>
                        </Box>
                    )}
                </SideNav>

                {/* ========== КОНТЕНТ ========== */}
                <Box sx={{ flex: 1, minWidth: 0 }}>

                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

                    {/* ========== ВИДЕОКОНФЕРЕНЦИИ ========== */}
                    {(activeNav === 'video') && (
                        <Box>
                            {videoRoomsLoading ? (
                                <Box sx={{ textAlign: 'center', py: 4 }}><CircularProgress /></Box>
                            ) : videoRooms.length === 0 ? (
                                <Paper sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                                    <VideocamIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 1, color: '#6B7280' }}>Нет комнат</Typography>
                                    <Typography sx={{ color: '#9CA3AF', mb: 3 }}>
                                        Добавьте постоянные ссылки на конференции для разных платформ
                                    </Typography>
                                    <PrimaryActionButton variant="contained" startIcon={<Add />}
                                        onClick={() => { setEditingRoom(null); setVideoRoomForm({ name: '', platform: 'ZOOM', url: '' }); setVideoRoomDialogOpen(true); }}
                                        sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}>
                                        Добавить комнату
                                    </PrimaryActionButton>
                                </Paper>
                            ) : (
                                <Grid container spacing={2}>
                                    {videoRooms.map(room => {
                                        const platformInfo = VIDEO_PLATFORMS[room.platform] || { label: room.platform, color: '#6366F1', icon: '🔗' };
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={room.id}>
                                                <Box className="tool-card" sx={{ position: 'relative' }}>
                                                    <ToolCard sx={{ borderLeft: `4px solid ${platformInfo.color}` }}>
                                                        {isTutor && (
                                                            <HoverActions>
                                                                <Tooltip title="Редактировать">
                                                                    <IconButton size="small" onClick={() => { setEditingRoom(room); setVideoRoomForm({ name: room.name, platform: room.platform, url: room.url }); setVideoRoomDialogOpen(true); }}>
                                                                        <EditIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Удалить">
                                                                    <IconButton size="small" onClick={() => handleDeleteRoom(room.id)} sx={{ color: '#EF4444' }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </HoverActions>
                                                        )}
                                                        
                                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                                                                <Typography sx={{ fontSize: '28px' }}>{platformInfo.icon}</Typography>
                                                                <Box>
                                                                    <Chip label={platformInfo.label} size="small"
                                                                        sx={{ bgcolor: platformInfo.color, color: '#fff', fontWeight: 600, fontSize: '10px', height: 20 }} />
                                                                    {room.isDefault && (
                                                                        <Chip label="По умолчанию" size="small" 
                                                                            sx={{ ml: 0.5, bgcolor: '#ECFDF5', color: '#065F46', fontSize: '10px', height: 20 }} />
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 1 }}>{room.name}</Typography>
                                                            {room.url && (
                                                                <Box 
                                                                    onClick={() => window.open(room.url, '_blank')}
                                                                    sx={{ 
                                                                        p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', cursor: 'pointer',
                                                                        display: 'flex', alignItems: 'center', gap: 1,
                                                                        '&:hover': { bgcolor: '#EEF2FF' }
                                                                    }}>
                                                                    <LinkIcon sx={{ fontSize: 14, color: '#4F46E5' }} />
                                                                    <Typography sx={{ fontSize: '12px', color: '#4F46E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                        {room.url.replace(/^https?:\/\//, '').substring(0, 35)}...
                                                                    </Typography>
                                                                    <OpenInNewIcon sx={{ fontSize: 14, color: '#9CA3AF', ml: 'auto', flexShrink: 0 }} />
                                                                </Box>
                                                            )}
                                                        </CardContent>
                                                    </ToolCard>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Box>
                    )}

                    {/* ========== ДОСКИ ========== */}
                    {(activeNav === 'boards' || activeNav === 'archive') && (
                        <Box>
                            {/* Под-вкладки для досок */}
                            {activeNav === 'boards' && (
                                <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                                    <Chip 
                                        label={`Активные (${boards.length})`}
                                        onClick={() => setBoardViewMode('active')}
                                        variant={boardViewMode === 'active' ? 'filled' : 'outlined'}
                                        sx={{ 
                                            borderRadius: '10px', fontWeight: 600, px: 1,
                                            bgcolor: boardViewMode === 'active' ? '#4F46E5' : 'transparent',
                                            color: boardViewMode === 'active' ? '#fff' : '#6B7280',
                                        }}
                                    />
                                    <Chip 
                                        label={`Архив (${archivedBoards.length})`}
                                        onClick={() => setBoardViewMode('archived')}
                                        variant={boardViewMode === 'archived' ? 'filled' : 'outlined'}
                                        sx={{ 
                                            borderRadius: '10px', fontWeight: 600, px: 1,
                                            bgcolor: boardViewMode === 'archived' ? '#4F46E5' : 'transparent',
                                            color: boardViewMode === 'archived' ? '#fff' : '#6B7280',
                                        }}
                                    />
                                </Box>
                            )}

                            {displayBoards.length === 0 ? (
                                <Paper sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                                    <DrawIcon sx={{ fontSize: 56, color: '#D1D5DB', mb: 2 }} />
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 1, color: '#6B7280' }}>
                                        {boardViewMode === 'archived' ? 'Архив пуст' : 'Нет активных досок'}
                                    </Typography>
                                    {boardViewMode === 'active' && (
                                        <PrimaryActionButton variant="contained" startIcon={<Add />}
                                            onClick={() => handleOpenDialog(null)}
                                            sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}>
                                            Добавить доску
                                        </PrimaryActionButton>
                                    )}
                                </Paper>
                            ) : (
                                <Grid container spacing={2}>
                                    {displayBoards.map(board => {
                                        const isArchived = boardViewMode === 'archived';
                                        const isBuiltin = !board.url;
                                        const service = getServiceInfo(board.url);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={board.id}>
                                                <Box className="tool-card" sx={{ position: 'relative' }}>
                                                    <ToolCard sx={{ 
                                                        opacity: isArchived ? 0.7 : 1,
                                                        borderLeft: isBuiltin ? '4px solid #7C3AED' : '1px solid #F3F4F6'
                                                    }}>
                                                        <HoverActions>
                                                            {!isArchived && (
                                                                <>
                                                                    {isTutor && (
                                                                        <Tooltip title="Редактировать">
                                                                            <IconButton size="small" onClick={() => handleOpenDialog(board)}>
                                                                                <EditIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                    {isBuiltin ? (
                                                                        <Tooltip title="Открыть доску">
                                                                            <IconButton size="small" onClick={() => handleOpenWhiteboard(board)} sx={{ color: '#7C3AED' }}>
                                                                                <DrawIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    ) : (
                                                                        <Tooltip title="Открыть ссылку">
                                                                            <IconButton size="small" onClick={() => handleOpen(board.url)} sx={{ color: '#4F46E5' }}>
                                                                                <OpenInNewIcon fontSize="small" />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    )}
                                                                </>
                                                            )}
                                                        </HoverActions>
                                                        
                                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>{board.title}</Typography>
                                                                <Chip 
                                                                    icon={isBuiltin ? <DrawIcon sx={{ fontSize: 14 }} /> : <LinkIcon sx={{ fontSize: 14 }} />}
                                                                    label={isBuiltin ? 'Встроенная' : 'Ссылка'} 
                                                                    size="small"
                                                                    sx={{ 
                                                                        bgcolor: isBuiltin ? '#F5F3FF' : '#F3F4F6', 
                                                                        color: isBuiltin ? '#7C3AED' : '#6B7280', 
                                                                        borderRadius: '8px', height: 24, fontSize: '11px' 
                                                                    }} />
                                                            </Box>
                                                            
                                                            {isBuiltin ? (
                                                                <Box sx={{ p: 2.5, mb: 1.5, bgcolor: '#F5F3FF', borderRadius: '10px', textAlign: 'center' }}>
                                                                    <DrawIcon sx={{ fontSize: 36, color: '#7C3AED', mb: 1 }} />
                                                                    <Typography sx={{ fontSize: '12px', color: '#7C3AED', fontWeight: 500 }}>
                                                                        Встроенная доска EdSpace
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                <Box 
                                                                    onClick={() => handleOpen(board.url)}
                                                                    sx={{ 
                                                                        mb: 1.5, p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', 
                                                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1,
                                                                        '&:hover': { bgcolor: '#EEF2FF' }
                                                                    }}>
                                                                    <Typography sx={{ fontSize: '20px' }}>{service.icon}</Typography>
                                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                        <Typography sx={{ fontSize: '13px', fontWeight: 500 }}>{service.name}</Typography>
                                                                        <Typography sx={{ fontSize: '11px', color: '#9CA3AF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                            {board.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                                                        </Typography>
                                                                    </Box>
                                                                    <OpenInNewIcon sx={{ fontSize: 14, color: '#9CA3AF', flexShrink: 0 }} />
                                                                </Box>
                                                            )}
                                                            
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                                    {isArchived && board.archivedAt 
                                                                        ? `В архиве с ${new Date(board.archivedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long' })}` 
                                                                        : `Создана ${new Date(board.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long' })}`}
                                                                </Typography>
                                                            </Box>
                                                        </CardContent>
                                                        
                                                        {isTutor && (
                                                            isArchived ? (
                                                                <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'space-between' }}>
                                                                    <StyledButton size="small" variant="outlined" startIcon={<UnarchiveIcon />} 
                                                                        onClick={() => handleRestore(board.id)}>
                                                                        Восстановить
                                                                    </StyledButton>
                                                                    <IconButton size="small" onClick={() => handleDeleteBoard(board.id)} sx={{ color: '#EF4444' }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </CardActions>
                                                            ) : (
                                                                <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: 'flex-end' }}>
                                                                    <IconButton size="small" onClick={() => handleArchive(board.id)}>
                                                                        <ArchiveIcon fontSize="small" />
                                                                    </IconButton>
                                                                    <IconButton size="small" onClick={() => handleDeleteBoard(board.id)} sx={{ color: '#EF4444' }}>
                                                                        <DeleteIcon fontSize="small" />
                                                                    </IconButton>
                                                                </CardActions>
                                                            )
                                                        )}
                                                    </ToolCard>
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Box>
                    )}
                </Box>
            </Box>

            {/* ========== ДИАЛОГ ВИДЕО-КОМНАТЫ ========== */}
            <StyledDialog open={videoRoomDialogOpen} onClose={() => setVideoRoomDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3, pb: 1 }}>
                    {editingRoom ? 'Редактировать комнату' : 'Новая комната'}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField fullWidth label="Название" value={videoRoomForm.name} 
                            onChange={e => setVideoRoomForm({...videoRoomForm, name: e.target.value})}
                            placeholder="Например: Zoom Петя"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        <FormControl fullWidth>
                            <InputLabel>Платформа</InputLabel>
                            <Select value={videoRoomForm.platform} 
                                onChange={e => setVideoRoomForm({...videoRoomForm, platform: e.target.value})}
                                label="Платформа" sx={{ borderRadius: '12px' }}>
                                <MenuItem value="ZOOM">📹 Zoom</MenuItem>
                                <MenuItem value="TELEMOST">📺 Яндекс.Телемост</MenuItem>
                                <MenuItem value="SKYPE">💬 Skype</MenuItem>
                                <MenuItem value="JITSI">🎥 Jitsi Meet</MenuItem>
                                <MenuItem value="OTHER">🔗 Другое</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField fullWidth label="Ссылка на конференцию" value={videoRoomForm.url} 
                            onChange={e => setVideoRoomForm({...videoRoomForm, url: e.target.value})}
                            placeholder="https://zoom.us/j/..."
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        <Alert severity="info" sx={{ borderRadius: '10px', fontSize: '13px' }}>
                            💡 Добавьте несколько комнат. При старте урока вы сможете выбрать нужную.
                        </Alert>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setVideoRoomDialogOpen(false)}>Отмена</StyledButton>
                    <StyledButton onClick={handleSaveVideoRoom} variant="contained" 
                        disabled={!videoRoomForm.name || !videoRoomForm.url || videoRoomSaving}
                        sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}>
                        {videoRoomSaving ? <CircularProgress size={20} /> : editingRoom ? 'Сохранить' : 'Добавить'}
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* ========== ДИАЛОГ ДОСКИ ========== */}
            <StyledDialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, px: 3, pt: 3, pb: 1 }}>
                    {editingBoard ? 'Редактировать доску' : 'Новая доска'}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip icon={<LinkIcon />} label="Ссылка" 
                                onClick={() => setFormData({...formData, boardType: 'link'})}
                                variant={formData.boardType === 'link' ? 'filled' : 'outlined'}
                                sx={{ borderRadius: '10px', px: 1, py: 2.5, cursor: 'pointer', 
                                    bgcolor: formData.boardType === 'link' ? '#EEF2FF' : 'transparent', 
                                    color: formData.boardType === 'link' ? '#4F46E5' : '#6B7280' }} />
                            <Chip icon={<DrawIcon />} label="Встроенная доска" 
                                onClick={() => setFormData({...formData, boardType: 'builtin'})}
                                variant={formData.boardType === 'builtin' ? 'filled' : 'outlined'}
                                sx={{ borderRadius: '10px', px: 1, py: 2.5, cursor: 'pointer', 
                                    bgcolor: formData.boardType === 'builtin' ? '#F5F3FF' : 'transparent', 
                                    color: formData.boardType === 'builtin' ? '#7C3AED' : '#6B7280' }} />
                        </Box>
                        <TextField fullWidth label="Название" value={formData.title} 
                            onChange={e => setFormData({...formData, title: e.target.value})}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        {formData.boardType === 'link' && (
                            <TextField fullWidth label="Ссылка" value={formData.url} 
                                onChange={e => setFormData({...formData, url: e.target.value})}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        )}
                        <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                            Ученики ({formData.studentIds.length})
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {students.map(s => {
                                const sel = formData.studentIds.includes(s.id);
                                return <Chip key={s.id} 
                                    avatar={<Avatar sx={{ bgcolor: getAvatarColor(s.fullName), width: 24, height: 24, fontSize: 11 }}>{s.fullName[0]}</Avatar>} 
                                    label={s.fullName} onClick={() => handleToggleStudent(s.id)} 
                                    variant={sel ? 'filled' : 'outlined'}
                                    sx={{ borderRadius: '8px', cursor: 'pointer', 
                                        bgcolor: sel ? '#EEF2FF' : 'transparent', 
                                        color: sel ? '#4F46E5' : '#6B7280', fontWeight: sel ? 600 : 400 }} />;
                            })}
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenDialog(false)}>Отмена</StyledButton>
                    <StyledButton onClick={handleSave} variant="contained" 
                        disabled={!formData.title || (formData.boardType === 'link' && !formData.url) || saving}
                        sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}>
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