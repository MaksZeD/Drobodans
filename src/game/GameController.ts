import * as THREE from 'three';
import { SceneManager } from '../scene/SceneManager.js';
import { CardMesh } from '../scene/CardMesh.js';
import { DeckMesh } from '../scene/DeckMesh.js';
import { CardTextureGenerator } from '../cards/CardTextureGenerator.js';
import { Deck } from '../cards/Deck.js';
import { AnimationController } from '../animation/AnimationController.js';
import { GameState } from './GameState.js';
import { UIManager } from '../ui/UIManager.js';
import { ThemeManager } from '../ui/ThemeManager.js';
import { SoundManager } from '../audio/SoundManager.js';

export class GameController {
  private sceneManager: SceneManager;
  private textureGen: CardTextureGenerator;
  private deck: Deck;
  private gameState: GameState;
  private animController: AnimationController;
  private uiManager: UIManager;
  private themeManager: ThemeManager;
  private soundManager: SoundManager;

  private deckMesh!: DeckMesh;
  private currentCardMesh: CardMesh | null = null;
  private isAnimating = false;
  private drawCount = 0;
  private discardPile: CardMesh[] = [];
  private static readonly MAX_DISCARD = 5;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private static readonly CARD_Z = 20;

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.sceneManager = new SceneManager(canvas);
    this.textureGen = new CardTextureGenerator();
    this.deck = new Deck();
    this.gameState = new GameState();
    this.animController = new AnimationController();
    this.themeManager = new ThemeManager();
    this.soundManager = new SoundManager();
    this.uiManager = new UIManager(overlay, this.themeManager, this.soundManager, () => this.newGame());

    this.textureGen.generateAll();

    this.setupDeck();
    this.setupEvents();
    this.setupInput(canvas);

    this.sceneManager.startLoop(() => {});

    // Shuffle animation on load (no sound — browser blocks audio before interaction)
    this.isAnimating = true;
    this.animController.shuffleDeck(this.deckMesh).then(() => {
      this.isAnimating = false;
    });
  }

  private getCardScale(): number {
    const w = this.sceneManager.width;
    const h = this.sceneManager.height;
    const minDim = Math.min(w, h);
    if (minDim < 400) return 1.5;
    if (minDim < 768) return 2.0;
    return 2.5;
  }

  private getDeckPosition(): { x: number; y: number } {
    return { x: 0, y: -this.sceneManager.height * 0.08 };
  }

  private getCardCenter(): { x: number; y: number } {
    return { x: 0, y: this.sceneManager.height * 0.12 };
  }

  private getDiscardPosition(): { x: number; y: number } {
    return { x: this.sceneManager.width * 0.4, y: 0 };
  }

  private setupDeck(): void {
    const scale = this.getCardScale();
    const backTex = this.textureGen.getBackTexture();
    this.deckMesh = new DeckMesh(backTex, CardMesh.WIDTH, CardMesh.HEIGHT);
    this.deckMesh.setScale(scale);

    const pos = this.getDeckPosition();
    this.deckMesh.group.position.set(pos.x, pos.y, 0);
    this.deckMesh.updateCount(this.deck.remaining);
    this.sceneManager.scene.add(this.deckMesh.group);
  }

  private setupEvents(): void {
    this.gameState.on('stateChanged', (data) => {
      this.uiManager.updateState(data as import('../types/index.js').GameStateData);
      this.deckMesh.updateCount((data as import('../types/index.js').GameStateData).remainingCards);
    });

    this.gameState.on('fourthQueen', () => {
      this.uiManager.showFourthQueenAlert();
      this.soundManager.playQueenAlert();
      // Play glug-glug drinking sound after alert tones
      setTimeout(() => this.soundManager.playGlugGlug(), 400);
      if (this.currentCardMesh) {
        this.animController.queenAlert(this.currentCardMesh);
      }
    });

    this.gameState.on('gameOver', () => {
      this.soundManager.playGameOver();
    });

    const handleResize = () => {
      const scale = this.getCardScale();
      this.deckMesh.setScale(scale);
      const pos = this.getDeckPosition();
      this.deckMesh.group.position.set(pos.x, pos.y, 0);
      if (this.currentCardMesh) {
        this.currentCardMesh.setScale(scale);
        const center = this.getCardCenter();
        this.currentCardMesh.group.position.set(center.x, center.y, GameController.CARD_Z);
      }
      this.arrangeDiscardPile();
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
  }

  private setupInput(canvas: HTMLCanvasElement): void {
    const handleInput = (clientX: number, clientY: number): void => {
      if (this.isAnimating || this.gameState.isGameOver) return;

      this.pointer.x = (clientX / this.sceneManager.width) * 2 - 1;
      this.pointer.y = -(clientY / this.sceneManager.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.sceneManager.camera);

      const intersects = this.raycaster.intersectObjects(
        this.deckMesh.group.children,
        true
      );

      if (intersects.length > 0) {
        this.drawCard();
      }
    };

    canvas.addEventListener('click', (e) => {
      handleInput(e.clientX, e.clientY);
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      handleInput(touch.clientX, touch.clientY);
    }, { passive: false });
  }

  private async drawCard(): Promise<void> {
    if (this.isAnimating || this.deck.isEmpty) return;
    this.isAnimating = true;

    this.animController.deckBounce(this.deckMesh);
    this.soundManager.playCardSlide();

    // Dismiss previous card to discard pile
    if (this.currentCardMesh) {
      const discard = this.getDiscardPosition();
      await this.animController.dismissCard(this.currentCardMesh, discard.x, discard.y);
      this.uiManager.hideRule();

      // Add to discard pile (keep visible as small card)
      this.discardPile.push(this.currentCardMesh);
      this.arrangeDiscardPile();

      // Remove oldest if pile exceeds max
      while (this.discardPile.length > GameController.MAX_DISCARD) {
        const oldest = this.discardPile.shift()!;
        this.sceneManager.scene.remove(oldest.group);
        oldest.dispose();
      }

      this.currentCardMesh = null;
    }

    const card = this.deck.draw();
    if (!card) {
      this.isAnimating = false;
      return;
    }

    const scale = this.getCardScale();
    const frontTex = this.textureGen.getTextureForCard(card);
    const backTex = this.textureGen.getBackTexture();
    const cardMesh = new CardMesh(frontTex, backTex);
    cardMesh.setScale(scale);
    this.currentCardMesh = cardMesh;
    this.sceneManager.scene.add(cardMesh.group);

    const deckPos = this.getDeckPosition();
    const center = this.getCardCenter();

    // Animate draw + flip, play flip sound + particles at midpoint, THEN show rule
    await this.animController.drawCard(
      cardMesh, deckPos.x, deckPos.y, center.x, center.y,
      () => {
        this.soundManager.playCardFlip();
        this.animController.spawnFlipParticles(
          this.sceneManager.scene, center.x, center.y, GameController.CARD_Z,
        );
        // Special particles for face cards and aces
        if (card.value === 'Q') {
          this.animController.spawnQueenParticles(
            this.sceneManager.scene, center.x, center.y, GameController.CARD_Z,
          );
        } else if (card.value === 'J') {
          this.animController.spawnJackParticles(
            this.sceneManager.scene, center.x, center.y, GameController.CARD_Z,
          );
        } else if (card.value === 'A') {
          this.animController.spawnAceParticles(
            this.sceneManager.scene, center.x, center.y, GameController.CARD_Z,
          );
        }
      },
    );

    this.gameState.processCard(card, this.deck.remaining);
    this.uiManager.showRule(card);

    this.drawCount++;
    if (this.drawCount >= 3) {
      this.uiManager.hideTapPrompt();
    }

    this.isAnimating = false;
  }

  private arrangeDiscardPile(): void {
    const w = this.sceneManager.width;
    const h = this.sceneManager.height;
    const minDim = Math.min(w, h);
    const isMobile = minDim < 768;

    const pileScale = this.getCardScale() * (isMobile ? 0.28 : 0.3);
    const cardW = CardMesh.WIDTH * pileScale;
    const cardH = CardMesh.HEIGHT * pileScale;
    const spacing = cardW + (isMobile ? 4 : 6);
    const count = this.discardPile.length;

    // Bottom-right corner, cards spread horizontally from right
    const startX = w / 2 - 20 - (count - 1) * spacing;
    // On mobile, push cards down so only ~65% is visible (clipped by viewport edge)
    const baseY = isMobile
      ? -h / 2 + cardH * 0.35
      : -h / 2 + 60;

    this.discardPile.forEach((card, i) => {
      const group = card.group;
      group.scale.set(pileScale, pileScale, 1);
      group.position.set(
        startX + i * spacing,
        baseY,
        2 + i * 0.5,
      );
      group.rotation.z = 0;
      card.material.opacity = 0.55 + i * 0.1;
    });
  }

  private newGame(): void {
    this.animController.kill();
    this.isAnimating = false;

    if (this.currentCardMesh) {
      this.sceneManager.scene.remove(this.currentCardMesh.group);
      this.currentCardMesh.dispose();
      this.currentCardMesh = null;
    }

    // Clear discard pile
    for (const card of this.discardPile) {
      this.sceneManager.scene.remove(card.group);
      card.dispose();
    }
    this.discardPile = [];

    this.drawCount = 0;
    this.deck.reset();
    this.gameState.reset();
    this.deckMesh.updateCount(this.deck.remaining);
    this.uiManager.resetUI();

    // Shuffle animation + sound
    this.isAnimating = true;
    this.soundManager.playShuffle();
    this.animController.shuffleDeck(this.deckMesh).then(() => {
      this.isAnimating = false;
    });
  }
}
