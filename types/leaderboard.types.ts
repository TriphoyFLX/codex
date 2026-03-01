export interface LeaderboardEntry {
  id: string;
  user_id: string;
  username: string;
  avatar?: string;
  total_points: number;
  quizzes_completed: number;
  average_score: number;
  streak: number;
  last_activity: string;
  rank: number;
}

export interface LeaderboardStats {
  total_users: number;
  user_rank: number;
  user_points: number;
  top_score: number;
  average_points: number;
}

export interface QuizResultForLeaderboard {
  user_id: string;
  username: string;
  quiz_id: string;
  score: number;
  max_score: number;
  completed_at: string;
}
