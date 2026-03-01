import { useState, useEffect } from "react";
import { apiClient } from "../lib/apiClient";

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface FollowStats {
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

export const useFollowSystem = (currentUserId?: string, targetUserId?: string) => {
  const [followStats, setFollowStats] = useState<FollowStats>({
    followers_count: 0,
    following_count: 0,
    is_following: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch follow stats for target user
  useEffect(() => {
    if (!targetUserId || !currentUserId) return;

    const fetchFollowStats = async () => {
      try {
        const response = await apiClient.get(`/follows/stats/${targetUserId}`);
        setFollowStats(response.data);
      } catch (err) {
        console.error('Error fetching follow stats:', err);
      }
    };

    fetchFollowStats();
  }, [targetUserId, currentUserId]);

  const followUser = async () => {
    if (!currentUserId || !targetUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.post('/follows', {
        follower_id: currentUserId,
        following_id: targetUserId
      });
      
      setFollowStats(prev => ({
        ...prev,
        is_following: true,
        followers_count: prev.followers_count + 1
      }));
    } catch (err) {
      console.error('Error following user:', err);
      setError('Не удалось подписаться');
    } finally {
      setLoading(false);
    }
  };

  const unfollowUser = async () => {
    if (!currentUserId || !targetUserId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await apiClient.delete('/follows', {
        data: {
          follower_id: currentUserId,
          following_id: targetUserId
        }
      });
      
      setFollowStats(prev => ({
        ...prev,
        is_following: false,
        followers_count: prev.followers_count - 1
      }));
    } catch (err) {
      console.error('Error unfollowing user:', err);
      setError('Не удалось отписаться');
    } finally {
      setLoading(false);
    }
  };

  const toggleFollow = () => {
    if (followStats.is_following) {
      unfollowUser();
    } else {
      followUser();
    }
  };

  return {
    followStats,
    loading,
    error,
    followUser,
    unfollowUser,
    toggleFollow
  };
};

// Hook for user's own follow management
export const useUserFollows = (userId?: string) => {
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUserFollows = async () => {
      try {
        const [followersResponse, followingResponse] = await Promise.all([
          apiClient.get(`/follows/followers/${userId}`),
          apiClient.get(`/follows/following/${userId}`)
        ]);
        
        setFollowers(followersResponse.data || []);
        setFollowing(followingResponse.data || []);
      } catch (err) {
        console.error('Error fetching user follows:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserFollows();
  }, [userId]);

  return {
    followers,
    following,
    loading
  };
};
