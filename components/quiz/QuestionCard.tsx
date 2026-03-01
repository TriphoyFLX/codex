import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Question } from '../../types/quiz.types';
import { DIFFICULTY_LEVELS } from '../../constants/quiz.constants';
import styles from '../../pages/practice/BusinessGame.module.css';

interface QuestionCardProps {
  question: Question;
  index: number;
  onEdit: (question: Question) => void;
  onDelete: (questionId: string) => void;
  isLoading?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  onEdit,
  onDelete,
  isLoading = false
}) => {
  const getTypeDisplayName = (type: string) => {
    switch (type) {
      case 'multiple_choice': return 'Выбор';
      case 'true_false': return 'Верно/Неверно';
      case 'short_answer': return 'Короткий ответ';
      case 'matching': return 'Сопоставление';
      case 'sequence': return 'Последовательность';
      default: return type;
    }
  };

  const getDifficultyTag = (difficulty: number) => {
    const level = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
    const className = difficulty === 1 ? styles.tagSuccess :
                     difficulty === 2 ? styles.tagWarning :
                     difficulty === 3 ? styles.tagDanger : styles.tagDanger;
    
    return (
      <span className={`${styles.tag} ${className}`}>
        {level?.name || 'Неизвестно'}
      </span>
    );
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div style={{ flex: 1 }}>
          <div className={styles.tagContainer}>
            <span className={styles.fontBold}>#{index + 1}</span>
            <span className={`${styles.tag} ${styles.tagPrimary}`}>
              {getTypeDisplayName(question.type)}
            </span>
            {getDifficultyTag(question.difficulty)}
            <span className={`${styles.tag} ${styles.tagPurple}`}>
              {question.points} очков
            </span>
            {question.category && (
              <span className={`${styles.tag} ${styles.tagGray}`}>
                {question.category}
              </span>
            )}
          </div>
          
          <h5 className={styles.fontMedium} style={{ marginBottom: '0.5rem', marginTop: '0.75rem' }}>
            {question.question_text}
          </h5>
          
          {question.type === 'multiple_choice' && question.options.length > 0 && (
            <div className={styles.emptySubtext}>
              Варианты: {question.options.filter((opt: string) => opt.trim()).join(', ')}
            </div>
          )}
          
          {question.type === 'short_answer' && question.options[0] && (
            <div className={styles.emptySubtext}>
              Правильный ответ: {question.options[0]}
            </div>
          )}
          
          {question.type === 'true_false' && (
            <div className={styles.emptySubtext}>
              Правильный ответ: {question.correct_answer === 0 ? 'Верно' : 'Неверно'}
            </div>
          )}
          
          {question.explanation && (
            <div className={styles.emptySubtext} style={{ marginTop: '0.5rem', fontStyle: 'italic' }}>
              Объяснение: {question.explanation}
            </div>
          )}
          
          {question.tags && question.tags.length > 0 && (
            <div className={styles.tagContainer} style={{ marginTop: '0.75rem' }}>
              {question.tags.map((tag: string, tagIndex: number) => (
                <span key={tagIndex} className={`${styles.tag} ${styles.tagSecondary}`}>
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.flex} style={{ gap: '0.5rem' }}>
          <button
            onClick={() => onEdit(question)}
            disabled={isLoading}
            className={`${styles.button} ${styles.buttonSecondary}`}
            style={{ padding: '0.5rem' }}
            title="Редактировать вопрос"
          >
            <Edit size={18} />
          </button>
          <button
            onClick={() => question.id && onDelete(question.id)}
            disabled={isLoading || !question.id}
            className={`${styles.button} ${styles.buttonDanger}`}
            style={{ padding: '0.5rem' }}
            title="Удалить вопрос"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};