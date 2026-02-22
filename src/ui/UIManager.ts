import type { Card, GameStateData, RuleKey } from '../types/index.js';
import { t, toggleLocale, onChange, getLocale } from '../i18n/i18n.js';
import type { ThemeManager } from './ThemeManager.js';
import type { SoundManager } from '../audio/SoundManager.js';

// --- Pixel art icon generators (16x16 canvases) ---

function generateDeckIcon(): string {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d')!;

  // Back card (offset)
  x.fillStyle = '#1A3A5C';
  x.fillRect(1, 1, 10, 14);
  x.strokeStyle = '#C4A265';
  x.lineWidth = 1;
  x.strokeRect(1.5, 1.5, 9, 13);

  // Front card
  x.fillStyle = '#1A3A5C';
  x.fillRect(4, 0, 11, 14);
  x.strokeStyle = '#C4A265';
  x.lineWidth = 1;
  x.strokeRect(4.5, 0.5, 10, 13);

  // Diamond pattern on front card
  x.fillStyle = '#C4A265';
  x.fillRect(8, 3, 2, 2);
  x.fillRect(7, 4, 1, 1);
  x.fillRect(11, 4, 1, 1);
  x.fillRect(8, 5, 2, 1);
  x.fillRect(8, 7, 2, 2);
  x.fillRect(7, 8, 1, 1);
  x.fillRect(11, 8, 1, 1);
  x.fillRect(8, 9, 2, 1);

  return c.toDataURL();
}

function generateCrownIcon(): string {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d')!;

  // Crown body
  x.fillStyle = '#C4A265';
  // Base
  x.fillRect(2, 10, 12, 3);
  // Left spike
  x.fillRect(2, 4, 2, 6);
  x.fillRect(3, 3, 1, 1);
  // Center spike
  x.fillRect(7, 2, 2, 8);
  x.fillRect(6, 3, 1, 1);
  x.fillRect(9, 3, 1, 1);
  // Right spike
  x.fillRect(12, 4, 2, 6);
  x.fillRect(12, 3, 1, 1);
  // Fill between spikes
  x.fillRect(4, 7, 3, 3);
  x.fillRect(9, 7, 3, 3);
  x.fillRect(4, 8, 12, 2);

  // Jewels
  x.fillStyle = '#D32F2F';
  x.fillRect(3, 5, 1, 1);
  x.fillRect(8, 3, 1, 1);
  x.fillRect(12, 5, 1, 1);

  // Base highlight
  x.fillStyle = '#FFD700';
  x.fillRect(3, 11, 10, 1);

  return c.toDataURL();
}

function generateJesterIcon(): string {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d')!;

  // Hat body
  x.fillStyle = '#4CAF50';
  x.fillRect(3, 6, 10, 4);
  x.fillRect(4, 5, 8, 1);

  // Left prong
  x.fillRect(2, 3, 3, 3);
  x.fillRect(1, 1, 2, 2);
  // Right prong
  x.fillRect(11, 3, 3, 3);
  x.fillRect(13, 1, 2, 2);
  // Center prong
  x.fillRect(6, 2, 4, 3);
  x.fillRect(7, 1, 2, 1);

  // Bells (gold circles)
  x.fillStyle = '#FFD700';
  x.fillRect(1, 0, 2, 1);
  x.fillRect(0, 1, 1, 1);
  x.fillRect(3, 1, 1, 1);
  x.fillRect(7, 0, 2, 1);
  x.fillRect(13, 0, 2, 1);
  x.fillRect(12, 1, 1, 1);
  x.fillRect(15, 1, 1, 1);

  // Brim
  x.fillStyle = '#2E7D32';
  x.fillRect(2, 10, 12, 2);

  // Face area
  x.fillStyle = '#F0D0A0';
  x.fillRect(4, 12, 8, 3);

  // Eyes
  x.fillStyle = '#1B1B1B';
  x.fillRect(5, 13, 2, 1);
  x.fillRect(9, 13, 2, 1);

  // Smile
  x.fillStyle = '#D32F2F';
  x.fillRect(7, 14, 2, 1);

  return c.toDataURL();
}

function createPixelIcon(dataUrl: string): HTMLImageElement {
  const img = document.createElement('img');
  img.src = dataUrl;
  img.className = 'badge-icon';
  img.width = 16;
  img.height = 16;
  return img;
}

const RULE_KEYS: { value: string; key: RuleKey }[] = [
  { value: '6', key: 'toast' },
  { value: '7', key: 'count' },
  { value: '8', key: 'theme' },
  { value: '9', key: 'skip' },
  { value: '10', key: 'drinkSelf' },
  { value: 'J', key: 'jackQuestion' },
  { value: 'Q', key: 'queenCup' },
  { value: 'K', key: 'kingBuddy' },
  { value: 'A', key: 'aceImmunity' },
];

export class UIManager {
  private overlay: HTMLElement;
  private deckCounter!: HTMLElement;
  private queenCounter!: HTMLElement;
  private jackBadge!: HTMLElement;
  private rulePanel!: HTMLElement;
  private ruleTitle!: HTMLElement;
  private ruleDescription!: HTMLElement;
  private tapPrompt!: HTMLElement;
  private newGameBtn!: HTMLElement;
  private langBtn!: HTMLElement;
  private soundBtn!: HTMLElement;
  private themeBtn!: HTMLElement;
  private helpBtn!: HTMLElement;
  private gameOverBanner!: HTMLElement;
  private rulesModal!: HTMLElement;
  private rulesModalTitle!: HTMLElement;
  private rulesModalBody!: HTMLElement;

  private onNewGame: () => void;
  private themeManager: ThemeManager;
  private soundManager: SoundManager;

  // Pixel art icon data URLs (generated once)
  private deckIconUrl = generateDeckIcon();
  private crownIconUrl = generateCrownIcon();
  private jesterIconUrl = generateJesterIcon();

  constructor(overlay: HTMLElement, themeManager: ThemeManager, soundManager: SoundManager, onNewGame: () => void) {
    this.overlay = overlay;
    this.themeManager = themeManager;
    this.soundManager = soundManager;
    this.onNewGame = onNewGame;
    this.createElements();
    this.updateTexts();

    onChange(() => {
      this.updateTexts();
    });
  }

  private createElements(): void {
    this.overlay.innerHTML = '';

    // Top bar
    const topBar = document.createElement('div');
    topBar.className = 'top-bar';

    // Left badges
    const leftBadges = document.createElement('div');
    leftBadges.className = 'top-badges';

    this.deckCounter = document.createElement('div');
    this.deckCounter.className = 'badge glass-panel';

    this.queenCounter = document.createElement('div');
    this.queenCounter.className = 'badge glass-panel';

    this.jackBadge = document.createElement('div');
    this.jackBadge.className = 'badge glass-panel';

    leftBadges.append(this.deckCounter, this.queenCounter, this.jackBadge);

    // Right controls
    const rightControls = document.createElement('div');
    rightControls.className = 'top-controls';

    this.langBtn = document.createElement('button');
    this.langBtn.className = 'icon-btn glass-panel';
    this.langBtn.addEventListener('click', () => {
      toggleLocale();
    });

    this.soundBtn = document.createElement('button');
    this.soundBtn.className = 'icon-btn glass-panel';
    this.soundBtn.textContent = '\u266A';
    this.soundBtn.addEventListener('click', () => {
      const muted = this.soundManager.toggleMute();
      this.soundBtn.classList.toggle('muted', muted);
    });

    this.themeBtn = document.createElement('button');
    this.themeBtn.className = 'icon-btn glass-panel';
    this.themeBtn.textContent = '\u25D1';
    this.themeBtn.addEventListener('click', () => {
      this.themeManager.toggle();
    });

    this.helpBtn = document.createElement('button');
    this.helpBtn.className = 'icon-btn glass-panel';
    this.helpBtn.textContent = '?';
    this.helpBtn.addEventListener('click', () => {
      this.toggleRulesModal();
    });

    rightControls.append(this.helpBtn, this.langBtn, this.soundBtn, this.themeBtn);

    topBar.append(leftBadges, rightControls);

    // Rules reference modal
    this.rulesModal = document.createElement('div');
    this.rulesModal.className = 'rules-modal-overlay';
    this.rulesModal.addEventListener('click', (e) => {
      if (e.target === this.rulesModal) {
        this.rulesModal.classList.remove('visible');
      }
    });

    const modalContent = document.createElement('div');
    modalContent.className = 'rules-modal glass-panel';

    this.rulesModalTitle = document.createElement('h2');
    this.rulesModalTitle.className = 'rules-modal-title';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'rules-modal-close';
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', () => {
      this.rulesModal.classList.remove('visible');
    });

    const header = document.createElement('div');
    header.className = 'rules-modal-header';
    header.append(this.rulesModalTitle, closeBtn);

    this.rulesModalBody = document.createElement('div');
    this.rulesModalBody.className = 'rules-modal-body';

    modalContent.append(header, this.rulesModalBody);
    this.rulesModal.appendChild(modalContent);

    // Rule panel
    this.rulePanel = document.createElement('div');
    this.rulePanel.className = 'rule-panel glass-panel';

    this.ruleTitle = document.createElement('h2');
    this.ruleTitle.className = 'rule-title';

    this.ruleDescription = document.createElement('p');
    this.ruleDescription.className = 'rule-description';

    this.rulePanel.append(this.ruleTitle, this.ruleDescription);

    // Game over banner
    this.gameOverBanner = document.createElement('div');
    this.gameOverBanner.className = 'game-over-banner glass-panel';

    // Bottom section
    this.tapPrompt = document.createElement('div');
    this.tapPrompt.className = 'tap-prompt visible';

    this.newGameBtn = document.createElement('button');
    this.newGameBtn.className = 'new-game-btn glass-panel';
    this.newGameBtn.addEventListener('click', () => {
      this.onNewGame();
    });

    this.overlay.append(topBar, this.rulePanel, this.gameOverBanner, this.tapPrompt, this.newGameBtn, this.rulesModal);
  }

  private setBadgeContent(badge: HTMLElement, iconUrl: string, text: string): void {
    badge.innerHTML = '';
    badge.appendChild(createPixelIcon(iconUrl));
    badge.appendChild(document.createTextNode(` ${text}`));
  }

  private updateTexts(): void {
    this.setBadgeContent(this.deckCounter, this.deckIconUrl, `${t('ui.deckCounter')}: 36`);
    this.setBadgeContent(this.queenCounter, this.crownIconUrl, `${t('ui.queensCounter')}: 0/4`);
    this.setBadgeContent(this.jackBadge, this.jesterIconUrl, `${t('ui.jackHolder')}: ${t('ui.noJackHolder')}`);
    this.langBtn.textContent = t('ui.language');
    this.tapPrompt.textContent = t('ui.tapPrompt');
    this.newGameBtn.textContent = t('ui.newGame');
    this.gameOverBanner.textContent = t('ui.gameOver');

    const ruleKey = this.rulePanel.dataset['ruleKey'];
    if (ruleKey) {
      this.ruleTitle.textContent = t(`rules.${ruleKey}.title`);
      this.ruleDescription.textContent = t(`rules.${ruleKey}.description`);
    }

    document.documentElement.lang = getLocale() === 'ua' ? 'uk' : 'en';

    // Update rules modal
    this.rulesModalTitle.textContent = t('ui.rulesTitle');
    this.rulesModalBody.innerHTML = '';
    for (const { value, key } of RULE_KEYS) {
      const row = document.createElement('div');
      row.className = 'rules-modal-row';

      const val = document.createElement('span');
      val.className = 'rules-modal-value';
      val.textContent = value;

      const info = document.createElement('div');
      info.className = 'rules-modal-info';

      const title = document.createElement('strong');
      title.textContent = t(`rules.${key}.title`);

      const desc = document.createElement('span');
      desc.textContent = t(`rules.${key}.description`);

      info.append(title, desc);
      row.append(val, info);
      this.rulesModalBody.appendChild(row);
    }
  }

  showRule(card: Card): void {
    this.rulePanel.dataset['card'] = card.id;
    this.rulePanel.dataset['ruleKey'] = card.ruleKey;
    this.ruleTitle.textContent = t(`rules.${card.ruleKey}.title`);
    this.ruleDescription.textContent = t(`rules.${card.ruleKey}.description`);
    this.rulePanel.classList.add('visible');
    this.tapPrompt.classList.remove('visible');
  }

  hideRule(): void {
    this.rulePanel.classList.remove('visible');
    delete this.rulePanel.dataset['card'];
    delete this.rulePanel.dataset['ruleKey'];
  }

  updateState(state: GameStateData): void {
    this.setBadgeContent(this.deckCounter, this.deckIconUrl, `${t('ui.deckCounter')}: ${state.remainingCards}`);
    this.setBadgeContent(this.queenCounter, this.crownIconUrl, `${t('ui.queensCounter')}: ${state.queenCount}/4`);

    if (state.jackHolder) {
      this.setBadgeContent(this.jackBadge, this.jesterIconUrl, `${t('ui.jackHolder')}: \u2726`);
      this.jackBadge.classList.add('active');
    } else {
      this.setBadgeContent(this.jackBadge, this.jesterIconUrl, `${t('ui.jackHolder')}: ${t('ui.noJackHolder')}`);
      this.jackBadge.classList.remove('active');
    }

    if (state.isGameOver) {
      this.gameOverBanner.classList.add('visible');
      this.newGameBtn.classList.add('visible');
      this.tapPrompt.classList.remove('visible');
    }
  }

  showFourthQueenAlert(): void {
    this.gameOverBanner.textContent = t('ui.fourthQueen');
    this.gameOverBanner.classList.add('visible', 'alert-pulse');
    setTimeout(() => {
      this.gameOverBanner.classList.remove('visible', 'alert-pulse');
      this.gameOverBanner.textContent = t('ui.gameOver');
    }, 3000);
  }

  resetUI(): void {
    this.hideRule();
    this.gameOverBanner.classList.remove('visible', 'alert-pulse');
    this.newGameBtn.classList.remove('visible');
    this.tapPrompt.classList.add('visible');
    this.updateTexts();
  }

  hideTapPrompt(): void {
    this.tapPrompt.classList.remove('visible');
  }

  showTapPrompt(): void {
    this.tapPrompt.classList.add('visible');
  }

  private toggleRulesModal(): void {
    this.rulesModal.classList.toggle('visible');
  }
}
