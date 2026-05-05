import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import { Assignment as AssignmentIcon, TrendingUp as ProgressIcon } from '@mui/icons-material';
import Homework from './Homework';
import TutorProgress from './TutorProgress';

function Extracurricular() {
    const [tabValue, setTabValue] = useState(0);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', letterSpacing: '-0.5px', mb: 0.5 }}>
                📚 Внеурочная деятельность
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', mb: 3 }}>
                Домашние задания и успеваемость учеников
            </Typography>

            <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}
                sx={{ mb: 3, '& .MuiTab-root': { textTransform: 'none', fontWeight: 500, color: '#64748B', '&.Mui-selected': { color: '#6366F1' } }, '& .MuiTabs-indicator': { backgroundColor: '#6366F1' } }}>
                <Tab icon={<AssignmentIcon />} iconPosition="start" label="Домашние задания" />
                <Tab icon={<ProgressIcon />} iconPosition="start" label="Успеваемость" />
            </Tabs>

            {tabValue === 0 && <Homework />}
            {tabValue === 1 && <TutorProgress />}
        </Box>
    );
}

export default Extracurricular;