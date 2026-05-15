// ========== frontend/src/styles/shared.js ==========
import { Box, Button, Dialog, Card, Paper } from '@mui/material';
import { styled } from '@mui/material/styles';

// Общие styled-компоненты для всего проекта

export const PageContainer = styled(Box)({
    padding: '24px 32px',
    minHeight: '100vh',
    backgroundColor: '#F3F4F6',
    animation: 'fadeSlideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
    '@keyframes fadeSlideIn': {
        from: {
            opacity: 0,
            transform: 'translateY(12px)',
        },
        to: {
            opacity: 1,
            transform: 'translateY(0)',
        },
    },
});

export const StyledButton = styled(Button)({
    borderRadius: '8px',
    textTransform: 'none',
    fontSize: '14px',
    fontWeight: 500,
});

export const StyledDialog = styled(Dialog)({
    '& .MuiDialog-paper': {
        borderRadius: '16px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.15), 0 8px 16px rgba(0,0,0,0.08)',
    },
});

export const StatCard = styled(Card)({
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
    border: '1px solid #F3F4F6',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.2s ease',
    '&:hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
    },
});

export const EmptyStateContainer = styled(Box)({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '64px 24px',
    textAlign: 'center',
});

export const EmptyStateIcon = styled(Box)({
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#F3F4F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
});

export const ViewToggle = styled(Box)({
    display: 'inline-flex',
    backgroundColor: '#F3F4F6',
    borderRadius: '10px',
    padding: '3px',
});

export const ViewToggleBtn = styled(Button)(({ active }) => ({
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: active ? '#FFFFFF' : 'transparent',
    color: active ? '#1F2937' : '#6B7280',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    textTransform: 'none',
    boxShadow: active ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
    minWidth: 'auto',
    '&:hover': { backgroundColor: active ? '#FFFFFF' : '#F9FAFB' },
}));