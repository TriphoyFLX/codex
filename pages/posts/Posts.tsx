import { useState, useEffect } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { useProfile } from '../../context/ProfileContext';
import { Heart, MessageCircle, Share2, Bookmark, TrendingUp, Clock, Filter, Search, Plus, Calendar, Image, X, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Avatar from '../../components/Avatar';
import styles from './PostsPage.module.css';
import Comments from '../../components/comments/Comments';
import { Comment } from '../../hooks/usePosts';

export default function Posts() {
  const { profile } = useProfile();
  const navigate = useNavigate();
  console.log('Profile in Posts component:', profile?.id);
  const { posts, loading, createPost, likePost, bookmarkPost, deletePost, getComments, addComment, getLocalStats, clearLocalData } = usePosts(profile?.id);
  
  useEffect(() => {
    console.log('Profile changed in Posts component:', profile?.id);
  }, [profile?.id]);

  // Отладочная информация
  const localStats = profile?.id ? getLocalStats(profile.id) : null;
  console.log('Local stats:', localStats);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showComments, setShowComments] = useState<{ postId: string; comments: Comment[] } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [sortBy, setSortBy] = useState('latest');
  const [newPost, setNewPost] = useState({
    title: '',
    content: '',
    hashtags: '',
    image_url: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Фильтрация и сортировка постов
  const filteredPosts = posts
    .filter(post => {
      const matchesSearch = !searchQuery || 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.hashtags?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFilter = selectedFilter === 'all' ||
        (selectedFilter === 'liked' && post.is_liked) ||
        (selectedFilter === 'bookmarked' && post.is_bookmarked) ||
        (selectedFilter === 'my' && post.author_id === profile?.id);
      
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'latest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'popular':
          return (b.likes_count || 0) - (a.likes_count || 0);
        case 'commented':
          return (b.comments_count || 0) - (a.comments_count || 0);
        default:
          return 0;
      }
    });

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      alert('Пожалуйста, заполните заголовок и содержание поста');
      return;
    }

    if (!profile?.id) {
      alert('Необходимо авторизоваться для создания поста');
      return;
    }

    try {
      setIsUploading(true);
      let imageUrl = newPost.image_url;

      // Если есть выбранный файл, загружаем его
      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      await createPost({
        title: newPost.title,
        content: newPost.content,
        hashtags: newPost.hashtags,
        image_url: imageUrl,
        author_id: profile.id
      });
      
      // Сбрасываем форму
      setNewPost({ title: '', content: '', hashtags: '', image_url: '' });
      setSelectedFile(null);
      setImagePreview(null);
      setShowCreateModal(false);
    } catch (error) {
      alert('Ошибка при создании поста: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!profile?.id) return;
    try {
      await likePost(postId, profile.id);
    } catch (error) {
      console.error('Ошибка лайка:', error);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!profile?.id) return;
    try {
      await bookmarkPost(postId, profile.id);
    } catch (error) {
      console.error('Ошибка закладки:', error);
    }
  };

  const handleShare = (post: any) => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Ссылка скопирована!');
    }
  };

  const handleShowComments = async (postId: string) => {
    try {
      const comments = await getComments(postId);
      setShowComments({ postId, comments });
    } catch (error) {
      console.error('Ошибка загрузки комментариев:', error);
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!profile?.id) return;
    
    try {
      const newComment = await addComment(postId, profile.id, content);
      
      // Update comments in modal
      if (showComments && showComments.postId === postId) {
        setShowComments({
          ...showComments,
          comments: [...showComments.comments, newComment]
        });
      }
    } catch (error) {
      console.error('Ошибка добавления комментария:', error);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Проверяем, что это изображение
      if (!file.type.startsWith('image/')) {
        alert('Пожалуйста, выберите изображение');
        return;
      }

      // Проверяем размер файла (максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Размер файла не должен превышать 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Создаем превью
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://85.198.70.191/api'}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  };

  const handleDelete = async (postId: string) => {
    if (!profile?.id) return;
    
    if (window.confirm('Вы уверены, что хотите удалить этот пост?')) {
      try {
        await deletePost(postId, profile.id);
      } catch (error) {
        alert('Ошибка при удалении поста: ' + (error instanceof Error ? error.message : 'Неизвестная ошибка'));
      }
    }
  };

  const clearImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setNewPost(prev => ({ ...prev, image_url: '' }));
  };

  const handleAuthorClick = (authorId: string) => {
    navigate(`/profile/${authorId}`);
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка постов...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <h1 className={styles.pageTitle}>Посты сообщества</h1>
            <p className={styles.subtitle}>Делитесь знаниями и общайтесь</p>
          </div>
          
          {profile && (
            <div className={styles.headerActions}>
              {localStats && (
                <div className={styles.localStats}>
                  <span className={styles.localStatItem} title="Понравившиеся">
                    <Heart size={14} />
                    {localStats.likedCount}
                  </span>
                  <span className={styles.localStatItem} title="Сохраненные">
                    <Bookmark size={14} />
                    {localStats.bookmarkedCount}
                  </span>
                </div>
              )}
              <button 
                className={styles.createButton}
                onClick={() => setShowCreateModal(true)}
              >
                <Plus size={20} />
                Создать пост
              </button>
              {process.env.NODE_ENV === 'development' && (
                <button
                  onClick={() => {
                    if (profile?.id) {
                      clearLocalData(profile.id);
                      window.location.reload();
                    }
                  }}
                  className={styles.devDangerButton}
                >
                  Очистить localStorage
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Фильтры и поиск */}
      <div className={styles.filtersSection}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск постов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <Filter size={16} className={styles.filterIcon} />
            <select 
              value={selectedFilter} 
              onChange={(e) => setSelectedFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Все посты</option>
              <option value="my">Мои посты</option>
              <option value="liked">Понравившиеся</option>
              <option value="bookmarked">Сохраненные</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <TrendingUp size={16} className={styles.filterIcon} />
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="latest">Новые</option>
              <option value="popular">Популярные</option>
              <option value="commented">Обсуждаемые</option>
            </select>
          </div>
        </div>
      </div>

      {/* Статистика */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>{posts.length}</div>
          <div className={styles.statLabel}>Всего постов</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)}
          </div>
          <div className={styles.statLabel}>Лайков</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statNumber}>
            {posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)}
          </div>
          <div className={styles.statLabel}>Комментариев</div>
        </div>
      </div>

      {/* Сетка постов */}
      <div className={styles.postsGrid}>
        {filteredPosts.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <MessageCircle size={48} />
            </div>
            <h3>Посты не найдены</h3>
            <p>Попробуйте изменить параметры поиска или Фильтры</p>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              {/* Изображение поста */}
              {post.image_url && (
                <div className={styles.postImage}>
                  <img 
                    src={post.image_url.startsWith('http') ? post.image_url : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${post.image_url}`} 
                    alt={post.title} 
                  />
                  <div className={styles.imageOverlay}></div>
                </div>
              )}

              {/* Контент поста */}
              <div className={styles.postContent}>
                <div className={styles.postHeader}>
                  <div className={styles.authorInfo}>
                    <button
                      className={styles.authorAvatarButton}
                      onClick={() => handleAuthorClick(post.author_id)}
                      title="Перейти в профиль"
                    >
                      <Avatar
                        src={post.author_avatar_url?.startsWith('http') ? post.author_avatar_url : post.author_avatar_url ? `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${post.author_avatar_url}` : undefined}
                        firstName={post.author_first_name || undefined}
                        lastName={post.author_last_name || undefined}
                        size="small"
                      />
                    </button>
                    <div className={styles.authorDetails}>
                      <button
                        className={styles.authorNameButton}
                        onClick={() => handleAuthorClick(post.author_id)}
                        title="Перейти в профиль"
                      >
                        <span className={styles.authorName}>
                          {post.author_first_name} {post.author_last_name}
                        </span>
                      </button>
                      <div className={styles.postMeta}>
                        <Calendar size={12} />
                        <span>{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.postActions}>
                    <button 
                      className={`${styles.actionButton} ${post.is_liked ? styles.liked : ''}`}
                      onClick={() => handleLike(post.id)}
                      title="Нравится"
                    >
                      <Heart size={16} fill={post.is_liked ? 'currentColor' : 'none'} />
                      <span>{post.likes_count || 0}</span>
                    </button>
                    
                    <button 
                      className={`${styles.actionButton} ${post.is_bookmarked ? styles.bookmarked : ''}`}
                      onClick={() => handleBookmark(post.id)}
                      title="Сохранить"
                    >
                      <Bookmark size={16} fill={post.is_bookmarked ? 'currentColor' : 'none'} />
                    </button>
                    
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleShare(post)}
                      title="Поделиться"
                    >
                      <Share2 size={16} />
                    </button>
                    
                    {post.author_id === profile?.id && (
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        onClick={() => handleDelete(post.id)}
                        title="Удалить пост"
                      >
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <h2 className={styles.postTitle}>{post.title}</h2>
                
                {post.content && (
                  <p className={styles.postDescription}>{post.content}</p>
                )}
                
                {post.hashtags && (
                  <div className={styles.postTags}>
                    {post.hashtags.split(',').map((tag, i) => (
                      <span key={i} className={styles.tag}>#{tag.trim()}</span>
                    ))}
                  </div>
                )}

                {/* Статистика поста */}
                <div className={styles.postStats}>
                  <button 
                    className={styles.statItem}
                    onClick={() => handleShowComments(post.id)}
                    title="Комментарии"
                  >
                    <MessageCircle size={14} />
                    <span>{post.comments_count || 0}</span>
                  </button>
                  <div className={styles.statItem}>
                    <Heart size={14} />
                    <span>{post.likes_count || 0}</span>
                  </div>
                  <div className={styles.statItem}>
                    <Clock size={14} />
                    <span>{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Модальное окно создания поста */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Создать пост</h2>
              <button 
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className={styles.modalContent}>
              <div className={styles.formGroup}>
                <label>Заголовок</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  className={styles.formInput}
                  placeholder="Введите заголовок поста..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Содержание</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  className={styles.formTextarea}
                  placeholder="Поделитесь своими мыслями..."
                  rows={6}
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Теги (через запятую)</label>
                <input
                  type="text"
                  value={newPost.hashtags}
                  onChange={(e) => setNewPost({...newPost, hashtags: e.target.value})}
                  className={styles.formInput}
                  placeholder="программирование, учеба, it"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Изображение (необязательно)</label>
                
                {/* Превью изображения */}
                {(imagePreview || newPost.image_url) && (
                  <div className={styles.imagePreview}>
                    <img 
                      src={imagePreview || (newPost.image_url.startsWith('http') ? newPost.image_url : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${newPost.image_url}`)} 
                      alt="Превью" 
                    />
                    <button 
                      type="button"
                      onClick={clearImage}
                      className={styles.removeImageButton}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
                
                {/* Кнопка загрузки файла */}
                <div className={styles.fileUploadContainer}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className={styles.fileInput}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className={styles.fileUploadButton}>
                    <Image size={16} />
                    Выбрать изображение
                  </label>
                  <span className={styles.fileInfo}>
                    {selectedFile ? selectedFile.name : 'Макс. размер: 5MB'}
                  </span>
                </div>
                
                {/* Или ввести URL вручную */}
                <div className={styles.urlInputContainer}>
                  <span className={styles.urlLabel}>или вставьте ссылку:</span>
                  <input
                    type="url"
                    value={newPost.image_url}
                    onChange={(e) => setNewPost({...newPost, image_url: e.target.value})}
                    className={styles.formInput}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setShowCreateModal(false)}
              >
                Отмена
              </button>
              <button 
                className={styles.submitButton}
                onClick={handleCreatePost}
                disabled={isUploading}
              >
                {isUploading ? 'Загрузка...' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно комментариев */}
      {showComments && (
        <Comments
          postId={showComments.postId}
          comments={showComments.comments}
          onAddComment={handleAddComment}
          onClose={() => setShowComments(null)}
        />
      )}
    </div>
  );
}
