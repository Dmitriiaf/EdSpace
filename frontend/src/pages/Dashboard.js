// ========== frontend/src/pages/Dashboard.js ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Snackbar,
    FormControl, InputLabel, Select, MenuItem, Divider, Tabs, Tab
} from '@mui/material';
import { formatLessonTime, formatLessonDate } from '../utils/timezone';
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
    WbSunny as SunIcon,
    Brightness3 as NightIcon,
    Cloud as CloudIcon,
    Videocam as VideocamIcon,
    Draw as DrawIcon,
    Work as WorkIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { format, isSameDay, subDays, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import LessonRoom from '../components/LessonRoom';
import axiosInstance from '../api/axiosConfig';
import {
    getAllLessons,
    completeLesson,
    cancelLesson,
    rescheduleLesson,
    addNotes,
    getLessonPlans as fetchLessonPlansAPI,
    getVariants as fetchVariantsAPI,
    replaceCancelledWithResurrect
} from '../services/api';

function Dashboard() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    
    const [newHomeworkForLesson, setNewHomeworkForLesson] = useState({ 
        studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5', customDueDate: '' 
    });
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
    const [upcomingLessons, setUpcomingLessons] = useState([]);

    const [openRescheduleDialog, setOpenRescheduleDialog] = useState(false);
    const [selectedDateForReschedule, setSelectedDateForReschedule] = useState(new Date());
    const [selectedTime, setSelectedTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState([]);
    const [lessonToReschedule, setLessonToReschedule] = useState(null);
        
    const [lessonRoomOpen, setLessonRoomOpen] = useState(false);
    const [selectedLessonForRoom, setSelectedLessonForRoom] = useState(null);
    const [lessonPlans, setLessonPlans] = useState([]);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    
    const [variants, setVariants] = useState([]);
    const [selectedVariantId, setSelectedVariantId] = useState('');
    const [applyType, setApplyType] = useState('none');

    const [openReplaceDialog, setOpenReplaceDialog] = useState(false);
    const [cancelledLesson, setCancelledLesson] = useState(null);
    const [selectedDebtorId, setSelectedDebtorId] = useState('');
    const [debtorsList, setDebtorsList] = useState([]);

    // ========== БАНК ЗАДАНИЙ ==========
    const [openBankPicker, setOpenBankPicker] = useState(false);
    const [bankTasks, setBankTasks] = useState([]);
    const [bankLoading, setBankLoading] = useState(false);
    const [bankTab, setBankTab] = useState(0);

    const loadBankItems = async () => {
        setBankLoading(true);
        try {
            const [tasksRes, variantsRes] = await Promise.all([
                axiosInstance.get('/integration/tasks/search'),
                axiosInstance.get('/variants')
            ]);
            setBankTasks(tasksRes.data || []);
            setVariants(variantsRes.data || []);
        } catch (err) { console.error('Ошибка загрузки банка:', err); }
        finally { setBankLoading(false); }
    };

    const getGreeting = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return 'Доброе утро';
        if (hour >= 12 && hour < 17) return 'Добрый день';
        if (hour >= 17 && hour < 22) return 'Добрый вечер';
        return 'Доброй ночи';
    };

    const handleOpenComplete = async (lesson) => {
        setSelectedLesson(lesson);
        setLessonNotes(lesson.notes || '');
        setNextLessonPlan(lesson.nextLessonPlan || '');
        setNewHomeworkForLesson({ studentId: lesson.student?.id, task: '', dueDate: '', gradeType: 'GRADE_5', customDueDate: '' });
        setSelectedVariantId('');
        setApplyType('none');
        fetchLessonPlans();
        fetchVariants();
        try {
            const res = await getAllLessons(user.id);
            const data = res.data !== undefined ? res.data : res;
            const upcoming = data.filter(l => 
                l.student?.id === lesson.student?.id && 
                l.id !== lesson.id &&
                (l.status === 'SCHEDULED' || l.status === 'RESCHEDULED') &&
                new Date(`${l.lessonDate}T${l.startTime}`) > new Date()
            ).sort((a, b) => new Date(`${a.lessonDate}T${a.startTime}`) - new Date(`${b.lessonDate}T${b.startTime}`));
            setUpcomingLessons(upcoming);
        } catch (err) {}
        setOpenCompleteDialog(true);
    };

    const getTimeGradient = () => {
        const hour = currentTime.getHours();
        if (hour >= 5 && hour < 12) return 'linear-gradient(135deg, #FFB347 0%, #FF6B6B 100%)';
        if (hour >= 12 && hour < 17) return 'linear-gradient(135deg, #56B4E9 0%, #4A90E2 100%)';
        if (hour >= 17 && hour < 22) return 'linear-gradient(135deg, #F39C12 0%, #E67E22 100%)';
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
        <Box sx={{ ...sx, position: 'relative' }}>★</Box>
    );

    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(timer); }, []);
    useEffect(() => { if (user) { loadAllData(); fetchDebtors(); } }, [user, selectedDate]);

    const fetchDebtors = async () => {
        try {
            const [studentsRes, subscriptionsRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/subscriptions/tutor/${user.id}`)
            ]);
            const studentsData = studentsRes.data || [];
            const subscriptionsData = subscriptionsRes.data || [];
            const debtorsListData = studentsData.filter(student => {
                const activeSub = subscriptionsData.find(sub => sub.student?.id === student.id && sub.status === 'active' && sub.debtLessons > 0);
                return !!activeSub || (student.missedLessons > 0);
            }).map(student => {
                const activeSub = subscriptionsData.find(sub => sub.student?.id === student.id && sub.status === 'active');
                return { ...student, debtLessons: activeSub?.debtLessons || student.missedLessons || 0 };
            });
            setDebtorsList(debtorsListData);
        } catch (err) { console.error('Ошибка загрузки должников:', err); }
    };

    const loadAllData = async () => {
        setLoading(true);
        try { await Promise.all([fetchLessonsForDate(selectedDate), fetchPreviousLessons()]); }
        catch (err) { setError('Ошибка загрузки данных'); }
        finally { setLoading(false); }
    };

    const fetchLessonsForDate = async (date) => {
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const response = await getAllLessons(user.id);
            const lessonsData = response.data !== undefined ? response.data : response;
            const filtered = lessonsData.filter(lesson => {
                if (lesson.lessonDate !== dateStr) return false;
                if (lesson.status === 'RESCHEDULED' && !lesson.originalLesson) {
                    return !lessonsData.some(l => l.originalLesson?.id === lesson.id);
                }
                return true;
            });
            setTodayLessons(filtered.sort((a, b) => a.startTime.localeCompare(b.startTime)));
        } catch (err) {}
    };

    const fetchPreviousLessons = async () => {
        try {
            const response = await getAllLessons(user.id);
            const allLessons = response.data !== undefined ? response.data : response;
            const lessonsByStudentAndCourse = {};
            for (const lesson of allLessons) {
                const key = `${lesson.student.id}_${lesson.course?.id || 'no-course'}`;
                if (!lessonsByStudentAndCourse[key]) lessonsByStudentAndCourse[key] = [];
                lessonsByStudentAndCourse[key].push(lesson);
            }
            const map = {};
            for (const key in lessonsByStudentAndCourse) {
                const studentLessons = lessonsByStudentAndCourse[key].sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate));
                let lastPlan = null, lastPlanLesson = null, planTransferred = false;
                for (let i = 0; i < studentLessons.length; i++) {
                    if (studentLessons[i].nextLessonPlan) { lastPlan = studentLessons[i].nextLessonPlan; lastPlanLesson = studentLessons[i]; planTransferred = false; continue; }
                    if (lastPlan && lastPlanLesson && !planTransferred && studentLessons[i].status !== 'CANCELLED') {
                        map[studentLessons[i].id] = { ...lastPlanLesson, nextLessonPlan: lastPlan, courseName: lastPlanLesson.course?.name || 'Без предмета' };
                        planTransferred = true; lastPlan = null; lastPlanLesson = null;
                    }
                }
            }
            setPreviousLessonsMap(map);
        } catch (err) {}
    };

    const fetchLessonPlans = async () => {
        try { const r = await fetchLessonPlansAPI(); setLessonPlans(Array.isArray(r.data !== undefined ? r.data : r) ? (r.data !== undefined ? r.data : r) : []); }
        catch (err) { setLessonPlans([]); }
    };

    const fetchVariants = async () => {
        try { const r = await fetchVariantsAPI(); setVariants(Array.isArray(r.data !== undefined ? r.data : r) ? (r.data !== undefined ? r.data : r) : []); }
        catch (err) { setVariants([]); }
    };

    const handleRefresh = async () => { setRefreshing(true); await loadAllData(); await fetchDebtors(); setRefreshing(false); };

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
        if (type === 'plan') { setSelectedPlanId(id); setSelectedVariantId(''); }
        else { setSelectedVariantId(id); setSelectedPlanId(''); }
    };

    const handleCompleteLesson = async () => {
        if (!selectedLesson) return;
        try {
            await completeLesson(selectedLesson.id, lessonNotes, nextLessonPlan);
            if (newHomeworkForLesson.task) {
                const dueDate = newHomeworkForLesson.dueDate === 'custom' ? newHomeworkForLesson.customDueDate : newHomeworkForLesson.dueDate;
                await axiosInstance.post('/homework', {
                    tutorId: user.id,
                    studentId: selectedLesson.student?.id,
                    task: newHomeworkForLesson.task,
                    dueDate: dueDate ? dueDate + (dueDate.includes('T') ? '' : 'T23:59:59') : null,
                    status: 'ASSIGNED',
                    gradeType: newHomeworkForLesson.gradeType || 'GRADE_5',
                    courseId: selectedLesson.course?.id || null
                });
            }
            setOpenCompleteDialog(false); setSelectedLesson(null);
            setLessonNotes(''); setNextLessonPlan('');
            setNewHomeworkForLesson({ studentId: '', task: '', dueDate: '', gradeType: 'GRADE_5', customDueDate: '' });
            await loadAllData();
            showSnackbar(newHomeworkForLesson.task ? '✅ Урок завершён и ДЗ назначено!' : '✅ Занятие завершено!', 'success');
        } catch (err) { showSnackbar('Ошибка при завершении урока', 'error'); }
    };

    const handleOpenNotes = (lesson) => { setSelectedLesson(lesson); setLessonNotes(lesson.notes || ''); setNextLessonPlan(lesson.nextLessonPlan || ''); setOpenNotesDialog(true); };
    const handleSaveNotes = async () => {
        if (!selectedLesson) return;
        try { await addNotes(selectedLesson.id, lessonNotes, nextLessonPlan); await loadAllData(); setOpenNotesDialog(false); setSelectedLesson(null); showSnackbar('Заметки сохранены', 'success'); }
        catch (err) { showSnackbar('Ошибка при сохранении заметок', 'error'); }
    };
    const handleCancelClick = (lesson) => { setSelectedLesson(lesson); setCancelReason(''); setOpenCancelDialog(true); };
    const handleCancelConfirm = async () => {
        if (!selectedLesson) return;
        try { await cancelLesson(selectedLesson.id, cancelReason); setOpenCancelDialog(false); setSelectedLesson(null); setCancelReason(''); await loadAllData(); await fetchDebtors(); showSnackbar('❌ Занятие отменено', 'info'); }
        catch (err) { showSnackbar('Ошибка при отмене занятия', 'error'); }
    };
    const handleCancelReschedule = async (originalLesson) => {
        if (!window.confirm('Отменить перенос?')) return;
        try { await axiosInstance.post(`/lessons/${originalLesson.id}/cancel-reschedule`); showSnackbar('✅ Перенос отменён', 'success'); await loadAllData(); }
        catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };
    const handleRescheduleClick = (lesson) => { setLessonToReschedule(lesson); setSelectedDateForReschedule(new Date(lesson.lessonDate)); setSelectedTime(lesson.startTime.slice(0,5)); checkAvailableSlots(new Date(lesson.lessonDate), lesson); setOpenRescheduleDialog(true); };
    const checkAvailableSlots = async (date, currentLesson) => {
        try {
            const allLessonsForTutor = await getAllLessons(user.id);
            const lessonsData = allLessonsForTutor.data !== undefined ? allLessonsForTutor.data : allLessonsForTutor;
            const dateStr = date.toISOString().split('T')[0];
            const takenSlots = lessonsData.filter(l => l.lessonDate === dateStr && l.status !== 'CANCELLED' && l.id !== currentLesson.id).map(l => l.startTime.slice(0,5));
            const allSlots = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
            setAvailableSlots(allSlots.filter(s => !takenSlots.includes(s)));
            if (selectedTime && !allSlots.filter(s => !takenSlots.includes(s)).includes(selectedTime)) setSelectedTime('');
        } catch (err) { setAvailableSlots([]); }
    };
    const handleDateChange = (date) => { setSelectedDateForReschedule(date); if (lessonToReschedule) checkAvailableSlots(date, lessonToReschedule); };
    const handleRescheduleConfirm = async () => {
        if (!lessonToReschedule || !selectedTime) return;
        try {
            const timeFrom = selectedTime + ':00';
            const timeTo = (parseInt(selectedTime.split(':')[0]) + 1).toString().padStart(2, '0') + ':00';
            await rescheduleLesson(lessonToReschedule.id, selectedDateForReschedule.toISOString().split('T')[0], timeFrom, timeTo);
            setOpenRescheduleDialog(false); setLessonToReschedule(null); setSelectedTime(''); await loadAllData();
            showSnackbar('✅ Занятие успешно перенесено', 'success');
        } catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };
    const handleStartLesson = async (lesson) => {
        try { await axiosInstance.post(`/lessons/${lesson.id}/start`); showSnackbar('✅ Урок начат!', 'success'); await loadAllData(); }
        catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };
    const handleStudentNoShow = (lesson) => { setSelectedLesson(lesson); setCancelReason('Ученик не пришёл'); setOpenCancelDialog(true); };
    const handleReplaceClick = (lesson) => { setCancelledLesson(lesson); setSelectedDebtorId(''); setOpenReplaceDialog(true); };
    const handleConfirmReplace = async () => {
        if (!cancelledLesson || !selectedDebtorId) return;
        try { await replaceCancelledWithResurrect(cancelledLesson.id, parseInt(selectedDebtorId)); showSnackbar('✅ Урок заменён на отработку долга', 'success'); setOpenReplaceDialog(false); setCancelledLesson(null); await loadAllData(); await fetchDebtors(); }
        catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };

    const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
    const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
    const goToToday = () => setSelectedDate(new Date());
    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const getLessonColor = (lesson) => {
        if (lesson.status === 'CANCELLED') return 'error';
        if (lesson.status === 'CONFIRMED') return 'success';
        if (lesson.status === 'PAID') return 'warning';
        if (lesson.status === 'COMPLETED') return 'warning';
        if (lesson.status === 'IN_PROGRESS') return 'info';
        if (lesson.status === 'RESCHEDULED') return 'secondary';
        return 'info';
    };

    const getStatusText = (lesson) => {
        if (lesson.status === 'CANCELLED') return 'Отменено';
        if (lesson.status === 'CONFIRMED') return '✅ Подтверждено';
        if (lesson.status === 'PAID') return '⏳ Оплачено (ждёт проверки)';
        if (lesson.status === 'COMPLETED') return 'Проведено (ждёт оплаты)';
        if (lesson.status === 'IN_PROGRESS') return 'В процессе';
        if (lesson.status === 'RESCHEDULED') return 'Перенесено';
        return 'Запланировано';
    };

    const isToday = isSameDay(selectedDate, new Date());
    const isPast = selectedDate < new Date() && !isToday;
    const decorations = getDecorations();

    const LessonCard = ({ lesson }) => {
        const startTime = formatLessonTime(lesson.lessonDate, lesson.startTime);
        const endTime = formatLessonTime(lesson.lessonDate, lesson.endTime);
        const courseName = lesson.course?.name || 'Занятие';
        const studentName = lesson.student?.fullName || 'Ученик';
        const studentRate = getStudentRateForTutor(lesson.student, lesson.tutor?.id);
        const isRescheduledNew = !!lesson.originalLesson && lesson.status === 'RESCHEDULED';
        const isRescheduledOriginal = lesson.status === 'RESCHEDULED' && !lesson.originalLesson;
        const isScheduled = lesson.status === 'SCHEDULED';
        const isInProgress = lesson.status === 'IN_PROGRESS';
        const isCompleted = lesson.status === 'COMPLETED';
        const isPaid = lesson.status === 'PAID';
        const isCancelled = lesson.status === 'CANCELLED';
        const isOriginalRescheduled = lesson.status === 'RESCHEDULED' && todayLessons.some(l => l.originalLesson?.id === lesson.id);
        const rescheduledTarget = isRescheduledOriginal ? todayLessons.find(l => l.originalLesson?.id === lesson.id) : null;
        
        return (
            <Card sx={{ mb: 2, borderLeft: 6, borderColor: `${getLessonColor(lesson)}.main`, bgcolor: isScheduled ? '#fff3e0' : isInProgress ? '#e3f2fd' : isCompleted ? '#fff8e1' : 'white', transition: 'transform 0.2s', '&:hover': { transform: 'translateX(4px)' } }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                                <Typography variant="h6" sx={{ minWidth: 100 }}>{startTime} - {endTime}</Typography>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{studentName}</Typography>
                                <Chip label={courseName} size="small" variant="outlined" color="primary" />
                                <Chip label={getStatusText(lesson)} color={getLessonColor(lesson)} size="small" />
                                {studentRate && <Chip label={`${studentRate} ₽`} size="small" color="success" variant="outlined" />}
                            </Box>
                            {isRescheduledOriginal && rescheduledTarget && (
                                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">🔄 ПЕРЕНЕСЕНО:</Typography>
                                    <Typography variant="body2">Занятие перенесено на {formatLessonDate(rescheduledTarget.lessonDate)} в {formatLessonTime(rescheduledTarget.lessonDate, rescheduledTarget.startTime)}</Typography>
                                </Paper>
                            )}
                            {previousLessonsMap[lesson.id]?.nextLessonPlan && (
                                <Paper sx={{ p: 2, bgcolor: '#fff8e1', mb: 2, borderLeft: 4, borderColor: 'warning.main' }}>
                                    <Typography variant="body2" color="textSecondary">📋 ЧТО БЫЛО ЗАДАНО К ЭТОМУ УРОКУ:</Typography>
                                    <Typography variant="body1">{previousLessonsMap[lesson.id].nextLessonPlan}</Typography>
                                </Paper>
                            )}
                            {lesson.notes && (
                                <Paper sx={{ p: 2, bgcolor: '#f5f5f5', mb: 2 }}>
                                    <Typography variant="body2" color="textSecondary">📝 ЧТО ДЕЛАЛИ НА УРОКЕ:</Typography>
                                    <Typography variant="body1">{lesson.notes}</Typography>
                                </Paper>
                            )}
                            {lesson.nextLessonPlan && (
                                <Paper sx={{ p: 2, bgcolor: '#e3f2fd', borderLeft: 4, borderColor: 'primary.main' }}>
                                    <Typography variant="body2" color="textSecondary">🎯 ЧТО СДЕЛАТЬ К СЛЕДУЮЩЕМУ УРОКУ:</Typography>
                                    <Typography variant="body1">{lesson.nextLessonPlan}</Typography>
                                </Paper>
                            )}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, ml: 2, flexDirection: 'column' }}>
                            {isOriginalRescheduled ? (
                                <>
                                    {rescheduledTarget && <Paper sx={{ p: 1, bgcolor: '#FFF3E0' }}><Typography variant="caption">Перенесено на {formatLessonDate(rescheduledTarget.lessonDate)} в {formatLessonTime(rescheduledTarget.lessonDate, rescheduledTarget.startTime)}</Typography></Paper>}
                                    <Button size="small" variant="outlined" color="secondary" onClick={() => handleCancelReschedule(lesson)}><strong>Отменить перенос</strong></Button>
                                </>
                            ) : isCancelled ? (
                                <Button size="small" variant="outlined" color="success" startIcon={<WorkIcon />} onClick={() => handleReplaceClick(lesson)}>🔄 Отработать долг</Button>
                            ) : (
                                <>
                                    {(isScheduled || isInProgress || isRescheduledNew || lesson.status === 'RESCHEDULED') && (
                                        <Button size="small" variant="contained" color="primary" startIcon={<VideocamIcon />}
                                            onClick={async () => { if (isScheduled || lesson.status === 'RESCHEDULED') await handleStartLesson(lesson); setSelectedLessonForRoom(lesson); setLessonRoomOpen(true); }} sx={{ mb: 0.5 }}>Начать урок</Button>
                                    )}
                                    {isInProgress && (<>
                                        <Button size="small" variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => handleOpenComplete(lesson)}>Завершить урок</Button>
                                        <Button size="small" variant="outlined" color="warning" startIcon={<CancelIcon />} onClick={() => handleStudentNoShow(lesson)}>Ученик не пришёл</Button>
                                    </>)}
                                    {(isScheduled || lesson.status === 'RESCHEDULED') && (<>
                                        <Button size="small" variant="outlined" color="warning" startIcon={<EventIcon />} onClick={() => handleRescheduleClick(lesson)}>Перенести</Button>
                                        <Button size="small" variant="outlined" color="error" startIcon={<CancelIcon />} onClick={() => handleCancelClick(lesson)}>Отмена</Button>
                                    </>)}
                                    {(isCompleted || isPaid) && <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => handleOpenNotes(lesson)}>Заметки</Button>}
                                </>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        );
    };

    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>;
    if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ p: 3 }}>
                <Paper sx={{ position: 'relative', mb: 4, borderRadius: 4, background: getTimeGradient(), minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: { xs: 3, md: 4 }, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
                    {decorations.floatingElements.map((el, i) => (
                        <Box key={i} sx={{ position: 'absolute', top: el.top, left: el.left, fontSize: el.size, color: 'rgba(255,255,255,0.3)', animation: `float ${el.duration} infinite ease-in-out`, animationDelay: el.delay, pointerEvents: 'none', '@keyframes float': { '0%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-15px)' }, '100%': { transform: 'translateY(0px)' } } }}>{el.icon}</Box>
                    ))}
                    <Box sx={{ position: 'absolute', right: 30, bottom: 20, opacity: 0.25 }}>{decorations.mainIcon}</Box>
                    <Box sx={{ position: 'relative', zIndex: 2, color: 'white' }}>
                        <Typography variant="h2" sx={{ fontWeight: 'bold', fontSize: { xs: '2rem', md: '3.5rem' }, textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>{format(currentTime, 'HH:mm')}</Typography>
                        <Typography variant="h6" sx={{ mt: 1, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{format(currentTime, 'EEEE, d MMMM yyyy', { locale: ru })}</Typography>
                        <Typography variant="body1" sx={{ mt: 1.5, opacity: 0.95, textShadow: '1px 1px 2px rgba(0,0,0,0.3)' }}>{getGreeting()}, {user?.fullName?.split(' ')[0]}! 👋</Typography>
                    </Box>
                    <Box sx={{ position: 'relative', zIndex: 2 }}>
                        <Button variant="contained" startIcon={<RefreshIcon />} onClick={handleRefresh} disabled={refreshing} sx={{ bgcolor: 'rgba(255,255,255,0.9)', color: '#333' }}>{refreshing ? 'Обновление...' : 'Обновить'}</Button>
                    </Box>
                </Paper>

                <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="h5" sx={{ fontWeight: 500 }}>📅 Расписание на {format(selectedDate, 'd MMMM yyyy', { locale: ru })}</Typography>
                            {isPast && <Chip label="Прошедший день" size="small" color="warning" variant="outlined" />}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Button size="small" variant="outlined" onClick={goToPreviousDay} startIcon={<ArrowBackIcon />}>Предыдущий</Button>
                            <Button size="small" variant={isToday ? "contained" : "outlined"} onClick={goToToday} startIcon={<CalendarTodayIcon />}>Сегодня</Button>
                            <Button size="small" variant="outlined" onClick={goToNextDay} endIcon={<ArrowForwardIcon />}>Следующий</Button>
                        </Box>
                    </Box>
                    {todayLessons.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}><Typography variant="h6" color="textSecondary">На {format(selectedDate, 'd MMMM yyyy', { locale: ru })} занятий нет</Typography></Box>
                    ) : (
                        <Box>{todayLessons.map(lesson => <LessonCard key={lesson.id} lesson={lesson} />)}</Box>
                    )}
                </Paper>

                {/* ========== ДИАЛОГ ЗАВЕРШЕНИЯ УРОКА ========== */}
                <Dialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle>Завершение урока</DialogTitle>
                    <DialogContent>
                        <Box sx={{ pt: 2 }}>
                            <Typography variant="subtitle1" gutterBottom>
                                {selectedLesson?.student?.fullName} | {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)} - {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.endTime)}
                            </Typography>
                            
                            <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                                <InputLabel>📋 Применить (опционально)</InputLabel>
                                <Select value={applyType === 'plan' ? `plan_${selectedPlanId}` : (applyType === 'variant' ? `variant_${selectedVariantId}` : '')}
                                    onChange={(e) => { const val = e.target.value; if (!val) { setApplyType('none'); setSelectedPlanId(''); setSelectedVariantId(''); return; } const [type, id] = val.split('_'); handleApplyItem(type, id); }} label="📋 Применить (опционально)">
                                    <MenuItem value="">— Не применять —</MenuItem><Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600 }}>📖 Планы уроков</MenuItem>
                                    {lessonPlans.map(plan => <MenuItem key={`plan_${plan.id}`} value={`plan_${plan.id}`}><Box><Typography variant="body2">{plan.title}</Typography><Typography variant="caption">{plan.topic}</Typography></Box></MenuItem>)}<Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600 }}>🔗 Варианты</MenuItem>
                                    {variants.map(v => <MenuItem key={`variant_${v.id}`} value={`variant_${v.id}`}><Box><Typography variant="body2">{v.title}</Typography><Typography variant="caption">{v.subject} • {v.examType}</Typography></Box></MenuItem>)}
                                </Select>
                            </FormControl>
                            
                            <TextField fullWidth label="📝 Что делали на уроке" multiline rows={4} value={lessonNotes} onChange={(e) => setLessonNotes(e.target.value)} margin="normal" />
                            <TextField fullWidth label="🎯 Что сделать на следующем уроке" multiline rows={3} value={nextLessonPlan} onChange={(e) => setNextLessonPlan(e.target.value)} margin="normal" />

                            <Divider sx={{ my: 3 }} />
                            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>📋 Назначить домашнее задание (опционально)</Typography>
                            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                                <TextField fullWidth label="Текст задания" multiline rows={3} value={newHomeworkForLesson.task}
                                    onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, task: e.target.value })} />
                                <Button variant="outlined" onClick={() => { setOpenBankPicker(true); loadBankItems(); }} sx={{ minWidth: 140, whiteSpace: 'nowrap' }}>📋 Из банка</Button>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth><InputLabel>Срок сдачи</InputLabel>
                                        <Select value={newHomeworkForLesson.dueDate || ''} onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, dueDate: e.target.value })} label="Срок сдачи">
                                            <MenuItem value="">Выбрать дату</MenuItem><MenuItem value="custom">📅 Своя дата</MenuItem><Divider />
                                            <MenuItem disabled sx={{ fontWeight: 600 }}>📅 Следующие уроки:</MenuItem>
                                            {upcomingLessons.map(l => <MenuItem key={l.id} value={l.lessonDate + 'T23:59:59'}>{format(new Date(l.lessonDate), 'd MMM', { locale: ru })} {formatLessonTime(l.lessonDate, l.startTime)}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    {newHomeworkForLesson.dueDate === 'custom' && <TextField fullWidth type="date" label="Своя дата" value={newHomeworkForLesson.customDueDate || ''} onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, customDueDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ mt: 2 }} />}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth><InputLabel>Шкала</InputLabel>
                                        <Select value={newHomeworkForLesson.gradeType || 'GRADE_5'} onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, gradeType: e.target.value })} label="Шкала">
                                            <MenuItem value="GRADE_5">5-балльная ⭐</MenuItem><MenuItem value="GRADE_10">10-балльная</MenuItem><MenuItem value="GRADE_100">100-балльная</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenCompleteDialog(false)}>Отмена</Button>
                        <Button onClick={handleCompleteLesson} variant="contained" color="success" startIcon={<CheckIcon />}>Завершить урок</Button>
                    </DialogActions>
                </Dialog>

                {/* ========== МОДАЛКА БАНКА ЗАДАНИЙ ========== */}
                <Dialog open={openBankPicker} onClose={() => setOpenBankPicker(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Выбрать из банка</DialogTitle>
                    <DialogContent>
                        <Tabs value={bankTab} onChange={(e, v) => setBankTab(v)} sx={{ mb: 2 }}><Tab label="Задания" /><Tab label="Варианты" /></Tabs>
                        {bankLoading ? <CircularProgress /> : (
                            <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
                                {(bankTab === 0 ? bankTasks : variants).map(item => (
                                    <Paper key={item.id} sx={{ p: 1.5, mb: 1, bgcolor: '#F9FAFB', cursor: 'pointer', borderRadius: 2, '&:hover': { bgcolor: '#EEF2FF' } }}
                                        onClick={() => { setNewHomeworkForLesson({ ...newHomeworkForLesson, task: item.question || item.topic || item.url || item.title }); setOpenBankPicker(false); }}>
                                        <Typography variant="body2" sx={{ fontWeight: 500 }}>{item.question || item.topic || item.title}</Typography>
                                        <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                                            {item.subject && <Chip label={item.subject} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                                            {item.examType && <Chip label={item.examType} size="small" sx={{ height: 18, fontSize: '0.6rem' }} />}
                                        </Box>
                                    </Paper>
                                ))}
                            </Box>
                        )}
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenBankPicker(false)}>Отмена</Button></DialogActions>
                </Dialog>

                <Dialog open={openNotesDialog} onClose={() => setOpenNotesDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Редактировать заметки</DialogTitle>
                    <DialogContent>
                        <TextField fullWidth label="📝 Что делали на уроке" multiline rows={4} value={lessonNotes} onChange={(e) => setLessonNotes(e.target.value)} margin="normal" />
                        <TextField fullWidth label="🎯 Что сделать на следующем уроке" multiline rows={3} value={nextLessonPlan} onChange={(e) => setNextLessonPlan(e.target.value)} margin="normal" />
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenNotesDialog(false)}>Отмена</Button><Button onClick={handleSaveNotes} variant="contained" startIcon={<SaveIcon />}>Сохранить</Button></DialogActions>
                </Dialog>

                <Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
                    <DialogTitle>{cancelReason === 'Ученик не пришёл' ? 'Ученик не пришёл' : 'Отмена занятия'}</DialogTitle>
                    <DialogContent>
                        <TextField autoFocus margin="dense" label={cancelReason === 'Ученик не пришёл' ? 'Примечание' : 'Причина отмены'} fullWidth multiline rows={3} value={cancelReason === 'Ученик не пришёл' ? '' : cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenCancelDialog(false)}>Назад</Button><Button onClick={handleCancelConfirm} color="error" variant="contained">{cancelReason === 'Ученик не пришёл' ? 'Подтвердить' : 'Отменить'}</Button></DialogActions>
                </Dialog>

                <Dialog open={openRescheduleDialog} onClose={() => setOpenRescheduleDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Перенос занятия</DialogTitle>
                    <DialogContent>
                        <DatePicker label="Дата" value={selectedDateForReschedule} onChange={handleDateChange} minDate={new Date()} slotProps={{ textField: { fullWidth: true, margin: 'normal' } }} />
                        {availableSlots.length > 0 ? (
                            <FormControl fullWidth sx={{ mt: 2 }}><InputLabel>Время</InputLabel>
                                <Select value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} label="Время">
                                    {availableSlots.map(s => <MenuItem key={s} value={s}>{s} — {parseInt(s.split(':')[0]) + 1}:00</MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : <Alert severity="info" sx={{ mt: 2 }}>Нет свободных слотов</Alert>}
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenRescheduleDialog(false)}>Отмена</Button><Button onClick={handleRescheduleConfirm} variant="contained" disabled={!selectedTime}>Перенести</Button></DialogActions>
                </Dialog>

                <Dialog open={openReplaceDialog} onClose={() => setOpenReplaceDialog(false)} maxWidth="sm" fullWidth>
                    <DialogTitle>Отработка долга</DialogTitle>
                    <DialogContent>
                        {debtorsList.length > 0 ? (
                            <FormControl fullWidth sx={{ mt: 2 }}><InputLabel>Выберите должника</InputLabel>
                                <Select value={selectedDebtorId} onChange={(e) => setSelectedDebtorId(e.target.value)} label="Должник">
                                    {debtorsList.map(s => <MenuItem key={s.id} value={s.id}><Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}><Typography>{s.fullName}</Typography><Chip label={`Долг: ${s.debtLessons || s.missedLessons || 0}`} size="small" color="warning" /></Box></MenuItem>)}
                                </Select>
                            </FormControl>
                        ) : <Alert severity="info" sx={{ mt: 2 }}>Нет учеников с долгами</Alert>}
                    </DialogContent>
                    <DialogActions><Button onClick={() => setOpenReplaceDialog(false)}>Отмена</Button><Button onClick={handleConfirmReplace} variant="contained" disabled={!selectedDebtorId}>Заменить</Button></DialogActions>
                </Dialog>

                <LessonRoom open={lessonRoomOpen} onClose={() => { setLessonRoomOpen(false); setSelectedLessonForRoom(null); }} lessonId={selectedLessonForRoom?.id}
                    lessonInfo={selectedLessonForRoom ? { studentName: selectedLessonForRoom.student?.fullName, tutorName: selectedLessonForRoom.tutor?.fullName, startTime: formatLessonTime(selectedLessonForRoom.lessonDate, selectedLessonForRoom.startTime), endTime: formatLessonTime(selectedLessonForRoom.lessonDate, selectedLessonForRoom.endTime) } : null} />

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
}

export default Dashboard;