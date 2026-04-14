import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Container, Box, TextField, Button, Typography, Paper, Alert, CircularProgress, InputAdornment, IconButton } from '@mui/material';
import { Lock as LockIcon, Visibility, VisibilityOff, CheckCircle } from '@mui/icons-material';
import axios from 'axios';

function ResetPassword() {
    const navigate = useNavigate(); const location = useLocation();
    const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(''); const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false); const [tokenInfo, setTokenInfo] = useState(null);
    const [formData, setFormData] = useState({ newPassword: '', confirmPassword: '' });
    const token = new URLSearchParams(location.search).get('token');

    useEffect(() => { if (token) validateToken(); else { setError('Токен не найден'); setLoading(false); } }, [token]);

    const validateToken = async () => {
        try { const r = await axios.get(`http://localhost:8080/api/password-reset/validate?token=${token}`); setTokenInfo(r.data); }
        catch (err) { setError(err.response?.data?.error || 'Недействительный токен'); }
        finally { setLoading(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) { setError('Пароли не совпадают'); return; }
        if (formData.newPassword.length < 6) { setError('Пароль должен быть не менее 6 символов'); return; }
        setSubmitting(true); setError('');
        try {
            await axios.post('http://localhost:8080/api/password-reset/reset', { token, newPassword: formData.newPassword });
            setSuccess(true); setTimeout(() => navigate('/login'), 3000);
        } catch (err) { setError(err.response?.data?.error || 'Ошибка'); }
        finally { setSubmitting(false); }
    };

    if (loading) return <Container maxWidth="sm"><Box display="flex" justifyContent="center" minHeight="80vh"><CircularProgress /></Box></Container>;
    if (success) return <Container maxWidth="sm"><Paper sx={{ p:5, mt:8, textAlign:'center' }}><Box fontSize={60}>✅</Box><Typography variant="h4" color="#10B981">Пароль изменён!</Typography></Paper></Container>;
    if (error && !tokenInfo) return <Container maxWidth="sm"><Paper sx={{ p:5, mt:8, textAlign:'center' }}><Box fontSize={60}>❌</Box><Typography color="#EF4444">{error}</Typography><Button component={Link} to="/forgot-password">Запросить новую ссылку</Button></Paper></Container>;

    return (
        <Container maxWidth="sm"><Paper sx={{ p:4, mt:4, borderRadius:4 }}>
            <Box textAlign="center" mb={4}><Box width={70} height={70} borderRadius="50%" bgcolor="#FEF3C7" display="flex" alignItems="center" justifyContent="center" mx="auto" mb={2}><LockIcon sx={{ fontSize:40, color:'#F59E0B' }} /></Box>
            <Typography variant="h4" fontWeight={700}>Новый пароль</Typography><Typography variant="body2" color="textSecondary">для {tokenInfo?.email}</Typography></Box>
            {error && <Alert severity="error" sx={{ mb:3 }}>{error}</Alert>}
            <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Новый пароль" name="newPassword" type={showPassword?'text':'password'} value={formData.newPassword} onChange={(e)=>setFormData({...formData,newPassword:e.target.value})} margin="normal" required helperText="Минимум 6 символов"
                    InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon /></InputAdornment>, endAdornment: <IconButton onClick={()=>setShowPassword(!showPassword)}>{showPassword?<VisibilityOff/>:<Visibility/>}</IconButton> }} />
                <TextField fullWidth label="Подтвердите пароль" name="confirmPassword" type={showPassword?'text':'password'} value={formData.confirmPassword} onChange={(e)=>setFormData({...formData,confirmPassword:e.target.value})} margin="normal" required
                    InputProps={{ startAdornment: <InputAdornment position="start"><CheckCircle /></InputAdornment> }} />
                <Button type="submit" fullWidth variant="contained" disabled={submitting} sx={{ mt:3, py:1.5, bgcolor:'#F59E0B', borderRadius:2, textTransform:'none', fontWeight:600, '&:hover':{bgcolor:'#D97706'} }}>
                    {submitting?<CircularProgress size={24} sx={{color:'white'}}/>:'Сохранить пароль'}
                </Button>
            </form>
        </Paper></Container>
    );
}
export default ResetPassword;