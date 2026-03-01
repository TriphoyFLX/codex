import React, { useState, useEffect } from "react";
import styles from "./AuthForm.module.css";

interface PasswordStrengthIndicatorProps {
  password: string;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({ password }) => {
  const [strength, setStrength] = useState<{
    score: number;
    label: string;
    color: string;
  }>({ score: 0, label: "Введите пароль", color: "#9CA3AF" });

  const calculateStrength = (pass: string) => {
    let score = 0;
    
    if (!pass) return { score: 0, label: "Введите пароль", color: "#9CA3AF" };
    
    // Длина
    if (pass.length >= 8) score++;
    if (pass.length >= 12) score++;
    
    // Сложность
    if (/[A-Z]/.test(pass)) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pass)) score++;
    
    // Определяем уровень
    let label = "Очень слабый";
    let color = "#EF4444";
    
    if (score >= 6) {
      label = "Очень сильный";
      color = "#10B981";
    } else if (score >= 5) {
      label = "Сильный";
      color = "#3B82F6";
    } else if (score >= 4) {
      label = "Средний";
      color = "#F59E0B";
    } else if (score >= 2) {
      label = "Слабый";
      color = "#F97316";
    }
    
    return { score, label, color };
  };

  useEffect(() => {
    setStrength(calculateStrength(password));
  }, [password]);

  const getStrengthBars = () => {
    const bars = [];
    const maxBars = 4;
    const filledBars = Math.min(Math.floor((strength.score / 6) * maxBars), maxBars);
    
    for (let i = 0; i < maxBars; i++) {
      bars.push(
        <div
          key={i}
          className={styles.strengthBar}
          style={{
            backgroundColor: i < filledBars ? strength.color : "#E5E7EB",
            width: `${100 / maxBars}%`,
            margin: "0 2px",
            height: "6px",
            borderRadius: "3px",
            transition: "all 0.3s ease"
          }}
        />
      );
    }
    
    return bars;
  };

  return (
    <div className={styles.passwordStrength}>
      <div className={styles.strengthInfo}>
        <span className={styles.strengthLabel} style={{ color: strength.color }}>
          {strength.label}
        </span>
        <div className={styles.strengthBars}>
          {getStrengthBars()}
        </div>
      </div>
      {password && strength.score < 6 && (
        <div className={styles.requirements}>
          {password.length < 8 && <span>• Минимум 8 символов</span>}
          {!/[A-Z]/.test(password) && <span>• Заглавная буква</span>}
          {!/\d/.test(password) && <span>• Цифра</span>}
          {!/[!@#$%^&*(),.?":{}|<>]/.test(password) && <span>• Спецсимвол</span>}
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;