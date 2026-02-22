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

export class GameController {
  private sceneManager: SceneManager;
  private textureGen: CardTextureGenerator;
  private deck: Deck;
  private gameState: GameState;
  private animController: AnimationController;
  private uiManager: UIManager;
  private themeManager: ThemeManager;

  private deckMesh!: DeckMesh;
  private currentCardMesh: CardMesh | null = null;
  private isAnimating = false;

  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();

  constructor(canvas: HTMLCanvasElement, overlay: HTMLElement) {
    this.sceneManager = new SceneManager(canvas);
    this.textureGen = new CardTextureGenerator();
    this.deck = new Deck();
    this.gameState = new GameState();
    this.animController = new AnimationController();
    this.themeManager = new ThemeManager();
    this.uiManager = new UIManager(overlay, this.themeManager, () => this.newGame());

    // Generate all textures upfront
    this.textureGen.generateAll();

    this.setupDeck();
    this.setupEvents();
    this.setupInput(canvas);

    this.sceneManager.startLoop(() => {});
  }

  private getCardScale(): number {
    const w = this.sceneManager.width;
    const h = this.sceneManager.height;
    const minDim = Math.min(w, h);
    // Scale cards so they fit nicely on screen
    if (minDim < 400) return 1.5;
    if (minDim < 768) return 2.0;
    return 2.5;
  }

  private getDeckPosition(): { x: number; y: number } {
    // Deck sits slightly below center
    return { x: 0, y: -this.sceneManager.height * 0.08 };
  }

  private getCardCenter(): { x: number; y: number } {
    return { x: 0, y: this.sceneManager.height * 0.05 };
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
      if (this.currentCardMesh) {
        this.animController.queenAlert(this.currentCardMesh);
      }
    });

    // Handle resize
    window.addEventListener('resize', () => {
      const scale = this.getCardScale();
      this.deckMesh.setScale(scale);
      const pos = this.getDeckPosition();
      this.deckMesh.group.position.set(pos.x, pos.y, 0);
      if (this.currentCardMesh) {
        this.currentCardMesh.setScale(scale);
        const center = this.getCardCenter();
        this.currentCardMesh.group.position.set(center.x, center.y, 10);
      }
    });
  }

  private setupInput(canvas: HTMLCanvasElement): void {
    const handleInput = (clientX: number, clientY: number): void => {
      if (this.isAnimating || this.gameState.isGameOver) return;

      // Convert screen to NDC
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

    // Deck bounce feedback
    this.animController.deckBounce(this.deckMesh);

    // Dismiss previous card if exists
    if (this.currentCardMesh) {
      const discard = this.getDiscardPosition();
      await this.animController.dismissCard(this.currentCardMesh, discard.x, discard.y);
      this.sceneManager.scene.remove(this.currentCardMesh.group);
      this.currentCardMesh.dispose();
      this.currentCardMesh = null;
      this.uiManager.hideRule();
    }

    // Draw new card
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

    await this.animController.drawCard(cardMesh, deckPos.x, deckPos.y, center.x, center.y);

    // Process game state
    this.gameState.processCard(card, this.deck.remaining);

    // Show rule
    this.uiManager.showRule(card);

    this.isAnimating = false;
  }

  private newGame(): void {
    this.animController.kill();
    this.isAnimating = false;

    // Remove current card
    if (this.currentCardMesh) {
      this.sceneManager.scene.remove(this.currentCardMesh.group);
      this.currentCardMesh.dispose();
      this.currentCardMesh = null;
    }

    // Reset deck and state
    this.deck.reset();
    this.gameState.reset();
    this.deckMesh.updateCount(this.deck.remaining);

    // Reset UI
    this.uiManager.resetUI();
  }
}
