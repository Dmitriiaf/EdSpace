// ========== frontend/src/pages/Materials.js (v6 — БЫСТРЫЕ ПРАВКИ) ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance from '../services/api';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActions,
    IconButton, Tooltip, Chip, TextField, InputAdornment, Button, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
    FormControl, InputLabel, Select, MenuItem, Breadcrumbs, Link as MuiLink,
    LinearProgress, ToggleButtonGroup, ToggleButton, CircularProgress, Fab,
    Divider
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { PageContainer, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import {
    CloudUpload, Search, Refresh, Folder as FolderIcon,
    CreateNewFolder, InsertDriveFile, PictureAsPdf, Image, VideoFile, AudioFile,
    Delete, Edit, Download, NavigateNext, DriveFolderUpload, Home,
    ViewList, ViewModule, School, Person, Description, TableChart,
    GridView, CleaningServices, SortByAlpha, UploadFile, FolderOpen,
    OpenInNew, Close, Add, ArrowBack, Dns as StorageIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== ЦВЕТА ==========
const FOLDER_COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

// ========== СТИЛИ ==========
const GradientHero = styled(Box)({
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px', padding: '28px 32px', color: '#fff',
    marginBottom: '24px', position: 'relative', overflow: 'hidden',
    '&::before': { content: '""', position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' },
    '&::after': { content: '""', position: 'absolute', bottom: -80, left: -30, width: 250, height: 250, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' },
});

const GlassStat = styled(Paper)({
    background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)',
    borderRadius: '16px', padding: '16px 20px', textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    transition: 'all 0.3s ease',
    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' },
});

const FileCard = styled(Card)({
    borderRadius: '18px', overflow: 'hidden', border: '1px solid #F3F4F6',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'grab',
    '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 16px 40px rgba(0,0,0,0.1)', '& .file-actions': { opacity: 1, transform: 'translateY(0)' } },
    '&:active': { cursor: 'grabbing', opacity: 0.7 },
});

const FolderCardNew = styled(Card)(({ folderColor, isDragOver }) => ({
    borderRadius: '18px', overflow: 'hidden', border: `2px solid ${isDragOver ? '#764ba2' : '#F3F4F6'}`,
    boxShadow: isDragOver ? '0 0 0 4px rgba(118,75,162,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
    cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isDragOver ? 'scale(1.03)' : 'scale(1)',
    '&:hover': { transform: 'translateY(-6px) scale(1.02)', boxShadow: '0 16px 40px rgba(0,0,0,0.12)' },
}));

const FilePreview = styled(Box)(({ bgColor }) => ({
    height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: `linear-gradient(135deg, ${bgColor}22, ${bgColor}44)`, position: 'relative',
}));

const FloatingActions = styled(Box)({
    position: 'absolute', bottom: 12, right: 12, display: 'flex', gap: 4,
    opacity: 0, transform: 'translateY(10px)', transition: 'all 0.3s ease',
    background: 'rgba(255,255,255,0.95)', borderRadius: '12px', padding: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
});

const DragOverlay = styled(Box)({
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(118,75,162,0.08)', zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    pointerEvents: 'none',
});

const AssignmentToggle = styled(ToggleButtonGroup)({
    backgroundColor: '#F9FAFB', borderRadius: '12px', padding: '4px',
    '& .MuiToggleButton-root': {
        borderRadius: '10px', border: 'none', textTransform: 'none',
        px: 2, py: 1, fontSize: '13px', fontWeight: 500,
        '&.Mui-selected': { backgroundColor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', color: '#764ba2' },
    },
});

const QuickAssignFab = styled(Fab)({
    position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff', boxShadow: '0 8px 25px rgba(118,75,162,0.4)',
    '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a3f8f 100%)' },
});

// ========== ИКОНКА ФАЙЛА ==========
const FileIconWithColor = ({ fileName, size = 48 }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const props = { sx: { fontSize: size } };
    if (ext === 'pdf') return <PictureAsPdf {...props} sx={{ color: '#EF4444', fontSize: size }} />;
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return <Image {...props} sx={{ color: '#10B981', fontSize: size }} />;
    if (['mp4','avi','mov','mkv','webm'].includes(ext)) return <VideoFile {...props} sx={{ color: '#3B82F6', fontSize: size }} />;
    if (['mp3','wav','ogg','flac'].includes(ext)) return <AudioFile {...props} sx={{ color: '#F59E0B', fontSize: size }} />;
    if (['doc','docx'].includes(ext)) return <Description {...props} sx={{ color: '#3B82F6', fontSize: size }} />;
    if (['xls','xlsx','csv'].includes(ext)) return <TableChart {...props} sx={{ color: '#10B981', fontSize: size }} />;
    return <InsertDriveFile {...props} sx={{ color: '#9CA3AF', fontSize: size }} />;
};

const getFileColor = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '#EF4444';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '#10B981';
    if (['mp4','avi','mov'].includes(ext)) return '#3B82F6';
    if (['mp3','wav'].includes(ext)) return '#F59E0B';
    return '#9CA3AF';
};

// ========== КОМПОНЕНТ ==========
function Materials() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Материалы'; }, []);

    const [materials, setMaterials] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [sortBy, setSortBy] = useState('date');

    const [draggedFile, setDraggedFile] = useState(null);
    const [dragOverFolder, setDragOverFolder] = useState(null);
    const [isDragOverUpload, setIsDragOverUpload] = useState(false);

    const [openUpload, setOpenUpload] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [assignmentType, setAssignmentType] = useState('course');
    const [formData, setFormData] = useState({ title: '', description: '', studentId: '', courseId: '' });

    const fileInputRef = useRef(null);

    // ========== ЗАГРУЗКА ==========
    const loadContent = useCallback(async (folderId = null) => {
        if (!user?.id) return;
        try {
            const url = folderId ? `/materials/folder/${folderId}` : '/materials';
            const res = await axiosInstance.get(url);
            setMaterials(res.data.materials || []);
            setFolders(res.data.folders || []);
            const foldersRes = await axiosInstance.get('/materials/folders');
            setAllFolders(foldersRes.data || []);
        } catch (err) { showSnackbar('Ошибка загрузки', 'error'); }
    }, [user]);

    const [allMaterials, setAllMaterials] = useState([]);
    const loadAllMaterials = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await axiosInstance.get('/materials');
            setAllMaterials(res.data.materials || []);
        } catch (err) { /* тихо */ }
    }, [user]);

    useEffect(() => {
        if (!user?.id) return;
        Promise.all([
            loadContent(),
            loadAllMaterials(),
            axiosInstance.get(`/students/tutor/${user.id}`),
            axiosInstance.get(`/courses/tutor/${user.id}`)
        ]).then(([, , sRes, cRes]) => {
            setStudents(sRes.data || []);
            setCourses(cRes.data || []);
        }).catch(console.error).finally(() => setLoading(false));
    }, [user]);

    // ========== НАВИГАЦИЯ ==========
    const enterFolder = (f) => { setCurrentFolder(f.id); setFolderPath([...folderPath, f]); loadContent(f.id); };
    const goToRoot = () => { setCurrentFolder(null); setFolderPath([]); loadContent(); };

    // ========== DRAG & DROP ==========
    const handleFileDragStart = (e, material) => {
        setDraggedFile(material);
        e.dataTransfer.effectAllowed = 'move';
        e.currentTarget.style.opacity = '0.4';
    };
    const handleFileDragEnd = (e) => {
        setDraggedFile(null); setDragOverFolder(null);
        e.currentTarget.style.opacity = '1';
    };
    const handleFolderDragOver = (e, folder) => {
        e.preventDefault(); e.stopPropagation();
        if (draggedFile) { setDragOverFolder(folder.id); e.dataTransfer.dropEffect = 'move'; }
    };
    const handleFolderDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setDragOverFolder(null); };
    const handleFolderDrop = async (e, targetFolder) => {
        e.preventDefault(); e.stopPropagation(); setDragOverFolder(null);
        if (!draggedFile) return;
        try {
            await axiosInstance.put(`/materials/${draggedFile.id}/move`, { folderId: targetFolder.id });
            showSnackbar(`📁 Перемещено в «${targetFolder.name}»`, 'success');
            setDraggedFile(null); loadContent(currentFolder); loadAllMaterials();
        } catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка перемещения', 'error'); }
    };

    // ========== ЗАГРУЗКА ==========
    const openUploadDialog = (file) => {
        if (file.size > 50 * 1024 * 1024) { showSnackbar('Файл больше 50 МБ', 'error'); return; }
        setSelectedFile(file);
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, ''), courseId: '', studentId: '' }));
        setOpenUpload(true);
    };
    const handleUploadDrop = (e) => {
        e.preventDefault(); setIsDragOverUpload(false);
        const file = e.dataTransfer.files[0];
        if (file) openUploadDialog(file);
    };
    const handleUpload = async () => {
        if (!selectedFile) return;
        setUploading(true);
        const fd = new FormData();
        fd.append('file', selectedFile);
        fd.append('title', formData.title || selectedFile.name);
        fd.append('description', formData.description || '');
        if (formData.studentId) fd.append('studentId', formData.studentId);
        if (formData.courseId) fd.append('courseId', formData.courseId);
        fd.append('folderId', currentFolder || '');
        try {
            const interval = setInterval(() => setUploadProgress(p => Math.min(p + 20, 90)), 250);
            await axiosInstance.post('/materials/upload', fd);
            clearInterval(interval); setUploadProgress(100);
            showSnackbar('✅ Файл загружен!', 'success');
            setTimeout(() => { setOpenUpload(false); setSelectedFile(null); setUploadProgress(0); loadContent(currentFolder); loadAllMaterials(); }, 500);
        } catch (err) { showSnackbar('Ошибка', 'error'); }
        finally { setUploading(false); }
    };

    // ========== ДЕЙСТВИЯ ==========
    const handleDelete = async (id, isFolder = false) => {
        if (!window.confirm(isFolder ? 'Удалить папку и всё внутри?' : 'Удалить файл?')) return;
        try {
            await axiosInstance.delete(isFolder ? `/materials/folder/${id}` : `/materials/${id}`);
            showSnackbar('Удалено', 'success'); loadContent(currentFolder); loadAllMaterials();
        } catch (err) { showSnackbar('Ошибка', 'error'); }
    };
    const handleDownload = async (m) => {
        try {
            const res = await axiosInstance.get(`/materials/download/${m.id}`, { responseType: 'blob' });
            const url = URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a'); a.href = url; a.download = m.fileName; a.click();
            URL.revokeObjectURL(url);
        } catch (err) { showSnackbar('Ошибка скачивания', 'error'); }
    };
    const handleCreateFolder = async () => {
        const name = window.prompt('Название папки:');
        if (!name) return;
        try {
            await axiosInstance.post('/materials/folder', { name, parentFolderId: currentFolder });
            showSnackbar('Папка создана', 'success'); loadContent(currentFolder);
        } catch (err) { showSnackbar('Ошибка', 'error'); }
    };
    const handleRename = async (folder) => {
        const name = window.prompt('Новое название:', folder.name);
        if (!name) return;
        try {
            await axiosInstance.put(`/materials/folder/${folder.id}`, { name });
            showSnackbar('Переименовано', 'success'); loadContent(currentFolder);
        } catch (err) { showSnackbar('Ошибка', 'error'); }
    };

    const showSnackbar = (m, s) => setSnackbar({ open: true, message: m, severity: s });
    const formatSize = (b) => {
        if (!b) return '—';
        if (b < 1024) return `${b} B`;
        if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
        return `${(b / 1048576).toFixed(1)} MB`;
    };
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('ru-RU') : '';

    // ========== ФИЛЬТРАЦИЯ ==========
    let filteredMaterials = materials.filter(m =>
        m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    let filteredFolders = folders.filter(f => f.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    if (sortBy === 'name') {
        filteredMaterials.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'size') {
        filteredMaterials.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
    } else {
        filteredMaterials.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    const stats = {
        files: allMaterials.length,
        folders: allFolders.length,
        totalSize: allMaterials.reduce((s, m) => s + (m.fileSize || 0), 0),
        recentUploads: allMaterials.filter(m => (new Date() - new Date(m.createdAt)) < 7 * 24 * 3600 * 1000).length,
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <EdSpaceLoader text="Загружаем материалы..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer>
            {draggedFile && (
                <DragOverlay>
                    <Paper sx={{ p: 3, borderRadius: '20px', bgcolor: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', textAlign: 'center' }}>
                        <DriveFolderUpload sx={{ fontSize: 48, color: '#764ba2', mb: 1 }} />
                        <Typography sx={{ fontWeight: 600 }}>Перетащите в папку</Typography>
                        <Typography sx={{ color: '#6B7280', fontSize: '14px' }}>{draggedFile.title}</Typography>
                    </Paper>
                </DragOverlay>
            )}

            <GradientHero>
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 3, mb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            {currentFolder && (
                                <StyledButton variant="contained" startIcon={<ArrowBack />} onClick={goToRoot}
                                    sx={{ bgcolor: '#fff', color: '#764ba2', fontWeight: 600, borderRadius: '12px', px: 2.5, py: 1, '&:hover': { bgcolor: '#F3F4F6' } }}>
                                    Главная
                                </StyledButton>
                            )}
                            <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <FolderOpen sx={{ fontSize: 28 }} />
                                    <Typography sx={{ fontSize: '28px', fontWeight: 700 }}>
                                        {currentFolder ? folderPath[folderPath.length - 1]?.name : 'Материалы'}
                                    </Typography>
                                </Box>
                                {folderPath.length > 0 && (
                                    <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />} sx={{ mt: 0.5 }}>
                                        <MuiLink component="button" onClick={goToRoot} underline="hover" sx={{ color: '#fff', opacity: 0.7, fontSize: '13px' }}>Главная</MuiLink>
                                        {folderPath.map((f, i) => (
                                            <MuiLink key={f.id} component="button" onClick={() => { setFolderPath(folderPath.slice(0, i + 1)); setCurrentFolder(f.id); loadContent(f.id); }} underline="hover"
                                                sx={{ color: '#fff', fontWeight: i === folderPath.length - 1 ? 600 : 400, fontSize: '13px', opacity: i === folderPath.length - 1 ? 1 : 0.7 }}>{f.name}</MuiLink>
                                        ))}
                                    </Breadcrumbs>
                                )}
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1.5 }}>
                            <StyledButton variant="outlined" startIcon={<CreateNewFolder />} onClick={handleCreateFolder}
                                sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.4)', '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' } }}>Папка</StyledButton>
                            <StyledButton variant="contained" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()}
                                sx={{ bgcolor: '#fff', color: '#764ba2', fontWeight: 600, '&:hover': { bgcolor: '#F3F4F6' } }}>Загрузить</StyledButton>
                            <input type="file" ref={fileInputRef} hidden onChange={(e) => { const f = e.target.files[0]; if (f) openUploadDialog(f); }} />
                        </Box>
                    </Box>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        {[
                            { label: 'Всего файлов', value: stats.files, icon: <Description /> },
                            { label: 'Папок', value: stats.folders, icon: <FolderIcon /> },
                            { label: 'Общий размер', value: formatSize(stats.totalSize), icon: <StorageIcon />, highlight: stats.totalSize > 0 },
                            { label: 'За неделю', value: stats.recentUploads, icon: <UploadFile /> },
                        ].map((s, i) => (
                            <Grid item xs={6} md={3} key={i}>
                                <GlassStat elevation={0}>
                                    <Box sx={{ color: s.highlight ? '#10B981' : '#764ba2', mb: 0.5 }}>{s.icon}</Box>
                                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{s.value}</Typography>
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>{s.label}</Typography>
                                </GlassStat>
                            </Grid>
                        ))}
                    </Grid>
                </Box>
            </GradientHero>

            <Paper sx={{ p: 2, mb: 3, borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, border: '1px solid #F3F4F6' }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                    <TextField placeholder="Поиск..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                            endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm('')}><CleaningServices fontSize="small" /></IconButton></InputAdornment>,
                        }}
                        sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#F9FAFB' } }} />
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                        <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: '12px', bgcolor: '#F9FAFB', '& fieldset': { borderColor: 'transparent' } }}>
                            <MenuItem value="date"><SortByAlpha sx={{ mr: 1, fontSize: 18 }} />По дате</MenuItem>
                            <MenuItem value="name">По имени</MenuItem>
                            <MenuItem value="size">По размеру</MenuItem>
                        </Select>
                    </FormControl>
                    {draggedFile && <Chip label={`«${draggedFile.title}» → в папку`} color="secondary" onDelete={() => setDraggedFile(null)} sx={{ fontWeight: 500, borderRadius: '10px' }} />}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Обновить"><IconButton onClick={() => { loadContent(currentFolder); loadAllMaterials(); }}><Refresh /></IconButton></Tooltip>
                    <ViewToggle>
                        <ViewToggleBtn active={viewMode === 'grid'} onClick={() => setViewMode('grid')}><GridView sx={{ fontSize: 18 }} /></ViewToggleBtn>
                        <ViewToggleBtn active={viewMode === 'list'} onClick={() => setViewMode('list')}><ViewList sx={{ fontSize: 18 }} /></ViewToggleBtn>
                    </ViewToggle>
                </Box>
            </Paper>

            <Paper
                onDragOver={(e) => { e.preventDefault(); if (!draggedFile) setIsDragOverUpload(true); }}
                onDragLeave={() => setIsDragOverUpload(false)}
                onDrop={(e) => { if (draggedFile) return; handleUploadDrop(e); }}
                onClick={() => !draggedFile && fileInputRef.current?.click()}
                sx={{ mb: 3, p: 3, textAlign: 'center', cursor: 'pointer', borderRadius: '16px', border: `2px dashed ${isDragOverUpload ? '#764ba2' : '#E5E7EB'}`, bgcolor: isDragOverUpload ? alpha('#764ba2', 0.04) : '#F9FAFB', transition: 'all 0.3s ease', opacity: draggedFile ? 0.4 : 1, '&:hover': { borderColor: '#764ba2' } }}>
                <CloudUpload sx={{ fontSize: 40, color: '#9CA3AF', mb: 1 }} />
                <Typography sx={{ fontWeight: 500, color: '#374151' }}>{draggedFile ? 'Перетащите файл в папку ниже' : '📎 Перетащите новые файлы сюда'}</Typography>
            </Paper>

            {filteredFolders.length === 0 && filteredMaterials.length === 0 && (
                <Paper sx={{ borderRadius: '20px', p: 6, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                    <FolderOpen sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
                    <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>Пусто</Typography>
                    <Typography sx={{ color: '#6B7280', mb: 3 }}>Загрузите файл или создайте папку</Typography>
                    <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                        <StyledButton variant="contained" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()} sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#667eea' } }}>Загрузить</StyledButton>
                        <StyledButton variant="outlined" startIcon={<CreateNewFolder />} onClick={handleCreateFolder} sx={{ borderColor: '#D1D5DB' }}>Папка</StyledButton>
                    </Box>
                </Paper>
            )}

            {viewMode === 'grid' && (
                <Grid container spacing={2.5}>
                    {filteredFolders.map((f, idx) => (
                        <Grid item xs={12} sm={6} md={3} key={f.id}>
                            <FolderCardNew folderColor={FOLDER_COLORS[idx % FOLDER_COLORS.length]} isDragOver={dragOverFolder === f.id}
                                onClick={() => enterFolder(f)}
                                onDragOver={(e) => handleFolderDragOver(e, f)} onDragLeave={handleFolderDragLeave} onDrop={(e) => handleFolderDrop(e, f)}>
                                <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', background: `linear-gradient(135deg, ${FOLDER_COLORS[idx % FOLDER_COLORS.length]}22, ${FOLDER_COLORS[idx % FOLDER_COLORS.length]}44)` }}>
                                    <FolderIcon sx={{ fontSize: 48, color: FOLDER_COLORS[idx % FOLDER_COLORS.length] }} />
                                    {dragOverFolder === f.id && (
                                        <Box sx={{ position: 'absolute', inset: 0, bgcolor: alpha('#764ba2', 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Typography sx={{ fontWeight: 700, color: '#764ba2' }}>Отпустите</Typography>
                                        </Box>
                                    )}
                                </Box>
                                <CardContent sx={{ p: 2 }}><Typography sx={{ fontWeight: 600, fontSize: '15px' }} noWrap>{f.name}</Typography></CardContent>
                                <Divider />
                                <CardActions sx={{ justifyContent: 'flex-end', gap: 0.5, px: 1.5, py: 1 }}>
                                    <Tooltip title="Открыть"><IconButton size="small" onClick={(e) => { e.stopPropagation(); enterFolder(f); }}><FolderOpen fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="Переименовать"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRename(f); }}><Edit fontSize="small" /></IconButton></Tooltip>
                                    <Tooltip title="Удалить"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(f.id, true); }}><Delete fontSize="small" /></IconButton></Tooltip>
                                </CardActions>
                            </FolderCardNew>
                        </Grid>
                    ))}
                    {filteredMaterials.map(m => {
                        const color = getFileColor(m.fileName);
                        return (
                            <Grid item xs={12} sm={6} md={4} key={m.id}>
                                <FileCard fileColor={color} draggable onDragStart={(e) => handleFileDragStart(e, m)} onDragEnd={handleFileDragEnd}
                                    onClick={() => { setPreviewMaterial(m); setOpenPreview(true); }}>
                                    <FilePreview bgColor={color}>
                                        <FileIconWithColor fileName={m.fileName} size={56} />
                                        <FloatingActions className="file-actions">
                                            <Tooltip title="Скачать"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(m); }}><Download fontSize="small" /></IconButton></Tooltip>
                                            <Tooltip title="Удалить"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                                        </FloatingActions>
                                    </FilePreview>
                                    <CardContent sx={{ p: 2 }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 0.5 }} noWrap>{m.title}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                                            <Chip label={formatSize(m.fileSize)} size="small" sx={{ fontSize: '10px', height: 20, borderRadius: '6px', bgcolor: '#F3F4F6' }} />
                                            <Chip label={m.fileName?.split('.').pop()?.toUpperCase()} size="small" sx={{ fontSize: '10px', height: 20, borderRadius: '6px', bgcolor: '#F3F4F6' }} />
                                        </Box>
                                        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                                            {m.student && <Avatar sx={{ width: 24, height: 24, fontSize: 12 }}>{m.student.fullName?.[0]}</Avatar>}
                                            {m.course && <Chip label={m.course.name} size="small" icon={<School sx={{ fontSize: 12 }} />} sx={{ fontSize: '10px', height: 22, borderRadius: '6px' }} />}
                                        </Box>
                                    </CardContent>
                                </FileCard>
                            </Grid>
                        );
                    })}
                </Grid>
            )}

            {viewMode === 'list' && (
                <Paper sx={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                    {filteredFolders.map(f => (
                        <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}
                            onClick={() => enterFolder(f)} onDragOver={(e) => handleFolderDragOver(e, f)} onDragLeave={handleFolderDragLeave} onDrop={(e) => handleFolderDrop(e, f)}>
                            <FolderIcon sx={{ color: '#F59E0B', fontSize: 32, mr: 2 }} />
                            <Box sx={{ flex: 1 }}><Typography sx={{ fontWeight: 600 }}>{f.name}</Typography></Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleRename(f); }}><Edit fontSize="small" /></IconButton>
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(f.id, true); }}><Delete fontSize="small" /></IconButton>
                            </Box>
                        </Box>
                    ))}
                    {filteredMaterials.map(m => (
                        <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #F3F4F6', cursor: 'grab', '&:hover': { bgcolor: '#F9FAFB' } }}
                            draggable onDragStart={(e) => handleFileDragStart(e, m)} onDragEnd={handleFileDragEnd}
                            onClick={() => { setPreviewMaterial(m); setOpenPreview(true); }}>
                            <FileIconWithColor fileName={m.fileName} size={32} />
                            <Box sx={{ flex: 1, ml: 2 }}>
                                <Typography sx={{ fontWeight: 500 }}>{m.title}</Typography>
                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{formatSize(m.fileSize)} · {formatDate(m.createdAt)}</Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(m); }}><Download fontSize="small" /></IconButton>
                                <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}><Delete fontSize="small" /></IconButton>
                            </Box>
                        </Box>
                    ))}
                </Paper>
            )}

            <Tooltip title="Загрузить материал" placement="left">
                <QuickAssignFab onClick={() => fileInputRef.current?.click()}><Add /></QuickAssignFab>
            </Tooltip>

            <StyledDialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CloudUpload sx={{ color: '#764ba2' }} />Загрузить файл
                    {currentFolder && <Chip label={`📁 ${folderPath[folderPath.length - 1]?.name}`} size="small" sx={{ ml: 'auto', borderRadius: '8px', bgcolor: '#F5F3FF' }} />}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        {selectedFile && (
                            <Paper sx={{ p: 2, mb: 2, borderRadius: '14px', bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FileIconWithColor fileName={selectedFile.name} size={40} />
                                <Box><Typography sx={{ fontWeight: 600 }}>{selectedFile.name}</Typography><Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{formatSize(selectedFile.size)}</Typography></Box>
                            </Paper>
                        )}
                        <TextField fullWidth label="Название" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        <TextField fullWidth label="Описание" multiline rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        <Paper sx={{ p: 2.5, borderRadius: '14px', bgcolor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '14px', mb: 2 }}>👤 Кому доступен материал?</Typography>
                            <AssignmentToggle value={assignmentType} exclusive onChange={(e, val) => { if (val) { setAssignmentType(val); setFormData({ ...formData, courseId: '', studentId: '' }); } }} sx={{ mb: 2, width: '100%', justifyContent: 'center' }}>
                                <ToggleButton value="course" sx={{ flex: 1 }}><School sx={{ mr: 1, fontSize: 18 }} />Курсу</ToggleButton>
                                <ToggleButton value="student" sx={{ flex: 1 }}><Person sx={{ mr: 1, fontSize: 18 }} />Ученику</ToggleButton>
                            </AssignmentToggle>
                            {assignmentType === 'course' ? (
                                <FormControl fullWidth><InputLabel>Выберите курс</InputLabel>
                                    <Select value={formData.courseId} onChange={(e) => setFormData({ ...formData, courseId: e.target.value, studentId: '' })} label="Выберите курс" sx={{ borderRadius: '12px', bgcolor: '#fff' }}>
                                        {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            ) : (
                                <FormControl fullWidth><InputLabel>Выберите ученика</InputLabel>
                                    <Select value={formData.studentId} onChange={(e) => setFormData({ ...formData, studentId: e.target.value, courseId: '' })} label="Выберите ученика" sx={{ borderRadius: '12px', bgcolor: '#fff' }}>
                                        {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            )}
                            <Alert severity="info" sx={{ mt: 2, borderRadius: '10px', fontSize: '12px' }}>
                                {assignmentType === 'course' ? 'Материал увидят все ученики курса' : 'Материал увидит только выбранный ученик'}
                            </Alert>
                        </Paper>
                        {uploading && (
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, height: 8 }} />
                                <Typography sx={{ textAlign: 'center', mt: 1, fontSize: '13px', color: '#6B7280' }}>{uploadProgress}%</Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setOpenUpload(false)} startIcon={<Close />} sx={{ borderRadius: '10px' }}>Отмена</Button>
                    <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || !formData.title || uploading || (!formData.courseId && !formData.studentId)}
                        startIcon={<CloudUpload />} sx={{ bgcolor: '#764ba2', borderRadius: '10px', '&:hover': { bgcolor: '#667eea' } }}>{uploading ? 'Загрузка...' : 'Загрузить'}</Button>
                </DialogActions>
            </StyledDialog>

            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
                {previewMaterial && (<>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FileIconWithColor fileName={previewMaterial.fileName} size={36} />
                        <Box><Typography sx={{ fontWeight: 700 }}>{previewMaterial.title}</Typography><Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{formatSize(previewMaterial.fileSize)} · {formatDate(previewMaterial.createdAt)}</Typography></Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '16px', p: 4, textAlign: 'center', mb: 2 }}><FileIconWithColor fileName={previewMaterial.fileName} size={80} /></Box>
                        <Grid container spacing={1}>
                            {previewMaterial.course && <Grid item xs={6}><Paper sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#F5F3FF' }}><Typography sx={{ fontSize: '12px', color: '#7C3AED' }}>Курс</Typography><Typography sx={{ fontWeight: 600 }}>{previewMaterial.course.name}</Typography></Paper></Grid>}
                            {previewMaterial.student && <Grid item xs={6}><Paper sx={{ p: 1.5, borderRadius: '12px', bgcolor: '#ECFDF5' }}><Typography sx={{ fontSize: '12px', color: '#10B981' }}>Ученик</Typography><Typography sx={{ fontWeight: 600 }}>{previewMaterial.student.fullName}</Typography></Paper></Grid>}
                        </Grid>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button startIcon={<Download />} variant="contained" onClick={() => { handleDownload(previewMaterial); setOpenPreview(false); }} sx={{ bgcolor: '#764ba2', borderRadius: '10px' }}>Скачать</Button>
                        <Button onClick={() => setOpenPreview(false)} sx={{ borderRadius: '10px' }}>Закрыть</Button>
                    </DialogActions>
                </>)}
            </Dialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '12px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Materials;