import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Box, Typography, Button } from '@mui/material';
import { Close as CloseIcon, Draw as DrawIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';

function WhiteboardModal({ open, onClose, roomName, username }) {
    if (!roomName) return null;
    
    const cleanRoom = roomName.replace(/[^a-zA-Z0-9_-]/g, '');
    const boardUrl = `/excalidraw/?room=${cleanRoom},${encodeURIComponent(username)}`;
    
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
        >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DrawIcon sx={{ color: '#8B5CF6' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>Совместная доска</Typography>
                </Box>
                <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
            </DialogTitle>
            <DialogContent sx={{ textAlign: 'center', py: 4 }}>
                <DrawIcon sx={{ fontSize: 64, color: '#7C3AED', mb: 2 }} />
                <Typography sx={{ fontSize: '16px', fontWeight: 600, mb: 1 }}>
                    Доска готова
                </Typography>
                <Typography sx={{ color: '#6B7280', mb: 3 }}>
                    Комната: <b>{cleanRoom}</b> • Участник: <b>{username}</b>
                </Typography>
                <Button
                    variant="contained"
                    size="large"
                    startIcon={<OpenInNewIcon />}
                    onClick={() => window.open(boardUrl, '_blank')}
                    sx={{ bgcolor: '#7C3AED', '&:hover': { bgcolor: '#6D28D9' }, borderRadius: '10px', px: 4, py: 1.5 }}
                >
                    Открыть доску
                </Button>
            </DialogContent>
            <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                    Доска откроется в новой вкладке
                </Typography>
            </DialogActions>
        </Dialog>
    );
}

export default WhiteboardModal;