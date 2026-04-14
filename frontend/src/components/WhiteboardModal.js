import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, Typography, CircularProgress, Alert,
    Button, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    OpenInNew as OpenInNewIcon,
    Draw as DrawIcon
} from '@mui/icons-material';
import axios from 'axios';

function WhiteboardModal({ open, onClose, lessonId, lessonInfo }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [boardInfo, setBoardInfo] = useState(null);

    useEffect(() => {
        if (open && lessonId) {
            fetchBoardInfo();
        }
    }, [open, lessonId]);

    const fetchBoardInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/excalidraw/board/${lessonId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setBoardInfo(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при создании доски');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenBoard = () => {
        if (boardInfo?.boardUrl) {
            window.open(boardInfo.boardUrl, '_blank', 'width=1400,height=900');
        }
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 4 } }}
        >
            <DialogTitle sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                pb: 1
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DrawIcon sx={{ color: '#8B5CF6' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Онлайн-доска
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 3 }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                ) : boardInfo && (
                    <Box>
                        {/* Информация о занятии */}
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: '#F9FAFB', 
                            borderRadius: 2,
                            mb: 3
                        }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Занятие
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {boardInfo.courseName}
                            </Typography>
                            {lessonInfo && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                    {lessonInfo.studentName} • {lessonInfo.startTime?.slice(0, 5)} - {lessonInfo.endTime?.slice(0, 5)}
                                </Typography>
                            )}
                        </Box>

                        {/* Описание */}
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                🎨 Excalidraw — это виртуальная доска для совместной работы.
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Рисуйте схемы, пишите формулы, добавляйте изображения в реальном времени вместе с учеником.
                            </Typography>
                        </Box>

                        {/* Кнопки */}
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<DrawIcon />}
                                onClick={handleOpenBoard}
                                sx={{
                                    bgcolor: '#8B5CF6',
                                    '&:hover': { bgcolor: '#7C3AED' },
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3
                                }}
                            >
                                Открыть доску
                            </Button>
                            <Button
                                variant="outlined"
                                size="large"
                                startIcon={<OpenInNewIcon />}
                                onClick={handleOpenBoard}
                                sx={{
                                    px: 3,
                                    py: 1.5,
                                    borderRadius: 3
                                }}
                            >
                                В новом окне
                            </Button>
                        </Box>

                        <Typography variant="caption" color="textSecondary" sx={{ 
                            display: 'block', 
                            textAlign: 'center', 
                            mt: 3 
                        }}>
                            Доска сохраняется автоматически. Вы можете вернуться к ней в любое время.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default WhiteboardModal;