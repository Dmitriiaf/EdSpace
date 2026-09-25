import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Avatar, TextField, Button, Paper,
    CircularProgress, Badge,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Send as SendIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';

const Container = styled(Paper)({
    borderRadius: 20,
    overflow: 'hidden',
    border: '1px solid #E2E8F0',
    boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    display: 'flex',
    height: 480,
    marginTop: 0,
});

const POLL_MS = 3000;

function ChatPanel() {
    const { user } = useAuth();
    const isTutor = user?.role === 'tutor' || user?.role === 'ROLE_TUTOR';

    const [dialogs, setDialogs] = useState([]);
    const [myTutor, setMyTutor] = useState(null);
    const [selected, setSelected] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loadingDialogs, setLoadingDialogs] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef(null);

    const loadDialogs = useCallback(async () => {
        try {
            if (isTutor) {
                const res = await axiosInstance.get('/chat/dialogs');
                setDialogs(res.data || []);
                setSelected(prev => {
                    if (prev) return prev;
                    const list = res.data || [];
                    return list.length > 0
                        ? { id: list[0].studentId, name: list[0].studentName, avatar: list[0].avatar }
                        : null;
                });
            } else {
                const res = await axiosInstance.get('/chat/my-tutor');
                if (res.data && res.data.tutorId) {
                    setMyTutor(res.data);
                    setSelected({
                        id: res.data.tutorId,
                        name: res.data.tutorName,
                        avatar: res.data.avatar,
                    });
                } else {
                    setMyTutor(null);
                }
            }
        } catch (err) {
            console.error('Ошибка загрузки диалогов:', err);
        } finally {
            setLoadingDialogs(false);
        }
    }, [isTutor]);

    const loadMessages = useCallback(async (silent = false) => {
        if (!selected?.id) return;
        if (!silent) setLoadingMessages(true);
        try {
            const res = await axiosInstance.get(`/chat/messages/${selected.id}`);
            setMessages(res.data || []);
        } catch (err) {
            console.error('Ошибка загрузки сообщений:', err);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }, [selected]);

    useEffect(() => {
        loadDialogs();
    }, [loadDialogs]);

    useEffect(() => {
        if (selected?.id) loadMessages();
    }, [selected?.id, loadMessages]);

    useEffect(() => {
        if (!selected?.id) return;
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') {
                loadMessages(true);
                loadDialogs();
            }
        }, POLL_MS);
        return () => clearInterval(interval);
    }, [selected?.id, loadMessages, loadDialogs]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleSend = async () => {
        const text = input.trim();
        if (!text || !selected?.id || sending) return;
        setSending(true);

        const tempId = Date.now();
        const now = new Date();
        setMessages(prev => [...prev, {
            id: tempId,
            senderId: user.id,
            recipientId: selected.id,
            text,
            time: format(now, 'HH:mm'),
            fromMe: true,
            isRead: false,
        }]);
        setInput('');

        try {
            await axiosInstance.post('/chat/send', {
                recipientId: selected.id,
                text,
            });
            loadMessages(true);
            loadDialogs();
        } catch (err) {
            console.error('Ошибка отправки:', err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
            setInput(text);
        } finally {
            setSending(false);
        }
    };

    if (loadingDialogs) {
        return (
            <Container sx={{ alignItems: 'center', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (!isTutor && !myTutor) {
        return (
            <Container sx={{ alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#94A3B8' }}>Чат недоступен</Typography>
            </Container>
        );
    }

    return (
        <Container>
            {isTutor && (
                <Box sx={{ width: 280, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC', flexShrink: 0 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0' }}>
                        <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>💬 Чаты</Typography>
                    </Box>
                    <Box sx={{ overflow: 'auto', maxHeight: 430 }}>
                        {dialogs.length === 0 && (
                            <Typography sx={{ p: 2, color: '#94A3B8', fontSize: '13px' }}>
                                Нет учеников
                            </Typography>
                        )}
                        {dialogs.map(d => (
                            <Box
                                key={d.studentId}
                                onClick={() => setSelected({
                                    id: d.studentId,
                                    name: d.studentName,
                                    avatar: d.avatar,
                                })}
                                sx={{
                                    p: 2, cursor: 'pointer', display: 'flex',
                                    alignItems: 'center', gap: 1.5,
                                    bgcolor: selected?.id === d.studentId ? '#EEF2FF' : 'transparent',
                                    '&:hover': {
                                        bgcolor: selected?.id === d.studentId ? '#EEF2FF' : '#F1F5F9',
                                    },
                                    borderLeft: selected?.id === d.studentId
                                        ? '3px solid #4F46E5'
                                        : '3px solid transparent',
                                }}
                            >
                                <Badge
                                    color="error"
                                    badgeContent={d.unread > 0 ? d.unread : 0}
                                    invisible={d.unread === 0}
                                >
                                    <Avatar sx={{ bgcolor: '#4F46E5', width: 40, height: 40, fontSize: 16 }}>
                                        {d.avatar}
                                    </Avatar>
                                </Badge>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontWeight: 600, fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {d.studentName}
                                        </Typography>
                                        <Typography sx={{ fontSize: '10px', color: '#94A3B8', ml: 1, flexShrink: 0 }}>
                                            {d.lastTime}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '12px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {d.lastMessage || 'Нет сообщений'}
                                    </Typography>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Box>
            )}

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar sx={{ bgcolor: '#4F46E5', width: 36, height: 36, fontSize: 15 }}>
                        {selected?.avatar || '?'}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
                        {selected?.name || 'Чат'}
                    </Typography>
                </Box>

                <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#FFFFFF' }}>
                    {loadingMessages && messages.length === 0 ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress size={24} />
                        </Box>
                    ) : messages.length === 0 ? (
                        <Typography sx={{ textAlign: 'center', color: '#94A3B8', fontSize: '13px', py: 4 }}>
                            Нет сообщений. Напишите первым.
                        </Typography>
                    ) : (
                        messages.map(msg => (
                            <Box key={msg.id} sx={{
                                display: 'flex',
                                justifyContent: msg.fromMe ? 'flex-end' : 'flex-start',
                                mb: 1.5,
                            }}>
                                <Box sx={{
                                    maxWidth: '70%',
                                    p: 1.5,
                                    borderRadius: 3,
                                    bgcolor: msg.fromMe ? '#4F46E5' : '#F1F5F9',
                                    color: msg.fromMe ? '#fff' : '#1E293B',
                                    fontSize: '13px',
                                    wordBreak: 'break-word',
                                }}>
                                    {msg.text}
                                    <Typography sx={{ fontSize: '10px', opacity: 0.7, mt: 0.5, textAlign: 'right' }}>
                                        {msg.time}
                                    </Typography>
                                </Box>
                            </Box>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </Box>

                <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 1 }}>
                    <TextField
                        fullWidth size="small"
                        placeholder="Написать сообщение..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                        disabled={!selected}
                    />
                    <Button
                        variant="contained"
                        onClick={handleSend}
                        disabled={!input.trim() || !selected || sending}
                        sx={{ bgcolor: '#4F46E5', borderRadius: 3, minWidth: 'auto', '&:hover': { bgcolor: '#3730A3' } }}
                    >
                        <SendIcon sx={{ fontSize: 20 }} />
                    </Button>
                </Box>
            </Box>
        </Container>
    );
}

export default ChatPanel;