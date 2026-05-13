// ========== frontend/src/pages/Materials.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect, useRef } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance from '../services/api';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, FormControl, InputLabel,
    Select, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Chip,
    Alert, Snackbar, Grid, Card, CardContent, Typography,
    Avatar, Tooltip, InputAdornment, CircularProgress,
    Tabs, Tab, Divider, LinearProgress,
    Breadcrumbs, Link as MuiLink,
    CardActions
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import {
    Add, Delete, Edit, CloudUpload, Download,
    Search, Refresh, School, Person,
    Description as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    Folder as FolderIcon,
    ViewList as ListIcon,
    ViewModule as GridIcon,
    CreateNewFolder as CreateNewFolderIcon,
    NavigateNext as NavigateNextIcon,
    DriveFolderUpload as MoveIcon,
    Book as BookIcon,
    People as PeopleIcon,
    Clear as ClearIcon,
    InsertDriveFile as InsertDriveFileIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const MaterialCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
});

const FolderCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    },
});


const FilterPaper = styled(Paper)({
    padding: '16px 20px',
    marginBottom: '20px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
});

const CourseGroupHeader = styled(Box)(({ color }) => ({
    padding: '14px 20px',
    backgroundColor: color || '#4F46E5',
    color: '#FFFFFF',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderTopLeftRadius: '12px',
    borderTopRightRadius: '12px',
}));

const StyledTableRow = styled(TableRow)({
    '&:nth-of-type(odd)': { backgroundColor: '#FFFFFF' },
    '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
    '&:hover': { backgroundColor: '#EEF2FF !important' },
});

// ========== ICON COMPONENT ==========

const FileTypeIcon = ({ fileName, size = 40 }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#EF4444', fontSize: size }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ color: '#10B981', fontSize: size }} />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <VideoIcon sx={{ color: '#3B82F6', fontSize: size }} />;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <AudioIcon sx={{ color: '#F59E0B', fontSize: size }} />;
    return <InsertDriveFileIcon sx={{ color: '#9CA3AF', fontSize: size }} />;
};

const getFileTypeFromName = (filename) => {
    if (!filename) return 'file';
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'image';
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return 'audio';
    return 'file';
};

// ========== MAIN COMPONENT ==========

function Materials() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Материалы'; }, []);
    const { getStudentRateForTutor } = useStudentRate();
    
    const [materials, setMaterials] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mainTabValue, setMainTabValue] = useState(0);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [viewMode, setViewMode] = useState('grid');
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [openDialog, setOpenDialog] = useState(false);
    const [openMoveDialog, setOpenMoveDialog] = useState(false);
    const [openEditFolderDialog, setOpenEditFolderDialog] = useState(false);
    const [movingMaterial, setMovingMaterial] = useState(null);
    const [editingFolder, setEditingFolder] = useState(null);
    const [selectedFolderId, setSelectedFolderId] = useState(null);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedFile, setSelectedFile] = useState(null);
    const [openFolderDialog, setOpenFolderDialog] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [folderCourseId, setFolderCourseId] = useState('');
    const fileInputRef = useRef(null);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        tutorId: user?.id, studentId: '', courseId: '', title: '', description: '',
        filePath: '', fileType: '', fileSize: ''
    });

    // ========== ALL FUNCTIONS PRESERVED ==========

    const loadRootContent = async () => {
        if (!user || !user.id) return;
        try {
            let url = `/materials`;
            if (mainTabValue === 0 && selectedCourseId) url += `?courseId=${selectedCourseId}`;
            const response = await axiosInstance.get(url);
            let loadedMaterials = response.data.materials || [];
            let loadedFolders = response.data.folders || [];
            if (mainTabValue === 1 && selectedStudentId) {
                loadedMaterials = loadedMaterials.filter(m => m.student && m.student.id === parseInt(selectedStudentId));
            }
            setMaterials(loadedMaterials);
            setFolders(loadedFolders);
            const foldersRes = await axiosInstance.get(`/materials/folders`);
            setAllFolders(foldersRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Не удалось загрузить материалы');
        }
    };

    const loadFolderContent = async (folderId) => {
        if (!user || !user.id) return;
        try {
            const response = await axiosInstance.get(`/materials/folder/${folderId}`);
            setMaterials(response.data.materials || []);
            setFolders(response.data.folders || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки папки:', err);
            showSnackbar('Не удалось загрузить содержимое папки', 'error');
        }
    };

    const handleFolderClick = async (folder) => {
        setCurrentFolder(folder.id);
        setFolderPath([...folderPath, folder]);
        await loadFolderContent(folder.id);
    };

    const handleRootClick = async () => {
        setCurrentFolder(null);
        setFolderPath([]);
        await loadRootContent();
    };

    const handleBreadcrumbClick = async (folder, index) => {
        const newPath = folderPath.slice(0, index + 1);
        setFolderPath(newPath);
        if (folder) { setCurrentFolder(folder.id); await loadFolderContent(folder.id); }
        else { setCurrentFolder(null); await loadRootContent(); }
    };

    useEffect(() => { if (user && user.id) { loadRootContent(); fetchStudentsAndCourses(); } }, [user]);
    useEffect(() => { if (user && user.id) { loadRootContent(); } }, [mainTabValue, selectedCourseId, selectedStudentId]);

    const fetchStudentsAndCourses = async () => {
        if (!user || !user.id) return;
        try {
            const [studentsRes, coursesRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/courses/tutor/${user.id}`)
            ]);
            setStudents(studentsRes.data || []);
            setCourses(coursesRes.data || []);
        } catch (err) { console.error('Ошибка загрузки учеников/курсов:', err); }
        finally { setLoading(false); }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (file.size > 50 * 1024 * 1024) { showSnackbar('Файл слишком большой. Максимальный размер 50MB', 'error'); return; }
        setSelectedFile(file);
        const fileName = file.name, fileSize = file.size, fileType = getFileTypeFromName(fileName);
        setFormData(prev => ({ ...prev, title: fileName.replace(/\.[^/.]+$/, ""), fileType, fileSize }));
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        if (!formData.courseId && !formData.studentId) { showSnackbar('Выберите курс или ученика', 'error'); return; }
        setUploading(true); setUploadProgress(0);
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description || '');
        if (formData.studentId) uploadFormData.append('studentId', formData.studentId);
        if (formData.courseId) uploadFormData.append('courseId', formData.courseId);
        const folderToUse = selectedFolderId || currentFolder;
        if (folderToUse) uploadFormData.append('folderId', folderToUse);
        try {
            const interval = setInterval(() => setUploadProgress(prev => Math.min(prev + 10, 90)), 200);
            await axiosInstance.post('/materials/upload', uploadFormData, { headers: { 'Content-Type': 'multipart/form-data' } });
            clearInterval(interval); setUploadProgress(100);
            showSnackbar('Файл загружен', 'success');
            setTimeout(() => { handleCloseDialog(); setSelectedFolderId(null); if (currentFolder) loadFolderContent(currentFolder); else loadRootContent(); }, 500);
        } catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка при загрузке файла', 'error'); }
        finally { setUploading(false); setUploadProgress(0); setSelectedFile(null); }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        try {
            await axiosInstance.post('/materials/folder', { name: newFolderName, parentFolderId: currentFolder, courseId: folderCourseId || selectedCourseId || null });
            showSnackbar('Папка создана', 'success');
            setOpenFolderDialog(false); setNewFolderName(''); setFolderCourseId('');
            if (currentFolder) loadFolderContent(currentFolder); else loadRootContent();
        } catch (err) { showSnackbar('Ошибка при создании папки', 'error'); }
    };

    const handleEditFolder = async () => {
        if (!editingFolder) return;
        try {
            await axiosInstance.put(`/materials/folder/${editingFolder.id}`, { name: newFolderName, courseId: folderCourseId || null });
            showSnackbar('Папка обновлена', 'success');
            setOpenEditFolderDialog(false); setEditingFolder(null); setNewFolderName(''); setFolderCourseId('');
            if (currentFolder) loadFolderContent(currentFolder); else loadRootContent();
        } catch (err) { showSnackbar('Ошибка при обновлении папки', 'error'); }
    };

    const handleOpenEditFolderDialog = (folder) => { setEditingFolder(folder); setNewFolderName(folder.name); setFolderCourseId(folder.course?.id || ''); setOpenEditFolderDialog(true); };

    const handleMoveToFolder = async () => {
        if (!movingMaterial) return;
        try {
            await axiosInstance.put(`/materials/${movingMaterial.id}/move`, { folderId: selectedFolderId });
            showSnackbar('Материал перемещён', 'success');
            setOpenMoveDialog(false); setMovingMaterial(null); setSelectedFolderId(null);
            if (currentFolder) loadFolderContent(currentFolder); else loadRootContent();
        } catch (err) { showSnackbar(err.response?.data?.error || 'Ошибка при перемещении', 'error'); }
    };

    const handleOpenMoveDialog = (material) => { setMovingMaterial(material); setSelectedFolderId(material.folder?.id || null); setOpenMoveDialog(true); };

    const handleOpenDialog = (material = null) => {
        if (material) {
            setEditingMaterial(material);
            setFormData({ tutorId: user.id, studentId: material.student?.id || '', courseId: material.course?.id || '', title: material.title, description: material.description || '', filePath: material.filePath || '', fileType: material.fileType || '', fileSize: material.fileSize || '' });
            setSelectedFile(null); setSelectedFolderId(material.folder?.id || null);
        } else {
            setEditingMaterial(null);
            setFormData({ tutorId: user.id, studentId: mainTabValue === 1 && selectedStudentId ? selectedStudentId : '', courseId: mainTabValue === 0 && selectedCourseId ? selectedCourseId : '', title: '', description: '', filePath: '', fileType: '', fileSize: '' });
            setSelectedFile(null); setSelectedFolderId(currentFolder);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => { setOpenDialog(false); setEditingMaterial(null); setSelectedFile(null); setSelectedFolderId(null); setUploadProgress(0); };
    const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

    const handleSubmit = async () => {
        if (!formData.courseId && !formData.studentId) { showSnackbar('Выберите курс или ученика', 'error'); return; }
        if (selectedFile) { await handleUpload(); }
        else if (editingMaterial) {
            try {
                await axiosInstance.put(`/materials/${editingMaterial.id}`, { title: formData.title, description: formData.description, studentId: formData.studentId || null, courseId: formData.courseId || null, folderId: selectedFolderId });
                showSnackbar('Материал обновлён', 'success');
                handleCloseDialog();
                if (currentFolder) loadFolderContent(currentFolder); else loadRootContent();
            } catch (err) { showSnackbar('Ошибка при сохранении', 'error'); }
        } else { showSnackbar('Выберите файл для загрузки', 'error'); }
    };

    const handleDelete = async (id, isFolder = false) => {
        if (!window.confirm(isFolder ? 'Удалить папку со всем содержимым?' : 'Удалить материал?')) return;
        try {
            await axiosInstance.delete(isFolder ? `/materials/folder/${id}` : `/materials/${id}`);
            showSnackbar(isFolder ? 'Папка удалена' : 'Материал удалён', 'success');
            if (currentFolder) loadFolderContent(currentFolder); else loadRootContent();
        } catch (err) { showSnackbar('Ошибка при удалении', 'error'); }
    };

    const handleDownload = async (material) => {
        try {
            const response = await axiosInstance.get(`/materials/download/${material.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a'); link.href = url; link.setAttribute('download', material.fileName || material.title);
            document.body.appendChild(link); link.click(); link.remove(); window.URL.revokeObjectURL(url);
        } catch (err) { showSnackbar('Ошибка при скачивании', 'error'); }
    };

    const showSnackbar = (message, severity) => { setSnackbar({ open: true, message, severity }); };
    const formatFileSize = (bytes) => { if (!bytes) return '-'; const mb = bytes / (1024 * 1024); if (mb >= 1) return `${mb.toFixed(1)} MB`; return `${(bytes / 1024).toFixed(0)} KB`; };

    const getTargetName = (material) => {
        if (material.student) return { name: material.student.fullName, type: 'student', icon: <Person sx={{ fontSize: 14 }} />, label: 'Ученик' };
        if (material.course) return { name: material.course.name, type: 'course', icon: <School sx={{ fontSize: 14 }} />, label: 'Курс' };
        return { name: 'Не указано', type: 'none', icon: <FolderIcon sx={{ fontSize: 14 }} />, label: 'Без привязки' };
    };

    const getMaterialsByCourse = () => {
        const grouped = {};
        materials.forEach(m => { if (m.course) { const cId = m.course.id; if (!grouped[cId]) grouped[cId] = { course: m.course, materials: [], folders: [] }; grouped[cId].materials.push(m); } });
        folders.forEach(f => { if (f.course) { const cId = f.course.id; if (!grouped[cId]) grouped[cId] = { course: f.course, materials: [], folders: [] }; grouped[cId].folders.push(f); } });
        return Object.values(grouped);
    };

    const filteredMaterials = materials.filter(m => m.title.toLowerCase().includes(searchTerm.toLowerCase()) || (m.description || '').toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredFolders = folders.filter(f => f.name?.toLowerCase().includes(searchTerm.toLowerCase()));

    const stats = { total: materials.length, students: materials.filter(m => m.student).length, courses: materials.filter(m => m.course).length, folders: folders.length };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </PageContainer>
    );

    const statItems = [
        { label: 'Материалов', value: stats.total, color: '#3B82F6', bg: '#EFF6FF', icon: InsertDriveFileIcon },
        { label: 'Папок', value: stats.folders, color: '#F59E0B', bg: '#FFFBEB', icon: FolderIcon },
        { label: 'Для учеников', value: stats.students, color: '#10B981', bg: '#ECFDF5', icon: PeopleIcon },
        { label: 'Для курсов', value: stats.courses, color: '#7C3AED', bg: '#F5F3FF', icon: BookIcon },
    ];

    return (
        <PageContainer>
            {/* ========== HEADER ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                        Учебные материалы
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                        Хранилище файлов и учебных материалов
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <StyledButton variant="outlined" startIcon={<CreateNewFolderIcon sx={{ fontSize: 18 }} />} onClick={() => setOpenFolderDialog(true)}
                        sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                        Создать папку
                    </StyledButton>
                    <StyledButton variant="contained" startIcon={<Add sx={{ fontSize: 18 }} />} onClick={() => handleOpenDialog()}
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                        Добавить материал
                    </StyledButton>
                </Box>
            </Box>

            {/* ========== TABS ========== */}
            <Box sx={{ mb: 3 }}>
                <ViewToggle>
                    <ViewToggleBtn active={mainTabValue === 0} onClick={() => { setMainTabValue(0); setCurrentFolder(null); setFolderPath([]); }}>
                        <BookIcon sx={{ fontSize: 18, mr: 0.5 }} /> Курсы
                    </ViewToggleBtn>
                    <ViewToggleBtn active={mainTabValue === 1} onClick={() => { setMainTabValue(1); setCurrentFolder(null); setFolderPath([]); }}>
                        <PeopleIcon sx={{ fontSize: 18, mr: 0.5 }} /> Ученики
                    </ViewToggleBtn>
                    <ViewToggleBtn active={mainTabValue === 2} onClick={() => { setMainTabValue(2); setCurrentFolder(null); setFolderPath([]); }}>
                        <FolderIcon sx={{ fontSize: 18, mr: 0.5 }} /> Все материалы
                    </ViewToggleBtn>
                </ViewToggle>
            </Box>

            {/* ========== FILTERS ========== */}
            {(mainTabValue === 0 || mainTabValue === 1) && (
                <FilterPaper elevation={0}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            {mainTabValue === 0 ? (
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontSize: '13px' }}>Выберите курс</InputLabel>
                                    <Select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} label="Выберите курс"
                                        sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                        <MenuItem value="">Все курсы</MenuItem>
                                        {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                                    </Select>
                                </FormControl>
                            ) : (
                                <FormControl fullWidth size="small">
                                    <InputLabel sx={{ fontSize: '13px' }}>Выберите ученика</InputLabel>
                                    <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)} label="Выберите ученика"
                                        sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                        <MenuItem value="">— Выберите ученика —</MenuItem>
                                        {students.map(s => {
                                            const rate = getStudentRateForTutor(s, user?.id);
                                            return <MenuItem key={s.id} value={s.id}>{s.fullName} ({rate || '—'} ₽)</MenuItem>;
                                        })}
                                    </Select>
                                </FormControl>
                            )}
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                {mainTabValue === 0
                                    ? (selectedCourseId ? 'Отображаются материалы выбранного курса' : 'Выберите курс для просмотра материалов')
                                    : (selectedStudentId ? 'Отображаются материалы выбранного ученика' : 'Выберите ученика для просмотра его материалов')}
                            </Typography>
                        </Grid>
                    </Grid>
                </FilterPaper>
            )}

            {/* ========== BREADCRUMBS ========== */}
            {mainTabValue === 2 && (
                <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />} sx={{ mb: 2 }}>
                    <MuiLink component="button" variant="body2" onClick={handleRootClick} underline="hover"
                        sx={{ color: currentFolder ? '#6B7280' : '#4F46E5', fontWeight: currentFolder ? 400 : 600, fontSize: '14px' }}>
                        Корень
                    </MuiLink>
                    {folderPath.map((folder, index) => (
                        <MuiLink key={folder.id} component="button" variant="body2"
                            onClick={() => handleBreadcrumbClick(folder, index)} underline="hover"
                            sx={{ color: index === folderPath.length - 1 ? '#1F2937' : '#6B7280', fontWeight: index === folderPath.length - 1 ? 600 : 400, fontSize: '14px' }}>
                            {folder.name}
                        </MuiLink>
                    ))}
                </Breadcrumbs>
            )}

            {/* ========== STATS ========== */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {statItems.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <Grid item xs={6} sm={3} key={i}>
                            <StatCard>
                                <CardContent sx={{ p: 2.5, textAlign: 'center', '&:last-child': { pb: 2.5 } }}>
                                    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                                        <Icon sx={{ fontSize: 20, color: stat.color }} />
                                    </Box>
                                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>{stat.value}</Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>{stat.label}</Typography>
                                </CardContent>
                            </StatCard>
                        </Grid>
                    );
                })}
            </Grid>

            {/* ========== SEARCH + VIEW TOGGLE ========== */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <TextField placeholder="Поиск по названию..." size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 280, '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#FFFFFF', '& fieldset': { borderColor: '#E5E7EB' }, '&:hover fieldset': { borderColor: '#D1D5DB' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } } }}
                    InputProps={{
                        startAdornment: <InputAdornment position="start"><Search sx={{ color: '#9CA3AF', fontSize: 18 }} /></InputAdornment>,
                        endAdornment: searchTerm && <InputAdornment position="end"><IconButton size="small" onClick={() => setSearchTerm('')}><ClearIcon sx={{ fontSize: 16 }} /></IconButton></InputAdornment>,
                    }} />
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Tooltip title="Обновить"><IconButton size="small" onClick={() => currentFolder ? loadFolderContent(currentFolder) : loadRootContent()} sx={{ color: '#6B7280' }}><Refresh /></IconButton></Tooltip>
                    <ViewToggle>
                        <ViewToggleBtn active={viewMode === 'grid'} onClick={() => setViewMode('grid')}><GridIcon sx={{ fontSize: 18 }} /></ViewToggleBtn>
                        <ViewToggleBtn active={viewMode === 'list'} onClick={() => setViewMode('list')}><ListIcon sx={{ fontSize: 18 }} /></ViewToggleBtn>
                    </ViewToggle>
                </Box>
            </Box>

            {/* ========== CONTENT ========== */}
            {error ? <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert> : (
                <>
                    {/* ===== COURSES TAB ===== */}
                    {mainTabValue === 0 && (
                        <>
                            {selectedCourseId ? (
                                filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
                                    <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                        <EmptyStateContainer>
                                            <EmptyStateIcon><FolderIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>Нет материалов в этом курсе</Typography>
                                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>Нажмите "Добавить материал" чтобы загрузить первый файл</Typography>
                                            <StyledButton variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#4F46E5' }}>Добавить материал</StyledButton>
                                        </EmptyStateContainer>
                                    </Paper>
                                ) : viewMode === 'grid' ? (
                                    <Grid container spacing={2.5}>
                                        {filteredFolders.map(folder => (
                                            <Grid item xs={12} sm={6} md={3} key={folder.id}>
                                                <FolderCard onClick={() => handleFolderClick(folder)}>
                                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#FFFBEB', width: 44, height: 44 }}>
                                                                <FolderIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
                                                            </Avatar>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>{folder.name}</Typography>
                                                        </Box>
                                                    </CardContent>
                                                    <Divider sx={{ borderColor: '#F3F4F6' }} />
                                                    <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
                                                        <Tooltip title="Редактировать"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEditFolderDialog(folder); }} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                        <Tooltip title="Удалить"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, true); }} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                    </CardActions>
                                                </FolderCard>
                                            </Grid>
                                        ))}
                                        {filteredMaterials.map(material => {
                                            const target = getTargetName(material);
                                            return (
                                                <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                    <MaterialCard>
                                                        <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                                <FileTypeIcon fileName={material.fileName} size={40} />
                                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                    <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>{material.title}</Typography>
                                                                    <Chip icon={target.icon} label={`${target.label}: ${target.name}`} size="small" variant="outlined"
                                                                        sx={{ mt: 0.5, borderRadius: '100px', borderColor: '#E5E7EB', fontSize: '11px' }} />
                                                                </Box>
                                                            </Box>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{formatFileSize(material.fileSize)}</Typography>
                                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                    <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                                    <Tooltip title="Переместить"><IconButton size="small" onClick={() => handleOpenMoveDialog(material)} sx={{ color: '#6B7280' }}><MoveIcon fontSize="small" /></IconButton></Tooltip>
                                                                    <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenDialog(material)} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                                    <Tooltip title="Удалить"><IconButton size="small" onClick={() => handleDelete(material.id)} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </MaterialCard>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                ) : (
                                    <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
                                        <Table>
                                            <TableHead><TableRow>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Название</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Тип</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Размер</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Действия</TableCell>
                                            </TableRow></TableHead>
                                            <TableBody>
                                                {filteredMaterials.map(material => (
                                                    <StyledTableRow key={material.id}>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <FileTypeIcon fileName={material.fileName} size={28} />
                                                                <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#1F2937' }}>{material.title}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}><Chip label={material.fileType || '-'} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} /></TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}><Typography sx={{ fontSize: '14px', color: '#6B7280' }}>{formatFileSize(material.fileSize)}</Typography></TableCell>
                                                        <TableCell align="right" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Переместить"><IconButton size="small" onClick={() => handleOpenMoveDialog(material)} sx={{ color: '#6B7280' }}><MoveIcon fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenDialog(material)} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Удалить"><IconButton size="small" onClick={() => handleDelete(material.id)} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                        </TableCell>
                                                    </StyledTableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )
                            ) : (
                                <Box>
                                    {getMaterialsByCourse().length === 0 ? (
                                        <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                            <EmptyStateContainer>
                                                <EmptyStateIcon><BookIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                                                <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>Нет материалов по курсам</Typography>
                                                <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Добавьте материалы и привяжите их к курсам</Typography>
                                            </EmptyStateContainer>
                                        </Paper>
                                    ) : (
                                        getMaterialsByCourse().map(group => (
                                            <Paper key={group.course.id} sx={{ mb: 3, borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                                                <CourseGroupHeader color={group.course.color || '#4F46E5'}>
                                                    <BookIcon />
                                                    <Typography sx={{ fontWeight: 600, fontSize: '16px' }}>{group.course.name}</Typography>
                                                    <Chip label={`${group.materials.length} файлов, ${group.folders.length} папок`} size="small"
                                                        sx={{ ml: 2, bgcolor: 'rgba(255,255,255,0.2)', color: '#FFFFFF', borderRadius: '100px', fontWeight: 500 }} />
                                                </CourseGroupHeader>
                                                <Box sx={{ p: 2.5 }}>
                                                    <Grid container spacing={2}>
                                                        {group.folders.map(folder => (
                                                            <Grid item xs={12} sm={6} md={3} key={folder.id}>
                                                                <Card sx={{ borderRadius: '8px', border: '1px solid #F3F4F6', cursor: 'pointer', boxShadow: 'none', '&:hover': { bgcolor: '#F9FAFB' } }}
                                                                    onClick={() => { setMainTabValue(2); setTimeout(() => handleFolderClick(folder), 100); }}>
                                                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <FolderIcon sx={{ color: '#F59E0B', fontSize: 20 }} />
                                                                            <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#1F2937' }}>{folder.name}</Typography>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                        {group.materials.slice(0, 6).map(material => (
                                                            <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                                <Card sx={{ borderRadius: '8px', border: '1px solid #F3F4F6', boxShadow: 'none' }}>
                                                                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <FileTypeIcon fileName={material.fileName} size={28} />
                                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                                <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }} noWrap>{material.title}</Typography>
                                                                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{formatFileSize(material.fileSize)}</Typography>
                                                                            </Box>
                                                                            <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                    {group.materials.length > 6 && (
                                                        <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 1.5 }}>и ещё {group.materials.length - 6} файлов...</Typography>
                                                    )}
                                                </Box>
                                            </Paper>
                                        ))
                                    )}
                                </Box>
                            )}
                        </>
                    )}

                    {/* ===== STUDENTS TAB ===== */}
                    {mainTabValue === 1 && (
                        <>
                            {!selectedStudentId ? (
                                <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <EmptyStateContainer>
                                        <EmptyStateIcon><PeopleIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>Выберите ученика</Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Выберите ученика из списка выше, чтобы увидеть его материалы</Typography>
                                    </EmptyStateContainer>
                                </Paper>
                            ) : filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
                                <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <EmptyStateContainer>
                                        <EmptyStateIcon><FolderIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>Нет материалов для этого ученика</Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>Добавьте материалы и привяжите их к ученику</Typography>
                                    </EmptyStateContainer>
                                </Paper>
                            ) : viewMode === 'grid' ? (
                                <Grid container spacing={2.5}>
                                    {filteredMaterials.map(material => {
                                        const target = getTargetName(material);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                <MaterialCard>
                                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <FileTypeIcon fileName={material.fileName} size={40} />
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>{material.title}</Typography>
                                                                <Chip icon={target.icon} label={target.name} size="small" variant="outlined"
                                                                    sx={{ mt: 0.5, borderRadius: '100px', borderColor: '#E5E7EB', fontSize: '11px' }} />
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{formatFileSize(material.fileSize)}</Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenDialog(material)} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Удалить"><IconButton size="small" onClick={() => handleDelete(material.id)} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </MaterialCard>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
                                    <Table>
                                        <TableHead><TableRow>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Название</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Курс</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Тип</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Размер</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Действия</TableCell>
                                        </TableRow></TableHead>
                                        <TableBody>
                                            {filteredMaterials.map(material => (
                                                <StyledTableRow key={material.id}>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <FileTypeIcon fileName={material.fileName} size={28} />
                                                            <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#1F2937' }}>{material.title}</Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        {material.course ? <Chip icon={<School sx={{ fontSize: 14 }} />} label={material.course.name} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} /> : '—'}
                                                    </TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}><Chip label={material.fileType || '-'} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} /></TableCell>
                                                    <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}><Typography sx={{ fontSize: '14px', color: '#6B7280' }}>{formatFileSize(material.fileSize)}</Typography></TableCell>
                                                    <TableCell align="right" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                        <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                        <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenDialog(material)} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                        <Tooltip title="Удалить"><IconButton size="small" onClick={() => handleDelete(material.id)} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                    </TableCell>
                                                </StyledTableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}

                    {/* ===== ALL MATERIALS TAB ===== */}
                    {mainTabValue === 2 && (
                        <>
                            {filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
                                <Paper sx={{ borderRadius: '12px', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                                    <EmptyStateContainer>
                                        <EmptyStateIcon><FolderIcon sx={{ fontSize: 40, color: '#9CA3AF' }} /></EmptyStateIcon>
                                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>Нет материалов</Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 3 }}>Нажмите "Добавить материал" чтобы загрузить первый файл</Typography>
                                        <StyledButton variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()} sx={{ bgcolor: '#4F46E5' }}>Добавить материал</StyledButton>
                                    </EmptyStateContainer>
                                </Paper>
                            ) : viewMode === 'grid' ? (
                                <Grid container spacing={2.5}>
                                    {filteredFolders.map(folder => (
                                        <Grid item xs={12} sm={6} md={3} key={folder.id}>
                                            <FolderCard onClick={() => handleFolderClick(folder)}>
                                                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#FFFBEB', width: 44, height: 44 }}>
                                                            <FolderIcon sx={{ color: '#F59E0B', fontSize: 28 }} />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>{folder.name}</Typography>
                                                            {folder.course && <Chip icon={<School sx={{ fontSize: 14 }} />} label={folder.course.name} size="small" variant="outlined" sx={{ mt: 0.5, borderRadius: '100px', fontSize: '11px' }} />}
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                                <Divider sx={{ borderColor: '#F3F4F6' }} />
                                                <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 1 }}>
                                                    <Tooltip title="Редактировать"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEditFolderDialog(folder); }} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                    <Tooltip title="Удалить"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(folder.id, true); }} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                </CardActions>
                                            </FolderCard>
                                        </Grid>
                                    ))}
                                    {filteredMaterials.map(material => {
                                        const target = getTargetName(material);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                <MaterialCard>
                                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <FileTypeIcon fileName={material.fileName} size={40} />
                                                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '15px', color: '#1F2937' }}>{material.title}</Typography>
                                                                <Chip icon={target.icon} label={`${target.label}: ${target.name}`} size="small" variant="outlined"
                                                                    sx={{ mt: 0.5, borderRadius: '100px', borderColor: '#E5E7EB', fontSize: '11px' }} />
                                                            </Box>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{formatFileSize(material.fileSize)}</Typography>
                                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Переместить"><IconButton size="small" onClick={() => handleOpenMoveDialog(material)} sx={{ color: '#6B7280' }}><MoveIcon fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenDialog(material)} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                                <Tooltip title="Удалить"><IconButton size="small" onClick={() => handleDelete(material.id)} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </MaterialCard>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #F3F4F6' }}>
                                    <Table>
                                        <TableHead><TableRow>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Название</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Для кого</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Тип</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Размер</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', bgcolor: '#F9FAFB' }}>Действия</TableCell>
                                        </TableRow></TableHead>
                                        <TableBody>
                                            {filteredMaterials.map(material => {
                                                const target = getTargetName(material);
                                                return (
                                                    <StyledTableRow key={material.id}>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <FileTypeIcon fileName={material.fileName} size={28} />
                                                                <Box>
                                                                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#1F2937' }}>{material.title}</Typography>
                                                                    {material.description && <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>{material.description}</Typography>}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Chip icon={target.icon} label={`${target.label}: ${target.name}`} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} />
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}><Chip label={material.fileType || '-'} size="small" variant="outlined" sx={{ borderRadius: '100px', fontSize: '11px' }} /></TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}><Typography sx={{ fontSize: '14px', color: '#6B7280' }}>{formatFileSize(material.fileSize)}</Typography></TableCell>
                                                        <TableCell align="right" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Tooltip title="Скачать"><IconButton size="small" onClick={() => handleDownload(material)} sx={{ color: '#6B7280' }}><Download fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Переместить"><IconButton size="small" onClick={() => handleOpenMoveDialog(material)} sx={{ color: '#6B7280' }}><MoveIcon fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Редактировать"><IconButton size="small" onClick={() => handleOpenDialog(material)} sx={{ color: '#6B7280' }}><Edit fontSize="small" /></IconButton></Tooltip>
                                                            <Tooltip title="Удалить"><IconButton size="small" onClick={() => handleDelete(material.id)} sx={{ color: '#EF4444' }}><Delete fontSize="small" /></IconButton></Tooltip>
                                                        </TableCell>
                                                    </StyledTableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}
                </>
            )}

            {/* ========== DIALOGS (STYLED, LOGIC PRESERVED) ========== */}
            {/* Create Folder Dialog */}
            <StyledDialog open={openFolderDialog} onClose={() => setOpenFolderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Создать папку</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <TextField fullWidth label="Название папки" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Привязать к курсу</InputLabel>
                            <Select value={folderCourseId} onChange={(e) => setFolderCourseId(e.target.value)} label="Привязать к курсу" sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— Без курса —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Alert severity="info" sx={{ mt: 2, borderRadius: '8px', fontSize: '13px' }}>Папка будет доступна только ученикам, записанным на выбранный курс.</Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenFolderDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()} sx={{ bgcolor: '#4F46E5' }}>Создать</StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Edit Folder Dialog */}
            <StyledDialog open={openEditFolderDialog} onClose={() => setOpenEditFolderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Редактировать папку</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <TextField fullWidth label="Название папки" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} autoFocus
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Привязать к курсу</InputLabel>
                            <Select value={folderCourseId} onChange={(e) => setFolderCourseId(e.target.value)} label="Привязать к курсу" sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— Без курса —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenEditFolderDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleEditFolder} variant="contained" sx={{ bgcolor: '#4F46E5' }}>Сохранить</StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Add/Edit Material Dialog */}
            <StyledDialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    {editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Box sx={{ mb: 3 }}>
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileSelect} />
                            <StyledButton variant="outlined" startIcon={<CloudUpload sx={{ fontSize: 18 }} />} onClick={() => fileInputRef.current?.click()} fullWidth disabled={uploading}
                                sx={{ py: 1.5, color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                {selectedFile ? selectedFile.name : 'Выбрать файл'}
                            </StyledButton>
                            {selectedFile && <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 1 }}>{formatFileSize(selectedFile.size)} · {getFileTypeFromName(selectedFile.name).toUpperCase()}</Typography>}
                        </Box>
                        <TextField fullWidth label="Название" name="title" value={formData.title} onChange={handleInputChange} required autoFocus
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <TextField fullWidth label="Описание" name="description" value={formData.description} onChange={handleInputChange} multiline rows={2}
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                        <Typography sx={{ fontWeight: 600, fontSize: '14px', color: '#1F2937', mb: 1, mt: 1 }}>Привязка материала</Typography>
                        <FormControl fullWidth sx={{ mb: 1 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Курс</InputLabel>
                            <Select name="courseId" value={formData.courseId} onChange={handleInputChange} label="Курс" sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— Не выбрано —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Typography sx={{ textAlign: 'center', color: '#9CA3AF', fontSize: '13px', my: 1 }}>— ИЛИ —</Typography>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Конкретный ученик</InputLabel>
                            <Select name="studentId" value={formData.studentId} onChange={handleInputChange} label="Конкретный ученик" sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— Не выбрано —</MenuItem>
                                {students.map(s => <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Поместить в папку (опционально)</InputLabel>
                            <Select value={selectedFolderId || ''} onChange={(e) => setSelectedFolderId(e.target.value || null)} label="Поместить в папку" sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— Корень —</MenuItem>
                                {allFolders.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Alert severity="info" sx={{ mt: 2, borderRadius: '8px', fontSize: '13px' }}>Материал будет доступен всем ученикам, записанным на выбранный курс, либо конкретному ученику.</Alert>
                        {uploading && <Box sx={{ mt: 2 }}><LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: '4px' }} /><Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 0.5 }}>Загрузка: {uploadProgress}%</Typography></Box>}
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={handleCloseDialog} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleSubmit} variant="contained" disabled={(!selectedFile && !editingMaterial) || !formData.title} sx={{ bgcolor: '#4F46E5' }}>
                        {uploading ? 'Загрузка...' : (editingMaterial ? 'Сохранить' : 'Добавить')}
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Move Dialog */}
            <StyledDialog open={openMoveDialog} onClose={() => setOpenMoveDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>Переместить материал</DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        <Typography sx={{ fontSize: '14px', color: '#374151', mb: 2 }}>Материал: <strong>{movingMaterial?.title}</strong></Typography>
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Выберите папку</InputLabel>
                            <Select value={selectedFolderId || ''} onChange={(e) => setSelectedFolderId(e.target.value || null)} label="Выберите папку" sx={{ borderRadius: '8px' }}>
                                <MenuItem value="">— Корень —</MenuItem>
                                {allFolders.map(f => <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                        <Alert severity="info" sx={{ mt: 2, borderRadius: '8px', fontSize: '13px' }}>Материал можно перемещать только между папками одного курса.</Alert>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenMoveDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton onClick={handleMoveToFolder} variant="contained" sx={{ bgcolor: '#4F46E5' }}>Переместить</StyledButton>
                </DialogActions>
            </StyledDialog>

            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
            </Snackbar>
        </PageContainer>
    );
}

export default Materials;