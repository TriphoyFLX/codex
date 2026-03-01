import React from "react";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { validateEmail, validatePassword, handleAuthError } from "../../utils/validation";
import PasswordStrengthIndicator from "./PasswordStrengthIndicator";
import TermsModal from "./TermsModal";
import { useProfile } from "../../context/ProfileContext";
import { apiClient } from "../../lib/apiClient";

import styles from "./AuthForm.module.css";

export default function AuthForm() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const { refreshProfile } = useProfile();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    teacherCode: "",
    acceptTerms: false,
  });

  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [burst, setBurst] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const newErrors: Record<string, string | undefined> = {};

    if (!isLogin) {
      if (formData.fullName) {
        const trimmed = formData.fullName.trim();
        if (trimmed.length < 3) {
          newErrors.fullName = "Имя должно быть не менее 3 символов";
        } else if (trimmed.split(/\s+/).length < 2) {
          newErrors.fullName = "Введите имя и фамилию";
        }
      }

      if (formData.email && !validateEmail(formData.email)) {
        newErrors.email = "Некорректный email";
      }

      if (formData.password) {
        const validation = validatePassword(formData.password);
        if (!validation.isValid) {
          newErrors.password = validation.errors?.[0] || "Пароль слишком слабый";
        }
      }

      if (formData.password && formData.confirmPassword) {
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Пароли не совпадают";
        }
      }
    }

    setErrors(newErrors);
  }, [formData, isLogin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});
    setBurst(true);

    try {
      if (!formData.email?.trim()) throw new Error("Введите email");
      if (!isTeacher && !formData.password) throw new Error("Введите пароль");
      if (isTeacher && !formData.teacherCode?.trim()) throw new Error("Введите код учителя");

      if (isLogin) {
        // Вход
        if (isTeacher) {
          // Вход учителя по коду
          if (formData.teacherCode !== 'teacher123') {
            throw new Error("Неверный код учителя");
          }
          
          const response = await apiClient.post('/auth/teacher-login', {
            code: formData.teacherCode,
            email: formData.email.trim()
          });

          if (!response.data) {
            throw new Error(response.data?.error || 'Ошибка входа учителя');
          }

          localStorage.setItem('auth_token', response.data.token);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          setSuccessMessage("Успешный вход!");
          await refreshProfile();
          setTimeout(() => navigate("/profile"), 1200);
        } else {
          // Вход ученика
          const { user, error } = await login(formData.email.trim(), formData.password);

          if (error) throw error;

          setSuccessMessage("Успешный вход!");
          await refreshProfile();
          setTimeout(() => navigate("/tests"), 1200);
        }
      } else {
        // Регистрация
        if (!formData.fullName?.trim()) throw new Error("Введите имя и фамилию");
        if (!formData.acceptTerms) throw new Error("Примите условия использования");

        const nameParts = formData.fullName.trim().split(/\s+/);
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(' ');

        if (isTeacher) {
          // Регистрация учителя по коду
          if (formData.teacherCode !== 'teacher123') {
            throw new Error("Неверный код учителя");
          }

          const response = await fetch('${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://85.198.70.191"}/api/auth/teacher-login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code: formData.teacherCode, email: formData.email.trim() }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации учителя');
          }

          localStorage.setItem('auth_token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          setSuccessMessage("Регистрация учителя успешна!");
          await refreshProfile();
          setTimeout(() => navigate("/profile"), 1200);
        } else {
          // Регистрация ученика
          const { user, error } = await register(
            formData.email.trim(),
            formData.password,
            `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // уникальный username
            firstName,
            lastName
          );

          if (error) throw error;

          setSuccessMessage("Регистрация успешна!");
          await refreshProfile();
          setTimeout(() => navigate("/create-profile"), 2000);
        }
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      handleAuthError(error);
    } finally {
      setIsLoading(false);
      setTimeout(() => setBurst(false), 600);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
      teacherCode: "",
      acceptTerms: false,
    });
    setErrors({});
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    resetForm();
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.logo}>Codex</div>
          <h1 className={styles.slogan}>
            {isLogin 
              ? "Добро пожаловать в будущее образования"
              : "Начните свой путь в программировании"
            }
          </h1>

          {successMessage && (
            <div className={styles.success}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {!isLogin && (
              <div className={styles.inputGroup}>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className={`${styles.input} ${errors.fullName ? styles.error : ""}`}
                  placeholder="Иван Иванов"
                />
                {errors.fullName && <span className={styles.fieldError}>{errors.fullName}</span>}
              </div>
            )}

            <div className={styles.inputGroup}>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className={`${styles.input} ${errors.email ? styles.error : ""}`}
                placeholder="your@email.com"
              />
              {errors.email && <span className={styles.fieldError}>{errors.email}</span>}
            </div>

            {isLogin && (
              <div className={styles.roleSelector}>
                <label className={styles.roleOption}>
                  <input type="radio" name="role" checked={!isTeacher} onChange={() => setIsTeacher(false)} />
                  <span>Ученик</span>
                </label>
                <label className={styles.roleOption}>
                  <input type="radio" name="role" checked={isTeacher} onChange={() => setIsTeacher(true)} />
                  <span>Учитель</span>
                </label>
              </div>
            )}

            {!isLogin && (
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`${styles.input} ${errors.password ? styles.error : ""}`}
                  placeholder="Минимум 8 символов"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.showPassword}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
                <PasswordStrengthIndicator password={formData.password} />
              </div>
            )}

            {isLogin && !isTeacher && (
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className={`${styles.input} ${errors.password ? styles.error : ""}`}
                  placeholder="Пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={styles.showPassword}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                {errors.password && <span className={styles.fieldError}>{errors.password}</span>}
              </div>
            )}

            {!isLogin && (
              <div className={styles.passwordWrapper}>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  className={`${styles.input} ${errors.confirmPassword ? styles.error : ""}`}
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={styles.showPassword}
                >
                  {showConfirmPassword ? "👁️" : "👁️‍🗨️"}
                </button>
                {errors.confirmPassword && <span className={styles.fieldError}>{errors.confirmPassword}</span>}
              </div>
            )}

            {isTeacher && (
              <div className={styles.inputGroup}>
                <input
                  type="password"
                  value={formData.teacherCode}
                  onChange={(e) => setFormData({...formData, teacherCode: e.target.value})}
                  className={`${styles.input} ${errors.teacherCode ? styles.error : ""}`}
                  placeholder="Код доступа учителя"
                />
                {errors.teacherCode && <span className={styles.fieldError}>{errors.teacherCode}</span>}
                <span className={styles.hint}>Код у админа</span>
              </div>
            )}

            {!isLogin && (
              <div className={styles.termsContainer}>
                <label className={styles.termsLabel}>
                  <input
                    type="checkbox"
                    checked={formData.acceptTerms}
                    onChange={(e) => setFormData({...formData, acceptTerms: e.target.checked})}
                  />
                  Я принимаю{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className={styles.termsLink}
                  >
                    условия использования
                  </button>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`${styles.button} ${isLoading ? styles.buttonLoading : ''}`}
            >
              {isLoading ? "Загрузка..." : (
                isLogin 
                  ? (isTeacher ? "Войти как учитель" : "Войти")
                  : (isTeacher ? "Зарегистрироваться как учитель" : "Зарегистрироваться")
              )}
            </button>

            {errors.general && <div className={styles.error}>{errors.general}</div>}
          </form>

          <div className={styles.switchText}>
            {isLogin ? "Нет аккаунта? " : "Уже есть аккаунт? "}
            <button
              type="button"
              onClick={switchMode}
              className={styles.switchLink}
            >
              {isLogin ? "Зарегистрироваться" : "Войти"}
            </button>
          </div>
        </div>

        <div className={`${styles.rightPanel} ${burst ? styles.burst : ''}`}>
          <div className={styles.infoBubbleTop}>
            <strong>500+</strong>
            <br />
            Интерактивных уроков
            <div className={styles.bubbleDot}></div>
          </div>
          
          <div className={styles.infoBubbleBottom}>
            <strong>10K+</strong>
            <br />
            Активных студентов
            <div className={styles.bubbleDot}></div>
          </div>
        </div>
      </div>

      {showTerms && (
        <TermsModal onClose={() => setShowTerms(false)} />
      )}
    </div>
  );
}
