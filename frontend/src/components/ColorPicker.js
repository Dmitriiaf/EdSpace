import React from 'react';
import {
    Box, Popover, Button, Typography,
    TextField, InputAdornment
} from '@mui/material';
import { Colorize as ColorizeIcon } from '@mui/icons-material';

// Палитра предустановленных цветов
const PRESET_COLORS = [
    '#3B82F6', // синий
    '#EF4444', // красный
    '#10B981', // зеленый
    '#F59E0B', // оранжевый
    '#8B5CF6', // фиолетовый
    '#EC4899', // розовый
    '#6366F1', // индиго
    '#14B8A6', // бирюзовый
    '#F97316', // ярко-оранжевый
    '#6B7280', // серый
    '#1F2937', // темно-серый
    '#DC2626', // темно-красный
    '#059669', // темно-зеленый
    '#D97706', // золотой
    '#7C3AED', // темно-фиолетовый
    '#DB2777', // темно-розовый
];

function ColorPicker({ value, onChange }) {
    const [anchorEl, setAnchorEl] = React.useState(null);
    const [customColor, setCustomColor] = React.useState(value || '#3B82F6');

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleColorSelect = (color) => {
        onChange(color);
        setCustomColor(color);
        handleClose();
    };

    const handleCustomColorChange = (event) => {
        const newColor = event.target.value;
        setCustomColor(newColor);
        onChange(newColor);
    };

    const open = Boolean(anchorEl);
    const id = open ? 'color-picker-popover' : undefined;

    return (
        <Box>
            <Button
                variant="outlined"
                onClick={handleClick}
                startIcon={
                    <Box
                        sx={{
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            backgroundColor: value || '#3B82F6',
                            border: '1px solid #ddd'
                        }}
                    />
                }
                endIcon={<ColorizeIcon />}
                fullWidth
                sx={{ justifyContent: 'space-between' }}
            >
                Выбрать цвет
            </Button>

            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <Box sx={{ p: 2, width: 300 }}>
                    <Typography variant="subtitle2" gutterBottom>
                        Выберите цвет
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                        {PRESET_COLORS.map((color) => (
                            <Box
                                key={color}
                                onClick={() => handleColorSelect(color)}
                                sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    backgroundColor: color,
                                    cursor: 'pointer',
                                    border: value === color ? '3px solid #000' : '1px solid #ddd',
                                    '&:hover': {
                                        transform: 'scale(1.1)',
                                        transition: 'transform 0.2s'
                                    }
                                }}
                            />
                        ))}
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                        Или введите HEX-код
                    </Typography>
                    
                    <TextField
                        fullWidth
                        size="small"
                        value={customColor}
                        onChange={handleCustomColorChange}
                        placeholder="#3B82F6"
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            backgroundColor: customColor,
                                            border: '1px solid #ddd'
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Box>
            </Popover>
        </Box>
    );
}

export default ColorPicker;