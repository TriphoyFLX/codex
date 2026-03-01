import React, { useState } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from 'lucide-react';
import { Question } from '../../types/quiz.types';
import { QUESTION_TYPES } from '../../constants/quiz.constants';
import styles from './QuizBuilder.module.css';

interface QuizBuilderProps {
  questions: Question[];
  onChange: (questions: Question[]) => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({ questions, onChange }) => {
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const addQuestion = () => {
    console.log('QuizBuilder: Adding question, current questions:', questions.length);
    const newQuestion: Question = {
      id: `q_${Date.now()}`,
      question_text: '',
      type: 'multiple_choice',
      difficulty: 1,
      options: ['', '', '', ''],
      correct_answer: 0,
      points: 10,
      explanation: ''
    };
    const newQuestions = [...questions, newQuestion];
    console.log('QuizBuilder: New questions array:', newQuestions.length);
    onChange(newQuestions);
    setExpandedQuestions(prev => new Set(prev).add(newQuestion.id));
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    console.log(`QuizBuilder: Updating question ${index}, field: ${field}, value:`, value);
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    
    // Если изменился тип вопроса, обновляем опции
    if (field === 'type') {
      if (value === 'true_false') {
        updatedQuestions[index].options = ['Верно', 'Неверно'];
        updatedQuestions[index].correct_answer = 0;
      } else if (value === 'short_answer') {
        updatedQuestions[index].options = [];
        updatedQuestions[index].correct_answer = '';
      } else {
        updatedQuestions[index].options = ['', '', '', ''];
        updatedQuestions[index].correct_answer = 0;
      }
    }
    
    console.log(`QuizBuilder: Updated questions array:`, updatedQuestions.map(q => ({ id: q.id, text: q.question_text.substring(0, 20) + '...' })));
    onChange(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    onChange(updatedQuestions);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex >= 0 && newIndex < questions.length) {
      [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
      onChange(newQuestions);
    }
  };

  const toggleExpanded = (questionId: string) => {
    setExpandedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const renderQuestionEditor = (question: Question, index: number) => {
    const isExpanded = expandedQuestions.has(question.id);
    
    console.log(`QuizBuilder: Rendering question ${index}, expanded: ${isExpanded}, text: "${question.question_text}"`);
    
    return (
      <div key={question.id} className={styles.questionCard}>
        <div className={styles.questionHeader}>
          <div className={styles.questionInfo}>
            <div className={styles.dragHandle}>
              <GripVertical size={16} />
            </div>
            <span className={styles.questionNumber}>Вопрос {index + 1}</span>
            <select
              value={question.type}
              onChange={(e) => updateQuestion(index, 'type', e.target.value)}
              className={styles.questionType}
            >
              {QUESTION_TYPES.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={question.points || 10}
              onChange={(e) => updateQuestion(index, 'points', parseInt(e.target.value) || 10)}
              className={styles.pointsInput}
              min="1"
              max="100"
            />
            <span className={styles.pointsLabel}>баллов</span>
          </div>
          <div className={styles.questionActions}>
            <button
              onClick={() => toggleExpanded(question.id)}
              className={styles.expandButton}
            >
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={() => moveQuestion(index, 'up')}
              disabled={index === 0}
              className={styles.moveButton}
            >
              ↑
            </button>
            <button
              onClick={() => moveQuestion(index, 'down')}
              disabled={index === questions.length - 1}
              className={styles.moveButton}
            >
              ↓
            </button>
            <button
              onClick={() => deleteQuestion(index)}
              className={styles.deleteButton}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className={styles.questionContent}>
            <div className={styles.formGroup}>
              <label>Текст вопроса</label>
              <textarea
                value={question.question_text}
                onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
                placeholder="Введите текст вопроса..."
                className={styles.questionText}
                rows={3}
              />
            </div>

            {question.type === 'multiple_choice' && (
              <div className={styles.optionsContainer}>
                <label>Варианты ответа</label>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className={styles.optionRow}>
                    <input
                      type="radio"
                      name={`correct-${question.id}`}
                      checked={question.correct_answer === optionIndex}
                      onChange={() => updateQuestion(index, 'correct_answer', optionIndex)}
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...question.options];
                        newOptions[optionIndex] = e.target.value;
                        updateQuestion(index, 'options', newOptions);
                      }}
                      placeholder={`Вариант ${optionIndex + 1}`}
                      className={styles.optionInput}
                    />
                    {question.correct_answer === optionIndex && (
                      <span className={styles.correctIndicator}>✓</span>
                    )}
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newOptions = [...question.options, ''];
                    updateQuestion(index, 'options', newOptions);
                  }}
                  className={styles.addOptionButton}
                >
                  + Добавить вариант
                </button>
              </div>
            )}

            {question.type === 'true_false' && (
              <div className={styles.trueFalseContainer}>
                <label>Правильный ответ</label>
                <div className={styles.trueFalseOptions}>
                  <label className={styles.trueFalseOption}>
                    <input
                      type="radio"
                      name={`tf-${question.id}`}
                      checked={question.correct_answer === 0}
                      onChange={() => updateQuestion(index, 'correct_answer', 0)}
                    />
                    Верно
                  </label>
                  <label className={styles.trueFalseOption}>
                    <input
                      type="radio"
                      name={`tf-${question.id}`}
                      checked={question.correct_answer === 1}
                      onChange={() => updateQuestion(index, 'correct_answer', 1)}
                    />
                    Неверно
                  </label>
                </div>
              </div>
            )}

            {question.type === 'short_answer' && (
              <div className={styles.shortAnswerContainer}>
                <label>Правильный ответ</label>
                <input
                  type="text"
                  value={question.correct_answer as string || ''}
                  onChange={(e) => updateQuestion(index, 'correct_answer', e.target.value)}
                  placeholder="Введите правильный ответ..."
                  className={styles.shortAnswerInput}
                />
              </div>
            )}

            <div className={styles.formGroup}>
              <label>Пояснение (необязательно)</label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(index, 'explanation', e.target.value)}
                placeholder="Пояснение к правильному ответу..."
                className={styles.explanationText}
                rows={2}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.quizBuilder}>
      <div className={styles.builderHeader}>
        <h3>Вопросы теста</h3>
        <button onClick={addQuestion} className={styles.addQuestionButton}>
          <Plus size={16} />
          Добавить вопрос
        </button>
      </div>

      {questions.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Пока нет вопросов. Нажмите "Добавить вопрос" чтобы начать.</p>
        </div>
      ) : (
        <div className={styles.questionsList}>
          {questions.map((question, index) => renderQuestionEditor(question, index))}
        </div>
      )}

      <div className={styles.builderFooter}>
        <div className={styles.summary}>
          <span>Всего вопросов: {questions.length}</span>
          <span>Сумма баллов: {questions.reduce((sum, q) => sum + (q.points || 10), 0)}</span>
        </div>
      </div>
    </div>
  );
};
