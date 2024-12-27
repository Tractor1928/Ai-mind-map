import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div style={{
    display: 'inline-block',
    width: '20px',
    height: '20px',
    border: '3px solid rgba(0, 0, 0, 0.1)',
    borderRadius: '50%',
    borderTopColor: '#333',
    animation: 'spin 1s ease-in-out infinite',
  }}>
    <style>
      {`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

export default LoadingSpinner; 