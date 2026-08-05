// ========== frontend/src/pages/Finance.js (v3.0 — Glassmorphism + Bento Style) ==========
import React, { useState, useEffect } from 'react';
import EdSpaceLoader from '../components/EdSpaceLoader';
import {
    Box, Tabs, Tab, Typography, Paper,
    Grid, Card, CardContent, Button,
    Alert, CircularProgress, Chip,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip,
    Divider, Avatar,
    Menu, MenuItem, Fade, TextField
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import {
    Payments as PaymentsIcon,
    CardGiftcard as CardGiftcardIcon,
    Assessment as AssessmentIcon,
    Calculate as CalculateIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    Receipt as ReceiptIcon,
    Timeline as TimelineIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreVertIcon,
    CalendarToday as CalendarIcon
} from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import axiosInstance, { getAllLessons } from '../services/api';
import Payments from './Payments';
import Subscriptions from './Subscriptions';

// ========== СТИЛИ — ЖИВОЕ СТЕКЛО + BENTO ==========

// Основной контейнер с градиентным фоном
const GlassPageContainer = styled(Box)(({ theme }) => ({
    background: 'radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)',
    minHeight: '100vh',
    padding: theme.spacing(3),
    [theme.breakpoints.down('sm')]: {
        padding: theme.spacing(1.5),
    },
}));

// Glass-карточка для Hero секции
const GlassHero = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.9) 0%, rgba(16, 185, 129, 0.85) 100%)',
    backdropFilter: 'blur(10px)',
    borderRadius: '28px',
    padding: theme.spacing(4),
    color: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 25px 40px -12px rgba(79, 70, 229, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    marginBottom: theme.spacing(3),
    '&::before': {
        content: '""',
        position: 'absolute',
        top: -50,
        right: -30,
        width: 250,
        height: 250,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.1)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -70,
        left: -40,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
    },
}));

// Glass-карточка-статистика в Hero
const GlassStatCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.15)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    padding: theme.spacing(2.5),
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.25)',
    transition: 'all 0.3s ease',
    '&:hover': {
        background: 'rgba(255, 255, 255, 0.25)',
        transform: 'translateY(-4px)',
    },
}));

// Основная Bento-карточка
const BentoCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(12px)',
    borderRadius: '24px',
    padding: theme.spacing(3),
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    transition: 'all 0.3s ease',
    '&:hover': {
        boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.1)',
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
}));

// Мини-карточка для статистики
const GlassMiniCard = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    padding: theme.spacing(2),
    textAlign: 'center',
    boxShadow: 'none',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    transition: 'all 0.2s ease',
    '&:hover': {
        background: 'rgba(255, 255, 255, 0.8)',
        transform: 'translateY(-2px)',
    },
}));

// Стеклянные вкладки
const GlassTabsPaper = styled(Paper)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: '20px',
    overflow: 'hidden',
    marginBottom: theme.spacing(3),
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
}));

// Стеклянная таблица
const GlassTableContainer = styled(TableContainer)(({ theme }) => ({
    background: 'rgba(255, 255, 255, 0.5)',
    backdropFilter: 'blur(8px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    boxShadow: 'none',
    maxHeight: 400,
}));

// Стеклянный Select/DatePicker wrapper
const GlassTextField = styled(TextField)(({ theme }) => ({
    '& .MuiOutlinedInput-root': {
        borderRadius: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(8px)',
        '& fieldset': {
            borderColor: 'rgba(255, 255, 255, 0.5)',
        },
        '&:hover fieldset': {
            borderColor: 'rgba(79, 70, 229, 0.4)',
        },
        '&.Mui-focused fieldset': {
            borderColor: '#4F46E5',
            borderWidth: '1px',
        },
    },
}));

// Стеклянная кнопка
const GlassButton = styled(Button)(({ theme }) => ({
    borderRadius: '40px',
    padding: '8px 20px',
    background: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(4px)',
    color: '#4F46E5',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: 'none',
    '&:hover': {
        background: '#FFFFFF',
        boxShadow: '0 8px 20px rgba(79, 70, 229, 0.15)',
    },
}));

const GradientButton = styled(Button)(({ theme }) => ({
    borderRadius: '40px',
    padding: '8px 24px',
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    color: '#FFFFFF',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: '0 4px 14px rgba(79, 70, 229, 0.3)',
    '&:hover': {
        background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)',
        boxShadow: '0 8px 20px rgba(79, 70, 229, 0.4)',
    },
}));

// ========== TAB PANEL ==========
function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Finance() {
    const { user } = useAuth();
    useEffect(() => { document.title = 'EdSpace — Финансы'; }, []);
    const { getStudentRateForTutor } = useStudentRate();
    const [reportData, setReportData] = useState(null);
    const [reportMonth, setReportMonth] = useState(format(new Date(), 'yyyy-MM'));
    const [reportLoading, setReportLoading] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const [selectedMonth, setSelectedMonth] = useState(new Date());
    const [forecastMonth, setForecastMonth] = useState(new Date(new Date().setMonth(new Date().getMonth() + 1)));
    const [loading, setLoading] = useState(true);
    const [forecastLoading, setForecastLoading] = useState(false);
    const [error, setError] = useState(null);
    const [forecastResult, setForecastResult] = useState(null);
    const [allPayments, setAllPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [unpaidLessons, setUnpaidLessons] = useState([]);
    const [unpaidLoading, setUnpaidLoading] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    
    const [monthlyStats, setMonthlyStats] = useState({
        totalIncome: 0,
        subscriptionIncome: 0,
        singleIncome: 0,
        totalLessons: 0,
        averageRate: 0,
        paidStudents: 0,
        growth: 0
    });

    const [yearlyData, setYearlyData] = useState([]);

    useEffect(() => {
        if (user && user.id) {
            fetchFinanceData();
        }
    }, [user, selectedMonth]);

    const fetchReport = async () => {
        setReportLoading(true);
        try {
            const res = await axiosInstance.get(`/payments/report/${user.id}?month=${reportMonth}`);
            setReportData(res.data);
        } catch (err) {
            console.error('Ошибка загрузки отчёта:', err);
        } finally {
            setReportLoading(false);
        }
    };

    useEffect(() => {
        if (user && tabValue === 4) fetchReport();
    }, [user, tabValue, reportMonth]);

    const fetchUnpaidLessons = async () => {
        setUnpaidLoading(true);
        try {
            const res = await getAllLessons(user.id);
            const allLessons = res.data !== undefined ? res.data : res;
            const unpaid = allLessons.filter(l => l.status === 'COMPLETED');
            setUnpaidLessons(unpaid);
        } catch (err) { console.error('Ошибка загрузки:', err); }
        finally { setUnpaidLoading(false); }
    };

    useEffect(() => { if (user && tabValue === 1) fetchUnpaidLessons(); }, [user, tabValue]);

    const fetchFinanceData = async () => {
        if (!user || !user.id) return;
        
        try {
            setLoading(true);
            setError(null);

            const [paymentsRes, studentsRes, lessonsRes] = await Promise.all([
                axiosInstance.get(`/payments/tutor/${user.id}`),
                axiosInstance.get(`/students/tutor/${user.id}`),
                getAllLessons(user.id)
            ]);
            
            const payments = paymentsRes.data || [];
            const studentsList = studentsRes.data || [];
            const allLessons = lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes;
            
            setAllPayments(payments);
            setStudents(studentsList);

            const calcMonthIncome = (monthStart, monthEnd) => {
                const mPayments = payments.filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= monthStart && paymentDate <= monthEnd && 
                        (p.status === 'PAID' || p.status === 'CONFIRMED' || p.status === 'paid');
                });
                
                const mPaymentIncome = mPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
                
                const paidLessonIds = new Set(mPayments.map(p => p.lesson?.id).filter(id => id));
                
                const mLessonsIncome = Array.isArray(allLessons)
                    ? allLessons
                        .filter(l => {
                            const lessonDate = new Date(l.lessonDate);
                            return lessonDate >= monthStart && lessonDate <= monthEnd && 
                                l.status === 'PAID' && !paidLessonIds.has(l.id);
                        })
                        .reduce((sum, l) => {
                            const student = studentsList.find(s => s.id === l.student?.id);
                            if (!student || student.paymentType === 'subscription') return sum;
                            return sum + (getStudentRateForTutor(student, user.id) || 0);
                        }, 0)
                    : 0;
                
                return { total: mPaymentIncome + mLessonsIncome, payments: mPayments, lessonsIncome: mLessonsIncome };
            };

            const monthStart = startOfMonth(selectedMonth);
            const monthEnd = endOfMonth(selectedMonth);
            const monthData = calcMonthIncome(monthStart, monthEnd);

            let subscriptionIncome = 0;
            let singleIncome = 0;
            monthData.payments.forEach(p => {
                if (p.paymentType === 'subscription' || (p.courseName && p.courseName.includes('Абонемент'))) {
                    subscriptionIncome += p.amount || 0;
                } else {
                    singleIncome += p.amount || 0;
                }
            });
            
            const monthLessons = Array.isArray(allLessons) 
                ? allLessons.filter(l => {
                    const lessonDate = new Date(l.lessonDate);
                    return lessonDate >= monthStart && lessonDate <= monthEnd;
                }) : [];
            const paidLessonIds = new Set(monthData.payments.map(p => p.lesson?.id).filter(id => id));
            monthLessons.filter(l => l.status === 'PAID' && !paidLessonIds.has(l.id)).forEach(l => {
                const student = studentsList.find(s => s.id === l.student?.id);
                if (student?.paymentType !== 'subscription') {
                    singleIncome += (getStudentRateForTutor(student, user.id) || 0);
                }
            });

            const totalLessons = monthLessons.length;
            const activeStudents = studentsList.filter(s => getStudentRateForTutor(s, user.id) !== null);
            const averageRate = activeStudents.length > 0 
                ? activeStudents.reduce((sum, s) => sum + (getStudentRateForTutor(s, user.id) || 0), 0) / activeStudents.length 
                : 0;
            const paidStudents = [...new Set(monthData.payments.map(p => p.student?.id).filter(id => id))].length;

            const prevMonthStart = startOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
            const prevMonthEnd = endOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
            const prevData = calcMonthIncome(prevMonthStart, prevMonthEnd);
            const growth = prevData.total > 0 ? ((monthData.total - prevData.total) / prevData.total) * 100 : 0;

            setMonthlyStats({
                totalIncome: monthData.total,
                subscriptionIncome,
                singleIncome,
                totalLessons,
                averageRate,
                paidStudents,
                growth
            });

            const months = eachMonthOfInterval({
                start: subMonths(new Date(), 11),
                end: new Date()
            });
            
            const yearlyStats = months.map(month => {
                const mStart = startOfMonth(month);
                const mEnd = endOfMonth(month);
                const data = calcMonthIncome(mStart, mEnd);
                return {
                    month: format(month, 'LLLL yyyy', { locale: ru }),
                    monthShort: format(month, 'MMM', { locale: ru }),
                    total: data.total
                };
            });
            
            setYearlyData(yearlyStats);
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            setError('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const showSnackbar = (message, severity) => {
        // Используем alert как простую замену snackbar
        alert(message);
    };

    const calculateForecast = async () => {
        if (!user || !user.id) return;
        
        setForecastLoading(true);
        setForecastResult(null);

        try {
            const monthStart = startOfMonth(forecastMonth);
            const monthEnd = endOfMonth(forecastMonth);
            
            const templatesRes = await axiosInstance.get(`/weekly-template/tutor/${user.id}`);
            const templates = templatesRes.data || [];
            
            const studentTemplates = {};
            templates.forEach(t => {
                if (t.status === 'SCHEDULED') {
                    const studentId = t.student?.id;
                    if (!studentTemplates[studentId]) {
                        studentTemplates[studentId] = { student: t.student, templates: [] };
                    }
                    studentTemplates[studentId].templates.push(t);
                }
            });
            
            let totalForecast = 0;
            const dailyForecast = [];
            const daysMap = new Map();
            
            let currentDate = new Date(monthStart);
            while (currentDate <= monthEnd) {
                const dayOfWeek = currentDate.getDay() === 0 ? 7 : currentDate.getDay();
                const dateStr = format(currentDate, 'yyyy-MM-dd');
                
                let dayTotal = 0;
                const lessonsDetails = [];
                
                for (const studentId in studentTemplates) {
                    const { student, templates: studentTemplatesList } = studentTemplates[studentId];
                    const dayTemplates = studentTemplatesList.filter(t => t.dayOfWeek === dayOfWeek);
                    
                    for (const template of dayTemplates) {
                        const rate = getStudentRateForTutor(student, user.id) || 0;
                        dayTotal += rate;
                        lessonsDetails.push({
                            studentName: student?.fullName, 
                            studentId: student?.id,
                            time: `${template.startTime?.slice(0,5)}-${template.endTime?.slice(0,5)}`,
                            amount: rate, 
                            course: template.course?.name
                        });
                    }
                }
                
                if (lessonsDetails.length > 0) {
                    daysMap.set(dateStr, { date: currentDate, lessons: lessonsDetails, dayTotal });
                    totalForecast += dayTotal;
                }
                
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            const sortedDates = Array.from(daysMap.keys()).sort();
            for (const dateStr of sortedDates) {
                const dayData = daysMap.get(dateStr);
                dailyForecast.push({
                    date: dayData.date.toLocaleDateString('ru-RU'),
                    dayName: dayData.date.toLocaleDateString('ru-RU', { weekday: 'long' }),
                    lessons: dayData.lessons, 
                    dayTotal: dayData.dayTotal
                });
            }
            
            setForecastResult({
                totalForecast,
                dailyForecast,
                totalLessons: dailyForecast.reduce((sum, d) => sum + d.lessons.length, 0),
                daysWithLessons: dailyForecast.length
            });
            
        } catch (err) {
            console.error('Ошибка расчёта прогноза:', err);
            alert('Ошибка при расчёте прогноза');
        } finally {
            setForecastLoading(false);
        }
    };

    const handleTabChange = (event, newValue) => setTabValue(newValue);
    const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);
    const handleExport = () => { alert('Экспорт в разработке'); handleMenuClose(); };

    const maxTrend = Math.max(...yearlyData.map(d => d.total), 1);
    const open = Boolean(anchorEl);

    if (loading && tabValue === 0) return (
        <GlassPageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </GlassPageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <GlassPageContainer>
                {/* ========== GLASS HERO SECTION ========== */}
                <GlassHero>
                    <Box sx={{ position: 'relative', zIndex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                            <Box>
                                <Box data-tour="finance-page" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 4 }}>
                                    <PaymentsIcon sx={{ fontSize: 36, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                                    <Typography sx={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                                        Финансы
                                    </Typography>
                                </Box>
                                <Typography sx={{ opacity: 0.85, fontSize: '15px' }}>
                                    Доходы, платежи и абонементы в единой прозрачной системе
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1.5 }}>
                                <GlassButton startIcon={<RefreshIcon />} onClick={fetchFinanceData}>
                                    Обновить
                                </GlassButton>
                                <IconButton onClick={handleMenuOpen} sx={{ color: '#fff', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', borderRadius: '12px' }}>
                                    <MoreVertIcon />
                                </IconButton>
                            </Box>
                        </Box>
                        
                        <Grid container spacing={2}>
                            {[
                                { label: 'Доход', value: `${monthlyStats.totalIncome.toLocaleString()} ₽`, icon: <PaymentsIcon sx={{ fontSize: 28 }} /> },
                                { label: 'Абонементы', value: `${monthlyStats.subscriptionIncome.toLocaleString()} ₽`, icon: <CardGiftcardIcon sx={{ fontSize: 28 }} /> },
                                { label: 'Поурочно', value: `${monthlyStats.singleIncome.toLocaleString()} ₽`, icon: <ReceiptIcon sx={{ fontSize: 28 }} /> },
                                { label: 'Занятий', value: monthlyStats.totalLessons, icon: <CalendarIcon sx={{ fontSize: 28 }} /> },
                            ].map((s, i) => (
                                <Grid item xs={6} md={3} key={i}>
                                    <GlassStatCard elevation={0}>
                                        <Box sx={{ mb: 1, opacity: 0.9 }}>{s.icon}</Box>
                                        <Typography sx={{ fontSize: '26px', fontWeight: 700, fontFamily: '"Inter", sans-serif', letterSpacing: '-0.02em' }}>
                                            {s.value}
                                        </Typography>
                                        <Typography sx={{ fontSize: '13px', opacity: 0.8, fontWeight: 500 }}>{s.label}</Typography>
                                    </GlassStatCard>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </GlassHero>

                <Menu 
                    anchorEl={anchorEl} 
                    open={open} 
                    onClose={handleMenuClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    PaperProps={{ 
                        sx: { 
                            borderRadius: '20px', 
                            background: 'rgba(255, 255, 255, 0.9)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                            border: '1px solid rgba(255,255,255,0.3)',
                        } 
                    }}
                >
                    <MenuItem onClick={handleExport} sx={{ borderRadius: '12px', mx: 1, my: 0.5 }}>
                        <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />Экспорт отчёта
                    </MenuItem>
                </Menu>

                {/* ========== GLASS TABS ========== */}
                <GlassTabsPaper elevation={0}>
                    <Tabs 
                        data-tour="finance-tabs"
                        value={tabValue} 
                        onChange={handleTabChange} 
                        variant="fullWidth"
                        sx={{ 
                            '& .MuiTab-root': { 
                                py: 1.8, 
                                textTransform: 'none', 
                                fontWeight: 600, 
                                fontSize: '15px',
                                color: '#4B5563', 
                                '&.Mui-selected': { 
                                    color: '#4F46E5',
                                    background: 'rgba(79, 70, 229, 0.08)',
                                } 
                            }, 
                            '& .MuiTabs-indicator': { 
                                backgroundColor: '#4F46E5',
                                height: '3px',
                                borderRadius: '3px 3px 0 0',
                            } 
                        }}
                    >
                        <Tab icon={<AssessmentIcon sx={{ fontSize: 20 }} />} label="Обзор" iconPosition="start" />
                        <Tab icon={<ReceiptIcon sx={{ fontSize: 20 }} />} label="К оплате" iconPosition="start" />
                        <Tab icon={<PaymentsIcon sx={{ fontSize: 20 }} />} label="Платежи" iconPosition="start" />
                        <Tab icon={<CardGiftcardIcon sx={{ fontSize: 20 }} />} label="Абонементы" iconPosition="start" />
                        <Tab icon={<AssessmentIcon sx={{ fontSize: 20 }} />} label="Отчёт" iconPosition="start" />
                    </Tabs>
                </GlassTabsPaper>

                <TabPanel value={tabValue} index={0}>
                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '16px', background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>{error}</Alert>}
                    
                    {/* ========== BENTO: ВЫБОР МЕСЯЦА + РОСТ ========== */}
                    <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        mb: 3, 
                        flexWrap: 'wrap', 
                        gap: 2 
                    }}>
                        <DatePicker 
                            label="Месяц" 
                            value={selectedMonth} 
                            onChange={setSelectedMonth} 
                            views={['year', 'month']} 
                            format="LLLL yyyy"
                            slotProps={{ 
                                textField: { 
                                    size: 'small', 
                                    sx: { 
                                        width: 220,
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: '40px', 
                                            background: 'rgba(255,255,255,0.6)',
                                            backdropFilter: 'blur(8px)',
                                        },
                                    } 
                                } 
                            }} 
                        />
                        <Chip 
                            icon={monthlyStats.growth >= 0 ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                            label={`${monthlyStats.growth >= 0 ? '+' : ''}${monthlyStats.growth.toFixed(1)}% к прошлому`}
                            sx={{ 
                                bgcolor: monthlyStats.growth >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                                backdropFilter: 'blur(4px)',
                                color: monthlyStats.growth >= 0 ? '#065F46' : '#991B1B',
                                fontWeight: 600, 
                                borderRadius: '40px',
                                fontSize: '13px',
                                height: 36,
                                border: '1px solid rgba(255,255,255,0.3)',
                            }} 
                        />
                    </Box>

                    {/* ========== BENTO: ГРАФИК ДОХОДОВ ========== */}
                    <BentoCard elevation={0}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimelineIcon sx={{ color: '#4F46E5', fontSize: 22 }} />
                                <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1F2937' }}>
                                    Динамика доходов
                                </Typography>
                            </Box>
                            <Chip 
                                label="12 месяцев" 
                                size="small" 
                                variant="outlined" 
                                sx={{ 
                                    color: '#6B7280', 
                                    borderColor: 'rgba(209, 213, 219, 0.6)',
                                    borderRadius: '40px',
                                    fontSize: '12px',
                                    background: 'rgba(255,255,255,0.4)',
                                }} 
                            />
                        </Box>
                        
                        <Box sx={{ height: { xs: 180, sm: 240 }, position: 'relative', mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2%', height: '100%', px: 1 }}>
                                {yearlyData.map((item, idx) => {
                                    const height = maxTrend > 0 ? (item.total / maxTrend) * 200 : 0;
                                    const isHighest = item.total === maxTrend && item.total > 0;
                                    return (
                                        <Tooltip key={idx} title={`${item.month}: ${item.total.toLocaleString()} ₽`} arrow>
                                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                <Box sx={{ 
                                                    height: Math.max(height, 4),
                                                    background: isHighest 
                                                        ? 'linear-gradient(180deg, #4F46E5 0%, #7C3AED 100%)' 
                                                        : 'linear-gradient(180deg, #A5B4FC 0%, #C7D2FE 100%)',
                                                    borderRadius: '12px 12px 8px 8px', 
                                                    transition: 'all 0.3s ease', 
                                                    cursor: 'pointer',
                                                    boxShadow: '0 -2px 8px rgba(79,70,229,0.2)',
                                                    '&:hover': { 
                                                        opacity: 0.85, 
                                                        transform: 'scaleY(1.05)',
                                                        transformOrigin: 'bottom',
                                                    } 
                                                }} />
                                                <Typography sx={{ 
                                                    fontSize: '12px', 
                                                    mt: 1.5, 
                                                    display: 'block',
                                                    fontWeight: isHighest ? 700 : 500,
                                                    color: isHighest ? '#4F46E5' : '#6B7280',
                                                }}>
                                                    {item.monthShort}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2, borderColor: 'rgba(0,0,0,0.06)' }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <GlassMiniCard elevation={0}>
                                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#4F46E5' }}>
                                        {yearlyData[yearlyData.length - 1]?.total.toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5, fontWeight: 500 }}>
                                        Текущий
                                    </Typography>
                                </GlassMiniCard>
                            </Grid>
                            <Grid item xs={4}>
                                <GlassMiniCard elevation={0}>
                                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#10B981' }}>
                                        {Math.max(...yearlyData.map(d => d.total), 0).toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5, fontWeight: 500 }}>
                                        Пиковый
                                    </Typography>
                                </GlassMiniCard>
                            </Grid>
                            <Grid item xs={4}>
                                <GlassMiniCard elevation={0}>
                                    <Typography sx={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B' }}>
                                        {Math.round(yearlyData.reduce((sum, d) => sum + d.total, 0) / Math.max(yearlyData.length, 1)).toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5, fontWeight: 500 }}>
                                        Средний
                                    </Typography>
                                </GlassMiniCard>
                            </Grid>
                        </Grid>
                    </BentoCard>

                    {/* ========== BENTO: ПРОГНОЗ ========== */}
                    <BentoCard elevation={0} sx={{ mt: 3 }}>
                        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                            Прогноз дохода
                        </Typography>
                        
                        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
                            <Grid item xs={12} md={4}>
                                <DatePicker 
                                    label="Месяц для прогноза" 
                                    value={forecastMonth} 
                                    onChange={setForecastMonth} 
                                    views={['year', 'month']} 
                                    format="LLLL yyyy"
                                    slotProps={{ 
                                        textField: { 
                                            fullWidth: true, 
                                            size: 'small', 
                                            sx: { 
                                                '& .MuiOutlinedInput-root': { 
                                                    borderRadius: '40px', 
                                                    background: 'rgba(255,255,255,0.6)',
                                                    backdropFilter: 'blur(8px)',
                                                },
                                            } 
                                        } 
                                    }} 
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <GradientButton 
                                    startIcon={<CalculateIcon sx={{ fontSize: 18 }} />} 
                                    onClick={calculateForecast} 
                                    disabled={forecastLoading} 
                                    fullWidth
                                >
                                    {forecastLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Рассчитать'}
                                </GradientButton>
                            </Grid>
                        </Grid>

                        {forecastResult && (
                            <Fade in={true}>
                                <Box>
                                    <Card sx={{ 
                                        mb: 3, 
                                        borderRadius: '24px', 
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(79, 70, 229, 0.08) 100%)',
                                        backdropFilter: 'blur(8px)',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                        boxShadow: 'none',
                                    }}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                flexWrap: 'wrap', 
                                                gap: 2 
                                            }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 0.5, fontWeight: 500 }}>
                                                        Прогнозируемый доход
                                                    </Typography>
                                                    <Typography sx={{ 
                                                        fontWeight: 800, 
                                                        color: '#065F46',
                                                        fontSize: { xs: '32px', md: '42px' },
                                                        letterSpacing: '-0.02em',
                                                    }}>
                                                        {forecastResult.totalForecast.toLocaleString()} ₽
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography sx={{ fontSize: '14px', color: '#6B7280', mb: 0.5, fontWeight: 500 }}>
                                                        Запланировано
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '28px', fontWeight: 700, color: '#1F2937' }}>
                                                        {forecastResult.totalLessons}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                        занятий в {forecastResult.daysWithLessons} дней
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                    
                                    {forecastResult.dailyForecast.length > 0 && (
                                        <>
                                            <Typography sx={{ 
                                                fontSize: '16px', 
                                                fontWeight: 600, 
                                                color: '#1F2937',
                                                mb: 2,
                                                ml: 1,
                                            }}>
                                                📅 Детали по дням
                                            </Typography>
                                            <GlassTableContainer>
                                                <Table stickyHeader size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                background: 'rgba(249, 250, 251, 0.7)',
                                                                borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                                                            }}>
                                                                Дата
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                background: 'rgba(249, 250, 251, 0.7)',
                                                                borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                                                            }}>
                                                                День
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                background: 'rgba(249, 250, 251, 0.7)',
                                                                borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                                                            }}>
                                                                Занятия
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                background: 'rgba(249, 250, 251, 0.7)',
                                                                borderBottom: '1px solid rgba(229, 231, 235, 0.5)',
                                                            }}>
                                                                Сумма
                                                            </TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {forecastResult.dailyForecast.map((day, idx) => (
                                                            <TableRow 
                                                                key={idx} 
                                                                hover
                                                                sx={{ 
                                                                    '&:nth-of-type(even)': { backgroundColor: 'rgba(249, 250, 251, 0.4)' },
                                                                    '&:hover': { backgroundColor: 'rgba(238, 242, 255, 0.6)' },
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontSize: '14px', color: '#1F2937', borderBottom: '1px solid rgba(243, 244, 246, 0.5)' }}>
                                                                    {day.date}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '14px', color: '#1F2937', borderBottom: '1px solid rgba(243, 244, 246, 0.5)' }}>
                                                                    {day.dayName}
                                                                </TableCell>
                                                                <TableCell sx={{ borderBottom: '1px solid rgba(243, 244, 246, 0.5)' }}>
                                                                    {day.lessons.map((l, i) => (
                                                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, flexWrap: 'wrap' }}>
                                                                            <Chip 
                                                                                label={l.time} 
                                                                                size="small" 
                                                                                variant="outlined" 
                                                                                sx={{ 
                                                                                    fontSize: '11px', 
                                                                                    height: 22, 
                                                                                    borderRadius: '20px',
                                                                                    borderColor: 'rgba(229, 231, 235, 0.8)',
                                                                                    background: 'rgba(255,255,255,0.5)',
                                                                                }} 
                                                                            />
                                                                            <Typography sx={{ fontSize: '14px', color: '#1F2937', fontWeight: 500 }}>
                                                                                {l.studentName}
                                                                            </Typography>
                                                                            {l.course && (
                                                                                <Typography sx={{ fontSize: '11px', color: '#9CA3AF' }}>
                                                                                    • {l.course}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    ))}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ borderBottom: '1px solid rgba(243, 244, 246, 0.5)' }}>
                                                                    <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '15px' }}>
                                                                        {day.dayTotal.toLocaleString()} ₽
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </GlassTableContainer>
                                        </>
                                    )}
                                </Box>
                            </Fade>
                        )}
                    </BentoCard>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <BentoCard elevation={0}>
                        <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                            💰 К оплате ({unpaidLessons.length})
                        </Typography>
                        
                        {unpaidLoading ? <CircularProgress /> : unpaidLessons.length === 0 ? (
                            <Typography sx={{ color: '#6B7280', textAlign: 'center', py: 4 }}>
                                ✅ Все уроки оплачены!
                            </Typography>
                        ) : (
                            <GlassTableContainer>
                                <Table stickyHeader size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Ученик</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Дата</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Время</TableCell>
                                            <TableCell sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Предмет</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Сумма</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {unpaidLessons.map(lesson => {
                                            const rate = getStudentRateForTutor(lesson.student, user.id) || 0;
                                            const amount = rate * ((lesson.duration || 60) / 60);
                                            return (
                                                <TableRow key={lesson.id} hover>
                                                    <TableCell sx={{ color: '#1F2937', fontWeight: 500 }}>{lesson.student?.fullName}</TableCell>
                                                    <TableCell sx={{ color: '#1F2937' }}>{lesson.lessonDate}</TableCell>
                                                    <TableCell sx={{ color: '#1F2937' }}>{lesson.startTime?.slice(0,5)} - {lesson.endTime?.slice(0,5)}</TableCell>
                                                    <TableCell sx={{ color: '#1F2937' }}>{lesson.course?.name || '—'}</TableCell>
                                                    <TableCell align="right" sx={{ color: '#10B981', fontWeight: 700 }}>{amount.toLocaleString()} ₽</TableCell>
                                                    <TableCell align="center">
                                                        <Button size="small" variant="contained" startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                                                            onClick={async () => {
                                                                try {
                                                                    await axiosInstance.post(`/lessons/${lesson.id}/pay`);
                                                                    showSnackbar('✅ Оплата подтверждена', 'success');
                                                                    fetchUnpaidLessons();
                                                                    fetchFinanceData();
                                                                } catch (err) { showSnackbar('Ошибка: ' + (err.response?.data?.error || err.message), 'error'); }
                                                            }}
                                                            sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, borderRadius: '20px', fontSize: '12px' }}>
                                                            Оплатить
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                        {unpaidLessons.length > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} align="right" sx={{ fontWeight: 700, color: '#1F2937' }}>Итого к оплате:</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 800, color: '#10B981', fontSize: '16px' }}>
                                                    {unpaidLessons.reduce((sum, l) => sum + (getStudentRateForTutor(l.student, user.id) || 0) * ((l.duration || 60) / 60), 0).toLocaleString()} ₽
                                                </TableCell>
                                                <TableCell></TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </GlassTableContainer>
                        )}
                    </BentoCard>
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <BentoCard elevation={0}>
                        <Payments />
                    </BentoCard>
                </TabPanel>

                <TabPanel value={tabValue} index={3}>
                    <BentoCard elevation={0}>
                        <Subscriptions />
                    </BentoCard>
                </TabPanel>

                <TabPanel value={tabValue} index={4}>
                    <BentoCard elevation={0}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Typography sx={{ fontSize: '20px', fontWeight: 600, color: '#1F2937' }}>
                                Ежемесячный отчёт
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    type="month"
                                    value={reportMonth}
                                    onChange={(e) => setReportMonth(e.target.value)}
                                    size="small"
                                    sx={{ 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: '40px', 
                                            background: 'rgba(255,255,255,0.6)',
                                        }
                                    }}
                                />
                                <GlassButton 
                                    startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                                    onClick={fetchReport}
                                    disabled={reportLoading}
                                >
                                    {reportLoading ? <CircularProgress size={20} /> : 'Загрузить'}
                                </GlassButton>
                            </Box>
                        </Box>

                        {reportData && (
                            <Fade in={true}>
                                <Box>
                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                        {[
                                            { label: 'Доход', value: `${reportData.totalIncome.toLocaleString()} ₽`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' },
                                            { label: 'Занятий', value: reportData.totalLessons, color: '#4F46E5', bg: 'rgba(79, 70, 229, 0.12)' },
                                            { label: 'Проведено', value: reportData.completedLessons, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' },
                                            { label: 'Отменено', value: reportData.cancelledLessons, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.12)' },
                                        ].map((stat, idx) => (
                                            <Grid item xs={6} md={3} key={idx}>
                                                <Paper sx={{ 
                                                    p: 2.5, 
                                                    borderRadius: '20px', 
                                                    textAlign: 'center', 
                                                    background: stat.bg,
                                                    backdropFilter: 'blur(8px)',
                                                    border: '1px solid rgba(255,255,255,0.4)',
                                                }}>
                                                    <Typography sx={{ fontSize: '26px', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5, fontWeight: 500 }}>{stat.label}</Typography>
                                                </Paper>
                                            </Grid>
                                        ))}
                                    </Grid>

                                    <GlassTableContainer>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Ученик</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Всего занятий</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Оплачено</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#6B7280', background: 'rgba(249, 250, 251, 0.7)' }}>Доход</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reportData.studentBreakdown.map((s, idx) => (
                                                    <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'rgba(249, 250, 251, 0.4)' } }}>
                                                        <TableCell sx={{ color: '#1F2937', fontWeight: 500 }}>{s.studentName}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#1F2937' }}>{s.totalLessons}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#1F2937' }}>{s.paidLessons}</TableCell>
                                                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 700 }}>
                                                            {s.income.toLocaleString()} ₽
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </GlassTableContainer>
                                    
                                    <Box sx={{ 
                                        p: 2.5, 
                                        mt: 2, 
                                        borderRadius: '20px', 
                                        background: 'rgba(249, 250, 251, 0.6)',
                                        display: 'flex', 
                                        justifyContent: 'space-between',
                                        border: '1px solid rgba(255,255,255,0.4)',
                                    }}>
                                        <Typography sx={{ fontWeight: 600, color: '#1F2937', fontSize: '16px' }}>
                                            Итого за месяц
                                        </Typography>
                                        <Typography sx={{ fontWeight: 800, color: '#10B981', fontSize: '22px' }}>
                                            {reportData.totalIncome.toLocaleString()} ₽
                                        </Typography>
                                    </Box>
                                </Box>
                            </Fade>
                        )}
                    </BentoCard>
                </TabPanel>
            </GlassPageContainer>
        </LocalizationProvider>
    );
}

export default Finance;