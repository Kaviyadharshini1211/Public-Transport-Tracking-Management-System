import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import LoadingSpinner from './LoadingSpinner';

/**
 * ConfirmDialog Component
 * 
 * Reusable confirmation dialog for critical actions
 * 
 * @param {boolean} open - Dialog open state
 * @param {string} title - Dialog title
 * @param {string} message - Dialog message
 * @param {string} confirmText - Confirm button text (default: 'Confirm')
 * @param {string} cancelText - Cancel button text (default: 'Cancel')
 * @param {string} variant - 'default', 'danger' (default: 'default')
 * @param {function} onConfirm - Callback when confirmed
 * @param {function} onCancel - Callback when cancelled
 * @param {boolean} loading - Show loading state (default: false)
 */
const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
  loading = false
}) => {
  const handleConfirm = () => {
    if (onConfirm) onConfirm();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleConfirm();
    } else if (e.key === 'Escape' && !loading) {
      handleCancel();
    }
  };

  const confirmButtonColor = variant === 'danger' ? 'error' : 'primary';

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : handleCancel}
      onKeyDown={handleKeyDown}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '1.5rem',
          color: variant === 'danger' ? 'error.main' : 'text.primary',
          paddingBottom: '8px'
        }}
      >
        {title}
      </DialogTitle>
      
      <DialogContent>
        <Typography 
          variant="body1" 
          sx={{ 
            color: 'text.secondary',
            lineHeight: 1.7
          }}
        >
          {message}
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ padding: '16px 24px', gap: '12px' }}>
        <Button
          onClick={handleCancel}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'grey.100'
            }
          }}
        >
          {cancelText}
        </Button>
        
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={confirmButtonColor}
          disabled={loading}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            minWidth: '100px',
            boxShadow: variant === 'danger' 
              ? '0 4px 12px rgba(239, 68, 68, 0.3)'
              : '0 4px 12px rgba(59, 130, 246, 0.3)',
            '&:hover': {
              boxShadow: variant === 'danger'
                ? '0 6px 16px rgba(239, 68, 68, 0.4)'
                : '0 6px 16px rgba(59, 130, 246, 0.4)',
            }
          }}
        >
          {loading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            confirmText
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * useConfirmDialog Hook
 * 
 * Hook for managing confirmation dialogs
 * 
 * Usage:
 * const { showConfirm, ConfirmDialogComponent } = useConfirmDialog();
 * 
 * const handleDelete = async () => {
 *   const confirmed = await showConfirm({
 *     title: 'Delete Item',
 *     message: 'Are you sure you want to delete this item?',
 *     variant: 'danger'
 *   });
 *   if (confirmed) {
 *     // Perform delete
 *   }
 * };
 */
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
    loading: false,
    resolve: null
  });

  const showConfirm = (options) => {
    return new Promise((resolve) => {
      setDialogState({
        open: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || 'default',
        loading: false,
        resolve
      });
    });
  };

  const handleConfirm = () => {
    if (dialogState.resolve) {
      dialogState.resolve(true);
    }
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const handleCancel = () => {
    if (dialogState.resolve) {
      dialogState.resolve(false);
    }
    setDialogState((prev) => ({ ...prev, open: false }));
  };

  const ConfirmDialogComponent = () => (
    <ConfirmDialog
      open={dialogState.open}
      title={dialogState.title}
      message={dialogState.message}
      confirmText={dialogState.confirmText}
      cancelText={dialogState.cancelText}
      variant={dialogState.variant}
      loading={dialogState.loading}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { showConfirm, ConfirmDialogComponent };
};

export default ConfirmDialog;
