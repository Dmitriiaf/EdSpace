// frontend/src/pages/StudentGamification.js
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, LinearProgress, Chip, Stack, Divider,
  Tabs, Tab, Tooltip,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';
import RankChip from '../components/RankChip';

const RANK_LIST = [
  { key: 'NOVICE',     icon: '🐣', title: 'Новичок',             min: 0 },
  { key: 'BOOKWORM',   icon: '📖', title: 'Книжный червь',       min: 30 },
  { key: 'PRACTICIAN', icon: '✏️', title: 'Практик',             min: 80 },
  { key: 'PROGRAMMER', icon: '💻', title: 'Программист',         min: 150 },
  { key: 'ENGINEER',   icon: '🚀', title: 'Инженер',             min: 240 },
  { key: 'MASTER',     icon: '🧠', title: 'Магистр информатики', min: 340 },
  { key: 'GURU',       icon: '👑', title: 'Гуру алгоритмов',     min: 450 },
];

const ALL_ACHIEVEMENTS = [
  // Учёба и ДЗ
  { key: 'FIRST_HW', icon: '🎯', title: 'Первый шаг', desc: 'Сдать первое ДЗ', category: 'Учёба' },
  { key: 'PERFECT_10', icon: '⭐', title: 'Отличник', desc: 'Получить 10 пятёрок за ДЗ', category: 'Учёба' },
  { key: 'MARATHON_20', icon: '🏃', title: 'Марафонец', desc: 'Сдать 20 ДЗ подряд без просрочек', category: 'Учёба' },
  { key: 'PERFECT_FIRST', icon: '💯', title: 'Идеальный старт', desc: 'Сдать первое ДЗ сразу на 5', category: 'Учёба' },
  { key: 'HW_50', icon: '💻', title: 'Программист', desc: 'Сдать 50 ДЗ', category: 'Учёба' },
  { key: 'HW_100', icon: '🧠', title: 'Магистр', desc: 'Сдать 100 ДЗ', category: 'Учёба' },
  { key: 'SPEEDY', icon: '⚡', title: 'Скоростной', desc: 'Сдать ДЗ в день его выдачи', category: 'Учёба' },
  { key: 'REVISION_5', icon: '🩹', title: 'Работа над ошибками', desc: 'Сдать ДЗ после доработки на 5', category: 'Учёба' },
  
  // Пробники и ЕГЭ
  { key: 'FIRST_MOCK', icon: '📝', title: 'Первый пробник', desc: 'Сдать первый пробник', category: 'ЕГЭ' },
  { key: 'MOCK_80', icon: '🎖️', title: '80+', desc: 'Получить 80+ баллов за пробник', category: 'ЕГЭ' },
  { key: 'MOCK_100', icon: '💯', title: 'Сотка', desc: 'Получить 100 баллов за пробник', category: 'ЕГЭ' },
  { key: 'MOCK_UP_20', icon: '🚀', title: 'Ракета', desc: 'Улучшить результат за пробник на 20+', category: 'ЕГЭ' },
  { key: 'MOCK_3_80', icon: '📈', title: 'Стабильность', desc: 'Сдать 3 пробника подряд на 80+', category: 'ЕГЭ' },
  { key: 'EGE_ALL_KNOWN', icon: '🎓', title: 'Мастер задач', desc: 'Отметить все 27 заданий как «Знаю»', category: 'ЕГЭ' },
  { key: 'SOLUTIONS_10', icon: '🕵️', title: 'Детектив', desc: 'Разобрать 10 решений ЕГЭ', category: 'ЕГЭ' },

  // Турниры и рейтинги
  { key: 'TOURNAMENT_JOIN', icon: '🏆', title: 'Турнирный игрок', desc: 'Принять участие в турнире', category: 'Турниры' },
  { key: 'TOURNAMENT_1', icon: '🥇', title: 'Победитель', desc: 'Занять 1 место в турнире', category: 'Турниры' },
  { key: 'TOURNAMENT_2', icon: '🥈', title: 'Серебро', desc: 'Занять 2 место в турнире', category: 'Турниры' },
  { key: 'TOURNAMENT_3', icon: '🥉', title: 'Бронза', desc: 'Занять 3 место в турнире', category: 'Турниры' },
  { key: 'TOURNAMENT_PROGRESS', icon: '🔥', title: 'Прогресс-мастер', desc: 'Лучший прогресс в турнире', category: 'Турниры' },
  { key: 'EGE_RATING_1', icon: '👑', title: 'Топ-1 ЕГЭ', desc: 'Занять 1 место в ЕГЭ-рейтинге', category: 'Турниры' },

  // Активность и игры
  { key: 'FLAPPY_10', icon: '🐦', title: 'Летун', desc: 'Набрать 10 очков в Flappy', category: 'Игры' },
  { key: 'FLAPPY_50', icon: '🦅', title: 'Ас', desc: 'Набрать 50 очков в Flappy', category: 'Игры' },
  { key: 'STREAK_7', icon: '📱', title: 'Завсегдатай', desc: 'Заходить 7 дней подряд', category: 'Игры' },
  { key: 'CHAT_50', icon: '💬', title: 'Душа компании', desc: 'Отправить 50 сообщений', category: 'Игры' },

  // Секретные
  { key: 'NIGHT_OWL', icon: '🦉', title: 'Полуночник', desc: 'Сдать ДЗ после 23:00', category: 'Секрет' },
  { key: 'CAT_AVATAR', icon: '🐱', title: 'Котик', desc: 'Установить аватар из набора «Кошки»', category: 'Секрет' },
  { key: 'RAINBOW_NICK', icon: '🌈', title: 'Модник', desc: 'Купить и активировать радужный ник', category: 'Секрет' },
  { key: 'GOLD_FRAME', icon: '🎩', title: 'Франт', desc: 'Купить и активировать золотую рамку', category: 'Секрет' },
  { key: 'BIO_300', icon: '📝', title: 'Полиглот', desc: 'Написать «О себе» на 300 символов', category: 'Секрет' },
];

export default function StudentGamification() {
  const { user } = useAuth();
  const studentId = user?.allIds?.[0] || user?.id;
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [unlocked, setUnlocked] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    if (!studentId) return;
    axiosInstance.get(`/points/balance/${studentId}`).then((r) => setData(r.data)).catch(() => {});
    axiosInstance.get(`/points/history/${studentId}`).then((r) => setHistory(r.data || [])).catch(() => {});
    axiosInstance.get(`/achievements/student/${studentId}`).then((r) => {
      setUnlocked((r.data || []).map(a => a.achievementKey));
    }).catch(() => {});
  }, [studentId]);

  if (!data) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography>Загрузка…</Typography>
      </Box>
    );
  }

  const unlockedSet = new Set(unlocked);

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
      <Typography variant="h4" fontWeight={800} sx={{ mb: 3 }}>
        🎮 Мой прогресс
      </Typography>

      <Paper sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 700 } }}>
          <Tab label="📊 Мой прогресс" />
          <Tab label="🏅 Ачивки" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <>
          {/* Карточка баланса и ранга */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={4}>
                <Typography variant="overline" color="text.secondary">Баланс баллов</Typography>
                <Typography variant="h3" fontWeight={800}>💰 {data.balance}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="overline" color="text.secondary">Текущий ранг</Typography>
                <Box sx={{ mt: 1 }}><RankChip rankKey={data.rank.key} size="medium" /></Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="overline" color="text.secondary">Заработано всего</Typography>
                <Typography variant="h4" fontWeight={700}>{data.total}</Typography>
              </Grid>
            </Grid>

            {data.rank.nextThreshold && (
              <Box sx={{ mt: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    До следующего ранга
                  </Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {data.pointsToNext} баллов
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={data.progressPercent}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
            )}
          </Paper>

          {/* Список рангов */}
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              🏆 Ранги
            </Typography>
            <Stack spacing={1.5}>
              {RANK_LIST.map((r) => {
                const achieved = data.total >= r.min;
                return (
                  <Box
                    key={r.key}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 1.5,
                      borderRadius: 2,
                      bgcolor: achieved ? 'rgba(76,175,80,0.08)' : 'rgba(0,0,0,0.03)',
                      border: '1px solid',
                      borderColor: achieved ? 'rgba(76,175,80,0.3)' : 'transparent',
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography sx={{ fontSize: 24 }}>{r.icon}</Typography>
                      <Typography fontWeight={achieved ? 700 : 500}>
                        {r.title}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      label={`${r.min}+ баллов`}
                      color={achieved ? 'success' : 'default'}
                      variant={achieved ? 'filled' : 'outlined'}
                    />
                  </Box>
                );
              })}
            </Stack>
          </Paper>

          {/* История */}
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              📜 История начислений
            </Typography>
            {history.length === 0 ? (
              <Typography color="text.secondary">Пока пусто</Typography>
            ) : (
              <Stack divider={<Divider />} spacing={1}>
                {history.slice(0, 50).map((h) => (
                  <Box key={h.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                    <Box>
                      <Typography fontWeight={600}>{h.reason}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(h.createdAt).toLocaleString('ru-RU')}
                      </Typography>
                    </Box>
                    <Typography
                      fontWeight={700}
                      color={h.amount > 0 ? 'success.main' : 'error.main'}
                    >
                      {h.amount > 0 ? '+' : ''}{h.amount}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            )}
          </Paper>
        </>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>
              🏅 Ачивки
            </Typography>
            <Chip 
              label={`Открыто: ${unlocked.length} / ${ALL_ACHIEVEMENTS.length}`} 
              color="primary" 
              sx={{ fontWeight: 700 }} 
            />
          </Box>

          <Grid container spacing={2}>
            {ALL_ACHIEVEMENTS.map((ach) => {
              const isUnlocked = unlockedSet.has(ach.key);
              const isSecret = ach.category === 'Секрет';

              return (
                <Grid item xs={6} sm={4} md={3} lg={2.4} key={ach.key}>
                  <Tooltip title={isUnlocked ? 'Получено!' : (isSecret && !isUnlocked ? 'Секретная ачивка' : ach.desc)} arrow>
                    <Paper
                      sx={{
                        p: 2,
                        borderRadius: 3,
                        textAlign: 'center',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: isUnlocked ? 'rgba(251, 191, 36, 0.1)' : 'rgba(0,0,0,0.03)',
                        border: '2px solid',
                        borderColor: isUnlocked ? '#FBBF24' : 'transparent',
                        opacity: isUnlocked ? 1 : 0.6,
                        transition: 'all 0.2s',
                        '&:hover': { transform: 'scale(1.03)' },
                      }}
                    >
                      <Typography sx={{ fontSize: 36, mb: 1, filter: isUnlocked ? 'none' : 'grayscale(100%)' }}>
                        {isUnlocked ? ach.icon : '🔒'}
                      </Typography>
                      <Typography variant="subtitle2" fontWeight={800} sx={{ color: isUnlocked ? '#92400E' : 'text.secondary', lineHeight: 1.2, mb: 0.5 }}>
                        {isSecret && !isUnlocked ? '???' : ach.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1.2 }}>
                        {isSecret && !isUnlocked ? 'Секрет' : ach.desc}
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              );
            })}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}