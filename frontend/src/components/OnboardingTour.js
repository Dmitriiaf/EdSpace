import React, { useState, useEffect, useCallback } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import { useLocation, useNavigate } from 'react-router-dom';

// Полный тур по всем страницам
const tourSteps = {
  '/dashboard': [
    {
      target: 'body',
      title: '🎓 Добро пожаловать в EdSpace!',
      content: 'Давайте познакомимся с платформой. Я покажу вам всё самое важное для комфортной работы с учениками. Этот тур займёт всего пару минут!',
      placement: 'center',
      disableBeacon: true,
    },
    {
      target: '[data-tour="hero"]',
      title: '📊 Главный дашборд',
      content: 'Здесь отображаются все ваши уроки на сегодня. У каждого урока есть цветная метка статуса: зелёная — проведён, синяя — запланирован, красная — отменён.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="date-nav"]',
      title: '📅 Навигация по дням',
      content: 'Используйте стрелки для переключения между днями. Кнопка «Сегодня» мгновенно вернёт вас к текущей дате.',
      placement: 'bottom',
    },
    {
      target: 'body',
      title: '👥 Переходим к ученикам',
      content: 'А теперь давайте посмотрим раздел «Ученики». Нажмите на соответствующий пункт в боковом меню слева, и я продолжу экскурсию там! 👈',
      placement: 'center',
    },
  ],
  '/students': [
    {
      target: '[data-tour="add-student-btn"]',
      title: '➕ Добавление ученика',
      content: 'Это главная кнопка для добавления новых учеников. Нажмите сюда, чтобы создать профиль ученика со всей необходимой информацией.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="student-filters"]',
      title: '🔍 Фильтры и поиск',
      content: 'Здесь вы можете быстро найти нужного ученика по имени или отфильтровать список.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="student-card"]',
      title: '👤 Карточка ученика',
      content: 'Нажмите на карточку ученика, чтобы открыть подробную информацию: контакты, история уроков, заметки и статистика.',
      placement: 'right',
    },
    {
      target: 'body',
      title: '📅 Следующая остановка — Расписание',
      content: 'Отлично! Теперь перейдите в раздел «Расписание» через боковое меню.',
      placement: 'center',
    },
  ],
  '/weekly-schedule': [
    {
      target: '[data-tour="add-template-btn"]',
      title: '📝 Создание шаблона',
      content: 'Шаблоны позволяют задать регулярное расписание. Укажите день недели, время и ученика — уроки будут создаваться автоматически.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="template-list"]',
      title: '📋 Список шаблонов',
      content: 'Здесь отображаются все ваши шаблоны занятий. Любой шаблон можно изменить или удалить в пару кликов.',
      placement: 'top',
    },
    {
      target: '[data-tour="generate-lessons"]',
      title: '⚡ Генерация уроков',
      content: 'Нажмите, чтобы создать реальные уроки по всем активным шаблонам на выбранный период.',
      placement: 'left',
    },
    {
      target: 'body',
      title: '💰 Переходим к финансам',
      content: 'Теперь заглянем в раздел «Финансы». Нажмите на него в боковом меню.',
      placement: 'center',
    },
  ],
  '/finance': [
    {
      target: '[data-tour="finance-tabs"]',
      title: '💎 Вкладки финансов',
      content: 'Переключайтесь между вкладками: «Обзор», «Платежи», «Абонементы» и «Отчёт».',
      placement: 'bottom',
    },
    {
      target: '[data-tour="finance-overview"]',
      title: '📈 Обзор финансов',
      content: 'Здесь вы видите ключевые показатели: общий доход, доход по абонементам и поурочной оплате.',
      placement: 'bottom',
    },
    {
      target: 'body',
      title: '📚 Последний раздел — Домашние задания',
      content: 'Перейдите в «Домашние задания» через меню.',
      placement: 'center',
    },
  ],
  '/extracurricular': [
    {
      target: '[data-tour="homework-assign-btn"]',
      title: '✍️ Назначение ДЗ',
      content: 'Нажмите сюда, чтобы создать новое домашнее задание для ученика.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="homework-filters"]',
      title: '🔎 Фильтры заданий',
      content: 'Фильтруйте задания по ученику, статусу или дате.',
      placement: 'bottom',
    },
    {
      target: '[data-tour="homework-table"]',
      title: '📋 Таблица заданий',
      content: 'В этой таблице собраны все домашние задания. Нажмите на задание, чтобы увидеть детали.',
      placement: 'top',
    },
    {
      target: 'body',
      title: '🎉 Вы готовы!',
      content: 'Поздравляю! Вы познакомились со всеми основными разделами EdSpace. Успехов в преподавании! 🚀',
      placement: 'center',
    },
  ],
};

// Кастомные стили для тура
const customStyles = {
  options: {
    primaryColor: '#4F46E5',
    textColor: '#1F2937',
    zIndex: 10000,
    overlayColor: 'rgba(15, 23, 42, 0.75)',
    arrowColor: '#FFFFFF',
    backgroundColor: '#FFFFFF',
    spotlightShadow: '0 0 0 8px rgba(79, 70, 229, 0.3), 0 0 30px rgba(79, 70, 229, 0.2)',
    beaconSize: 44,
    spotlightClicks: true,
  },
  tooltip: {
    borderRadius: 16,
    padding: '28px 32px',
    fontSize: 15,
    boxShadow: '0 20px 60px rgba(79, 70, 229, 0.25), 0 8px 20px rgba(0, 0, 0, 0.1)',
    maxWidth: 420,
  },
  tooltipTitle: {
    fontSize: 20,
    fontWeight: 700,
    marginBottom: 8,
    color: '#4F46E5',
  },
  tooltipContent: {
    fontSize: 15,
    lineHeight: 1.7,
    color: '#4B5563',
  },
  buttonNext: {
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 600,
    padding: '12px 24px',
    backgroundColor: '#4F46E5',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
  },
  buttonBack: {
    borderRadius: 12,
    fontSize: 14,
    fontWeight: 500,
    padding: '12px 20px',
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },
  buttonSkip: {
    borderRadius: 12,
    fontSize: 13,
    fontWeight: 500,
    color: '#9CA3AF',
  },
  spotlight: {
    borderRadius: 12,
    boxShadow: '0 0 0 6px rgba(79, 70, 229, 0.4)',
  },
  overlay: {
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
  },
};

function OnboardingTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const [run, setRun] = useState(false);
  const [steps, setSteps] = useState([]);
  const [currentPage, setCurrentPage] = useState('');

  // Сброс тура Ctrl+Shift+T
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        localStorage.removeItem('tour_completed_full');
        window.location.reload();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Запуск тура при смене страницы
  useEffect(() => {
    const hasCompletedTour = localStorage.getItem('tour_completed_full');
    if (hasCompletedTour) {
      setRun(false);
      return;
    }

    const path = location.pathname;
    const pageSteps = tourSteps[path];

    if (pageSteps) {
      setSteps(pageSteps);
      setCurrentPage(path);
      setRun(false);
      const timer = setTimeout(() => setRun(true), 800);
      return () => clearTimeout(timer);
    } else {
      setRun(false);
    }
  }, [location.pathname]);

  // Обработчик событий тура
  const handleCallback = useCallback(
    (data) => {
      const { status, action } = data;

      if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
        setRun(false);
        // Всегда сохраняем флаг при закрытии
        localStorage.setItem('tour_completed_full', 'true');

        // Автопереход на следующую страницу (только если не skip)
        if (action !== 'skip' && location.pathname !== '/extracurricular') {
          const pageOrder = ['/dashboard', '/students', '/weekly-schedule', '/finance', '/extracurricular'];
          const currentIndex = pageOrder.indexOf(location.pathname);
          if (currentIndex !== -1 && currentIndex < pageOrder.length - 1) {
            const nextPage = pageOrder[currentIndex + 1];
            setTimeout(() => navigate(nextPage), 400);
          }
        }
      }
    },
    [location.pathname, navigate]
  );

  if (!run || steps.length === 0) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      scrollOffset={100}
      disableOverlayClose
      callback={handleCallback}
      locale={{
        back: '← Назад',
        close: '✕',
        last: 'Далее →',
        next: 'Далее →',
        skip: 'Пропустить тур',
      }}
      styles={customStyles}
    />
  );
}

export default OnboardingTour;