// src/components/posts/PostsSection.tsx
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Plus, Image as ImageIcon, Hash } from "lucide-react";
import { apiClient } from "../../lib/apiClient";
import { useMyPosts, Post } from "../../hooks/usePosts";
import Avatar from "../../components/Avatar";
import { getImageUrl } from "../../lib/imageUrl";
import styles from "./PostsSection.module.css";

const PostsSection: React.FC = () => {
  const getUserId = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.userId;
    } catch {
      return null;
    }
  };

  const userId = getUserId();
  const { posts, setPosts } = useMyPosts(userId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setImagePreview("");
      setImageFile(null);
      return;
    }
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      alert("Можно загружать только изображения: PNG, JPG, JPEG, GIF");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setImageFile(file);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || '${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}/api'}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки изображения');
      }

      const data = await response.json();
      return data.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const addPost = async () => {
    const userId = getUserId();
    if (!userId) return alert("Пользователь не найден");
    if (!title.trim()) return alert("Название поста обязательно!");
    setLoading(true);
    try {
      let image_url = "";
      if (imageFile) image_url = await uploadImage(imageFile);

      const newPost = {
        author_id: userId,
        title: title.trim(),
        content: description.trim(),
        image_url,
        hashtags: hashtags
          .split(",")
          .map((h) => h.trim().replace("#", ""))
          .filter(Boolean),
      };

      const response = await apiClient.post('/posts', newPost);
      setPosts([response.data as Post, ...posts]);
      resetForm();
    } catch (err) {
      console.error("addPost error:", err);
      alert("Ошибка при добавлении поста");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setHashtags("");
    setImageFile(null);
    setImagePreview("");
    setIsFormOpen(false);
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Удалить этот пост?")) return;
    try {
      await apiClient.delete(`/posts/${postId}`, {
        data: { user_id: userId }
      });
      setPosts(posts.filter((p) => p.id !== postId));
    } catch (error) {
      console.error(error);
      alert("Ошибка при удалении поста");
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <motion.div className={styles.header} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className={styles.title}>Мои посты</h1>
        <motion.button className={styles.addButton} onClick={() => setIsFormOpen(!isFormOpen)} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Plus size={20} /> Новый пост
        </motion.button>
      </motion.div>

      {/* Form */}
      <AnimatePresence>
        {isFormOpen && (
          <motion.div className={styles.newPost} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
            <div className={styles.form}>
              <div className={styles.formGroup}>
                <input type="text" placeholder="Название поста" value={title} onChange={(e) => setTitle(e.target.value)} className={styles.input} />
              </div>
              <div className={styles.formGroup}>
                <textarea placeholder="Описание" value={description} onChange={(e) => setDescription(e.target.value)} className={styles.textarea} rows={3} />
              </div>
              <div className={styles.formGroup}>
                <div className={styles.hashtagInput}>
                  <Hash size={16} className={styles.hashtagIcon} />
                  <input type="text" placeholder="Хэштеги через запятую" value={hashtags} onChange={(e) => setHashtags(e.target.value)} className={styles.input} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.fileLabel}>
                  <ImageIcon size={20} />
                  <span>Загрузить изображение</span>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0] || null)} className={styles.fileInput} />
                </label>
                {imagePreview && (
                  <motion.div className={styles.imagePreview} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <img src={imagePreview} alt="Preview" />
                    <button onClick={() => handleFileChange(null)} className={styles.removeImage}>×</button>
                  </motion.div>
                )}
              </div>

              <div className={styles.formActions}>
                <button onClick={resetForm} className={styles.cancelButton} type="button">Отмена</button>
                <button onClick={addPost} disabled={loading || !title.trim()} className={styles.submitButton}>
                  {loading ? "Публикуем..." : (<><Plus size={16}/> Опубликовать</>)}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Posts grid */}
      <motion.div className={styles.postsGrid} initial="hidden" animate="visible">
        <AnimatePresence>
          {posts.map((post) => (
            <motion.div key={post.id} layout className={styles.postCard}>
              <div className={styles.postHeader}>
                <h3 className={styles.postTitle}>{post.title}</h3>
                <motion.button className={styles.deleteButton} onClick={() => deletePost(post.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <Trash2 size={16} />
                </motion.button>
              </div>

              {post.content && <p className={styles.postDescription}>{post.content}</p>}

              {post.image_url && (
                <div className={styles.imageContainer}>
                  <img src={post.image_url.startsWith('http') ? post.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${post.image_url}`} alt={post.title} className={styles.postImage} loading="lazy" />
                </div>
              )}

              {post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0 && (
                <div className={styles.hashtags}>
                  {post.hashtags.map((tag: string, i: number) => (<span key={i} className={styles.hashtag}>#{tag}</span>))}
                </div>
              )}

              <div className={styles.postFooter}>
                <div className={styles.author}>
                  <Avatar
                    src={getImageUrl(post.author_avatar_url)}
                    firstName={post.author_first_name || undefined}
                    lastName={post.author_last_name || undefined}
                    size="small"
                  />
                  <span className={styles.authorName}>{post.author_first_name || "Имя"} {post.author_last_name || "Фамилия"}</span>
                </div>
                <span className={styles.postDate}>{new Date(post.created_at).toLocaleDateString("ru-RU")}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {posts.length === 0 && !isFormOpen && (
        <motion.div className={styles.emptyState} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <ImageIcon size={48} className={styles.emptyIcon} />
          <h3>Пока нет постов</h3>
          <p>Создайте свой первый пост!</p>
        </motion.div>
      )}
    </div>
  );
};

export default PostsSection;