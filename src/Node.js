import * as THREE from 'three';

export class Node {
  constructor(color, mass, charge, radius = 0.5) {
    this.mass = mass;
    this.charge = charge;
    this.position = new THREE.Vector3();
    this.velocity = new THREE.Vector3();

    const geometry = new THREE.SphereGeometry(radius, 16, 16);
    const material = new THREE.MeshStandardMaterial({ color });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.userData.nodeRef = this;
  }
}
