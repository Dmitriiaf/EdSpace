// ========== frontend/src/components/LessonRoom.js ==========
import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, Typography, CircularProgress, Alert,
    Button, Chip, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
    Close as CloseIcon,
    Videocam as VideocamIcon,
    Draw as DrawIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import DinoGame from './DinoGame';

const MELETO_BOARD_URL = 'https://meleto.org/board/84dc92e5-6848-4e22-a31c-d16472b248d7';

function LessonRoom({ open, onClose, lessonId, lessonInfo }) {
    const { user } = useAuth();
    const isTutor = user?.role === 'tutor' || user?.role === 'ROLE_TUTOR';
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lessonData, setLessonData] = useState(null);
    const [videoRooms, setVideoRooms] = useState([]);
    const [selectedRoomId, setSelectedRoomId] = useState('');
    const [roomSelected, setRoomSelected] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    
    useEffect(() => {
        if (open && lessonId) {
            fetchLessonData();
            if (!isTutor) {
                const interval = setInterval(checkRoomStatus, 3000);
                return () => clearInterval(interval);
            }
        }
    }, [open, lessonId]);

    const fetchLessonData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get(`/lessons/${lessonId}`);
            setLessonData(res.data);
            setRoomSelected(res.data.roomSelected || false);
            
            if (res.data.videoPlatformLink) {
                setVideoUrl(res.data.videoPlatformLink);
            }
            
            if (res.data.tutor?.id) {
                const roomsRes = await axiosInstance.get(`/video-rooms/tutor/${res.data.tutor.id}`);
                setVideoRooms(roomsRes.data || []);
                const defaultRoom = roomsRes.data?.find(r => r.isDefault);
                if (defaultRoom) setSelectedRoomId(defaultRoom.id);
            }
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Ошибка при загрузке данных урока');
        } finally {
            setLoading(false);
        }
    };

    const checkRoomStatus = async () => {
        try {
            const res = await axiosInstance.get(`/lessons/${lessonId}`);
            if (res.data.roomSelected && !roomSelected) {
                setRoomSelected(true);
                setVideoUrl(res.data.videoPlatformLink || '');
            }
        } catch (err) {
            // Тихо игнорируем ошибки polling
        }
    };

    const getSelectedRoom = () => videoRooms.find(r => r.id === selectedRoomId);

    const getVideoPlatformColor = () => {
        const platform = getSelectedRoom()?.platform;
        const colors = { JITSI: '#6366F1', ZOOM: '#2D8CFF', TELEMOST: '#FC3F1D', SKYPE: '#00AFF0', OTHER: '#6366F1' };
        return colors[platform] || '#6366F1';
    };

    const handleSelectAndStart = async () => {
        if (!selectedRoomId) return;
        const room = getSelectedRoom();
        if (!room) return;

        try {
            await axiosInstance.post(`/lessons/${lessonId}/start`);
            
            await axiosInstance.post(`/lessons/${lessonId}/select-room`, {
                videoPlatform: room.platform,
                videoPlatformLink: room.url
            });
            setRoomSelected(true);
            setVideoUrl(room.url);
            window.open(room.url, '_blank');
        } catch (err) {
            setError('Ошибка при запуске видео');
        }
    };

    const handleJoinVideo = () => {
        if (videoUrl) {
            window.open(videoUrl, '_blank');
        }
    };

    const handleOpenBoard = () => {
        window.open(MELETO_BOARD_URL, '_blank');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
            PaperProps={{ sx: { borderRadius: 4 } }}>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideocamIcon sx={{ color: getVideoPlatformColor() }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Видеозвонок</Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 1, pb: 3, minHeight: '40vh' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
                ) : error ? (
                    <Box sx={{ py: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                        <Button variant="outlined" onClick={fetchLessonData}>Попробовать снова</Button>
                    </Box>
                ) : (
                    <Box>
                        <Box sx={{ p: 2.5, bgcolor: '#F9FAFB', borderRadius: 2, mb: 3 }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>Занятие</Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                {lessonData?.course?.name || 'Занятие'}
                            </Typography>
                            {lessonInfo && (
                                <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                                    {lessonInfo.studentName || lessonInfo.tutorName} • {lessonInfo.startTime?.slice(0, 5)} - {lessonInfo.endTime?.slice(0, 5)}
                                </Typography>
                            )}
                        </Box>

                        {/* Репетитор */}
                        {isTutor && (
                            <Box sx={{ textAlign: 'center', py: 3 }}>
                                {!roomSelected ? (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 2 }}>Выберите комнату для урока</Typography>
                                        <FormControl fullWidth sx={{ mb: 3, maxWidth: 400 }}>
                                            <InputLabel>Комната</InputLabel>
                                            <Select value={selectedRoomId} onChange={e => setSelectedRoomId(e.target.value)}
                                                label="Комната" sx={{ borderRadius: '8px' }}>
                                                {videoRooms.map(room => (
                                                    <MenuItem key={room.id} value={room.id}>{room.name} ({room.platform})</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <Button variant="contained" size="large" startIcon={<VideocamIcon />}
                                                onClick={handleSelectAndStart} disabled={!selectedRoomId}
                                                sx={{ bgcolor: '#4F46E5', px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem' }}>
                                                Начать видеовстречу
                                            </Button>
                                            <Button variant="outlined" size="large" startIcon={<DrawIcon />}
                                                onClick={handleOpenBoard}
                                                sx={{ px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem' }}>
                                                Доска
                                            </Button>
                                        </Box>
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 2, color: '#065F46' }}>✅ Урок начат</Typography>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <Button variant="contained" size="large" startIcon={<VideocamIcon />}
                                                onClick={handleJoinVideo}
                                                sx={{ bgcolor: '#4F46E5', px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem' }}>
                                                Вернуться в конференцию
                                            </Button>
                                            <Button variant="outlined" size="large" startIcon={<DrawIcon />}
                                                onClick={handleOpenBoard}
                                                sx={{ px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem' }}>
                                                Доска
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}

                        {/* Ученик */}
                        {!isTutor && (
                            <Box sx={{ textAlign: 'center', py: 2 }}>
                                {!roomSelected ? (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 2, color: '#92400E' }}>
                                            ⏳ Ожидание репетитора...
                                        </Typography>
                                        <DinoGame />
                                    </>
                                ) : (
                                    <>
                                        <Typography variant="h6" sx={{ mb: 2, color: '#065F46' }}>
                                            ✅ Репетитор начал урок!
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <Button variant="contained" size="large" startIcon={<VideocamIcon />}
                                                onClick={handleJoinVideo}
                                                sx={{ bgcolor: '#10B981', px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem' }}>
                                                Подключиться
                                            </Button>
                                            <Button variant="outlined" size="large" startIcon={<DrawIcon />}
                                                onClick={handleOpenBoard}
                                                sx={{ px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem' }}>
                                                Доска
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default LessonRoom;