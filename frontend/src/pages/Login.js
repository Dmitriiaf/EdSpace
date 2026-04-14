import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, TextField, Button, Typography,
    Paper, Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Login() {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await login(formData.email, formData.password);
        
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4 }}>
                <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                    Вход для репетитора
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        autoComplete="email"
                        autoFocus
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <EmailIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        label="Пароль"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={handleChange}
                        autoComplete="current-password"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <LockIcon sx={{ color: '#9CA3AF' }} />
                                </InputAdornment>
                            ),
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 1, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Войти'}
                    </Button>
                    
                    {/* ✅ КНОПКА "ЗАБЫЛИ ПАРОЛЬ" */}
                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Button component={Link} to="/forgot-password" sx={{ textTransform: 'none', fontSize: '0.875rem' }}>
                            Забыли пароль?
                        </Button>
                    </Box>
                    
                    <Box sx={{ textAlign: 'center', mt: 2 }}>
                        <Link to="/register" style={{ textDecoration: 'none' }}>
                            <Typography variant="body2" color="primary" gutterBottom>
                                Нет аккаунта? Зарегистрируйтесь
                            </Typography>
                        </Link>
                        <Link to="/student-login" style={{ textDecoration: 'none' }}>
                            <Typography variant="body2" color="secondary">
                                Вход для ученика
                            </Typography>
                        </Link>
                        <Link to="/parent-login" style={{ textDecoration: 'none' }}>
                            <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                                Вход для родителя
                            </Typography>
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default Login;