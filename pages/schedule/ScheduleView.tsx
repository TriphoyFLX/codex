import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import styles from './ScheduleView.module.css';

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
}

const ScheduleView: React.FC = () => {
  const { profile } = useProfile();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [availableClasses, setAvailableClasses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClass, setSelectedClass] = useState<string>('all');

  useEffect(() => {
    if (profile?.school_id) {
      fetchAvailableClasses();
    }
  }, [profile]);

  useEffect(() => {
    fetchSchedules();
  }, [currentDate, selectedClass, profile]);

  const fetchAvailableClasses = async () => {
    try {
      const response = await apiClient.get('/schedules/classes', {
        params: { school_id: profile?.school_id }
      });
      setAvailableClasses(response.data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchSchedules = async () => {
    if (!profile) return;
    
    try {
      setLoading(true);
      const response = await apiClient.get('/schedules', {
        params: { 
          school_id: profile.school_id,
          date: currentDate.toISOString().split('T')[0],
          class_name: selectedClass === 'all' ? undefined : selectedClass
        }
      });
      setSchedules(response.data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Загрузка расписания...</p>
      </div>
    );
  }

  return (
    <div className={styles.scheduleView}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>Расписание</h1>
          <p className={styles.subtitle}>
            {selectedClass === 'all' 
              ? 'Расписание для всех классов' 
              : `Расписание для ${selectedClass} класса`}
          </p>
        </div>
      </div>

      <div className={styles.controls}>
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
                        <strong>Домашнее задание:</strong> {schedule.homework}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {schedules.length === 0 && !loading && (
        <div className={styles.emptyState}>
          <Calendar size={48} className={styles.emptyIcon} />
          <h3>Нет занятий</h3>
          <p>На эту неделю занятий не запланировано</p>
        </div>
      )}
    </div>
  );
};

export default ScheduleView;