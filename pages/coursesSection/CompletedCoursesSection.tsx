import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfile } from "../../context/ProfileContext";
import { apiClient } from "../../lib/apiClient";
import styles from "./CompletedCoursesSection.module.css";
import { Trophy, Clock, Star, Calendar } from "lucide-react";

interface CompletedCourse {
  id: string;
  course_id: string;
  time_spent: number;
  total_time: number;
  progress_percentage: number;
  status: 'completed';
  points_earned: number;
  completed_at: string;
}

const CompletedCoursesSection: React.FC = () => {
  const { profile } = useProfile();
  const [courses, setCourses] = useState<CompletedCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);

  useEffect(() => {
    const fetchCompletedCourses = async () => {
      if (!profile?.id) {
        setLoading(false);
        return;
      }

      try {
        const response = await apiClient.get('/courses/completed', {
          params: { user_id: profile.id }
        });
        const data = response.data || [];
        
        const points = data.reduce((sum: number, course: any) => 
          sum + (course.points_earned || 0), 0);
        
        setCourses(data);
        setTotalPoints(points);
      } catch (error) {
        console.error("Error fetching completed courses:", error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedCourses();
  }, [profile?.id]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Trophy size={24} className={styles.icon} />
        <h2>Завершенные курсы</h2>
        <div className={styles.totalPoints}>
          <Star size={16} />
          <span>Всего очков: {totalPoints}</span>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className={styles.emptyState}>
          <Clock size={48} />
          <p>У вас пока нет завершенных курсов</p>
          <button 
            className={styles.browseButton}
            onClick={() => window.location.href = '/courses'}
          >
            Перейти к курсам
          </button>
        </div>
      ) : (
        <div className={styles.coursesList}>
          {courses.map((course) => (
            <div key={course.id} className={styles.courseCard}>
              <div className={styles.courseInfo}>
                <h3>{course.course_id}</h3>
                <div className={styles.stats}>
                  <div className={styles.stat}>
                    <Clock size={16} />
                    <span>Время: {Math.floor(course.time_spent / 3600)}ч</span>
                  </div>
                  <div className={styles.stat}>
                    <Trophy size={16} />
                    <span>Очки: {course.points_earned}</span>
                  </div>
                </div>
              </div>
              <div className={styles.completionDate}>
                <Calendar size={16} />
                <span>
                  Завершено: {new Date(course.completed_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompletedCoursesSection;
