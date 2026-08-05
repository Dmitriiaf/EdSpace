import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Popper, Fade, Paper, Typography, Box, Button, keyframes } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';

// ==================== АНИМАЦИИ ====================

const pulse = keyframes`
    0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.6); }
    50% { box-shadow: 0 0 0 20px rgba(79, 70, 229, 0), 0 0 0 4px rgba(124, 58, 237, 0.8); }
    100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
`;

const float = keyframes`
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
`;

const softAppear = keyframes`
    from { opacity: 0; filter: blur(12px); transform: scale(0.92) translateY(10px); }
    to { opacity: 1; filter: blur(0); transform: scale(1) translateY(0); }
`;

const shimmer = keyframes`
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
`;

const gradientFlow = keyframes`
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
`;

// ==================== СТИЛИЗОВАННЫЕ КОМПОНЕНТЫ ====================

const AnimatedBackdrop = styled(Box)(({ theme }) => ({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1300,
    animation: `${softAppear} 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards`,
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(circle at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
        pointerEvents: 'none',
    },
}));

const Highlight = styled(Box)(({ theme }) => ({
    position: 'fixed',
    borderRadius: '14px',
    animation: `${pulse} 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite`,
    pointerEvents: 'none',
    zIndex: 1350,
    border: '2.5px solid rgba(79, 70, 229, 0.6)',
    boxShadow: '0 0 40px rgba(79, 70, 229, 0.25), inset 0 0 20px rgba(124, 58, 237, 0.15)',
    transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    '&::before': {
        content: '""',
        position: 'absolute',
        inset: '-4px',
        borderRadius: '18px',
        background: 'linear-gradient(45deg, rgba(79,70,229,0.4), rgba(124,58,237,0.3), rgba(244,114,182,0.3))',
        zIndex: -1,
        animation: `${shimmer} 2s ease-in-out infinite`,
    },
}));

const TourTooltip = styled(Paper)(({ theme }) => ({
    padding: '24px 28px',
    maxWidth: 380,
    borderRadius: '24px',
    boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
    position: 'relative',
    animation: `${float} 4s ease-in-out infinite`,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.9) 100%)',
    backdropFilter: 'blur(20px)',
    '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #4F46E5, #7C3AED, #A855F7, #F472B6)',
        borderRadius: '24px 24px 0 0',
    },
    '&::after': {
        content: '""',
        position: 'absolute',
        top: '20%',
        right: '10%',
        width: '60px',
        height: '60px',
        background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
    },
}));

const NextButton = styled(Button)(({ theme }) => ({
    borderRadius: '14px',
    textTransform: 'none',
    fontSize: '15px',
    fontWeight: 600,
    padding: '10px 28px',
    background: 'linear-gradient(135deg, #4F46E5, #7C3AED, #4F46E5)',
    backgroundSize: '200% 200%',
    animation: `${gradientFlow} 3s ease infinite`,
    color: '#fff',
    boxShadow: '0 8px 25px rgba(79, 70, 229, 0.45)',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    '&:hover': {
        transform: 'translateY(-2px) scale(1.03)',
        boxShadow: '0 14px 35px rgba(79, 70, 229, 0.55)',
    },
    '&:active': {
        transform: 'translateY(0) scale(0.98)',
    },
}));

const Dot = styled(Box)(({ active }) => ({
    width: active ? 28 : 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: active ? '#4F46E5' : '#E5E7EB',
    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    cursor: 'pointer',
    boxShadow: active ? '0 0 16px rgba(79, 70, 229, 0.6)' : 'none',
    transform: active ? 'scale(1.1)' : 'scale(1)',
    position: 'relative',
    '&:hover': {
        backgroundColor: active ? '#4F46E5' : '#D1D5DB',
        transform: 'scale(1.2)',
    },
    '&:active::after': {
        content: '""',
        position: 'absolute',
        inset: '-4px',
        borderRadius: '9px',
        background: 'rgba(79,70,229,0.3)',
        animation: `${pulse} 0.8s ease-out`,
    },
}));

// ==================== ШАГИ ====================

const STEPS = [
    { emoji: '👋', title: 'Добро пожаловать в EdSpace!', text: 'Здесь вы будете управлять расписанием, учениками, финансами и материалами. Я проведу вас по основным разделам.', target: 'hero', route: '/dashboard' },
    { emoji: '📊', title: 'Дашборд — ваш центр управления', text: 'Здесь показаны уроки на сегодня, статистика дня и прогресс. Сюда вы будете попадать при входе.', target: 'hero', route: '/dashboard' },
    { emoji: '📅', title: 'Навигация по дням', text: 'Переключайтесь между днями стрелками. Смотрите прошедшие уроки и планируйте будущие.', target: 'date-nav', route: '/dashboard' },
    { emoji: '👥', title: 'Ученики — основа работы', text: 'Здесь список всех ваших учеников. Каждый отображается в виде карточки с именем, ставкой и типом оплаты.', target: 'students-page', route: '/students' },
    { emoji: '🔍', title: 'Поиск и фильтры', text: 'Ищите учеников по имени, фильтруйте по типу оплаты: все, абонемент или поурочно.', target: 'students-page', route: '/students' },
    { emoji: '📚', title: 'Курсы — это предметы', text: 'Создавайте курсы: Математика, Физика, Информатика. К каждому курсу привязываются ученики и уроки.', target: 'courses-page', route: '/courses' },
    { emoji: '➕', title: 'Добавить курс', text: 'Нажмите сюда чтобы создать новый курс. Укажите название, выберите цвет для удобства.', target: 'courses-add-btn', route: '/courses' },
    { emoji: '📅', title: 'Расписание — главный инструмент', text: 'Здесь вы создаёте уроки. Кликайте на свободную ячейку в сетке — и урок готов!', target: 'schedule-page', route: '/weekly-schedule' },
    { emoji: '🔁', title: 'Разовые и постоянные уроки', text: 'Можно создать разовый урок на одну дату или шаблон — он будет повторяться каждую неделю.', target: 'schedule-page', route: '/weekly-schedule' },
    { emoji: '👥', title: 'Группы для совместных занятий', text: 'Объединяйте учеников в группы. Удобно для групповых уроков — одно расписание на всех.', target: 'groups-page', route: '/groups' },
    { emoji: '➕', title: 'Создать группу', text: 'Нажмите чтобы создать группу: выберите учеников, курс, укажите цену за урок.', target: 'groups-add-btn', route: '/groups' },
    { emoji: '💰', title: 'Финансы — доходы и платежи', text: 'Здесь вы видите свой доход за месяц, динамику за год и прогноз на будущее.', target: 'finance-page', route: '/finance' },
    { emoji: '📊', title: 'Обзор доходов', text: 'Доход разделён на абонементы и поурочные платежи. Видно количество проведённых занятий.', target: 'finance-page', route: '/finance' },
    { emoji: '🔮', title: 'Прогноз дохода', text: 'Система рассчитывает ожидаемый доход на следующий месяц на основе постоянных уроков.', target: 'finance-page', route: '/finance' },
    { emoji: '💳', title: 'Вкладки Платежи и Абонементы', text: 'Переключайтесь между вкладками: Обзор — статистика, Платежи — история оплат, Абонементы — управление подписками.', target: 'finance-page', route: '/finance' },
    { emoji: '✅', title: 'Всё готово!', text: 'Вы освоили основные разделы. Остальные инструменты (банк заданий, материалы, домашние задания) найдёте в боковом меню слева.', target: null, route: '/dashboard' },
];

// ==================== КОМПОНЕНТ ====================

const OnboardingTour = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [step, setStep] = useState(() => {
        if (localStorage.getItem('onboarding_done')) return -1;
        return parseInt(localStorage.getItem('onboarding_step') || '0');
    });
    const [anchorEl, setAnchorEl] = useState(null);
    const [highlight, setHighlight] = useState(null);
    const [domReady, setDomReady] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [fadeKey, setFadeKey] = useState(0);

    useEffect(() => {
        if (step < 0 || step >= STEPS.length) {
            setHighlight(null);
            setAnchorEl(null);
            setIsVisible(false);
            return;
        }
        
        if (location.pathname !== STEPS[step].route) {
            navigate(STEPS[step].route, { replace: true });
            return;
        }

        setDomReady(false);
        setIsVisible(false);
        
        const timer = setTimeout(() => {
            const el = STEPS[step].target 
                ? document.querySelector(`[data-tour="${STEPS[step].target}"]`) 
                : null;
            
            setAnchorEl(el);
            
            if (el) {
                const rect = el.getBoundingClientRect();
                setHighlight({
                    top: rect.top - 8,
                    left: rect.left - 8,
                    width: rect.width + 16,
                    height: rect.height + 16,
                });
            } else {
                setHighlight(null);
            }
            
            setFadeKey(prev => prev + 1);
            setDomReady(true);
            setTimeout(() => setIsVisible(true), 100);
        }, 500);
        
        return () => clearTimeout(timer);
    }, [step, location.pathname]);

    const next = useCallback(() => {
        setIsVisible(false);
        const ns = step + 1;
        
        if (ns >= STEPS.length) {
            localStorage.setItem('onboarding_done', 'true');
            localStorage.removeItem('onboarding_step');
            setTimeout(() => {
                setStep(-1);
                setHighlight(null);
                setAnchorEl(null);
            }, 300);
            return;
        }
        
        localStorage.setItem('onboarding_step', ns.toString());
        setTimeout(() => {
            setStep(ns);
            navigate(STEPS[ns].route, { replace: true });
        }, 200);
    }, [step, navigate]);

    const skip = useCallback(() => {
        setIsVisible(false);
        localStorage.setItem('onboarding_done', 'true');
        localStorage.removeItem('onboarding_step');
        setTimeout(() => {
            setStep(-1);
            setHighlight(null);
            setAnchorEl(null);
        }, 300);
    }, []);

    const goToStep = useCallback((index) => {
        setIsVisible(false);
        localStorage.setItem('onboarding_step', index.toString());
        setTimeout(() => {
            setStep(index);
            navigate(STEPS[index].route, { replace: true });
        }, 200);
    }, [navigate]);

    // Не показывать на странице онбординга и если завершён
    if (location.pathname === '/onboarding') return null;
    if (step < 0 || !domReady) return null;

    return (
        <>
            <AnimatedBackdrop onClick={skip} />
            
            {highlight && (
                <Highlight
                    sx={{
                        top: highlight.top,
                        left: highlight.left,
                        width: highlight.width,
                        height: highlight.height,
                    }}
                />
            )}
            
            <Popper
                open={isVisible}
                anchorEl={anchorEl}
                placement={anchorEl ? 'bottom' : 'center'}
                sx={{
                    zIndex: 1400,
                    ...(anchorEl ? {} : {
                        position: 'fixed !important',
                        top: '50% !important',
                        left: '50% !important',
                        transform: 'translate(-50%, -50%) !important',
                    }),
                }}
                modifiers={[
                    { name: 'offset', options: { offset: anchorEl ? [0, 20] : [0, 0] } },
                    { name: 'preventOverflow', options: { boundary: 'viewport', padding: 20 } },
                ]}
                transition
            >
                {({ TransitionProps }) => (
                    <Fade in={isVisible} timeout={500} key={fadeKey} {...TransitionProps}>
                        <TourTooltip>
                            <Typography sx={{ fontSize: '48px', mb: 1, textAlign: 'center', animation: `${float} 3s ease-in-out infinite`, filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }}>
                                {STEPS[step].emoji}
                            </Typography>
                            <Typography sx={{ fontSize: '12px', color: '#9CA3AF', mb: 1, textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 500 }}>
                                Шаг {step + 1} из {STEPS.length}
                            </Typography>
                            <Typography sx={{ fontWeight: 700, fontSize: '20px', mb: 1, color: '#1F2937', textAlign: 'center', letterSpacing: '-0.3px' }}>
                                {STEPS[step].title}
                            </Typography>
                            <Typography sx={{ color: '#6B7280', fontSize: '14px', mb: 3, lineHeight: 1.7, textAlign: 'center' }}>
                                {STEPS[step].text}
                            </Typography>
                            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, mb: 2.5 }}>
                                {STEPS.map((_, i) => (
                                    <Dot key={i} active={i === step} onClick={() => goToStep(i)} />
                                ))}
                            </Box>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Button onClick={skip} sx={{ color: '#9CA3AF', fontSize: '13px', textTransform: 'none', fontWeight: 500, '&:hover': { color: '#6B7280', background: 'rgba(0,0,0,0.03)' }, transition: 'all 0.2s ease', borderRadius: '10px', px: 2 }}>
                                    Пропустить
                                </Button>
                                <NextButton variant="contained" onClick={next} endIcon={step === STEPS.length - 1 ? <span style={{ fontSize: '18px' }}>🚀</span> : <span style={{ fontSize: '18px' }}>→</span>}>
                                    {step === STEPS.length - 1 ? 'Начать работу' : 'Далее'}
                                </NextButton>
                            </Box>
                        </TourTooltip>
                    </Fade>
                )}
            </Popper>
        </>
    );
};

export default OnboardingTour;