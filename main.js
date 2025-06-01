import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FluidSolver } from './src/FluidSolver.js';
import chemFrag from './src/shaders/chemDisplay.frag?raw';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 4000);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(0, 0, 5);
controls.update();

// group holding particle nodes
export const nodeGroup = new THREE.Group();
scene.add(nodeGroup);
const lineGroup = new THREE.Group();
scene.add(lineGroup);

function initNodes(){
  // create a few simple nodes with random colours
  const geo = new THREE.SphereGeometry(0.1, 16, 16);
  for(let i=0;i<20;i++){
    const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color().setHSL(Math.random(), 0.7, 0.5) });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(Math.random()*2-1, Math.random()*2-1, Math.random()*2-1);
    mesh.userData.trailColor = mat.color.clone();
    nodeGroup.add(mesh);
  }
}

initNodes();
const solver = new FluidSolver(renderer); // 512x512 by default

const chemMaterial = new THREE.ShaderMaterial({
  uniforms: { uMap: { value: solver.dye.read.texture }, resolution: { value: new THREE.Vector2(renderer.domElement.width, renderer.domElement.height) } },
  fragmentShader: chemFrag,
  depthWrite: false,
  transparent: true
});
const chemPlane = new THREE.Mesh(new THREE.PlaneGeometry(2,2), chemMaterial);
chemPlane.frustumCulled = false;
scene.add(chemPlane);

const prevPos = new Map();
function emitTrails(dt){
  nodeGroup.children.forEach(m=>{
    const now = m.position.clone();
    const last= prevPos.get(m.uuid) || now;
    const vel = now.clone().sub(last);
    prevPos.set(m.uuid, now);
    if(vel.lengthSq() < 1e-4) return;
    const ndc = now.clone().project(camera);
    solver.splat(
      (ndc.x*0.5+0.5)*solver.size,
      (ndc.y*0.5+0.5)*solver.size,
      vel.x*30, vel.y*30,
      m.userData.trailColor
    );
  });
}

function physicsStep(dt){
  // very simple spring to origin
  nodeGroup.children.forEach(m=>{
    m.position.multiplyScalar(0.99);
  });
}

function resize(){
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  chemMaterial.uniforms.resolution.value.set(renderer.domElement.width, renderer.domElement.height);
}
window.addEventListener('resize', resize);
resize();

renderer.setAnimationLoop(()=>{
  const dt = Math.min(0.016, renderer.info.render.frame*0 + 0.016); // placeholder dt
  physicsStep(dt);
  emitTrails(dt);
  solver.step(dt);
  controls.update();
  renderer.autoClear = false;
  renderer.clear();
  renderer.render(scene, camera);
});
