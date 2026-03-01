import React, { useEffect } from 'react';

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  announceOnMount?: string;
  role?: string;
  ariaLabel?: string;
  ariaLive?: 'polite' | 'assertive' | 'off';
}

export const AccessibilityWrapper: React.FC<AccessibilityWrapperProps> = ({
  children,
  announceOnMount,
  role,
  ariaLabel,
  ariaLive = 'polite'
}) => {
  // Объявление изменений для screen readers
  useEffect(() => {
    if (announceOnMount) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', ariaLive);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = announceOnMount;
      
      document.body.appendChild(announcement);
      
      // Удаляем через короткое время
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, [announceOnMount, ariaLive]);

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-live={ariaLive}
    >
      {children}
    </div>
  );
};

// Hook для управления фокусом
export const useFocusManagement = () => {
  const focusFirstInteractiveElement = (container?: HTMLElement) => {
    const focusableElements = (container || document).querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    if (firstElement) {
      firstElement.focus();
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  return { focusFirstInteractiveElement, trapFocus };
};

// Hook для клавиатурной навигации
export const useKeyboardNavigation = () => {
  const handleEscapeKey = (callback: () => void) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  };

  const handleArrowNavigation = (
    container: HTMLElement,
    itemSelector: string,
    currentIndex: number,
    onIndexChange: (index: number) => void
  ) => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const items = container.querySelectorAll(itemSelector);
      const maxIndex = items.length - 1;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          onIndexChange(currentIndex < maxIndex ? currentIndex + 1 : 0);
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          onIndexChange(currentIndex > 0 ? currentIndex - 1 : maxIndex);
          break;
        case 'Home':
          e.preventDefault();
          onIndexChange(0);
          break;
        case 'End':
          e.preventDefault();
          onIndexChange(maxIndex);
          break;
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  };

  return { handleEscapeKey, handleArrowNavigation };
};