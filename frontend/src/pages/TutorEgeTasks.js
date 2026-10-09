// frontend/src/pages/TutorEgeTasks.js
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Alert,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
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
const GREEN = '#10B981';
const AMBER = '#F59E0B';
const RED = '#EF4444';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

// Карта 27 заданий
const TASK_MAP = {
    1: { difficulty: 'EASY', topic: 'Логика' },
    2: { difficulty: 'MEDIUM', topic: 'Системы счисления' },
    3: { difficulty: 'EASY', topic: 'Базы данных' },
    4: { difficulty: 'EASY', topic: 'Кодирование' },
    5: { difficulty: 'MEDIUM', topic: 'Алгоритмы' },
    6: { difficulty: 'EASY', topic: 'Анализ алгоритмов' },
    7: { difficulty: 'EASY', topic: 'Кодирование изображений' },
    8: { difficulty: 'EASY', topic: 'Комбинаторика' },
    9: { difficulty: 'MEDIUM', topic: 'Обработка данных' },
    10: { difficulty: 'EASY', topic: 'Поиск информации' },
    11: { difficulty: 'MEDIUM', topic: 'Информационный объём' },
    12: { difficulty: 'EASY', topic: 'Исполнение алгоритмов' },
    13: { difficulty: 'EASY', topic: 'Системы счисления' },
    14: { difficulty: 'EASY', topic: 'Позиционные системы' },
    15: { difficulty: 'MEDIUM', topic: 'Множества' },
    16: { difficulty: 'EASY', topic: 'Рекурсия' },
    17: { difficulty: 'MEDIUM', topic: 'Динамическое программирование' },
    18: { difficulty: 'EASY', topic: 'Логические выражения' },
    19: { difficulty: 'EASY', topic: 'Теория игр' },
    20: { difficulty: 'EASY', topic: 'Теория игр (анализ)' },
    21: { difficulty: 'EASY', topic: 'Теория игр (стратегия)' },
    22: { difficulty: 'MEDIUM', topic: 'Параллельные вычисления' },
    23: { difficulty: 'MEDIUM', topic: 'Динамика (прога/ручное)' },
    24: { difficulty: 'HARD', topic: 'Анализ текста' },
    25: { difficulty: 'MEDIUM', topic: 'Программирование (числа)' },
    26: { difficulty: 'HARD', topic: 'Обработка данных (сложное)' },
    27: { difficulty: 'HARD', topic: 'Программирование (сложное)' },
};

const DIFFICULTY_LABELS = {
    EASY: { label: 'Лёгкое', color: '#94A3B8', bg: '#F1F5F9' },
    MEDIUM: { label: 'Среднее', color: AMBER, bg: '#FFF3D6' },
    HARD: { label: 'Сложное', color: RED, bg: '#FEE2E2' },
};

export default function TutorEgeTasks() {
    const { user } = useAuth();
    const navigate = useNavigate();
    useEffect(() => { document.title = 'EdSpace — Разборы ЕГЭ'; }, []);

    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({});

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

    const tasks = useMemo(() => {
        return Array.from({ length: 27 }, (_, i) => {
            const n = i + 1;
            const info = TASK_MAP[n];
            const count = stats[n] || 0;
            return {
                taskNumber: n,
                topic: info.topic,
                difficulty: info.difficulty,
                count,
            };
        });
    }, [stats]);

    const totalSolutions = Object.values(stats).reduce((s, v) => s + (v || 0), 0);
    const coveredTasks = Object.values(stats).filter(v => v > 0).length;

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
                <Box sx={{ mb: 3 }}>
                    <StyledButton
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/materials')}
                        sx={{
                            color: INK_SOFT,
                            textTransform: 'none',
                            fontWeight: 600,
                            mb: 2,
                            '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
                        }}
                    >
                        К материалам
                    </StyledButton>

                    <Box sx={{
                        display: 'flex', justifyContent: 'space-between',
                        alignItems: 'flex-start', flexWrap: 'wrap', gap: 2,
                    }}>
                        <Box>
                            <Typography sx={{
                                fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                                color: INK, letterSpacing: '-0.02em', mb: 0.5,
                            }}>
                                💻 ЕГЭ по информатике
                            </Typography>
                            <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                                {totalSolutions} {totalSolutions === 1 ? 'разбор' : totalSolutions < 5 ? 'разбора' : 'разборов'} · {coveredTasks} из 27 заданий
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Reveal>

            {/* СЕТКА 27 ЗАДАНИЙ */}
            <Grid container spacing={2}>
                {tasks.map((task, i) => {
                    const hasSolutions = task.count > 0;
                    const diffCfg = DIFFICULTY_LABELS[task.difficulty] || DIFFICULTY_LABELS.EASY;

                    return (
                        <Grid item xs={12} sm={6} md={4} key={task.taskNumber}>
                            <Reveal delay={0.02 * i}>
                                <Paper
                                    onClick={() => navigate(`/materials/ege/${task.taskNumber}`)}
                                    sx={{
                                        position: 'relative',
                                        p: 2.5,
                                        borderRadius: 3,
                                        border: `1px solid ${LINE}`,
                                        bgcolor: CARD,
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        transition: 'all 0.2s ease',
                                        '&::before': {
                                            content: '""',
                                            position: 'absolute',
                                            left: 0, top: 0, bottom: 0,
                                            width: 4,
                                            borderRadius: '3px 0 0 3px',
                                            bgcolor: diffCfg.color,
                                        },
                                        '&:hover': {
                                            transform: 'translateY(-3px)',
                                            boxShadow: '0 10px 24px rgba(0,0,0,0.08)',
                                            borderColor: alpha(diffCfg.color, 0.4),
                                        },
                                    }}
                                >
                                    {/* Номер */}
                                    <Box sx={{
                                        width: 48, height: 48, borderRadius: 2.5,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        bgcolor: alpha(PURPLE, 0.1),
                                        color: PURPLE,
                                        fontWeight: 800, fontSize: '1.1rem',
                                        flexShrink: 0,
                                    }}>
                                        {task.taskNumber}
                                    </Box>

                                    {/* Инфо */}
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                        <Typography sx={{
                                            fontSize: '0.9rem', fontWeight: 700,
                                            color: INK,
                                            mb: 0.5, lineHeight: 1.3,
                                        }} noWrap>
                                            {task.topic}
                                        </Typography>
                                        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
                                            <Chip
                                                label={diffCfg.label}
                                                size="small"
                                                sx={{
                                                    bgcolor: diffCfg.bg, color: diffCfg.color,
                                                    fontWeight: 700, fontSize: '0.65rem',
                                                    height: 20, borderRadius: 100,
                                                }}
                                            />
                                            {hasSolutions ? (
                                                <Chip
                                                    label={`${task.count} ${task.count === 1 ? 'разбор' : task.count < 5 ? 'разбора' : 'разборов'}`}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: alpha(GREEN, 0.12), color: GREEN,
                                                        fontWeight: 700, fontSize: '0.65rem',
                                                        height: 20, borderRadius: 100,
                                                    }}
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<AddIcon sx={{ fontSize: 12, color: `${INK_MUTED} !important` }} />}
                                                    label="Добавить"
                                                    size="small"
                                                    sx={{
                                                        bgcolor: '#F3F4F6', color: INK_MUTED,
                                                        fontWeight: 600, fontSize: '0.65rem',
                                                        height: 20, borderRadius: 100,
                                                    }}
                                                />
                                            )}
                                        </Box>
                                    </Box>

                                    {/* Стрелка */}
                                    <ArrowForwardIcon sx={{ fontSize: 20, color: PURPLE, flexShrink: 0 }} />
                                </Paper>
                            </Reveal>
                        </Grid>
                    );
                })}
            </Grid>
        </PageContainer>
    );
}