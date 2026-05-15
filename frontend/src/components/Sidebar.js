// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, ListItem, ListItemButton, ListItemIcon, ListItemText,
    IconButton, Tooltip, Typography, Avatar, Badge, Popover,
    Paper, Stack, Button 
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    People as PeopleIcon,
    Assignment as AssignmentIcon,
    Book as BookIcon,
    CalendarMonth as CalendarIcon,
    AttachMoney as MoneyIcon,
    Folder as FolderIcon,
    Archive as ArchiveIcon,
    Logout as LogoutIcon,
    Person as PersonIcon,
    Payment as PaymentIcon,
    ChildCare as ChildCareIcon,
    TrendingUp as TrendingUpIcon,
    Notifications as NotificationsIcon,
    Draw as DrawIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(true);
    const [avatar, setAvatar] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchor, setNotifAnchor] = useState(null);

    const isTutor = user?.role === 'tutor';
    const isStudent = user?.role === 'student';
    const isParent = user?.role === 'parent';

    useEffect(() => {
        document.body.style.transition = 'margin-left 0.2s ease';
        document.body.style.marginLeft = collapsed ? '64px' : '240px';
        return () => { document.body.style.marginLeft = '64px'; };
    }, [collapsed]);

    const fetchAvatar = async () => {
        if (!user?.id || !isTutor) return;
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.get(`/tutors/${user.id}/avatar`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.data?.avatar) setAvatar(response.data.avatar);
        } catch (err) {}
    };

    const fetchNotifications = async () => {
        if (!user) return;
        try {
            if (isTutor) {
                const [notifRes, countRes] = await Promise.all([
                    axiosInstance.get(`/notifications/tutor/${user.id}`),
                    axiosInstance.get(`/notifications/tutor/${user.id}/unread-count`)
                ]);
                setNotifications(notifRes.data || []);
                setUnreadCount(countRes.data?.count || 0);
            } else if (isStudent) {
                const studentId = user.allIds?.[0] || user.id;
                const [notifRes, countRes] = await Promise.all([
                    axiosInstance.get(`/notifications/student/${studentId}`),
                    axiosInstance.get(`/notifications/student/${studentId}/unread-count`)
                ]);
                setNotifications(notifRes.data || []);
                setUnreadCount(countRes.data?.count || 0);
            }
        } catch (err) {}
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, [user]);

    useEffect(() => {
        if (isTutor && user?.id) fetchAvatar();
    }, [user]);

    const handleMarkAsRead = async (n) => {
        try {
            await axiosInstance.patch(`/notifications/${n.id}/read`);
            setNotifications(prev => prev.map(not => not.id === n.id ? { ...not, read: true } : not));
            setUnreadCount(prev => Math.max(0, prev - 1));
            setNotifAnchor(null);
            if (n.notificationType === 'HOMEWORK_ASSIGNED' || n.notificationType === 'HOMEWORK_SUBMITTED' || 
                n.notificationType === 'HOMEWORK_RETURNED' || n.notificationType === 'HOMEWORK_CHECKED') {
                navigate(isTutor ? '/extracurricular' : '/student/homework');
            }
        } catch (err) {}
    };

    const handleMarkAllAsRead = async () => {
        try {
            const endpoint = isTutor 
                ? `/notifications/tutor/${user.id}/read-all`
                : `/notifications/student/${user.id}/read-all`;
            await axiosInstance.patch(endpoint);
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Ошибка при отметке всех уведомлений:', err);
        }
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    const handleNavigation = (path) => navigate(path);
    const handleMouseEnter = () => setCollapsed(false);
    const handleMouseLeave = () => setCollapsed(true);

    const menuGroups = isTutor ? [
        { title: 'Основное', items: [
            { path: '/dashboard', label: 'Главная', icon: <DashboardIcon />, tourId: 'dashboard-link' },
            { path: '/weekly-schedule', label: 'Расписание', icon: <CalendarIcon />, tourId: 'schedule-link' },
            { path: '/students', label: 'Ученики', icon: <PeopleIcon />, tourId: 'students-link' },
            { path: '/finance', label: 'Финансы', icon: <MoneyIcon /> },
        ]},
        { title: 'Обучение', items: [
            { path: '/courses', label: 'Курсы', icon: <BookIcon /> },
            { path: '/task-bank', label: 'Банк заданий', icon: <AssignmentIcon /> },
            { path: '/materials', label: 'Материалы', icon: <FolderIcon /> },
            { path: '/boards', label: 'Доски', icon: <DrawIcon /> },
            { path: '/extracurricular', label: 'Домашние задания', icon: <AssignmentIcon /> },
        ]},
        { title: 'Ещё', items: [
            { path: '/lessons-archive', label: 'Архив', icon: <ArchiveIcon /> },
            { path: '/profile', label: 'Профиль', icon: <PersonIcon /> },
        ]},
    ] : isStudent ? [
        { title: '', items: [
            { path: '/student', label: 'Главная', icon: <DashboardIcon /> },
            { path: '/student/homework', label: 'Задания', icon: <AssignmentIcon /> },
            { path: '/student/materials', label: 'Материалы', icon: <FolderIcon /> },
            { path: '/student/boards', label: 'Доски', icon: <DrawIcon /> },
            { path: '/student/progress', label: 'Успеваемость', icon: <TrendingUpIcon /> },
            { path: '/student/profile', label: 'Профиль', icon: <PersonIcon /> },
        ]},
    ] : [
        { title: '', items: [
            { path: '/parent/dashboard', label: 'Главная', icon: <DashboardIcon /> },
            { path: '/parent/profile', label: 'Профиль', icon: <PersonIcon /> },
        ]},
    ];

    const isActive = (path) => location.pathname === path;

    const NotificationBell = () => (
        <>
            <Tooltip title="Уведомления" placement="right">
                <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: '#D1D5DB', '&:hover': { color: '#fff' } }}>
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Paper sx={{ width: 350, maxHeight: 400, overflow: 'auto', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            🔔 Уведомления {unreadCount > 0 && `(${unreadCount})`}
                        </Typography>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={handleMarkAllAsRead}
                                sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#4F46E5', fontWeight: 500, '&:hover': { backgroundColor: '#EEF2FF' } }}>
                                Прочитать всё
                            </Button>
                        )}
                    </Box>
                    {notifications.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">Нет уведомлений</Typography>
                    ) : (
                        <Stack spacing={1}>
                            {notifications.slice(0, 20).map(n => (
                                <Paper key={n.id} sx={{ p: 1.5, bgcolor: n.read ? 'transparent' : '#EEF2FF', cursor: 'pointer', borderRadius: 2, '&:hover': { bgcolor: '#E8EDFF' } }}
                                    onClick={() => handleMarkAsRead(n)}>
                                    <Typography variant="body2">{n.message}</Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        {new Date(n.createdAt).toLocaleString('ru-RU')}
                                    </Typography>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Paper>
            </Popover>
        </>
    );

    return (
        <Box 
            data-tour="sidebar"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            sx={{
                width: collapsed ? 64 : 240, height: '100vh', bgcolor: '#1F2937',
                display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0,
                zIndex: 1200, transition: 'width 0.2s ease', overflow: 'hidden',
                willChange: 'width, transform',
                transform: 'translateZ(0)',
            }}
        >
            {/* Логотип */}
            <Box sx={{ height: 64, display: 'flex', alignItems: 'center', px: 2, borderBottom: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                {!collapsed && <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px' }}>EdSpace</Typography>}
            </Box>

            {/* Меню */}
            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                {menuGroups.map((group, gi) => (
                    <Box key={gi} sx={{ mb: 2 }}>
                        {group.title && !collapsed && (
                            <Typography sx={{ px: 2.5, py: 1, color: '#6B7280', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {group.title}
                            </Typography>
                        )}
                        {group.items.map((item) => {
                            const active = isActive(item.path);
                            return (
                                <ListItem key={item.path} disablePadding sx={{ px: 1 }}>
                                    <Tooltip title={collapsed ? item.label : ''} placement="right">
                                        <ListItemButton
                                            data-tour={item.tourId}
                                            onClick={() => handleNavigation(item.path)}
                                            sx={{
                                                borderRadius: 2, py: 1.2, px: collapsed ? 1.5 : 2,
                                                color: active ? '#FFFFFF' : '#D1D5DB',
                                                bgcolor: active ? '#374151' : 'transparent',
                                                '&:hover': { bgcolor: active ? '#374151' : 'rgba(255,255,255,0.06)' },
                                                minHeight: 44,
                                                justifyContent: collapsed ? 'center' : 'flex-start'
                                            }}
                                        >
                                            <ListItemIcon sx={{ color: active ? '#FFFFFF' : '#D1D5DB', minWidth: collapsed ? 0 : 40 }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            {!collapsed && <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { fontSize: 14, fontWeight: active ? 500 : 400 } }} />}
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                            );
                        })}
                    </Box>
                ))}
            </Box>

            {/* Низ: уведомления + пользователь */}
            <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 0.5 }}>
                    <NotificationBell />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1.5 }}>
                    <Avatar src={isTutor ? avatar : null} sx={{ width: 32, height: 32, bgcolor: '#4F46E5', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => handleNavigation(isTutor ? '/dashboard' : isStudent ? '/student' : '/parent/dashboard')}>
                        {(!isTutor || !avatar) && (user?.fullName?.charAt(0) || 'U')}
                    </Avatar>
                    {!collapsed && (
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#F3F4F6', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.fullName?.split(' ')[0] || 'Пользователь'}
                            </Typography>
                            <Typography sx={{ color: '#6B7280', fontSize: 11 }}>
                                {isTutor ? 'Репетитор' : isStudent ? 'Ученик' : 'Родитель'}
                            </Typography>
                        </Box>
                    )}
                    {!collapsed && (
                        <IconButton onClick={handleLogout} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </Box>
        </Box>
    );
};

export default Sidebar;