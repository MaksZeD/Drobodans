import type { Translation } from '../../types/index.js';

export const ua: Translation = {
  ui: {
    title: 'Дрободанс',
    deckCounter: 'Колода',
    queensCounter: 'Дами',
    jackHolder: 'Валет',
    noJackHolder: 'Немає',
    tapPrompt: 'Тисни на колоду!',
    newGame: 'Нова Гра',
    gameOver: 'Гру закінчено!',
    fourthQueen: 'Четверта дама! Пий спільну чашу!',
    language: 'EN',
    theme: '◑',
    cardsLeft: 'карт',
  },
  rules: {
    toast: {
      title: 'Тост',
      description: 'Скажи тост! Всі п\'ють.',
    },
    count: {
      title: 'Рахуєте',
      description: 'Рахуйте по колу. На кратне 7 — плескайте. Хто помилився — п\'є.',
    },
    theme: {
      title: 'Тема',
      description: 'Назви тему. По колу називайте слова. Хто не зміг — п\'є.',
    },
    skip: {
      title: 'Пропуск',
      description: 'Пропускаєш свою чергу пити. Пощастило!',
    },
    drinkSelf: {
      title: 'П\'єш сам',
      description: 'Просто пий. Без питань.',
    },
    jackQuestion: {
      title: 'Валет — Питання',
      description: 'Ти тепер Майстер Питань. Хто відповість на твоє питання — п\'є. Діє до наступного валета.',
    },
    queenCup: {
      title: 'Дама — Чаша',
      description: 'Долий напій у спільну чашу. На четвертій дамі — п\'єш її!',
    },
    kingBuddy: {
      title: 'Король — Побратим',
      description: 'Обери побратима. Коли п\'єш ти — п\'є і він!',
    },
    aceImmunity: {
      title: 'Туз — Імунітет',
      description: 'Одноразовий імунітет. Використай щоб не пити (окрім четвертої дами).',
    },
  },
};
