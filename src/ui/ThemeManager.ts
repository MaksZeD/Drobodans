import type { Theme } from '../types/index.js';

export class ThemeManager {
  private currentTheme: Theme;

  constructor() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.currentTheme = prefersDark ? 'dark' : 'light';
    this.apply();
  }

  toggle(): void {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.apply();
  }

  private apply(): void {
    document.documentElement.setAttribute('data-theme', this.currentTheme);
  }

  get theme(): Theme {
    return this.currentTheme;
  }
}
