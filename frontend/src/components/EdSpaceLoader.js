import React from 'react';
import { Box, Typography } from '@mui/material';
import { keyframes } from '@mui/material/styles';

const pulse = keyframes`
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.6; }
`;

const ripple = keyframes`
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2); opacity: 0; }
`;

const slideUp = keyframes`
    0% { transform: translateY(10px); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
`;

function EdSpaceLoader({ text = 'Загрузка...', size = 60 }) {
    return (
        <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            <Box sx={{ position: 'relative', width: size, height: size, mb: 2 }}>
                {/* Пульсирующее кольцо */}
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '2px solid rgba(79,70,229,0.3)',
                    animation: `${ripple} 2s ease-out infinite`,
                }} />
                <Box sx={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: '50%',
                    border: '2px solid rgba(79,70,229,0.2)',
                    animation: `${ripple} 2s ease-out 0.6s infinite`,
                }} />
                {/* Центральный логотип */}
                <Box sx={{
                    position: 'absolute',
                    inset: 4,
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    animation: `${pulse} 1.5s ease-in-out infinite`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Typography sx={{ color: '#fff', fontSize: size * 0.35, fontWeight: 700 }}>E</Typography>
                </Box>
            </Box>
            <Typography sx={{ 
                color: '#8892B0', 
                fontSize: 15, 
                fontWeight: 500,
                animation: `${slideUp} 0.4s ease-out`,
                letterSpacing: '-0.3px'
            }}>
                {text}
            </Typography>
        </Box>
    );
}

export default EdSpaceLoader;