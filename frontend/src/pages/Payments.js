// ========== frontend/src/pages/Payments.js (ПОЛНАЯ ВЕРСИЯ С КНОПКАМИ ПОДТВЕРДИТЬ/ОТКЛОНИТЬ) ==========
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
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ruLocale from 'date-fns/locale/ru';
import {
    Search,
    AttachMoney as MoneyIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    CalendarToday as CalendarIcon,
    Receipt as ReceiptIcon,
    Download as DownloadIcon,
    Refresh as RefreshIcon,
    TrendingUp as TrendingUpIcon,
    Payment as PaymentIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useStudentRate } from '../hooks/useStudentRate';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

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
        if (user && user.id) {
            fetchData();
        }
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
        const months = eachMonthOfInterval({
            start: subMonths(now, 5),
            end: now
        });

        const data = months.map(month => {
            const monthStart = startOfMonth(month);
            const monthEnd = endOfMonth(month);
            const monthPayments = payments.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= monthStart && paymentDate <= monthEnd &&
                    (p.status === 'CONFIRMED' || p.status === 'PAID' || p.status === 'paid');
            });
            const total = monthPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
            const count = monthPayments.length;

            return {
                month: format(month, 'MMM', { locale: ru }),
                fullMonth: format(month, 'LLLL yyyy', { locale: ru }),
                total,
                count
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
                case 'paymentDate':
                    aValue = new Date(a.paymentDate);
                    bValue = new Date(b.paymentDate);
                    break;
                case 'amount':
                    aValue = a.amount;
                    bValue = b.amount;
                    break;
                case 'studentName':
                    const studentA = students.find(s => s.id === a.student?.id);
                    const studentB = students.find(s => s.id === b.student?.id);
                    aValue = studentA?.fullName || '';
                    bValue = studentB?.fullName || '';
                    break;
                default:
                    aValue = a[orderBy];
                    bValue = b[orderBy];
            }

            if (order === 'asc') {
                return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
            } else {
                return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
            }
        });
        return sorted;
    };

    const getFilteredPayments = () => {
        let filtered = payments.filter(p =>
            p.status === 'PAID' || p.status === 'CONFIRMED' || p.status === 'REJECTED' ||
            p.status === 'paid' || p.status === 'pending'
        );

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
            const monthStart = startOfMonth(filterMonth);
            const monthEnd = endOfMonth(filterMonth);
            filtered = filtered.filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= monthStart && paymentDate <= monthEnd;
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

        const unpaid = monthLessons.filter(l => l.status === 'COMPLETED');

        return unpaid.map(lesson => {
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

    const getPaymentTypeChip = (payment) => {
        const isSubscription = payment.paymentType === 'subscription' || payment.courseName?.includes('Абонемент');
        return (
            <Chip
                label={isSubscription ? 'Абонемент' : 'Поурочно'}
                size="small"
                color={isSubscription ? 'primary' : 'default'}
                sx={{ borderRadius: 1.5, fontWeight: 500 }}
            />
        );
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
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ruLocale}>
            <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Tabs
                        value={viewMode}
                        onChange={(e, v) => setViewMode(v)}
                        sx={{ minHeight: 36 }}
                    >
                        <Tab value="table" icon={<ReceiptIcon />} label="Список" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
                        <Tab value="chart" icon={<TrendingUpIcon />} label="Аналитика" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
                        <Tab value="receipts" icon={<ReceiptIcon />} label="Чеки" sx={{ textTransform: 'none', minHeight: 36, py: 0 }} />
                    </Tabs>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Обновить">
                            <IconButton size="small" onClick={fetchData}>
                                <RefreshIcon />
                            </IconButton>
                        </Tooltip>
                    </Box>
                </Box>

                {/* ==================== Вкладка ЧЕКИ ==================== */}
                {viewMode === 'receipts' && (
                    <>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                            📄 Чеки об оплате
                        </Typography>

                        {payments.filter(p => p.receiptPath).length === 0 ? (
                            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                <ReceiptIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary" gutterBottom>
                                    Нет загруженных чеков
                                </Typography>
                            </Paper>
                        ) : (
                            <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                                <Table stickyHeader>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Дата</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Ученик</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Сумма</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Статус</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Чек</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }} align="center">Действия</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {payments
                                            .filter(p => p.receiptPath)
                                            .sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate))
                                            .map(payment => {
                                                const studentName = getStudentName(payment.student?.id);
                                                const isPending = payment.status === 'PAID';
                                                const isConfirmed = payment.status === 'CONFIRMED';
                                                const isRejected = payment.status === 'REJECTED';
                                                return (
                                                    <TableRow key={payment.id} sx={{ '&:hover': { bgcolor: '#fafafa' }, bgcolor: isPending ? '#FFF8E1' : 'inherit' }}>
                                                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <Avatar sx={{ width: 28, height: 28, bgcolor: '#ff6b6b', fontSize: 12 }}>
                                                                    {studentName?.charAt(0) || 'У'}
                                                                </Avatar>
                                                                {studentName}
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography fontWeight={600} color="success.main">
                                                                {payment.amount?.toLocaleString()} ₽
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            {isConfirmed && <Chip label="✅ Подтверждён" size="small" color="success" />}
                                                            {isPending && <Chip label="⏳ Ожидает проверки" size="small" color="warning" />}
                                                            {isRejected && <Chip label="❌ Отклонён" size="small" color="error" />}
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button size="small" variant="outlined" href={`https://ed-space.ru${payment.receiptPath}`} target="_blank" startIcon={<ReceiptIcon />}>Открыть</Button>
                                                        </TableCell>
                                                        <TableCell align="center">
                                                            {isPending && (
                                                                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                                                                    <Button size="small" variant="contained" color="success"
                                                                        onClick={async () => {
                                                                            await axiosInstance.patch(`/payments/${payment.id}/status`, { status: 'CONFIRMED' });
                                                                            setSnackbar({ open: true, message: '✅ Платёж подтверждён', severity: 'success' });
                                                                            fetchData();
                                                                        }}>✅ Подтвердить</Button>
                                                                    <Button size="small" variant="outlined" color="error"
                                                                        onClick={async () => {
                                                                            if (!window.confirm('Отклонить платёж?')) return;
                                                                            await axiosInstance.patch(`/payments/${payment.id}/status`, { status: 'REJECTED' });
                                                                            setSnackbar({ open: true, message: '❌ Платёж отклонён', severity: 'warning' });
                                                                            fetchData();
                                                                        }}>❌ Отклонить</Button>
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        )}
                    </>
                )}

                {/* Вкладка АНАЛИТИКА */}
                {viewMode === 'chart' && (
                    <>
                        {unpaidLessons.length > 0 && (
                            <Paper sx={{ p: 2, mb: 3, borderRadius: 3, bgcolor: '#FFF8E7', border: '1px solid #FFE0B5' }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: '#ED6C02', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <PaymentIcon sx={{ fontSize: 18 }} />
                                    Ожидают оплаты ({unpaidLessons.length})
                                </Typography>
                                <Grid container spacing={1}>
                                    {unpaidLessons.slice(0, 4).map(lesson => (
                                        <Grid item xs={12} sm={6} md={3} key={lesson.id}>
                                            <Card variant="outlined" sx={{ borderRadius: 2 }}>
                                                <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                                                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                        {lesson.studentName}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {formatDate(lesson.date)} в {lesson.time}
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#ED6C02' }}>
                                                        {lesson.amount} ₽
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                {unpaidLessons.length > 4 && (
                                    <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                                        и ещё {unpaidLessons.length - 4} занятий
                                    </Typography>
                                )}
                            </Paper>
                        )}

                        <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                                Динамика платежей
                            </Typography>
                            <Box sx={{ height: 200, position: 'relative' }}>
                                <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: '100%' }}>
                                    {monthlyData.map((item, idx) => {
                                        const height = maxMonthlyTotal > 0 ? (item.total / maxMonthlyTotal) * 160 : 0;
                                        return (
                                            <Tooltip key={idx} title={`${item.fullMonth}: ${item.total.toLocaleString()} ₽ (${item.count} платежей)`} arrow>
                                                <Box sx={{ flex: 1, textAlign: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            height: height,
                                                            bgcolor: '#ff6b6b',
                                                            borderRadius: '8px 8px 4px 4px',
                                                            transition: 'all 0.2s',
                                                            cursor: 'pointer',
                                                            '&:hover': { bgcolor: '#ff5252' }
                                                        }}
                                                    />
                                                    <Typography variant="caption" sx={{ fontSize: '0.7rem', mt: 1, display: 'block' }}>
                                                        {item.month}
                                                    </Typography>
                                                </Box>
                                            </Tooltip>
                                        );
                                    })}
                                </Box>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#10B981' }}>
                                            {monthlyData[monthlyData.length - 1]?.total.toLocaleString() || 0} ₽
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            {monthlyData[monthlyData.length - 1]?.fullMonth || '-'}
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={6}>
                                    <Box sx={{ textAlign: 'center' }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600, color: '#F59E0B' }}>
                                            {monthlyData.length > 0
                                                ? Math.round(monthlyData.reduce((sum, d) => sum + d.total, 0) / monthlyData.length).toLocaleString()
                                                : 0} ₽
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary">
                                            Средний доход за месяц
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </>
                )}

                {/* Вкладка СПИСОК */}
                {viewMode === 'table' && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <TextField
                                    placeholder="Поиск по ученику, предмету, сумме..."
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ width: 250 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Тип</InputLabel>
                                    <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} label="Тип">
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
                                    slotProps={{ textField: { size: 'small', sx: { width: 140 } } }}
                                />

                                {(searchTerm || filterType !== 'all' || filterMonth) && (
                                    <Button size="small" variant="text" onClick={() => { setSearchTerm(''); setFilterType('all'); setFilterMonth(null); }}>
                                        Сбросить
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {error ? (
                            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
                        ) : filteredPayments.length === 0 ? (
                            <Paper sx={{ p: 5, textAlign: 'center', borderRadius: 3 }}>
                                <ReceiptIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
                                <Typography variant="h6" color="textSecondary" gutterBottom>Нет платежей</Typography>
                            </Paper>
                        ) : (
                            <>
                                <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden', mb: 2 }}>
                                    <Table stickyHeader>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                                                <TableCell sx={{ fontWeight: 600 }}><TableSortLabel active={orderBy === 'paymentDate'} direction={orderBy === 'paymentDate' ? order : 'asc'} onClick={() => handleRequestSort('paymentDate')}>Дата</TableSortLabel></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}><TableSortLabel active={orderBy === 'studentName'} direction={orderBy === 'studentName' ? order : 'asc'} onClick={() => handleRequestSort('studentName')}>Ученик</TableSortLabel></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Предмет</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Тип</TableCell>
                                                <TableCell sx={{ fontWeight: 600 }} align="right"><TableSortLabel active={orderBy === 'amount'} direction={orderBy === 'amount' ? order : 'asc'} onClick={() => handleRequestSort('amount')}>Сумма</TableSortLabel></TableCell>
                                                <TableCell sx={{ fontWeight: 600 }}>Дата занятия</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {paginatedPayments.map((payment) => {
                                                const studentName = getStudentName(payment.student?.id);
                                                return (
                                                    <TableRow key={payment.id} sx={{ '&:hover': { bgcolor: '#fafafa' }, transition: 'background-color 0.2s' }}>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                <CalendarIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                                                                <Tooltip title={formatDateTime(payment.paymentDate)} arrow>
                                                                    <Typography variant="body2">{formatDate(payment.paymentDate)}</Typography>
                                                                </Tooltip>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                                                <Avatar sx={{ width: 32, height: 32, bgcolor: '#ff6b6b', fontSize: 14 }}>{studentName?.charAt(0) || 'У'}</Avatar>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>{studentName}</Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell><Chip icon={<SchoolIcon sx={{ fontSize: 14 }} />} label={payment.courseName || payment.lesson?.course?.name || 'Занятие'} size="small" variant="outlined" /></TableCell>
                                                        <TableCell>{getPaymentTypeChip(payment)}</TableCell>
                                                        <TableCell align="right"><Typography variant="body1" sx={{ fontWeight: 600, color: '#2E7D32' }}>{(payment.amount || 0).toLocaleString()} ₽</Typography></TableCell>
                                                        <TableCell><Typography variant="body2" color="textSecondary">{payment.lessonDate ? formatDate(payment.lessonDate) : '-'}</Typography></TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                                {filteredPayments.length > rowsPerPage && (
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                        <Pagination count={Math.ceil(filteredPayments.length / rowsPerPage)} page={page + 1} onChange={(e, newPage) => setPage(newPage - 1)} color="primary" size="small" />
                                    </Box>
                                )}
                            </>
                        )}
                    </>
                )}

                <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                    <Alert severity={snackbar.severity} sx={{ width: '100%' }}>{snackbar.message}</Alert>
                </Snackbar>
            </Box>
        </LocalizationProvider>
    );
}

export default Payments;