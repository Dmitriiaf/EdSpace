// ========== frontend/src/pages/Materials.js (v7 — В СТИЛЕ БАНКА ЗАДАНИЙ) ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance from '../services/api';
import {
    Box, Typography, Paper, Grid, Card, CardContent, CardActions,
    IconButton, Tooltip, Chip, TextField, InputAdornment, Button, Avatar,
    Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
    FormControl, InputLabel, Select, MenuItem, Breadcrumbs, Link as MuiLink,
    LinearProgress, ToggleButtonGroup, ToggleButton, CircularProgress, Fab,
    Divider, Stack, ListItemIcon, ListItemText, Menu, ListItemAvatar, List, ListItem
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { PageContainer, StyledButton, StyledDialog } from '../styles/shared';
import {
    CloudUpload, Search, Refresh, Folder as FolderIcon,
    CreateNewFolder, InsertDriveFile, PictureAsPdf, Image, VideoFile,
    Delete, Edit, Download, NavigateNext, DriveFolderUpload, Home,
    ViewList, ViewModule, School, Person, Description, TableChart,
    GridView, CleaningServices, SortByAlpha, UploadFile, FolderOpen,
    OpenInNew, Close, Add, ArrowBack, Dns as StorageIcon,
    KeyboardArrowDown, CloudUpload as CloudUploadIcon, FilterList,
    Star, StarBorder, MoreVert, Send
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

// ========== ЦВЕТА ==========
const FOLDER_COLORS = ['#F59E0B', '#EF4444', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

// ========== СТИЛИ (в стиле Банка заданий) ==========

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
    width: '260px',
    minWidth: '260px',
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
    '&:hover': {
        backgroundColor: active ? alpha('#764ba2', 0.12) : '#F9FAFB',
    },
}));

const FileCard = styled(Card)({
    borderRadius: '16px',
    overflow: 'visible',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'pointer',
    backgroundColor: '#fff',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
    },
});

const FolderCard = styled(Card)(({ folderColor }) => ({
    borderRadius: '16px',
    overflow: 'visible',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    cursor: 'pointer',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    backgroundColor: '#fff',
    '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: '0 12px 24px rgba(0,0,0,0.08)',
    },
}));

const FilePreview = styled(Box)(({ bgColor }) => ({
    height: 120,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(135deg, ${bgColor}22, ${bgColor}44)`,
    position: 'relative',
}));

const HoverActions = styled(Box)({
    position: 'absolute',
    bottom: 12,
    right: 12,
    display: 'flex',
    gap: 4,
    opacity: 0,
    transform: 'translateY(10px)',
    transition: 'all 0.3s ease',
    background: 'rgba(255,255,255,0.95)',
    borderRadius: '12px',
    padding: '4px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    '.file-card:hover &': { opacity: 1, transform: 'translateY(0)' },
});

// ========== ИКОНКА ФАЙЛА ==========
const FileIconWithColor = ({ fileName, size = 48 }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const props = { sx: { fontSize: size } };
    if (ext === 'pdf') return <PictureAsPdf {...props} sx={{ color: '#EF4444', fontSize: size }} />;
    if (['jpg','jpeg','png','gif','webp','svg','bmp'].includes(ext)) return <Image {...props} sx={{ color: '#10B981', fontSize: size }} />;
    if (['mp4','avi','mov','mkv','webm'].includes(ext)) return <VideoFile {...props} sx={{ color: '#3B82F6', fontSize: size }} />;
    if (['doc','docx'].includes(ext)) return <Description {...props} sx={{ color: '#3B82F6', fontSize: size }} />;
    if (['xls','xlsx','csv'].includes(ext)) return <TableChart {...props} sx={{ color: '#10B981', fontSize: size }} />;
    return <InsertDriveFile {...props} sx={{ color: '#9CA3AF', fontSize: size }} />;
};

const getFileColor = (name) => {
    const ext = name?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '#EF4444';
    if (['jpg','jpeg','png','gif','webp'].includes(ext)) return '#10B981';
    if (['mp4','avi','mov'].includes(ext)) return '#3B82F6';
    return '#9CA3AF';
};

const formatSize = (b) => {
    if (!b) return '—';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
};

// ========== КОМПОНЕНТ ==========
function Materials() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Материалы'; }, []);

    const [materials, setMaterials] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [sortBy, setSortBy] = useState('date');
    const [activeNav, setActiveNav] = useState('all');

    const [openUpload, setOpenUpload] = useState(false);
    const [openPreview, setOpenPreview] = useState(false);
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const [assignmentType, setAssignmentType] = useState('course');
    const [formData, setFormData] = useState({ title: '', description: '', studentId: '', courseId: '' });
    const [createMenuAnchor, setCreateMenuAnchor] = useState(null);

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

    const loadAllMaterials = useCallback(async () => {
        if (!user?.id) return;
        try {
            const res = await axiosInstance.get('/materials');
            setAllMaterials(res.data.materials || []);
        } catch (err) {}
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
    const goToRoot = () => { setCurrentFolder(null); setFolderPath([]); loadContent(); setActiveNav('all'); };

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

    const showSnackbar = (m, s) => setSnackbar({ open: true, message: m, severity: s });

    // ========== ФИЛЬТРАЦИЯ ==========
    let filteredMaterials = materials;
    let filteredFolders = folders;

    if (activeNav === 'files') filteredFolders = [];
    if (activeNav === 'folders') filteredMaterials = [];

    if (searchTerm) {
        filteredMaterials = filteredMaterials.filter(m =>
            (m.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (m.description || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
        filteredFolders = filteredFolders.filter(f => f.name?.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    if (sortBy === 'name') {
        filteredMaterials.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    } else if (sortBy === 'size') {
        filteredMaterials.sort((a, b) => (b.fileSize || 0) - (a.fileSize || 0));
    } else {
        filteredMaterials.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    }

    const stats = {
        files: allMaterials.length,
        folders: allFolders.length,
        totalSize: allMaterials.reduce((s, m) => s + (m.fileSize || 0), 0),
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '70vh' }}>
                <EdSpaceLoader text="Загружаем материалы..." />
            </Box>
        </PageContainer>
    );

    return (
        <PageContainer sx={{ p: '0 !important', bgcolor: '#F9FAFB', minHeight: '100vh' }}>
            
            {/* ========== КОМПАКТНЫЙ APP BAR ========== */}
            <CompactAppBar>
                <PageTitle>
                    <FolderOpen sx={{ color: '#764ba2' }} />
                    Материалы
                </PageTitle>
                
                <SmartSearchInput
                    placeholder="Поиск по файлам и папкам..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF' }} /></InputAdornment>,
                        endAdornment: searchTerm && (
                            <InputAdornment position="end">
                                <IconButton size="small" onClick={() => setSearchTerm('')}><Close fontSize="small" /></IconButton>
                            </InputAdornment>
                        ),
                    }}
                />
                
                <ActionGroup>
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
                        PaperProps={{ sx: { borderRadius: '14px', mt: 1, minWidth: 200 } }}
                    >
                        <MenuItem onClick={() => { setCreateMenuAnchor(null); handleCreateFolder(); }}>
                            <ListItemIcon><CreateNewFolder sx={{ color: '#F59E0B' }} /></ListItemIcon>
                            <ListItemText>Новая папка</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={() => { setCreateMenuAnchor(null); fileInputRef.current?.click(); }}>
                            <ListItemIcon><CloudUpload sx={{ color: '#764ba2' }} /></ListItemIcon>
                            <ListItemText>Загрузить файл</ListItemText>
                        </MenuItem>
                    </Menu>
                    
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

            {/* ========== ОСНОВНАЯ ОБЛАСТЬ ========== */}
            <Box sx={{ display: 'flex', gap: 3, p: 3 }}>
                
                {/* ========== БОКОВАЯ ПАНЕЛЬ ========== */}
                <SideNav>
                    {/* Хлебные крошки */}
                    {folderPath.length > 0 && (
                        <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
                            <Button startIcon={<ArrowBack />} onClick={goToRoot} fullWidth
                                sx={{ borderRadius: '10px', textTransform: 'none', color: '#764ba2', fontWeight: 600 }}>
                                ← На главную
                            </Button>
                            <Breadcrumbs separator={<NavigateNext sx={{ fontSize: 12 }} />} sx={{ mt: 1, '& .MuiBreadcrumbs-li': { fontSize: '12px' } }}>
                                <MuiLink component="button" onClick={goToRoot} underline="hover" sx={{ fontSize: '12px', color: '#9CA3AF' }}>Главная</MuiLink>
                                {folderPath.map((f, i) => (
                                    <Typography key={f.id} sx={{ fontSize: '12px', color: i === folderPath.length - 1 ? '#1F2937' : '#9CA3AF', fontWeight: i === folderPath.length - 1 ? 600 : 400 }}>
                                        {f.name}
                                    </Typography>
                                ))}
                            </Breadcrumbs>
                        </Box>
                    )}

                    <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                            Разделы
                        </Typography>
                        <Stack spacing={0.5}>
                            <NavItem active={activeNav === 'all'} onClick={() => { setActiveNav('all'); goToRoot(); }}>
                                <FolderOpen fontSize="small" />
                                Все материалы
                                <Chip label={allMaterials.length + allFolders.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                            </NavItem>
                            <NavItem active={activeNav === 'folders'} onClick={() => setActiveNav('folders')}>
                                <FolderIcon fontSize="small" />
                                Папки
                                <Chip label={allFolders.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                            </NavItem>
                            <NavItem active={activeNav === 'files'} onClick={() => setActiveNav('files')}>
                                <InsertDriveFile fontSize="small" />
                                Файлы
                                <Chip label={allMaterials.length} size="small" sx={{ ml: 'auto', fontSize: '11px', height: 20 }} />
                            </NavItem>
                        </Stack>
                    </Box>

                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1.5 }}>
                            Сортировка
                        </Typography>
                        <FormControl size="small" fullWidth>
                            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} sx={{ borderRadius: '10px', bgcolor: '#fff' }}>
                                <MenuItem value="date">📅 По дате</MenuItem>
                                <MenuItem value="name">🔤 По имени</MenuItem>
                                <MenuItem value="size">📏 По размеру</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    <Divider />
                    
                    <Box sx={{ p: 2 }}>
                        <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.5px', mb: 1 }}>
                            Статистика
                        </Typography>
                        {[
                            { label: 'Файлов', value: stats.files, icon: '📄' },
                            { label: 'Папок', value: stats.folders, icon: '📁' },
                            { label: 'Объём', value: formatSize(stats.totalSize), icon: '💾' },
                        ].map((s, i) => (
                            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
                                <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{s.icon} {s.label}</Typography>
                                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1F2937' }}>{s.value}</Typography>
                            </Box>
                        ))}
                    </Box>
                </SideNav>

                {/* ========== КОНТЕНТ ========== */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    
                    {/* Зона загрузки */}
                    <Paper
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ 
                            mb: 3, p: 2.5, textAlign: 'center', cursor: 'pointer', 
                            borderRadius: '14px', border: '2px dashed #E5E7EB', 
                            bgcolor: '#F9FAFB', transition: 'all 0.2s',
                            '&:hover': { borderColor: '#764ba2', bgcolor: alpha('#764ba2', 0.02) }
                        }}>
                        <CloudUploadIcon sx={{ fontSize: 32, color: '#764ba2', mb: 0.5 }} />
                        <Typography sx={{ fontWeight: 500, color: '#374151', fontSize: '14px' }}>
                            📎 Перетащите файлы сюда или нажмите для загрузки
                        </Typography>
                        <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                            PDF, Word, изображения, видео — до 50 МБ
                        </Typography>
                    </Paper>

                    {/* Пустое состояние */}
                    {filteredFolders.length === 0 && filteredMaterials.length === 0 && (
                        <Paper sx={{ borderRadius: '16px', p: 6, textAlign: 'center', border: '1px solid #F3F4F6' }}>
                            <FolderOpen sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#6B7280' }}>Пусто</Typography>
                            <Typography sx={{ color: '#9CA3AF', mb: 3 }}>Загрузите первый файл или создайте папку</Typography>
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                                <PrimaryActionButton variant="contained" startIcon={<CloudUpload />} onClick={() => fileInputRef.current?.click()}
                                    sx={{ bgcolor: '#764ba2', '&:hover': { bgcolor: '#5a3782' } }}>Загрузить</PrimaryActionButton>
                                <PrimaryActionButton variant="outlined" startIcon={<CreateNewFolder />} onClick={handleCreateFolder}
                                    sx={{ borderColor: '#D1D5DB', color: '#374151' }}>Папка</PrimaryActionButton>
                            </Box>
                        </Paper>
                    )}

                    {/* Сетка */}
                    {viewMode === 'grid' && (
                        <Grid container spacing={2}>
                            {filteredFolders.map((f, idx) => (
                                <Grid item xs={6} sm={4} md={3} key={f.id}>
                                    <FolderCard folderColor={FOLDER_COLORS[idx % FOLDER_COLORS.length]} onClick={() => enterFolder(f)}>
                                        <Box sx={{ height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${FOLDER_COLORS[idx % FOLDER_COLORS.length]}22, ${FOLDER_COLORS[idx % FOLDER_COLORS.length]}44)` }}>
                                            <FolderIcon sx={{ fontSize: 48, color: FOLDER_COLORS[idx % FOLDER_COLORS.length] }} />
                                        </Box>
                                        <CardContent sx={{ p: 2, pb: 1 }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '14px' }} noWrap>{f.name}</Typography>
                                        </CardContent>
                                        <CardActions sx={{ justifyContent: 'flex-end', px: 1.5, py: 0.5 }}>
                                            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(f.id, true); }}><Delete fontSize="small" sx={{ color: '#EF4444' }} /></IconButton>
                                        </CardActions>
                                    </FolderCard>
                                </Grid>
                            ))}
                            {filteredMaterials.map(m => {
                                const color = getFileColor(m.fileName);
                                return (
                                    <Grid item xs={6} sm={4} md={3} key={m.id}>
                                        <Box className="file-card" sx={{ position: 'relative' }}>
                                            <FileCard onClick={() => { setPreviewMaterial(m); setOpenPreview(true); }}>
                                                <FilePreview bgColor={color}>
                                                    <FileIconWithColor fileName={m.fileName} size={48} />
                                                    <HoverActions>
                                                        <Tooltip title="Скачать"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(m); }}><Download fontSize="small" /></IconButton></Tooltip>
                                                        <Tooltip title="Удалить"><IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                    </HoverActions>
                                                </FilePreview>
                                                <CardContent sx={{ p: 2 }}>
                                                    <Typography sx={{ fontWeight: 600, fontSize: '13px', mb: 0.5 }} noWrap>{m.title}</Typography>
                                                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                        <Chip label={formatSize(m.fileSize)} size="small" sx={{ fontSize: '10px', height: 20, borderRadius: '6px', bgcolor: '#F3F4F6' }} />
                                                        <Chip label={m.fileName?.split('.').pop()?.toUpperCase()} size="small" sx={{ fontSize: '10px', height: 20, borderRadius: '6px', bgcolor: '#F3F4F6' }} />
                                                    </Box>
                                                    {(m.student || m.course) && (
                                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 1, alignItems: 'center' }}>
                                                            {m.student && <Avatar sx={{ width: 20, height: 20, fontSize: 10 }}>{m.student.fullName?.[0]}</Avatar>}
                                                            {m.course && <Chip label={m.course.name} size="small" sx={{ fontSize: '10px', height: 18 }} />}
                                                        </Box>
                                                    )}
                                                </CardContent>
                                            </FileCard>
                                        </Box>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}

                    {/* Список */}
                    {viewMode === 'list' && (
                        <Paper sx={{ borderRadius: '14px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                            {filteredFolders.map(f => (
                                <Box key={f.id} sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}
                                    onClick={() => enterFolder(f)}>
                                    <FolderIcon sx={{ color: '#F59E0B', fontSize: 28, mr: 2 }} />
                                    <Typography sx={{ flex: 1, fontWeight: 500 }}>{f.name}</Typography>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(f.id, true); }}><Delete fontSize="small" sx={{ color: '#EF4444' }} /></IconButton>
                                </Box>
                            ))}
                            {filteredMaterials.map(m => (
                                <Box key={m.id} sx={{ display: 'flex', alignItems: 'center', p: 2, borderBottom: '1px solid #F3F4F6', cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB' } }}
                                    onClick={() => { setPreviewMaterial(m); setOpenPreview(true); }}>
                                    <FileIconWithColor fileName={m.fileName} size={28} />
                                    <Box sx={{ flex: 1, ml: 2 }}>
                                        <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>{m.title}</Typography>
                                        <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{formatSize(m.fileSize)}</Typography>
                                    </Box>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDownload(m); }}><Download fontSize="small" /></IconButton>
                                    <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(m.id); }}><Delete fontSize="small" sx={{ color: '#EF4444' }} /></IconButton>
                                </Box>
                            ))}
                        </Paper>
                    )}
                </Box>
            </Box>

            <input type="file" ref={fileInputRef} hidden onChange={(e) => {
                const f = e.target.files[0];
                if (f) {
                    setSelectedFile(f);
                    setFormData({ title: f.name.replace(/\.[^/.]+$/, ''), description: '', studentId: '', courseId: '' });
                    setOpenUpload(true);
                }
            }} />

            {/* Диалог загрузки */}
            <StyledDialog open={openUpload} onClose={() => setOpenUpload(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>📤 Загрузить файл</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        {selectedFile && (
                            <Paper sx={{ p: 2, borderRadius: '12px', bgcolor: '#F9FAFB', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FileIconWithColor fileName={selectedFile.name} size={40} />
                                <Box><Typography sx={{ fontWeight: 600 }}>{selectedFile.name}</Typography><Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{formatSize(selectedFile.size)}</Typography></Box>
                            </Paper>
                        )}
                        <TextField fullWidth label="Название" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        <TextField fullWidth label="Описание" multiline rows={2} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px' } }} />
                        <FormControl fullWidth><InputLabel>Кому доступен</InputLabel>
                            <Select value={formData.studentId || formData.courseId ? (formData.studentId ? 'student' : 'course') : ''} onChange={(e) => {
                                if (e.target.value === 'course') setFormData({...formData, courseId: courses[0]?.id || '', studentId: ''});
                                else setFormData({...formData, studentId: students[0]?.id || '', courseId: ''});
                            }} sx={{ borderRadius: '12px' }}>
                                <MenuItem value="course">📚 Курсу</MenuItem>
                                <MenuItem value="student">👤 Ученику</MenuItem>
                            </Select>
                        </FormControl>
                        {formData.courseId && (
                            <FormControl fullWidth><InputLabel>Курс</InputLabel>
                                <Select value={formData.courseId} onChange={(e) => setFormData({...formData, courseId: e.target.value})} sx={{ borderRadius: '12px' }}>
                                    {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        {formData.studentId && (
                            <FormControl fullWidth><InputLabel>Ученик</InputLabel>
                                <Select value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} sx={{ borderRadius: '12px' }}>
                                    {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                                </Select>
                            </FormControl>
                        )}
                        {uploading && <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, height: 6 }} />}
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <Button onClick={() => setOpenUpload(false)}>Отмена</Button>
                    <Button variant="contained" onClick={handleUpload} disabled={!selectedFile || uploading}
                        sx={{ bgcolor: '#764ba2', borderRadius: '10px', '&:hover': { bgcolor: '#5a3782' } }}>Загрузить</Button>
                </DialogActions>
            </StyledDialog>

            {/* Диалог предпросмотра */}
            <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="sm" fullWidth>
                {previewMaterial && (<>
                    <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <FileIconWithColor fileName={previewMaterial.fileName} size={32} />
                        <Box><Typography sx={{ fontWeight: 700 }}>{previewMaterial.title}</Typography><Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{formatSize(previewMaterial.fileSize)}</Typography></Box>
                    </DialogTitle>
                    <DialogContent>
                        <Box sx={{ bgcolor: '#F9FAFB', borderRadius: '16px', p: 4, textAlign: 'center', mb: 2 }}>
                            <FileIconWithColor fileName={previewMaterial.fileName} size={80} />
                        </Box>
                        {previewMaterial.description && <Typography sx={{ mb: 2, color: '#6B7280' }}>{previewMaterial.description}</Typography>}
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <Button startIcon={<Download />} variant="contained" onClick={() => { handleDownload(previewMaterial); setOpenPreview(false); }}
                            sx={{ bgcolor: '#764ba2', borderRadius: '10px' }}>Скачать</Button>
                        <Button onClick={() => setOpenPreview(false)}>Закрыть</Button>
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