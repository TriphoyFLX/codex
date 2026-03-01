import React, { useState } from 'react';
import styles from './PracticePage.module.css';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleGameClick = () => {
    navigate('/business-game');
  };

  const handlePracticeClick = () => {
    navigate('/practice');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>
            Выберите <span className={styles.titleHighlight}>режим</span> обучения
          </h1>
          <p className={styles.subtitle}>
            Два уникальных подхода к изучению языков — игровой и практический
          </p>
        </div>
      </div>
      
      <div className={styles.modesContainer}>
        <div 
          className={`${styles.modeCard} ${hoveredCard === 'game' ? styles.cardHovered : ''}`}
          onClick={handleGameClick}
          onMouseEnter={() => setHoveredCard('game')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={`${styles.modeIcon} ${styles.gameIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 16V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V16C3 17.1046 3.89543 18 5 18H19C20.1046 18 21 17.1046 21 16Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M9 10C9.55228 10 10 9.55228 10 9C10 8.44772 9.55228 8 9 8C8.44772 8 8 8.44772 8 9C8 9.55228 8.44772 10 9 10Z" fill="currentColor"/>
                  <path d="M15 10C15.5523 10 16 9.55228 16 9C16 8.44772 15.5523 8 15 8C14.4477 8 14 8.44772 14 9C14 9.55228 14.4477 10 15 10Z" fill="currentColor"/>
                  <path d="M7.5 14L8.5 12.5L10.5 14L12 12L14 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className={styles.modeTitleWrapper}>
                <h2 className={styles.modeTitle}>Business Game</h2>
                <span className={styles.modeSubtitle}>Игровая симуляция</span>
              </div>
            </div>
            
            <p className={styles.modeDescription}>
              Изучайте язык через симуляцию бизнеса. Управляйте компанией, 
              заключайте сделки и развивайтесь в динамичной экономической среде.
            </p>
            
            <div className={styles.modeFeatures}>
              <div className={styles.feature}>
                <div className={styles.featureIconWrapper}>
                  <span className={styles.featureIcon}>🏝️</span>
                </div>
                <span className={styles.featureText}>4 уникальных острова</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIconWrapper}>
                  <span className={styles.featureIcon}>📈</span>
                </div>
                <span className={styles.featureText}>Инвестиции и работа</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIconWrapper}>
                  <span className={styles.featureIcon}>⭐</span>
                </div>
                <span className={styles.featureText}>Система престижа</span>
              </div>
            </div>
          </div>
          
          <div className={styles.cardFooter}>
            <button className={styles.startButton}>
              <span className={styles.buttonText}>Начать игру</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.buttonIcon}>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        
        <div 
          className={`${styles.modeCard} ${hoveredCard === 'practice' ? styles.cardHovered : ''}`}
          onClick={handlePracticeClick}
          onMouseEnter={() => setHoveredCard('practice')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className={styles.cardContent}>
            <div className={styles.cardHeader}>
              <div className={`${styles.modeIcon} ${styles.practiceIcon}`}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 6V4M12 6V8M12 6H10M12 6H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M20 14C20 15.1046 19.1046 16 18 16H6C4.89543 16 4 15.1046 4 14V10C4 8.89543 4.89543 8 6 8H18C19.1046 8 20 8.89543 20 10V14Z" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 20H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className={styles.modeTitleWrapper}>
                <h2 className={styles.modeTitle}>Practice</h2>
                <span className={styles.modeSubtitle}>Учебные упражнения</span>
              </div>
            </div>
            
            <p className={styles.modeDescription}>
              Практикуйте изученный материал с помощью структурированных упражнений, 
              тестов и заданий для закрепления знаний.
            </p>
            
            <div className={styles.modeFeatures}>
              <div className={styles.feature}>
                <div className={styles.featureIconWrapper}>
                  <span className={styles.featureIcon}>📝</span>
                </div>
                <span className={styles.featureText}>Интерактивные упражнения</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIconWrapper}>
                  <span className={styles.featureIcon}>🎯</span>
                </div>
                <span className={styles.featureText}>Тесты и викторины</span>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIconWrapper}>
                  <span className={styles.featureIcon}>📊</span>
                </div>
                <span className={styles.featureText}>Отслеживание прогресса</span>
              </div>
            </div>
          </div>
          
          <div className={styles.cardFooter}>
            <button className={styles.startButton}>
              <span className={styles.buttonText}>Начать практику</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.buttonIcon}>
                <path d="M5 12H19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <div className={styles.footer}>
        <div className={styles.footerContent}>
          <p className={styles.footerText}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.footerIcon}>
              <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 8V12" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 16H12.01" stroke="#8E8E93" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Вы можете переключаться между режимами в любое время
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;