import { apiClient } from '../lib/apiClient';

export interface AdminStats {
  totalUsers: number;
  totalCourses: number;
  totalPosts: number;
  activeUsers: number;
  newUsersToday: number;
}

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
  school_id?: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  description: string;
  teacher_id: string;
  created_at: string;
  students_count?: number;
}

export interface AdminPost {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  likes_count: number;
}

export interface AdminNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  school_id?: number | null;
  role?: string | null;
  created_at: string;
}

class AdminService {
  // Получение статистики
  async getStats(): Promise<AdminStats> {
    try {
      const response = await apiClient.get('/admin/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching admin stats:', error);
      // Возвращаем моковые данные в случае ошибки
      return {
        totalUsers: 0,
        totalCourses: 0,
        totalPosts: 0,
        activeUsers: 0,
        newUsersToday: 0
      };
    }
  }

  // Получение списка пользователей
  async getUsers(): Promise<AdminUser[]> {
    try {
      const response = await apiClient.get('/admin/users');
      return response.data;
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  }

  // Удаление пользователя
  async deleteUser(userId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/users/${userId}`);
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Получение списка курсов
  async getCourses(): Promise<AdminCourse[]> {
    try {
      const response = await apiClient.get('/admin/courses');
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      return [];
    }
  }

  // Удаление курса
  async deleteCourse(courseId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/courses/${courseId}`);
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }

  // Создание курса
  async createCourse(courseData: Omit<AdminCourse, 'id' | 'created_at' | 'students_count'>): Promise<AdminCourse> {
    try {
      const response = await apiClient.post('/admin/courses', courseData);
      return response.data;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  // Получение списка постов
  async getPosts(): Promise<AdminPost[]> {
    try {
      const response = await apiClient.get('/admin/posts');
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      return [];
    }
  }

  // Удаление поста
  async deletePost(postId: string): Promise<void> {
    try {
      await apiClient.delete(`/admin/posts/${postId}`);
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Блокировка/разблокировка пользователя
  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, { isActive });
    } catch (error) {
      console.error('Error toggling user status:', error);
      throw error;
    }
  }

  // Изменение роли пользователя
  async changeUserRole(userId: string, role: string): Promise<void> {
    try {
      await apiClient.patch(`/admin/users/${userId}/role`, { role });
    } catch (error) {
      console.error('Error changing user role:', error);
      throw error;
    }
  }

  async getNotifications(): Promise<AdminNotification[]> {
    try {
      const response = await apiClient.get('/admin/notifications');
      if (Array.isArray(response.data)) {
        return response.data;
      }

      if (response.data && Array.isArray(response.data.items)) {
        return response.data.items;
      }

      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  async createNotification(payload: Omit<AdminNotification, 'id' | 'created_at'>): Promise<AdminNotification> {
    const response = await apiClient.post('/admin/notifications', payload);
    return response.data;
  }

  async deleteNotification(notificationId: number): Promise<void> {
    await apiClient.delete(`/admin/notifications/${notificationId}`);
  }
}

export const adminService = new AdminService();
