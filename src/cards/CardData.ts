import type { Suit, Value, RuleKey, Card } from '../types/index.js';

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
export const VALUES: Value[] = ['6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const VALUE_TO_RULE: Record<Value, RuleKey> = {
  '6': 'toast',
  '7': 'count',
  '8': 'theme',
  '9': 'skip',
  '10': 'drinkSelf',
  'J': 'jackQuestion',
  'Q': 'queenCup',
  'K': 'kingBuddy',
  'A': 'aceImmunity',
};

export function isRedSuit(suit: Suit): boolean {
  return suit === 'hearts' || suit === 'diamonds';
}

export function createFullDeck(): Card[] {
  const cards: Card[] = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      cards.push({
        suit,
        value,
        ruleKey: VALUE_TO_RULE[value],
        id: `${value}_${suit}`,
      });
    }
  }
  return cards;
}
