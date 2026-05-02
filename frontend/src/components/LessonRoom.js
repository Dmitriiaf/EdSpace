import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, Typography, CircularProgress, Alert,
    Button, Chip, Tabs, Tab
} from '@mui/material';
import {
    Close as CloseIcon,
    OpenInNew as OpenInNewIcon,
    Videocam as VideocamIcon,
    Draw as DrawIcon,
    HourglassEmpty as WaitingIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

function LessonRoom({ open, onClose, lessonId, lessonInfo }) {
    const { user } = useAuth();
    const isTutor = user?.role === 'tutor';
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jitsiInfo, setJitsiInfo] = useState(null);
    const [boardInfo, setBoardInfo] = useState(null);
    const [tabValue, setTabValue] = useState(0);

    useEffect(() => {
        if (open && lessonId) {
            fetchAll();
        }
    }, [open, lessonId]);

    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [jitsiRes, boardRes] = await Promise.all([
                axiosInstance.get(`/jitsi/room/${lessonId}`),
                axiosInstance.get(`/excalidraw/room/${lessonId}`)
            ]);
            setJitsiInfo(jitsiRes.data);
            setBoardInfo(boardRes.data);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Ошибка при создании комнаты');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenJitsi = () => {
        if (jitsiInfo?.roomUrl) {
            window.open(jitsiInfo.roomUrl, '_blank', 'width=1200,height=800');
        }
    };

    const handleOpenBoard = () => {
        if (boardInfo?.roomUrl) {
            window.open(boardInfo.roomUrl, '_blank', 'width=1200,height=800');
        }
    };

    const handleOpenBoth = () => {
        if (jitsiInfo?.roomUrl) {
            window.open(jitsiInfo.roomUrl, '_blank', 'width=1200,height=800');
        }
        // Небольшая задержка для второго окна (браузеры блокируют два popup подряд)
        setTimeout(() => {
            if (boardInfo?.roomUrl) {
                window.open(boardInfo.roomUrl, '_blank', 'width=1200,height=800');
            }
        }, 1000);
    };

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
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
                    <VideocamIcon sx={{ color: '#6366F1' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Урок
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
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                        <Button variant="outlined" onClick={fetchAll}>
                            Попробовать снова
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {/* Комната ожидания для ученика */}
                        {!isTutor && jitsiInfo?.waitingRoom && (
                            <Box sx={{ 
                                textAlign: 'center', 
                                py: 3,
                                bgcolor: '#FEF3C7',
                                borderRadius: 2,
                                mb: 3
                            }}>
                                <WaitingIcon sx={{ fontSize: 48, color: '#F59E0B', mb: 2 }} />
                                <Typography variant="h6" gutterBottom sx={{ color: '#92400E' }}>
                                    Ожидание репетитора
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Репетитор ещё не начал урок. Как только он начнёт, появится кнопка для входа.
                                </Typography>
                            </Box>
                        )}

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
                                {jitsiInfo?.courseName || boardInfo?.courseName || 'Занятие'}
                            </Typography>
                            {lessonInfo && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                    {lessonInfo.startTime} - {lessonInfo.endTime}
                                </Typography>
                            )}
                        </Box>

                        {/* Открыть всё в один клик */}
                        {(!jitsiInfo?.waitingRoom || isTutor) && (
                            <Box sx={{ textAlign: 'center', mb: 3 }}>
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleOpenBoth}
                                    sx={{
                                        bgcolor: '#6366F1',
                                        '&:hover': { bgcolor: '#4F46E5' },
                                        px: 6,
                                        py: 2,
                                        borderRadius: 3,
                                        fontSize: '1.1rem'
                                    }}
                                >
                                    🚀 Начать урок (видео + доска)
                                </Button>
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                    Откроет видео и доску в двух новых окнах
                                </Typography>
                            </Box>
                        )}

                        {/* Раздельные кнопки */}
                        {(!jitsiInfo?.waitingRoom || isTutor) && (
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mb: 3 }}>
                                <Button
                                    variant="outlined"
                                    startIcon={<VideocamIcon />}
                                    onClick={handleOpenJitsi}
                                    sx={{ borderRadius: 3, textTransform: 'none' }}
                                >
                                    Только видео
                                </Button>
                                <Button
                                    variant="outlined"
                                    startIcon={<DrawIcon />}
                                    onClick={handleOpenBoard}
                                    sx={{ borderRadius: 3, textTransform: 'none', color: '#8B5CF6', borderColor: '#8B5CF6' }}
                                >
                                    Только доска
                                </Button>
                            </Box>
                        )}

                        <Typography variant="caption" color="textSecondary" sx={{ 
                            display: 'block', 
                            textAlign: 'center', 
                            mt: 2 
                        }}>
                            Видео через Jitsi Meet • Доска через Excalidraw
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default LessonRoom;