import React, { useState, useEffect } from 'react';
import { Trophy, Clock, BookOpen, TrendingUp, Award, Target, Calendar } from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import styles from './TestResults.module.css';

interface TestResult {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_subject: string;
  score: number;
  max_score: number;
  percentage: number;
  correct_answers: number;
  total_questions: number;
  time_spent: number;
  completed_at: string;
  difficulty_level: number;
}

const TestResults: React.FC = () => {
  const { profile } = useProfile();
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'week' | 'month'>('all');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    if (!profile?.id) return;
    
    try {
      setLoading(true);
      // Здесь будет запрос к API для получения результатов
      // const data = await getQuizResults(profile.id);
      // setResults(data);
      
      // Временные данные для демонстрации
      const mockResults: TestResult[] = [
        {
          id: '1',
          quiz_id: 'quiz1',
          quiz_title: 'Основы финансовой грамотности',
          quiz_subject: 'Финансы',
          score: 85,
          max_score: 100,
          percentage: 85,
          correct_answers: 17,
          total_questions: 20,
          time_spent: 1800,
          completed_at: '2024-01-15T10:30:00Z',
          difficulty_level: 2
        },
        {
          id: '2',
          quiz_id: 'quiz2',
          quiz_title: 'Инвестиционные стратегии',
          quiz_subject: 'Финансы',
          score: 72,
          max_score: 100,
          percentage: 72,
          correct_answers: 18,
          total_questions: 25,
          time_spent: 2400,
          completed_at: '2024-01-14T14:20:00Z',
          difficulty_level: 3
        },
        {
          id: '3',
          quiz_id: 'quiz3',
          quiz_title: 'Бюджетирование семьи',
          quiz_subject: 'Финансы',
          score: 95,
          max_score: 100,
          percentage: 95,
          correct_answers: 19,
          total_questions: 20,
          time_spent: 1500,
          completed_at: '2024-01-13T16:45:00Z',
          difficulty_level: 1
        }
      ];
      setResults(mockResults);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter(result => {
    const now = new Date();
    const resultDate = new Date(result.completed_at);
    
    let matchesPeriod = true;
    if (selectedPeriod === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesPeriod = resultDate >= weekAgo;
    } else if (selectedPeriod === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      matchesPeriod = resultDate >= monthAgo;
    }
    
    const matchesSubject = selectedSubject === 'all' || result.quiz_subject === selectedSubject;
    
    return matchesPeriod && matchesSubject;
  });

  const getSubjects = () => {
    const subjects = [...new Set(results.map(result => result.quiz_subject))];
    return subjects;
  };

  const getStats = () => {
    if (filteredResults.length === 0) {
      return {
        totalTests: 0,
        averageScore: 0,
        bestScore: 0,
        totalTime: 0,
        totalPoints: 0
      };
    }

    const totalTests = filteredResults.length;
    const averageScore = Math.round(
      filteredResults.reduce((sum, result) => sum + result.percentage, 0) / totalTests
    );
    const bestScore = Math.max(...filteredResults.map(result => result.percentage));
    const totalTime = filteredResults.reduce((sum, result) => sum + result.time_spent, 0);
    const totalPoints = filteredResults.reduce((sum, result) => sum + result.score, 0);

    return {
      totalTests,
      averageScore,
      bestScore,
      totalTime,
      totalPoints
    };
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 90) return styles.scoreExcellent;
    if (percentage >= 80) return styles.scoreGood;
    if (percentage >= 70) return styles.scoreAverage;
    if (percentage >= 60) return styles.scoreBelowAverage;
    return styles.scorePoor;
  };

  const getScoreEmoji = (percentage: number) => {
    if (percentage >= 90) return '🏆';
    if (percentage >= 80) return '🌟';
    if (percentage >= 70) return '👍';
    if (percentage >= 60) return '😐';
    return '😔';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = getStats();

  if (loading) {
    return <LoadingSpinner text="Загрузка результатов..." />;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Мои результаты</h1>
          <p className={styles.subtitle}>История прохождения тестов и достижения</p>
        </div>
        <div className={styles.awardBadge}>
          <Award size={24} />
          <span>{stats.totalPoints} очков</span>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Target size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.totalTests}</div>
            <div className={styles.statLabel}>Тестов пройдено</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.averageScore}%</div>
            <div className={styles.statLabel}>Средний результат</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Trophy size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{stats.bestScore}%</div>
            <div className={styles.statLabel}>Лучший результат</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Clock size={24} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statValue}>{formatTime(stats.totalTime)}</div>
            <div className={styles.statLabel}>Общее время</div>
          </div>
        </div>
      </div>

      {/* Фильтры */}
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Период:</label>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className={styles.filterSelect}
          >
            <option value="all">Все время</option>
            <option value="week">Последняя неделя</option>
            <option value="month">Последний месяц</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Предмет:</label>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Все предметы</option>
            {getSubjects().map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Список результатов */}
      <div className={styles.resultsContainer}>
        {filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            <Trophy size={48} className={styles.emptyIcon} />
            <h3 className={styles.emptyTitle}>Результаты не найдены</h3>
            <p className={styles.emptyText}>
              {selectedPeriod !== 'all' || selectedSubject !== 'all' 
                ? 'Попробуйте изменить фильтры'
                : 'Пройдите хотя бы один тест, чтобы увидеть результаты'
              }
            </p>
          </div>
        ) : (
          <div className={styles.resultsList}>
            {filteredResults.map((result) => (
              <div key={result.id} className={styles.resultCard}>
                <div className={styles.resultHeader}>
                  <div className={styles.resultInfo}>
                    <h3 className={styles.resultTitle}>{result.quiz_title}</h3>
                    <div className={styles.resultMeta}>
                      <span className={styles.resultSubject}>
                        <BookOpen size={14} />
                        {result.quiz_subject}
                      </span>
                      <span className={styles.resultDate}>
                        <Calendar size={14} />
                        {formatDate(result.completed_at)}
                      </span>
                      <span className={styles.resultTime}>
                        <Clock size={14} />
                        {formatTime(result.time_spent)}
                      </span>
                    </div>
                  </div>
                  <div className={styles.resultScore}>
                    <div className={`${styles.scoreCircle} ${getScoreColor(result.percentage)}`}>
                      <div className={styles.scoreEmoji}>
                        {getScoreEmoji(result.percentage)}
                      </div>
                      <div className={styles.scorePercentage}>
                        {result.percentage}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.resultDetails}>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Правильные ответы:</span>
                    <span className={styles.detailValue}>
                      {result.correct_answers}/{result.total_questions}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Набранные очки:</span>
                    <span className={styles.detailValue}>
                      {result.score}/{result.max_score}
                    </span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Сложность:</span>
                    <span className={`${styles.difficultyBadge} ${
                      result.difficulty_level === 1 ? styles.difficultyEasy :
                      result.difficulty_level === 2 ? styles.difficultyMedium :
                      result.difficulty_level === 3 ? styles.difficultyHard :
                      styles.difficultyExpert
                    }`}>
                      {result.difficulty_level === 1 ? 'Легкий' :
                       result.difficulty_level === 2 ? 'Средний' :
                       result.difficulty_level === 3 ? 'Сложный' : 'Эксперт'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestResults;
