import gsap from 'gsap';
import * as THREE from 'three';
import type { CardMesh } from '../scene/CardMesh.js';
import type { DeckMesh } from '../scene/DeckMesh.js';

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

      // Start at deck position showing back (default texture), invisible
      group.position.set(deckX, deckY, 20);

      // Fade in the card material to prevent white flash
      const mat = cardMesh.material;
      mat.opacity = 0;

      this.currentTimeline = gsap.timeline({
        onComplete: () => {
          this.currentTimeline = null;
          resolve();
        },
      });

      this.currentTimeline
        // Fade in immediately
        .to(mat, {
          opacity: 1,
          duration: 0.15,
          ease: 'power1.out',
        }, 0)
        // Slide from deck to center
        .to(group.position, {
          x: centerX,
          y: centerY,
          duration: 0.4,
          ease: 'power2.out',
        }, 0)
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

  spawnFlipParticles(scene: THREE.Scene, x: number, y: number, z: number): void {
    const count = 22;
    const colors = ['#C4A265', '#F5E6C8', '#D32F2F', '#1A3A5C', '#FFD700'];
    const geo = new THREE.PlaneGeometry(3, 3);
    let remaining = count;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 20;
      mesh.position.set(
        x + (Math.random() - 0.5) * 30,
        y + (Math.random() - 0.5) * 30,
        z + 1,
      );
      scene.add(mesh);

      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90;
      const duration = 0.5 + Math.random() * 0.4;

      gsap.to(mesh.position, {
        x: mesh.position.x + Math.cos(angle) * speed,
        y: mesh.position.y + Math.sin(angle) * speed - 40,
        duration,
        ease: 'power2.out',
      });

      gsap.to(mat, {
        opacity: 0,
        duration: duration * 0.85,
        delay: duration * 0.15,
        ease: 'power1.in',
        onComplete: () => {
          scene.remove(mesh);
          mat.dispose();
          remaining--;
          if (remaining === 0) geo.dispose();
        },
      });
    }
  }

  /** Queen: red + gold crown-like burst rising upward */
  spawnQueenParticles(scene: THREE.Scene, x: number, y: number, z: number): void {
    const count = 30;
    const colors = ['#D32F2F', '#C4A265', '#FFD700', '#FF6B6B', '#E8B923'];
    const geo = new THREE.PlaneGeometry(4, 4);
    let remaining = count;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 22;
      mesh.position.set(
        x + (Math.random() - 0.5) * 20,
        y + Math.random() * 10,
        z + 2,
      );
      scene.add(mesh);

      // Particles rise upward like a crown
      const spreadX = (Math.random() - 0.5) * 80;
      const riseY = 60 + Math.random() * 80;
      const duration = 0.7 + Math.random() * 0.5;

      gsap.to(mesh.position, {
        x: mesh.position.x + spreadX,
        y: mesh.position.y + riseY,
        duration,
        ease: 'power2.out',
      });

      gsap.to(mesh.rotation, {
        z: (Math.random() - 0.5) * 4,
        duration,
      });

      gsap.to(mat, {
        opacity: 0,
        duration: duration * 0.7,
        delay: duration * 0.3,
        ease: 'power1.in',
        onComplete: () => {
          scene.remove(mesh);
          mat.dispose();
          remaining--;
          if (remaining === 0) geo.dispose();
        },
      });
    }
  }

  /** Jack: green swirl particles */
  spawnJackParticles(scene: THREE.Scene, x: number, y: number, z: number): void {
    const count = 24;
    const colors = ['#2E7D32', '#4CAF50', '#81C784', '#C4A265', '#A5D6A7'];
    const geo = new THREE.PlaneGeometry(3, 3);
    let remaining = count;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 22;
      mesh.position.set(x, y, z + 2);
      scene.add(mesh);

      // Spiral outward
      const baseAngle = (i / count) * Math.PI * 2;
      const radius = 40 + Math.random() * 60;
      const duration = 0.6 + Math.random() * 0.4;

      gsap.to(mesh.position, {
        x: x + Math.cos(baseAngle) * radius,
        y: y + Math.sin(baseAngle) * radius,
        duration,
        ease: 'power2.out',
      });

      gsap.to(mat, {
        opacity: 0,
        duration: duration * 0.7,
        delay: duration * 0.3,
        ease: 'power1.in',
        onComplete: () => {
          scene.remove(mesh);
          mat.dispose();
          remaining--;
          if (remaining === 0) geo.dispose();
        },
      });
    }
  }

  /** Ace: golden starburst */
  spawnAceParticles(scene: THREE.Scene, x: number, y: number, z: number): void {
    const count = 16;
    const colors = ['#FFD700', '#FFC107', '#FFEB3B', '#C4A265', '#FFE082'];
    const geo = new THREE.PlaneGeometry(5, 5);
    let remaining = count;

    for (let i = 0; i < count; i++) {
      const color = colors[Math.floor(Math.random() * colors.length)];
      const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1.0 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 22;
      mesh.position.set(x, y, z + 2);
      scene.add(mesh);

      // Uniform star rays
      const angle = (i / count) * Math.PI * 2;
      const speed = 80 + Math.random() * 40;
      const duration = 0.5 + Math.random() * 0.3;

      gsap.to(mesh.position, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        duration,
        ease: 'power3.out',
      });

      gsap.to(mat, {
        opacity: 0,
        duration: duration * 0.6,
        delay: duration * 0.4,
        ease: 'power1.in',
        onComplete: () => {
          scene.remove(mesh);
          mat.dispose();
          remaining--;
          if (remaining === 0) geo.dispose();
        },
      });
    }
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

      const originals = visible.map((l) => ({
        x: l.position.x,
        y: l.position.y,
        z: l.position.z,
      }));

      const tl = gsap.timeline({ onComplete: resolve });

      // --- Phase 1: Cascade spread into arc ---
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

      // --- Phase 2: Swirl to opposite positions ---
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

      // --- Phase 3: Gather back into stack, reverse order ---
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

      // --- Phase 4: Stack settle bounce ---
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
