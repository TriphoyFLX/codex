import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePublicProfile } from "../../hooks/usePublicProfile";
import PublicProfileHeader from "./PublicProfileHeader";
import PublicPostsSection from "./PublicPostsSection";
import { ArrowLeft } from "lucide-react";
import styles from "./PublicProfile.module.css";

const PublicProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { profile, loading, error } = usePublicProfile(userId || '');

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Загрузка профиля...</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <button onClick={handleGoBack} className={styles.backButton}>
            <ArrowLeft size={20} />
            Назад
          </button>
          <div className={styles.errorContent}>
            <h2>Профиль не найден</h2>
            <p>{error || 'Профиль не найден или является приватным'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button onClick={handleGoBack} className={styles.backButton}>
        <ArrowLeft size={20} />
        Назад
      </button>
      
      <PublicProfileHeader profile={profile} />
      <PublicPostsSection userId={profile.id} />
    </div>
  );
};

export default PublicProfile;
