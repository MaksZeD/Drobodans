export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Value = '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';
export type RuleKey = 'toast' | 'count' | 'theme' | 'skip' | 'drinkSelf' | 'jackQuestion' | 'queenCup' | 'kingBuddy' | 'aceImmunity';

export interface Card {
  suit: Suit;
  value: Value;
  ruleKey: RuleKey;
  id: string;
}

export interface GameStateData {
  queenCount: number;
  jackHolder: string | null;
  currentCard: Card | null;
  remainingCards: number;
  isGameOver: boolean;
}

export type Theme = 'dark' | 'light';
export type Locale = 'en' | 'ua';

export interface Translation {
  ui: {
    title: string;
    deckCounter: string;
    queensCounter: string;
    jackHolder: string;
    noJackHolder: string;
    tapPrompt: string;
    newGame: string;
    gameOver: string;
    fourthQueen: string;
    language: string;
    theme: string;
    cardsLeft: string;
  };
  rules: Record<RuleKey, {
    title: string;
    description: string;
  }>;
}

export type GameEvent = 'queenDrawn' | 'fourthQueen' | 'jackDrawn' | 'gameOver' | 'stateChanged' | 'cardProcessed';
