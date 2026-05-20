// frontend/src/App.js
import React, { useState, useMemo, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import NotFoundPage from './pages/NotFoundPage';
import { Box, IconButton, Tooltip } from '@mui/material';
import { Brightness4 as DarkIcon, Brightness7 as LightIcon } from '@mui/icons-material';
import { AuthProvider, useAuth } from './context/AuthContext';
import OnboardingQuestions from './pages/OnboardingQuestions';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import StepikPage from './pages/StepikPage';
import StepikCallback from './pages/StepikCallback';
import LessonPlans from './pages/LessonPlans';
import TaskBank from './pages/TaskBank';
import TutorProgress from './pages/TutorProgress';
import CompleteRegistration from './pages/CompleteRegistration';
import ParentRegistration from './pages/ParentRegistration';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Login from './pages/Login';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import Courses from './pages/Courses';
import WeeklySchedule from './pages/WeeklyScheduleNew';
import Finance from './pages/Finance';
import Materials from './pages/Materials';
import LessonsArchive from './pages/LessonsArchive';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import Profile from './pages/Profile';
import StudentProfile from './pages/StudentProfile';
import ParentProfile from './pages/ParentProfile';
import StudentProgress from './pages/StudentProgress';
import StudentMaterials from './pages/StudentMaterials';
import Tools from './pages/Tools';
import Homework from './pages/Homework';
import Extracurricular from './pages/Extracurricular';

// Контекст темы
const ThemeContext = createContext();
export const useThemeContext = () => useContext(ThemeContext);

const StepikPageWrapper = () => {
    const location = useLocation();
    return <StepikPage key={location.pathname + Date.now()} />;
};

// Фон с акцентными пятнами
const BG_IMAGE = `
    linear-gradient(180deg, rgba(79, 70, 229, 0.04) 0%, transparent 300px),
    radial-gradient(circle at 15% 20%, rgba(79, 70, 229, 0.12) 0%, transparent 50%),
    radial-gradient(circle at 85% 75%, rgba(124, 58, 237, 0.10) 0%, transparent 50%),
    radial-gradient(circle at 50% 50%, rgba(79, 70, 229, 0.06) 0%, transparent 60%),
    radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.08) 0%, transparent 45%),
    radial-gradient(circle at 10% 90%, rgba(245, 158, 11, 0.06) 0%, transparent 40%),
    radial-gradient(circle at 70% 30%, rgba(79, 70, 229, 0.08) 0%, transparent 50%)
`;

const AppContent = () => {
    const { user } = useAuth();

    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    const toggleDarkMode = () => {
        setDarkMode(prev => {
            const next = !prev;
            localStorage.setItem('darkMode', JSON.stringify(next));
            return next;
        });
    };

    const theme = useMemo(() => createTheme({
        palette: {
            mode: darkMode ? 'dark' : 'light',
            primary: { main: '#4F46E5' },
            secondary: { main: '#10B981' },
            background: {
                default: darkMode ? '#121212' : '#F3F4F6',
                paper: darkMode ? '#1e1e1e' : '#FFFFFF',
            },
            text: {
                primary: darkMode ? '#ffffff' : '#1F2937',
                secondary: darkMode ? '#aaaaaa' : '#6B7280',
            },
        },
        shape: { borderRadius: 12 },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
                        borderColor: darkMode ? '#333' : '#E5E7EB',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
        },
    }), [darkMode]);

    const isTutor = user?.role === 'tutor';
    const isStudent = user?.role === 'student';
    const isParent = user?.role === 'parent';
    const sidebarWidth = isSidebarHovered ? 260 : 70;

    const publicRoutes = (
        <Routes>
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stepik/callback" element={<StepikCallback />} />
            <Route path="/onboarding" element={<OnboardingQuestions />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/complete-registration" element={<CompleteRegistration />} />
            <Route path="/parent-registration" element={<ParentRegistration />} />
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );

    if (!user) {
        return (
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {publicRoutes}
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Box sx={{ display: 'flex', minHeight: '100vh' }}>
                <Sidebar onHoverChange={setIsSidebarHovered} darkMode={darkMode} />
                
                {/* Кнопка переключения темы */}
                <Tooltip title={darkMode ? 'Светлая тема' : 'Тёмная тема'}>
                    <IconButton
                        onClick={toggleDarkMode}
                        sx={{
                            position: 'fixed',
                            bottom: 20,
                            right: 20,
                            zIndex: 9999,
                            bgcolor: darkMode ? '#333' : '#4F46E5',
                            color: 'white',
                            '&:hover': {
                                bgcolor: darkMode ? '#555' : '#4338CA',
                            },
                            width: 48,
                            height: 48,
                            boxShadow: '0 4px 10px rgba(0,0,0,0.3)',
                        }}
                    >
                        {darkMode ? <LightIcon /> : <DarkIcon />}
                    </IconButton>
                </Tooltip>

                <Box
                    component="main"
                    sx={{
                        flexGrow: 1,
                        ml: { xs: 0, md: `${sidebarWidth}px` },
                        minHeight: '100vh',
                        transition: 'margin-left 0.2s ease-in-out',
                        bgcolor: darkMode ? '#121212' : '#F3F4F6',
                        backgroundImage: darkMode ? 'none' : BG_IMAGE,
                        width: { xs: '100%', md: `calc(100% - ${sidebarWidth}px)` },

                    }}
                >
                    <Routes>
                        {/* Репетитор */}
                        <Route path="/dashboard" element={<PrivateRoute requiredRole="tutor"><Dashboard /></PrivateRoute>} />
                        <Route path="/students" element={<PrivateRoute requiredRole="tutor"><Students /></PrivateRoute>} />
                        <Route path="/courses" element={<PrivateRoute requiredRole="tutor"><Courses /></PrivateRoute>} />
                        <Route path="/weekly-schedule" element={<PrivateRoute requiredRole="tutor"><WeeklySchedule /></PrivateRoute>} />
                        <Route path="/finance" element={<PrivateRoute requiredRole="tutor"><Finance /></PrivateRoute>} />
                        <Route path="/materials" element={<PrivateRoute requiredRole="tutor"><Materials /></PrivateRoute>} />
                        <Route path="/lessons-archive" element={<PrivateRoute requiredRole="tutor"><LessonsArchive /></PrivateRoute>} />
                        <Route path="/task-bank" element={<PrivateRoute requiredRole="tutor"><TaskBank /></PrivateRoute>} />
                        <Route path="/lesson-plans" element={<PrivateRoute requiredRole="tutor"><LessonPlans /></PrivateRoute>} />
                        <Route path="/stepik" element={<PrivateRoute requiredRole="tutor"><StepikPageWrapper /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute requiredRole="tutor"><Profile /></PrivateRoute>} />
                        <Route path="/student-progress/:id" element={<PrivateRoute requiredRole="tutor"><StudentProgress /></PrivateRoute>} />
                        <Route path="/tools" element={<PrivateRoute requiredRole="tutor"><Tools /></PrivateRoute>} />
                        <Route path="/extracurricular" element={<PrivateRoute requiredRole="tutor"><Extracurricular /></PrivateRoute>} />
                        {/* Ученик */}
                        <Route path="/student" element={<PrivateRoute requiredRole="student"><StudentDashboard /></PrivateRoute>} />
                        <Route path="/student/profile" element={<PrivateRoute requiredRole="student"><StudentProfile /></PrivateRoute>} />
                        <Route path="/student/progress" element={<PrivateRoute requiredRole="student"><StudentProgress /></PrivateRoute>} />
                        <Route path="/student/materials" element={<PrivateRoute requiredRole="student"><StudentMaterials /></PrivateRoute>} />
                        <Route path="/student/tools" element={<PrivateRoute requiredRole="student"><Tools /></PrivateRoute>} />
                        <Route path="/student/homework" element={<PrivateRoute requiredRole="student"><Homework /></PrivateRoute>} />
                        {/* Родитель */}
                        <Route path="/parent/dashboard" element={<PrivateRoute requiredRole="parent"><ParentDashboard /></PrivateRoute>} />
                        <Route path="/parent/children" element={<PrivateRoute requiredRole="parent"><ParentDashboard /></PrivateRoute>} />
                        <Route path="/parent/payments" element={<PrivateRoute requiredRole="parent"><ParentDashboard /></PrivateRoute>} />
                        <Route path="/parent/profile" element={<PrivateRoute requiredRole="parent"><ParentProfile /></PrivateRoute>} />

                        {/* Публичные страницы */}
                        <Route path="/onboarding" element={<OnboardingQuestions />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/complete-registration" element={<CompleteRegistration />} />
                        <Route path="/parent-registration" element={<ParentRegistration />} />
                        <Route path="/stepik/callback" element={<StepikCallback />} />

                        {/* Перенаправление */}
                        <Route path="/" element={<Navigate to={isTutor ? "/dashboard" : isStudent ? "/student" : "/parent/dashboard"} />} />
                        <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                </Box>
            </Box>
        </ThemeProvider>
    );
};

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppContent />
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;