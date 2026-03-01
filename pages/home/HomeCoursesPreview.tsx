import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "../../lib/apiClient";
import { useNavigate } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import styles from "./HomeCoursesPreview.module.css";

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

const HomeCoursesPreview: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/courses');
      const allCourses = response.data as Course[];
      // Показываем только первые 2 курса
      setCourses(allCourses.slice(0, 2));
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <section className={styles.coursesPreview}>
      <div className={styles.sectionHeader}>
        <h2>Курсы от школы</h2>
        <button 
          className={styles.seeMoreButton}
          onClick={() => navigate('/courses')}
        >
          Смотреть все курсы
          <ArrowUpRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <p>Загрузка курсов...</p>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
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
                    <ArrowUpRight className={styles.arrowIcon} size={20} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeCoursesPreview;
