import gsap from 'gsap';
import type { CardMesh } from '../scene/CardMesh.js';
import type { DeckMesh } from '../scene/DeckMesh.js';
import type * as THREE from 'three';

export class AnimationController {
  private currentTimeline: gsap.core.Timeline | null = null;

  /**
   * ScaleX flip: squeeze to 0 width → swap texture → expand back.
   * Works perfectly with OrthographicCamera (no 3D rotation needed).
   */
  drawCard(
    cardMesh: CardMesh,
    deckX: number,
    deckY: number,
    centerX: number,
    centerY: number,
    onFlip?: () => void,
  ): Promise<void> {
    return new Promise((resolve) => {
      const group = cardMesh.group;
      const baseScaleX = group.scale.x;
      const baseScaleY = group.scale.y;

      // Start at deck position showing back (default texture)
      group.position.set(deckX, deckY, 20);

      this.currentTimeline = gsap.timeline({
        onComplete: () => {
          this.currentTimeline = null;
          resolve();
        },
      });

      this.currentTimeline
        // Slide from deck to center
        .to(group.position, {
          x: centerX,
          y: centerY,
          duration: 0.4,
          ease: 'power2.out',
        })
        // First half of flip: squeeze X to near-zero
        .to(group.scale, {
          x: 0.01,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => {
            cardMesh.showFront();
            onFlip?.();
          },
        })
        // Second half: expand to reveal front, slight overshoot
        .to(group.scale, {
          x: baseScaleX * 1.1,
          y: baseScaleY * 1.05,
          duration: 0.25,
          ease: 'power2.out',
        })
        // Settle to normal size
        .to(group.scale, {
          x: baseScaleX,
          y: baseScaleY,
          duration: 0.2,
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

      const count = visible.length;

      // Store original positions
      const originals = visible.map((l) => ({
        x: l.position.x,
        y: l.position.y,
        z: l.position.z,
      }));

      const tl = gsap.timeline({ onComplete: resolve });

      // --- Phase 1: Cascade spread into arc (0 – ~0.9s) ---
      visible.forEach((layer, i) => {
        const t = count > 1 ? i / (count - 1) : 0.5;
        const angle = Math.PI * 0.25 + t * Math.PI * 0.5;
        const radius = 55 + (i % 3) * 12;
        const delay = i * 0.06;

        tl.to(layer.position, {
          x: Math.cos(angle) * radius * (t < 0.5 ? -1 : 1),
          y: originals[i].y + Math.sin(angle) * radius * 0.6 + 15,
          duration: 0.4,
          ease: 'power3.out',
        }, delay);

        tl.to(layer.rotation, {
          z: -0.4 + t * 0.8,
          duration: 0.4,
          ease: 'power2.out',
        }, delay);
      });

      // --- Phase 2: Swirl to opposite positions (0.9 – ~1.5s) ---
      const p2 = count * 0.06 + 0.5;
      visible.forEach((layer, i) => {
        const t = count > 1 ? i / (count - 1) : 0.5;
        const angle = Math.PI * 0.75 - t * Math.PI * 0.5;
        const radius = 45 + ((count - 1 - i) % 3) * 12;

        tl.to(layer.position, {
          x: Math.cos(angle) * radius * (t < 0.5 ? 1 : -1),
          y: originals[i].y + Math.sin(angle) * radius * 0.4,
          duration: 0.35,
          ease: 'power2.inOut',
        }, p2 + i * 0.03);

        tl.to(layer.rotation, {
          z: 0.4 - t * 0.8,
          duration: 0.35,
          ease: 'power2.inOut',
        }, p2 + i * 0.03);
      });

      // --- Phase 3: Gather back into stack, reverse order (1.5 – ~2.5s) ---
      const p3 = p2 + count * 0.03 + 0.5;
      [...visible].reverse().forEach((layer, ri) => {
        const origIdx = count - 1 - ri;
        tl.to(layer.position, {
          x: originals[origIdx].x,
          y: originals[origIdx].y,
          z: originals[origIdx].z,
          duration: 0.4,
          ease: 'back.out(2.5)',
        }, p3 + ri * 0.05);

        tl.to(layer.rotation, {
          z: 0,
          duration: 0.4,
          ease: 'power3.out',
        }, p3 + ri * 0.05);
      });

      // --- Phase 4: Stack settle bounce (2.5 – ~2.9s) ---
      const p4 = p3 + count * 0.05 + 0.45;
      const baseScaleY = deckMesh.group.scale.y;

      tl.to(deckMesh.group.scale, {
        y: baseScaleY * 0.85,
        duration: 0.1,
        ease: 'power2.in',
      }, p4);

      tl.to(deckMesh.group.scale, {
        y: baseScaleY,
        duration: 0.3,
        ease: 'elastic.out(1, 0.4)',
      }, p4 + 0.1);
    });
  }

  kill(): void {
    this.currentTimeline?.kill();
    this.currentTimeline = null;
  }
}
