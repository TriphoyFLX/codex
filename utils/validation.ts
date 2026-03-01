// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  if (password.length < 8) errors.push("Минимум 8 символов");
  if (!/[A-Z]/.test(password)) errors.push("Хотя бы одна заглавная буква");
  if (!/[a-z]/.test(password)) errors.push("Хотя бы одна строчная буква");
  if (!/\d/.test(password)) errors.push("Хотя бы одна цифра");
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push("Хотя бы один спецсимвол");
  
  return { isValid: errors.length === 0, errors };
};

export const handleAuthError = (error: any): { message: string; field?: string } => {
  console.error('Auth error:', error);
  
  // Supabase ошибки
  if (error.message?.includes('Invalid login credentials')) {
    return { message: 'Неверный email или пароль', field: 'general' };
  }
  
  if (error.message?.includes('User already registered')) {
    return { message: 'Пользователь с таким email уже зарегистрирован', field: 'email' };
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return { message: 'Подтвердите email для входа', field: 'email' };
  }
  
  if (error.message?.includes('Password should be at least')) {
    return { message: 'Пароль слишком короткий', field: 'password' };
  }
  
  if (error.message?.includes('rate_limit')) {
    return { message: 'Слишком много попыток. Попробуйте позже', field: 'general' };
  }
  
  if (error.message?.includes('network')) {
    return { message: 'Ошибка сети. Проверьте подключение', field: 'general' };
  }
  
  // Кастомные ошибки
  if (error.message?.includes('Пройдите проверку безопасности')) {
    return { message: error.message, field: 'captcha' };
  }
  
  if (error.message?.includes('Примите условия использования')) {
    return { message: error.message, field: 'terms' };
  }
  
  if (error.message?.includes('Неверный код учителя')) {
    return { message: error.message, field: 'teacherCode' };
  }
  
  // По умолчанию
  return { message: 'Произошла ошибка. Попробуйте позже', field: 'general' };
};

// Дополнительная функция для получения IP клиента
export const getClientIP = async (): Promise<string> => {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    return 'unknown';
  }
};


export const validateFullName = (name: string): boolean => {
  return name.trim().split(' ').length >= 2 && name.trim().length > 5;
};