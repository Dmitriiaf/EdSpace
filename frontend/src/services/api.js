// ========== frontend/src/services/api.js (ПОЛНАЯ ОБЪЕДИНЁННАЯ ВЕРСИЯ) ==========
import axiosInstance from '../api/axiosConfig';

// ========== УСПЕВАЕМОСТЬ И ПРОГРЕСС ==========
export const getStudentProgressStats = (studentId) => 
    axiosInstance.get(`/api/homework/progress/student/${studentId}`);

export const getProgressTimeline = (studentId) => 
    axiosInstance.get(`/api/progress/student/${studentId}/stats`);

export const getComparisonStats = (tutorId) => 
    axiosInstance.get(`/api/progress/tutor/${tutorId}/comparison`);

// ========== БАНК ЗАДАНИЙ ==========
export const importFromKEGE = (subject, examType) => 
    axiosInstance.post(`/api/integration/import/kege`, { subject, examType });

export const importFromReshUEGE = (subject, examType) => 
    axiosInstance.post(`/api/integration/import/reshuege`, { subject, examType });

export const searchTasks = (query, subject, examType, source) => 
    axiosInstance.get(`/api/integration/tasks/search`, { 
        params: { query, subject, examType, source }
    });

export const createHomeworkFromTask = (taskId, studentId, dueDate) => 
    axiosInstance.post(`/api/integration/create-homework-from-task`, 
        { taskId, studentId, dueDate });

// ========== МЕТОДИЧЕСКАЯ КОПИЛКА ==========
export const getLessonPlans = () => 
    axiosInstance.get(`/api/lesson-plans`);

export const createLessonPlan = (data) => 
    axiosInstance.post(`/api/lesson-plans`, data);

export const updateLessonPlan = (id, data) => 
    axiosInstance.put(`/api/lesson-plans/${id}`, data);

export const deleteLessonPlan = (id) => 
    axiosInstance.delete(`/api/lesson-plans/${id}`);

export const applyPlanToLesson = (planId, lessonId) => 
    axiosInstance.post(`/api/lesson-plans/${planId}/apply-to-lesson/${lessonId}`);

export const searchLessonPlans = (query) => 
    axiosInstance.get(`/api/lesson-plans/search?q=${query}`);

// ========== ОТЧЁТЫ ==========
export const exportStudentProgress = (studentId, startDate, endDate, format = 'json') => 
    axiosInstance.get(`/api/export/student-progress/${studentId}`, {
        params: { startDate, endDate, format }
    });

export const exportFinancialReport = (startDate, endDate) => 
    axiosInstance.get(`/api/export/financial`, {
        params: { startDate, endDate }
    });

export const exportCourseReport = (courseId, startDate, endDate) => 
    axiosInstance.get(`/api/export/course`, {
        params: { courseId, startDate, endDate }
    });

// ========== ЗАНЯТИЯ ==========
export const getTodayLessons = (tutorId) => 
    axiosInstance.get(`/api/lessons/today?tutorId=${tutorId}`);

export const getUpcomingLessons = (tutorId) => 
    axiosInstance.get(`/api/lessons/upcoming?tutorId=${tutorId}`);

export const getArchivedLessons = (tutorId) => 
    axiosInstance.get(`/api/lessons/archived?tutorId=${tutorId}`);

export const getAllLessons = (tutorId) => 
    axiosInstance.get(`/api/lessons/all?tutorId=${tutorId}`);

export const getLessonsByStudent = (studentId) => 
    axiosInstance.get(`/api/lessons/student/${studentId}`);

export const getLessonById = (id) => 
    axiosInstance.get(`/api/lessons/${id}`);

export const createLesson = (lessonData) => 
    axiosInstance.post(`/api/lessons`, lessonData);

export const completeLesson = (id, notes, nextLessonPlan) => 
    axiosInstance.post(`/api/lessons/${id}/complete`, { notes, nextLessonPlan });

export const confirmLesson = (id) => 
    axiosInstance.post(`/api/lessons/${id}/confirm`, {});

export const confirmPayment = (id) => 
    axiosInstance.post(`/api/lessons/${id}/pay`, {});

export const cancelLesson = (id, reason) => 
    axiosInstance.post(`/api/lessons/${id}/cancel`, { reason });

export const rescheduleLesson = (id, newDate, newStartTime, newEndTime) => 
    axiosInstance.post(`/api/lessons/${id}/reschedule`, { newDate, newStartTime, newEndTime });

export const addNotes = (id, notes, nextLessonPlan) => 
    axiosInstance.patch(`/api/lessons/${id}/notes`, { notes, nextLessonPlan });

export const deleteLesson = (id) => 
    axiosInstance.delete(`/api/lessons/${id}`);

export const generateLessons = () => 
    axiosInstance.post(`/api/lessons/generate`, {});

// ========== ВАРИАНТЫ ==========
export const getVariants = () => 
    axiosInstance.get(`/api/variants`);

export const createVariant = (data) => 
    axiosInstance.post(`/api/variants`, data);

export const updateVariant = (id, data) => 
    axiosInstance.put(`/api/variants/${id}`, data);

export const deleteVariant = (id) => 
    axiosInstance.delete(`/api/variants/${id}`);

export const assignVariant = (id, studentId, dueDate) => 
    axiosInstance.post(`/api/variants/${id}/assign`, { studentId, dueDate });

// ========== ЭКСПОРТ ПО УМОЛЧАНИЮ ==========
export default axiosInstance;