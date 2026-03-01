// src/components/profile/ProfileDetails.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Award, BookOpen } from "lucide-react";
import VerifySchool from "../verefySchool/VerifySchool";
import styles from "./ProfileDetails.module.css";

interface ProfileDetailsProps {
  profile: any;
  setProfile: (profile: any) => void;
  onSave: () => Promise<void>;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({
  profile,
  setProfile,
  onSave
}) => {
  const [newPortfolio, setNewPortfolio] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newBadge, setNewBadge] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave();
      alert("Изменения сохранены!");
    } catch (error) {
      console.error("Ошибка сохранения:", error);
      alert("Ошибка при сохранении изменений");
    } finally {
      setIsSaving(false);
    }
  };

  const addPortfolioLink = () => {
    if (!newPortfolio.trim()) return;
    const updatedLinks = [...(profile.portfolio_links || [])];
    
    // Проверяем, есть ли уже такая ссылка
    if (!updatedLinks.includes(newPortfolio.trim())) {
      updatedLinks.push(newPortfolio.trim());
      setProfile({ 
        ...profile, 
        portfolio_links: updatedLinks 
      });
    }
    
    setNewPortfolio("");
  };

  const removePortfolioLink = (index: number) => {
    const updated = [...(profile.portfolio_links || [])];
    updated.splice(index, 1);
    setProfile({ ...profile, portfolio_links: updated });
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    const updatedSubjects = [...(profile.favorite_subjects || [])];
    
    if (!updatedSubjects.includes(newSubject.trim())) {
      updatedSubjects.push(newSubject.trim());
      setProfile({ 
        ...profile, 
        favorite_subjects: updatedSubjects 
      });
    }
    
    setNewSubject("");
  };

  const removeSubject = (index: number) => {
    const updated = [...(profile.favorite_subjects || [])];
    updated.splice(index, 1);
    setProfile({ ...profile, favorite_subjects: updated });
  };

  const addBadge = () => {
    if (!newBadge.trim()) return;
    const updatedBadges = [...(profile.badges || [])];
    
    if (!updatedBadges.includes(newBadge.trim())) {
      updatedBadges.push(newBadge.trim());
      setProfile({ 
        ...profile, 
        badges: updatedBadges 
      });
    }
    
    setNewBadge("");
  };

  const removeBadge = (index: number) => {
    const updated = [...(profile.badges || [])];
    updated.splice(index, 1);
    setProfile({ ...profile, badges: updated });
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className={styles.detailsContainer}>
      {/* Статистика */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className={styles.statsSection}
      >
        <div className={styles.statCard}>
          <BookOpen size={24} />
          <div>
            <span className={styles.statNumber}>{profile.lessons_completed || 0}</span>
            <span className={styles.statLabel}>уроков пройдено</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <Award size={24} />
          <div>
            <span className={styles.statNumber}>{profile.completed_tasks || 0}</span>
            <span className={styles.statLabel}>заданий выполнено</span>
          </div>
        </div>
      </motion.div>

      {/* Основная информация */}
      <div className={styles.formSection}>
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
          <h3>Основная информация</h3>
          <div className={styles.formGrid}>
            <div className={styles.inputGroup}>
              <label>Возраст</label>
              <input
                type="number"
                value={profile.age || ""}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) || null })}
                min="1"
                max="120"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Город</label>
              <input
                value={profile.city || ""}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                placeholder="Например: Омск"
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Интересы</label>
              <input
                value={profile.interests || ""}
                onChange={(e) => setProfile({ ...profile, interests: e.target.value })}
                placeholder="Ваши увлечения..."
              />
            </div>
          </div>
        </motion.div>

        {/* Любимые предметы */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
          <h3>Любимые предметы</h3>
          <div className={styles.chips}>
            {(profile.favorite_subjects || []).map((subject: string, index: number) => (
              <span key={index} className={styles.chip}>
                {subject}
                <button 
                  onClick={() => removeSubject(index)}
                  className={styles.removeChip}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className={styles.addInput}>
            <input
              placeholder="Добавить предмет..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addSubject()}
            />
            <button onClick={addSubject} className={styles.addButton}>
              <Plus size={16} />
            </button>
          </div>
        </motion.div>

        {/* Значки */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
          <h3>Значки и достижения</h3>
          <div className={styles.badges}>
            {(profile.badges || []).map((badge: string, index: number) => (
              <div key={index} className={styles.badge}>
                <Award size={16} />
                {badge}
                <button 
                  onClick={() => removeBadge(index)}
                  className={styles.removeBadge}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div className={styles.addInput}>
            <input
              placeholder="Добавить значок..."
              value={newBadge}
              onChange={(e) => setNewBadge(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addBadge()}
            />
            <button onClick={addBadge} className={styles.addButton}>
              <Plus size={16} />
            </button>
          </div>
        </motion.div>

        {/* Портфолио */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
          <h3>Портфолио и проекты</h3>
          <div className={styles.portfolioList}>
            {(profile.portfolio_links || []).map((link: string, index: number) => (
              <div key={index} className={styles.portfolioItem}>
                <a 
                  href={link.startsWith('http') ? link : `https://${link}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.portfolioLink}
                >
                  {link}
                </a>
                <button onClick={() => removePortfolioLink(index)} className={styles.deleteButton}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className={styles.portfolioInput}>
            <input
              placeholder="https://example.com или example.com"
              value={newPortfolio}
              onChange={(e) => setNewPortfolio(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addPortfolioLink()}
            />
            <button onClick={addPortfolioLink} className={styles.addButton}>
              <Plus size={16} />
            </button>
          </div>
        </motion.div>

        {/* Заметки */}
        <motion.div variants={cardVariants} initial="hidden" animate="visible" className={styles.card}>
          <h3>Заметки</h3>
          <div className={styles.notes}>
            <div className={styles.noteGroup}>
              <label>Личные заметки</label>
              <textarea
                value={profile.personal_notes || ""}
                onChange={(e) => setProfile({ ...profile, personal_notes: e.target.value })}
                placeholder="Ваши личные заметки, цели, планы..."
                rows={4}
              />
            </div>
            {profile.role === 'teacher' && (
              <div className={styles.noteGroup}>
                <label>Заметки преподавателей</label>
                <textarea
                  value={profile.teacher_notes || ""}
                  onChange={(e) => setProfile({ ...profile, teacher_notes: e.target.value })}
                  placeholder="Заметки для студентов..."
                  rows={4}
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Верификация школы */}
        <VerifySchool onClose={() => {}} />

        {/* Кнопка сохранения */}
        <motion.button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSaving}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSaving ? "Сохранение..." : "Сохранить все изменения"}
        </motion.button>
      </div>
    </div>
  );
};

export default ProfileDetails;