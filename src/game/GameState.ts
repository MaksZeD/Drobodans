import type { Card, GameEvent, GameStateData } from '../types/index.js';

type EventCallback = (data?: unknown) => void;

export class GameState {
  private _queenCount = 0;
  private _jackHolder: string | null = null;
  private _currentCard: Card | null = null;
  private _remainingCards = 36;
  private _isGameOver = false;
  private listeners = new Map<GameEvent, EventCallback[]>();

  on(event: GameEvent, cb: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(cb);
  }

  private emit(event: GameEvent, data?: unknown): void {
    const cbs = this.listeners.get(event);
    if (cbs) cbs.forEach((cb) => cb(data));
  }

  processCard(card: Card, remaining: number): void {
    this._currentCard = card;
    this._remainingCards = remaining;

    if (card.value === 'Q') {
      this._queenCount++;
      this.emit('queenDrawn', this._queenCount);
      if (this._queenCount >= 4) {
        this.emit('fourthQueen');
      }
    }

    if (card.value === 'J') {
      this._jackHolder = card.id;
      this.emit('jackDrawn', card);
    }

    this.emit('cardProcessed', card);

    if (remaining === 0) {
      this._isGameOver = true;
      this.emit('gameOver');
    }

    this.emit('stateChanged', this.getData());
  }

  getData(): GameStateData {
    return {
      queenCount: this._queenCount,
      jackHolder: this._jackHolder,
      currentCard: this._currentCard,
      remainingCards: this._remainingCards,
      isGameOver: this._isGameOver,
    };
  }

  reset(): void {
    this._queenCount = 0;
    this._jackHolder = null;
    this._currentCard = null;
    this._remainingCards = 36;
    this._isGameOver = false;
    this.emit('stateChanged', this.getData());
  }

  get isGameOver(): boolean {
    return this._isGameOver;
  }
}
