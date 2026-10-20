import React, { useEffect, useState } from 'react';
import { Box, Avatar } from '@mui/material';
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

const FRAME_MAP = {
  silver:  { border: '2px solid #C0C0C0' },
  gold_fr: { border: '2px solid #FFD700' },
  diamond: { border: '2px solid #67E8F9', boxShadow: '0 0 8px #67E8F9' },
  fire:    { border: '2px solid #F97316', boxShadow: '0 0 10px #EF4444' },
  royal:   { border: '2px solid #7C3AED', boxShadow: '0 0 10px #7C3AED' },
};

const BADGE_ICON = {
  active:  '⚡',
  smart:   '📚',
  hundred: '💯',
  ege:     '🎯',
  top1:    '🥇',
};

const STICKER_ICON = {
  scholar: '🎓', onfire: '🔥', strong: '💪', rocket: '🚀',
  star: '⭐', winner: '🏆', cool: '😎', king: '👑',
};

export default function NickWithCosmetics({ studentId, name, avatar, avatarSize = 36, fontSize = '14px', showAvatar = true }) {
  const [cosmetics, setCosmetics] = useState([]);

  useEffect(() => {
    if (!studentId) return;
    axiosInstance.get(`/cosmetics/active/${studentId}`)
      .then((r) => setCosmetics(r.data || []))
      .catch(() => {});
  }, [studentId]);

  const nick = cosmetics.find((c) => c.itemType === 'NICK_COLOR');
  const frame = cosmetics.find((c) => c.itemType === 'AVATAR_FRAME');
  const badge = cosmetics.find((c) => c.itemType === 'BADGE');
  const stickers = cosmetics.filter((c) => c.itemType === 'STICKER');

  const nickKey = nick?.itemKey;
  const nameStyle = nickKey === 'rainbow'
    ? {
        background: 'linear-gradient(90deg,#e91e63,#ff9800,#4caf50,#2196f3,#9c27b0)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        fontWeight: 700,
      }
    : { color: COLOR_MAP[nickKey] || 'inherit', fontWeight: 600 };

  const frameStyle = frame ? FRAME_MAP[frame.itemKey] || {} : {};

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
      {showAvatar && (
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          <Avatar
            src={avatar}
            sx={{
              width: avatarSize, height: avatarSize,
              bgcolor: '#4F46E5', fontSize: avatarSize * 0.4,
              ...frameStyle,
            }}
          >
            {name?.charAt(0) || '?'}
          </Avatar>
          {stickers.length > 0 && (
            <Box sx={{
              position: 'absolute', bottom: -4, right: -6,
              fontSize: '12px', lineHeight: 1, display: 'flex', gap: 0.2,
            }}>
              {stickers.slice(0, 3).map((s) => (
                <span key={s.id}>{STICKER_ICON[s.itemKey] || '⭐'}</span>
              ))}
            </Box>
          )}
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
        <Box component="span" sx={{ ...nameStyle, fontSize, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {name || 'Пользователь'}
        </Box>
        {badge && (
          <Box component="span" sx={{ fontSize: fontSize }}>
            {BADGE_ICON[badge.itemKey] || ''}
          </Box>
        )}
      </Box>
    </Box>
  );
}