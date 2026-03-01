export interface Question {
  id: string;
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'sequence';
  difficulty: number;
  options: string[];
  correct_answer: number | string;
  points?: number;
  tags?: string[];
  explanation?: string;
  category?: string;
  quiz_id?: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  subject: string;
  difficulty_level: number;
  time_limit: number;
  created_by: string;
  teacher_id?: string;
  created_at: string;
  updated_at: string;
  is_published?: boolean;
  questions: Question[];
}

export interface QuizAnswer {
  question_id: string;
  selected_answer: number | string;
  is_correct: boolean;
}

export interface QuizResult {
  id: string;
  quiz_id: string;
  user_id: string;
  answers: QuizAnswer[];
  score: number;
  total_points: number;
  completed_at: string;
}

export interface QuizFormData {
  title: string;
  description: string;
  subject: string;
  difficulty_level: number;
  time_limit: number;
}

export interface QuestionFormData {
  question_text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'matching' | 'sequence';
  difficulty: number;
  options: string[];
  correct_answer: number;
  points?: number;
  tags?: string[];
}

export interface QuestionTypeConfig {
  id: string;
  name: string;
  icon: string;
  label?: string;
  requiresOptions?: boolean;
  placeholder?: string;
}

export interface DifficultyLevel {
  id: number;
  name: string;
  color: string;
  points: number;
}
