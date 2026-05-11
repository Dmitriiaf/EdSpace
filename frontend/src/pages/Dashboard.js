// ========== frontend/src/pages/Dashboard.js (ФИНАЛ — БЕЗ ДОЛЖНИКОВ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Grid, Card, CardContent, Typography,
    Paper, CircularProgress, Alert, Button,
    Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Chip, Snackbar,
    FormControl, InputLabel, Select, MenuItem, Divider, Tabs, Tab,
    IconButton
} from '@mui/material';
import { PageContainer, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon } from '../styles/shared';
import { styled } from '@mui/material/styles';
import { formatLessonTime, formatLessonDate, utcToLocalTime, getLocalHoursMinutes } from '../utils/timezone';
import {
    Refresh as RefreshIcon,
    Edit as EditIcon,
    Save as SaveIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Event as EventIcon,
    CalendarToday as CalendarTodayIcon,
    Videocam as VideocamIcon,
    Work as WorkIcon,
    AccessTime as AccessTimeIcon
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
    getLessonsByDate,
    getAllLessons,
    completeLesson,
    cancelLesson,
    rescheduleLesson,
    addNotes,
    getLessonPlans as fetchLessonPlansAPI,
    getVariants as fetchVariantsAPI,
    replaceCancelledWithResurrect
} from '../services/api';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========



const HeaderPaper = styled(Paper)({
    marginBottom: '24px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #F3F4F6',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    padding: '24px',
});


const LessonCard = styled(Card)({
    marginBottom: '12px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    border: '1px solid #F3F4F6',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
    },
});

const TimeDivider = styled(Box)({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '20px 0 12px',
    '&::after': {
        content: '""',
        flex: 1,
        height: '1px',
        backgroundColor: '#E5E7EB',
    },
});



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

    useEffect(() => { const timer = setInterval(() => setCurrentTime(new Date()), 60000); return () => clearInterval(timer); }, []);
    useEffect(() => { if (user) { loadAllData(); } }, [user, selectedDate]);

    const fetchDebtors = async () => {
        try {
            const [studentsRes, subscriptionsRes] = await Promise.all([
                axiosInstance.get(`/students/tutor/${user.id}`),
                axiosInstance.get(`/subscriptions/tutor/${user.id}`)
            ]);
            const studentsData = studentsRes.data || [];
            const subscriptionsData = subscriptionsRes.data || [];
            const debtorsListData = studentsData.filter(student => {
                const activeSub = subscriptionsData.find(sub => sub.student?.id === student.id && (sub.status === 'ACTIVE' || sub.status === 'active') && sub.debtLessons > 0);
                return !!activeSub || (student.missedLessons > 0);
            }).map(student => {
                const activeSub = subscriptionsData.find(sub => sub.student?.id === student.id && (sub.status === 'ACTIVE' || sub.status === 'active'));
                return { ...student, debtLessons: activeSub?.debtLessons || student.missedLessons || 0 };
            });
            setDebtorsList(debtorsListData);
        } catch (err) { console.error('Ошибка загрузки должников:', err); }
    };

    const loadAllData = async () => {
        setLoading(true);
        try {
            const dateStr = format(selectedDate, 'yyyy-MM-dd');
            
            // ОДИН лёгкий запрос вместо двух тяжёлых
            const lessonsRes = await getLessonsByDate(user.id, dateStr);
            const todayLessonsData = lessonsRes.data || [];
            setTodayLessons(todayLessonsData.sort((a, b) => a.startTime.localeCompare(b.startTime)));
            
            // previousLessonsMap тоже строим из этих данных (или отдельным лёгким запросом)
            fetchPreviousLessons().catch(() => {});
            fetchDebtors().catch(() => {});
            
            setError(null);
        } catch (err) {
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
            const today = new Date();
            const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
            const todayStr = format(today, 'yyyy-MM-dd');
            const response = await axiosInstance.get(
                `/lessons/tutor/${user.id}/range?start=${thirtyDaysAgo}&end=${todayStr}`
            );
            const allLessons = response.data || [];
            
            const lessonsByStudentAndCourse = {};
            for (const lesson of allLessons) {
                const key = `${lesson.student.id}_${lesson.course?.id || 'no-course'}`;
                if (!lessonsByStudentAndCourse[key]) lessonsByStudentAndCourse[key] = [];
                lessonsByStudentAndCourse[key].push(lesson);
            }
            const map = {};
            for (const key in lessonsByStudentAndCourse) {
                const studentLessons = lessonsByStudentAndCourse[key]
                    .sort((a, b) => new Date(a.lessonDate) - new Date(b.lessonDate));
                let lastPlan = null, lastPlanLesson = null, planTransferred = false;
                for (let i = 0; i < studentLessons.length; i++) {
                    if (studentLessons[i].nextLessonPlan) { 
                        lastPlan = studentLessons[i].nextLessonPlan; 
                        lastPlanLesson = studentLessons[i]; 
                        planTransferred = false; 
                        continue; 
                    }
                    if (lastPlan && lastPlanLesson && !planTransferred && studentLessons[i].status !== 'CANCELLED') {
                        map[studentLessons[i].id] = { 
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
            setPreviousLessonsMap(map);
        } catch (err) {
            console.warn('Ошибка загрузки предыдущих уроков:', err);
        }
    };

    const fetchLessonPlans = async () => {
        try { const r = await fetchLessonPlansAPI(); setLessonPlans(Array.isArray(r.data !== undefined ? r.data : r) ? (r.data !== undefined ? r.data : r) : []); }
        catch (err) { setLessonPlans([]); }
    };

    const fetchVariants = async () => {
        try { const r = await fetchVariantsAPI(); setVariants(Array.isArray(r.data !== undefined ? r.data : r) ? (r.data !== undefined ? r.data : r) : []); }
        catch (err) { setVariants([]); }
    };

    const handleRefresh = async () => { setRefreshing(true); await loadAllData(); setRefreshing(false); };

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
    const handleManualPayment = async (lesson) => {
        if (!window.confirm('Подтвердить оплату вручную?')) return;
        try {
            await axiosInstance.patch(`/lessons/${lesson.id}/status`, { status: 'PAID' });
            showSnackbar('✅ Оплата подтверждена', 'success');
            await loadAllData();
        } catch (err) {
            showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };
    const handleSaveNotes = async () => {
        if (!selectedLesson) return;
        try { await addNotes(selectedLesson.id, lessonNotes, nextLessonPlan); await loadAllData(); setOpenNotesDialog(false); setSelectedLesson(null); showSnackbar('Заметки сохранены', 'success'); }
        catch (err) { showSnackbar('Ошибка при сохранении заметок', 'error'); }
    };
    const handleCancelClick = (lesson) => { setSelectedLesson(lesson); setCancelReason(''); setOpenCancelDialog(true); };
    const handleCancelConfirm = async () => {
        if (!selectedLesson) return;
        try { await cancelLesson(selectedLesson.id, cancelReason); setOpenCancelDialog(false); setSelectedLesson(null); setCancelReason(''); await loadAllData(); showSnackbar('❌ Занятие отменено', 'info'); }
        catch (err) { showSnackbar('Ошибка при отмене занятия', 'error'); }
    };
    const handleRescheduleClick = (lesson) => { setLessonToReschedule(lesson); setSelectedDateForReschedule(new Date(lesson.lessonDate)); setSelectedTime(lesson.startTime.slice(0,5)); checkAvailableSlots(new Date(lesson.lessonDate), lesson); setOpenRescheduleDialog(true); };
    const checkAvailableSlots = async (date, currentLesson) => {
        try {
            const allLessonsForTutor = await getAllLessons(user.id);
            const lessonsData = allLessonsForTutor.data !== undefined ? allLessonsForTutor.data : allLessonsForTutor;
            const dateStr = date.toISOString().split('T')[0];
            const dayLessons = lessonsData.filter(l => l.lessonDate === dateStr && l.status !== 'CANCELLED' && l.id !== currentLesson.id);
            const occupiedLocalTimes = dayLessons.map(l => {
                const local = getLocalHoursMinutes(l.lessonDate, l.startTime);
                return String(local.hours).padStart(2, '0') + ':' + String(local.minutes).padStart(2, '0');
            });
            const allSlots = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];
            const freeSlots = allSlots.filter(slot => !occupiedLocalTimes.includes(slot));
            setAvailableSlots(freeSlots);
            if (selectedTime && !freeSlots.includes(selectedTime)) setSelectedTime('');
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
        try { await replaceCancelledWithResurrect(cancelledLesson.id, parseInt(selectedDebtorId)); showSnackbar('✅ Урок заменён на отработку долга', 'success'); setOpenReplaceDialog(false); setCancelledLesson(null); await loadAllData(); }
        catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };

    const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
    const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
    const goToToday = () => setSelectedDate(new Date());
    const showSnackbar = (message, severity) => setSnackbar({ open: true, message, severity });

    const getStatusConfig = (status) => {
        const configs = {
            'SCHEDULED': { bg: '#EFF6FF', color: '#1E40AF', dot: '#3B82F6', label: 'Запланировано' },
            'IN_PROGRESS': { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', label: 'В процессе' },
            'COMPLETED': { bg: '#FFFBEB', color: '#92400E', dot: '#F59E0B', label: 'Проведено' },
            'PAID': { bg: '#ECFDF5', color: '#065F46', dot: '#10B981', label: 'Оплачено' },
            'CANCELLED': { bg: '#FEF2F2', color: '#991B1B', dot: '#EF4444', label: 'Отменено' },
            'RESCHEDULED': { bg: '#F5F3FF', color: '#5B21B6', dot: '#8B5CF6', label: 'Перенесено' },
        };
        return configs[status] || { bg: '#F3F4F6', color: '#374151', dot: '#9CA3AF', label: status };
    };

    const getTimeOfDay = (lesson) => {
        if (!lesson) return '';
        const { hours } = getLocalHoursMinutes(lesson.lessonDate, lesson.startTime);
        if (hours >= 5 && hours < 12) return 'Утро';
        if (hours >= 12 && hours < 17) return 'День';
        if (hours >= 17 && hours < 23) return 'Вечер';
        return 'Ночь';
    };

    const renderLessonCard = (lesson) => {
        const startTime = formatLessonTime(lesson.lessonDate, lesson.startTime);
        const endTime = formatLessonTime(lesson.lessonDate, lesson.endTime);
        const courseName = lesson.course?.name || 'Занятие';
        const studentName = lesson.student?.fullName || 'Ученик';
        const studentRate = getStudentRateForTutor(lesson.student, lesson.tutor?.id);
        const statusConfig = getStatusConfig(lesson.status);
        const isScheduled = lesson.status === 'SCHEDULED' || lesson.status === 'RESCHEDULED';
        const isInProgress = lesson.status === 'IN_PROGRESS';
        const isCompleted = lesson.status === 'COMPLETED' || lesson.status === 'PAID';
        const isCancelled = lesson.status === 'CANCELLED';
        
        return (
            <LessonCard key={lesson.id}>
                <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                        <Box sx={{ 
                            width: 4, minHeight: 70, borderRadius: 2,
                            bgcolor: statusConfig.dot, flexShrink: 0, mt: 0.5
                        }} />
                        
                        <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                    <Typography sx={{ fontWeight: 600, color: '#1F2937', fontSize: '16px' }}>
                                        {startTime} – {endTime}
                                    </Typography>
                                    {isInProgress && (
                                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#10B981', animation: 'pulse 2s infinite' }} />
                                    )}
                                </Box>
                                <Chip 
                                    label={statusConfig.label} size="small"
                                    sx={{ 
                                        bgcolor: statusConfig.bg, color: statusConfig.color,
                                        fontWeight: 500, fontSize: '11px', height: 24,
                                        borderRadius: '100px', '& .MuiChip-label': { px: 1.5 }
                                    }}
                                />
                            </Box>
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                <Box sx={{ 
                                    width: 36, height: 36, borderRadius: '50%', 
                                    bgcolor: lesson.course?.color || '#4F46E5',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    color: '#fff', fontSize: 14, fontWeight: 600, flexShrink: 0
                                }}>
                                    {studentName.charAt(0)}
                                </Box>
                                <Box>
                                    <Typography sx={{ fontWeight: 500, color: '#1F2937', fontSize: '15px' }}>
                                        {studentName}
                                    </Typography>
                                    <Typography sx={{ color: '#6B7280', fontSize: '13px' }}>
                                        {courseName}
                                    </Typography>
                                </Box>
                                {studentRate && (
                                    <Typography sx={{ ml: 'auto', fontWeight: 600, color: '#10B981', fontSize: '16px' }}>
                                        {studentRate} ₽
                                    </Typography>
                                )}
                            </Box>

                            {/* Заметки урока */}
                            {lesson.notes && (
                                <Paper sx={{ p: 1.5, bgcolor: '#F9FAFB', borderRadius: '8px', mb: 1 }}>
                                    <Typography sx={{ color: '#9CA3AF', fontWeight: 500, display: 'block', mb: 0.5, fontSize: '11px', textTransform: 'uppercase' }}>
                                        Что делали
                                    </Typography>
                                    <Typography sx={{ color: '#374151', fontSize: '14px' }}>
                                        {lesson.notes.length > 80 ? lesson.notes.substring(0, 80) + '...' : lesson.notes}
                                    </Typography>
                                </Paper>
                            )}
                            
                            {lesson.nextLessonPlan && (
                                <Paper sx={{ p: 1.5, bgcolor: '#EEF2FF', borderRadius: '8px', mb: 1 }}>
                                    <Typography sx={{ color: '#9CA3AF', fontWeight: 500, display: 'block', mb: 0.5, fontSize: '11px', textTransform: 'uppercase' }}>
                                        К следующему уроку
                                    </Typography>
                                    <Typography sx={{ color: '#374151', fontSize: '14px' }}>
                                        {lesson.nextLessonPlan.length > 80 ? lesson.nextLessonPlan.substring(0, 80) + '...' : lesson.nextLessonPlan}
                                    </Typography>
                                </Paper>
                            )}

                            {/* Заметки с прошлого урока */}
                            {!lesson.notes && !lesson.nextLessonPlan && previousLessonsMap[lesson.id] && (
                                <Paper sx={{ p: 1.5, bgcolor: '#FEF3C7', borderRadius: '8px', mb: 1, border: '1px solid #FDE68A' }}>
                                    <Typography sx={{ color: '#92400E', fontWeight: 500, display: 'block', mb: 0.5, fontSize: '11px', textTransform: 'uppercase' }}>
                                        📋 С прошлого урока ({previousLessonsMap[lesson.id].courseName})
                                    </Typography>
                                    <Typography sx={{ color: '#78350F', fontSize: '13px', fontStyle: 'italic' }}>
                                        {previousLessonsMap[lesson.id].nextLessonPlan?.length > 100 
                                            ? previousLessonsMap[lesson.id].nextLessonPlan.substring(0, 100) + '...' 
                                            : previousLessonsMap[lesson.id].nextLessonPlan}
                                    </Typography>
                                </Paper>
                            )}
                        </Box>
                        
                        {/* Кнопки действий */}
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, flexShrink: 0 }}>
                            {isScheduled && (
                                <>
                                    <StyledButton variant="contained" startIcon={<VideocamIcon sx={{ fontSize: 16 }} />}
                                        onClick={async () => { await handleStartLesson(lesson); setSelectedLessonForRoom(lesson); setLessonRoomOpen(true); }}
                                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' }, color: '#fff' }}>
                                        Начать
                                    </StyledButton>
                                    <StyledButton variant="outlined" startIcon={<EventIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => handleRescheduleClick(lesson)}
                                        sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}>
                                        Перенести
                                    </StyledButton>
                                    <StyledButton variant="outlined" color="error" startIcon={<CancelIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => handleCancelClick(lesson)}
                                        sx={{ borderColor: '#FECACA', color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' } }}>
                                        Отмена
                                    </StyledButton>
                                </>
                            )}
                            {isInProgress && (
                                <>
                                    <StyledButton variant="contained" color="success" startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => handleOpenComplete(lesson)}
                                        sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>
                                        Завершить
                                    </StyledButton>
                                    <StyledButton variant="outlined" color="warning"
                                        onClick={() => handleStudentNoShow(lesson)}
                                        sx={{ borderColor: '#FDE68A', color: '#D97706', '&:hover': { bgcolor: '#FFFBEB' } }}>
                                        Не пришёл
                                    </StyledButton>
                                </>
                            )}
                            {isCompleted && (
                                <>
                                    <StyledButton variant="outlined" startIcon={<EditIcon sx={{ fontSize: 16 }} />}
                                        onClick={() => handleOpenNotes(lesson)}
                                        sx={{ color: '#374151', borderColor: '#D1D5DB', '&:hover': { bgcolor: '#F9FAFB' } }}>
                                        Заметки
                                    </StyledButton>
                                    {lesson.status !== 'PAID' && (
                                        <StyledButton variant="outlined" color="success" startIcon={<CheckIcon sx={{ fontSize: 16 }} />}
                                            onClick={() => handleManualPayment(lesson)}
                                            sx={{ borderColor: '#A7F3D0', color: '#059669', '&:hover': { bgcolor: '#ECFDF5' } }}>
                                            Оплатить
                                        </StyledButton>
                                    )}
                                </>
                            )}
                            {isCancelled && (
                                <StyledButton variant="outlined" color="success" startIcon={<WorkIcon sx={{ fontSize: 16 }} />}
                                    onClick={() => handleReplaceClick(lesson)}
                                    sx={{ borderColor: '#A7F3D0', color: '#059669', '&:hover': { bgcolor: '#ECFDF5' } }}>
                                    Отработать
                                </StyledButton>
                            )}
                        </Box>
                    </Box>
                </CardContent>
            </LessonCard>
        );
    };

    if (loading) return (
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <CircularProgress sx={{ color: '#4F46E5' }} />
            </Box>
        </PageContainer>
    );
    
    if (error) return (
        <PageContainer>
            <Alert severity="error" sx={{ borderRadius: '12px' }}>{error}</Alert>
        </PageContainer>
    );
    
    const isToday = isSameDay(selectedDate, new Date());

    const timeGroups = {};
    todayLessons.forEach(lesson => {
        const timeOfDay = getTimeOfDay(lesson);
        if (!timeGroups[timeOfDay]) timeGroups[timeOfDay] = [];
        timeGroups[timeOfDay].push(lesson);
    });
    const orderOfDay = ['Утро', 'День', 'Вечер', 'Ночь'];
    const showDividers = todayLessons.length > 4;

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer>
                {/* ========== ШАПКА ========== */}
                <HeaderPaper elevation={0}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
                        <Box>
                            <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937' }}>
                                {getGreeting()}, {user?.fullName?.split(' ')[0]}!
                            </Typography>
                            <Typography sx={{ color: '#6B7280', mt: 0.5, fontSize: '14px' }}>
                                {format(currentTime, 'EEEE, d MMMM yyyy', { locale: ru })}
                            </Typography>
                        </Box>
                        <StyledButton 
                            variant="contained" 
                            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} 
                            onClick={handleRefresh} 
                            disabled={refreshing}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                        >
                            {refreshing ? 'Обновление...' : 'Обновить'}
                        </StyledButton>
                    </Box>
                </HeaderPaper>

                {/* ========== НАВИГАЦИЯ ПО ДНЯМ ========== */}
                <Box sx={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                    mb: 2.5, flexWrap: 'wrap', gap: 1.5 
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1F2937' }}>
                            {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
                        </Typography>
                        <Chip 
                            label={`${todayLessons.length} занятий`} 
                            size="small" 
                            sx={{ 
                                bgcolor: '#EEF2FF', color: '#4F46E5', 
                                fontWeight: 500, borderRadius: '100px', fontSize: '12px',
                            }} 
                        />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconButton onClick={goToPreviousDay} size="small" 
                            sx={{ color: '#374151', '&:hover': { bgcolor: '#F3F4F6' } }}>
                            ←
                        </IconButton>
                        <StyledButton 
                            variant={isToday ? "contained" : "outlined"} 
                            onClick={goToToday}
                            sx={{ 
                                bgcolor: isToday ? '#4F46E5' : 'transparent', 
                                color: isToday ? '#fff' : '#374151', 
                                borderColor: '#D1D5DB',
                                '&:hover': { 
                                    bgcolor: isToday ? '#4338CA' : '#F9FAFB',
                                    borderColor: '#9CA3AF',
                                },
                                minWidth: 'auto', px: 2,
                            }}
                        >
                            Сегодня
                        </StyledButton>
                        <IconButton onClick={goToNextDay} size="small"
                            sx={{ color: '#374151', '&:hover': { bgcolor: '#F3F4F6' } }}>
                            →
                        </IconButton>
                    </Box>
                </Box>

                {/* ========== СПИСОК УРОКОВ ========== */}
                {todayLessons.length === 0 ? (
                    <Paper sx={{ borderRadius: '12px', bgcolor: '#FFFFFF', border: '1px solid #F3F4F6', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                        <EmptyStateContainer>
                            <EmptyStateIcon>
                                <CalendarTodayIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
                            </EmptyStateIcon>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                                Нет занятий
                            </Typography>
                            <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                                На этот день ничего не запланировано
                            </Typography>
                        </EmptyStateContainer>
                    </Paper>
                ) : showDividers ? (
                    <Box>
                        {orderOfDay.map(timeOfDay => {
                            const lessons = timeGroups[timeOfDay];
                            if (!lessons || lessons.length === 0) return null;
                            return (
                                <Box key={timeOfDay}>
                                    <TimeDivider>
                                        <AccessTimeIcon sx={{ fontSize: 16, color: '#9CA3AF' }} />
                                        <Typography sx={{ color: '#9CA3AF', fontWeight: 500, fontSize: '13px', whiteSpace: 'nowrap' }}>
                                            {timeOfDay}
                                        </Typography>
                                    </TimeDivider>
                                    {lessons.map(lesson => renderLessonCard(lesson))}
                                </Box>
                            );
                        })}
                    </Box>
                ) : (
                    <Box>{todayLessons.map(lesson => renderLessonCard(lesson))}</Box>
                )}

                {/* ========== ДИАЛОГ ЗАВЕРШЕНИЯ УРОКА ========== */}
                <StyledDialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="md" fullWidth>
                    <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                        Завершение урока
                    </DialogTitle>
                    <DialogContent sx={{ px: 3 }}>
                        <Box sx={{ pt: 2 }}>
                            <Typography sx={{ fontSize: '15px', fontWeight: 500, color: '#374151' }}>
                                {selectedLesson?.student?.fullName} | {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)} - {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.endTime)}
                            </Typography>
                            <FormControl fullWidth sx={{ mt: 2, mb: 3 }}>
                                <InputLabel sx={{ fontSize: '13px', color: '#6B7280' }}>📋 Применить (опционально)</InputLabel>
                                <Select 
                                    value={applyType === 'plan' ? `plan_${selectedPlanId}` : (applyType === 'variant' ? `variant_${selectedVariantId}` : '')}
                                    onChange={(e) => { 
                                        const val = e.target.value; 
                                        if (!val) { setApplyType('none'); setSelectedPlanId(''); setSelectedVariantId(''); return; } 
                                        const [type, id] = val.split('_'); 
                                        handleApplyItem(type, id); 
                                    }} 
                                    label="📋 Применить (опционально)"
                                    sx={{
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB', borderRadius: '8px' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
                                    }}
                                >
                                    <MenuItem value="">— Не применять —</MenuItem>
                                    <Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600 }}>📖 Планы уроков</MenuItem>
                                    {lessonPlans.map(plan => (
                                        <MenuItem key={`plan_${plan.id}`} value={`plan_${plan.id}`}>
                                            <Box><Typography variant="body2">{plan.title}</Typography><Typography variant="caption" sx={{ color: '#6B7280' }}>{plan.topic}</Typography></Box>
                                        </MenuItem>
                                    ))}
                                    <Divider />
                                    <MenuItem disabled sx={{ fontWeight: 600 }}>🔗 Варианты</MenuItem>
                                    {variants.map(v => (
                                        <MenuItem key={`variant_${v.id}`} value={`variant_${v.id}`}>
                                            <Box><Typography variant="body2">{v.title}</Typography><Typography variant="caption" sx={{ color: '#6B7280' }}>{v.subject} • {v.examType}</Typography></Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                            <TextField fullWidth label="📝 Что делали на уроке" multiline rows={4} value={lessonNotes} onChange={(e) => setLessonNotes(e.target.value)}
                                sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#E5E7EB' }, '&:hover fieldset': { borderColor: '#D1D5DB' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } } }} />
                            <TextField fullWidth label="🎯 Что сделать на следующем уроке" multiline rows={3} value={nextLessonPlan} onChange={(e) => setNextLessonPlan(e.target.value)}
                                sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#E5E7EB' }, '&:hover fieldset': { borderColor: '#D1D5DB' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } } }} />
                            <Divider sx={{ my: 3, borderColor: '#F3F4F6' }} />
                            <Typography sx={{ fontSize: '16px', fontWeight: 600, color: '#1F2937', mb: 2 }}>📋 Назначить домашнее задание (опционально)</Typography>
                            <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
                                <TextField fullWidth label="Текст задания" multiline rows={3} value={newHomeworkForLesson.task}
                                    onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, task: e.target.value })}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#E5E7EB' }, '&:hover fieldset': { borderColor: '#D1D5DB' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } } }} />
                                <StyledButton variant="outlined" onClick={() => { setOpenBankPicker(true); loadBankItems(); }}
                                    sx={{ minWidth: 140, whiteSpace: 'nowrap', borderColor: '#D1D5DB', color: '#374151', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}>
                                    📋 Из банка
                                </StyledButton>
                            </Box>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth><InputLabel sx={{ fontSize: '13px' }}>Срок сдачи</InputLabel>
                                        <Select value={newHomeworkForLesson.dueDate || ''} onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, dueDate: e.target.value })} label="Срок сдачи"
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB', borderRadius: '8px' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' } }}>
                                            <MenuItem value="">Выбрать дату</MenuItem><MenuItem value="custom">📅 Своя дата</MenuItem><Divider />
                                            <MenuItem disabled sx={{ fontWeight: 600 }}>📅 Следующие уроки:</MenuItem>
                                            {upcomingLessons.map(l => <MenuItem key={l.id} value={l.lessonDate + 'T23:59:59'}>{format(new Date(l.lessonDate), 'd MMM', { locale: ru })} {formatLessonTime(l.lessonDate, l.startTime)}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                    {newHomeworkForLesson.dueDate === 'custom' && <TextField fullWidth type="date" label="Своя дата" value={newHomeworkForLesson.customDueDate || ''} onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, customDueDate: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ mt: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px', '& fieldset': { borderColor: '#E5E7EB' }, '&:hover fieldset': { borderColor: '#D1D5DB' }, '&.Mui-focused fieldset': { borderColor: '#4F46E5' } } }} />}
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth><InputLabel sx={{ fontSize: '13px' }}>Шкала</InputLabel>
                                        <Select value={newHomeworkForLesson.gradeType || 'GRADE_5'} onChange={(e) => setNewHomeworkForLesson({ ...newHomeworkForLesson, gradeType: e.target.value })} label="Шкала"
                                            sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB', borderRadius: '8px' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' } }}>
                                            <MenuItem value="GRADE_5">5-балльная ⭐</MenuItem><MenuItem value="GRADE_10">10-балльная</MenuItem><MenuItem value="GRADE_100">100-балльная</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3 }}>
                        <StyledButton onClick={() => setOpenCompleteDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                        <StyledButton onClick={handleCompleteLesson} variant="contained" startIcon={<CheckIcon />}
                            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}>Завершить урок</StyledButton>
                    </DialogActions>
                </StyledDialog>

                {/* Остальные диалоги (БАНК, ЗАМЕТКИ, ОТМЕНА, ПЕРЕНОС, ЗАМЕНА) */}
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
                    <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
                </Snackbar>
            </PageContainer>
        </LocalizationProvider>
    );
}

export default Dashboard;