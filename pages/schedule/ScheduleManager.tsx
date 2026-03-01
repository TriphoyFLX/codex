import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Edit, Trash2, Users, BookOpen, ChevronLeft, ChevronRight, Save, X, Filter } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import styles from './ScheduleManager.module.css';

interface Schedule {
  id: string;
  user_id: string;
  course_id?: string;
  date: string;
  time_start: string;
  time_end: string;
  subject: string;
  class: string;
  type: 'lesson' | 'exam' | 'meeting';
  description?: string;
  homework?: string;
  course_name?: string;
  course_description?: string;
  course_grades?: string;
  course_image_url?: string;
  school_id: string;
}

interface Course {
  id: string;
  name: string;
  description?: string;
  grades?: string;
}

const ScheduleManager: React.FC = () => {
  const { profile } = useProfile();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [formData, setFormData] = useState({
    subject: '',
    class: '',
    date: '',
    time_start: '',
    time_end: '',
    course_id: '',
    type: 'lesson' as 'lesson' | 'exam' | 'meeting',
    description: '',
    homework: ''
  });

  // Проверка прав доступа
  if (!profile) {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessMessage}>
          <Users size={48} />
          <h2>Требуется авторизация</h2>
          <p>Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  if (profile.role !== 'teacher') {
    return (
      <div className={styles.accessDenied}>
        <div className={styles.accessMessage}>
          <Users size={48} />
          <h2>Доступ запрещен</h2>
          <p>Только учителя могут управлять расписанием</p>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchCourses();
    fetchAvailableClasses();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, selectedClass]);

  const fetchCourses = async () => {
    try {
      console.log('Fetching courses for school:', profile.school_id);
      const response = await apiClient.get('/schedules/courses', {
        params: { 
          school_id: profile.school_id,
          teacher_id: profile.id 
        }
      });
      console.log('Courses response:', response.data);
      setCourses(response.data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchAvailableClasses = async () => {
  try {
    console.log('Fetching classes for school:', profile.school_id);
    const response = await apiClient.get('/schedules/classes', {
      params: { school_id: profile.school_id }
    });
    console.log('Classes response:', response.data);
    setAvailableClasses(Array.isArray(response.data) ? response.data : []);
  } catch (error: any) {
    console.error('Error fetching classes:', error);
    console.error('Error details:', error.response?.data);
    // Показываем пользователю сообщение об ошибке
    alert('Ошибка при загрузке списка классов: ' + (error.response?.data?.error || error.message));
  }
};

const fetchSchedules = async () => {
  try {
    setLoading(true);
    
    // Получаем диапазон дат для текущей недели
    const weekDays = getWeekDays();
    const startDate = weekDays[0].toISOString().split('T')[0];
    const endDate = weekDays[6].toISOString().split('T')[0];
    
    console.log('Fetching schedules with params:', {
      user_id: profile.id,
      start_date: startDate,
      end_date: endDate,
      class_name: selectedClass === 'all' ? undefined : selectedClass,
      school_id: profile.school_id
    });
    
    const response = await apiClient.get('/schedules', {
      params: { 
        user_id: profile.id,
        start_date: startDate,
        end_date: endDate,
        class_name: selectedClass === 'all' ? undefined : selectedClass,
        school_id: profile.school_id
      }
    });
    
    console.log('Fetched schedules:', response.data);
    setSchedules(Array.isArray(response.data) ? response.data : []);
  } catch (error: any) {
    console.error('Error fetching schedules:', error);
    console.error('Error details:', error.response?.data);
    alert('Ошибка при загрузке расписания: ' + (error.response?.data?.error || error.message));
  } finally {
    setLoading(false);
  }
};

  const handleCreateSchedule = () => {
    setEditingSchedule(null);
    setFormData({
      subject: '',
      class: '',
      date: currentDate.toISOString().split('T')[0],
      time_start: '',
      time_end: '',
      course_id: '',
      type: 'lesson',
      description: '',
      homework: ''
    });
    setShowCreateModal(true);
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      subject: schedule.subject,
      class: schedule.class,
      date: schedule.date,
      time_start: schedule.time_start,
      time_end: schedule.time_end,
      course_id: schedule.course_id || '',
      type: schedule.type,
      description: schedule.description || '',
      homework: schedule.homework || ''
    });
    setShowCreateModal(true);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Вы уверены, что хотите удалить это занятие?')) return;
    
    try {
      await apiClient.delete(`/schedules/${scheduleId}`);
      fetchSchedules();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      alert('Ошибка при удалении занятия');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const scheduleData = {
        ...formData,
        user_id: profile.id,
        school_id: profile.school_id
      };

      console.log('Submitting schedule:', scheduleData);

      let response;
      if (editingSchedule) {
        response = await apiClient.put(`/schedules/${editingSchedule.id}`, scheduleData);
      } else {
        response = await apiClient.post('/schedules', scheduleData);
      }
      
      console.log('Response:', response);
      
      if (response.status === 200 || response.status === 201) {
        setShowCreateModal(false);
        setEditingSchedule(null);
        await fetchSchedules();
        alert('Расписание успешно сохранено!');
      }
    } catch (error: any) {
      console.error('Error saving schedule:', error);
      alert('Ошибка при сохранении занятия: ' + (error.response?.data?.error || error.message));
    }
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() + 7);
    }
    setCurrentDate(newDate);
  };

  const getWeekDays = () => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getEventsForDay = (day: Date) => {
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === day.toDateString();
    });
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'lesson': return '#0071e3';
      case 'exam': return '#ff9500';
      case 'meeting': return '#34c759';
      default: return '#86868b';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'lesson': return <BookOpen size={16} />;
      case 'exam': return <Calendar size={16} />;
      case 'meeting': return <Users size={16} />;
      default: return <Clock size={16} />;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка расписания...</p>
      </div>
    );
  }

  return (
    <div className={styles.scheduleManager}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Управление расписанием</h1>
          <p className={styles.subtitle}>Создавайте и управляйте занятиями</p>
        </div>
        
        <button
          className={styles.createButton}
          onClick={handleCreateSchedule}
        >
          <Plus size={20} />
          Создать занятие
        </button>
      </div>

      {/* Filters and Navigation */}
      <div className={styles.controls}>
        {/* Class Filter */}
        <div className={styles.filterSection}>
          <Filter size={18} className={styles.filterIcon} />
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className={styles.classFilter}
          >
            <option value="all">Все классы</option>
            {availableClasses.map(className => (
              <option key={className} value={className}>
                {className} класс
              </option>
            ))}
          </select>
        </div>

        {/* Week Navigation */}
        <div className={styles.weekNavigation}>
          <button
            className={styles.navButton}
            onClick={() => navigateWeek('prev')}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className={styles.currentWeek}>
            <h3>
              {currentDate.toLocaleDateString('ru-RU', { 
                month: 'long', 
                year: 'numeric' 
              })}
            </h3>
            <p>
              {getWeekDays()[0].toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })} - {' '}
              {getWeekDays()[6].toLocaleDateString('ru-RU', { day: 'numeric', month: 'numeric' })}
            </p>
          </div>
          
          <button
            className={styles.navButton}
            onClick={() => navigateWeek('next')}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Week View */}
      <div className={styles.weekGrid}>
        {getWeekDays().map((day) => (
          <div key={day.toISOString()} className={styles.dayColumn}>
            <div className={styles.dayHeader}>
              <div className={styles.dayName}>
                {day.toLocaleDateString('ru-RU', { weekday: 'short' })}
              </div>
              <div className={styles.dayNumber}>
                {day.getDate()}
              </div>
            </div>
            
            <div className={styles.dayEvents}>
              {getEventsForDay(day).map((schedule) => (
                <div
                  key={schedule.id}
                  className={styles.eventCard}
                  style={{ borderLeftColor: getEventTypeColor(schedule.type) }}
                >
                  <div className={styles.eventTime}>
                    {schedule.time_start.slice(0, 5)} - {schedule.time_end.slice(0, 5)}
                  </div>
                  
                  <div className={styles.eventContent}>
                    <div className={styles.eventHeader}>
                      <div className={styles.eventTitle}>
                        {schedule.subject}
                      </div>
                      <div className={styles.eventClass}>
                        {schedule.class} класс
                      </div>
                    </div>
                    
                    {schedule.course_name && (
                      <div className={styles.eventCourse}>
                        {schedule.course_name}
                      </div>
                    )}
                    
                    {schedule.description && (
                      <div className={styles.eventDescription}>
                        {schedule.description}
                      </div>
                    )}
                    
                    {schedule.homework && (
                      <div className={styles.eventHomework}>
                        <strong>ДЗ:</strong> {schedule.homework}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.eventActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleEditSchedule(schedule)}
                      title="Редактировать"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDeleteSchedule(schedule.id)}
                      title="Удалить"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  
                  <div className={styles.eventType}>
                    {getEventTypeIcon(schedule.type)}
                  </div>
                </div>
              ))}
              
              {/* Quick add button for empty days */}
              <button
                className={styles.quickAddButton}
                onClick={() => {
                  setFormData({
                    ...formData,
                    date: day.toISOString().split('T')[0],
                    class: selectedClass !== 'all' ? selectedClass : ''
                  });
                  setShowCreateModal(true);
                }}
              >
                <Plus size={16} />
                <span>Добавить</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>
                {editingSchedule ? 'Редактировать занятие' : 'Создать занятие'}
              </h3>
              <button
                className={styles.closeButton}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Предмет *</label>
                  <input
                    type="text"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className={styles.formInput}
                    placeholder="Например: Математика"
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Класс *</label>
                  <input
                    type="text"
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                    className={styles.formInput}
                    placeholder="Например: 10А"
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Дата *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Тип *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                    className={styles.formSelect}
                    required
                  >
                    <option value="lesson">Урок</option>
                    <option value="exam">Экзамен</option>
                    <option value="meeting">Встреча</option>
                  </select>
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Время начала *</label>
                  <input
                    type="time"
                    value={formData.time_start}
                    onChange={(e) => setFormData({...formData, time_start: e.target.value})}
                    className={styles.formInput}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>Время окончания *</label>
                  <input
                    type="time"
                    value={formData.time_end}
                    onChange={(e) => setFormData({...formData, time_end: e.target.value})}
                    className={styles.formInput}
                    required
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label>Связанный курс</label>
                <select
                  value={formData.course_id}
                  onChange={(e) => setFormData({...formData, course_id: e.target.value})}
                  className={styles.formSelect}
                >
                  <option value="">Без курса</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name} {course.grades ? `(${course.grades} класс)` : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>Описание</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className={styles.formTextarea}
                  rows={3}
                  placeholder="Описание занятия..."
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Домашнее задание</label>
                <textarea
                  value={formData.homework}
                  onChange={(e) => setFormData({...formData, homework: e.target.value})}
                  className={styles.formTextarea}
                  rows={2}
                  placeholder="Домашнее задание..."
                />
              </div>
              
              <div className={styles.formActions}>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className={styles.submitButton}
                >
                  <Save size={16} />
                  {editingSchedule ? 'Сохранить' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Empty State */}
      {schedules.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyIcon} />
          <h3>Нет занятий</h3>
          <p>На эту неделю занятий не запланировано</p>
          <button
            className={styles.createEmptyButton}
            onClick={handleCreateSchedule}
          >
            <Plus size={20} />
            Создать первое занятие
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduleManager;