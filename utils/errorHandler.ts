// utils/errorHandler.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public field?: string
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export const handleAuthError = (error: any): AuthError => {
  if (error.message?.includes('Invalid login credentials')) {
    return new AuthError('Неверный email или пароль', 'INVALID_CREDENTIALS');
  }
  if (error.message?.includes('User already registered')) {
    return new AuthError('Пользователь уже зарегистрирован', 'USER_EXISTS', 'email');
  }
  if (error.message?.includes('Password should be at least')) {
    return new AuthError('Пароль слишком короткий', 'WEAK_PASSWORD', 'password');
  }
  return new AuthError('Произошла ошибка. Попробуйте позже', 'UNKNOWN_ERROR');
};