import React from 'react';
import { Box, Typography, Button } from '@mui/material';

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors in child components and displays a fallback UI
 * 
 * Usage:
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            padding: '24px'
          }}
        >
          <Box
            sx={{
              maxWidth: '600px',
              width: '100%',
              background: 'white',
              borderRadius: '24px',
              padding: { xs: '32px 24px', md: '48px 40px' },
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              textAlign: 'center',
              animation: 'scaleIn 0.3s ease-out'
            }}
          >
            {/* Error Icon */}
            <Box
              sx={{
                fontSize: '80px',
                marginBottom: '24px',
                animation: 'shake 0.5s ease-in-out'
              }}
              role="img"
              aria-label="Error"
            >
              ⚠️
            </Box>

            {/* Error Title */}
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: 'error.main',
                marginBottom: '12px'
              }}
            >
              Oops! Something went wrong
            </Typography>

            {/* Error Message */}
            <Typography
              variant="body1"
              sx={{
                color: 'text.secondary',
                marginBottom: '32px',
                lineHeight: 1.7
              }}
            >
              We encountered an unexpected error. Don't worry, your data is safe. 
              Please try reloading the page or contact support if the problem persists.
            </Typography>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: 'error.main',
                    marginBottom: '8px'
                  }}
                >
                  <strong>Error:</strong> {this.state.error.toString()}
                </Typography>
                {this.state.errorInfo && (
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'text.secondary',
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {this.state.errorInfo.componentStack}
                  </Typography>
                )}
              </Box>
            )}

            {/* Action Buttons */}
            <Box
              sx={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap'
              }}
            >
              <Button
                variant="outlined"
                onClick={this.handleReset}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  padding: '12px 32px',
                  borderRadius: '12px',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                  '&:hover': {
                    borderColor: 'primary.dark',
                    background: 'rgba(59, 130, 246, 0.05)'
                  }
                }}
              >
                Try Again
              </Button>

              <Button
                variant="contained"
                onClick={this.handleReload}
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
                Reload Page
              </Button>
            </Box>

            {/* Support Link */}
            <Typography
              variant="body2"
              sx={{
                color: 'text.tertiary',
                marginTop: '24px',
                fontSize: '13px'
              }}
            >
              Need help? <a href="mailto:support@example.com" style={{ color: '#3b82f6', textDecoration: 'none' }}>Contact Support</a>
            </Typography>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
