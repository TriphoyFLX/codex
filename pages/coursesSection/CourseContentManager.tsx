import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '../../lib/apiClient';
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Video, 
  Music, 
  Image, 
  Link, 
  Download,
  Play,
  Clock,
  Folder,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import styles from './CourseContentManager.module.css';

// Простая функция для показа уведомлений
const showNotification = (message: string, type: 'error' | 'success' | 'warning' = 'error') => {
  // Удаляем существующие уведомления
  const existingNotifications = document.querySelectorAll('.notification-toast');
  existingNotifications.forEach(notification => notification.remove());
  
  // Создаем новое уведомление
  const notification = document.createElement('div');
  notification.className = `notification-toast notification-${type}`;
  
  // Создаем контент с иконками
  const content = document.createElement('div');
  content.className = 'notification-content';
  
  // Добавляем иконки в зависимости от типа
  let iconElement;
  if (type === 'error') {
    iconElement = document.createElement('div');
    iconElement.innerHTML = '❌';
  } else if (type === 'success') {
    iconElement = document.createElement('div');
    iconElement.innerHTML = '✅';
  } else if (type === 'warning') {
    iconElement = document.createElement('div');
    iconElement.innerHTML = '⚠️';
  }
  
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  
  content.appendChild(iconElement!);
  content.appendChild(messageElement);
  notification.appendChild(content);
  
  // Добавляем стили
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#f59e0b'};
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `;
  
  // Добавляем анимацию
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(100%);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    .notification-content {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .notification-content div:first-child {
      font-size: 16px;
    }
  `;
  document.head.appendChild(style);
  
  // Добавляем на страницу
  document.body.appendChild(notification);
  
  // Автоматически удаляем через 5 секунд
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
};

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

const CourseContentManager: React.FC = () => {
  const { id: courseId } = useParams<{ id: string }>();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string>('');
  const [uploadingMaterial, setUploadingMaterial] = useState<string>('');

  useEffect(() => {
    fetchModules();
  }, [courseId]);

  const fetchModules = async () => {
    try {
      const response = await apiClient.get(`/course-content/${courseId}/modules`);
      setModules(response.data);
    } catch (error) {
      console.error('Error fetching modules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLessons = async (moduleId: string) => {
    try {
      const response = await apiClient.get(`/course-content/modules/${moduleId}/lessons`);
      return response.data;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      return [];
    }
  };

  const fetchMaterials = async (lessonId: string) => {
    try {
      const response = await apiClient.get(`/course-content/lessons/${lessonId}/materials`);
      return response.data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      return [];
    }
  };

  const toggleModule = async (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
      // Загружаем уроки модуля если еще не загружены
      const module = modules.find(m => m.id === moduleId);
      if (module && !module.lessons) {
        const lessons = await fetchLessons(moduleId);
        setModules(prev => prev.map(m => 
          m.id === moduleId ? { ...m, lessons } : m
        ));
      }
    }
    setExpandedModules(newExpanded);
  };

  const toggleLesson = async (lessonId: string) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
      // Загружаем материалы урока если еще не загружены
      const moduleWithLessons = modules.find(m => m.lessons?.find(l => l.id === lessonId));
      if (moduleWithLessons?.lessons) {
        const lesson = moduleWithLessons.lessons.find(l => l.id === lessonId);
        if (lesson && !lesson.materials) {
          const materials = await fetchMaterials(lessonId);
          setModules(prev => prev.map(m => ({
            ...m,
            lessons: m.lessons?.map(l => 
              l.id === lessonId ? { ...l, materials } : l
            )
          })));
        }
      }
    }
    setExpandedLessons(newExpanded);
  };

  const createModule = async (data: { title: string; description: string; is_published?: boolean }) => {
    try {
      await apiClient.post(`/course-content/${courseId}/modules`, data);
      fetchModules();
      setShowModuleForm(false);
      showNotification('Модуль успешно создан!', 'success');
    } catch (error: any) {
      console.error('Error creating module:', error);
      
      // Показываем красивое уведомление об ошибке
      if (error.response?.data?.details) {
        showNotification(error.response.data.details, 'error');
      } else if (error.response?.data?.error) {
        showNotification(error.response.data.error, 'error');
      } else {
        showNotification('Не удалось создать модуль. Попробуйте позже.', 'error');
      }
    }
  };

  const createLesson = async (data: { title: string; description: string; content: string; video_url: string; duration_minutes: number; is_free: boolean; is_published?: boolean }) => {
    try {
      await apiClient.post(`/course-content/modules/${selectedModuleId}/lessons`, data);
      fetchModules();
      setShowLessonForm(false);
      setSelectedModuleId('');
      showNotification('Урок успешно создан!', 'success');
    } catch (error: any) {
      console.error('Error creating lesson:', error);
      
      // Показываем красивое уведомление об ошибке
      if (error.response?.data?.details) {
        showNotification(error.response.data.details, 'error');
      } else if (error.response?.data?.error) {
        showNotification(error.response.data.error, 'error');
      } else {
        showNotification('Не удалось создать урок. Попробуйте позже.', 'error');
      }
    }
  };

  const deleteModule = async (moduleId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот модуль со всеми уроками и материалами?')) {
      try {
        await apiClient.delete(`/course-content/modules/${moduleId}`);
        fetchModules();
        showNotification('Модуль успешно удален!', 'success');
      } catch (error: any) {
        console.error('Error deleting module:', error);
        
        // Показываем красивое уведомление об ошибке
        if (error.response?.data?.details) {
          showNotification(error.response.data.details, 'error');
        } else if (error.response?.data?.error) {
          showNotification(error.response.data.error, 'error');
        } else {
          showNotification('Не удалось удалить модуль. Попробуйте позже.', 'error');
        }
      }
    }
  };

  const deleteLesson = async (lessonId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот урок со всеми материалами?')) {
      try {
        await apiClient.delete(`/course-content/lessons/${lessonId}`);
        fetchModules();
      } catch (error) {
        console.error('Error deleting lesson:', error);
      }
    }
  };

  const deleteMaterial = async (materialId: string) => {
    if (confirm('Вы уверены, что хотите удалить этот материал?')) {
      try {
        await apiClient.delete(`/course-content/materials/${materialId}`);
        fetchModules();
      } catch (error) {
        console.error('Error deleting material:', error);
      }
    }
  };

  const togglePublishModule = async (moduleId: string, isPublished: boolean) => {
    try {
      await apiClient.put(`/course-content/modules/${moduleId}`, {
        is_published: isPublished
      });
      fetchModules();
    } catch (error) {
      console.error('Error toggling module publish status:', error);
    }
  };

  const togglePublishLesson = async (lessonId: string, isPublished: boolean) => {
    try {
      await apiClient.put(`/course-content/lessons/${lessonId}`, {
        is_published: isPublished
      });
      fetchModules();
    } catch (error) {
      console.error('Error toggling lesson publish status:', error);
    }
  };

  const handleFileUpload = async (lessonId: string, file: File) => {
    setUploadingMaterial(lessonId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('lessonId', lessonId);
      formData.append('title', file.name);
      formData.append('type', getFileType(file.type));
      formData.append('isDownloadable', 'true');

      await apiClient.post('/course-content/upload-material', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      fetchModules();
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setUploadingMaterial('');
    }
  };

  const getFileType = (mimeType: string): Material['type'] => {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'document';
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

  if (loading) return <div className={styles.loading}>Загрузка контента курса...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Управление контентом курса</h1>
        <button 
          className={styles.addButton}
          onClick={() => setShowModuleForm(true)}
        >
          <Plus size={20} />
          Добавить модуль
        </button>
      </div>

      <div className={styles.modules}>
        {modules.map((module) => (
          <div key={module.id} className={styles.module}>
            <div className={styles.moduleHeader}>
              <div className={styles.moduleInfo}>
                <button 
                  className={styles.expandButton}
                  onClick={() => toggleModule(module.id)}
                >
                  {expandedModules.has(module.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </button>
                <Folder size={20} className={styles.moduleIcon} />
                <div>
                  <h3>{module.title}</h3>
                  {module.description && <p>{module.description}</p>}
                  <div className={styles.moduleStats}>
                    <span>{module.lessons_count} уроков</span>
                    {module.completed_lessons > 0 && (
                      <span>{module.completed_lessons} завершено</span>
                    )}
                    <span className={module.is_published ? styles.published : styles.draft}>
                      {module.is_published ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.moduleActions}>
                <button onClick={() => {
                  setEditingModule(module);
                  setShowModuleForm(true);
                }}>
                  <Edit size={16} />
                </button>
                <button 
                  className={styles.publishButton}
                  onClick={() => togglePublishModule(module.id, !module.is_published)}
                >
                  {module.is_published ? '🔒' : '📢'}
                </button>
                <button onClick={() => deleteModule(module.id)}>
                  <Trash2 size={16} />
                </button>
                <button 
                  className={styles.addLessonButton}
                  onClick={() => {
                    setSelectedModuleId(module.id);
                    setShowLessonForm(true);
                  }}
                >
                  <Plus size={16} />
                  Урок
                </button>
              </div>
            </div>

            {expandedModules.has(module.id) && module.lessons && (
              <div className={styles.lessons}>
                {module.lessons.map((lesson) => (
                  <div key={lesson.id} className={styles.lesson}>
                    <div className={styles.lessonHeader}>
                      <div className={styles.lessonInfo}>
                        <button 
                          className={styles.expandButton}
                          onClick={() => toggleLesson(lesson.id)}
                        >
                          {expandedLessons.has(lesson.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                        <BookOpen size={16} className={styles.lessonIcon} />
                        <div>
                          <h4>{lesson.title}</h4>
                          {lesson.description && <p>{lesson.description}</p>}
                          <div className={styles.lessonStats}>
                            {lesson.duration_minutes && (
                              <span><Clock size={12} /> {lesson.duration_minutes} мин</span>
                            )}
                            <span>{lesson.materials_count} материалов</span>
                            {lesson.is_free && <span className={styles.freeBadge}>Бесплатный</span>}
                            <span className={lesson.is_published ? styles.published : styles.draft}>
                              {lesson.is_published ? 'Опубликовано' : 'Черновик'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className={styles.lessonActions}>
                        <button onClick={() => {
                          setEditingLesson(lesson);
                          setShowLessonForm(true);
                        }}>
                          <Edit size={14} />
                        </button>
                        <button 
                          className={styles.publishButton}
                          onClick={() => togglePublishLesson(lesson.id, !lesson.is_published)}
                        >
                          {lesson.is_published ? '🔒' : '📢'}
                        </button>
                        <button onClick={() => deleteLesson(lesson.id)}>
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {expandedLessons.has(lesson.id) && lesson.materials && (
                      <div className={styles.materials}>
                        <div className={styles.materialsHeader}>
                          <h5>Материалы урока</h5>
                          <label className={styles.uploadButton}>
                            <Plus size={14} />
                            Добавить файл
                            <input
                              type="file"
                              hidden
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(lesson.id, file);
                              }}
                            />
                          </label>
                        </div>
                        
                        {uploadingMaterial === lesson.id && (
                          <div className={styles.uploading}>Загрузка файла...</div>
                        )}

                        {lesson.materials.map((material) => {
                          const Icon = getMaterialIcon(material.type);
                          return (
                            <div key={material.id} className={styles.material}>
                              <div className={styles.materialInfo}>
                                <Icon size={16} className={styles.materialIcon} />
                                <div>
                                  <h6>{material.title}</h6>
                                  {material.file_name && (
                                    <p className={styles.fileName}>
                                      {material.file_name}
                                      {material.file_size && ` (${formatFileSize(material.file_size)})`}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div className={styles.materialActions}>
                                {material.file_url && (
                                  <a 
                                    href={material.file_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className={styles.materialLink}
                                  >
                                    {material.type === 'video' ? <Play size={14} /> : <Download size={14} />}
                                  </a>
                                )}
                                <button onClick={() => deleteMaterial(material.id)}>
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Формы модальные окна */}
      {showModuleForm && (
        <ModuleForm
          module={editingModule}
          onSubmit={editingModule ? () => {} : createModule}
          onClose={() => {
            setShowModuleForm(false);
            setEditingModule(null);
          }}
        />
      )}

      {showLessonForm && (
        <LessonForm
          lesson={editingLesson}
          moduleId={selectedModuleId}
          onSubmit={editingLesson ? () => {} : createLesson}
          onClose={() => {
            setShowLessonForm(false);
            setEditingLesson(null);
            setSelectedModuleId('');
          }}
        />
      )}
    </div>
  );
};

// Компоненты форм (для краткости здесь упрощены)
const ModuleForm: React.FC<{
  module?: Module | null;
  onSubmit: (data: any) => void;
  onClose: () => void;
}> = ({ module, onSubmit, onClose }) => {
  const [title, setTitle] = useState(module?.title || '');
  const [description, setDescription] = useState(module?.description || '');
  const [isPublished, setIsPublished] = useState(module?.is_published || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, description, is_published: isPublished });
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>{module ? 'Редактировать модуль' : 'Создать модуль'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Название модуля"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Описание модуля"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Опубликовать модуль
          </label>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const LessonForm: React.FC<{
  lesson?: Lesson | null;
  moduleId: string;
  onSubmit: (data: any) => void;
  onClose: () => void;
}> = ({ lesson, onSubmit, onClose }) => {
  const [title, setTitle] = useState(lesson?.title || '');
  const [description, setDescription] = useState(lesson?.description || '');
  const [content, setContent] = useState(lesson?.content || '');
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url || '');
  const [durationMinutes, setDurationMinutes] = useState(lesson?.duration_minutes || 0);
  const [isFree, setIsFree] = useState(lesson?.is_free || false);
  const [isPublished, setIsPublished] = useState(lesson?.is_published || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ 
      title, 
      description, 
      content, 
      video_url: videoUrl, 
      duration_minutes: durationMinutes, 
      is_free: isFree,
      is_published: isPublished
    });
  };

  return (
    <div className={styles.modal}>
      <div className={styles.modalContent}>
        <h2>{lesson ? 'Редактировать урок' : 'Создать урок'}</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Название урока"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            placeholder="Описание урока"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <textarea
            placeholder="Содержание урока"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={6}
          />
          <input
            type="url"
            placeholder="URL видео (опционально)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
          <input
            type="number"
            placeholder="Продолжительность в минутах"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            min="0"
          />
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isFree}
              onChange={(e) => setIsFree(e.target.checked)}
            />
            Бесплатный урок (для предпросмотра)
          </label>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
            />
            Опубликовать урок
          </label>
          <div className={styles.modalActions}>
            <button type="button" onClick={onClose}>Отмена</button>
            <button type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CourseContentManager;
