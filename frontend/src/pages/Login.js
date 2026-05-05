import React, { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
    Box, Card, CardContent, TextField, Button,
    Typography, Tabs, Tab, Alert, CircularProgress,
    InputAdornment, IconButton
} from '@mui/material';
import {
    Visibility, VisibilityOff,
    School as TutorIcon,
    Person as StudentIcon,
    ChildCare as ParentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login, studentLogin, parentLogin } = useAuth();
    const [tab, setTab] = useState(0);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email || !password) {
            setError('Заполните все поля');
            return;
        }

        setLoading(true);
        setError('');

        try {
            let result;
            if (tab === 0) {
                result = await login(email, password);
                if (result.success) navigate('/dashboard');
            } else if (tab === 1) {
                result = await studentLogin(email, password);
                if (result.success) navigate('/student');
            } else {
                result = await parentLogin(email, password);
                if (result.success) navigate('/parent/dashboard');
            }
            
            if (!result.success) {
                setError(result.error);
            }
        } catch (err) {
            setError('Ошибка входа');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#F2EFE7',
            p: 2
        }}>
            <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
                <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', mb: 1 }}>
                        EdSpace
                    </Typography>
                    <Typography variant="body2" color="textSecondary" textAlign="center" sx={{ mb: 3 }}>
                        Вход в личный кабинет
                    </Typography>

                    <Tabs
                        value={tab}
                        onChange={(e, v) => { setTab(v); setError(''); }}
                        variant="fullWidth"
                        sx={{ mb: 3 }}
                    >
                        <Tab icon={<TutorIcon />} label="Репетитор" />
                        <Tab icon={<ParentIcon />} label="Ученик" />
                        <Tab icon={<StudentIcon />} label="Родитель" />
                    </Tabs>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            margin="normal"
                            autoFocus
                            autoComplete="email"
                        />
                        <TextField
                            fullWidth
                            label="Пароль"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            margin="normal"
                            autoComplete="current-password"
                            InputProps={{
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
                            disabled={loading}
                            sx={{
                                mt: 3,
                                mb: 2,
                                py: 1.5,
                                borderRadius: 2,
                                bgcolor: '#8B004A',
                                '&:hover': { bgcolor: '#6B0038' },
                                textTransform: 'none',
                                fontSize: '1rem'
                            }}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Войти'}
                        </Button>
                    </form>

                    <Box sx={{ textAlign: 'center', mt: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                            Нет аккаунта?{' '}
                            <RouterLink to="/register" style={{ color: '#8B004A', textDecoration: 'none', fontWeight: 500 }}>
                                Зарегистрироваться
                            </RouterLink>
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            <RouterLink to="/forgot-password" style={{ color: '#666', textDecoration: 'none', fontSize: '0.85rem' }}>
                                Забыли пароль?
                            </RouterLink>
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
}

export default Login;