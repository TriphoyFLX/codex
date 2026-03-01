import React from 'react';
import styles from './Avatar.module.css';

interface AvatarProps {
  src?: string;
  alt?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ 
  src, 
  alt, 
  firstName = '', 
  lastName = '', 
  username = '', 
  size = 'medium',
  className = '' 
}) => {
  // Получаем инициалы
  const getInitials = () => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (firstName) {
      return firstName.charAt(0).toUpperCase();
    }
    if (username) {
      return username.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Генерируем цвет на основе имени пользователя
  const getAvatarColor = () => {
    const str = firstName || lastName || username || 'default';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E76F51', '#6C5CE7', '#A29BFE'
    ];
    
    return colors[Math.abs(hash) % colors.length];
  };

  const initials = getInitials();
  const backgroundColor = getAvatarColor();

  return (
    <div 
      className={`${styles.avatar} ${styles[size]} ${className}`}
      style={{ backgroundColor }}
      title={alt || `${firstName} ${lastName}`.trim() || username}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt} 
          onError={(e) => {
            // Если изображение не загрузилось, показываем инициалы
            e.currentTarget.style.display = 'none';
            e.currentTarget.parentElement!.style.display = 'flex';
          }}
        />
      ) : null}
      <span className={styles.initials}>{initials}</span>
    </div>
  );
};

export default Avatar;
