import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box, Typography, Avatar, TextField, Button, Paper,
    CircularProgress, Badge, IconButton, Popover, Tooltip,
    Dialog, DialogContent, IconButton as MuiIconButton,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
    Send as SendIcon,
    AttachFile as AttachIcon,
    EmojiEmotions as EmojiIcon,
    Close as CloseIcon,
    DoneAll as DoneAllIcon,
    Done as DoneIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';

const Container = styled(Paper)({
    borderRadius: 0,
    overflow: 'hidden',
    border: 'none',
    boxShadow: 'none',
    display: 'flex',
    height: '100%',
    minHeight: 560,
    marginTop: 0,
});

const POLL_MS = 3000;

const EMOJI_SET = [
    '😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰',
    '😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥳','😏','😒',
    '😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬',
    '👍','👎','👌','✌️','🤞','🤝','🙏','👏','🙌','💪','🔥','⭐','❤️','💔','✅','❌',
    '🎉','🎊','🎓','📚','📝','💡','⚡','🚀','🎯','🏆','🎮','🎨','🎵','☕','🍕','🍎',
];

function ChatPanel({ onRead }) {
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
    const [emojiAnchor, setEmojiAnchor] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoDialogOpen, setPhotoDialogOpen] = useState(false);
    const [zoomImage, setZoomImage] = useState(null);

    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

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
            if (onRead) onRead();
        } catch (err) {
            console.error('Ошибка загрузки сообщений:', err);
        } finally {
            if (!silent) setLoadingMessages(false);
        }
    }, [selected, onRead]);

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

    const handleFilePicked = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            alert('Только изображения');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            alert('Максимум 5 МБ');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            setPhotoPreview({ file, dataUrl: reader.result });
            setPhotoDialogOpen(true);
        };
        reader.readAsDataURL(file);
        e.target.value = '';
    };

    const handleSendPhoto = async () => {
        if (!photoPreview?.file || !selected?.id || sending) return;
        setSending(true);

        const caption = input.trim();
        const formData = new FormData();
        formData.append('file', photoPreview.file);
        formData.append('text', caption);
        formData.append('recipientId', selected.id);

        try {
            await axiosInstance.post('/chat/send-photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setInput('');
            setPhotoPreview(null);
            setPhotoDialogOpen(false);
            loadMessages(true);
            loadDialogs();
        } catch (err) {
            alert('Ошибка: ' + (err.response?.data?.error || err.message));
        } finally {
            setSending(false);
        }
    };

    const handleEmojiClick = (emoji) => {
        setInput(prev => prev + emoji);
        setEmojiAnchor(null);
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
        <>
            <Container>
                {isTutor && (
                    <Box sx={{ width: 280, borderRight: '1px solid #E2E8F0', bgcolor: '#F8FAFC', flexShrink: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', flexShrink: 0 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>💬 Чаты</Typography>
                        </Box>
                        <Box sx={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
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
                                        <Avatar src={d.avatar} sx={{ bgcolor: '#4F46E5', width: 40, height: 40, fontSize: 16 }}>
                                            {d.studentName?.charAt(0) || '?'}
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

                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 1.5, flexShrink: 0 }}>
                        <Avatar src={selected?.avatar} sx={{ bgcolor: '#4F46E5', width: 36, height: 36, fontSize: 15 }}>
                            {selected?.name?.charAt(0) || '?'}
                        </Avatar>
                        <Typography sx={{ fontWeight: 600, fontSize: '15px' }}>
                            {selected?.name || 'Чат'}
                        </Typography>
                    </Box>

                    <Box sx={{ flex: 1, p: 2, overflow: 'auto', bgcolor: '#FFFFFF', minHeight: 0 }}>
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
                                        p: msg.attachmentUrl ? 0.5 : 1.5,
                                        borderRadius: 3,
                                        bgcolor: msg.fromMe ? '#4F46E5' : '#F1F5F9',
                                        color: msg.fromMe ? '#fff' : '#1E293B',
                                        fontSize: '13px',
                                        wordBreak: 'break-word',
                                        overflow: 'hidden',
                                    }}>
                                        {msg.attachmentUrl && (
                                            <Box
                                                component="img"
                                                src={msg.attachmentUrl}
                                                alt="photo"
                                                onClick={() => setZoomImage(msg.attachmentUrl)}
                                                sx={{
                                                    maxWidth: 240,
                                                    maxHeight: 240,
                                                    borderRadius: 2,
                                                    cursor: 'pointer',
                                                    display: 'block',
                                                    mb: msg.text ? 1 : 0,
                                                }}
                                            />
                                        )}
                                        {msg.text && (() => {
                                            const isCode = msg.text.includes('\n') || /\b(for|if|def|while|import|from)\b/.test(msg.text);
                                            return (
                                                <Box sx={{
                                                    whiteSpace: 'pre-wrap',
                                                    fontFamily: isCode ? 'monospace' : 'inherit',
                                                    fontSize: isCode ? '12px' : '13px',
                                                    bgcolor: isCode ? (msg.fromMe ? 'rgba(0,0,0,0.15)' : '#E2E8F0') : 'transparent',
                                                    borderRadius: isCode ? 1.5 : 0,
                                                    p: isCode ? 1 : 0,
                                                    lineHeight: 1.5,
                                                }}>
                                                    {msg.text}
                                                </Box>
                                            );
                                        })()}
                                        <Box sx={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'flex-end',
                                            gap: 0.5,
                                            mt: 0.5,
                                            px: msg.attachmentUrl ? 1 : 0,
                                            pb: msg.attachmentUrl ? 0.5 : 0,
                                        }}>
                                            <Typography sx={{ fontSize: '10px', opacity: 0.7 }}>
                                                {msg.time}
                                            </Typography>
                                            {msg.fromMe && (
                                                msg.isRead
                                                    ? <DoneAllIcon sx={{ fontSize: 14, opacity: 0.9 }} />
                                                    : <DoneIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                                            )}
                                        </Box>
                                    </Box>
                                </Box>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </Box>

                    <Box sx={{ p: 2, borderTop: '1px solid #E2E8F0', display: 'flex', gap: 1, alignItems: 'center', flexShrink: 0 }}>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFilePicked}
                        />
                        <Tooltip title="Прикрепить фото">
                            <IconButton
                                size="small"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={!selected}
                                sx={{ color: '#64748B' }}
                            >
                                <AttachIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Эмодзи">
                            <IconButton
                                size="small"
                                onClick={(e) => setEmojiAnchor(e.currentTarget)}
                                disabled={!selected}
                                sx={{ color: '#64748B' }}
                            >
                                <EmojiIcon />
                            </IconButton>
                        </Tooltip>

                        <Popover
                            open={Boolean(emojiAnchor)}
                            anchorEl={emojiAnchor}
                            onClose={() => setEmojiAnchor(null)}
                            anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                        >
                            <Box sx={{
                                p: 1, width: 280, maxHeight: 240, overflow: 'auto',
                                display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 0.5,
                            }}>
                                {EMOJI_SET.map(e => (
                                    <Box
                                        key={e}
                                        onClick={() => handleEmojiClick(e)}
                                        sx={{
                                            fontSize: 22, textAlign: 'center', cursor: 'pointer',
                                            borderRadius: 1, p: 0.3,
                                            '&:hover': { bgcolor: '#F1F5F9' },
                                        }}
                                    >
                                        {e}
                                    </Box>
                                ))}
                            </Box>
                        </Popover>

                        <TextField
                            fullWidth size="small"
                            multiline
                            maxRows={6}
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

            {/* Диалог подтверждения фото */}
            <Dialog open={photoDialogOpen} onClose={() => setPhotoDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogContent sx={{ p: 2, textAlign: 'center' }}>
                    {photoPreview?.dataUrl && (
                        <Box
                            component="img"
                            src={photoPreview.dataUrl}
                            alt="preview"
                            sx={{ maxWidth: '100%', maxHeight: 320, borderRadius: 2, mb: 2 }}
                        />
                    )}
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Button onClick={() => { setPhotoPreview(null); setPhotoDialogOpen(false); }}>
                            Отмена
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleSendPhoto}
                            disabled={sending}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#3730A3' } }}
                        >
                            {sending ? 'Отправка…' : 'Отправить'}
                        </Button>
                    </Box>
                </DialogContent>
            </Dialog>

            {/* Просмотр фото на весь экран */}
            <Dialog open={!!zoomImage} onClose={() => setZoomImage(null)} maxWidth="lg">
                <Box sx={{ position: 'relative' }}>
                    <MuiIconButton
                        onClick={() => setZoomImage(null)}
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: '#fff', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                    >
                        <CloseIcon />
                    </MuiIconButton>
                    {zoomImage && (
                        <Box
                            component="img"
                            src={zoomImage}
                            alt="zoom"
                            sx={{ maxWidth: '90vw', maxHeight: '90vh', display: 'block' }}
                        />
                    )}
                </Box>
            </Dialog>
        </>
    );
}

export default ChatPanel;