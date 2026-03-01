import styles from './Olympiad.module.css';

// Иконки-заглушки (можно вынести в отдельный файл)
const ArrowRightIcon = () => (
  <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

export default function OlympiadSection() {
  return (
    <section className={styles.olimpiadSection}>
      {/* Куб, который "выходит" из-под карточки */}
      <div className={styles.olimpiadCube} />

      {/* 1. Бэйджи: ДОЛЖНЫ БЫТЬ ПРЯМЫМИ ПОТОМКАМИ .olimpiadSection */}
      <div className={styles.olimpiadMeta}>
        <div className={styles.metaBadge}>45мин</div>
        <div className={styles.metaBadge}>8-9кл</div>
      </div>

      {/* 2. Футер: ДОЛЖЕН БЫТЬ ПРЯМЫМ ПОТОМКОМ .olimpiadSection */}
      <div className={styles.olimpiadFooter}>
        Троицкая школа, 15 октября, 19:00
      </div>

      {/* 3. Основной контент (левая сторона) */}
      <div className={styles.olimpiadContent}>
        {/* Заголовок, подзаголовок и кнопка внутри Content */}
        <div>
          <h1 className={styles.olimpiadTitle}>Новая олимпиада по информатике</h1>
          <p className={styles.olimpiadSubtitle}>
            Проявите себя, и получите сертификат на 5 бесплатных обедов в Роситк.
          </p>
        </div>

        {/* Обертка для кнопки */}
        <div className={styles.participateButtonWrapper}>
          <button className={styles.participateButton}>
            Участвовать
          </button>
          <div className={styles.buttonArrowOverlay}>
            <ArrowRightIcon />
          </div>
        </div>
      </div>

      {/* Фиолетовая фоновая область с изображением (правая сторона) */}
      <div className={styles.olimpiadImageWrapper}>
        {/* Изображение и Union-эффект через CSS */}
      </div>
    </section>
  );
}