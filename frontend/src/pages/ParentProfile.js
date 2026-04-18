// frontend/src/pages/ParentProfile.js
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    Grid, Divider, Alert, Snackbar, CircularProgress,
    Card, CardContent, Chip, InputAdornment, List, ListItem, ListItemText
} from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    ChildCare as ChildCareIcon,
    Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
// ✅ Правильный импорт
import axiosInstance from '../api/axiosConfig';

const ParentProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [children, setChildren] = useState([]);
    
    const [profile, setProfile] = useState({
        fullName: user?.fullName || '',
        email: user?.email || '',
        phone: ''
    });

    useEffect(() => {
        if (user && user.id) {
            fetchParentProfile();
            fetchChildren();
        }
    }, [user]);

    const fetchParentProfile = async () => {
        try {
            // ✅ Исправлено: axiosInstance и без /api
            const response = await axiosInstance.get(`/parents/${user.id}`);
            
            setProfile({
                fullName: response.data.fullName || user?.fullName,
                email: response.data.email || user?.email,
                phone: response.data.phone || ''
            });
        } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
        }
    };

    const fetchChildren = async () => {
        try {
            // ✅ Исправлено: axiosInstance и правильный URL
            const response = await axiosInstance.get(`/students/parent/${user.id}`);
            setChildren(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки детей:', err);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            // ✅ Исправлено: axiosInstance
            await axiosInstance.put(`/parents/${user.id}`, {
                fullName: profile.fullName,
                phone: profile.phone
            });
            
            setEditMode(false);
            showSnackbar('Профиль успешно обновлён', 'success');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            showSnackbar(err.response?.data?.error || 'Ошибка при сохранении профиля', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    if (loading && !profile.fullName) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Мой профиль
            </Typography>
            
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', borderRadius: 3 }}>
                        <Avatar
                            sx={{
                                width: 120,
                                height: 120,
                                mx: 'auto',
                                mb: 2,
                                bgcolor: '#10B981',
                                fontSize: 48
                            }}
                        >
                            {profile.fullName?.charAt(0) || 'Р'}
                        </Avatar>
                        
                        <Typography variant="h6" gutterBottom>
                            {profile.fullName}
                        </Typography>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Chip
                            icon={<BadgeIcon />}
                            label={`ID: ${user?.id}`}
                            variant="outlined"
                            sx={{ mb: 1 }}
                        />
                    </Paper>
                </Grid>
                
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6">
                                Личная информация
                            </Typography>
                            {!editMode ? (
                                <Button
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => setEditMode(true)}
                                >
                                    Редактировать
                                </Button>
                            ) : (
                                <Box>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setEditMode(false)}
                                        sx={{ mr: 1 }}
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        variant="contained"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveProfile}
                                        disabled={loading}
                                    >
                                        {loading ? <CircularProgress size={24} /> : 'Сохранить'}
                                    </Button>
                                </Box>
                            )}
                        </Box>
                        
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="ФИО"
                                    value={profile.fullName}
                                    onChange={(e) => setProfile({...profile, fullName: e.target.value})}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    value={profile.email}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                    helperText="Email нельзя изменить"
                                />
                            </Grid>
                            
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Телефон"
                                    value={profile.phone}
                                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                    disabled={!editMode}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PhoneIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                        </Grid>
                    </Paper>
                    
                    {/* Информация о детях */}
                    <Paper sx={{ p: 3, mt: 3, borderRadius: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            <ChildCareIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Мои дети
                        </Typography>
                        
                        {children.length === 0 ? (
                            <Alert severity="info">У вас пока нет привязанных детей</Alert>
                        ) : (
                            <List>
                                {children.map((child, index) => (
                                    <React.Fragment key={child.id}>
                                        <ListItem>
                                            <ListItemText
                                                primary={child.fullName}
                                                secondary={`${child.email || 'Email не указан'} | ${child.paymentType === 'subscription' ? 'Абонемент' : 'Поурочная оплата'}`}
                                            />
                                        </ListItem>
                                        {index < children.length - 1 && <Divider />}
                                    </React.Fragment>
                                ))}
                            </List>
                        )}
                    </Paper>
                </Grid>
            </Grid>
            
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
};

export default ParentProfile;