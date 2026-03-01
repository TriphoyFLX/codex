// pages/createProfile/CreateProfile.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../lib/apiClient";
import { motion } from "framer-motion";
import { useProfile } from "../../context/ProfileContext";
import styles from "./CreateProfile.module.css";

const CreateProfile: React.FC = () => {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useProfile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    age: "",
    city: "",
    interests: "",
  });

  useEffect(() => {
    const checkUser = async () => {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      let payload: any;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
      } catch {
        localStorage.removeItem('auth_token');
        navigate('/login');
        return;
      }

      const idFromToken = payload?.userId;
      if (!idFromToken) {
        localStorage.removeItem('auth_token');
        navigate('/login');
        return;
      }

      setUserId(idFromToken);
      setUserEmail(payload?.email || null);

      // Prefer context profile if already loaded, otherwise fetch.
      const currentProfile = profile || (await apiClient.get(`/profiles/${idFromToken}`)).data;

      if (currentProfile) {
        // Если онбординг уже завершён — можно уходить на главную
        if (currentProfile.onboarding_completed) {
          navigate('/');
          return;
        }

        setFormData({
          username: currentProfile.username || '',
          first_name: currentProfile.first_name || '',
          last_name: currentProfile.last_name || '',
          age: currentProfile.age ? String(currentProfile.age) : '',
          city: currentProfile.city || '',
          interests: currentProfile.interests || '',
        });
        setExistingProfile(currentProfile);
      }

      setLoading(false);
    };
    
    checkUser();
  }, [navigate, profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId || saving) return;
    
    setSaving(true);
    
    try {
      // Подготавливаем данные для сохранения
      const payload: any = {
        username: formData.username.trim(),
        firstName: formData.first_name.trim() || null,
        lastName: formData.last_name.trim() || null,
        city: formData.city.trim() || null,
        interests: formData.interests.trim() || null,
        onboarding_completed: true,
      };

      // Optional numeric field
      if (formData.age.trim()) {
        const parsed = parseInt(formData.age);
        if (!Number.isNaN(parsed)) {
          payload.age = parsed;
        }
      }

      await apiClient.put(`/profiles/${userId}`, payload);
      
      // Обновляем профиль в контексте
      await refreshProfile();

      // Если школа ещё не выбрана — отправляем на выбор школы, иначе на главную
      const updated = (await apiClient.get(`/profiles/${userId}`)).data;
      if (!updated?.school_id) {
        navigate("/select-school");
      } else {
        navigate("/");
      }
      
    } catch (error: any) {
      console.error("Error creating/updating profile:", error);
      
      // Обработка ошибок
      let errorMessage = "Ошибка при сохранении профиля";
      
      if (error.code === '23505') {
        if (error.message.includes('username')) {
          errorMessage = "Пользователь с таким именем уже существует";
        } else {
          errorMessage = "Профиль уже существует";
        }
      } else if (error.code === 'PGRST204') {
        errorMessage = "Ошибка структуры данных. Попробуйте позже.";
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (!userId) return;
    
    setSaving(true);
    try {
      // Генерируем уникальное имя пользователя
      const username = `user_${userId.slice(0, 8)}`;
      
      const profileData: any = {
        username,
        onboarding_completed: true,
      };

      await apiClient.put(`/profiles/${userId}`, profileData);
      
      // Обновляем профиль в контексте
      await refreshProfile();

      const updated = (await apiClient.get(`/profiles/${userId}`)).data;
      if (!updated?.school_id) {
        navigate("/select-school");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Error skipping profile:", error);
      // Все равно переходим на выбор школы
      try {
        const updated = userId ? (await apiClient.get(`/profiles/${userId}`)).data : null;
        if (!updated?.school_id) {
          navigate('/select-school');
        } else {
          navigate('/');
        }
      } catch {
        navigate("/select-school");
      }
    } finally {
      console.log("Сохраняем профиль в CreateProfile. Текущая роль из existingProfile:", existingProfile?.role);
      setSaving(false);
      
    }
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Подготовка формы...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div
        className={styles.card}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <h1 className={styles.title}>
          {existingProfile ? "Завершение регистрации" : "Создание профиля"}
        </h1>
        
        <p className={styles.subtitle}>
          {userEmail ? `Добро пожаловать, ${userEmail}!` : 'Заполните основные данные'}
        </p>
        
        {existingProfile && !existingProfile.username && (
          <div className={styles.warningBox}>
            <p>⚠️ У вас есть профиль, но не задано имя пользователя. Заполните это поле.</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Имя пользователя *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                placeholder="dmitry_ivanov"
                required
                className={styles.input}
                minLength={3}
                maxLength={30}
                disabled={saving}
              />
              <small>Обязательное поле. Будет видно другим пользователям</small>
            </div>
            
            <div className={styles.inputGroup}>
              <label>Имя</label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                placeholder="Дмитрий"
                className={styles.input}
                maxLength={50}
                disabled={saving}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Фамилия</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                placeholder="Иванов"
                className={styles.input}
                maxLength={50}
                disabled={saving}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Возраст</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({...formData, age: e.target.value})}
                placeholder="18"
                className={styles.input}
                min="1"
                max="120"
                disabled={saving}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Город</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Омск"
                className={styles.input}
                disabled={saving}
              />
            </div>
            
            <div className={styles.inputGroup}>
              <label>Интересы</label>
              <input
                type="text"
                value={formData.interests}
                onChange={(e) => setFormData({...formData, interests: e.target.value})}
                placeholder="Программирование, спорт, музыка..."
                className={styles.input}
                disabled={saving}
              />
            </div>
          </div>
          
          <div className={styles.buttonGroup}>
            <button
              type="submit"
              disabled={saving || !formData.username.trim()}
              className={styles.submitButton}
            >
              {saving ? "Сохранение..." : existingProfile ? "Обновить профиль" : "Создать профиль"}
            </button>
            
            <button
              type="button"
              onClick={handleSkip}
              disabled={saving}
              className={styles.skipButton}
            >
              Пропустить и сгенерировать имя
            </button>
          </div>
        </form>
        
        <div className={styles.infoBox}>
          <p className={styles.infoText}>
            <strong>Email:</strong> {userEmail}
          </p>
          <p className={styles.infoText}>
            Вы сможете изменить данные профиля позже в настройках
          </p>
          <p className={styles.infoText}>
            Обязательно заполните только поле "Имя пользователя", остальные поля опциональны
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default CreateProfile;