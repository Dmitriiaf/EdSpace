import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    Grid, Divider, Alert, Snackbar, CircularProgress,
    Chip, InputAdornment, Card
} from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import NickWithCosmetics from '../components/NickWithCosmetics';

const StudentProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [bgPreview, setBgPreview] = useState(null);
    
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        paymentType: ''
    });
    
    const [tutors, setTutors] = useState([]);

    useEffect(() => {
        fetchStudentProfile();
        fetchCosmetics();
    }, []);

    const fetchCosmetics = async () => {
        if (!user?.id) return;
        try {
            const res = await axiosInstance.get(`/cosmetics/active/${user.id}`);
            const bg = (res.data || []).find(c => c.itemType === 'BACKGROUND' && c.active);
            if (bg) {
                const BG_MAP = {
                    pink_grad: 'linear-gradient(135deg,#FBCFE8,#F9A8D4)',
                    blue_grad: 'linear-gradient(135deg,#BFDBFE,#93C5FD)',
                    sunset: 'linear-gradient(135deg,#FDBA74,#F472B6)',
                    space: 'linear-gradient(135deg,#1E1B4B,#312E81)',
                    custom: '#E5E7EB',
                };
                setBgPreview(BG_MAP[bg.itemKey] || null);
            }
        } catch (err) {}
    };

    const fetchStudentProfile = async () => {
        if (!user || !user.id) {
            return;
        }
        setLoading(true);
        try {
            const response = await axiosInstance.get(`/students/${user.id}`);
            const student = response.data;
            setProfile({
                fullName: student.fullName || '',
                email: student.email || '',
                phone: student.phone || '',
                paymentType: student.paymentType === 'subscription' ? 'Абонемент' : 'Поурочная оплата'
            });
            
            if (student.tutors && student.tutors.length > 0) {
                setTutors(student.tutors);
            }
        } catch (err) {
            showSnackbar('Ошибка при загрузке профиля', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            await axiosInstance.put(`/students/${user.id}`, {
                fullName: profile.fullName,
                phone: profile.phone
            });
            
            setEditMode(false);
            showSnackbar('Профиль успешно обновлён', 'success');
        } catch (err) {
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
                    <Paper sx={{ 
                        p: 3, 
                        textAlign: 'center', 
                        borderRadius: 3,
                        background: bgPreview || undefined,
                        transition: 'background 0.3s ease',
                    }}>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <NickWithCosmetics
                                studentId={user?.id}
                                name={profile.fullName || 'Ученик'}
                                avatarSize={120}
                                fontSize="1.25rem"
                            />
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Chip
                            icon={<BadgeIcon />}
                            label={`ID: ${user?.id}`}
                            variant="outlined"
                            sx={{ mb: 1, bgcolor: 'rgba(255,255,255,0.8)' }}
                        />
                        
                        <Chip
                            icon={<SchoolIcon />}
                            label={profile.paymentType}
                            variant="outlined"
                            color="primary"
                            sx={{ bgcolor: 'rgba(255,255,255,0.8)' }}
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
                    
                    {tutors.length > 0 && (
                        <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: '#f5f5f5' }}>
                            <Typography variant="h6" gutterBottom>
                                <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                                {tutors.length === 1 ? 'Мой репетитор' : 'Мои репетиторы'}
                            </Typography>
                            <Grid container spacing={2}>
                                {tutors.map((tutor) => (
                                    <Grid item xs={12} key={tutor.id}>
                                        <Card variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                                {tutor.fullName}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                {tutor.email}
                                            </Typography>
                                            {tutor.phone && (
                                                <Typography variant="body2" color="textSecondary">
                                                    {tutor.phone}
                                                </Typography>
                                            )}
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    )}
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

export default StudentProfile;