import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { apiClient } from "../../lib/apiClient";
import { useNavigate } from "react-router-dom";
import { Clock, Users, ArrowUpRight } from "lucide-react";
import styles from "./HomeTestsPreview.module.css";

interface Test {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  question_count: number;
  attempts: number;
  teacher_id: string;
  subject: string;
  is_published: boolean;
  created_at: string;
}

const HomeTestsPreview: React.FC = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/quizzes?published=true');
      const allTests = response.data as Test[];
      // Показываем только первые 2 теста
      setTests(allTests.slice(0, 2));
    } catch (error) {
      console.error('Error fetching tests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return (
    <section className={styles.testsPreview}>
      <div className={styles.sectionHeader}>
        <h2>Доступные тесты</h2>
        <button 
          className={styles.seeMoreButton}
          onClick={() => navigate('/tests')}
        >
          Все тесты
          <ArrowUpRight size={16} />
        </button>
      </div>

      {loading ? (
        <div className={styles.loadingState}>
          <p>Загрузка тестов...</p>
        </div>
      ) : (
        <div className={styles.testsGrid}>
          {tests.map((test) => (
            <motion.div
              key={test.id}
              className={styles.testCard}
              whileHover={{ y: -4 }}
              transition={{ type: "spring", stiffness: 300 }}
              onClick={() => navigate(`/tests/${test.id}`)}
            >
              <div className={styles.testHeader}>
                <div className={styles.testSubject}>{test.subject}</div>
                <div className={styles.testMeta}>
                  <div className={styles.metaItem}>
                    <Clock size={14} />
                    <span>{test.duration_minutes} мин</span>
                  </div>
                  <div className={styles.metaItem}>
                    <Users size={14} />
                    <span>{test.attempts} попыток</span>
                  </div>
                </div>
              </div>

              <div className={styles.testContent}>
                <h3 className={styles.testTitle}>{test.title}</h3>
                <p className={styles.testDescription}>
                  {test.description.length > 120 
                    ? `${test.description.substring(0, 120)}...` 
                    : test.description
                  }
                </p>
              </div>

              <div className={styles.testFooter}>
                <div className={styles.testInfo}>
                  <span className={styles.questionsCount}>{test.question_count} вопросов</span>
                  <span className={styles.teacherName}>ID: {test.teacher_id}</span>
                </div>
                <div className={styles.testAction}>
                  <span>Начать</span>
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
};

export default HomeTestsPreview;
