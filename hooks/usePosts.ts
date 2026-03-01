import { useEffect, useState } from "react";
import { apiClient } from "../lib/apiClient";

export interface Post {
  id: string;
  title: string;
  content: string;
  description?: string;
  created_at: string;
  author_id: string;
  image_url?: string;
  hashtags?: string;
  author_first_name: string | null;
  author_last_name: string | null;
  author_avatar_url: string | null;
  likes_count?: number;
  comments_count?: number;
  is_liked?: boolean;
  is_bookmarked?: boolean;
  profiles?: Array<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  }>;
  author?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
  };
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  author_first_name?: string;
  author_last_name?: string;
  author_avatar_url?: string;
}

// Функции для работы с localStorage
const LIKES_KEY = 'post_likes';
const BOOKMARKS_KEY = 'post_bookmarks';

const getLikedPosts = (userId: string): Set<string> => {
  const likes = localStorage.getItem(`${LIKES_KEY}_${userId}`);
  return likes ? new Set(JSON.parse(likes)) : new Set();
};

const getBookmarkedPosts = (userId: string): Set<string> => {
  const bookmarks = localStorage.getItem(`${BOOKMARKS_KEY}_${userId}`);
  return bookmarks ? new Set(JSON.parse(bookmarks)) : new Set();
};

const saveLikedPosts = (userId: string, likedPosts: Set<string>) => {
  localStorage.setItem(`${LIKES_KEY}_${userId}`, JSON.stringify([...likedPosts]));
};

const saveBookmarkedPosts = (userId: string, bookmarkedPosts: Set<string>) => {
  localStorage.setItem(`${BOOKMARKS_KEY}_${userId}`, JSON.stringify([...bookmarkedPosts]));
};

// Функция для синхронизации локальных данных с бэкендом
const syncWithBackend = async (userId: string) => {
  try {
    console.log('Syncing local data with backend for user:', userId);
    
    // Получаем актуальные данные с бэкенда
    const response = await apiClient.get(`/posts?user_id=${userId}`);
    const backendPosts = response.data;
    
    // Получаем локальные данные
    const localLikedPosts = getLikedPosts(userId);
    const localBookmarkedPosts = getBookmarkedPosts(userId);
    
    // Создаем множества для данных с бэкенда
    const backendLikedPosts = new Set<string>(
      backendPosts
        .filter((post: Post) => post.is_liked)
        .map((post: Post) => post.id)
    );
    
    const backendBookmarkedPosts = new Set<string>(
      backendPosts
        .filter((post: Post) => post.is_bookmarked)
        .map((post: Post) => post.id)
    );
    
    // Объединяем данные (берем объединение локальных и бэкенд данных)
    const mergedLikedPosts = new Set([...localLikedPosts, ...backendLikedPosts]);
    const mergedBookmarkedPosts = new Set([...localBookmarkedPosts, ...backendBookmarkedPosts]);
    
    // Сохраняем объединенные данные
    saveLikedPosts(userId, mergedLikedPosts);
    saveBookmarkedPosts(userId, mergedBookmarkedPosts);
    
    console.log('Sync completed:', {
      localLikes: localLikedPosts.size,
      backendLikes: backendLikedPosts.size,
      mergedLikes: mergedLikedPosts.size,
      localBookmarks: localBookmarkedPosts.size,
      backendBookmarks: backendBookmarkedPosts.size,
      mergedBookmarks: mergedBookmarkedPosts.size
    });
    
    return {
      likedPosts: mergedLikedPosts,
      bookmarkedPosts: mergedBookmarkedPosts
    };
  } catch (error) {
    console.error('Failed to sync with backend:', error);
    // Возвращаем локальные данные при ошибке
    return {
      likedPosts: getLikedPosts(userId),
      bookmarkedPosts: getBookmarkedPosts(userId)
    };
  }
};

export function usePosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Для страницы /posts получаем все посты, для профиля - только посты пользователя
      const url = userId ? `/posts?user_id=${userId}` : '/posts';
      console.log('Fetching posts from backend:', url);
      const response = await apiClient.get(url);
      
      let postsData = response.data;
      
      // Если есть userId, синхронизируем и применяем локальные данные
      if (userId) {
        // Синхронизируем с бэкендом
        const { likedPosts, bookmarkedPosts } = await syncWithBackend(userId);
        
        // Применяем локальные данные к постам
        postsData = postsData.map((post: Post) => ({
          ...post,
          is_liked: likedPosts.has(post.id),
          is_bookmarked: bookmarkedPosts.has(post.id)
        }));
        
        console.log('Applied synced likes/bookmarks:', {
          liked: [...likedPosts],
          bookmarked: [...bookmarkedPosts]
        });
      }
      
      console.log('Posts processed:', postsData.slice(0, 1));
      setPosts(postsData);
    } catch (error) {
      console.error("Ошибка загрузки постов:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const createPost = async (postData: { title: string; content: string; hashtags?: string; image_url?: string; author_id: string }) => {
    try {
      const response = await apiClient.post('/posts', postData);
      setPosts(prev => [response.data, ...prev]);
      return response.data;
    } catch (error) {
      console.error("Ошибка создания поста:", error);
      throw error;
    }
  };

  const likePost = async (postId: string, userId: string) => {
    try {
      // Сначала обновляем локальное состояние
      const likedPosts = getLikedPosts(userId);
      
      if (likedPosts.has(postId)) {
        // Убираем лайк
        likedPosts.delete(postId);
        saveLikedPosts(userId, likedPosts);
        
        // Обновляем UI
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, is_liked: false, likes_count: (post.likes_count || 0) - 1 }
            : post
        ));
        
        // Отправляем на бэкенд (не ждем ответа)
        apiClient.post(`/posts/${postId}/like`, { user_id: userId }).catch(err => {
          console.error('Failed to unlike on backend:', err);
          // Откатываем локальные изменения при ошибке
          likedPosts.add(postId);
          saveLikedPosts(userId, likedPosts);
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, is_liked: true, likes_count: (post.likes_count || 0) + 1 }
              : post
          ));
        });
      } else {
        // Добавляем лайк
        likedPosts.add(postId);
        saveLikedPosts(userId, likedPosts);
        
        // Обновляем UI
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, is_liked: true, likes_count: (post.likes_count || 0) + 1 }
            : post
        ));
        
        // Отправляем на бэкенд (не ждем ответа)
        apiClient.post(`/posts/${postId}/like`, { user_id: userId }).catch(err => {
          console.error('Failed to like on backend:', err);
          // Откатываем локальные изменения при ошибке
          likedPosts.delete(postId);
          saveLikedPosts(userId, likedPosts);
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, is_liked: false, likes_count: (post.likes_count || 0) - 1 }
              : post
          ));
        });
      }
    } catch (error) {
      console.error("Ошибка лайка:", error);
      throw error;
    }
  };

  const bookmarkPost = async (postId: string, userId: string) => {
    try {
      // Сначала обновляем локальное состояние
      const bookmarkedPosts = getBookmarkedPosts(userId);
      
      if (bookmarkedPosts.has(postId)) {
        // Убираем закладку
        bookmarkedPosts.delete(postId);
        saveBookmarkedPosts(userId, bookmarkedPosts);
        
        // Обновляем UI
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, is_bookmarked: false }
            : post
        ));
        
        // Отправляем на бэкенд (не ждем ответа)
        apiClient.post(`/posts/${postId}/bookmark`, { user_id: userId }).catch(err => {
          console.error('Failed to unbookmark on backend:', err);
          // Откатываем локальные изменения при ошибке
          bookmarkedPosts.add(postId);
          saveBookmarkedPosts(userId, bookmarkedPosts);
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, is_bookmarked: true }
              : post
          ));
        });
      } else {
        // Добавляем закладку
        bookmarkedPosts.add(postId);
        saveBookmarkedPosts(userId, bookmarkedPosts);
        
        // Обновляем UI
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, is_bookmarked: true }
            : post
        ));
        
        // Отправляем на бэкенд (не ждем ответа)
        apiClient.post(`/posts/${postId}/bookmark`, { user_id: userId }).catch(err => {
          console.error('Failed to bookmark on backend:', err);
          // Откатываем локальные изменения при ошибке
          bookmarkedPosts.delete(postId);
          saveBookmarkedPosts(userId, bookmarkedPosts);
          setPosts(prev => prev.map(post => 
            post.id === postId 
              ? { ...post, is_bookmarked: false }
              : post
          ));
        });
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      throw error;
    }
  };

  const getComments = async (postId: string): Promise<Comment[]> => {
    try {
      const response = await apiClient.get(`/posts/${postId}/comments`);
      return response.data;
    } catch (error) {
      console.error("Ошибка загрузки комментариев:", error);
      throw error;
    }
  };

  const addComment = async (postId: string, userId: string, content: string) => {
    try {
      const response = await apiClient.post(`/posts/${postId}/comments`, {
        user_id: userId,
        content
      });
      
      // Update comments count in posts
      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      ));
      
      return response.data;
    } catch (error) {
      console.error("Ошибка добавления комментария:", error);
      throw error;
    }
  };

  const deletePost = async (postId: string, userId: string) => {
    try {
      await apiClient.delete(`/posts/${postId}`, {
        data: { user_id: userId }
      });
      
      // Remove post from local state
      setPosts(prev => prev.filter(post => post.id !== postId));
      
      return true;
    } catch (error) {
      console.error("Ошибка удаления поста:", error);
      throw error;
    }
  };

  // Функция для очистки локальных данных
  const clearLocalData = (userId: string) => {
    localStorage.removeItem(`${LIKES_KEY}_${userId}`);
    localStorage.removeItem(`${BOOKMARKS_KEY}_${userId}`);
    console.log('Cleared local data for user:', userId);
  };

  // Функция для получения статистики локальных данных
  const getLocalStats = (userId: string) => {
    const likedPosts = getLikedPosts(userId);
    const bookmarkedPosts = getBookmarkedPosts(userId);
    return {
      likedCount: likedPosts.size,
      bookmarkedCount: bookmarkedPosts.size,
      likedPosts: [...likedPosts],
      bookmarkedPosts: [...bookmarkedPosts]
    };
  };

  useEffect(() => {
    console.log('useEffect triggered in usePosts, userId:', userId);
    // Сбрасываем состояние при изменении userId
    setPosts([]);
    setLoading(true);
    fetchPosts();
  }, [userId]);

  return { posts, setPosts, loading, fetchPosts, createPost, likePost, bookmarkPost, deletePost, getComments, addComment, clearLocalData, getLocalStats };
}

// Отдельный хук для секции "Мои посты" в профиле
export function useMyPosts(userId?: string) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      // Для секции "Мои посты" всегда фильтруем по автору
      const url = userId ? `/posts?user_id=${userId}&filter_by_author=true` : '/posts';
      console.log('Fetching MY posts from backend:', url);
      const response = await apiClient.get(url);
      
      let postsData = response.data;
      
      // Если есть userId, синхронизируем и применяем локальные данные
      if (userId) {
        const { likedPosts, bookmarkedPosts } = await syncWithBackend(userId);
        
        postsData = postsData.map((post: Post) => ({
          ...post,
          is_liked: likedPosts.has(post.id),
          is_bookmarked: bookmarkedPosts.has(post.id)
        }));
      }
      
      setPosts(postsData);
    } catch (error) {
      console.error("Ошибка загрузки моих постов:", error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useEffect triggered in useMyPosts, userId:', userId);
    setPosts([]);
    setLoading(true);
    fetchPosts();
  }, [userId]);

  return { posts, setPosts, loading, fetchPosts };
}
