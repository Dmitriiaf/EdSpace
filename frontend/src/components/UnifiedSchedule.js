// ========== frontend/src/components/UnifiedSchedule.js ==========
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
    Box, Typography, Checkbox, FormControlLabel , Paper, Chip, Menu, MenuItem, Dialog,
    DialogTitle, DialogContent, DialogActions, Button, TextField,
    FormControl, InputLabel, Select, Alert, IconButton, Avatar,
    Tooltip, Drawer, Grid, Stack, Divider, Autocomplete
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { 
    Edit, Edit as EditIcon, Delete, Work as WorkIcon, Add as AddIcon,
    Refresh as RefreshIcon, FilterList as FilterIcon,
    Today as TodayIcon, ChevronLeft, ChevronRight,
    Person as PersonIcon, Payments as PaymentsIcon,
    Videocam as VideocamIcon, CheckCircle as CheckIcon,
    Cancel as CancelIcon, Event as EventIcon
} from '@mui/icons-material';
import { formatLessonTime, getLocalHoursMinutes } from '../utils/timezone';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addMinutes, parse, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance from '../api/axiosConfig';
import { replaceCancelledWithResurrect } from '../services/api';
import LessonRoom from './LessonRoom';
import { getAllLessons } from '../services/api';

// ========== КОНСТАНТЫ ==========
const HOUR_HEIGHT = 48;
const MIN_STEP = 15;
const START_HOUR = 8;
const END_HOUR = 27;

const DENSITY = {
    compact: { step: 30, height: HOUR_HEIGHT / 2 },
    comfortable: { step: 15, height: HOUR_HEIGHT / 4 },
};

const STATUS_COLORS = {
    SCHEDULED:   { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: 'Запланировано' },
    COMPLETED:   { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Проведено' },
    PAID:        { bg: '#D1FAE5', text: '#065F46', dot: '#10B981', label: 'Проведено' },
    RESCHEDULED: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Перенесено' },
    CANCELLED:   { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Отменено' },
    TRIAL:       { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6', label: 'Пробное' },
    SINGLE:      { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6', label: 'Разовое' },
};

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

function getAvatarColor(name) {
    const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#EF4444', '#F59E0B', '#10B981', '#059669', '#3B82F6', '#2563EB', '#6366F1'];
    let hash = 0;
    const str = name || '?';
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

function getInitials(name) {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.substring(0, 2).toUpperCase();
}

const SchedulePaper = styled(Paper)({
    borderRadius: '16px', overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF', border: '1px solid #F3F4F6',
});

const DayHeader = styled(Box)(({ isToday }) => ({
    flex: 1, textAlign: 'center', padding: '12px 8px',
    borderLeft: '1px solid #F3F4F6',
    backgroundColor: isToday ? '#EEF2FF' : '#FAFBFC',
    cursor: 'pointer', transition: 'background-color 0.15s',
    '&:hover': { backgroundColor: isToday ? '#E0E7FF' : '#F3F4F6' },
}));

const TimeLabel = styled(Box)({
    width: 56, flexShrink: 0, paddingRight: 8,
    textAlign: 'right', fontSize: 11, color: '#9CA3AF', fontWeight: 500,
});

const LessonBlock = styled(Box)(({ statusStyle, isCompact }) => ({
    position: 'absolute', left: 3, right: 3, zIndex: 5,
    backgroundColor: statusStyle.bg, borderLeft: `3px solid ${statusStyle.dot}`,
    borderRadius: isCompact ? '4px' : '8px',
    padding: isCompact ? '2px 5px' : '6px 8px',
    overflow: 'hidden', cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease',
    '&:hover': { zIndex: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.12)', transform: 'scale(1.01)' },
}));

const HoverSlot = styled(Box)({
    position: 'absolute', left: 3, right: 3,
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    border: '2px dashed rgba(79, 70, 229, 0.35)',
    borderRadius: '8px', pointerEvents: 'none', zIndex: 20,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
});

const StyledDialog = styled(Dialog)({
    '& .MuiDialog-paper': { borderRadius: '20px', boxShadow: '0 25px 50px rgba(0,0,0,0.15)', overflow: 'hidden' },
});

const StyledMenu = styled(Menu)({
    '& .MuiPaper-root': { borderRadius: '12px', boxShadow: '0 12px 30px rgba(0,0,0,0.12)', minWidth: 220 },
});

const StyledButton = styled(Button)({
    borderRadius: '10px', textTransform: 'none', fontSize: '14px', fontWeight: 500, padding: '8px 16px',
});

function UnifiedSchedule({ 
    weekDates, lessons, students, courses, debtors, user, 
    onRefresh, onShowSnackbar, onOpenResurrect,
    getStudentRateForTutor, templates, onAddClick,
    onEditTemplate, onDeleteTemplate, onDeleteLesson,
}) {
    const [groups, setGroups] = useState([]);
    const [density, setDensity] = useState('comfortable');
    const [selectedLessons, setSelectedLessons] = useState([]);
    const [bulkMode, setBulkMode] = useState(false);
    
    useEffect(() => {
        if (user?.id) {
            axiosInstance.get(`/groups/tutor/${user.id}`)
                .then(res => setGroups(res.data?.filter(g => g.status === 'active') || []))
                .catch(() => {});
        }
    }, [user]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [hoverSlot, setHoverSlot] = useState(null);
    const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openReplaceDialog, setOpenReplaceDialog] = useState(false);
    const [openLessonDetails, setOpenLessonDetails] = useState(false);
    const [openCancelDialog, setOpenCancelDialog] = useState(false);
    const [openCancelRequestDialog, setOpenCancelRequestDialog] = useState(false);
    const [cancelRequestReason, setCancelRequestReason] = useState('');
    const [openRescheduleRequestDialog, setOpenRescheduleRequestDialog] = useState(false);
    const [rescheduleRequestDate, setRescheduleRequestDate] = useState(null);
    const [rescheduleRequestTime, setRescheduleRequestTime] = useState('');
    const [cancelReason, setCancelReason] = useState('');
    const [rescheduleDate, setRescheduleDate] = useState(null);
    const [rescheduleTime, setRescheduleTime] = useState('');
    const availableTimeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'];
    const [openLessonRoom, setOpenLessonRoom] = useState(false);
    const [openCompleteDialog, setOpenCompleteDialog] = useState(false);
    const [lessonNotes, setLessonNotes] = useState('');
    const [nextLessonPlan, setNextLessonPlan] = useState('');
    const [homeworkTask, setHomeworkTask] = useState('');
    const [homeworkDueDate, setHomeworkDueDate] = useState('');
    const [openMobileDay, setOpenMobileDay] = useState(null);
    const [createForm, setCreateForm] = useState({ 
        date: '', startTime: '', duration: 60, studentId: '', courseId: '', 
        isTrial: false, trialName: '', trialEmail: '', trialPrice: 0,
        isTemplate: false, groupId: ''
    });
    const [editForm, setEditForm] = useState({ startTime: '', duration: 60, courseId: '', applyToAll: false });
    const [cancelledLesson, setCancelledLesson] = useState(null);
    const [selectedDebtorId, setSelectedDebtorId] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const timeSlots = useMemo(() => {
        const slots = [];
        const step = DENSITY[density].step;
        for (let h = START_HOUR; h <= END_HOUR; h++) {
            for (let m = 0; m < 60; m += step) {
                const displayHour = h % 24;
                slots.push({ key: `${h}:${m}`, display: `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`, hour: h, minute: m });
            }
        }
        return slots;
    }, [density]);

    const timeToPosition = useCallback((lesson) => {
        if (!lesson) return 0;
        const slotHeight = DENSITY[density].height;
        const { hours, minutes } = getLocalHoursMinutes(lesson.lessonDate, lesson.startTime);
        const adjustedHours = hours < START_HOUR ? hours + 24 : hours;
        const totalMinutes = (adjustedHours - START_HOUR) * 60 + minutes;
        return (totalMinutes / DENSITY[density].step) * slotHeight;
    }, [density]);

    const positionToTime = useCallback((y) => {
        const slotHeight = DENSITY[density].height;
        const step = DENSITY[density].step;
        const slotIndex = Math.floor(y / slotHeight);
        const totalMinutes = slotIndex * step + START_HOUR * 60;
        let h = Math.floor(totalMinutes / 60);
        let m = totalMinutes % 60;
        m = Math.round(m / step) * step;
        if (m >= 60) { h += 1; m = 0; }
        h = Math.max(START_HOUR, Math.min(END_HOUR, h));
        const displayHour = h % 24;
        return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }, [density]);

    const getLessonsForDate = useCallback((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd');
        return lessons.filter(l => {
            if (l.lessonDate === dateStr) return true;
            if (l.lessonDate === nextDateStr) {
                const { hours } = getLocalHoursMinutes(l.lessonDate, l.startTime);
                if (hours < START_HOUR) {
                    if (hours === 0) return false;
                    return true;
                }
            }
            return false;
        });
    }, [lessons]);

    const checkTimeConflict = useCallback((date, startTime, duration, excludeLessonId = null) => {
        const dayLessons = getLessonsForDate(date);
        const [newH, newM] = startTime.split(':').map(Number);
        const newStartMinutes = newH * 60 + newM;
        const newEndMinutes = newStartMinutes + duration;
        return dayLessons.some(l => {
            if (excludeLessonId && l.id === excludeLessonId) return false;
            if (l.status === 'CANCELLED') return false;
            const { hours: lH, minutes: lM } = getLocalHoursMinutes(l.lessonDate, l.startTime);
            const lStartMinutes = lH * 60 + lM;
            const lEndMinutes = lStartMinutes + (l.duration || 60);
            return newStartMinutes < lEndMinutes && newEndMinutes > lStartMinutes;
        });
    }, [getLessonsForDate]);

    const getDailyIncome = useCallback((date) => {
        const dayLessons = getLessonsForDate(date);
        let total = 0;
        dayLessons.forEach(l => {
            if ((l.status === 'PAID' || l.status === 'COMPLETED') && l.student?.paymentType !== 'subscription') {
                total += getStudentRateForTutor?.(l.student, user?.id) || 0;
            }
        });
        return total;
    }, [getLessonsForDate, getStudentRateForTutor, user]);

    const handleSlotClick = (date, e) => {
        if (bulkMode) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const startTime = positionToTime(y);
        const isNightSlot = y > (END_HOUR - 3) * (DENSITY[density].height * (60 / DENSITY[density].step));
        const isMidnight = startTime === '00:00';
        let lessonDate = (isNightSlot && !isMidnight) ? addDays(date, 1) : date;
        const dateStr = format(lessonDate, 'yyyy-MM-dd');
        if (checkTimeConflict(lessonDate, startTime, 60)) {
            onShowSnackbar?.('❌ Это время занято', 'error');
            return;
        }
        setCreateForm({ date: dateStr, startTime, duration: 60, studentId: '', courseId: '', isTrial: false, trialName: '', trialPrice: 0, groupId: '' });
        setOpenCreateDialog(true);
    };

    const handleLessonClick = (e, lesson) => { e.stopPropagation(); setSelectedLesson(lesson); setOpenLessonDetails(true); };

    const handleEditLesson = () => {
        if (selectedLesson) {
            const { hours, minutes } = getLocalHoursMinutes(selectedLesson.lessonDate, selectedLesson.startTime);
            const localTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            setEditForm({ startTime: localTime, duration: selectedLesson.duration || 60, courseId: selectedLesson.course?.id || '', applyToAll: false });
            setOpenEditDialog(true);
        }
        setAnchorEl(null);
    };

    const handleDeleteLesson = async () => {
        if (!selectedLesson) return;
        
        if (selectedLesson.weeklyTemplateId) {
            if (!window.confirm('Этот урок создан по шаблону.\n\nНажмите «ОК» чтобы удалить шаблон и все будущие уроки.\nНажмите «Отмена» чтобы удалить только этот урок.')) {
                try { 
                    await axiosInstance.delete(`/lessons/${selectedLesson.id}`); 
                    onShowSnackbar?.('✅ Занятие удалено', 'success'); 
                    onRefresh?.(); 
                }
                catch (err) { onShowSnackbar?.('Ошибка при удалении', 'error'); }
                setAnchorEl(null);
                return;
            }
            try { 
                await axiosInstance.delete(`/weekly-template/${selectedLesson.weeklyTemplateId}`); 
                onShowSnackbar?.('✅ Шаблон и все будущие уроки удалены', 'success'); 
                onRefresh?.(); 
            }
            catch (err) { onShowSnackbar?.('Ошибка при удалении шаблона', 'error'); }
            setAnchorEl(null);
            return;
        }
        
        if (!window.confirm('Удалить занятие?')) return;
        try { 
            await axiosInstance.delete(`/lessons/${selectedLesson.id}`); 
            onShowSnackbar?.('✅ Занятие удалено', 'success'); 
            onRefresh?.(); 
        }
        catch (err) { onShowSnackbar?.('Ошибка при удалении', 'error'); }
        setAnchorEl(null);
    };

    const handleSaveCreate = async () => {
        if (!createForm.studentId && !createForm.groupId) { onShowSnackbar?.('Выберите ученика или группу', 'error'); return; }
        try {
            if (createForm.isTemplate) {
                const dayOfWeek = new Date(createForm.date + 'T00:00:00').getDay();
                const dayMapping = [7, 1, 2, 3, 4, 5, 6];
                const mappedDay = dayMapping[dayOfWeek];
                
                if (createForm.groupId) {
                    const baseDate = new Date(createForm.date + 'T00:00:00');
                    for (let week = 0; week < 4; week++) {
                        const lessonDate = addDays(baseDate, week * 7);
                        const dateStr = format(lessonDate, 'yyyy-MM-dd');
                        await axiosInstance.post('/lessons', {
                            tutorId: user.id, groupId: createForm.groupId, lessonDate: dateStr,
                            startTime: createForm.startTime + ':00',
                            endTime: addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration).toTimeString().slice(0, 8),
                            duration: createForm.duration, courseId: createForm.courseId || null,
                        });
                    }
                    onShowSnackbar?.('✅ Групповой шаблон создан на 4 недели', 'success');
                } else {
                    await axiosInstance.post('/weekly-template', {
                        tutorId: user.id, studentId: parseInt(createForm.studentId), courseId: createForm.courseId || null,
                        dayOfWeek: mappedDay, startTime: createForm.startTime + ':00',
                        endTime: addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration).toTimeString().slice(0, 8)
                    });
                    onShowSnackbar?.('✅ Шаблон создан, уроки сгенерированы на 4 недели', 'success');
                }
            } else {
                if (createForm.groupId) {
                    await axiosInstance.post('/lessons', {
                        tutorId: user.id, groupId: createForm.groupId, lessonDate: createForm.date,
                        startTime: createForm.startTime + ':00',
                        endTime: addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration).toTimeString().slice(0, 8),
                        duration: createForm.duration, courseId: createForm.courseId || null,
                    });
                    onShowSnackbar?.('✅ Групповое занятие создано', 'success');
                } else {
                    await axiosInstance.post('/lessons', {
                        tutorId: user.id, studentId: parseInt(createForm.studentId), lessonDate: createForm.date,
                        startTime: createForm.startTime + ':00',
                        endTime: addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration).toTimeString().slice(0, 8),
                        duration: createForm.duration, courseId: createForm.courseId || null,
                    });
                    onShowSnackbar?.('✅ Разовое занятие создано', 'success');
                }
            }
            setOpenCreateDialog(false);
            setCreateForm({ date: '', startTime: '', duration: 60, studentId: '', courseId: '', isTrial: false, trialName: '', trialPrice: 0, isTemplate: false, groupId: '' });
            onRefresh?.();
        } catch (err) { onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };

    const getFutureTemplateDates = (lesson) => {
        if (!lesson.weeklyTemplateId) return [];
        const dates = [];
        const startDate = new Date(lesson.lessonDate + 'T00:00:00');
        let currentDate = addDays(startDate, 7);
        const endDate = addDays(new Date(), 28);
        while (currentDate <= endDate) { dates.push(currentDate); currentDate = addDays(currentDate, 7); }
        return dates;
    };

    const getDayOfWeekFromDate = (dateStr) => {
        const date = parse(dateStr, 'yyyy-MM-dd', new Date());
        const jsDay = date.getDay();
        const mapping = [7, 1, 2, 3, 4, 5, 6];
        return mapping[jsDay];
    };

    const handleRescheduleLesson = async (lesson, newDate) => {
        try {
            const dateStr = format(newDate, 'yyyy-MM-dd');
            const newStartTime = `${String(newDate.getHours()).padStart(2, '0')}:${String(newDate.getMinutes()).padStart(2, '0')}:00`;
            const endDate = new Date(newDate);
            endDate.setHours(endDate.getHours() + 1);
            const newEndTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}:00`;
            await axiosInstance.post(`/lessons/${lesson.id}/reschedule`, {
                newDate: dateStr,
                newStartTime: newStartTime,
                newEndTime: newEndTime,
            });
            onShowSnackbar?.('✅ Занятие перенесено', 'success');
            setOpenEditDialog(false);
            setSelectedLesson(null);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedLesson) return;
        const lessonDate = parse(selectedLesson.lessonDate, 'yyyy-MM-dd', new Date());
        
        if (checkTimeConflict(lessonDate, editForm.startTime, editForm.duration, selectedLesson.id)) {
            onShowSnackbar?.('❌ Новое время занято другим уроком', 'error'); return;
        }
        if (selectedLesson.weeklyTemplateId && editForm.applyToAll) {
            const futureDates = getFutureTemplateDates(selectedLesson);
            for (const futureDate of futureDates) {
                if (checkTimeConflict(new Date(futureDate), editForm.startTime, editForm.duration)) {
                    onShowSnackbar?.('❌ Найдены конфликты в будущих уроках', 'error'); return;
                }
            }
        }
        
        try {
            if (selectedLesson.groupId) {
                const [hours, minutes] = editForm.startTime.split(':').map(Number);
                const endTime = addMinutes(parse(editForm.startTime, 'HH:mm', new Date()), editForm.duration);
                const endTimeStr = format(endTime, 'HH:mm:ss');
                
                const baseDate = new Date(selectedLesson.lessonDate + 'T00:00:00');
                let updatedCount = 0;
                for (let week = 0; week < 4; week++) {
                    const futureDate = addDays(baseDate, week * 7);
                    const dateStr = format(futureDate, 'yyyy-MM-dd');
                    try {
                        await axiosInstance.put(`/lessons/${selectedLesson.id}/group`, {
                            lessonDate: dateStr,
                            startTime: editForm.startTime + ':00',
                            endTime: endTimeStr,
                            duration: editForm.duration,
                            courseId: editForm.courseId || null
                        });
                        updatedCount++;
                    } catch (e) {}
                }
                onShowSnackbar?.(`✅ Обновлено уроков группы: ${updatedCount} недель`, 'success');
            } else if (selectedLesson.weeklyTemplateId && editForm.applyToAll) {
                const endTimeLocal = addMinutes(parse(editForm.startTime, 'HH:mm', new Date()), editForm.duration);
                await axiosInstance.put(`/weekly-template/${selectedLesson.weeklyTemplateId}`, {
                    studentId: selectedLesson.student?.id, courseId: editForm.courseId || null,
                    dayOfWeek: getDayOfWeekFromDate(selectedLesson.lessonDate),
                    startTime: editForm.startTime + ':00', endTime: format(endTimeLocal, 'HH:mm:ss')
                });
                onShowSnackbar?.('✅ Шаблон и все будущие уроки обновлены', 'success');
            } else {
                const [hours, minutes] = editForm.startTime.split(':').map(Number);
                let utcHours = hours - 7; if (utcHours < 0) utcHours += 24;
                const utcStartTime = `${utcHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
                const endMinutes = hours * 60 + minutes + editForm.duration;
                let endHours = Math.floor(endMinutes / 60) - 7; if (endHours < 0) endHours += 24;
                const endMins = endMinutes % 60;
                const utcEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
                await axiosInstance.put(`/lessons/${selectedLesson.id}`, {
                    startTime: utcStartTime, endTime: utcEndTime, duration: editForm.duration, courseId: editForm.courseId || null
                });
                onShowSnackbar?.('✅ Занятие перенесено', 'success');
            }
            setOpenEditDialog(false); setSelectedLesson(null); onRefresh?.();
        } catch (err) { onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };

    const handleReplaceClick = (lesson) => { setCancelledLesson(lesson); setSelectedDebtorId(''); setOpenReplaceDialog(true); setAnchorEl(null); };
    const handleConfirmReplace = async () => {
        if (!cancelledLesson || !selectedDebtorId) return;
        try { await replaceCancelledWithResurrect(cancelledLesson.id, parseInt(selectedDebtorId)); onShowSnackbar?.('✅ Урок заменён на отработку долга', 'success'); setOpenReplaceDialog(false); setCancelledLesson(null); onRefresh?.(); }
        catch (err) { onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
    };
    const handleDayClick = (date) => { if (isMobile) { const dayLessons = getLessonsForDate(date); setOpenMobileDay({ date, lessons: dayLessons }); } };

    const renderDayColumn = (date, dayIdx) => {
        const dayLessons = getLessonsForDate(date);
        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        const slotHeight = DENSITY[density].height;
        return (
            <Box key={dayIdx} sx={{ flex: 1, position: 'relative', borderLeft: '1px solid #F3F4F6', minHeight: timeSlots.length * slotHeight, cursor: bulkMode ? 'default' : 'pointer', backgroundColor: isToday ? '#FAFBFF' : '#FFFFFF' }}
                onClick={(e) => handleSlotClick(date, e)}
                onMouseMove={(e) => { if (isMobile || bulkMode) return; const rect = e.currentTarget.getBoundingClientRect(); const y = e.clientY - rect.top; const startTime = positionToTime(y); setHoverSlot({ date, startTime, duration: 60 }); }}
                onMouseLeave={() => setHoverSlot(null)}>
                {timeSlots.map((slot, idx) => { const isNight = slot.hour >= 24; const isHour = idx % (60 / DENSITY[density].step) === 0;
                    return <Box key={idx} sx={{ height: slotHeight, borderBottom: isHour ? '1px solid #E5E7EB' : '1px solid #F9FAFB', backgroundColor: isNight ? 'rgba(0,0,0,0.015)' : 'transparent' }} />; })}
                {!isMobile && !bulkMode && hoverSlot && format(hoverSlot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && (() => {
                    const [h, m] = hoverSlot.startTime.split(':').map(Number); const adjustedHour = h < START_HOUR ? h + 24 : h;
                    const totalMinutes = (adjustedHour - START_HOUR) * 60 + m; const top = (totalMinutes / DENSITY[density].step) * slotHeight;
                    const height = (hoverSlot.duration / DENSITY[density].step) * slotHeight;
                    return (<HoverSlot sx={{ top, height }}><Typography sx={{ color: '#4F46E5', fontWeight: 600, fontSize: density === 'compact' ? '11px' : '13px' }}>+ {hoverSlot.startTime}</Typography></HoverSlot>);
                })()}
                {dayLessons.map(lesson => {
                    const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED; if (lesson.isTrial) Object.assign(statusStyle, STATUS_COLORS.TRIAL);
                    const top = timeToPosition(lesson); const height = ((lesson.duration || 60) / DENSITY[density].step) * slotHeight; const isCompact = density === 'compact';
                    const isCancelled = lesson.status === 'CANCELLED';
                    const isSelected = selectedLessons.includes(lesson.id);
                    return (<LessonBlock key={lesson.id} statusStyle={statusStyle} isCompact={isCompact} 
                        sx={{ 
                            top, height: Math.max(height, slotHeight),
                            opacity: isCancelled ? 0.5 : 1,
                            pointerEvents: isCancelled ? 'none' : 'auto',
                            zIndex: isCancelled ? 1 : isSelected ? 15 : 5,
                            outline: isSelected ? '3px solid #4F46E5' : 'none',
                            boxShadow: isSelected ? '0 0 0 4px rgba(79,70,229,0.3)' : '0 1px 3px rgba(0,0,0,0.06)',
                        }} 
                        onClick={(e) => { 
                            if (isCancelled) return;
                            if (bulkMode) {
                                e.stopPropagation();
                                if (isSelected) setSelectedLessons(selectedLessons.filter(id => id !== lesson.id));
                                else setSelectedLessons([...selectedLessons, lesson.id]);
                                return;
                            }
                            handleLessonClick(e, lesson); 
                        }}
                    >
                        <Typography sx={{ fontWeight: 600, fontSize: isCompact ? '10px' : '12px', color: statusStyle.text, lineHeight: 1.2 }}>
                            {lesson.groupId ? `👥 ${groups.find(g => g.id === lesson.groupId)?.name || 'Группа'}` : (lesson.student?.fullName || 'Пробное')}
                        </Typography>
                        {lesson.groupId && !isCompact && <Typography sx={{ fontSize: '9px', color: '#6B7280' }}>{lesson.student?.fullName}</Typography>}
                        {!isCompact && <><Typography sx={{ fontSize: '10px', color: '#6B7280' }}>{formatLessonTime(lesson.lessonDate, lesson.startTime)} ({lesson.duration || 60} мин)</Typography>
                            {lesson.course && <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>{lesson.course.name}</Typography>}</>}
                        {isCompact && <Typography sx={{ fontSize: '9px', color: '#6B7280' }}>{formatLessonTime(lesson.lessonDate, lesson.startTime)}</Typography>}
                    </LessonBlock>);
                })}
            </Box>
        );
    };

    if (isMobile) {
        return (<>
            <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>Расписание</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                    {weekDates.map((date, idx) => {
                        const dayLessons = getLessonsForDate(date); const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'); const income = getDailyIncome(date);
                        return (<Paper key={idx} onClick={() => handleDayClick(date)} sx={{ minWidth: 52, py: 1, px: 1.5, textAlign: 'center', borderRadius: '12px', cursor: 'pointer', bgcolor: isToday ? '#4F46E5' : dayLessons.length > 0 ? '#F9FAFB' : '#FFFFFF', color: isToday ? '#FFFFFF' : '#1F2937', border: isToday ? 'none' : '1px solid #E5E7EB', transition: 'all 0.15s', '&:active': { opacity: 0.7 } }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 500 }}>{WEEKDAYS[idx]}</Typography>
                            <Typography sx={{ fontSize: '15px', fontWeight: 700 }}>{format(date, 'd')}</Typography>
                            {dayLessons.length > 0 && <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3, mt: 0.3 }}>{dayLessons.slice(0, 3).map((l, i) => { const s = STATUS_COLORS[l.status] || STATUS_COLORS.SCHEDULED; return <Box key={i} sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: s.dot }} />; })}</Box>}
                            {income > 0 && <Typography sx={{ fontSize: '9px', color: isToday ? '#D1FAE5' : '#10B981', fontWeight: 600, mt: 0.2 }}>+{income}₽</Typography>}
                        </Paper>);
                    })}
                </Box>
            </Box>
            {!openMobileDay && <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', bgcolor: '#F9FAFB' }}><TodayIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} /><Typography sx={{ color: '#9CA3AF', fontSize: '15px' }}>Выберите день для просмотра занятий</Typography></Paper>}
            <Drawer anchor="bottom" open={!!openMobileDay} onClose={() => setOpenMobileDay(null)} PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75vh' } }}>
                <Box sx={{ p: 2 }}><Box sx={{ width: 40, height: 4, bgcolor: '#E5E7EB', borderRadius: 2, mx: 'auto', mb: 2 }} />
                    {openMobileDay && (<>
                        <Typography sx={{ fontWeight: 700, fontSize: '18px', mb: 2 }}>{format(openMobileDay.date, 'EEEE, d MMMM', { locale: ru })}</Typography>
                        {openMobileDay.lessons.length === 0 ? <Box sx={{ textAlign: 'center', py: 4 }}><Typography color="textSecondary">Нет занятий</Typography></Box>
                        : openMobileDay.lessons.sort((a, b) => a.startTime.localeCompare(b.startTime)).map(lesson => {
                            const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED; if (lesson.isTrial) Object.assign(statusStyle, STATUS_COLORS.TRIAL); const studentRate = getStudentRateForTutor?.(lesson.student, user?.id);
                            return (<Paper key={lesson.id} sx={{ p: 2, mb: 1.5, borderRadius: '14px', borderLeft: `4px solid ${statusStyle.dot}`, boxShadow: '0 1px 3px rgba(0,0,0,0.04)', '&:active': { bgcolor: '#F9FAFB' } }} onClick={(e) => handleLessonClick(e, lesson)}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <Box sx={{ flex: 1 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                            <Typography sx={{ fontWeight: 600, fontSize: '16px' }}>{formatLessonTime(lesson.lessonDate, lesson.startTime)} – {formatLessonTime(lesson.lessonDate, lesson.endTime)}</Typography>
                                            <Chip label={statusStyle.label} size="small" sx={{ fontSize: '10px', height: 20, bgcolor: statusStyle.bg, color: statusStyle.text }} />
                                        </Box>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                            <Avatar sx={{ width: 24, height: 24, bgcolor: getAvatarColor(lesson.student?.fullName), fontSize: 11 }}>{getInitials(lesson.student?.fullName)}</Avatar>
                                            <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>{lesson.student?.fullName || 'Пробное'}</Typography>
                                        </Box>
                                        {lesson.course && <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 0.3 }}>{lesson.course.name} • {lesson.duration || 60} мин</Typography>}
                                        {studentRate && lesson.status !== 'CANCELLED' && <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#10B981', mt: 0.5 }}>{studentRate} ₽</Typography>}
                                    </Box>
                                </Box>
                            </Paper>);
                        })}
                    </>)}
                </Box>
            </Drawer>
            
            {/* Карточка урока */}
            <StyledDialog open={openLessonDetails} onClose={() => setOpenLessonDetails(false)} maxWidth="sm" fullWidth>
                {selectedLesson && (() => {
                    const statusStyle = STATUS_COLORS[selectedLesson.status] || STATUS_COLORS.SCHEDULED;
                    const student = selectedLesson.student;
                    const studentRate = getStudentRateForTutor?.(student, user?.id);
                    const isScheduled = selectedLesson.status === 'SCHEDULED' || selectedLesson.status === 'RESCHEDULED';
                    const isInProgress = selectedLesson.status === 'IN_PROGRESS';

                    return (
                        <>
                            <Box sx={{ 
                                background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                                p: 3, color: '#fff',
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Avatar sx={{ 
                                        width: 50, height: 50, 
                                        bgcolor: 'rgba(255,255,255,0.25)',
                                        fontSize: 20, fontWeight: 700,
                                    }}>
                                        {getInitials(student?.fullName)}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography sx={{ fontSize: '19px', fontWeight: 700 }}>
                                            {student?.fullName || 'Пробное занятие'}
                                        </Typography>
                                        <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>
                                            {selectedLesson.course?.name || 'Занятие'} • {formatLessonTime(selectedLesson.lessonDate, selectedLesson.startTime)} – {formatLessonTime(selectedLesson.lessonDate, selectedLesson.endTime)}
                                        </Typography>
                                    </Box>
                                    <Chip 
                                        label={statusStyle.label}
                                        size="small"
                                        sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                                    />
                                </Box>
                            </Box>

                            <DialogContent sx={{ p: 3 }}>
                                {student && (
                                    <Box sx={{ mb: 3 }}>
                                        <Grid container spacing={1.5}>
                                            {student.grade && (
                                                <Grid item xs={4}>
                                                    <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                                        <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>Класс</Typography>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '15px' }}>{student.grade}</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            {studentRate && (
                                                <Grid item xs={4}>
                                                    <Box sx={{ bgcolor: '#ECFDF5', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                                        <Typography sx={{ fontSize: '11px', color: '#059669' }}>Ставка</Typography>
                                                        <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#059669' }}>{studentRate} ₽</Typography>
                                                    </Box>
                                                </Grid>
                                            )}
                                            <Grid item xs={4}>
                                                <Box sx={{ bgcolor: '#EEF2FF', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                                    <Typography sx={{ fontSize: '11px', color: '#4F46E5' }}>Длительность</Typography>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#4F46E5' }}>{selectedLesson.duration || 60} мин</Typography>
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Box>
                                )}

                                {selectedLesson.notes && (
                                    <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 2, mb: 2 }}>
                                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>
                                            📝 Что делали на прошлом уроке
                                        </Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#374151' }}>
                                            {selectedLesson.notes}
                                        </Typography>
                                    </Box>
                                )}

                                {selectedLesson.nextLessonPlan && (
                                    <Box sx={{ bgcolor: '#EEF2FF', borderRadius: 2, p: 2, mb: 2 }}>
                                        <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', mb: 0.5 }}>
                                            🎯 Задано к этому уроку
                                        </Typography>
                                        <Typography sx={{ fontSize: '14px', color: '#1E293B' }}>
                                            {selectedLesson.nextLessonPlan}
                                        </Typography>
                                    </Box>
                                )}

                                {(selectedLesson.status === 'COMPLETED' || selectedLesson.status === 'PAID') && (
                                    <Button 
                                        fullWidth 
                                        variant="outlined"
                                        startIcon={<EditIcon />}
                                        onClick={() => {
                                            setLessonNotes(selectedLesson.notes || '');
                                            setNextLessonPlan(selectedLesson.nextLessonPlan || '');
                                            setHomeworkTask('');
                                            setHomeworkDueDate('');
                                            setOpenCompleteDialog(true);
                                        }}
                                        sx={{ 
                                            py: 1.5,
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            fontSize: '15px',
                                            fontWeight: 600,
                                            color: '#64748B',
                                            borderColor: '#E2E8F0',
                                        }}
                                    >
                                        📝 Редактировать заметки
                                    </Button>
                                )}

                                {(isScheduled || isInProgress) && (
                                    <Stack spacing={1.5}>
                                        <Button 
                                            fullWidth 
                                            variant="contained" 
                                            startIcon={<VideocamIcon />}
                                            onClick={() => {
                                                setOpenLessonDetails(false);
                                                setOpenLessonRoom(true);
                                            }}
                                            sx={{ 
                                                bgcolor: '#4F46E5', 
                                                py: 1.5,
                                                borderRadius: 3,
                                                textTransform: 'none',
                                                fontSize: '15px',
                                                fontWeight: 700,
                                                '&:hover': { bgcolor: '#3730A3' },
                                            }}
                                        >
                                            🎥 Начать урок
                                        </Button>
                                        {isInProgress && (
                                            <Button 
                                                fullWidth 
                                                variant="contained" 
                                                startIcon={<CheckIcon />}
                                                onClick={() => {
                                                    setLessonNotes(selectedLesson.notes || '');
                                                    setNextLessonPlan(selectedLesson.nextLessonPlan || '');
                                                    setHomeworkTask('');
                                                    setHomeworkDueDate('');
                                                    setOpenCompleteDialog(true);
                                                }}
                                                sx={{ 
                                                    bgcolor: '#10B981', 
                                                    py: 1.5,
                                                    borderRadius: 3,
                                                    textTransform: 'none',
                                                    fontSize: '15px',
                                                    fontWeight: 700,
                                                    '&:hover': { bgcolor: '#059669' },
                                                }}
                                            >
                                                ✅ Завершить урок
                                            </Button>
                                        )}
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button 
                                                fullWidth 
                                                variant="outlined"
                                                startIcon={<EventIcon />}
                                                onClick={async () => {
                                                    try {
                                                        await axiosInstance.post(`/lessons/${selectedLesson.id}/request-reschedule`, {});
                                                        onShowSnackbar?.('📩 Запрос на перенос отправлен', 'success');
                                                        setOpenLessonDetails(false);
                                                    } catch (err) {
                                                        onShowSnackbar?.('Ошибка', 'error');
                                                    }
                                                }}
                                                sx={{ py: 1, borderRadius: 3, textTransform: 'none', color: '#64748B', borderColor: '#E2E8F0' }}
                                            >
                                                📩 Перенос
                                            </Button>
                                            <Button 
                                                fullWidth 
                                                variant="outlined"
                                                color="error"
                                                startIcon={<CancelIcon />}
                                                onClick={() => {
                                                    setOpenLessonDetails(false);
                                                    setOpenCancelRequestDialog(true);
                                                }}
                                                sx={{ py: 1, borderRadius: 3, textTransform: 'none' }}
                                            >
                                                ❌ Отмена
                                            </Button>
                                        </Box>
                                    </Stack>
                                )}
                            </DialogContent>
                        </>
                    );
                })()}
            </StyledDialog>
            <LessonRoom 
                open={openLessonRoom}
                onClose={() => setOpenLessonRoom(false)}
                lessonId={selectedLesson?.id}
                lessonInfo={selectedLesson ? {
                    studentName: selectedLesson.student?.fullName,
                    startTime: formatLessonTime(selectedLesson.lessonDate, selectedLesson.startTime),
                    endTime: formatLessonTime(selectedLesson.lessonDate, selectedLesson.endTime),
                } : null}
            />

            {/* ДИАЛОГ ЗАПРОСА ПЕРЕНОСА */}
            <StyledDialog open={openRescheduleRequestDialog} onClose={() => setOpenRescheduleRequestDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Запрос на перенос</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, color: '#64748B' }}>
                        {selectedLesson?.student?.fullName} • {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)}
                    </Typography>
                    <DatePicker 
                        label="Желаемая дата" 
                        value={rescheduleRequestDate} 
                        onChange={(d) => setRescheduleRequestDate(d)}
                        minDate={new Date()}
                        slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
                    />
                    <TextField 
                        fullWidth 
                        label="Желаемое время" 
                        type="time" 
                        value={rescheduleRequestTime}
                        onChange={(e) => setRescheduleRequestTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenRescheduleRequestDialog(false)}>Назад</Button>
                    <Button 
                        variant="contained" 
                        onClick={async () => {
                            try {
                                await axiosInstance.post(`/lessons/${selectedLesson.id}/request-reschedule`, {
                                    desiredDate: rescheduleRequestDate ? format(rescheduleRequestDate, 'yyyy-MM-dd') : null,
                                    desiredTime: rescheduleRequestTime || null,
                                });
                                onShowSnackbar?.('📩 Запрос на перенос отправлен', 'success');
                                setOpenRescheduleRequestDialog(false);
                                setRescheduleRequestDate(null);
                                setRescheduleRequestTime('');
                                setOpenLessonDetails(false);
                            } catch (err) {
                                onShowSnackbar?.('Ошибка', 'error');
                            }
                        }}
                        sx={{ bgcolor: '#4F46E5' }}
                    >
                        Отправить
                    </Button>
                </DialogActions>
            </StyledDialog>

            
            {/* ДИАЛОГ ЗАПРОСА ОТМЕНЫ */}
            <StyledDialog open={openCancelRequestDialog} onClose={() => setOpenCancelRequestDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>Запрос на отмену урока</DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, color: '#64748B' }}>
                        {selectedLesson?.student?.fullName} • {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)}
                    </Typography>
                    <TextField 
                        fullWidth 
                        label="Причина отмены" 
                        multiline 
                        rows={3} 
                        value={cancelRequestReason}
                        onChange={(e) => setCancelRequestReason(e.target.value)}
                        placeholder="Например: ученик заболел"
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenCancelRequestDialog(false)}>Назад</Button>
                    <Button 
                        variant="contained" 
                        color="error"
                        onClick={async () => {
                            try {
                                await axiosInstance.post(`/lessons/${selectedLesson.id}/request-cancel`, {
                                    reason: cancelRequestReason,
                                });
                                onShowSnackbar?.('📩 Запрос на отмену отправлен', 'success');
                                setOpenCancelRequestDialog(false);
                                setCancelRequestReason('');
                                setOpenLessonDetails(false);
                            } catch (err) {
                                onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
                            }
                        }}
                        sx={{ borderRadius: 2 }}
                    >
                        Отправить запрос
                    </Button>
                </DialogActions>
            </StyledDialog>

            {/* ДИАЛОГ ЗАВЕРШЕНИЯ УРОКА */}
            <StyledDialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 700 }}>
                    {selectedLesson?.status === 'COMPLETED' || selectedLesson?.status === 'PAID' 
                        ? 'Редактирование заметок' 
                        : 'Завершение урока'}
                </DialogTitle>
                <DialogContent>
                    <Typography sx={{ mb: 2, color: '#64748B' }}>
                        {selectedLesson?.student?.fullName} • {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)}
                    </Typography>
                    <TextField 
                        fullWidth 
                        label="📝 Что делали на уроке" 
                        multiline 
                        rows={3} 
                        value={lessonNotes}
                        onChange={(e) => setLessonNotes(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField 
                        fullWidth 
                        label="🎯 Что задано к следующему уроку" 
                        multiline 
                        rows={2} 
                        value={nextLessonPlan}
                        onChange={(e) => setNextLessonPlan(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '14px' }}>
                        📋 Домашнее задание (опционально)
                    </Typography>
                    <TextField 
                        fullWidth 
                        label="Текст задания" 
                        multiline 
                        rows={2} 
                        value={homeworkTask}
                        onChange={(e) => setHomeworkTask(e.target.value)}
                        sx={{ mb: 2 }}
                    />
                    <TextField 
                        fullWidth 
                        label="Срок сдачи" 
                        type="date" 
                        value={homeworkDueDate}
                        onChange={(e) => setHomeworkDueDate(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button onClick={() => setOpenCompleteDialog(false)}>Отмена</Button>
                    <Button 
                        variant="contained" 
                        startIcon={<CheckIcon />}
                        onClick={async () => {
                            try {
                                const isCompleted = selectedLesson?.status === 'COMPLETED' || selectedLesson?.status === 'PAID';
                                
                                if (isCompleted) {
                                    // Редактирование заметок — используем PATCH /notes
                                    await axiosInstance.patch(`/lessons/${selectedLesson.id}/notes`, {
                                        notes: lessonNotes,
                                        nextLessonPlan: nextLessonPlan,
                                    });
                                    onShowSnackbar?.('✅ Заметки сохранены!', 'success');
                                } else {
                                    // Завершение урока — используем POST /complete
                                    await axiosInstance.post(`/lessons/${selectedLesson.id}/complete`, {
                                        notes: lessonNotes,
                                        nextLessonPlan: nextLessonPlan,
                                    });
                                    if (homeworkTask && selectedLesson.student?.id) {
                                        await axiosInstance.post('/homework', {
                                            tutorId: user.id,
                                            studentId: selectedLesson.student.id,
                                            task: homeworkTask,
                                            dueDate: homeworkDueDate ? homeworkDueDate + 'T23:59:59' : null,
                                            status: 'ASSIGNED',
                                            gradeType: 'GRADE_5',
                                            courseId: selectedLesson.course?.id || null,
                                        });
                                    }
                                    onShowSnackbar?.('✅ Урок завершён!', 'success');
                                }
                                setOpenCompleteDialog(false);
                                setOpenLessonDetails(false);
                                onRefresh?.();
                            } catch (err) {
                                onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
                            }
                        }}
                        sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                    >
                        {selectedLesson?.status === 'COMPLETED' || selectedLesson?.status === 'PAID' ? 'Сохранить' : 'Завершить'}
                    </Button>
                </DialogActions>
            </StyledDialog>
        </>);
    }

    return (<>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>Расписание</Typography>
                <Chip label={`${lessons.filter(l => l.status === 'SCHEDULED').length} занятий`} size="small" sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 500, borderRadius: '8px' }} />
            </Box>
        </Box>
        <SchedulePaper elevation={0}>
            <Box sx={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                <Box sx={{ width: 56, flexShrink: 0 }} />
                {weekDates.map((date, idx) => { const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'); const income = getDailyIncome(date);
                    return <DayHeader key={idx} isToday={isToday} onClick={() => handleDayClick(date)}>
                        <Typography sx={{ fontWeight: 600, fontSize: '13px', color: isToday ? '#4F46E5' : '#374151' }}>{WEEKDAYS[idx]}</Typography>
                        <Typography sx={{ fontSize: '12px', color: isToday ? '#4F46E5' : '#6B7280', fontWeight: isToday ? 600 : 400 }}>{format(date, 'd MMM', { locale: ru })}</Typography>
                        {income > 0 && <Typography sx={{ fontSize: '11px', color: '#10B981', fontWeight: 600, mt: 0.3 }}>+{income} ₽</Typography>}
                    </DayHeader>;
                })}
            </Box>
            <Box sx={{ display: 'flex', position: 'relative' }}>
                <Box sx={{ width: 56, flexShrink: 0 }}>{timeSlots.map((slot, idx) => { const hourSlot = idx % (60 / DENSITY[density].step) === 0; const isNight = slot.hour >= 24;
                    return <TimeLabel key={`${slot.hour}:${slot.minute}`} sx={{ height: DENSITY[density].height, borderBottom: hourSlot ? '1px solid #E5E7EB' : '1px solid #F9FAFB', backgroundColor: isNight ? 'rgba(0,0,0,0.02)' : 'transparent' }}>
                        {hourSlot && <Typography variant="caption" sx={{ position: 'absolute', top: -8, right: 4, fontWeight: 500, color: '#9CA3AF', fontSize: '10px' }}>{slot.display}</Typography>}
                    </TimeLabel>;
                })}</Box>
                {weekDates.map((date, dayIdx) => renderDayColumn(date, dayIdx))}
            </Box>
        </SchedulePaper>

        {/* Карточка урока */}
        <StyledDialog open={openLessonDetails} onClose={() => setOpenLessonDetails(false)} maxWidth="sm" fullWidth>
            {selectedLesson && (() => {
                const statusStyle = STATUS_COLORS[selectedLesson.status] || STATUS_COLORS.SCHEDULED;
                const student = selectedLesson.student;
                const studentRate = getStudentRateForTutor?.(student, user?.id);
                const isScheduled = selectedLesson.status === 'SCHEDULED' || selectedLesson.status === 'RESCHEDULED';
                const isInProgress = selectedLesson.status === 'IN_PROGRESS';

                return (
                    <>
                        <Box sx={{ 
                            background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                            p: 3, color: '#fff',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ 
                                    width: 50, height: 50, 
                                    bgcolor: 'rgba(255,255,255,0.25)',
                                    fontSize: 20, fontWeight: 700,
                                }}>
                                    {getInitials(student?.fullName)}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography sx={{ fontSize: '19px', fontWeight: 700 }}>
                                        {student?.fullName || 'Пробное занятие'}
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>
                                        {selectedLesson.course?.name || 'Занятие'} • {formatLessonTime(selectedLesson.lessonDate, selectedLesson.startTime)} – {formatLessonTime(selectedLesson.lessonDate, selectedLesson.endTime)}
                                    </Typography>
                                </Box>
                                <Chip 
                                    label={statusStyle.label}
                                    size="small"
                                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                                />
                            </Box>
                        </Box>

                        <DialogContent sx={{ p: 3 }}>
                            {student && (
                                <Box sx={{ mb: 3 }}>
                                    <Grid container spacing={1.5}>
                                        {student.grade && (
                                            <Grid item xs={4}>
                                                <Box sx={{ bgcolor: '#F8FAFC', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                                    <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>Класс</Typography>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '15px' }}>{student.grade}</Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        {studentRate && (
                                            <Grid item xs={4}>
                                                <Box sx={{ bgcolor: '#ECFDF5', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                                    <Typography sx={{ fontSize: '11px', color: '#059669' }}>Ставка</Typography>
                                                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#059669' }}>{studentRate} ₽</Typography>
                                                </Box>
                                            </Grid>
                                        )}
                                        <Grid item xs={4}>
                                            <Box sx={{ bgcolor: '#EEF2FF', borderRadius: 2, p: 1.5, textAlign: 'center' }}>
                                                <Typography sx={{ fontSize: '11px', color: '#4F46E5' }}>Длительность</Typography>
                                                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#4F46E5' }}>{selectedLesson.duration || 60} мин</Typography>
                                            </Box>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}

                            {selectedLesson.notes && (
                                <Box sx={{ bgcolor: '#F9FAFB', borderRadius: 2, p: 2, mb: 2 }}>
                                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', mb: 0.5 }}>
                                        📝 Что делали на прошлом уроке
                                    </Typography>
                                    <Typography sx={{ fontSize: '14px', color: '#374151' }}>
                                        {selectedLesson.notes}
                                    </Typography>
                                </Box>
                            )}

                            {selectedLesson.nextLessonPlan && (
                                <Box sx={{ bgcolor: '#EEF2FF', borderRadius: 2, p: 2, mb: 2 }}>
                                    <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', mb: 0.5 }}>
                                        🎯 Задано к этому уроку
                                    </Typography>
                                    <Typography sx={{ fontSize: '14px', color: '#1E293B' }}>
                                        {selectedLesson.nextLessonPlan}
                                    </Typography>
                                </Box>
                            )}

                            {(selectedLesson.status === 'COMPLETED' || selectedLesson.status === 'PAID') && (
                                <Button 
                                    fullWidth 
                                    variant="outlined"
                                    startIcon={<EditIcon />}
                                    onClick={() => {
                                        setLessonNotes(selectedLesson.notes || '');
                                        setNextLessonPlan(selectedLesson.nextLessonPlan || '');
                                        setHomeworkTask('');
                                        setHomeworkDueDate('');
                                        setOpenCompleteDialog(true);
                                    }}
                                    sx={{ 
                                        py: 1.5,
                                        borderRadius: 3,
                                        textTransform: 'none',
                                        fontSize: '15px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                        borderColor: '#E2E8F0',
                                    }}
                                >
                                    📝 Редактировать заметки
                                </Button>
                            )}

                            {(isScheduled || isInProgress) && (
                                <Stack spacing={1.5}>
                                    <Button 
                                        fullWidth 
                                        variant="contained" 
                                        startIcon={<VideocamIcon />}
                                        onClick={() => {
                                            setOpenLessonDetails(false);
                                            setOpenLessonRoom(true);
                                        }}
                                        sx={{ 
                                            bgcolor: '#4F46E5', 
                                            py: 1.5,
                                            borderRadius: 3,
                                            textTransform: 'none',
                                            fontSize: '15px',
                                            fontWeight: 700,
                                            '&:hover': { bgcolor: '#3730A3' },
                                        }}
                                    >
                                        🎥 Начать урок
                                    </Button>
                                    {isInProgress && (
                                        <Button 
                                            fullWidth 
                                            variant="contained" 
                                            startIcon={<CheckIcon />}
                                            onClick={() => {
                                                setLessonNotes(selectedLesson.notes || '');
                                                setNextLessonPlan(selectedLesson.nextLessonPlan || '');
                                                setHomeworkTask('');
                                                setHomeworkDueDate('');
                                                setOpenCompleteDialog(true);
                                            }}
                                            sx={{ 
                                                bgcolor: '#10B981', 
                                                py: 1.5,
                                                borderRadius: 3,
                                                textTransform: 'none',
                                                fontSize: '15px',
                                                fontWeight: 700,
                                                '&:hover': { bgcolor: '#059669' },
                                            }}
                                        >
                                            ✅ Завершить урок
                                        </Button>
                                    )}
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                        <Button 
                                            fullWidth 
                                            variant="outlined"
                                            startIcon={<EventIcon />}
                                            onClick={() => {
                                                setOpenLessonDetails(false);
                                                setOpenRescheduleRequestDialog(true);
                                            }}
                                            sx={{ py: 1, borderRadius: 3, textTransform: 'none', color: '#64748B', borderColor: '#E2E8F0' }}
                                        >
                                            📩 Перенос
                                        </Button>
                                        <Button 
                                            fullWidth 
                                            variant="outlined"
                                            color="error"
                                            startIcon={<CancelIcon />}
                                            onClick={() => {
                                                setOpenLessonDetails(false);
                                                setOpenCancelRequestDialog(true);
                                            }}
                                            sx={{ py: 1, borderRadius: 3, textTransform: 'none' }}
                                        >
                                            ❌ Отмена
                                        </Button>
                                    </Box>
                                </Stack>
                            )}
                        </DialogContent>
                    </>
                );
            })()}
        </StyledDialog>
        <LessonRoom 
            open={openLessonRoom}
            onClose={() => setOpenLessonRoom(false)}
            lessonId={selectedLesson?.id}
            lessonInfo={selectedLesson ? {
                studentName: selectedLesson.student?.fullName,
                startTime: formatLessonTime(selectedLesson.lessonDate, selectedLesson.startTime),
                endTime: formatLessonTime(selectedLesson.lessonDate, selectedLesson.endTime),
            } : null}
        />

        {/* ДИАЛОГ ЗАВЕРШЕНИЯ УРОКА */}
        <StyledDialog open={openCompleteDialog} onClose={() => setOpenCompleteDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
                {selectedLesson?.status === 'COMPLETED' || selectedLesson?.status === 'PAID' 
                    ? 'Редактирование заметок' 
                    : 'Завершение урока'}
            </DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2, color: '#64748B' }}>
                    {selectedLesson?.student?.fullName} • {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)}
                </Typography>
                <TextField 
                    fullWidth 
                    label="📝 Что делали на уроке" 
                    multiline 
                    rows={3} 
                    value={lessonNotes}
                    onChange={(e) => setLessonNotes(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField 
                    fullWidth 
                    label="🎯 Что задано к следующему уроку" 
                    multiline 
                    rows={2} 
                    value={nextLessonPlan}
                    onChange={(e) => setNextLessonPlan(e.target.value)}
                    sx={{ mb: 3 }}
                />
                <Divider sx={{ my: 2 }} />
                <Typography sx={{ fontWeight: 700, mb: 2, fontSize: '14px' }}>
                    📋 Домашнее задание (опционально)
                </Typography>
                <TextField 
                    fullWidth 
                    label="Текст задания" 
                    multiline 
                    rows={2} 
                    value={homeworkTask}
                    onChange={(e) => setHomeworkTask(e.target.value)}
                    sx={{ mb: 2 }}
                />
                <TextField 
                    fullWidth 
                    label="Срок сдачи" 
                    type="date" 
                    value={homeworkDueDate}
                    onChange={(e) => setHomeworkDueDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpenCompleteDialog(false)}>Отмена</Button>
                <Button 
                    variant="contained" 
                    startIcon={<CheckIcon />}
                    onClick={async () => {
                        try {
                            const isCompleted = selectedLesson?.status === 'COMPLETED' || selectedLesson?.status === 'PAID';
                            
                            if (isCompleted) {
                                // Редактирование заметок — используем PATCH /notes
                                await axiosInstance.patch(`/lessons/${selectedLesson.id}/notes`, {
                                    notes: lessonNotes,
                                    nextLessonPlan: nextLessonPlan,
                                });
                                onShowSnackbar?.('✅ Заметки сохранены!', 'success');
                            } else {
                                // Завершение урока — используем POST /complete
                                await axiosInstance.post(`/lessons/${selectedLesson.id}/complete`, {
                                    notes: lessonNotes,
                                    nextLessonPlan: nextLessonPlan,
                                });
                                if (homeworkTask && selectedLesson.student?.id) {
                                    await axiosInstance.post('/homework', {
                                        tutorId: user.id,
                                        studentId: selectedLesson.student.id,
                                        task: homeworkTask,
                                        dueDate: homeworkDueDate ? homeworkDueDate + 'T23:59:59' : null,
                                        status: 'ASSIGNED',
                                        gradeType: 'GRADE_5',
                                        courseId: selectedLesson.course?.id || null,
                                    });
                                }
                                onShowSnackbar?.('✅ Урок завершён!', 'success');
                            }
                            setOpenCompleteDialog(false);
                            setOpenLessonDetails(false);
                            onRefresh?.();
                        } catch (err) {
                            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
                        }
                    }}
                    sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' } }}
                >
                    {selectedLesson?.status === 'COMPLETED' || selectedLesson?.status === 'PAID' ? 'Сохранить' : 'Завершить'}
                </Button>
            </DialogActions>
                </StyledDialog>

        {/* ДИАЛОГ ЗАПРОСА ПЕРЕНОСА */}
        <StyledDialog open={openRescheduleRequestDialog} onClose={() => setOpenRescheduleRequestDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Запрос на перенос</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2, color: '#64748B' }}>
                    {selectedLesson?.student?.fullName} • {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)}
                </Typography>
                <DatePicker 
                    label="Желаемая дата" 
                    value={rescheduleRequestDate} 
                    onChange={(d) => setRescheduleRequestDate(d)}
                    minDate={new Date()}
                    slotProps={{ textField: { fullWidth: true, sx: { mb: 2 } } }}
                />
                <TextField 
                    fullWidth 
                    label="Желаемое время" 
                    type="time" 
                    value={rescheduleRequestTime}
                    onChange={(e) => setRescheduleRequestTime(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpenRescheduleRequestDialog(false)}>Назад</Button>
                <Button 
                    variant="contained" 
                    onClick={async () => {
                        try {
                            await axiosInstance.post(`/lessons/${selectedLesson.id}/request-reschedule`, {
                                desiredDate: rescheduleRequestDate ? format(rescheduleRequestDate, 'yyyy-MM-dd') : null,
                                desiredTime: rescheduleRequestTime || null,
                            });
                            onShowSnackbar?.('📩 Запрос на перенос отправлен', 'success');
                            setOpenRescheduleRequestDialog(false);
                            setRescheduleRequestDate(null);
                            setRescheduleRequestTime('');
                            setOpenLessonDetails(false);
                        } catch (err) {
                            onShowSnackbar?.('Ошибка', 'error');
                        }
                    }}
                    sx={{ bgcolor: '#4F46E5' }}
                >
                    Отправить
                </Button>
            </DialogActions>
        </StyledDialog>

        {/* ДИАЛОГ ЗАПРОСА ОТМЕНЫ */}
        <StyledDialog open={openCancelRequestDialog} onClose={() => setOpenCancelRequestDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>Запрос на отмену урока</DialogTitle>
            <DialogContent>
                <Typography sx={{ mb: 2, color: '#64748B' }}>
                    {selectedLesson?.student?.fullName} • {formatLessonTime(selectedLesson?.lessonDate, selectedLesson?.startTime)}
                </Typography>
                <TextField 
                    fullWidth 
                    label="Причина отмены" 
                    multiline 
                    rows={3} 
                    value={cancelRequestReason}
                    onChange={(e) => setCancelRequestReason(e.target.value)}
                    placeholder="Например: ученик заболел"
                />
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={() => setOpenCancelRequestDialog(false)}>Назад</Button>
                <Button 
                    variant="contained" 
                    color="error"
                    onClick={async () => {
                        try {
                            await axiosInstance.post(`/lessons/${selectedLesson.id}/request-cancel`, {
                                reason: cancelRequestReason,
                            });
                            onShowSnackbar?.('📩 Запрос на отмену отправлен', 'success');
                            setOpenCancelRequestDialog(false);
                            setCancelRequestReason('');
                            setOpenLessonDetails(false);
                        } catch (err) {
                            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
                        }
                    }}
                    sx={{ borderRadius: 2 }}
                >
                    Отправить запрос
                </Button>
            </DialogActions>
        </StyledDialog>
    </>);
}

export default UnifiedSchedule;