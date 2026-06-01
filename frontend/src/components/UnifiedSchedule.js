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
    Edit, Delete, Work as WorkIcon, Add as AddIcon,
    Refresh as RefreshIcon, FilterList as FilterIcon,
    Today as TodayIcon, ChevronLeft, ChevronRight,
    Person as PersonIcon, Payments as PaymentsIcon
} from '@mui/icons-material';
import { formatLessonTime, getLocalHoursMinutes } from '../utils/timezone';
import { format, addMinutes, parse, startOfWeek, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import axiosInstance from '../api/axiosConfig';
import { replaceCancelledWithResurrect } from '../services/api';
import { getAllLessons } from '../services/api';

// ========== КОНСТАНТЫ ==========
const HOUR_HEIGHT = 48; // Высота одного часа в пикселях
const MIN_STEP = 15;    // Минимальный шаг в минутах
const START_HOUR = 8;   // Начало сетки
const END_HOUR = 27;    // Конец сетки

const DENSITY = {
    compact: { step: 30, height: HOUR_HEIGHT / 2 },   // 30 мин = 24px
    comfortable: { step: 15, height: HOUR_HEIGHT / 4 }, // 15 мин = 12px
};

const STATUS_COLORS = {
    SCHEDULED:   { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF', label: 'Запланировано' },
    COMPLETED:   { bg: '#FFFBEB', text: '#92400E', dot: '#F59E0B', label: 'Проведено' },
    PAID:        { bg: '#ECFDF5', text: '#065F46', dot: '#10B981', label: 'Оплачено' },
    RESCHEDULED: { bg: '#EFF6FF', text: '#1E40AF', dot: '#3B82F6', label: 'Перенесено' },
    CANCELLED:   { bg: '#FEF2F2', text: '#991B1B', dot: '#EF4444', label: 'Отменено' },
    TRIAL:       { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6', label: 'Пробное' },
    SINGLE:      { bg: '#F5F3FF', text: '#5B21B6', dot: '#8B5CF6', label: 'Разовое' },
};

const WEEKDAYS = ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'];

// ========== УТИЛИТЫ ==========
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

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========
const SchedulePaper = styled(Paper)({
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06)',
    backgroundColor: '#FFFFFF',
    border: '1px solid #F3F4F6',
});

const DayHeader = styled(Box)(({ isToday }) => ({
    flex: 1,
    textAlign: 'center',
    padding: '12px 8px',
    borderLeft: '1px solid #F3F4F6',
    backgroundColor: isToday ? '#EEF2FF' : '#FAFBFC',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    '&:hover': { backgroundColor: isToday ? '#E0E7FF' : '#F3F4F6' },
}));

const TimeLabel = styled(Box)({
    width: 56,
    flexShrink: 0,
    paddingRight: 8,
    textAlign: 'right',
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: 500,
});

const LessonBlock = styled(Box)(({ statusStyle, isCompact }) => ({
    position: 'absolute',
    left: 3,
    right: 3,
    zIndex: 5,
    backgroundColor: statusStyle.bg,
    borderLeft: `3px solid ${statusStyle.dot}`,
    borderRadius: isCompact ? '4px' : '8px',
    padding: isCompact ? '2px 5px' : '6px 8px',
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.15s ease',
    '&:hover': { 
        zIndex: 10,
        boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
        transform: 'scale(1.01)',
    },
}));

const HoverSlot = styled(Box)({
    position: 'absolute',
    left: 3,
    right: 3,
    backgroundColor: 'rgba(79, 70, 229, 0.10)',
    border: '2px dashed rgba(79, 70, 229, 0.35)',
    borderRadius: '8px',
    pointerEvents: 'none',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
});

const StyledDialog = styled(Dialog)({
    '& .MuiDialog-paper': {
        borderRadius: '20px',
        boxShadow: '0 25px 50px rgba(0,0,0,0.15)',
        overflow: 'hidden',
    },
});

const StyledMenu = styled(Menu)({
    '& .MuiPaper-root': {
        borderRadius: '12px',
        boxShadow: '0 12px 30px rgba(0,0,0,0.12)',
        minWidth: 220,
    },
});

const StyledButton = styled(Button)({
    borderRadius: '10px',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
    padding: '8px 16px',
});

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function UnifiedSchedule({ 
    weekDates, lessons, students, courses, debtors, user, 
    onRefresh, onShowSnackbar, onOpenResurrect,
    getStudentRateForTutor, templates, onAddClick,
    onEditTemplate, onDeleteTemplate, onDeleteLesson,
}) {
    // Состояния
    const [groups, setGroups] = useState([]);
    const [density, setDensity] = useState('comfortable');
    
    // Загрузка активных групп
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
    
    // Состояния диалогов
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openReplaceDialog, setOpenReplaceDialog] = useState(false);
    const [openMobileDay, setOpenMobileDay] = useState(null);
    
    // Формы
    const [createForm, setCreateForm] = useState({ 
        date: '', startTime: '', duration: 60, studentId: '', courseId: '', 
        isTrial: false, trialName: '', trialEmail: '', trialPrice: 0,
        isTemplate: false, groupId: ''
    });
    const [editForm, setEditForm] = useState({ startTime: '', duration: 60, courseId: '', applyToAll: false });    const [cancelledLesson, setCancelledLesson] = useState(null);
    const [selectedDebtorId, setSelectedDebtorId] = useState('');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    // Отслеживание размера экрана
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Генерация временных слотов
    const timeSlots = useMemo(() => {
        const slots = [];
        const step = DENSITY[density].step;
        for (let h = START_HOUR; h <= END_HOUR; h++) {
            for (let m = 0; m < 60; m += step) {
                const displayHour = h % 24;
                slots.push({
                    key: `${h}:${m}`,
                    display: `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
                    hour: h,
                    minute: m,
                });
            }
        }
        return slots;
    }, [density]);

    // Позиционирование урока
    const timeToPosition = useCallback((lesson) => {
        if (!lesson) return 0;
        const slotHeight = DENSITY[density].height;
        const { hours, minutes } = getLocalHoursMinutes(lesson.lessonDate, lesson.startTime);
        // Если урок после полуночи (0-7), отображаем как "хвост" предыдущего дня (добавляем 24 часа)
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
        // Ограничиваем диапазоном сетки
        h = Math.max(START_HOUR, Math.min(END_HOUR, h));
        // Возвращаем часы 0-23 для создания урока
        const displayHour = h % 24;
        return `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    }, [density]);

    // Получение уроков на день
    const getLessonsForDate = useCallback((date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const nextDateStr = format(addDays(date, 1), 'yyyy-MM-dd');
        
        return lessons.filter(l => {
            // Уроки этого дня
            if (l.lessonDate === dateStr) return true;
            
            // Уроки следующего дня, которые начинаются в ночные часы (0-7)
            // Они должны отображаться как "хвост" текущего дня
            if (l.lessonDate === nextDateStr) {
                const { hours } = getLocalHoursMinutes(l.lessonDate, l.startTime);
                return hours < START_HOUR;
            }
            
            return false;
        });
    }, [lessons]);

    // Проверка конфликтов времени
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
            
            // Проверка пересечения: новый урок начинается до конца существующего И заканчивается после начала существующего
            return newStartMinutes < lEndMinutes && newEndMinutes > lStartMinutes;
        });
    }, [getLessonsForDate]);

    // Расчёт дохода за день
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

    // ========== ОБРАБОТЧИКИ ==========
    const handleSlotClick = (date, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const startTime = positionToTime(y);
        
        // Если кликнули в ночную зону (часы 0-7), урок должен быть на следующий день
        const [h] = startTime.split(':').map(Number);
        const isNightSlot = y > (END_HOUR - 3) * (DENSITY[density].height * (60 / DENSITY[density].step));
        
        let lessonDate;
        if (isNightSlot) {
            lessonDate = addDays(date, 1);
        } else {
            lessonDate = date;
        }
        
        const dateStr = format(lessonDate, 'yyyy-MM-dd');

        if (checkTimeConflict(lessonDate, startTime, 60)) {
            onShowSnackbar?.('❌ Это время занято', 'error');
            return;
        }
        setCreateForm({ 
            date: dateStr, startTime, duration: 60, 
            studentId: '', courseId: '', isTrial: false, trialName: '', trialPrice: 0, groupId: ''
        });
        setOpenCreateDialog(true);
    };

    const handleLessonClick = (e, lesson) => {
        e.stopPropagation();
        setAnchorEl(e.currentTarget);
        setSelectedLesson(lesson);
    };

    const handleEditLesson = () => {
        if (selectedLesson) {
            const { hours, minutes } = getLocalHoursMinutes(selectedLesson.lessonDate, selectedLesson.startTime);
            const localTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
            
            setEditForm({
                startTime: localTime,
                duration: selectedLesson.duration || 60,
                courseId: selectedLesson.course?.id || '',
                applyToAll: false
            });
            setOpenEditDialog(true);
        }
        setAnchorEl(null);
    };

    const handleDeleteLesson = async () => {
        if (!selectedLesson) return;
        if (!window.confirm('Удалить занятие?')) return;
        try {
            await axiosInstance.delete(`/lessons/${selectedLesson.id}`);
            onShowSnackbar?.('✅ Занятие удалено', 'success');
            onRefresh?.();
        } catch (err) { 
            onShowSnackbar?.('Ошибка при удалении', 'error'); 
        }
        setAnchorEl(null);
    };

    const handleSaveCreate = async () => {
        if (!createForm.studentId && !createForm.groupId) { 
            onShowSnackbar?.('Выберите ученика или группу', 'error'); 
            return; 
        }

        try {
            if (createForm.isTemplate) {
                // ✅ Создаём ШАБЛОН
                const dayOfWeek = new Date(createForm.date + 'T00:00:00').getDay();
                const dayMapping = [7, 1, 2, 3, 4, 5, 6];
                const mappedDay = dayMapping[dayOfWeek];
                
                if (createForm.groupId) {
                    // Шаблон для группы — создаём уроки для всех учеников
                    await axiosInstance.post('/lessons', {
                        tutorId: user.id,
                        groupId: createForm.groupId,
                        lessonDate: createForm.date,
                        startTime: createForm.startTime + ':00',
                        endTime: addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration).toTimeString().slice(0, 8),
                        duration: createForm.duration,
                        courseId: createForm.courseId || null,
                    });
                    onShowSnackbar?.('✅ Групповое занятие создано', 'success');
                } else {
                    await axiosInstance.post('/weekly-template', {
                        tutorId: user.id,
                        studentId: parseInt(createForm.studentId),
                        courseId: createForm.courseId || null,
                        dayOfWeek: mappedDay,
                        startTime: createForm.startTime + ':00',
                        endTime: addMinutes(parse(createForm.startTime, 'HH:mm', new Date()), createForm.duration).toTimeString().slice(0, 8)
                    });
                    onShowSnackbar?.('✅ Шаблон создан, уроки сгенерированы на 4 недели', 'success');
                }
            }
            
            setOpenCreateDialog(false);
            setCreateForm({ 
                date: '', startTime: '', duration: 60, studentId: '', courseId: '', 
                isTrial: false, trialName: '', trialPrice: 0, isTemplate: false, groupId: ''
            });
            onRefresh?.();
        } catch (err) { 
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); 
        }
    };
    const getFutureTemplateDates = (lesson) => {
        if (!lesson.weeklyTemplateId) return [];
        
        const dates = [];
        // Создаём Date объект из строки
        const startDate = new Date(lesson.lessonDate + 'T00:00:00');
        let currentDate = addDays(startDate, 7);
        const endDate = addDays(new Date(), 28); // 4 недели вперёд
        
        while (currentDate <= endDate) {
            dates.push(currentDate);
            currentDate = addDays(currentDate, 7);
        }
        
        return dates;
    };
    const getDayOfWeekFromDate = (dateStr) => {
        // Конвертируем дату в день недели (1=ПН, 7=ВС)
        const date = parse(dateStr, 'yyyy-MM-dd', new Date());
        const jsDay = date.getDay(); // 0=ВС, 1=ПН...
        const mapping = [7, 1, 2, 3, 4, 5, 6];
        return mapping[jsDay];
    };

    const handleSaveEdit = async () => {
        if (!selectedLesson) return;
        
        const lessonDate = parse(selectedLesson.lessonDate, 'yyyy-MM-dd', new Date());
        
        // Проверяем конфликт для этого урока
        if (checkTimeConflict(lessonDate, editForm.startTime, editForm.duration, selectedLesson.id)) {
            onShowSnackbar?.('❌ Новое время занято другим уроком', 'error');
            return;
        }
        
        // Если урок из шаблона — проверяем все будущие уроки
        if (selectedLesson.weeklyTemplateId && editForm.applyToAll) {
            const futureDates = getFutureTemplateDates(selectedLesson);
            for (const futureDate of futureDates) {
                if (checkTimeConflict(new Date(futureDate), editForm.startTime, editForm.duration)) {
                    onShowSnackbar?.('❌ Найдены конфликты в будущих уроках', 'error');
                    return;
                }
            }
        }
        
        try {
            // Конвертируем локальное время в UTC (UTC+7 → UTC)
            const [hours, minutes] = editForm.startTime.split(':').map(Number);
            let utcHours = hours - 7;
            if (utcHours < 0) utcHours += 24;
            const utcStartTime = `${utcHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
            
            const endMinutes = hours * 60 + minutes + editForm.duration;
            let endHours = Math.floor(endMinutes / 60) - 7;
            if (endHours < 0) endHours += 24;
            const endMins = endMinutes % 60;
            const utcEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}:00`;
            
            if (selectedLesson.weeklyTemplateId && editForm.applyToAll) {
                // Для шаблона НЕ конвертируем — бэкенд сам разберётся с часовым поясом
                const endTimeLocal = addMinutes(parse(editForm.startTime, 'HH:mm', new Date()), editForm.duration);
                await axiosInstance.put(`/weekly-template/${selectedLesson.weeklyTemplateId}`, {
                    studentId: selectedLesson.student?.id,
                    courseId: editForm.courseId || null,
                    dayOfWeek: getDayOfWeekFromDate(selectedLesson.lessonDate),
                    startTime: editForm.startTime + ':00',
                    endTime: format(endTimeLocal, 'HH:mm:ss')
                });
                onShowSnackbar?.('✅ Шаблон и все будущие уроки обновлены', 'success');
            } else {
                // Обновляем только этот урок
                await axiosInstance.put(`/lessons/${selectedLesson.id}`, {
                    startTime: utcStartTime,
                    endTime: utcEndTime,
                    duration: editForm.duration,
                    courseId: editForm.courseId || null
                });
                onShowSnackbar?.('✅ Занятие перенесено', 'success');
            }
            
            setOpenEditDialog(false);
            setSelectedLesson(null);
            onRefresh?.();
        } catch (err) { 
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); 
        }
    };

    const handleReplaceClick = (lesson) => {
        setCancelledLesson(lesson);
        setSelectedDebtorId('');
        setOpenReplaceDialog(true);
        setAnchorEl(null);
    };

    const handleConfirmReplace = async () => {
        if (!cancelledLesson || !selectedDebtorId) return;
        try {
            await replaceCancelledWithResurrect(cancelledLesson.id, parseInt(selectedDebtorId));
            onShowSnackbar?.('✅ Урок заменён на отработку долга', 'success');
            setOpenReplaceDialog(false);
            setCancelledLesson(null);
            onRefresh?.();
        } catch (err) {
            onShowSnackbar?.('Ошибка: ' + (err.response?.data?.error || err.message), 'error');
        }
    };

    const handleDayClick = (date) => {
        if (isMobile) {
            const dayLessons = getLessonsForDate(date);
            setOpenMobileDay({ date, lessons: dayLessons });
        }
    };

    // ========== РЕНДЕР ==========
    const renderDayColumn = (date, dayIdx) => {
        const dayLessons = getLessonsForDate(date);
        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
        const slotHeight = DENSITY[density].height;

        return (
            <Box
                key={dayIdx}
                sx={{ 
                    flex: 1, position: 'relative', 
                    borderLeft: '1px solid #F3F4F6', 
                    minHeight: timeSlots.length * slotHeight, 
                    cursor: 'pointer',
                    backgroundColor: isToday ? '#FAFBFF' : '#FFFFFF',
                }}
                onClick={(e) => handleSlotClick(date, e)}
                onMouseMove={(e) => {
                    if (isMobile) return;
                    const rect = e.currentTarget.getBoundingClientRect();
                    const y = e.clientY - rect.top;
                    const startTime = positionToTime(y);
                    setHoverSlot({ date, startTime, duration: 60 });
                }}
                onMouseLeave={() => setHoverSlot(null)}
            >
                {/* Фоновые линии */}
                {timeSlots.map((slot, idx) => {
                    const isNight = slot.hour >= 24;
                    const isHour = idx % (60 / DENSITY[density].step) === 0;
                    return (
                        <Box key={idx} sx={{ 
                            height: slotHeight, 
                            borderBottom: isHour ? '1px solid #E5E7EB' : '1px solid #F9FAFB',
                            backgroundColor: isNight ? 'rgba(0,0,0,0.015)' : 'transparent',
                        }} />
                    );
                })}

                {/* Ховер-слот */}
                {!isMobile && hoverSlot && format(hoverSlot.date, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd') && (() => {
                    // Вычисляем позицию для ховера
                    const [h, m] = hoverSlot.startTime.split(':').map(Number);
                    const adjustedHour = h < START_HOUR ? h + 24 : h;
                    const totalMinutes = (adjustedHour - START_HOUR) * 60 + m;
                    const top = (totalMinutes / DENSITY[density].step) * slotHeight;
                    const height = (hoverSlot.duration / DENSITY[density].step) * slotHeight;
                    
                    return (
                        <HoverSlot sx={{ top, height }}>
                            <Typography sx={{ 
                                color: '#4F46E5', fontWeight: 600, fontSize: density === 'compact' ? '11px' : '13px',
                            }}>
                                + {hoverSlot.startTime}
                            </Typography>
                        </HoverSlot>
                    );
                })()}

                {/* Блоки занятий */}
                {dayLessons.map(lesson => {
                    const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                    if (lesson.isTrial) Object.assign(statusStyle, STATUS_COLORS.TRIAL);
                    const top = timeToPosition(lesson);
                    const height = ((lesson.duration || 60) / DENSITY[density].step) * slotHeight;
                    const isCompact = density === 'compact';
                    
                    return (
                        <LessonBlock
                            key={lesson.id}
                            statusStyle={statusStyle}
                            isCompact={isCompact}
                            sx={{ top, height: Math.max(height, slotHeight) }}
                            onClick={(e) => handleLessonClick(e, lesson)}
                        >
                            <Typography sx={{ 
                                fontWeight: 600, 
                                fontSize: isCompact ? '10px' : '12px', 
                                color: statusStyle.text,
                                lineHeight: 1.2,
                            }}>
                                {lesson.groupId 
                                    ? `👥 ${groups.find(g => g.id === lesson.groupId)?.name || 'Группа'}`
                                    : (lesson.student?.fullName || 'Пробное')}
                            </Typography>
                            {lesson.groupId && !isCompact && (
                                <Typography sx={{ fontSize: '9px', color: '#6B7280' }}>
                                    {lesson.student?.fullName}
                                </Typography>
                            )}
                            {!isCompact && (
                                <>
                                    <Typography sx={{ fontSize: '10px', color: '#6B7280' }}>
                                        {formatLessonTime(lesson.lessonDate, lesson.startTime)} ({lesson.duration || 60} мин)
                                    </Typography>
                                    {lesson.course && (
                                        <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>
                                            {lesson.course.name}
                                        </Typography>
                                    )}
                                </>
                            )}
                            {isCompact && (
                                <Typography sx={{ fontSize: '9px', color: '#6B7280' }}>
                                    {formatLessonTime(lesson.lessonDate, lesson.startTime)}
                                </Typography>
                            )}
                        </LessonBlock>
                    );
                })}
            </Box>
        );
    };

    // ========== МОБИЛЬНЫЙ ВИД ==========
    if (isMobile) {
        return (
            <>
                {/* Заголовок с неделей */}
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#1F2937' }}>
                            Расписание
                        </Typography>
                        <StyledButton
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => {
                                setCreateForm({ 
                                    date: format(new Date(), 'yyyy-MM-dd'), 
                                    startTime: '10:00', duration: 60, 
                                    studentId: '', courseId: '', isTrial: false, trialName: '', trialPrice: 0 
                                });
                                setOpenCreateDialog(true);
                            }}
                            sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                        >
                            Занятие
                        </StyledButton>
                    </Box>

                    {/* Быстрая прокрутка дней */}
                    <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
                        {weekDates.map((date, idx) => {
                            const dayLessons = getLessonsForDate(date);
                            const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                            const income = getDailyIncome(date);
                            return (
                                <Paper
                                    key={idx}
                                    onClick={() => handleDayClick(date)}
                                    sx={{
                                        minWidth: 52, py: 1, px: 1.5, textAlign: 'center',
                                        borderRadius: '12px', cursor: 'pointer',
                                        bgcolor: isToday ? '#4F46E5' : dayLessons.length > 0 ? '#F9FAFB' : '#FFFFFF',
                                        color: isToday ? '#FFFFFF' : '#1F2937',
                                        border: isToday ? 'none' : '1px solid #E5E7EB',
                                        transition: 'all 0.15s',
                                        '&:active': { opacity: 0.7 },
                                    }}
                                >
                                    <Typography sx={{ fontSize: '11px', fontWeight: 500 }}>
                                        {WEEKDAYS[idx]}
                                    </Typography>
                                    <Typography sx={{ fontSize: '15px', fontWeight: 700 }}>
                                        {format(date, 'd')}
                                    </Typography>
                                    {dayLessons.length > 0 && (
                                        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.3, mt: 0.3 }}>
                                            {dayLessons.slice(0, 3).map((l, i) => {
                                                const s = STATUS_COLORS[l.status] || STATUS_COLORS.SCHEDULED;
                                                return <Box key={i} sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: s.dot }} />;
                                            })}
                                        </Box>
                                    )}
                                    {income > 0 && (
                                        <Typography sx={{ fontSize: '9px', color: isToday ? '#D1FAE5' : '#10B981', fontWeight: 600, mt: 0.2 }}>
                                            +{income}₽
                                        </Typography>
                                    )}
                                </Paper>
                            );
                        })}
                    </Box>
                </Box>

                {/* Список уроков на выбранный день */}
                {!openMobileDay && (
                    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px', bgcolor: '#F9FAFB' }}>
                        <TodayIcon sx={{ fontSize: 48, color: '#D1D5DB', mb: 2 }} />
                        <Typography sx={{ color: '#9CA3AF', fontSize: '15px' }}>
                            Выберите день для просмотра занятий
                        </Typography>
                    </Paper>
                )}

                {/* Bottom sheet с уроками дня */}
                <Drawer 
                    anchor="bottom" 
                    open={!!openMobileDay} 
                    onClose={() => setOpenMobileDay(null)}
                    PaperProps={{ sx: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '75vh' } }}
                >
                    <Box sx={{ p: 2 }}>
                        <Box sx={{ width: 40, height: 4, bgcolor: '#E5E7EB', borderRadius: 2, mx: 'auto', mb: 2 }} />
                        {openMobileDay && (
                            <>
                                <Typography sx={{ fontWeight: 700, fontSize: '18px', mb: 2 }}>
                                    {format(openMobileDay.date, 'EEEE, d MMMM', { locale: ru })}
                                </Typography>
                                {openMobileDay.lessons.length === 0 ? (
                                    <Box sx={{ textAlign: 'center', py: 4 }}>
                                        <Typography color="textSecondary">Нет занятий</Typography>
                                        <StyledButton
                                            variant="outlined"
                                            size="small"
                                            startIcon={<AddIcon />}
                                            onClick={() => {
                                                setCreateForm({
                                                    date: format(openMobileDay.date, 'yyyy-MM-dd'),
                                                    startTime: '10:00', duration: 60,
                                                    studentId: '', courseId: '', isTrial: false, trialName: '', trialPrice: 0
                                                });
                                                setOpenCreateDialog(true);
                                            }}
                                            sx={{ mt: 2 }}
                                        >
                                            Добавить занятие
                                        </StyledButton>
                                    </Box>
                                ) : (
                                    openMobileDay.lessons
                                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                                        .map(lesson => {
                                            const statusStyle = STATUS_COLORS[lesson.status] || STATUS_COLORS.SCHEDULED;
                                            if (lesson.isTrial) Object.assign(statusStyle, STATUS_COLORS.TRIAL);
                                            const studentRate = getStudentRateForTutor?.(lesson.student, user?.id);
                                            return (
                                                <Paper 
                                                    key={lesson.id} 
                                                    sx={{ 
                                                        p: 2, mb: 1.5, borderRadius: '14px', 
                                                        borderLeft: `4px solid ${statusStyle.dot}`, 
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                                                        '&:active': { bgcolor: '#F9FAFB' },
                                                    }}
                                                    onClick={(e) => handleLessonClick(e, lesson)}
                                                >
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                        <Box sx={{ flex: 1 }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                                <Typography sx={{ fontWeight: 600, fontSize: '16px' }}>
                                                                    {formatLessonTime(lesson.lessonDate, lesson.startTime)} – {formatLessonTime(lesson.lessonDate, lesson.endTime)}
                                                                </Typography>
                                                                <Chip label={statusStyle.label} size="small"
                                                                    sx={{ fontSize: '10px', height: 20, bgcolor: statusStyle.bg, color: statusStyle.text }} />
                                                            </Box>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                                <Avatar sx={{ width: 24, height: 24, bgcolor: getAvatarColor(lesson.student?.fullName), fontSize: 11 }}>
                                                                    {getInitials(lesson.student?.fullName)}
                                                                </Avatar>
                                                                <Typography sx={{ fontWeight: 500, fontSize: '14px' }}>
                                                                    {lesson.student?.fullName || 'Пробное'}
                                                                </Typography>
                                                            </Box>
                                                            {lesson.course && (
                                                                <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 0.3 }}>
                                                                    {lesson.course.name} • {lesson.duration || 60} мин
                                                                </Typography>
                                                            )}
                                                            {studentRate && lesson.status !== 'CANCELLED' && (
                                                                <Typography sx={{ fontSize: '15px', fontWeight: 600, color: '#10B981', mt: 0.5 }}>
                                                                    {studentRate} ₽
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        <IconButton 
                                                            size="small" 
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setSelectedLesson(lesson);
                                                                handleDeleteLesson(); 
                                                            }} 
                                                            sx={{ color: '#EF4444' }}
                                                        >
                                                            <Delete sx={{ fontSize: 18 }} />
                                                        </IconButton>
                                                    </Box>
                                                </Paper>
                                            );
                                        })
                                )}
                            </>
                        )}
                    </Box>
                </Drawer>
            </>
        );
    }

    // ========== ДЕСКТОПНЫЙ ВИД ==========
    return (
        <>
            {/* Хедер с действиями */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '22px', fontWeight: 700, color: '#1F2937' }}>
                        Расписание
                    </Typography>
                    <Chip 
                        label={`${lessons.filter(l => l.status === 'SCHEDULED').length} занятий`} 
                        size="small" 
                        sx={{ bgcolor: '#EEF2FF', color: '#4F46E5', fontWeight: 500, borderRadius: '8px' }} 
                    />
                    {debtors?.length > 0 && (
                        <Chip 
                            icon={<WorkIcon sx={{ fontSize: 14 }} />}
                            label={`${debtors.length} должников`} 
                            size="small" 
                            sx={{ bgcolor: '#FFFBEB', color: '#92400E', fontWeight: 500, borderRadius: '8px' }}
                            onClick={() => debtors[0] && onOpenResurrect?.(debtors[0])}
                        />
                    )}
                </Box>

                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {/* Переключатель плотности */}
                    <Box sx={{ 
                        display: 'flex', bgcolor: '#F3F4F6', borderRadius: '10px', p: 0.5, gap: 0.5 
                    }}>
                        {[
                            { value: 'compact', icon: '📋', label: 'Компактно' },
                            { value: 'comfortable', icon: '📅', label: 'Детально' },
                        ].map(opt => (
                            <Button
                                key={opt.value}
                                size="small"
                                onClick={() => setDensity(opt.value)}
                                sx={{
                                    px: 1.5, py: 0.5, borderRadius: '8px', textTransform: 'none',
                                    fontSize: '12px', fontWeight: 500, minWidth: 'auto',
                                    bgcolor: density === opt.value ? '#FFFFFF' : 'transparent',
                                    color: density === opt.value ? '#1F2937' : '#6B7280',
                                    boxShadow: density === opt.value ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                                    '&:hover': { bgcolor: density === opt.value ? '#FFFFFF' : '#E5E7EB' },
                                }}
                            >
                                {opt.icon} {opt.label}
                            </Button>
                        ))}
                    </Box>
                </Box>
            </Box>

            {/* Блок должников */}
            {debtors?.length > 0 && (
                <Paper sx={{ p: 2, mb: 2, borderRadius: '12px', bgcolor: '#FFFBEB', border: '1px solid #FDE68A', boxShadow: 'none' }}>
                    <Typography sx={{ fontWeight: 600, mb: 1.5, color: '#92400E', fontSize: '14px', display: 'flex', alignItems: 'center', gap: 1 }}>
                        ⚠️ Должники ({debtors.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                        {debtors.map(student => (
                            <Chip
                                key={student.id}
                                avatar={<Avatar sx={{ bgcolor: getAvatarColor(student.fullName) }}>{getInitials(student.fullName)}</Avatar>}
                                label={`${student.fullName} (${student.debtLessons || '?'})`}
                                onClick={() => onOpenResurrect?.(student)}
                                sx={{ 
                                    bgcolor: '#FFFFFF', border: '1px solid #FDE68A',
                                    fontWeight: 500, cursor: 'pointer', '&:hover': { bgcolor: '#FEF3C7' },
                                }}
                            />
                        ))}
                    </Box>
                </Paper>
            )}

            {/* Календарная сетка */}
            <SchedulePaper elevation={0}>
                {/* Заголовки дней */}
                <Box sx={{ display: 'flex', borderBottom: '1px solid #E5E7EB' }}>
                    <Box sx={{ width: 56, flexShrink: 0 }} />
                    {weekDates.map((date, idx) => {
                        const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                        const income = getDailyIncome(date);
                        return (
                            <DayHeader key={idx} isToday={isToday} onClick={() => handleDayClick(date)}>
                                <Typography sx={{ fontWeight: 600, fontSize: '13px', color: isToday ? '#4F46E5' : '#374151' }}>
                                    {WEEKDAYS[idx]}
                                </Typography>
                                <Typography sx={{ fontSize: '12px', color: isToday ? '#4F46E5' : '#6B7280', fontWeight: isToday ? 600 : 400 }}>
                                    {format(date, 'd MMM', { locale: ru })}
                                </Typography>
                                {income > 0 && (
                                    <Typography sx={{ fontSize: '11px', color: '#10B981', fontWeight: 600, mt: 0.3 }}>
                                        +{income} ₽
                                    </Typography>
                                )}
                            </DayHeader>
                        );
                    })}
                </Box>

                {/* Сетка времени */}
                <Box sx={{ display: 'flex', position: 'relative' }}>
                    {/* Шкала времени */}
                    <Box sx={{ width: 56, flexShrink: 0 }}>
                        {timeSlots.map((slot, idx) => {
                            const hourSlot = idx % (60 / DENSITY[density].step) === 0;
                            const isNight = slot.hour >= 24;
                            return (
                                <TimeLabel key={`${slot.hour}:${slot.minute}`} sx={{ 
                                    height: DENSITY[density].height, 
                                    borderBottom: hourSlot ? '1px solid #E5E7EB' : '1px solid #F9FAFB',
                                    backgroundColor: isNight ? 'rgba(0,0,0,0.02)' : 'transparent',
                                }}>
                                    {hourSlot && (
                                        <Typography variant="caption" sx={{ 
                                            position: 'absolute', top: -8, right: 4, 
                                            fontWeight: 500, 
                                            color: isNight ? '#9CA3AF' : '#9CA3AF', 
                                            fontSize: '10px',
                                        }}>
                                            {slot.display}
                                        </Typography>
                                    )}
                                </TimeLabel>
                            );
                        })}
                    </Box>

                    {/* Колонки дней */}
                    {weekDates.map((date, dayIdx) => renderDayColumn(date, dayIdx))}
                </Box>
            </SchedulePaper>

            {/* ========== ДИАЛОГ СОЗДАНИЯ УРОКА ========== */}
            <StyledDialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth
                PaperProps={{ sx: { borderRadius: '20px', overflow: 'hidden' } }}>
                
                {/* Шапка */}
                <Box sx={{ 
                    background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                    p: 3, color: '#fff'
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ 
                            width: 44, height: 44, borderRadius: '14px', 
                            bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', 
                            alignItems: 'center', justifyContent: 'center' 
                        }}>
                            <AddIcon sx={{ color: '#fff' }} />
                        </Box>
                        <Box>
                            <Typography sx={{ fontSize: '20px', fontWeight: 700 }}>
                                Добавить занятие
                            </Typography>
                            <Typography sx={{ fontSize: '13px', opacity: 0.85 }}>
                                {createForm.date}, {createForm.startTime}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <DialogContent sx={{ p: 3 }}>
                    <Stack spacing={2.5}>
                        {/* ✅ Переключатель: разовое / шаблон */}
                        <Paper sx={{ p: 1, borderRadius: '10px', bgcolor: '#F3F4F6', display: 'flex', gap: 0.5 }}>
                            {[
                                { value: false, label: '📅 Разовое', desc: 'Один урок' },
                                { value: true, label: '🔁 Шаблон', desc: 'Каждую неделю' },
                            ].map(opt => (
                                <Button
                                    key={opt.value}
                                    fullWidth
                                    size="small"
                                    onClick={() => setCreateForm({ ...createForm, isTemplate: opt.value })}
                                    sx={{
                                        py: 1, borderRadius: '8px', textTransform: 'none',
                                        bgcolor: createForm.isTemplate === opt.value ? '#FFFFFF' : 'transparent',
                                        color: createForm.isTemplate === opt.value ? '#1F2937' : '#6B7280',
                                        boxShadow: createForm.isTemplate === opt.value ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        '&:hover': { bgcolor: '#FFFFFF' },
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{ fontWeight: 600, fontSize: '13px' }}>{opt.label}</Typography>
                                        <Typography sx={{ fontSize: '10px', color: '#9CA3AF' }}>{opt.desc}</Typography>
                                    </Box>
                                </Button>
                            ))}
                        </Paper>

                        {/* Выбор группы (если есть активные группы) */}
                        {groups.length > 0 && (
                            <FormControl fullWidth>
                                <InputLabel sx={{ fontSize: '14px' }}>Группа (все ученики группы)</InputLabel>
                                <Select 
                                    value={createForm.groupId} 
                                    onChange={(e) => {
                                        setCreateForm({ 
                                            ...createForm, 
                                            groupId: e.target.value, 
                                            studentId: '' // сбрасываем одного ученика
                                        });
                                    }}
                                    label="Группа"
                                    sx={{ borderRadius: '8px' }}
                                >
                                    <MenuItem value="">— Один ученик —</MenuItem>
                                    {groups.map(g => (
                                        <MenuItem key={g.id} value={g.id}>
                                            👥 {g.name} ({g.students?.length || 0} чел.)
                                            {g.pricePerStudent > 0 && ` — ${g.pricePerStudent}₽/чел`}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        )}

                        {/* Выбор ученика (только если не выбрана группа) */}
                        {!createForm.groupId && (
                            <Autocomplete
                                options={students}
                                getOptionLabel={(s) => `${s.fullName} (${getStudentRateForTutor?.(s, user?.id) || '—'} ₽/час)`}
                                value={students.find(s => s.id === createForm.studentId) || null}
                                onChange={(e, newValue) => setCreateForm({ ...createForm, studentId: newValue?.id || '' })}
                                renderInput={(params) => (
                                    <TextField {...params} label="Ученик" size="small"
                                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                                )}
                            />
                        )}

                        {/* Выбор предмета */}
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Предмет (необязательно)</InputLabel>
                            <Select value={createForm.courseId} onChange={(e) => setCreateForm({ ...createForm, courseId: e.target.value })} label="Предмет"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' } }}>
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>

                        {/* Длительность */}
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Длительность</InputLabel>
                            <Select value={createForm.duration} onChange={(e) => setCreateForm({ ...createForm, duration: e.target.value })} label="Длительность"
                                sx={{ borderRadius: '8px', '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' } }}>
                                <MenuItem value={30}>30 минут</MenuItem>
                                <MenuItem value={45}>45 минут</MenuItem>
                                <MenuItem value={60}>1 час</MenuItem>
                                <MenuItem value={90}>1,5 часа</MenuItem>
                                <MenuItem value={120}>2 часа</MenuItem>
                            </Select>
                        </FormControl>

                        <Alert severity="info" sx={{ borderRadius: '8px', fontSize: '13px' }}>
                            {createForm.isTemplate 
                                ? '🔁 Шаблон создаст уроки на 4 недели вперёд и будет повторяться каждую неделю.'
                                : '📅 Разовое занятие будет добавлено только на выбранную дату.'}
                        </Alert>
                    </Stack>
                </DialogContent>

                {/* Чекбокс "Применить ко всем" — только для шаблонных уроков */}
                {selectedLesson?.weeklyTemplateId && (
                    <FormControlLabel
                        control={
                            <Checkbox 
                                checked={editForm.applyToAll || false}
                                onChange={(e) => setEditForm({...editForm, applyToAll: e.target.checked})}
                            />
                        }
                        label="Применить ко всем будущим урокам"
                        sx={{ px: 3, pb: 1 }}
                    />
                )}

                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenCreateDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton 
                        onClick={handleSaveCreate} 
                        variant="contained" 
                        disabled={!createForm.studentId && !createForm.groupId}                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                        {createForm.isTemplate ? 'Создать шаблон' : 'Создать занятие'}
                    </StyledButton>
                </DialogActions>
            </StyledDialog>

            {/* Контекстное меню */}
            <StyledMenu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
                {selectedLesson?.status === 'CANCELLED' ? (
                    <MenuItem onClick={() => handleReplaceClick(selectedLesson)} sx={{ fontSize: '14px', gap: 1.5, py: 1.5 }}>
                        <WorkIcon sx={{ fontSize: 20, color: '#10B981' }} />
                        <Box>
                            <Typography sx={{ fontWeight: 500 }}>Заменить на отработку</Typography>
                            <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>Списать долг ученика</Typography>
                        </Box>
                    </MenuItem>
                ) : (
                    [
                        <MenuItem key="edit" onClick={handleEditLesson} sx={{ fontSize: '14px', gap: 1.5, py: 1.5 }}>
                            <Edit sx={{ fontSize: 20, color: '#6B7280' }} />
                            <Box>
                                <Typography sx={{ fontWeight: 500 }}>Редактировать</Typography>
                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>Время, длительность, предмет</Typography>
                            </Box>
                        </MenuItem>,
                        <MenuItem key="delete" onClick={handleDeleteLesson} sx={{ fontSize: '14px', gap: 1.5, py: 1.5 }}>
                            <Delete sx={{ fontSize: 20, color: '#EF4444' }} />
                            <Box>
                                <Typography sx={{ fontWeight: 500, color: '#EF4444' }}>Удалить</Typography>
                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>Безвозвратно удалить занятие</Typography>
                            </Box>
                        </MenuItem>
                    ]
                )}
            </StyledMenu>


            {/* ========== ДИАЛОГ РЕДАКТИРОВАНИЯ УРОКА ========== */}
            <StyledDialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', px: 3, pt: 3, pb: 1 }}>
                    Редактировать занятие
                </DialogTitle>
                <DialogContent sx={{ px: 3 }}>
                    <Box sx={{ pt: 2 }}>
                        {selectedLesson && (
                            <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 2 }}>
                                {selectedLesson.lessonDate}, {selectedLesson.student?.fullName}
                            </Typography>
                        )}
                        
                        <TextField 
                            label="Время начала" 
                            type="time" 
                            value={editForm.startTime}
                            onChange={(e) => setEditForm({...editForm, startTime: e.target.value})}
                            fullWidth 
                            sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                            InputLabelProps={{ shrink: true }} 
                            inputProps={{ step: 300 }} 
                        />
                        
                        <FormControl fullWidth sx={{ mb: 2 }}>
                            <InputLabel sx={{ fontSize: '14px' }}>Длительность</InputLabel>
                            <Select 
                                value={editForm.duration} 
                                onChange={(e) => setEditForm({...editForm, duration: e.target.value})} 
                                label="Длительность"
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value={30}>30 минут</MenuItem>
                                <MenuItem value={45}>45 минут</MenuItem>
                                <MenuItem value={60}>1 час</MenuItem>
                                <MenuItem value={90}>1,5 часа</MenuItem>
                                <MenuItem value={120}>2 часа</MenuItem>
                            </Select>
                        </FormControl>
                        
                        <FormControl fullWidth>
                            <InputLabel sx={{ fontSize: '14px' }}>Предмет</InputLabel>
                            <Select 
                                value={editForm.courseId} 
                                onChange={(e) => setEditForm({...editForm, courseId: e.target.value})} 
                                label="Предмет"
                                sx={{ borderRadius: '8px' }}
                            >
                                <MenuItem value="">— Без предмета —</MenuItem>
                                {courses.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                {/* Чекбокс "Применить ко всем" — для шаблонных уроков */}
                {selectedLesson?.weeklyTemplateId && (
                    <Box sx={{ px: 3, pb: 1 }}>
                        <FormControlLabel
                            control={
                                <Checkbox 
                                    checked={editForm.applyToAll || false}
                                    onChange={(e) => setEditForm({...editForm, applyToAll: e.target.checked})}
                                />
                            }
                            label={
                                <Box>
                                    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                                        Применить ко всем будущим урокам
                                    </Typography>
                                    <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                                        Изменит все занятия этого шаблона на 4 недели вперёд
                                    </Typography>
                                </Box>
                            }
                        />
                    </Box>
                )}
                <DialogActions sx={{ px: 3, pb: 3 }}>
                    <StyledButton onClick={() => setOpenEditDialog(false)} sx={{ color: '#6B7280' }}>Отмена</StyledButton>
                    <StyledButton 
                        onClick={handleSaveEdit} 
                        variant="contained"
                        sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}>
                        Сохранить
                    </StyledButton>
                </DialogActions>
            </StyledDialog>
        </>
    );
}


export default UnifiedSchedule;