// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, ListItem, ListItemButton, ListItemIcon, ListItemText,
    IconButton, Tooltip, Typography, Avatar, Badge, Popover,
    Paper, Stack, Button, Drawer
} from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
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
    Menu as MenuIcon,
    TrendingUp as TrendingUpIcon,
    Notifications as NotificationsIcon,
    Group as GroupIcon,
    Draw as DrawIcon,
    School,
    AutoAwesome,
    ChevronLeft,
    ChevronRight
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

// ========== ЦВЕТА ИКОНОК ==========
const ICON_COLORS = {
    'Главная': '#6366F1',
    'Расписание': '#10B981',
    'Ученики': '#F59E0B',
    'Финансы': '#3B82F6',
    'Курсы': '#8B5CF6',
    'Банк заданий': '#EC4899',
    'Материалы': '#06B6D4',
    'Инструменты': '#F97316',
    'Домашние задания': '#EF4444',
    'Архив': '#6B7280',
    'Профиль': '#4F46E5',
    'Задания': '#10B981',
    'Успеваемость': '#F59E0B',
};

// ========== TOUR TARGETS ==========
const TOUR_TARGETS = {
    'Ученики': 'students',
    'Курсы': 'courses',
    'Расписание': 'schedule',
};

// ========== СТИЛИ ==========
const SidebarContainer = styled(Box)(({ collapsed }) => ({
    width: collapsed ? 68 : 260,
    height: '100vh',
    background: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0, top: 0, zIndex: 1200,
    transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
}));

const LogoBox = styled(Box)({
    height: 64,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
});

const NavButton = styled(ListItemButton)(({ active, iconcolor }) => ({
    borderRadius: 14,
    margin: '2px 8px',
    padding: '10px 14px',
    minHeight: 46,
    color: active ? '#fff' : '#9CA3AF',
    backgroundColor: active ? alpha(iconcolor || '#6366F1', 0.2) : 'transparent',
    transition: 'all 0.2s ease',
    '&:hover': {
        backgroundColor: active ? alpha(iconcolor || '#6366F1', 0.3) : 'rgba(255,255,255,0.04)',
        color: '#fff',
    },
}));

const UserSection = styled(Box)({
    borderTop: '1px solid rgba(255,255,255,0.06)',
    flexShrink: 0,
    padding: '12px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
});

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 68;
const MOBILE_BREAKPOINT = 900;

// ========== КОМПОНЕНТ ==========
const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    
    const [collapsed, setCollapsed] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
    const [avatar, setAvatar] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifAnchor, setNotifAnchor] = useState(null);

    const isTutor = user?.role === 'tutor';
    const isStudent = user?.role === 'student';
    const isParent = user?.role === 'parent';

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            document.body.style.transition = 'margin-left 0.25s ease';
            document.body.style.marginLeft = collapsed ? `${SIDEBAR_COLLAPSED}px` : `${SIDEBAR_WIDTH}px`;
        } else {
            document.body.style.marginLeft = '0px';
        }
        return () => { document.body.style.marginLeft = '0px'; };
    }, [collapsed, isMobile]);

    const fetchAvatar = async () => {
        if (!user?.id || !isTutor) return;
        try {
            const response = await axiosInstance.get(`/tutors/${user.id}/avatar`);
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
            if (['HOMEWORK_ASSIGNED','HOMEWORK_SUBMITTED','HOMEWORK_RETURNED','HOMEWORK_CHECKED'].includes(n.notificationType)) {
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
        } catch (err) {}
    };

    const handleLogout = () => { logout(); navigate('/login'); };
    
    const handleNavigation = (path) => {
        navigate(path);
        if (isMobile) setMobileOpen(false);
    };

    const handleMouseEnter = () => { if (!isMobile) setCollapsed(false); };
    const handleMouseLeave = () => { if (!isMobile) setCollapsed(true); };

    const getIconColor = (label) => ICON_COLORS[label] || '#9CA3AF';
    const getTourTarget = (label) => TOUR_TARGETS[label] || undefined;

    const menuGroups = isTutor ? [
        { title: 'Основное', items: [
            { path: '/dashboard', label: 'Главная' },
            { path: '/weekly-schedule', label: 'Расписание' },
            { path: '/students', label: 'Ученики' },
            { path: '/groups', label: 'Группы' },
            { path: '/finance', label: 'Финансы' },
        ]},
        { title: 'Обучение', items: [
            { path: '/courses', label: 'Курсы' },
            { path: '/task-bank', label: 'Банк заданий' },
            { path: '/materials', label: 'Материалы' },
            { path: '/tools', label: 'Инструменты' },
            { path: '/extracurricular', label: 'Домашние задания' },
        ]},
        { title: 'Ещё', items: [
            { path: '/lessons-archive', label: 'Архив' },
            { path: '/profile', label: 'Профиль' },
        ]},
    ] : isStudent ? [
        { title: '', items: [
            { path: '/student', label: 'Главная' },
            { path: '/student/homework', label: 'Задания' },
            { path: '/student/materials', label: 'Материалы' },
            { path: '/student/tools', label: 'Инструменты' },
            { path: '/student/progress', label: 'Успеваемость' },
            { path: '/student/profile', label: 'Профиль' },
        ]},
    ] : [
        { title: '', items: [
            { path: '/parent/dashboard', label: 'Главная' },
            { path: '/parent/profile', label: 'Профиль' },
        ]},
    ];

    const iconMap = {
        'Главная': <DashboardIcon />,
        'Расписание': <CalendarIcon />,
        'Ученики': <PeopleIcon />,
        'Финансы': <MoneyIcon />,
        'Группы': <GroupIcon />,
        'Курсы': <BookIcon />,
        'Банк заданий': <AssignmentIcon />,
        'Материалы': <FolderIcon />,
        'Инструменты': <DrawIcon />,
        'Домашние задания': <AssignmentIcon />,
        'Архив': <ArchiveIcon />,
        'Профиль': <PersonIcon />,
        'Задания': <AssignmentIcon />,
        'Успеваемость': <TrendingUpIcon />,
    };

    const isActive = (path) => location.pathname === path;

    const NotificationBell = () => (
        <>
            <Tooltip title="Уведомления" placement="right">
                <IconButton onClick={(e) => setNotifAnchor(e.currentTarget)} sx={{ color: '#9CA3AF', '&:hover': { color: '#fff' } }}>
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon />
                    </Badge>
                </IconButton>
            </Tooltip>
            <Popover open={Boolean(notifAnchor)} anchorEl={notifAnchor} onClose={() => setNotifAnchor(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Paper sx={{ width: 350, maxHeight: 400, overflow: 'auto', p: 2, borderRadius: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>🔔 Уведомления {unreadCount > 0 && `(${unreadCount})`}</Typography>
                        {unreadCount > 0 && (
                            <Button size="small" onClick={handleMarkAllAsRead} sx={{ fontSize: '0.75rem', textTransform: 'none', color: '#6366F1' }}>Прочитать всё</Button>
                        )}
                    </Box>
                    {notifications.length === 0 ? (
                        <Typography variant="body2" color="textSecondary">Нет уведомлений</Typography>
                    ) : (
                        <Stack spacing={1}>
                            {notifications.slice(0, 20).map(n => (
                                <Paper key={n.id} sx={{ p: 1.5, bgcolor: n.read ? 'transparent' : alpha('#6366F1', 0.06), cursor: 'pointer', borderRadius: 2, '&:hover': { bgcolor: alpha('#6366F1', 0.1) } }}
                                    onClick={() => handleMarkAsRead(n)}>
                                    <Typography variant="body2">{n.message}</Typography>
                                    <Typography variant="caption" color="textSecondary">{new Date(n.createdAt).toLocaleString('ru-RU')}</Typography>
                                </Paper>
                            ))}
                        </Stack>
                    )}
                </Paper>
            </Popover>
        </>
    );

    const sidebarContent = (
        <Box sx={{ height: '100%', bgcolor: '#111827', display: 'flex', flexDirection: 'column' }}>
            <LogoBox>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ width: 34, height: 34, borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AutoAwesome sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                    <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>EdSpace</Typography>
                </Box>
            </LogoBox>

            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                {menuGroups.map((group, gi) => (
                    <Box key={gi} sx={{ mb: 1 }}>
                        {group.title && (
                            <Typography sx={{ px: 3, py: 1, color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {group.title}
                            </Typography>
                        )}
                        {group.items.map((item) => {
                            const active = isActive(item.path);
                            const color = getIconColor(item.label);
                            const tourTarget = getTourTarget(item.label);
                            return (
                                <ListItem key={item.path} disablePadding>
                                    <NavButton 
                                        onClick={() => handleNavigation(item.path)} 
                                        active={active} 
                                        iconcolor={color}
                                        data-tour={tourTarget}
                                    >
                                        <ListItemIcon sx={{ color: active ? color : '#9CA3AF', minWidth: 40 }}>
                                            {iconMap[item.label] || <DashboardIcon />}
                                        </ListItemIcon>
                                        <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { fontSize: 14, fontWeight: active ? 600 : 400 } }} />
                                        {active && <Box sx={{ width: 3, height: 20, borderRadius: 2, bgcolor: color }} />}
                                    </NavButton>
                                </ListItem>
                            );
                        })}
                    </Box>
                ))}
            </Box>

            <UserSection>
                <NotificationBell />
                <Avatar src={isTutor ? avatar : null} sx={{ width: 34, height: 34, bgcolor: '#6366F1', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => handleNavigation(isTutor ? '/dashboard' : isStudent ? '/student' : '/parent/dashboard')}>
                    {(!isTutor || !avatar) && (user?.fullName?.charAt(0) || 'U')}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ color: '#F3F4F6', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user?.fullName?.split(' ')[0] || 'Пользователь'}
                    </Typography>
                    <Typography sx={{ color: '#6B7280', fontSize: 11 }}>
                        {isTutor ? 'Репетитор' : isStudent ? 'Ученик' : 'Родитель'}
                    </Typography>
                </Box>
                <IconButton onClick={handleLogout} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                    <LogoutIcon fontSize="small" />
                </IconButton>
            </UserSection>
        </Box>
    );

    if (isMobile) {
        return (
            <>
                <IconButton onClick={() => setMobileOpen(true)}
                    sx={{ position: 'fixed', top: 8, left: 8, zIndex: 1100, bgcolor: 'rgba(17,24,39,0.9)', backdropFilter: 'blur(4px)', color: '#fff', width: 40, height: 40, '&:hover': { bgcolor: '#374151' }, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    <MenuIcon />
                </IconButton>
                <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}
                    PaperProps={{ sx: { width: SIDEBAR_WIDTH, bgcolor: '#111827' } }}>
                    {sidebarContent}
                </Drawer>
            </>
        );
    }

    return (
        <SidebarContainer collapsed={collapsed} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <LogoBox>
                {collapsed ? (
                    <Box sx={{ width: 34, height: 34, borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AutoAwesome sx={{ color: '#fff', fontSize: 18 }} />
                    </Box>
                ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 34, height: 34, borderRadius: '12px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AutoAwesome sx={{ color: '#fff', fontSize: 18 }} />
                        </Box>
                        <Typography sx={{ color: '#fff', fontSize: 20, fontWeight: 700, letterSpacing: '-0.5px' }}>EdSpace</Typography>
                    </Box>
                )}
            </LogoBox>

            <Box sx={{ flex: 1, overflow: 'auto', py: 1 }}>
                {menuGroups.map((group, gi) => (
                    <Box key={gi} sx={{ mb: 1 }}>
                        {group.title && !collapsed && (
                            <Typography sx={{ px: 3, py: 1, color: '#6B7280', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>
                                {group.title}
                            </Typography>
                        )}
                        {group.items.map((item) => {
                            const active = isActive(item.path);
                            const color = getIconColor(item.label);
                            const tourTarget = getTourTarget(item.label);
                            return (
                                <ListItem key={item.path} disablePadding>
                                    <Tooltip title={collapsed ? item.label : ''} placement="right">
                                        <NavButton 
                                            onClick={() => handleNavigation(item.path)} 
                                            active={active} 
                                            iconcolor={color}
                                            sx={{ justifyContent: collapsed ? 'center' : 'flex-start', px: collapsed ? 1.5 : 2 }}
                                            data-tour={tourTarget}
                                        >
                                            <ListItemIcon sx={{ color: active ? color : '#9CA3AF', minWidth: collapsed ? 0 : 40 }}>
                                                {iconMap[item.label] || <DashboardIcon />}
                                            </ListItemIcon>
                                            {!collapsed && <ListItemText primary={item.label} sx={{ '& .MuiTypography-root': { fontSize: 14, fontWeight: active ? 600 : 400 } }} />}
                                        </NavButton>
                                    </Tooltip>
                                </ListItem>
                            );
                        })}
                    </Box>
                ))}
            </Box>

            <UserSection sx={{ justifyContent: collapsed ? 'center' : 'flex-start', flexDirection: collapsed ? 'column' : 'row', gap: collapsed ? 0.5 : 1.5 }}>
                <NotificationBell />
                <Avatar src={isTutor ? avatar : null} sx={{ width: 34, height: 34, bgcolor: '#6366F1', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => handleNavigation(isTutor ? '/dashboard' : isStudent ? '/student' : '/parent/dashboard')}>
                    {(!isTutor || !avatar) && (user?.fullName?.charAt(0) || 'U')}
                </Avatar>
                {!collapsed && (
                    <>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography sx={{ color: '#F3F4F6', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.fullName?.split(' ')[0] || 'Пользователь'}
                            </Typography>
                            <Typography sx={{ color: '#6B7280', fontSize: 11 }}>
                                {isTutor ? 'Репетитор' : isStudent ? 'Ученик' : 'Родитель'}
                            </Typography>
                        </Box>
                        <IconButton onClick={handleLogout} sx={{ color: '#6B7280', '&:hover': { color: '#EF4444' } }}>
                            <LogoutIcon fontSize="small" />
                        </IconButton>
                    </>
                )}
            </UserSection>
        </SidebarContainer>
    );
};

export default Sidebar;