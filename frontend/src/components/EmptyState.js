import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * EmptyState Component
 * 
 * Displays an empty state with icon, message, and optional action
 * 
 * @param {string} icon - Emoji or icon to display
 * @param {string} title - Empty state title
 * @param {string} message - Empty state message
 * @param {string} actionText - Action button text (optional)
 * @param {function} onAction - Action button callback (optional)
 * @param {string} variant - 'default', 'no-data', 'no-results', 'error'
 */
const EmptyState = ({
  icon = '📭',
  title = 'No Data',
  message = 'There is nothing to display here.',
  actionText,
  onAction,
  variant = 'default'
}) => {
  const variantConfig = {
    'default': {
      icon: icon,
      bgColor: '#f9fafb'
    },
    'no-data': {
      icon: '📭',
      bgColor: '#f9fafb'
    },
    'no-results': {
      icon: '🔍',
      bgColor: '#f9fafb'
    },
    'error': {
      icon: '⚠️',
      bgColor: '#fef2f2'
    }
  };

  const config = variantConfig[variant] || variantConfig['default'];
  const displayIcon = icon !== '📭' ? icon : config.icon;

  return (
    <Box
      sx={{
        textAlign: 'center',
        padding: { xs: '48px 24px', md: '64px 24px' },
        background: 'white',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
        margin: { xs: '24px 0', md: '48px 0' },
        animation: 'fadeInUp 0.5s ease-out'
      }}
    >
      <Box
        sx={{
          fontSize: { xs: '64px', md: '80px' },
          marginBottom: '16px',
          opacity: 0.7,
          animation: 'bounce 2s ease-in-out infinite'
        }}
        role="img"
        aria-label={title}
      >
        {displayIcon}
      </Box>

      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: 'text.primary',
          marginBottom: '8px'
        }}
      >
        {title}
      </Typography>

      <Typography
        variant="body1"
        sx={{
          color: 'text.secondary',
          marginBottom: actionText ? '24px' : 0,
          maxWidth: '500px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}
      >
        {message}
      </Typography>

      {actionText && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            padding: '12px 32px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.3s ease'
          }}
        >
          {actionText}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
