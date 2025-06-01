import * as THREE from 'three';
import { Node } from './Node.js';
import { FluidSimulation } from './FluidSimulation.js';

const NUM_NODES = 20;
const REPULSION_STRENGTH = 50.0;
const CENTERING_STRENGTH = 0.1;
const DRAG_FACTOR = 0.98;
const TIME_STEP = 1 / 60;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 50);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const pointLight = new THREE.PointLight(0xffffff, 1);
pointLight.position.set(20, 20, 20);
scene.add(pointLight);

const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('threeCanvas'), alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio || 1);
renderer.setClearColor(0x000000, 0);

const fluidCanvas = document.getElementById('fluidCanvas');
const fluidSim = new FluidSimulation(fluidCanvas);

const nodes = [];
for (let i = 0; i < NUM_NODES; i++) {
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  const mass = THREE.MathUtils.randFloat(1, 5);
  const charge = THREE.MathUtils.randFloat(1, 5);
  const node = new Node(color, mass, charge);
  node.position.set(
    THREE.MathUtils.randFloatSpread(40),
    THREE.MathUtils.randFloatSpread(40),
    THREE.MathUtils.randFloatSpread(40)
  );
  node.velocity.set(
    THREE.MathUtils.randFloatSpread(10),
    THREE.MathUtils.randFloatSpread(10),
    THREE.MathUtils.randFloatSpread(10)
  );
  node.mesh.position.copy(node.position);
  scene.add(node.mesh);
  nodes.push(node);
}

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let draggedNode = null;
let dragPlane = null;
let prevDragPos = new THREE.Vector3();
let prevDragTime = 0;

function setMouseCoords(event) {
  const rect = fluidCanvas.getBoundingClientRect();
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  mouse.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
}

window.addEventListener('pointerdown', (event) => {
  setMouseCoords(event);
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(scene.children);
  const obj = intersects.find(i => i.object.userData.nodeRef);
  if (obj) {
    draggedNode = obj.object.userData.nodeRef;
    dragPlane = new THREE.Plane();
    const camDir = new THREE.Vector3();
    camera.getWorldDirection(camDir);
    dragPlane.setFromNormalAndCoplanarPoint(camDir, draggedNode.position);
    prevDragPos.copy(draggedNode.position);
    prevDragTime = performance.now();
  }
});

window.addEventListener('pointermove', (event) => {
  if (!draggedNode) return;
  setMouseCoords(event);
  raycaster.setFromCamera(mouse, camera);
  const point = new THREE.Vector3();
  raycaster.ray.intersectPlane(dragPlane, point);
  if (point) {
    draggedNode.position.copy(point);
    draggedNode.mesh.position.copy(point);
    const now = performance.now();
    const dt = (now - prevDragTime) / 1000;
    if (dt > 0) {
      const v = point.clone().sub(prevDragPos).divideScalar(dt);
      draggedNode.velocity.copy(v);
    }
    prevDragPos.copy(point);
    prevDragTime = now;
  }
});

window.addEventListener('pointerup', () => {
  draggedNode = null;
});

let lastTime = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = (now - lastTime) / 1000 || TIME_STEP;
  lastTime = now;

  const accelerations = nodes.map(() => new THREE.Vector3());
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    if (a === draggedNode) continue;
    for (let j = i + 1; j < nodes.length; j++) {
      const b = nodes[j];
      if (b === draggedNode) continue;
      const distVector = new THREE.Vector3().subVectors(b.position, a.position);
      const dist = distVector.length() + 1e-6;
      const forceMag = REPULSION_STRENGTH * a.charge * b.charge / (dist * dist);
      const dir = distVector.divideScalar(dist);
      const forceA = dir.clone().multiplyScalar(-forceMag);
      const forceB = dir.clone().multiplyScalar(forceMag);
      accelerations[i].add(forceA.divideScalar(a.mass));
      accelerations[j].add(forceB.divideScalar(b.mass));
    }
  }

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (n === draggedNode) continue;
    const centerForce = n.position.clone().multiplyScalar(-CENTERING_STRENGTH);
    accelerations[i].add(centerForce.divideScalar(n.mass));
    n.velocity.add(accelerations[i].multiplyScalar(dt));
    n.velocity.multiplyScalar(DRAG_FACTOR);
    n.position.add(n.velocity.clone().multiplyScalar(dt));
    n.mesh.position.copy(n.position);
  }

  fluidSim.updateTrails(nodes, camera);
  renderer.render(scene, camera);
}
animate();
