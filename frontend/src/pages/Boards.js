import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Card, CardContent, CardActions,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, FormControl, InputLabel, Select, MenuItem,
    CircularProgress, Alert, Chip, IconButton, Grid
} from '@mui/material';
import {
    Add as AddIcon,
    OpenInNew as OpenInNewIcon,
    Archive as ArchiveIcon,
    Delete as DeleteIcon,
    Draw as DrawIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

function Boards() {
    const { user } = useAuth();
    const isTutor = user?.role === 'TUTOR' || user?.role === 'ROLE_TUTOR' || user?.role === 'tutor';    
    const [boards, setBoards] = useState([]);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openCreate, setOpenCreate] = useState(false);
    const [newBoard, setNewBoard] = useState({ studentId: '', title: '' });

    useEffect(() => {
        loadBoards();
        if (isTutor) loadStudents();
    }, []);

    const loadBoards = async () => {
        setLoading(true);
        try {
            const endpoint = isTutor ? '/boards/tutor' : '/boards/student';
            const res = await axiosInstance.get(endpoint);
            setBoards(res.data || []);
        } catch (err) {
            setError('Ошибка загрузки досок');
        } finally {
            setLoading(false);
        }
    };

    const loadStudents = async () => {
        try {
            const res = await axiosInstance.get(`/students/tutor/${user.id}`);
            setStudents(res.data || []);
        } catch (err) {
            console.error('Ошибка загрузки учеников:', err);
        }
    };

    const handleCreate = async () => {
        if (!newBoard.studentId) return;
        try {
            await axiosInstance.post('/boards', {
                studentId: parseInt(newBoard.studentId),
                title: newBoard.title || 'Новая доска'
            });
            setOpenCreate(false);
            setNewBoard({ studentId: '', title: '' });
            loadBoards();
        } catch (err) {
            setError('Ошибка создания доски');
        }
    };

    const handleArchive = async (id) => {
        try {
            await axiosInstance.put(`/boards/${id}/archive`);
            loadBoards();
        } catch (err) {
            setError('Ошибка архивации доски');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Удалить доску навсегда?')) return;
        try {
            await axiosInstance.delete(`/boards/${id}`);
            loadBoards();
        } catch (err) {
            setError('Ошибка удаления доски');
        }
    };

    const handleOpen = (roomUrl) => {
        window.open(roomUrl, '_blank', 'width=1200,height=800');
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    🎨 Онлайн-доски
                </Typography>
                {isTutor && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setOpenCreate(true)}
                        sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
                    >
                        Создать доску
                    </Button>
                )}
            </Box>

            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {boards.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                    <DrawIcon sx={{ fontSize: 64, color: '#D1D5DB', mb: 2 }} />
                    <Typography variant="h6" color="textSecondary" gutterBottom>
                        Нет активных досок
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        {isTutor
                            ? 'Создайте доску для совместной работы с учеником'
                            : 'Репетитор создаст доску и вы увидите её здесь'}
                    </Typography>
                </Box>
            ) : (
                <Grid container spacing={2}>
                    {boards.map(board => (
                        <Grid item xs={12} sm={6} md={4} key={board.id}>
                            <Card sx={{
                                borderLeft: 4,
                                borderColor: '#8B5CF6',
                                transition: 'transform 0.2s',
                                '&:hover': { transform: 'translateY(-2px)' }
                            }}>
                                <CardContent>
                                    <Typography variant="h6" gutterBottom noWrap>
                                        {board.title}
                                    </Typography>
                                    <Chip
                                        label={isTutor ? board.studentName : board.tutorName}
                                        size="small"
                                        variant="outlined"
                                        sx={{ mb: 1 }}
                                    />
                                    <Typography variant="caption" color="textSecondary" display="block">
                                        Создана: {new Date(board.createdAt).toLocaleString('ru')}
                                    </Typography>
                                </CardContent>
                                <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<OpenInNewIcon />}
                                        onClick={() => handleOpen(board.roomUrl)}
                                        sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
                                    >
                                        Открыть
                                    </Button>
                                    {isTutor && (
                                        <>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleArchive(board.id)}
                                                title="Архивировать"
                                            >
                                                <ArchiveIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(board.id)}
                                                title="Удалить"
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </>
                                    )}
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            {/* Диалог создания доски */}
            <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Создать новую доску</DialogTitle>
                <DialogContent>
                    <Box sx={{ pt: 2 }}>
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel>Ученик</InputLabel>
                            <Select
                                value={newBoard.studentId}
                                onChange={(e) => setNewBoard({ ...newBoard, studentId: e.target.value })}
                                label="Ученик"
                            >
                                {students.map(s => (
                                    <MenuItem key={s.id} value={s.id}>{s.fullName}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Название доски"
                            value={newBoard.title}
                            onChange={(e) => setNewBoard({ ...newBoard, title: e.target.value })}
                            placeholder="Например: Подготовка к ЕГЭ"
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenCreate(false)}>Отмена</Button>
                    <Button
                        onClick={handleCreate}
                        variant="contained"
                        disabled={!newBoard.studentId}
                    >
                        Создать
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Boards;