// frontend/src/components/EgeSolutionView.js
import React, { useState } from 'react';
import {
    Box, Typography, Paper, Chip, IconButton,
    Dialog, DialogContent,
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import {
    Close as CloseIcon,
    Link as LinkIcon,
    OpenInNew as OpenInNewIcon,
    Code as CodeIcon,
    PlayCircleOutline as PlayIcon,
    Image as ImageIcon,
    ZoomIn as ZoomInIcon,
    Assignment as TaskIcon,
    CheckCircle as SolutionIcon,
} from '@mui/icons-material';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';

// ========== ПАЛИТРА ==========
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const GREEN = '#10B981';
const AMBER = '#F59E0B';

const SectionTitle = styled(Typography)({
    fontSize: '0.72rem',
    color: INK_MUTED,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    mb: 1.5,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
});

const BigImage = styled(Box)({
    position: 'relative',
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    border: `1px solid ${LINE}`,
    bgcolor: '#F9FAFB',
    cursor: 'zoom-in',
    transition: 'all 0.2s ease',
    '&:hover': {
        borderColor: PURPLE,
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    },
    '&:hover .zoom-overlay': { opacity: 1 },
});

const ZoomHint = styled(Box)({
    position: 'absolute',
    top: 12, right: 12,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    px: 1.25, py: 0.5,
    borderRadius: 2,
    bgcolor: 'rgba(0,0,0,0.65)',
    color: '#FFF',
    fontSize: '0.75rem',
    fontWeight: 600,
    opacity: 0,
    transition: 'opacity 0.2s',
    backdropFilter: 'blur(4px)',
});

// ========== УТИЛИТЫ ==========
const isEmbeddable = (url) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be') ||
           url.includes('rutube.ru') || url.includes('vk.com/video') ||
           url.includes('vkvideo.ru');
};

const getEmbedUrl = (url) => {
    if (!url) return url;
    if (url.includes('youtube.com/watch?v=')) {
        const id = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('rutube.ru/video/')) {
        const id = url.split('/video/')[1]?.split('/')[0];
        return `https://rutube.ru/play/embed/${id}`;
    }
    return url;
};

export default function EgeSolutionView({ solution }) {
    const [zoomImage, setZoomImage] = useState(null);

    if (!solution) return null;

    const allImages = solution.images || [];
    const taskImages = allImages.filter(i => i.imageType === 'TASK');
    const solutionImages = allImages.filter(i => i.imageType !== 'TASK');

    return (
        <Paper sx={{
            p: { xs: 2.5, sm: 3 }, borderRadius: 4, bgcolor: '#FFFFFF',
            border: `1px solid ${LINE}`,
        }}>
            {/* Заголовок */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2.5 }}>
                <Box sx={{
                    width: 44, height: 44, borderRadius: 2,
                    bgcolor: PURPLE_SOFT, color: PURPLE,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.95rem',
                    flexShrink: 0,
                }}>
                    №{solution.taskNumber}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                        fontSize: '1.15rem', fontWeight: 800,
                        color: INK, letterSpacing: '-0.01em', mb: 0.5,
                    }}>
                        {solution.title}
                    </Typography>
                    {solution.updatedAt && (
                        <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED }}>
                            Обновлено: {new Date(solution.updatedAt).toLocaleDateString('ru-RU')}
                        </Typography>
                    )}
                </Box>
            </Box>

            {/* СКРИНШОТ ЗАДАЧИ — большой, сверху */}
            {taskImages.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <SectionTitle sx={{ color: AMBER }}>
                        <TaskIcon sx={{ fontSize: 14 }} /> Условие задачи
                    </SectionTitle>
                    {taskImages.map(img => (
                        <BigImage
                            key={img.id}
                            onClick={() => setZoomImage(img.imageUrl)}
                            sx={{ mb: 1.5 }}
                        >
                            <Box
                                component="img"
                                src={img.imageUrl}
                                alt="Условие"
                                sx={{ width: '100%', display: 'block', height: 'auto' }}
                            />
                            <ZoomHint className="zoom-overlay">
                                <ZoomInIcon sx={{ fontSize: 14 }} />
                                Увеличить
                            </ZoomHint>
                        </BigImage>
                    ))}
                </Box>
            )}

            {/* Объяснение */}
            {solution.explanation && (
                <Box sx={{ mb: 3 }}>
                    <SectionTitle>💡 Объяснение</SectionTitle>
                    <Typography sx={{
                        fontSize: '0.92rem', color: INK_SOFT,
                        lineHeight: 1.7, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                        {solution.explanation}
                    </Typography>
                </Box>
            )}

            {/* Код */}
            {solution.code && (
                <Box sx={{ mb: 3 }}>
                    <SectionTitle>
                        <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75 }}>
                            <CodeIcon sx={{ fontSize: 14 }} /> Код {solution.codeLanguage || 'python'}
                        </Box>
                    </SectionTitle>
                    <Box sx={{
                        borderRadius: 2, overflow: 'hidden',
                        border: `1px solid ${LINE}`,
                        '& pre': { margin: '0 !important', fontSize: '0.82rem !important' },
                    }}>
                        <SyntaxHighlighter
                            language={solution.codeLanguage || 'python'}
                            style={oneLight}
                            showLineNumbers={true}
                            customStyle={{
                                padding: '16px',
                                background: '#F9FAFB',
                                fontSize: '0.82rem',
                            }}
                        >
                            {solution.code}
                        </SyntaxHighlighter>
                    </Box>
                </Box>
            )}

            {/* СКРИНШОТ РЕШЕНИЯ — большой, в конце */}
            {solutionImages.length > 0 && (
                <Box sx={{ mb: 3 }}>
                    <SectionTitle sx={{ color: GREEN }}>
                        <SolutionIcon sx={{ fontSize: 14 }} /> Решение
                    </SectionTitle>
                    {solutionImages.map(img => (
                        <BigImage
                            key={img.id}
                            onClick={() => setZoomImage(img.imageUrl)}
                            sx={{ mb: 1.5 }}
                        >
                            <Box
                                component="img"
                                src={img.imageUrl}
                                alt="Решение"
                                sx={{ width: '100%', display: 'block', height: 'auto' }}
                            />
                            <ZoomHint className="zoom-overlay">
                                <ZoomInIcon sx={{ fontSize: 14 }} />
                                Увеличить
                            </ZoomHint>
                        </BigImage>
                    ))}
                </Box>
            )}

            {/* Видео */}
            {solution.videoUrl && (
                <Box sx={{ mb: 3 }}>
                    <SectionTitle>
                        <PlayIcon sx={{ fontSize: 14 }} /> Видео-разбор
                    </SectionTitle>
                    {isEmbeddable(solution.videoUrl) ? (
                        <Box sx={{
                            position: 'relative',
                            width: '100%',
                            paddingBottom: '56.25%',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: `1px solid ${LINE}`,
                            bgcolor: '#000',
                        }}>
                            <Box
                                component="iframe"
                                src={getEmbedUrl(solution.videoUrl)}
                                title="Видео-разбор"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                sx={{
                                    position: 'absolute',
                                    top: 0, left: 0,
                                    width: '100%', height: '100%',
                                    border: 'none',
                                }}
                            />
                        </Box>
                    ) : (
                        <Box
                            component="a"
                            href={solution.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 1,
                                px: 2, py: 1.25,
                                borderRadius: 2,
                                bgcolor: PURPLE_SOFT, color: PURPLE,
                                textDecoration: 'none',
                                fontWeight: 700, fontSize: '0.88rem',
                                border: `1px solid ${alpha(PURPLE, 0.3)}`,
                                '&:hover': { bgcolor: alpha(PURPLE, 0.15) },
                            }}
                        >
                            <PlayIcon />
                            Смотреть видео
                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </Box>
                    )}
                </Box>
            )}

            {/* Источник */}
            {solution.sourceUrl && (
                <Box sx={{ pt: 2, borderTop: `1px dashed ${LINE}` }}>
                    <Box
                        component="a"
                        href={solution.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 1,
                            color: INK_MUTED,
                            textDecoration: 'none',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            '&:hover': { color: PURPLE },
                        }}
                    >
                        <LinkIcon sx={{ fontSize: 16 }} />
                        Источник задачи
                        <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </Box>
                </Box>
            )}

            {/* ЗУМ */}
            <Dialog
                open={!!zoomImage}
                onClose={() => setZoomImage(null)}
                maxWidth="lg"
                PaperProps={{ sx: { bgcolor: 'transparent', boxShadow: 'none' } }}
            >
                <Box sx={{ position: 'relative' }}>
                    <IconButton
                        onClick={() => setZoomImage(null)}
                        sx={{
                            position: 'fixed', top: 20, right: 20,
                            bgcolor: 'rgba(255,255,255,0.9)', color: INK,
                            '&:hover': { bgcolor: '#FFF' },
                            zIndex: 10,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                    {zoomImage && (
                        <Box
                            component="img"
                            src={zoomImage}
                            alt="zoom"
                            sx={{
                                maxWidth: '90vw',
                                maxHeight: '90vh',
                                objectFit: 'contain',
                                borderRadius: 2,
                                display: 'block',
                            }}
                        />
                    )}
                </Box>
            </Dialog>
        </Paper>
    );
}