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
import axiosInstance from '../api/axiosConfig';

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
            const response = await axiosInstance.get(`/excalidraw/room/${lessonId}`);
            setBoardInfo(response.data);
        } catch (err) {
            console.error('Ошибка загрузки доски:', err);
            setError(err.response?.data?.error || 'Ошибка при создании доски');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenInNewTab = () => {
        if (boardInfo?.roomUrl) {
            window.open(boardInfo.roomUrl, '_blank');
        }
    };

    const handleJoinBoard = () => {
        if (boardInfo?.roomUrl) {
            window.open(boardInfo.roomUrl, '_blank', 'width=1200,height=800');
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
                                {boardInfo.courseName || 'Занятие'}
                            </Typography>
                            {lessonInfo && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                    {lessonInfo.studentName || lessonInfo.tutorName} • {lessonInfo.startTime?.slice(0, 5)} - {lessonInfo.endTime?.slice(0, 5)}
                                </Typography>
                            )}
                        </Box>

                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Вы подключаетесь как
                            </Typography>
                            <Chip 
                                label={boardInfo.displayName || 'Участник'}
                                color="secondary"
                                sx={{ fontWeight: 500 }}
                            />
                        </Box>

                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<DrawIcon />}
                                onClick={handleJoinBoard}
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
                                onClick={handleOpenInNewTab}
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
                            Доска работает через Excalidraw.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default WhiteboardModal;