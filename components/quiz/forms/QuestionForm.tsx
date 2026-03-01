import React from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { 
  questionFormSchema, 
  QuestionFormSchema
} from '../../../schemas/quiz.schemas';
import { 
  QUESTION_TYPES, 
  DIFFICULTY_LEVELS,
  DEFAULT_QUESTION_OPTIONS 
} from '../../../constants/quiz.constants';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Question } from '../../../types/quiz.types';
import styles from '../../../pages/practice/BusinessGame.module.css';

interface QuestionFormProps {
  initialData?: Partial<Question>;
  onSubmit: (data: Question) => Promise<boolean>;
  onCancel: () => void;
  isEditing?: boolean;
  isLoading?: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isEditing = false,
  isLoading = false
}) => {

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm<QuestionFormSchema>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question_text: initialData?.question_text || '',
      type: initialData?.type || 'multiple_choice',
      difficulty: initialData?.difficulty || 1,
      options: initialData?.options || DEFAULT_QUESTION_OPTIONS,
      correct_answer: initialData?.correct_answer as number || 0,
      explanation: initialData?.explanation || '',
      points: initialData?.points || 10,
      category: initialData?.category || 'Финансы',
      tags: initialData?.tags || []
    }
  });

  const questionType = useWatch({ control, name: 'type' });
  const options = useWatch({ control, name: 'options' });
  const difficulty = useWatch({ control, name: 'difficulty' });

  // Автоматически устанавливаем очки при изменении сложности
  React.useEffect(() => {
    const level = DIFFICULTY_LEVELS.find(d => d.id === difficulty);
    if (level) {
      setValue('points', level.points);
    }
  }, [difficulty, setValue]);

  const onFormSubmit = async (data: QuestionFormSchema) => {
    const questionData: Question = {
      ...data,
      id: initialData?.id || `question_${Date.now()}`
    };
    
    const success = await onSubmit(questionData);
    if (success) {
      reset();
    }
  };

  const handleCancel = () => {
    reset();
    onCancel();
  };

  // Добавить вариант ответа
  const addOption = () => {
    if (options.length < 6) {
      setValue('options', [...options, '']);
    }
  };

  // Удалить вариант ответа
  const removeOption = (index: number) => {
    if (options.length > 2) {
      const newOptions = options.filter((_, i) => i !== index);
      setValue('options', newOptions);
      
      // Если удаляемый вариант был правильным ответом, сбрасываем на первый
      const correctAnswer = watch('correct_answer');
      if (correctAnswer === index) {
        setValue('correct_answer', 0);
      } else if (correctAnswer > index) {
        setValue('correct_answer', correctAnswer - 1);
      }
    }
  };

  // Добавить тег
  const addTag = (tagValue: string) => {
    const currentTags = watch('tags');
    if (tagValue.trim() && !currentTags.includes(tagValue.trim()) && currentTags.length < 10) {
      setValue('tags', [...currentTags, tagValue.trim()]);
    }
  };

  // Удалить тег
  const removeTag = (index: number) => {
    const currentTags = watch('tags');
    setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>
            {isEditing ? 'Редактировать вопрос' : 'Новый вопрос'}
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
          <div className={styles.flexCol} style={{ gap: '1rem' }}>
            {/* Тип вопроса */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Тип вопроса *</label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`${styles.selectField} ${errors.type ? styles.inputError : ''}`}
                    disabled={isSubmitting}
                  >
                    {QUESTION_TYPES.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.icon} {type.name}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.type && (
                <span className={styles.errorMessage}>{errors.type.message}</span>
              )}
            </div>

            {/* Текст вопроса */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Вопрос *</label>
              <Controller
                name="question_text"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={`${styles.textareaField} ${errors.question_text ? styles.inputError : ''}`}
                    rows={3}
                    placeholder="Введите текст вопроса..."
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.question_text && (
                <span className={styles.errorMessage}>{errors.question_text.message}</span>
              )}
            </div>

            {/* Варианты ответов для множественного выбора */}
            {questionType === 'multiple_choice' && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Варианты ответов *</label>
                <div className={styles.optionContainer}>
                  {options.map((_option, index) => (
                    <div key={index} className={styles.optionItem}>
                      <Controller
                        name="correct_answer"
                        control={control}
                        render={({ field: correctField }) => (
                          <input
                            type="radio"
                            checked={correctField.value === index}
                            onChange={() => correctField.onChange(index)}
                            className={styles.radioInput}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                      <Controller
                        name={`options.${index}` as const}
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            className={styles.inputField}
                            placeholder={`Вариант ${index + 1}`}
                            disabled={isSubmitting}
                          />
                        )}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(index)}
                          className={`${styles.button} ${styles.buttonDanger}`}
                          style={{ padding: '0.5rem' }}
                          disabled={isSubmitting}
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                  {options.length < 6 && (
                    <button
                      type="button"
                      onClick={addOption}
                      className={`${styles.button} ${styles.buttonSecondary}`}
                      style={{ width: '100%', padding: '0.5rem' }}
                      disabled={isSubmitting}
                    >
                      <Plus size={16} /> Добавить вариант
                    </button>
                  )}
                </div>
                {errors.options && (
                  <span className={styles.errorMessage}>{errors.options.message}</span>
                )}
              </div>
            )}

            {/* Для true/false вопросов */}
            {questionType === 'true_false' && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Правильный ответ *</label>
                <div className={`${styles.grid} ${styles.gridCols2}`} style={{ gap: '1rem' }}>
                  <Controller
                    name="correct_answer"
                    control={control}
                    render={({ field }) => (
                      <>
                        <button
                          type="button"
                          onClick={() => field.onChange(0)}
                          className={`${styles.trueFalseButton} ${styles.trueButton} ${
                            field.value === 0 ? styles.selected : ''
                          }`}
                          disabled={isSubmitting}
                        >
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>✅</div>
                          <div className={styles.fontBold}>Верно</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => field.onChange(1)}
                          className={`${styles.trueFalseButton} ${styles.falseButton} ${
                            field.value === 1 ? styles.selected : ''
                          }`}
                          disabled={isSubmitting}
                        >
                          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>❌</div>
                          <div className={styles.fontBold}>Неверно</div>
                        </button>
                      </>
                    )}
                  />
                </div>
                {errors.correct_answer && (
                  <span className={styles.errorMessage}>{errors.correct_answer.message}</span>
                )}
              </div>
            )}

            {/* Для короткого ответа */}
            {questionType === 'short_answer' && (
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Правильный ответ *</label>
                <Controller
                  name="options.0"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      className={`${styles.inputField} ${errors.options ? styles.inputError : ''}`}
                      placeholder="Введите правильный ответ..."
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.options && (
                  <span className={styles.errorMessage}>{errors.options.message}</span>
                )}
              </div>
            )}

            {/* Сложность и очки */}
            <div className={`${styles.grid} ${styles.gridCols2}`} style={{ gap: '1rem' }}>
              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Сложность *</label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <select
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      className={`${styles.selectField} ${errors.difficulty ? styles.inputError : ''}`}
                      disabled={isSubmitting}
                    >
                      {DIFFICULTY_LEVELS.map(level => (
                        <option key={level.id} value={level.id}>
                          {level.name} ({level.points} очков)
                        </option>
                      ))}
                    </select>
                  )}
                />
                {errors.difficulty && (
                  <span className={styles.errorMessage}>{errors.difficulty.message}</span>
                )}
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.inputLabel}>Очки за вопрос *</label>
                <Controller
                  name="points"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="number"
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      className={`${styles.inputField} ${errors.points ? styles.inputError : ''}`}
                      min="1"
                      max="100"
                      disabled={isSubmitting}
                    />
                  )}
                />
                {errors.points && (
                  <span className={styles.errorMessage}>{errors.points.message}</span>
                )}
              </div>
            </div>

            {/* Объяснение */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Объяснение *</label>
              <Controller
                name="explanation"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    className={`${styles.textareaField} ${errors.explanation ? styles.inputError : ''}`}
                    rows={2}
                    placeholder="Объяснение правильного ответа..."
                    disabled={isSubmitting}
                  />
                )}
              />
              {errors.explanation && (
                <span className={styles.errorMessage}>{errors.explanation.message}</span>
              )}
            </div>

            {/* Теги */}
            <div className={styles.inputGroup}>
              <label className={styles.inputLabel}>Теги</label>
              <input
                type="text"
                className={styles.inputField}
                placeholder="Добавьте теги через Enter..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                    e.preventDefault();
                    addTag(e.currentTarget.value.trim());
                    e.currentTarget.value = '';
                  }
                }}
                disabled={isSubmitting}
              />
              <div className={styles.tagContainer}>
                {watch('tags').map((tag, index) => (
                  <span key={index} className={`${styles.tag} ${styles.tagPrimary}`}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(index)}
                      disabled={isSubmitting}
                    >
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Кнопки сохранения */}
            <div className={styles.flex} style={{ gap: '0.75rem', paddingTop: '1rem' }}>
              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className={`${styles.button} ${styles.buttonSuccess}`}
                style={{ flex: 1 }}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    Сохранить вопрос
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className={`${styles.button} ${styles.buttonSecondary}`}
              >
                Отмена
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};