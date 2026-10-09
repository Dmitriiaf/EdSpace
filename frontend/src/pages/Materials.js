// frontend/src/pages/Materials.js
// Материалы репетитора — карточка «ЕГЭ по информатике» (переход в разборы)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Alert, Stack,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    ArrowForward as ArrowForwardIcon,
    MenuBook as BookIcon,
    Add as AddIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== ПАЛИТРА ==========
const BG = '#FAFAFA';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const GREEN = '#10B981';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

export default function Materials() {
    const { user } = useAuth();
    const navigate = useNavigate();
    useEffect(() => { document.title = 'EdSpace — Материалы'; }, []);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        (async () => {
            try {
                const res = await axiosInstance.get('/ege-solutions/stats');
                setStats(res.data || {});
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const totalSolutions = stats
        ? Object.values(stats).reduce((s, v) => s + (v || 0), 0)
        : 0;
    const coveredTasks = stats
        ? Object.values(stats).filter(v => v > 0).length
        : 0;

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
            {/* ЗАГОЛОВОК */}
            <Reveal>
                <Box sx={{ mb: 4 }}>
                    <Typography sx={{
                        fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                        color: INK, letterSpacing: '-0.02em', mb: 0.5,
                    }}>
                        📚 Материалы
                    </Typography>
                    <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                        Разборы задач ЕГЭ по информатике для всех учеников
                    </Typography>
                </Box>
            </Reveal>

            <Reveal delay={0.05}>
                <Grid container spacing={2.5}>
                    {/* Карточка ЕГЭ */}
                    <Grid item xs={12} md={6} lg={5}>
                        <Paper
                            onClick={() => navigate('/materials/ege')}
                            sx={{
                                position: 'relative',
                                borderRadius: 4,
                                overflow: 'hidden',
                                cursor: 'pointer',
                                border: `1px solid ${LINE}`,
                                bgcolor: CARD,
                                p: 3,
                                minHeight: 220,
                                display: 'flex',
                                flexDirection: 'column',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0, left: 0, right: 0,
                                    height: 5,
                                    background: `linear-gradient(90deg, ${PURPLE}, #9B7FFB)`,
                                },
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    top: -40, right: -40,
                                    width: 200, height: 200,
                                    borderRadius: '50%',
                                    background: `radial-gradient(circle, ${alpha(PURPLE, 0.12)} 0%, transparent 70%)`,
                                    pointerEvents: 'none',
                                },
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: `0 12px 28px ${alpha(PURPLE, 0.18)}`,
                                    borderColor: alpha(PURPLE, 0.3),
                                },
                            }}
                        >
                            <Box sx={{ position: 'absolute', top: 20, right: 20, fontSize: '52px', lineHeight: 1 }}>
                                💻
                            </Box>

                            <Chip
                                label="ЕГЭ ПО ИНФОРМАТИКЕ"
                                size="small"
                                sx={{
                                    alignSelf: 'flex-start',
                                    bgcolor: alpha(PURPLE, 0.12),
                                    color: PURPLE,
                                    fontWeight: 800,
                                    fontSize: '0.7rem',
                                    letterSpacing: '0.06em',
                                    mb: 2,
                                    borderRadius: 2,
                                }}
                            />

                            <Typography sx={{
                                fontSize: '1.5rem', fontWeight: 800,
                                color: INK, letterSpacing: '-0.02em',
                                mb: 1, maxWidth: 'calc(100% - 70px)',
                            }}>
                                Разборы задач
                            </Typography>

                            <Typography sx={{
                                fontSize: '0.9rem', color: INK_SOFT,
                                lineHeight: 1.5, mb: 2,
                                maxWidth: 'calc(100% - 20px)',
                            }}>
                                Объяснения, код, скриншоты и видео-разборы для всех 27 заданий
                            </Typography>

                            <Box sx={{
                                mt: 'auto',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                flexWrap: 'wrap',
                            }}>
                                <Chip
                                    label={`${totalSolutions} ${totalSolutions === 1 ? 'разбор' : totalSolutions < 5 ? 'разбора' : 'разборов'}`}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(GREEN, 0.12),
                                        color: GREEN,
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        borderRadius: 2,
                                        height: 24,
                                    }}
                                />
                                <Chip
                                    label={`${coveredTasks} / 27 заданий`}
                                    size="small"
                                    sx={{
                                        bgcolor: '#F3F4F6',
                                        color: INK_SOFT,
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                        borderRadius: 2,
                                        height: 24,
                                    }}
                                />
                                <Box sx={{
                                    ml: 'auto',
                                    color: PURPLE,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                }}>
                                    Открыть
                                    <ArrowForwardIcon sx={{ fontSize: 18 }} />
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Быстрая кнопка «Создать разбор» */}
                    <Grid item xs={12} md={6} lg={7}>
                        <Paper sx={{
                            p: 3,
                            borderRadius: 4,
                            border: `1px dashed ${LINE}`,
                            bgcolor: CARD,
                            minHeight: 220,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                        }}>
                            <BookIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                            <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: INK_SOFT, mb: 1 }}>
                                Как добавить разбор
                            </Typography>
                            <Typography sx={{ fontSize: '0.85rem', color: INK_MUTED, mb: 2, maxWidth: 400 }}>
                                Открой карточку «ЕГЭ по информатике» → выбери задание → нажми «Добавить разбор»
                            </Typography>
                            <StyledButton
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => navigate('/materials/ege')}
                                sx={{
                                    color: PURPLE,
                                    borderColor: alpha(PURPLE, 0.4),
                                    borderRadius: '10px',
                                    textTransform: 'none',
                                    fontWeight: 700,
                                    '&:hover': { bgcolor: alpha(PURPLE, 0.06), borderColor: PURPLE },
                                }}
                            >
                                К разборам ЕГЭ
                            </StyledButton>
                        </Paper>
                    </Grid>
                </Grid>
            </Reveal>
        </PageContainer>
    );
}