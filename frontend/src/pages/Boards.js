// ========== frontend/src/pages/Boards.js (ДВА ТИПА ДОСОК — ФИНАЛ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions,
    TextField, CircularProgress, Alert, Chip, IconButton, Grid,
    Tooltip, Paper, Avatar, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import WhiteboardModal from '../components/WhiteboardModal';
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
    Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== СТИЛИ ==========

const BoardCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    transition: 'all 0.2s ease',
    position: 'relative', overflow: 'hidden', backgroundColor: '#FFFFFF',
    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.08)', transform: 'translateY(-2px)' },
    '&::before': { content: '""', position: 'absolute', top: -50, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 },
    '&::after': { content: '""', position: 'absolute', bottom: -60, left: -30, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 80%)', pointerEvents: 'none', zIndex: 0 },
});

const CardContentWrapper = styled(CardContent)({ position: 'relative', zIndex: 1 });

const UrlPreview = styled(Box)({
    padding: '12px 16px', backgroundColor: '#F9FAFB', borderRadius: '8px', border: '1px solid #F3F4F6',
    display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', cursor: 'pointer',
    '&:hover': { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' },
});

// ========== SVG ДЕКОР ==========
const CardDecorTopRight = () => (
    <Box sx={{ position: 'absolute', top: 10, right: 14, opacity: 0.12, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="44" height="44"><rect x="0" y="0" width="18" height="18" rx="4" fill="#4F46E5" transform="rotate(12 9 9)"/><circle cx="30" cy="14" r="7" fill="#7C3AED"/><rect x="22" y="28" width="14" height="5" rx="2.5" fill="#A78BFA" transform="rotate(-8 29 30.5)"/></svg>
    </Box>
);
const CardDecorBottomLeft = () => (
    <Box sx={{ position: 'absolute', bottom: 14, left: 10, opacity: 0.08, pointerEvents: 'none', zIndex: 0 }}>
        <svg width="52" height="32"><circle cx="10" cy="16" r="9" fill="#4F46E5"/><circle cx="30" cy="11" r="6" fill="#7C3AED"/><circle cx="44" cy="20" r="7" fill="#A78BFA"/></svg>
    </Box>
);

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

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Boards() {
    const { user } = useAuth();
    const isTutor = user?.role === 'TUTOR' || user?.role === 'ROLE_TUTOR' || user?.role === 'tutor';
    const [boards, setBoards] = useState([]);
    const [archivedBoards, setArchivedBoards] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('active');

    const [openDialog, setOpenDialog] = useState(false);
    const [editingBoard, setEditingBoard] = useState(null);
    const [formData, setFormData] = useState({ title: '', url: '', studentIds: [], boardType: 'link' });
    const [saving, setSaving] = useState(false);
    const [whiteboardOpen, setWhiteboardOpen] = useState(false);
    const [whiteboardData, setWhiteboardData] = useState({ roomName: '', boardId: null });

    useEffect(() => { loadBoards(); if (isTutor) { loadStudents(); loadArchivedBoards(); } }, []);
    useEffect(() => { if (viewMode === 'archived' && isTutor) loadArchivedBoards(); }, [viewMode]);

    const loadBoards = async () => {
        setLoading(true);
        try { setBoards((await axiosInstance.get(isTutor ? '/boards/tutor' : '/boards/student')).data || []); } catch (err) { setError('Ошибка загрузки'); } finally { setLoading(false); }
    };
    const loadArchivedBoards = async () => {
        try { setArchivedBoards((await axiosInstance.get('/boards/tutor/archived')).data || []); } catch (err) {}
    };
    const loadStudents = async () => {
        try { setStudents((await axiosInstance.get(`/students/tutor/${user.id}`)).data || []); } catch (err) {}
    };

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
    const handleOpenWhiteboard = (board) => { setWhiteboardData({ roomName: board.roomName, boardId: board.id }); setWhiteboardOpen(true); };

    const displayBoards = viewMode === 'active' ? boards : archivedBoards;

    if (loading) return <PageContainer><Box sx={{ display: 'flex', justifyContent: 'center', minHeight: '60vh', alignItems: 'center' }}><CircularProgress sx={{ color: '#4F46E5' }} /></Box></PageContainer>;

    return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>Онлайн-доски</Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>{isTutor ? 'Ссылки и встроенные доски для совместной работы' : 'Доски от репетитора'}</Typography>
                </Box>
                {isTutor && <StyledButton variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null)} sx={{ bgcolor: '#4F46E5' }}>Добавить доску</StyledButton>}
            </Box>

            {isTutor && (
                <Box sx={{ mb: 3 }}>
                    <ViewToggle>
                        <ViewToggleBtn active={viewMode === 'active'} onClick={() => setViewMode('active')}>Активные ({boards.length})</ViewToggleBtn>
                        <ViewToggleBtn active={viewMode === 'archived'} onClick={() => setViewMode('archived')}>Архив ({archivedBoards.length})</ViewToggleBtn>
                    </ViewToggle>
                </Box>
            )}

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }} onClose={() => setError(null)}>{error}</Alert>}

            {displayBoards.length === 0 ? (
                <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', p: 6, textAlign: 'center' }}>
                    <EmptyStateIcon><DrawIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                    <Typography sx={{ fontSize: '18px', fontWeight: 600, mb: 1 }}>{viewMode === 'archived' ? 'Архив пуст' : 'Нет активных досок'}</Typography>
                    {isTutor && viewMode === 'active' && <StyledButton variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog(null)} sx={{ mt: 2, bgcolor: '#4F46E5' }}>Добавить доску</StyledButton>}
                </Paper>
            ) : (
                <Grid container spacing={2.5}>
                    {displayBoards.map(board => {
                        const isArchived = viewMode === 'archived';
                        const isBuiltin = !board.url;
                        const studentCount = board.studentCount || (board.studentName ? 1 : 0);
                        const service = getServiceInfo(board.url);
                        return (
                            <Grid item xs={12} sm={6} md={4} key={board.id}>
                                <BoardCard sx={{ ...(isArchived ? { opacity: 0.7 } : {}), borderLeft: isBuiltin ? '4px solid #7C3AED' : '1px solid #F3F4F6' }}>
                                    <CardDecorTopRight /><CardDecorBottomLeft />
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
                                                <UrlPreview onClick={() => handleOpen(board.url)}><LinkIcon sx={{ fontSize: 16, color: '#4F46E5' }} /><Typography sx={{ fontSize: '13px', color: '#4F46E5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{board.url?.replace(/^https?:\/\//, '').replace(/\/$/, '')}</Typography><OpenInNewIcon sx={{ fontSize: 14, color: '#9CA3AF', ml: 'auto' }} /></UrlPreview>
                                            </>
                                        )}
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                                                {isArchived && board.archivedAt ? `Архив: ${new Date(board.archivedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}` : `Создана: ${new Date(board.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`}
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

            {/* Диалог создания/редактирования */}
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
                        {formData.boardType === 'builtin' && (
                            <Alert severity="success" sx={{ borderRadius: '8px', fontSize: '13px', mb: 2 }}>🎨 Совместное рисование в реальном времени.</Alert>
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

            <WhiteboardModal open={whiteboardOpen} onClose={() => setWhiteboardOpen(false)} roomName={whiteboardData.roomName} boardId={whiteboardData.boardId} username={user?.fullName || 'Репетитор'} />
        </PageContainer>
    );
}

export default Boards;