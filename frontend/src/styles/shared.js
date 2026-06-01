// ========== frontend/src/styles/shared.js ==========
import { Box, Button, Dialog, Card, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// ========== ГЛОБАЛЬНЫЕ ТОКЕНЫ ==========
const BORDER_RADIUS_LG = '16px';
const BORDER_RADIUS_XL = '20px';
const SHADOW_SOFT = '0 2px 8px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)';
const SHADOW_HOVER = '0 8px 24px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.04)';
const TRANSITION_SMOOTH = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
const BG_WARM = '#F8FAFC';
const BG_WHITE = '#FFFFFF';
const BORDER_COLOR = '#E8ECF0';

export const PageContainer = styled(Box)({
    padding: '28px 36px',
    maxWidth: '1440px',
    margin: '0 auto',
    minHeight: '100vh',
    backgroundColor: BG_WARM,
    animation: 'fadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    '@media (max-width: 768px)': {
        padding: '16px 12px',
    },
    '@keyframes fadeSlideIn': {
        from: {
            opacity: 0,
            transform: 'translateY(16px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
});

export const StyledButton = styled(Button)({
    borderRadius: '12px',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 600,
    padding: '10px 20px',
    transition: TRANSITION_SMOOTH,
    '&:hover': {
        transform: 'translateY(-1px)',
    },
});

export const StyledDialog = styled(Dialog)({
    '& .MuiDialog-paper': {
        borderRadius: BORDER_RADIUS_XL,
        boxShadow: '0 25px 50px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.06)',
    },
});

export const StatCard = styled(Card)({
    borderRadius: BORDER_RADIUS_LG,
    boxShadow: SHADOW_SOFT,
    border: `1px solid ${BORDER_COLOR}`,
    backgroundColor: BG_WHITE,
    transition: TRANSITION_SMOOTH,
    '&:hover': {
        boxShadow: SHADOW_HOVER,
        transform: 'translateY(-3px)',
    },
});

export const EmptyStateContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 32px',
    textAlign: 'center',
});

export const EmptyStateIcon = styled(Box)({
    width: '88px',
    height: '88px',
    borderRadius: '50%',
    backgroundColor: '#F1F5F9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
});

export const ViewToggle = styled(Box)({
    display: 'inline-flex',
    backgroundColor: '#F1F5F9',
    borderRadius: '14px',
    padding: '4px',
});

export const ViewToggleBtn = styled(Button)(({ active }) => ({
    padding: '10px 18px',
    borderRadius: '12px',
    border: 'none',
    backgroundColor: active ? BG_WHITE : 'transparent',
    color: active ? '#1F2937' : '#64748B',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    textTransform: 'none',
    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.06)' : 'none',
    minWidth: 'auto',
    transition: TRANSITION_SMOOTH,
    '&:hover': { 
        backgroundColor: active ? BG_WHITE : '#F8FAFC',
    },
}));