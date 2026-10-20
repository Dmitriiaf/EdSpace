import React from 'react';
import { Chip } from '@mui/material';

const RANK_STYLES = {
  NOVICE:     { icon: '🐣', title: 'Новичок',             color: '#9e9e9e' },
  BOOKWORM:   { icon: '📖', title: 'Книжный червь',       color: '#4caf50' },
  PRACTICIAN: { icon: '✏️', title: 'Практик',             color: '#2196f3' },
  PROGRAMMER: { icon: '💻', title: 'Программист',         color: '#9c27b0' },
  ENGINEER:   { icon: '🚀', title: 'Инженер',             color: '#ff9800' },
  MASTER:     { icon: '🧠', title: 'Магистр информатики', color: '#ffc107' },
  GURU:       { icon: '👑', title: 'Гуру алгоритмов',     color: '#e91e63' },
};

export default function RankChip({ rankKey, size = 'small', showTitle = true }) {
  const rank = RANK_STYLES[rankKey] || RANK_STYLES.NOVICE;

  const bg =
    rankKey === 'GURU'
      ? 'linear-gradient(90deg, #e91e63, #ff9800, #4caf50, #2196f3, #9c27b0)'
      : rank.color;

  return (
    <Chip
      size={size}
      label={`${rank.icon} ${showTitle ? rank.title : ''}`.trim()}
      sx={{
        background: bg,
        color: '#fff',
        fontWeight: 600,
        fontSize: size === 'small' ? '0.72rem' : '0.85rem',
        '& .MuiChip-label': { px: 1 },
      }}
    />
  );
}