// src/components/school/SchoolAdminPanel.tsx (дополнительно)
import { useState, useEffect } from 'react';
import { Copy, Users, Download, QrCode, Mail, Shield } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { useProfile } from '../../context/ProfileContext';
import styles from './SchoolAdminPanel.module.css';

export default function SchoolAdminPanel() {
  const { profile } = useProfile();
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile?.school_id) {
      fetchSchoolData();
    }
  }, [profile?.school_id]);

  const fetchSchoolData = async () => {
    try {
      const response = await apiClient.get(`/schools/${profile.school_id}`);
      setSchool(response.data);
    } catch (error) {
      console.error('Ошибка загрузки данных школы:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (school?.school_code) {
      navigator.clipboard.writeText(school.school_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !profile || profile.role !== 'teacher') {
    return null;
  }

  if (!school) {
    return (
      <div className={styles.container}>
        <p>Школа не найдена</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Управление школой</h2>
        <div className={styles.schoolInfo}>
          <h3 className={styles.schoolName}>{school.name}</h3>
          <p className={styles.schoolDetails}>
            {school.city}
            {school.school_number && ` • Школа №${school.school_number}`}
          </p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <Users size={24} className={styles.statIcon} />
          <div>
            <p className={styles.statNumber}>{school.teacher_count}</p>
            <p className={styles.statLabel}>Учителей</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Users size={24} className={styles.statIcon} />
          <div>
            <p className={styles.statNumber}>{school.student_count}</p>
            <p className={styles.statLabel}>Учеников</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Shield size={24} className={styles.statIcon} />
          <div>
            <p className={styles.statCode}>{school.school_code}</p>
            <p className={styles.statLabel}>Код школы</p>
          </div>
        </div>
      </div>

      <div className={styles.inviteSection}>
        <h4>Пригласить в школу</h4>
        <div className={styles.inviteCodeBox}>
          <div className={styles.codeDisplay}>
            <span className={styles.codeText}>{school.school_code}</span>
            <button
              className={styles.copyButton}
              onClick={copyInviteCode}
              title="Скопировать код"
            >
              <Copy size={18} />
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
          <p className={styles.codeHint}>
            Поделитесь этим кодом с другими участниками
          </p>
        </div>

        <div className={styles.inviteActions}>
          <button className={styles.inviteButton}>
            <Mail size={18} />
            Отправить по email
          </button>
          <button className={styles.inviteButton}>
            <QrCode size={18} />
            QR-код
          </button>
          <button className={styles.inviteButton}>
            <Download size={18} />
            Скачать инструкцию
          </button>
        </div>
      </div>

      {profile.role === 'admin' && (
        <div className={styles.adminTools}>
          <h4>Инструменты администратора</h4>
          <div className={styles.adminButtons}>
            <button className={styles.adminButton}>
              Управление пользователями
            </button>
            <button className={styles.adminButton}>
              Редактировать информацию
            </button>
            <button className={styles.adminButton}>
              Статистика школы
            </button>
            <button className={styles.adminButton}>
              Генерация отчетов
            </button>
          </div>
        </div>
      )}
    </div>
  );
}