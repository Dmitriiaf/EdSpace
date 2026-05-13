// ========== frontend/src/pages/Finance.js (РЕДИЗАЙН v2) ==========
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

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========


const HeroSection = styled(Paper)({
    padding: '32px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
    color: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 4px 20px rgba(79, 70, 229, 0.3)',
});

const HeroMiniCard = styled(Box)({
    backgroundColor: 'rgba(255,255,255,0.15)',
    backdropFilter: 'blur(8px)',
    borderRadius: '12px',
    padding: '16px 24px',
    textAlign: 'center',
});

const ChartCard = styled(Paper)({
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
});

const ForecastCard = styled(Paper)({
    padding: '24px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
});

const ForecastResultCard = styled(Card)({
    backgroundColor: '#ECFDF5',
    marginBottom: '20px',
    borderRadius: '12px',
    border: '1px solid #A7F3D0',
    boxShadow: 'none',
});

const StatMiniCard = styled(Paper)({
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    transition: 'all 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
    },
});


const StyledTableContainer = styled(TableContainer)({
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    boxShadow: 'none',
    maxHeight: 400,
});

const TabsPaper = styled(Paper)({
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
});

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
        if (user && tabValue === 3) fetchReport();
    }, [user, tabValue, reportMonth]);

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

            const monthStart = startOfMonth(selectedMonth);
            const monthEnd = endOfMonth(selectedMonth);
            
            const monthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= monthStart && paymentDate <= monthEnd && (p.status === 'PAID' || p.status === 'CONFIRMED' || p.status === 'paid');
            });

            // Сначала считаем занятия за месяц
            const monthLessons = Array.isArray(allLessons) 
                ? allLessons.filter(l => {
                    const lessonDate = new Date(l.lessonDate);
                    return lessonDate >= monthStart && lessonDate <= monthEnd;
                })
                : [];
            const totalLessons = monthLessons.length;

            // ID занятий, уже учтённых в платежах
            const paidLessonIds = new Set(monthPayments.map(p => p.lesson?.id).filter(id => id));

            // Оплаченные занятия, не учтённые в таблице payments
            const paidLessonsIncome = monthLessons
                .filter(l => l.status === 'PAID' && !paidLessonIds.has(l.id))
                .reduce((sum, l) => {
                    const student = studentsList.find(s => s.id === l.student?.id);
                    return sum + (getStudentRateForTutor(student, user.id) || 0);
                }, 0);

            const totalIncome = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + paidLessonsIncome;
            
            let subscriptionIncome = 0;
            let singleIncome = 0;
            
            monthPayments.forEach(p => {
                if (p.paymentType === 'subscription' || (p.courseName && p.courseName.includes('Абонемент'))) {
                    subscriptionIncome += p.amount || 0;
                } else {
                    singleIncome += p.amount || 0;
                }
            });
            
            // Добавляем оплаченные занятия в соответствующий тип дохода
            monthLessons.filter(l => l.status === 'PAID' && !paidLessonIds.has(l.id)).forEach(l => {
                const student = studentsList.find(s => s.id === l.student?.id);
                const rate = getStudentRateForTutor(student, user.id) || 0;
                if (student?.paymentType === 'subscription') {
                    subscriptionIncome += rate;
                } else {
                    singleIncome += rate;
                }
            });
            
            const activeStudents = studentsList.filter(s => getStudentRateForTutor(s, user.id) !== null);
            const averageRate = activeStudents.length > 0 
                ? activeStudents.reduce((sum, s) => sum + (getStudentRateForTutor(s, user.id) || 0), 0) / activeStudents.length 
                : 0;
            
            const paidStudentsIds = [...new Set(monthPayments.map(p => p.student?.id).filter(id => id))];
            const paidStudents = paidStudentsIds.length;
            
            const prevMonthStart = startOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
            const prevMonthEnd = endOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
            const prevMonthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= prevMonthStart && paymentDate <= prevMonthEnd && (p.status === 'PAID' || p.status === 'CONFIRMED' || p.status === 'paid');
            });
            const prevTotal = prevMonthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const growth = prevTotal > 0 ? ((totalIncome - prevTotal) / prevTotal) * 100 : 0;

            setMonthlyStats({
                totalIncome,
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
                const mPayments = payments.filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= mStart && paymentDate <= mEnd && (p.status === 'PAID' || p.status === 'CONFIRMED' || p.status === 'paid');
                });
                
                // Учитываем оплаченные занятия в годовом графике
                const mLessonIds = new Set(mPayments.map(p => p.lesson?.id).filter(id => id));
                const mLessonsIncome = Array.isArray(allLessons)
                    ? allLessons
                        .filter(l => {
                            const lessonDate = new Date(l.lessonDate);
                            return lessonDate >= mStart && lessonDate <= mEnd && 
                                l.status === 'PAID' && !mLessonIds.has(l.id);
                        })
                        .reduce((sum, l) => {
                            const student = studentsList.find(s => s.id === l.student?.id);
                            return sum + (getStudentRateForTutor(student, user.id) || 0);
                        }, 0)
                    : 0;
                
                return {
                    month: format(month, 'LLLL yyyy', { locale: ru }),
                    monthShort: format(month, 'MMM', { locale: ru }),
                    total: mPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + mLessonsIncome
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
        <PageContainer>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
                <EdSpaceLoader text="Загрузка..." />
            </Box>
        </PageContainer>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <PageContainer>
                {/* ========== ЗАГОЛОВОК ========== */}
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    mb: 3, 
                    flexWrap: 'wrap', 
                    gap: 2 
                }}>
                    <Box>
                        <Typography sx={{ fontSize: '28px', fontWeight: 600, color: '#1F2937', mb: 0.5 }}>
                            Финансы
                        </Typography>
                        <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                            Доходы, платежи и абонементы
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <StyledButton 
                            variant="outlined" 
                            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />} 
                            onClick={fetchFinanceData}
                            sx={{ 
                                color: '#374151', 
                                borderColor: '#D1D5DB', 
                                '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } 
                            }}
                        >
                            Обновить
                        </StyledButton>
                        <IconButton onClick={handleMenuOpen} size="small" sx={{ color: '#6B7280' }}>
                            <MoreVertIcon />
                        </IconButton>
                        <Menu 
                            anchorEl={anchorEl} 
                            open={open} 
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                            PaperProps={{ sx: { borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' } }}
                        >
                            <MenuItem onClick={handleExport} sx={{ fontSize: '14px' }}>
                                <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />Экспорт отчёта
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>

                {/* ========== ВКЛАДКИ ========== */}
                <TabsPaper elevation={0}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange} 
                        variant="fullWidth"
                        sx={{ 
                            '& .MuiTab-root': { 
                                py: 1.5, 
                                textTransform: 'none', 
                                fontWeight: 500, 
                                fontSize: '14px',
                                color: '#6B7280', 
                                '&.Mui-selected': { color: '#4F46E5' } 
                            }, 
                            '& .MuiTabs-indicator': { 
                                backgroundColor: '#4F46E5',
                                height: '2px',
                            } 
                        }}
                    >
                        <Tab icon={<AssessmentIcon sx={{ fontSize: 20 }} />} label="Обзор" iconPosition="start" />
                        <Tab icon={<PaymentsIcon sx={{ fontSize: 20 }} />} label="Платежи" iconPosition="start" />
                        <Tab icon={<CardGiftcardIcon sx={{ fontSize: 20 }} />} label="Абонементы" iconPosition="start" />
                        <Tab icon={<AssessmentIcon sx={{ fontSize: 20 }} />} label="Отчёт" iconPosition="start" />
                    </Tabs>
                </TabsPaper>

                <TabPanel value={tabValue} index={0}>
                    {error && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>}
                    
                    {/* ========== ВЫБОР МЕСЯЦА + РОСТ ========== */}
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
                                        width: 200, 
                                        '& .MuiOutlinedInput-root': { 
                                            borderRadius: '8px', 
                                            backgroundColor: '#FFFFFF',
                                            '& fieldset': { borderColor: '#E5E7EB' },
                                            '&:hover fieldset': { borderColor: '#D1D5DB' },
                                            '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
                                        },
                                    } 
                                } 
                            }} 
                        />
                        <Chip 
                            icon={monthlyStats.growth >= 0 ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
                            label={`${monthlyStats.growth >= 0 ? '+' : ''}${monthlyStats.growth.toFixed(1)}% к прошлому`}
                            sx={{ 
                                bgcolor: monthlyStats.growth >= 0 ? '#ECFDF5' : '#FEF2F2',
                                color: monthlyStats.growth >= 0 ? '#065F46' : '#991B1B',
                                fontWeight: 500, 
                                borderRadius: '100px',
                                fontSize: '13px',
                                height: 32,
                            }} 
                        />
                    </Box>

                    {/* ========== HERO-СЕКЦИЯ ========== */}
                    <HeroSection elevation={0}>
                        <Typography sx={{ 
                            fontSize: '13px', 
                            opacity: 0.8, 
                            mb: 1, 
                            textTransform: 'uppercase', 
                            letterSpacing: 1,
                            fontWeight: 500,
                        }}>
                            Доход за {format(selectedMonth, 'LLLL yyyy', { locale: ru })}
                        </Typography>
                        <Typography sx={{ 
                            fontWeight: 700, 
                            fontSize: { xs: '32px', md: '42px' }, 
                            mb: 3,
                            letterSpacing: '-1px',
                        }}>
                            {monthlyStats.totalIncome.toLocaleString()} ₽
                        </Typography>
                        
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid item xs={6}>
                                <HeroMiniCard>
                                    <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
                                        {monthlyStats.subscriptionIncome.toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>
                                        Абонементы
                                    </Typography>
                                </HeroMiniCard>
                            </Grid>
                            <Grid item xs={6}>
                                <HeroMiniCard>
                                    <Typography sx={{ fontSize: '20px', fontWeight: 600 }}>
                                        {monthlyStats.singleIncome.toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>
                                        Поурочно
                                    </Typography>
                                </HeroMiniCard>
                            </Grid>
                        </Grid>
                        
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <ReceiptIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                                <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>
                                    {monthlyStats.totalLessons} занятий
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <SchoolIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                                <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>
                                    {monthlyStats.paidStudents} учеников оплатили
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <CalculateIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                                <Typography sx={{ fontSize: '13px', opacity: 0.8 }}>
                                    Ср. ставка: {Math.round(monthlyStats.averageRate).toLocaleString()} ₽
                                </Typography>
                            </Box>
                        </Box>
                        
                        <MoneyIcon sx={{ 
                            position: 'absolute', 
                            bottom: 16, 
                            right: 16, 
                            fontSize: 80, 
                            opacity: 0.1,
                        }} />
                    </HeroSection>

                    {/* ========== ГРАФИК ДОХОДОВ ========== */}
                    <ChartCard elevation={0} sx={{ mt: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimelineIcon sx={{ color: '#4F46E5', fontSize: 20 }} />
                                <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937' }}>
                                    Динамика доходов
                                </Typography>
                            </Box>
                            <Chip 
                                label="12 месяцев" 
                                size="small" 
                                variant="outlined" 
                                sx={{ 
                                    color: '#6B7280', 
                                    borderColor: '#D1D5DB', 
                                    borderRadius: '8px',
                                    fontSize: '12px',
                                }} 
                            />
                        </Box>
                        
                        <Box sx={{ height: 240, position: 'relative', mb: 2 }}>
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
                                                    borderRadius: '8px 8px 4px 4px', 
                                                    transition: 'all 0.3s ease', 
                                                    cursor: 'pointer',
                                                    '&:hover': { 
                                                        opacity: 0.85, 
                                                        transform: 'scaleY(1.05)',
                                                        transformOrigin: 'bottom',
                                                    } 
                                                }} />
                                                <Typography sx={{ 
                                                    fontSize: '11px', 
                                                    mt: 1, 
                                                    display: 'block',
                                                    fontWeight: isHighest ? 600 : 400,
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
                        
                        <Divider sx={{ my: 2, borderColor: '#F3F4F6' }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <StatMiniCard elevation={0}>
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#4F46E5' }}>
                                        {yearlyData[yearlyData.length - 1]?.total.toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                        Текущий
                                    </Typography>
                                </StatMiniCard>
                            </Grid>
                            <Grid item xs={4}>
                                <StatMiniCard elevation={0}>
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>
                                        {Math.max(...yearlyData.map(d => d.total), 0).toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                        Пиковый
                                    </Typography>
                                </StatMiniCard>
                            </Grid>
                            <Grid item xs={4}>
                                <StatMiniCard elevation={0}>
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#F59E0B' }}>
                                        {Math.round(yearlyData.reduce((sum, d) => sum + d.total, 0) / Math.max(yearlyData.length, 1)).toLocaleString()} ₽
                                    </Typography>
                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>
                                        Средний
                                    </Typography>
                                </StatMiniCard>
                            </Grid>
                        </Grid>
                    </ChartCard>

                    {/* ========== ПРОГНОЗ ========== */}
                    <ForecastCard elevation={0} sx={{ mt: 3 }}>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
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
                                                    borderRadius: '8px', 
                                                    backgroundColor: '#FFFFFF',
                                                    '& fieldset': { borderColor: '#E5E7EB' },
                                                    '&:hover fieldset': { borderColor: '#D1D5DB' },
                                                    '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                                },
                                            } 
                                        } 
                                    }} 
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <StyledButton 
                                    variant="contained" 
                                    startIcon={<CalculateIcon sx={{ fontSize: 18 }} />} 
                                    onClick={calculateForecast} 
                                    disabled={forecastLoading} 
                                    fullWidth
                                    sx={{ 
                                        bgcolor: '#4F46E5', 
                                        '&:hover': { bgcolor: '#4338CA' },
                                        height: '40px',
                                    }}
                                >
                                    {forecastLoading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Рассчитать'}
                                </StyledButton>
                            </Grid>
                        </Grid>

                        {forecastResult && (
                            <Fade in={true}>
                                <Box>
                                    <ForecastResultCard>
                                        <CardContent sx={{ '&:last-child': { pb: 2 } }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                justifyContent: 'space-between', 
                                                flexWrap: 'wrap', 
                                                gap: 2 
                                            }}>
                                                <Box>
                                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 0.5 }}>
                                                        Прогнозируемый доход
                                                    </Typography>
                                                    <Typography sx={{ 
                                                        fontWeight: 700, 
                                                        color: '#065F46',
                                                        fontSize: { xs: '28px', md: '36px' },
                                                    }}>
                                                        {forecastResult.totalForecast.toLocaleString()} ₽
                                                    </Typography>
                                                </Box>
                                                <Box sx={{ textAlign: 'right' }}>
                                                    <Typography sx={{ fontSize: '13px', color: '#6B7280', mb: 0.5 }}>
                                                        Запланировано
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '24px', fontWeight: 600, color: '#1F2937' }}>
                                                        {forecastResult.totalLessons} занятий
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                        в {forecastResult.daysWithLessons} дней
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </CardContent>
                                    </ForecastResultCard>
                                    
                                    {forecastResult.dailyForecast.length > 0 && (
                                        <>
                                            <Typography sx={{ 
                                                fontSize: '16px', 
                                                fontWeight: 600, 
                                                color: '#1F2937',
                                                mb: 2,
                                            }}>
                                                Детали по дням
                                            </Typography>
                                            <StyledTableContainer>
                                                <Table stickyHeader size="small">
                                                    <TableHead>
                                                        <TableRow>
                                                            <TableCell sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                backgroundColor: '#F9FAFB',
                                                                borderBottom: '1px solid #E5E7EB',
                                                            }}>
                                                                Дата
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                backgroundColor: '#F9FAFB',
                                                                borderBottom: '1px solid #E5E7EB',
                                                            }}>
                                                                День
                                                            </TableCell>
                                                            <TableCell sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                backgroundColor: '#F9FAFB',
                                                                borderBottom: '1px solid #E5E7EB',
                                                            }}>
                                                                Занятия
                                                            </TableCell>
                                                            <TableCell align="right" sx={{ 
                                                                fontWeight: 600, 
                                                                fontSize: '12px', 
                                                                color: '#6B7280',
                                                                backgroundColor: '#F9FAFB',
                                                                borderBottom: '1px solid #E5E7EB',
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
                                                                    '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
                                                                    '&:hover': { backgroundColor: '#EEF2FF' },
                                                                }}
                                                            >
                                                                <TableCell sx={{ fontSize: '14px', color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                                                                    {day.date}
                                                                </TableCell>
                                                                <TableCell sx={{ fontSize: '14px', color: '#1F2937', borderBottom: '1px solid #F3F4F6' }}>
                                                                    {day.dayName}
                                                                </TableCell>
                                                                <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                                    {day.lessons.map((l, i) => (
                                                                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                            <Chip 
                                                                                label={l.time} 
                                                                                size="small" 
                                                                                variant="outlined" 
                                                                                sx={{ 
                                                                                    fontSize: '11px', 
                                                                                    height: 20, 
                                                                                    borderRadius: '6px',
                                                                                    borderColor: '#E5E7EB',
                                                                                    color: '#6B7280',
                                                                                }} 
                                                                            />
                                                                            <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                                                {l.studentName}
                                                                            </Typography>
                                                                            {l.course && (
                                                                                <Typography sx={{ fontSize: '12px', color: '#9CA3AF' }}>
                                                                                    ({l.course})
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    ))}
                                                                </TableCell>
                                                                <TableCell align="right" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                                    <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>
                                                                        {day.dayTotal.toLocaleString()} ₽
                                                                    </Typography>
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>
                                                </Table>
                                            </StyledTableContainer>
                                        </>
                                    )}
                                </Box>
                            </Fade>
                        )}
                    </ForecastCard>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Payments />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Subscriptions />
                </TabPanel>
                <TabPanel value={tabValue} index={3}>
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
                                    '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#fff' }
                                }}
                            />
                            <StyledButton 
                                variant="contained" 
                                startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
                                onClick={fetchReport}
                                disabled={reportLoading}
                                sx={{ bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338CA' } }}
                            >
                                {reportLoading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Загрузить'}
                            </StyledButton>
                        </Box>
                    </Box>

                    {reportData && (
                        <Fade in={true}>
                            <Box>
                                {/* Сводка */}
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    {[
                                        { label: 'Доход', value: `${reportData.totalIncome.toLocaleString()} ₽`, color: '#10B981', bg: '#ECFDF5' },
                                        { label: 'Занятий', value: reportData.totalLessons, color: '#4F46E5', bg: '#EEF2FF' },
                                        { label: 'Проведено', value: reportData.completedLessons, color: '#F59E0B', bg: '#FFFBEB' },
                                        { label: 'Отменено', value: reportData.cancelledLessons, color: '#EF4444', bg: '#FEF2F2' },
                                    ].map((stat, idx) => (
                                        <Grid item xs={6} md={3} key={idx}>
                                            <Paper sx={{ p: 2.5, borderRadius: '12px', textAlign: 'center', bgcolor: stat.bg, border: '1px solid #F3F4F6' }}>
                                                <Typography sx={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.value}</Typography>
                                                <Typography sx={{ fontSize: '13px', color: '#6B7280', mt: 0.5 }}>{stat.label}</Typography>
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>

                                {/* Таблица по ученикам */}
                                <Paper sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #F3F4F6' }}>
                                    <Box sx={{ p: 2, borderBottom: '1px solid #F3F4F6', bgcolor: '#F9FAFB' }}>
                                        <Typography sx={{ fontWeight: 600, color: '#1F2937', fontSize: '16px' }}>
                                            Доход по ученикам
                                        </Typography>
                                    </Box>
                                    <TableContainer sx={{ maxHeight: 400 }}>
                                        <Table stickyHeader size="small">
                                            <TableHead>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 600, color: '#6B7280', bgcolor: '#F9FAFB' }}>Ученик</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', bgcolor: '#F9FAFB' }}>Всего занятий</TableCell>
                                                    <TableCell align="center" sx={{ fontWeight: 600, color: '#6B7280', bgcolor: '#F9FAFB' }}>Оплачено</TableCell>
                                                    <TableCell align="right" sx={{ fontWeight: 600, color: '#6B7280', bgcolor: '#F9FAFB' }}>Доход</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {reportData.studentBreakdown.map((s, idx) => (
                                                    <TableRow key={idx} hover sx={{ '&:nth-of-type(even)': { bgcolor: '#F9FAFB' } }}>
                                                        <TableCell sx={{ color: '#1F2937', fontWeight: 500 }}>{s.studentName}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#1F2937' }}>{s.totalLessons}</TableCell>
                                                        <TableCell align="center" sx={{ color: '#1F2937' }}>{s.paidLessons}</TableCell>
                                                        <TableCell align="right" sx={{ color: '#10B981', fontWeight: 600 }}>
                                                            {s.income.toLocaleString()} ₽
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                    
                                    {/* Итого */}
                                    <Box sx={{ p: 2, borderTop: '2px solid #E5E7EB', bgcolor: '#F9FAFB', display: 'flex', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontWeight: 600, color: '#1F2937' }}>
                                            Итого за месяц
                                        </Typography>
                                        <Typography sx={{ fontWeight: 700, color: '#10B981', fontSize: '18px' }}>
                                            {reportData.totalIncome.toLocaleString()} ₽
                                        </Typography>
                                    </Box>
                                </Paper>
                            </Box>
                        </Fade>
                    )}
                </TabPanel>
            </PageContainer>
        </LocalizationProvider>
    );
}

export default Finance;