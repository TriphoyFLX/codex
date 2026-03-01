import React from 'react';
import { Loader2 } from 'lucide-react';
import styles from './LoadingSpinner.module.css';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  className = '',
  text 
}) => {
  const sizeClasses = {
    sm: styles.spinnerSm,
    md: styles.spinnerMd,
    lg: styles.spinnerLg,
    xl: styles.spinnerXl
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <Loader2 className={`${styles.spinner} ${sizeClasses[size]}`} />
      {text && <span className={styles.text}>{text}</span>}
    </div>
  );
};

// Full page loading overlay
export const LoadingOverlay: React.FC<{ text?: string }> = ({ text }) => {
  return (
    <div className={styles.overlay}>
      <div className={styles.overlayContent}>
        <LoadingSpinner size="lg" />
        {text && <p className={styles.overlayText}>{text}</p>}
      </div>
    </div>
  );
};

// Inline loading for buttons
export const ButtonSpinner: React.FC = () => {
  return <Loader2 className={styles.buttonSpinner} />;
};