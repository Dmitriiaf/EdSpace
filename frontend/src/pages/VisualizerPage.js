import React from 'react';
import { Box, Typography } from '@mui/material';
import { PageContainer } from '../styles/shared';
import AlgorithmVisualizer from '../components/AlgorithmVisualizer';

export default function VisualizerPage() {
    return (
        <PageContainer sx={{ px: { xs: 2, sm: 3 }, bgcolor: '#FAFAFA', minHeight: '100vh' }}>
            <Box sx={{ mb: 4 }}>
                <Typography sx={{
                    fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                    color: '#141414', letterSpacing: '-0.02em', mb: 0.5,
                }}>
                    🧠 Визуализатор
                </Typography>
                <Typography sx={{ color: '#999', fontSize: '0.9rem' }}>
                    Пошаговое объяснение работы функций и алгоритмов
                </Typography>
            </Box>

            <AlgorithmVisualizer />
        </PageContainer>
    );
}