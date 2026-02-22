import type { Translation } from '../../types/index.js';

export const en: Translation = {
  ui: {
    title: 'Drobodans',
    deckCounter: 'Deck',
    queensCounter: 'Queens',
    jackHolder: 'Jack',
    noJackHolder: 'None',
    tapPrompt: 'Tap the deck!',
    newGame: 'New Game',
    gameOver: 'Game Over!',
    fourthQueen: 'Fourth Queen! Drink the communal cup!',
    language: 'UA',
    theme: '◑',
    cardsLeft: 'cards',
  },
  rules: {
    toast: {
      title: 'Toast',
      description: 'Make a toast! Everyone drinks.',
    },
    count: {
      title: 'Count',
      description: 'Count in a circle. On multiples of 7 — clap. Whoever messes up — drinks.',
    },
    theme: {
      title: 'Theme',
      description: 'Name a theme. Take turns naming words. Can\'t think of one? Drink.',
    },
    skip: {
      title: 'Skip',
      description: 'Skip your turn to drink. Lucky you!',
    },
    drinkSelf: {
      title: 'Drink Yourself',
      description: 'Just drink. No questions asked.',
    },
    jackQuestion: {
      title: 'Question Master',
      description: 'You are now the Question Master. Whoever answers your question — drinks. Active until next Jack.',
    },
    queenCup: {
      title: 'Queen — Cup',
      description: 'Pour some of your drink into the communal cup. On the fourth Queen — drink it!',
    },
    kingBuddy: {
      title: 'King — Buddy',
      description: 'Choose a buddy. When you drink — they drink too!',
    },
    aceImmunity: {
      title: 'Ace — Immunity',
      description: 'One-time immunity. Use it to skip drinking (except the fourth Queen).',
    },
  },
};
