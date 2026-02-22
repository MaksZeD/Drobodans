import gsap from 'gsap';
import type { CardMesh } from '../scene/CardMesh.js';
import type { DeckMesh } from '../scene/DeckMesh.js';
import type * as THREE from 'three';

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
      const baseScaleX = group.scale.x;
      const baseScaleY = group.scale.y;

      // Start at deck position showing BACK (rotation.y = PI → backMesh faces camera)
      group.position.set(deckX, deckY, 20);
      group.rotation.y = Math.PI;
      group.scale.set(baseScaleX, baseScaleY, 1);

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
          x: baseScaleX * 1.15,
          y: baseScaleY * 1.15,
          duration: 0.15,
          ease: 'power1.out',
        })
        // Flip to reveal FRONT (PI → 2*PI, continues same rotation direction)
        .to(group.rotation, {
          y: Math.PI * 2,
          duration: 0.5,
          ease: 'power2.inOut',
        })
        // Settle scale
        .to(group.scale, {
          x: baseScaleX,
          y: baseScaleY,
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
      const halfX = group.scale.x * 0.5;
      const halfY = group.scale.y * 0.5;

      gsap.to(group.scale, {
        x: halfX,
        y: halfY,
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

  shuffleDeck(deckMesh: DeckMesh): Promise<void> {
    return new Promise((resolve) => {
      const layers = deckMesh.group.children as THREE.Mesh[];
      const visible = layers.filter((l) => l.visible);

      if (visible.length === 0) {
        resolve();
        return;
      }

      // Store original positions
      const originals = visible.map((l) => ({
        x: l.position.x,
        y: l.position.y,
        z: l.position.z,
      }));

      const tl = gsap.timeline({ onComplete: resolve });

      // Phase 1: Scatter cards outward
      visible.forEach((layer, i) => {
        const angle = ((i / visible.length) * Math.PI * 2) - Math.PI / 2;
        const radius = 30 + Math.random() * 20;

        tl.to(
          layer.position,
          {
            x: Math.cos(angle) * radius,
            y: originals[i].y + Math.sin(angle) * radius,
            duration: 0.3,
            ease: 'power2.out',
          },
          i * 0.025,
        );
        tl.to(
          layer.rotation,
          {
            z: (Math.random() - 0.5) * 0.6,
            duration: 0.3,
            ease: 'power2.out',
          },
          i * 0.025,
        );
      });

      // Phase 2: Gather back into stack
      visible.forEach((layer, i) => {
        tl.to(
          layer.position,
          {
            x: originals[i].x,
            y: originals[i].y,
            z: originals[i].z,
            duration: 0.35,
            ease: 'back.out(1.7)',
          },
          0.5 + i * 0.025,
        );
        tl.to(
          layer.rotation,
          {
            z: 0,
            duration: 0.35,
            ease: 'power2.in',
          },
          0.5 + i * 0.025,
        );
      });
    });
  }

  kill(): void {
    this.currentTimeline?.kill();
    this.currentTimeline = null;
  }
}
