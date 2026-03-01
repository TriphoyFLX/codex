import React, { useState } from "react";
import styles from "./EnrollModal.module.css";

interface EnrollModalProps {
  courseName: string;
  courseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, phone: string) => Promise<void>;
}

const EnrollModal: React.FC<EnrollModalProps> = ({
  courseName,
  isOpen,
  onClose,
  onSubmit
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    // Простая валидация
    if (!name.trim()) {
      setError("Введите имя");
      return;
    }
    
    if (!phone.trim()) {
      setError("Введите номер телефона");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name, phone);
      setName("");
      setPhone("");
      onClose();
    } catch (err) {
      setError("Ошибка при отправке заявки");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Запись на курс</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.courseName}>Курс: <strong>{courseName}</strong></p>
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Имя *</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введите ваше имя"
                disabled={loading}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="phone">Номер телефона *</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 999-99-99"
                disabled={loading}
              />
            </div>
            
            {error && <div className={styles.error}>{error}</div>}
            
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={onClose}
                disabled={loading}
              >
                Отмена
              </button>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? "Отправка..." : "Отправить заявку"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EnrollModal;