// frontend/src/pages/StudentProfile.js
import React, { useState, useEffect } from 'react';
import {
    Box, Paper, Typography, TextField, Button, Avatar,
    Grid, Divider, Alert, Snackbar, CircularProgress,
    Card, CardContent, Chip, InputAdornment
} from '@mui/material';
import {
    Save as SaveIcon,
    Edit as EditIcon,
    Person as PersonIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    School as SchoolIcon,
    Badge as BadgeIcon,
    AttachMoney as MoneyIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const StudentProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    
    const [profile, setProfile] = useState({
        fullName: '',
        email: '',
        phone: '',
        tutorName: '',
        tutorEmail: '',
        ratePerLesson: '',
        paymentType: ''
    });
    
    const [studentData, setStudentData] = useState(null);

    useEffect(() => {
        fetchStudentProfile();
    }, []);

    const fetchStudentProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/students/${user.id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            const student = response.data;
            setStudentData(student);
            
            setProfile({
                fullName: student.fullName || '',
                email: student.email || '',
                phone: student.phone || '',
                tutorName: student.tutor?.fullName || 'Не назначен',
                tutorEmail: student.tutor?.email || '',
                ratePerLesson: student.ratePerLesson || '',
                paymentType: student.paymentType === 'subscription' ? 'Абонемент' : 'Поурочная оплата'
            });
        } catch (err) {
            console.error('Ошибка загрузки профиля:', err);
            showSnackbar('Ошибка при загрузке профиля', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:8080/api/students/${user.id}`,
                {
                    fullName: profile.fullName,
                    phone: profile.phone
                },
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            setEditMode(false);
            showSnackbar('Профиль успешно обновлён', 'success');
        } catch (err) {
            console.error('Ошибка сохранения:', err);
            showSnackbar('Ошибка при сохранении профиля', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    if (loading && !studentData) return (
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
                                bgcolor: '#ff6b6b',
                                fontSize: 48
                            }}
                        >
                            {profile.fullName?.charAt(0) || 'У'}
                        </Avatar>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Chip
                            icon={<BadgeIcon />}
                            label={`ID: ${user?.id}`}
                            variant="outlined"
                            sx={{ mb: 1 }}
                        />
                        
                        <Chip
                            icon={<MoneyIcon />}
                            label={profile.ratePerLesson ? `${profile.ratePerLesson} ₽/занятие` : 'Ставка не указана'}
                            variant="outlined"
                            color="success"
                            sx={{ mb: 1, mt: 1 }}
                        />
                        
                        <Chip
                            icon={<SchoolIcon />}
                            label={profile.paymentType}
                            variant="outlined"
                            color="primary"
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
                    
                    {/* Информация о репетиторе */}
                    <Paper sx={{ p: 3, mt: 3, borderRadius: 3, bgcolor: '#f5f5f5' }}>
                        <Typography variant="h6" gutterBottom>
                            <SchoolIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                            Мой репетитор
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="ФИО репетитора"
                                    value={profile.tutorName}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <PersonIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Email репетитора"
                                    value={profile.tutorEmail}
                                    disabled
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon color="action" />
                                            </InputAdornment>
                                        )
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    По всем вопросам обращайтесь к вашему репетитору.
                                </Alert>
                            </Grid>
                        </Grid>
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

export default StudentProfile;