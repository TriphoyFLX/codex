// pages/SelectSchoolPage/SelectSchoolPage.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, Users, School, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useAuth } from '../../hooks/useAuth';
import { useProfile } from '../../context/ProfileContext';
import styles from './SelectSchoolPage.module.css';

export default function SelectSchoolPage() {
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const { profile, refreshProfile } = useProfile();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Загрузка школ
  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      setLoading(true);
      
      const response = await apiClient.get('/schools', {
        params: { is_active: true }
      });
      
      setSchools(response.data || []);
    } catch (error) {
      console.error('Ошибка загрузки школ:', error);
    } finally {
      setLoading(false);
    }
  };

  // Обработка выбора школы
  const handleSelectSchool = async (schoolId: string) => {
    console.log('Selecting school:', schoolId);
    const user = getCurrentUser();
    console.log('User:', user);
    console.log('Profile:', profile);
    
    if (!user || !profile) {
      console.error('No user or profile');
      return;
    }
    
    try {
      console.log('Updating profile...');
      // Обновляем профиль
      const response = await apiClient.put(`/profiles/${profile.id}`, {
        school_id: schoolId
      });

      console.log('Profile update response:', response);

      console.log('Refreshing profile...');
      // Обновляем профиль в контексте
      await refreshProfile();

      // Re-fetch profile after update to avoid race conditions and choose next step.
      const updatedProfileResponse = await apiClient.get(`/profiles/${profile.id}`);
      const updatedProfile = updatedProfileResponse.data;

      // If onboarding is not completed, route to profile completion; otherwise go to main page.
      if (!updatedProfile || !updatedProfile.onboarding_completed) {
        console.log('Navigating to create-profile...');
        navigate('/create-profile', { replace: true });
      } else {
        console.log('Navigating to home...');
        navigate('/', { replace: true });
      }
    } catch (error) {
      console.error('Ошибка выбора школы:', error);
      alert('Не удалось выбрать школу');
    }
  };

  // Фильтрация школ
  const filteredSchools = schools.filter(school => 
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.country?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    school.city?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка школ...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={styles.header}
      >
        <h1>Выберите школу</h1>
        <p>Выберите вашу школу из списка ниже</p>
      </motion.div>

      <div className={styles.searchContainer}>
        <div className={styles.searchBox}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Поиск школ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.schoolsList}>
        {filteredSchools.length === 0 ? (
          <div className={styles.noResults}>
            <School className={styles.noResultsIcon} />
            <p>Школы не найдены</p>
            <p>Попробуйте изменить параметры поиска</p>
          </div>
        ) : (
          filteredSchools.map((school, index) => (
            <motion.div
              key={school.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={styles.schoolCard}
              onClick={() => handleSelectSchool(school.id)}
            >
              <div className={styles.schoolHeader}>
                <h3>{school.name}</h3>
                {school.school_number && (
                  <span className={styles.schoolNumber}>№{school.school_number}</span>
                )}
              </div>
              
              <div className={styles.schoolInfo}>
                {school.address && (
                  <div className={styles.schoolInfoItem}>
                    <MapPin size={16} />
                    <span>{school.address}</span>
                  </div>
                )}
                
                {school.city && (
                  <div className={styles.schoolInfoItem}>
                    <span>{school.city}</span>
                  </div>
                )}
                
                <div className={styles.schoolInfoItem}>
                  <Users size={16} />
                  <span>
                    {school.student_count > 0 
                      ? `${school.student_count} ${school.student_count === 1 ? 'студент' : school.student_count < 5 ? 'студента' : 'студентов'}`
                      : 'Пока нет студентов'
                    }
                  </span>
                </div>
              </div>
              
              <div className={styles.schoolActions}>
                <ChevronRight size={20} />
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
