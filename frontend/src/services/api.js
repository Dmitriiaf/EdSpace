// ========== frontend/src/services/api.js ==========
import axiosInstance from '../api/axiosConfig';

// ========== ЗАНЯТИЯ ==========
export const getAllLessons = (tutorId) => 
    axiosInstance.get(`/lessons/all?tutorId=${tutorId}`);

export const getTodayLessons = (tutorId) => 
    axiosInstance.get(`/lessons/today?tutorId=${tutorId}`);

export const getUpcomingLessons = (tutorId) => 
    axiosInstance.get(`/lessons/upcoming?tutorId=${tutorId}`);

export const getArchivedLessons = (tutorId) => 
    axiosInstance.get(`/lessons/archived?tutorId=${tutorId}`);

export const getLessonsByStudent = (studentId) => 
    axiosInstance.get(`/lessons/student/${studentId}`);

export const getLessonById = (id) => 
    axiosInstance.get(`/lessons/${id}`);

export const createLesson = (lessonData) => 
    axiosInstance.post(`/lessons`, lessonData);

export const completeLesson = (id, notes, nextLessonPlan) => 
    axiosInstance.post(`/lessons/${id}/complete`, { notes, nextLessonPlan });

export const confirmLesson = (id) => 
    axiosInstance.post(`/lessons/${id}/confirm`, {});

export const confirmPayment = (id) => 
    axiosInstance.post(`/lessons/${id}/pay`, {});

export const cancelLesson = (id, reason) => 
    axiosInstance.post(`/lessons/${id}/cancel`, { reason });

export const rescheduleLesson = (id, newDate, newStartTime, newEndTime) => 
    axiosInstance.post(`/lessons/${id}/reschedule`, { newDate, newStartTime, newEndTime });

export const addNotes = (id, notes, nextLessonPlan) => 
    axiosInstance.patch(`/lessons/${id}/notes`, { notes, nextLessonPlan });

export const deleteLesson = (id) => 
    axiosInstance.delete(`/lessons/${id}`);

export const generateLessons = () => 
    axiosInstance.post(`/lessons/generate`, {});

// ========== УСПЕВАЕМОСТЬ И ПРОГРЕСС ==========
export const getStudentProgressStats = (studentId) => 
    axiosInstance.get(`/homework/progress/student/${studentId}`);

export const getProgressTimeline = (studentId) => 
    axiosInstance.get(`/progress/student/${studentId}/stats`);

export const getComparisonStats = (tutorId) => 
    axiosInstance.get(`/progress/tutor/${tutorId}/comparison`);

// ========== БАНК ЗАДАНИЙ ==========
export const importFromKEGE = (subject, examType) => 
    axiosInstance.post(`/integration/import/kege`, { subject, examType });

export const importFromReshUEGE = (subject, examType) => 
    axiosInstance.post(`/integration/import/reshuege`, { subject, examType });

export const searchTasks = (query, subject, examType, source) => 
    axiosInstance.get(`/integration/tasks/search`, { 
        params: { query, subject, examType, source }
    });

export const createHomeworkFromTask = (taskId, studentId, dueDate) => 
    axiosInstance.post(`/integration/create-homework-from-task`, 
        { taskId, studentId, dueDate });

// ========== МЕТОДИЧЕСКАЯ КОПИЛКА ==========
export const getLessonPlans = () => 
    axiosInstance.get(`/lesson-plans`);

export const createLessonPlan = (data) => 
    axiosInstance.post(`/lesson-plans`, data);

export const updateLessonPlan = (id, data) => 
    axiosInstance.put(`/lesson-plans/${id}`, data);

export const deleteLessonPlan = (id) => 
    axiosInstance.delete(`/lesson-plans/${id}`);

export const applyPlanToLesson = (planId, lessonId) => 
    axiosInstance.post(`/lesson-plans/${planId}/apply-to-lesson/${lessonId}`);

export const searchLessonPlans = (query) => 
    axiosInstance.get(`/lesson-plans/search?q=${query}`);

// ========== ОТЧЁТЫ ==========
export const exportStudentProgress = (studentId, startDate, endDate, format = 'json') => 
    axiosInstance.get(`/export/student-progress/${studentId}`, {
        params: { startDate, endDate, format }
    });

export const exportFinancialReport = (startDate, endDate) => 
    axiosInstance.get(`/export/financial`, {
        params: { startDate, endDate }
    });

export const getLessonsByDate = (tutorId, date) => {
    return axiosInstance.get(`/lessons/tutor/${tutorId}/date/${date}`);
};

export const exportCourseReport = (courseId, startDate, endDate) => 
    axiosInstance.get(`/export/course`, {
        params: { courseId, startDate, endDate }
    });

    /**
 * Заменить отменённый урок на отработку долга
 */
export const replaceCancelledWithResurrect = async (lessonId, debtorStudentId) => {
    const response = await axiosInstance.post(`/lessons/${lessonId}/replace-with-resurrect`, {
        debtorStudentId
    });
    return response.data;
};

// ========== ВАРИАНТЫ ==========
export const getVariants = () => 
    axiosInstance.get(`/variants`);

export const createVariant = (data) => 
    axiosInstance.post(`/variants`, data);

export const updateVariant = (id, data) => 
    axiosInstance.put(`/variants/${id}`, data);

export const deleteVariant = (id) => 
    axiosInstance.delete(`/variants/${id}`);

export const assignVariant = (id, studentId, dueDate) => 
    axiosInstance.post(`/variants/${id}/assign`, { studentId, dueDate });

export default axiosInstance;