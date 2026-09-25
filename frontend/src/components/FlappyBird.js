// ========== frontend/src/components/FlappyBird.js ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const W = 360;
const H = 480;
const GRAVITY = 0.55;
const JUMP = -8.5;
const PIPE_W = 62;
const PIPE_GAP = 160;
const PIPE_SPEED = 2.6;
const PIPE_INTERVAL_FRAMES = 95;
const GROUND_H = 70;

function FlappyBird({ onOpen }) {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const stateRef = useRef({
        bird: { x: 90, y: H / 2 - 20, vy: 0, r: 16 },
        pipes: [],
        frame: 0,
        score: 0,
        gameOver: false,
        started: false,
    });
    const rafRef = useRef(null);

    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const [record, setRecord] = useState(null);       // текущий рекорд из бэкенда
    const [myPlace, setMyPlace] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [isNewRecord, setIsNewRecord] = useState(false);

    // ========== Загрузка рекорда и лидерборда ==========
    const loadMyScore = async () => {
        try {
            const res = await axiosInstance.get('/games/my-score?game=flappy');
            setRecord(res.data.highScore || 0);
            setMyPlace(res.data.place);
        } catch (err) {
            setRecord(0);
        }
    };

    const loadLeaderboard = async () => {
        setLeaderboardLoading(true);
        try {
            const res = await axiosInstance.get('/games/leaderboard?game=flappy');
            setLeaderboard(res.data || []);
        } catch (err) {
            setLeaderboard([]);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        loadMyScore();
        loadLeaderboard();
    }, []);

    // ========== Сохранение рекорда ==========
    const saveScore = async (finalScore) => {
        if (!user || user.role !== 'student') return;
        setSaving(true);
        try {
            const res = await axiosInstance.post('/games/score', {
                game: 'flappy',
                score: finalScore,
            });
            setIsNewRecord(res.data.isRecord);
            if (res.data.isRecord) {
                await loadMyScore();
                await loadLeaderboard();
            }
        } catch (err) {
            console.warn('Не удалось сохранить рекорд:', err);
        } finally {
            setSaving(false);
        }
    };

    // ========== Отрисовка ==========
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        // Небо — градиент
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0f2027');
        sky.addColorStop(0.5, '#203a43');
        sky.addColorStop(1, '#2c5364');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // Звёзды (декор)
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 137) % W;
            const y = (i * 89) % (H - GROUND_H);
            ctx.fillRect(x, y, 2, 2);
        }

        // Трубы
        s.pipes.forEach(pipe => {
            const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
            grad.addColorStop(0, '#4ADE80');
            grad.addColorStop(0.5, '#22C55E');
            grad.addColorStop(1, '#15803D');
            ctx.fillStyle = grad;

            // Верхняя
            ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
            // Нижняя
            ctx.fillRect(pipe.x, pipe.topH + PIPE_GAP, PIPE_W, H - GROUND_H - (pipe.topH + PIPE_GAP));

            // Обводка
            ctx.strokeStyle = '#052e16';
            ctx.lineWidth = 2;
            ctx.strokeRect(pipe.x, 0, PIPE_W, pipe.topH);
            ctx.strokeRect(pipe.x, pipe.topH + PIPE_GAP, PIPE_W, H - GROUND_H - (pipe.topH + PIPE_GAP));
        });

        // Земля
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
        ctx.fillStyle = '#A0522D';
        ctx.fillRect(0, H - GROUND_H, W, 8);

        // Птичка
        const b = s.bird;
        ctx.save();
        ctx.translate(b.x, b.y);
        const angle = Math.max(-0.5, Math.min(1.2, b.vy / 12));
        ctx.rotate(angle);

        // Тело
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r + 4, b.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350F';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Глаз
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(6, -5, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(8, -5, 2, 0, Math.PI * 2);
        ctx.fill();

        // Клюв
        ctx.fillStyle = '#F97316';
        ctx.beginPath();
        ctx.moveTo(14, 0);
        ctx.lineTo(24, 2);
        ctx.lineTo(14, 5);
        ctx.closePath();
        ctx.fill();

        // Крыло
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.ellipse(-4, 2, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Счёт на канвасе
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(s.score, W / 2, 60);
        ctx.fillText(s.score, W / 2, 60);
    }, []);

    // ========== Игровой цикл ==========
    const loop = useCallback(() => {
        const s = stateRef.current;
        if (s.gameOver) return;

        // Если ещё не начали — птица просто висит
        if (s.started) {
            s.bird.vy += GRAVITY;
            s.bird.y += s.bird.vy;

            // Столкновение с землёй / небом
            if (s.bird.y + s.bird.r >= H - GROUND_H || s.bird.y - s.bird.r <= 0) {
                s.gameOver = true;
                setGameOver(true);
                saveScore(s.score);
                return;
            }

            // Спавн труб
            s.frame++;
            if (s.frame % PIPE_INTERVAL_FRAMES === 0) {
                const topH = 60 + Math.random() * (H - GROUND_H - PIPE_GAP - 120);
                s.pipes.push({ x: W, topH, passed: false });
            }

            // Движение труб
            s.pipes.forEach(p => { p.x -= PIPE_SPEED; });
            s.pipes = s.pipes.filter(p => p.x + PIPE_W > 0);

            // Проверка столкновения с трубами + счёт
            const bx = s.bird.x;
            const by = s.bird.y;
            const r = s.bird.r;

            for (const p of s.pipes) {
                const inX = bx + r > p.x && bx - r < p.x + PIPE_W;
                const hitTop = by - r < p.topH;
                const hitBottom = by + r > p.topH + PIPE_GAP;

                if (inX && (hitTop || hitBottom)) {
                    s.gameOver = true;
                    setGameOver(true);
                    saveScore(s.score);
                    return;
                }

                // Очко за прохождение
                if (!p.passed && p.x + PIPE_W < bx - r) {
                    p.passed = true;
                    s.score++;
                    setScore(s.score);
                }
            }
        }

        draw();
        rafRef.current = requestAnimationFrame(loop);
    }, [draw]);

    // ========== Запуск / рестарт ==========
    const startGame = useCallback(() => {
        stateRef.current = {
            bird: { x: 90, y: H / 2 - 20, vy: 0, r: 16 },
            pipes: [],
            frame: 0,
            score: 0,
            gameOver: false,
            started: true,
        };
        setScore(0);
        setGameOver(false);
        setStarted(true);
        setIsNewRecord(false);

        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
    }, [loop]);

    // ========== Управление ==========
    const jump = useCallback(() => {
        const s = stateRef.current;
        if (!s.started || s.gameOver) {
            startGame();
            return;
        }
        s.bird.vy = JUMP;
    }, [startGame]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                jump();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [jump]);

    useEffect(() => {
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    // Остановка цикла при gameOver
    useEffect(() => {
        if (gameOver && rafRef.current) {
            cancelAnimationFrame(rafRef.current);
            draw();
        }
    }, [gameOver, draw]);

    return (
        <Box sx={{ textAlign: 'center', userSelect: 'none' }}>
            <Box
                onClick={jump}
                sx={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: 'pointer',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                }}
            >
                <canvas ref={canvasRef} width={W} height={H} style={{ display: 'block', maxWidth: '100%' }} />

                {!started && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.55)',
                        color: '#fff', gap: 1,
                    }}>
                        <Typography sx={{ fontSize: '1.4rem', fontWeight: 800 }}>🐦 Flappy EdSpace</Typography>
                        <Typography sx={{ fontSize: '0.9rem', opacity: 0.85 }}>Клик или пробел — начать</Typography>
                        {record !== null && (
                            <Typography sx={{ fontSize: '0.9rem', mt: 1, fontWeight: 600 }}>
                                🏆 Ваш рекорд: {record}
                            </Typography>
                        )}
                        {myPlace && (
                            <Typography sx={{ fontSize: '0.8rem', opacity: 0.7 }}>
                                Место в топе: #{myPlace}
                            </Typography>
                        )}
                    </Box>
                )}

                {gameOver && (
                    <Box sx={{
                        position: 'absolute', inset: 0,
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        bgcolor: 'rgba(0,0,0,0.6)',
                        color: '#fff', gap: 1,
                    }}>
                        <Typography sx={{ fontSize: '1.6rem', fontWeight: 800 }}>💥 Игра окончена</Typography>
                        <Typography sx={{ fontSize: '1.2rem' }}>Счёт: <b>{score}</b></Typography>
                        {saving && <CircularProgress size={20} sx={{ color: '#fff' }} />}
                        {!saving && isNewRecord && (
                            <Typography sx={{ fontSize: '0.9rem', color: '#4ADE80', fontWeight: 700 }}>
                                🎉 Новый рекорд!
                            </Typography>
                        )}
                        {!saving && !isNewRecord && record !== null && (
                            <Typography sx={{ fontSize: '0.85rem', opacity: 0.8 }}>
                                Ваш рекорд: {record}
                            </Typography>
                        )}
                        <Typography sx={{ fontSize: '0.85rem', opacity: 0.75, mt: 1 }}>
                            Клик — играть снова
                        </Typography>
                    </Box>
                )}
            </Box>

            {/* Мини-лидерборд под игрой */}
            <Box sx={{ mt: 2, maxWidth: 360, mx: 'auto', textAlign: 'left' }}>
                <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#555', mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    🏆 Топ учеников
                </Typography>
                {leaderboardLoading ? (
                    <Box sx={{ textAlign: 'center', py: 1 }}><CircularProgress size={20} /></Box>
                ) : leaderboard.length === 0 ? (
                    <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>Пока никто не играл</Typography>
                ) : (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {leaderboard.slice(0, 5).map((row) => {
                            const isMe = user?.id === row.studentId;
                            return (
                                <Box key={row.studentId} sx={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    px: 1.5, py: 0.75, borderRadius: 1.5,
                                    bgcolor: isMe ? '#EEF2FF' : '#F5F5F7',
                                    border: isMe ? '1px solid #C7D2FE' : '1px solid transparent',
                                }}>
                                    <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                                        <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#999', minWidth: 20 }}>
                                            #{row.place}
                                        </Typography>
                                        <Typography sx={{ fontSize: '0.85rem', fontWeight: isMe ? 700 : 500, color: '#141414' }}>
                                            {row.studentName}{isMe ? ' (вы)' : ''}
                                        </Typography>
                                    </Box>
                                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: '#10B981' }}>
                                        {row.highScore}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </Box>
    );
}

export default FlappyBird;