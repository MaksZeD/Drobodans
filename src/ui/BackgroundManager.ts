export class BackgroundManager {
  private container: HTMLElement;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'bg-decorations';
    document.body.insertBefore(this.container, document.body.firstChild);
    this.spawn();

    // Fade in after a frame so the transition catches
    requestAnimationFrame(() => {
      this.container.classList.add('ready');
    });

    // Parallax on mouse move
    window.addEventListener('mousemove', (e) => {
      const cx = (e.clientX / window.innerWidth - 0.5) * 2;
      const cy = (e.clientY / window.innerHeight - 0.5) * 2;
      this.container.style.transform = `translate(${cx * -8}px, ${cy * -8}px)`;
    });
  }

  private spawn(): void {
    const count = 22 + Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      const isCard = Math.random() > 0.4;

      const wrapper = document.createElement('div');
      wrapper.className = 'bg-float-item';
      wrapper.style.left = `${Math.random() * 95}%`;
      wrapper.style.top = `${Math.random() * 95}%`;

      const duration = 18 + Math.random() * 24;
      const delay = -(Math.random() * 30);
      wrapper.style.animationDuration = `${duration}s`;
      wrapper.style.animationDelay = `${delay}s`;

      const inner = document.createElement('div');
      inner.className = 'bg-float-inner';
      const dataUrl = isCard ? this.generateCardBack() : this.generateBeer();
      inner.style.backgroundImage = `url(${dataUrl})`;
      inner.style.width = isCard ? '56px' : '38px';
      inner.style.height = isCard ? '84px' : '56px';
      inner.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
      inner.style.opacity = `${0.08 + Math.random() * 0.07}`;

      wrapper.appendChild(inner);
      this.container.appendChild(wrapper);
    }
  }

  private generateCardBack(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1A3A5C';
    this.roundRect(ctx, 0, 0, 32, 48, 3);
    ctx.fill();

    ctx.strokeStyle = '#C4A265';
    ctx.lineWidth = 1;
    this.roundRect(ctx, 1, 1, 30, 46, 2);
    ctx.stroke();

    ctx.fillStyle = '#C4A265';
    for (let y = 8; y < 42; y += 7) {
      for (let x = 8; x < 26; x += 7) {
        const offset = (Math.floor((y - 8) / 7) % 2) * 3;
        this.pixelDiamond(ctx, x + offset, y, 1);
      }
    }

    return canvas.toDataURL();
  }

  private generateBeer(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 36;
    const ctx = canvas.getContext('2d')!;

    // Glass body
    ctx.fillStyle = '#DAA520';
    ctx.fillRect(5, 12, 12, 20);

    // Foam
    ctx.fillStyle = '#FFFDE8';
    ctx.fillRect(5, 8, 12, 6);
    ctx.fillRect(7, 6, 8, 3);

    // Glass outline
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, 8, 14, 25);

    // Handle
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(18, 14, 3, 2);
    ctx.fillRect(19, 14, 2, 12);
    ctx.fillRect(18, 24, 3, 2);

    // Bubbles
    ctx.fillStyle = '#FFE680';
    ctx.fillRect(8, 18, 2, 2);
    ctx.fillRect(12, 22, 2, 2);
    ctx.fillRect(9, 26, 2, 2);
    ctx.fillRect(13, 16, 1, 1);
    ctx.fillRect(7, 24, 1, 1);

    // Base
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(4, 32, 14, 2);

    return canvas.toDataURL();
  }

  private pixelDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
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
