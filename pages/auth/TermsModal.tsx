import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./AuthForm.module.css";

interface TermsModalProps {
  onClose: () => void;
}

const TermsModal: React.FC<TermsModalProps> = ({ onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        className={styles.modalOverlay}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className={styles.modalContent}
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.modalHeader}>
            <h2>Условия использования</h2>
            <button onClick={onClose} className={styles.closeButton}>
              ×
            </button>
          </div>
          
          <div className={styles.modalBody}>
            <div className={styles.termsContent}>
              <h3>Пользовательское соглашение</h3>
              <p>
                Настоящее Соглашение регулирует отношения между Администрацией платформы CODEX.STRIVE 
                и Пользователем по использованию Сервиса.
              </p>
              
              <h4>1. Общие положения</h4>
              <p>
                1.1. Использование Сервиса означает полное и безоговорочное принятие Пользователем 
                условий настоящего Соглашения.
              </p>
              
              <h4>2. Права и обязанности сторон</h4>
              <p>
                2.1. Пользователь обязуется:
              </p>
              <ul>
                <li>Предоставлять достоверную информацию при регистрации</li>
                <li>Не передавать учетные данные третьим лицам</li>
                <li>Соблюдать законодательство РФ при использовании Сервиса</li>
                <li>Не нарушать права интеллектуальной собственности</li>
              </ul>
              
              <h4>3. Конфиденциальность</h4>
              <p>
                Мы собираем и обрабатываем ваши персональные данные в соответствии с 
                нашей <a href="/privacy" target="_blank">Политикой конфиденциальности</a>.
              </p>
              
              <h4>4. Ответственность</h4>
              <p>
                4.1. Пользователь несет ответственность за достоверность предоставленных данных.
              </p>
              
              <h4>5. Заключительные положения</h4>
              <p>
                Администрация вправе в одностороннем порядке изменять условия Соглашения. 
                Изменения вступают в силу с момента их публикации на Сайте.
              </p>
            </div>
            
            <div className={styles.modalActions}>
              <button onClick={onClose} className={styles.acceptButton}>
                Принимаю условия
              </button>
              <button onClick={onClose} className={styles.declineButton}>
                Отклонить
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TermsModal;