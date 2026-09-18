import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box, IconButton, Tooltip, Dialog, DialogContent, Stack, Divider
} from '@mui/material';
import {
    Create as PencilIcon,
    HorizontalRule as LineIcon,
    RectangleOutlined as RectIcon,
    CircleOutlined as CircleIcon,
    TextFields as TextIcon,
    Delete as EraserIcon,
    Undo as UndoIcon,
    Redo as RedoIcon,
    Clear as ClearIcon,
    Close as CloseIcon
} from '@mui/icons-material';

function MiroBoard({ open, onClose, roomName, username }) {
    const canvasRef = useRef(null);
    const [tool, setTool] = useState('pencil');
    const [color, setColor] = useState('#4F46E5');
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPos, setStartPos] = useState(null);
    const [elements, setElements] = useState([]);
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);

    const tools = [
        { id: 'pencil', icon: <PencilIcon />, label: 'Карандаш' },
        { id: 'line', icon: <LineIcon />, label: 'Линия' },
        { id: 'rect', icon: <RectIcon />, label: 'Прямоугольник' },
        { id: 'circle', icon: <CircleIcon />, label: 'Круг' },
        { id: 'text', icon: <TextIcon />, label: 'Текст' },
        { id: 'eraser', icon: <EraserIcon />, label: 'Ластик' },
    ];

    const colors = ['#4F46E5', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#000000', '#FFFFFF'];

    const getMousePos = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    };

    const redraw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Фон
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Сетка (как в Miro)
        ctx.strokeStyle = '#F3F4F6';
        ctx.lineWidth = 0.5;
        for (let x = 0; x < canvas.width; x += 20) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += 20) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
        
        // Элементы
        elements.forEach(el => {
            ctx.strokeStyle = el.color;
            ctx.fillStyle = el.color;
            ctx.lineWidth = el.tool === 'eraser' ? 20 : 3;
            ctx.lineCap = 'round';
            
            if (el.tool === 'pencil' || el.tool === 'eraser') {
                ctx.beginPath();
                ctx.moveTo(el.points[0].x, el.points[0].y);
                el.points.forEach(p => ctx.lineTo(p.x, p.y));
                ctx.stroke();
            } else if (el.tool === 'line') {
                ctx.beginPath();
                ctx.moveTo(el.startX, el.startY);
                ctx.lineTo(el.endX, el.endY);
                ctx.stroke();
            } else if (el.tool === 'rect') {
                ctx.strokeRect(el.startX, el.startY, el.endX - el.startX, el.endY - el.startY);
            } else if (el.tool === 'circle') {
                const rx = Math.abs(el.endX - el.startX) / 2;
                const ry = Math.abs(el.endY - el.startY) / 2;
                const cx = (el.startX + el.endX) / 2;
                const cy = (el.startY + el.endY) / 2;
                ctx.beginPath();
                ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
    }, [elements]);

    useEffect(() => {
        if (open) {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
                redraw();
            }
        }
    }, [open, redraw]);

    const handleMouseDown = (e) => {
        const pos = getMousePos(e);
        setIsDrawing(true);
        setStartPos(pos);
        
        const newElement = {
            id: Date.now(),
            tool: tool,
            color: tool === 'eraser' ? '#FFFFFF' : color,
            points: [pos],
            startX: pos.x,
            startY: pos.y,
            endX: pos.x,
            endY: pos.y
        };
        setElements([...elements, newElement]);
    };

    const handleMouseMove = (e) => {
        if (!isDrawing) return;
        const pos = getMousePos(e);
        const lastElement = elements[elements.length - 1];
        
        if (tool === 'pencil' || tool === 'eraser') {
            lastElement.points.push(pos);
        } else {
            lastElement.endX = pos.x;
            lastElement.endY = pos.y;
        }
        
        setElements([...elements.slice(0, -1), lastElement]);
        redraw();
    };

    const handleMouseUp = () => {
        setIsDrawing(false);
        setUndoStack([...undoStack, elements[elements.length - 1]]);
        setRedoStack([]);
    };

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        const lastElement = undoStack[undoStack.length - 1];
        setElements(elements.filter(el => el.id !== lastElement.id));
        setUndoStack(undoStack.slice(0, -1));
        setRedoStack([...redoStack, lastElement]);
    };

    const handleClear = () => {
        setElements([]);
        setUndoStack([]);
        setRedoStack([]);
        redraw();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 4, height: '85vh' } }}>
            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Панель инструментов */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, borderBottom: '1px solid #E5E7EB', bgcolor: '#F9FAFB' }}>
                    <Stack direction="row" spacing={0.5}>
                        {tools.map(t => (
                            <Tooltip key={t.id} title={t.label}>
                                <IconButton 
                                    onClick={() => setTool(t.id)}
                                    sx={{ 
                                        bgcolor: tool === t.id ? '#EEF2FF' : 'transparent',
                                        color: tool === t.id ? '#4F46E5' : '#64748B',
                                        '&:hover': { bgcolor: '#EEF2FF' },
                                        width: 40, height: 40,
                                    }}
                                >
                                    {t.icon}
                                </IconButton>
                            </Tooltip>
                        ))}
                    </Stack>
                    
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    
                    <Stack direction="row" spacing={0.5}>
                        {colors.map(c => (
                            <Box 
                                key={c}
                                onClick={() => setColor(c)}
                                sx={{ 
                                    width: 28, height: 28, borderRadius: '50%', 
                                    bgcolor: c, cursor: 'pointer',
                                    border: color === c ? '3px solid #4F46E5' : '1px solid #D1D5DB',
                                    transition: 'all 0.15s',
                                }}
                            />
                        ))}
                    </Stack>
                    
                    <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                    
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Отменить">
                            <IconButton onClick={handleUndo} sx={{ color: '#64748B' }}><UndoIcon /></IconButton>
                        </Tooltip>
                        <Tooltip title="Очистить">
                            <IconButton onClick={handleClear} sx={{ color: '#EF4444' }}><ClearIcon /></IconButton>
                        </Tooltip>
                    </Stack>
                    
                    <Box sx={{ flex: 1 }} />
                    
                    <IconButton onClick={onClose} sx={{ color: '#64748B' }}><CloseIcon /></IconButton>
                </Box>
                
                {/* Canvas */}
                <Box sx={{ flex: 1, position: 'relative', bgcolor: '#FFFFFF' }}>
                    <canvas
                        ref={canvasRef}
                        style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />
                </Box>
            </DialogContent>
        </Dialog>
    );
}

export default MiroBoard;