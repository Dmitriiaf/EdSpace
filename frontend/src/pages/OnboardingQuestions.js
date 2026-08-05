import React, { useState } from 'react';
import {
    Box, Typography, Button, FormControl, InputLabel, Select, MenuItem, Chip, TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const Container = styled(Box)({
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    padding: 24,
});

const Card = styled(Box)({
    background: '#FFFFFF',
    borderRadius: 24,
    padding: '48px 40px',
    maxWidth: 500,
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
});

const subjects = [
    'Математика', 'Информатика', 'Физика', 'Русский язык', 'Английский язык',
    'Обществознание', 'История', 'Биология', 'Химия', 'Литература', 'География'
];

const OnboardingQuestions = () => {
    const { user } = useAuth();
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [studentsCount, setStudentsCount] = useState('');
    const [experience, setExperience] = useState('');
    const [source, setSource] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await axiosInstance.put(`/tutors/${user.id}`, {
                subjects: selectedSubjects.join(','),
                studentsCount,
                experience,
                source,
                password: password || undefined,
                onboardingCompleted: true
            });
        } catch (err) {
            console.error('Ошибка сохранения анкеты:', err);
        } finally {
            setLoading(false);
            window.location.href = '/dashboard';
        }
    };

    const handleSkip = () => {
        window.location.href = '/dashboard';
    };

    return (
        <Container>
            <Card>
                <Typography sx={{ fontSize: '1.5rem', fontWeight: 700, color: '#1F2937', mb: 1, textAlign: 'center' }}>
                    👋 Расскажите о себе
                </Typography>
                <Typography sx={{ color: '#6B7280', textAlign: 'center', mb: 4, fontSize: '0.95rem' }}>
                    Это поможет нам сделать платформу лучше
                </Typography>

                <Typography sx={{ fontWeight: 600, color: '#1F2937', mb: 1, fontSize: '0.9rem' }}>
                    Какие предметы вы преподаёте?
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                    {subjects.map(sub => (
                        <Chip
                            key={sub}
                            label={sub}
                            onClick={() => {
                                setSelectedSubjects(prev =>
                                    prev.includes(sub) ? prev.filter(s => s !== sub) : [...prev, sub]
                                );
                            }}
                            sx={{
                                bgcolor: selectedSubjects.includes(sub) ? '#4F46E5' : '#F3F4F6',
                                color: selectedSubjects.includes(sub) ? '#FFFFFF' : '#6B7280',
                                fontWeight: 500,
                                borderRadius: '8px',
                                '&:hover': { bgcolor: selectedSubjects.includes(sub) ? '#4338CA' : '#E5E7EB' },
                            }}
                        />
                    ))}
                </Box>

                <TextField
                    fullWidth
                    label="Придумайте пароль для входа по email"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Необязательно, если будете входить через Яндекс"
                    sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                />

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Сколько у вас учеников?</InputLabel>
                    <Select value={studentsCount} onChange={(e) => setStudentsCount(e.target.value)} label="Сколько у вас учеников?"
                        sx={{ borderRadius: '10px' }}>
                        <MenuItem value="1-5">1-5</MenuItem>
                        <MenuItem value="6-15">6-15</MenuItem>
                        <MenuItem value="16-30">16-30</MenuItem>
                        <MenuItem value="30+">30+</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 3 }}>
                    <InputLabel>Опыт преподавания</InputLabel>
                    <Select value={experience} onChange={(e) => setExperience(e.target.value)} label="Опыт преподавания"
                        sx={{ borderRadius: '10px' }}>
                        <MenuItem value="less-1">Менее 1 года</MenuItem>
                        <MenuItem value="1-3">1-3 года</MenuItem>
                        <MenuItem value="3-5">3-5 лет</MenuItem>
                        <MenuItem value="5+">Более 5 лет</MenuItem>
                    </Select>
                </FormControl>

                <FormControl fullWidth sx={{ mb: 4 }}>
                    <InputLabel>Как узнали о платформе?</InputLabel>
                    <Select value={source} onChange={(e) => setSource(e.target.value)} label="Как узнали о платформе?"
                        sx={{ borderRadius: '10px' }}>
                        <MenuItem value="search">Поиск в интернете</MenuItem>
                        <MenuItem value="social">Социальные сети</MenuItem>
                        <MenuItem value="friends">Рекомендации коллег</MenuItem>
                        <MenuItem value="ads">Реклама</MenuItem>
                        <MenuItem value="other">Другое</MenuItem>
                    </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button fullWidth variant="outlined" onClick={handleSkip}
                        sx={{ borderRadius: '14px', textTransform: 'none', color: '#6B7280', borderColor: '#E5E7EB' }}>
                        Пропустить
                    </Button>
                    <Button fullWidth variant="contained" onClick={handleSubmit} disabled={loading}
                        sx={{ borderRadius: '14px', textTransform: 'none', bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                        {loading ? 'Сохранение...' : 'Продолжить'}
                    </Button>
                </Box>
            </Card>
        </Container>
    );
};

export default OnboardingQuestions;