import React from 'react';
import { toast, ToastBar, Toaster } from 'react-hot-toast';
import {
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { Box, IconButton, Typography } from '@mui/material';

interface ModernToastProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

// Configuration des toasts modernes
export const toastConfig = {
  duration: 4000,
  position: 'top-right' as const,

  // Styles personnalisés
  style: {
    background: '#ffffff',
    color: '#1f2937',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    fontSize: '14px',
    fontWeight: 500,
    padding: '16px',
    maxWidth: '400px',
  },

  // Styles par type
  success: {
    style: {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      border: 'none',
    },
    icon: <SuccessIcon sx={{ fontSize: 20 }} />,
  },

  error: {
    style: {
      background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      color: 'white',
      border: 'none',
    },
    icon: <ErrorIcon sx={{ fontSize: 20 }} />,
  },

  warning: {
    style: {
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      border: 'none',
    },
    icon: <WarningIcon sx={{ fontSize: 20 }} />,
  },

  info: {
    style: {
      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
      color: 'white',
      border: 'none',
    },
    icon: <InfoIcon sx={{ fontSize: 20 }} />,
  },
};

// Composant Toast moderne personnalisé
export const ModernToast: React.FC<ModernToastProps> = ({ message, type }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <SuccessIcon sx={{ fontSize: 20, color: '#10b981' }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 20, color: '#ef4444' }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 20, color: '#f59e0b' }} />;
      case 'info':
        return <InfoIcon sx={{ fontSize: 20, color: '#3b82f6' }} />;
      default:
        return null;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#f0fdf4';
      case 'error':
        return '#fef2f2';
      case 'warning':
        return '#fffbeb';
      case 'info':
        return '#eff6ff';
      default:
        return '#ffffff';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#10b981';
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      case 'info':
        return '#3b82f6';
      default:
        return '#e5e7eb';
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        borderRadius: 2,
        backgroundColor: getBackgroundColor(),
        border: `1px solid ${getBorderColor()}`,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        minWidth: 300,
        maxWidth: 400,
      }}
    >
      {getIcon()}
      <Typography
        variant="body2"
        sx={{
          flex: 1,
          fontWeight: 500,
          color: '#1f2937',
          lineHeight: 1.4,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

// Fonctions utilitaires pour les toasts
export const showToast = {
  success: (message: string) => toast.success(message, toastConfig.success),
  error: (message: string) => toast.error(message, toastConfig.error),
  warning: (message: string) => toast(message, {
    ...toastConfig.warning,
    icon: <WarningIcon sx={{ fontSize: 20 }} />,
  }),
  info: (message: string) => toast(message, {
    ...toastConfig.info,
    icon: <InfoIcon sx={{ fontSize: 20 }} />,
  }),
  loading: (message: string) => toast.loading(message, {
    style: {
      ...toastConfig.style,
      background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
      color: 'white',
      border: 'none',
    },
  }),
  dismiss: (toastId?: string) => toast.dismiss(toastId),
};

// Toaster personnalisé avec animations modernes
export const ModernToaster: React.FC = () => {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: toastConfig.style,
      }}
    >
      {(t) => (
        <ToastBar toast={t}>
          {({ icon, message }) => (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                width: '100%',
              }}
            >
              {icon}
              <Box sx={{ flex: 1 }}>{message}</Box>
              <IconButton
                size="small"
                onClick={() => toast.dismiss(t.id)}
                sx={{
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    color: 'white',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          )}
        </ToastBar>
      )}
    </Toaster>
  );
};

export default ModernToaster;