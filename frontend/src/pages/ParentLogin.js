import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container, Box, TextField, Button, Typography,
    Paper, Alert, CircularProgress, InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function ParentLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { parentLogin } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const result = await parentLogin(email, password);
        
        if (result.success) {
            navigate('/parent/dashboard');
        } else {
            setError(result.error);
        }
        
        setLoading(false);
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={3} sx={{ p: 4, mt: 8, borderRadius: 4 }}>
                <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                    Вход для родителя
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
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
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
                    
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1, mb: 1 }}>
                        Введите email и пароль, которые вы получили от репетитора
                    </Typography>
                    
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 2, mb: 1, py: 1.5, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
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
                        <Link to="/login" style={{ textDecoration: 'none' }}>
                            <Typography variant="body2" color="primary">
                                Вход для репетитора
                            </Typography>
                        </Link>
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
}

export default ParentLogin;