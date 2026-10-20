// ========== frontend/src/components/StudentProfileCard.js ==========
import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
    Box, Paper, Avatar, Typography, IconButton, Chip, Stack,
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, CircularProgress, Tooltip, Divider,
    Tabs, Tab, Grid,
} from '@mui/material';
import {
    Edit as EditIcon,
    PhotoCamera as CameraIcon,
    Close as CloseIcon,
    School as SchoolIcon,
    EmojiEvents as GoalIcon,
    CalendarToday as CalendarIcon,
    CheckCircle as CheckIcon,
    Palette as PaletteIcon,
} from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import NickWithCosmetics from './NickWithCosmetics';

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

const BG_MAP = {
    pink_grad: 'linear-gradient(135deg,#FBCFE8,#F9A8D4)',
    blue_grad: 'linear-gradient(135deg,#BFDBFE,#93C5FD)',
    sunset: 'linear-gradient(135deg,#FDBA74,#F472B6)',
    space: 'linear-gradient(135deg,#1E1B4B,#312E81)',
    custom: '#E5E7EB',
};

const INTEREST_PRESETS = [
    '💻 Программирование', '🎮 Игры', '⚽ Спорт', '🎵 Музыка',
    '📚 Книги', '🎨 Рисование', '🎬 Кино', '🤖 Роботы',
    '🧮 Математика', '🚀 Космос', '🐱 Животные', '🍕 Еда',
];

const GOAL_PRESETS = [
    'Сдать ЕГЭ на 80+',
    'Сдать ЕГЭ на 90+',
    'Поступить в ИТ-вуз',
    'Научиться программировать',
    'Победить в олимпиаде',
    'Просто для себя',
];

const ALL_PACKS = [
    { key: 'free',     title: '🎨 Базовые' },
    { key: 'cats',     title: '🐱 Кошки' },
    { key: 'dogs',     title: '🐶 Собаки' },
    { key: 'foxes',    title: '🦊 Лисы' },
    { key: 'robots',   title: '🤖 Роботы' },
    { key: 'gamers',   title: '🎮 Геймеры' },
    { key: 'mythical', title: '🐉 Мифические' },
];

export default function StudentProfileCard({ userId, fallbackName = 'Ученик' }) {
    const [profile, setProfile] = useState(null);
    const [cosmetics, setCosmetics] = useState([]);
    const [bgPreview, setBgPreview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editOpen, setEditOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [stats, setStats] = useState({ lessonsDone: 0, avgScore: null, daysIn: 0 });

    // Модалка выбора аватара
    const [pickerOpen, setPickerOpen] = useState(false);
    const [pickerTab, setPickerTab] = useState(0);
    const [packItems, setPackItems] = useState({});
    const [packLoading, setPackLoading] = useState(false);
    const [applying, setApplying] = useState(false);

    const [form, setForm] = useState({
        fullName: '', school: '', grade: '', bio: '', interests: [], goal: '',
    });

    const avatarInputRef = useRef(null);

    // ✅ Собираем доступные вкладки (free + купленные)
    const availablePacks = useMemo(() => {
        const purchasedKeys = cosmetics
            .filter(c => c.itemType === 'AVATAR_PACK')
            .map(c => c.itemKey);
        
        // Всегда free + купленные
        return ALL_PACKS.filter(p => p.key === 'free' || purchasedKeys.includes(p.key));
    }, [cosmetics]);

    useEffect(() => {
        if (userId) {
            fetchProfile();
            axiosInstance.get(`/cosmetics/active/${userId}`)
                .then((r) => {
                    const list = r.data || [];
                    setCosmetics(list);
                    const bg = list.find(c => c.itemType === 'BACKGROUND' && c.active);
                    if (bg) setBgPreview(BG_MAP[bg.itemKey] || null);
                })
                .catch(() => {});
        }
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
            setStats({
                lessonsDone: data.lessonsDone || 0,
                avgScore: data.avgScore || null,
                daysIn: data.daysIn || calcDaysIn(data.createdAt),
            });
        } catch (err) {
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
            if (avatarInputRef.current) avatarInputRef.current.value = '';
        }
    };

    const openPicker = () => {
        setPickerOpen(true);
        setPickerTab(0); // всегда начинаем с free
        if (!packItems['free']) loadPack('free');
    };

    const loadPack = async (packKey) => {
        if (packItems[packKey]) return;
        setPackLoading(true);
        try {
            const res = await axiosInstance.get(`/cosmetics/packs/${packKey}`);
            setPackItems(prev => ({ ...prev, [packKey]: res.data || [] }));
        } catch (e) {
        } finally {
            setPackLoading(false);
        }
    };

    const handlePickerTabChange = (e, v) => {
        setPickerTab(v);
        loadPack(availablePacks[v].key);
    };

    const applyPackAvatar = async (packKey, index) => {
        setApplying(true);
        try {
            await axiosInstance.post(`/students/${userId}/avatar-from-pack`, {
                packKey, index,
            });
            const url = `/uploads/avatars/packs/${packKey}/${index}.jpg`;
            setProfile(prev => ({ ...prev, avatar: url }));
            setPickerOpen(false);
        } catch (e) {
            alert('Не удалось установить аватар: ' + (e.response?.data?.error || e.message));
        } finally {
            setApplying(false);
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
    const FRAME_MAP = {
        silver:  { border: '3px solid #C0C0C0' },
        gold_fr: { border: '3px solid #FFD700' },
        diamond: { border: '3px solid #67E8F9', boxShadow: '0 0 16px #67E8F9' },
        fire:    { border: '3px solid #F97316', boxShadow: '0 0 16px #EF4444' },
        royal:   { border: '3px solid #7C3AED', boxShadow: '0 0 16px #7C3AED' },
    };
    const activeFrame = cosmetics.find((c) => c.itemType === 'AVATAR_FRAME');
    const frameStyle = activeFrame ? FRAME_MAP[activeFrame.itemKey] || {} : { border: `3px solid ${LIME}` };

    return (
        <>
            <Paper sx={{
                p: 3, borderRadius: 4,
                background: bgPreview || CARD,
                border: `1px solid ${LINE}`, overflow: 'hidden',
                transition: 'background 0.3s ease',
            }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2.5 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Avatar
                            src={profile?.avatar || undefined}
                            sx={{
                                width: 128, height: 128,
                                bgcolor: PURPLE_SOFT, color: PURPLE,
                                fontWeight: 800, fontSize: '2.4rem',
                                cursor: 'pointer',
                                ...frameStyle,
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
                    <Box sx={{ mt: 2.5, display: 'flex', justifyContent: 'center' }}>
                        <NickWithCosmetics
                            studentId={userId}
                            name={name}
                            showAvatar={false}
                            fontSize="1.35rem"
                        />
                    </Box>
                    {(profile?.school || profile?.grade) && (
                        <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem', mt: 0.5, textAlign: 'center' }}>
                            {[profile?.grade && `${profile.grade} класс`, profile?.school].filter(Boolean).join(' · ')}
                        </Typography>
                    )}
                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                        <Button
                            size="small"
                            startIcon={<PaletteIcon sx={{ fontSize: 15 }} />}
                            onClick={openPicker}
                            sx={{
                                textTransform: 'none', color: PURPLE,
                                fontWeight: 600, fontSize: '0.82rem',
                                borderRadius: 100, px: 2, py: 0.75,
                                bgcolor: 'rgba(255,255,255,0.85)',
                                '&:hover': { bgcolor: '#DDD3FF' },
                            }}
                        >
                            Выбрать аватар
                        </Button>
                        <Button
                            size="small"
                            startIcon={<EditIcon sx={{ fontSize: 15 }} />}
                            onClick={() => setEditOpen(true)}
                            sx={{
                                textTransform: 'none', color: PURPLE,
                                fontWeight: 600, fontSize: '0.82rem',
                                borderRadius: 100, px: 2, py: 0.75,
                                bgcolor: 'rgba(255,255,255,0.85)',
                                '&:hover': { bgcolor: '#DDD3FF' },
                            }}
                        >
                            Редактировать
                        </Button>
                    </Stack>
                </Box>

                <Divider sx={{ my: 2.5, borderColor: LINE }} />

                <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}>
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

                {interests.length > 0 && (
                    <Box sx={{ mb: 2.5, p: 1.5, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.7)' }}>
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

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.25 }}>
                    <MiniStat icon={<CheckIcon sx={{ fontSize: 16 }} />} value={stats.lessonsDone} label="уроков" color={GREEN} bg={GREEN_SOFT} />
                    <MiniStat icon={<GoalIcon sx={{ fontSize: 16 }} />} value={stats.avgScore ?? '—'} label="средн." color={AMBER} bg={AMBER_SOFT} />
                    <MiniStat icon={<CalendarIcon sx={{ fontSize: 16 }} />} value={stats.daysIn} label="дней" color={PURPLE} bg={PURPLE_SOFT} />
                </Box>
            </Paper>

            {/* МОДАЛКА ВЫБОРА АВАТАРА */}
            <Dialog
                open={pickerOpen}
                onClose={() => !applying && setPickerOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3 } }}
            >
                <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography fontWeight={800}>Выбери аватар</Typography>
                    <IconButton onClick={() => setPickerOpen(false)} disabled={applying} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Кликни на понравившуюся картинку — она станет твоим аватаром. Купленные наборы доступны в отдельных вкладках.
                    </Typography>
                    <Tabs
                        value={pickerTab}
                        onChange={handlePickerTabChange}
                        variant="scrollable"
                        scrollButtons="auto"
                        sx={{ mb: 2, '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 'auto', px: 1.5 } }}
                    >
                        {availablePacks.map((p) => <Tab key={p.key} label={p.title} />)}
                    </Tabs>

                    {packLoading && !packItems[availablePacks[pickerTab]?.key] ? (
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                gap: 2,
                                flexWrap: 'wrap',
                                justifyContent: 'center',
                                py: 1,
                                minHeight: 240,
                            }}
                        >
                            {(packItems[availablePacks[pickerTab]?.key] || []).map((url, idx) => {
                                const index = idx + 1;
                                return (
                                    <Box
                                        key={index}
                                        onClick={() => !applying && applyPackAvatar(availablePacks[pickerTab].key, index)}
                                        sx={{
                                            width: 100,
                                            height: 100,
                                            borderRadius: 2,
                                            overflow: 'hidden',
                                            cursor: applying ? 'not-allowed' : 'pointer',
                                            border: '2px solid #EAEAEA',
                                            transition: 'all 0.15s ease',
                                            opacity: applying ? 0.5 : 1,
                                            position: 'relative',
                                            flexShrink: 0,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                                            '&:hover': {
                                                transform: applying ? 'none' : 'scale(1.05)',
                                                borderColor: '#7B5CFA',
                                            },
                                        }}
                                    >
                                        <img
                                            src={`/api${url}`}
                                            alt={`Аватар ${index}`}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    )}
                </DialogContent>
            </Dialog>

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