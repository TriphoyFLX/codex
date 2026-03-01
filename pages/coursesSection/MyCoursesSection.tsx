import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";
import { useProfile } from "../../context/ProfileContext";
import styles from "./MyCoursesSection.module.css";
import { BookOpen, Clock, ArrowRight, Calendar, CheckCircle, Play, Pause } from "lucide-react";

interface CourseApplication {
  id: string;
  course_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  course_name: string;
  course_description: string;
  course_image_url?: string;
  course_duration?: string;
  course_price?: number;
  course_grades?: string[];
}

const MyCoursesSection: React.FC = () => {
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<CourseApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyApplications = async () => {
      console.log('MyCoursesSection: profile:', profile);
      console.log('MyCoursesSection: profile.id:', profile?.id);
      
      if (!profile?.id) {
        console.log('MyCoursesSection: No profile found, skipping fetch');
        setLoading(false);
        return;
      }

      try {
        console.log('MyCoursesSection: Fetching applications...');
        const response = await apiClient.get('/courses/my-applications');
        console.log('MyCoursesSection: Response:', response.data);
        setApplications(response.data);
      } catch (error) {
        console.error('MyCoursesSection: Error fetching my courses:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMyApplications();
  }, [profile]);

  const getStatusText = (status: string) => {
    switch (status) {
      case "approved": return "Вы проходите курс";
      case "pending": return "Заявка на рассмотрении";
      case "rejected": return "Заявка отклонена";
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved": return <CheckCircle size={14} />;
      case "pending": return <Calendar size={14} />;
      case "rejected": return <Pause size={14} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "#10b981";
      case "pending": return "#f59e0b";
      case "rejected": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (!profile) return null;

  if (loading) {
    return <div className={styles.loading}>Загрузка ваших курсов...</div>;
  }

  return (
    <div className={styles.myCoursesSection}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <BookOpen size={28} className={styles.icon} />
          <h2>Мои курсы</h2>
          {applications.length > 0 && (
            <span className={styles.counter}>{applications.length}</span>
          )}
        </div>
        
        {applications.length > 0 && (
          <button 
            className={styles.viewAllButton}
            onClick={() => navigate('/my-courses')}
          >
            Все курсы
            <ArrowRight size={18} />
          </button>
        )}
      </div>

      {applications.length === 0 ? (
        <div className={styles.emptyState}>
          <BookOpen size={48} className={styles.emptyIcon} />
          <h3>У вас пока нет курсов</h3>
          <p>Подайте заявку на интересующие вас курсы</p>
          <button 
            className={styles.browseButton}
            onClick={() => navigate('/courses')}
          >
            Найти курсы
          </button>
        </div>
      ) : (
        <div className={styles.coursesGrid}>
          {applications.map((application) => (
            <div 
              key={application.id} 
              className={styles.courseCard}
              onClick={() => navigate(`/course/${application.course_id}`)}
            >
              <div className={styles.cardHeader}>
                <div className={styles.courseImage}>
                  {application.course_image_url ? (
                    <img 
                      src={application.course_image_url.startsWith('http') 
                        ? application.course_image_url 
                        : `${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}${application.course_image_url}`} 
                      alt={application.course_name} 
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <BookOpen size={24} />
                    </div>
                  )}
                </div>
                <div 
                  className={styles.statusBadge}
                  style={{ color: getStatusColor(application.status) }}
                >
                  {getStatusIcon(application.status)}
                  {getStatusText(application.status)}
                </div>
              </div>
              
              <div className={styles.cardContent}>
                <h3>{application.course_name}</h3>
                <p className={styles.description}>
                  {application.course_description}
                </p>
                
                <div className={styles.metaInfo}>
                  {application.course_duration && (
                    <span className={styles.metaItem}>
                      <Clock size={14} />
                      {application.course_duration}
                    </span>
                  )}
                  {application.course_price && (
                    <span className={styles.metaItem}>
                      {application.course_price} ₽
                    </span>
                  )}
                  {application.course_grades && application.course_grades.length > 0 && (
                    <span className={styles.metaItem}>
                      {application.course_grades.join(', ')}
                    </span>
                  )}
                </div>
              </div>
              
              {application.status === "approved" && (
                <div className={styles.cardActions}>
                  <button className={styles.continueButton}>
                    <Play size={16} />
                    Перейти к курсу
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCoursesSection;