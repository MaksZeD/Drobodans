import type { Card, GameStateData, RuleKey } from '../types/index.js';
import { t, toggleLocale, onChange, getLocale } from '../i18n/i18n.js';
import type { ThemeManager } from './ThemeManager.js';
import type { SoundManager } from '../audio/SoundManager.js';

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

  private updateTexts(): void {
    this.deckCounter.textContent = `\u2660 ${t('ui.deckCounter')}: 36`;
    this.queenCounter.textContent = `\u2655 ${t('ui.queensCounter')}: 0/4`;
    this.jackBadge.textContent = `\u2753 ${t('ui.jackHolder')}: ${t('ui.noJackHolder')}`;
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
    this.deckCounter.textContent = `\u2660 ${t('ui.deckCounter')}: ${state.remainingCards}`;
    this.queenCounter.textContent = `\u2655 ${t('ui.queensCounter')}: ${state.queenCount}/4`;

    if (state.jackHolder) {
      this.jackBadge.textContent = `\u2753 ${t('ui.jackHolder')}: \u2726`;
      this.jackBadge.classList.add('active');
    } else {
      this.jackBadge.textContent = `\u2753 ${t('ui.jackHolder')}: ${t('ui.noJackHolder')}`;
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
