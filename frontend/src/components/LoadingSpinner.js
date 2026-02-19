import React from 'react';
import '../index.css';

/**
 * LoadingSpinner Component
 * 
 * A reusable loading spinner with different sizes and colors
 * 
 * @param {string} size - 'sm', 'md', 'lg' (default: 'md')
 * @param {string} color - 'primary', 'white' (default: 'primary')
 * @param {boolean} fullscreen - Show as fullscreen overlay (default: false)
 * @param {string} className - Additional CSS classes
 */
const LoadingSpinner = ({ 
  size = 'md', 
  color = 'primary', 
  fullscreen = false,
  className = ''
}) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';
  const colorClass = color === 'white' ? 'spinner-white' : '';
  
  const spinnerElement = (
    <div 
      className={`spinner ${sizeClass} ${colorClass} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullscreen) {
    return (
      <div className="fullscreen-loader">
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
};

export default LoadingSpinner;
