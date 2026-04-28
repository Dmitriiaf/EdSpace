import React from 'react';
import { Container, Typography, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const PrivacyPolicy = () => {
    const navigate = useNavigate();

    return (
        <Container maxWidth="md" sx={{ py: 6 }}>
            <Paper sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: '#8B004A' }}>
                    Политика обработки персональных данных
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>1. Общие положения</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Настоящая Политика обработки персональных данных (далее — Политика) разработана в соответствии с Федеральным законом №152-ФЗ «О персональных данных» и определяет порядок обработки персональных данных пользователей платформы EdSpace (ed-space.ru).
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>2. Какие данные мы собираем</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    При регистрации и использовании платформы мы можем собирать следующие персональные данные: имя, фамилию, адрес электронной почты, номер телефона, дату рождения, фотографию профиля (аватар), информацию о проводимых уроках и платежах.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>3. Цели обработки данных</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Персональные данные обрабатываются для: предоставления доступа к функциям платформы (расписание, видеозвонки, финансы); связи с пользователем (уведомления, восстановление пароля); формирования статистики и отчётов; соблюдения требований законодательства РФ.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>4. Передача данных третьим лицам</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Платформа EdSpace не передаёт персональные данные третьим лицам, за исключением случаев, предусмотренных законодательством РФ. Видеозвонки осуществляются через сервис Jitsi Meet (публичный сервер meet.jit.si). Данные чеков и платежей хранятся только на сервере EdSpace.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>5. Хранение и защита данных</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Персональные данные хранятся на сервере в защищённом дата-центре на территории РФ. Применяются организационные и технические меры защиты: шифрование паролей (BCrypt), HTTPS-соединение, межсетевой экран (UFW), ежедневное резервное копирование базы данных.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>6. Права пользователя</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Пользователь имеет право: получать информацию о хранящихся персональных данных; требовать их уточнения или удаления; отозвать согласие на обработку данных. Для этого необходимо направить запрос на электронную почту: noreply@ed-space.ru.
                </Typography>

                <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1 }}>7. Срок действия</Typography>
                <Typography variant="body1" color="textSecondary" paragraph>
                    Согласие на обработку персональных данных действует с момента регистрации пользователя на платформе и до момента удаления аккаунта либо отзыва согласия пользователем.
                </Typography>

                <Typography variant="body2" color="textSecondary" sx={{ mt: 4, textAlign: 'center' }}>
                    Последнее обновление: 27 апреля 2026 года.
                </Typography>
            </Paper>
        </Container>
    );
};

export default PrivacyPolicy;