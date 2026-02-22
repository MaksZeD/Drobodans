import * as THREE from 'three';

export class CardMesh {
  readonly group: THREE.Group;
  private mesh: THREE.Mesh;
  readonly material: THREE.MeshBasicMaterial;
  private frontTexture: THREE.Texture;
  private backTexture: THREE.Texture;

  static readonly WIDTH = 128;
  static readonly HEIGHT = 192;

  constructor(frontTexture: THREE.Texture, backTexture: THREE.Texture) {
    this.frontTexture = frontTexture;
    this.backTexture = backTexture;
    this.group = new THREE.Group();

    const geo = new THREE.PlaneGeometry(CardMesh.WIDTH, CardMesh.HEIGHT);

    // Single plane, starts showing back texture, invisible until animated
    this.material = new THREE.MeshBasicMaterial({
      map: backTexture,
      transparent: true,
      opacity: 0,
    });
    this.mesh = new THREE.Mesh(geo, this.material);
    this.mesh.renderOrder = 10;
    this.group.add(this.mesh);
  }

  showFront(): void {
    this.material.map = this.frontTexture;
    this.material.needsUpdate = true;
  }

  showBack(): void {
    this.material.map = this.backTexture;
    this.material.needsUpdate = true;
  }

  setScale(factor: number): void {
    this.group.scale.set(factor, factor, 1);
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}
