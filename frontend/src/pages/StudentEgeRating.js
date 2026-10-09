// frontend/src/pages/StudentEgeRating.js
// Компонент рейтинга — используется внутри вкладки «Мой ЕГЭ»
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

export default function EgeRatingContent() {
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [rating, setRating] = useState([]);
    const [error, setError] = useState(null);

    const studentId = user?.allIds?.[0] || user?.id;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const meRes = await axiosInstance.get(`/students/${studentId}`);
            const tutors = meRes.data?.tutors || [];
            const myTutorId = tutors[0]?.id;
            if (!myTutorId) {
                setError('Не удалось определить репетитора');
                setLoading(false);
                return;
            }

            const res = await axiosInstance.get(`/students/ege-rating?tutorId=${myTutorId}`);
            setRating(res.data || []);
            setError(null);
        } catch (err) {
            setError('Не удалось загрузить рейтинг');
        } finally {
            setLoading(false);
        }
    }, [studentId]);

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

    const myRow = rating.find(r => r.studentId === studentId);
    const myPlace = myRow?.place;
    const myAverage = myRow?.averageScore;

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
                            Как только появятся пробники с баллами — рейтинг заполнится
                        </Typography>
                    </Paper>
                </Reveal>
            )}

            {rating.length > 0 && (
                <>
                    {/* МОЯ КАРТОЧКА */}
                    {myRow && (
                        <Reveal delay={0.05}>
                            <Paper sx={{
                                p: 3, borderRadius: 4, mb: 3,
                                background: `linear-gradient(135deg, ${PURPLE} 0%, #9B7FFB 100%)`,
                                color: '#FFF',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 2,
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    {myPlace ? (
                                        <Medallion
                                            color={myPlace === 1 ? GOLD : myPlace === 2 ? SILVER : myPlace === 3 ? BRONZE : 'rgba(255,255,255,0.25)'}
                                            size={56}
                                        >
                                            #{myPlace}
                                        </Medallion>
                                    ) : (
                                        <Medallion color="rgba(255,255,255,0.25)" size={56}>—</Medallion>
                                    )}
                                    <Box>
                                        <Typography sx={{ fontSize: '0.8rem', opacity: 0.85, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                            Твоя позиция
                                        </Typography>
                                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                                            {myRow.fullName}
                                        </Typography>
                                    </Box>
                                </Box>
                                <Box sx={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography sx={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                            Средний балл
                                        </Typography>
                                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                                            {myAverage ?? '—'}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography sx={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                            Пробников
                                        </Typography>
                                        <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                                            {myRow.mockCount}
                                        </Typography>
                                    </Box>
                                    {myRow.trend != null && (
                                        <Box sx={{ textAlign: 'center' }}>
                                            <Typography sx={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                Тренд
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                                                {myRow.trend > 0 ? (
                                                    <TrendingUpIcon sx={{ fontSize: 26 }} />
                                                ) : myRow.trend < 0 ? (
                                                    <TrendingDownIcon sx={{ fontSize: 26 }} />
                                                ) : (
                                                    <TrendingFlatIcon sx={{ fontSize: 26 }} />
                                                )}
                                                <Typography sx={{ fontSize: '2.2rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.03em' }}>
                                                    {myRow.trend > 0 ? '+' : ''}{myRow.trend}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        </Reveal>
                    )}

                    {/* ТОП-3 ПОДИУМ */}
                    {top3.length > 0 && (
                        <Reveal delay={0.1}>
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                {[2, 1, 3].map(place => {
                                    const row = top3.find(r => r.place === place);
                                    if (!row) return null;
                                    const isMe = row.studentId === studentId;
                                    const medalColor = place === 1 ? GOLD : place === 2 ? SILVER : BRONZE;
                                    const height = place === 1 ? 200 : 170;
                                    return (
                                        <Grid item xs={12} sm={4} key={place}>
                                            <Paper sx={{
                                                p: 3,
                                                borderRadius: 4,
                                                height,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                textAlign: 'center',
                                                border: isMe ? `2px solid ${PURPLE}` : `1px solid ${LINE}`,
                                                bgcolor: CARD,
                                                position: 'relative',
                                                overflow: 'hidden',
                                                transition: 'all 0.25s ease',
                                                '&:hover': {
                                                    transform: 'translateY(-4px)',
                                                    boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
                                                },
                                            }}>
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
                                                    {isMe && (
                                                        <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: PURPLE, fontWeight: 700 }}>
                                                            (ты)
                                                        </Box>
                                                    )}
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
                    <Reveal delay={0.15}>
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
                                            const isMe = row.studentId === studentId;
                                            const medal = row.place === 1 ? GOLD : row.place === 2 ? SILVER : row.place === 3 ? BRONZE : null;
                                            return (
                                                <TableRow
                                                    key={row.studentId}
                                                    sx={{
                                                        bgcolor: isMe ? alpha(PURPLE, 0.06) : 'transparent',
                                                        '&:hover': { bgcolor: isMe ? alpha(PURPLE, 0.1) : BG_ALT },
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
                                                                    fontWeight: isMe ? 800 : 600,
                                                                    color: INK,
                                                                }}>
                                                                    {row.fullName}
                                                                    {isMe && (
                                                                        <Box component="span" sx={{ ml: 0.75, fontSize: '0.72rem', color: PURPLE, fontWeight: 700 }}>
                                                                            (ты)
                                                                        </Box>
                                                                    )}
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
                    <Reveal delay={0.2}>
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
                                    Место определяется по <b>среднему баллу за все пробники</b>. Тренд — это разница
                                    между последним и предыдущим пробником. Показаны только те ученики, кого репетитор
                                    добавил в рейтинг.
                                </Typography>
                            </Box>
                        </Box>
                    </Reveal>
                </>
            )}
        </>
    );
}