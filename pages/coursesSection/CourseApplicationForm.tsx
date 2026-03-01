import React, { useState } from 'react';
import { CheckCircle, Clock, Tag, BookOpen, ArrowUpRight } from 'lucide-react';
import styles from './CourseApplicationForm.module.css';

interface CourseApplicationFormProps {
  course: {
    id: string;
    name: string;
    description: string;
    image_url?: string;
    duration?: string;
    price?: number;
    grades?: string[];
  };
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; phone: string }) => void;
}

const CourseApplicationForm: React.FC<CourseApplicationFormProps> = ({ 
  course, 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.phone.trim()) {
      alert('Пожалуйста, заполните все поля');
      return;
    }

    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Заявка на курс</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>

        <div className={styles.courseInfo}>
          <div className={styles.courseImage}>
            {course.image_url ? (
              <img 
                src={course.image_url.startsWith('http') ? course.image_url : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${course.image_url}`} 
                alt={course.name} 
              />
            ) : (
              <div className={styles.placeholderImage}>
                <BookOpen size={48} />
              </div>
            )}
          </div>
          
          <div className={styles.courseDetails}>
            <h3>{course.name}</h3>
            <p>{course.description}</p>
            
            <div className={styles.courseMeta}>
              {course.grades && course.grades.length > 0 && (
                <div className={styles.metaItem}>
                  <Tag size={16} />
                  Классы: {course.grades.join(', ')}
                </div>
              )}
              
              {course.duration && (
                <div className={styles.metaItem}>
                  <Clock size={16} />
                  Продолжительность: {course.duration}
                </div>
              )}
              
              {course.price && (
                <div className={styles.metaItem}>
                  Цена: {course.price} ₽
                </div>
              )}
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.applicationForm}>
          <div className={styles.formGroup}>
            <label>Ваше имя *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Иван Иванов"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Телефон *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+7 (999) 123-45-67"
              required
            />
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              Подать заявку
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseApplicationForm;
