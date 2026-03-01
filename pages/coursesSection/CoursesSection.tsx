import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "../../lib/apiClient";
import { useProfile } from "../../context/ProfileContext";
import { useNavigate } from "react-router-dom";
import styles from "./CoursesSection.module.css";
import { ArrowUpRight } from "lucide-react";

interface Course {
  id: string;
  name: string;
  description: string;
  grades: string[] | null;
  price: number | null;
  duration: string | null;
  teacher_id: string | null;
  school_id: string | null;
  active: boolean;
  created_at: string;
  image_url?: string | null;
}

const CoursesSection: React.FC = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    grades: "",
    price: "",
    duration: "",
    image: null as File | null,
    imagePreview: "",
    active: true,
  });

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/courses');
      setCourses(response.data as Course[]);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleImageChange = (file: File | null) => {
    if (!file) {
      setFormData({ ...formData, image: null, imagePreview: "" });
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setFormData({ ...formData, image: file, imagePreview: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setFormData({ 
      name: "", 
      description: "", 
      grades: "", 
      price: "", 
      duration: "", 
      image: null, 
      imagePreview: "", 
      active: true 
    });
    setShowForm(false);
  };

  const uploadCourseImage = async (file: File): Promise<string> => {
    console.log('Starting upload for file:', file.name, 'size:', file.size);
    
    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('Sending request to: /courses/upload-image');
      
      const response = await fetch('${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}/api/courses/upload-image', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(errorText || 'Ошибка загрузки изображения курса');
      }

      const data = await response.json();
      console.log('Upload successful, URL:', data.imageUrl);
      return data.imageUrl;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleAddCourse = async () => {
    if (!formData.name.trim()) return;
    if (!profile.school_id) return alert("Учитель должен быть привязан к школе!");

    let imageUrl = '';
    if (formData.image) {
      try {
        imageUrl = await uploadCourseImage(formData.image);
      } catch (error) {
        alert('Ошибка при загрузке изображения');
        return;
      }
    }

    const newCourse = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      grades: formData.grades ? formData.grades.split(",").map(g => g.trim()) : [],
      price: formData.price ? parseFloat(formData.price) : null,
      duration: formData.duration.trim() || null,
      teacher_id: profile.id,
      school_id: profile.school_id,
      active: formData.active,
      image_url: imageUrl || null,
    };

    console.log('Creating course with data:', newCourse);

    try {
      const response = await apiClient.post('/courses', newCourse);
      setCourses([response.data as Course, ...courses]);
      resetForm();
    } catch (error) {
      console.error("Ошибка добавления курса:", error);
    }
  };

  return (
    <div className={styles.coursesSection}>
      <div className={styles.coursesHeader}>
        <h2>Курсы от школы</h2>
        {profile.role === "teacher" && (
          <button className={styles.addCourseButton} onClick={() => setShowForm(!showForm)}>
            {showForm ? "Скрыть" : "Добавить курс"}
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            className={styles.addCourseForm}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <input
              placeholder="Название курса *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <textarea
              placeholder="Краткое описание"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <input
              placeholder="Классы (напр: 7-11 классы)"
              value={formData.grades}
              onChange={(e) => setFormData({ ...formData, grades: e.target.value })}
            />
            <div className={styles.rowInputs}>
              <input
                placeholder="Цена (₽)"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
              <input
                placeholder="Время (напр: 35 мин)"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              />
            </div>
            <div className={styles.imageUploadSection}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageChange(e.target.files?.[0] || null)}
                className={styles.fileInput}
              />
              {formData.imagePreview && (
                <div className={styles.imagePreview}>
                  <img src={formData.imagePreview} alt="Preview" />
                  <button 
                    type="button"
                    className={styles.removeImage}
                    onClick={() => handleImageChange(null)}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className={styles.formActions}>
              <button className={styles.cancelButton} onClick={() => setShowForm(false)}>Отмена</button>
              <button onClick={handleAddCourse} className={styles.confirmButton}>Опубликовать</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? <p>Загрузка...</p> : (
        <div className={styles.cardsWrapper}>
          {courses.map((course) => (
            <motion.div
              key={course.id}
              className={styles.courseCard}
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => navigate(`/course/${course.id}`)}
            >
              {/* Фон */}
              <div className={styles.cardBackground}>
                {course.image_url ? (
                  <img src={course.image_url.startsWith('http') ? course.image_url : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${course.image_url}`} alt={course.name} />
                ) : (
                  <div className={styles.placeholderGradient} />
                )}
                <div className={styles.gradientOverlay} />
              </div>

              {/* Контент */}
              <div className={styles.cardInner}>
                {/* Верх: Теги */}
                <div className={styles.topTags}>
                  {course.duration && <span className={styles.badge}>{course.duration}</span>}
                  {course.grades && course.grades.map((g, i) => (
                    <span key={i} className={styles.badge}>{g}</span>
                  ))}
                  {!course.active && <span className={`${styles.badge} ${styles.inactive}`}>Не активен</span>}
                </div>

                {/* Низ: Инфо + Кнопка */}
                <div className={styles.bottomRow}>
                  <div className={styles.textContent}>
                    <h3>{course.name}</h3>
                    <p>{course.description}</p>
                    {course.price && <span className={styles.priceText}>{course.price} ₽</span>}
                  </div>
                  
                  <div className={styles.iconWrapper}>
                    <ArrowUpRight className={styles.arrowIcon} size={24} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CoursesSection;