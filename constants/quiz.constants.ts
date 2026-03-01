import { QuestionTypeConfig, DifficultyLevel } from '../types/quiz.types';

export const QUESTION_TYPES: QuestionTypeConfig[] = [
  { id: 'multiple_choice', name: 'Множественный выбор', icon: '🔘' },
  { id: 'true_false', name: 'Верно/Неверно', icon: '✓✗' },
  { id: 'short_answer', name: 'Короткий ответ', icon: '📝' },
  { id: 'matching', name: 'Сопоставление', icon: '↔️' },
  { id: 'sequence', name: 'Последовательность', icon: '🔢' }
];

export const DIFFICULTY_LEVELS: DifficultyLevel[] = [
  { id: 1, name: 'Легкий', color: 'bg-green-500', points: 10 },
  { id: 2, name: 'Средний', color: 'bg-yellow-500', points: 20 },
  { id: 3, name: 'Сложный', color: 'bg-orange-500', points: 30 },
  { id: 4, name: 'Эксперт', color: 'bg-red-500', points: 50 }
];

export const DEFAULT_QUIZ_TIME_LIMIT = 30; // minutes
export const MAX_QUIZ_TIME_LIMIT = 180; // minutes
export const MIN_QUIZ_TIME_LIMIT = 5; // minutes

export const DEFAULT_QUESTION_OPTIONS = ['', '', '', ''];
export const MAX_QUESTION_OPTIONS = 6;
export const MIN_QUESTION_OPTIONS = 2;

export const QUIZ_SUBJECTS = [
  'Финансы',
  'Математика',
  'Физика',
  'Химия',
  'Биология',
  'История',
  'География',
  'Литература',
  'Русский язык',
  'Английский язык',
  'Информатика',
  'Обществознание'
];

export const DEFAULT_QUIZ_FORM_DATA = {
  title: '',
  description: '',
  subject: 'Финансы',
  difficulty_level: 1,
  time_limit: DEFAULT_QUIZ_TIME_LIMIT,
};

export const DEFAULT_QUESTION_FORM_DATA = {
  question_text: '',
  type: 'multiple_choice' as const,
  difficulty: 1,
  options: DEFAULT_QUESTION_OPTIONS,
  correct_answer: 0,
  explanation: '',
  points: 10,
  category: 'Финансы',
  tags: []
};