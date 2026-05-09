import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogTitle, DialogContent, IconButton,
    Box, Typography, CircularProgress, Alert,
    Button, Tabs, Tab
} from '@mui/material';
import {
    Close as CloseIcon,
    Videocam as VideocamIcon,
    HourglassEmpty as WaitingIcon,
    Draw as DrawIcon
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
        </div>
    );
}

function LessonRoom({ open, onClose, lessonId, lessonInfo }) {
    const { user } = useAuth();
    const isTutor = user?.role === 'tutor' || user?.role === 'ROLE_TUTOR';
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [jitsiInfo, setJitsiInfo] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [boardRoomName, setBoardRoomName] = useState('');

    useEffect(() => {
        if (open && lessonId) {
            fetchJitsi();
        }
    }, [open, lessonId]);

    const fetchJitsi = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get(`/jitsi/room/${lessonId}`);
            setJitsiInfo(res.data);
            // Используем boardRoomName из урока для коллаборации
            setBoardRoomName(res.data?.boardRoomName || `edspace-board-${lessonId}`);
        } catch (err) {
            console.error('Ошибка загрузки:', err);
            setError('Ошибка при создании комнаты');
        } finally {
            setLoading(false);
        }
    };

    const handleJoinVideo = () => {
        if (jitsiInfo?.roomUrl) {
            window.open(jitsiInfo.roomUrl, '_blank', 'width=1200,height=800');
        }
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

            <DialogContent sx={{ pt: 1, pb: 3, minHeight: '70vh' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Box sx={{ py: 3 }}>
                        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                        <Button variant="outlined" onClick={fetchJitsi}>
                            Попробовать снова
                        </Button>
                    </Box>
                ) : (
                    <Box>
                        {/* Информация о занятии */}
                        <Box sx={{ 
                            p: 2, 
                            bgcolor: '#F9FAFB', 
                            borderRadius: 2,
                            mb: 2
                        }}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                Занятие
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                {jitsiInfo?.courseName || 'Занятие'}
                            </Typography>
                            {lessonInfo && (
                                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                    {lessonInfo.startTime} - {lessonInfo.endTime}
                                </Typography>
                            )}
                        </Box>

                        {/* Вкладки: Видео и Доска */}
                        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)} sx={{ mb: 2 }}>
                            <Tab icon={<VideocamIcon />} label="Видео" />
                            <Tab icon={<DrawIcon />} label="Доска" />
                        </Tabs>

                        <TabPanel value={tabValue} index={0}>
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

                            {(!jitsiInfo?.waitingRoom || isTutor) && (
                                <Box sx={{ textAlign: 'center', mb: 3 }}>
                                    <Button
                                        variant="contained"
                                        size="large"
                                        startIcon={<VideocamIcon />}
                                        onClick={handleJoinVideo}
                                        sx={{
                                            bgcolor: '#6366F1',
                                            '&:hover': { bgcolor: '#4F46E5' },
                                            px: 6,
                                            py: 2,
                                            borderRadius: 3,
                                            fontSize: '1.1rem'
                                        }}
                                    >
                                        Подключиться к видеовстрече
                                    </Button>
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                        Откроется в новом окне
                                    </Typography>
                                </Box>
                            )}
                            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', display: 'block' }}>
                                Видеосвязь через Jitsi Meet
                            </Typography>
                        </TabPanel>

                        <TabPanel value={tabValue} index={1}>
                            <Box sx={{ 
                                height: '60vh', 
                                borderRadius: 2, 
                                overflow: 'hidden', 
                                border: '1px solid #E5E7EB',
                                bgcolor: '#fff'
                            }}>
                                <iframe
                                    src={`https://excalidraw.com/#room=${boardRoomName}`}
                                    style={{ width: '100%', height: '100%', border: 'none' }}
                                    title="Совместная доска"
                                />
                            </Box>
                            <Typography variant="caption" color="textSecondary" sx={{ textAlign: 'center', display: 'block', mt: 1 }}>
                                Совместная доска — репетитор и ученик видят изменения друг друга
                            </Typography>
                        </TabPanel>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
}

export default LessonRoom;