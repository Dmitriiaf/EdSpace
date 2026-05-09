import React, { useRef, useEffect, useState } from 'react';
import { Box, IconButton, Tooltip, Slider } from '@mui/material';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axiosInstance from '../api/axiosConfig';
import {
    Brush as BrushIcon,
    Delete as EraserIcon
} from '@mui/icons-material';

function WhiteBoard({ roomName, username, boardId }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen');
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);
    const [ctx, setCtx] = useState(null);
    const [lastX, setLastX] = useState(0);
    const [lastY, setLastY] = useState(0);
    const [stompClient, setStompClient] = useState(null);

    // Инициализация canvas и WebSocket
    useEffect(() => {
        const canvas = canvasRef.current;
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        setCtx(context);

        // Подключаем WebSocket через SockJS
        const client = new Client({
            webSocketFactory: () => new SockJS('/ws-board'),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log('WebSocket подключён к комнате:', roomName);
                client.subscribe(`/topic/board/${roomName}`, (message) => {
                    const data = JSON.parse(message.body);
                    if (data.username !== username) {
                        drawRemote(data);
                    }
                });
            },
            onStompError: (frame) => console.error('WebSocket ошибка:', frame)
        });
        client.activate();
        setStompClient(client);

        return () => client.deactivate();
    }, [roomName]);

    // Загрузка сохранённого canvas
    useEffect(() => {
        if (!boardId) return;
        axiosInstance.get(`/boards/${boardId}/canvas`)
            .then(res => {
                if (res.data?.image && ctx) {
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0);
                    img.src = res.data.image;
                }
            })
            .catch(() => {});
    }, [boardId, ctx]);

    // Автосохранение canvas в БД каждые 3 секунды
    useEffect(() => {
        if (!boardId) return;
        const interval = setInterval(async () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dataUrl = canvas.toDataURL('image/png');
            try {
                await axiosInstance.put(`/boards/${boardId}/save-canvas`, { image: dataUrl });
            } catch (err) {
                // Тихо игнорируем ошибки сохранения
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [boardId]);

    const drawRemote = (data) => {
        if (!ctx) return;
        if (data.tool === 'clear') {
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            return;
        }
        ctx.beginPath();
        ctx.moveTo(data.x1, data.y1);
        ctx.lineTo(data.x2, data.y2);
        ctx.strokeStyle = data.color;
        ctx.lineWidth = data.width;
        ctx.stroke();
    };

    const sendDraw = (x1, y1, x2, y2) => {
        if (stompClient?.connected) {
            stompClient.publish({
                destination: `/app/board/${roomName}`,
                body: JSON.stringify({
                    tool,
                    x1, y1, x2, y2,
                    color: tool === 'eraser' ? '#FFFFFF' : color,
                    width: tool === 'eraser' ? 20 : lineWidth,
                    username
                })
            });
        }
    };

    const startDrawing = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setIsDrawing(true);
        setLastX(x);
        setLastY(y);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#FFFFFF' : color;
        ctx.lineWidth = tool === 'eraser' ? 20 : lineWidth;
    };

    const draw = (e) => {
        if (!isDrawing || !ctx) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        ctx.lineTo(x, y);
        ctx.stroke();
        sendDraw(lastX, lastY, x, y);
        setLastX(x);
        setLastY(y);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        ctx?.closePath();
    };

    const clearCanvas = () => {
        ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        if (stompClient?.connected) {
            stompClient.publish({
                destination: `/app/board/${roomName}`,
                body: JSON.stringify({ tool: 'clear', username })
            });
        }
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#fff', borderRadius: 1, overflow: 'hidden' }}>
            {/* Панель инструментов */}
            <Box sx={{ display: 'flex', gap: 1, p: 1, bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0', alignItems: 'center', flexWrap: 'wrap' }}>
                <Tooltip title="Кисть">
                    <IconButton onClick={() => setTool('pen')} color={tool === 'pen' ? 'primary' : 'default'}>
                        <BrushIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Ластик">
                    <IconButton onClick={() => setTool('eraser')} color={tool === 'eraser' ? 'primary' : 'default'}>
                        <EraserIcon />
                    </IconButton>
                </Tooltip>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    style={{ width: 32, height: 32, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                />
                <Box sx={{ width: 80, display: 'flex', alignItems: 'center' }}>
                    <Slider value={lineWidth} min={1} max={20} onChange={(e, v) => setLineWidth(v)} size="small" />
                </Box>
                <Tooltip title="Очистить всё">
                    <IconButton onClick={clearCanvas} color="error">
                        <EraserIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Холст */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseOut={stopDrawing}
                style={{ flex: 1, cursor: 'crosshair', background: '#fff', width: '100%', height: '100%' }}
            />
        </Box>
    );
}

export default WhiteBoard;