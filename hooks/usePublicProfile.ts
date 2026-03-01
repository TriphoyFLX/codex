import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export interface PublicProfile {
  id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
  school_id: string | null;
  school: string | null;
  grade: string | null;
  city: string | null;
  interests: string | null;
  role: string | null;
  public_visibility: string;
  created_at: string;
  updated_at: string;
}

export const usePublicProfile = (userId: string) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get(`/profiles/${userId}`);
        
        // All profiles are now public
        setProfile(response.data);
      } catch (err) {
        console.error('Error fetching public profile:', err);
        setError('Профиль не найден');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  return { profile, loading, error };
};

export const usePublicProfilePosts = (userId: string) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await apiClient.get('/posts');
        const allPosts = response.data || [];
        
        // Filter posts by author_id
        const userPosts = allPosts.filter((post: any) => post.author_id === userId);
        setPosts(userPosts);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setError('Не удалось загрузить посты');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [userId]);

  return { posts, loading, error };
};
