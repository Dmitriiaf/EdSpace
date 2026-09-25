// ========== frontend/src/pages/StudentDashboard.js (v4 — фикс UTC) ==========
import React, { useState, useEffect, useMemo } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import axiosInstance from '../api/axiosConfig';
import {
    Box, Grid, Typography, Paper, Chip, CircularProgress, Alert,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    IconButton, Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Avatar, Divider, Stack, Collapse, TextField,
    Breadcrumbs, Link as MuiLink, Tabs, Tab,
    FormControl, Select, MenuItem
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { formatLessonTime } from '../utils/timezone';
import { Payment as PaymentIcon } from '@mui/icons-material';
import { useStudentRate } from '../hooks/useStudentRate';
import {
    CalendarToday as CalendarIcon,
    Person as PersonIcon,
    Close as CloseIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Folder as FolderIcon,
    Download as DownloadIcon,
    Description as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    NavigateNext as NavigateNextIcon,
    Assignment as AssignmentIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    OpenInNew as OpenInNewIcon,
    Link as LinkIcon,
    Info as InfoIcon,
    Videocam as VideocamIcon,
    ArrowBackIosNew as ArrowBackIcon,
    ArrowForwardIos as ArrowForwardSmallIcon,
    Brush as BrushIcon,
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import {
    format, isSameDay, addDays, startOfWeek, subDays,
    startOfMonth, endOfMonth, addMonths, subMonths,
    getDay, isSameMonth, isToday,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { getLessonsByStudent, getStudentProgressStats, getProgressTimeline } from '../services/api';
import LessonRoom from '../components/LessonRoom';
import ChatDrawer from '../components/ChatDrawer';
import StudentProfileCard from '../components/StudentProfileCard';

// ========== ПАЛИТРА ==========
const BG = '#FAFAFA';
const BG_ALT = '#F5F5F7';
const DARK = '#141414';
const CARD = '#FFFFFF';
const INK = '#141414';
const INK_SOFT = '#555555';
const INK_MUTED = '#999999';
const LINE = '#EAEAEA';

const LIME = '#C4F542';
const LIME_SOFT = '#EBFFB0';
const PURPLE = '#7B5CFA';
const PURPLE_SOFT = '#EDE7FF';
const PINK = '#FF5FA2';
const PINK_SOFT = '#FFE0EE';
const GREEN = '#10B981';
const GREEN_SOFT = '#D9F5E0';
const AMBER = '#F59E0B';
const AMBER_SOFT = '#FFF3D6';
const BLUE = '#3B82F6';
const BLUE_SOFT = '#DBEAFE';
const RED = '#EF4444';
const RED_SOFT = '#FEE2E2';

const MELETO_BOARD_URL = 'https://meleto.org/board/84dc92e5-6848-4e22-a31c-d16472b248d7';

// ========== АНИМАЦИИ ==========
const fadeUp = keyframes`
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
`;

const Reveal = styled(Box)(({ delay = 0 }) => ({
    animation: `${fadeUp} 0.5s cubic-bezier(0.25, 0.9, 0.35, 1) ${delay}s both`,
}));

const PillButton = styled(Button)(({ $variant = 'dark' }) => ({
    textTransform: 'none',
    fontWeight: 600,
    fontSize: '0.85rem',
    padding: '9px 20px',
    borderRadius: 100,
    boxShadow: 'none',
    transition: 'all 0.2s ease',
    fontFamily: '"Inter", "Segoe UI", sans-serif',
    ...($variant === 'dark' && {
        background: DARK, color: '#FFF',
        '&:hover': { background: '#000', transform: 'translateY(-1px)' },
    }),
    ...($variant === 'lime' && {
        background: LIME, color: DARK,
        '&:hover': { background: LIME_SOFT, transform: 'translateY(-1px)' },
    }),
    ...($variant === 'ghost' && {
        background: 'transparent', color: INK, border: `1px solid ${LINE}`,
        '&:hover': { background: BG_ALT, borderColor: INK },
    }),
    ...($variant === 'purple' && {
        background: PURPLE, color: '#FFF',
        '&:hover': { background: '#6B4BEB', transform: 'translateY(-1px)' },
    }),
}));

// ========== ИКОНКИ ФАЙЛОВ ==========
const FileTypeIcon = ({ fileName, size = 24 }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const sx = { fontSize: size };
    if (ext === 'pdf') return <PdfIcon sx={{ ...sx, color: RED }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ ...sx, color: GREEN }} />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <VideoIcon sx={{ ...sx, color: PURPLE }} />;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <AudioIcon sx={{ ...sx, color: AMBER }} />;
    return <FileIcon sx={{ ...sx, color: INK_MUTED }} />;
};

const LessonStatusBadge = ({ status }) => {
    const config = {
        'SCHEDULED': { label: 'Запланировано', color: PURPLE, bg: PURPLE_SOFT, icon: ScheduleIcon },
        'IN_PROGRESS': { label: 'Идёт сейчас', color: GREEN, bg: GREEN_SOFT, icon: VideocamIcon },
        'COMPLETED': { label: 'Проведено', color: AMBER, bg: AMBER_SOFT, icon: CheckIcon },
        'PAID': { label: 'Оплачено', color: AMBER, bg: AMBER_SOFT, icon: ScheduleIcon },
        'CONFIRMED': { label: 'Подтверждено', color: GREEN, bg: GREEN_SOFT, icon: CheckIcon },
        'CANCELLED': { label: 'Отменено', color: RED, bg: RED_SOFT, icon: CancelIcon },
        'RESCHEDULED': { label: 'Перенесено', color: PURPLE, bg: PURPLE_SOFT, icon: ScheduleIcon },
    };
    const cfg = config[status] || { label: status, color: INK_MUTED, bg: BG_ALT, icon: InfoIcon };
    const Icon = cfg.icon;
    return (
        <Chip
            icon={<Icon sx={{ fontSize: 12, color: `${cfg.color} !important` }} />}
            label={cfg.label}
            size="small"
            sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 600, fontSize: '0.68rem', height: 22, borderRadius: 100 }}
        />
    );
};

// ========== КАЛЕНДАРЬ МЕСЯЦА ==========
function MonthCalendar({ month, setMonth, lessonsByDate, selectedDate, setSelectedDate, onDayClick }) {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);

    const startWeekday = (getDay(monthStart) + 6) % 7; // ПН = 0
    const daysInMonth = monthEnd.getDate();

    const cells = [];
    for (let i = 0; i < startWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(month.getFullYear(), month.getMonth(), d));

    const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

    return (
        <Paper sx={{ p: 2, borderRadius: 4, bgcolor: CARD, border: `1px solid ${LINE}`, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.95rem', textTransform: 'capitalize' }}>
                    {format(month, 'LLLL yyyy', { locale: ru })}
                </Typography>
                <Stack direction="row" spacing={0.5}>
                    <IconButton size="small" onClick={() => setMonth(subMonths(month, 1))}
                        sx={{ border: `1px solid ${LINE}`, width: 26, height: 26 }}>
                        <ArrowBackIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                    <Button size="small"
                        onClick={() => { setMonth(new Date()); setSelectedDate(new Date()); }}
                        sx={{ border: `1px solid ${LINE}`, color: INK, px: 1, borderRadius: 2, fontSize: '0.68rem', fontWeight: 600, textTransform: 'none', minWidth: 0 }}>
                        Сегодня
                    </Button>
                    <IconButton size="small" onClick={() => setMonth(addMonths(month, 1))}
                        sx={{ border: `1px solid ${LINE}`, width: 26, height: 26 }}>
                        <ArrowForwardSmallIcon sx={{ fontSize: 11 }} />
                    </IconButton>
                </Stack>
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
                mb: 0.5,
            }}>
                {WEEKDAYS.map((d, i) => (
                    <Typography key={i} sx={{
                        textAlign: 'center',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        color: INK_MUTED,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                    }}>
                        {d}
                    </Typography>
                ))}
            </Box>

            <Box sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: 0.5,
            }}>
                {cells.map((day, idx) => {
                    if (!day) {
                        return <Box key={idx} sx={{ height: 40 }} />;
                    }

                    const dateStr = format(day, 'yyyy-MM-dd');
                    const hasLessons = (lessonsByDate[dateStr] || []).length > 0;
                    const isSelected = isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, month);
                    const today = isToday(day);

                    return (
                        <Box
                            key={idx}
                            onClick={() => {
                                setSelectedDate(day);
                                if (typeof onDayClick === 'function') onDayClick(day);
                            }}
                            sx={{
                                height: 40,
                                borderRadius: 2,
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: isSelected ? DARK : 'transparent',
                                color: isSelected ? '#FFF' : (isCurrentMonth ? INK : INK_MUTED),
                                border: today && !isSelected ? `1px solid ${PURPLE}` : '1px solid transparent',
                                transition: 'all 0.15s ease',
                                '&:hover': { bgcolor: isSelected ? DARK : BG_ALT },
                            }}
                        >
                            <Typography sx={{
                                fontSize: '0.82rem',
                                fontWeight: isSelected || today ? 700 : 500,
                                color: isSelected ? LIME : 'inherit',
                                lineHeight: 1,
                            }}>
                                {format(day, 'd')}
                            </Typography>
                            {hasLessons && (
                                <Box sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: isSelected ? LIME : PURPLE,
                                    mt: 0.4,
                                }} />
                            )}
                        </Box>
                    );
                })}
            </Box>
        </Paper>
    );
}

// ========== ГЛАВНЫЙ КОМПОНЕНТ ==========
function StudentDashboard() {
    const { getStudentRateForTutor } = useStudentRate();
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Ученик'; }, []);

    const [studentSelfPaid, setStudentSelfPaid] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    const [allLessons, setAllLessons] = useState([]);
    const [homeworkStats, setHomeworkStats] = useState(null);
    const [progressTimeline, setProgressTimeline] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [month, setMonth] = useState(new Date());
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [dayDialogOpen, setDayDialogOpen] = useState(false);
    const [selectedTutorId, setSelectedTutorId] = useState('all');
    const [expandedLessonId, setExpandedLessonId] = useState(null);
    const [lessonRoomOpen, setLessonRoomOpen] = useState(false);
    const [selectedLessonForRoom, setSelectedLessonForRoom] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allMaterialsData, setAllMaterialsData] = useState({ materials: [], folders: [] });
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [coursesByTutor, setCoursesByTutor] = useState({});
    const [stepikCourses, setStepikCourses] = useState([]);
    const [homeworkList, setHomeworkList] = useState([]);
    const [gameRecord, setGameRecord] = useState({ highScore: 0, place: null });
    const [ratingOpen, setRatingOpen] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);

    const tutors = useMemo(() => {
        const map = new Map();
        allLessons.forEach(l => {
            if (l.tutor && !map.has(l.tutor.id)) map.set(l.tutor.id, l.tutor);
        });
        return Array.from(map.values());
    }, [allLessons]);

    const filteredLessons = useMemo(() => {
        if (selectedTutorId === 'all') return allLessons;
        return allLessons.filter(l => l.tutor?.id === parseInt(selectedTutorId));
    }, [allLessons, selectedTutorId]);

    // ✅ ФИКС: UTC-парсинг + учитываем IN_PROGRESS, пока урок не закончился
    const stats = useMemo(() => {
        const now = new Date();
        const nextLesson = filteredLessons
            .filter(l => {
                const start = new Date(`${l.lessonDate}T${l.startTime}Z`);
                const end = new Date(`${l.lessonDate}T${l.endTime}Z`);
                const statusOk = ['SCHEDULED', 'RESCHEDULED', 'IN_PROGRESS'].includes(l.status);
                // Показываем, если урок ещё не закончился
                return statusOk && end > now;
            })
            .sort((a, b) =>
                new Date(`${a.lessonDate}T${a.startTime}Z`) - new Date(`${b.lessonDate}T${b.startTime}Z`)
            )[0] || null;
        return { nextLesson };
    }, [filteredLessons]);

    const lessonsOnSelectedDate = useMemo(() => {
        return filteredLessons
            .filter(l => isSameDay(new Date(l.lessonDate), selectedDate))
            .sort((a, b) => a.startTime?.localeCompare(b.startTime));
    }, [filteredLessons, selectedDate]);

    const lessonsByDate = useMemo(() => {
        const map = {};
        filteredLessons.forEach(l => {
            const key = l.lessonDate;
            if (!map[key]) map[key] = [];
            map[key].push(l);
        });
        return map;
    }, [filteredLessons]);

    // ✅ ФИКС: Z в сортировке журнала
    const journal = useMemo(() => {
        return filteredLessons
            .filter(l => ['COMPLETED', 'PAID', 'CONFIRMED'].includes(l.status))
            .filter(l => l.notes && l.notes.trim())
            .sort((a, b) =>
                new Date(`${b.lessonDate}T${b.startTime}Z`) - new Date(`${a.lessonDate}T${a.startTime}Z`)
            )
            .slice(0, 20);
    }, [filteredLessons]);

    useEffect(() => {
        if (user && user.id) {
            fetchAllData();
            fetchStepikCourses();
            fetchHomeworkList();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchLessons(),
                fetchMaterials(),
                fetchHomeworkStats(),
                fetchStudentProfile(),
                fetchGameRecord(),
            ]);
        } catch (err) {
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const fetchGameRecord = async () => {
        try {
            const res = await axiosInstance.get('/games/my-score?game=flappy');
            setGameRecord({ highScore: res.data.highScore || 0, place: res.data.place });
        } catch (err) {}
    };

    const fetchLeaderboard = async () => {
        try {
            const res = await axiosInstance.get('/games/leaderboard?game=flappy');
            setLeaderboard(res.data || []);
        } catch (err) {
            setLeaderboard([]);
        }
    };

    const fetchStepikCourses = async () => {
        try {
            const studentId = user?.allIds?.[0] || user?.id;
            const res = await axiosInstance.get(`/stepik/student/${studentId}/courses`);
            setStepikCourses(res.data || []);
        } catch (err) {}
    };

    const fetchHomeworkList = async () => {
        try {
            const studentId = user?.allIds?.[0] || user?.id;
            const res = await axiosInstance.get(`/homework/student/${studentId}/all`);
            setHomeworkList(res.data || []);
        } catch (err) {}
    };

    const fetchStudentProfile = async () => {
        try {
            const studentId = user?.allIds?.[0] || user?.id;
            const res = await axiosInstance.get(`/students/${studentId}`);
            setStudentSelfPaid(res.data.selfPaid || false);
        } catch (err) {}
    };

    const fetchLessons = async () => {
        try {
            const allStudentIds = user?.allIds || [user?.id];
            let allLessonsData = [];
            const tutorCoursesMap = {};
            for (const studentId of allStudentIds) {
                try {
                    const response = await getLessonsByStudent(studentId);
                    const arr = response.data !== undefined ? response.data : response;
                    allLessonsData = [...allLessonsData, ...arr];
                    arr.forEach(lesson => {
                        if (lesson.tutor && lesson.course) {
                            if (!tutorCoursesMap[lesson.tutor.id]) tutorCoursesMap[lesson.tutor.id] = new Set();
                            tutorCoursesMap[lesson.tutor.id].add(lesson.course.id);
                        }
                    });
                } catch (err) {}
            }
            const coursesMap = {};
            Object.keys(tutorCoursesMap).forEach(tid => { coursesMap[tid] = Array.from(tutorCoursesMap[tid]); });
            setCoursesByTutor(coursesMap);

            let unique = allLessonsData.filter((l, i, self) => i === self.findIndex(ls => ls.id === l.id));
            const rescheduled = unique.filter(l => l.status === 'RESCHEDULED');
            const idsToHide = new Set();
            rescheduled.forEach(rl => {
                const hasReplacement = unique.some(l =>
                    l.id !== rl.id && l.student?.id === rl.student?.id &&
                    l.lessonDate === rl.lessonDate &&
                    (l.status === 'SCHEDULED' || l.status === 'IN_PROGRESS'));
                if (hasReplacement) idsToHide.add(rl.id);
            });
            unique = unique.filter(l => !idsToHide.has(l.id));
            setAllLessons(unique.sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate)));
        } catch (err) {}
    };

    const fetchMaterials = async () => {
        try {
            const res = await axiosInstance.get(`/materials/student/${user.id}`);
            const data = { materials: res.data.materials || [], folders: res.data.folders || [] };
            setAllMaterialsData(data);
            filterMaterialsByTutor(data, selectedTutorId);
        } catch (err) {}
    };

    const filterMaterialsByTutor = (data, tutorId) => {
        if (!data) return;
        if (tutorId === 'all') { setMaterials(data.materials); setFolders(data.folders); return; }
        const allowedCourseIds = coursesByTutor[parseInt(tutorId)] || [];
        setMaterials(data.materials.filter(m => m.course ? allowedCourseIds.includes(m.course.id) : true));
        setFolders(data.folders.filter(f => f.course ? allowedCourseIds.includes(f.course.id) : true));
    };

    const loadFolderContent = async (folderId) => {
        try {
            const res = await axiosInstance.get(`/materials/student/${user.id}/folder/${folderId}`);
            const data = { materials: res.data.materials || [], folders: res.data.folders || [] };
            filterMaterialsByTutor(data, selectedTutorId);
        } catch (err) {}
    };

    const fetchHomeworkStats = async () => {
        try {
            const statsRes = await getStudentProgressStats(user.id);
            const timelineRes = await getProgressTimeline(user.id);
            setHomeworkStats(statsRes.data);
            setProgressTimeline(timelineRes.data.timeline || []);
        } catch (err) {}
    };

    useEffect(() => {
        if (allMaterialsData.materials.length || allMaterialsData.folders.length) {
            filterMaterialsByTutor(allMaterialsData, selectedTutorId);
        }
    }, [selectedTutorId]);

    const handleFolderClick = async (folder) => {
        setCurrentFolder(folder.id);
        setFolderPath([...folderPath, folder]);
        await loadFolderContent(folder.id);
    };
    const handleRootClick = async () => {
        setCurrentFolder(null);
        setFolderPath([]);
        filterMaterialsByTutor(allMaterialsData, selectedTutorId);
    };
    const handleBreadcrumbClick = async (folder, index) => {
        const newPath = folderPath.slice(0, index + 1);
        setFolderPath(newPath);
        if (index === -1 || !folder) {
            setCurrentFolder(null);
            filterMaterialsByTutor(allMaterialsData, selectedTutorId);
        } else {
            setCurrentFolder(folder.id);
            await loadFolderContent(folder.id);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const handleDownload = async (material) => {
        try {
            const res = await axiosInstance.get(`/materials/download/${material.id}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = material.fileName || material.title;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {}
    };

    const handlePayLesson = async (lesson) => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,.pdf,.doc,.docx';
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) { alert('Файл слишком большой. Максимум 2MB'); return; }
            try {
                const rate = getStudentRateForTutor(lesson.student, lesson.tutor?.id);
                const paymentRes = await axiosInstance.post('/payments/lesson', {
                    tutorId: lesson.tutor?.id, studentId: lesson.student?.id,
                    amount: rate, paymentType: 'single', lessonId: lesson.id,
                });
                const paymentId = paymentRes.data.id;
                if (!paymentId) { alert('Ошибка: не удалось создать платёж'); return; }
                const formData = new FormData();
                formData.append('file', file);
                await axiosInstance.post(`/payments/${paymentId}/upload-receipt`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                alert('✅ Чек загружен! Репетитор подтвердит оплату.');
                fetchAllData();
            } catch (err) {
                alert('Ошибка: ' + (err.response?.data?.error || 'Не удалось загрузить чек'));
            }
        };
        fileInput.click();
    };

    // ✅ ФИКС: Z в парсинге дат предыдущего урока
    const getPreviousLessonFor = (lesson) => {
        if (!lesson) return null;
        const lessonDateTime = new Date(`${lesson.lessonDate}T${lesson.startTime}Z`);
        const candidates = filteredLessons
            .filter(l => {
                if (l.id === lesson.id) return false;
                const sameStudent = l.student?.id === lesson.student?.id;
                const sameCourse = l.course?.id === lesson.course?.id;
                const isCompleted = ['COMPLETED', 'PAID', 'CONFIRMED'].includes(l.status);
                const lDate = new Date(`${l.lessonDate}T${l.startTime}Z`);
                return sameStudent && sameCourse && isCompleted && lDate < lessonDateTime;
            })
            .sort((a, b) =>
                new Date(`${b.lessonDate}T${b.startTime}Z`) - new Date(`${a.lessonDate}T${a.startTime}Z`)
            );
        return candidates[0] || null;
    };

    const openRating = async () => {
        setRatingOpen(true);
        if (leaderboard.length === 0) await fetchLeaderboard();
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <EdSpaceLoader text="Загрузка..." />
        </Box>
    );

    if (error) return (<Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>);

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{
                bgcolor: BG, minHeight: '100vh', width: '100%',
                fontFamily: '"Inter", "Segoe UI", sans-serif',
            }}>
                <Box sx={{
                    display: 'flex', gap: 2.5, p: { xs: 2, sm: 3 },
                    flexWrap: { xs: 'wrap', lg: 'nowrap' },
                    alignItems: 'flex-start',
                    width: '100%', boxSizing: 'border-box', maxWidth: '100%',
                }}>
                    {/* ===== ОСНОВНАЯ ЧАСТЬ ===== */}
                    <Box sx={{ flex: '1 1 0', minWidth: 0 }}>
                        {/* ХЕДЕР */}
                        <Reveal>
                            <Box sx={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                flexWrap: 'wrap', gap: 2, mb: 3,
                            }}>
                                <Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                                        <Typography sx={{
                                            fontSize: { xs: '1.6rem', md: '2rem' },
                                            fontWeight: 800, letterSpacing: '-0.03em', color: INK,
                                        }}>
                                            Привет, {user?.fullName?.split(' ')[0] || 'друг'} 👋
                                        </Typography>

                                        <Chip
                                            icon={<Box component="span" sx={{ fontSize: '0.85rem' }}>🏆</Box>}
                                            label={gameRecord.place ? `#${gameRecord.place}` : '—'}
                                            size="small"
                                            onClick={openRating}
                                            sx={{
                                                bgcolor: LIME_SOFT, color: DARK,
                                                fontWeight: 700, fontSize: '0.8rem',
                                                borderRadius: 100, cursor: 'pointer',
                                                '&:hover': { bgcolor: LIME },
                                            }}
                                        />
                                    </Box>
                                    <Typography sx={{ color: INK_MUTED, fontSize: '0.95rem', mt: 0.5 }}>
                                        {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
                                    </Typography>
                                </Box>

                                {tutors.length > 1 && (
                                    <FormControl size="small" sx={{ minWidth: 180 }}>
                                        <Select
                                            value={selectedTutorId}
                                            onChange={(e) => setSelectedTutorId(e.target.value)}
                                            displayEmpty
                                            sx={{
                                                borderRadius: 100, bgcolor: CARD,
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: LINE },
                                                fontSize: '0.85rem',
                                            }}
                                        >
                                            <MenuItem value="all">Все репетиторы</MenuItem>
                                            {tutors.map(t => (
                                                <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                )}
                            </Box>
                        </Reveal>

                        {/* ВЕРХ: БЛИЖАЙШЕЕ ЗАНЯТИЕ + КАЛЕНДАРЬ */}
                        <Reveal delay={0.05}>
                            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                                <Grid item xs={12} md={7}>
                                    <Paper sx={{
                                        p: { xs: 2.5, md: 3 }, borderRadius: 4,
                                        bgcolor: CARD, border: `2px solid ${PURPLE}`,
                                        height: '100%', position: 'relative', overflow: 'hidden',
                                        display: 'flex', flexDirection: 'column', justifyContent: 'center',
                                    }}>
                                        <Typography sx={{ fontSize: '0.75rem', color: INK_MUTED, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', mb: 1.5 }}>
                                            Ближайшее занятие
                                        </Typography>
                                        {stats.nextLesson ? (
                                            <>
                                                <Typography sx={{ fontSize: { xs: '1.4rem', md: '1.7rem' }, fontWeight: 800, color: INK, letterSpacing: '-0.02em', mb: 0.5 }}>
                                                    {format(new Date(stats.nextLesson.lessonDate), 'd MMMM', { locale: ru })}
                                                    {' · '}
                                                    {formatLessonTime(stats.nextLesson.lessonDate, stats.nextLesson.startTime)} — {formatLessonTime(stats.nextLesson.lessonDate, stats.nextLesson.endTime)}
                                                </Typography>
                                                <Typography sx={{ color: INK_SOFT, fontSize: '0.95rem', fontWeight: 500, mb: 2 }}>
                                                    {stats.nextLesson.course?.name || 'Занятие'} · {stats.nextLesson.tutor?.fullName}
                                                </Typography>
                                                <Box>
                                                    <PillButton $variant="purple"
                                                        startIcon={<VideocamIcon sx={{ fontSize: 16 }} />}
                                                        onClick={() => { setSelectedLessonForRoom(stats.nextLesson); setLessonRoomOpen(true); }}>
                                                        {stats.nextLesson.status === 'IN_PROGRESS' ? 'Вернуться в конференцию' : 'Начать урок'}
                                                    </PillButton>
                                                </Box>
                                            </>
                                        ) : (
                                            <>
                                                <Typography sx={{ fontSize: '1.3rem', fontWeight: 800, color: INK_MUTED, mb: 0.5 }}>
                                                    Пока ничего не запланировано
                                                </Typography>
                                                <Typography sx={{ color: INK_SOFT, fontSize: '0.9rem' }}>
                                                    Как только репетитор назначит занятие, оно появится здесь
                                                </Typography>
                                            </>
                                        )}
                                    </Paper>
                                </Grid>

                                <Grid item xs={12} md={5}>
                                    <MonthCalendar
                                        month={month}
                                        setMonth={setMonth}
                                        lessonsByDate={lessonsByDate}
                                        selectedDate={selectedDate}
                                        setSelectedDate={setSelectedDate}
                                        onDayClick={() => setDayDialogOpen(true)}
                                    />
                                </Grid>
                            </Grid>
                        </Reveal>

                        {/* ТАБЫ */}
                        <Reveal delay={0.1}>
                            <Paper sx={{ borderRadius: 4, bgcolor: CARD, border: `1px solid ${LINE}`, p: 3 }}>
                                <Grid container spacing={2.5}>
                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: INK, fontSize: '0.95rem' }}>
                                                📝 Последние задания
                                            </Typography>
                                            <Button size="small" onClick={() => window.location.href = '/homework'}
                                                sx={{ textTransform: 'none', fontSize: '0.78rem', fontWeight: 600, color: INK, minWidth: 0 }}>
                                                Все →
                                            </Button>
                                        </Box>
                                        <Stack spacing={1}>
                                            {homeworkList.length === 0 && (
                                                <Typography sx={{ color: INK_SOFT, fontSize: '0.85rem' }}>
                                                    Нет заданий 🎉
                                                </Typography>
                                            )}
                                            {homeworkList.slice(0, 4).map(item => {
                                                const isVariant = item.type === 'variant' || (item.task && item.task.startsWith('http'));
                                                const statusLabel = item.status === 'checked' ? 'Проверено' :
                                                    item.status === 'submitted' ? 'На проверке' : 'Назначено';
                                                const statusColor = item.status === 'checked' ? GREEN : item.status === 'submitted' ? AMBER : PURPLE;
                                                return (
                                                    <Box key={item.id} sx={{
                                                        p: 1.5, borderRadius: 2, bgcolor: BG_ALT,
                                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1,
                                                    }}>
                                                        <Box sx={{ minWidth: 0, flex: 1 }}>
                                                            <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: INK, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                                {isVariant ? (item.variantTitle || 'Вариант') : 'Задание'}
                                                            </Typography>
                                                            <Typography sx={{ fontSize: '0.72rem', color: INK_MUTED }}>
                                                                Срок: {item.dueDate ? format(new Date(item.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                            </Typography>
                                                        </Box>
                                                        <Chip label={statusLabel} size="small"
                                                            sx={{ fontSize: '0.62rem', height: 20, bgcolor: `${statusColor}20`, color: statusColor, fontWeight: 700, borderRadius: 100 }} />
                                                    </Box>
                                                );
                                            })}
                                        </Stack>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                                            <Typography sx={{ fontWeight: 800, color: INK, fontSize: '0.95rem' }}>
                                                📖 Журнал пройденных тем
                                            </Typography>
                                            <Button size="small" onClick={() => window.location.href = '/progress'}
                                                sx={{ textTransform: 'none', fontSize: '0.78rem', fontWeight: 600, color: INK, minWidth: 0 }}>
                                                Все →
                                            </Button>
                                        </Box>
                                        {journal.length === 0 ? (
                                            <Typography sx={{ color: INK_MUTED, fontSize: '0.85rem' }}>
                                                Пока нет проведённых уроков
                                            </Typography>
                                        ) : (
                                            <Stack spacing={1}>
                                                {journal.slice(0, 4).map(lesson => (
                                                    <Box key={lesson.id} sx={{
                                                        display: 'flex', gap: 1.5, alignItems: 'flex-start',
                                                        p: 1.5, borderRadius: 2, bgcolor: BG_ALT,
                                                    }}>
                                                        <Box sx={{
                                                            width: 20, height: 20, borderRadius: '50%',
                                                            bgcolor: GREEN, color: '#FFF',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            fontSize: '0.7rem', fontWeight: 900, flexShrink: 0, mt: 0.25,
                                                        }}>✓</Box>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: INK }}>
                                                                {lesson.course?.name || 'Занятие'} · {format(new Date(lesson.lessonDate), 'd MMM', { locale: ru })}
                                                            </Typography>
                                                            <Typography sx={{ color: INK_SOFT, fontSize: '0.8rem', mt: 0.5, lineHeight: 1.5 }}>
                                                                {lesson.notes?.length > 130 ? lesson.notes.substring(0, 130) + '…' : lesson.notes}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                ))}
                                            </Stack>
                                        )}
                                    </Grid>
                                </Grid>
                            </Paper>
                        </Reveal>
                    </Box>

                    {/* ===== ПРАВАЯ КОЛОНКА: ПРОФИЛЬ ===== */}
                    <Box sx={{
                        flex: { lg: '0 0 320px', xs: '1 1 100%' },
                        width: { lg: 320, xs: '100%' },
                        maxWidth: '100%',
                        minWidth: 0,
                    }}>
                        <Reveal delay={0.15}>
                            <StudentProfileCard
                                userId={user?.allIds?.[0] || user?.id}
                                fallbackName={user?.fullName || 'Ученик'}
                            />
                        </Reveal>
                    </Box>
                </Box>

                <ChatDrawer />

                {/* ===== МОДАЛКА ДНЯ ===== */}
                <Dialog
                    open={dayDialogOpen}
                    onClose={() => setDayDialogOpen(false)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 4, p: 0 } }}
                >
                    <DialogTitle sx={{ p: 3, pb: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box>
                                <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: INK, letterSpacing: '-0.02em' }}>
                                    {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                                </Typography>
                                <Typography sx={{ fontSize: '0.82rem', color: INK_MUTED, mt: 0.25 }}>
                                    {format(selectedDate, 'EEEE', { locale: ru })}
                                </Typography>
                            </Box>
                            <IconButton onClick={() => setDayDialogOpen(false)} size="small">
                                <CloseIcon />
                            </IconButton>
                        </Box>
                    </DialogTitle>

                    <DialogContent dividers sx={{ borderColor: LINE, p: 3 }}>
                        {lessonsOnSelectedDate.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CalendarIcon sx={{ fontSize: 40, color: LINE, mb: 1.5 }} />
                                <Typography sx={{ color: INK_MUTED, fontWeight: 500 }}>
                                    Нет занятий на эту дату
                                </Typography>
                            </Box>
                        ) : (
                            <Stack spacing={2.5}>
                                {lessonsOnSelectedDate.map(lesson => {
                                    const isCompleted = ['COMPLETED', 'PAID', 'CONFIRMED'].includes(lesson.status);
                                    const isFuture = ['SCHEDULED', 'IN_PROGRESS', 'RESCHEDULED'].includes(lesson.status);
                                    const accentColor = lesson.status === 'CANCELLED' ? RED : isCompleted ? GREEN : PURPLE;
                                    const previousLesson = getPreviousLessonFor(lesson);

                                    const lessonHomework = homeworkList.filter(hw => {
                                        if (hw.lessonId && hw.lessonId === lesson.id) return true;
                                        if (hw.dueDate && isSameDay(new Date(hw.dueDate), selectedDate)) return true;
                                        return false;
                                    });

                                    return (
                                        <Box key={lesson.id} sx={{
                                            p: 2.5, borderRadius: 3, bgcolor: BG_ALT,
                                            borderLeft: `4px solid ${accentColor}`,
                                        }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                                                <Typography sx={{ fontWeight: 700, color: INK, fontSize: '1rem' }}>
                                                    {formatLessonTime(lesson.lessonDate, lesson.startTime)} — {formatLessonTime(lesson.lessonDate, lesson.endTime)}
                                                </Typography>
                                                <LessonStatusBadge status={lesson.status} />
                                            </Box>
                                            <Typography sx={{ color: INK_SOFT, fontSize: '0.88rem', mb: 1 }}>
                                                {lesson.course?.name || 'Занятие'} · {lesson.tutor?.fullName}
                                            </Typography>

                                            {isFuture && previousLesson?.notes && (
                                                <Box sx={{ mt: 1.5, p: 2, bgcolor: '#EFF6FF', borderRadius: 2, borderLeft: `3px solid ${BLUE}` }}>
                                                    <Typography sx={{ color: '#1E40AF', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.75 }}>
                                                        ⏪ Что было на прошлом уроке ({format(new Date(previousLesson.lessonDate), 'd MMM', { locale: ru })})
                                                    </Typography>
                                                    <Typography sx={{ color: INK, fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                        {previousLesson.notes}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {isCompleted && lesson.notes && (
                                                <Box sx={{ mt: 1.5, p: 2, bgcolor: GREEN_SOFT, borderRadius: 2, borderLeft: `3px solid ${GREEN}` }}>
                                                    <Typography sx={{ color: '#065F46', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.75 }}>
                                                        ✅ Что прошли
                                                    </Typography>
                                                    <Typography sx={{ color: INK, fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                        {lesson.notes}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {lesson.nextLessonPlan && (
                                                <Box sx={{ mt: 1.5, p: 2, bgcolor: AMBER_SOFT, borderRadius: 2, borderLeft: `3px solid ${AMBER}` }}>
                                                    <Typography sx={{ color: '#92400E', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 0.75 }}>
                                                        🎯 Что будет на следующем уроке
                                                    </Typography>
                                                    <Typography sx={{ color: INK, fontSize: '0.9rem', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                                                        {lesson.nextLessonPlan}
                                                    </Typography>
                                                </Box>
                                            )}

                                            {lessonHomework.length > 0 && (
                                                <Box sx={{ mt: 1.5, p: 2, bgcolor: PINK_SOFT, borderRadius: 2, borderLeft: `3px solid ${PINK}` }}>
                                                    <Typography sx={{ color: '#9D174D', fontWeight: 700, fontSize: '0.68rem', letterSpacing: '0.05em', textTransform: 'uppercase', mb: 1 }}>
                                                        📝 Домашнее задание
                                                    </Typography>
                                                    <Stack spacing={1}>
                                                        {lessonHomework.map(hw => {
                                                            const isVariant = hw.type === 'variant' || (hw.task && hw.task.startsWith('http'));
                                                            const statusLabel = hw.status === 'checked' ? 'Проверено' :
                                                                hw.status === 'submitted' ? 'На проверке' : 'Назначено';
                                                            const statusColor = hw.status === 'checked' ? GREEN :
                                                                hw.status === 'submitted' ? AMBER : PURPLE;
                                                            return (
                                                                <Box key={hw.id} sx={{
                                                                    p: 1.5, borderRadius: 2, bgcolor: CARD,
                                                                    display: 'flex', justifyContent: 'space-between',
                                                                    alignItems: 'center', gap: 1.5, flexWrap: 'wrap',
                                                                }}>
                                                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                                                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: INK }}>
                                                                            {isVariant ? (hw.variantTitle || 'Вариант') : (hw.task || 'Задание')}
                                                                        </Typography>
                                                                        {hw.dueDate && (
                                                                            <Typography sx={{ fontSize: '0.72rem', color: INK_MUTED, mt: 0.25 }}>
                                                                                Срок: {format(new Date(hw.dueDate), 'd MMM', { locale: ru })}
                                                                            </Typography>
                                                                        )}
                                                                    </Box>
                                                                    <Chip
                                                                        label={statusLabel}
                                                                        size="small"
                                                                        sx={{ fontSize: '0.65rem', height: 22, bgcolor: `${statusColor}20`, color: statusColor, fontWeight: 700, borderRadius: 100 }}
                                                                    />
                                                                    {isVariant && (
                                                                        <IconButton
                                                                            size="small"
                                                                            href={hw.task || hw.url}
                                                                            target="_blank"
                                                                            sx={{ color: PURPLE }}
                                                                        >
                                                                            <OpenInNewIcon sx={{ fontSize: 16 }} />
                                                                        </IconButton>
                                                                    )}
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                </Box>
                                            )}

                                            {isFuture && lesson.status !== 'CANCELLED' && (
                                                <PillButton $variant="purple" size="small"
                                                    startIcon={<VideocamIcon sx={{ fontSize: 14 }} />}
                                                    onClick={() => {
                                                        setDayDialogOpen(false);
                                                        setSelectedLessonForRoom(lesson);
                                                        setLessonRoomOpen(true);
                                                    }}
                                                    sx={{ mt: 2, py: 0.5, px: 1.6, fontSize: '0.75rem' }}>
                                                    {lesson.status === 'IN_PROGRESS' ? 'Вернуться в конференцию' : 'Начать урок'}
                                                </PillButton>
                                            )}
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </DialogContent>

                    <DialogActions sx={{ px: 3, py: 2 }}>
                        <PillButton $variant="ghost" onClick={() => setDayDialogOpen(false)}>Закрыть</PillButton>
                    </DialogActions>
                </Dialog>

                {/* ===== МОДАЛКА УРОКА ===== */}
                <Dialog open={!!selectedLesson} onClose={() => setSelectedLesson(null)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 4, p: 0 } }}>
                    {selectedLesson && (
                        <>
                            <DialogTitle sx={{ p: 3, pb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography sx={{ fontWeight: 800, fontSize: '1.1rem', color: INK }}>
                                        {selectedLesson.course?.name || 'Занятие'}
                                    </Typography>
                                    <IconButton onClick={() => setSelectedLesson(null)} size="small"><CloseIcon /></IconButton>
                                </Box>
                            </DialogTitle>
                            <DialogContent dividers sx={{ borderColor: LINE, p: 3 }}>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: PURPLE_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <CalendarIcon sx={{ color: PURPLE, fontSize: 20 }} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 700, color: INK, fontSize: '0.92rem' }}>
                                                {format(new Date(selectedLesson.lessonDate), 'd MMMM yyyy', { locale: ru })}
                                            </Typography>
                                            <Typography sx={{ color: INK_MUTED, fontFamily: 'monospace', fontSize: '0.82rem' }}>
                                                {formatLessonTime(selectedLesson.lessonDate, selectedLesson.startTime)} — {formatLessonTime(selectedLesson.lessonDate, selectedLesson.endTime)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: GREEN_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <PersonIcon sx={{ color: GREEN, fontSize: 20 }} />
                                        </Box>
                                        <Typography sx={{ color: INK, fontWeight: 500, fontSize: '0.92rem' }}>{selectedLesson.tutor?.fullName}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: 2.5, bgcolor: AMBER_SOFT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <InfoIcon sx={{ color: AMBER, fontSize: 18 }} />
                                        </Box>
                                        <LessonStatusBadge status={selectedLesson.status} />
                                    </Box>
                                    {selectedLesson.notes && (
                                        <Box sx={{ p: 1.75, bgcolor: GREEN_SOFT, borderRadius: 2.5, borderLeft: `3px solid ${GREEN}` }}>
                                            <Typography sx={{ color: INK_MUTED, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                Пройдено на уроке
                                            </Typography>
                                            <Typography sx={{ mt: 0.5, color: INK, fontSize: '0.88rem', lineHeight: 1.5 }}>
                                                {selectedLesson.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                    {selectedLesson.nextLessonPlan && (
                                        <Box sx={{ p: 1.75, bgcolor: AMBER_SOFT, borderRadius: 2.5, borderLeft: `3px solid ${AMBER}` }}>
                                            <Typography sx={{ color: INK_MUTED, fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                                                Задано к следующему уроку
                                            </Typography>
                                            <Typography sx={{ mt: 0.5, color: INK, fontSize: '0.88rem', lineHeight: 1.5 }}>
                                                {selectedLesson.nextLessonPlan}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, py: 2 }}>
                                <PillButton $variant="ghost" onClick={() => setSelectedLesson(null)}>Закрыть</PillButton>
                            </DialogActions>
                        </>
                    )}
                </Dialog>

                {/* ===== МОДАЛКА РЕЙТИНГА ===== */}
                <Dialog open={ratingOpen} onClose={() => setRatingOpen(false)} maxWidth="sm" fullWidth
                    PaperProps={{ sx: { borderRadius: 4, p: 0 } }}>
                    <DialogTitle sx={{ p: 3, pb: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ fontWeight: 800, fontSize: '1.2rem', color: INK }}>
                                🏆 Рейтинг Flappy
                            </Typography>
                            <IconButton onClick={() => setRatingOpen(false)} size="small"><CloseIcon /></IconButton>
                        </Box>
                    </DialogTitle>
                    <DialogContent sx={{ p: 3 }}>
                        {leaderboard.length === 0 ? (
                            <Box sx={{ textAlign: 'center', py: 4 }}>
                                <CircularProgress size={32} />
                            </Box>
                        ) : (
                            <Stack spacing={1}>
                                {leaderboard.slice(0, 10).map((row, i) => {
                                    const isMe = row.studentId === user?.id;
                                    return (
                                        <Box key={row.studentId} sx={{
                                            p: 1.5, borderRadius: 2,
                                            bgcolor: isMe ? PURPLE_SOFT : BG_ALT,
                                            border: isMe ? `1px solid ${PURPLE}` : '1px solid transparent',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                        }}>
                                            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                                <Typography sx={{ fontSize: '0.9rem', fontWeight: 800, color: i < 3 ? AMBER : INK_MUTED, minWidth: 26 }}>
                                                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                                                </Typography>
                                                <Typography sx={{ fontSize: '0.9rem', fontWeight: isMe ? 700 : 500, color: INK }}>
                                                    {row.studentName}{isMe ? ' (вы)' : ''}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: GREEN }}>
                                                {row.highScore}
                                            </Typography>
                                        </Box>
                                    );
                                })}
                            </Stack>
                        )}
                    </DialogContent>
                </Dialog>

                <LessonRoom
                    open={lessonRoomOpen}
                    onClose={() => { setLessonRoomOpen(false); setSelectedLessonForRoom(null); }}
                    lessonId={selectedLessonForRoom?.id}
                    lessonInfo={selectedLessonForRoom ? {
                        studentName: selectedLessonForRoom.student?.fullName,
                        tutorName: selectedLessonForRoom.tutor?.fullName,
                        startTime: formatLessonTime(selectedLessonForRoom.lessonDate, selectedLessonForRoom.startTime),
                        endTime: formatLessonTime(selectedLessonForRoom.lessonDate, selectedLessonForRoom.endTime),
                    } : null}
                />
            </Box>
        </LocalizationProvider>
    );
}

export default StudentDashboard;