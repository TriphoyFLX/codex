    // gameData.ts

// --- ТИПЫ И ИНТЕРФЕЙСЫ ---

export interface GameState {
  level: number;
  xp: number;
  money: number;
  reputation: number;
  happiness: number;
  currentEvent: GameEvent | null;
  isGameOver: boolean;
  feedback: string;
  showFeedback: boolean;
  timer: number;
  currentStation: number;
  characterMood: 'happy' | 'sad' | 'neutral';
  isMoving: boolean;
}

export interface GameEvent { // Переименовал, чтобы не конфликтовать с Event из DOM
  id: number;
  title: string;
  description: string;
  options: Option[];
  station: number;
}

export interface Option {
  id: number;
  text: string;
  consequences: Consequences;
  type: 'positive' | 'negative' | 'neutral';
}

export interface Consequences {
  xp: number;
  money: number;
  reputation: number;
  happiness: number;
}

export interface Station {
  id: number;
  title: string;
  description: string;
  position: { x: number; y: number };
  requiredLevel: number;
}

// --- ИГРОВЫЕ ДАННЫЕ ---

export const stations: Station[] = [
  {
    id: 0,
    title: "Старт",
    description: "Начало вашего бизнес-пути",
    position: { x: 50, y: 80 },
    requiredLevel: 1
  },
  {
    id: 1,
    title: "Первые клиенты",
    description: "Привлечение первых покупателей",
    position: { x: 150, y: 60 },
    requiredLevel: 2
  },
  {
    id: 2,
    title: "Масштабирование",
    description: "Расширение бизнеса",
    position: { x: 250, y: 80 },
    requiredLevel: 3
  },
  {
    id: 3,
    title: "Команда",
    description: "Создание профессиональной команды",
    position: { x: 350, y: 40 },
    requiredLevel: 4
  },
  {
    id: 4,
    title: "Инвесторы",
    description: "Привлечение инвестиций",
    position: { x: 450, y: 70 },
    requiredLevel: 5
  },
  {
    id: 5,
    title: "Маркетинг",
    description: "Развитие бренда",
    position: { x: 550, y: 50 },
    requiredLevel: 6
  },
  {
    id: 6,
    title: "Лидерство",
    description: "Становление лидером рынка",
    position: { x: 650, y: 80 },
    requiredLevel: 7
  }
];

export const events: GameEvent[] = [
  {
    id: 1,
    title: "Начало пути",
    description: "Вы только начинаете свой бизнес. Какой подход выберете?",
    station: 0,
    options: [
      {
        id: 1,
        text: "Тщательное планирование и исследование рынка",
        type: "positive",
        consequences: { xp: 25, money: -1000, reputation: 10, happiness: -5 }
      },
      {
        id: 2,
        text: "Быстрый запуск с минимальными вложениями",
        type: "neutral",
        consequences: { xp: 15, money: -500, reputation: 5, happiness: 0 }
      },
      {
        id: 3,
        text: "Копирование успешных конкурентов",
        type: "negative",
        consequences: { xp: 10, money: -300, reputation: -5, happiness: -10 }
      }
    ]
  },
  {
    id: 2,
    title: "Первые клиенты",
    description: "К вам пришли первые клиенты. Как будете строить отношения?",
    station: 1,
    options: [
      {
        id: 1,
        text: "Предложить персонализированный сервис",
        type: "positive",
        consequences: { xp: 20, money: 1500, reputation: 15, happiness: 10 }
      },
      {
        id: 2,
        text: "Стандартный подход с базовым сервисом",
        type: "neutral",
        consequences: { xp: 15, money: 1000, reputation: 5, happiness: 0 }
      },
      {
        id: 3,
        text: "Сосредоточиться на количестве, а не качестве",
        type: "negative",
        consequences: { xp: 10, money: 800, reputation: -10, happiness: -15 }
      }
    ]
  },
  // ... (остальные события скопируй отсюда из своего кода) ...
  {
    id: 6,
    title: "Развитие бренда",
    description: "Пора работать над узнаваемостью бренда. Какой подход?",
    station: 5,
    options: [
      {
        id: 1,
        text: "Инвестировать в качественный контент и PR",
        type: "positive",
        consequences: { xp: 35, money: -4000, reputation: 35, happiness: 10 }
      },
      {
        id: 2,
        text: "Сфокусироваться на digital-маркетинге",
        type: "neutral",
        consequences: { xp: 25, money: -2000, reputation: 20, happiness: 5 }
      },
      {
        id: 3,
        text: "Агрессивная реклама без стратегии",
        type: "negative",
        consequences: { xp: 15, money: -3000, reputation: 5, happiness: -10 }
      }
    ]
  }
];


// --- ИГРОВЫЕ УТИЛИТЫ ---

export const calculateLevel = (xp: number): number => {
  return Math.floor(xp / 100) + 1;
};

export const getNextLevelXP = (currentXP: number): number => {
  const currentLevel = calculateLevel(currentXP);
  return (currentLevel * 100) - currentXP;
};

export const INITIAL_GAME_STATE: GameState = {
  level: 1,
  xp: 0,
  money: 5000,
  reputation: 75,
  happiness: 80,
  currentEvent: null,
  isGameOver: false,
  feedback: '',
  showFeedback: false,
  timer: 0,
  currentStation: 0,
  characterMood: 'neutral',
  isMoving: false
};