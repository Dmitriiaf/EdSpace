import React, { useState, useEffect } from 'react';
import { Drawer, Box, IconButton, Fab, Typography } from '@mui/material';
import {
    Chat as ChatIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import ChatPanel from './ChatPanel';
import axiosInstance from '../api/axiosConfig';

const PURPLE = '#7B5CFA';
const INK = '#141414';
const POLL_MS = 10000;

export default function ChatDrawer() {
    const [open, setOpen] = useState(false);
    const [unread, setUnread] = useState(0);

    useEffect(() => {
        let cancelled = false;
        const loadUnread = async () => {
            try {
                const res = await axiosInstance.get('/chat/unread-count');
                if (!cancelled) setUnread(res.data?.count || 0);
            } catch (e) {
                // тихо
            }
        };
        loadUnread();
        const interval = setInterval(() => {
            if (document.visibilityState === 'visible') loadUnread();
        }, POLL_MS);
        return () => { cancelled = true; clearInterval(interval); };
    }, [open]);

    return (
        <>
            <Fab
                variant="extended"
                onClick={() => setOpen(true)}
                sx={{
                    position: 'fixed',
                    bottom: 24,
                    right: 24,
                    bgcolor: PURPLE,
                    color: '#FFF',
                    zIndex: 1200,
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    px: 2.5,
                    py: 0.5,
                    textTransform: 'none',
                    fontFamily: '"Inter", "Segoe UI", sans-serif',
                    display: open ? 'none' : 'flex',
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                        bgcolor: '#6B4BEB',
                        transform: 'translateY(-2px)',
                    },
                    animation: 'chatPulse 2.5s ease-in-out infinite',
                    '@keyframes chatPulse': {
                        '0%, 100%': { boxShadow: '0 8px 24px rgba(123,92,250,0.5)' },
                        '50%': { boxShadow: '0 8px 40px rgba(123,92,250,0.95)' },
                    },
                }}
            >
                <ChatIcon sx={{ mr: 1, fontSize: 20 }} />
                Написать
                {unread > 0 && (
                    <Box
                        sx={{
                            ml: 1.25,
                            bgcolor: '#EF4444',
                            color: '#FFF',
                            borderRadius: '50%',
                            minWidth: 22, height: 22,
                            px: 0.5,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.7rem', fontWeight: 800,
                        }}
                    >
                        {unread > 9 ? '9+' : unread}
                    </Box>
                )}
            </Fab>

            <Drawer
                anchor="right"
                open={open}
                onClose={() => setOpen(false)}
                PaperProps={{
                    sx: {
                        width: { xs: '100%', sm: 420 },
                        maxWidth: '100%',
                        bgcolor: '#FAFAFA',
                    },
                }}
            >
                <Box sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    px: 2,
                    py: 1.5,
                    borderBottom: '1px solid #EAEAEA',
                    bgcolor: '#FFF',
                }}>
                    <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.95rem' }}>
                        Сообщения
                    </Typography>
                    <IconButton onClick={() => setOpen(false)} size="small">
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
                <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <ChatPanel />
                </Box>
            </Drawer>
        </>
    );
}