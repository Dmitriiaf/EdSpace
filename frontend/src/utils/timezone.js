import { format } from 'date-fns';

/**
 * Конвертирует UTC-время из БД в локальное время браузера
 * @param {string} lessonDate - дата в формате 'YYYY-MM-DD'
 * @param {string} timeStr - время в формате 'HH:mm:ss'
 * @returns {Date} - объект Date в локальной зоне
 */
export const utcToLocalTime = (lessonDate, timeStr) => {
    if (!lessonDate || !timeStr) return null;
    // Создаём UTC-дату (Z на конце указывает, что это UTC)
    return new Date(`${lessonDate}T${timeStr}`);
};

/**
 * Форматирует время для отображения
 * @param {string} lessonDate - дата в формате 'YYYY-MM-DD'
 * @param {string} timeStr - время в формате 'HH:mm:ss'
 * @returns {string} - время в формате 'HH:mm'
 */
export const formatLessonTime = (lessonDate, timeStr) => {
    const date = utcToLocalTime(lessonDate, timeStr);
    if (!date || isNaN(date.getTime())) return '--:--';
    return format(date, 'HH:mm');
};

/**
 * Форматирует дату для отображения
 * @param {string} lessonDate - дата в формате 'YYYY-MM-DD'
 * @returns {string} - дата в формате 'dd.MM.yyyy'
 */
export const formatLessonDate = (lessonDate) => {
    if (!lessonDate) return '';
    const date = new Date(lessonDate);
    if (isNaN(date.getTime())) return lessonDate;
    return format(date, 'dd.MM.yyyy');
};

/**
 * Получает часы и минуты из UTC-времени в локальной зоне
 * @param {string} lessonDate - дата в формате 'YYYY-MM-DD'
 * @param {string} timeStr - время в формате 'HH:mm:ss'
 * @returns {Object} - { hours, minutes }
 */
export const getLocalHoursMinutes = (lessonDate, timeStr) => {
    const date = utcToLocalTime(lessonDate, timeStr);
    if (!date || isNaN(date.getTime())) return { hours: 0, minutes: 0 };
    return {
        hours: date.getHours(),
        minutes: date.getMinutes()
    };
};