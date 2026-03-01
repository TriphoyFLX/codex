// PracticePage.tsx - пример структуры
import React from 'react';
import styles from './PracticePage.module.css';

const PracticePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => window.history.back()}>
          ← Назад к выбору
        </button>
        <h1>Practice Mode</h1>
      </header>
      
      <div className={styles.content}>
        <div className={styles.section}>
          <h2>Vocabulary Practice</h2>
          {/* Компоненты для практики */}
        </div>
        
        <div className={styles.section}>
          <h2>Grammar Exercises</h2>
          {/* Упражнения по грамматике */}
        </div>
        
        <div className={styles.section}>
          <h2>Listening Practice</h2>
          {/* Аудио упражнения */}
        </div>
      </div>
    </div>
  );
};

export default PracticePage;