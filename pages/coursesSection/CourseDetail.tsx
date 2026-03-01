import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";
import { useProfile } from "../../context/ProfileContext";
import styles from "./CourseDetail.module.css";
import { CheckCircle, Clock, Tag, ArrowUpRight, Play, Settings } from "lucide-react";
import CourseApplicationForm from "./CourseApplicationForm";

const CourseDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<{
    hasApplication: boolean;
    status?: string;
    applicationId?: string;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      try {
        // Получаем информацию о курсе через наш API
        const response = await apiClient.get(`/courses/${id}`);
        setCourse(response.data);
        
        // Проверяем статус заявки пользователя
        if (profile) {
          try {
            const statusResponse = await apiClient.get(`/courses/${id}/application-status`);
            setApplicationStatus(statusResponse.data);
          } catch (error) {
            // Если запрос не удался, считаем что заявки нет
            setApplicationStatus({ hasApplication: false });
          }
        }
      } catch (error) {
        console.error('Error fetching course:', error);
      }
      
      setLoading(false);
    };
    
    fetchData();
  }, [id, profile]);

  const handleApplicationSubmit = async (data: { name: string; phone: string }) => {
    try {
      // Получаем ID пользователя из localStorage
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('user');
      if (!token || !userStr) {
        alert('Необходимо войти в систему');
        navigate('/login');
        return;
      }

      const user = JSON.parse(userStr);
      
      // Отправляем заявку на курс
      await apiClient.post('/courses/apply', {
        courseId: id,
        userId: user.id,
        name: data.name,
        phone: data.phone
      });

      alert('Заявка успешно отправлена! Ожидайте рассмотрения администратора.');
      
      // Обновляем статус заявки после отправки
      setApplicationStatus({ hasApplication: true, status: 'pending' });
      setShowApplicationForm(false);
    } catch (error: any) {
      console.error('Error submitting application:', error);
      if (error.response?.data?.error) {
        alert(error.response.data.error);
      } else {
        alert('Ошибка при отправке заявки');
      }
    }
  };

  const getStatusMessage = () => {
    if (!applicationStatus?.hasApplication) return null;
    
    switch (applicationStatus.status) {
      case 'pending':
        return 'Заявка на рассмотрении';
      case 'approved':
        return 'Вы проходите курс';
      case 'rejected':
        return 'Заявка отклонена';
      default:
        return 'Статус заявки неизвестен';
    }
  };

  if (loading) return <p className={styles.loading}>Загрузка курса...</p>;
  if (!course) return <p className={styles.loading}>Курс не найден</p>;

  return (
    <div className={styles.pageWrapper}>
      {/* Секция с деталями курса */}
      <div className={styles.hero}>
        {course.image_url && (
          <img 
            src={course.image_url.startsWith('http') ? course.image_url : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://85.198.70.191'}${course.image_url}`} 
            alt={course.name} 
            className={styles.heroImage} 
          />
        )}
        <div className={styles.heroOverlay}>
          <h1 className={styles.title}>{course.name}</h1>
          {course.active && <span className={styles.activeBadge}><CheckCircle size={20}/> Активен</span>}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.info}>
          <h2>Описание курса</h2>
          <p>{course.description}</p>

          <div className={styles.meta}>
            {course.grades && (
              <div className={styles.metaItem}>
                <Tag size={16}/> Классы: {Array.isArray(course.grades) ? course.grades.join(", ") : course.grades}
              </div>
            )}
            {course.duration && (
              <div className={styles.metaItem}>
                <Clock size={16}/> Продолжительность: {course.duration}
              </div>
            )}
            <div className={styles.metaItem}>
              Цена: {course.price ? `${course.price} ₽` : "Бесплатно"}
            </div>
            <div className={styles.metaItem}>
              Статус: {course.active ? "Активен" : "Неактивен"}
            </div>
          </div>
        </div>

        <div className={styles.actions}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            <ArrowUpRight size={18} style={{ transform: 'rotate(-90deg)' }} />
            Назад к курсам
          </button>
          
          {/* Кнопки для учителей */}
          {profile?.role === 'teacher' && (
            <>
              <button 
                className={styles.manageButton}
                onClick={() => navigate(`/course/${id}/content`)}
              >
                <Settings size={16} />
                Управление контентом
              </button>
              
              <button 
                className={styles.viewButton}
                onClick={() => navigate(`/course/${id}/view`)}
              >
                <Play size={16} />
                Просмотр курса
              </button>
            </>
          )}
          
          {/* Кнопка для студентов с одобренной заявкой */}
          {applicationStatus?.status === 'approved' && (
            <button 
              className={styles.viewButton}
              onClick={() => navigate(`/course/${id}/view`)}
            >
              <Play size={16} />
                Перейти к курсу
            </button>
          )}
          
          {applicationStatus?.hasApplication ? (
            <div className={styles.applicationStatus} data-status={applicationStatus.status}>
              <span className={styles.statusText}>
                {getStatusMessage()}
              </span>
              {applicationStatus.status === 'approved' && (
                <CheckCircle size={16} className={styles.statusIcon} />
              )}
              {applicationStatus.status === 'pending' && (
                <Clock size={16} className={styles.statusIcon} />
              )}
            </div>
          ) : (
            <button 
              className={styles.applyButton} 
              onClick={() => setShowApplicationForm(true)}
            >
              Подать заявку
            </button>
          )}
        </div>
      </div>

      {/* Модальное окно формы заявки */}
      <CourseApplicationForm
        course={course}
        isOpen={showApplicationForm}
        onClose={() => setShowApplicationForm(false)}
        onSubmit={handleApplicationSubmit}
      />
    </div>
  );
};

export default CourseDetail;