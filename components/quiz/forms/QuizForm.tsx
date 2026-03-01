import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save } from 'lucide-react';
import { quizFormSchema, QuizFormSchema } from '../../../schemas/quiz.schemas';
import { DIFFICULTY_LEVELS, QUIZ_SUBJECTS } from '../../../constants/quiz.constants';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { QuizBuilder } from '../QuizBuilder';
import { Question } from '../../../types/quiz.types';
import styles from '../../../pages/practice/BusinessGame.module.css';

interface QuizFormProps {
  initialData?: Partial<QuizFormSchema>;
  initialQuestions?: Question[];
  onSubmit: (data: QuizFormSchema, questions: Question[]) => Promise<boolean>;
  onSaveAndClose?: (data: QuizFormSchema, questions: Question[]) => Promise<boolean>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export const QuizForm: React.FC<QuizFormProps> = ({
  initialData,
  initialQuestions = [],
  onSubmit,
  onSaveAndClose,
  onCancel,
  isEditing = false,
  isLoading = false
}) => {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  
  // Отладка
  useEffect(() => {
    console.log('QuizForm: Questions updated:', questions.length);
  }, [questions]);
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<QuizFormSchema>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      subject: initialData?.subject || 'Финансы',
      difficulty_level: initialData?.difficulty_level || 1,
      time_limit: initialData?.time_limit || 30
    }
  });

  const onFormSubmit = async (data: QuizFormSchema) => {
    const success = await onSubmit(data, questions);
    if (success) {
      reset();
    }
  };

  const onFormSubmitAndClose = async (data: QuizFormSchema) => {
    if (onSaveAndClose) {
      const success = await onSaveAndClose(data, questions);
      if (success) {
        reset();
      }
    } else {
      // Если onSaveAndClose не передан, просто вызываем onSubmit и закрываем
      await onFormSubmit(data);
      onCancel();
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  return (
    <div className={styles.card}>
      <div className={styles.modalHeader}>
        <h3 className={styles.modalTitle}>
          {isEditing ? 'Редактирование теста' : 'Новый тест'}
        </h3>
        <button
          onClick={handleCancel}
          className={`${styles.modalCloseButton} ${styles.buttonSecondary}`}
          disabled={isSubmitting}
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className={styles.flexCol} style={{ gap: '1.5rem' }}>
          {/* Основная информация о тесте */}
          <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Название теста *
              </label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="text"
                    className={`${styles.inputField} ${errors.title ? styles.inputError : ''}`}
                    placeholder="Введите название теста..."
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.title && (
                <span className={styles.errorMessage}>
                  {errors.title.message}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Предмет *
              </label>
              <Controller
                name="subject"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`${styles.selectField} ${errors.subject ? styles.inputError : ''}`}
                    disabled={isSubmitting}
                  >
                    {QUIZ_SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>
                        {subject}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.subject && (
                <span className={styles.errorMessage}>
                  {errors.subject.message}
                </span>
              )}
            </div>
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.inputLabel}>
              Описание теста *
            </label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <textarea
                  {...field}
                  className={`${styles.textareaField} ${errors.description ? styles.inputError : ''}`}
                  rows={3}
                  placeholder="Опишите, чему посвящен тест..."
                  disabled={isSubmitting}
                />
              )}
            />
            {errors.description && (
              <span className={styles.errorMessage}>
                {errors.description.message}
              </span>
            )}
          </div>

          <div className={`${styles.grid} ${styles.gridCols2}`} style={{ gap: '1.5rem' }}>
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Сложность теста *
              </label>
              <Controller
                name="difficulty_level"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value))}
                    className={`${styles.selectField} ${errors.difficulty_level ? styles.inputError : ''}`}
                    disabled={isSubmitting}
                  >
                    {DIFFICULTY_LEVELS.map(level => (
                      <option key={level.id} value={level.id}>
                        {level.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.difficulty_level && (
                <span className={styles.errorMessage}>
                  {errors.difficulty_level.message}
                </span>
              )}
            </div>

            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>
                Лимит времени (минут) *
              </label>
              <Controller
                name="time_limit"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    className={`${styles.inputField} ${errors.time_limit ? styles.inputError : ''}`}
                    min="5"
                    max="180"
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.time_limit && (
                <span className={styles.errorMessage}>
                  {errors.time_limit.message}
                </span>
              )}
            </div>
          </div>

          {/* Редактор вопросов */}
          <QuizBuilder questions={questions} onChange={setQuestions} />

          {/* Кнопки */}
          <div className={styles.flex} style={{ gap: '1rem', paddingTop: '1rem' }}>
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className={`${styles.button} ${styles.buttonSuccess} ${styles.buttonFullWidth}`}
              style={{ flex: 1, padding: '1rem' }}
            >
              {isSubmitting || isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Сохранение...
                </>
              ) : (
                <>
                  <Save size={20} />
                  {isEditing ? 'Обновить тест' : 'Создать тест'}
                </>
              )}
            </button>
            {isEditing && onSaveAndClose && (
              <button
                type="button"
                onClick={handleSubmit(onFormSubmitAndClose)}
                disabled={isSubmitting || isLoading}
                className={`${styles.button} ${styles.buttonPrimary}`}
                style={{ padding: '1rem 2rem' }}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Сохранить и закрыть
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Сохранить и закрыть
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={handleCancel}
              disabled={isSubmitting}
              className={`${styles.button} ${styles.buttonSecondary}`}
              style={{ padding: '1rem 2rem' }}
            >
              Отмена
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};