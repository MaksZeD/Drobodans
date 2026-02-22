import * as THREE from 'three';
import type { Card, Suit, Value } from '../types/index.js';
import { SUITS, VALUES, isRedSuit } from './CardData.js';

const CARD_W = 128;
const CARD_H = 192;

// Color palette
const PARCHMENT = '#F5E6C8';
const BORDER_BROWN = '#2C1810';
const RED = '#D32F2F';
const BLACK = '#1B1B1B';
const BACK_BLUE = '#1A3A5C';
const BACK_GOLD = '#C4A265';

// 5x7 pixel font bitmaps (each row is a number, bits = pixels)
const FONT: Record<string, number[]> = {
  '6': [0b01110, 0b10000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  '7': [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  '8': [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  '9': [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00001, 0b01110],
  '1': [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  '0': [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  'J': [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  'Q': [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b01110, 0b00011],
  'K': [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  'A': [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  'D': [0b11100, 0b10010, 0b10001, 0b10001, 0b10001, 0b10010, 0b11100],
};

// 8x8 suit symbols (small)
const SUIT_SMALL: Record<Suit, number[]> = {
  hearts: [
    0b00000000,
    0b01101100,
    0b11111110,
    0b11111110,
    0b11111110,
    0b01111100,
    0b00111000,
    0b00010000,
  ],
  diamonds: [
    0b00000000,
    0b00010000,
    0b00111000,
    0b01111100,
    0b11111110,
    0b01111100,
    0b00111000,
    0b00010000,
  ],
  clubs: [
    0b00000000,
    0b00010000,
    0b00111000,
    0b01101100,
    0b00010000,
    0b01111100,
    0b11111110,
    0b00010000,
  ],
  spades: [
    0b00010000,
    0b00111000,
    0b01111100,
    0b11111110,
    0b11111110,
    0b01111100,
    0b00010000,
    0b00111000,
  ],
};

export class CardTextureGenerator {
  private cache = new Map<string, THREE.CanvasTexture>();

  generateAll(): void {
    // Generate back texture
    this.getBackTexture();
    // Generate all 36 front textures
    for (const suit of SUITS) {
      for (const value of VALUES) {
        this.getFrontTexture(suit, value);
      }
    }
  }

  getFrontTexture(suit: Suit, value: Value): THREE.CanvasTexture {
    const key = `${value}_${suit}`;
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d')!;

    this.drawCardBase(ctx);
    const color = isRedSuit(suit) ? RED : BLACK;

    // Draw value in top-left
    this.drawValue(ctx, value, 8, 10, color, 2);
    // Draw small suit under value
    this.drawSmallSuit(ctx, suit, 8, 28, color);

    // Draw value bottom-right (rotated)
    ctx.save();
    ctx.translate(CARD_W - 8, CARD_H - 10);
    ctx.rotate(Math.PI);
    this.drawValue(ctx, value, 0, 0, color, 2);
    ctx.restore();
    // Draw small suit bottom-right (rotated)
    ctx.save();
    ctx.translate(CARD_W - 8, CARD_H - 28);
    ctx.rotate(Math.PI);
    this.drawSmallSuit(ctx, suit, 0, 0, color);
    ctx.restore();

    // Center content
    if (value === 'J' || value === 'Q' || value === 'K') {
      this.drawFaceCard(ctx, value, suit, color);
    } else {
      this.drawLargeSuit(ctx, suit, color);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, texture);
    return texture;
  }

  getBackTexture(): THREE.CanvasTexture {
    const key = 'back';
    if (this.cache.has(key)) return this.cache.get(key)!;

    const canvas = document.createElement('canvas');
    canvas.width = CARD_W;
    canvas.height = CARD_H;
    const ctx = canvas.getContext('2d')!;

    // Dark blue fill with rounded corners
    ctx.fillStyle = BACK_BLUE;
    this.roundRect(ctx, 0, 0, CARD_W, CARD_H, 8);
    ctx.fill();

    // Rounded border
    ctx.strokeStyle = BACK_GOLD;
    ctx.lineWidth = 3;
    this.roundRect(ctx, 2, 2, CARD_W - 4, CARD_H - 4, 6);
    ctx.stroke();

    // Inner border
    ctx.lineWidth = 1;
    this.roundRect(ctx, 6, 6, CARD_W - 12, CARD_H - 12, 4);
    ctx.stroke();

    // Diamond pattern
    ctx.fillStyle = BACK_GOLD;
    for (let y = 20; y < CARD_H - 20; y += 12) {
      for (let x = 20; x < CARD_W - 20; x += 12) {
        const offset = ((y - 20) / 12) % 2 === 0 ? 0 : 6;
        this.drawPixelDiamond(ctx, x + offset, y, 3);
      }
    }

    // Center "D" emblem
    ctx.fillStyle = BACK_GOLD;
    this.drawChar(ctx, 'D', CARD_W / 2 - 8, CARD_H / 2 - 10, BACK_GOLD, 3);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.NearestFilter;
    texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(key, texture);
    return texture;
  }

  getTextureForCard(card: Card): THREE.CanvasTexture {
    return this.getFrontTexture(card.suit, card.value);
  }

  private drawCardBase(ctx: CanvasRenderingContext2D): void {
    // Parchment fill with rounded corners
    ctx.fillStyle = PARCHMENT;
    this.roundRect(ctx, 0, 0, CARD_W, CARD_H, 8);
    ctx.fill();

    // Brown border
    ctx.strokeStyle = BORDER_BROWN;
    ctx.lineWidth = 2;
    this.roundRect(ctx, 1, 1, CARD_W - 2, CARD_H - 2, 7);
    ctx.stroke();
  }

  private drawValue(ctx: CanvasRenderingContext2D, value: Value, x: number, y: number, color: string, scale: number): void {
    if (value === '10') {
      this.drawChar(ctx, '1', x, y, color, scale);
      this.drawChar(ctx, '0', x + scale * 6, y, color, scale);
    } else {
      this.drawChar(ctx, value, x, y, color, scale);
    }
  }

  private drawChar(ctx: CanvasRenderingContext2D, ch: string, x: number, y: number, color: string, scale: number): void {
    const bitmap = FONT[ch];
    if (!bitmap) return;
    ctx.fillStyle = color;
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 5; col++) {
        if (bitmap[row] & (1 << (4 - col))) {
          ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
        }
      }
    }
  }

  private drawSmallSuit(ctx: CanvasRenderingContext2D, suit: Suit, x: number, y: number, color: string): void {
    const bitmap = SUIT_SMALL[suit];
    ctx.fillStyle = color;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (bitmap[row] & (1 << (7 - col))) {
          ctx.fillRect(x + col, y + row, 1, 1);
        }
      }
    }
  }

  private drawLargeSuit(ctx: CanvasRenderingContext2D, suit: Suit, color: string): void {
    const bitmap = SUIT_SMALL[suit];
    const scale = 4;
    const x = CARD_W / 2 - (8 * scale) / 2;
    const y = CARD_H / 2 - (8 * scale) / 2;
    ctx.fillStyle = color;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        if (bitmap[row] & (1 << (7 - col))) {
          ctx.fillRect(x + col * scale, y + row * scale, scale, scale);
        }
      }
    }
  }

  private drawFaceCard(ctx: CanvasRenderingContext2D, value: Value, suit: Suit, color: string): void {
    const cx = CARD_W / 2;
    const cy = CARD_H / 2;

    // Face frame
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.strokeRect(28, 45, CARD_W - 56, CARD_H - 90);

    // Head (circle-ish)
    ctx.fillStyle = '#F0D0A0';
    for (let dy = -8; dy <= 8; dy++) {
      for (let dx = -7; dx <= 7; dx++) {
        if (dx * dx + dy * dy <= 64) {
          ctx.fillRect(cx + dx * 2, cy - 20 + dy * 2, 2, 2);
        }
      }
    }

    // Eyes
    ctx.fillStyle = BLACK;
    ctx.fillRect(cx - 6, cy - 22, 3, 3);
    ctx.fillRect(cx + 4, cy - 22, 3, 3);

    // Mouth
    ctx.fillStyle = RED;
    ctx.fillRect(cx - 3, cy - 12, 7, 2);

    // Crown/hat based on face card type
    if (value === 'K') {
      // Crown
      ctx.fillStyle = BACK_GOLD;
      ctx.fillRect(cx - 12, cy - 40, 24, 4);
      ctx.fillRect(cx - 12, cy - 46, 4, 6);
      ctx.fillRect(cx - 2, cy - 48, 4, 8);
      ctx.fillRect(cx + 8, cy - 46, 4, 6);
      // Jewels
      ctx.fillStyle = RED;
      ctx.fillRect(cx - 10, cy - 44, 2, 2);
      ctx.fillRect(cx, cy - 46, 2, 2);
      ctx.fillRect(cx + 10, cy - 44, 2, 2);
    } else if (value === 'Q') {
      // Tiara
      ctx.fillStyle = BACK_GOLD;
      ctx.fillRect(cx - 10, cy - 40, 20, 3);
      ctx.fillRect(cx - 8, cy - 44, 4, 4);
      ctx.fillRect(cx - 1, cy - 46, 4, 6);
      ctx.fillRect(cx + 6, cy - 44, 4, 4);
      // Jewel
      ctx.fillStyle = color;
      ctx.fillRect(cx, cy - 44, 2, 2);
    } else {
      // Jack hat
      ctx.fillStyle = color;
      ctx.fillRect(cx - 10, cy - 38, 20, 4);
      ctx.fillRect(cx - 8, cy - 44, 16, 6);
      // Feather
      ctx.fillStyle = BACK_GOLD;
      ctx.fillRect(cx + 6, cy - 50, 2, 10);
      ctx.fillRect(cx + 8, cy - 48, 2, 4);
    }

    // Body
    ctx.fillStyle = color;
    ctx.fillRect(cx - 10, cy, 20, 30);

    // Suit symbol on body
    const suitColor = isRedSuit(suit) ? RED : BLACK;
    this.drawSmallSuit(ctx, suit, cx - 4, cy + 8, suitColor === color ? PARCHMENT : suitColor);
  }

  private drawPixelDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    for (let dy = -size; dy <= size; dy++) {
      for (let dx = -(size - Math.abs(dy)); dx <= (size - Math.abs(dy)); dx++) {
        ctx.fillRect(x + dx, y + dy, 1, 1);
      }
    }
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
