// frontend/src/components/Sidebar.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
    IconButton, Tooltip, Divider, Typography, Avatar
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
    Menu as MenuIcon,
    ChevronLeft as ChevronLeftIcon,
    Logout as LogoutIcon,
    School as SchoolIcon,
    Person as PersonIcon,
    Payment as PaymentIcon,
    ChildCare as ChildCareIcon,
    TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const Sidebar = ({ onHoverChange }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(true);
    const [hoveredPath, setHoveredPath] = useState(null);
    const [avatar, setAvatar] = useState(null);
    const [loadingAvatar, setLoadingAvatar] = useState(false);

    const isTutor = user?.role === 'tutor';
    const isStudent = user?.role === 'student';
    const isParent = user?.role === 'parent';

    const fetchAvatar = async () => {
        if (!user?.id || !isTutor) return;
        
        setLoadingAvatar(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axiosInstance.get(
                `/tutors/${user.id}/avatar`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            );
            
            if (response.data && response.data.avatar) {
                setAvatar(response.data.avatar);
            }
        } catch (err) {
            console.error('Ошибка загрузки фото:', err);
        } finally {
            setLoadingAvatar(false);
        }
    };

    // ✅ Меню для репетитора — добавлен пункт "Календарь (бета)"
    const tutorMenuItems = [
        { path: '/dashboard', label: 'Главная', icon: <DashboardIcon />, roles: ['tutor'] },
        { path: '/students', label: 'Ученики', icon: <PeopleIcon />, roles: ['tutor'] },
        { path: '/progress', label: 'Успеваемость', icon: <TrendingUpIcon />, roles: ['tutor'] },
        { path: '/courses', label: 'Курсы', icon: <BookIcon />, roles: ['tutor'] },
        { path: '/weekly-schedule', label: 'Расписание', icon: <CalendarIcon />, roles: ['tutor'] },
        { path: '/finance', label: 'Финансы', icon: <MoneyIcon />, roles: ['tutor'] },
        { path: '/materials', label: 'Материалы', icon: <FolderIcon />, roles: ['tutor'] },
        { path: '/task-bank', label: 'Банк заданий', icon: <AssignmentIcon />, roles: ['tutor'] },
        { path: '/lessons-archive', label: 'Архив', icon: <ArchiveIcon />, roles: ['tutor'] },
        { path: '/profile', label: 'Профиль', icon: <PersonIcon />, roles: ['tutor'] },
    ];

    // Меню для ученика
    const studentMenuItems = [
        { path: '/student', label: 'Главная', icon: <DashboardIcon />, roles: ['student'] },
        { path: '/student/progress', label: 'Успеваемость', icon: <TrendingUpIcon />, roles: ['student'] },
        { path: '/student/materials', label: 'Материалы', icon: <FolderIcon />, roles: ['student'] },
        { path: '/student/profile', label: 'Профиль', icon: <PersonIcon />, roles: ['student'] },
    ];

    // Меню для родителя
    const parentMenuItems = [
        { path: '/parent/dashboard', label: 'Главная', icon: <DashboardIcon />, roles: ['parent'] },
        { path: '/parent/children', label: 'Дети', icon: <ChildCareIcon />, roles: ['parent'] },
        { path: '/parent/payments', label: 'Платежи', icon: <PaymentIcon />, roles: ['parent'] },
        { path: '/parent/profile', label: 'Профиль', icon: <PersonIcon />, roles: ['parent'] },
    ];

    const menuItems = isTutor ? tutorMenuItems : isStudent ? studentMenuItems : parentMenuItems;

    useEffect(() => {
        if (isTutor && user?.id) {
            fetchAvatar();
        }
    }, [isTutor, user?.id, location.pathname]);

    useEffect(() => {
        const handleAvatarUpdate = (event) => {
            if (event.detail) {
                setAvatar(event.detail);
            } else if (isTutor) {
                fetchAvatar();
            }
        };
        
        window.addEventListener('avatar-updated', handleAvatarUpdate);
        
        return () => {
            window.removeEventListener('avatar-updated', handleAvatarUpdate);
        };
    }, [isTutor]);

    const handleNavigation = (path) => {
        navigate(path);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleDrawer = () => {
        setCollapsed(!collapsed);
    };

    const handleMouseEnter = () => {
        setCollapsed(false);
        if (onHoverChange) onHoverChange(true);
    };

    const handleMouseLeave = () => {
        setCollapsed(true);
        setHoveredPath(null);
        if (onHoverChange) onHoverChange(false);
    };

    const handleIconHover = (path) => {
        setHoveredPath(path);
    };

    const isActive = (path) => {
        if (hoveredPath) return hoveredPath === path;
        return location.pathname === path;
    };

    const ITEM_HEIGHT = 48;
    const AVATAR_HEIGHT = 50;
    const AVATAR_MARGIN = 16;
    const HEADER_HEIGHT = 65;

    const MiniMenu = () => (
        <Box
            sx={{
                height: '100vh',
                bgcolor: '#1a1a2e',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                width: 70,
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 1200,
            }}
        >
            <Box sx={{ height: HEADER_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <IconButton onClick={toggleDrawer} sx={{ color: 'white' }}>
                    <MenuIcon />
                </IconButton>
            </Box>

            <Box sx={{ 
                height: AVATAR_HEIGHT + AVATAR_MARGIN * 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
            }}>
                <Tooltip title={user?.fullName || 'Пользователь'} placement="right">
                    <Avatar 
                        src={isTutor ? avatar : null}
                        sx={{ 
                            width: AVATAR_HEIGHT, 
                            height: AVATAR_HEIGHT, 
                            bgcolor: '#ff6b6b',
                            cursor: 'pointer',
                            '&:hover': { opacity: 0.8 }
                        }}
                        onClick={() => handleNavigation(isTutor ? '/dashboard' : isStudent ? '/student' : '/parent/dashboard')}
                    >
                        {(!isTutor || !avatar) && (user?.fullName?.charAt(0) || 'U')}
                    </Avatar>
                </Tooltip>
            </Box>

            <Divider sx={{ width: '80%', bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />

            {menuItems.map((item) => (
                <Box key={item.path} sx={{ height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tooltip title={item.label} placement="right">
                        <IconButton
                            onClick={() => handleNavigation(item.path)}
                            onMouseEnter={() => handleIconHover(item.path)}
                            sx={{
                                color: isActive(item.path) ? '#ff6b6b' : 'white',
                                '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                transition: 'all 0.2s'
                            }}
                        >
                            {item.icon}
                        </IconButton>
                    </Tooltip>
                </Box>
            ))}

            <Divider sx={{ width: '80%', bgcolor: 'rgba(255,255,255,0.2)', my: 1 }} />

            <Box sx={{ mt: 'auto', mb: 2, height: ITEM_HEIGHT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Tooltip title="Выйти" placement="right">
                    <IconButton onClick={handleLogout} sx={{ color: 'white' }}>
                        <LogoutIcon />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );

    const FullMenu = () => (
        <Box
            sx={{
                height: '100vh',
                width: 260,
                bgcolor: '#1a1a2e',
                color: 'white',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'auto',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 1200,
            }}
        >
            <Box sx={{ 
                height: HEADER_HEIGHT,
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                px: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SchoolIcon sx={{ color: '#ff6b6b', fontSize: 32 }} />
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                        EdSpace
                    </Typography>
                </Box>
                <IconButton onClick={toggleDrawer} sx={{ color: 'white' }}>
                    <ChevronLeftIcon />
                </IconButton>
            </Box>

            <Box sx={{ 
                height: AVATAR_HEIGHT + AVATAR_MARGIN * 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                flexShrink: 0
            }}>
                <Avatar 
                    src={isTutor ? avatar : null}
                    sx={{ 
                        width: AVATAR_HEIGHT, 
                        height: AVATAR_HEIGHT, 
                        bgcolor: '#ff6b6b'
                    }}
                >
                    {(!isTutor || !avatar) && (user?.fullName?.charAt(0) || 'U')}
                </Avatar>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.5 }}>
                    {user?.fullName?.split(' ')[0] || (isTutor ? 'Репетитор' : isStudent ? 'Ученик' : 'Родитель')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                    {isTutor ? 'Репетитор' : isStudent ? 'Ученик' : 'Родитель'}
                </Typography>
            </Box>

            <List sx={{ 
                flex: 1, 
                pt: 0,
                overflow: 'auto'
            }}>
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <ListItem key={item.path} disablePadding sx={{ height: ITEM_HEIGHT }}>
                            <ListItemButton
                                onClick={() => handleNavigation(item.path)}
                                onMouseEnter={() => setHoveredPath(item.path)}
                                onMouseLeave={() => setHoveredPath(null)}
                                sx={{
                                    height: ITEM_HEIGHT,
                                    py: 0,
                                    px: 2,
                                    bgcolor: active ? 'rgba(255,107,107,0.2)' : 'transparent',
                                    borderLeft: active ? '3px solid #ff6b6b' : '3px solid transparent',
                                    '&:hover': {
                                        bgcolor: 'rgba(255,107,107,0.1)'
                                    },
                                    transition: 'all 0.2s'
                                }}
                            >
                                <ListItemIcon sx={{ color: active ? '#ff6b6b' : 'rgba(255,255,255,0.7)', minWidth: 40 }}>
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText 
                                    primary={item.label} 
                                    sx={{ 
                                        '& .MuiTypography-root': { 
                                            color: active ? '#ff6b6b' : 'rgba(255,255,255,0.7)',
                                            fontWeight: active ? 'bold' : 'normal'
                                        }
                                    }} 
                                />
                            </ListItemButton>
                        </ListItem>
                    );
                })}
            </List>

            <Box sx={{ 
                height: ITEM_HEIGHT,
                borderTop: '1px solid rgba(255,255,255,0.1)', 
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center'
            }}>
                <ListItemButton
                    onClick={handleLogout}
                    sx={{ height: ITEM_HEIGHT, borderRadius: 0 }}
                >
                    <ListItemIcon sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        <LogoutIcon />
                    </ListItemIcon>
                    <ListItemText primary="Выйти" sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItemButton>
            </Box>
        </Box>
    );

    return (
        <Box
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            data-sidebar
            sx={{ position: 'relative' }}
        >
            {collapsed ? <MiniMenu /> : <FullMenu />}
        </Box>
    );
};

export default Sidebar;