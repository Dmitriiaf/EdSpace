// frontend/src/pages/StudentEgeTaskDetail.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Box, Typography, Paper, CircularProgress,
    Alert, Stack,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import EgeSolutionView from '../components/EgeSolutionView';

const BG = '#FAFAFA';
const INK = '#141414';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

export default function StudentEgeTaskDetail() {
    const { taskNumber } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    useEffect(() => { document.title = `EdSpace — Задание ${taskNumber}`; }, [taskNumber]);

    const [loading, setLoading] = useState(true);
    const [solutions, setSolutions] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await axiosInstance.get(`/ege-solutions?taskNumber=${taskNumber}`);
                setSolutions(res.data || []);
            } catch (err) {
                setError('Не удалось загрузить разборы');
            } finally {
                setLoading(false);
            }
        })();
    }, [taskNumber]);

    if (loading) {
        return (
            <PageContainer>
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                    <CircularProgress sx={{ color: PURPLE }} />
                </Box>
            </PageContainer>
        );
    }

    return (
        <PageContainer sx={{ px: { xs: 2, sm: 3 }, bgcolor: BG, minHeight: '100vh' }}>
            <Reveal>
                <Box sx={{ mb: 3 }}>
                    <StyledButton
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/student/materials/ege')}
                        sx={{
                            color: INK_MUTED,
                            textTransform: 'none',
                            fontWeight: 600,
                            mb: 2,
                            '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
                        }}
                    >
                        К списку заданий
                    </StyledButton>

                    <Typography sx={{
                        fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                        color: INK, letterSpacing: '-0.02em', mb: 0.5,
                    }}>
                        📖 Задание {taskNumber}
                    </Typography>
                    <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                        {solutions.length} {solutions.length === 1 ? 'разбор' : solutions.length < 5 ? 'разбора' : 'разборов'}
                    </Typography>
                </Box>
            </Reveal>

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

            {solutions.length === 0 && !error && (
                <Reveal delay={0.05}>
                    <Paper sx={{
                        p: 6, borderRadius: 4, bgcolor: '#FFF',
                        border: `1px dashed ${LINE}`, textAlign: 'center',
                    }}>
                        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: INK, mb: 1 }}>
                            Пока нет разборов
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                            Дмитрий ещё не добавил решения для этого задания
                        </Typography>
                    </Paper>
                </Reveal>
            )}

            <Stack spacing={2.5}>
                {solutions.map((sol, i) => (
                    <Reveal key={sol.id} delay={0.05 * i}>
                        <EgeSolutionView solution={sol} />
                    </Reveal>
                ))}
            </Stack>
        </PageContainer>
    );
}