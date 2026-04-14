import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, Typography, CircularProgress, Alert,
    Button, Chip
} from '@mui/material';
import {
    Close as CloseIcon,
    OpenInNew as OpenInNewIcon,
    Videocam as VideocamIcon
} from '@mui/icons-material';
import axios from 'axios';

function VideoCallModal({ open, onClose, lessonId, lessonInfo }) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [roomInfo, setRoomInfo] = useState(null);

    useEffect(() => {
        if (open && lessonId) {
            fetchRoomInfo();
        }
    }, [open, lessonId]);

    const fetchRoomInfo = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `http://localhost:8080/api/jitsi/room/${lessonId}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setRoomInfo(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Ошибка при создании комнаты');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenInNewTab = () => {
        if (roomInfo?.roomUrl) {
            window.open(roomInfo.roomUrl, '_blank');
        }
    };

    const handleJoinCall = () => {
        if (roomInfo?.roomUrl) {
            // Открываем звонок в новом окне
            window.open(roomInfo.roomUrl, '_blank', 'width=1200,height=800');
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
                    <VideocamIcon sx={{ color: '#6366F1' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Видеозвонок
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
                ) : roomInfo && (
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
                                {roomInfo.courseName}
                            </Typography>
                            {lessonInfo && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                    {lessonInfo.studentName} • {lessonInfo.startTime?.slice(0, 5)} - {lessonInfo.endTime?.slice(0, 5)}
                                </Typography>
                            )}
                        </Box>

                        {/* Информация о подключении */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Вы подключаетесь как
                            </Typography>
                            <Chip 
                                label={roomInfo.displayName}
                                color="primary"
                                sx={{ fontWeight: 500 }}
                            />
                        </Box>

                        {/* Кнопки */}
                        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<VideocamIcon />}
                                onClick={handleJoinCall}
                                sx={{
                                    bgcolor: '#6366F1',
                                    '&:hover': { bgcolor: '#4F46E5' },
                                    px: 4,
                                    py: 1.5,
                                    borderRadius: 3
                                }}
                            >
                                Присоединиться к звонку
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
                            Звонок работает через Jitsi Meet. При первом использовании разрешите доступ к камере и микрофону.
                        </Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default VideoCallModal;