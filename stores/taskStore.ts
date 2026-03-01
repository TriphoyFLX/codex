import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { apiClient } from '../lib/apiClient';

interface Task {
  id: string;
  title: string;
  description: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  max_attempts: number;
  deadline?: string;
  status: 'published' | 'draft';
  created_at: string;
  teacher_id: string;
  school_id: string;
}

interface TaskSubmission {
  id: string;
  task_id: string;
  student_id: string;
  content: string;
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  points?: number;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  first_name?: string;
  last_name?: string;
}

interface TaskState {
  tasks: Task[];
  submissions: TaskSubmission[];
  currentTask: Task | null;
  loading: boolean;
  error: string | null;
  isSubmitting: boolean;
  
  // Actions
  fetchTasks: (schoolId: string) => Promise<void>;
  fetchTeacherTasks: (schoolId: string) => Promise<void>;
  fetchAvailableTasks: (schoolId: string) => Promise<void>;
  submitTask: (taskId: string, content: string, attachments?: string[]) => Promise<void>;
  reviewSubmission: (submissionId: string, status: 'approved' | 'rejected', feedback?: string, points?: number) => Promise<void>;
  fetchSubmissionsForReview: (schoolId: string) => Promise<void>;
  setCurrentTask: (task: Task | null) => void;
  clearError: () => void;
}

export const useTaskStore = create<TaskState>()(
  devtools(
    (set) => ({
      tasks: [],
      submissions: [],
      currentTask: null,
      loading: false,
      error: null,
      isSubmitting: false,

      fetchTasks: async (schoolId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get(`/tasks/my?school_id=${schoolId}`);
          set({ tasks: response.data, loading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to fetch tasks',
            loading: false 
          });
        }
      },

      fetchTeacherTasks: async (schoolId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get(`/tasks/my?school_id=${schoolId}`);
          set({ tasks: response.data, loading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to fetch teacher tasks',
            loading: false 
          });
        }
      },

      fetchAvailableTasks: async (schoolId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get(`/tasks/available?school_id=${schoolId}`);
          set({ tasks: response.data, loading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to fetch available tasks',
            loading: false 
          });
        }
      },

      submitTask: async (taskId: string, content: string, attachments?: string[]) => {
        set({ isSubmitting: true, error: null });
        try {
          const response = await apiClient.post(`/tasks/${taskId}/submit`, {
            content,
            attachments
          });
          
          const newSubmission = response.data;
          set(state => ({
            submissions: [...state.submissions, newSubmission],
            isSubmitting: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to submit task',
            isSubmitting: false 
          });
          throw error;
        }
      },

      reviewSubmission: async (submissionId: string, status: 'approved' | 'rejected', feedback?: string, points?: number) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.put(`/submissions/${submissionId}/review`, {
            status,
            feedback,
            points
          });
          
          const updatedSubmission = response.data;
          set(state => ({
            submissions: state.submissions.map(sub => 
              sub.id === submissionId ? updatedSubmission : sub
            ),
            loading: false
          }));
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to review submission',
            loading: false 
          });
          throw error;
        }
      },

      fetchSubmissionsForReview: async (schoolId: string) => {
        set({ loading: true, error: null });
        try {
          const response = await apiClient.get(`/submissions/review?school_id=${schoolId}`);
          set({ submissions: response.data, loading: false });
        } catch (error: any) {
          set({ 
            error: error.response?.data?.error || 'Failed to fetch submissions for review',
            loading: false 
          });
        }
      },

      setCurrentTask: (task: Task | null) => {
        set({ currentTask: task });
      },

      clearError: () => {
        set({ error: null });
      }
    }),
    {
      name: 'task-store'
    }
  )
);

// Для обратной совместимости
export const useTaskStoreV2 = useTaskStore;
