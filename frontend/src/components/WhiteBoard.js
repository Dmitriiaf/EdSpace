import React from 'react';
import { Box, Typography } from '@mui/material';

function WhiteBoard({ roomName, username }) {
    if (!roomName) return null;
    
    const cleanRoom = roomName.replace(/[^a-zA-Z0-9_-]/g, '');
    
    return (
        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 1, bgcolor: '#F5F3FF', borderBottom: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: '13px', color: '#7C3AED' }}>
                    🎨 Excalidraw — {username}
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                    Комната: <b>{cleanRoom}</b>
                </Typography>
            </Box>
            <iframe
                src={`/excalidraw/?room=${cleanRoom},${encodeURIComponent(username)}`}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="clipboard-write"
                title="excalidraw"
            />
        </Box>
    );
}

export default WhiteBoard;