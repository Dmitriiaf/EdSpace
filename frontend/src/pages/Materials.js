// ========== frontend/src/pages/Materials.js (ПОЛНАЯ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import {
    Box, Button, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, FormControl, InputLabel,
    Select, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Chip,
    Alert, Snackbar, Grid, Card, CardContent, Typography,
    Avatar, Tooltip, InputAdornment, CircularProgress,
    Tabs, Tab, Divider, LinearProgress, Fade,
    Breadcrumbs, Link as MuiLink,
    CardActions, Badge
} from '@mui/material';
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
    People as PeopleIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';  // ✅ Импорт хука

const FileTypeIcon = ({ fileName }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#EF5350', fontSize: 40 }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ color: '#4CAF50', fontSize: 40 }} />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <VideoIcon sx={{ color: '#2196F3', fontSize: 40 }} />;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <AudioIcon sx={{ color: '#FF9800', fontSize: 40 }} />;
    return <FileIcon sx={{ color: '#9E9E9E', fontSize: 40 }} />;
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

function Materials() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();  // ✅ Используем хук
    
    const [materials, setMaterials] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [mainTabValue, setMainTabValue] = useState(0); // 0 - Курсы, 1 - Ученики, 2 - Все материалы
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
        tutorId: user?.id,
        studentId: '',
        courseId: '',
        title: '',
        description: '',
        filePath: '',
        fileType: '',
        fileSize: ''
    });

    // ✅ Функция getStudentRateForTutor удалена — теперь из хука

    const loadRootContent = async () => {
        try {
            const token = localStorage.getItem('token');
            let url = `http://localhost:8080/api/materials`;
            
            if (mainTabValue === 0 && selectedCourseId) {
                url += `?courseId=${selectedCourseId}`;
            }
            
            const response = await axios.get(url, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            let loadedMaterials = response.data.materials || [];
            let loadedFolders = response.data.folders || [];
            
            if (mainTabValue === 1 && selectedStudentId) {
                loadedMaterials = loadedMaterials.filter(m => 
                    m.student && m.student.id === parseInt(selectedStudentId)
                );
            }
            
            setMaterials(loadedMaterials);
            setFolders(loadedFolders);
            
            const foldersRes = await axios.get(
                `http://localhost:8080/api/materials/folders`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setAllFolders(foldersRes.data || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Не удалось загрузить материалы');
        }
    };

    const loadFolderContent = async (folderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/materials/folder/${folderId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
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
        if (folder) {
            setCurrentFolder(folder.id);
            await loadFolderContent(folder.id);
        } else {
            setCurrentFolder(null);
            await loadRootContent();
        }
    };

    useEffect(() => {
        if (user) {
            loadRootContent();
            fetchStudentsAndCourses();
        }
    }, [user]);

    useEffect(() => {
        if (user) {
            loadRootContent();
        }
    }, [mainTabValue, selectedCourseId, selectedStudentId]);

    const fetchStudentsAndCourses = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const [studentsRes, coursesRes] = await Promise.all([
                axios.get(`http://localhost:8080/api/students/tutor/${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/courses/tutor/${user.id}`, { headers })
            ]);
            
            setStudents(studentsRes.data);
            setCourses(coursesRes.data);
        } catch (err) {
            console.error('Ошибка загрузки учеников/курсов:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (file.size > 50 * 1024 * 1024) {
            showSnackbar('Файл слишком большой. Максимальный размер 50MB', 'error');
            return;
        }
        
        setSelectedFile(file);
        
        const fileName = file.name;
        const fileSize = file.size;
        const fileType = getFileTypeFromName(fileName);
        
        setFormData(prev => ({
            ...prev,
            title: fileName.replace(/\.[^/.]+$/, ""),
            fileType: fileType,
            fileSize: fileSize
        }));
    };

    const handleUpload = async () => {
        if (!selectedFile) return;
        
        if (!formData.courseId && !formData.studentId) {
            showSnackbar('Выберите курс или ученика', 'error');
            return;
        }
        
        setUploading(true);
        setUploadProgress(0);
        
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description || '');
        
        if (formData.studentId) {
            uploadFormData.append('studentId', formData.studentId);
        }
        if (formData.courseId) {
            uploadFormData.append('courseId', formData.courseId);
        }
        
        const folderToUse = selectedFolderId || currentFolder;
        if (folderToUse) {
            uploadFormData.append('folderId', folderToUse);
        }
        
        try {
            const token = localStorage.getItem('token');
            
            const interval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);
            
            await axios.post(
                'http://localhost:8080/api/materials/upload',
                uploadFormData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'multipart/form-data'
                    }
                }
            );
            
            clearInterval(interval);
            setUploadProgress(100);
            
            showSnackbar('Файл загружен', 'success');
            setTimeout(() => {
                handleCloseDialog();
                setSelectedFolderId(null);
                if (currentFolder) {
                    loadFolderContent(currentFolder);
                } else {
                    loadRootContent();
                }
            }, 500);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            showSnackbar(err.response?.data?.error || 'Ошибка при загрузке файла', 'error');
        } finally {
            setUploading(false);
            setUploadProgress(0);
            setSelectedFile(null);
        }
    };

    const handleCreateFolder = async () => {
        if (!newFolderName.trim()) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:8080/api/materials/folder',
                { 
                    name: newFolderName, 
                    parentFolderId: currentFolder,
                    courseId: folderCourseId || selectedCourseId || null
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            showSnackbar('Папка создана', 'success');
            setOpenFolderDialog(false);
            setNewFolderName('');
            setFolderCourseId('');
            
            if (currentFolder) {
                loadFolderContent(currentFolder);
            } else {
                loadRootContent();
            }
        } catch (err) {
            showSnackbar('Ошибка при создании папки', 'error');
        }
    };

    const handleEditFolder = async () => {
        if (!editingFolder) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/materials/folder/${editingFolder.id}`,
                { 
                    name: newFolderName,
                    courseId: folderCourseId || null
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            showSnackbar('Папка обновлена', 'success');
            setOpenEditFolderDialog(false);
            setEditingFolder(null);
            setNewFolderName('');
            setFolderCourseId('');
            
            if (currentFolder) {
                loadFolderContent(currentFolder);
            } else {
                loadRootContent();
            }
        } catch (err) {
            showSnackbar('Ошибка при обновлении папки', 'error');
        }
    };

    const handleOpenEditFolderDialog = (folder) => {
        setEditingFolder(folder);
        setNewFolderName(folder.name);
        setFolderCourseId(folder.course?.id || '');
        setOpenEditFolderDialog(true);
    };

    const handleMoveToFolder = async () => {
        if (!movingMaterial) return;
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/materials/${movingMaterial.id}/move`,
                { folderId: selectedFolderId },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            showSnackbar('Материал перемещён', 'success');
            setOpenMoveDialog(false);
            setMovingMaterial(null);
            setSelectedFolderId(null);
            
            if (currentFolder) {
                loadFolderContent(currentFolder);
            } else {
                loadRootContent();
            }
        } catch (err) {
            showSnackbar(err.response?.data?.error || 'Ошибка при перемещении', 'error');
        }
    };

    const handleOpenMoveDialog = (material) => {
        setMovingMaterial(material);
        setSelectedFolderId(material.folder?.id || null);
        setOpenMoveDialog(true);
    };

    const handleOpenDialog = (material = null) => {
        if (material) {
            setEditingMaterial(material);
            setFormData({
                tutorId: user.id,
                studentId: material.student?.id || '',
                courseId: material.course?.id || '',
                title: material.title,
                description: material.description || '',
                filePath: material.filePath || '',
                fileType: material.fileType || '',
                fileSize: material.fileSize || ''
            });
            setSelectedFile(null);
            setSelectedFolderId(material.folder?.id || null);
        } else {
            setEditingMaterial(null);
            setFormData({
                tutorId: user.id,
                studentId: mainTabValue === 1 && selectedStudentId ? selectedStudentId : '',
                courseId: mainTabValue === 0 && selectedCourseId ? selectedCourseId : '',
                title: '',
                description: '',
                filePath: '',
                fileType: '',
                fileSize: ''
            });
            setSelectedFile(null);
            setSelectedFolderId(currentFolder);
        }
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setEditingMaterial(null);
        setSelectedFile(null);
        setSelectedFolderId(null);
        setUploadProgress(0);
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async () => {
        if (!formData.courseId && !formData.studentId) {
            showSnackbar('Выберите курс или ученика', 'error');
            return;
        }
        
        if (selectedFile) {
            await handleUpload();
        } else if (editingMaterial) {
            try {
                const token = localStorage.getItem('token');
                const headers = { 'Authorization': `Bearer ${token}` };
                
                const submitData = {
                    title: formData.title,
                    description: formData.description,
                    studentId: formData.studentId || null,
                    courseId: formData.courseId || null,
                    folderId: selectedFolderId
                };
                
                await axios.put(`http://localhost:8080/api/materials/${editingMaterial.id}`, submitData, { headers });
                showSnackbar('Материал обновлён', 'success');
                
                handleCloseDialog();
                if (currentFolder) {
                    loadFolderContent(currentFolder);
                } else {
                    loadRootContent();
                }
            } catch (err) {
                console.error('Ошибка:', err);
                showSnackbar('Ошибка при сохранении', 'error');
            }
        } else {
            showSnackbar('Выберите файл для загрузки', 'error');
        }
    };

    const handleDelete = async (id, isFolder = false) => {
        if (!window.confirm(isFolder ? 'Удалить папку со всем содержимым?' : 'Удалить материал?')) return;
        
        try {
            const token = localStorage.getItem('token');
            const url = isFolder 
                ? `http://localhost:8080/api/materials/folder/${id}`
                : `http://localhost:8080/api/materials/${id}`;
            await axios.delete(url, { headers: { 'Authorization': `Bearer ${token}` } });
            showSnackbar(isFolder ? 'Папка удалена' : 'Материал удалён', 'success');
            
            if (currentFolder) {
                loadFolderContent(currentFolder);
            } else {
                loadRootContent();
            }
        } catch (err) {
            showSnackbar('Ошибка при удалении', 'error');
        }
    };

    const handleDownload = async (material) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/materials/download/${material.id}`,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    responseType: 'blob'
                }
            );
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', material.fileName || material.title);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            showSnackbar('Ошибка при скачивании', 'error');
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '-';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(1)} MB`;
        const kb = bytes / 1024;
        return `${kb.toFixed(0)} KB`;
    };

    const getTargetName = (material) => {
        if (material.student) {
            return { name: material.student.fullName, type: 'student', icon: <Person />, label: 'Ученик' };
        }
        if (material.course) {
            return { name: material.course.name, type: 'course', icon: <School />, label: 'Курс' };
        }
        return { name: 'Не указано', type: 'none', icon: <FolderIcon />, label: 'Без привязки' };
    };

    // Группировка материалов по курсам для вкладки "Курсы"
    const getMaterialsByCourse = () => {
        const grouped = {};
        materials.forEach(m => {
            if (m.course) {
                const courseId = m.course.id;
                if (!grouped[courseId]) {
                    grouped[courseId] = {
                        course: m.course,
                        materials: [],
                        folders: []
                    };
                }
                grouped[courseId].materials.push(m);
            }
        });
        
        folders.forEach(f => {
            if (f.course) {
                const courseId = f.course.id;
                if (!grouped[courseId]) {
                    grouped[courseId] = {
                        course: f.course,
                        materials: [],
                        folders: []
                    };
                }
                grouped[courseId].folders.push(f);
            }
        });
        
        return Object.values(grouped);
    };

    const filteredMaterials = materials.filter(m => {
        const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (m.description || '').toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    const filteredFolders = folders.filter(f => 
        f.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        total: materials.length,
        students: materials.filter(m => m.student).length,
        courses: materials.filter(m => m.course).length,
        folders: folders.length
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Box>
                    <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                        Учебные материалы
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Хранилище файлов и учебных материалов
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                        variant="outlined"
                        startIcon={<CreateNewFolderIcon />}
                        onClick={() => setOpenFolderDialog(true)}
                    >
                        Создать папку
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpenDialog()}
                    >
                        Добавить материал
                    </Button>
                </Box>
            </Box>

            {/* Главные вкладки */}
            <Paper sx={{ mb: 3, borderRadius: 3 }}>
                <Tabs 
                    value={mainTabValue} 
                    onChange={(e, v) => {
                        setMainTabValue(v);
                        setCurrentFolder(null);
                        setFolderPath([]);
                        if (v === 2) {
                            setSelectedCourseId('');
                            setSelectedStudentId('');
                        }
                    }}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTab-root': {
                            textTransform: 'none',
                            fontWeight: 500,
                            py: 1.5
                        }
                    }}
                >
                    <Tab icon={<BookIcon />} label="Курсы" />
                    <Tab icon={<PeopleIcon />} label="Ученики" />
                    <Tab icon={<FolderIcon />} label="Все материалы" />
                </Tabs>
            </Paper>

            {/* Фильтры для вкладок */}
            {mainTabValue === 0 && (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Выберите курс</InputLabel>
                                <Select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    label="Выберите курс"
                                >
                                    <MenuItem value="">Все курсы</MenuItem>
                                    {courses.map(c => (
                                        <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Typography variant="caption" color="textSecondary">
                                {selectedCourseId 
                                    ? 'Отображаются материалы выбранного курса' 
                                    : 'Выберите курс для просмотра материалов или оставьте "Все курсы"'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {mainTabValue === 1 && (
                <Paper sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8f9fa' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={4}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Выберите ученика</InputLabel>
                                <Select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    label="Выберите ученика"
                                >
                                    <MenuItem value="">— Выберите ученика —</MenuItem>
                                    {students.map(s => {
                                        const rate = getStudentRateForTutor(s, user?.id);  // ✅ Из хука
                                        return (
                                            <MenuItem key={s.id} value={s.id}>
                                                {s.fullName} ({rate || '—'} ₽)
                                            </MenuItem>
                                        );
                                    })}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Typography variant="caption" color="textSecondary">
                                {selectedStudentId 
                                    ? 'Отображаются материалы, доступные выбранному ученику' 
                                    : 'Выберите ученика для просмотра его материалов'}
                            </Typography>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {/* Хлебные крошки (только для вкладки "Все материалы") */}
            {mainTabValue === 2 && (
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 2 }}>
                    <MuiLink 
                        component="button" 
                        variant="body2" 
                        onClick={handleRootClick}
                        sx={{ cursor: 'pointer' }}
                    >
                        Корень
                    </MuiLink>
                    {folderPath.map((folder, index) => (
                        <MuiLink 
                            key={folder.id} 
                            component="button" 
                            variant="body2" 
                            onClick={() => handleBreadcrumbClick(folder, index)}
                            sx={{ cursor: 'pointer' }}
                        >
                            {folder.name}
                        </MuiLink>
                    ))}
                </Breadcrumbs>
            )}

            {/* Статистика */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#3B82F6' }}>
                                {stats.total}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Материалов
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                {stats.folders}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Папок
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#10B981' }}>
                                {stats.students}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Для учеников
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card sx={{ borderRadius: 3 }}>
                        <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#8B5CF6' }}>
                                {stats.courses}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                                Для курсов
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Поиск */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <TextField
                    placeholder="Поиск по названию..."
                    size="small"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ width: 250 }}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                            </InputAdornment>
                        ),
                    }}
                />
                
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Tooltip title="Обновить">
                        <IconButton size="small" onClick={() => currentFolder ? loadFolderContent(currentFolder) : loadRootContent()}>
                            <Refresh />
                        </IconButton>
                    </Tooltip>
                    <Tabs 
                        value={viewMode} 
                        onChange={(e, v) => setViewMode(v)}
                        sx={{ minHeight: 36 }}
                    >
                        <Tab icon={<GridIcon />} sx={{ minHeight: 36, py: 0 }} />
                        <Tab icon={<ListIcon />} sx={{ minHeight: 36, py: 0 }} />
                    </Tabs>
                </Box>
            </Box>

            {error ? (
                <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
            ) : (
                <>
                    {/* Вкладка КУРСЫ */}
                    {mainTabValue === 0 && (
                        <>
                            {selectedCourseId ? (
                                // Выбран конкретный курс - показываем папки и файлы
                                filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
                                    <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                        <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            Нет материалов в этом курсе
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Нажмите "Добавить материал" чтобы загрузить первый файл
                                        </Typography>
                                    </Paper>
                                ) : viewMode === 'grid' ? (
                                    <Grid container spacing={3}>
                                        {filteredFolders.map((folder) => (
                                            <Grid item xs={12} sm={6} md={3} key={folder.id}>
                                                <Card 
                                                    sx={{ 
                                                        borderRadius: 3,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }
                                                    }}
                                                    onClick={() => handleFolderClick(folder)}
                                                >
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#FFF8E1' }}>
                                                                <FolderIcon sx={{ color: '#FFC107', fontSize: 32 }} />
                                                            </Avatar>
                                                            <Box>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                    {folder.name}
                                                                </Typography>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                    <Divider />
                                                    <CardActions sx={{ justifyContent: 'flex-end' }}>
                                                        <Tooltip title="Редактировать">
                                                            <IconButton size="small" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenEditFolderDialog(folder);
                                                            }}>
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Удалить">
                                                            <IconButton size="small" color="error" onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDelete(folder.id, true);
                                                            }}>
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </CardActions>
                                                </Card>
                                            </Grid>
                                        ))}

                                        {filteredMaterials.map((material) => {
                                            const target = getTargetName(material);
                                            return (
                                                <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                    <Card sx={{ borderRadius: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                                                        <CardContent>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                                <Avatar sx={{ bgcolor: '#f0f2f5' }}>
                                                                    <FileTypeIcon fileName={material.fileName} />
                                                                </Avatar>
                                                                <Box sx={{ flex: 1 }}>
                                                                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                        {material.title}
                                                                    </Typography>
                                                                    <Chip 
                                                                        icon={target.icon}
                                                                        label={`${target.label}: ${target.name}`}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mt: 0.5 }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                            
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {formatFileSize(material.fileSize)}
                                                                </Typography>
                                                                <Box>
                                                                    <Tooltip title="Скачать">
                                                                        <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                            <Download fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Переместить">
                                                                        <IconButton size="small" onClick={() => handleOpenMoveDialog(material)}>
                                                                            <MoveIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Редактировать">
                                                                        <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                                                                            <Edit fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Удалить">
                                                                        <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                ) : (
                                    <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                                        <Table>
                                            <TableHead>
                                                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                                    <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }}>Размер</TableCell>
                                                    <TableCell sx={{ fontWeight: 600 }} align="right">Действия</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {filteredMaterials.map((material) => (
                                                    <TableRow key={material.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <FileTypeIcon fileName={material.fileName} />
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {material.title}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={material.fileType || '-'} size="small" variant="outlined" />
                                                        </TableCell>
                                                        <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Скачать">
                                                                <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                    <Download fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Переместить">
                                                                <IconButton size="small" onClick={() => handleOpenMoveDialog(material)}>
                                                                    <MoveIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Редактировать">
                                                                <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Удалить">
                                                                <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )
                            ) : (
                                // Все курсы - группировка
                                <Box>
                                    {getMaterialsByCourse().length === 0 ? (
                                        <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                            <BookIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                                Нет материалов по курсам
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Добавьте материалы и привяжите их к курсам
                                            </Typography>
                                        </Paper>
                                    ) : (
                                        getMaterialsByCourse().map((group) => (
                                            <Paper key={group.course.id} sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
                                                <Box sx={{ 
                                                    p: 2, 
                                                    bgcolor: group.course.color || '#3B82F6', 
                                                    color: 'white',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 1
                                                }}>
                                                    <BookIcon />
                                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                        {group.course.name}
                                                    </Typography>
                                                    <Chip 
                                                        label={`${group.materials.length} файлов, ${group.folders.length} папок`}
                                                        size="small"
                                                        sx={{ ml: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                                                    />
                                                </Box>
                                                <Box sx={{ p: 2 }}>
                                                    <Grid container spacing={2}>
                                                        {group.folders.map((folder) => (
                                                            <Grid item xs={12} sm={6} md={3} key={folder.id}>
                                                                <Card 
                                                                    sx={{ 
                                                                        borderRadius: 2,
                                                                        cursor: 'pointer',
                                                                        '&:hover': { bgcolor: '#f5f5f5' }
                                                                    }}
                                                                    onClick={() => {
                                                                        setMainTabValue(2);
                                                                        setTimeout(() => handleFolderClick(folder), 100);
                                                                    }}
                                                                >
                                                                    <CardContent>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <FolderIcon sx={{ color: '#FFC107' }} />
                                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                                {folder.name}
                                                                            </Typography>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                        {group.materials.slice(0, 6).map((material) => (
                                                            <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                                <Card sx={{ borderRadius: 2 }}>
                                                                    <CardContent>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <FileTypeIcon fileName={material.fileName} />
                                                                            <Box sx={{ flex: 1 }}>
                                                                                <Typography variant="body2" noWrap>
                                                                                    {material.title}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="textSecondary">
                                                                                    {formatFileSize(material.fileSize)}
                                                                                </Typography>
                                                                            </Box>
                                                                            <Tooltip title="Скачать">
                                                                                <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                                    <Download fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    </CardContent>
                                                                </Card>
                                                            </Grid>
                                                        ))}
                                                    </Grid>
                                                    {group.materials.length > 6 && (
                                                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                                            и ещё {group.materials.length - 6} файлов...
                                                        </Typography>
                                                    )}
                                                </Box>
                                            </Paper>
                                        ))
                                    )}
                                </Box>
                            )}
                        </>
                    )}

                    {/* Вкладка УЧЕНИКИ */}
                    {mainTabValue === 1 && (
                        <>
                            {!selectedStudentId ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                    <PeopleIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary" gutterBottom>
                                        Выберите ученика
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Выберите ученика из списка выше, чтобы увидеть его материалы
                                    </Typography>
                                </Paper>
                            ) : filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                    <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary" gutterBottom>
                                        Нет материалов для этого ученика
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Добавьте материалы и привяжите их к ученику или к курсу, на который он записан
                                    </Typography>
                                </Paper>
                            ) : viewMode === 'grid' ? (
                                <Grid container spacing={3}>
                                    {filteredMaterials.map((material) => {
                                        const target = getTargetName(material);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                <Card sx={{ borderRadius: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#f0f2f5' }}>
                                                                <FileTypeIcon fileName={material.fileName} />
                                                            </Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                    {material.title}
                                                                </Typography>
                                                                <Chip 
                                                                    icon={target.icon}
                                                                    label={target.name}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ mt: 0.5 }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {formatFileSize(material.fileSize)}
                                                            </Typography>
                                                            <Box>
                                                                <Tooltip title="Скачать">
                                                                    <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                        <Download fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Редактировать">
                                                                    <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Удалить">
                                                                    <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                                <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Курс</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Размер</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="right">Действия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredMaterials.map((material) => (
                                                <TableRow key={material.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                    <TableCell>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <FileTypeIcon fileName={material.fileName} />
                                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                {material.title}
                                                            </Typography>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell>
                                                        {material.course ? (
                                                            <Chip 
                                                                icon={<School />}
                                                                label={material.course.name}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        ) : '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip label={material.fileType || '-'} size="small" variant="outlined" />
                                                    </TableCell>
                                                    <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                                                    <TableCell align="right">
                                                        <Tooltip title="Скачать">
                                                            <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                <Download fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Редактировать">
                                                            <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                                                                <Edit fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Удалить">
                                                            <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                                <Delete fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </>
                    )}

                    {/* Вкладка ВСЕ МАТЕРИАЛЫ */}
                    {mainTabValue === 2 && (
                        <>
                            {filteredMaterials.length === 0 && filteredFolders.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                    <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                    <Typography variant="h6" color="textSecondary" gutterBottom>
                                        Нет материалов
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Нажмите "Добавить материал" чтобы загрузить первый файл
                                    </Typography>
                                </Paper>
                            ) : viewMode === 'grid' ? (
                                <Grid container spacing={3}>
                                    {filteredFolders.map((folder) => (
                                        <Grid item xs={12} sm={6} md={3} key={folder.id}>
                                            <Card 
                                                sx={{ 
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }
                                                }}
                                                onClick={() => handleFolderClick(folder)}
                                            >
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#FFF8E1' }}>
                                                            <FolderIcon sx={{ color: '#FFC107', fontSize: 32 }} />
                                                        </Avatar>
                                                        <Box>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                {folder.name}
                                                            </Typography>
                                                            {folder.course && (
                                                                <Chip 
                                                                    icon={<School />}
                                                                    label={folder.course.name}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ mt: 0.5, fontSize: '0.7rem' }}
                                                                />
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                                <Divider />
                                                <CardActions sx={{ justifyContent: 'flex-end' }}>
                                                    <Tooltip title="Редактировать">
                                                        <IconButton size="small" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleOpenEditFolderDialog(folder);
                                                        }}>
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Удалить">
                                                        <IconButton size="small" color="error" onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDelete(folder.id, true);
                                                        }}>
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </CardActions>
                                            </Card>
                                        </Grid>
                                    ))}

                                    {filteredMaterials.map((material) => {
                                        const target = getTargetName(material);
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={material.id}>
                                                <Card sx={{ borderRadius: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                                            <Avatar sx={{ bgcolor: '#f0f2f5' }}>
                                                                <FileTypeIcon fileName={material.fileName} />
                                                            </Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                                    {material.title}
                                                                </Typography>
                                                                <Chip 
                                                                    icon={target.icon}
                                                                    label={`${target.label}: ${target.name}`}
                                                                    size="small"
                                                                    variant="outlined"
                                                                    sx={{ mt: 0.5 }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                        
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                {formatFileSize(material.fileSize)}
                                                            </Typography>
                                                            <Box>
                                                                <Tooltip title="Скачать">
                                                                    <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                        <Download fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Переместить">
                                                                    <IconButton size="small" onClick={() => handleOpenMoveDialog(material)}>
                                                                        <MoveIcon fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Редактировать">
                                                                    <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Удалить">
                                                                    <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            ) : (
                                <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                                <TableCell sx={{ fontWeight: 600 }}>Название</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Для кого</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Размер</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="right">Действия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {filteredMaterials.map((material) => {
                                                const target = getTargetName(material);
                                                return (
                                                    <TableRow key={material.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <FileTypeIcon fileName={material.fileName} />
                                                                <Box>
                                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                        {material.title}
                                                                    </Typography>
                                                                    {material.description && (
                                                                        <Typography variant="caption" color="textSecondary">
                                                                            {material.description}
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip 
                                                                icon={target.icon}
                                                                label={`${target.label}: ${target.name}`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip label={material.fileType || '-'} size="small" variant="outlined" />
                                                        </TableCell>
                                                        <TableCell>{formatFileSize(material.fileSize)}</TableCell>
                                                        <TableCell align="right">
                                                            <Tooltip title="Скачать">
                                                                <IconButton size="small" onClick={() => handleDownload(material)}>
                                                                    <Download fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Переместить">
                                                                <IconButton size="small" onClick={() => handleOpenMoveDialog(material)}>
                                                                    <MoveIcon fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Редактировать">
                                                                <IconButton size="small" onClick={() => handleOpenDialog(material)}>
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Удалить">
                                                                <IconButton size="small" color="error" onClick={() => handleDelete(material.id)}>
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </TableCell>
                                                    </TableRow>
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

            {/* Диалоги */}
            <Dialog open={openFolderDialog} onClose={() => setOpenFolderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Создать папку</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Название папки"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            margin="normal"
                            autoFocus
                        />
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Привязать к курсу</InputLabel>
                            <Select
                                value={folderCourseId}
                                onChange={(e) => setFolderCourseId(e.target.value)}
                                label="Привязать к курсу"
                            >
                                <MenuItem value="">— Без курса —</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Папка будет доступна только ученикам, записанным на выбранный курс.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenFolderDialog(false)}>Отмена</Button>
                    <Button onClick={handleCreateFolder} variant="contained" disabled={!newFolderName.trim()}>
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openEditFolderDialog} onClose={() => setOpenEditFolderDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Редактировать папку</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <TextField
                            fullWidth
                            label="Название папки"
                            value={newFolderName}
                            onChange={(e) => setNewFolderName(e.target.value)}
                            margin="normal"
                            autoFocus
                        />
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Привязать к курсу</InputLabel>
                            <Select
                                value={folderCourseId}
                                onChange={(e) => setFolderCourseId(e.target.value)}
                                label="Привязать к курсу"
                            >
                                <MenuItem value="">— Без курса —</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditFolderDialog(false)}>Отмена</Button>
                    <Button onClick={handleEditFolder} variant="contained">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                    {editingMaterial ? 'Редактировать материал' : 'Добавить материал'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Box sx={{ mb: 3 }}>
                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                onChange={handleFileSelect}
                            />
                            <Button
                                variant="outlined"
                                startIcon={<CloudUpload />}
                                onClick={() => fileInputRef.current?.click()}
                                fullWidth
                                disabled={uploading}
                                sx={{ borderRadius: 2, py: 1.5 }}
                            >
                                {selectedFile ? selectedFile.name : 'Выбрать файл'}
                            </Button>
                            {selectedFile && (
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" color="textSecondary">
                                        {formatFileSize(selectedFile.size)} · {getFileTypeFromName(selectedFile.name).toUpperCase()}
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                        
                        <TextField
                            fullWidth
                            label="Название"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            margin="normal"
                            required
                            autoFocus
                        />
                        
                        <TextField
                            fullWidth
                            label="Описание"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            margin="normal"
                            multiline
                            rows={2}
                        />
                        
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                            Привязка материала
                        </Typography>
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Курс</InputLabel>
                            <Select
                                name="courseId"
                                value={formData.courseId}
                                onChange={handleInputChange}
                                label="Курс"
                            >
                                <MenuItem value="">— Не выбрано —</MenuItem>
                                {courses.map(c => (
                                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 2 }}>
                            — ИЛИ —
                        </Typography>
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Конкретный ученик</InputLabel>
                            <Select
                                name="studentId"
                                value={formData.studentId}
                                onChange={handleInputChange}
                                label="Конкретный ученик"
                            >
                                <MenuItem value="">— Не выбрано —</MenuItem>
                                {students.map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Поместить в папку (опционально)</InputLabel>
                            <Select
                                value={selectedFolderId || ''}
                                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                                label="Поместить в папку (опционально)"
                            >
                                <MenuItem value="">— Корень —</MenuItem>
                                {allFolders.map(f => (
                                    <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ mt: 2 }}>
                            Материал будет доступен всем ученикам, записанным на выбранный курс, либо конкретному ученику.
                        </Alert>

                        {uploading && (
                            <Box sx={{ mt: 2 }}>
                                <LinearProgress variant="determinate" value={uploadProgress} />
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
                                    Загрузка: {uploadProgress}%
                                </Typography>
                            </Box>
                        )}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Отмена</Button>
                    <Button 
                        onClick={handleSubmit} 
                        variant="contained"
                        disabled={(!selectedFile && !editingMaterial) || !formData.title}
                    >
                        {uploading ? 'Загрузка...' : (editingMaterial ? 'Сохранить' : 'Добавить')}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openMoveDialog} onClose={() => setOpenMoveDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Переместить материал</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <Typography variant="body2" gutterBottom>
                            Материал: <strong>{movingMaterial?.title}</strong>
                        </Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Выберите папку</InputLabel>
                            <Select
                                value={selectedFolderId || ''}
                                onChange={(e) => setSelectedFolderId(e.target.value || null)}
                                label="Выберите папку"
                            >
                                <MenuItem value="">— Корень —</MenuItem>
                                {allFolders.map(f => (
                                    <MenuItem key={f.id} value={f.id}>{f.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <Alert severity="info" sx={{ mt: 2 }}>
                            Материал можно перемещать только между папками одного курса.
                        </Alert>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenMoveDialog(false)}>Отмена</Button>
                    <Button onClick={handleMoveToFolder} variant="contained">
                        Переместить
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={() => setSnackbar({ ...snackbar, open: false })}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Materials;