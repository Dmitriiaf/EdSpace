import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { keyframes } from '@mui/material/styles';
import { Home as HomeIcon } from '@mui/icons-material';

const float = keyframes`
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
`;

const glow = keyframes`
    0%, 100% { boxShadow: '0 0 20px rgba(79,70,229,0.3)'; }
    50% { boxShadow: '0 0 40px rgba(79,70,229,0.6)'; }
`;

function NotFoundPage({ code = '404', title = 'Страница не найдена', description = 'Вы перешли по ссылке, которой не существует. Возможно, страница была удалена или адрес набран с ошибкой.' }) {
    const navigate = useNavigate();

    const emoji = { '404': '🔍', '403': '🔒', '500': '🧑‍💻', '400': '📝' };
    const suggestions = {
        '404': ['Проверьте правильность адреса', 'Вернитесь на главную страницу', 'Свяжитесь с репетитором для уточнения'],
        '403': ['У вас нет доступа к этой странице', 'Войдите в свой аккаунт', 'Свяжитесь с репетитором для получения доступа'],
        '500': ['Произошла ошибка на сервере', 'Попробуйте обновить страницу', 'Мы уже работаем над исправлением'],
        '400': ['Некорректный запрос', 'Проверьте введённые данные', 'Попробуйте ещё раз'],
    };

    return (
        <Box sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: '#0F0F1A',
            p: 3,
        }}>
            <Box sx={{ textAlign: 'center', maxWidth: 500 }}>
                {/* Анимированная иконка */}
                <Box sx={{
                    fontSize: 80,
                    animation: `${float} 3s ease-in-out infinite`,
                    mb: 3,
                }}>
                    {emoji[code] || '❓'}
                </Box>

                {/* Код ошибки */}
                <Typography sx={{
                    fontSize: 100,
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: 1,
                    mb: 2,
                    animation: `${glow} 3s ease-in-out infinite`,
                    WebkitTextStroke: '2px rgba(79,70,229,0.3)',
                }}>
                    {code}
                </Typography>

                {/* Заголовок */}
                <Typography sx={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: '#FFFFFF',
                    mb: 1.5,
                }}>
                    {title}
                </Typography>

                {/* Описание */}
                <Typography sx={{
                    fontSize: '1rem',
                    color: '#8892B0',
                    lineHeight: 1.7,
                    mb: 3,
                }}>
                    {description}
                </Typography>

                {/* Рекомендации */}
                <Box sx={{
                    bgcolor: 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    p: 2.5,
                    mb: 3,
                    border: '1px solid rgba(255,255,255,0.06)',
                    textAlign: 'left',
                }}>
                    <Typography sx={{ color: '#A78BFA', fontSize: '0.85rem', fontWeight: 600, mb: 1.5 }}>
                        💡 Что можно сделать:
                    </Typography>
                    {(suggestions[code] || suggestions['404']).map((s, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                            <Typography sx={{ color: '#4F46E5', fontWeight: 700, fontSize: '0.85rem' }}>{i + 1}.</Typography>
                            <Typography sx={{ color: '#CBD5E1', fontSize: '0.9rem' }}>{s}</Typography>
                        </Box>
                    ))}
                </Box>

                {/* Кнопки */}
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                        variant="contained"
                        startIcon={<HomeIcon />}
                        onClick={() => navigate('/')}
                        sx={{
                            bgcolor: '#4F46E5',
                            borderRadius: '50px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#4338CA' },
                        }}
                    >
                        На главную
                    </Button>
                    <Button
                        variant="outlined"
                        onClick={() => window.history.back()}
                        sx={{
                            color: '#8892B0',
                            borderColor: 'rgba(255,255,255,0.15)',
                            borderRadius: '50px',
                            px: 4,
                            py: 1.5,
                            textTransform: 'none',
                            fontWeight: 500,
                            '&:hover': { borderColor: 'rgba(255,255,255,0.3)', color: '#fff' },
                        }}
                    >
                        Назад
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}

export default NotFoundPage;