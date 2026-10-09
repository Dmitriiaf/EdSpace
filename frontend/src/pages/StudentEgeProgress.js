// frontend/src/pages/StudentEgeProgress.js
import React, { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Paper, Grid, Chip, CircularProgress,
    Alert, Stack, LinearProgress, Tabs, Tab, Tooltip,
} from '@mui/material';
import { styled, alpha, keyframes } from '@mui/material/styles';
import {
    CheckCircle as CheckIcon,
    RadioButtonUnchecked as UncheckedIcon,
    Refresh as RefreshIcon,
    Lock as LockIcon,
    Code as CodeIcon,
    Handyman as HandIcon,
    TableChart as TableIcon,
    ListAlt as ListIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { PageContainer, StyledButton } from '../styles/shared';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import EgeRatingContent from './StudentEgeRating';

// ========== ПАЛИТРА ==========
const BG = '#FAFAFA';
const BG_ALT = '#F5F5F7';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const GREEN = '#10B981';
const GREEN_SOFT = '#D9F5E0';
const AMBER = '#F59E0B';
const AMBER_SOFT = '#FFF3D6';
const RED = '#EF4444';
const RED_SOFT = '#FEE2E2';
const BLUE = '#3B82F6';
const BLUE_SOFT = '#DBEAFE';

const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const TaskRow = styled(Box)(({ knows, difficulty }) => {
    const bgcolor = knows ? GREEN_SOFT : '#F9FAFB';
    const accent = knows ? GREEN
        : difficulty === 'EASY' ? '#94A3B8'
        : difficulty === 'MEDIUM' ? AMBER
        : RED;
    return {
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 1.5,
        borderRadius: 2,
        bgcolor,
        border: `1px solid ${knows ? alpha(GREEN, 0.3) : LINE}`,
        borderLeft: `4px solid ${accent}`,
        transition: 'all 0.15s ease',
        '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            transform: 'translateX(2px)',
        },
    };
});

const DIFFICULTY_LABELS = {
    EASY: { label: 'Лёгкое', color: '#94A3B8', bg: '#F1F5F9' },
    MEDIUM: { label: 'Среднее', color: AMBER, bg: AMBER_SOFT },
    HARD: { label: 'Сложное', color: RED, bg: RED_SOFT },
};

const SOLUTION_ICONS = {
    MANUAL: { icon: <HandIcon sx={{ fontSize: 14 }} />, label: 'Ручное', color: '#64748B' },
    PROGRAMMING: { icon: <CodeIcon sx={{ fontSize: 14 }} />, label: 'Программирование', color: PURPLE },
    LIBREOFFICE: { icon: <TableIcon sx={{ fontSize: 14 }} />, label: 'LibreOffice', color: '#0891B2' },
    BOTH: { icon: <CodeIcon sx={{ fontSize: 14 }} />, label: 'Прога / ручное', color: PURPLE },
};

function StudentEgeProgress() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Мой ЕГЭ'; }, []);

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(true);
    const [checklist, setChecklist] = useState(null);
    const [items, setItems] = useState([]);
    const [stats, setStats] = useState(null);
    const [error, setError] = useState(null);

    const studentId = user?.allIds?.[0] || user?.id;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/ege-checklist/student/${studentId}`);
            setChecklist(res.data?.checklist || null);
            setItems(res.data?.items || []);
            setStats(res.data?.stats || null);
        } catch (err) {
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    }, [studentId]);

    useEffect(() => { loadData(); }, [loadData]);

    // ========== ЗАГОЛОВОК + ВКЛАДКИ ==========
    const header = (
        <Reveal>
            <Box sx={{ mb: 3 }}>
                <Box sx={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    mb: 2, flexWrap: 'wrap', gap: 2,
                }}>
                    <Box>
                        <Typography sx={{
                            fontSize: { xs: '24px', sm: '28px' }, fontWeight: 800,
                            color: INK, letterSpacing: '-0.02em', mb: 0.5,
                        }}>
                            🎯 Мой ЕГЭ
                        </Typography>
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.9rem' }}>
                            {activeTab === 0
                                ? `Информатика · ${items.length || 27} заданий`
                                : 'Соревнование среди учеников'}
                        </Typography>
                    </Box>
                    {activeTab === 0 && checklist && (
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
                    )}
                </Box>

                <Paper sx={{
                    borderRadius: 3,
                    border: `1px solid ${LINE}`,
                    bgcolor: CARD,
                    overflow: 'hidden',
                }}>
                    <Tabs
                        value={activeTab}
                        onChange={(e, v) => setActiveTab(v)}
                        sx={{
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.95rem',
                                minHeight: 56,
                                color: INK_MUTED,
                                '&.Mui-selected': { color: PURPLE },
                            },
                            '& .MuiTabs-indicator': {
                                backgroundColor: PURPLE,
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                            },
                        }}
                    >
                        <Tab
                            icon={<ListIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="📋 Чек-лист"
                        />
                        <Tab
                            icon={<TrophyIcon sx={{ fontSize: 18 }} />}
                            iconPosition="start"
                            label="🏆 Рейтинг"
                        />
                    </Tabs>
                </Paper>
            </Box>
        </Reveal>
    );

    // ========== ВКЛАДКА 1 — ЧЕК-ЛИСТ ==========
    const checklistContent = loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress sx={{ color: PURPLE }} />
        </Box>
    ) : !checklist ? (
        <Reveal delay={0.05}>
            <Paper sx={{
                p: 6, borderRadius: 4, bgcolor: CARD,
                border: `1px dashed ${LINE}`, textAlign: 'center',
            }}>
                <LockIcon sx={{ fontSize: 56, color: INK_MUTED, mb: 2 }} />
                <Typography sx={{ fontSize: '1.15rem', fontWeight: 700, color: INK, mb: 1 }}>
                    Чек-лист ещё не создан
                </Typography>
                <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                    Как только Дмитрий откроет чек-лист ЕГЭ — здесь появится твой прогресс
                </Typography>
            </Paper>
        </Reveal>
    ) : (
        <ChecklistView
            checklist={checklist}
            items={items}
            stats={stats}
            onRefresh={loadData}
        />
    );

    return (
        <PageContainer sx={{ px: { xs: 2, sm: 3 }, bgcolor: BG, minHeight: '100vh' }}>
            {header}

            {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}

            {activeTab === 0 && checklistContent}
            {activeTab === 1 && <EgeRatingContent />}
        </PageContainer>
    );
}

// ========== КОМПОНЕНТ ЧЕК-ЛИСТА ==========
function ChecklistView({ checklist, items, stats, onRefresh }) {
    const estimatedScore = stats?.estimatedScore || 0;
    const knownTasks = stats?.knownTasks || 0;
    const totalTasks = stats?.totalTasks || 27;

    const scoreColor = estimatedScore >= 80 ? GREEN
        : estimatedScore >= 60 ? AMBER
        : estimatedScore >= 40 ? BLUE
        : RED;

    const size = 180;
    const strokeWidth = 14;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - estimatedScore / 100);

    return (
        <Grid container spacing={2.5}>
            {/* ЛЕВАЯ ЧАСТЬ */}
            <Grid item xs={12} lg={5}>
                <Reveal delay={0.05}>
                    <Paper sx={{
                        p: 3, borderRadius: 4, bgcolor: CARD,
                        border: `1px solid ${LINE}`, mb: 2.5,
                    }}>
                        <Typography sx={{
                            fontSize: '0.72rem', color: INK_MUTED, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase', mb: 2,
                        }}>
                            Приблизительный балл
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                            <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                                <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                                    <circle
                                        cx={size / 2} cy={size / 2} r={radius}
                                        fill="none" stroke={LINE} strokeWidth={strokeWidth}
                                    />
                                    <circle
                                        cx={size / 2} cy={size / 2} r={radius}
                                        fill="none" stroke={scoreColor} strokeWidth={strokeWidth}
                                        strokeDasharray={circumference}
                                        strokeDashoffset={dashOffset}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                    />
                                </svg>
                                <Box sx={{
                                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                                    display: 'flex', flexDirection: 'column',
                                    alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Typography sx={{
                                        fontSize: '3rem', fontWeight: 900,
                                        color: scoreColor, lineHeight: 1, letterSpacing: '-0.03em',
                                    }}>
                                        {estimatedScore}
                                    </Typography>
                                    <Typography sx={{ fontSize: '0.8rem', color: INK_MUTED, fontWeight: 600 }}>
                                        из 100 баллов
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                        <Typography sx={{ textAlign: 'center', color: INK_SOFT, fontSize: '0.9rem', mb: 2 }}>
                            Решено <b style={{ color: INK }}>{knownTasks}</b> из <b style={{ color: INK }}>{totalTasks}</b> заданий
                        </Typography>
                        <Box sx={{
                            p: 2, bgcolor: BG_ALT, borderRadius: 2,
                            border: `1px solid ${LINE}`,
                        }}>
                            <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, lineHeight: 1.5 }}>
                                💡 Это <b>приблизительная оценка</b> — она показывает, на сколько баллов ты бы сдал, если бы решил все отмеченные задания правильно.
                            </Typography>
                        </Box>
                    </Paper>
                </Reveal>

                <Reveal delay={0.1}>
                    <Paper sx={{
                        p: 3, borderRadius: 4, bgcolor: CARD,
                        border: `1px solid ${LINE}`, mb: 2.5,
                    }}>
                        <Typography sx={{
                            fontSize: '0.72rem', color: INK_MUTED, fontWeight: 700,
                            letterSpacing: '0.08em', textTransform: 'uppercase', mb: 2,
                        }}>
                            По сложности
                        </Typography>
                        <Stack spacing={2}>
                            {[
                                { key: 'easy', label: 'Лёгкие', color: '#94A3B8', bg: '#F1F5F9' },
                                { key: 'medium', label: 'Средние', color: AMBER, bg: AMBER_SOFT },
                                { key: 'hard', label: 'Сложные', color: RED, bg: RED_SOFT },
                            ].map(({ key, label, color, bg }) => {
                                const d = stats?.byDifficulty?.[key] || { total: 0, known: 0 };
                                const percent = d.total > 0 ? (d.known / d.total) * 100 : 0;
                                return (
                                    <Box key={key}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                                            <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: INK }}>
                                                {label}
                                            </Typography>
                                            <Typography sx={{ fontSize: '0.85rem', color: INK_SOFT, fontWeight: 600 }}>
                                                {d.known} / {d.total}
                                            </Typography>
                                        </Box>
                                        <LinearProgress
                                            variant="determinate"
                                            value={percent}
                                            sx={{
                                                height: 10, borderRadius: 5, bgcolor: bg,
                                                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 5 },
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Paper>
                </Reveal>

                {stats?.unknownNumbers?.length > 0 && (
                    <Reveal delay={0.15}>
                        <Paper sx={{
                            p: 3, borderRadius: 4, bgcolor: CARD,
                            border: `1px solid ${LINE}`,
                        }}>
                            <Typography sx={{
                                fontSize: '0.72rem', color: INK_MUTED, fontWeight: 700,
                                letterSpacing: '0.08em', textTransform: 'uppercase', mb: 2,
                            }}>
                                Осталось освоить
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                {stats.unknownNumbers.map(num => {
                                    const item = items.find(i => i.taskNumber === num);
                                    const difficulty = item?.difficulty || 'EASY';
                                    const cfg = DIFFICULTY_LABELS[difficulty];
                                    return (
                                        <Tooltip key={num} title={item?.topic || `Задание ${num}`}>
                                            <Chip
                                                label={`№${num}`}
                                                size="small"
                                                sx={{
                                                    bgcolor: cfg.bg, color: cfg.color,
                                                    fontWeight: 800, fontSize: '0.8rem',
                                                    border: `1px solid ${alpha(cfg.color, 0.4)}`,
                                                    height: 30,
                                                    '&:hover': { transform: 'scale(1.05)' },
                                                }}
                                            />
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Paper>
                    </Reveal>
                )}
            </Grid>

            {/* ПРАВАЯ ЧАСТЬ */}
            <Grid item xs={12} lg={7}>
                <Reveal delay={0.1}>
                    <Paper sx={{
                        p: 3, borderRadius: 4, bgcolor: CARD,
                        border: `1px solid ${LINE}`,
                    }}>
                        <Typography sx={{ fontSize: '1rem', fontWeight: 800, color: INK, mb: 2 }}>
                            📋 Все задания
                        </Typography>

                        <Stack spacing={1.25} sx={{
                            maxHeight: 720, overflowY: 'auto', pr: 0.5,
                            '&::-webkit-scrollbar': { width: 6 },
                            '&::-webkit-scrollbar-thumb': { background: '#D1D5DB', borderRadius: 3 },
                        }}>
                            {items.map(item => {
                                const diffCfg = DIFFICULTY_LABELS[item.difficulty] || DIFFICULTY_LABELS.EASY;
                                const solCfg = SOLUTION_ICONS[item.solutionType] || SOLUTION_ICONS.MANUAL;
                                return (
                                    <TaskRow key={item.id} knows={item.knows} difficulty={item.difficulty}>
                                        <Box sx={{
                                            width: 40, height: 40, borderRadius: '50%',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            bgcolor: item.knows ? GREEN : BG_ALT,
                                            color: item.knows ? '#FFF' : INK_MUTED,
                                            fontWeight: 800, fontSize: '0.95rem',
                                            flexShrink: 0,
                                        }}>
                                            {item.knows ? <CheckIcon sx={{ fontSize: 22 }} /> : item.taskNumber}
                                        </Box>

                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                <Typography sx={{ fontSize: '0.92rem', fontWeight: 700, color: INK }}>
                                                    Задание {item.taskNumber}
                                                </Typography>
                                                <Chip
                                                    label={diffCfg.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: diffCfg.bg, color: diffCfg.color,
                                                        fontWeight: 700, fontSize: '0.68rem',
                                                        height: 20, borderRadius: 100,
                                                    }}
                                                />
                                                <Chip
                                                    icon={solCfg.icon}
                                                    label={solCfg.label}
                                                    size="small"
                                                    sx={{
                                                        bgcolor: BG_ALT, color: solCfg.color,
                                                        fontWeight: 600, fontSize: '0.68rem',
                                                        height: 20, borderRadius: 100,
                                                        '& .MuiChip-icon': { color: solCfg.color, ml: 0.75 },
                                                    }}
                                                />
                                            </Box>
                                            <Typography sx={{ fontSize: '0.82rem', color: INK_SOFT, lineHeight: 1.4 }}>
                                                {item.topic}
                                            </Typography>
                                            {item.note && (
                                                <Typography sx={{
                                                    fontSize: '0.78rem', color: INK_MUTED,
                                                    fontStyle: 'italic', mt: 0.5, lineHeight: 1.4,
                                                }}>
                                                    💬 {item.note}
                                                </Typography>
                                            )}
                                        </Box>

                                        {item.knows ? (
                                            <Chip
                                                icon={<CheckIcon sx={{ fontSize: 14, color: `${GREEN} !important` }} />}
                                                label="Знаю"
                                                size="small"
                                                sx={{
                                                    bgcolor: GREEN_SOFT, color: GREEN,
                                                    fontWeight: 700, fontSize: '0.72rem',
                                                    height: 24, borderRadius: 100,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        ) : (
                                            <Chip
                                                icon={<UncheckedIcon sx={{ fontSize: 14, color: `${INK_MUTED} !important` }} />}
                                                label="В работе"
                                                size="small"
                                                sx={{
                                                    bgcolor: BG_ALT, color: INK_MUTED,
                                                    fontWeight: 600, fontSize: '0.72rem',
                                                    height: 24, borderRadius: 100,
                                                    flexShrink: 0,
                                                }}
                                            />
                                        )}
                                    </TaskRow>
                                );
                            })}
                        </Stack>
                    </Paper>
                </Reveal>
            </Grid>
        </Grid>
    );
}

export default StudentEgeProgress;