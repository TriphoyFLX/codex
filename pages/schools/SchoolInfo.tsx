// src/components/school/SchoolInfo.tsx
import { School, MapPin, Users, Hash } from 'lucide-react';
import { useSchool } from '../../hooks/useSchool';
import styles from './SchoolInfo.module.css';

interface SchoolInfoProps {
  compact?: boolean;
  showCode?: boolean;
}

export default function SchoolInfo({ compact = false, showCode = true }: SchoolInfoProps) {
  const { school, loading } = useSchool();

  if (loading) {
    return <div className={styles.loading}>Загрузка...</div>;
  }

  if (!school) {
    return <div className={styles.noSchool}>Школа не выбрана</div>;
  }

  if (compact) {
    return (
      <div className={styles.compactContainer}>
        <School size={16} className={styles.icon} />
        <span className={styles.schoolName}>{school.name}</span>
        {showCode && school.school_code && (
          <div className={styles.codeBadge}>
            <Hash size={12} />
            {school.school_code}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <School size={24} className={styles.icon} />
        <h3 className={styles.title}>{school.name}</h3>
      </div>
      
      <div className={styles.details}>
        <div className={styles.detail}>
          <MapPin size={16} />
          <span>
            {school.city}
            {school.region && `, ${school.region}`}
          </span>
        </div>
        
        {school.school_number && (
          <div className={styles.detail}>
            <span>Школа №{school.school_number}</span>
          </div>
        )}
        
        <div className={styles.detail}>
          <Users size={16} />
          <span>
            {(school.teacher_count || 0) + (school.student_count || 0)} участников
            {(school.teacher_count || 0) > 0 && ` (${school.teacher_count} учителей)`}
          </span>
        </div>
        
        {showCode && school.school_code && (
          <div className={styles.codeSection}>
            <Hash size={16} />
            <span className={styles.codeLabel}>Код школы:</span>
            <code className={styles.code}>{school.school_code}</code>
          </div>
        )}
      </div>
    </div>
  );
}