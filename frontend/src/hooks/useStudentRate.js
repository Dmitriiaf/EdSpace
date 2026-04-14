import { useAuth } from '../context/AuthContext';

/**
 * Хук для получения ставки ученика для конкретного репетитора
 */
export const useStudentRate = () => {
    const { user } = useAuth();

    const getStudentRateForTutor = (student, tutorId) => {
        if (!student) return null;
        
        // Проверяем массив rates (новая структура)
        if (student.rates && Array.isArray(student.rates)) {
            for (let rate of student.rates) {
                if (rate.tutor && rate.tutor.id === tutorId) {
                    return rate.ratePerLesson;
                }
            }
        }
        
        // Fallback на старую структуру
        return student.ratePerLesson;
    };

    const getRateForCurrentUser = (student) => {
        return getStudentRateForTutor(student, user?.id);
    };

    return { getStudentRateForTutor, getRateForCurrentUser };
};