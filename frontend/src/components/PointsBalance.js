import React, { useEffect, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import RankChip from './RankChip';
import axiosInstance from '../api/axiosConfig';

const COLOR_MAP = {
  yellow: '#FBBF24',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#8B5CF6',
  red: '#EF4444',
  pink: '#EC4899',
  gold: '#FFD700',
  rainbow: 'rainbow',
};

export default function PointsBalance({ studentId, fullName }) {
  const [data, setData] = useState(null);
  const [nickColor, setNickColor] = useState(null);

  useEffect(() => {
    if (!studentId) return;
    axiosInstance.get(`/points/balance/${studentId}`).then((r) => setData(r.data)).catch(() => {});
    axiosInstance.get(`/cosmetics/active/${studentId}`).then((r) => {
      const nick = (r.data || []).find((c) => c.itemType === 'NICK_COLOR' && c.active);
      if (nick) setNickColor(COLOR_MAP[nick.itemKey] || null);
    }).catch(() => {});
  }, [studentId]);

  if (!data) return null;

  const nameStyle = nickColor === 'rainbow'
    ? {
        background: 'linear-gradient(90deg,#e91e63,#ff9800,#4caf50,#2196f3,#9c27b0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
      }
    : { color: nickColor || '#F3F4F6', fontWeight: 700 };

  return (
    <Box
      sx={{
        mx: 2,
        my: 1,
        p: 1.5,
        borderRadius: 3,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {fullName && (
        <Typography sx={{ ...nameStyle, fontSize: '0.9rem', mb: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {fullName}
        </Typography>
      )}

      <Tooltip
        title={
          data.pointsToNext > 0
            ? `До следующего ранга: ${data.pointsToNext} баллов`
            : 'Максимальный ранг!'
        }
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography sx={{ fontSize: '1.05rem', fontWeight: 700, color: '#F3F4F6' }}>
            💰 {data.balance}
          </Typography>
          <RankChip rankKey={data.rank.key} />
        </Box>
      </Tooltip>

      {data.rank.nextThreshold && (
        <Box
          sx={{
            height: 5,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${data.progressPercent}%`,
              background: 'linear-gradient(90deg, #4caf50, #8bc34a)',
              transition: 'width .4s',
            }}
          />
        </Box>
      )}
    </Box>
  );
}