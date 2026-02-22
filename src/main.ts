import './styles/themes.css';
import './styles/main.css';
import './styles/ui-overlay.css';
import './styles/responsive.css';

import { GameController } from './game/GameController.js';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const overlay = document.getElementById('ui-overlay') as HTMLElement;

new GameController(canvas, overlay);
