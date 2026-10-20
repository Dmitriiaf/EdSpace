import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Button, Paper, Stack, Slider } from '@mui/material';
import { PlayArrow, Pause, SkipNext, RestartAlt } from '@mui/icons-material';

const CODE_COLORS = {
  keyword: '#569CD6',
  string: '#CE9178',
  function: '#DCDCAA',
  variable: '#9CDCFE',
  number: '#B5CEA8',
  operator: '#D4D4D4',
  comment: '#6A9955',
};

export default function AlgorithmVisualizer() {
  const [str] = useState("1110101001");
  const [targetChar] = useState('1');
  
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [count, setCount] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(800);

  const isFinished = currentIndex >= str.length;

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setCount(0);
  }, []);

  const nextStep = useCallback(() => {
    if (isFinished) return;

    setCurrentIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx < str.length && str[nextIdx] === targetChar) {
        setCount((c) => c + 1);
      }
      return nextIdx;
    });
  }, [str, targetChar, isFinished]);

  useEffect(() => {
    let timeout;
    if (isPlaying && !isFinished) {
      timeout = setTimeout(nextStep, speed);
    } else if (isFinished) {
      setIsPlaying(false);
    }
    return () => clearTimeout(timeout);
  }, [isPlaying, nextStep, speed, isFinished]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
      
      {/* Окно кода */}
      <Paper sx={{ 
        p: 4, borderRadius: 3, bgcolor: '#1E1E1E', width: '100%', maxWidth: 700,
        fontFamily: 'Consolas, monospace', fontSize: '1.2rem', color: '#D4D4D4'
      }}>
        {/* Строка 1 */}
        <Box sx={{ display: 'flex', mb: 1, alignItems: 'center' }}>
          <Typography sx={{ color: '#858585', mr: 2, fontSize: '0.9rem', userSelect: 'none' }}>1</Typography>
          <span style={{ color: CODE_COLORS.variable }}>s</span>
          <span style={{ margin: '0 8px' }}>=</span>
          <span style={{ color: CODE_COLORS.string }}>"</span>
          {str.split('').map((char, idx) => (
            <Box
              key={idx}
              component="span"
              sx={{
                display: 'inline-block',
                px: 0.5,
                borderRadius: 1,
                transition: 'all 0.2s ease',
                // Текущий (синий)
                ...(idx === currentIndex && {
                  bgcolor: '#4F46E5',
                  color: '#FFF',
                  transform: 'scale(1.2)',
                  boxShadow: '0 0 10px rgba(79, 70, 229, 0.6)',
                  zIndex: 2,
                  position: 'relative'
                }),
                // Уже посчитанные (зеленые)
                ...(idx < currentIndex && char === targetChar && {
                  color: '#10B981',
                  fontWeight: 'bold'
                })
              }}
            >
              {char}
            </Box>
          ))}
          <span style={{ color: CODE_COLORS.string }}>"</span>
        </Box>

        {/* Строка 2 */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography sx={{ color: '#858585', mr: 2, fontSize: '0.9rem', userSelect: 'none' }}>2</Typography>
          <span style={{ color: CODE_COLORS.variable }}>count</span>
          <span style={{ margin: '0 8px' }}>=</span>
          <span style={{ color: CODE_COLORS.variable }}>s</span>.
          <span style={{ color: CODE_COLORS.function }}>count</span>
          <span>(</span>
          <span style={{ color: CODE_COLORS.string }}>'1'</span>
          <span>)</span>
          <span style={{ margin: '0 8px' }}>=</span>
          <Box component="span" sx={{
            color: CODE_COLORS.number,
            fontWeight: 'bold',
            px: 1,
            borderRadius: 1,
            transition: 'all 0.2s ease',
            // Анимация счетчика
            ...(isPlaying && {
              bgcolor: '#10B981',
              color: '#FFF',
              transform: 'scale(1.2)'
            })
          }}>
            {count}
          </Box>
        </Box>
      </Paper>

      {/* Статус */}
      <Box sx={{ mt: 2, height: 24 }}>
        <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
          {isFinished 
            ? `✅ Готово! Итоговый результат: ${count}` 
            : currentIndex >= 0 
              ? `Шаг ${currentIndex + 1} из ${str.length}. Проверяем символ '${str[currentIndex]}'`
              : 'Нажмите «Шаг», чтобы начать'
          }
        </Typography>
      </Box>

      {/* Управление */}
      <Stack direction="row" spacing={2} sx={{ mt: 3 }} alignItems="center">
        <Button 
          variant="contained" 
          startIcon={<SkipNext />} 
          onClick={nextStep}
          disabled={isPlaying || isFinished}
        >
          Шаг
        </Button>
        <Button 
          variant={isPlaying ? "outlined" : "contained"} 
          startIcon={isPlaying ? <Pause /> : <PlayArrow />} 
          onClick={() => setIsPlaying(!isPlaying)}
          disabled={isFinished}
        >
          {isPlaying ? 'Пауза' : 'Авто-плей'}
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<RestartAlt />} 
          onClick={reset}
        >
          Сброс
        </Button>
        
        <Box sx={{ width: 150, ml: 2 }}>
          <Typography variant="caption" color="text.secondary">Скорость</Typography>
          <Slider
            value={1000 - speed}
            min={200}
            max={900}
            onChange={(e, val) => setSpeed(1000 - val)}
            size="small"
          />
        </Box>
      </Stack>
    </Box>
  );
}