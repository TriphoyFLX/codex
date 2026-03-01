import React from "react";
import { MessageCircle, Heart, Calendar } from "lucide-react";
import { usePublicProfilePosts } from "../../hooks/usePublicProfile";
import styles from "./PublicProfile.module.css";

interface PublicPostsSectionProps {
  userId: string;
}

const PublicPostsSection: React.FC<PublicPostsSectionProps> = ({ userId }) => {
  const { posts, loading, error } = usePublicProfilePosts(userId);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>Посты</h2>
        <div className={styles.loadingPosts}>
          <div className={styles.spinner}></div>
          <p>Загрузка постов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>Посты</h2>
        <div className={styles.errorPosts}>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className={styles.postsSection}>
        <h2 className={styles.sectionTitle}>Посты</h2>
        <div className={styles.emptyPosts}>
          <MessageCircle size={48} className={styles.emptyIcon} />
          <h3>Нет постов</h3>
          <p>Этот пользователь еще не опубликовал посты</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.postsSection}>
      <h2 className={styles.sectionTitle}>Посты ({posts.length})</h2>
      <div className={styles.postsGrid}>
        {posts.map((post) => (
          <div key={post.id} className={styles.postCard}>
            {post.image_url && (
              <div className={styles.postImage}>
                <img
                  src={post.image_url.startsWith('http') ? post.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${post.image_url}`}
                  alt={post.title}
                />
              </div>
            )}
            
            <div className={styles.postContent}>
              <h3 className={styles.postTitle}>{post.title}</h3>
              
              {post.content && (
                <p className={styles.postDescription}>
                  {post.content.length > 150 
                    ? post.content.substring(0, 150) + '...' 
                    : post.content
                  }
                </p>
              )}
              
              {post.hashtags && (
                <div className={styles.postTags}>
                  {post.hashtags.split(',').map((tag: string, i: number) => (
                    <span key={i} className={styles.tag}>#{tag.trim()}</span>
                  ))}
                </div>
              )}
              
              <div className={styles.postStats}>
                <div className={styles.statItem}>
                  <Heart size={14} />
                  <span>{post.likes_count || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <MessageCircle size={14} />
                  <span>{post.comments_count || 0}</span>
                </div>
                <div className={styles.statItem}>
                  <Calendar size={14} />
                  <span>{formatDate(post.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PublicPostsSection;
