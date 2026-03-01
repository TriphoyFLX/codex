import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import { 
  BookOpen, 
  Play, 
  Download, 
  CheckCircle, 
  Clock, 
  FileText, 
  Video, 
  Music, 
  Image, 
  Link,
  ArrowLeft,
  Lock,
  Unlock
} from 'lucide-react';
import styles from './CourseViewer.module.css';

interface Module {
  id: string;
  title: string;
  description?: string;
  order_index: number;
  is_published: boolean;
  lessons_count: number;
  completed_lessons: number;
  lessons?: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  duration_minutes?: number;
  order_index: number;
  is_published: boolean;
  is_free: boolean;
  materials_count: number;
  materials?: Material[];
  progress?: LessonProgress;
}

interface Material {
  id: string;
  title: string;
  type: 'document' | 'video' | 'audio' | 'image' | 'link' | 'assignment';
  file_url?: string;
  file_name?: string;
  file_size?: number;
  content?: string;
  is_downloadable: boolean;
  order_index: number;
}

interface LessonProgress {
  is_completed: boolean;
  watch_time_seconds: number;
  completion_date?: string;
}

interface CourseProgress {
  total_lessons: number;
  completed_lessons: number;
  completion_percentage: number;
}

const CourseViewer: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<CourseProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [watchTime, setWatchTime] = useState(0);
  const [accessStatus, setAccessStatus] = useState<{
    canAccess: boolean;
    message?: string;
    actionText?: string;
    action?: () => void;
  } | null>(null);

  useEffect(() => {
    if (courseId && profile) {
      fetchCourseData();
    }
  }, [courseId, profile]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (selectedLesson && selectedLesson.video_url) {
      interval = setInterval(() => {
        setWatchTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [selectedLesson]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Получаем информацию о курсе
      const courseResponse = await apiClient.get(`/courses/${courseId}`);
      setCourse(courseResponse.data);
      
      // Проверяем статус заявки пользователя
      const statusResponse = await apiClient.get(`/courses/${courseId}/application-status`);
      const applicationStatus = statusResponse.data;
      
      // Если заявки нет или она не одобрена, не загружаем контент
      if (!applicationStatus.hasApplication || applicationStatus.status !== 'approved') {
        setAccessStatus({
          canAccess: false,
          message: !applicationStatus.hasApplication 
            ? 'Для доступа к курсу необходимо подать заявку'
            : applicationStatus.status === 'pending' 
              ? 'Ваша заявка на рассмотрении'
              : 'Ваша заявка отклонена',
          actionText: !applicationStatus.hasApplication 
            ? 'Подать заявку'
            : applicationStatus.status === 'pending'
              ? 'Статус заявки'
              : 'Подать заявку повторно',
          action: () => navigate(`/course/${courseId}`)
        });
        setProgress(null);
        setModules([]);
        setLoading(false);
        return;
      }
      
      setAccessStatus({ canAccess: true });
      
      // Получаем модули курса (только для одобренных пользователей)
      const modulesResponse = await apiClient.get(`/course-content/${courseId}/modules`);
      const modulesData = modulesResponse.data;
      
      // Получаем прогресс пользователя
      const progressResponse = await apiClient.get(`/course-content/${courseId}/progress/${profile.id}`);
      setProgress(progressResponse.data);
      
      // Загружаем уроки и прогресс для каждого модуля
      const modulesWithLessons = await Promise.all(
        modulesData.map(async (module: Module) => {
          const lessonsResponse = await apiClient.get(`/course-content/modules/${module.id}/lessons`);
          const lessons = lessonsResponse.data;
          
          // Получаем все ID уроков для массового запроса прогресса
          const lessonIds = lessons.map((lesson: Lesson) => lesson.id);
          
          if (lessonIds.length === 0) {
            return { ...module, lessons: [] };
          }
          
          // Загружаем прогресс для всех уроков одним запросом
          try {
            const progressResponse = await apiClient.post('/course-content/lessons/progress/batch', {
              userId: profile.id,
              lessonIds
            });
            
            const progressMap = progressResponse.data.reduce((acc: any, item: any) => {
              acc[item.lesson_id] = item;
              return acc;
            }, {});
            
            const lessonsWithProgress = lessons.map((lesson: Lesson) => ({
              ...lesson,
              progress: progressMap[lesson.id] || { is_completed: false, watch_time_seconds: 0 }
            }));
            
            return { ...module, lessons: lessonsWithProgress };
          } catch (error) {
            console.error('Error fetching batch progress:', error);
            // Fallback - загружаем каждый урок отдельно
            const lessonsWithProgress = await Promise.all(
              lessons.map(async (lesson: Lesson) => {
                try {
                  const progressResponse = await apiClient.get(`/course-content/lessons/${lesson.id}/progress/${profile.id}`);
                  return { ...lesson, progress: progressResponse.data };
                } catch {
                  return { ...lesson, progress: { is_completed: false, watch_time_seconds: 0 } };
                }
              })
            );
            
            return { ...module, lessons: lessonsWithProgress };
          }
        })
      );
      
      setModules(modulesWithLessons);
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = async (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const toggleLesson = async (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
      setSelectedLesson(null);
    } else {
      newExpanded.add(lessonId);
      
      // Находим урок и устанавливаем его как выбранный
      const lesson = modules
        .flatMap(m => m.lessons || [])
        .find(l => l.id === lessonId);
      
      if (lesson) {
        setSelectedLesson(lesson);
        setWatchTime(lesson.progress?.watch_time_seconds || 0);
        
        // Загружаем материалы урока
        if (!lesson.materials) {
          try {
            const materialsResponse = await apiClient.get(`/course-content/lessons/${lessonId}/materials`);
            lesson.materials = materialsResponse.data;
          } catch (error) {
            console.error('Error fetching materials:', error);
          }
        }
      }
    }
    setExpandedLessons(newExpanded);
  };

  const updateLessonProgress = async (lessonId: string, isCompleted: boolean) => {
    try {
      await apiClient.post(`/course-content/lessons/${lessonId}/progress`, {
        userId: profile.id,
        isCompleted,
        watchTimeSeconds: watchTime
      });
      
      // Обновляем локальный state
      setModules(prev => prev.map(module => ({
        ...module,
        lessons: module.lessons?.map(lesson => 
          lesson.id === lessonId 
            ? { 
                ...lesson, 
                progress: { 
                  is_completed: isCompleted, 
                  watch_time_seconds: watchTime,
                  completion_date: isCompleted ? new Date().toISOString() : lesson.progress?.completion_date
                }
              }
            : lesson
        )
      })));
      
      // Обновляем общий прогресс
      if (progress) {
        const newCompleted = progress.completed_lessons + (isCompleted ? 1 : 0);
        setProgress({
          ...progress,
          completed_lessons: newCompleted,
          completion_percentage: Math.round((newCompleted / progress.total_lessons) * 100)
        });
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const getMaterialIcon = (type: Material['type']) => {
    switch (type) {
      case 'video': return Video;
      case 'audio': return Music;
      case 'image': return Image;
      case 'link': return Link;
      case 'assignment': return FileText;
      default: return FileText;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) return <div className={styles.loading}>Загрузка курса...</div>;
  if (!course) return <div className={styles.error}>Курс не найден</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
          Назад
        </button>
        
        <div className={styles.courseInfo}>
          <h1>{course.name}</h1>
          <p>{course.description}</p>
          
          {accessStatus?.canAccess && progress && (
            <div className={styles.progress}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${progress.completion_percentage}%` }}
                />
              </div>
              <div className={styles.progressText}>
                {progress.completed_lessons} из {progress.total_lessons} уроков завершено ({progress.completion_percentage}%)
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {accessStatus?.canAccess ? (
          <>
            <div className={styles.modulesList}>
              <h2>Содержание курса</h2>
              
              {modules.map((module) => (
                <div key={module.id} className={styles.module}>
                  <div className={styles.moduleHeader}>
                    <button 
                      className={styles.expandButton}
                      onClick={() => toggleModule(module.id)}
                    >
                      <BookOpen size={20} />
                      <span>{module.title}</span>
                      <span className={styles.moduleStats}>
                        {module.completed_lessons}/{module.lessons_count} уроков
                      </span>
                    </button>
                  </div>

                  {expandedModules.has(module.id) && module.lessons && (
                    <div className={styles.lessons}>
                      {module.lessons.map((lesson) => (
                        <div 
                          key={lesson.id} 
                          className={`${styles.lesson} ${lesson.progress?.is_completed ? styles.completed : ''} ${expandedLessons.has(lesson.id) ? styles.active : ''}`}
                        >
                          <button 
                            className={styles.lessonButton}
                            onClick={() => toggleLesson(lesson.id)}
                          >
                            <div className={styles.lessonInfo}>
                              {lesson.progress?.is_completed ? (
                                <CheckCircle size={16} className={styles.completedIcon} />
                              ) : lesson.is_free ? (
                                <Unlock size={16} className={styles.freeIcon} />
                              ) : (
                                <Lock size={16} className={styles.lockedIcon} />
                              )}
                              
                              <div>
                                <h4>{lesson.title}</h4>
                                {lesson.duration_minutes && (
                                  <span className={styles.duration}>
                                    <Clock size={12} />
                                    {lesson.duration_minutes} мин
                                  </span>
                                )}
                              </div>
                            </div>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className={styles.lessonContent}>
              {selectedLesson ? (
                <div className={styles.lessonViewer}>
                  <div className={styles.lessonHeader}>
                    <h2>{selectedLesson.title}</h2>
                    {selectedLesson.description && <p>{selectedLesson.description}</p>}
                  </div>

                  {selectedLesson.video_url && (
                    <div className={styles.videoPlayer}>
                      <video 
                        controls 
                        className={styles.video}
                        onEnded={() => updateLessonProgress(selectedLesson.id, true)}
                      >
                        <source src={selectedLesson.video_url} type="video/mp4" />
                        Ваш браузер не поддерживает видео.
                      </video>
                    </div>
                  )}

                  {selectedLesson.content && (
                    <div className={styles.lessonText}>
                      <div dangerouslySetInnerHTML={{ __html: selectedLesson.content.replace(/\n/g, '<br>') }} />
                    </div>
                  )}

                  {selectedLesson.materials && selectedLesson.materials.length > 0 && (
                    <div className={styles.materials}>
                      <h3>Материалы урока</h3>
                      {selectedLesson.materials.map((material) => {
                        const Icon = getMaterialIcon(material.type);
                        return (
                          <div key={material.id} className={styles.material}>
                            <div className={styles.materialInfo}>
                              <Icon size={16} />
                              <span>{material.title}</span>
                              {material.file_name && (
                                <span className={styles.fileName}>
                                  ({material.file_name}
                                  {material.file_size && `, ${formatFileSize(material.file_size)}`})
                                </span>
                              )}
                            </div>
                            
                            <div className={styles.materialActions}>
                              {material.file_url && (
                                <a 
                                  href={material.file_url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={styles.materialLink}
                                >
                                  {material.type === 'video' ? (
                                    <>
                                      <Play size={14} />
                                      Смотреть
                                    </>
                                  ) : (
                                    <>
                                      <Download size={14} />
                                      Скачать
                                    </>
                                  )}
                                </a>
                              )}
                              
                              {material.content && material.type === 'link' && (
                                <a 
                                  href={material.content} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={styles.materialLink}
                                >
                                  <Link size={14} />
                                  Перейти
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className={styles.lessonActions}>
                    <button 
                      className={`${styles.completeButton} ${selectedLesson.progress?.is_completed ? styles.completed : ''}`}
                      onClick={() => updateLessonProgress(selectedLesson.id, !selectedLesson.progress?.is_completed)}
                    >
                      {selectedLesson.progress?.is_completed ? (
                        <>
                          <CheckCircle size={16} />
                          Урок завершен
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Отметить как завершенный
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className={styles.selectLesson}>
                  <BookOpen size={48} />
                  <h3>Выберите урок для начала обучения</h3>
                  <p>Нажмите на любой урок в списке слева, чтобы начать его изучение</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.accessDenied}>
            <Lock size={64} />
            <h2>Доступ ограничен</h2>
            <p>{accessStatus?.message}</p>
            <button 
              className={styles.accessButton}
              onClick={accessStatus?.action}
            >
              {accessStatus?.actionText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseViewer;
