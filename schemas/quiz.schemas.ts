import { z } from 'zod';
import { QUIZ_SUBJECTS, MIN_QUIZ_TIME_LIMIT, MAX_QUIZ_TIME_LIMIT } from '../constants/quiz.constants';

// Схема для валидации формы теста
export const quizFormSchema = z.object({
  title: z.string()
    .min(3, 'Название должно содержать минимум 3 символа')
    .max(100, 'Название не должно превышать 100 символов')
    .trim(),
  description: z.string()
    .min(10, 'Описание должно содержать минимум 10 символов')
    .max(500, 'Описание не должно превышать 500 символов')
    .trim(),
  subject: z.enum(QUIZ_SUBJECTS as [string, ...string[]]),
  difficulty_level: z.number()
    .min(1, 'Выберите уровень сложности')
    .max(4, 'Неверный уровень сложности'),
  time_limit: z.number()
    .min(MIN_QUIZ_TIME_LIMIT, `Минимальное время: ${MIN_QUIZ_TIME_LIMIT} минут`)
    .max(MAX_QUIZ_TIME_LIMIT, `Максимальное время: ${MAX_QUIZ_TIME_LIMIT} минут`)
});

// Схема для валидации вопроса
export const questionFormSchema = z.object({
  question_text: z.string()
    .min(5, 'Вопрос должен содержать минимум 5 символов')
    .max(500, 'Вопрос не должен превышать 500 символов')
    .trim(),
  type: z.enum(['multiple_choice', 'true_false', 'short_answer', 'matching', 'sequence']),
  difficulty: z.number()
    .min(1, 'Выберите уровень сложности')
    .max(4, 'Неверный уровень сложности'),
  options: z.array(z.string().trim())
    .min(2, 'Должно быть минимум 2 варианта')
    .max(6, 'Максимум 6 вариантов')
    .refine((options) => {
      return options.every(option => option.length > 0);
    }, 'Все варианты должны быть заполнены'),
  correct_answer: z.number()
    .min(0, 'Выберите правильный ответ'),
  explanation: z.string()
    .min(5, 'Объяснение должно содержать минимум 5 символов')
    .max(300, 'Объяснение не должно превышать 300 символов')
    .trim(),
  points: z.number()
    .min(1, 'Минимум 1 очко за вопрос')
    .max(100, 'Максимум 100 очков за вопрос'),
  category: z.string()
    .min(1, 'Выберите категорию'),
  tags: z.array(z.string().trim())
    .max(10, 'Максимум 10 тегов')
});

// Схема для короткого ответа
export const shortAnswerQuestionSchema = questionFormSchema.extend({
  options: z.array(z.string().trim().min(1, 'Ответ не должен быть пустым'))
    .length(1, 'Для короткого ответа должен быть один правильный ответ'),
  correct_answer: z.literal(0)
});

// Схема для верно/неверно
export const trueFalseQuestionSchema = questionFormSchema.extend({
  options: z.array(z.string())
    .length(2, 'Для вопроса "Верно/Неверно" должно быть 2 варианта'),
  correct_answer: z.union([z.literal(0), z.literal(1)])
});

// Типы для TypeScript
export type QuizFormSchema = z.infer<typeof quizFormSchema>;
export type QuestionFormSchema = z.infer<typeof questionFormSchema>;
export type ShortAnswerQuestionSchema = z.infer<typeof shortAnswerQuestionSchema>;
export type TrueFalseQuestionSchema = z.infer<typeof trueFalseQuestionSchema>;