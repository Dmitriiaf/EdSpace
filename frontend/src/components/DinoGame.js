// ========== frontend/src/components/DinoGame.js ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Typography } from '@mui/material';

const GRID = 10;
const CELL = 24;

function SnakeGame() {
    const canvasRef = useRef(null);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [started, setStarted] = useState(false);
    const stateRef = useRef({ snake: [], food: null, dir: null, nextDir: null, gameOver: false });

    const init = useCallback(() => {
        const snake = [
            { x: 5, y: 5 },
            { x: 4, y: 5 },
            { x: 3, y: 5 },
        ];
        const food = randomFood(snake);
        stateRef.current = { snake, food, dir: 'RIGHT', nextDir: 'RIGHT', gameOver: false };
        setScore(0);
        setGameOver(false);
        setStarted(true);
        draw();
    }, []);

    const randomFood = (snake) => {
        let pos;
        do {
            pos = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
        } while (snake.some(s => s.x === pos.x && s.y === pos.y));
        return pos;
    };

    const draw = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const { snake, food } = stateRef.current;
        const size = GRID * CELL;

        // Фон
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);

        // Сетка
        ctx.strokeStyle = '#16213e';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= GRID; i++) {
            ctx.beginPath();
            ctx.moveTo(i * CELL, 0);
            ctx.lineTo(i * CELL, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * CELL);
            ctx.lineTo(size, i * CELL);
            ctx.stroke();
        }

        // Еда
        ctx.fillStyle = '#e94560';
        ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);

        // Змейка
        snake.forEach((s, i) => {
            const alpha = 1 - i * 0.05;
            ctx.fillStyle = i === 0 ? `rgba(0, 230, 118, ${alpha})` : `rgba(0, 200, 100, ${alpha})`;
            ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
            if (i === 0) {
                // Глаза
                ctx.fillStyle = '#fff';
                const cx = s.x * CELL + CELL / 2;
                const cy = s.y * CELL + CELL / 2;
                const { dir } = stateRef.current;
                if (dir === 'RIGHT') { ctx.fillRect(cx + 3, cy - 4, 3, 3); ctx.fillRect(cx + 3, cy + 2, 3, 3); }
                else if (dir === 'LEFT') { ctx.fillRect(cx - 6, cy - 4, 3, 3); ctx.fillRect(cx - 6, cy + 2, 3, 3); }
                else if (dir === 'UP') { ctx.fillRect(cx - 4, cy - 6, 3, 3); ctx.fillRect(cx + 2, cy - 6, 3, 3); }
                else { ctx.fillRect(cx - 4, cy + 3, 3, 3); ctx.fillRect(cx + 2, cy + 3, 3, 3); }
            }
        });
    };

    const tick = useCallback(() => {
        const state = stateRef.current;
        if (state.gameOver) return;

        state.dir = state.nextDir;
        const head = state.snake[0];
        let newHead;

        switch (state.dir) {
            case 'UP': newHead = { x: head.x, y: head.y - 1 }; break;
            case 'DOWN': newHead = { x: head.x, y: head.y + 1 }; break;
            case 'LEFT': newHead = { x: head.x - 1, y: head.y }; break;
            case 'RIGHT': newHead = { x: head.x + 1, y: head.y }; break;
            default: return;
        }

        // Стена
        if (newHead.x < 0 || newHead.x >= GRID || newHead.y < 0 || newHead.y >= GRID) {
            state.gameOver = true;
            setGameOver(true);
            return;
        }

        // Себя
        if (state.snake.some(s => s.x === newHead.x && s.y === newHead.y)) {
            state.gameOver = true;
            setGameOver(true);
            return;
        }

        const ate = newHead.x === state.food.x && newHead.y === state.food.y;
        state.snake.unshift(newHead);

        if (ate) {
            state.food = randomFood(state.snake);
            setScore(prev => prev + 1);
        } else {
            state.snake.pop();
        }

        draw();
    }, []);

    useEffect(() => {
        if (!started || gameOver) return;
        const interval = setInterval(tick, 200);
        return () => clearInterval(interval);
    }, [started, gameOver, tick]);

    useEffect(() => {
        const handleKey = (e) => {
            const state = stateRef.current;
            switch (e.code) {
                case 'ArrowUp': if (state.dir !== 'DOWN') state.nextDir = 'UP'; e.preventDefault(); break;
                case 'ArrowDown': if (state.dir !== 'UP') state.nextDir = 'DOWN'; e.preventDefault(); break;
                case 'ArrowLeft': if (state.dir !== 'RIGHT') state.nextDir = 'LEFT'; e.preventDefault(); break;
                case 'ArrowRight': if (state.dir !== 'LEFT') state.nextDir = 'RIGHT'; e.preventDefault(); break;
                case 'Space':
                    e.preventDefault();
                    if (!started || gameOver) init();
                    break;
                default: break;
            }
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [started, gameOver, init]);

    return (
        <Box sx={{ textAlign: 'center', userSelect: 'none' }}>
            <canvas
                ref={canvasRef}
                width={GRID * CELL}
                height={GRID * CELL}
                onClick={() => { if (!started || gameOver) init(); }}
                style={{
                    border: '2px solid #16213e',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    maxWidth: '100%',
                }}
            />
            <Typography sx={{ mt: 1, fontWeight: 600, color: '#1a1a2e' }}>
                {!started && !gameOver && 'Нажмите на поле или пробел чтобы начать'}
                {started && !gameOver && `🍎 ${score}`}
                {gameOver && `Игра окончена! Счёт: ${score}`}
            </Typography>
            {gameOver && (
                <Typography sx={{ fontSize: '12px', color: '#6B7280' }}>
                    Нажмите на поле чтобы сыграть ещё
                </Typography>
            )}
        </Box>
    );
}

export default SnakeGame;