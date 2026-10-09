// frontend/src/components/TutorEgeRatingContent.js
// Рейтинг ЕГЭ для репетитора — используется на вкладке в /ege-checklist
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Alert, Stack, Avatar,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    Refresh as RefreshIcon,
    EmojiEvents as TrophyIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    TrendingFlat as TrendingFlatIcon,
    Info as InfoIcon,
} from '@mui/icons-material';
import { StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== ПАЛИТРА ==========
const BG_ALT = '#F5F5F7';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const GREEN = '#10B981';
const RED = '#EF4444';
const GOLD = '#FFD700';
const SILVER = '#C0C0C0';
const BRONZE = '#CD7F32';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const Medallion = styled(Box)(({ color, size = 44 }) => ({
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color,
    color: '#FFF',
    fontWeight: 900,
    fontSize: size <= 32 ? '0.85rem' : '1.1rem',
    boxShadow: `0 4px 12px ${color}50`,
    flexShrink: 0,
}));

export default function TutorEgeRatingContent({ onStudentClick }) {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState([]);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/students/ege-rating?tutorId=${user.id}`);
            setRating(res.data || []);
            setError(null);
        } catch (err) {
            setError('Не удалось загрузить рейтинг');
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { loadData(); }, [loadData]);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                <CircularProgress sx={{ color: PURPLE }} />
            </Box>
        );
    }

    if (error) {
        return <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>;
    }

    const top3 = rating.filter(r => r.place && r.place <= 3);

    return (
        <>
            {/* КНОПКА ОБНОВИТЬ */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                <StyledButton
                    variant="outlined"
                    startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                    onClick={loadData}
                    sx={{
                        color: INK_SOFT, borderColor: LINE, borderRadius: '10px',
                        '&:hover': { bgcolor: BG_ALT, borderColor: INK_MUTED },
                    }}
                >
                    Обновить
                </StyledButton>
            </Box>

            {/* ПУСТО */}
            {rating.length === 0 && (
                <Reveal delay={0.05}>
                    <Paper sx={{
                        p: 6, borderRadius: 4, bgcolor: CARD,
                        border: `1px dashed ${LINE}`, textAlign: 'center',
                    }}>
                        <TrophyIcon sx={{ fontSize: 56, color: INK_MUTED, mb: 2 }} />
                        <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: INK, mb: 1 }}>
                            Рейтинг пока пуст
                        </Typography>
                        <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                            Ученики появятся здесь, как только ты включишь им флаг «Показывать в рейтинге»
                        </Typography>
                    </Paper>
                </Reveal>
            )}

            {rating.length > 0 && (
                <>
                    {/* ТОП-3 ПОДИУМ */}
                    {top3.length > 0 && (
                        <Reveal delay={0.05}>
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                {[2, 1, 3].map(place => {
                                    const row = top3.find(r => r.place === place);
                                    if (!row) return null;
                                    const medalColor = place === 1 ? GOLD : place === 2 ? SILVER : BRONZE;
                                    const height = place === 1 ? 200 : 170;
                                    return (
                                        <Grid item xs={12} sm={4} key={place}>
                                            <Paper
                                                onClick={() => onStudentClick && onStudentClick(row.studentId)}
                                                sx={{
                                                    p: 3,
                                                    borderRadius: 4,
                                                    height,
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    textAlign: 'center',
                                                    border: `1px solid ${LINE}`,
                                                    bgcolor: CARD,
                                                    position: 'relative',
                                                    overflow: 'hidden',
                                                    cursor: onStudentClick ? 'pointer' : 'default',
                                                    transition: 'all 0.25s ease',
                                                    '&:hover': {
                                                        transform: 'translateY(-4px)',
                                                        boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                                                        borderColor: medalColor,
                                                    },
                                                }}
                                            >
                                                <Box sx={{
                                                    position: 'absolute',
                                                    top: 0, left: 0, right: 0,
                                                    height: 5,
                                                    background: medalColor,
                                                }} />
                                                <Medallion color={medalColor} size={64}>
                                                    {place === 1 ? '🥇' : place === 2 ? '🥈' : '🥉'}
                                                </Medallion>
                                                <Typography sx={{
                                                    mt: 2,
                                                    fontSize: '1.05rem',
                                                    fontWeight: 800,
                                                    color: INK,
                                                    letterSpacing: '-0.01em',
                                                }}>
                                                    {row.fullName}
                                                </Typography>
                                                <Typography sx={{
                                                    fontSize: '1.8rem',
                                                    fontWeight: 900,
                                                    color: medalColor,
                                                    lineHeight: 1,
                                                    mt: 1,
                                                    letterSpacing: '-0.03em',
                                                }}>
                                                    {row.averageScore}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.72rem', color: INK_MUTED, fontWeight: 600, mt: 0.5 }}>
                                                    {row.mockCount} {row.mockCount === 1 ? 'пробник' : row.mockCount < 5 ? 'пробника' : 'пробников'}
                                                </Typography>
                                            </Paper>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </Reveal>
                    )}

                    {/* ТАБЛИЦА */}
                    <Reveal delay={0.1}>
                        <Paper sx={{
                            borderRadius: 4,
                            bgcolor: CARD,
                            border: `1px solid ${LINE}`,
                            overflow: 'hidden',
                        }}>
                            <TableContainer sx={{
                                maxHeight: 640,
                                '&::-webkit-scrollbar': { width: 6 },
                                '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                            }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{
                                                bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.7rem',
                                                color: INK_MUTED, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', borderBottom: `1px solid ${LINE}`,
                                                width: 60,
                                            }}>
                                                Место
                                            </TableCell>
                                            <TableCell sx={{
                                                bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.7rem',
                                                color: INK_MUTED, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', borderBottom: `1px solid ${LINE}`,
                                            }}>
                                                Ученик
                                            </TableCell>
                                            <TableCell align="center" sx={{
                                                bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.7rem',
                                                color: INK_MUTED, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', borderBottom: `1px solid ${LINE}`,
                                                width: 100,
                                            }}>
                                                Средний
                                            </TableCell>
                                            <TableCell align="center" sx={{
                                                bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.7rem',
                                                color: INK_MUTED, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', borderBottom: `1px solid ${LINE}`,
                                                width: 100,
                                            }}>
                                                Пробников
                                            </TableCell>
                                            <TableCell align="center" sx={{
                                                bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.7rem',
                                                color: INK_MUTED, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', borderBottom: `1px solid ${LINE}`,
                                                width: 100,
                                            }}>
                                                Последний
                                            </TableCell>
                                            <TableCell align="center" sx={{
                                                bgcolor: BG_ALT, fontWeight: 800, fontSize: '0.7rem',
                                                color: INK_MUTED, textTransform: 'uppercase',
                                                letterSpacing: '0.06em', borderBottom: `1px solid ${LINE}`,
                                                width: 80,
                                            }}>
                                                Тренд
                                            </TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {rating.map(row => {
                                            const medal = row.place === 1 ? GOLD : row.place === 2 ? SILVER : row.place === 3 ? BRONZE : null;
                                            return (
                                                <TableRow
                                                    key={row.studentId}
                                                    onClick={() => onStudentClick && onStudentClick(row.studentId)}
                                                    sx={{
                                                        cursor: onStudentClick ? 'pointer' : 'default',
                                                        '&:hover': { bgcolor: alpha(PURPLE, 0.06) },
                                                        '& td': { borderBottom: `1px solid ${LINE}` },
                                                    }}
                                                >
                                                    <TableCell sx={{ py: 1.5 }}>
                                                        {medal ? (
                                                            <Medallion color={medal} size={32}>
                                                                {row.place}
                                                            </Medallion>
                                                        ) : (
                                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: INK_MUTED, pl: 0.75 }}>
                                                                {row.place ?? '—'}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell sx={{ py: 1.5 }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                            <Avatar sx={{
                                                                width: 36, height: 36,
                                                                bgcolor: PURPLE_SOFT,
                                                                color: PURPLE,
                                                                fontWeight: 700,
                                                                fontSize: '0.85rem',
                                                            }}>
                                                                {row.fullName?.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
                                                            </Avatar>
                                                            <Box>
                                                                <Typography sx={{
                                                                    fontSize: '0.92rem',
                                                                    fontWeight: 600,
                                                                    color: INK,
                                                                }}>
                                                                    {row.fullName}
                                                                </Typography>
                                                                {row.grade && (
                                                                    <Typography sx={{ fontSize: '0.72rem', color: INK_MUTED }}>
                                                                        {row.grade} класс
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        </Box>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: medal || INK }}>
                                                            {row.averageScore ?? '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                                        <Typography sx={{ fontSize: '0.9rem', color: INK_SOFT, fontWeight: 600 }}>
                                                            {row.mockCount}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                                        {row.lastScore != null ? (
                                                            <Box>
                                                                <Typography sx={{ fontSize: '0.95rem', fontWeight: 700, color: INK }}>
                                                                    {row.lastScore}
                                                                </Typography>
                                                                {row.lastDate && (
                                                                    <Typography sx={{ fontSize: '0.7rem', color: INK_MUTED }}>
                                                                        {format(new Date(row.lastDate), 'd MMM', { locale: ru })}
                                                                    </Typography>
                                                                )}
                                                            </Box>
                                                        ) : (
                                                            <Typography sx={{ fontSize: '0.85rem', color: INK_MUTED }}>—</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="center" sx={{ py: 1.5 }}>
                                                        {row.trend != null ? (
                                                            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                                                                {row.trend > 0 ? (
                                                                    <>
                                                                        <TrendingUpIcon sx={{ fontSize: 18, color: GREEN }} />
                                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: GREEN }}>
                                                                            +{row.trend}
                                                                        </Typography>
                                                                    </>
                                                                ) : row.trend < 0 ? (
                                                                    <>
                                                                        <TrendingDownIcon sx={{ fontSize: 18, color: RED }} />
                                                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: RED }}>
                                                                            {row.trend}
                                                                        </Typography>
                                                                    </>
                                                                ) : (
                                                                    <TrendingFlatIcon sx={{ fontSize: 18, color: INK_MUTED }} />
                                                                )}
                                                            </Box>
                                                        ) : (
                                                            <Typography sx={{ fontSize: '0.85rem', color: INK_MUTED }}>—</Typography>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Reveal>

                    {/* ПОДСКАЗКА */}
                    <Reveal delay={0.15}>
                        <Box sx={{
                            mt: 2.5, p: 2.5,
                            bgcolor: alpha(PURPLE, 0.06),
                            borderRadius: 3,
                            border: `1px solid ${alpha(PURPLE, 0.15)}`,
                            display: 'flex', gap: 1.5, alignItems: 'flex-start',
                        }}>
                            <InfoIcon sx={{ color: PURPLE, fontSize: 22, flexShrink: 0, mt: 0.2 }} />
                            <Box>
                                <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: PURPLE, mb: 0.5 }}>
                                    Как считается рейтинг
                                </Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: INK_SOFT, lineHeight: 1.6 }}>
                                    Средний балл за все пробники. Тренд — разница между последним и предыдущим пробником.
                                    Показаны только ученики с флагом <b>«Показывать в рейтинге»</b>.
                                    Клик по строке — переход к чек-листу ученика.
                                </Typography>
                            </Box>
                        </Box>
                    </Reveal>
                </>
            )}
        </>
    );
}