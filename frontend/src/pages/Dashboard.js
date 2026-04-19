// ========== frontend/src/pages/Dashboard.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, IconButton, Snackbar,
    FormControl, InputLabel, Select, MenuItem, Divider
} from '@mui/material';
import {
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    PlayArrow as PlayIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Event as EventIcon,
    ArrowBack as ArrowBackIcon,
    ArrowForward as ArrowForwardIcon,
    CalendarToday as CalendarTodayIcon,
    AccessTime as AccessTimeIcon,
    WbSunny as SunIcon,
    Brightness3 as NightIcon,
    Cloud as CloudIcon,
    Videocam as VideocamIcon,
    Draw as DrawIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, isSameDay, subDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import VideoCallModal from '../components/VideoCallModal';
import WhiteboardModal from '../components/WhiteboardModal';
import axiosInstance from '../api/axiosConfig';
import {
    getAllLessons,
    completeLesson,
    cancelLesson,
    rescheduleLesson,
    addNotes,
    getLessonPlans as fetchLessonPlansAPI,
    getVariants as fetchVariantsAPI
} from '../services/api';

function Dashboard() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [todayLessons, setTodayLessons] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
    const [lessonNotes, setLessonNotes] = useState('');
    const [nextLessonPlan, setNextLessonPlan] = useState('');
    const [openNotesDialog, setOpenNotesDialog] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [previousLessonsMap, setPreviousLessonsMap] = useState({});
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [currentTime, setCurrentTime] = useState(new Date());
    
    const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
    const [selectedDateForReschedule, setSelectedDateForReschedule] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [lessonToReschedule, setLessonToReschedule] = useState(null);
    
    const [videoCallOpen, setVideoCallOpen] = useState(false);
    const [selectedLessonForCall, setSelectedLessonForCall] = useState(null);
    
    const [whiteboardOpen, setWhiteboardOpen] = useState(false);
    const [selectedLessonForBoard, setSelectedLessonForBoard] = useState(null);
    
    const [lessonPlans, setLessonPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    
    const [variants, setVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [applyType, setApplyType] = useState('none');

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return 'Доброе утро';
        if (hour >= 12 && hour < 17) return 'Добрый день';
        if (hour >= 17 && hour < 22) return 'Добрый вечер';
        return 'Доброй ночи';
    };

    const getTimeGradient = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) {
            return 'linear-gradient(135deg, #FFB347 0%, #FF6B6B 100%)';
        }
        if (hour >= 12 && hour < 17) {
            return 'linear-gradient(135deg, #56B4E9 0%, #4A90E2 100%)';
        }
        if (hour >= 17 && hour < 22) {
            return 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)';
        }
        return 'linear-gradient(135deg, #1A2980 0%, #0C0C3C 100%)';
    };

    const getDecorations = () => {
        const hour = currentTime.getHours();
        
        if (hour >= 5 && hour < 12) {
            return {
                mainIcon: <SunIcon sx={{ fontSize: 120, color: 'rgba(255, 215, 0, 0.3)' }} />,
                floatingElements: [
                    { icon: <CloudIcon />, size: 60, top: '10%', left: '5%', delay: '0s', duration: '20s' },
                    { icon: <CloudIcon />, size: 80, top: '60%', left: '15%', delay: '2s', duration: '25s' },
                    { icon: <CloudIcon />, size: 50, top: '20%', left: '70%', delay: '1s', duration: '18s' },
                    { icon: <SunIcon />, size: 40, top: '15%', left: '85%', delay: '0s', duration: '15s' }
                ]
            };
        }
        if (hour >= 12 && hour < 17) {
            return {
                mainIcon: <SunIcon sx={{ fontSize: 150, color: 'rgba(255, 215, 0, 0.4)' }} />,
                floatingElements: [
                    { icon: <CloudIcon />, size: 70, top: '15%', left: '10%', delay: '0s', duration: '22s' },
                    { icon: <CloudIcon />, size: 90, top: '50%', left: '20%', delay: '1.5s', duration: '28s' },
                    { icon: <CloudIcon />, size: 60, top: '70%', left: '75%', delay: '0.8s', duration: '19s' }
                ]
            };
        }
        if (hour >= 17 && hour < 22) {
            return {
                mainIcon: <NightIcon sx={{ fontSize: 100, color: 'rgba(255, 255, 200, 0.4)' }} />,
                floatingElements: [
                    { icon: <StarIcon />, size: 20, top: '15%', left: '20%', delay: '0s', duration: '3s' },
                    { icon: <StarIcon />, size: 25, top: '25%', left: '80%', delay: '1s', duration: '4s' },
                    { icon: <StarIcon />, size: 18, top: '45%', left: '50%', delay: '0.5s', duration: '3.5s' },
                    { icon: <StarIcon />, size: 22, top: '70%', left: '30%', delay: '1.2s', duration: '4.2s' },
                    { icon: <StarIcon />, size: 15, top: '85%', left: '85%', delay: '0.3s', duration: '2.8s' },
                    { icon: <NightIcon />, size: 60, top: '10%', left: '85%', delay: '0s', duration: '20s' }
                ]
            };
        }
        return {
            mainIcon: <NightIcon sx={{ fontSize: 100, color: 'rgba(200, 220, 255, 0.5)' }} />,
            floatingElements: [
                { icon: <StarIcon />, size: 25, top: '10%', left: '15%', delay: '0s', duration: '4s' },
                { icon: <StarIcon />, size: 30, top: '20%', left: '70%', delay: '1s', duration: '5s' },
                { icon: <StarIcon />, size: 20, top: '35%', left: '40%', delay: '0.5s', duration: '3.5s' },
                { icon: <StarIcon />, size: 22, top: '55%', left: '85%', delay: '1.2s', duration: '4.2s' },
                { icon: <StarIcon />, size: 18, top: '75%', left: '25%', delay: '0.8s', duration: '3s' },
                { icon: <StarIcon />, size: 28, top: '85%', left: '60%', delay: '1.5s', duration: '4.5s' },
                { icon: <NightIcon />, size: 70, top: '5%', left: '80%', delay: '0s', duration: '25s' }
            ]
        };
    };

    const StarIcon = ({ sx }) => (
        <Box sx={{ ...sx, position: 'relative' }}>
            ★
        </Box>
    );

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (user) {
            loadAllData();
        }
    }, [user, selectedDate]);

    const loadAllData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                fetchLessonsForDate(selectedDate),
                fetchPreviousLessons()
            ]);
        } catch (err) {
            console.error('Ошибка при загрузке:', err);
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const fetchLessonsForDate = async (date) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const response = await getAllLessons(user.id);
            
            const lessonsData = response.data !== undefined ? response.data : response;
            
            const filtered = lessonsData.filter(lesson => lesson.lessonDate === dateStr);
            const sorted = filtered.sort((a, b) => a.startTime.localeCompare(b.startTime));
            setTodayLessons(sorted);
        } catch (err) {
            console.error('Ошибка загрузки занятий:', err);
        }
    };

    const fetchPreviousLessons = async () => {
        try {
            const response = await getAllLessons(user.id);
            
            const allLessons = response.data !== undefined ? response.data : response;
            
            const lessonsByStudentAndCourse = {};
            
            for (const lesson of allLessons) {
                const studentId = lesson.student.id;
                const courseId = lesson.course?.id || 'no-course';
                const key = `${studentId}_${courseId}`;
                
                if (!lessonsByStudentAndCourse[key]) {
                    lessonsByStudentAndCourse[key] = [];
                }
                lessonsByStudentAndCourse[key].push(lesson);
            }
            
            const map = {};
            
            for (const key in lessonsByStudentAndCourse) {
                const studentLessons = lessonsByStudentAndCourse[key].sort((a, b) => 
                    new Date(a.lessonDate) - new Date(b.lessonDate)
                );
                
                let lastPlan = null;
                let lastPlanLesson = null;
                let planTransferred = false;
                
                for (let i = 0; i < studentLessons.length; i++) {
                    const currentLesson = studentLessons[i];
                    
                    if (currentLesson.nextLessonPlan) {
                        lastPlan = currentLesson.nextLessonPlan;
                        lastPlanLesson = currentLesson;
                        planTransferred = false;
                        continue;
                    }
                    
                    if (lastPlan && lastPlanLesson && !planTransferred) {
                        if (currentLesson.status !== 'CANCELLED') {
                            map[currentLesson.id] = {
                                ...lastPlanLesson,
                                nextLessonPlan: lastPlan,
                                courseName: lastPlanLesson.course?.name || 'Без предмета'
                            };
                            planTransferred = true;
                            lastPlan = null;
                            lastPlanLesson = null;
                        }
                    }
                }
            }
            
            setPreviousLessonsMap(map);
        } catch (err) {
            console.error('Ошибка загрузки предыдущих занятий:', err);
        }
    };

    const fetchLessonPlans = async () => {
        try {
            const response = await fetchLessonPlansAPI();
            const plansData = response.data !== undefined ? response.data : response;
            setLessonPlans(Array.isArray(plansData) ? plansData : []);
        } catch (err) {
            console.error('Ошибка загрузки планов:', err);
            setLessonPlans([]);
        }
    };

    const fetchVariants = async () => {
        try {
            const response = await fetchVariantsAPI();
            const variantsData = response.data !== undefined ? response.data : response;
            setVariants(Array.isArray(variantsData) ? variantsData : []);
        } catch (err) {
            console.error('Ошибка загрузки вариантов:', err);
            setVariants([]);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadAllData();
        setRefreshing(false);
    };

    const handleOpenComplete = (lesson) => {
        setSelectedLesson(lesson);
        setLessonNotes(lesson.notes || '');
        setNextLessonPlan(lesson.nextLessonPlan || '');
        setSelectedPlanId('');
        setSelectedVariantId('');
        setApplyType('none');
        fetchLessonPlans();
        fetchVariants();
        setOpenCompleteDialog(true);
    };

    const handleApplyItem = (type, id) => {
        if (type === 'plan') {
            const plan = lessonPlans.find(p => p.id === parseInt(id));
            if (!plan) return;
            
            let notesText = '';
            if (plan.lessonStructure) notesText = plan.lessonStructure;
            if (plan.learningObjectives) notesText = `🎯 Цели:\n${plan.learningObjectives}\n\n${notesText}`;
            if (plan.materialsNeeded) notesText = `📚 Материалы:\n${plan.materialsNeeded}\n\n${notesText}`;
            setLessonNotes(notesText);
            if (plan.homeworkTemplate) setNextLessonPlan(plan.homeworkTemplate);
        } else if (type === 'variant') {
            const variant = variants.find(v => v.id === parseInt(id));
            if (!variant) return;
            setNextLessonPlan(`🔗 Вариант: ${variant.title}\n${variant.url}`);
        }
        
        setApplyType(type);
        if (type === 'plan') {
            setSelectedPlanId(id);
            setSelectedVariantId('');
        } else {
            setSelectedVariantId(id);
            setSelectedPlanId('');
        }
    };

    const handleCompleteLesson = async () => {
        if (!selectedLesson) return;
        
        try {
            await completeLesson(selectedLesson.id, lessonNotes, nextLessonPlan);
            setOpenCompleteDialog(false);
            setSelectedLesson(null);
            setLessonNotes('');
            setNextLessonPlan('');
            await loadAllData();
            showSnackbar('✅ Занятие завершено!', 'success');
        } catch (err) {
            console.error('Ошибка при завершении урока:', err);
            showSnackbar('Ошибка при завершении урока', 'error');
        }
    };

    const handleOpenNotes = (lesson) => {
        setSelectedLesson(lesson);
        setLessonNotes(lesson.notes || '');
        setNextLessonPlan(lesson.nextLessonPlan || '');
        setOpenNotesDialog(true);
    };

    const handleSaveNotes = async () => {
        if (!selectedLesson) return;
        
        try {
            await addNotes(selectedLesson.id, lessonNotes, nextLessonPlan);
            await loadAllData();
            setOpenNotesDialog(false);
            setSelectedLesson(null);
            showSnackbar('Заметки сохранены', 'success');
        } catch (err) {
            console.error('Ошибка при сохранении заметок:', err);
            showSnackbar('Ошибка при сохранении заметок', 'error');
        }
    };

    const handleCancelClick = (lesson) => {
        setSelectedLesson(lesson);
        setCancelReason('');
        setOpenCancelDialog(true);
    };

    const handleCancelConfirm = async () => {
        if (!selectedLesson) return;

        try {
            await cancelLesson(selectedLesson.id, cancelReason);
            setOpenCancelDialog(false);
            setSelectedLesson(null);
            setCancelReason('');
            await loadAllData();
            showSnackbar('❌ Занятие отменено', 'info');
        } catch (err) {
            console.error('Ошибка при отмене занятия:', err);
            showSnackbar('Ошибка при отмене занятия', 'error');
        }
    };

    const handleRescheduleClick = (lesson) => {
        setLessonToReschedule(lesson);
        const lessonDate = new Date(lesson.lessonDate);
        setSelectedDateForReschedule(lessonDate);
        
        const currentTime = lesson.startTime.slice(0,5);
        setSelectedTime(currentTime);
        
        checkAvailableSlots(lessonDate, lesson);
        setOpenRescheduleDialog(true);
    };

    const checkAvailableSlots = async (date, currentLesson) => {
        try {
            const allLessonsForTutor = await getAllLessons(user.id);
            const lessonsData = allLessonsForTutor.data !== undefined ? allLessonsForTutor.data : allLessonsForTutor;
            
            const dateStr = date.toISOString().split('T')[0];
            
            const takenSlots = lessonsData
                .filter(lesson => {
                    const lessonDate = lesson.lessonDate;
                    return lessonDate === dateStr && 
                        lesson.status !== 'CANCELLED' &&
                        lesson.id !== currentLesson.id;
                })
                .map(lesson => lesson.startTime.slice(0, 5));
            
            const allTimeSlots = [
                '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', 
                '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', 
                '20:00', '21:00', '22:00'
            ];
            
            const available = allTimeSlots.filter(slot => !takenSlots.includes(slot));
            
            setAvailableSlots(available);
            
            if (selectedTime && !available.includes(selectedTime)) {
                setSelectedTime('');
            }
            
        } catch (err) {
            console.error('Ошибка проверки слотов:', err);
            setAvailableSlots([]);
        }
    };

    const handleDateChange = (date) => {
        setSelectedDateForReschedule(date);
        if (lessonToReschedule) {
            checkAvailableSlots(date, lessonToReschedule);
        }
    };

    const handleRescheduleConfirm = async () => {
        if (!lessonToReschedule || !selectedTime) return;
        
        try {
            const timeFrom = selectedTime + ':00';
            const timeTo = (parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':00';
            const newDate = selectedDateForReschedule.toISOString().split('T')[0];
            
            await rescheduleLesson(lessonToReschedule.id, newDate, timeFrom, timeTo);
            
            setOpenRescheduleDialog(false);
            setLessonToReschedule(null);
            setSelectedTime('');
            await loadAllData();
            showSnackbar('✅ Занятие успешно перенесено', 'success');
            
        } catch (err) {
            console.error('Ошибка при переносе:', err);
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleStartLesson = async (lesson) => {
        try {
            await axiosInstance.post(`/lessons/${lesson.id}/start`);
            showSnackbar('✅ Урок начат!', 'success');
            await loadAllData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleStudentNoShow = (lesson) => {
        setSelectedLesson(lesson);
        setCancelReason('Ученик не пришёл');
        setOpenCancelDialog(true);
    };

    const goToPreviousDay = () => {
        setSelectedDate(prev => subDays(prev, 1));
    };

    const goToNextDay = () => {
        setSelectedDate(prev => addDays(prev, 1));
    };

    const goToToday = () => {
        setSelectedDate(new Date());
    };

    const showSnackbar = (message, severity) => {
        setSnackbar({ open: true, message, severity });
    };

    const getLessonColor = (lesson) => {
        if (lesson.status === 'CANCELLED') return 'error';
        if (lesson.status === 'PAID') return 'success';
        if (lesson.status === 'COMPLETED') return 'warning';
        if (lesson.status === 'IN_PROGRESS') return 'info';
        if (lesson.status === 'RESCHEDULED') return 'secondary';
        return 'info';
    };

    const getStatusText = (lesson) => {
        if (lesson.status === 'CANCELLED') return 'Отменено';
        if (lesson.status === 'PAID') return 'Оплачено';
        if (lesson.status === 'COMPLETED') return 'Проведено (ждёт оплаты)';
        if (lesson.status === 'IN_PROGRESS') return 'В процессе';
        if (lesson.status === 'RESCHEDULED') return 'Перенесено';
        return 'Запланировано';
    };

    const isToday = isSameDay(selectedDate, new Date());
    const isPast = selectedDate < new Date() && !isToday;

    const decorations = getDecorations();

    const LessonCard = ({ lesson }) => {
        const startTime = lesson.startTime?.slice(0,5) || '--:--';
        const endTime = lesson.endTime?.slice(0,5) || '--:--';
        const courseName = lesson.course?.name || 'Занятие';
        const studentName = lesson.student?.fullName || 'Ученик';
        const studentRate = getStudentRateForTutor(lesson.student, lesson.tutor?.id);
        
        const isRescheduledNew = lesson.originalLesson !== null && lesson.status === 'RESCHEDULED';
        const isRescheduledOriginal = lesson.status === 'RESCHEDULED' && lesson.originalLesson === null;
        
        const isCompleted = lesson.status === 'COMPLETED';
        const isPaid = lesson.status === 'PAID';
        const isCancelled = lesson.status === 'CANCELLED';
        const isInProgress = lesson.status === 'IN_PROGRESS';
        const isScheduled = lesson.status === 'SCHEDULED';
        
        const getRescheduledTarget = () => {
            if (!isRescheduledOriginal) return null;
            return todayLessons.find(l => l.originalLesson?.id === lesson.id);
        };
        
        const rescheduledTarget = getRescheduledTarget();
        
        return (
            <Card 
                sx={{ 
                    mb: 2,
                    borderLeft: 6,
                    borderColor: `${getLessonColor(lesson)}.main`,
                    bgcolor: isScheduled ? '#fff3e0' : 
                             isInProgress ? '#e3f2fd' :
                             isCompleted ? '#fff8e1' : 'white',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateX(4px)' }
                }}
            >
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ minWidth: 100 }}>
                                    {startTime} - {endTime}
                                </Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                    {studentName}
                                </Typography>
                                <Chip 
                                    label={courseName} 
                                    size="small" 
                                    variant="outlined"
                                    color="primary"
                                />
                                <Chip 
                                    label={getStatusText(lesson)}
                                    color={getLessonColor(lesson)}
                                    size="small"
                                />
                                {studentRate && (
                                    <Chip 
                                        label={`${studentRate} ₽`}
                                        size="small"
                                        color="success"
                                        variant="outlined"
                                    />
                                )}
                            </Box>
                            
                            {isRescheduledOriginal && rescheduledTarget && (
                                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        🔄 ПЕРЕНЕСЕНО:
                                    </Typography>
                                    <Typography variant="body2">
                                        Занятие перенесено на {new Date(rescheduledTarget.lessonDate).toLocaleDateString('ru-RU')} в {rescheduledTarget.startTime?.slice(0,5)}
                                    </Typography>
                                </Paper>
                            )}
                            
                            {previousLessonsMap[lesson.id]?.nextLessonPlan && (
                                <Paper sx={{ p: 2, bgcolor: '#fff8e1', mb: 2, borderLeft: 4, borderColor: 'warning.main' }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        📋 ЧТО БЫЛО ЗАДАНО К ЭТОМУ УРОКУ:
                                    </Typography>
                                    <Typography variant="body1">
                                        {previousLessonsMap[lesson.id].nextLessonPlan}
                                    </Typography>
                                </Paper>
                            )}
                            
                            {lesson.notes && (
                                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        📝 ЧТО ДЕЛАЛИ НА УРОКЕ:
                                    </Typography>
                                    <Typography variant="body1">
                                        {lesson.notes}
                                    </Typography>
                                </Paper>
                            )}
                            
                            {lesson.nextLessonPlan && (
                                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderLeft: 4, borderColor: 'primary.main' }}>
                                    <Typography variant="body2" color="textSecondary" gutterBottom>
                                        🎯 ЧТО СДЕЛАТЬ К СЛЕДУЮЩЕМУ УРОКУ:
                                    </Typography>
                                    <Typography variant="body1">
                                        {lesson.nextLessonPlan}
                                    </Typography>
                                </Paper>
                            )}
                            
                            {isCancelled && lesson.notes?.includes('Отменено') && (
                                <Paper sx={{ p: 2, bgcolor: '#ffebee', mb: 2 }}>
                                    <Typography variant="body2" color="error" gutterBottom>
                                        ❌ ПРИЧИНА ОТМЕНЫ:
                                    </Typography>
                                    <Typography variant="body1" color="error">
                                        {lesson.notes.replace('❌ Отменено: ', '').replace('❌ Ученик не пришёл: ', '')}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', gap: 1, ml: 2, flexDirection: 'column' }}>
                            {/* Видеозвонок */}
                            {(isScheduled || isInProgress || lesson.status === 'RESCHEDULED') && !isCancelled && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<VideocamIcon />}
                                    onClick={() => {
                                        setSelectedLessonForCall(lesson);
                                        setVideoCallOpen(true);
                                    }}
                                    sx={{ mb: 0.5 }}
                                >
                                    Видеозвонок
                                </Button>
                            )}
                            
                            {/* Онлайн-доска */}
                            {(isScheduled || isInProgress || lesson.status === 'RESCHEDULED') && !isCancelled && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<DrawIcon />}
                                    onClick={() => {
                                        setSelectedLessonForBoard(lesson);
                                        setWhiteboardOpen(true);
                                    }}
                                    sx={{ mb: 0.5 }}
                                >
                                    Онлайн-доска
                                </Button>
                            )}
                            
                            {/* Начать урок */}
                            {(isScheduled || lesson.status === 'RESCHEDULED') && (
                                <Button
                                    size="small"
                                    variant="contained"
                                    color="primary"
                                    startIcon={<PlayIcon />}
                                    onClick={() => handleStartLesson(lesson)}
                                >
                                    Начать урок
                                </Button>
                            )}
                            
                            {/* Завершить урок и Ученик не пришёл */}
                            {isInProgress && (
                                <>
                                    <Button
                                        size="small"
                                        variant="contained"
                                        color="success"
                                        startIcon={<CheckIcon />}
                                        onClick={() => handleOpenComplete(lesson)}
                                    >
                                        Завершить урок
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<CancelIcon />}
                                        onClick={() => handleStudentNoShow(lesson)}
                                    >
                                        Ученик не пришёл
                                    </Button>
                                </>
                            )}
                            
                            {/* Перенести и Отмена */}
                            {(isScheduled || lesson.status === 'RESCHEDULED') && (
                                <>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="warning"
                                        startIcon={<EventIcon />}
                                        onClick={() => handleRescheduleClick(lesson)}
                                    >
                                        Перенести
                                    </Button>
                                    <Button
                                        size="small"
                                        variant="outlined"
                                        color="error"
                                        startIcon={<CancelIcon />}
                                        onClick={() => handleCancelClick(lesson)}
                                    >
                                        Отмена
                                    </Button>
                                </>
                            )}
                            
                            {/* Заметки */}
                            {(isCompleted || isPaid) && (
                                <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => handleOpenNotes(lesson)}
                                >
                                    Заметки
                                </Button>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    if (error) return (
        <Box sx={{ p: 3 }}>
            <Alert severity="error">{error}</Alert>
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ p: 3 }}>
                <Paper
                    sx={{
                        position: 'relative',
                        mb: 4,
                        borderRadius: 4,
                        background: getTimeGradient(),
                        minHeight: 200,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: { xs: 3, md: 4 },
                        overflow: 'hidden',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                        transition: 'background 0.5s ease'
                    }}
                >
                    {decorations.floatingElements.map((el, index) => (
                        <Box
                            key={index}
                            sx={{
                                position: 'absolute',
                                top: el.top,
                                left: el.left,
                                fontSize: el.size,
                                color: 'rgba(255, 255, 255, 0.3)',
                                animation: `float ${el.duration} infinite ease-in-out`,
                                animationDelay: el.delay,
                                pointerEvents: 'none',
                                '@keyframes float': {
                                    '0%': { transform: 'translateY(0px) rotate(0deg)' },
                                    '50%': { transform: 'translateY(-15px) rotate(5deg)' },
                                    '100%': { transform: 'translateY(0px) rotate(0deg)' }
                                }
                            }}
                        >
                            {el.icon}
                        </Box>
                    ))}
                    
                    <Box
                        sx={{
                            position: 'absolute',
                            right: 30,
                            bottom: 20,
                            opacity: 0.25,
                            transform: 'scale(1)',
                            pointerEvents: 'none',
                            animation: 'pulse 4s infinite ease-in-out',
                            '@keyframes pulse': {
                                '0%': { transform: 'scale(1)', opacity: 0.25 },
                                '50%': { transform: 'scale(1.05)', opacity: 0.35 },
                                '100%': { transform: 'scale(1)', opacity: 0.25 }
                            }
                        }}
                    >
                        {decorations.mainIcon}
                    </Box>
                    
                    <Box sx={{ position: 'relative', zIndex: 2, color: 'white' }}>
                        <Typography 
                            variant="h2" 
                            sx={{ 
                                fontWeight: 'bold', 
                                fontSize: { xs: '2rem', md: '3.5rem' },
                                textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
                                letterSpacing: '2px'
                            }}
                        >
                            {format(currentTime, 'HH:mm')}
                        </Typography>
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                mt: 1,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                fontWeight: 500
                            }}
                        >
                            {format(currentTime, 'EEEE, d MMMM yyyy', { locale: ru })}
                        </Typography>
                        <Typography 
                            variant="body1" 
                            sx={{ 
                                mt: 1.5,
                                opacity: 0.95,
                                textShadow: '1px 1px 2px rgba(0,0,0,0.3)',
                                fontSize: '1.1rem'
                            }}
                        >
                            {getGreeting()}, {user?.fullName?.split(' ')[0]}! 👋
                        </Typography>
                    </Box>
                    <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Button
                            variant="contained"
                            startIcon={<RefreshIcon />}
                            onClick={handleRefresh}
                            disabled={refreshing}
                            sx={{
                                bgcolor: 'rgba(255,255,255,0.9)',
                                color: '#333',
                                '&:hover': {
                                    bgcolor: 'white',
                                    transform: 'scale(1.02)'
                                },
                                transition: 'all 0.2s',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                            }}
                        >
                            {refreshing ? 'Обновление...' : 'Обновить'}
                        </Button>
                    </Box>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 500 }}>
                                📅 Расписание на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                            </Typography>
                            {isPast && (
                                <Chip 
                                    label="Прошедший день" 
                                    size="small" 
                                    color="warning" 
                                    variant="outlined"
                                    sx={{ fontWeight: 500 }}
                                />
                            )}
                        </Box>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={goToPreviousDay}
                                startIcon={<ArrowBackIcon />}
                                sx={{ borderRadius: 2 }}
                            >
                                Предыдущий
                            </Button>
                            
                            <Button
                                size="small"
                                variant={isToday ? "contained" : "outlined"}
                                onClick={goToToday}
                                startIcon={<CalendarTodayIcon />}
                                color="primary"
                                sx={{ borderRadius: 2 }}
                            >
                                Сегодня
                            </Button>
                            
                            <Button
                                size="small"
                                variant="outlined"
                                onClick={goToNextDay}
                                endIcon={<ArrowForwardIcon />}
                                disabled={isToday}
                                sx={{ borderRadius: 2 }}
                            >
                                Следующий
                            </Button>
                        </Box>
                    </Box>
                    
                    {todayLessons.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="h6" color="textSecondary" gutterBottom>
                                На {format(selectedDate, 'd MMMM yyyy', { locale: ru })} занятий нет
                            </Typography>
                            {isPast && (
                                <Typography variant="body2" color="textSecondary">
                                    Вы можете вернуться к сегодняшнему дню или выбрать другую дату
                                </Typography>
                            )}
                        </Box>
                    ) : (
                        <Box>
                            {todayLessons.map(lesson => (
                                <LessonCard key={lesson.id} lesson={lesson} />
                            ))}
                        </Box>
                    )}
                </Paper>

                <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Завершение урока</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                {selectedLesson?.student?.fullName} | {selectedLesson?.startTime?.slice(0,5)} - {selectedLesson?.endTime?.slice(0,5)}
                            </Typography>
                            
                            <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                                <InputLabel>📋 Применить (опционально)</InputLabel>
                                <Select
                                    value={applyType === 'plan' ? `plan_${selectedPlanId}` : (applyType === 'variant' ? `variant_${selectedVariantId}` : '')}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (!val) {
                                            setApplyType('none');
                                            setSelectedPlanId('');
                                            setSelectedVariantId('');
                                            return;
                                        }
                                        const [type, id] = val.split('_');
                                        handleApplyItem(type, id);
                                    }}
                                    label="📋 Применить (опционально)"
                                >
                                    <MenuItem value="">— Не применять —</MenuItem>
                                    <Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600, opacity: '1 !important' }}>
                                        📖 Планы уроков
                                    </MenuItem>
                                    {lessonPlans.map(plan => (
                                        <MenuItem key={`plan_${plan.id}`} value={`plan_${plan.id}`}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2">{plan.title}</Typography>
                                                <Typography variant="caption" color="textSecondary">{plan.topic}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                    <Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600, opacity: '1 !important' }}>
                                        🔗 Варианты
                                    </MenuItem>
                                    {variants.map(variant => (
                                        <MenuItem key={`variant_${variant.id}`} value={`variant_${variant.id}`}>
                                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                                <Typography variant="body2">{variant.title}</Typography>
                                                <Typography variant="caption" color="textSecondary">{variant.subject} • {variant.examType}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                                <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5 }}>
                                    При выборе плана или варианта поле "Что сделать на следующем уроке" заполнится автоматически
                                </Typography>
                            </FormControl>
                            
                            <TextField
                                fullWidth
                                label="📝 Что делали на уроке"
                                multiline
                                rows={6}
                                value={lessonNotes}
                                onChange={(e) => setLessonNotes(e.target.value)}
                                margin="normal"
                                placeholder="Например: Прошли Present Simple, сделали упражнения..."
                                required
                            />
                            <TextField
                                fullWidth
                                label="🎯 Что сделать на следующем уроке"
                                multiline
                                rows={3}
                                value={nextLessonPlan}
                                onChange={(e) => setNextLessonPlan(e.target.value)}
                                margin="normal"
                                placeholder="Например: Разобрать Present Continuous, начать новую тему..."
                            />
                            <Alert severity="info" sx={{ mt: 2 }}>
                                После завершения урока родитель получит уведомление и сможет подтвердить оплату.
                            </Alert>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCompleteDialog(false)}>Отмена</Button>
                        <Button onClick={handleCompleteLesson} variant="contained" color="success" startIcon={<CheckIcon />}>
                            Завершить урок
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Редактировать заметки</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <TextField
                                fullWidth
                                label="📝 Что делали на уроке"
                                multiline
                                rows={4}
                                value={lessonNotes}
                                onChange={(e) => setLessonNotes(e.target.value)}
                                margin="normal"
                            />
                            <TextField
                                fullWidth
                                label="🎯 Что сделать на следующем уроке"
                                multiline
                                rows={3}
                                value={nextLessonPlan}
                                onChange={(e) => setNextLessonPlan(e.target.value)}
                                margin="normal"
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenNotesDialog(false)}>Отмена</Button>
                        <Button onClick={handleSaveNotes} variant="contained" startIcon={<SaveIcon />}>
                            Сохранить заметки
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
                    <DialogTitle>
                        {cancelReason === 'Ученик не пришёл' ? 'Ученик не пришёл' : 'Отмена занятия'}
                    </DialogTitle>
                    <DialogContent>
                        <TextField
                            autoFocus
                            margin="dense"
                            label={cancelReason === 'Ученик не пришёл' ? 'Примечание (необязательно)' : 'Причина отмены'}
                            fullWidth
                            multiline
                            rows={3}
                            value={cancelReason === 'Ученик не пришёл' ? '' : cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                        {cancelReason === 'Ученик не пришёл' && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Занятие будет отменено. У ученика появится задолженность на 1 занятие.
                            </Alert>
                        )}
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCancelDialog(false)}>Назад</Button>
                        <Button onClick={handleCancelConfirm} color="error" variant="contained">
                            {cancelReason === 'Ученик не пришёл' ? 'Подтвердить' : 'Отменить занятие'}
                        </Button>
                    </DialogActions>
                </Dialog>

                <Dialog 
                    open={openRescheduleDialog} 
                    onClose={() => setOpenRescheduleDialog(false)}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>Перенос занятия</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                Выберите новую дату и время
                            </Typography>
                            
                            <DatePicker
                                label="Дата"
                                value={selectedDateForReschedule}
                                onChange={handleDateChange}
                                minDate={new Date()}
                                slotProps={{ textField: { fullWidth: true, margin: 'normal' } }}
                            />
                            
                            {availableSlots.length > 0 ? (
                                <FormControl fullWidth sx={{ mt: 2 }}>
                                    <InputLabel>Время</InputLabel>
                                    <Select
                                        value={selectedTime}
                                        onChange={(e) => setSelectedTime(e.target.value)}
                                        label="Время"
                                    >
                                        {availableSlots.map(slot => (
                                            <MenuItem key={slot} value={slot}>
                                                {slot} — {parseInt(slot.split(':')[0]) + 1}:00
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            ) : (
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    На выбранную дату нет свободных слотов
                                </Alert>
                            )}
                            
                            {selectedTime && (
                                <Alert severity="success" sx={{ mt: 2 }}>
                                    ✅ Выбрано время: {selectedTime} — {parseInt(selectedTime.split(':')[0]) + 1}:00
                                </Alert>
                            )}
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenRescheduleDialog(false)}>Отмена</Button>
                        <Button 
                            onClick={handleRescheduleConfirm} 
                            variant="contained" 
                            color="primary"
                            disabled={!selectedTime}
                        >
                            Перенести
                        </Button>
                    </DialogActions>
                </Dialog>

                <VideoCallModal 
                    open={videoCallOpen} 
                    onClose={() => {
                        setVideoCallOpen(false);
                        setSelectedLessonForCall(null);
                    }}
                    lessonId={selectedLessonForCall?.id}
                    lessonInfo={selectedLessonForCall ? {
                        studentName: selectedLessonForCall.student?.fullName,
                        startTime: selectedLessonForCall.startTime,
                        endTime: selectedLessonForCall.endTime
                    } : null}
                />

                <WhiteboardModal 
                    open={whiteboardOpen} 
                    onClose={() => {
                        setWhiteboardOpen(false);
                        setSelectedLessonForBoard(null);
                    }}
                    lessonId={selectedLessonForBoard?.id}
                    lessonInfo={selectedLessonForBoard ? {
                        studentName: selectedLessonForBoard.student?.fullName,
                        startTime: selectedLessonForBoard.startTime,
                        endTime: selectedLessonForBoard.endTime
                    } : null}
                />

                <Snackbar
                    open={snackbar.open}
                    autoHideDuration={4000}
                    onClose={() => setSnackbar({ ...snackbar, open: false })}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
                        {snackbar.message}
                    </Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
}

export default Dashboard;