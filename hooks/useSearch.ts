import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export interface SearchResult {
  id: string;
  type: 'post' | 'course' | 'profile';
  title: string;
  description?: string;
  content?: string;
  author?: string;
  authorAvatar?: string;
  createdAt?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
}

export const useSearch = (query: string, userId?: string) => {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    const performSearch = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const searchResults: SearchResult[] = [];
        const searchQuery = query.toLowerCase().trim();

        // Search posts
        try {
          const postsResponse = await apiClient.get('/posts');
          const posts = postsResponse.data || [];
          
          const filteredPosts = posts
            .filter((post: any) => 
              post.title.toLowerCase().includes(searchQuery) ||
              (post.content && post.content.toLowerCase().includes(searchQuery)) ||
              (post.hashtags && post.hashtags.toLowerCase().includes(searchQuery)) ||
              (post.author_first_name && post.author_first_name.toLowerCase().includes(searchQuery)) ||
              (post.author_last_name && post.author_last_name.toLowerCase().includes(searchQuery))
            )
            .map((post: any) => ({
              id: post.id,
              type: 'post' as const,
              title: post.title,
              description: post.content ? post.content.substring(0, 150) + '...' : '',
              content: post.content,
              author: `${post.author_first_name || ''} ${post.author_last_name || ''}`.trim() || 'Аноним',
              authorAvatar: post.author_avatar_url,
              createdAt: post.created_at,
              imageUrl: post.image_url,
              metadata: {
                likes_count: post.likes_count,
                comments_count: post.comments_count,
                is_liked: post.is_liked,
                is_bookmarked: post.is_bookmarked
              }
            }));
          
          searchResults.push(...filteredPosts);
        } catch (err) {
          console.error('Error searching posts:', err);
        }

        // Search courses
        try {
          const coursesResponse = await apiClient.get('/courses');
          const courses = coursesResponse.data || [];
          
          const filteredCourses = courses
            .filter((course: any) => 
              course.name.toLowerCase().includes(searchQuery) ||
              (course.description && course.description.toLowerCase().includes(searchQuery))
            )
            .map((course: any) => ({
              id: course.id,
              type: 'course' as const,
              title: course.name,
              description: course.description,
              content: course.description,
              author: 'Преподаватель',
              createdAt: course.created_at,
              imageUrl: course.image_url,
              metadata: {
                price: course.price,
                duration: course.duration,
                grades: course.grades,
                active: course.active
              }
            }));
          
          searchResults.push(...filteredCourses);
        } catch (err) {
          console.error('Error searching courses:', err);
        }

        // Search profiles
        try {
          const profilesResponse = await apiClient.get('/profiles');
          const profiles = profilesResponse.data || [];
          
          const filteredProfiles = profiles
            .filter((profile: any) => 
              profile.id !== userId && // Exclude current user
              (
                (profile.username && profile.username.toLowerCase().includes(searchQuery)) ||
                (profile.first_name && profile.first_name.toLowerCase().includes(searchQuery)) ||
                (profile.last_name && profile.last_name.toLowerCase().includes(searchQuery))
              )
            )
            .map((profile: any) => ({
              id: profile.id,
              type: 'profile' as const,
              title: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username || 'Пользователь',
              description: profile.username ? `@${profile.username}` : '',
              content: '',
              author: '',
              createdAt: profile.created_at,
              imageUrl: profile.avatar_url,
              metadata: {
                username: profile.username
              }
            }));
          
          searchResults.push(...filteredProfiles);
        } catch (err) {
          console.error('Error searching profiles:', err);
        }

        // Sort results by relevance (exact matches first, then partial)
        searchResults.sort((a, b) => {
          const aExact = a.title.toLowerCase() === searchQuery ? 1 : 0;
          const bExact = b.title.toLowerCase() === searchQuery ? 1 : 0;
          if (aExact !== bExact) return bExact - aExact;
          
          const aStarts = a.title.toLowerCase().startsWith(searchQuery) ? 1 : 0;
          const bStarts = b.title.toLowerCase().startsWith(searchQuery) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
          
          return a.title.localeCompare(b.title);
        });

        setResults(searchResults);
      } catch (err) {
        console.error('Search error:', err);
        setError('Произошла ошибка при поиске');
      } finally {
        setLoading(false);
      }
    };

    const timeoutId = setTimeout(performSearch, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [query, userId]);

  return { results, loading, error };
};
