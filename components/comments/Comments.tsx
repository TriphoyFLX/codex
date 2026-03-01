import React, { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import Avatar from '../Avatar';
import styles from './Comments.module.css';

interface Comment {
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

interface CommentsProps {
  postId: string;
  comments: Comment[];
  onAddComment: (postId: string, content: string) => void;
  onClose: () => void;
}

export default function Comments({ postId, comments, onAddComment, onClose }: CommentsProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAddComment(postId, newComment.trim());
      setNewComment('');
    }
  };

  return (
    <div className={styles.commentsOverlay}>
      <div className={styles.commentsModal}>
        <div className={styles.commentsHeader}>
          <h3>Комментарии ({comments.length})</h3>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.commentsList}>
          {comments.length === 0 ? (
            <div className={styles.noComments}>
              <MessageCircle size={48} />
              <p>Пока нет комментариев</p>
              <p>Будьте первым, кто оставит комментарий!</p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className={styles.comment}>
                <div className={styles.commentAuthor}>
                  <Avatar
                    src={
                      comment.author_avatar_url?.startsWith('http')
                        ? comment.author_avatar_url
                        : comment.author_avatar_url
                        ? `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${comment.author_avatar_url}`
                        : undefined
                    }
                    firstName={comment.author_first_name || undefined}
                    lastName={comment.author_last_name || undefined}
                    size="small"
                  />
                  <div className={styles.commentAuthorInfo}>
                    <span className={styles.commentAuthorName}>
                      {comment.author_first_name} {comment.author_last_name}
                    </span>
                    <span className={styles.commentDate}>
                      {new Date(comment.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>
                <div className={styles.commentContent}>{comment.content}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className={styles.commentForm}>
          <div className={styles.inputWrapper}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Написать комментарий..."
              className={styles.commentInput}
            />
            <button type="submit" className={styles.sendButton} disabled={!newComment.trim()}>
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
