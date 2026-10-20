import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Chip, Button, Snackbar, Alert,
  Tabs, Tab, CircularProgress, Stack, Tooltip, Dialog, DialogTitle,
  DialogContent, IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axiosConfig';

const CATEGORIES = [
  { key: 'NICK_COLOR',   label: '🎨 Ник' },
  { key: 'AVATAR_FRAME', label: '🖼️ Рамка' },
  { key: 'STICKER',      label: '😀 Стикеры' },
  { key: 'BADGE',        label: '🏅 Бейджи' },
  { key: 'BACKGROUND',   label: '🌈 Фон' },
  { key: 'AVATAR_PACK',  label: '🎯 Аватары' },
];

export default function StudentShop() {
  const { user } = useAuth();
  const studentId = user?.allIds?.[0] || user?.id;

  const [shop, setShop] = useState([]);
  const [myItems, setMyItems] = useState([]);
  const [balance, setBalance] = useState(0);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [packModal, setPackModal] = useState({
    open: false,
    packKey: null,
    packTitle: '',
    items: [],
    selected: null,
    applying: false,
  });

  const loadAll = async () => {
    try {
      const [shopRes, myRes, balRes] = await Promise.all([
        axiosInstance.get('/cosmetics/shop'),
        axiosInstance.get(`/cosmetics/my/${studentId}`),
        axiosInstance.get(`/points/balance/${studentId}`),
      ]);
      setShop(shopRes.data || []);
      setMyItems(myRes.data || []);
      setBalance(balRes.data?.balance || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) loadAll();
  }, [studentId]);

  const purchaseMap = {};
  myItems.forEach((c) => {
    purchaseMap[`${c.itemType}:${c.itemKey}`] = c;
  });

  const activeSet = new Set(
    myItems.filter((c) => c.active).map((c) => `${c.itemType}:${c.itemKey}`)
  );

  const currentCategory = CATEGORIES[tab].key;
  const itemsInCategory = shop.filter((i) => i.type === currentCategory);

  const openPackModal = async (packKey, packTitle) => {
    try {
      const res = await axiosInstance.get(`/cosmetics/packs/${packKey}`);
      setPackModal({
        open: true,
        packKey,
        packTitle,
        items: res.data || [],
        selected: null,
        applying: false,
      });
    } catch (e) {
      setToast({ type: 'error', message: 'Не удалось загрузить аватары' });
    }
  };

  const handleBuy = async (item) => {
    try {
      await axiosInstance.post('/cosmetics/buy', {
        studentId,
        itemType: item.type,
        itemKey: item.key,
      });
      setToast({ type: 'success', message: `Куплено: ${item.title}` });
      await loadAll();

      if (item.type === 'AVATAR_PACK') {
        setTimeout(() => openPackModal(item.key, item.title), 300);
      }
    } catch (e) {
      setToast({
        type: 'error',
        message: e.response?.data?.error || 'Ошибка покупки',
      });
    }
  };

  const handleActivate = async (cosmeticId, item) => {
    try {
      await axiosInstance.patch(`/cosmetics/activate/${cosmeticId}`, { studentId });
      await loadAll();

      if (item?.type === 'AVATAR_PACK') {
        setTimeout(() => openPackModal(item.key, item.title), 300);
      }
    } catch (e) {
      setToast({
        type: 'error',
        message: e.response?.data?.error || 'Ошибка активации',
      });
    }
  };

  const applyPackAvatar = async (index) => {
    setPackModal((prev) => ({ ...prev, applying: true, selected: index }));
    try {
      await axiosInstance.post(`/students/${studentId}/avatar-from-pack`, {
        packKey: packModal.packKey,
        index,
      });
      setToast({ type: 'success', message: 'Аватар установлен!' });
      setPackModal((prev) => ({ ...prev, open: false, applying: false }));
      await loadAll();
    } catch (e) {
      setToast({
        type: 'error',
        message: e.response?.data?.error || 'Ошибка применения',
      });
      setPackModal((prev) => ({ ...prev, applying: false }));
    }
  };

  const renderPreview = (item) => {
    if (item.type === 'NICK_COLOR') {
      if (item.preview === 'rainbow') {
        return (
          <Box sx={{
            fontWeight: 800, fontSize: '1.05rem',
            background: 'linear-gradient(90deg,#e91e63,#ff9800,#4caf50,#2196f3,#9c27b0)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Твой ник
          </Box>
        );
      }
      return <Typography sx={{ color: item.preview, fontWeight: 800, fontSize: '1.05rem' }}>Твой ник</Typography>;
    }
    if (item.type === 'AVATAR_FRAME') {
      return (
        <Box sx={{
          width: 46, height: 46, borderRadius: '50%',
          background: item.preview === 'fire'
            ? 'conic-gradient(from 0deg,#f97316,#ef4444,#f97316)'
            : item.preview,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: '#fff' }} />
        </Box>
      );
    }
    if (item.type === 'BACKGROUND') {
      return (
        <Box sx={{
          width: '100%', height: 44, borderRadius: 2,
          background: item.preview === 'custom'
            ? 'repeating-linear-gradient(45deg,#eee,#eee 8px,#ccc 8px,#ccc 16px)'
            : item.preview,
        }} />
      );
    }
    if (item.type === 'AVATAR_PACK') {
      return (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          {[1,2,3,4,5].map(n => (
            <Box
              key={n}
              component="img"
              src={`/api/uploads/avatars/packs/${item.key}/${n}.jpg`}
              onError={(e) => { e.target.style.display = 'none'; }}
              sx={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid #eee' }}
            />
          ))}
          <Box sx={{ fontSize: 32, display: 'none' }}>{item.icon}</Box>
        </Box>
      );
    }
    return <Typography sx={{ fontSize: 32 }}>{item.icon}</Typography>;
  };

  if (loading) {
    return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={800}>🛍️ Магазин</Typography>
        <Paper sx={{ px: 2.5, py: 1, borderRadius: 3, bgcolor: '#111827' }}>
          <Typography sx={{ color: '#F3F4F6', fontWeight: 700 }}>💰 {balance} баллов</Typography>
        </Paper>
      </Box>

      <Paper sx={{ borderRadius: 3, mb: 3 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 } }}
        >
          {CATEGORIES.map((c) => <Tab key={c.key} label={c.label} />)}
        </Tabs>
      </Paper>

      <Grid container spacing={2}>
        {itemsInCategory.map((item) => {
          const key = `${item.type}:${item.key}`;
          const purchased = purchaseMap[key];
          const active = activeSet.has(key);
          const canAfford = balance >= item.price;

          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
              <Paper sx={{ p: 2.5, borderRadius: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                <Box sx={{
                  minHeight: 70, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', mb: 1.5,
                }}>
                  {renderPreview(item)}
                </Box>
                <Typography fontWeight={700} sx={{ mb: 0.5 }}>{item.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {item.price} баллов
                </Typography>

                <Box sx={{ mt: 'auto' }}>
                  {!purchased && (
                    <Button
                      fullWidth
                      variant="contained"
                      disabled={!canAfford}
                      onClick={() => handleBuy(item)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Купить
                    </Button>
                  )}
                  {purchased && active && (
                    <Stack spacing={1}>
                      <Chip label="✓ Активно" color="success" sx={{ width: '100%', fontWeight: 700 }} />
                      {item.type === 'AVATAR_PACK' && (
                        <Button
                          fullWidth
                          size="small"
                          variant="outlined"
                          onClick={() => openPackModal(item.key, item.title)}
                          sx={{ textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}
                        >
                          Выбрать аватар
                        </Button>
                      )}
                    </Stack>
                  )}
                  {purchased && !active && (
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => handleActivate(purchased.id, item)}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      Активировать
                    </Button>
                  )}
                </Box>
              </Paper>
            </Grid>
          );
        })}
      </Grid>

      {/* МОДАЛКА ВЫБОРА АВАТАРА ИЗ НАБОРА */}
      <Dialog
        open={packModal.open}
        onClose={() => !packModal.applying && setPackModal((prev) => ({ ...prev, open: false }))}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography fontWeight={800}>Выбери аватар — {packModal.packTitle}</Typography>
          <IconButton
            onClick={() => setPackModal((prev) => ({ ...prev, open: false }))}
            disabled={packModal.applying}
            size="small"
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Кликни на понравившуюся картинку — она станет твоим аватаром
          </Typography>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              flexWrap: 'wrap',
              justifyContent: 'center',
              py: 1,
            }}
          >
            {packModal.items.map((url, idx) => {
              const index = idx + 1;
              const isSelected = packModal.selected === index;
              return (
                <Box
                  key={index}
                  onClick={() => !packModal.applying && applyPackAvatar(index)}
                  sx={{
                    width: 110,
                    height: 110,
                    borderRadius: 2,
                    overflow: 'hidden',
                    cursor: packModal.applying ? 'not-allowed' : 'pointer',
                    border: isSelected ? '3px solid #7B5CFA' : '2px solid #EAEAEA',
                    transition: 'all 0.15s ease',
                    opacity: packModal.applying && !isSelected ? 0.5 : 1,
                    position: 'relative',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    '&:hover': {
                      transform: packModal.applying ? 'none' : 'scale(1.05)',
                      borderColor: '#7B5CFA',
                    },
                  }}
                >
                  <img
                    src={`/api${url}`}
                    alt={`Аватар ${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    }}
                  />
                  {isSelected && packModal.applying && (
                    <Box sx={{
                      position: 'absolute',
                      inset: 0,
                      bgcolor: 'rgba(123,92,250,0.7)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CircularProgress size={28} sx={{ color: '#FFF' }} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {toast ? (
          <Alert severity={toast.type} onClose={() => setToast(null)}>{toast.message}</Alert>
        ) : <div />}
      </Snackbar>
    </Box>
  );
}