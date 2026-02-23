import * as THREE from 'three';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly camera: THREE.OrthographicCamera;
  readonly renderer: THREE.WebGLRenderer;
  private animationId = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.scene = new THREE.Scene();

    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera = new THREE.OrthographicCamera(
      -w / 2, w / 2, h / 2, -h / 2, 0.1, 1000
    );
    this.camera.position.z = 500;

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      logarithmicDepthBuffer: true,
    });
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(w, h);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    window.addEventListener('resize', this.onResize);

    // iOS dynamic text size / visual viewport changes
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.onResize);
    }
  }

  private onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.left = -w / 2;
    this.camera.right = w / 2;
    this.camera.top = h / 2;
    this.camera.bottom = -h / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  startLoop(update: () => void): void {
    const loop = (): void => {
      update();
      this.renderer.render(this.scene, this.camera);
      this.animationId = requestAnimationFrame(loop);
    };
    this.animationId = requestAnimationFrame(loop);
  }

  stopLoop(): void {
    cancelAnimationFrame(this.animationId);
  }

  get width(): number {
    return window.innerWidth;
  }

  get height(): number {
    return window.innerHeight;
  }
}
