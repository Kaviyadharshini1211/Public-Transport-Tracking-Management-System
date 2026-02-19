import React from 'react';
import { Box } from '@mui/material';
import '../index.css';

/**
 * SkeletonLoader Component
 * 
 * Displays skeleton loading placeholders
 * 
 * @param {string} variant - 'text', 'title', 'card', 'circle', 'custom'
 * @param {number} width - Custom width (for custom variant)
 * @param {number} height - Custom height (for custom variant)
 * @param {number} count - Number of skeleton elements (default: 1)
 * @param {string} className - Additional CSS classes
 */
const SkeletonLoader = ({ 
  variant = 'text', 
  width, 
  height, 
  count = 1,
  className = ''
}) => {
  const getSkeletonClass = () => {
    switch (variant) {
      case 'text':
        return 'skeleton skeleton-text';
      case 'title':
        return 'skeleton skeleton-title';
      case 'card':
        return 'skeleton skeleton-card';
      case 'circle':
        return 'skeleton skeleton-circle';
      case 'custom':
        return 'skeleton';
      default:
        return 'skeleton skeleton-text';
    }
  };

  const getStyle = () => {
    if (variant === 'custom') {
      return {
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : '20px'
      };
    }
    return {};
  };

  const skeletons = Array.from({ length: count }, (_, index) => (
    <div 
      key={index}
      className={`${getSkeletonClass()} ${className}`}
      style={getStyle()}
      aria-hidden="true"
    />
  ));

  return <>{skeletons}</>;
};

/**
 * CardSkeleton Component
 * 
 * Pre-built skeleton for card layouts
 */
export const CardSkeleton = ({ count = 1 }) => {
  const cards = Array.from({ length: count }, (_, index) => (
    <Box
      key={index}
      sx={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        marginBottom: '16px'
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
        <SkeletonLoader variant="circle" />
        <Box sx={{ marginLeft: '12px', flex: 1 }}>
          <SkeletonLoader variant="text" width={150} />
          <SkeletonLoader variant="text" width={100} />
        </Box>
      </Box>
      <SkeletonLoader variant="text" count={3} />
    </Box>
  ));

  return <>{cards}</>;
};

/**
 * TableSkeleton Component
 * 
 * Pre-built skeleton for table layouts
 */
export const TableSkeleton = ({ rows = 5, columns = 4 }) => {
  return (
    <Box
      sx={{
        background: 'white',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', gap: '16px', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
        {Array.from({ length: columns }, (_, index) => (
          <Box key={index} sx={{ flex: 1 }}>
            <SkeletonLoader variant="text" width={80} />
          </Box>
        ))}
      </Box>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', gap: '16px', marginBottom: '12px' }}>
          {Array.from({ length: columns }, (_, colIndex) => (
            <Box key={colIndex} sx={{ flex: 1 }}>
              <SkeletonLoader variant="text" />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
};

/**
 * ListSkeleton Component
 * 
 * Pre-built skeleton for list layouts
 */
export const ListSkeleton = ({ count = 5 }) => {
  const items = Array.from({ length: count }, (_, index) => (
    <Box
      key={index}
      sx={{
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        background: 'white',
        borderRadius: '12px',
        marginBottom: '12px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}
    >
      <SkeletonLoader variant="circle" />
      <Box sx={{ marginLeft: '16px', flex: 1 }}>
        <SkeletonLoader variant="text" width={200} />
        <SkeletonLoader variant="text" width={150} />
      </Box>
    </Box>
  ));

  return <>{items}</>;
};

export default SkeletonLoader;
