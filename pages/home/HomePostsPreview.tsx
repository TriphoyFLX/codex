import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "../../lib/apiClient";
import { useNavigate } from "react-router-dom";
import { Heart, MessageCircle, Bookmark, ArrowUpRight } from "lucide-react";
import styles from "./HomePostsPreview.module.css";

interface Post {
  id: string;
  title: string;
  content: string;
  author_name: string;
  author_avatar?: string;
  likes_count: number;
  comments_count: number;
  bookmarks_count: number;
  created_at: string;
  image_url?: string;
}

const HomePostsPreview: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/posts');
      const allPosts = response.data as Post[];
      // Показываем только первые 3 поста
      setPosts(allPosts.slice(0, 3));
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    if (diffDays <= 7) return `${diffDays} дней назад`;
    return date.toLocaleDateString('ru-RU');
  };

  return (
    <section className={styles.postsPreview}>
      <div className={styles.sectionHeader}>
        <h2>Сообщество</h2>
        <button 
          className={styles.seeMoreButton}
          onClick={() => navigate('/posts')}
        >
          Все посты
          <ArrowUpRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <p>Загрузка постов...</p>
        </div>
      ) : (
        <div className={styles.postsGrid}>
          {posts.map((post) => (
            <motion.div
              key={post.id}
              className={styles.postCard}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => navigate(`/posts/${post.id}`)}
            >
              {/* Заголовок поста */}
              <div className={styles.postHeader}>
                <div className={styles.authorInfo}>
                  {post.author_avatar ? (
                    <img 
                      src={post.author_avatar.startsWith('http') ? post.author_avatar : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${post.author_avatar}`} 
                      alt={post.author_name}
                      className={styles.authorAvatar}
                    />
                  ) : (
                    <div className={styles.defaultAvatar} />
                  )}
                  <div>
                    <div className={styles.authorName}>{post.author_name}</div>
                    <div className={styles.postDate}>{formatDate(post.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Контент поста */}
              <div className={styles.postContent}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <p className={styles.postText}>
                  {post.content.length > 150 
                    ? `${post.content.substring(0, 150)}...` 
                    : post.content
                  }
                </p>
              </div>

              {/* Изображение если есть */}
              {post.image_url && (
                <div className={styles.postImage}>
                  <img 
                    src={post.image_url.startsWith('http') ? post.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${post.image_url}`} 
                    alt={post.title}
                  />
                </div>
              )}

              {/* Статистика */}
              <div className={styles.postStats}>
                <div className={styles.stat}>
                  <Heart size={14} />
                  <span>{post.likes_count}</span>
                </div>
                <div className={styles.stat}>
                  <MessageCircle size={14} />
                  <span>{post.comments_count}</span>
                </div>
                <div className={styles.stat}>
                  <Bookmark size={14} />
                  <span>{post.bookmarks_count}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HomePostsPreview;
