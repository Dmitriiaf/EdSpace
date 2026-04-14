// ========== frontend/src/pages/StudentDashboard.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, Chip, CircularProgress, Alert, Tabs, Tab,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    Badge, Avatar, Divider, LinearProgress, Tooltip,
    Fade, FormControl, InputLabel, Select, MenuItem,
    Breadcrumbs, Link as MuiLink, Stack, Collapse
} from '@mui/material';
import {
    CalendarToday as CalendarIcon,
    History as HistoryIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    TrendingUp as TrendingUpIcon,
    Info as InfoIcon,
    Folder as FolderIcon,
    Download as DownloadIcon,
    Description as FileIcon,
    PictureAsPdf as PdfIcon,
    Image as ImageIcon,
    VideoLibrary as VideoIcon,
    Audiotrack as AudioIcon,
    NavigateNext as NavigateNextIcon,
    Star as StarIcon,
    StarHalf as StarHalfIcon,
    StarBorder as StarBorderIcon,
    Assessment as AssessmentIcon,
    AccessTime as AccessTimeIcon,
    ArrowForward as ArrowForwardIcon,
    Circle as CircleIcon,
    Assignment as AssignmentIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    OpenInNew as OpenInNewIcon,
    Refresh as RefreshIcon,
    Link as LinkIcon
} from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
// ✅ Импорт из объединённого API
import { getLessonsByStudent, getStudentProgressStats, getProgressTimeline } from '../services/api';

const FileTypeIcon = ({ fileName, size = 40 }) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const sx = { fontSize: size };
    if (ext === 'pdf') return <PdfIcon sx={{ ...sx, color: '#EF4444' }} />;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return <ImageIcon sx={{ ...sx, color: '#10B981' }} />;
    if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) return <VideoIcon sx={{ ...sx, color: '#3B82F6' }} />;
    if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return <AudioIcon sx={{ ...sx, color: '#F59E0B' }} />;
    return <FileIcon sx={{ ...sx, color: '#6B7280' }} />;
};

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const LessonStatusBadge = ({ status }) => {
    const config = {
        'SCHEDULED': { label: 'Запланировано', color: '#3B82F6', bg: '#EFF6FF', icon: ScheduleIcon },
        'COMPLETED': { label: 'Проведено', color: '#F59E0B', bg: '#FFFBEB', icon: CheckIcon },
        'PAID': { label: 'Оплачено', color: '#10B981', bg: '#ECFDF5', icon: CheckIcon },
        'CANCELLED': { label: 'Отменено', color: '#EF4444', bg: '#FEF2F2', icon: CancelIcon },
        'RESCHEDULED': { label: 'Перенесено', color: '#8B5CF6', bg: '#F5F3FF', icon: ScheduleIcon }
    };
    const { label, color, bg, icon: Icon } = config[status] || { label: status, color: '#6B7280', bg: '#F3F4F6', icon: InfoIcon };
    
    return (
        <Chip 
            icon={<Icon sx={{ fontSize: 14, color: color }} />}
            label={label}
            size="small"
            sx={{ 
                bgcolor: bg, 
                color: color,
                fontWeight: 500,
                fontSize: '0.7rem',
                height: 24,
                '& .MuiChip-icon': { ml: 0.5 }
            }}
        />
    );
};

function StudentDashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [mainTabValue, setMainTabValue] = useState(0);
    
    const [allLessons, setAllLessons] = useState([]);
    const [homeworkStats, setHomeworkStats] = useState(null);
    const [progressTimeline, setProgressTimeline] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [selectedTutorId, setSelectedTutorId] = useState('all');
    const [openLessonDialog, setOpenLessonDialog] = useState(false);
    const [expandedLessonId, setExpandedLessonId] = useState(null);
    
    const [materials, setMaterials] = useState([]);
    const [folders, setFolders] = useState([]);
    const [allMaterialsData, setAllMaterialsData] = useState({ materials: [], folders: [] });
    const [currentFolder, setCurrentFolder] = useState(null);
    const [folderPath, setFolderPath] = useState([]);
    const [coursesByTutor, setCoursesByTutor] = useState({});
    
    const [stepikCourses, setStepikCourses] = useState([]);
    const [stepikLoading, setStepikLoading] = useState(false);
    
    const [homeworkList, setHomeworkList] = useState([]);
    const [homeworkLoading, setHomeworkLoading] = useState(false);

    const getAgeText = (age) => {
        if (age % 10 === 1 && age % 100 !== 11) return 'год';
        if (age % 10 >= 2 && age % 10 <= 4 && (age % 100 < 10 || age % 100 >= 20)) return 'года';
        return 'лет';
    };

    const checkBirthday = () => {
        if (!user?.birthday) return { isBirthday: false };
        const today = new Date();
        const birthday = new Date(user.birthday);
        return { 
            isBirthday: today.getDate() === birthday.getDate() && today.getMonth() === birthday.getMonth(),
            age: today.getFullYear() - birthday.getFullYear()
        };
    };

    const birthdayInfo = checkBirthday();

    const tutors = useMemo(() => {
        const tutorsMap = new Map();
        allLessons.forEach(lesson => {
            if (lesson.tutor && !tutorsMap.has(lesson.tutor.id)) {
                tutorsMap.set(lesson.tutor.id, lesson.tutor);
            }
        });
        return Array.from(tutorsMap.values());
    }, [allLessons]);

    const filteredLessons = useMemo(() => {
        if (selectedTutorId === 'all') return allLessons;
        return allLessons.filter(lesson => lesson.tutor?.id === parseInt(selectedTutorId));
    }, [allLessons, selectedTutorId]);

    const stats = useMemo(() => {
        const now = new Date();
        const monthLessons = filteredLessons.filter(l => {
            const d = new Date(l.lessonDate);
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        });
        
        const upcoming = filteredLessons.filter(l => {
            const d = new Date(`${l.lessonDate}T${l.startTime}`);
            return d > now && l.status === 'SCHEDULED';
        }).sort((a, b) => new Date(`${a.lessonDate}T${a.startTime}`) - new Date(`${b.lessonDate}T${b.startTime}`));

        return {
            total: monthLessons.length,
            completed: monthLessons.filter(l => l.status === 'COMPLETED' || l.status === 'PAID').length,
            upcoming: upcoming.length,
            cancelled: monthLessons.filter(l => l.status === 'CANCELLED').length,
            nextLesson: upcoming[0] || null
        };
    }, [filteredLessons]);

    const lessonsOnSelectedDate = useMemo(() => {
        return filteredLessons
            .filter(lesson => isSameDay(new Date(lesson.lessonDate), selectedDate))
            .sort((a, b) => a.startTime?.localeCompare(b.startTime));
    }, [filteredLessons, selectedDate]);

    const getHomeworkForLesson = (lesson) => {
        if (!lesson || !filteredLessons.length) return null;
        
        const studentId = lesson.student?.id;
        const courseId = lesson.course?.id;
        
        const previousLessons = filteredLessons
            .filter(l => {
                const sameStudent = l.student?.id === studentId;
                const sameCourse = l.course?.id === courseId;
                const isBefore = new Date(l.lessonDate) < new Date(lesson.lessonDate);
                return sameStudent && sameCourse && isBefore;
            })
            .sort((a, b) => new Date(b.lessonDate) - new Date(a.lessonDate));
        
        for (let prevLesson of previousLessons) {
            if (prevLesson.nextLessonPlan) {
                return {
                    text: prevLesson.nextLessonPlan,
                    fromLesson: prevLesson
                };
            }
        }
        
        return null;
    };

    useEffect(() => {
        if (user) {
            fetchAllData();
            fetchStepikCourses();
            fetchHomeworkList();
        }
    }, [user]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([fetchLessons(), fetchMaterials(), fetchHomeworkStats()]);
        } catch (err) {
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const fetchStepikCourses = async () => {
        setStepikLoading(true);
        try {
            const token = localStorage.getItem('token');
            const studentId = user?.allIds?.[0] || user?.id;
            
            const response = await axios.get(`http://localhost:8080/api/stepik/student/${studentId}/courses`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setStepikCourses(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки курсов Stepik:', err);
        } finally {
            setStepikLoading(false);
        }
    };

    const fetchHomeworkList = async () => {
        setHomeworkLoading(true);
        try {
            const token = localStorage.getItem('token');
            const studentId = user?.allIds?.[0] || user?.id;
            const response = await axios.get(`http://localhost:8080/api/homework/student/${studentId}/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setHomeworkList(response.data || []);
        } catch (err) {
            console.error('Ошибка загрузки заданий:', err);
        } finally {
            setHomeworkLoading(false);
        }
    };

    const fetchLessons = async () => {
        try {
            const allStudentIds = user?.allIds || [user?.id];
            let allLessonsData = [];
            const tutorCoursesMap = {};
            
            for (const studentId of allStudentIds) {
                try {
                    // ✅ Заменено на API-функцию
                    const response = await getLessonsByStudent(studentId);
                    const lessonsArray = response.data !== undefined ? response.data : response;
                    allLessonsData = [...allLessonsData, ...lessonsArray];
                    lessonsArray.forEach(lesson => {
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
            
            const unique = allLessonsData.filter((l, i, self) => i === self.findIndex(ls => ls.id === l.id));
            setAllLessons(unique.sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate)));
        } catch (err) {}
    };

    const fetchMaterials = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/materials/student/${user.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = { materials: response.data.materials || [], folders: response.data.folders || [] };
            setAllMaterialsData(data);
            filterMaterialsByTutor(data, selectedTutorId);
        } catch (err) {}
    };

    const filterMaterialsByTutor = (data, tutorId) => {
        if (!data) return;
        if (tutorId === 'all') {
            setMaterials(data.materials);
            setFolders(data.folders);
            return;
        }
        const allowedCourseIds = coursesByTutor[parseInt(tutorId)] || [];
        setMaterials(data.materials.filter(m => m.course ? allowedCourseIds.includes(m.course.id) : true));
        setFolders(data.folders.filter(f => f.course ? allowedCourseIds.includes(f.course.id) : true));
    };

    const loadFolderContent = async (folderId) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/materials/student/${user.id}/folder/${folderId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = { materials: response.data.materials || [], folders: response.data.folders || [] };
            filterMaterialsByTutor(data, selectedTutorId);
        } catch (err) {}
    };

    const fetchHomeworkStats = async () => {
        try {
            // ✅ Заменено на API-функции
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
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:8080/api/materials/download/${material.id}`, {
                headers: { 'Authorization': `Bearer ${token}` },
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.download = material.fileName || material.title;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {}
    };

    const renderStars = (grade) => {
        const stars = [];
        const fullStars = Math.floor(grade);
        const hasHalfStar = grade % 1 >= 0.5;
        
        for (let i = 0; i < fullStars; i++) {
            stars.push(<StarIcon key={i} sx={{ color: '#FFD700', fontSize: 20 }} />);
        }
        if (hasHalfStar) {
            stars.push(<StarHalfIcon key="half" sx={{ color: '#FFD700', fontSize: 20 }} />);
        }
        for (let i = stars.length; i < 5; i++) {
            stars.push(<StarBorderIcon key={i} sx={{ color: '#FFD700', fontSize: 20 }} />);
        }
        return stars;
    };

    const upcomingLessons = filteredLessons.filter(l => {
        const lessonDate = new Date(l.lessonDate);
        const lessonDateTime = new Date(
            lessonDate.getFullYear(),
            lessonDate.getMonth(),
            lessonDate.getDate(),
            parseInt(l.startTime?.split(':')[0] || '0'),
            parseInt(l.startTime?.split(':')[1] || '0')
        );
        const now = new Date();
        
        return lessonDateTime > now && 
               l.status !== 'CANCELLED' && 
               l.status !== 'COMPLETED' && 
               l.status !== 'PAID';
    }).slice(0, 5);

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <CircularProgress size={48} sx={{ color: '#6366F1' }} />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ 
                p: { xs: 2, sm: 3 }, 
                maxWidth: 1400, 
                mx: 'auto',
                bgcolor: '#F9FAFB',
                minHeight: '100vh'
            }}>
                {/* Поздравление с днём рождения */}
                {birthdayInfo.isBirthday && (
                    <Fade in={true} timeout={800}>
                        <Paper 
                            sx={{ 
                                p: 4, 
                                mb: 4, 
                                borderRadius: 4,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: 'white',
                                textAlign: 'center'
                            }}
                        >
                            <Box sx={{ fontSize: '5rem', mb: 1 }}>🎂</Box>
                            <Typography variant="h2" sx={{ fontWeight: 800, mb: 1 }}>
                                🎉 С ДНЁМ РОЖДЕНИЯ! 🎉
                            </Typography>
                            <Typography variant="h4" sx={{ mb: 2, fontWeight: 600 }}>
                                {user?.fullName?.split(' ')[0]}!
                            </Typography>
                            {birthdayInfo.age && birthdayInfo.age > 0 && (
                                <Chip 
                                    label={`🎂 ${birthdayInfo.age} ${getAgeText(birthdayInfo.age)}! 🎂`}
                                    sx={{ 
                                        bgcolor: 'rgba(255,255,255,0.25)', 
                                        color: '#FFD700',
                                        fontSize: '1.2rem',
                                        fontWeight: 'bold',
                                        py: 2.5,
                                        px: 3,
                                        borderRadius: 40
                                    }}
                                />
                            )}
                        </Paper>
                    </Fade>
                )}

                {/* Верхняя панель */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 4,
                    flexWrap: 'wrap',
                    gap: 2
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                            width: 48, 
                            height: 48, 
                            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)'
                        }}>
                            {user?.fullName?.charAt(0) || 'У'}
                        </Avatar>
                        <Box>
                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827' }}>
                                Привет, {user?.fullName?.split(' ')[0]}! 👋
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#6B7280' }}>
                                {format(new Date(), 'EEEE, d MMMM', { locale: ru })}
                            </Typography>
                        </Box>
                    </Box>
                    
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel sx={{ color: '#6B7280' }}>Фильтр по репетитору</InputLabel>
                        <Select
                            value={selectedTutorId}
                            onChange={(e) => setSelectedTutorId(e.target.value)}
                            label="Фильтр по репетитору"
                            sx={{ 
                                borderRadius: 3,
                                bgcolor: 'white',
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' }
                            }}
                        >
                            <MenuItem value="all">Все репетиторы</MenuItem>
                            {tutors.map(t => (
                                <MenuItem key={t.id} value={t.id}>{t.fullName}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Box>

                {/* Карточки статистики */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    {[
                        { label: 'Всего занятий', value: stats.total, icon: CalendarIcon, color: '#6366F1', bg: '#EEF2FF' },
                        { label: 'Проведено', value: stats.completed, icon: CheckIcon, color: '#10B981', bg: '#ECFDF5' },
                        { label: 'Предстоит', value: stats.upcoming, icon: ScheduleIcon, color: '#F59E0B', bg: '#FFFBEB' },
                        { label: 'Отменено', value: stats.cancelled, icon: CancelIcon, color: '#EF4444', bg: '#FEF2F2' }
                    ].map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Grid item xs={6} sm={3} key={i}>
                                <Card sx={{ 
                                    borderRadius: 4, 
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                                    border: '1px solid #F3F4F6',
                                    transition: 'all 0.2s',
                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }
                                }}>
                                    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <Box>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: stat.color }}>
                                                    {stat.value}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                                    {stat.label}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ 
                                                width: 40, 
                                                height: 40, 
                                                borderRadius: 3, 
                                                bgcolor: stat.bg, 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                justifyContent: 'center' 
                                            }}>
                                                <Icon sx={{ color: stat.color, fontSize: 20 }} />
                                            </Box>
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

                {/* Следующее занятие */}
                {stats.nextLesson && (
                    <Card sx={{ 
                        mb: 3, 
                        borderRadius: 4, 
                        background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
                        color: 'white',
                        overflow: 'hidden',
                        position: 'relative'
                    }}>
                        <Box sx={{ position: 'absolute', right: -20, top: -20, opacity: 0.1 }}>
                            <ScheduleIcon sx={{ fontSize: 150 }} />
                        </Box>
                        <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                            <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>
                                Ближайшее занятие
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap', mt: 1 }}>
                                <Box>
                                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                                        {format(new Date(stats.nextLesson.lessonDate), 'd MMMM', { locale: ru })}
                                    </Typography>
                                    <Typography variant="h6" sx={{ fontWeight: 400, opacity: 0.9 }}>
                                        {stats.nextLesson.startTime?.slice(0,5)} — {stats.nextLesson.endTime?.slice(0,5)}
                                    </Typography>
                                </Box>
                                <Divider orientation="vertical" flexItem sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
                                <Box>
                                    <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                        {stats.nextLesson.course?.name || 'Занятие'}
                                    </Typography>
                                    <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                        {stats.nextLesson.tutor?.fullName}
                                    </Typography>
                                </Box>
                                <Button 
                                    variant="contained" 
                                    endIcon={<ArrowForwardIcon />}
                                    onClick={() => setSelectedLesson(stats.nextLesson)}
                                    sx={{ 
                                        ml: 'auto',
                                        bgcolor: 'white', 
                                        color: '#6366F1',
                                        borderRadius: 3,
                                        px: 3,
                                        '&:hover': { bgcolor: '#F3F4F6' }
                                    }}
                                >
                                    Подробнее
                                </Button>
                            </Box>
                        </CardContent>
                    </Card>
                )}

                {/* Календарь и занятия */}
                <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ 
                            borderRadius: 4, 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            border: '1px solid #F3F4F6',
                            overflow: 'hidden'
                        }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                                    Календарь занятий
                                </Typography>
                            </Box>
                            <DateCalendar
                                value={selectedDate}
                                onChange={setSelectedDate}
                                slots={{
                                    day: (props) => {
                                        const { day, ...other } = props;
                                        const hasLessons = filteredLessons.some(l => 
                                            isSameDay(new Date(l.lessonDate), day)
                                        );
                                        
                                        return (
                                            <Badge
                                                key={day.toString()}
                                                color="primary"
                                                variant="dot"
                                                overlap="circular"
                                                invisible={!hasLessons}
                                                sx={{
                                                    '& .MuiBadge-dot': { backgroundColor: '#6366F1' }
                                                }}
                                            >
                                                <PickersDay {...other} day={day} />
                                            </Badge>
                                        );
                                    }
                                }}
                                sx={{
                                    '& .MuiPickersDay-root': {
                                        borderRadius: 2,
                                        '&.Mui-selected': {
                                            backgroundColor: '#6366F1 !important',
                                            color: 'white'
                                        }
                                    }
                                }}
                            />
                        </Paper>
                    </Grid>

                    <Grid item xs={12} md={7}>
                        <Paper sx={{ 
                            borderRadius: 4, 
                            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                            border: '1px solid #F3F4F6',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column'
                        }}>
                            <Box sx={{ 
                                p: 2, 
                                borderBottom: '1px solid #F3F4F6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#374151' }}>
                                    {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                                </Typography>
                                <Chip 
                                    label={`${lessonsOnSelectedDate.length} занятий`} 
                                    size="small"
                                    sx={{ bgcolor: '#EEF2FF', color: '#6366F1', fontWeight: 500 }}
                                />
                            </Box>
                            
                            <Box sx={{ p: 2, flex: 1, overflow: 'auto', maxHeight: 450 }}>
                                {lessonsOnSelectedDate.length === 0 ? (
                                    <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        height: '100%',
                                        py: 4
                                    }}>
                                        <Box sx={{ 
                                            width: 64, 
                                            height: 64, 
                                            borderRadius: '50%', 
                                            bgcolor: '#F3F4F6',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            mb: 2
                                        }}>
                                            <CalendarIcon sx={{ color: '#9CA3AF', fontSize: 32 }} />
                                        </Box>
                                        <Typography variant="body1" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                            Нет занятий
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Stack spacing={1.5}>
                                        {lessonsOnSelectedDate.map(lesson => {
                                            const homework = getHomeworkForLesson(lesson);
                                            const isExpanded = expandedLessonId === lesson.id;
                                            
                                            return (
                                                <Card 
                                                    key={lesson.id}
                                                    sx={{ 
                                                        borderRadius: 3,
                                                        boxShadow: 'none',
                                                        border: '1px solid #F3F4F6',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.15s',
                                                        '&:hover': { 
                                                            borderColor: '#6366F1',
                                                            boxShadow: '0 2px 8px rgba(99,102,241,0.1)'
                                                        }
                                                    }}
                                                >
                                                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                                                            <Box sx={{ 
                                                                width: 3, 
                                                                minHeight: homework ? 80 : 40, 
                                                                borderRadius: 3,
                                                                bgcolor: lesson.status === 'CANCELLED' ? '#EF4444' : 
                                                                         lesson.status === 'COMPLETED' ? '#F59E0B' :
                                                                         lesson.status === 'PAID' ? '#10B981' : '#6366F1',
                                                                alignSelf: 'stretch'
                                                            }} />
                                                            <Box sx={{ flex: 1 }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                                                        {lesson.startTime?.slice(0,5)} — {lesson.endTime?.slice(0,5)}
                                                                    </Typography>
                                                                    <LessonStatusBadge status={lesson.status} />
                                                                </Box>
                                                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                                                    {lesson.course?.name || 'Занятие'}
                                                                </Typography>
                                                                <Typography variant="caption" sx={{ color: '#6B7280', display: 'block' }}>
                                                                    {lesson.tutor?.fullName}
                                                                </Typography>
                                                                
                                                                {homework && (
                                                                    <Box sx={{ mt: 1.5 }}>
                                                                        <Button
                                                                            size="small"
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setExpandedLessonId(isExpanded ? null : lesson.id);
                                                                            }}
                                                                            endIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                                                            sx={{ 
                                                                                color: '#6366F1', 
                                                                                textTransform: 'none',
                                                                                p: 0,
                                                                                minWidth: 'auto',
                                                                                '&:hover': { bgcolor: 'transparent', color: '#4F46E5' }
                                                                            }}
                                                                        >
                                                                            <AssignmentIcon sx={{ fontSize: 16, mr: 0.5 }} />
                                                                            Пройдено на прошлом уроке
                                                                        </Button>
                                                                        
                                                                        <Collapse in={isExpanded}>
                                                                            <Box sx={{ 
                                                                                mt: 1.5, 
                                                                                p: 2, 
                                                                                bgcolor: '#FFFBEB', 
                                                                                borderRadius: 2,
                                                                                borderLeft: '3px solid #F59E0B'
                                                                            }}>
                                                                                <Typography variant="body2" sx={{ color: '#374151', whiteSpace: 'pre-wrap' }}>
                                                                                    {homework.text}
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: '#9CA3AF', display: 'block', mt: 1 }}>
                                                                                    от {format(new Date(homework.fromLesson.lessonDate), 'd MMM', { locale: ru })}
                                                                                </Typography>
                                                                            </Box>
                                                                        </Collapse>
                                                                    </Box>
                                                                )}
                                                            </Box>
                                                            <ArrowForwardIcon 
                                                                sx={{ color: '#9CA3AF', fontSize: 20, cursor: 'pointer' }}
                                                                onClick={() => setSelectedLesson(lesson)}
                                                            />
                                                        </Box>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </Stack>
                                )}
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Вкладки */}
                <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                    <Tabs 
                        value={mainTabValue} 
                        onChange={(e, v) => setMainTabValue(v)}
                        variant="fullWidth"
                        sx={{ 
                            borderBottom: 1, 
                            borderColor: '#F3F4F6',
                            bgcolor: 'white',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 500,
                                py: 1.5,
                                color: '#6B7280',
                                '&.Mui-selected': { color: '#6366F1' }
                            },
                            '& .MuiTabs-indicator': { backgroundColor: '#6366F1' }
                        }}
                    >
                        <Tab icon={<FolderIcon />} iconPosition="start" label="Материалы" />
                        <Tab icon={<AssignmentIcon />} iconPosition="start" label="Задания" />
                        <Tab icon={<AssessmentIcon />} iconPosition="start" label="Успеваемость" />
                        <Tab icon={<HistoryIcon />} iconPosition="start" label="История" />
                        <Tab icon={<SchoolIcon />} iconPosition="start" label="Stepik" />
                    </Tabs>

                    {/* Материалы */}
                    <TabPanel value={mainTabValue} index={0}>
                        <Box sx={{ p: 2 }}>
                            <Breadcrumbs separator={<NavigateNextIcon sx={{ fontSize: 16 }} />} sx={{ mb: 2 }}>
                                <MuiLink 
                                    component="button" 
                                    variant="body2" 
                                    onClick={handleRootClick}
                                    sx={{ 
                                        cursor: 'pointer', 
                                        color: currentFolder === null ? '#6366F1' : '#6B7280',
                                        fontWeight: currentFolder === null ? 600 : 400,
                                        '&:hover': { color: '#6366F1' }
                                    }}
                                >
                                    Все материалы
                                </MuiLink>
                                {folderPath.map((folder, index) => (
                                    <MuiLink 
                                        key={folder.id} 
                                        component="button" 
                                        variant="body2" 
                                        onClick={() => handleBreadcrumbClick(folder, index)}
                                        sx={{ 
                                            cursor: 'pointer',
                                            color: index === folderPath.length - 1 ? '#6366F1' : '#6B7280',
                                            fontWeight: index === folderPath.length - 1 ? 600 : 400,
                                            '&:hover': { color: '#6366F1' }
                                        }}
                                    >
                                        {folder.name}
                                    </MuiLink>
                                ))}
                            </Breadcrumbs>

                            {folders.length === 0 && materials.length === 0 ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <FolderIcon sx={{ fontSize: 64, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                        Нет материалов
                                    </Typography>
                                    <Typography variant="body2" sx={{ color: '#9CA3AF' }}>
                                        {selectedTutorId !== 'all' 
                                            ? 'У этого репетитора пока нет материалов' 
                                            : 'Материалы появятся здесь, когда репетитор их добавит'}
                                    </Typography>
                                </Box>
                            ) : (
                                <Grid container spacing={2}>
                                    {folders.map(folder => (
                                        <Grid item xs={6} sm={4} md={3} key={folder.id}>
                                            <Card 
                                                sx={{ 
                                                    borderRadius: 3,
                                                    cursor: 'pointer',
                                                    boxShadow: 'none',
                                                    border: '1px solid #F3F4F6',
                                                    transition: 'all 0.15s',
                                                    '&:hover': { 
                                                        borderColor: '#6366F1',
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                    }
                                                }}
                                                onClick={() => handleFolderClick(folder)}
                                            >
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                        <FolderIcon sx={{ color: '#F59E0B', fontSize: 32 }} />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                                {folder.name}
                                                            </Typography>
                                                            {folder.course && (
                                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                                    {folder.course.name}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                    
                                    {materials.map(material => (
                                        <Grid item xs={12} sm={6} md={4} key={material.id}>
                                            <Card sx={{ 
                                                borderRadius: 3,
                                                boxShadow: 'none',
                                                border: '1px solid #F3F4F6',
                                                transition: 'all 0.15s',
                                                '&:hover': { 
                                                    borderColor: '#6366F1',
                                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                                }
                                            }}>
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    <Box sx={{ display: 'flex', gap: 1.5 }}>
                                                        <FileTypeIcon fileName={material.fileName} size={32} />
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                {material.title}
                                                            </Typography>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                                                <Typography variant="caption" sx={{ color: '#9CA3AF' }}>
                                                                    {formatFileSize(material.fileSize)}
                                                                </Typography>
                                                                {material.course && (
                                                                    <Chip 
                                                                        label={material.course.name}
                                                                        size="small"
                                                                        sx={{ height: 20, fontSize: '0.6rem', bgcolor: '#EEF2FF', color: '#6366F1' }}
                                                                    />
                                                                )}
                                                            </Box>
                                                        </Box>
                                                        <Tooltip title="Скачать">
                                                            <IconButton 
                                                                size="small" 
                                                                onClick={(e) => { e.stopPropagation(); handleDownload(material); }}
                                                                sx={{ color: '#6366F1' }}
                                                            >
                                                                <DownloadIcon sx={{ fontSize: 18 }} />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    </TabPanel>

                    {/* Задания */}
                    <TabPanel value={mainTabValue} index={1}>
                        <Box sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                                    Мои задания
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchHomeworkList}
                                    disabled={homeworkLoading}
                                    size="small"
                                >
                                    Обновить
                                </Button>
                            </Box>

                            {homeworkLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                    <CircularProgress size={32} />
                                </Box>
                            ) : homeworkList.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid #F3F4F6' }}>
                                    <AssignmentIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 500 }} gutterBottom>
                                        Нет заданий
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Репетитор пока не назначил вам задания
                                    </Typography>
                                </Paper>
                            ) : (
                                <Grid container spacing={3}>
                                    {homeworkList.map(item => {
                                        const isVariant = item.type === 'variant' || (item.task && item.task.startsWith('http'));
                                        const statusColor = item.status === 'checked' ? 'success' : 
                                                           item.status === 'submitted' ? 'warning' : 'info';
                                        const statusLabel = item.status === 'checked' ? 'Проверено' : 
                                                           item.status === 'submitted' ? 'На проверке' : 'Назначено';
                                        
                                        return (
                                            <Grid item xs={12} sm={6} md={4} key={item.id}>
                                                <Card sx={{ 
                                                    borderRadius: 3, 
                                                    height: '100%',
                                                    border: '1px solid #F3F4F6',
                                                    boxShadow: 'none',
                                                    transition: 'all 0.15s',
                                                    '&:hover': { 
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                                                        borderColor: '#6366F1'
                                                    }
                                                }}>
                                                    <CardContent>
                                                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
                                                            <Avatar sx={{ bgcolor: isVariant ? '#F5F3FF' : '#EEF2FF', width: 40, height: 40 }}>
                                                                {isVariant ? <LinkIcon sx={{ color: '#8B5CF6' }} /> : <AssignmentIcon sx={{ color: '#6366F1' }} />}
                                                            </Avatar>
                                                            <Box sx={{ flex: 1 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                    {isVariant ? (item.variantTitle || 'Вариант') : 'Задание'}
                                                                </Typography>
                                                                {isVariant && item.variantSubject && (
                                                                    <Chip 
                                                                        label={item.variantSubject}
                                                                        size="small"
                                                                        variant="outlined"
                                                                        sx={{ mt: 0.5, fontSize: '0.6rem', height: 18 }}
                                                                    />
                                                                )}
                                                                <Chip 
                                                                    label={statusLabel}
                                                                    size="small"
                                                                    color={statusColor}
                                                                    sx={{ mt: 0.5, fontSize: '0.65rem', height: 20 }}
                                                                />
                                                            </Box>
                                                        </Box>
                                                        
                                                        {isVariant ? (
                                                            <Button
                                                                variant="contained"
                                                                fullWidth
                                                                size="small"
                                                                endIcon={<OpenInNewIcon />}
                                                                href={item.task || item.url}
                                                                target="_blank"
                                                                sx={{ 
                                                                    bgcolor: '#8B5CF6',
                                                                    '&:hover': { bgcolor: '#7C3AED' },
                                                                    borderRadius: 2,
                                                                    textTransform: 'none',
                                                                    mb: 1.5
                                                                }}
                                                            >
                                                                Открыть вариант
                                                            </Button>
                                                        ) : (
                                                            <Paper sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: 2, mb: 1.5 }}>
                                                                <Typography variant="body2" sx={{ color: '#4B5563' }}>
                                                                    {item.task?.length > 100 ? item.task.substring(0, 100) + '...' : item.task}
                                                                </Typography>
                                                            </Paper>
                                                        )}
                                                        
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Срок: {item.dueDate ? format(new Date(item.dueDate), 'd MMM', { locale: ru }) : '—'}
                                                            </Typography>
                                                            {item.grade && (
                                                                <Chip 
                                                                    label={`Оценка: ${item.grade}`}
                                                                    size="small"
                                                                    color={item.grade >= 4 ? 'success' : item.grade >= 3 ? 'warning' : 'error'}
                                                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                                                />
                                                            )}
                                                        </Box>
                                                        
                                                        {item.score && item.maxScore && (
                                                            <Box sx={{ mb: 1.5 }}>
                                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                                    <Typography variant="caption" color="textSecondary">Баллы</Typography>
                                                                    <Typography variant="caption" fontWeight={500}>{item.score}/{item.maxScore}</Typography>
                                                                </Box>
                                                                <LinearProgress 
                                                                    variant="determinate" 
                                                                    value={(item.score / item.maxScore) * 100}
                                                                    sx={{ borderRadius: 1, height: 6 }}
                                                                />
                                                            </Box>
                                                        )}
                                                        
                                                        {item.feedback && (
                                                            <Box sx={{ p: 1.5, bgcolor: '#FFFBEB', borderRadius: 2, borderLeft: '3px solid #F59E0B' }}>
                                                                <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                                                    Комментарий:
                                                                </Typography>
                                                                <Typography variant="body2" sx={{ color: '#374151' }}>
                                                                    {item.feedback}
                                                                </Typography>
                                                            </Box>
                                                        )}
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            )}
                        </Box>
                    </TabPanel>

                    {/* Успеваемость */}
                    <TabPanel value={mainTabValue} index={2}>
                        <Box sx={{ p: 2 }}>
                            {!homeworkStats ? (
                                <Box sx={{ textAlign: 'center', py: 6 }}>
                                    <AssessmentIcon sx={{ fontSize: 64, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                        Нет данных об успеваемости
                                    </Typography>
                                </Box>
                            ) : (
                                <>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        <Grid item xs={6} sm={3}>
                                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#EEF2FF', borderRadius: 3 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#6366F1' }}>
                                                    {homeworkStats.totalHomework || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Заданий</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#ECFDF5', borderRadius: 3 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#10B981' }}>
                                                    {homeworkStats.checkedHomework || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Проверено</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#FFFBEB', borderRadius: 3 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#F59E0B' }}>
                                                    {homeworkStats.averageGrade || 0}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Средний балл</Typography>
                                            </Box>
                                        </Grid>
                                        <Grid item xs={6} sm={3}>
                                            <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#F5F3FF', borderRadius: 3 }}>
                                                <Typography variant="h4" sx={{ fontWeight: 700, color: '#8B5CF6' }}>
                                                    {Math.round(homeworkStats.averagePercentage || 0)}%
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#6B7280' }}>Успеваемость</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>

                                    {homeworkStats?.gradeDistribution && (
                                        <Paper sx={{ p: 3, mb: 3, borderRadius: 3, border: '1px solid #F3F4F6' }}>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                                                Распределение оценок
                                            </Typography>
                                            <Grid container spacing={2}>
                                                {Object.entries(homeworkStats.gradeDistribution).map(([grade, count]) => (
                                                    <Grid item xs={2.4} key={grade}>
                                                        <Box sx={{ textAlign: 'center' }}>
                                                            <Typography variant="h5" sx={{ fontWeight: 600, color: '#FFD700' }}>
                                                                {grade}
                                                            </Typography>
                                                            <Typography variant="caption" sx={{ color: '#6B7280' }}>
                                                                {count} шт.
                                                            </Typography>
                                                            <LinearProgress 
                                                                variant="determinate" 
                                                                value={Math.min(100, (count / (homeworkStats.checkedHomework || 1)) * 100)} 
                                                                sx={{ mt: 1, borderRadius: 4, height: 6 }}
                                                            />
                                                        </Box>
                                                    </Grid>
                                                ))}
                                            </Grid>
                                        </Paper>
                                    )}

                                    {progressTimeline.length > 0 && (
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: '#374151' }}>
                                                Динамика
                                            </Typography>
                                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 120 }}>
                                                {progressTimeline.slice(-10).map((point, i) => (
                                                    <Tooltip key={i} title={`${point.topic}: ${point.score} баллов`}>
                                                        <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                            <Box sx={{ 
                                                                height: `${Math.max(20, (point.score || 0) * 0.9)}px`,
                                                                bgcolor: (point.score || 0) >= 80 ? '#10B981' : (point.score || 0) >= 60 ? '#F59E0B' : '#EF4444',
                                                                borderRadius: '6px 6px 4px 4px',
                                                                transition: 'height 0.3s'
                                                            }} />
                                                            <Typography variant="caption" sx={{ fontSize: '0.55rem', mt: 0.5, display: 'block', color: '#9CA3AF' }}>
                                                                {format(new Date(point.date), 'd MMM', { locale: ru })}
                                                            </Typography>
                                                        </Box>
                                                    </Tooltip>
                                                ))}
                                            </Box>
                                        </Box>
                                    )}
                                </>
                            )}
                        </Box>
                    </TabPanel>

                    {/* История */}
                    <TabPanel value={mainTabValue} index={3}>
                        <Box sx={{ p: 2 }}>
                            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #F3F4F6', borderRadius: 3 }}>
                                <Table size="small">
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#F9FAFB' }}>
                                            <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Дата</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Время</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Предмет</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Репетитор</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#374151' }}>Статус</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {filteredLessons.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} align="center" sx={{ py: 4, color: '#6B7280' }}>
                                                    Нет занятий
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredLessons.slice().reverse().map(lesson => (
                                                <TableRow 
                                                    key={lesson.id}
                                                    hover
                                                    sx={{ cursor: 'pointer' }}
                                                    onClick={() => setSelectedLesson(lesson)}
                                                >
                                                    <TableCell>{format(new Date(lesson.lessonDate), 'd MMM yyyy', { locale: ru })}</TableCell>
                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                        {lesson.startTime?.slice(0,5)}—{lesson.endTime?.slice(0,5)}
                                                    </TableCell>
                                                    <TableCell>{lesson.course?.name || '—'}</TableCell>
                                                    <TableCell>{lesson.tutor?.fullName || '—'}</TableCell>
                                                    <TableCell><LessonStatusBadge status={lesson.status} /></TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Box>
                    </TabPanel>

                    {/* Stepik */}
                    <TabPanel value={mainTabValue} index={4}>
                        <Box sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                <Typography variant="h6" sx={{ fontWeight: 600, color: '#374151' }}>
                                    Мои курсы на Stepik
                                </Typography>
                                <Button
                                    variant="outlined"
                                    startIcon={<RefreshIcon />}
                                    onClick={fetchStepikCourses}
                                    disabled={stepikLoading}
                                    size="small"
                                >
                                    Обновить
                                </Button>
                            </Box>

                            {stepikLoading ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                                    <CircularProgress size={32} />
                                </Box>
                            ) : stepikCourses.length === 0 ? (
                                <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 4, border: '1px solid #F3F4F6' }}>
                                    <SchoolIcon sx={{ fontSize: 60, color: '#E5E7EB', mb: 2 }} />
                                    <Typography variant="h6" sx={{ color: '#6B7280', fontWeight: 500 }} gutterBottom>
                                        Нет назначенных курсов
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Репетитор пока не назначил вам курсы на Stepik
                                    </Typography>
                                </Paper>
                            ) : (
                                <Grid container spacing={3}>
                                    {stepikCourses.map((course) => (
                                        <Grid item xs={12} sm={6} md={4} key={course.id}>
                                            <Card sx={{ 
                                                borderRadius: 3, 
                                                height: '100%',
                                                border: '1px solid #F3F4F6',
                                                boxShadow: 'none',
                                                transition: 'all 0.15s',
                                                '&:hover': { 
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                                                    borderColor: '#6366F1'
                                                }
                                            }}>
                                                <CardContent>
                                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                                                        <Avatar sx={{ bgcolor: '#EEF2FF', width: 48, height: 48 }}>
                                                            <SchoolIcon sx={{ color: '#6366F1' }} />
                                                        </Avatar>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                                                                {course.courseTitle || `Курс #${course.courseId}`}
                                                            </Typography>
                                                            <Chip 
                                                                label={
                                                                    course.status === 'completed' ? 'Завершён' :
                                                                    course.status === 'in_progress' ? 'В процессе' : 'Назначен'
                                                                }
                                                                size="small"
                                                                color={
                                                                    course.status === 'completed' ? 'success' :
                                                                    course.status === 'in_progress' ? 'warning' : 'default'
                                                                }
                                                                sx={{ height: 20, fontSize: '0.65rem' }}
                                                            />
                                                        </Box>
                                                    </Box>

                                                    <Box sx={{ mb: 2 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                                            <Typography variant="caption" color="textSecondary">
                                                                Прогресс
                                                            </Typography>
                                                            <Typography variant="caption" fontWeight={500}>
                                                                {course.progressPercent || 0}%
                                                            </Typography>
                                                        </Box>
                                                        <LinearProgress 
                                                            variant="determinate" 
                                                            value={course.progressPercent || 0}
                                                            sx={{ borderRadius: 1, height: 6 }}
                                                        />
                                                    </Box>

                                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mb: 2 }}>
                                                        Назначен: {new Date(course.assignedAt).toLocaleDateString('ru-RU')}
                                                    </Typography>

                                                    <Button
                                                        variant="contained"
                                                        fullWidth
                                                        size="small"
                                                        endIcon={<OpenInNewIcon />}
                                                        href={`https://stepik.org/course/${course.courseId}`}
                                                        target="_blank"
                                                        sx={{ 
                                                            bgcolor: '#6366F1',
                                                            '&:hover': { bgcolor: '#4F46E5' },
                                                            borderRadius: 2,
                                                            textTransform: 'none'
                                                        }}
                                                    >
                                                        Перейти к курсу
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                        </Box>
                    </TabPanel>
                </Paper>

                {/* Диалог с деталями занятия */}
                <Dialog 
                    open={!!selectedLesson} 
                    onClose={() => setSelectedLesson(null)}
                    maxWidth="sm"
                    fullWidth
                    PaperProps={{ sx: { borderRadius: 4 } }}
                >
                    {selectedLesson && (
                        <>
                            <DialogTitle sx={{ pb: 1 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                        {selectedLesson.course?.name || 'Занятие'}
                                    </Typography>
                                    <IconButton onClick={() => setSelectedLesson(null)} size="small">
                                        <CloseIcon />
                                    </IconButton>
                                </Box>
                            </DialogTitle>
                            <DialogContent dividers>
                                <Stack spacing={2}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CalendarIcon sx={{ color: '#6B7280' }} />
                                        <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 500 }}>
                                                {format(new Date(selectedLesson.lessonDate), 'd MMMM yyyy', { locale: ru })}
                                            </Typography>
                                            <Typography variant="body2" sx={{ color: '#6B7280', fontFamily: 'monospace' }}>
                                                {selectedLesson.startTime?.slice(0,5)} — {selectedLesson.endTime?.slice(0,5)}
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <PersonIcon sx={{ color: '#6B7280' }} />
                                        <Typography variant="body1">{selectedLesson.tutor?.fullName}</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <CircleIcon sx={{ fontSize: 12, color: '#6B7280' }} />
                                        <LessonStatusBadge status={selectedLesson.status} />
                                    </Box>
                                    
                                    {getHomeworkForLesson(selectedLesson) && (
                                        <Box sx={{ p: 2, bgcolor: '#FFFBEB', borderRadius: 2, borderLeft: '3px solid #F59E0B' }}>
                                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                                <AssignmentIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                                                Пройдено на прошлом уроке
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5, color: '#374151' }}>
                                                {getHomeworkForLesson(selectedLesson).text}
                                            </Typography>
                                        </Box>
                                    )}
                                    
                                    {selectedLesson.notes && (
                                        <Box sx={{ p: 2, bgcolor: '#F9FAFB', borderRadius: 2 }}>
                                            <Typography variant="caption" sx={{ color: '#6B7280', fontWeight: 500 }}>
                                                Заметки
                                            </Typography>
                                            <Typography variant="body2" sx={{ mt: 0.5 }}>
                                                {selectedLesson.notes}
                                            </Typography>
                                        </Box>
                                    )}
                                </Stack>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, py: 2 }}>
                                <Button onClick={() => setSelectedLesson(null)}>Закрыть</Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            </Box>
        </LocalizationProvider>
    );
}

export default StudentDashboard;