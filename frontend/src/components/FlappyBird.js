// ========== frontend/src/components/FlappyBird.js (v2) ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography, CircularProgress, IconButton, Tooltip } from '@mui/material';
import { Pause as PauseIcon, PlayArrow as PlayIcon } from '@mui/icons-material';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const W = 360;
const H = 480;
const BASE_GRAVITY = 0.38;
const JUMP = -7.5;
const MAX_VY = 9;
const PIPE_W = 64;
const PIPE_GAP_INIT = 168;
  const PIPE_GAP_MIN = 130;
const PIPE_SPEED_INIT = 2.6;
const PIPE_SPEED_MAX = 4.2;
const GROUND_H = 70;

function FlappyBird() {
    const { user } = useAuth();
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    const stateRef = useRef({
        bird: { x: 90, y: H / 2 - 20, vy: 0, r: 16, wingFrame: 0, wingTick: 0 },
        pipes: [],
        frame: 0,
        score: 0,
        gameOver: false,
        started: false,
        paused: false,
        shake: 0,
        particles: [],
        cloudOffset1: 0,
        cloudOffset2: 0,
        starOffset: 0,
        wingBoost: 0,
        pipeSpeed: PIPE_SPEED_INIT,
        pipeGap: PIPE_GAP_INIT,
        spawnCounter: 0,
        spawnInterval: 95,
        // для градиентной гравитации первые кадры
        startedFrames: 0,
    });
    const rafRef = useRef(null);
    const lastTimeRef = useRef(0);

    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const [paused, setPaused] = useState(false);
    const [record, setRecord] = useState(null);
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
        } catch (err) { setRecord(0); }
    };

    const loadLeaderboard = async () => {
        setLeaderboardLoading(true);
        try {
            const res = await axiosInstance.get('/games/leaderboard?game=flappy');
            setLeaderboard(res.data || []);
        } catch (err) { setLeaderboard([]); }
        finally { setLeaderboardLoading(false); }
    };

    useEffect(() => { loadMyScore(); loadLeaderboard(); }, []);

    // ========== Сохранение рекорда ==========
    const saveScore = async (finalScore) => {
        if (!user || (user.role !== 'student' && user.role !== 'ROLE_STUDENT')) return;
        setSaving(true);
        try {
            const res = await axiosInstance.post('/games/score', { game: 'flappy', score: finalScore });
            setIsNewRecord(res.data.isRecord);
            if (res.data.isRecord) { await loadMyScore(); await loadLeaderboard(); }
        } catch (err) { console.warn('Не удалось сохранить рекорд:', err); }
        finally { setSaving(false); }
    };

    // ========== Отрисовка ==========
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const s = stateRef.current;

        ctx.save();
        // Screen shake
        if (s.shake > 0) {
            const dx = (Math.random() - 0.5) * s.shake;
            const dy = (Math.random() - 0.5) * s.shake;
            ctx.translate(dx, dy);
        }

        // === Небо — глубже, с переходом ===
        const sky = ctx.createLinearGradient(0, 0, 0, H);
        sky.addColorStop(0, '#0a0e27');
        sky.addColorStop(0.35, '#141852');
        sky.addColorStop(0.7, '#2c3e7a');
        sky.addColorStop(1, '#5a7bb8');
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, W, H);

        // === Звёзды (параллакс, медленный) ===
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        for (let i = 0; i < 40; i++) {
            const baseX = (i * 137) % W;
            const x = (baseX - s.starOffset * 0.15 + W) % W;
            const y = (i * 89) % (H - GROUND_H - 80);
            const size = i % 7 === 0 ? 2.5 : (i % 3 === 0 ? 2 : 1.5);
            ctx.fillRect(x, y, size, size);
        }

        // === Луна ===
        const moonX = (W - 60 - s.starOffset * 0.05 + W) % (W + 120) - 60;
        const moonGrad = ctx.createRadialGradient(moonX, 70, 5, moonX, 70, 50);
        moonGrad.addColorStop(0, 'rgba(255,250,220,0.95)');
        moonGrad.addColorStop(0.5, 'rgba(255,245,200,0.4)');
        moonGrad.addColorStop(1, 'rgba(255,245,200,0)');
        ctx.fillStyle = moonGrad;
        ctx.beginPath();
        ctx.arc(moonX, 70, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,250,220,0.95)';
        ctx.beginPath();
        ctx.arc(moonX, 70, 22, 0, Math.PI * 2);
        ctx.fill();

        // === Облака слой 1 (дальний, медленный) ===
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        for (let i = 0; i < 5; i++) {
            const baseX = (i * 200 + 50) % (W + 300);
            const x = (baseX - s.cloudOffset1) % (W + 300);
            const drawX = x < -150 ? x + W + 300 : x;
            const y = 60 + (i * 30) % 100;
            ctx.beginPath();
            ctx.ellipse(drawX, y, 60, 18, 0, 0, Math.PI * 2);
            ctx.ellipse(drawX + 40, y + 6, 45, 14, 0, 0, Math.PI * 2);
            ctx.ellipse(drawX - 35, y + 4, 40, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === Облака слой 2 (ближе, быстрее) ===
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 4; i++) {
            const baseX = (i * 250 + 100) % (W + 350);
            const x = (baseX - s.cloudOffset2) % (W + 350);
            const drawX = x < -180 ? x + W + 350 : x;
            const y = 120 + (i * 45) % 140;
            ctx.beginPath();
            ctx.ellipse(drawX, y, 75, 22, 0, 0, Math.PI * 2);
            ctx.ellipse(drawX + 55, y + 8, 55, 16, 0, 0, Math.PI * 2);
            ctx.ellipse(drawX - 45, y + 5, 50, 14, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // === Трубы ===
        s.pipes.forEach(pipe => {
            const pipeGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
            pipeGrad.addColorStop(0, '#1a5e2a');
            pipeGrad.addColorStop(0.25, '#3dbf5c');
            pipeGrad.addColorStop(0.55, '#22c55e');
            pipeGrad.addColorStop(0.85, '#15803d');
            pipeGrad.addColorStop(1, '#0d4a1f');

            // верхняя
            ctx.fillStyle = pipeGrad;
            ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(pipe.x + 6, 0, 6, pipe.topH);

            // нижняя
            ctx.fillStyle = pipeGrad;
            ctx.fillRect(pipe.x, pipe.topH + s.pipeGap, PIPE_W, H - GROUND_H - (pipe.topH + s.pipeGap));
            ctx.fillStyle = 'rgba(255,255,255,0.18)';
            ctx.fillRect(pipe.x + 6, pipe.topH + s.pipeGap, 6, H - GROUND_H - (pipe.topH + s.pipeGap));

            // "крышки" (caps) — шире самой трубы
            const capH = 22;
            const capOverhang = 5;
            const capGrad = ctx.createLinearGradient(pipe.x - capOverhang, 0, pipe.x + PIPE_W + capOverhang, 0);
            capGrad.addColorStop(0, '#15803d');
            capGrad.addColorStop(0.3, '#4ade80');
            capGrad.addColorStop(0.6, '#22c55e');
            capGrad.addColorStop(1, '#0d4a1f');

            ctx.fillStyle = capGrad;
            ctx.fillRect(pipe.x - capOverhang, pipe.topH - capH, PIPE_W + capOverhang * 2, capH);
            ctx.fillRect(pipe.x - capOverhang, pipe.topH + s.pipeGap, PIPE_W + capOverhang * 2, capH);

            // обводка
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 2;
            ctx.strokeRect(pipe.x, 0, PIPE_W, pipe.topH);
            ctx.strokeRect(pipe.x, pipe.topH + s.pipeGap, PIPE_W, H - GROUND_H - (pipe.topH + s.pipeGap));
        });

        // === Земля ===
        // трава
        ctx.fillStyle = '#2d6b3e';
        ctx.fillRect(0, H - GROUND_H, W, GROUND_H);
        // светлая полоса травы сверху
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(0, H - GROUND_H, W, 6);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(0, H - GROUND_H + 6, W, 4);
        // текстура травы
        ctx.fillStyle = 'rgba(0,0,0,0.15)';
        for (let i = 0; i < 40; i++) {
            const x = (i * 23 + (s.frame * 0.5)) % W;
            const y = H - GROUND_H + 14 + (i * 7) % (GROUND_H - 20);
            ctx.fillRect(x, y, 3, 2);
        }
        // земля
        ctx.fillStyle = '#5a3a1a';
        ctx.fillRect(0, H - GROUND_H + 30, W, GROUND_H - 30);
        // полоски земли
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        for (let i = 0; i < 30; i++) {
            const x = (i * 17) % W;
            const y = H - GROUND_H + 40 + (i * 5) % (GROUND_H - 45);
            ctx.fillRect(x, y, 4, 2);
        }

        // === Частицы (перья при смерти) ===
        s.particles.forEach(p => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
            ctx.fillStyle = p.color;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rot);
            ctx.beginPath();
            ctx.ellipse(0, 0, p.size, p.size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });

        // === Птица ===
        const b = s.bird;
        // свечение при прыжке
        if (s.wingBoost > 0) {
            const glow = ctx.createRadialGradient(b.x, b.y, 4, b.x, b.y, 40);
            glow.addColorStop(0, `rgba(251,191,36,${0.4 * s.wingBoost})`);
            glow.addColorStop(1, 'rgba(251,191,36,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(b.x, b.y, 40, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(b.x, b.y);
        const angle = Math.max(-0.55, Math.min(1.3, b.vy / 12));
        ctx.rotate(angle);

        // хвост
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.moveTo(-b.r - 2, 0);
        ctx.lineTo(-b.r - 10, -6);
        ctx.lineTo(-b.r - 10, 6);
        ctx.closePath();
        ctx.fill();

        // тело (градиент)
        const bodyGrad = ctx.createRadialGradient(-4, -4, 2, 0, 0, b.r + 8);
        bodyGrad.addColorStop(0, '#fde047');
        bodyGrad.addColorStop(0.6, '#fbbf24');
        bodyGrad.addColorStop(1, '#d97706');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, b.r + 5, b.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // глаз
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(7, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(9, -5, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // блик глаза
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(10, -7, 1, 0, Math.PI * 2);
        ctx.fill();

        // клюв
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(13, -2);
        ctx.lineTo(26, 2);
        ctx.lineTo(13, 6);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#7c2d12';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // линия клюва
        ctx.beginPath();
        ctx.moveTo(13, 2);
        ctx.lineTo(25, 2);
        ctx.stroke();

        // крыло с анимацией (3 кадра)
        const wingY = b.wingFrame === 0 ? 2 : (b.wingFrame === 1 ? -2 : 0);
        const wingRot = b.wingFrame === 0 ? 0.2 : (b.wingFrame === 1 ? -0.3 : 0);
        ctx.save();
        ctx.translate(-4, wingY);
        ctx.rotate(wingRot);
        const wingGrad = ctx.createLinearGradient(0, 0, 0, 8);
        wingGrad.addColorStop(0, '#f59e0b');
        wingGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = wingGrad;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        // === Счёт ===
        if (s.started) {
            ctx.fillStyle = '#fff';
            ctx.font = '900 44px Inter, system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 6;
            ctx.strokeText(s.score, W / 2, 70);
            ctx.fillText(s.score, W / 2, 70);
        }

        ctx.restore();
    }, []);

    // ========== Игровой цикл ==========
    const loop = useCallback(() => {
        const s = stateRef.current;
        if (s.gameOver || s.paused) return;

        if (s.started) {
            s.startedFrames++;

            // Плавное нарастание гравитации первые 25 кадров
            const gravFactor = Math.min(1, s.startedFrames / 25);
            const gravity = BASE_GRAVITY * gravFactor;

            s.bird.vy += gravity;
            if (s.bird.vy > MAX_VY) s.bird.vy = MAX_VY;
            s.bird.y += s.bird.vy;

            // крылья
            s.bird.wingTick++;
            if (s.bird.wingTick % 4 === 0) {
                s.bird.wingFrame = (s.bird.wingFrame + 1) % 3;
            }

            // столкновение с землёй/небом
            if (s.bird.y + s.bird.r >= H - GROUND_H) {
                s.bird.y = H - GROUND_H - s.bird.r;
                triggerGameOver();
                return;
            }
            if (s.bird.y - s.bird.r <= 0) {
                s.bird.y = s.bird.r;
                s.bird.vy = 0;
            }

            // фон-параллакс
            s.starOffset = (s.starOffset + 0.05) % (W * 2);
            s.cloudOffset1 = (s.cloudOffset1 + 0.15) % (W + 300);
            s.cloudOffset2 = (s.cloudOffset2 + 0.4) % (W + 350);

            // прогрессия сложности
            s.pipeSpeed = Math.min(PIPE_SPEED_MAX, PIPE_SPEED_INIT + Math.floor(s.score / 5) * 0.12);
            s.pipeGap = Math.max(PIPE_GAP_MIN, PIPE_GAP_INIT - Math.floor(s.score / 5) * 4);
            s.spawnInterval = Math.max(75, 95 - Math.floor(s.score / 5) * 2);

            // спавн труб
            s.frame++;
            if (s.frame % s.spawnInterval === 0) {
                const minTop = 70;
                const maxTop = H - GROUND_H - s.pipeGap - 70;
                const topH = minTop + Math.random() * (maxTop - minTop);
                s.pipes.push({ x: W, topH, passed: false });
            }

            // движение труб
            s.pipes.forEach(p => { p.x -= s.pipeSpeed; });
            s.pipes = s.pipes.filter(p => p.x + PIPE_W > -10);

            // столкновения + счёт
            const bx = s.bird.x, by = s.bird.y, r = s.bird.r;
            for (const p of s.pipes) {
                const inX = bx + r - 3 > p.x && bx - r + 3 < p.x + PIPE_W;
                const hitTop = by - r + 3 < p.topH;
                const hitBottom = by + r - 3 > p.topH + s.pipeGap;
                if (inX && (hitTop || hitBottom)) {
                    triggerGameOver();
                    return;
                }
                if (!p.passed && p.x + PIPE_W < bx - r) {
                    p.passed = true;
                    s.score++;
                    setScore(s.score);
                }
            }

            // boost затухает
            if (s.wingBoost > 0) s.wingBoost -= 0.05;

            // shake затухает
            if (s.shake > 0) s.shake *= 0.85;
        } else {
            // до старта — лёгкое покачивание
            s.bird.y = H / 2 - 20 + Math.sin(Date.now() / 300) * 6;
            s.starOffset = (s.starOffset + 0.05) % (W * 2);
            s.cloudOffset1 = (s.cloudOffset1 + 0.15) % (W + 300);
            s.cloudOffset2 = (s.cloudOffset2 + 0.4) % (W + 350);
        }

        // частицы
        s.particles = s.particles.filter(p => p.life > 0);
        s.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25;
            p.vx *= 0.99;
            p.rot += p.vr;
            p.life--;
        });

        draw();
        rafRef.current = requestAnimationFrame(loop);
    }, [draw]);

    const triggerGameOver = useCallback(() => {
        const s = stateRef.current;
        s.gameOver = true;
        s.shake = 18;
        // спавн частиц-перьев
        const colors = ['#fbbf24', '#fde047', '#f59e0b', '#dc2626'];
        for (let i = 0; i < 22; i++) {
            s.particles.push({
                x: s.bird.x,
                y: s.bird.y,
                vx: (Math.random() - 0.5) * 8,
                vy: -Math.random() * 6 - 2,
                rot: Math.random() * Math.PI * 2,
                vr: (Math.random() - 0.5) * 0.4,
                size: 4 + Math.random() * 4,
                life: 90,
                maxLife: 90,
                color: colors[Math.floor(Math.random() * colors.length)],
            });
        }
        setGameOver(true);
        saveScore(s.score);
        // продолжаем рендерить частицы и shake
        const tickParticles = () => {
            const st = stateRef.current;
            st.particles = st.particles.filter(p => p.life > 0);
            st.particles.forEach(p => {
                p.x += p.vx; p.y += p.vy;
                p.vy += 0.25; p.vx *= 0.99;
                p.rot += p.vr; p.life--;
            });
            if (st.shake > 0.3) st.shake *= 0.9; else st.shake = 0;
            draw();
            if (st.particles.length > 0 || st.shake > 0.3) {
                rafRef.current = requestAnimationFrame(tickParticles);
            }
        };
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(tickParticles);
    }, [draw]);

    // ========== Старт / рестарт ==========
    const startGame = useCallback(() => {
        stateRef.current = {
            bird: { x: 90, y: H / 2 - 20, vy: JUMP, r: 16, wingFrame: 0, wingTick: 0 },
            pipes: [],
            frame: 0,
            score: 0,
            gameOver: false,
            started: true,
            paused: false,
            shake: 0,
            particles: [],
            cloudOffset1: stateRef.current.cloudOffset1 || 0,
            cloudOffset2: stateRef.current.cloudOffset2 || 0,
            starOffset: stateRef.current.starOffset || 0,
            wingBoost: 0,
            pipeSpeed: PIPE_SPEED_INIT,
            pipeGap: PIPE_GAP_INIT,
            spawnCounter: 0,
            spawnInterval: 95,
            startedFrames: 0,
        };
        setScore(0);
        setGameOver(false);
        setStarted(true);
        setPaused(false);
        setIsNewRecord(false);
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(loop);
    }, [loop]);

    // ========== Управление ==========
    const jump = useCallback(() => {
        const s = stateRef.current;
        if (s.paused) return;
        if (!s.started || s.gameOver) {
            startGame();
            return;
        }
        s.bird.vy = JUMP;
        s.wingBoost = 1;
        s.bird.wingFrame = 1;
    }, [startGame]);

    const togglePause = useCallback(() => {
        const s = stateRef.current;
        if (!s.started || s.gameOver) return;
        s.paused = !s.paused;
        setPaused(s.paused);
        if (!s.paused) {
            rafRef.current = requestAnimationFrame(loop);
        } else {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            draw();
        }
    }, [loop, draw]);

    useEffect(() => {
        const handleKey = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                if (!paused) jump();
            }
            if (e.code === 'Escape') {
                e.preventDefault();
                togglePause();
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [jump, togglePause, paused]);

    useEffect(() => {
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, []);

    // Первый рендер — рисуем статичный кадр
    useEffect(() => {
        const s = stateRef.current;
        s.started = false;
        draw();
        rafRef.current = requestAnimationFrame(loop);
        return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    }, [draw, loop]);

    return (
        <Box sx={{ textAlign: 'center', userSelect: 'none' }}>
            <Box
                ref={containerRef}
                sx={{
                    position: 'relative',
                    display: 'inline-block',
                    width: '100%',
                    maxWidth: W,
                    mx: 'auto',
                }}
            >
                <Box
                    onClick={jump}
                    sx={{
                        position: 'relative',
                        cursor: 'pointer',
                        borderRadius: '16px',
                        overflow: 'hidden',
                        boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                        aspectRatio: `${W} / ${H}`,
                        width: '100%',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={W}
                        height={H}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                    />

                    {/* Кнопка паузы */}
                    {started && !gameOver && (
                        <Tooltip title={paused ? 'Продолжить (ESC)' : 'Пауза (ESC)'}>
                            <IconButton
                                onClick={(e) => { e.stopPropagation(); togglePause(); }}
                                size="small"
                                sx={{
                                    position: 'absolute',
                                    top: 10,
                                    right: 10,
                                    bgcolor: 'rgba(0,0,0,0.45)',
                                    color: '#fff',
                                    backdropFilter: 'blur(6px)',
                                    '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
                                }}
                            >
                                {paused ? <PlayIcon fontSize="small" /> : <PauseIcon fontSize="small" />}
                            </IconButton>
                        </Tooltip>
                    )}

                    {/* Старт-оверлей */}
                    {!started && (
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.55)',
                            color: '#fff', gap: 1.5,
                            backdropFilter: 'blur(2px)',
                        }}>
                            <Typography sx={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                                🐦 Flappy EdSpace
                            </Typography>
                            <Typography sx={{ fontSize: '0.9rem', opacity: 0.85 }}>
                                Клик или пробел — начать
                            </Typography>
                            {record !== null && record > 0 && (
                                <Typography sx={{ fontSize: '0.95rem', mt: 1, fontWeight: 700, color: '#fbbf24' }}>
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

                    {/* Пауза-оверлей */}
                    {paused && !gameOver && (
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: '#fff', gap: 1,
                            backdropFilter: 'blur(4px)',
                        }}>
                            <Typography sx={{ fontSize: '1.6rem', fontWeight: 800 }}>⏸ Пауза</Typography>
                            <Typography sx={{ fontSize: '0.85rem', opacity: 0.75 }}>ESC — продолжить</Typography>
                        </Box>
                    )}

                    {/* Гейм-овер-оверлей */}
                    {gameOver && (
                        <Box sx={{
                            position: 'absolute', inset: 0,
                            display: 'flex', flexDirection: 'column',
                            alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.68)',
                            color: '#fff', gap: 1,
                            backdropFilter: 'blur(3px)',
                        }}>
                            <Typography sx={{ fontSize: '1.8rem', fontWeight: 900 }}>💥 Игра окончена</Typography>
                            <Typography sx={{ fontSize: '1.4rem' }}>Счёт: <b>{score}</b></Typography>
                            {saving && <CircularProgress size={20} sx={{ color: '#fff' }} />}
                            {!saving && isNewRecord && (
                                <Typography sx={{ fontSize: '1rem', color: '#4ADE80', fontWeight: 800 }}>
                                    🎉 Новый рекорд!
                                </Typography>
                            )}
                            {!saving && !isNewRecord && record !== null && record > 0 && (
                                <Typography sx={{ fontSize: '0.9rem', opacity: 0.85 }}>
                                    Ваш рекорд: {record}
                                </Typography>
                            )}
                            <Typography sx={{ fontSize: '0.9rem', opacity: 0.85, mt: 1.5, fontWeight: 600 }}>
                                Клик — играть снова
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>

            {/* Мини-лидерборд под игрой */}
            <Box sx={{ mt: 2, maxWidth: W, mx: 'auto', textAlign: 'left' }}>
                <Typography sx={{
                    fontSize: '0.8rem', fontWeight: 700, color: '#555',
                    mb: 1, letterSpacing: '0.05em', textTransform: 'uppercase',
                }}>
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