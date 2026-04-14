// ========== frontend/src/pages/Finance.js (ПОЛНОСТЬЮ ИСПРАВЛЕННАЯ ВЕРСИЯ) ==========
import React, { useState, useEffect } from 'react';
import {
    Box, Tabs, Tab, Typography, Paper,
    Grid, Card, CardContent, Button,
    Alert, CircularProgress, Chip,
    Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, IconButton, Tooltip,
    Divider, Avatar,
    Menu, MenuItem, Fade
} from '@mui/material';
import {
    Payments as PaymentsIcon,
    CardGiftcard as CardGiftcardIcon,
    Assessment as AssessmentIcon,
    Calculate as CalculateIcon,
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    CalendarToday as CalendarIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    MoreVert as MoreVertIcon,
    Receipt as ReceiptIcon,
    Timeline as TimelineIcon
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import { startOfMonth, endOfMonth, format, eachMonthOfInterval, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import axios from 'axios';
// ✅ Импорт из объединённого API
import { getAllLessons } from '../services/api';
import Payments from './Payments';
import Subscriptions from './Subscriptions';

function TabPanel({ children, value, index }) {
    return (
        <div hidden={value !== index}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

function Finance() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();
    
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
        if (user) {
            fetchFinanceData();
        }
    }, [user, selectedMonth]);

    const fetchFinanceData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const [paymentsRes, studentsRes, lessonsRes] = await Promise.all([
                axios.get(`http://localhost:8080/api/payments/tutor/${user.id}`, { headers }),
                axios.get(`http://localhost:8080/api/students/tutor/${user.id}`, { headers }),
                // ✅ Заменено на API-функцию
                getAllLessons(user.id)
            ]);
            
            const payments = paymentsRes.data;
            const students = studentsRes.data;
            // ✅ Правильно извлекаем данные
            const allLessons = lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes;
            
            setAllPayments(payments);
            setStudents(students);

            const monthStart = startOfMonth(selectedMonth);
            const monthEnd = endOfMonth(selectedMonth);
            
            const monthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'paid';
            });

            const totalIncome = monthPayments.reduce((sum, p) => sum + p.amount, 0);
            
            let subscriptionIncome = 0;
            let singleIncome = 0;
            
            monthPayments.forEach(p => {
                if (p.paymentType === 'subscription' || (p.courseName && p.courseName.includes('Абонемент'))) {
                    subscriptionIncome += p.amount;
                } else {
                    singleIncome += p.amount;
                }
            });
            
            const activeStudents = students.filter(s => {
                const rate = getStudentRateForTutor(s, user.id);
                return rate !== null;
            });
            const averageRate = activeStudents.length > 0 
                ? activeStudents.reduce((sum, s) => sum + (getStudentRateForTutor(s, user.id) || 0), 0) / activeStudents.length 
                : 0;
            
            const paidStudentsIds = [...new Set(monthPayments.map(p => p.student?.id).filter(id => id))];
            const paidStudents = paidStudentsIds.length;
            
            const monthLessons = allLessons.filter(l => {
                const lessonDate = new Date(l.lessonDate);
                return lessonDate >= monthStart && lessonDate <= monthEnd;
            });
            const totalLessons = monthLessons.length;
            
            const prevMonthStart = startOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
            const prevMonthEnd = endOfMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1));
            const prevMonthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= prevMonthStart && paymentDate <= prevMonthEnd && p.status === 'paid';
            });
            const prevTotal = prevMonthPayments.reduce((sum, p) => sum + p.amount, 0);
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
            
            const yearlyStats = [];
            
            months.forEach(month => {
                const monthStart = startOfMonth(month);
                const monthEnd = endOfMonth(month);
                const monthPayments = payments.filter(p => {
                    const paymentDate = new Date(p.paymentDate);
                    return paymentDate >= monthStart && paymentDate <= monthEnd && p.status === 'paid';
                });
                const monthIncome = monthPayments.reduce((sum, p) => sum + p.amount, 0);
                
                yearlyStats.push({
                    month: format(month, 'LLLL yyyy', { locale: ru }),
                    monthShort: format(month, 'MMM', { locale: ru }),
                    total: monthIncome
                });
            });
            
            setYearlyData(yearlyStats);
            setError(null);
        } catch (err) {
            console.error('Ошибка загрузки статистики:', err);
            setError('Не удалось загрузить статистику');
        } finally {
            setLoading(false);
        }
    };

    const calculateForecast = async () => {
        setForecastLoading(true);
        setForecastResult(null);

        try {
            const token = localStorage.getItem('token');
            const headers = { 'Authorization': `Bearer ${token}` };
            
            const monthStart = startOfMonth(forecastMonth);
            const monthEnd = endOfMonth(forecastMonth);
            
            console.log(`📊 ПРОГНОЗ на ${format(forecastMonth, 'LLLL yyyy', { locale: ru })}`);
            console.log(`   Период: ${format(monthStart, 'dd.MM.yyyy')} - ${format(monthEnd, 'dd.MM.yyyy')}`);
            
            const templatesRes = await axios.get(
                `http://localhost:8080/api/weekly-template/tutor/${user.id}`,
                { headers }
            );
            const templates = templatesRes.data;
            
            console.log(`   Найдено шаблонов: ${templates.length}`);
            
            const studentTemplates = {};
            templates.forEach(t => {
                if (t.status === 'SCHEDULED') {
                    const studentId = t.student?.id;
                    if (!studentTemplates[studentId]) {
                        studentTemplates[studentId] = {
                            student: t.student,
                            templates: []
                        };
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
                    daysMap.set(dateStr, {
                        date: currentDate,
                        lessons: lessonsDetails,
                        dayTotal: dayTotal
                    });
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
            
            console.log(`   Дней с занятиями: ${dailyForecast.length}`);
            console.log(`   ИТОГО прогноз: ${totalForecast} ₽`);
            
            setForecastResult({
                totalForecast: totalForecast,
                dailyForecast: dailyForecast,
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

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleExport = () => {
        alert('Экспорт в разработке');
        handleMenuClose();
    };

    const maxTrend = Math.max(...yearlyData.map(d => d.total), 1);
    const open = Boolean(anchorEl);

    if (loading && tabValue === 0) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <CircularProgress />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                    <Box>
                        <Typography variant="h4" sx={{ fontWeight: 600, mb: 0.5 }}>
                            Финансы
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            Доходы, платежи и абонементы
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                            variant="outlined"
                            startIcon={<RefreshIcon />}
                            onClick={fetchFinanceData}
                            size="small"
                            sx={{ borderRadius: 2, textTransform: 'none' }}
                        >
                            Обновить
                        </Button>
                        <IconButton onClick={handleMenuOpen} size="small">
                            <MoreVertIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={open}
                            onClose={handleMenuClose}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                        >
                            <MenuItem onClick={handleExport}>
                                <DownloadIcon sx={{ mr: 1, fontSize: 18 }} />
                                Экспорт отчёта
                            </MenuItem>
                        </Menu>
                    </Box>
                </Box>

                <Paper sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange} 
                        variant="fullWidth"
                        sx={{
                            '& .MuiTab-root': {
                                py: 1.5,
                                textTransform: 'none',
                                fontWeight: 500
                            }
                        }}
                    >
                        <Tab icon={<AssessmentIcon />} label="Обзор" />
                        <Tab icon={<PaymentsIcon />} label="Платежи" />
                        <Tab icon={<CardGiftcardIcon />} label="Абонементы" />
                    </Tabs>
                </Paper>

                <TabPanel value={tabValue} index={0}>
                    {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                    
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
                        <DatePicker
                            label="Месяц"
                            value={selectedMonth}
                            onChange={setSelectedMonth}
                            views={['year', 'month']}
                            format="LLLL yyyy"
                            slotProps={{ textField: { size: 'small', sx: { width: 200 } } }}
                        />
                        <Chip 
                            icon={monthlyStats.growth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                            label={`${monthlyStats.growth >= 0 ? '+' : ''}${monthlyStats.growth.toFixed(1)}% к прошлому месяцу`}
                            color={monthlyStats.growth >= 0 ? 'success' : 'error'}
                            size="small"
                            sx={{ fontWeight: 500 }}
                        />
                    </Box>

                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} md={8}>
                            <Paper 
                                sx={{ 
                                    p: 4, 
                                    borderRadius: 4,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    color: 'white',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                                    ДОХОД ЗА {format(selectedMonth, 'LLLL yyyy', { locale: ru }).toUpperCase()}
                                </Typography>
                                <Typography variant="h2" sx={{ fontWeight: 700, fontSize: { xs: '2rem', md: '3rem' }, mb: 3 }}>
                                    {monthlyStats.totalIncome.toLocaleString()} ₽
                                </Typography>
                                
                                <Grid container spacing={2} sx={{ mb: 3 }}>
                                    <Grid item xs={6}>
                                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5 }}>
                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Абонементы</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {monthlyStats.subscriptionIncome.toLocaleString()} ₽
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2, p: 1.5 }}>
                                            <Typography variant="caption" sx={{ opacity: 0.7 }}>Поурочно</Typography>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {monthlyStats.singleIncome.toLocaleString()} ₽
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                                
                                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ReceiptIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            {monthlyStats.totalLessons} занятий в месяце
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <SchoolIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            {monthlyStats.paidStudents} учеников оплатили
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <CalculateIcon sx={{ fontSize: 16, opacity: 0.8 }} />
                                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                            Средняя ставка: {Math.round(monthlyStats.averageRate).toLocaleString()} ₽
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Avatar 
                                    sx={{ 
                                        width: 80, 
                                        height: 80, 
                                        bgcolor: 'rgba(255,255,255,0.15)',
                                        position: 'absolute',
                                        bottom: 24,
                                        right: 24
                                    }}
                                >
                                    <MoneyIcon sx={{ fontSize: 48 }} />
                                </Avatar>
                            </Paper>
                        </Grid>
                        
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, borderRadius: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Chip 
                                        icon={monthlyStats.growth >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                        label={`${monthlyStats.growth >= 0 ? '+' : ''}${monthlyStats.growth.toFixed(1)}%`}
                                        color={monthlyStats.growth >= 0 ? 'success' : 'error'}
                                        sx={{ fontWeight: 600, fontSize: '1.2rem', py: 2.5, px: 1 }}
                                    />
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                                        к прошлому месяцу
                                    </Typography>
                                </Box>
                            </Paper>
                        </Grid>
                    </Grid>

                    <Paper sx={{ p: 3, mb: 4, borderRadius: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimelineIcon sx={{ color: '#ff6b6b' }} />
                                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                    Динамика доходов
                                </Typography>
                            </Box>
                            <Chip 
                                label="За последние 12 месяцев" 
                                size="small" 
                                variant="outlined"
                            />
                        </Box>
                        
                        <Box sx={{ height: 240, position: 'relative' }}>
                            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, height: '100%' }}>
                                {yearlyData.map((item, idx) => {
                                    const height = (item.total / maxTrend) * 200;
                                    const isHighest = item.total === maxTrend;
                                    return (
                                        <Tooltip key={idx} title={`${item.month}: ${item.total.toLocaleString()} ₽`} arrow>
                                            <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                <Box 
                                                    sx={{ 
                                                        height: height,
                                                        bgcolor: isHighest ? '#ff6b6b' : '#ff6b6b80',
                                                        borderRadius: '8px 8px 4px 4px',
                                                        transition: 'all 0.2s',
                                                        cursor: 'pointer',
                                                        '&:hover': { 
                                                            bgcolor: '#ff6b6b',
                                                            transform: 'scaleX(1.02)'
                                                        }
                                                    }}
                                                />
                                                <Typography 
                                                    variant="caption" 
                                                    sx={{ 
                                                        fontSize: '0.7rem', 
                                                        mt: 1, 
                                                        display: 'block',
                                                        fontWeight: isHighest ? 600 : 400,
                                                        color: isHighest ? '#ff6b6b' : 'text.secondary'
                                                    }}
                                                >
                                                    {item.monthShort}
                                                </Typography>
                                            </Box>
                                        </Tooltip>
                                    );
                                })}
                            </Box>
                        </Box>
                        
                        <Divider sx={{ my: 2 }} />
                        
                        <Grid container spacing={2}>
                            <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#ff6b6b' }}>
                                        {yearlyData[yearlyData.length - 1]?.total.toLocaleString()} ₽
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {yearlyData[yearlyData.length - 1]?.month}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                                        {Math.max(...yearlyData.map(d => d.total), 0).toLocaleString()} ₽
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Пиковый месяц
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={4}>
                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                        {Math.round(yearlyData.reduce((sum, d) => sum + d.total, 0) / yearlyData.length).toLocaleString()} ₽
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        Средний доход
                                    </Typography>
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>

                    <Paper sx={{ p: 3, borderRadius: 4 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
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
                                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                            </Grid>
                            <Grid item xs={12} md={3}>
                                <Button
                                    variant="contained"
                                    startIcon={<CalculateIcon />}
                                    onClick={calculateForecast}
                                    disabled={forecastLoading}
                                    fullWidth
                                    sx={{ borderRadius: 2, textTransform: 'none' }}
                                >
                                    {forecastLoading ? <CircularProgress size={24} /> : 'Рассчитать'}
                                </Button>
                            </Grid>
                        </Grid>

                        {forecastResult && (
                                <Fade in={true}>
                                    <Box>
                                        <Card sx={{ bgcolor: '#f0fdf4', mb: 3, borderRadius: 3 }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                            Прогнозируемый доход
                                                        </Typography>
                                                        <Typography variant="h3" sx={{ fontWeight: 700, color: '#15803d' }}>
                                                            {forecastResult.totalForecast.toLocaleString()} ₽
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                                                            Запланировано
                                                        </Typography>
                                                        <Typography variant="h4" sx={{ fontWeight: 600 }}>
                                                            {forecastResult.totalLessons || 0} занятий
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary">
                                                            в {forecastResult.daysWithLessons || 0} дней
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </CardContent>
                                        </Card>

                                        {forecastResult.dailyForecast.length > 0 && (
                                            <>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                                    Детали по дням
                                                </Typography>
                                                <TableContainer component={Paper} sx={{ maxHeight: 400, borderRadius: 2 }} variant="outlined">
                                                    <Table stickyHeader size="small">
                                                        <TableHead>
                                                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                                                <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                                                                <TableCell sx={{ fontWeight: 600 }}>День</TableCell>
                                                                <TableCell sx={{ fontWeight: 600 }}>Занятия</TableCell>
                                                                <TableCell align="right" sx={{ fontWeight: 600 }}>Сумма</TableCell>
                                                            </TableRow>
                                                        </TableHead>
                                                        <TableBody>
                                                            {forecastResult.dailyForecast.map((day, idx) => (
                                                                <TableRow key={idx} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                                    <TableCell>{day.date}</TableCell>
                                                                    <TableCell>{day.dayName}</TableCell>
                                                                    <TableCell>
                                                                        {day.lessons.map((l, i) => (
                                                                            <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                                                <Chip 
                                                                                    label={l.time} 
                                                                                    size="small" 
                                                                                    variant="outlined" 
                                                                                    sx={{ fontSize: '0.65rem', height: 20 }}
                                                                                />
                                                                                <Typography variant="body2">
                                                                                    {l.studentName}
                                                                                </Typography>
                                                                                {l.course && (
                                                                                    <Typography variant="caption" color="textSecondary">
                                                                                        ({l.course})
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        ))}
                                                                    </TableCell>
                                                                    <TableCell align="right">
                                                                        <Typography variant="body1" fontWeight={500} color="success.main">
                                                                            {day.dayTotal.toLocaleString()} ₽
                                                                        </Typography>
                                                                    </TableCell>
                                                                </TableRow>
                                                            ))}
                                                        </TableBody>
                                                    </Table>
                                                </TableContainer>
                                            </>
                                        )}
                                    </Box>
                                </Fade>
                            )}
                    </Paper>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                    <Payments />
                </TabPanel>

                <TabPanel value={tabValue} index={2}>
                    <Subscriptions />
                </TabPanel>
            </Box>
        </LocalizationProvider>
    );
}

export default Finance;