// ========== frontend/src/pages/Payments.js (РЕДИЗАЙН v2) ==========
import React, { useState, useEffect } from 'react';
import axiosInstance, { getAllLessons } from '../services/api';
import {
    Box, Button, TextField, MenuItem, FormControl, InputLabel,
    Select, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, IconButton, Chip,
    Alert, Snackbar, Grid, Card, CardContent, Typography,
    Avatar, Tooltip, TableSortLabel, InputAdornment,
    Pagination, CircularProgress, Tabs, Tab,
    Divider
} from '@mui/material';
import { PageContainer, StatCard, StyledButton, StyledDialog, EmptyStateContainer, EmptyStateIcon, ViewToggle, ViewToggleBtn } from '../styles/shared';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import {
    Search as SearchIcon,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Receipt as ReceiptIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    Payment as PaymentIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    Schedule as ScheduleIcon,
    Visibility as VisibilityIcon,
    Clear as ClearIcon,
    Timeline as TimelineIcon,
    Warning as WarningIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

// ========== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ==========

const StyledTableContainer = styled(TableContainer)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    marginBottom: '16px',
});

const StyledTableRow = styled(TableRow)({
    '&:nth-of-type(odd)': { backgroundColor: '#FFFFFF' },
    '&:nth-of-type(even)': { backgroundColor: '#F9FAFB' },
    '&:hover': { backgroundColor: '#EEF2FF !important' },
    '&:last-child td': { borderBottom: 0 },
});


const UnpaidBanner = styled(Paper)({
    padding: '16px 20px',
    marginBottom: '20px',
    borderRadius: '12px',
    backgroundColor: '#FFFBEB',
    border: '1px solid #FDE68A',
    boxShadow: 'none',
});

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

// ========== ОСНОВНОЙ КОМПОНЕНТ ==========
function Payments() {
    const { user } = useAuth();
    const { getStudentRateForTutor } = useStudentRate();

    const [payments, setPayments] = useState([]);
    const [students, setStudents] = useState([]);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterMonth, setFilterMonth] = useState(null);
    const [orderBy, setOrderBy] = useState('paymentDate');
    const [order, setOrder] = useState('desc');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [viewMode, setViewMode] = useState('table');
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const [monthlyData, setMonthlyData] = useState([]);

    useEffect(() => {
        if (user && user.id) fetchData();
    }, [user]);

    useEffect(() => {
        calculateMonthlyData();
    }, [payments]);

    const fetchData = async () => {
        if (!user || !user.id) return;
        try {
            setLoading(true);
            const [paymentsRes, studentsRes, lessonsRes] = await Promise.all([
                axiosInstance.get(`/payments/tutor/${user.id}`),
                axiosInstance.get(`/students/tutor/${user.id}`),
                getAllLessons(user.id)
            ]);
            setPayments(paymentsRes.data || []);
            setStudents(studentsRes.data || []);
            setAllLessons(lessonsRes.data !== undefined ? lessonsRes.data : lessonsRes);
            setError(null);
        } catch (err) {
            console.error('Ошибка при загрузке:', err);
            setError('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const calculateMonthlyData = () => {
        const now = new Date();
        const months = eachMonthOfInterval({ start: subMonths(now, 5), end: now });
        const data = months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            
            // Платежи из таблицы payments
            const monthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= monthStart && paymentDate <= monthEnd &&
                    (p.status === 'PAID' || p.status === 'paid');
            });
            
            // ID занятий, уже учтённых в платежах
            const paidLessonIds = new Set(monthPayments.map(p => p.lesson?.id).filter(id => id));
            
            // Оплаченные занятия, не учтённые в платежах
            const paidLessonsIncome = Array.isArray(allLessons)
                ? allLessons
                    .filter(l => {
                        const lessonDate = new Date(l.lessonDate);
                        return lessonDate >= monthStart && lessonDate <= monthEnd && 
                            l.status === 'PAID' && !paidLessonIds.has(l.id);
                    })
                    .reduce((sum, l) => {
                        const student = students.find(s => s.id === l.student?.id);
                        return sum + (getStudentRateForTutor(student, user.id) || 0);
                    }, 0)
                : 0;
            
            return {
                month: format(month, 'MMM', { locale: ru }),
                fullMonth: format(month, 'LLLL yyyy', { locale: ru }),
                total: monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + paidLessonsIncome,
                count: monthPayments.length
            };
        });
        setMonthlyData(data);
    };


    const handleRequestSort = (property) => {
        const isAsc = orderBy === property && order === 'asc';
        setOrder(isAsc ? 'desc' : 'asc');
        setOrderBy(property);
    };

    const sortPayments = (array) => {
        const sorted = [...array];
        sorted.sort((a, b) => {
            let aValue, bValue;
            switch (orderBy) {
                case 'paymentDate': aValue = new Date(a.paymentDate); bValue = new Date(b.paymentDate); break;
                case 'amount': aValue = a.amount; bValue = b.amount; break;
                case 'studentName':
                    const studentA = students.find(s => s.id === a.student?.id);
                    const studentB = students.find(s => s.id === b.student?.id);
                    aValue = studentA?.fullName || ''; bValue = studentB?.fullName || ''; break;
                default: aValue = a[orderBy]; bValue = b[orderBy];
            }
            return order === 'asc' ? (aValue < bValue ? -1 : aValue > bValue ? 1 : 0) : (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
        });
        return sorted;
    };

    const getFilteredPayments = () => {
        let filtered = payments.filter(p =>
            p.status === 'PAID' || p.status === 'paid' || p.status === 'REJECTED' || p.status === 'rejected'
        );

        const paidLessonPayments = Array.isArray(allLessons)
            ? allLessons
                .filter(l => l.status === 'PAID')
                .filter(l => {
                    // Исключаем уже учтённые в таблице payments
                    const alreadyInPayments = payments.some(p => p.lesson?.id === l.id);
                    return !alreadyInPayments;
                })
                .map(l => ({
                    id: `lesson-${l.id}`,
                    paymentDate: l.lessonDate,
                    lessonDate: l.lessonDate,
                    student: l.student,
                    courseName: l.course?.name || 'Занятие',
                    amount: (() => {
                        const student = students.find(s => s.id === l.student?.id);
                        return getStudentRateForTutor(student, user?.id) || 0;
                    })(),
                    paymentType: l.student?.paymentType || 'single',
                    status: 'PAID',
                    isManual: true,
                }))
            : [];

        filtered = [...filtered, ...paidLessonPayments];

        if (searchTerm) {
            filtered = filtered.filter(p => {
                const student = students.find(s => s.id === p.student?.id);
                return student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.amount?.toString().includes(searchTerm);
            });
        }
        if (filterType === 'subscription') {
            filtered = filtered.filter(p => p.paymentType === 'subscription' || p.courseName?.includes('Абонемент'));
        } else if (filterType === 'single') {
            filtered = filtered.filter(p => p.paymentType !== 'subscription' && !p.courseName?.includes('Абонемент'));
        }
        if (filterMonth) {
            const mStart = startOfMonth(filterMonth);
            const mEnd = endOfMonth(filterMonth);
            filtered = filtered.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= mStart && paymentDate <= mEnd;
            });
        }
        return filtered;
    };

    const getUnpaidLessons = () => {
        const now = new Date();
        const startOfMonthDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const monthLessons = Array.isArray(allLessons) ? allLessons.filter(l => {
            const lessonDate = new Date(l.lessonDate);
            return lessonDate >= startOfMonthDate && lessonDate <= endOfMonthDate;
        }) : [];
        return monthLessons.filter(l => l.status === 'COMPLETED').map(lesson => {
            const student = students.find(s => s.id === lesson.student?.id);
            const correctRate = getStudentRateForTutor(student, lesson.tutor?.id);
            return {
                id: lesson.id,
                studentName: student?.fullName || 'Неизвестно',
                studentId: student?.id,
                date: lesson.lessonDate,
                time: lesson.startTime?.slice(0, 5),
                amount: correctRate || 0,
                course: lesson.course?.name
            };
        });
    };

    const filteredPayments = getFilteredPayments();
    const sortedPayments = sortPayments(filteredPayments);
    const paginatedPayments = sortedPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
    const unpaidLessons = getUnpaidLessons();
    const maxMonthlyTotal = Math.max(...monthlyData.map(d => d.total), 1);

    const getStudentName = (studentId) => {
        const student = students.find(s => s.id === studentId);
        return student?.fullName || 'Неизвестно';
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'PAID':
            case 'paid':
                return (
                    <Box className="badge badge-success">
                        <CheckIcon sx={{ fontSize: 12 }} />
                        Оплачено
                    </Box>
                );
            case 'REJECTED':
            case 'rejected':
                return (
                    <Box className="badge badge-danger">
                        <CancelIcon sx={{ fontSize: 12 }} />
                        Отклонён
                    </Box>
                );
            default:
                return (
                    <Box className="badge badge-neutral">
                        {status}
                    </Box>
                );
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        return format(new Date(dateStr), 'd MMMM yyyy', { locale: ru });
    };

    const formatDateTime = (dateStr) => {
        if (!dateStr) return '-';
        return format(new Date(dateStr), 'd MMM yyyy, HH:mm', { locale: ru });
    };

    if (loading) return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
            <CircularProgress sx={{ color: '#4F46E5' }} />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ width: '100%' }}>
                {/* ========== ПЕРЕКЛЮЧАТЕЛЬ ВИДА ========== */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                    <ViewToggle>
                        <ViewToggleBtn active={viewMode === 'table'} onClick={() => setViewMode('table')} startIcon={<ReceiptIcon sx={{ fontSize: 18 }} />}>
                            Список
                        </ViewToggleBtn>
                        <ViewToggleBtn active={viewMode === 'chart'} onClick={() => setViewMode('chart')} startIcon={<TrendingUpIcon sx={{ fontSize: 18 }} />}>
                            Аналитика
                        </ViewToggleBtn>
                        <ViewToggleBtn active={viewMode === 'receipts'} onClick={() => setViewMode('receipts')} startIcon={<VisibilityIcon sx={{ fontSize: 18 }} />}>
                            Чеки
                        </ViewToggleBtn>
                    </ViewToggle>

                    <Tooltip title="Обновить">
                        <IconButton size="small" onClick={fetchData} sx={{ color: '#6B7280', '&:hover': { color: '#4F46E5', bgcolor: '#EEF2FF' } }}>
                            <RefreshIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {/* ==================== ВКЛАДКА ЧЕКИ ==================== */}
                {viewMode === 'receipts' && (
                    <>
                        <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 2 }}>
                            📄 Чеки об оплате
                        </Typography>

                        {payments.filter(p => p.receiptPath).length === 0 ? (
                            <Paper sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                <EmptyStateContainer>
                                    <EmptyStateIcon>
                                        <ReceiptIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
                                    </EmptyStateIcon>
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                                        Нет загруженных чеков
                                    </Typography>
                                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                                        Здесь будут отображаться чеки, загруженные учениками
                                    </Typography>
                                </EmptyStateContainer>
                            </Paper>
                        ) : (
                            <StyledTableContainer component={Paper} elevation={0}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Дата</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Ученик</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Сумма</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Статус</TableCell>
                                            <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Чек</TableCell>
                                            <TableCell align="center" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Действия</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {payments
                                            .filter(p => p.receiptPath)
                                            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                                            .map(payment => {
                                                const studentName = getStudentName(payment.student?.id);
                                                const isPending = payment.status === 'PAID' || payment.status === 'paid';
                                                return (
                                                    <StyledTableRow key={payment.id}>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                                {formatDate(payment.paymentDate)}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(studentName), fontSize: 12, fontWeight: 600 }}>
                                                                    {getInitials(studentName)}
                                                                </Avatar>
                                                                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                                                                    {studentName}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>
                                                                {payment.amount?.toLocaleString()} ₽
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            {getStatusBadge(payment.status)}
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <StyledButton 
                                                                variant="outlined" 
                                                                size="small"
                                                                href={`https://ed-space.ru${payment.receiptPath}`} 
                                                                target="_blank" 
                                                                startIcon={<ReceiptIcon sx={{ fontSize: 14 }} />}
                                                                sx={{ borderColor: '#D1D5DB', color: '#374151', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#9CA3AF' } }}
                                                            >
                                                                Открыть
                                                            </StyledButton>
                                                        </TableCell>
                                                        <TableCell align="center" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            {isPending && (
                                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                                    <StyledButton
                                                                        variant="contained"
                                                                        size="small"
                                                                        onClick={async () => {
                                                                            await axiosInstance.patch(`/payments/${payment.id}/status`, { status: 'PAID' });
                                                                            setSnackbar({ open: true, message: '✅ Платёж подтверждён', severity: 'success' });
                                                                            fetchData();
                                                                        }}
                                                                        sx={{ bgcolor: '#10B981', '&:hover': { bgcolor: '#059669' }, color: '#fff' }}
                                                                    >
                                                                        ✅ Подтвердить
                                                                    </StyledButton>
                                                                    <StyledButton
                                                                        variant="outlined"
                                                                        size="small"
                                                                        color="error"
                                                                        onClick={async () => {
                                                                            if (!window.confirm('Отклонить платёж?')) return;
                                                                            await axiosInstance.patch(`/payments/${payment.id}/status`, { status: 'REJECTED' });
                                                                            setSnackbar({ open: true, message: '❌ Платёж отклонён', severity: 'warning' });
                                                                            fetchData();
                                                                        }}
                                                                        sx={{ borderColor: '#FECACA', color: '#DC2626', '&:hover': { bgcolor: '#FEF2F2', borderColor: '#EF4444' } }}
                                                                    >
                                                                        ❌ Отклонить
                                                                    </StyledButton>
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    </StyledTableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </StyledTableContainer>
                        )}
                    </>
                )}

                {/* ==================== ВКЛАДКА АНАЛИТИКА ==================== */}
                {viewMode === 'chart' && (
                    <>
                        {unpaidLessons.length > 0 && (
                            <UnpaidBanner elevation={0}>
                                <Typography sx={{ fontWeight: 600, color: '#92400E', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, fontSize: '14px' }}>
                                    <WarningIcon sx={{ fontSize: 18, color: '#F59E0B' }} />
                                    Ожидают оплаты ({unpaidLessons.length})
                                </Typography>
                                <Grid container spacing={1.5}>
                                    {unpaidLessons.slice(0, 4).map(lesson => (
                                        <Grid item xs={12} sm={6} md={3} key={lesson.id}>
                                            <Card sx={{ borderRadius: '8px', border: '1px solid #FDE68A', boxShadow: 'none' }}>
                                                <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                                                    <Typography sx={{ fontWeight: 500, fontSize: '14px', color: '#1F2937' }}>
                                                        {lesson.studentName}
                                                    </Typography>
                                                    <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                                                        {formatDate(lesson.date)} в {lesson.time}
                                                    </Typography>
                                                    <Typography sx={{ fontWeight: 600, color: '#D97706', fontSize: '14px', mt: 0.5 }}>
                                                        {lesson.amount} ₽
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                {unpaidLessons.length > 4 && (
                                    <Typography sx={{ fontSize: '12px', color: '#6B7280', mt: 1 }}>
                                        и ещё {unpaidLessons.length - 4} занятий
                                    </Typography>
                                )}
                            </UnpaidBanner>
                        )}

                        <Paper sx={{ p: 3, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 3 }}>
                                Динамика платежей
                            </Typography>
                            <Box sx={{ height: 200, mb: 3 }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: '2%', height: '100%', px: 1 }}>
                                    {monthlyData.map((item, idx) => {
                                        const height = maxMonthlyTotal > 0 ? (item.total / maxMonthlyTotal) * 160 : 0;
                                        const isHighest = item.total === maxMonthlyTotal && item.total > 0;
                                        return (
                                            <Tooltip key={idx} title={`${item.fullMonth}: ${item.total.toLocaleString()} ₽ (${item.count} платежей)`} arrow>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Box sx={{
                                                        height: Math.max(height, 4),
                                                        background: isHighest
                                                            ? 'linear-gradient(180deg, #4F46E5 0%, #7C3AED 100%)'
                                                            : 'linear-gradient(180deg, #A5B4FC 0%, #C7D2FE 100%)',
                                                        borderRadius: '8px 8px 4px 4px',
                                                        transition: 'all 0.3s ease',
                                                        cursor: 'pointer',
                                                        '&:hover': { opacity: 0.85, transform: 'scaleY(1.05)', transformOrigin: 'bottom' }
                                                    }} />
                                                    <Typography sx={{ fontSize: '11px', mt: 1, display: 'block', fontWeight: isHighest ? 600 : 400, color: isHighest ? '#4F46E5' : '#6B7280' }}>
                                                        {item.month}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Box>
                            <Divider sx={{ my: 2, borderColor: '#F3F4F6' }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <StatCard elevation={0}>
                                        <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#10B981' }}>
                                                {monthlyData[monthlyData.length - 1]?.total.toLocaleString() || 0} ₽
                                            </Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                {monthlyData[monthlyData.length - 1]?.fullMonth || '-'}
                                            </Typography>
                                        </CardContent>
                                    </StatCard>
                                </Grid>
                                <Grid item xs={6}>
                                    <StatCard elevation={0}>
                                        <CardContent sx={{ textAlign: 'center', py: 2, '&:last-child': { pb: 2 } }}>
                                            <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#F59E0B' }}>
                                                {monthlyData.length > 0
                                                    ? Math.round(monthlyData.reduce((sum, d) => sum + d.total, 0) / monthlyData.length).toLocaleString()
                                                    : 0} ₽
                                            </Typography>
                                            <Typography sx={{ fontSize: '13px', color: '#6B7280' }}>
                                                Средний доход за месяц
                                            </Typography>
                                        </CardContent>
                                    </StatCard>
                                </Grid>
                            </Grid>
                        </Paper>
                    </>
                )}

                {/* ==================== ВКЛАДКА СПИСОК ==================== */}
                {viewMode === 'table' && (
                    <>
                        {/* Фильтры */}
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3, alignItems: 'center' }}>
                            <TextField
                                placeholder="Поиск по ученику, предмету, сумме..."
                                size="small"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                sx={{ 
                                    width: 280,
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '8px',
                                        backgroundColor: '#FFFFFF',
                                        '& fieldset': { borderColor: '#E5E7EB' },
                                        '&:hover fieldset': { borderColor: '#D1D5DB' },
                                        '&.Mui-focused fieldset': { borderColor: '#4F46E5', boxShadow: '0 0 0 3px rgba(79,70,229,0.1)' },
                                    },
                                }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon sx={{ fontSize: 18, color: '#9CA3AF' }} />
                                        </InputAdornment>
                                    ),
                                    endAdornment: searchTerm && (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setSearchTerm('')}>
                                                <ClearIcon sx={{ fontSize: 16 }} />
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <FormControl size="small" sx={{ minWidth: 140 }}>
                                <InputLabel sx={{ fontSize: '13px' }}>Тип</InputLabel>
                                <Select 
                                    value={filterType} 
                                    onChange={(e) => setFilterType(e.target.value)} 
                                    label="Тип"
                                    sx={{
                                        borderRadius: '8px',
                                        '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E5E7EB' },
                                        '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#D1D5DB' },
                                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' },
                                    }}
                                >
                                    <MenuItem value="all">Все</MenuItem>
                                    <MenuItem value="subscription">Абонементы</MenuItem>
                                    <MenuItem value="single">Поурочные</MenuItem>
                                </Select>
                            </FormControl>
                            <DatePicker
                                label="Месяц"
                                value={filterMonth}
                                onChange={setFilterMonth}
                                views={['year', 'month']}
                                format="LLLL yyyy"
                                slotProps={{ 
                                    textField: { 
                                        size: 'small', 
                                        sx: { 
                                            width: 160,
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px',
                                                '& fieldset': { borderColor: '#E5E7EB' },
                                                '&:hover fieldset': { borderColor: '#D1D5DB' },
                                                '&.Mui-focused fieldset': { borderColor: '#4F46E5' },
                                            },
                                        } 
                                    } 
                                }}
                            />
                            {(searchTerm || filterType !== 'all' || filterMonth) && (
                                <StyledButton 
                                    size="small" 
                                    onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterMonth(null); }}
                                    startIcon={<ClearIcon sx={{ fontSize: 14 }} />}
                                    sx={{ color: '#6B7280', '&:hover': { bgcolor: '#F3F4F6' } }}
                                >
                                    Сбросить
                                </StyledButton>
                            )}
                        </Box>

                        {error ? (
                            <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{error}</Alert>
                        ) : filteredPayments.length === 0 ? (
                            <Paper sx={{ borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
                                <EmptyStateContainer>
                                    <EmptyStateIcon>
                                        <ReceiptIcon sx={{ fontSize: 40, color: '#9CA3AF' }} />
                                    </EmptyStateIcon>
                                    <Typography sx={{ fontSize: '18px', fontWeight: 600, color: '#1F2937', mb: 1 }}>
                                        Нет платежей
                                    </Typography>
                                    <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                                        {searchTerm || filterType !== 'all' || filterMonth
                                            ? 'Попробуйте изменить параметры фильтрации'
                                            : 'Здесь будут отображаться подтверждённые платежи'}
                                    </Typography>
                                </EmptyStateContainer>
                            </Paper>
                        ) : (
                            <>
                                <StyledTableContainer component={Paper} elevation={0}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                                    <TableSortLabel active={orderBy === 'paymentDate'} direction={orderBy === 'paymentDate' ? order : 'asc'} onClick={() => handleRequestSort('paymentDate')}>
                                                        Дата
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                                    <TableSortLabel active={orderBy === 'studentName'} direction={orderBy === 'studentName' ? order : 'asc'} onClick={() => handleRequestSort('studentName')}>
                                                        Ученик
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Предмет</TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Тип</TableCell>
                                                <TableCell align="right" sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                                                    <TableSortLabel active={orderBy === 'amount'} direction={orderBy === 'amount' ? order : 'asc'} onClick={() => handleRequestSort('amount')}>
                                                        Сумма
                                                    </TableSortLabel>
                                                </TableCell>
                                                <TableCell sx={{ fontWeight: 600, fontSize: '12px', color: '#6B7280', backgroundColor: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>Дата занятия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedPayments.map((payment) => {
                                                const studentName = getStudentName(payment.student?.id);
                                                const isSubscription = payment.paymentType === 'subscription' || payment.courseName?.includes('Абонемент');
                                                return (
                                                    <StyledTableRow key={payment.id}>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarIcon sx={{ fontSize: 14, color: '#9CA3AF' }} />
                                                                <Typography sx={{ fontSize: '14px', color: '#1F2937' }}>
                                                                    {formatDate(payment.paymentDate)}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar sx={{ width: 32, height: 32, bgcolor: getAvatarColor(studentName), fontSize: 12, fontWeight: 600 }}>
                                                                    {getInitials(studentName)}
                                                                </Avatar>
                                                                <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#1F2937' }}>
                                                                    {studentName}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Chip 
                                                                icon={<SchoolIcon sx={{ fontSize: 12, color: '#6B7280 !important' }} />}
                                                                label={payment.courseName || payment.lesson?.course?.name || 'Занятие'} 
                                                                size="small" 
                                                                variant="outlined" 
                                                                sx={{ borderRadius: '6px', borderColor: '#E5E7EB', color: '#6B7280', fontSize: '12px' }}
                                                            />
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Chip
                                                                label={isSubscription ? 'Абонемент' : 'Поурочно'}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: isSubscription ? '#EEF2FF' : '#F3F4F6',
                                                                    color: isSubscription ? '#4F46E5' : '#374151',
                                                                    fontWeight: 500,
                                                                    fontSize: '11px',
                                                                    borderRadius: '100px',
                                                                }}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right" sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Typography sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>
                                                                {(payment.amount || 0).toLocaleString()} ₽
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell sx={{ borderBottom: '1px solid #F3F4F6' }}>
                                                            <Typography sx={{ fontSize: '14px', color: '#6B7280' }}>
                                                                {payment.lessonDate ? formatDate(payment.lessonDate) : '-'}
                                                            </Typography>
                                                        </TableCell>
                                                    </StyledTableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </StyledTableContainer>
                                {filteredPayments.length > rowsPerPage && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Pagination 
                                            count={Math.ceil(filteredPayments.length / rowsPerPage)} 
                                            page={page + 1} 
                                            onChange={(e, newPage) => setPage(newPage - 1)} 
                                            size="small"
                                            sx={{
                                                '& .MuiPaginationItem-root': { borderRadius: '8px', color: '#6B7280' },
                                                '& .Mui-selected': { backgroundColor: '#4F46E5 !important', color: '#FFFFFF' },
                                            }}
                                        />
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}

                <Snackbar 
                    open={snackbar.open} 
                    autoHideDuration={4000} 
                    onClose={() => setSnackbar({ ...snackbar, open: false })} 
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                >
                    <Alert severity={snackbar.severity} sx={{ borderRadius: '8px' }}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
}

export default Payments;