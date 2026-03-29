import * as THREE from 'three';
import type { WorldSnapshot } from '@shared/types';

const MAX_VEHICLES = 2000;

export class VehicleInstancer {
  readonly mesh: THREE.InstancedMesh;
  private dummy = new THREE.Object3D();
  private idToIndex = new Map<string, number>();
  private nextIndex = 0;
  private colorCache = new Map<string, THREE.Color>();
  private defaultColor = new THREE.Color('#22c55e');

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.BoxGeometry(1, 1, 0.15);
    const material = new THREE.MeshBasicMaterial();
    this.mesh = new THREE.InstancedMesh(geometry, material, MAX_VEHICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.count = 0;

    // Must initialise instanceColor by calling setColorAt at least once
    this.mesh.setColorAt(0, this.defaultColor);
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.setUsage(THREE.DynamicDrawUsage);
    }

    // Hide all instances initially (scale to 0)
    const zero = new THREE.Matrix4().makeScale(0, 0, 0);
    for (let i = 0; i < MAX_VEHICLES; i++) {
      this.mesh.setMatrixAt(i, zero);
    }
    this.mesh.instanceMatrix.needsUpdate = true;

    // Disable frustum culling — instances are spread across the world but the
    // mesh's own bounding sphere sits at the origin, so the default culling
    // hides all vehicles when the camera is centred on the map.
    this.mesh.frustumCulled = false;

    scene.add(this.mesh);
  }

  updateFromSnapshot(snapshot: WorldSnapshot): void {
    const { vehicles } = snapshot;

    for (const v of vehicles) {
      let idx = this.idToIndex.get(v.id);
      if (idx === undefined) {
        if (this.nextIndex >= MAX_VEHICLES) continue;
        idx = this.nextIndex++;
        this.idToIndex.set(v.id, idx);
      }

      this.dummy.position.set(v.x, v.y, 0);
      this.dummy.rotation.set(0, 0, v.heading);
      this.dummy.scale.set(v.length, v.width, 1.5);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(idx, this.dummy.matrix);

      // Color — cache THREE.Color objects to avoid per-tick allocation
      const colorHex = v.color ?? '#22c55e';
      let color = this.colorCache.get(colorHex);
      if (!color) {
        color = new THREE.Color(colorHex);
        this.colorCache.set(colorHex, color);
      }
      this.mesh.setColorAt(idx, color);
    }

    this.mesh.count = this.nextIndex;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) {
      this.mesh.instanceColor.needsUpdate = true;
    }
  }

  reset(): void {
    this.idToIndex.clear();
    this.nextIndex = 0;
    this.mesh.count = 0;
  }

  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}
