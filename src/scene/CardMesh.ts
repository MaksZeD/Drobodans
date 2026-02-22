import * as THREE from 'three';

export class CardMesh {
  readonly group: THREE.Group;
  private frontMesh: THREE.Mesh;
  private backMesh: THREE.Mesh;

  static readonly WIDTH = 128;
  static readonly HEIGHT = 192;

  constructor(frontTexture: THREE.Texture, backTexture: THREE.Texture) {
    this.group = new THREE.Group();

    const geo = new THREE.PlaneGeometry(CardMesh.WIDTH, CardMesh.HEIGHT);

    this.frontMesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ map: frontTexture, transparent: true })
    );
    this.frontMesh.position.z = 0.01;

    this.backMesh = new THREE.Mesh(
      geo,
      new THREE.MeshBasicMaterial({ map: backTexture, transparent: true })
    );
    this.backMesh.rotation.y = Math.PI;
    this.backMesh.position.z = -0.01;

    this.group.add(this.frontMesh, this.backMesh);
  }

  setScale(factor: number): void {
    this.group.scale.set(factor, factor, 1);
  }

  dispose(): void {
    this.frontMesh.geometry.dispose();
    (this.frontMesh.material as THREE.MeshBasicMaterial).dispose();
    this.backMesh.geometry.dispose();
    (this.backMesh.material as THREE.MeshBasicMaterial).dispose();
  }
}
