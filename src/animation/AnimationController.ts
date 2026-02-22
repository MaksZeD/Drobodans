import gsap from 'gsap';
import type { CardMesh } from '../scene/CardMesh.js';
import type { DeckMesh } from '../scene/DeckMesh.js';

export class AnimationController {
  private currentTimeline: gsap.core.Timeline | null = null;

  drawCard(
    cardMesh: CardMesh,
    deckX: number,
    deckY: number,
    centerX: number,
    centerY: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const group = cardMesh.group;

      // Start at deck position, showing back (rotation.y = 0 means back is showing)
      group.position.set(deckX, deckY, 10);
      group.rotation.y = 0;
      group.scale.set(group.scale.x, group.scale.y, 1);

      this.currentTimeline = gsap.timeline({
        onComplete: () => {
          this.currentTimeline = null;
          resolve();
        },
      });

      this.currentTimeline
        // Move to center
        .to(group.position, {
          x: centerX,
          y: centerY,
          duration: 0.4,
          ease: 'power2.out',
        })
        // Scale up slightly
        .to(group.scale, {
          x: group.scale.x * 1.15,
          y: group.scale.y * 1.15,
          duration: 0.15,
          ease: 'power1.out',
        })
        // Flip to reveal front
        .to(group.rotation, {
          y: Math.PI,
          duration: 0.5,
          ease: 'power2.inOut',
        })
        // Settle scale
        .to(group.scale, {
          x: group.scale.x,
          y: group.scale.y,
          duration: 0.3,
          ease: 'power1.inOut',
        });
    });
  }

  dismissCard(
    cardMesh: CardMesh,
    discardX: number,
    discardY: number,
  ): Promise<void> {
    return new Promise((resolve) => {
      const group = cardMesh.group;

      gsap.to(group.scale, {
        x: group.scale.x * 0.5,
        y: group.scale.y * 0.5,
        duration: 0.3,
        ease: 'power2.in',
      });

      gsap.to(group.position, {
        x: discardX,
        y: discardY,
        duration: 0.3,
        ease: 'power2.in',
      });

      gsap.to(group.rotation, {
        z: (Math.random() - 0.5) * 0.5,
        duration: 0.3,
        ease: 'power1.out',
        onComplete: resolve,
      });
    });
  }

  deckBounce(deckMesh: DeckMesh): void {
    gsap.to(deckMesh.group.position, {
      y: deckMesh.group.position.y + 5,
      duration: 0.1,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
    });
  }

  queenAlert(cardMesh: CardMesh): Promise<void> {
    return new Promise((resolve) => {
      const group = cardMesh.group;
      gsap.to(group.position, {
        x: group.position.x + 8,
        duration: 0.05,
        yoyo: true,
        repeat: 5,
        ease: 'none',
        onComplete: resolve,
      });
    });
  }

  kill(): void {
    this.currentTimeline?.kill();
    this.currentTimeline = null;
  }
}
