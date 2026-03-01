import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, School, Plus } from "lucide-react";
import { useProfile } from "../../context/ProfileContext";
import { apiClient } from "../../lib/apiClient";
import styles from "./VerifySchool.module.css";

interface School {
  id: string;
  name: string;
  school_number?: string;
  unique_identifier?: string;
  school_code?: string;
  region?: string;
  teacher_count?: number;
  student_count?: number;
}

interface VerifySchoolProps {
  onClose: () => void; // закрытие модалки
}

const VerifySchool: React.FC<VerifySchoolProps> = ({ onClose }) => {
  const { profile, setProfile } = useProfile();
  const [schools, setSchools] = useState<School[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    schoolNumber: "",
    uniqueId: ""
  });
  const [loading, setLoading] = useState(false);

  const fetchSchools = async () => {
    try {
      const response = await apiClient.get('/schools');
      setSchools(response.data || []);
    } catch (error) {
      console.error("Ошибка загрузки школ:", error);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  const handleAddSchool = async () => {
    if (!formData.name.trim()) return;
    setLoading(true);

    try {
      const response = await apiClient.post('/schools', {
        name: formData.name.trim(),
        school_number: formData.schoolNumber.trim(),
        unique_identifier: formData.uniqueId.trim()
      });
      
      setProfile({ ...profile, school_id: response.data.id });
    } catch (error) {
      console.error("Ошибка добавления школы:", error);
      setLoading(false);
      return;
    }
    setFormData({ name: "", schoolNumber: "", uniqueId: "" });
    setShowForm(false);
    fetchSchools();
    setLoading(false);
  };

  const selectedSchool = schools.find(s => s.id === profile.school_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={styles.verifySchool}
    >
      <div className={styles.header}>
        <School size={20} />
        <h3>Верификация школы</h3>
        {profile.verified_school && (
          <div className={styles.verifiedTag}>
            <CheckCircle size={16} /> Подтверждено
          </div>
        )}
      </div>

      <div className={styles.schoolSelection}>
        <select
          value={profile.school_id || ""}
          onChange={(e) => setProfile({ ...profile, school_id: e.target.value })}
          className={styles.schoolSelect}
        >
          <option value="">Выберите школу</option>
          {schools.map((school) => (
            <option key={school.id} value={school.id}>
              {school.name} {school.school_number && `(№${school.school_number})`}
            </option>
          ))}
        </select>

        {/* Только для учителей: кнопка добавить школу */}
        {profile.role === "teacher" && (
          <button
            onClick={() => setShowForm(!showForm)}
            className={styles.addSchoolButton}
          >
            <Plus size={16} />
            Добавить школу
          </button>
        )}
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className={styles.addSchoolForm}
        >
          <input
            placeholder="Название школы *"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            placeholder="Номер школы"
            value={formData.schoolNumber}
            onChange={(e) => setFormData({ ...formData, schoolNumber: e.target.value })}
          />
          <input
            placeholder="Уникальный идентификатор"
            value={formData.uniqueId}
            onChange={(e) => setFormData({ ...formData, uniqueId: e.target.value })}
          />
          <div className={styles.formActions}>
            <button onClick={onClose}>Отмена</button>
            <button
              onClick={handleAddSchool}
              disabled={!formData.name.trim() || loading}
              className={styles.confirmButton}
            >
              {loading ? "Добавление..." : "Добавить"}
            </button>
          </div>
        </motion.div>
      )}

      {selectedSchool && (
        <div className={styles.currentSchool}>
          <strong>Текущая школа:</strong> {selectedSchool.name}
          {selectedSchool.school_number && ` №${selectedSchool.school_number}`}
        </div>
      )}
    </motion.div>
  );
};

export default VerifySchool;
