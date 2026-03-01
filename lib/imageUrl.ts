// Утилита для правильных URL изображений
const API_BASE_URL = import.meta.env.VITE_API_URL || '${VITE_API_URL:-http://85.198.70.191/api}';

export const getImageUrl = (imagePath: string) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http')) return imagePath;
  return `${API_BASE_URL}/uploads/${imagePath}`;
};
