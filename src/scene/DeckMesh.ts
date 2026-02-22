import * as THREE from 'three';

export class DeckMesh {
  readonly group: THREE.Group;
  private layers: THREE.Mesh[] = [];
  private static readonly MAX_LAYERS = 10;
  private static readonly LAYER_OFFSET_Y = 2.0;
  private static readonly LAYER_OFFSET_Z = 1.5;

  constructor(backTexture: THREE.Texture, cardWidth: number, cardHeight: number) {
    this.group = new THREE.Group();

    const geo = new THREE.PlaneGeometry(cardWidth, cardHeight);

    for (let i = 0; i < DeckMesh.MAX_LAYERS; i++) {
      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({ map: backTexture, transparent: true })
      );
      mesh.position.y = i * DeckMesh.LAYER_OFFSET_Y;
      mesh.position.z = i * DeckMesh.LAYER_OFFSET_Z;
      mesh.renderOrder = 0;
      this.layers.push(mesh);
      this.group.add(mesh);
    }
  }

  updateCount(remaining: number): void {
    const visibleLayers = Math.max(
      1,
      Math.round((remaining / 36) * DeckMesh.MAX_LAYERS)
    );
    this.layers.forEach((layer, i) => {
      layer.visible = i < visibleLayers;
    });
  }

  setScale(factor: number): void {
    this.group.scale.set(factor, factor, 1);
  }

  dispose(): void {
    this.layers.forEach((mesh) => {
      mesh.geometry.dispose();
      (mesh.material as THREE.MeshBasicMaterial).dispose();
    });
  }
}
