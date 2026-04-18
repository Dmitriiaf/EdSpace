// ========== StudentMaterials.js ==========
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, Chip, CircularProgress, Alert,
    Avatar, Tooltip, Breadcrumbs, Link as MuiLink,
    IconButton
} from '@mui/material';
import {
    Folder as FolderIcon,
    Description as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    Download as DownloadIcon,
    NavigateNext as NavigateNextIcon,
    School as SchoolIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

const FileTypeIcon = ({ fileName }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return <PdfIcon sx={{ color: '#EF5350', fontSize: 40 }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ color: '#4CAF50', fontSize: 40 }} />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <VideoIcon sx={{ color: '#2196F3', fontSize: 40 }} />;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <AudioIcon sx={{ color: '#FF9800', fontSize: 40 }} />;
    return <FileIcon sx={{ color: '#9E9E9E', fontSize: 40 }} />;
};

function StudentMaterials() {
    const { user } = useAuth();
    const [allMaterials, setAllMaterials] = useState([]);
    const [allFolders, setAllFolders] = useState([]);
    const [displayMaterials, setDisplayMaterials] = useState([]);
    const [displayFolders, setDisplayFolders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);

    const loadAllData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `/api/materials/student/${user.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setAllMaterials(response.data.materials || []);
            setAllFolders(response.data.folders || []);
            
            const rootMaterials = (response.data.materials || []).filter(m => !m.folder);
            const rootFolders = (response.data.folders || []).filter(f => !f.parentFolder);
            setDisplayMaterials(rootMaterials);
            setDisplayFolders(rootFolders);
            
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки материалов:', err);
            setError('Не удалось загрузить материалы');
        } finally {
            setLoading(false);
        }
    };

    const loadFolderContent = async (folderId) => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `/materials/student/${user.id}/folder/${folderId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setDisplayMaterials(response.data.materials || []);
            setDisplayFolders(response.data.folders || []);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки папки:', err);
            setError('Не удалось загрузить содержимое папки');
        } finally {
            setLoading(false);
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
        
        const rootMaterials = allMaterials.filter(m => !m.folder);
        const rootFolders = allFolders.filter(f => !f.parentFolder);
        setDisplayMaterials(rootMaterials);
        setDisplayFolders(rootFolders);
    };

    const handleBreadcrumbClick = async (folder, index) => {
        const newPath = folderPath.slice(0, index + 1);
        setFolderPath(newPath);
        
        if (index === -1 || !folder) {
            setCurrentFolder(null);
            const rootMaterials = allMaterials.filter(m => !m.folder);
            const rootFolders = allFolders.filter(f => !f.parentFolder);
            setDisplayMaterials(rootMaterials);
            setDisplayFolders(rootFolders);
        } else {
            setCurrentFolder(folder.id);
            await loadFolderContent(folder.id);
        }
    };

    const handleDownload = async (material) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `/materials/download/${material.id}`,
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
            console.error('Ошибка при скачивании:', err);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '-';
        const mb = bytes / (1024 * 1024);
        if (mb >= 1) return `${mb.toFixed(1)} MB`;
        const kb = bytes / 1024;
        return `${kb.toFixed(0)} KB`;
    };

    useEffect(() => {
        if (user) {
            loadAllData();
        }
    }, [user]);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                    Учебные материалы
                </Typography>
                <Typography variant="body2" color="textSecondary">
                    Здесь вы найдёте все материалы, предоставленные репетитором
                </Typography>
            </Box>

            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ mb: 3 }}>
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

            {error ? (
                <Alert severity="error">{error}</Alert>
            ) : displayFolders.length === 0 && displayMaterials.length === 0 ? (
                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                    <FolderIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Нет доступных материалов
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {currentFolder 
                            ? 'В этой папке нет материалов'
                            : 'Репетитор ещё не добавил материалы или они не доступны для вас'}
                    </Typography>
                </Paper>
            ) : (
                <Grid container spacing={3}>
                    {displayFolders.map((folder) => (
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
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <Avatar sx={{ bgcolor: '#FFF8E1', width: 56, height: 56 }}>
                                            <FolderIcon sx={{ color: '#FFC107', fontSize: 32 }} />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {folder.name}
                                            </Typography>
                                            {folder.course && (
                                                <Chip 
                                                    icon={<SchoolIcon />}
                                                    label={folder.course.name}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ mt: 0.5, fontSize: '0.7rem' }}
                                                />
                                            )}
                                        </Box>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}

                    {displayMaterials.map((material) => (
                        <Grid item xs={12} sm={6} md={4} key={material.id}>
                            <Card sx={{ borderRadius: 3, transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                        <FileTypeIcon fileName={material.fileName} />
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {material.title}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                {formatFileSize(material.fileSize)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    
                                    {material.description && (
                                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                            {material.description}
                                        </Typography>
                                    )}
                                    
                                    {material.course && (
                                        <Chip 
                                            icon={<SchoolIcon />}
                                            label={material.course.name}
                                            size="small"
                                            variant="outlined"
                                            sx={{ mb: 1 }}
                                        />
                                    )}
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                                        <Tooltip title="Скачать">
                                            <IconButton 
                                                size="small" 
                                                onClick={() => handleDownload(material)}
                                                sx={{ bgcolor: '#f0f2f5' }}
                                            >
                                                <DownloadIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
        </Box>
    );
}

export default StudentMaterials;