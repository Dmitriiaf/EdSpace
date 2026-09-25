// ========== frontend/src/components/StudentProfileCard.js ==========
import React, { useState, useRef, useEffect } from 'react';
import {
    Box, Paper, Avatar, Typography, IconButton, Chip, Stack,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, Tooltip, Divider,
} from '@mui/material';
import {
    Edit as EditIcon,
    PhotoCamera as CameraIcon,
    Close as CloseIcon,
    School as SchoolIcon,
    EmojiEvents as GoalIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckIcon,
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';

const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';
const BG_ALT = '#F5F5F7';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const LIME = '#C4F542';
const LIME_SOFT = '#EBFFB0';
const AMBER = '#F59E0B';
const AMBER_SOFT = '#FFF3D6';
const GREEN = '#10B981';
const GREEN_SOFT = '#D9F5E0';
const PINK = '#FF5FA2';
const PINK_SOFT = '#FFE0EE';

// Пресеты увлечений
const INTEREST_PRESETS = [
    '💻 Программирование', '🎮 Игры', '⚽ Спорт', '🎵 Музыка',
    '📚 Книги', '🎨 Рисование', '🎬 Кино', '🤖 Роботы',
    '🧮 Математика', '🚀 Космос', '🐱 Животные', '🍕 Еда',
];

// Пресеты целей
const GOAL_PRESETS = [
    'Сдать ЕГЭ на 80+',
    'Сдать ЕГЭ на 90+',
    'Поступить в ИТ-вуз',
    'Научиться программировать',
    'Победить в олимпиаде',
    'Просто для себя',
];

export default function StudentProfileCard({ userId, fallbackName = 'Ученик' }) {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [stats, setStats] = useState({ lessonsDone: 0, avgScore: null, daysIn: 0 });

    // Форма редактирования
    const [form, setForm] = useState({
        fullName: '', school: '', grade: '', bio: '', interests: [], goal: '',
    });

    const avatarInputRef = useRef(null);

    useEffect(() => {
        if (userId) fetchProfile();
    }, [userId]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/students/${userId}`);
            const data = res.data || {};
            setProfile(data);
            setForm({
                fullName: data.fullName || '',
                school: data.school || '',
                grade: data.grade || '',
                bio: data.bio || '',
                interests: parseInterests(data.interests),
                goal: data.goal || '',
            });
            // Статистика
            setStats({
                lessonsDone: data.lessonsDone || 0,
                avgScore: data.avgScore || null,
                daysIn: data.daysIn || calcDaysIn(data.createdAt),
            });
        } catch (err) {
            // тихо
        } finally {
            setLoading(false);
        }
    };

    const parseInterests = (raw) => {
        if (!raw) return [];
        if (Array.isArray(raw)) return raw;
        try { return JSON.parse(raw); } catch { return raw.split(',').map(s => s.trim()).filter(Boolean); }
    };

    const calcDaysIn = (createdAt) => {
        if (!createdAt) return 0;
        return Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86400000));
    };

    const handleAvatarClick = () => avatarInputRef.current?.click();

    const handleAvatarUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('Максимум 2MB'); return; }
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await axiosInstance.post(`/students/${userId}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setProfile(prev => ({ ...prev, avatar: res.data.avatarUrl || res.data.avatar }));
        } catch (err) {
            alert('Не удалось загрузить аватар');
        } finally {
            setUploadingAvatar(false);
            // Очистить input, чтобы можно было выбрать тот же файл повторно
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const toggleInterest = (interest) => {
        setForm(prev => ({
            ...prev,
            interests: prev.interests.includes(interest)
                ? prev.interests.filter(i => i !== interest)
                : [...prev.interests, interest],
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                fullName: form.fullName,
                school: form.school,
                grade: form.grade,
                bio: form.bio,
                interests: JSON.stringify(form.interests),
                goal: form.goal,
            };
            const res = await axiosInstance.patch(`/students/${userId}/profile`, payload);
            setProfile(prev => ({ ...prev, ...res.data }));
            setEditOpen(false);
        } catch (err) {
            alert('Не удалось сохранить: ' + (err.response?.data?.error || 'ошибка'));
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Paper sx={{ p: 3, borderRadius: 4, bgcolor: CARD, border: `1px solid ${LINE}`, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={28} />
            </Paper>
        );
    }

    const name = profile?.fullName || fallbackName;
    const initials = name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase();
    const interests = parseInterests(profile?.interests);

    return (
        <>
            <Paper sx={{
                p: 3, borderRadius: 4, bgcolor: CARD,
                border: `1px solid ${LINE}`, overflow: 'hidden',
            }}>
                {/* Аватар + имя */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={profile?.avatar || undefined}
                            sx={{
                                width: 128, height: 128,
                                bgcolor: PURPLE_SOFT, color: PURPLE,
                                fontWeight: 800, fontSize: '2.4rem',
                                cursor: 'pointer',
                                border: `3px solid ${LIME}`,
                                transition: 'transform 0.2s ease',
                                '&:hover': { transform: 'scale(1.03)' },
                            }}
                            onClick={handleAvatarClick}
                        >
                            {!profile?.avatar && initials}
                        </Avatar>
                        <IconButton
                            onClick={handleAvatarClick}
                            disabled={uploadingAvatar}
                            sx={{
                                position: 'absolute', bottom: 4, right: 4,
                                bgcolor: PURPLE, color: '#FFF',
                                width: 38, height: 38,
                                border: '2px solid #FFF',
                                boxShadow: '0 4px 12px rgba(123,92,250,0.4)',
                                '&:hover': { bgcolor: '#6B4BEB', transform: 'scale(1.05)' },
                                transition: 'all 0.2s ease',
                            }}
                        >
                            {uploadingAvatar
                                ? <CircularProgress size={18} sx={{ color: '#FFF' }} />
                                : <CameraIcon sx={{ fontSize: 18 }} />}
                        </IconButton>
                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={handleAvatarUpload}
                        />
                    </Box>
                    <Typography sx={{ mt: 2.5, fontWeight: 800, fontSize: '1.35rem', color: INK, textAlign: 'center', letterSpacing: '-0.02em' }}>
                        {name}
                    </Typography>
                    {(profile?.school || profile?.grade) && (
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem', mt: 0.5, textAlign: 'center' }}>
                            {[profile?.grade && `${profile.grade} класс`, profile?.school].filter(Boolean).join(' · ')}
                        </Typography>
                    )}
                    <Button
                        size="small"
                        startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                        onClick={() => setEditOpen(true)}
                        sx={{
                            mt: 2, textTransform: 'none', color: PURPLE,
                            fontWeight: 600, fontSize: '0.82rem',
                            borderRadius: 100, px: 2, py: 0.75,
                            bgcolor: PURPLE_SOFT,
                            '&:hover': { bgcolor: '#DDD3FF' },
                        }}
                    >
                        Редактировать профиль
                    </Button>
                </Box>

                <Divider sx={{ my: 2.5, borderColor: LINE }} />

                {/* О себе */}
                <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ fontSize: '0.7rem', color: INK_MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 0.75 }}>
                        О себе
                    </Typography>
                    <Typography sx={{
                        color: profile?.bio ? INK_SOFT : INK_MUTED,
                        fontSize: '0.88rem', lineHeight: 1.6,
                        fontStyle: profile?.bio ? 'normal' : 'italic',
                    }}>
                        {profile?.bio || 'Пока ничего не рассказал(а) о себе…'}
                    </Typography>
                </Box>

                {/* Увлечения */}
                {interests.length > 0 && (
                    <Box sx={{ mb: 2.5 }}>
                        <Typography sx={{ fontSize: '0.7rem', color: INK_MUTED, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', mb: 1 }}>
                            Увлечения
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                            {interests.map((i, idx) => (
                                <Chip
                                    key={idx}
                                    label={i}
                                    size="small"
                                    sx={{
                                        bgcolor: BG_ALT, color: INK,
                                        fontSize: '0.75rem', height: 26,
                                        borderRadius: 100, fontWeight: 500,
                                    }}
                                />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Цель */}
                {profile?.goal && (
                    <Box sx={{
                        p: 2, borderRadius: 3, mb: 2.5,
                        bgcolor: AMBER_SOFT, border: `1px solid ${AMBER}`,
                        display: 'flex', alignItems: 'flex-start', gap: 1.25,
                    }}>
                        <GoalIcon sx={{ color: AMBER, fontSize: 22, flexShrink: 0, mt: 0.2 }} />
                        <Box>
                            <Typography sx={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.3 }}>
                                Моя цель
                            </Typography>
                            <Typography sx={{ color: INK, fontSize: '0.9rem', fontWeight: 600 }}>
                                {profile.goal}
                            </Typography>
                        </Box>
                    </Box>
                )}

                <Divider sx={{ my: 2.5, borderColor: LINE }} />

                {/* Мини-статистика */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
                    <MiniStat icon={<CheckIcon sx={{ fontSize: 16 }} />} value={stats.lessonsDone} label="уроков" color={GREEN} bg={GREEN_SOFT} />
                    <MiniStat icon={<GoalIcon sx={{ fontSize: 16 }} />} value={stats.avgScore ?? '—'} label="средн." color={AMBER} bg={AMBER_SOFT} />
                    <MiniStat icon={<CalendarIcon sx={{ fontSize: 16 }} />} value={stats.daysIn} label="дней" color={PURPLE} bg={PURPLE_SOFT} />
                </Box>
            </Paper>

            {/* Диалог редактирования */}
            <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: 4 } }}>
                <DialogTitle sx={{ p: 3, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: INK }}>
                            Редактировать профиль
                        </Typography>
                        <IconButton onClick={() => setEditOpen(false)} size="small"><CloseIcon /></IconButton>
                    </Box>
                </DialogTitle>
                <DialogContent dividers sx={{ borderColor: LINE, p: 3 }}>
                    <Stack spacing={2.5}>
                        <TextField
                            label="Имя и фамилия"
                            fullWidth size="small"
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                        />
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Класс"
                                size="small"
                                value={form.grade}
                                onChange={(e) => setForm({ ...form, grade: e.target.value })}
                                sx={{ width: 120 }}
                            />
                            <TextField
                                label="Школа"
                                fullWidth size="small"
                                value={form.school}
                                onChange={(e) => setForm({ ...form, school: e.target.value })}
                            />
                        </Box>
                        <TextField
                            label="О себе"
                            fullWidth multiline rows={3} size="small"
                            value={form.bio}
                            onChange={(e) => setForm({ ...form, bio: e.target.value })}
                            placeholder="Чем увлекаешься, что нравится, чего хочешь достичь…"
                            inputProps={{ maxLength: 300 }}
                            helperText={`${form.bio.length}/300`}
                        />

                        <Box>
                            <Typography sx={{ fontSize: '0.8rem', color: INK_SOFT, fontWeight: 600, mb: 1 }}>
                                Увлечения
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {INTEREST_PRESETS.map(i => {
                                    const selected = form.interests.includes(i);
                                    return (
                                        <Chip
                                            key={i}
                                            label={i}
                                            onClick={() => toggleInterest(i)}
                                            size="small"
                                            sx={{
                                                bgcolor: selected ? PURPLE : BG_ALT,
                                                color: selected ? '#FFF' : INK,
                                                fontSize: '0.75rem', height: 26,
                                                borderRadius: 100, fontWeight: 500,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: selected ? '#6B4BEB' : '#E5E5E8' },
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>

                        <Box>
                            <Typography sx={{ fontSize: '0.8rem', color: INK_SOFT, fontWeight: 600, mb: 1 }}>
                                Моя цель
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                                {GOAL_PRESETS.map(g => {
                                    const selected = form.goal === g;
                                    return (
                                        <Chip
                                            key={g}
                                            label={g}
                                            onClick={() => setForm({ ...form, goal: selected ? '' : g })}
                                            size="small"
                                            sx={{
                                                bgcolor: selected ? AMBER : BG_ALT,
                                                color: selected ? '#FFF' : INK,
                                                fontSize: '0.75rem', height: 26,
                                                borderRadius: 100, fontWeight: 500,
                                                cursor: 'pointer',
                                                '&:hover': { bgcolor: selected ? '#D97706' : '#E5E5E8' },
                                            }}
                                        />
                                    );
                                })}
                            </Box>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2 }}>
                    <Button onClick={() => setEditOpen(false)} sx={{ textTransform: 'none', color: INK_MUTED }}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        variant="contained"
                        sx={{
                            textTransform: 'none', bgcolor: PURPLE, borderRadius: 100,
                            fontWeight: 600, px: 3,
                            '&:hover': { bgcolor: '#6B4BEB' },
                        }}
                    >
                        {saving ? <CircularProgress size={18} sx={{ color: '#FFF' }} /> : 'Сохранить'}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

function MiniStat({ icon, value, label, color, bg }) {
    return (
        <Box sx={{
            p: 1.25, borderRadius: 2, bgcolor: bg,
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.4,
        }}>
            <Box sx={{ color, display: 'flex', alignItems: 'center' }}>{icon}</Box>
            <Typography sx={{ fontWeight: 800, color: INK, fontSize: '1.1rem', lineHeight: 1 }}>
                {value}
            </Typography>
            <Typography sx={{ fontSize: '0.68rem', color: INK_MUTED, fontWeight: 600 }}>
                {label}
            </Typography>
        </Box>
    );
}